from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView, CreateView, UpdateView
from django.contrib import messages
from .models import ConhecimentoTransporte, CTeDocumentoOriginario
from api.models import Cliente
from django.urls import reverse_lazy

class CTeListView(ListView):
    model = ConhecimentoTransporte
    template_name = 'cte/cte_list.html'
    context_object_name = 'ctes'
    ordering = ['-id_cte']
    paginate_by = 20

class CTeCreateView(CreateView):
    model = ConhecimentoTransporte
    template_name = 'cte/cte_form.html'
    context_object_name = 'cte'
    fields = ['modelo', 'natureza_operacao', 'cfop', 'tipo_cte', 'modal',
              'remetente', 'destinatario', 'expedidor', 'recebedor', 'tomador_servico', 
              'cidade_origem_nome', 'cidade_origem_uf', 'cidade_origem_ibge',
              'cidade_destino_nome', 'cidade_destino_uf', 'cidade_destino_ibge',
              'produto_predominante', 'valor_carga', 'peso_bruto', 'peso_liquido', 'volumes',
              'valor_total_servico', 'valor_receber',
              'componente_frete_valor', 'componente_frete_peso', 'componente_sec_cat', 'componente_pedagio', 'componente_outros',
              'cst_icms', 'p_icms', 'v_bc_icms', 'v_icms',
              'resp_seguro', 'nome_seguradora', 'numero_apolice',
              'placa_veiculo', 'veiculo_uf', 'rntrc', 'veiculo_renavam',
              'condutor_nome', 'condutor_cpf']
    success_url = reverse_lazy('cte_list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['clientes'] = Cliente.objects.all().order_by('nome_razao_social')
        return context

    def form_valid(self, form):
        response = super().form_valid(form)
        
        # Processar Chaves NFe
        chaves = self.request.POST.get('nfe_chaves', '')
        if chaves:
            for chave in chaves.splitlines():
                chave = chave.strip()
                if len(chave) == 44: # Validação básica
                    CTeDocumentoOriginario.objects.create(cte=self.object, chave_nfe=chave)
        
        messages.success(self.request, "CT-e criado com sucesso!")
        return response

class CTeUpdateView(UpdateView):
    model = ConhecimentoTransporte
    template_name = 'cte/cte_form.html'
    context_object_name = 'cte'
    fields = ['modelo', 'natureza_operacao', 'cfop', 'tipo_cte', 'modal',
              'remetente', 'destinatario', 'expedidor', 'recebedor', 'tomador_servico', 
              'cidade_origem_nome', 'cidade_origem_uf', 'cidade_origem_ibge',
              'cidade_destino_nome', 'cidade_destino_uf', 'cidade_destino_ibge',
              'produto_predominante', 'valor_carga', 'peso_bruto', 'peso_liquido', 'volumes',
              'valor_total_servico', 'valor_receber',
              'componente_frete_valor', 'componente_frete_peso', 'componente_sec_cat', 'componente_pedagio', 'componente_outros',
              'cst_icms', 'p_icms', 'v_bc_icms', 'v_icms',
              'resp_seguro', 'nome_seguradora', 'numero_apolice',
              'placa_veiculo', 'veiculo_uf', 'rntrc', 'veiculo_renavam',
              'condutor_nome', 'condutor_cpf']
    success_url = reverse_lazy('cte_list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['clientes'] = Cliente.objects.all().order_by('nome_razao_social')
        return context
    
    def form_valid(self, form):
        response = super().form_valid(form)
        
        # Processar Chaves NFe (Sync - remove e recria)
        chaves = self.request.POST.get('nfe_chaves', '')
        # Limpar existentes para atualizar
        self.object.documentos_originarios.all().delete()
        
        if chaves:
            for chave in chaves.splitlines():
                chave = chave.strip()
                if len(chave) == 44:
                    CTeDocumentoOriginario.objects.create(cte=self.object, chave_nfe=chave)
                    
        messages.success(self.request, "CT-e atualizado com sucesso!")
        return response
