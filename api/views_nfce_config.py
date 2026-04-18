
from django.shortcuts import render
from django.views import View
from .models import EmpresaConfig, ConjuntoOperacao
from django.contrib.auth.mixins import LoginRequiredMixin
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt

@method_decorator(xframe_options_exempt, name='dispatch')
class ConfigNFceView(View):
    # Removing LoginRequiredMixin for easier testing by user, but recommended in prod
    # permission_required = 'api.change_empresaconfig'
    
    def get(self, request):
        config = EmpresaConfig.get_ativa()
        if not config:
            config = EmpresaConfig() # Placeholder
        
        # Debug: Log para verificar o que está salvo
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"CONFIG VIEW GET: sped_conjuntos_selecionados = '{config.sped_conjuntos_selecionados}'")
        
        # Buscar todas as operações (Conjunto de Operação)
        conjuntos = ConjuntoOperacao.objects.all().order_by('nome_conjunto')
        
        # Processar IDs dos conjuntos selecionados para o template
        conjuntos_selecionados_ids = []
        if config.sped_conjuntos_selecionados:
            conjuntos_selecionados_ids = [int(id_str.strip()) for id_str in config.sped_conjuntos_selecionados.split(',') if id_str.strip()]
        
        logger.info(f"CONFIG VIEW GET: conjuntos_selecionados_ids = {conjuntos_selecionados_ids}")
        
        return render(request, 'nfce_config.html', {
            'config': config,
            'conjuntos': conjuntos,
            'conjuntos_selecionados_ids': conjuntos_selecionados_ids,
            'sped_conjuntos_selecionados': config.sped_conjuntos_selecionados
        })
    
    def post(self, request):
        config = EmpresaConfig.get_ativa()
        if not config:
            config = EmpresaConfig()
        
        # Update fields
        config.nome_razao_social = request.POST.get('nome_razao_social')
        config.nome_fantasia = request.POST.get('nome_fantasia')
        config.cpf_cnpj = request.POST.get('cpf_cnpj')
        config.cpf_responsavel = request.POST.get('cpf_responsavel')
        config.inscricao_estadual = request.POST.get('inscricao_estadual')
        config.inscricao_municipal = request.POST.get('inscricao_municipal')
        
        # Endereço e Contato da Empresa
        config.cep = request.POST.get('cep')
        config.endereco = request.POST.get('endereco')
        config.numero = request.POST.get('numero')
        config.bairro = request.POST.get('bairro')
        config.cidade = request.POST.get('cidade')
        config.estado = request.POST.get('estado')
        config.telefone = request.POST.get('telefone')
        config.email = request.POST.get('email')
        
        # Accountant Fields
        config.contador_nome = request.POST.get('contador_nome')
        config.contador_cpf = request.POST.get('contador_cpf')
        config.contador_crc = request.POST.get('contador_crc')
        config.contador_cnpj = request.POST.get('contador_cnpj')
        config.contador_cep = request.POST.get('contador_cep')
        config.contador_endereco = request.POST.get('contador_endereco')
        config.contador_numero = request.POST.get('contador_numero')
        config.contador_complemento = request.POST.get('contador_complemento')
        config.contador_bairro = request.POST.get('contador_bairro')
        config.contador_fone = request.POST.get('contador_fone')
        config.contador_fax = request.POST.get('contador_fax')
        config.contador_email = request.POST.get('contador_email')
        config.contador_cod_mun = request.POST.get('contador_cod_mun')

        config.certificado_digital = request.POST.get('certificado_digital')
        config.senha_certificado = request.POST.get('senha_certificado')
        config.csc_token_id = request.POST.get('csc_token_id')
        config.csc_token_codigo = request.POST.get('csc_token_codigo')
        config.ambiente_nfce = request.POST.get('ambiente_nfce')
        config.ambiente_nfe = request.POST.get('ambiente_nfe')
        config.ambiente_cte = request.POST.get('ambiente_cte')
        
        # New NFS-e Fields
        config.ambiente_nfse = request.POST.get('ambiente_nfse')
        config.serie_dps = request.POST.get('serie_dps')
        config.ultimo_numero_dps = request.POST.get('ultimo_numero_dps')
        config.codigo_municipio_ibge = request.POST.get('codigo_municipio_ibge')
        
        valor = request.POST.get('valor_maximo_nfce')
        if valor:
            config.valor_maximo_nfce = valor.replace(',', '.')
        
        # Controle de Caixa
        config.controle_de_caixa = request.POST.get('controle_de_caixa') == 'on'
        
        # Configurações SPED (se enviadas)
        # Checkboxes unchecked don't appear in POST, so getlist returns empty list []
        # We always update the field based on what is (or isn't) sent
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info("============================================")
        logger.info("CONFIG VIEW POST - SPED Conjuntos")
        logger.info(f"request.POST completo: {dict(request.POST)}")
        
        sped_conjuntos = request.POST.getlist('sped_conjuntos')
        logger.info(f"sped_conjuntos (lista): {sped_conjuntos}")
        
        config.sped_conjuntos_selecionados = ','.join(sped_conjuntos)
        logger.info(f"config.sped_conjuntos_selecionados (string): '{config.sped_conjuntos_selecionados}'")
        logger.info("============================================")

        sped_diretorio = request.POST.get('sped_diretorio')
        if sped_diretorio:
            config.sped_diretorio_saida = sped_diretorio
            
        cod_receita = request.POST.get('codigo_receita_icms')
        if cod_receita is not None:
             config.codigo_receita_icms = cod_receita
             
        # Campos SPED (Atividade, Perfil, Nat. Jur., CNAE)
        config.ind_atividade = request.POST.get('ind_atividade')
        config.ind_perfil = request.POST.get('ind_perfil')
        config.ind_nat_pj = request.POST.get('ind_nat_pj')
        config.natureza_juridica = request.POST.get('natureza_juridica')
        config.cnae = request.POST.get('cnae')
        config.crt = request.POST.get('crt')
        config.suframa = request.POST.get('suframa')

        config.save()
        
        # Buscar todos os conjuntos para o contexto
        conjuntos = ConjuntoOperacao.objects.all().order_by('nome_conjunto')
        
        # Processaros IDs dos conjuntos selecionados para o template
        conjuntos_selecionados_ids = []
        if config.sped_conjuntos_selecionados:
            conjuntos_selecionados_ids = [int(id_str.strip()) for id_str in config.sped_conjuntos_selecionados.split(',') if id_str.strip()]
        
        return render(request, 'nfce_config.html', {
            'config': config,
            'conjuntos': conjuntos,
            'conjuntos_selecionados_ids': conjuntos_selecionados_ids,
            'sped_conjuntos_selecionados': config.sped_conjuntos_selecionados,
            'message': 'Configurações salvas com sucesso!'
        })
