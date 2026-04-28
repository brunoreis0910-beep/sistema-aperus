from rest_framework import serializers
from . import models  # Import correto dos models da API
from .models import Produto, Catalogo, CatalogoItem, StatusOrdemServico, LoteProduto, Cliente, GrupoProduto, ConfiguracaoProduto, TributacaoProduto, MapaCargaItem, MapaCarga, ConfiguracaoBancaria, Boleto, SugestaoCFOP, NotaFiscalReferenciada
from .text_utils import sanitize_field


class ProdutoComQuantidadeField(serializers.Field):
    """Campo customizado que aceita IDs ou dicts com {id_produto, quantidade_minima}"""
    
    def to_representation(self, value):
        """Serializa para output"""
        if isinstance(value, dict):
            return value
        return value
    
    def to_internal_value(self, data):
        """Desserializa input - aceita int ou dict"""
        if isinstance(data, int):
            return {'id_produto': data, 'quantidade_minima': 1}
        elif isinstance(data, dict):
            return {
                'id_produto': data.get('id_produto'),
                'quantidade_minima': data.get('quantidade_minima', 1)
            }
        else:
            self.fail('invalid', input=data)


# ===========================
# SERIALIZERS DE CATALOGO (WhatsApp)
# ===========================

class CatalogoItemNestedSerializer(serializers.ModelSerializer):
    """Serializer para itens dentro de um catalogo (nested create)"""
    id_produto = serializers.IntegerField(write_only=True, required=True)
    nome_produto = serializers.CharField(read_only=True, source='produto.nome_produto')
    imagem_url = serializers.CharField(read_only=True, source='produto.imagem_url')
    valor_catalogo = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
        help_text='Preco especifico para este item no catalogo'
    )

    class Meta:
        model = CatalogoItem
        fields = [
            'id',
            'id_produto',
            'nome_produto',
            'imagem_url',
            'valor_catalogo',
            'ativo',
            'ordem',
            'destaque'
        ]
        read_only_fields = ['id', 'nome_produto', 'imagem_url']
        extra_kwargs = {
            'ativo': {'required': False, 'default': True},
            'destaque': {'required': False, 'default': False},
            'ordem': {'required': False, 'default': 0},
            'valor_catalogo': {'required': False, 'allow_null': True}
        }

    def validate_id_produto(self, value):
        """Valida se o produto existe"""
        if not Produto.objects.filter(id_produto=value).exists():
            raise serializers.ValidationError(f"Produto com ID {value} n�o existe")
        return value


class CatalogoSerializer(serializers.ModelSerializer):
    """Serializer principal para criar cat�logos completos com itens"""
    itens = CatalogoItemNestedSerializer(many=True, required=False)

    class Meta:
        model = Catalogo
        fields = [
            'id',
            'nome_catalogo',
            'descricao',
            'ativo',
            'itens',
            'data_cadastro',
            'data_atualizacao'
        ]
        read_only_fields = ['id', 'data_cadastro', 'data_atualizacao']
        extra_kwargs = {
            'descricao': {'required': False, 'allow_blank': True, 'allow_null': True},
            'ativo': {'required': False, 'default': True}
        }

    def create(self, validated_data):
        """Cria cat�logo com itens aninhados"""
        from django.db import transaction
        
        itens_data = validated_data.pop('itens', [])
        
        with transaction.atomic():
            # Criar o cat�logo
            catalogo = Catalogo.objects.create(**validated_data)
            
            # Criar os itens do cat�logo
            for ordem, item_data in enumerate(itens_data):
                id_produto = item_data.pop('id_produto')
                produto = Produto.objects.get(id_produto=id_produto)

                CatalogoItem.objects.create(
                    catalogo=catalogo,
                    produto=produto,
                    ordem=item_data.get('ordem', ordem),
                    ativo=item_data.get('ativo', True),
                    destaque=item_data.get('destaque', False),
                    valor_catalogo=item_data.get('valor_catalogo', 0)
                )

            return catalogo

    def update(self, instance, validated_data):
        """Atualiza cat�logo e seus itens"""
        from django.db import transaction
        
        itens_data = validated_data.pop('itens', None)
        
        with transaction.atomic():
            # Atualizar campos do cat�logo
            instance.nome_catalogo = validated_data.get('nome_catalogo', instance.nome_catalogo)
            instance.descricao = validated_data.get('descricao', instance.descricao)
            instance.ativo = validated_data.get('ativo', instance.ativo)
            instance.save()
            
            # Se itens foram fornecidos, substituir todos
            if itens_data is not None:
                # Remover itens existentes
                instance.itens.all().delete()
                
                # Criar novos itens
                for ordem, item_data in enumerate(itens_data):
                    id_produto = item_data.pop('id_produto')
                    produto = Produto.objects.get(id_produto=id_produto)

                    CatalogoItem.objects.create(
                        catalogo=instance,
                        produto=produto,
                        ordem=item_data.get('ordem', ordem),
                        ativo=item_data.get('ativo', True),
                        destaque=item_data.get('destaque', False),
                        valor_catalogo=item_data.get('valor_catalogo', 0)
                    )

            return instance

    def to_representation(self, instance):
        """Customiza a representa��o do cat�logo"""
        ret = super().to_representation(instance)
        
        # Adicionar itens com detalhes completos
        itens = instance.itens.select_related('produto').order_by('ordem')
        ret['itens'] = [
            {
                'id': item.id,
                'id_produto': item.produto.id_produto,
                'nome_produto': item.produto.nome_produto,
                'imagem_url': item.produto.imagem_url,
                'valor_catalogo': float(item.valor_catalogo) if item.valor_catalogo else 0,
                'ativo': item.ativo,
                'ordem': item.ordem,
                'destaque': item.destaque
            }
            for item in itens
        ]
        
        return ret


class ProdutoBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produto
        fields = '__all__'


class CatalogoItemSerializer(serializers.ModelSerializer):
    produto = ProdutoBaseSerializer(read_only=True)
    produto_id = serializers.PrimaryKeyRelatedField(
        queryset=Produto.objects.all(),
        source='produto',
        write_only=True,
        required=True,
        allow_null=False,
        error_messages={
            'required': 'O campo produto_id � obrigat�rio',
            'does_not_exist': 'Produto com ID {pk_value} n�o existe',
            'incorrect_type': 'Tipo incorreto. Esperado um n�mero (ID do produto)'
        }
    )

    class Meta:
        model = CatalogoItem
        fields = [
            'id',
            'produto',
            'produto_id',
            'ativo',
            'ordem',
            'destaque',
            'data_cadastro',
            'data_atualizacao'
        ]
        read_only_fields = ['id', 'data_cadastro', 'data_atualizacao']
        extra_kwargs = {
            'ativo': {'required': False, 'default': True},
            'destaque': {'required': False, 'default': False},
            'ordem': {'required': False, 'default': 0}
        }
    
    def validate_ordem(self, value):
        """Valida��o para ordem"""
        if value is None:
            return 0
        if value < 0:
            raise serializers.ValidationError("Ordem n�o pode ser negativa")
        return value
    
    def validate(self, data):
        """Valida��o geral dos dados"""
        # Garante valores padr�o
        if 'ativo' not in data:
            data['ativo'] = True
        if 'destaque' not in data:
            data['destaque'] = False
        if 'ordem' not in data:
            data['ordem'] = 0
        return data
# Em: C:\Projetos\SistemaGerencial\api\serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction, models
from django.utils import timezone# 1. ATUALIZAR A LINHA DE IMPORTA��O (adicionamos FormaPagamento e modelos de Estoque):
from .models import (
    Cliente, GrupoProduto, Produto,
    Operacao, Departamento, CentroCusto, ContaBancaria,
    FinanceiroConta, FinanceiroBancario, EmpresaConfig,
    Funcao, Vendedor, UserParametros,
    UserPermissoes, SolicitacaoAprovacao,
    FormaPagamento, # FormaPagamento
    Deposito, Estoque, EstoqueMovimentacao # <-- NOVOS (Gest�o de Estoque)
)

# --- Serializers Antigos (Sem altera��o) ---
class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'
        read_only_fields = ['id_cliente', 'data_cadastro']

class GrupoProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrupoProduto
        fields = '__all__'
        read_only_fields = ['id_grupo']

class LoteProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoteProduto
        fields = '__all__'
        read_only_fields = ['id_lote', 'data_criacao', 'data_modificacao']

class TributacaoProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TributacaoProduto
        fields = [
            'cfop',
            # Regime Normal
            'cst_icms', 'icms_aliquota', 'marketing_icms',
            'cst_ipi', 'ipi_aliquota',
            'cst_pis_cofins', 'pis_aliquota', 'cofins_aliquota',
            # Simples Nacional
            'csosn',
            'cst_ipi_sn', 'ipi_aliquota_sn',
            'cst_pis_sn', 'pis_aliquota_sn',
            'cst_cofins_sn', 'cofins_aliquota_sn',
            # Reforma Tributária IBS/CBS
            'cst_ibs_cbs', 'ibs_aliquota', 'cbs_aliquota', 'imposto_seletivo_aliquota',
            # Metadados
            'classificacao_fiscal', 'fonte_info',
        ]


class ProdutoSerializer(serializers.ModelSerializer):
    # Campo para mostrar nome do grupo (somente leitura)
    grupo_nome = serializers.CharField(source='id_grupo.nome_grupo', read_only=True, allow_null=True)
    
    # Campos para mostrar estoque por dep�sito (somente leitura)
    estoque_por_deposito = serializers.SerializerMethodField()
    estoque_total = serializers.SerializerMethodField()
    valor_venda = serializers.SerializerMethodField()  # NOVO: Valor de venda (primeiro dep�sito)
    
    # Tributacao detalhada (nested, somente leitura)
    tributacao_detalhada = TributacaoProdutoSerializer(read_only=True, allow_null=True)
    
    class Meta:
        model = Produto
        fields = [
            'id_produto',
            'codigo_produto',
            'nome_produto',
            'descricao',
            'unidade_medida',
            'id_grupo',
            'grupo_nome',           # Campo de LEITURA
            'marca',
            'classificacao',
            'ncm',
            'gtin',
            'categoria',
            'tributacao_detalhada',  # CST/CFOP do produto
            'estoque_por_deposito', # NOVO: Estoque por dep�sito
            'estoque_total',        # NOVO: Total consolidado
            'valor_venda',          # NOVO: Valor de venda
            'observacoes',
            'imagem_url',
            # Campos de materiais de construção
            'metragem_caixa',
            'rendimento_m2',
            'peso_unitario',
            'variacao',
            'produto_pai',  # ForeignKey (envia/recebe ID)
            'controla_lote',  # Exige seleção de lote na venda
            'genero',
        ]
        read_only_fields = [
            'id_produto', 'grupo_nome', 
            'estoque_por_deposito', 'estoque_total', 'valor_venda',
            'tributacao_detalhada'  # somente leitura
        ]

    def validate_classificacao(self, value):
        if value and len(value) > 255:
            return value[:255]
        return value

    def validate_ncm(self, value):
        """Validação assertiva de NCM usando serviço centralizado"""
        from .services.ncm_validation import validate_ncm_assertiva
        
        clean_ncm, error = validate_ncm_assertiva(value)
        
        if error:
            raise serializers.ValidationError(error)
            
        return clean_ncm

    def get_estoque_por_deposito(self, obj):
        """Retorna estoque atual por deposito"""
        try:
            from .models import Estoque, Deposito
            estoques = Estoque.objects.filter(id_produto=obj).select_related('id_deposito')
            result = [
                {
                    'id_estoque': estoque.id_estoque,  # IMPORTANTE: ID para fazer PATCH
                    'id_deposito': estoque.id_deposito.id_deposito,
                    'nome_deposito': estoque.id_deposito.nome_deposito,
                    'quantidade_atual': float(estoque.quantidade) if estoque.quantidade else 0.0,  # Frontend espera quantidade_atual
                    'quantidade': float(estoque.quantidade) if estoque.quantidade else 0.0,  # Manter compatibilidade
                    'quantidade_minima': float(estoque.quantidade_minima) if estoque.quantidade_minima else 0.0,
                    'quantidade_maxima': float(estoque.quantidade_maxima) if estoque.quantidade_maxima else 0.0,
                    'valor_venda': float(estoque.valor_venda) if estoque.valor_venda else 0.0,
                    'valor_ultima_compra': float(estoque.valor_ultima_compra) if estoque.valor_ultima_compra else 0.0
                }
                for estoque in estoques
            ]
            return result
        except Exception as e:
            return []

    def get_estoque_total(self, obj):
        """Retorna o estoque total consolidado de todos os dep�sitos"""
        try:
            from .models import Estoque
            total = Estoque.objects.filter(id_produto=obj).aggregate(
                total=models.Sum('quantidade')
            )['total']
            return float(total) if total else 0.0
        except Exception:
            return 0.0

    def get_valor_venda(self, obj):
        """Retorna o valor de venda do produto (primeiro dep�sito encontrado)"""
        try:
            from .models import Estoque
            estoque = Estoque.objects.filter(id_produto=obj).first()
            if estoque and estoque.valor_venda:
                return float(estoque.valor_venda)
            return 0.0
        except Exception:
            return 0.0

    def create(self, validated_data):
        """Sobrescrever create para criar automaticamente registros de estoque nos dep�sitos"""
        from .models import Deposito, Estoque
        from decimal import Decimal
        
        with transaction.atomic():
            # Criar o produto
            produto = super().create(validated_data)
            
            # Buscar os dep�sitos (ID 1 e 6)
            try:
                deposito_loja = Deposito.objects.get(id_deposito=1)
                deposito_deposito = Deposito.objects.get(id_deposito=6)
                
                # Criar registros de estoque zerados para ambos os dep�sitos
                Estoque.objects.create(
                    id_produto=produto,
                    id_deposito=deposito_loja,
                    quantidade=Decimal('0.000'),
                    custo_medio=Decimal('0.0000'),
                    valor_total=Decimal('0.00'),
                    quantidade_minima=Decimal('0.000'),
                    ativo=True
                )
                
                Estoque.objects.create(
                    id_produto=produto,
                    id_deposito=deposito_deposito,
                    quantidade=Decimal('0.000'),
                    custo_medio=Decimal('0.0000'),
                    valor_total=Decimal('0.00'),
                    quantidade_minima=Decimal('0.000'),
                    ativo=True
                )
                
            except Deposito.DoesNotExist as e:
                pass  # Dep�sito n�o encontrado
            except Exception as e:
                pass  # Erro ao criar registros de estoque
            
            return produto
    
    def update(self, instance, validated_data):
        """DEBUG: Verificar se produto_pai está chegando"""
        import sys
        sys.stdout.write(f'\n\n🚨🚨🚨 ProdutoSerializer.update() CHAMADO! 🚨🚨🚨\n')
        sys.stdout.write(f'validated_data: {validated_data}\n')
        sys.stdout.write(f'produto_pai in validated_data: {"produto_pai" in validated_data}\n')
        sys.stdout.flush()
        
        if 'produto_pai' in validated_data:
            sys.stdout.write(f'✅ produto_pai EXISTE: {validated_data["produto_pai"]}\n')
            sys.stdout.flush()
        else:
            sys.stdout.write(f'❌ produto_pai NÃO ESTÁ em validated_data!\n')
            sys.stdout.flush()
        
        # Chamar update padrão
        result = super().update(instance, validated_data)
        
        sys.stdout.write(f'Após update - result.produto_pai: {result.produto_pai}\n\n')
        sys.stdout.flush()
        
        return result


class OperacaoSerializer(serializers.ModelSerializer):
    id_empresa = serializers.SerializerMethodField()
    dados_empresa = serializers.SerializerMethodField()
    
    class Meta:
        model = Operacao
        fields = '__all__'
        read_only_fields = ['id_operacao']
    
    def get_id_empresa(self, obj):
        """Retorna o ID numerico da empresa se o campo 'empresa' for um numero"""
        if not obj.empresa:
            return None
        try:
            return int(obj.empresa)
        except (ValueError, TypeError):
            return None
    
    def to_representation(self, instance):
        """Override para adicionar id_empresa na representacao"""
        data = super().to_representation(instance)
        print(f"DEBUG to_representation chamado para: {instance.nome_operacao}")
        # Adiciona id_empresa convertendo o campo empresa
        if instance.empresa:
            try:
                data['id_empresa'] = int(instance.empresa)
                print(f"DEBUG: Adicionado id_empresa={data['id_empresa']}")
            except (ValueError, TypeError) as e:
                print(f"DEBUG: Erro ao converter empresa: {e}")
                data['id_empresa'] = None
        else:
            data['id_empresa'] = None
        print(f"DEBUG: keys em data: {list(data.keys())}")
        return data
    
    def get_dados_empresa(self, obj):
        """Busca dados completos da empresa configurada na operacao"""
        if not obj.empresa:
            return None
        
        try:
            from .models import EmpresaConfig
            empresa = None
            
            # Tentar primeiro como ID num�rico
            try:
                empresa_id = int(obj.empresa)
                empresa = EmpresaConfig.objects.filter(id_empresa=empresa_id).first()
                if empresa:
                    pass  # Empresa encontrada por ID
            except (ValueError, TypeError):
                # Se n�o for n�mero, buscar pelo nome
                empresa = EmpresaConfig.objects.filter(
                    models.Q(nome_razao_social=obj.empresa) | 
                    models.Q(nome_fantasia=obj.empresa)
                ).first()
            
            if empresa:
                return {
                    'id_empresa': empresa.id_empresa,
                    'nome_razao_social': empresa.nome_razao_social,
                    'nome_fantasia': empresa.nome_fantasia,
                    'cpf_cnpj': empresa.cpf_cnpj,
                    'inscricao_estadual': empresa.inscricao_estadual,
                    'endereco': empresa.endereco,
                    'numero': empresa.numero,
                    'bairro': empresa.bairro,
                    'cidade': empresa.cidade,
                    'estado': empresa.estado,
                    'cep': empresa.cep,
                    'telefone': empresa.telefone,
                    'email': empresa.email,
                    'logo_url': empresa.logo_url
                }
            else:
                pass  # Empresa n�o encontrada
        except Exception as e:
            pass  # Erro ao buscar dados da empresa
        
        return None
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['usa_auto_numeracao'] = bool(instance.usa_auto_numeracao)
        ret['gera_financeiro'] = bool(instance.gera_financeiro)
        return ret


class SugestaoCFOPSerializer(serializers.ModelSerializer):
    """Serializer para configuração de sugestões de CFOP por operação"""
    tipo_destino_display = serializers.CharField(source='get_tipo_destino_display', read_only=True)
    operacao_nome = serializers.CharField(source='id_operacao.nome_operacao', read_only=True)
    
    class Meta:
        model = SugestaoCFOP
        fields = '__all__'
        read_only_fields = ['id_sugestao_cfop']
    
    def validate_cfop_sugerido(self, value):
        """Valida formato do CFOP (4 dígitos)"""
        if not value or len(value) != 4 or not value.isdigit():
            raise serializers.ValidationError("CFOP deve ter exatamente 4 dígitos numéricos")
        return value


class NotaFiscalReferenciadaSerializer(serializers.ModelSerializer):
    """Serializer para documentos fiscais referenciados (tag NFref do XML)"""
    tipo_documento_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)
    
    class Meta:
        model = NotaFiscalReferenciada
        fields = '__all__'
        read_only_fields = ['id_nota_referenciada', 'data_cadastro']
    
    def validate_chave_acesso(self, value):
        """Valida formato da chave de acesso (44 dígitos)"""
        if not value or len(value) != 44 or not value.isdigit():
            raise serializers.ValidationError("Chave de acesso deve ter exatamente 44 dígitos numéricos")
        return value


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = '__all__'
        read_only_fields = ['id_departamento']

class CentroCustoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CentroCusto
        fields = '__all__'
        read_only_fields = ['id_centro_custo']

class ContaBancariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContaBancaria
        fields = '__all__'
        read_only_fields = ['id_conta_bancaria']

class FinanceiroContaSerializer(serializers.ModelSerializer):
    gerencial = serializers.BooleanField()
    cliente = serializers.SerializerMethodField()
    data_documento = serializers.DateField(source='data_emissao', read_only=True)
    
    class Meta:
        model = FinanceiroConta
        fields = '__all__'
        read_only_fields = ['id_conta', 'data_emissao']
    
    def get_cliente(self, obj):
        if obj.id_cliente_fornecedor:
            return obj.id_cliente_fornecedor.nome_razao_social
        return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['gerencial'] = bool(instance.gerencial)
        
        # Garante que campos de data sejam serializados apenas como data (sem timezone)
        # Isso evita problemas de convers�o de timezone no frontend
        if instance.data_emissao:
            ret['data_emissao'] = instance.data_emissao.strftime('%Y-%m-%d')
        if instance.data_vencimento:
            ret['data_vencimento'] = instance.data_vencimento.strftime('%Y-%m-%d')
        if instance.data_pagamento:
            ret['data_pagamento'] = instance.data_pagamento.strftime('%Y-%m-%d')
            
        return ret

    def update(self, instance, validated_data):
        from decimal import Decimal

        # Verifica se est� mudando para status 'Paga' (baixa)
        old_status = instance.status_conta
        new_status = validated_data.get('status_conta', old_status)
        
        # Atualiza a conta
        updated_instance = super().update(instance, validated_data)
        
        # Se mudou de Pendente para Paga, cria movimento banc�rio
        if old_status != 'Paga' and new_status == 'Paga' and updated_instance.id_conta_baixa:
            # Determina tipo de movimento (Receber = Cr�dito, Pagar = D�bito)
            tipo_mov = 'C' if updated_instance.tipo_conta == 'Receber' else 'D'
            
            FinanceiroBancario.objects.create(
                id_conta_bancaria=updated_instance.id_conta_baixa,
                tipo_movimento=tipo_mov,
                data_pagamento=updated_instance.data_pagamento or timezone.now().date(),
                valor_movimento=updated_instance.valor_liquidado or Decimal('0.00'),
                descricao=f'{updated_instance.tipo_conta.upper()} - {updated_instance.descricao}',
                documento_numero=updated_instance.documento_numero or str(updated_instance.id_conta),
                id_cliente_fornecedor=updated_instance.id_cliente_fornecedor,
                forma_pagamento=updated_instance.forma_pagamento
            )
        
        return updated_instance
        
class EmpresaConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpresaConfig
        fields = '__all__'
        read_only_fields = ['id_empresa']

class FuncaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcao
        fields = '__all__'
        read_only_fields = ['id_funcao']

class VendedorSerializer(serializers.ModelSerializer):
    funcoes = FuncaoSerializer(many=True, read_only=True)
    funcoes_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Funcao.objects.all(), 
        source='funcoes', 
        write_only=True,
        required=False 
    )
    username = serializers.SerializerMethodField()

    class Meta:
        model = Vendedor
        fields = [
            'id_vendedor', 'cpf', 'nome', 'nome_reduzido', 'telefone', 
            'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado', 
            'percentual_comissao', 
            'funcoes', 'funcoes_ids',
            'id_user', 
            'username'
        ]
        read_only_fields = ['id_vendedor']
        extra_kwargs = {
            'id_user': {'required': False, 'allow_null': True}
        }

    def get_username(self, obj):
        if obj.id_user:
            return obj.id_user.username
        return None

# --- Serializers de Usu�rio e Par�metros ---

class UserParametrosSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserParametros
        exclude = ['id_parametro', 'id_user'] 

class UserPermissoesSerializer(serializers.ModelSerializer):
    clientes_acessar = serializers.BooleanField(default=False)
    clientes_criar = serializers.BooleanField(default=False)
    clientes_editar = serializers.BooleanField(default=False)
    clientes_excluir = serializers.BooleanField(default=False)
    produtos_acessar = serializers.BooleanField(default=False)
    produtos_criar = serializers.BooleanField(default=False)
    produtos_editar = serializers.BooleanField(default=False)
    produtos_excluir = serializers.BooleanField(default=False)
    financeiro_acessar = serializers.BooleanField(default=False)
    financeiro_criar = serializers.BooleanField(default=False)
    financeiro_editar = serializers.BooleanField(default=False)
    financeiro_excluir = serializers.BooleanField(default=False)
    financeiro_baixar = serializers.BooleanField(default=False)
    config_acessar = serializers.BooleanField(default=False)
    config_empresa_editar = serializers.BooleanField(default=False)
    config_usuarios_acessar = serializers.BooleanField(default=False)
    config_usuarios_criar = serializers.BooleanField(default=False)
    config_usuarios_editar = serializers.BooleanField(default=False)
    config_usuarios_excluir = serializers.BooleanField(default=False)
    config_vendedores_acessar = serializers.BooleanField(default=False)
    config_vendedores_criar = serializers.BooleanField(default=False)
    config_vendedores_editar = serializers.BooleanField(default=False)
    config_vendedores_excluir = serializers.BooleanField(default=False)
    config_operacoes_acessar = serializers.BooleanField(default=False)
    config_operacoes_criar = serializers.BooleanField(default=False)
    config_operacoes_editar = serializers.BooleanField(default=False)
    config_operacoes_excluir = serializers.BooleanField(default=False)
    config_apoio_acessar = serializers.BooleanField(default=False)
    config_apoio_criar = serializers.BooleanField(default=False)
    config_apoio_editar = serializers.BooleanField(default=False)
    config_apoio_excluir = serializers.BooleanField(default=False)
    vendas_acessar = serializers.BooleanField(default=False)
    vendas_criar = serializers.BooleanField(default=False)
    vendas_editar = serializers.BooleanField(default=False)
    vendas_excluir = serializers.BooleanField(default=False)
    vendas_cancelar = serializers.BooleanField(default=False)
    compras_acessar = serializers.BooleanField(default=False)
    compras_criar = serializers.BooleanField(default=False)
    compras_editar = serializers.BooleanField(default=False)
    compras_excluir = serializers.BooleanField(default=False)
    trocas_acessar = serializers.BooleanField(default=False)
    trocas_criar = serializers.BooleanField(default=False)
    trocas_editar = serializers.BooleanField(default=False)
    trocas_excluir = serializers.BooleanField(default=False)
    ordens_acessar = serializers.BooleanField(default=False)
    ordens_criar = serializers.BooleanField(default=False)
    ordens_editar = serializers.BooleanField(default=False)
    ordens_excluir = serializers.BooleanField(default=False)
    cotacoes_acessar = serializers.BooleanField(default=False)
    cotacoes_criar = serializers.BooleanField(default=False)
    cotacoes_editar = serializers.BooleanField(default=False)
    cotacoes_excluir = serializers.BooleanField(default=False)
    devolucoes_acessar = serializers.BooleanField(default=False)
    devolucoes_criar = serializers.BooleanField(default=False)
    devolucoes_editar = serializers.BooleanField(default=False)
    devolucoes_excluir = serializers.BooleanField(default=False)
    comandas_acessar = serializers.BooleanField(default=False)
    comandas_criar = serializers.BooleanField(default=False)
    comandas_editar = serializers.BooleanField(default=False)
    comandas_excluir = serializers.BooleanField(default=False)
    petshop_acessar = serializers.BooleanField(default=False)
    petshop_criar = serializers.BooleanField(default=False)
    petshop_editar = serializers.BooleanField(default=False)
    petshop_excluir = serializers.BooleanField(default=False)
    catalogo_acessar = serializers.BooleanField(default=False)
    catalogo_editar = serializers.BooleanField(default=False)
    etiquetas_acessar = serializers.BooleanField(default=False)
    etiquetas_criar = serializers.BooleanField(default=False)
    etiquetas_editar = serializers.BooleanField(default=False)
    etiquetas_excluir = serializers.BooleanField(default=False)
    relatorios_acessar = serializers.BooleanField(default=False)
    relatorios_exportar = serializers.BooleanField(default=False)
    graficos_acessar = serializers.BooleanField(default=False)
    mapa_promocao_acessar = serializers.BooleanField(default=False)
    mapa_promocao_criar = serializers.BooleanField(default=False)
    mapa_promocao_editar = serializers.BooleanField(default=False)
    mapa_promocao_excluir = serializers.BooleanField(default=False)
    venda_rapida_acessar = serializers.BooleanField(default=False)
    nfce_acessar = serializers.BooleanField(default=False)
    nfce_criar = serializers.BooleanField(default=False)
    nfce_editar = serializers.BooleanField(default=False)
    nfce_excluir = serializers.BooleanField(default=False)
    nfe_acessar = serializers.BooleanField(default=False)
    nfe_criar = serializers.BooleanField(default=False)
    nfe_editar = serializers.BooleanField(default=False)
    nfe_excluir = serializers.BooleanField(default=False)
    cte_acessar = serializers.BooleanField(default=False)
    cte_criar = serializers.BooleanField(default=False)
    cte_editar = serializers.BooleanField(default=False)
    cte_excluir = serializers.BooleanField(default=False)
    mdfe_acessar = serializers.BooleanField(default=False)
    mdfe_criar = serializers.BooleanField(default=False)
    mdfe_editar = serializers.BooleanField(default=False)
    mdfe_excluir = serializers.BooleanField(default=False)
    fornecedores_acessar = serializers.BooleanField(default=False)
    fornecedores_criar = serializers.BooleanField(default=False)
    fornecedores_editar = serializers.BooleanField(default=False)
    fornecedores_excluir = serializers.BooleanField(default=False)
    agro_acessar = serializers.BooleanField(default=False)
    agro_criar = serializers.BooleanField(default=False)
    agro_editar = serializers.BooleanField(default=False)
    agro_excluir = serializers.BooleanField(default=False)
    sped_acessar = serializers.BooleanField(default=False)
    sped_contribuicoes_acessar = serializers.BooleanField(default=False)
    whatsapp_acessar = serializers.BooleanField(default=False)
    boletos_acessar = serializers.BooleanField(default=False)
    boletos_criar = serializers.BooleanField(default=False)
    boletos_editar = serializers.BooleanField(default=False)
    mapa_carga_acessar = serializers.BooleanField(default=False)
    mapa_carga_criar = serializers.BooleanField(default=False)
    mapa_carga_editar = serializers.BooleanField(default=False)
    producao_acessar = serializers.BooleanField(default=False)
    producao_criar = serializers.BooleanField(default=False)
    producao_editar = serializers.BooleanField(default=False)
    comissoes_acessar = serializers.BooleanField(default=False)
    conciliacao_acessar = serializers.BooleanField(default=False)
    cartoes_acessar = serializers.BooleanField(default=False)
    agenda_acessar = serializers.BooleanField(default=False)
    agenda_criar = serializers.BooleanField(default=False)
    agenda_editar = serializers.BooleanField(default=False)
    balancas_acessar = serializers.BooleanField(default=False)
    bancario_acessar = serializers.BooleanField(default=False)
    bancario_criar = serializers.BooleanField(default=False)
    bancario_editar = serializers.BooleanField(default=False)
    contas_servicos_acessar = serializers.BooleanField(default=False)
    aut_desconto = serializers.BooleanField(default=False)
    aut_cancelar_venda = serializers.BooleanField(default=False)

    class Meta:
        model = UserPermissoes
        fields = [
            'clientes_acessar', 'clientes_criar', 'clientes_editar', 'clientes_excluir',
            'produtos_acessar', 'produtos_criar', 'produtos_editar', 'produtos_excluir',
            'financeiro_acessar', 'financeiro_criar', 'financeiro_editar', 'financeiro_excluir', 'financeiro_baixar',
            'config_acessar', 'config_empresa_editar', 
            'config_usuarios_acessar', 'config_usuarios_criar', 'config_usuarios_editar', 'config_usuarios_excluir',
            'config_vendedores_acessar', 'config_vendedores_criar', 'config_vendedores_editar', 'config_vendedores_excluir',
            'config_operacoes_acessar', 'config_operacoes_criar', 'config_operacoes_editar', 'config_operacoes_excluir',
            'config_apoio_acessar', 'config_apoio_criar', 'config_apoio_editar', 'config_apoio_excluir',
            'vendas_acessar', 'vendas_criar', 'vendas_editar', 'vendas_excluir', 'vendas_cancelar',
            'compras_acessar', 'compras_criar', 'compras_editar', 'compras_excluir',
            'trocas_acessar', 'trocas_criar', 'trocas_editar', 'trocas_excluir',
            'ordens_acessar', 'ordens_criar', 'ordens_editar', 'ordens_excluir',
            'cotacoes_acessar', 'cotacoes_criar', 'cotacoes_editar', 'cotacoes_excluir',
            'devolucoes_acessar', 'devolucoes_criar', 'devolucoes_editar', 'devolucoes_excluir',
            'comandas_acessar', 'comandas_criar', 'comandas_editar', 'comandas_excluir',
            'petshop_acessar', 'petshop_criar', 'petshop_editar', 'petshop_excluir',
            'catalogo_acessar', 'catalogo_editar',
            'etiquetas_acessar', 'etiquetas_criar', 'etiquetas_editar', 'etiquetas_excluir',
            'relatorios_acessar', 'relatorios_exportar',
            'graficos_acessar',
            'mapa_promocao_acessar', 'mapa_promocao_criar', 'mapa_promocao_editar', 'mapa_promocao_excluir',
            'venda_rapida_acessar',
            'nfce_acessar', 'nfce_criar', 'nfce_editar', 'nfce_excluir',
            'nfe_acessar', 'nfe_criar', 'nfe_editar', 'nfe_excluir',
            'cte_acessar', 'cte_criar', 'cte_editar', 'cte_excluir',
            'mdfe_acessar', 'mdfe_criar', 'mdfe_editar', 'mdfe_excluir',
            'fornecedores_acessar', 'fornecedores_criar', 'fornecedores_editar', 'fornecedores_excluir',
            'agro_acessar', 'agro_criar', 'agro_editar', 'agro_excluir',
            'sped_acessar', 'sped_contribuicoes_acessar',
            'whatsapp_acessar',
            'boletos_acessar', 'boletos_criar', 'boletos_editar',
            'mapa_carga_acessar', 'mapa_carga_criar', 'mapa_carga_editar',
            'producao_acessar', 'producao_criar', 'producao_editar',
            'comissoes_acessar',
            'conciliacao_acessar',
            'cartoes_acessar',
            'agenda_acessar', 'agenda_criar', 'agenda_editar',
            'balancas_acessar',
            'bancario_acessar', 'bancario_criar', 'bancario_editar',
            'contas_servicos_acessar',
            'aut_desconto', 'aut_cancelar_venda'
        ]

# Serializer Mestre (User)
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, style={'input_type': 'password'}
    )
    id_vendedor = serializers.PrimaryKeyRelatedField(
        queryset=Vendedor.objects.all(), source='vendedor', 
        write_only=True, required=False, allow_null=True
    )
    parametros = UserParametrosSerializer(required=False)
    permissoes = UserPermissoesSerializer(required=False)
    permissions = serializers.SerializerMethodField()  # Campo adicional para frontend
    vendedor_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'password', 
            'is_staff', 'is_active', 'is_superuser',
            'id_vendedor', 'vendedor_id', 'parametros', 'permissoes', 'permissions'
        ]
        read_only_fields = ['id', 'vendedor_id', 'permissions', 'is_superuser']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'email': {'required': False},
        }

    def get_vendedor_id(self, obj):
        try:
            return obj.vendedor.id_vendedor
        except (Vendedor.DoesNotExist, AttributeError, Exception):
            return None

    def get_permissions(self, obj):
        """Retorna as permiss�es como um dicion�rio simples para o frontend"""
        # Se for superusu�rio/administrador, retorna todas as permiss�es como True
        if obj.is_superuser:
            return {
                field.name: True
                for field in UserPermissoes._meta.get_fields()
                if field.name not in ['id', 'id_user', 'id_permissao']
            }
        
        # get_or_create garante que todo usuário sempre tenha um registro de permissões
        perms, created = UserPermissoes.objects.get_or_create(id_user=obj)
        return {
            field.name: bool(getattr(perms, field.name))
            for field in UserPermissoes._meta.get_fields()
            if field.name not in ['id', 'id_user', 'id_permissao'] and hasattr(perms, field.name)
        }

    @transaction.atomic 
    def create(self, validated_data):
        parametros_data = validated_data.pop('parametros', {})
        permissoes_data = validated_data.pop('permissoes', {})
        vendedor_link = validated_data.pop('vendedor', None)
        password = validated_data.pop('password') 
        
        user = User.objects.create_user(**validated_data, password=password)
        UserParametros.objects.create(id_user=user, **parametros_data)
        UserPermissoes.objects.create(id_user=user, **permissoes_data)
        
        if vendedor_link:
            # Desvincula o vendedor de qualquer usuário anterior (permite reatribuição)
            Vendedor.objects.filter(pk=vendedor_link.pk).update(id_user=None)
            vendedor_link.id_user = user
            vendedor_link.save()
        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        parametros_data = validated_data.pop('parametros', None)
        permissoes_data = validated_data.pop('permissoes', None)
        vendedor_link = validated_data.pop('vendedor', None)

        # Atualiza campos do User
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.is_staff = validated_data.get('is_staff', instance.is_staff)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        
        password = validated_data.get('password', None)
        if password:
            instance.set_password(password)
        instance.save()
        
        # Atualiza Par�metros
        if parametros_data:
            params, created = UserParametros.objects.get_or_create(id_user=instance)
            for attr, value in parametros_data.items():
                setattr(params, attr, value)
            params.save()
            
        # Atualiza Permiss�es - atualiza todas as que forem enviadas
        if permissoes_data:
            perms, created = UserPermissoes.objects.get_or_create(id_user=instance)
            # Atualizar todas as permiss�es que foram enviadas
            for attr, value in permissoes_data.items():
                # Verificar se o campo existe no modelo
                if hasattr(perms, attr):
                    setattr(perms, attr, value)
            perms.save()
            
        # Atualiza Vínculo do Vendedor
        Vendedor.objects.filter(id_user=instance).update(id_user=None)
        if vendedor_link:
            # Desvincula o vendedor de qualquer usuário anterior (permite reatribuição)
            Vendedor.objects.filter(pk=vendedor_link.pk).update(id_user=None)
            vendedor_link.id_user = instance
            vendedor_link.save()
        return instance

# --- Serializer de Solicita��o (Fase 3) ---
class SolicitacaoAprovacaoSerializer(serializers.ModelSerializer):
    solicitante_nome = serializers.CharField(source='id_usuario_solicitante.username', read_only=True)
    supervisor_nome = serializers.CharField(source='id_usuario_supervisor.username', read_only=True)

    class Meta:
        model = SolicitacaoAprovacao
        fields = '__all__'
        read_only_fields = [
            'id_solicitacao', 
            'data_solicitacao', 
            'data_aprovacao', 
            'solicitante_nome', 
            'supervisor_nome',
            'id_usuario_solicitante' # Solicitante � sempre o usu�rio logado
        ]
    
    def update(self, instance, validated_data):
        if validated_data.get('status') in ['Aprovada', 'Rejeitada']:
            validated_data['data_aprovacao'] = timezone.now()
            validated_data['id_usuario_supervisor'] = self.context['request'].user
        
        return super().update(instance, validated_data)

# --- 2. SERIALIZER ATUALIZADO: FormaPagamento ---
# --- 2. SERIALIZER ATUALIZADO: FormaPagamento ---
class FormaPagamentoSerializer(serializers.ModelSerializer):
    # Campos para LEITURA (frontend) - retorna os nomes em vez de IDs
    nome_conta_padrao = serializers.SerializerMethodField()
    nome_departamento = serializers.SerializerMethodField()
    nome_centro_custo = serializers.SerializerMethodField()

    def get_nome_conta_padrao(self, obj):
        return obj.id_conta_padrao.nome_conta if obj.id_conta_padrao else None
    
    def get_nome_departamento(self, obj):
        return obj.id_departamento.nome_departamento if obj.id_departamento else None
    
    def get_nome_centro_custo(self, obj):
        return obj.id_centro_custo.nome_centro_custo if obj.id_centro_custo else None

    class Meta:
        model = FormaPagamento
        fields = [
            'id_forma_pagamento',
            'nome_forma',
            'dias_vencimento',
            'id_conta_padrao',      # Campo de ESCRITA (envia o ID)
            'id_centro_custo',      # Campo de ESCRITA (envia o ID)
            'id_departamento',      # Campo de ESCRITA (envia o ID)
            'nome_conta_padrao',    # Campo de LEITURA (recebe o nome)
            'nome_departamento',    # Campo de LEITURA (recebe o nome)
            'nome_centro_custo',    # Campo de LEITURA (recebe o nome)
            'tipo_integracao',
            'taxa_operadora',
            'dias_repasse',
        ]
        read_only_fields = ['id_forma_pagamento', 'nome_conta_padrao', 'nome_departamento', 'nome_centro_custo']
        extra_kwargs = {
            'id_conta_padrao': {'required': False, 'allow_null': True},
            'id_centro_custo': {'required': False, 'allow_null': True},
            'id_departamento': {'required': False, 'allow_null': True}
        }

# --- 3. SERIALIZERS DE GEST�O DE ESTOQUE ---

class EstoqueSerializer(serializers.ModelSerializer):
    # Campos para LEITURA (frontend)
    produto_codigo = serializers.CharField(source='id_produto.codigo_produto', read_only=True)
    produto_nome = serializers.CharField(source='id_produto.nome_produto', read_only=True)
    produto_unidade = serializers.CharField(source='id_produto.unidade_medida', read_only=True)
    deposito_nome = serializers.CharField(source='id_deposito.nome_deposito', read_only=True)
    
    # Campos calculados (read-only)
    status_estoque = serializers.CharField(read_only=True)
    valor_total_estoque = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    
    class Meta:
        model = Estoque
        fields = [
            'id_estoque',
            'id_produto',           # Campo de ESCRITA (envia o ID)
            'id_variacao',          # Campo de ESCRITA (Grade)
            'id_deposito',          # Campo de ESCRITA (envia o ID)
            'quantidade',
            'quantidade_minima',
            'quantidade_maxima',
            'valor_venda',
            'valor_ultima_compra',
            'data_criacao',
            'data_modificacao',
            'produto_codigo',       # Campo de LEITURA
            'produto_nome',         # Campo de LEITURA
            'produto_unidade',      # Campo de LEITURA
            'deposito_nome',        # Campo de LEITURA
            'status_estoque',       # Campo calculado
            'valor_total_estoque'   # Campo calculado
        ]
        read_only_fields = [
            'id_estoque', 'data_criacao', 'data_modificacao',
            'produto_codigo', 'produto_nome', 'produto_unidade', 'deposito_nome',
            'status_estoque', 'valor_total_estoque'
        ]
        extra_kwargs = {
            'quantidade_maxima': {'required': False, 'allow_null': True}
        }

    def validate(self, data):
        """Valida��o que considera updates parciais e campos do modelo."""
        instance = getattr(self, 'instance', None)

        def current(field, default=None):
            if field in data:
                return data.get(field)
            if instance is not None:
                return getattr(instance, field, default)
            return default

        quantidade_minima = current('quantidade_minima', 0)
        quantidade_maxima = current('quantidade_maxima', None)  # pode ser nulo

        # So valida quantidade se estiver sendo explicitamente alterada no request
        # (evita rejeitar PATCH de precos/minimos quando o estoque atual ja eh negativo)
        if 'quantidade' in data:
            quantidade = data.get('quantidade')
            if quantidade is not None and quantidade < 0:
                raise serializers.ValidationError("Quantidade nao pode ser negativa")

        if quantidade_minima is not None and quantidade_minima < 0:
            raise serializers.ValidationError("Quantidade m�nima n�o pode ser negativa")

        # S� valida limites quando quantidade_maxima estiver definida
        if quantidade_maxima is not None:
            if quantidade_maxima <= 0:
                raise serializers.ValidationError("Quantidade m�xima deve ser maior que zero")
            if quantidade_minima is not None and quantidade_minima >= quantidade_maxima:
                raise serializers.ValidationError("Quantidade m�nima deve ser menor que a m�xima")

        return data

class DepositoSerializer(serializers.ModelSerializer):
    # Allow boolean input for IntegerFields (Frontend sends true/false)
    estoque_baixo = serializers.BooleanField(default=False)
    estoque_incremento = serializers.BooleanField(default=False)

    class Meta:
        model = Deposito
        fields = [
            'id_deposito',
            'nome_deposito',
            'descricao',
            'estoque_baixo',
            'estoque_incremento',
            'data_criacao',
            'data_modificacao'
        ]
        read_only_fields = ['id_deposito', 'data_criacao', 'data_modificacao']
        extra_kwargs = {
            'descricao': {'allow_blank': True},
        }

class EstoqueMovimentacaoSerializer(serializers.ModelSerializer):
    # Campos para LEITURA (frontend)
    produto_codigo = serializers.CharField(source='id_produto.codigo_produto', read_only=True)
    produto_nome = serializers.CharField(source='id_produto.nome_produto', read_only=True)
    deposito_nome = serializers.CharField(source='id_deposito.nome_deposito', read_only=True)
    
    class Meta:
        model = EstoqueMovimentacao
        fields = [
            'id_movimentacao',
            'id_estoque',
            'id_produto',
            'id_deposito',
            'tipo_movimentacao',
            'quantidade_anterior',
            'quantidade_movimentada',
            'quantidade_atual',
            'custo_unitario',
            'valor_total',
            'documento_numero',
            'documento_tipo',
            'id_documento_origem',
            'observacoes',
            'usuario_responsavel',
            'data_movimentacao',
            'produto_codigo',
            'produto_nome',
            'deposito_nome'
        ]
        read_only_fields = [
            'id_movimentacao',
            'data_movimentacao',
            'produto_codigo',
            'produto_nome',
            'deposito_nome'
        ]
        extra_kwargs = {
            'observacoes': {'required': False, 'allow_null': True, 'allow_blank': True},
            'documento_numero': {'required': False, 'allow_null': True, 'allow_blank': True},
            'documento_tipo': {'required': False, 'allow_null': True, 'allow_blank': True},
            'id_documento_origem': {'required': False, 'allow_null': True},
            'usuario_responsavel': {'required': False, 'allow_null': True, 'allow_blank': True}
        }

    def validate(self, data):
        """Valida��o customizada"""
        quantidade_movimentada = data.get('quantidade_movimentada', 0)
        tipo_movimentacao = data.get('tipo_movimentacao')

        if quantidade_movimentada <= 0:
            raise serializers.ValidationError("Quantidade movimentada deve ser maior que zero")
        
        if tipo_movimentacao not in ['ENTRADA', 'SAIDA', 'AJUSTE', 'TRANSFERENCIA']:
            raise serializers.ValidationError("Tipo de movimenta��o inv�lido")

        # Para sa�das, verificar se h� estoque suficiente
        if tipo_movimentacao == 'SAIDA':
            estoque = data.get('id_estoque')
            if estoque and getattr(estoque, 'quantidade', 0) < quantidade_movimentada:
                raise serializers.ValidationError(
                    f"Estoque insuficiente. Dispon�vel: {getattr(estoque, 'quantidade', 0)}, Solicitado: {quantidade_movimentada}"
                )

        return data

    def create(self, validated_data):
        """Sobrescrever create para atualizar automaticamente o estoque"""
        with transaction.atomic():
            # Criar a movimenta��o
            movimentacao = super().create(validated_data)
            
            # Atualizar o estoque automaticamente
            estoque = movimentacao.id_estoque
            if movimentacao.tipo_movimentacao == 'ENTRADA':
                estoque.quantidade += movimentacao.quantidade
                # registrar data da �ltima entrada
                estoque.data_ultima_entrada = movimentacao.data_movimentacao
            else:  # SAIDA
                estoque.quantidade -= movimentacao.quantidade
                # registrar data da �ltima sa�da
                estoque.data_ultima_saida = movimentacao.data_movimentacao

            estoque.save()
            
            return movimentacao








# === SERIALIZERS DE TROCA ===
# Importar serializers de troca
# COMENTADO: Causava conflito de modelos registrados duas vezes
# Os serializers_troca s�o importados diretamente em views_troca.py
# try:
#     from .serializers_troca import *
# except ImportError:
#     pass  # Arquivo ainda n�o existe


# ===========================
# SERIALIZERS DE PROMO��O (Mapa de Promo��o)
# ===========================

class PromocaoProdutoSerializer(serializers.ModelSerializer):
    """Serializer para produtos em promo��o"""
    nome_produto = serializers.CharField(read_only=True, source='id_produto.nome_produto')
    codigo_produto = serializers.CharField(read_only=True, source='id_produto.codigo_produto')
    
    class Meta:
        from .models import PromocaoProduto
        model = PromocaoProduto
        fields = [
            'id_promocao_produto',
            'id_produto',
            'nome_produto',
            'codigo_produto',
            'valor_minimo_venda',
            'quantidade_minima',
            'valor_desconto_produto',
            'criado_em'
        ]
        read_only_fields = ['id_promocao_produto', 'nome_produto', 'codigo_produto', 'criado_em']


class PromocaoSerializer(serializers.ModelSerializer):
    """Serializer para Promo��o"""
    promocao_produtos = PromocaoProdutoSerializer(many=True, read_only=True)
    produtos = serializers.ListField(
        child=ProdutoComQuantidadeField(),
        write_only=True,
        required=False,
        allow_empty=True,
        help_text="Lista de IDs de produtos ou [{id_produto, quantidade_minima}]"
    )
    esta_ativa = serializers.BooleanField(read_only=True)
    dias_restantes = serializers.IntegerField(read_only=True)
    
    class Meta:
        from .models import Promocao
        model = Promocao
        fields = [
            'id_promocao',
            'nome_promocao',
            'descricao',
            'data_inicio',
            'data_fim',
            'tipo_desconto',
            'valor_desconto',
            'tipo_criterio',
            'status',
            'produtos',
            'promocao_produtos',
            'esta_ativa',
            'dias_restantes',
            'criado_em',
            'atualizado_em',
            'criado_por'
        ]
        read_only_fields = ['id_promocao', 'criado_em', 'atualizado_em', 'criado_por']
        extra_kwargs = {
            'nome_promocao': {'required': True},
            'descricao': {'required': False, 'allow_blank': True, 'allow_null': True},
            'data_inicio': {'required': True},
            'data_fim': {'required': True},
            'valor_desconto': {'required': True},
            'tipo_desconto': {'required': True},
            'tipo_criterio': {'required': True},
            'status': {'required': False, 'default': 'ativa'},
        }
    
    def validate(self, data):
        """Valida as datas da promo��o"""
        if data['data_inicio'] >= data['data_fim']:
            raise serializers.ValidationError(
                "Data de in�cio deve ser anterior � data de t�rmino"
            )
        return data
    
    def create(self, validated_data):
        """Remove produtos do validated_data pois ser�o processados na view"""
        validated_data.pop('produtos', None)
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Remove produtos do validated_data pois ser�o processados na view"""
        validated_data.pop('produtos', None)
        return super().update(instance, validated_data)


class PromocaoDetalhesSerializer(serializers.ModelSerializer):
    """Serializer detalhado para promo��o com informa��es de produtos"""
    promocao_produtos = PromocaoProdutoSerializer(many=True, read_only=True)
    esta_ativa = serializers.BooleanField(read_only=True)
    dias_restantes = serializers.IntegerField(read_only=True)
    
    class Meta:
        from .models import Promocao
        model = Promocao
        fields = '__all__'
        read_only_fields = ['id_promocao', 'criado_em', 'atualizado_em', 'criado_por']


# --- SERIALIZERS PET SHOP ---

class PetSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source='id_cliente.nome_razao_social', read_only=True)
    
    class Meta:
        from .models import Pet
        model = Pet
        fields = '__all__'
        read_only_fields = ['id_pet', 'data_cadastro']


class TipoServicoSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import TipoServico
        model = TipoServico
        fields = '__all__'
        read_only_fields = ['id_tipo_servico', 'data_criacao']


class AvaliacaoSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source='id_cliente.nome_razao_social', read_only=True)
    nota_display = serializers.CharField(source='get_nota_display', read_only=True)
    
    class Meta:
        from .models import Avaliacao
        model = Avaliacao
        fields = '__all__'
        read_only_fields = ['id_avaliacao', 'data_avaliacao']


class AgendamentoSerializer(serializers.ModelSerializer):
    pet_nome = serializers.CharField(source='id_pet.nome_pet', read_only=True)
    cliente_nome = serializers.CharField(source='id_cliente.nome_razao_social', read_only=True)
    servico_nome = serializers.CharField(source='id_tipo_servico.nome_servico', read_only=True)
    avaliacoes = AvaliacaoSerializer(many=True, read_only=True)
    sessoes = serializers.SerializerMethodField()
    
    class Meta:
        from .models import Agendamento
        model = Agendamento
        fields = '__all__'
        read_only_fields = ['id_agendamento', 'data_criacao', 'data_modificacao']
    
    def validate(self, data):
        """Validar que o pet pertence ao cliente informado"""
        if 'id_pet' in data and 'id_cliente' in data:
            if data['id_pet'].id_cliente_id != data['id_cliente'].id_cliente:
                raise serializers.ValidationError({
                    'id_pet': 'O pet selecionado n�o pertence ao cliente informado.'
                })
        return data
    
    def update(self, instance, validated_data):
        """Preencher data_conclusao automaticamente se status for Conclu�do"""
        from django.utils import timezone
        
        # Se o status mudou para "Conclu�do" e n�o tem data_conclusao, adicionar automaticamente
        if validated_data.get('status') == 'Conclu�do' and not validated_data.get('data_conclusao'):
            if instance.status != 'Conclu�do':  # S� se estava com outro status antes
                validated_data['data_conclusao'] = timezone.now()
        
        return super().update(instance, validated_data)
    
    def get_sessoes(self, obj):
        from .models import SessaoAgendamento
        sessoes = SessaoAgendamento.objects.filter(id_agendamento=obj)
        return SessaoAgendamentoSerializer(sessoes, many=True).data


class SessaoAgendamentoSerializer(serializers.ModelSerializer):
    """Serializer para sess�es individuais de pacotes"""
    class Meta:
        from .models import SessaoAgendamento
        model = SessaoAgendamento
        fields = '__all__'
        read_only_fields = ['id_sessao', 'data_criacao']
    
    def update(self, instance, validated_data):
        """Preencher data_realizacao automaticamente se status for Conclu�da"""
        from django.utils import timezone
        
        # Se o status mudou para "Conclu�da" e n�o tem data_realizacao, adicionar automaticamente
        if validated_data.get('status') == 'Conclu�da' and not validated_data.get('data_realizacao'):
            if instance.status != 'Conclu�da':  # S� se estava com outro status antes
                validated_data['data_realizacao'] = timezone.now()
        
        return super().update(instance, validated_data)


class LogAuditoriaSerializer(serializers.ModelSerializer):
    """Serializer para visualiza��o de logs de auditoria"""
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    tipo_acao_display = serializers.CharField(source='get_tipo_acao_display', read_only=True)
    data_hora_formatada = serializers.SerializerMethodField()
    
    class Meta:
        from .models import LogAuditoria
        model = LogAuditoria
        fields = [
            'id_log',
            'usuario',
            'usuario_username',
            'usuario_nome',
            'tipo_acao',
            'tipo_acao_display',
            'modulo',
            'descricao',
            'tabela',
            'registro_id',
            'dados_anteriores',
            'dados_novos',
            'ip_address',
            'user_agent',
            'data_hora',
            'data_hora_formatada',
        ]
        read_only_fields = fields
    
    def get_data_hora_formatada(self, obj):
        """Retorna data/hora em formato brasileiro"""
        from django.utils import timezone
        # Converter para timezone local
        local_time = timezone.localtime(obj.data_hora)
        return local_time.strftime('%d/%m/%Y %H:%M:%S')


# --- Serializer TabelaComercial ---
class TabelaComercialSerializer(serializers.ModelSerializer):
    """Serializer para Tabelas Comerciais"""

    class Meta:
        from .models import TabelaComercial
        model = TabelaComercial
        fields = [
            'id_tabela_comercial',
            'nome',
            'percentual',
            'ativo',
            'padrao',
            'perguntar_ao_vender',
            'data_criacao',
            'data_atualizacao',
        ]
        read_only_fields = ['data_criacao', 'data_atualizacao']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for key, value in data.items():
            if isinstance(value, str):
                data[key] = sanitize_field(value)
        return data


# --- Serializer para Status de Ordem de Serviço ---
class StatusOrdemServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusOrdemServico
        fields = [
            'id_status',
            'nome_status',
            'descricao',
            'cor',
            'ordem',
            'ativo',
            'padrao',
            'gera_financeiro',
            'permite_editar',
            'permite_excluir',
            'data_criacao',
            'data_atualizacao',
        ]
        read_only_fields = ['data_criacao', 'data_atualizacao']


# ===========================
# SERIALIZERS DE CHEQUE
# ===========================

class ChequeSerializer(serializers.ModelSerializer):
    # Campos calculados
    dias_vencimento = serializers.ReadOnlyField()
    esta_vencido = serializers.ReadOnlyField()
    nome_pessoa = serializers.ReadOnlyField()
    
    # Dados aninhados para leitura
    cliente_nome = serializers.CharField(source='id_cliente.nome_razao_social', read_only=True)
    fornecedor_nome = serializers.CharField(source='id_fornecedor.nome_razao_social', read_only=True)
    conta_bancaria_nome = serializers.CharField(source='id_conta_bancaria.nome_conta', read_only=True)
    usuario_nome = serializers.CharField(source='usuario_cadastro.username', read_only=True)
    
    class Meta:
        from .models import Cheque
        model = Cheque
        fields = [
            'id_cheque',
            'tipo',
            'numero_cheque',
            'banco',
            'agencia',
            'conta',
            'emitente',
            'cpf_cnpj_emitente',
            'valor',
            'data_emissao',
            'data_vencimento',
            'data_deposito',
            'data_compensacao',
            'status',
            'id_cliente',
            'cliente_nome',
            'id_fornecedor',
            'fornecedor_nome',
            'id_conta_bancaria',
            'conta_bancaria_nome',
            'id_venda',
            'id_compra',
            'observacoes',
            'imagem_cheque',
            'data_cadastro',
            'data_atualizacao',
            'usuario_cadastro',
            'usuario_nome',
            'dias_vencimento',
            'esta_vencido',
            'nome_pessoa',
        ]
        read_only_fields = ['id_cheque', 'data_cadastro', 'data_atualizacao', 'usuario_cadastro']
    
    def validate(self, data):
        """Validações customizadas"""
        # Se tipo é receber, deve ter cliente
        if data.get('tipo') == 'receber' and not data.get('id_cliente'):
            if not data.get('emitente'):
                raise serializers.ValidationError({
                    'id_cliente': 'Cheque a receber deve ter cliente ou emitente'
                })
        
        # Se tipo é pagar, deve ter fornecedor
        if data.get('tipo') == 'pagar' and not data.get('id_fornecedor'):
            raise serializers.ValidationError({
                'id_fornecedor': 'Cheque a pagar deve ter fornecedor'
            })
        
        # Data vencimento não pode ser menor que data emissão
        if data.get('data_vencimento') and data.get('data_emissao'):
            if data['data_vencimento'] < data['data_emissao']:
                raise serializers.ValidationError({
                    'data_vencimento': 'Data de vencimento não pode ser anterior à data de emissão'
                })
        
        return data


# =====================================================
# SERIALIZERS DE ALUGUEL DE EQUIPAMENTOS
# =====================================================

from .models import Equipamento, Aluguel, AluguelItem, ConfiguracaoContrato

class EquipamentoSerializer(serializers.ModelSerializer):
    """Serializer para Equipamentos"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Equipamento
        fields = [
            'id_equipamento',
            'codigo',
            'nome',
            'descricao',
            'categoria',
            'marca',
            'modelo',
            'numero_serie',
            'status',
            'status_display',
            'valor_diaria',
            'valor_semanal',
            'valor_mensal',
            'imagem_url',
            'observacoes',
            'data_cadastro',
            'data_atualizacao',
        ]
        read_only_fields = ['id_equipamento', 'data_cadastro', 'data_atualizacao']
    
    def validate_codigo(self, value):
        """Valida se o código é único"""
        if self.instance:
            # Em atualização, verifica se o código mudou
            if Equipamento.objects.exclude(id_equipamento=self.instance.id_equipamento).filter(codigo=value).exists():
                raise serializers.ValidationError('Já existe um equipamento com este código')
        else:
            # Em criação, verifica se já existe
            if Equipamento.objects.filter(codigo=value).exists():
                raise serializers.ValidationError('Já existe um equipamento com este código')
        return value
    
    def validate_valor_diaria(self, value):
        """Valida se o valor da diária é positivo"""
        if value <= 0:
            raise serializers.ValidationError('O valor da diária deve ser maior que zero')
        return value
    
    def validate_numero_serie(self, value):
        """Converte string vazia em None para evitar duplicação"""
        if value == '' or value is None:
            return None
        
        # Valida unicidade se fornecido
        if self.instance:
            if Equipamento.objects.exclude(id_equipamento=self.instance.id_equipamento).filter(numero_serie=value).exists():
                raise serializers.ValidationError('Já existe um equipamento com este número de série')
        else:
            if Equipamento.objects.filter(numero_serie=value).exists():
                raise serializers.ValidationError('Já existe um equipamento com este número de série')
        
        return value


class AluguelItemSerializer(serializers.ModelSerializer):
    """Serializer para itens de aluguel"""
    
    equipamento_nome = serializers.CharField(source='id_equipamento.nome', read_only=True)
    equipamento_codigo = serializers.CharField(source='id_equipamento.codigo', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    dias_atraso = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = AluguelItem
        fields = [
            'id_item',
            'id_equipamento',
            'equipamento_nome',
            'equipamento_codigo',
            'data_devolucao_prevista',
            'data_devolucao_real',
            'quantidade_dias',
            'valor_diaria',
            'valor_total',
            'valor_multa',
            'status',
            'status_display',
            'dias_atraso',
            'observacoes',
        ]
        read_only_fields = ['id_item', 'valor_total']
    
    def validate_id_equipamento(self, value):
        """Valida se o equipamento está disponível"""
        if value.status != 'disponivel':
            raise serializers.ValidationError(f'Equipamento {value.codigo} não está disponível.')
        return value


class AluguelSerializer(serializers.ModelSerializer):
    """Serializer para criação e edição de aluguéis com múltiplos itens"""
    
    itens = AluguelItemSerializer(many=True)
    id_usuario = serializers.PrimaryKeyRelatedField(read_only=True)
    cliente_nome = serializers.CharField(source='id_cliente.nome_razao_social', read_only=True)
    usuario_nome = serializers.CharField(source='id_usuario.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Aluguel
        fields = [
            'id_aluguel',
            'numero_aluguel',
            'id_cliente',
            'cliente_nome',
            'data_inicio',
            'data_fim_prevista',
            'valor_total',
            'valor_multa',
            'valor_desconto',
            'valor_final',
            'status',
            'status_display',
            'id_usuario',
            'usuario_nome',
            'observacoes',
            'data_cadastro',
            'data_atualizacao',
            'itens',
        ]
        read_only_fields = ['id_aluguel', 'numero_aluguel', 'valor_total', 'valor_final', 'data_cadastro', 'data_atualizacao']
    
    def validate(self, data):
        """Validação customizada"""
        # Valida datas
        data_inicio = data.get('data_inicio')
        data_fim = data.get('data_fim_prevista')
        
        if data_inicio and data_fim and data_fim < data_inicio:
            raise serializers.ValidationError({
                'data_fim_prevista': 'Data de fim não pode ser anterior à data de início.'
            })
        
        # Valida itens
        itens = data.get('itens', [])
        if not itens:
            raise serializers.ValidationError({'itens': 'É necessário adicionar pelo menos um equipamento.'})
        
        # Verifica equipamentos duplicados
        equipamentos_ids = [item['id_equipamento'].id_equipamento for item in itens]
        if len(equipamentos_ids) != len(set(equipamentos_ids)):
            raise serializers.ValidationError({'itens': 'Não é possível adicionar o mesmo equipamento mais de uma vez.'})
        
        return data


# ====================================================
# Serializers para Mapa de Carga (Logística)
# ====================================================

class MapaCargaItemSerializer(serializers.ModelSerializer):
    """Serializer para itens do mapa de carga"""
    venda_numero = serializers.CharField(source='id_venda.numero_documento', read_only=True)
    cliente_nome = serializers.CharField(source='id_venda.id_cliente.nome_razao_social', read_only=True)
    cliente_endereco = serializers.CharField(source='id_venda.id_cliente.endereco', read_only=True)
    cliente_bairro = serializers.CharField(source='id_venda.id_cliente.bairro', read_only=True)
    cliente_cidade = serializers.CharField(source='id_venda.id_cliente.cidade', read_only=True)
    valor_venda = serializers.DecimalField(source='id_venda.valor_total', max_digits=15, decimal_places=2, read_only=True)
    peso_bruto_venda = serializers.DecimalField(source='id_venda.peso_bruto', max_digits=12, decimal_places=3, read_only=True)
    numero_nfe = serializers.CharField(source='id_venda.numero_nfe', read_only=True)
    serie_nfe = serializers.CharField(source='id_venda.serie_nfe', read_only=True)
    chave_nfe = serializers.CharField(source='id_venda.chave_nfe', read_only=True)
    status_nfe = serializers.CharField(source='id_venda.status_nfe', read_only=True)
    placa_veiculo = serializers.CharField(source='id_venda.placa_veiculo', read_only=True)
    
    class Meta:
        model = MapaCargaItem
        fields = [
            'id_item_mapa',
            'id_mapa',
            'id_venda',
            'venda_numero',
            'cliente_nome',
            'cliente_endereco',
            'cliente_bairro',
            'cliente_cidade',
            'valor_venda',
            'peso_bruto_venda',
            'numero_nfe',
            'serie_nfe',
            'chave_nfe',
            'status_nfe',
            'placa_veiculo',
            'ordem_entrega',
            'distancia_km',
            'data_entrega_prevista',
            'data_entrega_realizada',
            'status_entrega',
            'observacoes_entrega',
        ]
        read_only_fields = ['id_item_mapa']


class MapaCargaSerializer(serializers.ModelSerializer):
    """Serializer para mapa de carga"""
    veiculo_placa = serializers.CharField(source='id_veiculo.placa', read_only=True)
    veiculo_modelo = serializers.SerializerMethodField()
    veiculo_marca = serializers.CharField(source='id_veiculo.marca', read_only=True, allow_null=True)
    motorista_nome = serializers.CharField(source='id_motorista.nome', read_only=True)
    mdfe_numero = serializers.CharField(source='id_mdfe.numero_mdfe', read_only=True, allow_null=True)
    itens = MapaCargaItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = MapaCarga
        fields = [
            'id_mapa',
            'numero_mapa',
            'data_criacao',
            'data_saida',
            'data_retorno',
            'id_veiculo',
            'veiculo_placa',
            'veiculo_modelo',
            'veiculo_marca',
            'id_motorista',
            'motorista_nome',
            'peso_total_kg',
            'valor_total_carga',
            'quantidade_entregas',
            'distancia_total_km',
            'status',
            'id_mdfe',
            'mdfe_numero',
            'observacoes',
            'itens',
        ]
        read_only_fields = ['id_mapa', 'numero_mapa', 'data_criacao', 'peso_total_kg', 'valor_total_carga', 'quantidade_entregas']

    def get_veiculo_modelo(self, obj):
        if not obj.id_veiculo:
            return None
        v = obj.id_veiculo
        partes = [p for p in [v.marca, v.modelo, str(v.ano) if v.ano else None] if p]
        return ' '.join(partes) if partes else v.placa


# ====================================================
# Serializers para Integração Bancária (Boletos)
# ====================================================

class ConfiguracaoBancariaSerializer(serializers.ModelSerializer):
    """Serializer para configuração bancária"""
    banco_nome = serializers.CharField(source='get_banco_display', read_only=True)
    ambiente_nome = serializers.CharField(source='get_ambiente_display', read_only=True)
    conta_bancaria_descricao = serializers.CharField(source='id_conta_bancaria.descricao', read_only=True)
    token_valido = serializers.SerializerMethodField()
    
    class Meta:
        model = ConfiguracaoBancaria
        fields = [
            'id_config',
            'nome_configuracao',
            'id_conta_bancaria',
            'conta_bancaria_descricao',
            'banco',
            'banco_nome',
            'client_id',
            'client_secret',
            'url_autenticacao',
            'url_api_boletos',
            'codigo_banco',
            'agencia',
            'conta',
            'convenio',
            'dias_protesto',
            'dias_baixa',
            'percentual_multa',
            'percentual_juros_dia',
            'ambiente',
            'ambiente_nome',
            'ativo',
            'baixa_automatica_api',
            'gerar_boleto_automatico',
            'token_valido',
            'data_cadastro',
        ]
        read_only_fields = ['id_config', 'data_cadastro', 'token_valido']
        extra_kwargs = {
            'client_secret': {'write_only': True},  # Nunca retorna o secret
            'access_token': {'write_only': True},
            'refresh_token': {'write_only': True},
        }
    
    def get_token_valido(self, obj):
        """Verifica se o token ainda é válido"""
        if obj.token_expira_em:
            return obj.token_expira_em > timezone.now()
        return False


class BoletoSerializer(serializers.ModelSerializer):
    """Serializer para boletos"""
    conta_numero = serializers.CharField(source='id_conta.numero_documento', read_only=True)
    conta_cliente = serializers.CharField(source='id_conta.id_cliente.nome_razao_social', read_only=True)
    conta_vencimento = serializers.DateField(source='id_conta.data_vencimento', read_only=True)
    banco_nome = serializers.CharField(source='id_config_bancaria.get_banco_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    usuario_baixa_nome = serializers.CharField(source='usuario_baixa.get_full_name', read_only=True, allow_null=True)
    dias_vencido = serializers.SerializerMethodField()
    valor_atualizado = serializers.SerializerMethodField()
    
    class Meta:
        model = Boleto
        fields = [
            'id_boleto',
            'id_conta',
            'conta_numero',
            'conta_cliente',
            'conta_vencimento',
            'id_config_bancaria',
            'banco_nome',
            'nosso_numero',
            'numero_documento',
            'codigo_barras',
            'linha_digitavel',
            'pagador_nome',
            'pagador_cpf_cnpj',
            'pagador_endereco',
            'pagador_complemento',
            'pagador_bairro',
            'pagador_cidade',
            'pagador_uf',
            'pagador_cep',
            'pagador_codigo_ibge',
            'valor_nominal',
            'valor_multa',
            'valor_juros',
            'valor_desconto',
            'valor_pago',
            'valor_atualizado',
            'data_emissao',
            'data_vencimento',
            'data_pagamento',
            'data_registro_banco',
            'status',
            'status_display',
            'dias_vencido',
            'baixado_via_api',
            'data_baixa_api',
            'usuario_baixa',
            'usuario_baixa_nome',
            'url_boleto',
            'pix_qr_code',
            'pix_emv',
            'pix_txid',
            'mensagem_banco',
            'dados_retorno_json',
        ]
        read_only_fields = [
            'id_boleto',
            'nosso_numero',
            'codigo_barras',
            'linha_digitavel',
            'data_registro_banco',
            'url_boleto',
            'pix_qr_code',
            'pix_emv',
            'pix_txid',
            'dados_retorno_json',
            'dias_vencido',
            'valor_atualizado',
            'baixado_via_api',
            'data_baixa_api',
            'usuario_baixa',
            'usuario_baixa_nome',
        ]
    
    def get_dias_vencido(self, obj):
        """Calcula dias de atraso"""
        if obj.status in ['PAGO', 'CANCELADO', 'BAIXADO']:
            return 0
        
        hoje = timezone.now().date()
        if obj.data_vencimento < hoje:
            return (hoje - obj.data_vencimento).days
        return 0
    
    def get_valor_atualizado(self, obj):
        """Calcula valor atualizado com juros e multa"""
        if obj.status == 'PAGO':
            return float(obj.valor_pago or 0)
        
        valor = float(obj.valor_nominal)
        dias_vencido = self.get_dias_vencido(obj)
        
        if dias_vencido > 0:
            valor += float(obj.valor_multa or 0)
            valor += float(obj.valor_juros or 0) * dias_vencido
        
        valor -= float(obj.valor_desconto or 0)
        
        return round(valor, 2)
    
    def create(self, validated_data):
        """Cria aluguel e seus itens"""
        from datetime import date
        
        itens_data = validated_data.pop('itens')
        
        # Gera número do aluguel
        ano_atual = date.today().year
        ultimo_aluguel = Aluguel.objects.filter(
            numero_aluguel__startswith=f'ALG{ano_atual}'
        ).order_by('-numero_aluguel').first()
        
        if ultimo_aluguel:
            ultimo_numero = int(ultimo_aluguel.numero_aluguel[-4:])
            proximo_numero = ultimo_numero + 1
        else:
            proximo_numero = 1
        
        validated_data['numero_aluguel'] = f'ALG{ano_atual}{proximo_numero:04d}'
        
        # Cria o aluguel
        aluguel = Aluguel.objects.create(**validated_data)
        
        # Cria os itens
        valor_total = 0
        for item_data in itens_data:
            equipamento = item_data['id_equipamento']
            
            # Cria o item
            item = AluguelItem.objects.create(
                id_aluguel=aluguel,
                **item_data
            )
            valor_total += item.valor_total
            
            # Atualiza status do equipamento
            equipamento.status = 'alugado'
            equipamento.save()
        
        # Atualiza totais do aluguel
        aluguel.valor_total = valor_total
        aluguel.calcular_valor_final()
        aluguel.save()
        
        return aluguel
    
    def update(self, instance, validated_data):
        """Atualiza aluguel"""
        itens_data = validated_data.pop('itens', None)
        
        # Atualiza o aluguel
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Se forneceu novos itens, atualiza
        if itens_data is not None:
            # Remove itens antigos e libera equipamentos
            instance.itens.all().delete()
            
            # Cria novos itens
            for item_data in itens_data:
                AluguelItem.objects.create(id_aluguel=instance, **item_data)
        
        # Recalcula totais
        instance.calcular_totais()
        instance.save()
        
        return instance


class AluguelListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de aluguéis"""
    
    cliente_nome = serializers.CharField(source='id_cliente.nome_razao_social', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tem_financeiro = serializers.SerializerMethodField()
    total_itens = serializers.SerializerMethodField()
    itens_ativos = serializers.SerializerMethodField()
    
    def get_tem_financeiro(self, obj):
        """Verifica se o aluguel tem financeiro gerado"""
        from .models import FinanceiroConta
        return FinanceiroConta.objects.filter(id_aluguel_origem=obj.id_aluguel).exists()
    
    def get_total_itens(self, obj):
        """Retorna total de itens"""
        return obj.itens.count()
    
    def get_itens_ativos(self, obj):
        """Retorna quantidade de itens ativos (não devolvidos)"""
        return obj.itens.filter(status='ativo').count()
    
    class Meta:
        model = Aluguel
        fields = [
            'id_aluguel',
            'numero_aluguel',
            'cliente_nome',
            'data_inicio',
            'data_fim_prevista',
            'valor_total',
            'valor_final',
            'status',
            'status_display',
            'tem_financeiro',
            'total_itens',
            'itens_ativos',
        ]


class ConfiguracaoContratoSerializer(serializers.ModelSerializer):
    """Serializer para configuração de contratos"""
    
    class Meta:
        model = ConfiguracaoContrato
        fields = '__all__'
        read_only_fields = ['id_configuracao', 'data_criacao', 'data_atualizacao']


from .models import Veiculo

class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = '__all__'


from .models import VeiculoNovo

class VeiculoNovoSerializer(serializers.ModelSerializer):
    """
    Serializer para dados de Veículo Novo (grupo veicProd da NF-e 4.0).
    Vinculado a um VendaItem via id_venda_item.
    """
    class Meta:
        model = VeiculoNovo
        fields = '__all__'
        read_only_fields = ['id_veiculo_novo', 'data_cadastro', 'data_atualizacao']


class UserAtalhoSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import UserAtalho
        model = UserAtalho
        fields = ['id_atalho', 'user', 'tecla', 'caminho', 'descricao', 'criado_em', 'atualizado_em']
        read_only_fields = ['id_atalho', 'user', 'criado_em', 'atualizado_em']


class ConfiguracaoImpressaoSerializer(serializers.ModelSerializer):
    modulo_display = serializers.CharField(source='get_modulo_display', read_only=True)
    tipo_impressora_display = serializers.CharField(source='get_tipo_impressora_display', read_only=True)

    class Meta:
        from .models import ConfiguracaoImpressao
        model = ConfiguracaoImpressao
        fields = [
            'id',
            'modulo',
            'modulo_display',
            'tipo_impressora',
            'tipo_impressora_display',
            'largura_termica',
            'imprimir_automatico',
            'mostrar_logo',
            'copias',
            'observacao_rodape',
            'atualizado_em',
        ]
        read_only_fields = ['id', 'atualizado_em']






