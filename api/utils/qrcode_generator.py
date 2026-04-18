"""
Utilitário para gerar QR Code de NFCe a partir da chave de acesso
"""
import hashlib
from decimal import Decimal


def gerar_qrcode_nfce(chave_nfe):
    """
    Gera a URL do QR Code da NFCe a partir da chave de acesso
    Conforme NT 2016.002 v2.00 - SEFAZ MG
    
    Args:
        chave_nfe: Chave de acesso da NFCe (44 dígitos)
    
    Returns:
        str: URL completa do QR Code
    """
    if not chave_nfe or len(chave_nfe) != 44:
        return ''
    
    # Buscar configuração da empresa
    from api.models import EmpresaConfig
    empresa = EmpresaConfig.get_ativa()
    
    if not empresa:
        return ''
    
    # Extrair informações da chave
    # Formato: UFaammddCNPJmodseriennncccddddddddV
    # Posições: 00-27 (28 chars) = antes do código numérico
    tp_amb = chave_nfe[20:21]  # Ambiente: 1=Produção, 2=Homologação
    
    # CSC da empresa (Código de Segurança do Contribuinte)
    # Campos do banco: nfe_csc_producao, nfe_csc_homologacao, nfe_id_token_producao, nfe_id_token_homologacao
    # Mas na EmpresaConfig os campos são: csc_token_codigo, csc_token_id
    csc = getattr(empresa, 'csc_token_codigo', None) or ''
    csc_id_str = getattr(empresa, 'csc_token_id', None) or '000001'
    
    if not csc:
        return ''
    
    # Remover leading zeros do CSC ID (ex: "000001" -> "1")
    csc_id = str(int(csc_id_str)) if csc_id_str else '1'
    
    # Versão do QR Code (sempre 2 para NFCe)
    versao_qr = "2"
    
    # URL base (MG usa a mesma URL para produção e homologação)
    url_base = "https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml"
    
    # Montar string para hash
    # Formato: chNFe|nVersao|tpAmb|cIdToken|CSC
    concat_hash = f"{chave_nfe}|{versao_qr}|{tp_amb}|{csc_id}|{csc}"
    
    # Hash SHA-1 em lowercase
    hash_sha1 = hashlib.sha1(concat_hash.encode('utf-8')).hexdigest().lower()
    
    # Parâmetro p: chNFe|nVersao|tpAmb|cIdToken|hash
    params_base = f"{chave_nfe}|{versao_qr}|{tp_amb}|{csc_id}"
    p_param = f"{params_base}|{hash_sha1}"
    
    # URL completa
    qr_url = f"{url_base}?p={p_param}"
    
    return qr_url


def atualizar_qrcode_vendas_antigas(limite=50):
    """
    Atualiza o QR Code de vendas antigas que não têm o campo preenchido
    
    Args:
        limite: Número máximo de vendas a atualizar
    
    Returns:
        dict: Resultado da operação
    """
    from api.models import Venda
    
    # Buscar vendas com NFCe emitida mas sem QR Code
    vendas = Venda.objects.filter(
        status_nfe='EMITIDA',
        chave_nfe__isnull=False
    ).exclude(
        chave_nfe=''
    ).filter(
        qrcode_nfe__isnull=True
    ) | Venda.objects.filter(
        status_nfe='EMITIDA',
        chave_nfe__isnull=False,
        qrcode_nfe=''
    )
    
    vendas = vendas.order_by('-pk')[:limite]
    
    total = vendas.count()
    atualizadas = 0
    erros = 0
    
    for venda in vendas:
        try:
            qrcode = gerar_qrcode_nfce(venda.chave_nfe)
            
            if qrcode:
                venda.qrcode_nfe = qrcode
                venda.save(update_fields=['qrcode_nfe'])
                atualizadas += 1
            else:
                erros += 1
        except Exception as e:
            print(f"Erro ao atualizar venda {venda.pk}: {e}")
            erros += 1
    
    return {
        'total': total,
        'atualizadas': atualizadas,
        'erros': erros
    }
