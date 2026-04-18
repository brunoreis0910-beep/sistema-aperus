import os
import sys
import sqlite3

def get_ncm_db_path():
    """
    Tenta localizar o banco de dados ncm_local.db em vários locais possíveis.
    """
    # Base paths candidates
    current_file = os.path.abspath(__file__)
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(current_file))) # api/services/ -> backend root
    
    candidates = [
        # Hardcoded development path
        r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\Correcao_de_Tributacao\ncm_local.db",
        # Relative to backend root
        os.path.join(backend_root, "Correcao_de_Tributacao", "ncm_local.db"),
        # Relative for PyInstaller/Dist (sys._MEIPASS)
        os.path.join(getattr(sys, '_MEIPASS', backend_root), "Correcao_de_Tributacao", "ncm_local.db"),
        # Current working directory
        os.path.join(os.getcwd(), "Correcao_de_Tributacao", "ncm_local.db"),
    ]
    
    for path in candidates:
        if os.path.exists(path):
            return path
            
    return None

def validate_ncm_assertiva(ncm_value):
    """
    Valida o NCM de forma assertiva:
    1. Formato (8 dígitos numéricos)
    2. Existência na na tabela oficial (IBPT/Gov) se disponível
    
    Retorna: (ncm_limpo, erro)
    Se erro for None, o NCM é válido.
    """
    if not ncm_value:
        return ncm_value, None
        
    # 1. Limpeza e Validação de Formato
    clean_ncm = "".join(filter(str.isdigit, str(ncm_value)))
    
    if not clean_ncm and ncm_value:
        return None, "O NCM deve conter dígitos numéricos."
        
    if len(clean_ncm) != 8:
        return None, f"O NCM deve ter exatamente 8 dígitos numéricos. (Encontrado: {len(clean_ncm)})"

    # 2. Validação na Base Oficial Local (IBPT)
    # -------------------------------------------------------------------------
    db_path = get_ncm_db_path()
    
    if db_path:
        try:
            # Usando connection como context manager para fechar automaticamente
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                
                # Verifica existência exata
                cursor.execute("SELECT 1 FROM NCM WHERE NCM_CD = ?", (clean_ncm,))
                match = cursor.fetchone()
                
                if match:
                    return clean_ncm, None # Válido e encontrado
                else:
                    return None, f"NCM {clean_ncm} inválido ou inexistente na tabela oficial (IBPT)."
                    
        except sqlite3.Error as e:
            # Em caso de erro no banco, advertimos mas não bloqueamos se o formato estiver ok
            # Opcional: Bloquear se a conexão falhar
            print(f"Erro ao validar NCM no banco: {e}")
            return clean_ncm, None
            
    else:
        # Se não achou o banco, valida só o formato
        # (Idealmente logaria um aviso)
        return clean_ncm, None
