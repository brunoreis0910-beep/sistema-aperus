from django.shortcuts import render

def agro_index(request):
    return render(request, 'agro/index.html')

def agro_safras(request):
    return render(request, 'agro/safras.html')

def agro_contratos(request):
    return render(request, 'agro/contratos.html')

def agro_conversoes(request):
    return render(request, 'agro/conversoes.html')
