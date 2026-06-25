import os
import re
import copy
import logging
import openpyxl
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated

from api.models import SaaSCliente, Cliente, Produto, Deposito, Estoque, TributacaoProduto, ConfiguracaoProduto, GrupoProduto
from api.db_router import set_current_tenant_db, get_current_tenant_db

def sincronizar_saldo_deposito(banco_tenant, produto_id, deposito_id, quantidade):
    """
    Sincroniza a tabela saldo_deposito com a quantidade do estoque do produto.
    """
    try:
        from django.db import connections
        with connections[banco_tenant].cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO saldo_deposito (id_deposito, id_produto, quantidade)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE quantidade = VALUES(quantidade)
                """,
                [deposito_id, produto_id, quantidade]
            )
    except Exception as e:
        logger.warning(f"Erro ao sincronizar saldo_deposito: {e}")

def obter_ou_gerar_codigo_produto(banco_tenant):
    """
    Gera o próximo código do produto usando as configurações do tenant.
    Caso não exista, retorna um sequencial baseado no total de produtos.
    """
    try:
        config = ConfiguracaoProduto.objects.using(banco_tenant).filter(id_config=1).first()
        if not config:
            config = ConfiguracaoProduto.objects.using(banco_tenant).first()
        
        if config:
            novo_codigo = config.gerar_proximo_codigo()
            config.incrementar_codigo()
            return novo_codigo
    except Exception as e:
        logger.warning(f"Erro ao obter configuração de código do produto: {e}")
        
    # Fallback sequencial
    try:
        count = Produto.objects.using(banco_tenant).count()
        return f"IMP{count + 1:06d}"
    except Exception:
        import uuid
        return str(uuid.uuid4().hex[:10]).upper()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def importar_dados_para_tenant(request, tenant_id):
    """
    Motor centralizado de importação que recebe uma planilha Excel
    e injeta dados diretamente no banco de dados do tenant.
    """
    tipo_importacao = request.data.get('tipo')  # 'CLIENTES' ou 'PRODUTOS'
    arquivo_upload = request.FILES.get('arquivo')
    
    # 1. Localiza o cliente na Central Mãe
    tenant = SaaSCliente.objects.filter(id_saas_cliente=tenant_id).first()
    if not tenant:
        return JsonResponse({'sucesso': False, 'mensagem': 'Cliente SaaS não localizado.'}, status=404)
        
    if not arquivo_upload:
        return JsonResponse({'sucesso': False, 'mensagem': 'Nenhum arquivo enviado.'}, status=400)
        
    if tipo_importacao not in ['CLIENTES', 'PRODUTOS']:
        return JsonResponse({'sucesso': False, 'mensagem': 'Tipo de importação inválido.'}, status=400)
        
    banco_tenant = f"aperus_{tenant.schema_name}"
    
    # 2. Configura a conexão no settings.DATABASES dinamicamente
    if banco_tenant not in settings.DATABASES:
        default_db = settings.DATABASES['default']
        settings.DATABASES[banco_tenant] = copy.deepcopy(default_db)
        settings.DATABASES[banco_tenant]['NAME'] = banco_tenant
        
    # Salva o alias atual da thread
    db_origem = get_current_tenant_db()
    
    linhas_criadas = 0
    erros = []
    
    try:
        wb = openpyxl.load_workbook(arquivo_upload, data_only=True)
        sheet = wb.active
        
        # Seta o banco do tenant para a thread atual para alinhar o db_router
        set_current_tenant_db(banco_tenant)
        
        # Mapeamento flexível de cabeçalhos (suporta template padrão e cabeçalhos customizados do cliente)
        MAPEA_COLUNAS_CLIENTES = {
            'nome_razao': ['nome/razão social', 'nome', 'razão social', 'nom_pessoa', 'razao_social', 'nome_razao_social'],
            'cpf_cnpj': ['cnpj/cpf', 'cpf/cnpj', 'cnpj', 'cpf', 'num_cpf_cnpj', 'cpf_cnpj'],
            'nome_fantasia': ['nome fantasia', 'fantasia', 'nom_reduzido', 'nome_fantasia'],
            'ie': ['insc. estadual', 'inscrição estadual', 'num_ie', 'ie', 'inscricao_estadual'],
            'telefone': ['telefone / contato', 'telefone', 'contato', 'tel', 'num_telefone'],
            'whatsapp': ['whatsapp', 'whats', 'celular'],
            'email': ['email', 'e-mail', 'des_email_contato', 'email_contato'],
            'data_nascimento': ['data nasc.', 'data nascimento', 'dth_nascimento', 'data_nascimento'],
            'cep': ['cep', 'num_cep'],
            'endereco': ['endereço', 'logradouro', 'des_logradouro', 'endereco'],
            'numero': ['número', 'numero', 'ict_numero'],
            'complemento': ['complemento', 'comp', 'complemento_endereco'],
            'bairro': ['bairro', 'nom_bairro'],
            'cidade': ['cidade', 'nom_cidade'],
            'estado': ['estado', 'uf', 'sgl_uf'],
            'observacao': ['observação', 'observacao', 'obs']
        }
        
        MAPEA_COLUNAS_PRODUTOS = {
            'descricao': ['descrição/nome', 'descrição', 'nome', 'nome do produto', 'nome_produto', 'descricao', 'des_produto'],
            'preco_venda': ['preço de venda', 'preço', 'valor', 'vlr_venda', 'preco_venda', 'preco', 'valor_venda'],
            'gtin': ['código de barras/gtin', 'código de barras', 'gtin', 'ean', 'cod_barras', 'codigo_barras'],
            'ncm': ['ncm', 'cod_ncm'],
            'referencia': ['referência', 'referencia', 'ref', 'código referência', 'codigo referencia'],
            'unidade': ['unidade', 'un', 'und', 'unidade_medida', 'unidade de medida'],
            'marca': ['marca', 'fabricante'],
            'categoria': ['categoria', 'família', 'familia'],
            'grupo': ['grupo'],
            'classificacao': ['classificação', 'classificacao', 'seção', 'secao'],
            'preco_custo': ['preço de custo', 'preço custo', 'custo', 'vlr_custo', 'preco_custo', 'valor_custo', 'custo_medio'],
            'estoque_loja': ['estoque loja', 'loja', 'estoque_loja', 'qtd_loja', 'quantidade loja'],
            'estoque_deposito': ['estoque depósito', 'estoque deposito', 'depósito', 'deposito', 'estoque_deposito', 'qtd_deposito', 'quantidade deposito'],
            'estoque_geral': ['estoque geral', 'estoque', 'quantidade', 'saldo', 'qtd', 'quantidade_estoque'],
            'localizacao': ['localização', 'localizacao', 'posição', 'posicao', 'prateleira']
        }
        
        # Lê a primeira linha (cabeçalhos) para mapear os índices (preserva caso original para a interface do usuário)
        original_headers = [str(cell.value).strip() if cell.value is not None else "" for cell in sheet[1]]
        headers_lower = [h.lower() for h in original_headers]
        
        # Gera sugestões de mapeamento baseadas em sinônimos
        sugestoes = {}
        mapeamento_sinonimos = MAPEA_COLUNAS_CLIENTES if tipo_importacao == 'CLIENTES' else MAPEA_COLUNAS_PRODUTOS
        for campo, sinonimos in mapeamento_sinonimos.items():
            sugestoes[campo] = ""
            for sinonimo in sinonimos:
                if sinonimo in headers_lower:
                    idx = headers_lower.index(sinonimo)
                    sugestoes[campo] = original_headers[idx]
                    break
                    
        # Se for apenas preview, retorna cabeçalhos e sugestões de correspondência
        if request.GET.get('action') == 'preview':
            # Restaura a conexão padrão antes de retornar
            set_current_tenant_db(db_origem)
            return JsonResponse({
                'sucesso': True,
                'headers': original_headers,
                'sugestoes': sugestoes
            })
            
        # Carrega mapeamento personalizado do frontend se disponível
        import json
        mapeamento_raw = request.data.get('mapeamento')
        mapeamento_custom = {}
        if mapeamento_raw:
            try:
                mapeamento_custom = json.loads(mapeamento_raw)
            except Exception:
                pass
                
        indices = {}
        for campo in mapeamento_sinonimos.keys():
            coluna_mapeada = mapeamento_custom.get(campo)
            if coluna_mapeada and coluna_mapeada in original_headers:
                indices[campo] = original_headers.index(coluna_mapeada)
            else:
                # Fallback para mapeamento de sinônimos automático
                sinonimos = mapeamento_sinonimos[campo]
                idx = None
                for sinonimo in sinonimos:
                    if sinonimo in headers_lower:
                        idx = headers_lower.index(sinonimo)
                        break
                indices[campo] = idx
                
        # Fallback de whatsapp específico para Clientes se automático
        if tipo_importacao == 'CLIENTES' and not mapeamento_custom:
            if indices['whatsapp'] is None and indices['telefone'] is not None:
                first_tel_idx = indices['telefone']
                for idx, h in enumerate(headers_lower):
                    if idx > first_tel_idx and h in MAPEA_COLUNAS_CLIENTES['telefone']:
                        indices['whatsapp'] = idx
                        break
        
        for index, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            # Verifica se a linha está vazia
            if not row or not any(row):
                continue
                
            try:
                if tipo_importacao == 'CLIENTES':
                    # Helper para obter o valor pelo índice mapeado
                    def get_val(campo, default=""):
                        idx = indices.get(campo)
                        if idx is not None and idx < len(row) and row[idx] is not None:
                            return str(row[idx]).strip()
                        return default
                    
                    nome_razao = get_val('nome_razao')
                    cpf_cnpj_raw = get_val('cpf_cnpj')
                    nome_fantasia = get_val('nome_fantasia')
                    ie = get_val('ie')
                    tel = get_val('telefone')
                    whatsapp_val = get_val('whatsapp')
                    mail = get_val('email')
                    
                    data_nasc_raw = None
                    nasc_idx = indices.get('data_nascimento')
                    if nasc_idx is not None and nasc_idx < len(row):
                        data_nasc_raw = row[nasc_idx]
                        
                    cep_val = get_val('cep')
                    end_val = get_val('endereco')
                    num_val = get_val('numero')
                    comp_val = get_val('complemento')
                    bairro_val = get_val('bairro')
                    cidade_val = get_val('cidade')
                    uf_val = get_val('estado')
                    obs_val = get_val('observacao')
                    
                    if not nome_razao and not cpf_cnpj_raw:
                        continue
                        
                    if not cpf_cnpj_raw:
                        erros.append(f"Linha {index}: Razão Social preenchida, mas CPF/CNPJ vazio.")
                        continue
                        
                    # Trata complemento
                    if comp_val:
                        end_val = f"{end_val} - {comp_val}".strip(" -")
                        
                    # Como observações gerais não existem no modelo original do cliente, 
                    # salvamos no campo motivo_inativacao (campo de texto livre)
                    motivo_obs = f"Obs: {obs_val}" if obs_val else ""
                    
                    # Parse de data de nascimento
                    data_nasc = None
                    if data_nasc_raw:
                        from datetime import datetime, date
                        if isinstance(data_nasc_raw, (datetime, date)):
                            data_nasc = data_nasc_raw
                        else:
                            try:
                                val_str = str(data_nasc_raw).strip()
                                if '/' in val_str:
                                    data_nasc = datetime.strptime(val_str, '%d/%m/%Y').date()
                                else:
                                    data_nasc = datetime.strptime(val_str, '%Y-%m-%d').date()
                            except Exception:
                                pass
                                
                    # Cria ou atualiza
                    with transaction.atomic(using=banco_tenant):
                        Cliente.objects.using(banco_tenant).update_or_create(
                            cpf_cnpj=cpf_cnpj_raw,
                            defaults={
                                'nome_razao_social': nome_razao,
                                'nome_fantasia': nome_fantasia if nome_fantasia else nome_razao,
                                'inscricao_estadual': ie if ie else None,
                                'telefone': tel if tel else None,
                                'whatsapp': whatsapp_val if whatsapp_val else None,
                                'email': mail if mail else None,
                                'data_nascimento': data_nasc,
                                'cep': cep_val if cep_val else None,
                                'endereco': end_val if end_val else None,
                                'numero': num_val if num_val else None,
                                'bairro': bairro_val if bairro_val else None,
                                'cidade': cidade_val if cidade_val else None,
                                'estado': uf_val if uf_val else None,
                                'motivo_inativacao': motivo_obs if motivo_obs else None,
                                'ativo': True
                            }
                        )
                    linhas_criadas += 1
                    
                elif tipo_importacao == 'PRODUTOS':
                    # Helper para obter o valor pelo índice mapeado
                    def get_val_prod(campo, default=""):
                        idx = indices.get(campo)
                        if idx is not None and idx < len(row) and row[idx] is not None:
                            return str(row[idx]).strip()
                        return default

                    def parse_decimal(val, default=None):
                        if val is None or str(val).strip() == "":
                            return default
                        if isinstance(val, (int, float)):
                            return Decimal(str(val))
                        val_str = str(val).strip().replace('R$', '').replace('$', '').strip()
                        if ',' in val_str and '.' in val_str:
                            if val_str.rfind(',') > val_str.rfind('.'):
                                val_str = val_str.replace('.', '').replace(',', '.')
                            else:
                                val_str = val_str.replace(',', '')
                        elif ',' in val_str:
                            val_str = val_str.replace(',', '.')
                        try:
                            return Decimal(val_str)
                        except Exception:
                            return default

                    def limpar_gtin(val):
                        if val is None or str(val).strip() == "":
                            return None
                        val_str = str(val).strip()
                        if val_str.endswith('.0'):
                            val_str = val_str[:-2]
                        if 'e+' in val_str.lower() or 'e-' in val_str.lower():
                            try:
                                val_str = str(int(float(val_str)))
                            except ValueError:
                                pass
                        return val_str[:14]

                    def limpar_ncm(val):
                        if val is None or str(val).strip() == "":
                            return None
                        val_str = str(val).strip()
                        if val_str.endswith('.0'):
                            val_str = val_str[:-2]
                        return val_str[:8]

                    def limpar_referencia(val):
                        if val is None or str(val).strip() == "":
                            return None
                        val_str = str(val).strip()
                        if val_str.endswith('.0'):
                            val_str = val_str[:-2]
                        return val_str[:50]

                    desc = get_val_prod('descricao')
                    gtin_raw = get_val_prod('gtin', None)
                    gtin_cleaned = limpar_gtin(gtin_raw)
                    ncm_cleaned = limpar_ncm(get_val_prod('ncm', None))
                    ref_cleaned = limpar_referencia(get_val_prod('referencia', None))
                    und_raw = get_val_prod('unidade')
                    marca_raw = get_val_prod('marca')
                    cat_raw = get_val_prod('categoria')
                    grupo_raw = get_val_prod('grupo')
                    classificacao_raw = get_val_prod('classificacao')
                    loc_raw = get_val_prod('localizacao')

                    preco_venda_raw = row[indices['preco_venda']] if indices.get('preco_venda') is not None and indices['preco_venda'] < len(row) else None
                    preco_custo_raw = row[indices['preco_custo']] if indices.get('preco_custo') is not None and indices['preco_custo'] < len(row) else None
                    estoque_loja_raw = row[indices['estoque_loja']] if indices.get('estoque_loja') is not None and indices['estoque_loja'] < len(row) else None
                    estoque_deposito_raw = row[indices['estoque_deposito']] if indices.get('estoque_deposito') is not None and indices['estoque_deposito'] < len(row) else None
                    estoque_geral_raw = row[indices['estoque_geral']] if indices.get('estoque_geral') is not None and indices['estoque_geral'] < len(row) else None

                    val_preco_venda = parse_decimal(preco_venda_raw)
                    val_preco_custo = parse_decimal(preco_custo_raw)
                    val_estoque_loja = parse_decimal(estoque_loja_raw)
                    val_estoque_deposito = parse_decimal(estoque_deposito_raw)
                    val_estoque_geral = parse_decimal(estoque_geral_raw)

                    if val_estoque_loja is None and val_estoque_geral is not None:
                        val_estoque_loja = val_estoque_geral

                    if not desc and not gtin_cleaned:
                        continue
                        
                    if not desc:
                        erros.append(f"Linha {index}: Descrição do produto está vazia.")
                        continue
                        
                    with transaction.atomic(using=banco_tenant):
                        # Obter ou criar grupo de produto (evitando duplicar)
                        grupo_obj = None
                        if grupo_raw:
                            grupo_nome = grupo_raw.strip()
                            if grupo_nome:
                                grupo_obj, _ = GrupoProduto.objects.using(banco_tenant).get_or_create(
                                    nome_grupo=grupo_nome,
                                    defaults={"descricao": f"Grupo {grupo_nome} criado via importador"}
                                )

                        # Tenta encontrar o produto existente por GTIN, Referência ou Descrição
                        produto = None
                        if gtin_cleaned:
                            produto = Produto.objects.using(banco_tenant).filter(gtin=gtin_cleaned).first()
                        if not produto and ref_cleaned:
                            produto = Produto.objects.using(banco_tenant).filter(referencia=ref_cleaned).first()
                        if not produto and desc:
                            produto = Produto.objects.using(banco_tenant).filter(nome_produto__iexact=desc).first()
                            
                        if produto:
                            produto.nome_produto = desc
                            if gtin_cleaned:
                                produto.gtin = gtin_cleaned
                            if ncm_cleaned:
                                produto.ncm = ncm_cleaned
                            if ref_cleaned:
                                produto.referencia = ref_cleaned
                            if und_raw:
                                produto.unidade_medida = und_raw
                            if marca_raw:
                                produto.marca = marca_raw
                            if cat_raw:
                                produto.categoria = cat_raw
                            if grupo_obj:
                                produto.id_grupo = grupo_obj
                            if classificacao_raw:
                                produto.classificacao = classificacao_raw
                            if loc_raw:
                                produto.localizacao = loc_raw
                            produto.save(using=banco_tenant)
                        else:
                            codigo_prod = gtin_cleaned if gtin_cleaned else (ref_cleaned if ref_cleaned else obter_ou_gerar_codigo_produto(banco_tenant))
                            
                            # Evita colisão de código
                            base_cod = codigo_prod
                            suf = 1
                            while Produto.objects.using(banco_tenant).filter(codigo_produto=codigo_prod).exists():
                                codigo_prod = f"{base_cod}-{suf}"
                                suf += 1
                                
                            produto = Produto.objects.using(banco_tenant).create(
                                codigo_produto=codigo_prod,
                                nome_produto=desc,
                                descricao=desc,
                                gtin=gtin_cleaned,
                                ncm=ncm_cleaned,
                                referencia=ref_cleaned if ref_cleaned else None,
                                unidade_medida=und_raw if und_raw else None,
                                marca=marca_raw if marca_raw else None,
                                categoria=cat_raw if cat_raw else None,
                                id_grupo=grupo_obj,
                                classificacao=classificacao_raw if classificacao_raw else None,
                                localizacao=loc_raw if loc_raw else None
                            )
                            
                        # Atualiza/Cria tributação padrão do produto
                        try:
                            config = ConfiguracaoProduto.objects.using(banco_tenant).filter(id_config=1).first() or ConfiguracaoProduto.objects.using(banco_tenant).first()
                            TributacaoProduto.objects.using(banco_tenant).update_or_create(
                                produto=produto,
                                defaults={
                                    'cfop': config.trib_cfop if config and config.trib_cfop else '5102',
                                    'cst_icms': config.trib_cst_icms if config and config.trib_cst_icms else '',
                                    'csosn': config.trib_csosn if config and config.trib_csosn else '400',
                                    'icms_aliquota': config.trib_icms_aliquota if config and config.trib_icms_aliquota is not None else 0,
                                    'cst_ipi': config.trib_cst_ipi if config and config.trib_cst_ipi else '99',
                                    'ipi_aliquota': config.trib_ipi_aliquota if config and config.trib_ipi_aliquota is not None else 0,
                                    'cst_pis_cofins': config.trib_cst_pis_cofins if config and config.trib_cst_pis_cofins else '07',
                                    'pis_aliquota': config.trib_pis_aliquota if config and config.trib_pis_aliquota is not None else 0,
                                    'cofins_aliquota': config.trib_cofins_aliquota if config and config.trib_cofins_aliquota is not None else 0,
                                    'classificacao_fiscal': config.trib_classificacao_fiscal if config and config.trib_classificacao_fiscal else '',
                                    'ibs_aliquota': 0,
                                    'cbs_aliquota': 0,
                                    'cst_ibs_cbs': '01',
                                }
                            )
                        except Exception as e:
                            logger.warning(f"Erro ao setar tributação no importador: {e}")
                            
                        # Garante e obtém os depósitos padrão "Loja" e "Depósito" no banco do tenant
                        dep_loja, _ = Deposito.objects.using(banco_tenant).get_or_create(
                            nome_deposito="Loja",
                            defaults={"descricao": "Estoque da Loja"}
                        )
                        dep_deposito, _ = Deposito.objects.using(banco_tenant).get_or_create(
                            nome_deposito="Depósito",
                            defaults={"descricao": "Estoque do Depósito"}
                        )

                        # Atualiza estoque para "Loja"
                        estoque_loja_obj = Estoque.objects.using(banco_tenant).filter(id_produto=produto, id_deposito=dep_loja).first()
                        if estoque_loja_obj:
                            if val_preco_venda is not None:
                                  estoque_loja_obj.valor_venda = val_preco_venda
                            if val_preco_custo is not None:
                                  estoque_loja_obj.custo_medio = val_preco_custo
                            if val_estoque_loja is not None:
                                  estoque_loja_obj.quantidade = val_estoque_loja
                            estoque_loja_obj.save(using=banco_tenant)
                        else:
                            estoque_loja_obj = Estoque.objects.using(banco_tenant).create(
                                id_produto=produto,
                                id_deposito=dep_loja,
                                valor_venda=val_preco_venda if val_preco_venda is not None else Decimal('0.00'),
                                custo_medio=val_preco_custo if val_preco_custo is not None else Decimal('0.0000'),
                                quantidade=val_estoque_loja if val_estoque_loja is not None else Decimal('0.000'),
                                quantidade_minima=Decimal('0.000'),
                                ativo=True
                            )
                        sincronizar_saldo_deposito(banco_tenant, produto.id_produto, dep_loja.id_deposito, estoque_loja_obj.quantidade)

                        # Atualiza estoque para "Depósito"
                        estoque_deposito_obj = Estoque.objects.using(banco_tenant).filter(id_produto=produto, id_deposito=dep_deposito).first()
                        if estoque_deposito_obj:
                            if val_preco_venda is not None:
                                  estoque_deposito_obj.valor_venda = val_preco_venda
                            if val_preco_custo is not None:
                                  estoque_deposito_obj.custo_medio = val_preco_custo
                            if val_estoque_deposito is not None:
                                  estoque_deposito_obj.quantidade = val_estoque_deposito
                            estoque_deposito_obj.save(using=banco_tenant)
                        else:
                            estoque_deposito_obj = Estoque.objects.using(banco_tenant).create(
                                id_produto=produto,
                                id_deposito=dep_deposito,
                                valor_venda=val_preco_venda if val_preco_venda is not None else Decimal('0.00'),
                                custo_medio=val_preco_custo if val_preco_custo is not None else Decimal('0.0000'),
                                quantidade=val_estoque_deposito if val_estoque_deposito is not None else Decimal('0.000'),
                                quantidade_minima=Decimal('0.000'),
                                ativo=True
                            )
                        sincronizar_saldo_deposito(banco_tenant, produto.id_produto, dep_deposito.id_deposito, estoque_deposito_obj.quantidade)

                        # Atualiza preços no estoque para outros depósitos existentes
                        depositos = Deposito.objects.using(banco_tenant).all()
                        for dep in depositos:
                            if dep.id_deposito in [dep_loja.id_deposito, dep_deposito.id_deposito]:
                                  continue
                            estoque_obj = Estoque.objects.using(banco_tenant).filter(id_produto=produto, id_deposito=dep).first()
                            if estoque_obj:
                                  if val_preco_venda is not None:
                                      estoque_obj.valor_venda = val_preco_venda
                                  if val_preco_custo is not None:
                                      estoque_obj.custo_medio = val_preco_custo
                                  estoque_obj.save(using=banco_tenant)
                            else:
                                  estoque_obj = Estoque.objects.using(banco_tenant).create(
                                      id_produto=produto,
                                      id_deposito=dep,
                                      valor_venda=val_preco_venda if val_preco_venda is not None else Decimal('0.00'),
                                      custo_medio=val_preco_custo if val_preco_custo is not None else Decimal('0.0000'),
                                      quantidade=Decimal('0.000'),
                                      quantidade_minima=Decimal('0.000'),
                                      ativo=True
                                  )
                            sincronizar_saldo_deposito(banco_tenant, produto.id_produto, dep.id_deposito, estoque_obj.quantidade)
                    linhas_criadas += 1
                    
            except Exception as e:
                erros.append(f"Linha {index}: {str(e)}")
                
        return JsonResponse({
            'sucesso': True, 
            'mensagem': f'Importação concluída no banco [{banco_tenant}]. {linhas_criadas} registros processados com sucesso.',
            'erros': erros
        })
        
    except Exception as e:
        return JsonResponse({'sucesso': False, 'mensagem': f'Erro crítico no processamento da planilha: {str(e)}'}, status=500)
    finally:
        # Restaura a conexão padrão
        set_current_tenant_db(db_origem)
