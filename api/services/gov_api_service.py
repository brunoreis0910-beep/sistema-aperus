"""
Serviço de integração com a API oficial do Governo Federal
para cálculo de IBS/CBS (Reforma Tributária 2026)

Fluxo:
1. Tenta API do Governo (localhost:8080) - DADOS OFICIAIS
2. Se falhar, usa banco local (ncm_local.db) - FALLBACK
"""

import requests
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class GovAPIService:
    """
    Cliente para a API oficial de cálculo tributário do Governo Federal
    Endpoint: http://localhost:8080/api/calculadora/regime-geral
    """
    
    def __init__(self):
        self.base_url = 'http://localhost:8080'
        self.endpoint = f'{self.base_url}/api/calculadora/regime-geral'
        self.timeout = 3  # segundos
        self.api_disponivel = self._check_api_health()
    
    def _check_api_health(self) -> bool:
        """Verifica se a API do governo está rodando"""
        try:
            response = requests.get(f'{self.base_url}/actuator/health', timeout=1)
            logger.info("[OK] API Governo disponivel")
            return response.status_code == 200
        except:
            logger.warning("[WARN] API Governo indisponivel - usando fallback local")
            return False
    
    def calcular_tributos(
        self, 
        ncm: str, 
        cst: str, 
        c_class_trib: str, 
        valor_base: float = 100.0,
        municipio: int = 3550308  # São Paulo (default)
    ) -> Optional[Dict]:
        """
        Calcula IBS e CBS usando a API oficial do governo.
        
        Args:
            ncm: Código NCM (8 dígitos)
            cst: CST IBS/CBS (ex: "000", "200")
            c_class_trib: Classificação tributária (ex: "000001")
            valor_base: Valor base para cálculo
            municipio: Código IBGE do município (default: São Paulo)
        
        Returns:
            Dict com:
                - ibs_aliquota: Alíquota IBS total (UF + Município)
                - cbs_aliquota: Alíquota CBS
                - fonte: "api_gov" ou "banco_local"
                - erro: Mensagem de erro (se houver)
        """
        
        if not self.api_disponivel:
            logger.debug(f"API indisponível, pulando para fallback")
            return None
        
        # Limpa NCM
        ncm_clean = str(ncm).replace('.', '').strip()
        if len(ncm_clean) == 7:
            ncm_clean = '0' + ncm_clean
        
        # Monta payload conforme especificação da API
        payload = {
            "id": "1",
            "versao": "1.0.0",
            "dhFatoGerador": "2026-01-20T12:00:00-03:00",
            "municipio": municipio,
            "itens": [
                {
                    "numero": 1,
                    "ncm": ncm_clean,
                    "cst": cst,
                    "cClassTrib": c_class_trib,
                    "baseCalculo": valor_base
                }
            ]
        }
        
        try:
            logger.debug(f"🔄 Consultando API Gov: NCM={ncm_clean}, CST={cst}, cClassTrib={c_class_trib}")
            
            response = requests.post(
                self.endpoint, 
                json=payload, 
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                logger.warning(f"API Gov retornou {response.status_code}: {response.text}")
                return None
            
            data = response.json()
            
            # Parse da resposta
            obj_res = data.get('objetos', [{}])[0]
            trib_calc = obj_res.get('tribCalc', {})
            ibscbs = trib_calc.get('IBSCBS', {})
            
            # Caso especial: Imposto Seletivo (sem IBS/CBS)
            if not ibscbs and 'IS' in trib_calc:
                logger.info(f"[OK] API Gov: NCM {ncm_clean} - Imposto Seletivo (IBS/CBS zerados)")
                return {
                    'ibs_aliquota': 0.0,
                    'cbs_aliquota': 0.0,
                    'fonte': 'api_gov_is',
                    'imposto_seletivo': True
                }
            
            g_ibscbs = ibscbs.get('gIBSCBS', {})
            if not g_ibscbs:
                logger.info(f"[OK] API Gov: NCM {ncm_clean} - Tributacao zerada")
                return {
                    'ibs_aliquota': 0.0,
                    'cbs_aliquota': 0.0,
                    'fonte': 'api_gov_zero'
                }
            
            # Extrai alíquotas
            g_cbs = g_ibscbs.get('gCBS', {})
            aliq_cbs = float(g_cbs.get('pCBS', 0))
            
            g_ibs_uf = g_ibscbs.get('gIBSUF', {})
            aliq_ibs_uf = float(g_ibs_uf.get('pIBSUF', 0))
            
            g_ibs_mun = g_ibscbs.get('gIBSMun', {})
            aliq_ibs_mun = float(g_ibs_mun.get('pIBSMun', 0))
            
            aliq_ibs_total = aliq_ibs_uf + aliq_ibs_mun
            
            logger.info(f"[OK] API Gov: NCM {ncm_clean} - IBS={aliq_ibs_total}% CBS={aliq_cbs}%")
            
            return {
                'ibs_aliquota': aliq_ibs_total,
                'cbs_aliquota': aliq_cbs,
                'ibs_uf': aliq_ibs_uf,
                'ibs_municipio': aliq_ibs_mun,
                'fonte': 'api_gov'
            }
            
        except requests.exceptions.ConnectionError:
            logger.warning("API Gov - Conexão recusada (porta 8080)")
            self.api_disponivel = False  # Marca como indisponível
            return None
            
        except requests.exceptions.Timeout:
            logger.warning(f"API Gov - Timeout após {self.timeout}s")
            return None
            
        except Exception as e:
            logger.error(f"API Gov - Erro inesperado: {e}")
            return None
    
    def calcular_tributos_lote(self, produtos: list) -> Dict[int, Dict]:
        """
        Calcula tributos para múltiplos produtos de uma vez.
        
        Args:
            produtos: Lista de dicionários com keys: id_produto, ncm, cst, c_class_trib
        
        Returns:
            Dict mapeando id_produto -> resultado do cálculo
        """
        resultados = {}
        
        for produto in produtos:
            resultado = self.calcular_tributos(
                ncm=produto['ncm'],
                cst=produto.get('cst', '000'),
                c_class_trib=produto.get('c_class_trib', '000001')
            )
            
            if resultado:
                resultados[produto['id_produto']] = resultado
        
        return resultados


# Instância singleton (reutilizável)
_service_instance = None

def get_gov_api_service() -> GovAPIService:
    """Retorna instância única do serviço"""
    global _service_instance
    if _service_instance is None:
        _service_instance = GovAPIService()
    return _service_instance
