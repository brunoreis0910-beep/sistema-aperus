"""
Middleware para auditoria automática de ações no sistema
"""
import json
from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve
from .models import LogAuditoria


class AuditoriaMiddleware(MiddlewareMixin):
    """
    Middleware que registra automaticamente todas as ações relevantes dos usuários
    """
    
    # Métodos HTTP que devem ser auditados
    METODOS_AUDITADOS = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    # Mapeamento de método HTTP para tipo de ação
    METODO_PARA_ACAO = {
        'POST': 'CREATE',
        'PUT': 'UPDATE',
        'PATCH': 'UPDATE',
        'DELETE': 'DELETE',
    }
    
    # Mapeamento de URLs para módulos
    URL_PARA_MODULO = {
        'vendas': 'Vendas',
        'produtos': 'Produtos',
        'clientes': 'Clientes',
        'fornecedores': 'Fornecedores',
        'financeiro': 'Financeiro',
        'estoque': 'Estoque',
        'compras': 'Compras',
        'trocas': 'Trocas',
        'devolucoes': 'Devoluções',
        'ordens': 'Ordens de Serviço',
        'ordem-servico': 'Ordens de Serviço',
        'cotacoes': 'Cotações',
        'comandas': 'Comandas',
        'petshop': 'Pet Shop',
        'usuarios': 'Usuários',
        'config': 'Configurações',
        'agendamentos': 'Agendamentos',
        'pets': 'Pets',
        'servicos': 'Serviços',
        'pacotes': 'Pacotes',
        'etiquetas': 'Etiquetas',
        'catalogo': 'Catálogo',
        'mapa-promocao': 'Mapa Promoção',
        'operacoes': 'Operações',
        'vendedores': 'Vendedores',
        'tecnicos': 'Técnicos',
    }
    
    # URLs que não devem ser auditadas
    URLS_IGNORADAS = [
        '/api/token/',
        '/api/token/refresh/',
        '/admin/jsi18n/',
        '/static/',
        '/media/',
    ]
    
    def process_response(self, request, response):
        """
        Processa a resposta e registra a ação se necessário
        """
        # Ignorar se não for método auditado
        if request.method not in self.METODOS_AUDITADOS:
            return response
        
        # Ignorar se não houver usuário autenticado
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return response
        
        # Ignorar URLs específicas
        if any(request.path.startswith(url) for url in self.URLS_IGNORADAS):
            return response
        
        # Ignorar se não for resposta de sucesso (200-299)
        if not (200 <= response.status_code < 300):
            return response
        
        try:
            self._registrar_log(request, response)
        except Exception as e:
            # Não deve quebrar a aplicação se houver erro no log
            print(f"Erro ao registrar log de auditoria: {e}")
        
        return response
    
    def _registrar_log(self, request, response):
        """
        Registra o log de auditoria
        """
        # Determinar módulo e ação
        modulo = self._extrair_modulo(request.path)
        tipo_acao = self.METODO_PARA_ACAO.get(request.method, 'UPDATE')
        
        # Verificar ações especiais na URL
        if 'estorno' in request.path.lower():
            tipo_acao = 'ESTORNO'
        elif 'cancelar' in request.path.lower() or 'cancel' in request.path.lower():
            tipo_acao = 'CANCELAMENTO'
        elif 'aprovar' in request.path.lower():
            tipo_acao = 'APROVACAO'
        elif 'baixar' in request.path.lower() or 'baixa' in request.path.lower():
            tipo_acao = 'BAIXA'
        elif 'export' in request.path.lower():
            tipo_acao = 'EXPORT'
        elif 'import' in request.path.lower():
            tipo_acao = 'IMPORT'
        elif 'print' in request.path.lower() or 'imprimir' in request.path.lower():
            tipo_acao = 'PRINT'
        
        # Extrair dados do request
        dados_request = self._extrair_dados_request(request)
        
        # Extrair dados da resposta
        dados_response = self._extrair_dados_response(response)
        
        # Extrair ID do registro (se houver na URL)
        registro_id = self._extrair_registro_id(request.path)
        
        # Montar descrição
        descricao = self._gerar_descricao(tipo_acao, modulo, dados_request, registro_id)
        
        # Obter IP
        ip_address = self._get_client_ip(request)
        
        # Obter User Agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
        
        # Criar log
        LogAuditoria.objects.create(
            usuario=request.user,
            usuario_nome=request.user.get_full_name() or request.user.username,
            tipo_acao=tipo_acao,
            modulo=modulo,
            descricao=descricao,
            tabela=self._extrair_nome_tabela(modulo),
            registro_id=registro_id,
            dados_anteriores=None,  # Pode ser implementado posteriormente
            dados_novos=json.dumps(dados_request, ensure_ascii=False) if dados_request else None,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    def _extrair_modulo(self, path):
        """Extrai o módulo da URL"""
        for palavra_chave, modulo in self.URL_PARA_MODULO.items():
            if palavra_chave in path.lower():
                return modulo
        return 'Sistema'
    
    def _extrair_dados_request(self, request):
        """Extrai dados relevantes do request"""
        try:
            if request.content_type == 'application/json':
                return json.loads(request.body.decode('utf-8'))
            elif request.POST:
                return dict(request.POST)
        except:
            pass
        return None
    
    def _extrair_dados_response(self, response):
        """Extrai dados relevantes da resposta"""
        try:
            if hasattr(response, 'data'):
                return response.data
        except:
            pass
        return None
    
    def _extrair_registro_id(self, path):
        """Extrai ID do registro da URL"""
        import re
        # Procura por números no final da URL (ex: /api/produtos/123/)
        match = re.search(r'/(\d+)/?$', path)
        if match:
            return match.group(1)
        return None
    
    def _extrair_nome_tabela(self, modulo):
        """Mapeia módulo para nome da tabela"""
        mapeamento = {
            'Vendas': 'vendas',
            'Produtos': 'produtos',
            'Clientes': 'clientes',
            'Fornecedores': 'fornecedores',
            'Financeiro': 'financeiro',
            'Estoque': 'movimentacao_estoque',
            'Compras': 'compras',
            'Trocas': 'trocas',
            'Devoluções': 'devolucoes',
            'Ordens de Serviço': 'ordem_servico',
            'Cotações': 'cotacoes',
            'Comandas': 'comandas',
            'Pet Shop': 'petshop_agendamentos',
            'Usuários': 'auth_user',
            'Agendamentos': 'petshop_agendamentos',
            'Pets': 'petshop_pets',
            'Operações': 'operacoes',
            'Vendedores': 'vendedores',
            'Técnicos': 'tecnicos',
        }
        return mapeamento.get(modulo)
    
    def _gerar_descricao(self, tipo_acao, modulo, dados, registro_id):
        """Gera descrição amigável da ação"""
        acoes = {
            'CREATE': 'criou',
            'UPDATE': 'editou',
            'DELETE': 'excluiu',
            'ESTORNO': 'estornou',
            'CANCELAMENTO': 'cancelou',
            'APROVACAO': 'aprovou',
            'BAIXA': 'baixou',
            'EXPORT': 'exportou',
            'IMPORT': 'importou',
            'PRINT': 'imprimiu',
        }
        
        acao_texto = acoes.get(tipo_acao, 'modificou')
        detalhes = ""
        
        # Extrair informações específicas de cada módulo
        if dados and isinstance(dados, dict):
            # CLIENTES
            if modulo == 'Clientes':
                nome = dados.get('nome_razao_social') or dados.get('nome') or dados.get('razao_social')
                if nome:
                    detalhes = f" '{nome}'"
                    
            # PRODUTOS
            elif modulo == 'Produtos':
                descricao_prod = dados.get('descricao') or dados.get('nome')
                codigo = dados.get('codigo') or dados.get('codigo_barras')
                if descricao_prod:
                    detalhes = f" '{descricao_prod}'"
                    if codigo:
                        detalhes += f" (Cód: {codigo})"
                elif codigo:
                    detalhes = f" (Cód: {codigo})"
                    
            # FORNECEDORES
            elif modulo == 'Fornecedores':
                nome = dados.get('nome_razao_social') or dados.get('nome') or dados.get('razao_social')
                if nome:
                    detalhes = f" '{nome}'"
                    
            # VENDAS
            elif modulo == 'Vendas':
                numero = dados.get('numero_documento')
                valor = dados.get('valor_total') or dados.get('total')
                cliente_id = dados.get('id_cliente')
                operacao_id = dados.get('id_operacao')
                vendedor_id = dados.get('id_vendedor')
                observacoes = dados.get('observacoes')
                
                if numero:
                    detalhes = f" Venda #{numero}"
                if cliente_id:
                    detalhes += f" - Cliente ID: {cliente_id}"
                if operacao_id:
                    detalhes += f" | Operação ID: {operacao_id}"
                if vendedor_id:
                    detalhes += f" | Vendedor ID: {vendedor_id}"
                if valor:
                    detalhes += f" | Valor: R$ {valor}"
                
                # Adicionar observações (limitado a 100 caracteres)
                if observacoes:
                    obs_truncada = observacoes[:100] + '...' if len(observacoes) > 100 else observacoes
                    detalhes += f' | Obs: "{obs_truncada}"'
                    
            # COMPRAS
            elif modulo == 'Compras':
                valor = dados.get('valor_total') or dados.get('total')
                fornecedor = dados.get('fornecedor_nome') or dados.get('fornecedor')
                if fornecedor:
                    detalhes = f" do fornecedor '{fornecedor}'"
                if valor:
                    detalhes += f" - R$ {valor}"
                elif valor:
                    detalhes = f" - R$ {valor}"
                    
            # OPERAÇÕES
            elif modulo == 'Operações':
                nome_op = dados.get('nome_operacao')
                abreviacao = dados.get('abreviacao')
                transacao = dados.get('transacao')
                validacao_limite = dados.get('validacao_limite_credito')
                validar_atraso = dados.get('validar_atraso')
                acao_atraso = dados.get('acao_atraso')
                validar_estoque = dados.get('validar_estoque')
                acao_estoque = dados.get('acao_estoque')
                
                if nome_op:
                    detalhes = f" '{nome_op}'"
                if abreviacao:
                    detalhes += f" ({abreviacao})"
                if transacao:
                    detalhes += f" | Transação: {transacao}"
                
                # Informar sobre validações ativadas
                validacoes = []
                if validacao_limite and validacao_limite != 'nao_validar':
                    validacoes.append(f"Limite de Crédito: {validacao_limite}")
                if validar_atraso:
                    dias_tol = dados.get('dias_atraso_tolerancia', 0)
                    validacoes.append(f"Atraso: {acao_atraso} (tolerância: {dias_tol} dias)")
                if validar_estoque:
                    validacoes.append(f"Estoque: {acao_estoque}")
                
                if validacoes:
                    detalhes += f" | Validações: {', '.join(validacoes)}"
                    
            # COMANDAS
            elif modulo == 'Comandas':
                numero = dados.get('numero_comanda') or dados.get('numero')
                mesa = dados.get('mesa')
                if numero:
                    detalhes = f" comanda #{numero}"
                if mesa:
                    detalhes += f" (Mesa {mesa})"
                    
            # PET SHOP / PETS
            elif modulo in ['Pet Shop', 'Pets']:
                nome_pet = dados.get('nome') or dados.get('nome_pet')
                tutor = dados.get('tutor') or dados.get('nome_tutor')
                if nome_pet:
                    detalhes = f" pet '{nome_pet}'"
                    if tutor:
                        detalhes += f" (Tutor: {tutor})"
                elif tutor:
                    detalhes = f" (Tutor: {tutor})"
                    
            # AGENDAMENTOS
            elif modulo == 'Agendamentos':
                servico = dados.get('servico') or dados.get('tipo_servico')
                pet = dados.get('pet') or dados.get('nome_pet')
                data = dados.get('data_agendamento') or dados.get('data')
                if pet:
                    detalhes = f" para pet '{pet}'"
                if servico:
                    detalhes += f" - {servico}"
                if data:
                    detalhes += f" ({data})"
                    
            # SERVIÇOS
            elif modulo == 'Serviços':
                nome = dados.get('nome') or dados.get('descricao')
                valor = dados.get('valor') or dados.get('preco')
                if nome:
                    detalhes = f" '{nome}'"
                if valor:
                    detalhes += f" - R$ {valor}"
                    
            # USUÁRIOS
            elif modulo == 'Usuários':
                username = dados.get('username')
                nome = dados.get('first_name') or dados.get('nome')
                parametros = dados.get('parametros')
                
                if nome:
                    detalhes = f" '{nome}'"
                    if username:
                        detalhes += f" ({username})"
                elif username:
                    detalhes = f" '{username}'"
                
                # Adicionar detalhes sobre mudanças nos parâmetros
                if parametros and isinstance(parametros, dict):
                    mudancas = []
                    if parametros.get('id_vendedor_venda'):
                        mudancas.append('vendedor padrão (Venda)')
                    if parametros.get('id_operacao_venda'):
                        mudancas.append('operação padrão (Venda)')
                    if parametros.get('id_vendedor_os'):
                        mudancas.append('vendedor padrão (OS)')
                    if parametros.get('id_operacao_os'):
                        mudancas.append('operação padrão (OS)')
                    if parametros.get('id_cliente_padrao'):
                        mudancas.append('cliente padrão')
                    if parametros.get('id_vendedor_padrao'):
                        mudancas.append('vendedor padrão geral')
                    if parametros.get('id_operacao_padrao'):
                        mudancas.append('operação padrão geral')
                    
                    if mudancas:
                        detalhes += f" - Configurou: {', '.join(mudancas)}"
                    
            # ORDENS DE SERVIÇO
            elif modulo == 'Ordens de Serviço':
                numero = dados.get('numero_documento') or dados.get('numero_os') or dados.get('numero')
                cliente_id = dados.get('id_cliente')
                operacao_id = dados.get('id_operacao')
                vendedor_id = dados.get('id_vendedor')
                status = dados.get('id_status')
                valor = dados.get('valor_total_os') or dados.get('valor_total')
                observacao = dados.get('observacao')
                ocorrencia = dados.get('ocorrencia')
                solicitante = dados.get('solicitante')
                
                if numero:
                    detalhes = f" OS #{numero}"
                if cliente_id:
                    detalhes += f" - Cliente ID: {cliente_id}"
                if operacao_id:
                    detalhes += f" | Operação ID: {operacao_id}"
                if vendedor_id:
                    detalhes += f" | Técnico ID: {vendedor_id}"
                if valor:
                    detalhes += f" | Valor: R$ {valor}"
                if status:
                    detalhes += f" | Status: {status}"
                
                # Adicionar descrição/observação (limitado a 100 caracteres)
                if observacao:
                    obs_truncada = observacao[:100] + '...' if len(observacao) > 100 else observacao
                    detalhes += f' | Obs: "{obs_truncada}"'
                if ocorrencia:
                    ocor_truncada = ocorrencia[:100] + '...' if len(ocorrencia) > 100 else ocorrencia
                    detalhes += f' | Ocorrência: "{ocor_truncada}"'
                if solicitante:
                    detalhes += f' | Solicitante: {solicitante}'
                    
            # COTAÇÕES
            elif modulo == 'Cotações':
                numero = dados.get('numero_cotacao') or dados.get('numero')
                fornecedor = dados.get('fornecedor_nome') or dados.get('fornecedor')
                if numero:
                    detalhes = f" cotação #{numero}"
                if fornecedor:
                    detalhes += f" - {fornecedor}"
                    
            # TROCAS E DEVOLUÇÕES
            elif modulo in ['Trocas', 'Devoluções']:
                numero = dados.get('numero') or dados.get('id')
                motivo = dados.get('motivo')
                if numero:
                    detalhes = f" #{numero}"
                if motivo:
                    detalhes += f" - Motivo: {motivo}"
                    
            # FINANCEIRO
            elif modulo == 'Financeiro':
                tipo = dados.get('tipo') or dados.get('tipo_movimento')
                valor = dados.get('valor')
                descricao = dados.get('descricao') or dados.get('historico')
                if tipo:
                    detalhes = f" ({tipo})"
                if descricao:
                    detalhes += f" '{descricao}'"
                if valor:
                    detalhes += f" - R$ {valor}"
        
        # Montar descrição final
        if detalhes:
            descricao = f"{acao_texto}{detalhes}"
        elif registro_id:
            descricao = f"{acao_texto} registro #{registro_id} em {modulo}"
        else:
            descricao = f"{acao_texto} registro em {modulo}"
        
        return descricao
    
    def _get_client_ip(self, request):
        """Obtém o IP real do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
