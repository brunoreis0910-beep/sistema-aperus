from rest_framework import viewsets, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, IntegrityError
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from .models import Compra, CompraItem, Produto, Operacao, Estoque, FinanceiroConta
from django.utils import timezone
from .services.venda_financeiro import ensure_financeiro_for_venda


class CompraItemSerializer(serializers.ModelSerializer):
    id_produto = serializers.PrimaryKeyRelatedField(queryset=Produto.objects.all(), required=False, allow_null=True)
    # Aceita tanto valor_unitario (frontend) quanto valor_compra (backend)
    valor_unitario = serializers.DecimalField(max_digits=15, decimal_places=6, required=False, write_only=True, coerce_to_string=False)

    class Meta:
        model = CompraItem
        fields = ['id_item', 'id_produto', 'quantidade', 'valor_compra', 'valor_unitario', 'valor_total', 'desconto']
    
    def to_representation(self, instance):
        """Adiciona valor_unitario como alias de valor_compra na saída"""
        representation = super().to_representation(instance)
        # Inclui valor_unitario como alias de valor_compra para compatibilidade com frontend
        representation['valor_unitario'] = representation.get('valor_compra')
        # Retorna fração salva para o frontend restaurar os campos de fração
        fracao = instance.fracao_aplicada
        qtd_fracionada = instance.quantidade_fracionada
        representation['fracao_memorizada'] = float(fracao) if fracao is not None else 1
        representation['quantidade_com_fracao'] = float(qtd_fracionada) if qtd_fracionada is not None else None
        return representation
    
    def to_internal_value(self, data):
        """Garante que todos os valores numéricos sejam Decimal"""
        print(f'[DEBUG SERIALIZER] to_internal_value chamado com data: {data}')
        
        # Mantém campos extras do frontend para uso no create/update
        # mas o DRF não vai tentar mapeá-los para o modelo
        internal_value = super().to_internal_value(data)

        # Adiciona os campos extras de volta para que fiquem disponíveis no `validated_data`
        if 'fracao_memorizada' in data:
            internal_value['fracao_memorizada'] = data['fracao_memorizada']
        if '_ean' in data:
            internal_value['_ean'] = data['_ean']
            
        print(f'[DEBUG SERIALIZER] to_internal_value retornou: {internal_value}')
        return internal_value


class CompraSerializer(serializers.ModelSerializer):
    itens = CompraItemSerializer(many=True)
    id_operacao = serializers.PrimaryKeyRelatedField(queryset=Operacao.objects.all())
    data_documento = serializers.DateTimeField(required=False, default=timezone.now)
    data_entrada = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Compra
        fields = ['id_compra', 'id_operacao', 'id_fornecedor', 'numero_documento', 'data_documento', 'data_entrada', 'dados_entrada', 'xml_conteudo', 'valor_total', 'valor_desconto', 'itens']
        read_only_fields = ['id_compra']

    def to_representation(self, instance):
        """Inclui os itens e dados relacionados na resposta de listagem"""
        representation = super().to_representation(instance)
        
        # Busca os itens relacionados usando o related_name correto
        if hasattr(instance, 'itens'):
            itens = instance.itens.all()
            representation['itens'] = CompraItemSerializer(itens, many=True).data
        
        # Adiciona nome do fornecedor (sempre, mesmo se None)
        if instance.id_fornecedor:
            representation['fornecedor_nome'] = instance.id_fornecedor.nome_fantasia or instance.id_fornecedor.nome_razao_social or ''
        else:
            representation['fornecedor_nome'] = ''
        
        # Adiciona nome e abreviação da operação (sempre, mesmo se None)
        if instance.id_operacao:
            representation['operacao_nome'] = instance.id_operacao.nome_operacao or ''
            representation['operacao_abreviacao'] = instance.id_operacao.abreviacao or ''
        else:
            representation['operacao_nome'] = ''
            representation['operacao_abreviacao'] = ''
        
        return representation

    def validate(self, data):
        """Valida dados antes de salvar"""
        dados = data.get('dados_entrada')
        if dados:
            qs = Compra.objects.filter(dados_entrada=dados)
            if self.instance:  # edição - exclui o próprio registro
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({'dados_entrada': 'Chave NF-e já existe no sistema.'})
        return data

    def create(self, validated_data):
        print("[SERIALIZER_CREATE_v3] Iniciando create do serializer")
        print(f"[SERIALIZER_CREATE_v3] validated_data completo: {validated_data}")
        print(f"[SERIALIZER_CREATE_v3] id_fornecedor: {validated_data.get('id_fornecedor')}")
        import traceback
        from .models import Estoque
        
        try:
            itens_data = validated_data.pop('itens', [])
            data_documento = validated_data.get('data_documento', None)
            data_entrada = validated_data.get('data_entrada', None)  # Não remove com pop
            print(f"[SERIALIZER_CREATE_v3] itens: {len(itens_data)}, data_documento: {data_documento}, data_entrada: {data_entrada}")
            print(f"[SERIALIZER_CREATE_v3] Após pop - id_fornecedor: {validated_data.get('id_fornecedor')}")
        except Exception as e:
            print(f"[SERIALIZER_CREATE_v3] ERRO ao processar validated_data: {e}")
            traceback.print_exc()
            raise

        # Se `data_documento` não foi fornecida, tente derivar de `data_entrada` (formato 'YYYY-MM-DD')
        # ou usar o horário atual como fallback.
        if not data_documento:
            from datetime import datetime
            try:
                if data_entrada:
                    # Aceita date/datetime ou string ISO 'YYYY-MM-DD' ou 'YYYY-MM-DDTHH:MM:SS'
                    if isinstance(data_entrada, str):
                        # Tenta parse ISOfirst, depois fallback para dd/mm/yyyy
                        try:
                            parsed = datetime.fromisoformat(data_entrada)
                        except Exception:
                            try:
                                parsed = datetime.strptime(data_entrada, '%d/%m/%Y')
                            except Exception:
                                parsed = None
                    else:
                        # data_entrada pode ser date/datetime
                        try:
                            parsed = datetime.combine(data_entrada, datetime.min.time())
                        except Exception:
                            parsed = None

                    if parsed:
                        # Garantir timezone-aware quando possível
                        try:
                            if timezone.is_naive(parsed):
                                parsed = timezone.make_aware(parsed)
                        except Exception:
                            pass
                        data_documento = parsed
                    else:
                        data_documento = timezone.now()
                else:
                    data_documento = timezone.now()
            except Exception:
                data_documento = timezone.now()
        operacao = validated_data.get('id_operacao', None)
        
        validated_data['data_documento'] = data_documento
        
        # Garante que data_entrada está no validated_data
        if 'data_entrada' not in validated_data or not validated_data['data_entrada']:
            from datetime import date
            validated_data['data_entrada'] = date.today()
        
        with transaction.atomic():
            try:
                compra = Compra.objects.create(**validated_data)
            except IntegrityError as ie:
                detail = str(ie)
                if 'chave_nfe' in detail.lower() or 'dados_entrada' in detail.lower():
                    raise serializers.ValidationError({'dados_entrada': 'Chave NF-e já existe no sistema.'})
                raise

            total = Decimal('0.00')
            desconto_total = Decimal('0.00')
            
            for item in itens_data:
                print(f'[DEBUG] Item recebido: {item}')
                produto = item.get('id_produto')

                # Frontend envia 'quantidade' e 'valor_unitario' como da NF.
                # O backend deve calcular a quantidade de estoque e o custo unitário de estoque.
                
                qtd_nf = Decimal(str(item.get('quantidade', '0')))
                valor_unit_nf = Decimal(str(item.get('valor_unitario', '0')))
                fracao = Decimal(str(item.get('fracao_memorizada', '1')))
                desconto = Decimal(str(item.get('desconto', '0')))

                # Calcula a quantidade que vai para o estoque
                qtd_estoque = qtd_nf * fracao
                
                # Calcula o custo unitário para o estoque
                # Se a fração for > 1, o custo unitário é dividido.
                # Ex: Caixa com 6 custa R$60 (valor_unit_nf). Custo por unidade é R$10.
                custo_unit_estoque = valor_unit_nf / fracao if fracao > 1 else valor_unit_nf
                
                # O valor total do item na compra é sempre baseado nos valores da NF
                valor_total_item = (qtd_nf * valor_unit_nf) - desconto

                print(f'[DEBUG_CALC] Qtd NF: {qtd_nf}, Vlr Unit NF: {valor_unit_nf}, Fração: {fracao}')
                print(f'[DEBUG_CALC] -> Qtd Estoque: {qtd_estoque}, Custo Unit Estoque: {custo_unit_estoque}')
                print(f'[DEBUG_CALC] -> Valor Total Item: {valor_total_item}')

                # Preparar dados do item para salvar no banco
                item_data = {
                    'id_compra': compra,
                    'id_produto': produto,
                    'quantidade': qtd_estoque,          # Salva a quantidade convertida para o estoque
                    'valor_compra': custo_unit_estoque, # Salva o custo unitário de estoque
                    'valor_total': valor_total_item,    # Valor total do item (baseado na NF)
                    'desconto': desconto,
                    'fracao_aplicada': fracao,
                    'quantidade_fracionada': qtd_estoque if fracao > 1 else None,
                }
                
                print(f'[DEBUG_CREATE] Criando item - {item_data}')
                CompraItem.objects.create(**item_data)
                print('[DEBUG_CREATE] Item criado com sucesso!')

                # Salvar/atualizar fração por fornecedor+produto quando fracao > 1
                ean_val = item.get('_ean') or '' # O _ean é passado pelo frontend
                if fracao > 1 and produto and compra.id_fornecedor and ean_val:
                    try:
                        from .models import FornecedorProdutoFracao
                        FornecedorProdutoFracao.objects.update_or_create(
                            fornecedor=compra.id_fornecedor,
                            produto=produto,
                            gtin=ean_val,
                            defaults={'fracao': fracao}
                        )
                        print(f'[FRACAO] Fração {fracao} salva para Fornecedor {compra.id_fornecedor.id} e Produto {produto.id}')
                    except Exception as _fe:
                        print(f'[FRACAO] erro ao salvar fracao: {_fe}')
                
                # Acumula totais
                total += valor_total_item
                desconto_total += desconto
                print(f'[DEBUG_TOTAL] Total acumulado: {total}, Desconto total: {desconto_total}')

                # Atualiza estoque
                if produto and operacao:
                    print(f'[DEBUG_IF] Entrando no if - produto: {produto}, operacao: {operacao}')
                    deposito_id = getattr(operacao, 'id_deposito_incremento', None) or 1
                    print(f'[DEBUG_IF] deposito_id: {deposito_id}')
                    print(f'[DEBUG_ANTES_QUERY] Vai buscar estoque - produto.pk={produto.pk}, deposito_id={deposito_id}')

                    try:
                        estoque_obj = Estoque.objects.get(
                            id_produto=produto,
                            id_deposito_id=deposito_id
                        )
                        print(f'[DEBUG_ESTOQUE] Estoque encontrado - Qtd atual: {estoque_obj.quantidade} ({type(estoque_obj.quantidade)})')
                        
                        qtd_estoque_atual = estoque_obj.quantidade or Decimal('0.000')
                        custo_medio_atual = estoque_obj.custo_medio or Decimal('0.0000')
                        
                        print(f'[DEBUG_ESTOQUE] Tipo antes de Decimal(): {type(qtd_estoque_atual)}')
                        
                        qtd_estoque_decimal = Decimal(str(qtd_estoque_atual))
                        print(f'[DEBUG_ESTOQUE] Tipo depois de Decimal(): {type(qtd_estoque_decimal)}')
                        print(f'[DEBUG_ESTOQUE] quantidade a adicionar: {qtd_estoque} ({type(qtd_estoque)})')
                        
                        nova_quantidade = qtd_estoque_decimal + qtd_estoque
                        print(f'[DEBUG_ESTOQUE] Nova quantidade calculada: {nova_quantidade} ({type(nova_quantidade)})')
                        
                        # Calcula novo custo médio ponderado
                        valor_estoque_atual = qtd_estoque_decimal * custo_medio_atual
                        valor_nova_compra = qtd_estoque * custo_unit_estoque
                        novo_custo_medio = (valor_estoque_atual + valor_nova_compra) / nova_quantidade if nova_quantidade > 0 else custo_unit_estoque
                        
                        estoque_obj.quantidade = nova_quantidade
                        estoque_obj.custo_medio = novo_custo_medio.quantize(Decimal('0.0001'))
                        estoque_obj.valor_ultima_compra = custo_unit_estoque
                        estoque_obj.valor_total = nova_quantidade * novo_custo_medio
                        estoque_obj.save()
                        print(f'[DEBUG_ESTOQUE] Estoque atualizado - Custo médio: {novo_custo_medio}, Última compra: {custo_unit_estoque}')
                    except Estoque.DoesNotExist:
                        print(f'[DEBUG_ESTOQUE] Estoque não existe, criando novo')
                        print(f'[DEBUG_ESTOQUE_CREATE] Vai criar - produto={produto} (tipo: {type(produto)})')
                        print(f'[DEBUG_ESTOQUE_CREATE] deposito_id={deposito_id} (tipo: {type(deposito_id)})')
                        print(f'[DEBUG_ESTOQUE_CREATE] quantidade={qtd_estoque} (tipo: {type(qtd_estoque)})')
                        
                        Estoque.objects.create(
                            id_produto=produto,
                            id_deposito_id=deposito_id,
                            quantidade=qtd_estoque,
                            custo_medio=custo_unit_estoque,
                            valor_ultima_compra=custo_unit_estoque,
                            valor_total=qtd_estoque * custo_unit_estoque
                        )
                        print(f'[DEBUG_ESTOQUE] Novo estoque criado com custo médio: {custo_unit_estoque}')
            compra.save()

            # Verifica se operação gera financeiro
            gerou_financeiro = getattr(operacao, 'gera_financeiro', False)
            
            # Cria financeiro se configurado (será "Pagar" para compras)
            if gerou_financeiro:
                try:
                    # O serializer pode receber o request via context em views (get_serializer)
                    req = self.context.get('request') if hasattr(self, 'context') else None
                    payload = req.data if getattr(req, 'data', None) is not None else {}
                    created, pk, err = ensure_financeiro_for_venda(compra, payload=payload)
                    if created:
                        gerou_financeiro = True
                except Exception as fin_ex:
                    print(f'[DEBUG_FINANCEIRO] erro ao criar financeiro: {fin_ex}')

            # Retorna dados simples para evitar erro de serialização
            return {
                'id_compra': compra.pk,
                'numero_documento': compra.numero_documento or '',
                'valor_total': str(compra.valor_total),
                'data_entrada': str(data_entrada) if data_entrada else str(data_documento.date()),
                'gerou_financeiro': gerou_financeiro,
                'mensagem': 'Compra criada com sucesso'
            }

    def update(self, instance, validated_data):
        """Atualiza uma compra existente - apenas se não houver financeiros pagos"""
        
        # Verificar se há financeiros pagos ou liquidados
        financeiros = FinanceiroConta.objects.filter(id_compra_origem=instance.id_compra)
        if financeiros.filter(status_conta__in=['Paga', 'Liquidado']).exists():
            raise serializers.ValidationError(
                'Não é possível editar compra com contas financeiras pagas ou liquidadas.'
            )
        
        # Extrair itens do validated_data
        itens_data = validated_data.pop('itens', [])
        
        # Determinar depósito da operação atual (antes de atualizar)
        operacao_atual = instance.id_operacao
        deposito_id = getattr(operacao_atual, 'id_deposito_incremento', None) or 1

        # Reverter estoque dos itens antigos
        with transaction.atomic():
            for item_antigo in instance.itens.all():
                estoque = Estoque.objects.filter(id_produto=item_antigo.id_produto, id_deposito_id=deposito_id).first()
                if estoque:
                    # Reverter quantidade antiga
                    qtd_antiga = Decimal(str(item_antigo.quantidade))
                    valor_antigo = Decimal(str(item_antigo.valor_compra))
                    
                    nova_quantidade = estoque.quantidade - qtd_antiga
                    
                    if nova_quantidade > 0:
                        # Recalcular custo médio removendo a compra antiga
                        valor_total_atual = estoque.valor_total or Decimal('0')
                        valor_compra_antiga = qtd_antiga * valor_antigo
                        novo_valor_total = valor_total_atual - valor_compra_antiga
                        novo_custo_medio = novo_valor_total / nova_quantidade if nova_quantidade > 0 else Decimal('0')
                        
                        estoque.quantidade = nova_quantidade
                        estoque.custo_medio = novo_custo_medio.quantize(Decimal('0.0001'))
                        estoque.valor_total = novo_valor_total
                    else:
                        estoque.quantidade = Decimal('0')
                        estoque.custo_medio = Decimal('0')
                        estoque.valor_total = Decimal('0')
                    
                    estoque.save()
            
            # Deletar itens antigos
            instance.itens.all().delete()
            
            # Atualizar dados da compra
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            # Depósito da nova operação (pode ter mudado)
            nova_operacao = instance.id_operacao
            novo_deposito_id = getattr(nova_operacao, 'id_deposito_incremento', None) or 1

            # Adicionar novos itens e atualizar estoque
            for item_data in itens_data:
                # Extrair campos extras que não pertencem ao modelo CompraItem
                fracao_memorizada = item_data.pop('fracao_memorizada', None)
                quantidade_com_fracao = item_data.pop('quantidade_com_fracao', None)

                # Mapear valor_unitario → valor_compra (alias do frontend)
                if 'valor_unitario' in item_data:
                    item_data['valor_compra'] = item_data.pop('valor_unitario')

                # Salvar fração nos campos corretos do modelo
                if quantidade_com_fracao is not None:
                    try:
                        item_data['quantidade_fracionada'] = Decimal(str(quantidade_com_fracao)).quantize(Decimal('0.001'), rounding=ROUND_HALF_UP)
                    except (InvalidOperation, TypeError):
                        pass
                if fracao_memorizada is not None:
                    try:
                        item_data['fracao_aplicada'] = Decimal(str(fracao_memorizada)).quantize(Decimal('0.001'), rounding=ROUND_HALF_UP)
                    except (InvalidOperation, TypeError):
                        pass

                CompraItem.objects.create(id_compra=instance, **item_data)

                # Salvar/atualizar fração por fornecedor+produto quando fracao > 1
                if fracao_memorizada and instance.id_fornecedor:
                    id_produto_obj = item_data.get('id_produto')
                    ean_update = item_data.get('_ean') or item_data.get('ean') or ''
                    # Se não veio EAN no item_data, não salva (sem GTIN não faz sentido)
                    if id_produto_obj and ean_update:
                        try:
                            from .models import FornecedorProdutoFracao
                            fracao_dec = Decimal(str(fracao_memorizada))
                            if fracao_dec > 1:
                                FornecedorProdutoFracao.objects.update_or_create(
                                    fornecedor=instance.id_fornecedor,
                                    produto=id_produto_obj,
                                    gtin=ean_update,
                                    defaults={'fracao': fracao_dec}
                                )
                        except Exception as _fe:
                            print(f'[FRACAO] erro ao salvar fracao no update: {_fe}')

                # Atualizar estoque com novo item
                id_produto = item_data['id_produto']
                quantidade = Decimal(str(item_data['quantidade']))
                valor_compra = Decimal(str(item_data.get('valor_compra') or item_data.get('valor_unitario') or 0))

                try:
                    estoque_obj = Estoque.objects.get(
                        id_produto=id_produto,
                        id_deposito_id=novo_deposito_id
                    )
                    qtd_estoque_decimal = Decimal(str(estoque_obj.quantidade or 0))
                    custo_medio_atual = Decimal(str(estoque_obj.custo_medio or 0))
                    nova_quantidade = qtd_estoque_decimal + quantidade
                    valor_estoque_atual = qtd_estoque_decimal * custo_medio_atual
                    valor_nova_compra = quantidade * valor_compra
                    novo_custo_medio = (valor_estoque_atual + valor_nova_compra) / nova_quantidade if nova_quantidade > 0 else valor_compra
                    estoque_obj.quantidade = nova_quantidade
                    estoque_obj.custo_medio = novo_custo_medio.quantize(Decimal('0.0001'))
                    estoque_obj.valor_ultima_compra = valor_compra
                    estoque_obj.valor_total = nova_quantidade * novo_custo_medio
                    estoque_obj.save()
                except Estoque.DoesNotExist:
                    Estoque.objects.create(
                        id_produto=id_produto,
                        id_deposito_id=novo_deposito_id,
                        quantidade=quantidade,
                        custo_medio=valor_compra,
                        valor_ultima_compra=valor_compra,
                        valor_total=quantidade * valor_compra
                    )
            
            # Deletar financeiros pendentes antigos
            financeiros.filter(status_conta='Pendente').delete()
        
        return instance


class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compra.objects.all().prefetch_related('itens').order_by('-id_compra')
    serializer_class = CompraSerializer

    def create(self, request, *args, **kwargs):
        """Cria uma nova compra - usa padrão DRF para compatibilidade"""
        import traceback
        try:
            print("="*80)
            print("[CREATE_COMPRA_v5] RECEBENDO DADOS DA COMPRA")
            print("="*80)
            
            # Usar super() para deixar o DRF lidar com o request corretamente
            serializer = self.get_serializer(data=request.DATA if hasattr(request, 'DATA') else request.data)
            serializer.is_valid(raise_exception=True)
            
            print("Validação passou, salvando...")
            result = serializer.save()
            
            print("COMPRA SALVA COM SUCESSO!")
            print("="*80)
            
            return Response(result, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            print(f"ERRO DE VALIDAÇÃO: {e}")
            print("="*80)
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"[CREATE_COMPRA_v5] ERRO: {type(e).__name__}: {e}")
            traceback.print_exc()
            print("="*80)
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def importar_xml(self, request):
        """Importa NF-e a partir de arquivo XML"""
        import xml.etree.ElementTree as ET
        from datetime import datetime
        import io
        
        try:
            xml_file = request.FILES.get('xml_file')
            if not xml_file:
                return Response({'error': 'Arquivo XML não fornecido'}, status=status.HTTP_400_BAD_REQUEST)

            # Lê conteúdo completo do XML
            xml_bytes = xml_file.read()
            
            # Tenta decodificar de várias formas
            try:
                xml_conteudo_str = xml_bytes.decode('utf-8')
            except UnicodeDecodeError:
                xml_conteudo_str = xml_bytes.decode('latin-1', errors='replace')
            
            # Remove declaração de encoding se existir para evitar conflito com ET
            if 'encoding="UTF-8"' in xml_conteudo_str or "encoding='UTF-8'" in xml_conteudo_str:
                # ET.parse lida, mas às vezes stringIO precisa cuidado. 
                # Vamos usar BytesIO direto no xml_bytes original para segurança
                pass

            xml_file_io = io.BytesIO(xml_bytes)

            try:
                tree = ET.parse(xml_file_io)
                root = tree.getroot()
            except ET.ParseError as e:
                return Response({'error': f'Erro ao ler XML: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Namespace da NF-e (tenta com e sem namespace)
            ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
            
            # Tenta encontrar infNFe com namespace
            infNFe = root.find('.//nfe:infNFe', ns)
            
            # Se não encontrar, tenta sem namespace (alguns XMLs vêm sem prefixo, mas com xmlns default)
            # Se xmlns default existir, ElementTree exige URI.
            if infNFe is None:
                # Tenta buscar ignorando namespace (strip)
                # Iterar recursivamente é custoso, mas XML de NFe não é gigante
                for elem in root.iter():
                    if elem.tag.endswith('infNFe'):
                        infNFe = elem
                        break
            
            if infNFe is None:
                return Response({'error': 'XML inválido - estrutura de NF-e não encontrada'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Helper para buscar com ou sem namespace
            def get_text(node, tag, default=''):
                if node is None: return default
                # Tenta com namespace
                res = node.find(f'nfe:{tag}', ns)
                if res is not None: return res.text
                
                # Tenta sem namespace direto
                res = node.find(tag)
                if res is not None: return res.text
                
                # Fallback: procura filho com sufixo tag
                for child in node:
                    if child.tag.endswith(tag):
                        return child.text
                return default

            def get_node(node, tag):
                if node is None: return None
                res = node.find(f'nfe:{tag}', ns)
                if res is not None: return res
                res = node.find(tag)
                if res is not None: return res
                for child in node:
                    if child.tag.endswith(tag):
                        return child
                return None
            
            def get_all(node, tag):
                if node is None: return []
                res = node.findall(f'nfe:{tag}', ns)
                if res: return res
                
                # Sem namespace
                res = node.findall(tag)
                if res: return res
                
                # Manual
                found = []
                for child in node:
                    if child.tag.endswith(tag):
                        found.append(child)
                return found

            ide = get_node(infNFe, 'ide')
            emit = get_node(infNFe, 'emit')
            
            # Detalhes (itens) - buscar recursivo ou direto
            det_list = get_all(infNFe, 'det')
            
            total_node = get_node(infNFe, 'total')
            icms_tot = get_node(total_node, 'ICMSTot')
            
            # Dados do emitente (fornecedor)
            cnpj_emit = get_text(emit, 'CNPJ')
            nome_emit = get_text(emit, 'xNome')
            
            # Dados da nota
            numero_nf = get_text(ide, 'nNF')
            data_emissao = get_text(ide, 'dhEmi')
            
            # Extrair chave NFe corretamente
            chave_nfe = ''
            # Tenta pegar do atributo Id
            id_attr = infNFe.get('Id', '')
            if id_attr:
                chave_nfe = id_attr.replace('NFe', '')
            
            # Se não encontrou no Id, tenta pegar direto do campo chNFe (em alguns XMLs de contingência)
            if not chave_nfe:
                chave_nfe = get_text(infNFe, 'chNFe', '')
            
            # Totais da NF-e (ICMSTot)
            valor_total_str = get_text(icms_tot, 'vNF', '0.0')
            valor_total = float(valor_total_str) if valor_total_str else 0.0
            
            valor_produtos_str = get_text(icms_tot, 'vProd', '0.0')
            valor_produtos = float(valor_produtos_str) if valor_produtos_str else 0.0
            
            valor_frete_str = get_text(icms_tot, 'vFrete', '0.0')
            valor_frete = float(valor_frete_str) if valor_frete_str else 0.0
            
            valor_seguro_str = get_text(icms_tot, 'vSeg', '0.0')
            valor_seguro = float(valor_seguro_str) if valor_seguro_str else 0.0
            
            valor_desconto_str = get_text(icms_tot, 'vDesc', '0.0')
            valor_desconto = float(valor_desconto_str) if valor_desconto_str else 0.0
            
            valor_ipi_total_str = get_text(icms_tot, 'vIPI', '0.0')
            valor_ipi_total = float(valor_ipi_total_str) if valor_ipi_total_str else 0.0
            
            valor_pis_total_str = get_text(icms_tot, 'vPIS', '0.0')
            valor_pis_total = float(valor_pis_total_str) if valor_pis_total_str else 0.0
            
            valor_cofins_total_str = get_text(icms_tot, 'vCOFINS', '0.0')
            valor_cofins_total = float(valor_cofins_total_str) if valor_cofins_total_str else 0.0
            
            # Dados da transportadora (se houver frete)
            transp = get_node(infNFe, 'transp')
            transportadora_nome = ''
            transportadora_cnpj = ''
            frete_modalidade = ''
            
            if transp is not None:
                frete_modalidade = get_text(transp, 'modFrete', '')  # 0=Emitente, 1=Destinatário, 9=Sem frete
                transporta = get_node(transp, 'transporta')
                if transporta is not None:
                    transportadora_nome = get_text(transporta, 'xNome', '')
                    transportadora_cnpj = get_text(transporta, 'CNPJ', '')

            # Buscar ou criar fornecedor ANTES do loop de itens para que a
            # fração memorizada por fornecedor possa ser consultada durante o loop
            fornecedor = None
            fornecedor_criado = False
            fornecedor_nome = ''
            id_fornecedor = None

            if cnpj_emit:
                import re as _re
                from .models import Fornecedor
                # Normaliza para apenas dígitos (XML sempre vem sem formatação)
                _cnpj_digits = _re.sub(r'\D', '', cnpj_emit)

                # 1) Tenta match exato (como veio no XML)
                fornecedor = Fornecedor.objects.filter(cpf_cnpj=cnpj_emit).first()

                # 2) Tenta com apenas dígitos (caso o DB guarde sem formatação diferente)
                if not fornecedor and _cnpj_digits != cnpj_emit:
                    fornecedor = Fornecedor.objects.filter(cpf_cnpj=_cnpj_digits).first()

                # 3) Tenta com formatação XX.XXX.XXX/XXXX-XX (caso o DB guarde formatado)
                if not fornecedor and len(_cnpj_digits) == 14:
                    _cnpj_fmt = f'{_cnpj_digits[:2]}.{_cnpj_digits[2:5]}.{_cnpj_digits[5:8]}/{_cnpj_digits[8:12]}-{_cnpj_digits[12:]}'
                    fornecedor = Fornecedor.objects.filter(cpf_cnpj=_cnpj_fmt).first()

                if fornecedor:
                    fornecedor_nome = fornecedor.nome_razao_social
                    id_fornecedor = fornecedor.id_fornecedor
                elif nome_emit:
                    enderEmit = get_node(emit, 'enderEmit')
                    telefone = ''
                    logradouro = ''
                    numero = ''
                    bairro = ''
                    cidade = ''
                    estado = ''
                    cep = ''

                    if enderEmit is not None:
                        telefone = get_text(enderEmit, 'fone')
                        logradouro = get_text(enderEmit, 'xLgr')
                        numero = get_text(enderEmit, 'nro')
                        bairro = get_text(enderEmit, 'xBairro')
                        cidade = get_text(enderEmit, 'xMun')
                        estado = get_text(enderEmit, 'UF')
                        cep = get_text(enderEmit, 'CEP')

                    try:
                        fornecedor = Fornecedor.objects.create(
                            nome_razao_social=nome_emit,
                            nome_fantasia=nome_emit,
                            cpf_cnpj=cnpj_emit,
                            telefone=telefone or '',
                            endereco=logradouro or '',
                            numero=numero or '',
                            bairro=bairro or '',
                            cidade=cidade or '',
                            estado=estado or '',
                            cep=cep or '',
                        )
                        fornecedor_criado = True
                        fornecedor_nome = nome_emit
                        id_fornecedor = fornecedor.id_fornecedor
                    except Exception as e:
                        print(f"Erro ao criar fornecedor automático: {e}")
                        # Criação falhou (possivelmente CNPJ já existe em outro formato).
                        # Tenta localizar por busca parcial nos dígitos do CNPJ.
                        if not fornecedor and _cnpj_digits:
                            for _f in Fornecedor.objects.filter(cpf_cnpj__icontains=_cnpj_digits[2:10]).iterator():
                                if _re.sub(r'\D', '', _f.cpf_cnpj or '') == _cnpj_digits:
                                    fornecedor = _f
                                    fornecedor_nome = _f.nome_razao_social or nome_emit
                                    id_fornecedor = _f.id_fornecedor
                                    break

            # Itens
            itens_nf = []
            for det in det_list:
                prod = get_node(det, 'prod')
                if prod is not None:
                    codigo = get_text(prod, 'cProd')  # Código do fornecedor
                    descricao = get_text(prod, 'xProd')  # Descrição do XML
                    ean = get_text(prod, 'cEAN')  # Código de barras
                    ean_trib = get_text(prod, 'cEANTrib')  # Código de barras tributável
                    quantidade = float(get_text(prod, 'qCom', '1.0'))
                    valor_unit = float(get_text(prod, 'vUnCom', '0.0'))
                    ncm = get_text(prod, 'NCM')
                    cfop_orig = get_text(prod, 'CFOP')
                    unidade = get_text(prod, 'uCom')

                    # Converter CFOP para entrada (5→1, 6→2, 7→3)
                    cfop_entrada = cfop_orig
                    if cfop_orig and len(cfop_orig) > 0 and cfop_orig[0] in ('5', '6', '7'):
                        mapa = {'5': '1', '6': '2', '7': '3'}
                        cfop_entrada = mapa[cfop_orig[0]] + cfop_orig[1:]

                    # Impostos do item
                    imposto = get_node(det, 'imposto')
                    cst_icms = ''
                    csosn = ''
                    vbc_icms = 0.0
                    picms = 0.0
                    vicms = 0.0
                    vipi = 0.0
                    vpis = 0.0
                    vcofins = 0.0

                    if imposto is not None:
                        # ICMS
                        icms_node = get_node(imposto, 'ICMS')
                        if icms_node is not None:
                            # Tenta pegar qualquer filho (ICMS00, ICMS10, ICMSSN101...)
                            # O primeiro filho geralmente é o grupo do ICMS
                            for child in icms_node:
                                cst_el = get_node(child, 'CST')
                                csosn_el = get_node(child, 'CSOSN')
                                vbc_el = get_node(child, 'vBC')
                                picms_el = get_node(child, 'pICMS')
                                vicms_el = get_node(child, 'vICMS')
                                
                                if cst_el is not None: cst_icms = cst_el.text or ''
                                if csosn_el is not None: csosn = csosn_el.text or ''
                                if vbc_el is not None: 
                                    try: vbc_icms = float(vbc_el.text)
                                    except: pass
                                if picms_el is not None:
                                    try: picms = float(picms_el.text)
                                    except: pass
                                if vicms_el is not None:
                                    try: vicms = float(vicms_el.text)
                                    except: pass

                        # IPI
                        ipi_node = get_node(imposto, 'IPI')
                        if ipi_node is not None:
                            vipi_el = get_node(ipi_node, 'vIPI') # Pode estar dentro de IPITrib
                            if vipi_el is None:
                                ipi_trib = get_node(ipi_node, 'IPITrib')
                                if ipi_trib: vipi_el = get_node(ipi_trib, 'vIPI')
                            
                            if vipi_el is not None:
                                try: vipi = float(vipi_el.text)
                                except: pass

                        # PIS
                        pis_node = get_node(imposto, 'PIS')
                        if pis_node is not None:
                            # Geralmente PISAliq ou PISOutr
                            for child in pis_node:
                                vpis_el = get_node(child, 'vPIS')
                                if vpis_el is not None:
                                    try: vpis = float(vpis_el.text)
                                    except: pass
                                    break

                        # COFINS
                        cofins_node = get_node(imposto, 'COFINS')
                        if cofins_node is not None:
                            for child in cofins_node:
                                vcofins_el = get_node(child, 'vCOFINS')
                                if vcofins_el is not None:
                                    try: vcofins = float(vcofins_el.text)
                                    except: pass
                                    break

                    # Buscar produto no banco pelo código
                    # Prioridade: 1) EAN/Código de barras, 2) Código do produto, 3) Referência
                    produto_db = None
                    nome_produto_encontrado = descricao  # Padrão: descrição do XML
                    fracao_memorizada = None
                    tem_fracao_memorizada = False
                    
                    try:
                        # Primeiro tenta pelos códigos de barras (EAN/GTIN)
                        # Busca no campo gtin do Produto ou codigo_barras da ProdutoVariacao
                        if ean and ean != 'SEM GTIN':
                            # Busca direto no produto pelo GTIN
                            produto_db = Produto.objects.filter(gtin=ean).first()
                            
                            # Se não encontrou, busca nas variações do produto
                            if not produto_db:
                                from .models import ProdutoVariacao
                                variacao = ProdutoVariacao.objects.filter(codigo_barras=ean).first()
                                if variacao:
                                    produto_db = variacao.id_produto
                            
                            # Se encontrou o produto E há fornecedor, busca fração memorizada
                            if produto_db and fornecedor:
                                from .models import FornecedorProdutoFracao
                                fracao_obj = FornecedorProdutoFracao.objects.filter(
                                    fornecedor=fornecedor,
                                    produto=produto_db,
                                    gtin=ean
                                ).first()
                                
                                if fracao_obj:
                                    fracao_memorizada = float(fracao_obj.fracao)
                                    tem_fracao_memorizada = True
                        
                        # Se não encontrou, tenta pelo EAN tributável
                        # Também busca em ambos os campos
                        if not produto_db and ean_trib and ean_trib != 'SEM GTIN':
                            # Busca direto no produto pelo GTIN
                            produto_db = Produto.objects.filter(gtin=ean_trib).first()
                            
                            # Se não encontrou, busca nas variações do produto
                            if not produto_db:
                                from .models import ProdutoVariacao
                                variacao = ProdutoVariacao.objects.filter(codigo_barras=ean_trib).first()
                                if variacao:
                                    produto_db = variacao.id_produto
                            
                            # Se encontrou pelo EAN trib E há fornecedor, busca fração memorizada
                            if produto_db and fornecedor and not tem_fracao_memorizada:
                                from .models import FornecedorProdutoFracao
                                fracao_obj = FornecedorProdutoFracao.objects.filter(
                                    fornecedor=fornecedor,
                                    produto=produto_db,
                                    gtin=ean_trib
                                ).first()
                                
                                if fracao_obj:
                                    fracao_memorizada = float(fracao_obj.fracao)
                                    tem_fracao_memorizada = True
                        
                        # Se não encontrou, tenta pelo código do produto ou referência
                        if not produto_db and codigo:
                            produto_db = Produto.objects.filter(
                                Q(codigo_produto=codigo) | Q(referencia=codigo)
                            ).first()
                        
                        # Se encontrou o produto, usa o nome cadastrado no sistema
                        if produto_db:
                            nome_produto_encontrado = produto_db.nome_produto or descricao
                    except Exception as e:
                        print(f"Erro ao buscar produto: {e}")
                        pass

                    # Calcular quantidade com fração se houver
                    quantidade_final = quantidade
                    if fracao_memorizada:
                        quantidade_final = quantidade * fracao_memorizada

                    itens_nf.append({
                        'codigo': codigo,
                        'ean': ean if ean and ean != 'SEM GTIN' else '',
                        'descricao': descricao,  # Descrição original do XML
                        'nome_produto': nome_produto_encontrado,  # Nome do produto cadastrado ou descrição do XML
                        'quantidade': quantidade,  # Quantidade original do XML
                        'quantidade_com_fracao': quantidade_final,  # Quantidade já aplicada a fração
                        'fracao_memorizada': fracao_memorizada,  # Fração memorizada (se houver)
                        'tem_fracao_memorizada': tem_fracao_memorizada,  # Flag para UI
                        'valor_unitario': valor_unit,
                        'ncm': ncm,
                        'unidade': unidade,
                        'cfop': cfop_entrada,
                        'cfop_original': cfop_orig,
                        'cst': cst_icms,
                        'csosn': csosn,
                        'vbc_icms': vbc_icms,
                        'picms': picms,
                        'vicms': vicms,
                        'vipi': vipi,
                        'vpis': vpis,
                        'vcofins': vcofins,
                        'id_produto': produto_db.id_produto if produto_db else None,
                        'produto_encontrado': produto_db is not None  # Flag indicando se o produto foi encontrado
                    })
            
            return Response({
                'numero_nf': numero_nf,
                'numero_documento': numero_nf,  # Alias para compatibilidade
                'data_emissao': data_emissao,
                'data_documento': data_emissao,  # Alias para compatibilidade
                'chave_nfe': chave_nfe,
                'id_fornecedor': id_fornecedor,
                'fornecedor_cnpj': cnpj_emit,
                'fornecedor_nome': fornecedor_nome,
                'fornecedor_criado': fornecedor_criado,
                
                # Totais da NF-e
                'valor_total': valor_total,
                'valor_produtos': valor_produtos,
                'valor_frete': valor_frete,
                'valor_seguro': valor_seguro,
                'valor_desconto': valor_desconto,
                'valor_ipi_total': valor_ipi_total,
                'valor_pis_total': valor_pis_total,
                'valor_cofins_total': valor_cofins_total,
                
                # Dados do frete/transportadora
                'frete_modalidade': frete_modalidade,  # 0=Emitente, 1=Destinatário, 9=Sem frete
                'transportadora_nome': transportadora_nome,
                'transportadora_cnpj': transportadora_cnpj,
                
                # Itens da NF-e
                'itens': itens_nf
            })
            
        except ET.ParseError as e:
            return Response({'error': f'Erro de parse do XML: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Erro ao processar XML: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='salvar-fracao')
    def salvar_fracao(self, request):
        """
        Salva ou atualiza fração personalizada de um produto por fornecedor.
        Usado quando o usuário altera a fração durante a importação de XML.
        
        Body:
        {
            "id_fornecedor": 1,
            "id_produto": 123,
            "gtin": "7898543210987",
            "fracao": 12.0
        }
        """
        try:
            from .models import FornecedorProdutoFracao, Fornecedor, Produto
            from decimal import Decimal
            
            # Validar dados recebidos
            id_fornecedor = request.data.get('id_fornecedor')
            id_produto = request.data.get('id_produto')
            gtin = request.data.get('gtin')
            fracao = request.data.get('fracao')
            
            if not all([id_fornecedor, id_produto, gtin, fracao]):
                return Response(
                    {'error': 'Parâmetros obrigatórios: id_fornecedor, id_produto, gtin, fracao'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Converter fração para Decimal
            try:
                fracao_decimal = Decimal(str(fracao))
                if fracao_decimal <= 0:
                    return Response(
                        {'error': 'Fração deve ser maior que zero'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception:
                return Response(
                    {'error': 'Fração inválida. Deve ser um número.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Buscar fornecedor e produto
            try:
                fornecedor = Fornecedor.objects.get(id_fornecedor=id_fornecedor)
            except Fornecedor.DoesNotExist:
                return Response(
                    {'error': 'Fornecedor não encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            try:
                produto = Produto.objects.get(id_produto=id_produto)
            except Produto.DoesNotExist:
                return Response(
                    {'error': 'Produto não encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Criar ou atualizar fração
            fracao_obj, created = FornecedorProdutoFracao.objects.update_or_create(
                fornecedor=fornecedor,
                produto=produto,
                gtin=gtin,
                defaults={'fracao': fracao_decimal}
            )
            
            return Response({
                'success': True,
                'mensagem': 'Fração salva com sucesso' if created else 'Fração atualizada com sucesso',
                'created': created,
                'data': {
                    'id': fracao_obj.id,
                    'fornecedor': fornecedor.nome_razao_social,
                    'produto': produto.nome_produto,
                    'gtin': gtin,
                    'fracao': str(fracao_obj.fracao)
                }
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Erro ao salvar fração: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def gerar_financeiro(self, request, pk=None):
        """Gera contas a pagar para uma compra"""
        from .models import FinanceiroConta, FormaPagamento
        from datetime import datetime, timedelta
        
        try:
            compra = self.get_object()
            
            # Verifica se já tem financeiro gerado
            if FinanceiroConta.objects.filter(id_compra_origem=pk).exists():
                return Response({'error': 'Financeiro já foi gerado para esta compra'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Pega dados do request
            data_vencimento = request.data.get('data_vencimento')
            id_forma_pagamento = request.data.get('id_forma_pagamento')
            num_parcelas = int(request.data.get('num_parcelas', 1))
            
            if not data_vencimento or not id_forma_pagamento:
                return Response({'error': 'data_vencimento e id_forma_pagamento são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Valida forma de pagamento
            try:
                forma_pagamento = FormaPagamento.objects.get(pk=id_forma_pagamento)
            except FormaPagamento.DoesNotExist:
                return Response({'error': 'Forma de pagamento não encontrada'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Calcula valor por parcela
            valor_total = compra.valor_total or Decimal('0.00')
            valor_parcela = (valor_total / num_parcelas).quantize(Decimal('0.01'))
            
            # Cria as parcelas
            data_base = datetime.strptime(data_vencimento, '%Y-%m-%d').date()
            contas_criadas = []
            
            with transaction.atomic():
                for i in range(num_parcelas):
                    data_vcto = data_base + timedelta(days=30 * i)  # Parcelas mensais
                    
                    # Ajusta última parcela para compensar arredondamentos
                    valor_atual = valor_parcela
                    if i == num_parcelas - 1:
                        valor_atual = valor_total - (valor_parcela * (num_parcelas - 1))
                    
                    conta = FinanceiroConta.objects.create(
                        id_compra_origem=pk,
                        tipo_conta='Pagar',
                        descricao=f'Compra NF {compra.numero_documento} - Parcela {i+1}/{num_parcelas}',
                        valor_parcela=valor_atual,
                        data_vencimento=data_vcto,
                        status_conta='Pendente',
                        forma_pagamento=forma_pagamento.nome_forma,
                        parcela_numero=i + 1,
                        parcela_total=num_parcelas,
                        id_cliente_fornecedor=compra.id_fornecedor
                    )
                    contas_criadas.append({
                        'id': conta.pk,
                        'parcela': i + 1,
                        'valor': str(valor_atual),
                        'vencimento': str(data_vcto)
                    })
            
            return Response({
                'success': True,
                'mensagem': f'{num_parcelas} conta(s) criada(s) com sucesso',
                'contas': contas_criadas
            }, status=status.HTTP_201_CREATED)
            
        except Compra.DoesNotExist:
            return Response({'error': 'Compra não encontrada'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='calcular-precificacao')
    def calcular_precificacao(self, request):
        """
        Calcula preço de venda sugerido com base em margem ou markup.
        
        Body:
        {
            "itens": [
                {
                    "id_produto": 1,
                    "valor_compra": 100.00,
                    "tipo_calculo": "margem",  // ou "markup"
                    "percentual": 30.0
                }
            ]
        }
        
        Retorna:
        {
            "itens": [
                {
                    "id_produto": 1,
                    "valor_compra": 100.00,
                    "valor_venda_sugerido": 142.86,  // se margem 30%
                    "margem_percentual": 30.0,
                    "markup_percentual": 42.86
                }
            ]
        }
        """
        itens_entrada = request.data.get('itens', [])
        if not itens_entrada:
            return Response({'error': 'Nenhum item fornecido'}, status=status.HTTP_400_BAD_REQUEST)
        
        itens_resposta = []
        
        for item in itens_entrada:
            try:
                id_produto = item.get('id_produto')
                valor_compra = Decimal(str(item.get('valor_compra', 0)))
                tipo_calculo = item.get('tipo_calculo', 'margem')  # 'margem' ou 'markup'
                percentual = Decimal(str(item.get('percentual', 0)))
                
                if valor_compra <= 0:
                    itens_resposta.append({
                        'id_produto': id_produto,
                        'erro': 'Valor de compra deve ser maior que zero'
                    })
                    continue
                
                # Cálculo conforme tipo
                if tipo_calculo == 'margem':
                    # Margem: Preço Venda = Custo / (1 - Margem/100)
                    # Ex: Custo 100, Margem 30% -> Venda = 100 / (1 - 0.30) = 142.86
                    if percentual >= 100:
                        itens_resposta.append({
                            'id_produto': id_produto,
                            'erro': 'Margem deve ser menor que 100%'
                        })
                        continue
                    
                    valor_venda = valor_compra / (Decimal('1') - (percentual / Decimal('100')))
                    margem_calc = percentual
                    markup_calc = ((valor_venda - valor_compra) / valor_compra) * Decimal('100')
                    
                elif tipo_calculo == 'markup':
                    # Markup: Preço Venda = Custo × (1 + Markup/100)
                    # Ex: Custo 100, Markup 40% -> Venda = 100 × 1.40 = 140.00
                    valor_venda = valor_compra * (Decimal('1') + (percentual / Decimal('100')))
                    markup_calc = percentual
                    margem_calc = ((valor_venda - valor_compra) / valor_venda) * Decimal('100')
                
                else:
                    itens_resposta.append({
                        'id_produto': id_produto,
                        'erro': 'Tipo de cálculo inválido. Use "margem" ou "markup"'
                    })
                    continue
                
                # Arredonda valores
                valor_venda = valor_venda.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                margem_calc = margem_calc.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                markup_calc = markup_calc.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                
                itens_resposta.append({
                    'id_produto': id_produto,
                    'valor_compra': str(valor_compra),
                    'valor_venda_sugerido': str(valor_venda),
                    'margem_percentual': str(margem_calc),
                    'markup_percentual': str(markup_calc),
                    'tipo_calculo_usado': tipo_calculo
                })
                
            except (InvalidOperation, ValueError, TypeError) as e:
                itens_resposta.append({
                    'id_produto': item.get('id_produto'),
                    'erro': f'Erro ao processar item: {str(e)}'
                })
        
        return Response({'itens': itens_resposta}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='aplicar-precificacao')
    def aplicar_precificacao(self, request):
        """
        Aplica precificação aos produtos no estoque.
        
        Body:
        {
            "itens": [
                {
                    "id_produto": 1,
                    "id_deposito": 1,
                    "valor_venda": 142.86
                }
            ]
        }
        """
        itens_entrada = request.data.get('itens', [])
        if not itens_entrada:
            return Response({'error': 'Nenhum item fornecido'}, status=status.HTTP_400_BAD_REQUEST)
        
        itens_atualizados = []
        itens_erro = []
        
        with transaction.atomic():
            for item in itens_entrada:
                try:
                    id_produto = item.get('id_produto')
                    id_deposito = item.get('id_deposito', 1)
                    valor_venda = Decimal(str(item.get('valor_venda', 0)))
                    
                    if valor_venda <= 0:
                        itens_erro.append({
                            'id_produto': id_produto,
                            'erro': 'Valor de venda deve ser maior que zero'
                        })
                        continue
                    
                    # Busca ou cria estoque
                    estoque, created = Estoque.objects.get_or_create(
                        id_produto_id=id_produto,
                        id_deposito_id=id_deposito,
                        defaults={
                            'quantidade': Decimal('0'),
                            'custo_medio': Decimal('0'),
                            'valor_venda': valor_venda
                        }
                    )
                    
                    if not created:
                        estoque.valor_venda = valor_venda
                        estoque.save()
                    
                    itens_atualizados.append({
                        'id_produto': id_produto,
                        'id_deposito': id_deposito,
                        'valor_venda': str(valor_venda),
                        'status': 'criado' if created else 'atualizado'
                    })
                    
                except (InvalidOperation, ValueError, TypeError, Estoque.DoesNotExist) as e:
                    itens_erro.append({
                        'id_produto': item.get('id_produto'),
                        'erro': f'Erro ao atualizar: {str(e)}'
                    })
        
        return Response({
            'itens_atualizados': itens_atualizados,
            'itens_erro': itens_erro,
            'total_atualizados': len(itens_atualizados),
            'total_erros': len(itens_erro)
        }, status=status.HTTP_200_OK)

    def destroy(self, request, pk=None):
        from .models import Estoque, FinanceiroConta
        try:
            compra = Compra.objects.get(pk=pk)
        except Compra.DoesNotExist:
            return Response({'detail': 'Compra não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Verifica se há financeiro gerado
            financeiros = FinanceiroConta.objects.filter(id_compra_origem=pk)
            
            # Se não há financeiro, pode excluir livremente
            if financeiros.exists():
                # Se há financeiro, verifica se tem contas pagas
                if financeiros.filter(status_conta__in=['Paga', 'Liquidado']).exists():
                    return Response({
                        'error': 'Não é permitido excluir compras com contas pagas.',
                        'detail': 'Para excluir esta compra, primeiro estorne os pagamentos no módulo Financeiro.'
                    }, status=status.HTTP_403_FORBIDDEN)

            # Abate estoque dos itens
            operacao = compra.id_operacao
            itens = compra.itens.all()
            deposito_id = getattr(operacao, 'id_deposito_incremento', None) or 1
            
            with transaction.atomic():
                # 1. Abate estoque dos produtos
                for item in itens:
                    produto = item.id_produto
                    if produto:
                        try:
                            estoque_obj = Estoque.objects.get(id_produto=produto, id_deposito_id=deposito_id)
                            estoque_obj.quantidade = (estoque_obj.quantidade or Decimal('0')) - item.quantidade
                            estoque_obj.save()
                        except Estoque.DoesNotExist:
                            pass
                
                # 2. Exclui financeiros pendentes (se houver)
                if financeiros.exists():
                    financeiros.delete()
                
                # 3. Exclui itens da compra
                itens.delete()
                
                # 4. Exclui a compra
                compra.delete()
                
            return Response({
                'message': 'Compra excluída com sucesso.'
            }, status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"❌ Erro ao excluir compra {pk}:")
            print(error_details)
            return Response({
                'error': 'Erro ao excluir compra',
                'detail': str(e),
                'type': type(e).__name__
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)








