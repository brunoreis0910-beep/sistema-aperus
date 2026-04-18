from rest_framework import serializers
from decimal import Decimal
from .models import OrdemServico, OsItensProduto, OsItensServico, Cliente, Tecnico, Operacao, Produto, StatusOrdemServico, Estoque, EmpresaConfig


class OsItensProdutoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='id_produto.nome_produto', read_only=True)
    custo_unitario = serializers.SerializerMethodField()

    def get_custo_unitario(self, obj):
        """Retorna o custo unitário do produto (custo_medio ou valor_ultima_compra)"""
        try:
            estoque = Estoque.objects.filter(id_produto=obj.id_produto).order_by('-data_modificacao').first()
            if estoque:
                custo = float(estoque.custo_medio or 0)
                if custo == 0:
                    custo = float(estoque.valor_ultima_compra or 0)
                return custo
        except Exception:
            pass
        return 0.0

    class Meta:
        model = OsItensProduto
        fields = [
            'id_os_item_produto',
            'id_produto',
            'produto_nome',
            'quantidade',
            'valor_unitario',
            'desconto',
            'valor_total',
            'custo_unitario',
        ]
        read_only_fields = ['id_os_item_produto', 'valor_total', 'custo_unitario']


class OsItensServicoSerializer(serializers.ModelSerializer):
    tecnico_nome = serializers.CharField(source='id_tecnico_executante.nome_tecnico', read_only=True)
    
    class Meta:
        model = OsItensServico
        fields = [
            'id_os_item_servico',
            'id_tecnico_executante',
            'tecnico_nome',
            'descricao_servico',
            'quantidade',
            'valor_unitario',
            'desconto',
            'valor_total',
        ]
        read_only_fields = ['id_os_item_servico', 'valor_total']


class OrdemServicoSerializer(serializers.ModelSerializer):
    # Itens aninhados - read only para listagem
    itens_produtos = serializers.SerializerMethodField()
    itens_servicos = serializers.SerializerMethodField()
    
    cliente_nome = serializers.SerializerMethodField()
    cliente_email = serializers.SerializerMethodField()
    cliente_telefone = serializers.SerializerMethodField()
    cliente_cpf_cnpj = serializers.SerializerMethodField()
    cliente_endereco = serializers.SerializerMethodField()
    tecnico_nome = serializers.SerializerMethodField()
    operacao_nome = serializers.SerializerMethodField()
    status_info = serializers.SerializerMethodField()
    lucratividade = serializers.SerializerMethodField()
    empresa_info = serializers.SerializerMethodField()
    
    # Permitir enviar IDs diretamente
    id_cliente = serializers.PrimaryKeyRelatedField(queryset=Cliente.objects.all())
    id_tecnico = serializers.PrimaryKeyRelatedField(queryset=Tecnico.objects.all(), required=False, allow_null=True)
    id_operacao = serializers.PrimaryKeyRelatedField(queryset=Operacao.objects.all(), required=False, allow_null=True)
    data_abertura = serializers.DateTimeField(read_only=True)
    
    def get_itens_produtos(self, obj):
        itens = OsItensProduto.objects.filter(id_os=obj.id_os)
        return OsItensProdutoSerializer(itens, many=True).data
    
    def get_itens_servicos(self, obj):
        itens = OsItensServico.objects.filter(id_os=obj.id_os)
        return OsItensServicoSerializer(itens, many=True).data
    
    def get_cliente_nome(self, obj):
        return obj.id_cliente.nome_razao_social if obj.id_cliente else None

    def get_cliente_email(self, obj):
        return obj.id_cliente.email if obj.id_cliente else None

    def get_cliente_telefone(self, obj):
        return obj.id_cliente.telefone if obj.id_cliente else None

    def get_cliente_cpf_cnpj(self, obj):
        return obj.id_cliente.cpf_cnpj if obj.id_cliente else None

    def get_cliente_endereco(self, obj):
        if not obj.id_cliente:
            return None
        c = obj.id_cliente
        partes = [p for p in [c.endereco, c.numero, c.bairro] if p]
        linha1 = ', '.join(partes)
        partes2 = [p for p in [c.cidade, c.estado] if p]
        linha2 = ' - '.join(partes2)
        if c.cep:
            linha2 += f' CEP: {c.cep}' if linha2 else f'CEP: {c.cep}'
        return f'{linha1} | {linha2}' if linha1 and linha2 else linha1 or linha2 or None

    def get_empresa_info(self, obj):
        try:
            emp = EmpresaConfig.get_ativa()
            if not emp:
                return None
            partes_end = [p for p in [emp.endereco, emp.numero, emp.bairro] if p]
            endereco = ', '.join(partes_end)
            partes_cidade = [p for p in [emp.cidade, emp.estado] if p]
            if partes_cidade:
                endereco += ' - ' + ' - '.join(partes_cidade) if endereco else ' - '.join(partes_cidade)
            return {
                'nome': emp.nome_fantasia or emp.nome_razao_social,
                'razao_social': emp.nome_razao_social,
                'cnpj': emp.cpf_cnpj,
                'telefone': emp.telefone,
                'endereco': endereco,
                'email': emp.email,
            }
        except Exception:
            return None

    def get_tecnico_nome(self, obj):
        return obj.id_tecnico.nome_tecnico if obj.id_tecnico else None
    
    def get_operacao_nome(self, obj):
        return obj.id_operacao.nome_operacao if obj.id_operacao else None
    
    def get_lucratividade(self, obj):
        """Calcula lucratividade da OS: receita, custo de produtos, lucro e margem"""
        try:
            total_receita = float(obj.valor_total_os or 0)
            total_custo_produtos = 0.0

            # Custo dos itens de produtos
            for item in OsItensProduto.objects.filter(id_os=obj.id_os):
                try:
                    estoque = Estoque.objects.filter(id_produto=item.id_produto).order_by('-data_modificacao').first()
                    if estoque:
                        custo = float(estoque.custo_medio or 0)
                        if custo == 0:
                            custo = float(estoque.valor_ultima_compra or 0)
                        total_custo_produtos += custo * float(item.quantidade or 0)
                except Exception:
                    pass

            lucro_bruto = total_receita - total_custo_produtos
            margem_pct = (lucro_bruto / total_receita * 100) if total_receita > 0 else 0.0

            return {
                'total_receita': round(total_receita, 2),
                'total_custo': round(total_custo_produtos, 2),
                'lucro_bruto': round(lucro_bruto, 2),
                'margem_pct': round(margem_pct, 2),
            }
        except Exception:
            return {'total_receita': 0, 'total_custo': 0, 'lucro_bruto': 0, 'margem_pct': 0}

    def get_status_info(self, obj):
        """Retorna informações do status da OS"""
        if obj.id_status:
            return {
                'id': obj.id_status.id_status,
                'nome': obj.id_status.nome_status,
                'cor': obj.id_status.cor,
                'ordem': obj.id_status.ordem
            }
        return None
    
    class Meta:
        model = OrdemServico
        fields = [
            'id_os',
            'id_cliente',
            'cliente_nome',
            'cliente_email',
            'cliente_telefone',
            'cliente_cpf_cnpj',
            'cliente_endereco',
            'id_tecnico',
            'tecnico_nome',
            'id_veiculo',
            'id_equipamento',
            'id_animal',
            'id_operacao',
            'operacao_nome',
            'status_os',
            'id_status',
            'status_info',
            'data_abertura',
            'data_finalizacao',
            'descricao_problema',
            'laudo_tecnico',
            'solicitante',
            'valor_total_produtos',
            'valor_total_servicos',
            'valor_desconto',
            'valor_total_os',
            'desconto_produtos',
            'tipo_desconto_produtos',
            'desconto_servicos',
            'tipo_desconto_servicos',
            'gera_financeiro',
            'itens_produtos',
            'itens_servicos',
            'lucratividade',
            'status_nfse',
            'numero_nfse',
            'empresa_info',
        ]
        read_only_fields = ['id_os']
    
    def create(self, validated_data):
        # Extrair itens do validated_data (não fazem parte do modelo OrdemServico)
        itens_produtos_data = self.initial_data.get('itens_produtos', [])
        itens_servicos_data = self.initial_data.get('itens_servicos', [])
        
        print(f"📝 Criando ordem com dados: {validated_data}")
        print(f"📦 Itens produtos: {len(itens_produtos_data)}")
        print(f"🔧 Itens serviços: {len(itens_servicos_data)}")
        
        # Remover campos de veículo/animal/equipamento se não foram fornecidos
        if 'id_veiculo' in validated_data and validated_data['id_veiculo'] is None:
            validated_data.pop('id_veiculo')
        if 'id_equipamento' in validated_data and validated_data['id_equipamento'] is None:
            validated_data.pop('id_equipamento')
        if 'id_animal' in validated_data and validated_data['id_animal'] is None:
            validated_data.pop('id_animal')
        
        print(f"📝 Dados após limpeza: {validated_data}")
        
        # Criar a ordem
        try:
            ordem = OrdemServico.objects.create(**validated_data)
            print(f"✅ Ordem criada: {ordem.id_os}")
            
            # Criar itens produtos
            for item_data in itens_produtos_data:
                item_produto = OsItensProduto.objects.create(
                    id_os=ordem,  # Passar o objeto, não o ID
                    id_produto_id=item_data['id_produto'],
                    quantidade=item_data['quantidade'],
                    valor_unitario=item_data['valor_unitario'],
                    desconto=item_data.get('desconto', 0),
                    valor_total=item_data['valor_total']
                )
                print(f"  ✅ Item produto criado: {item_produto.id_os_item_produto} - Desconto: {item_data.get('desconto', 0)}")
            
            # Criar itens serviços
            for item_data in itens_servicos_data:
                item_servico = OsItensServico.objects.create(
                    id_os=ordem,  # Passar o objeto, não o ID
                    id_tecnico_executante_id=item_data.get('id_tecnico_executante'),
                    descricao_servico=item_data['descricao_servico'],
                    quantidade=item_data['quantidade'],
                    valor_unitario=item_data['valor_unitario'],
                    desconto=item_data.get('desconto', 0),
                    valor_total=item_data['valor_total']
                )
                print(f"  ✅ Item serviço criado: {item_servico.id_os_item_servico} - Desconto: {item_data.get('desconto', 0)}")
                
        except Exception as e:
            print(f"❌ Erro ao criar ordem: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
        
        return ordem
    
    def update(self, instance, validated_data):
        print(f"📝 Atualizando ordem {instance.id_os}")
        
        # Atualizar campos da ordem
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Só atualizar itens se foram explicitamente enviados no request
        if 'itens_produtos' in self.initial_data:
            itens_produtos_data = self.initial_data.get('itens_produtos', [])
            print(f"📦 Atualizando itens produtos: {len(itens_produtos_data)}")
            
            # Remover itens produtos existentes
            OsItensProduto.objects.filter(id_os=instance.id_os).delete()
            
            # Criar novos itens produtos
            for item_data in itens_produtos_data:
                OsItensProduto.objects.create(
                    id_os=instance,  # Passar o objeto, não o ID
                    id_produto_id=item_data['id_produto'],
                    quantidade=item_data['quantidade'],
                    valor_unitario=item_data['valor_unitario'],
                    desconto=item_data.get('desconto', 0),
                    valor_total=item_data['valor_total']
                )
        
        # Só atualizar serviços se foram explicitamente enviados no request
        if 'itens_servicos' in self.initial_data:
            itens_servicos_data = self.initial_data.get('itens_servicos', [])
            print(f"🔧 Atualizando itens serviços: {len(itens_servicos_data)}")
            
            # Remover itens serviços existentes
            OsItensServico.objects.filter(id_os=instance.id_os).delete()
            
            # Criar novos itens serviços
            for item_data in itens_servicos_data:
                OsItensServico.objects.create(
                    id_os=instance,  # Passar o objeto, não o ID
                    id_tecnico_executante_id=item_data.get('id_tecnico_executante'),
                    descricao_servico=item_data['descricao_servico'],
                    quantidade=item_data['quantidade'],
                    valor_unitario=item_data['valor_unitario'],
                    desconto=item_data.get('desconto', 0),
                    valor_total=item_data['valor_total']
                )
        
        print(f"✅ Ordem {instance.id_os} atualizada com sucesso")
        
        return instance
