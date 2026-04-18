"""
Gerenciador da API do Governo Federal (api-regime-geral.jar)
Controla o processo Java que calcula tributos IBS/CBS oficiais
"""

import subprocess
import psutil
import requests
import time
import os
import logging
from pathlib import Path
from typing import Optional, Dict

logger = logging.getLogger(__name__)


class GovAPIManager:
    """
    Gerencia o ciclo de vida da API do governo (iniciar, parar, status)
    """
    
    def __init__(self):
        self.port = 8080
        self.jar_paths = [
            # Caminho 1: Pasta do projeto
            r"C:\Projetos\SistemaGerencial\4_Calculadora_Fiscal\Calculadora_Gov_Oficial\calculadora\api-regime-geral.jar",
            # Caminho 2: Relativo ao backend
            Path(__file__).parent.parent.parent.parent / "4_Calculadora_Fiscal" / "Calculadora_Gov_Oficial" / "calculadora" / "api-regime-geral.jar",
        ]
        self.process = None
    
    def _find_jar_path(self) -> Optional[str]:
        """Procura o arquivo JAR da API do governo"""
        for jar_path in self.jar_paths:
            jar_path_str = str(jar_path)
            if os.path.exists(jar_path_str):
                logger.info(f"✅ JAR encontrado: {jar_path_str}")
                return jar_path_str
        logger.error(f"❌ JAR não encontrado. Caminhos verificados: {self.jar_paths}")
        return None
    
    def is_running(self) -> bool:
        """Verifica se a API do governo já está rodando"""
        try:
            # Testar a raiz da API (Swagger UI) - mais confiável que actuator/health
            response = requests.get(f'http://localhost:{self.port}/api', timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def _find_java_process(self) -> Optional[psutil.Process]:
        """Encontra o processo Java da API do governo"""
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    cmdline = proc.cmdline()
                    if cmdline and 'java' in cmdline[0].lower() and any('api-regime-geral.jar' in arg for arg in cmdline):
                        return proc
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
        except Exception as e:
            logger.warning(f"Erro ao procurar processo Java: {e}")
        return None
    
    def start(self, wait_timeout: int = 30) -> Dict:
        """
        Inicia a API do governo e aguarda estar pronta
        
        Returns:
            Dict com status: 'running', 'started', 'timeout', 'error'
        """
        # Verificar se já está rodando
        if self.is_running():
            logger.info("✅ API do Governo já está rodando")
            return {
                'status': 'running',
                'message': 'API do Governo já está ativa',
                'url': f'http://localhost:{self.port}'
            }
        
        # Encontrar o JAR
        jar_path = self._find_jar_path()
        if not jar_path:
            logger.error("❌ JAR api-regime-geral.jar não encontrado em nenhum dos caminhos configurados.")
            return {
                'status': 'error',
                'message': 'Arquivo api-regime-geral.jar não encontrado',
                'details': 'Verifique se o arquivo existe em 4_Calculadora_Fiscal/Calculadora_Gov_Oficial/calculadora/'
            }
        
        # Verificar se Java está instalado
        try:
            java_check = subprocess.run(['java', '-version'], 
                                       capture_output=True, 
                                       text=True, 
                                       timeout=5)
            if java_check.returncode != 0:
                logger.error("❌ Java não encontrado ou erro ao executar java -version")
                return {
                    'status': 'error',
                    'message': 'Java não está instalado ou não está no PATH',
                    'details': 'Instale Java 17 ou superior'
                }
        except Exception as e:
            logger.error(f"❌ Erro ao verificar Java: {e}")
            return {
                    'status': 'error',
                    'message': 'Erro ao verificar instalação do Java',
                    'details': str(e)
            }

        # Iniciar processo
        try:
            logger.info(f"🚀 Iniciando API do Governo: {jar_path}")
            # Usar criação de janela oculta no Windows para não abrir terminal
            startupinfo = None
            if os.name == 'nt':
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            
            # Definir variável de ambiente para perfil offline (sem banco externo)
            env = os.environ.copy()
            env['SPRING_PROFILES_ACTIVE'] = 'offline'
            
            self.process = subprocess.Popen(
                ['java', '-jar', jar_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                startupinfo=startupinfo,
                cwd=os.path.dirname(jar_path), # Importante: rodar no diretório do JAR
                env=env
            )
            
            # Aguardar inicialização
            start_time = time.time()
            while time.time() - start_time < wait_timeout:
                if self.process.poll() is not None:
                    # Processo morreu
                    stdout, stderr = self.process.communicate()
                    logger.error(f"❌ Processo morreu imediatamente. Stderr: {stderr}")
                    return {
                        'status': 'error',
                        'message': 'API falhou ao iniciar',
                        'details': f'Erro: {stderr[:200]}...' if stderr else 'Crash desconhecido'
                    }
                
                if self.is_running():
                    logger.info("✅ API do Governo iniciada com sucesso!")
                    return {
                        'status': 'started',
                        'message': 'API iniciada com sucesso',
                        'url': f'http://localhost:{self.port}'
                    }
                
                time.sleep(1)
            
            # Timeout
            if self.process:
                self.process.terminate()
            
            logger.error("❌ Timeout aguardando API iniciar")
            return {
                'status': 'timeout',
                'message': 'Tempo limite esgotado ao iniciar API',
                'details': 'O servidor demorou muito para responder'
            }
            
        except Exception as e:
            logger.exception(f"❌ Erro não tratado ao iniciar API: {e}")
            return {
                'status': 'error',
                'message': 'Erro interno ao iniciar API',
                'details': str(e)
            }

    
    def stop(self) -> Dict:
        """Para a API do governo"""
        try:
            # Tentar encontrar processo
            proc = self._find_java_process()
            
            if proc:
                logger.info(f"🛑 Parando API do Governo (PID: {proc.pid})")
                proc.terminate()
                
                # Aguardar até 5 segundos
                try:
                    proc.wait(timeout=5)
                except psutil.TimeoutExpired:
                    proc.kill()
                
                logger.info("✅ API do Governo parada")
                return {
                    'status': 'stopped',
                    'message': 'API do Governo parada com sucesso'
                }
            else:
                return {
                    'status': 'not_running',
                    'message': 'API do Governo não está rodando'
                }
                
        except Exception as e:
            logger.error(f"❌ Erro ao parar API: {e}")
            return {
                'status': 'error',
                'message': f'Erro ao parar API: {str(e)}'
            }
    
    def status(self) -> Dict:
        """Retorna status detalhado da API"""
        is_running = self.is_running()
        proc = self._find_java_process()
        
        return {
            'running': is_running,
            'url': f'http://localhost:{self.port}' if is_running else None,
            'pid': proc.pid if proc else None,
            'jar_found': self._find_jar_path() is not None,
            'message': 'API do Governo ativa' if is_running else 'API do Governo offline'
        }


# Singleton
_manager_instance = None

def get_gov_api_manager() -> GovAPIManager:
    """Retorna instância única do gerenciador"""
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = GovAPIManager()
    return _manager_instance
