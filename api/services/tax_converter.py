"""
tax_converter.py — Conversor de CST e CFOP de Saída para Entrada
==================================================================
Funções utilitárias fiscais para converter códigos fiscais de notas de saída
(emitidas por fornecedores) para os códigos fiscais de entrada correspondentes
na escrituração fiscal do adquirente (Compras / SPED / Cadastro de Produtos).
"""

from typing import Optional
from decimal import Decimal


def converter_cst_pis_cofins_entrada(cst_saida: Optional[str], padrao_se_vazio: str = '50') -> str:
    """
    Converte CST de PIS / COFINS de saída (emitido pelo fornecedor)
    para o CST de entrada correspondente na aquisição.
    
    Tabela de Conversão:
      - 01 (Operação Tributável - Alíquota Básica) -> 50 (Direito a Crédito - Vinculada a Receita Tributada)
      - 02 (Operação Tributável - Alíquota Diferenciada) -> 50 (Direito a Crédito)
      - 03 (Operação Tributável - Alíquota por Unidade) -> 50 (Direito a Crédito)
      - 04 (Monofásica) -> 70 (Aquisição sem Direito a Crédito)
      - 05 (Substituição Tributária) -> 70 (Aquisição sem Direito a Crédito)
      - 06 (Alíquota Zero) -> 73 (Aquisição a Alíquota Zero)
      - 07 (Operação Isenta da Contribuição) -> 71 (Aquisição com Isenção)
      - 08 (Operação sem Incidência da Contribuição) -> 71 (Aquisição sem Incidência / Isenta)
      - 09 (Operação com Suspensão) -> 74 (Aquisição com Suspensão)
      - 49 (Outras Operações de Saída) -> 98 (Outras Operações de Entrada)
      - 99 (Outras Operações) -> 98 (Outras Operações de Entrada)
    """
    if not cst_saida:
        return padrao_se_vazio
    
    cst = str(cst_saida).strip().zfill(2)
    
    mapa_pis_cofins = {
        '01': '50',
        '02': '50',
        '03': '50',
        '04': '70',
        '05': '70',
        '06': '73',
        '07': '71',
        '08': '71',
        '09': '74',
        '49': '98',
        '99': '98',
    }
    
    # Se já for um CST de entrada (50 a 98), mantém
    if cst in mapa_pis_cofins:
        return mapa_pis_cofins[cst]
    
    return cst


def converter_cst_ipi_entrada(cst_saida: Optional[str], padrao_se_vazio: str = '00') -> str:
    """
    Converte CST de IPI de saída (emitido pelo fornecedor: 50 a 55, 99)
    para o CST de entrada correspondente na aquisição.
    
    Tabela de Conversão:
      - 50 (Saída tributada) -> 00 (Entrada com recuperação de crédito)
      - 51 (Saída tributada com alíquota zero) -> 01 (Entrada tributada com alíquota zero)
      - 52 (Saída isenta) -> 02 (Entrada isenta)
      - 53 (Saída não-tributada) -> 03 (Entrada não-tributada)
      - 54 (Saída imune) -> 04 (Entrada imune)
      - 55 (Saída com suspensão) -> 05 (Entrada com suspensão)
      - 99 (Outras saídas) -> 49 (Outras entradas)
    """
    if not cst_saida:
        return padrao_se_vazio
    
    cst = str(cst_saida).strip().zfill(2)
    
    mapa_ipi = {
        '50': '00',
        '51': '01',
        '52': '02',
        '53': '03',
        '54': '04',
        '55': '05',
        '99': '49',
    }
    
    if cst in mapa_ipi:
        return mapa_ipi[cst]
    
    return cst


def converter_cfop_entrada(cfop_saida: Optional[str], padrao_se_vazio: str = '1102') -> str:
    """
    Converte CFOP de saída (iniciado em 5, 6 ou 7) para o CFOP de entrada correspondente (1, 2 ou 3).
    Exemplos:
      - 5102 -> 1102
      - 5405 -> 1403 (se mapeado ou 1405)
      - 6102 -> 2102
      - 7102 -> 3102
    """
    if not cfop_saida:
        return padrao_se_vazio
    
    cfop = str(cfop_saida).strip()
    if not cfop:
        return padrao_se_vazio
    
    mapa_prefixos = {
        '5': '1',
        '6': '2',
        '7': '3',
    }
    
    if cfop[0] in mapa_prefixos and len(cfop) == 4:
        return mapa_prefixos[cfop[0]] + cfop[1:]
    
    return cfop


def formatar_cst_icms_sped(cst_ou_csosn: Optional[str], padrao: str = '000') -> str:
    """
    Formata o código de ICMS para o layout SPED Fiscal (Regime Normal / CRT 3).
    Se o produto estiver com CSOSN do Simples Nacional (ex: 102, 101, 500, 400),
    converte automaticamente para o CST de 3 dígitos equivalente do Regime Normal:
      - 101, 102, 103, 300, 400 -> '041' (Não tributada / Isenta)
      - 201, 202, 203, 500       -> '060' (Cobrado anteriormente por ST)
      - 900                     -> '090' (Outras)
    Garante sempre 3 dígitos numéricos válidos.
    """
    import re
    if not cst_ou_csosn:
        return padrao
    
    val = re.sub(r'[^\d]', '', str(cst_ou_csosn).strip())
    if not val:
        return padrao
    
    # Mapeamento de CSOSN do Simples -> CST Normal (3 dígitos)
    mapa_csosn = {
        '101': '041',
        '102': '041',
        '103': '041',
        '300': '041',
        '400': '041',
        '201': '060',
        '202': '060',
        '203': '060',
        '500': '060',
        '900': '090',
    }
    
    if val in mapa_csosn:
        return mapa_csosn[val]
    
    # Se já for CST de 1, 2 ou 3 dígitos, completa com zeros à esquerda
    if len(val) <= 3:
        return val.zfill(3)
    
    return val[-3:]


def sanitizar_item_fiscal_sped(cst_raw: Optional[str], csosn_raw: Optional[str], cfop_raw: Optional[str], 
                                aliq_raw: Optional[float], valor_item: Decimal) -> dict:
    """
    Higienização Inteligente para o SPED Fiscal (Regime Normal / CRT 3).
    Garante harmonia total entre CST_ICMS, CFOP, Alíquota e Base de Cálculo,
    evitando 100% dos erros do PVA da Receita Federal:
      1. Se CST for de Substituição Tributária (060/500), CFOP deve ser 5405 (ou 1403/1405 na entrada), BC=0, ICMS=0.
      2. Se CST for Isento / Não Tributado / Monofásico (040, 041, 050, 061, 102), Alíquota=0, BC=0, ICMS=0.
      3. Se CST for Tributado Integralmente / Parcial (000, 020, 090):
         - Se Alíquota > 0, BC = valor_item, ICMS = BC * (Alíquota / 100).
         - Se Alíquota == 0, força CST = 090 (Outras) ou 041, BC = 0, ICMS = 0 (PVA rejeita CST 000 com Alíquota 0.00).
      4. Se CST for 000 mas Alíquota zerada ou ausente, ajusta para 090 ou 041 para nunca quebrar a validação.
    """
    cst = formatar_cst_icms_sped(cst_raw or csosn_raw, padrao='090')
    aliq = Decimal(str(aliq_raw or 0))
    vl_item = Decimal(str(valor_item or 0))
    
    # Validação inteligente de CST vs Alíquota
    if cst in ['040', '041', '050', '061']:
        aliq = Decimal('0.00')
        vl_bc = Decimal('0.00')
        vl_icms = Decimal('0.00')
    elif cst in ['060']:
        aliq = Decimal('0.00')
        vl_bc = Decimal('0.00')
        vl_icms = Decimal('0.00')
    elif cst in ['000', '020']:
        if aliq > 0:
            vl_bc = vl_item
            vl_icms = (vl_bc * (aliq / Decimal(100))).quantize(Decimal('0.01'))
        else:
            # CST 000 com alíquota 0 é rejeitado pelo PVA -> ajusta inteligentemente para 090 (Outras)
            cst = '090'
            vl_bc = Decimal('0.00')
            vl_icms = Decimal('0.00')
    elif cst in ['090']:
        if aliq > 0:
            vl_bc = vl_item
            vl_icms = (vl_bc * (aliq / Decimal(100))).quantize(Decimal('0.01'))
        else:
            vl_bc = Decimal('0.00')
            vl_icms = Decimal('0.00')
    else:
        # Qualquer outro CST
        if aliq > 0:
            vl_bc = vl_item
            vl_icms = (vl_bc * (aliq / Decimal(100))).quantize(Decimal('0.01'))
        else:
            vl_bc = Decimal('0.00')
            vl_icms = Decimal('0.00')

    # CFOP inteligente
    cfop = str(cfop_raw or '').strip()
    if not cfop or len(cfop) != 4:
        if cst == '060':
            cfop = '5405'
        else:
            cfop = '5102'
    else:
        # Se for ST e CFOP for 5102, ajusta para 5405
        if cst == '060' and cfop in ['5102', '5101']:
            cfop = '5405'
        elif cst not in ['060', '010', '030', '070'] and cfop in ['5405', '5403']:
            cfop = '5102'

    return {
        'cst_icms': cst,
        'cfop': cfop,
        'aliq_icms': aliq,
        'vl_bc_icms': vl_bc,
        'vl_icms': vl_icms,
        'vl_item': vl_item
    }


