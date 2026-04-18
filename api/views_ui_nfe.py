from django.shortcuts import render, get_object_or_404, redirect
from django.views import View
from django.contrib import messages
from api.models import Venda, Cliente
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt

@method_decorator(xframe_options_exempt, name='dispatch')
class FiscalMenuView(View):
    def get(self, request):
        return render(request, 'fiscal_menu.html')

@method_decorator(xframe_options_exempt, name='dispatch')
class NFeVendasListView(View):
    def get(self, request):
        # Listar ultimas 50 vendas modelo 55 (NF-e) para emissão
        vendas = Venda.objects.filter(
            id_operacao__modelo_documento='55'
        ).order_by('-id_venda')[:50]
        return render(request, 'api/nfe_vendas_list.html', {'vendas': vendas})

@method_decorator(xframe_options_exempt, name='dispatch')
class NFePainelView(View):
    def get(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)
        transportadoras = Cliente.objects.all().order_by('nome_razao_social')[:100] # Limite para nao travar
        
        return render(request, 'api/nfe_painel.html', {
            'venda': venda, 
            'transportadoras': transportadoras
        })
    
    def post(self, request, id_venda):
        venda = get_object_or_404(Venda, pk=id_venda)
        
        # Salvar dados do formulário
        venda.tipo_frete = request.POST.get('tipo_frete')
        
        transp_id = request.POST.get('transportadora')
        if transp_id:
            venda.transportadora = Cliente.objects.get(pk=transp_id)
        else:
            venda.transportadora = None
            
        venda.placa_veiculo = request.POST.get('placa_veiculo')
        venda.uf_veiculo = request.POST.get('uf_veiculo')
        venda.rntrc = request.POST.get('rntrc')
        
        venda.quantidade_volumes = request.POST.get('quantidade_volumes') or 0
        venda.especie_volumes = request.POST.get('especie_volumes')
        venda.marca_volumes = request.POST.get('marca_volumes')
        venda.peso_bruto = request.POST.get('peso_bruto') or 0
        venda.peso_liquido = request.POST.get('peso_liquido') or 0
        
        venda.observacao_fisco = request.POST.get('observacao_fisco')
        venda.observacao_contribuinte = request.POST.get('observacao_contribuinte') # Precisa adicionar este campo na migration se nao existir, ou usar um campo de obs da venda
        
        venda.save()
        
        messages.success(request, 'Dados da NF-e salvos com sucesso!')
        return redirect('nfe_painel', id_venda=id_venda)
