
class TaxCalculator:
    """
    Calculadora de CST e Alíquotas baseada no Regime da Empresa e Perfil do Produto.
    """
    
    # Regimes
    REGIME_SIMPLES = ['SIMPLES', 'MEI']
    REGIME_NORMAL = ['NORMAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL']
    
    # Perfis de Produto
    PERFIL_TRIBUTADO_18 = 'tributado_18'
    PERFIL_TRIBUTADO_12 = 'tributado_12'
    PERFIL_TRIBUTADO_7 = 'tributado_7'
    PERFIL_ISENTO = 'isento'
    PERFIL_ST = 'st'
    PERFIL_MONOFASICO = 'monofasico'
    
    @staticmethod
    def calcular(regime_empresa, perfil_produto, uf_origem='SP', uf_destino='SP'):
        """
        Retorna dicionário com CSTs e Alíquotas sugeridas.
        """
        regime = str(regime_empresa).upper()
        perfil = str(perfil_produto).lower()
        
        is_simples = regime in ['SIMPLES', 'MEI']
        
        resultado = {
            'cst_pis_cofins': '01', # Default
            'cst_icms': '00', # Default
            'cst_ipi': '50', # Default
            'icms_aliquota': 0.0,
            'pis_aliquota': 1.65,
            'cofins_aliquota': 7.60,
            'ipi_aliquota': 0.0,
            'icms_st_aliquota': 0.0,
            'mva': 0.0, # Margem Valor Agregado
            # Novos Tributos - Reforma Tributária (Padrão 2026/2027)
            'ibs_aliquota': 0.10, # 0.1% Fixado para teste/inicio
            'cbs_aliquota': 0.90, # 0.9% Fixado para teste/inicio
            'cst_ibs_cbs': '001', # Tributado Completo (Padrão) - Era 410 -> 001
            'classificacao_fiscal': '', # Dinamico
            'descricao_sugestao': ''
        }
        
        # --- Lógica para SIMPLES NACIONAL / MEI ---
        if is_simples:
            resultado['pis_aliquota'] = 0.0
            resultado['cofins_aliquota'] = 0.0
            resultado['ipi_aliquota'] = 0.0
            
            if perfil == 'st':
                resultado['cst_icms'] = '500' # ICMS cobrado anteriormente
                resultado['cst_pis_cofins'] = '05' # Substituição Tributária
                # Reforma: ST pode manter monofasico ou especifico. Vamos assumir mantido logicamente.
                resultado['cst_ibs_cbs'] = '001' # Ou codigo especifico de ST se houver
                resultado['descricao_sugestao'] = 'Simples Nacional - Substituição Tributária (CSOSN 500)'
                
            elif perfil == 'monofasico':
                resultado['cst_icms'] = '500' 
                resultado['cst_pis_cofins'] = '04' # Monofásico
                resultado['cst_ibs_cbs'] = '410' # Monofásico no novo sistema
                resultado['classificacao_fiscal'] = '410002' # Exemplo Bebidas
                resultado['ibs_aliquota'] = 0.0 # Monofásico não destaca alíquota
                resultado['cbs_aliquota'] = 0.0
                resultado['descricao_sugestao'] = 'Simples Nacional - Monofásico (Bebidas/Combustíveis)'

            elif perfil == 'isento':
                 resultado['cst_icms'] = '300' # Imune / Isento
                 resultado['cst_pis_cofins'] = '07'
                 resultado['cst_ibs_cbs'] = '006' # Aliquota Zero / Isento
                 resultado['ibs_aliquota'] = 0.0
                 resultado['cbs_aliquota'] = 0.0
                 resultado['descricao_sugestao'] = 'Simples Nacional - Isento'

            else: # Tributado (18, 12, 7) - No Simples paga no DAS, mas destaca o permitido
                resultado['cst_icms'] = '101' if perfil == 'tributado_18' else '102'
                resultado['cst_pis_cofins'] = '01'
                resultado['cst_ibs_cbs'] = '001' # Operação Tributável
                
                # Aliquota de ICMS 'credito' (apenas informativo)
                if perfil == 'tributado_18': resultado['icms_aliquota'] = 0.0 # Paga no DAS
                elif perfil == 'tributado_12': resultado['icms_aliquota'] = 0.0
                elif perfil == 'tributado_7': resultado['icms_aliquota'] = 0.0
                
                resultado['descricao_sugestao'] = 'Simples Nacional - Tributado (CSOSN 101/102)'

        # --- Lógica para REGIME NORMAL (Lucro Real / Presumido) ---
        else:
            if perfil == 'st':
                resultado['cst_icms'] = '60' # Cobrado anteriormente ou 10
                resultado['cst_pis_cofins'] = '05'
                resultado['cst_ibs_cbs'] = '001' # Revisar ST na Reforma
                resultado['descricao_sugestao'] = 'Regime Normal - Substituição Tributária'
                
            elif perfil == 'monofasico':
                resultado['cst_icms'] = '60' 
                resultado['cst_pis_cofins'] = '04'
                resultado['cst_ibs_cbs'] = '410' # Monofásico
                resultado['ibs_aliquota'] = 0.0 # Monofásico não destaca alíquota
                resultado['cbs_aliquota'] = 0.0
                resultado['classificacao_fiscal'] = '410002'
                resultado['descricao_sugestao'] = 'Regime Normal - Monofásico'

            elif perfil == 'isento':
                 resultado['cst_icms'] = '40' # Isento
                 resultado['cst_pis_cofins'] = '06' # Aliquota Zero
                 resultado['cst_ibs_cbs'] = '006' # Aliquota Zero
                 resultado['ibs_aliquota'] = 0.0 # Isento
                 resultado['cbs_aliquota'] = 0.0
                 resultado['pis_aliquota'] = 0.0
                 resultado['cofins_aliquota'] = 0.0
                 resultado['descricao_sugestao'] = 'Regime Normal - Isento'

            elif perfil == 'tributado_18':
                resultado['cst_icms'] = '00' # Tributada integralmente
                resultado['icms_aliquota'] = 18.0
                resultado['cst_pis_cofins'] = '01'
                resultado['cst_ibs_cbs'] = '001' # Operação Tributável
                resultado['descricao_sugestao'] = 'Regime Normal - Tributado 18%'

            elif perfil == 'tributado_12':
                resultado['cst_icms'] = '00'
                resultado['icms_aliquota'] = 12.0
                resultado['cst_pis_cofins'] = '01'
                resultado['cst_ibs_cbs'] = '001'
                resultado['descricao_sugestao'] = 'Regime Normal - Tributado 12%'
                
            elif perfil == 'tributado_7':
                resultado['cst_icms'] = '00'
                resultado['icms_aliquota'] = 7.0
                resultado['cst_pis_cofins'] = '01'
                resultado['cst_ibs_cbs'] = '001'
                resultado['descricao_sugestao'] = 'Regime Normal - Tributado 7%'
                
        return resultado
