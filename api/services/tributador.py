"""
tributador.py — Classe Tributador (Strategy Pattern)
=====================================================
Hierarquia de busca de regra fiscal:
  Nível 1: empresa + ncm + uf_destino + tipo_operacao  (mais específico)
  Nível 2: empresa + ncm + tipo_operacao               (sem UF)
  Nível 3: empresa + ncm                               (sem UF e sem tipo_op)
  Nível 4: regime_tributario + ncm                     (regra geral do regime)
  Nível 5: produto.tributacao_detalhada (legado OneToOne)
  Nível 6: Defaults hardcoded baseados no regime       (mais genérico)

Uso:
    from api.services.tributador import Tributador

    t = Tributador(produto_id=42, empresa_id=1)
    resultado = t.tributar(valor_unitario=25.00, quantidade=10)
    print(resultado.to_dict())
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field, asdict
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Tabelas Fiscais Auxiliares — Regiões e Alíquotas Internas
# ──────────────────────────────────────────────────────────────────────────────

_ESTADOS_SUL_SUDESTE: frozenset = frozenset({
    'SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS',
})

_ESTADOS_NORTE_NORDESTE_CO: frozenset = frozenset({
    'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'GO',
    'MA', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'RN',
    'RO', 'RR', 'SE', 'TO',
})

# Alíquotas internas padrão do ICMS por UF (vigentes 2025/2026).
# ATENÇÃO: percentuais podem variar por produto ou decreto estadual.
# Consulte a SEFAZ do estado de destino para valores exatos.
ALIQUOTAS_INTERNAS_ICMS: dict = {
    'AC': Decimal('17.00'),
    'AL': Decimal('19.00'),
    'AM': Decimal('20.00'),
    'AP': Decimal('18.00'),
    'BA': Decimal('20.50'),
    'CE': Decimal('20.00'),
    'DF': Decimal('18.00'),
    'ES': Decimal('17.00'),
    'GO': Decimal('17.00'),
    'MA': Decimal('22.00'),
    'MG': Decimal('18.00'),
    'MS': Decimal('17.00'),
    'MT': Decimal('17.00'),
    'PA': Decimal('19.00'),
    'PB': Decimal('20.00'),
    'PE': Decimal('20.50'),
    'PI': Decimal('21.00'),
    'PR': Decimal('19.50'),
    'RJ': Decimal('22.00'),
    'RN': Decimal('18.00'),
    'RO': Decimal('17.50'),
    'RR': Decimal('17.00'),
    'RS': Decimal('17.00'),
    'SC': Decimal('17.00'),
    'SE': Decimal('19.00'),
    'SP': Decimal('18.00'),
    'TO': Decimal('18.00'),
}


# ──────────────────────────────────────────────────────────────────────────────
# Funções Auxiliares Fiscais
# ──────────────────────────────────────────────────────────────────────────────

def aliquota_interestadual(
    uf_origem: str,
    uf_destino: str,
    origem_mercadoria: int = 0,
) -> Decimal:
    """
    Retorna a alíquota interestadual de ICMS: 4%, 7% ou 12%.

    Regras (Res. Senado 22/89 + Res. Senado 13/2012):
      - 4%  → Mercadoria importada (origem_mercadoria 1, 2, 3, 6 ou 7 na NF-e)
               com conteúdo de importação > 40%.
      - 7%  → Origem em estado do Sul/Sudeste, destino em Norte/Nordeste/CO.
      - 12% → Demais operações interestaduais.
    """
    uf_o = (uf_origem or '').upper().strip()
    uf_d = (uf_destino or '').upper().strip()

    # Mercadoria de origem estrangeira (campo <orig> da NF-e: 1, 2, 3, 6, 7)
    if origem_mercadoria in (1, 2, 3, 6, 7):
        return Decimal('4.00')

    # Sul/Sudeste → Norte/Nordeste/Centro-Oeste
    if uf_o in _ESTADOS_SUL_SUDESTE and uf_d in _ESTADOS_NORTE_NORDESTE_CO:
        return Decimal('7.00')

    return Decimal('12.00')


def calcular_mva_ajustado(
    mva_original: Decimal,
    alq_inter: Decimal,
    alq_intra: Decimal,
    is_simples_nacional: bool = False,
) -> Decimal:
    """
    Calcula o MVA Ajustado para operações interestaduais com Substituição Tributária.

    Fórmula (Convênio ICMS 35/2011):
        MVA_ajust = [(1 + MVA_orig/100) × (1 − ALQ_inter/100)
                     / (1 − ALQ_intra/100)] − 1  ×  100

    Simulação (MVA original 40%, ALQ_intra 18%):
      ┌───────────────────┬──────────────┬─────────────────┐
      │ ALQ_inter         │ MVA Original │ MVA Ajustado    │
      ├───────────────────┼──────────────┼─────────────────┤
      │ 4%  (importados)  │ 40%          │ ≈ 63,90%        │
      │ 7%  (S/SE→N/NE)   │ 40%          │ ≈ 58,78%        │
      │ 12% (demais)      │ 40%          │ ≈ 50,24%        │
      └───────────────────┴──────────────┴─────────────────┘

    Regras especiais:
      • ALQ_inter >= ALQ_intra → retorna MVA original (não é necessário ajustar).
      • Simples Nacional → a maioria dos protocolos estaduais dispensa o ajuste;
        retorna MVA original.

    Args:
        mva_original       : MVA em percentual (ex: Decimal('40.00') para 40%).
        alq_inter          : Alíquota interestadual em % (4, 7 ou 12).
        alq_intra          : Alíquota interna do estado de destino em %.
        is_simples_nacional: True se a empresa emitente for optante do Simples Nacional.

    Returns:
        MVA ajustado em percentual, arredondado em 2 casas decimais.
    """
    # Simples Nacional ou alíquota inter >= intra → sem ajuste
    if is_simples_nacional or alq_inter >= alq_intra:
        return mva_original.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    um  = Decimal('1')
    cem = Decimal('100')
    denominador = um - alq_intra / cem
    if denominador == 0:
        return mva_original

    numerador = (um + mva_original / cem) * (um - alq_inter / cem)
    mva_ajust = ((numerador / denominador) - um) * cem
    return mva_ajust.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def sugerir_cfop(
    tipo_operacao: str,
    tem_st: bool = False,
    tipo_cliente: str = 'TODOS',
    uso_consumo: bool = False,
) -> str:
    """
    Sugere o CFOP adequado conforme a Matriz de Enquadramento Fiscal.

    Tabela resumida:
      Interna  + sem ST                     → 5102
      Interna  + ST já retida               → 5405
      Interestadual + contribuinte / ICMS   → 6102 (sem ST) / 6404 (com ST)
      Interestadual + não-contribuinte      → 6108  (+ DIFAL)
      Exportação                            → 7102

    Returns:
        CFOP como string de 4 dígitos (ex: '5102').
    """
    op      = (tipo_operacao or 'INTERNA').upper()
    cliente = (tipo_cliente or 'TODOS').upper()

    if op == 'EXPORTACAO':
        return '7102'

    if op == 'INTERESTADUAL':
        nao_contribuinte = cliente in ('NAO_CONTRIBUINTE', 'CONSUMIDOR_FINAL')
        if nao_contribuinte or uso_consumo:
            return '6108'   # Venda p/ não-contribuinte / uso-consumo c/ DIFAL
        if tem_st:
            return '6404'   # Venda interestadual c/ ST (conforme protocolo)
        return '6102'       # Venda interestadual padrão (revenda)

    # Operação Interna
    if tem_st:
        return '5405'   # Venda interna de produto com ST já retida
    return '5102'           # Venda interna padrão


# ──────────────────────────────────────────────────────────────────────────────
# DataClass de Resultado
# ──────────────────────────────────────────────────────────────────────────────

@dataclass
class ResultadoTributacao:
    """
    Resultado completo da tributação de um item.
    Cobre o layout NF-e legado (ICMS/PIS/COFINS/IPI) e
    os novos campos da Reforma Tributária 2026 (IBS/CBS/IS).
    """

    # ── Contexto ────────────────────────────────────────────────────────────
    produto_id: int
    empresa_id: Optional[int]
    ncm: str
    cfop: str
    tipo_operacao: str
    uf_destino: Optional[str]
    nivel_fallback: int          # 1–6 — indica qual nível da hierarquia foi usado
    origem_regra: str            # Descrição textual da origem da regra
    c_benef: Optional[str] = None
    c_class_trib: Optional[str] = None
    cest: Optional[str] = None

    # ── Bloco ICMS ──────────────────────────────────────────────────────────
    icms_cst_csosn: str = '400'
    icms_modalidade_bc: str = '3'
    icms_aliq: Decimal = Decimal('0.00')
    icms_reducao_bc_perc: Decimal = Decimal('0.00')
    icms_bc: Decimal = Decimal('0.00')
    icms_valor: Decimal = Decimal('0.00')
    icms_desonerado: Decimal = Decimal('0.00')

    # ── Bloco ICMS-ST ───────────────────────────────────────────────────────
    icmsst_aliq: Decimal = Decimal('0.00')
    icmsst_mva_perc: Decimal = Decimal('0.00')       # MVA original informado na regra
    icmsst_mva_original: Decimal = Decimal('0.00')   # cópia do MVA original pós-cálculo
    icmsst_mva_ajustado: Decimal = Decimal('0.00')   # MVA efetivo (ajustado se interestadual)
    icmsst_reducao_bc_perc: Decimal = Decimal('0.00')
    icmsst_bc: Decimal = Decimal('0.00')
    icmsst_valor: Decimal = Decimal('0.00')

    # ── Interestadual — Alíquotas e DIFAL ───────────────────────────────────
    aliq_interestadual: Decimal = Decimal('0.00')    # 4%, 7% ou 12%
    difal_aliq_interna: Decimal = Decimal('0.00')    # alíq. interna do estado de destino
    difal_aliq_inter: Decimal = Decimal('0.00')      # alíq. interestadual usada no DIFAL
    difal_bc: Decimal = Decimal('0.00')              # base de cálculo do DIFAL
    difal_valor_destino: Decimal = Decimal('0.00')   # vICMSUFDest (EC 87/2015)
    difal_valor_origem: Decimal = Decimal('0.00')    # vICMSUFRemet (partilha, 0% desde 2019)

    # ── FCP / FEM (Fundo de Combate à Pobreza) ──────────────────────────────
    fcp_aliq: Decimal = Decimal('0.00')
    fcp_bc: Decimal = Decimal('0.00')
    fcp_valor: Decimal = Decimal('0.00')

    # ── Bloco PIS ───────────────────────────────────────────────────────────
    pis_cst: str = '07'
    pis_aliq: Decimal = Decimal('1.65')
    pis_bc: Decimal = Decimal('0.00')
    pis_valor: Decimal = Decimal('0.00')

    # ── Bloco COFINS ────────────────────────────────────────────────────────
    cofins_cst: str = '07'
    cofins_aliq: Decimal = Decimal('7.60')
    cofins_bc: Decimal = Decimal('0.00')
    cofins_valor: Decimal = Decimal('0.00')

    # ── Bloco IPI ───────────────────────────────────────────────────────────
    ipi_cst: str = '99'
    ipi_aliq: Decimal = Decimal('0.00')
    ipi_classe_enquadramento: Optional[str] = None
    ipi_bc: Decimal = Decimal('0.00')
    ipi_valor: Decimal = Decimal('0.00')

    # ── Bloco Reforma 2026 (IBS / CBS / IS) ─────────────────────────────────
    ibs_cst: str = '410'
    ibs_aliq: Decimal = Decimal('0.10')
    ibs_bc: Decimal = Decimal('0.00')
    ibs_valor: Decimal = Decimal('0.00')

    cbs_cst: str = '410'
    cbs_aliq: Decimal = Decimal('0.90')
    cbs_bc: Decimal = Decimal('0.00')
    cbs_valor: Decimal = Decimal('0.00')

    is_aliq: Decimal = Decimal('0.00')
    is_bc: Decimal = Decimal('0.00')
    is_valor: Decimal = Decimal('0.00')

    # ── Reforma 2026 — Classificação e Split Payment ─────────────────────────
    tipo_produto_reform: str = 'PADRAO'
    split_payment: bool = False

    # ── Contexto adicional ───────────────────────────────────────────────────
    tipo_cliente: str = 'TODOS'
    uf_origem: Optional[str] = None

    # ── Bloco Agro ──────────────────────────────────────────────────────────
    diferimento_icms_perc: Decimal = Decimal('0.00')
    funrural_aliq: Decimal = Decimal('0.00')
    senar_aliq: Decimal = Decimal('0.00')
    funrural_valor: Decimal = Decimal('0.00')
    senar_valor: Decimal = Decimal('0.00')

    # ── Totais do Item ───────────────────────────────────────────────────────
    valor_unitario: Decimal = Decimal('0.00')
    quantidade: Decimal = Decimal('1.00')
    valor_total_produto: Decimal = Decimal('0.00')
    valor_total_tributos: Decimal = Decimal('0.00')
    carga_tributaria_perc: Decimal = Decimal('0.00')

    def to_dict(self) -> dict:
        """Serializa para dicionário com floats (compatível com JSON/DRF)."""
        d = asdict(self)
        for k, v in d.items():
            if isinstance(v, Decimal):
                d[k] = float(v)
        return d

    def to_nfe_dict(self) -> dict:
        """
        Retorna apenas os campos necessários para montar o XML da NF-e.
        Usa os nomes exatos das tags da NF-e 4.0.
        """
        return {
            # NCM / identificação
            'NCM':        self.ncm,
            'CFOP':       self.cfop,
            'cBenef':     self.c_benef or '',
            'cClassTrib': self.c_class_trib or '',
            'CEST':       self.cest or '',
            # ICMS
            'CST_ICMS':   self.icms_cst_csosn,
            'modBC':      self.icms_modalidade_bc,
            'pICMS':      float(self.icms_aliq),
            'pRedBC':     float(self.icms_reducao_bc_perc),
            'vBC':        float(self.icms_bc),
            'vICMS':      float(self.icms_valor),
            'vICMSDeson': float(self.icms_desonerado),
            # ICMS-ST — MVA
            'pMVAST':     float(self.icmsst_mva_perc),
            'pMVAOrig':   float(self.icmsst_mva_original),
            'pMVAAjust':  float(self.icmsst_mva_ajustado),
            'pICMSST':   float(self.icmsst_aliq),
            'vBCST':     float(self.icmsst_bc),
            'vICMSST':   float(self.icmsst_valor),
            # Interestadual — DIFAL (ICMSDest — EC 87/2015)
            'pICMSInter':   float(self.difal_aliq_inter),
            'pICMSUFDest':  float(self.difal_aliq_interna),
            'vBCUFDest':    float(self.difal_bc),
            'vICMSUFDest':  float(self.difal_valor_destino),
            'vICMSUFRemet': float(self.difal_valor_origem),
            # FCP / FEM
            'pFCPUFDest': float(self.fcp_aliq),
            'vBCFCP':     float(self.fcp_bc),
            'vFCP':       float(self.fcp_valor),
            # PIS
            'CST_PIS':   self.pis_cst,
            'pPIS':      float(self.pis_aliq),
            'vBCPIS':    float(self.pis_bc),
            'vPIS':      float(self.pis_valor),
            # COFINS
            'CST_COF':   self.cofins_cst,
            'pCOFINS':   float(self.cofins_aliq),
            'vBCCOF':    float(self.cofins_bc),
            'vCOFINS':   float(self.cofins_valor),
            # IPI
            'CST_IPI':   self.ipi_cst,
            'clEnq':     self.ipi_classe_enquadramento or '',
            'pIPI':      float(self.ipi_aliq),
            'vIPI':      float(self.ipi_valor),
            # Reforma 2026 — IBS
            'CST_IBS':   self.ibs_cst,
            'pIBS':      float(self.ibs_aliq),
            'vBC_IBS':   float(self.ibs_bc),
            'vIBS':      float(self.ibs_valor),
            # Reforma 2026 — CBS
            'CST_CBS':   self.cbs_cst,
            'pCBS':      float(self.cbs_aliq),
            'vBC_CBS':   float(self.cbs_bc),
            'vCBS':      float(self.cbs_valor),
            # Reforma 2026 — IS
            'pIS':       float(self.is_aliq),
            'vBC_IS':    float(self.is_bc),
            'vIS':       float(self.is_valor),
            # Agro
            'pDiferimento': float(self.diferimento_icms_perc),
            'pFunrural':    float(self.funrural_aliq),
            'vFunrural':    float(self.funrural_valor),
            # Reforma 2026 — contexto
            'tipoProdutoReform': self.tipo_produto_reform,
            'splitPayment':      self.split_payment,
        }


# ──────────────────────────────────────────────────────────────────────────────
# Defaults por Regime (Nível 6 — último fallback)
# ──────────────────────────────────────────────────────────────────────────────

_DEFAULTS_POR_REGIME: dict[str, dict] = {
    'SIMPLES': {
        'icms_cst_csosn': '400',   # CSOSN: sem débito ICMS
        'pis_cst':        '07',    # Isento (Simples inclui PIS)
        'cofins_cst':     '07',
        'pis_aliq':       Decimal('0.00'),
        'cofins_aliq':    Decimal('0.00'),
        'ipi_cst':        '99',
        'ibs_aliq':       Decimal('0.10'),
        'cbs_aliq':       Decimal('0.90'),
        'ibs_cst':        '410',
        'cbs_cst':        '410',
        'cfop':           '5102',
    },
    'MEI': {
        'icms_cst_csosn': '400',
        'pis_cst':        '07',
        'cofins_cst':     '07',
        'pis_aliq':       Decimal('0.00'),
        'cofins_aliq':    Decimal('0.00'),
        'ipi_cst':        '99',
        'ibs_aliq':       Decimal('0.10'),
        'cbs_aliq':       Decimal('0.90'),
        'ibs_cst':        '410',
        'cbs_cst':        '410',
        'cfop':           '5102',
    },
    'LUCRO_PRESUMIDO': {
        'icms_cst_csosn': '000',   # CST: tributado integral
        'pis_cst':        '01',
        'cofins_cst':     '01',
        'pis_aliq':       Decimal('1.65'),
        'cofins_aliq':    Decimal('7.60'),
        'ipi_cst':        '50',
        'ibs_aliq':       Decimal('0.10'),
        'cbs_aliq':       Decimal('0.90'),
        'ibs_cst':        '410',
        'cbs_cst':        '410',
        'cfop':           '5102',
    },
    'LUCRO_REAL': {
        'icms_cst_csosn': '000',
        'pis_cst':        '01',
        'cofins_cst':     '01',
        'pis_aliq':       Decimal('1.65'),
        'cofins_aliq':    Decimal('7.60'),
        'ipi_cst':        '50',
        'ibs_aliq':       Decimal('0.10'),
        'cbs_aliq':       Decimal('0.90'),
        'ibs_cst':        '410',
        'cbs_cst':        '410',
        'cfop':           '5102',
    },
    'NORMAL': {
        'icms_cst_csosn': '000',
        'pis_cst':        '01',
        'cofins_cst':     '01',
        'pis_aliq':       Decimal('1.65'),
        'cofins_aliq':    Decimal('7.60'),
        'ipi_cst':        '50',
        'ibs_aliq':       Decimal('0.10'),
        'cbs_aliq':       Decimal('0.90'),
        'ibs_cst':        '410',
        'cbs_cst':        '410',
        'cfop':           '5102',
    },
}


# ──────────────────────────────────────────────────────────────────────────────
# Tributador Principal
# ──────────────────────────────────────────────────────────────────────────────

class Tributador:
    """
    Motor de tributação fiscal com padrão Strategy + Fallback em Cascata.

    Parâmetros de construção:
        produto_id     — PK do Produto
        empresa_id     — PK da EmpresaConfig (None usa apenas regime)
        uf_destino     — UF do destinatário/destinatário (ex: 'MG', 'SP')
        tipo_operacao  — Chave de RegraFiscal.TIPO_OPERACAO_CHOICES
                         Padrão: 'INTERNA'

    Exemplo:
        resultado = Tributador(produto_id=42, empresa_id=1, uf_destino='MG').tributar(
            valor_unitario=150.00, quantidade=5
        )
        print(resultado.to_nfe_dict())
    """

    TIPO_INTERNA       = 'INTERNA'
    TIPO_INTERESTADUAL = 'INTERESTADUAL'
    TIPO_EXPORTACAO    = 'EXPORTACAO'
    TIPO_RURAL         = 'RURAL'

    def __init__(
        self,
        produto_id: int,
        empresa_id: Optional[int] = None,
        uf_destino: Optional[str] = None,
        tipo_operacao: str = 'INTERNA',
        tipo_cliente: str = 'TODOS',
        uf_origem: Optional[str] = None,
    ):
        self.produto_id    = produto_id
        self.empresa_id    = empresa_id
        self.uf_destino    = uf_destino.upper() if uf_destino else None
        self.tipo_operacao = tipo_operacao.upper()
        self.tipo_cliente  = (tipo_cliente or 'TODOS').upper()
        self.uf_origem     = uf_origem.upper() if uf_origem else None

        # Lazy-loaded
        self._produto     = None
        self._empresa     = None
        self._regra       = None      # RegraFiscal encontrada
        self._nivel       = 0
        self._origem_info = ''

    # ── Lazy loaders ─────────────────────────────────────────────────────────

    def _get_produto(self):
        if self._produto is None:
            from api.models import Produto
            try:
                self._produto = Produto.objects.select_related(
                    'tributacao_detalhada'
                ).get(id_produto=self.produto_id)
            except Produto.DoesNotExist:
                raise ValueError(f"Produto id={self.produto_id} não encontrado.")
        return self._produto

    def _get_empresa(self):
        if self._empresa is None and self.empresa_id:
            from api.models import EmpresaConfig
            try:
                self._empresa = EmpresaConfig.objects.get(id_empresa=self.empresa_id)
            except EmpresaConfig.DoesNotExist:
                logger.warning("EmpresaConfig id=%s não encontrada.", self.empresa_id)
                self._empresa = None
        return self._empresa

    # ── Estratégias de busca (1 → 5) ─────────────────────────────────────────

    def _buscar_regra(self) -> Optional[object]:
        """
        Percorre a hierarquia de regras até encontrar uma.
        Retorna a RegraFiscal ou None se nenhuma for encontrada.

        Hierarquia (7 níveis → faz fallback para legado no .tributar()):
          1. empresa + uf_origem + uf_destino + tipo_op + tipo_cliente
          2. empresa + uf_destino + tipo_op (sem uf_origem)
          3. empresa + tipo_op (sem UF)
          4. empresa + NCM (geral, sem UF e sem tipo_op)
          5. regime + NCM
          6. NCM global (sem empresa, sem regime)
        """
        from api.models import RegraFiscal
        produto = self._get_produto()
        empresa = self._get_empresa()
        ncm = (produto.ncm or '').replace('.', '').strip()

        if not ncm:
            logger.info("Produto %s sem NCM — usando defaults.", self.produto_id)
            return None

        qs_base = RegraFiscal.objects.filter(ncm_codigo=ncm, ativo=True)

        def _first(qs):
            """Prioriza tipo_cliente exato sobre TODOS."""
            exact = qs.filter(tipo_cliente=self.tipo_cliente).first()
            return exact or qs.filter(tipo_cliente='TODOS').first()

        # Nível 1: empresa + uf_origem + uf_destino + tipo_op + tipo_cliente
        if empresa and self.uf_destino and self.uf_origem:
            regra = _first(qs_base.filter(
                empresa=empresa,
                uf_origem=self.uf_origem,
                uf_destino=self.uf_destino,
                tipo_operacao=self.tipo_operacao,
            ))
            if regra:
                self._nivel, self._origem_info = 1, f"E#{empresa.id_empresa}+NCM+UF:{self.uf_origem}→{self.uf_destino}+Op"
                return regra

        # Nível 2: empresa + uf_destino + tipo_op (sem uf_origem)
        if empresa and self.uf_destino:
            regra = _first(qs_base.filter(
                empresa=empresa,
                uf_origem__isnull=True,
                uf_destino=self.uf_destino,
                tipo_operacao=self.tipo_operacao,
            ))
            if regra:
                self._nivel, self._origem_info = 2, f"E#{empresa.id_empresa}+NCM+UF:{self.uf_destino}+Op:{self.tipo_operacao}"
                return regra

        # Nível 3: empresa + tipo_op (sem UF)
        if empresa:
            regra = _first(qs_base.filter(
                empresa=empresa,
                uf_destino__isnull=True,
                tipo_operacao=self.tipo_operacao,
            ))
            if regra:
                self._nivel, self._origem_info = 3, f"E#{empresa.id_empresa}+NCM+Op:{self.tipo_operacao}"
                return regra

        # Nível 4: empresa + NCM (sem UF, sem tipo_op — regra geral da empresa)
        if empresa:
            regra = qs_base.filter(empresa=empresa, uf_destino__isnull=True).exclude(
                tipo_operacao=self.tipo_operacao).first() or qs_base.filter(empresa=empresa).first()
            if regra:
                self._nivel, self._origem_info = 4, f"E#{empresa.id_empresa}+NCM (geral)"
                return regra

        # Nível 5: regime_tributario + NCM
        regime = (empresa.regime_tributario if empresa else None)
        if regime:
            regra = _first(qs_base.filter(
                empresa__isnull=True,
                regime_tributario=regime,
            ))
            if regra:
                self._nivel, self._origem_info = 5, f"Regime:{regime}+NCM"
                return regra

        # Nível 6: NCM global (sem empresa, sem regime)
        regra = qs_base.filter(empresa__isnull=True, regime_tributario__isnull=True).first()
        if regra:
            self._nivel, self._origem_info = 6, f"NCM:{ncm} (regra global)"
            return regra

        return None

    # ── Construção do resultado ───────────────────────────────────────────────

    def _resultado_de_regra(
        self,
        regra,
        valor_unitario: Decimal,
        quantidade: Decimal,
    ) -> ResultadoTributacao:
        """Constrói ResultadoTributacao a partir de uma RegraFiscal DB."""
        self._regra = regra
        p = self._get_produto()

        res = ResultadoTributacao(
            produto_id    = self.produto_id,
            empresa_id    = self.empresa_id,
            ncm           = p.ncm or '',
            cfop          = regra.cfop or '5102',
            tipo_operacao = self.tipo_operacao,
            uf_destino    = self.uf_destino,
            nivel_fallback= self._nivel,
            origem_regra  = self._origem_info,
            c_benef       = regra.c_benef,
            c_class_trib  = regra.c_class_trib,
            cest          = regra.cest_codigo,
            # ICMS
            icms_cst_csosn      = regra.icms_cst_csosn or '400',
            icms_modalidade_bc  = regra.icms_modalidade_bc or '3',
            icms_aliq           = Decimal(str(regra.icms_aliq)),
            icms_reducao_bc_perc= Decimal(str(regra.icms_reducao_bc_perc)),
            icms_desonerado     = Decimal(str(regra.icms_desonerado)),
            # ICMS-ST
            icmsst_aliq         = Decimal(str(regra.icmsst_aliq)),
            icmsst_mva_perc     = Decimal(str(regra.icmsst_mva_perc)),
            icmsst_reducao_bc_perc = Decimal(str(regra.icmsst_reducao_bc_perc)),
            # PIS
            pis_cst       = regra.pis_cst or '07',
            pis_aliq      = Decimal(str(regra.pis_aliq)),
            # COFINS
            cofins_cst    = regra.cofins_cst or '07',
            cofins_aliq   = Decimal(str(regra.cofins_aliq)),
            # IPI
            ipi_cst       = regra.ipi_cst or '99',
            ipi_aliq      = Decimal(str(regra.ipi_aliq)),
            ipi_classe_enquadramento = regra.ipi_classe_enquadramento,
            # IBS / CBS / IS
            ibs_cst       = regra.ibs_cst or '410',
            ibs_aliq      = Decimal(str(regra.ibs_aliq)),
            cbs_cst       = regra.cbs_cst or '410',
            cbs_aliq      = Decimal(str(regra.cbs_aliq)),
            is_aliq       = Decimal(str(regra.is_aliq)),
            # Agro
            diferimento_icms_perc = Decimal(str(regra.diferimento_icms_perc)),
            funrural_aliq         = Decimal(str(regra.funrural_aliq)),
            senar_aliq            = Decimal(str(regra.senar_aliq)),
            # Reforma 2026
            tipo_produto_reform   = regra.tipo_produto_reform or 'PADRAO',
            split_payment         = bool(regra.split_payment),
            tipo_cliente          = self.tipo_cliente,
            uf_origem             = self.uf_origem,
        )

        return self._calcular_valores(res, valor_unitario, quantidade)

    def _resultado_de_legado(
        self,
        valor_unitario: Decimal,
        quantidade: Decimal,
    ) -> ResultadoTributacao:
        """
        Nível 5 — usa tributacao_detalhada (OneToOne legado).
        """
        p = self._get_produto()
        try:
            trib = p.tributacao_detalhada
        except Exception:
            trib = None

        self._nivel, self._origem_info = 7, "Tributacao legada (OneToOne)"

        res = ResultadoTributacao(
            produto_id    = self.produto_id,
            empresa_id    = self.empresa_id,
            ncm           = p.ncm or '',
            cfop          = (trib.cfop if trib and trib.cfop else '5102'),
            tipo_operacao = self.tipo_operacao,
            uf_destino    = self.uf_destino,
            nivel_fallback= self._nivel,
            origem_regra  = self._origem_info,
            tipo_cliente  = self.tipo_cliente,
            uf_origem     = self.uf_origem,
        )

        if trib:
            empresa = self._get_empresa()
            regime  = (empresa.regime_tributario if empresa else 'SIMPLES') or 'SIMPLES'
            is_sn   = regime == 'SIMPLES'

            if is_sn:
                # Simples Nacional — usa CSOSN + campos SN de PIS/COFINS/IPI
                res.icms_cst_csosn = trib.csosn or '400'
                res.pis_cst        = trib.cst_pis_sn or '07'
                res.pis_aliq       = Decimal(str(trib.pis_aliquota_sn or 0))
                res.cofins_cst     = trib.cst_cofins_sn or '07'
                res.cofins_aliq    = Decimal(str(trib.cofins_aliquota_sn or 0))
                res.ipi_cst        = trib.cst_ipi_sn or '99'
                res.ipi_aliq       = Decimal(str(trib.ipi_aliquota_sn or 0))
            else:
                # Lucro Presumido / Lucro Real — usa CST + campos Regime Normal
                res.icms_cst_csosn = trib.cst_icms or '000'
                res.pis_cst        = trib.cst_pis_cofins or '01'
                res.pis_aliq       = Decimal(str(trib.pis_aliquota or 0))
                res.cofins_cst     = trib.cst_pis_cofins or '01'
                res.cofins_aliq    = Decimal(str(trib.cofins_aliquota or 0))
                res.ipi_cst        = trib.cst_ipi or '99'
                res.ipi_aliq       = Decimal(str(trib.ipi_aliquota or 0))

            # Campos comuns a ambos os regimes
            res.icms_aliq = Decimal(str(trib.icms_aliquota or 0))
            res.ibs_cst   = trib.cst_ibs_cbs or '410'
            res.ibs_aliq  = Decimal(str(trib.ibs_aliquota or 0))
            res.cbs_cst   = trib.cst_ibs_cbs or '410'
            res.cbs_aliq  = Decimal(str(trib.cbs_aliquota or 0))
            res.is_aliq   = Decimal(str(trib.imposto_seletivo_aliquota or 0))

        return self._calcular_valores(res, valor_unitario, quantidade)

    def _resultado_defaults(
        self,
        valor_unitario: Decimal,
        quantidade: Decimal,
    ) -> ResultadoTributacao:
        """
        Nível 6 — defaults hardcoded baseados no regime da empresa.
        """
        self._nivel, self._origem_info = 8, "Defaults hardcoded (sem regra cadastrada)"

        empresa  = self._get_empresa()
        regime   = (empresa.regime_tributario if empresa else None) or 'SIMPLES'
        defaults = _DEFAULTS_POR_REGIME.get(regime, _DEFAULTS_POR_REGIME['SIMPLES'])

        p = self._get_produto()

        res = ResultadoTributacao(
            produto_id    = self.produto_id,
            empresa_id    = self.empresa_id,
            ncm           = p.ncm or '',
            cfop          = defaults['cfop'],
            tipo_operacao = self.tipo_operacao,
            uf_destino    = self.uf_destino,
            nivel_fallback= self._nivel,
            origem_regra  = self._origem_info,
            tipo_cliente  = self.tipo_cliente,
            uf_origem     = self.uf_origem,
            icms_cst_csosn = defaults['icms_cst_csosn'],
            pis_cst        = defaults['pis_cst'],
            pis_aliq       = defaults['pis_aliq'],
            cofins_cst     = defaults['cofins_cst'],
            cofins_aliq    = defaults['cofins_aliq'],
            ibs_cst        = defaults['ibs_cst'],
            ibs_aliq       = defaults['ibs_aliq'],
            cbs_cst        = defaults['cbs_cst'],
            cbs_aliq       = defaults['cbs_aliq'],
        )
        return self._calcular_valores(res, valor_unitario, quantidade)

    # ── Cálculo dos valores monetários ───────────────────────────────────────

    def _calcular_valores(
        self,
        res: ResultadoTributacao,
        valor_unitario: Decimal,
        quantidade: Decimal,
    ) -> ResultadoTributacao:
        """
        Aplica as alíquotas sobre o valor total do item e preenche os campos
        de base de cálculo e valor de cada tributo.
        """
        q4 = Decimal('0.0001')   # precisão interna
        q2 = Decimal('0.01')     # precisão NF-e

        def r2(v: Decimal) -> Decimal:
            return v.quantize(q2, rounding=ROUND_HALF_UP)

        vt = (valor_unitario * quantidade).quantize(q4)

        res.valor_unitario        = valor_unitario
        res.quantidade            = quantidade
        res.valor_total_produto   = r2(vt)

        # ── ICMS ─────────────────────────────────────────────────────────
        cst_indica_tributado = res.icms_cst_csosn not in (
            '040', '041', '400', '500',  # CSOSN isentos/imunes
            '040', '041', '050', '051',
            '060', '070', '090', '099',
        )
        if cst_indica_tributado and res.icms_aliq > 0:
            reducao = Decimal('1') - (res.icms_reducao_bc_perc / Decimal('100'))
            diferimento_fator = Decimal('1') - (res.diferimento_icms_perc / Decimal('100'))
            res.icms_bc    = r2(vt * reducao)
            res.icms_valor = r2(res.icms_bc * (res.icms_aliq / Decimal('100')) * diferimento_fator)
        else:
            res.icms_bc    = Decimal('0.00')
            res.icms_valor = Decimal('0.00')

        # ── Contexto Interestadual (determina alíquotas para MVA Ajustado e DIFAL) ──
        _alq_inter    = Decimal('0.00')
        _alq_intra    = Decimal('0.00')
        _is_interstate = (
            self.tipo_operacao == self.TIPO_INTERESTADUAL
            and bool(self.uf_origem)
            and bool(self.uf_destino)
            and self.uf_origem.upper() != self.uf_destino.upper()
        )
        if _is_interstate:
            _alq_inter = aliquota_interestadual(self.uf_origem, self.uf_destino)
            _alq_intra = ALIQUOTAS_INTERNAS_ICMS.get(
                self.uf_destino.upper(), Decimal('18.00')
            )
            res.aliq_interestadual = _alq_inter
            res.difal_aliq_inter   = _alq_inter
            res.difal_aliq_interna = _alq_intra

        # ── ICMS-ST ───────────────────────────────────────────────────────
        if res.icmsst_aliq > 0:
            # Calcula MVA Ajustado quando a operação é interestadual
            if _is_interstate and res.icmsst_mva_perc > 0:
                empresa  = self._get_empresa()
                regime   = (empresa.regime_tributario if empresa else 'SIMPLES') or 'SIMPLES'
                _is_sn   = regime in ('SIMPLES', 'MEI')
                _mva_efetivo = calcular_mva_ajustado(
                    res.icmsst_mva_perc, _alq_inter, _alq_intra, _is_sn
                )
            else:
                _mva_efetivo = res.icmsst_mva_perc

            res.icmsst_mva_original = res.icmsst_mva_perc
            res.icmsst_mva_ajustado = _mva_efetivo

            mva_fator = Decimal('1') + (_mva_efetivo / Decimal('100'))
            red_fator = Decimal('1') - (res.icmsst_reducao_bc_perc / Decimal('100'))
            res.icmsst_bc    = r2(vt * mva_fator * red_fator)
            res.icmsst_valor = r2(res.icmsst_bc * (res.icmsst_aliq / Decimal('100')) - res.icms_valor)
            if res.icmsst_valor < 0:
                res.icmsst_valor = Decimal('0.00')

        # ── PIS ───────────────────────────────────────────────────────────
        res.pis_bc    = r2(vt)
        res.pis_valor = r2(vt * (res.pis_aliq / Decimal('100')))

        # ── COFINS ────────────────────────────────────────────────────────
        res.cofins_bc    = r2(vt)
        res.cofins_valor = r2(vt * (res.cofins_aliq / Decimal('100')))

        # ── IPI ───────────────────────────────────────────────────────────
        res.ipi_bc    = r2(vt)
        res.ipi_valor = r2(vt * (res.ipi_aliq / Decimal('100')))

        # ── DIFAL (EC 87/2015 — Consumidor Final Não Contribuinte) ───────
        # Aplica quando: interestadual + consumidor final + alq_intra > alq_inter.
        # Base = valor total do produto. Percentual = ALQ_intra - ALQ_inter.
        # A partir de 2019 (100% ao estado de destino; nenhuma parcela ao remetente).
        _e_nao_contribuinte = res.tipo_cliente in ('NAO_CONTRIBUINTE', 'CONSUMIDOR_FINAL')
        if _is_interstate and _e_nao_contribuinte and _alq_intra > _alq_inter:
            res.difal_bc            = r2(vt)
            _difal_perc             = (_alq_intra - _alq_inter) / Decimal('100')
            res.difal_valor_destino = r2(vt * _difal_perc)
            res.difal_valor_origem  = Decimal('0.00')

        # ── FCP / FEM (Fundo de Combate à Pobreza) ───────────────────────
        # Calculado sobre a mesma base do DIFAL (quando aplicável).
        if res.fcp_aliq > 0:
            res.fcp_bc    = r2(vt)
            res.fcp_valor = r2(vt * (res.fcp_aliq / Decimal('100')))

        # ── IBS (Reforma 2026) ────────────────────────────────────────────
        res.ibs_bc    = r2(vt)
        res.ibs_valor = r2(vt * (res.ibs_aliq / Decimal('100')))

        # ── CBS (Reforma 2026) ────────────────────────────────────────────
        res.cbs_bc    = r2(vt)
        res.cbs_valor = r2(vt * (res.cbs_aliq / Decimal('100')))

        # ── IS (Imposto Seletivo) ─────────────────────────────────────────
        if res.is_aliq > 0:
            res.is_bc    = r2(vt)
            res.is_valor = r2(vt * (res.is_aliq / Decimal('100')))

        # ── Agro ──────────────────────────────────────────────────────────
        if res.funrural_aliq > 0:
            res.funrural_valor = r2(vt * (res.funrural_aliq / Decimal('100')))
        if res.senar_aliq > 0:
            res.senar_valor = r2(vt * (res.senar_aliq / Decimal('100')))

        # ── Totais ────────────────────────────────────────────────────────
        res.valor_total_tributos = r2(
            res.icms_valor + res.icmsst_valor
            + res.pis_valor + res.cofins_valor
            + res.ipi_valor
            + res.ibs_valor + res.cbs_valor + res.is_valor
            + res.funrural_valor + res.senar_valor
            + res.difal_valor_destino
            + res.fcp_valor
        )

        if res.valor_total_produto > 0:
            res.carga_tributaria_perc = r2(
                (res.valor_total_tributos / res.valor_total_produto) * Decimal('100')
            )

        return res

    # ── Método público principal ──────────────────────────────────────────────

    def tributar(
        self,
        valor_unitario: float | Decimal | str = Decimal('0.00'),
        quantidade:     float | Decimal | str = Decimal('1.00'),
    ) -> ResultadoTributacao:
        """
        Executa toda a cadeia Strategy + Fallback e retorna o ResultadoTributacao.

        Args:
            valor_unitario: Preço unitário do produto (sem impostos já embutidos).
            quantidade:     Quantidade da linha do item.

        Returns:
            ResultadoTributacao com todos os blocos calculados.

        Raises:
            ValueError: Se o produto_id não existir.
        """
        vu = Decimal(str(valor_unitario))
        qt = Decimal(str(quantidade))

        try:
            # Estratégias 1–4 via RegraFiscal no banco
            regra = self._buscar_regra()
            if regra:
                return self._resultado_de_regra(regra, vu, qt)

            # Estratégia 5 — tributacao_detalhada legada (OneToOne)
            produto = self._get_produto()
            if hasattr(produto, 'tributacao_detalhada') and produto.tributacao_detalhada is not None:
                return self._resultado_de_legado(vu, qt)

            # Estratégia 6 — defaults hardcoded
            return self._resultado_defaults(vu, qt)

        except ValueError:
            raise
        except Exception as exc:
            logger.error("Tributador.tributar erro produto=%s empresa=%s: %s",
                         self.produto_id, self.empresa_id, exc, exc_info=True)
            # Mesmo em erro crítico, retorna defaults para não travar emissão
            return self._resultado_defaults(vu, qt)


# ──────────────────────────────────────────────────────────────────────────────
# Helper de conveniência
# ──────────────────────────────────────────────────────────────────────────────

def tributar_item(
    produto_id: int,
    empresa_id: Optional[int],
    valor_unitario: float,
    quantidade: float = 1.0,
    uf_destino: Optional[str] = None,
    tipo_operacao: str = 'INTERNA',
) -> dict:
    """
    Atalho funcional — retorna diretamente o dicionário do resultado.

    Exemplo:
        dados = tributar_item(produto_id=42, empresa_id=1, valor_unitario=100.0,
                              quantidade=5, uf_destino='SP')
    """
    return Tributador(
        produto_id=produto_id,
        empresa_id=empresa_id,
        uf_destino=uf_destino,
        tipo_operacao=tipo_operacao,
    ).tributar(valor_unitario=valor_unitario, quantidade=quantidade).to_dict()
