"""
Testes Automatizados de Integridade Fiscal e Operacional do Aperus (CI/CD Local)
==============================================================================
Valida regras críticas antes de qualquer build ou envio para a Central Mãe.
"""

from decimal import Decimal
import pytest
from api.services.tax_converter import (
    converter_cst_pis_cofins_entrada,
    converter_cst_ipi_entrada,
    converter_cfop_entrada,
    formatar_cst_icms_sped,
    sanitizar_item_fiscal_sped
)


def test_conversao_cst_pis_cofins_saida_para_entrada():
    """Valida conversão tributária de PIS/COFINS de notas de terceiros"""
    # Tributado básica/diferenciada (01-03) -> 50
    assert converter_cst_pis_cofins_entrada('01') == '50'
    assert converter_cst_pis_cofins_entrada('02') == '50'
    # Monofásico / ST (04-05) -> 70
    assert converter_cst_pis_cofins_entrada('04') == '70'
    assert converter_cst_pis_cofins_entrada('05') == '70'
    # Alíquota Zero (06) -> 73
    assert converter_cst_pis_cofins_entrada('06') == '73'
    # Isenção / Não Incidência (07-08) -> 71
    assert converter_cst_pis_cofins_entrada('07') == '71'
    # Outras saídas (49, 99) -> 98
    assert converter_cst_pis_cofins_entrada('49') == '98'
    assert converter_cst_pis_cofins_entrada('99') == '98'


def test_conversao_cst_ipi():
    """Valida conversão de IPI de fornecedores"""
    assert converter_cst_ipi_entrada('50') == '00'
    assert converter_cst_ipi_entrada('51') == '01'
    assert converter_cst_ipi_entrada('99') == '49'


def test_conversao_cfop_saida_para_entrada():
    """Valida inversão de prefixos de CFOP 5xxx -> 1xxx, 6xxx -> 2xxx"""
    assert converter_cfop_entrada('5102') == '1102'
    assert converter_cfop_entrada('6102') == '2102'
    assert converter_cfop_entrada('5405') == '1405'


def test_formatar_cst_icms_sped_normal():
    """Valida tradução de CSOSN do Simples para CST 3 dígitos do Regime Normal"""
    # CSOSN 102/101/300/400 -> 041
    assert formatar_cst_icms_sped('102') == '041'
    assert formatar_cst_icms_sped('400') == '041'
    # CSOSN 500/201 -> 060
    assert formatar_cst_icms_sped('500') == '060'
    # CST já existente normal de 1 ou 2 dígitos -> completado com zeros
    assert formatar_cst_icms_sped('00') == '000'
    assert formatar_cst_icms_sped('60') == '060'


def test_sanitizar_item_fiscal_sped():
    """Valida blindagem contra erros de base de cálculo e CSTs incompatíveis no SPED"""
    # Caso 1: CST 000 sem alíquota (PVA rejeitaria) -> deve virar 090 com BC 0
    res_zero = sanitizar_item_fiscal_sped(
        cst_raw='000',
        csosn_raw=None,
        cfop_raw='5102',
        aliq_raw=0.0,
        valor_item=Decimal('100.00')
    )
    assert res_zero['cst_icms'] == '090'
    assert res_zero['vl_bc_icms'] == Decimal('0.00')
    assert res_zero['vl_icms'] == Decimal('0.00')

    # Caso 2: CST 000 com alíquota 18% -> BC 100, ICMS 18
    res_trib = sanitizar_item_fiscal_sped(
        cst_raw='000',
        csosn_raw=None,
        cfop_raw='5102',
        aliq_raw=18.0,
        valor_item=Decimal('100.00')
    )
    assert res_trib['cst_icms'] == '000'
    assert res_trib['vl_bc_icms'] == Decimal('100.00')
    assert res_trib['vl_icms'] == Decimal('18.00')

    # Caso 3: CST 060 (ST) -> CFOP 5405 forçado, BC 0, ICMS 0
    res_st = sanitizar_item_fiscal_sped(
        cst_raw='060',
        csosn_raw=None,
        cfop_raw='5102',
        aliq_raw=18.0,
        valor_item=Decimal('50.00')
    )
    assert res_st['cst_icms'] == '060'
    assert res_st['cfop'] == '5405'
    assert res_st['vl_bc_icms'] == Decimal('0.00')
    assert res_st['vl_icms'] == Decimal('0.00')
