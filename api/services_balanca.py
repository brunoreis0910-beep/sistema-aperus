"""
Serviço de exportação de dados para balanças
Suporta diferentes formatos: Toledo, Filizola, Urano, etc.
"""
from decimal import Decimal
from typing import List, Dict, Any
from datetime import datetime, timedelta
import csv
import io


class BalancaExportService:
    """Serviço para exportação de produtos para balanças"""
    
    @staticmethod
    def exportar_toledo_mgv6(produtos: List[Dict[str, Any]], config: Dict[str, Any]) -> str:
        """
        Exporta para formato Toledo MGV6
        
        Formato:
        00XXXXDESCRICAO                                   PPPPPPVVTTDDD
        00 = Tipo de registro (produto)
        XXXX = Código PLU (4 dígitos)
        DESCRICAO = Nome do produto (50 caracteres)
        PPPPPP = Preço (6 dígitos, sem vírgula)
        VV = Validade (dias)
        TT = Tara (kg, 2 dígitos decimais)
        DDD = Departamento (3 dígitos)
        """
        linhas = []
        
        for produto in produtos:
            # Código PLU (4 dígitos)
            codigo = str(produto['codigo_plu']).zfill(4)
            
            # Nome do produto (50 caracteres)
            nome = produto['nome_produto'][:50].ljust(50)
            
            # Preço (6 dígitos, centavos) - Ex: 25.90 -> 002590
            preco = int(float(produto['preco']) * 100)
            preco_str = str(preco).zfill(6)
            
            # Validade (2 dígitos)
            validade = str(produto.get('validade_dias', 3)).zfill(2)
            
            # Tara (2 dígitos decimais) - Ex: 0.05kg -> 05
            tara = int(float(produto.get('tara', 0)) * 100)
            tara_str = str(tara).zfill(2)
            
            # Departamento (3 dígitos)
            depto = str(produto.get('departamento', 1)).zfill(3)
            
            # Monta linha
            linha = f"00{codigo}{nome}{preco_str}{validade}{tara_str}{depto}"
            linhas.append(linha)
        
        return '\n'.join(linhas)
    
    @staticmethod
    def exportar_filizola_smart(produtos: List[Dict[str, Any]], config: Dict[str, Any]) -> str:
        """
        Exporta para formato Filizola Smart
        
        Formato:
        *CODIGO|DESCRICAO|PRECO|VALIDADE|TARA|DEPTO
        """
        linhas = ['*INI']  # Header
        
        for produto in produtos:
            codigo = produto['codigo_plu']
            descricao = produto['nome_produto'][:40]
            preco = f"{float(produto['preco']):.2f}".replace('.', ',')
            validade = produto.get('validade_dias', 3)
            tara = f"{float(produto.get('tara', 0)):.3f}".replace('.', ',')
            depto = produto.get('departamento', 1)
            
            linha = f"*{codigo}|{descricao}|{preco}|{validade}|{tara}|{depto}"
            linhas.append(linha)
        
        linhas.append('*FIM')  # Footer
        return '\n'.join(linhas)
    
    @staticmethod
    def exportar_urano_pop(produtos: List[Dict[str, Any]], config: Dict[str, Any]) -> str:
        """
        Exporta para formato Urano POP
        
        Formato fixo de 80 caracteres por linha
        """
        linhas = []
        
        for produto in produtos:
            # Código (6 dígitos)
            codigo = str(produto['codigo_plu']).zfill(6)
            
            # Tipo (2) = produto pesável
            tipo = '02'
            
            # Descrição (30 caracteres)
            descricao = produto['nome_produto'][:30].ljust(30)
            
            # Preço (6 dígitos, centavos)
            preco = int(float(produto['preco']) * 100)
            preco_str = str(preco).zfill(6)
            
            # Validade (2 dígitos)
            validade = str(produto.get('validade_dias', 3)).zfill(2)
            
            # Tara (4 dígitos, gramas)
            tara = int(float(produto.get('tara', 0)) * 1000)
            tara_str = str(tara).zfill(4)
            
            # Departamento (2 dígitos)
            depto = str(produto.get('departamento', 1)).zfill(2)
            
            # Preenche resto com zeros
            resto = '0' * (80 - len(codigo) - len(tipo) - len(descricao) - len(preco_str) - len(validade) - len(tara_str) - len(depto))
            
            linha = f"{codigo}{tipo}{descricao}{preco_str}{validade}{tara_str}{depto}{resto}"
            linhas.append(linha)
        
        return '\n'.join(linhas)
    
    @staticmethod
    def exportar_texto_padrao(produtos: List[Dict[str, Any]], config: Dict[str, Any]) -> str:
        """
        Exporta para formato texto padrão (legível)
        
        Formato:
        CODIGO;NOME;PRECO;VALIDADE;TARA;DEPARTAMENTO;CODIGO_BARRAS
        """
        linhas = ['CODIGO;NOME;PRECO;VALIDADE;TARA;DEPARTAMENTO;CODIGO_BARRAS']
        
        for produto in produtos:
            codigo = produto['codigo_plu']
            nome = produto['nome_produto']
            preco = f"{float(produto['preco']):.2f}"
            validade = produto.get('validade_dias', 3)
            tara = f"{float(produto.get('tara', 0)):.3f}"
            depto = produto.get('departamento', 1)
            cod_barras = produto.get('codigo_barras', '')
            
            linha = f"{codigo};{nome};{preco};{validade};{tara};{depto};{cod_barras}"
            linhas.append(linha)
        
        return '\n'.join(linhas)
    
    @staticmethod
    def exportar_csv(produtos: List[Dict[str, Any]], config: Dict[str, Any]) -> str:
        """Exporta para formato CSV"""
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        
        # Header
        writer.writerow([
            'Código PLU',
            'Nome do Produto',
            'Preço (R$)',
            'Validade (dias)',
            'Tara (kg)',
            'Departamento',
            'Código de Barras',
            'Unidade'
        ])
        
        # Dados
        for produto in produtos:
            writer.writerow([
                produto['codigo_plu'],
                produto['nome_produto'],
                f"{float(produto['preco']):.2f}",
                produto.get('validade_dias', 3),
                f"{float(produto.get('tara', 0)):.3f}",
                produto.get('departamento', 1),
                produto.get('codigo_barras', ''),
                produto.get('unidade', 'KG')
            ])
        
        return output.getvalue()
    
    @staticmethod
    def gerar_exportacao(produtos: List[Dict[str, Any]], formato: str, config: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Gera exportação no formato especificado
        
        Args:
            produtos: Lista de produtos para exportar
            formato: Formato da exportação
            config: Configurações adicionais
            
        Returns:
            Dict com conteudo, nome_arquivo e quantidade
        """
        config = config or {}
        
        # Seleciona método de exportação
        exportadores = {
            'toledo_mgv6': BalancaExportService.exportar_toledo_mgv6,
            'filizola_smart': BalancaExportService.exportar_filizola_smart,
            'urano_pop': BalancaExportService.exportar_urano_pop,
            'texto_padrao': BalancaExportService.exportar_texto_padrao,
            'csv': BalancaExportService.exportar_csv,
        }
        
        exportador = exportadores.get(formato, BalancaExportService.exportar_texto_padrao)
        
        # Gera conteúdo
        conteudo = exportador(produtos, config)
        
        # Define extensão do arquivo
        extensoes = {
            'toledo_mgv6': 'txt',
            'filizola_smart': 'txt',
            'urano_pop': 'dat',
            'texto_padrao': 'txt',
            'csv': 'csv',
        }
        extensao = extensoes.get(formato, 'txt')
        
        # Nome do arquivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nome_arquivo = f"produtos_balanca_{formato}_{timestamp}.{extensao}"
        
        return {
            'conteudo': conteudo,
            'nome_arquivo': nome_arquivo,
            'quantidade': len(produtos),
            'tamanho_bytes': len(conteudo.encode('utf-8')),
            'formato': formato
        }


class BalancaIntegradaService:
    """Serviço para comunicação com balanças integradas ao caixa"""
    
    @staticmethod
    def ler_peso_serial(porta: str, baud_rate: int = 9600, timeout: float = 2.0) -> Dict[str, Any]:
        """
        Lê o peso de uma balança via porta serial
        
        Args:
            porta: Porta serial (ex: COM1, COM3)
            baud_rate: Taxa de transmissão
            timeout: Timeout da leitura
            
        Returns:
            Dict com peso e status
        """
        try:
            import serial
            
            # Abre porta serial
            ser = serial.Serial(
                port=porta,
                baudrate=baud_rate,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=timeout
            )
            
            # Envia comando de leitura (varia por fabricante)
            # Toledo: ESC P
            # Filizola: 0x05
            ser.write(b'\x05')  # ENQ - solicita peso
            
            # Lê resposta
            resposta = ser.read(20)
            ser.close()
            
            if resposta:
                # Parse da resposta (varia por fabricante)
                # Formato comum: STX + Status + Peso + ETX
                peso_str = resposta[2:-1].decode('ascii', errors='ignore').strip()
                
                try:
                    peso = float(peso_str.replace(',', '.'))
                    return {
                        'sucesso': True,
                        'peso': peso,
                        'unidade': 'kg',
                        'mensagem': 'Peso lido com sucesso'
                    }
                except ValueError:
                    return {
                        'sucesso': False,
                        'peso': 0,
                        'mensagem': f'Erro ao converter peso: {peso_str}'
                    }
            else:
                return {
                    'sucesso': False,
                    'peso': 0,
                    'mensagem': 'Nenhuma resposta da balança'
                }
                
        except ImportError:
            return {
                'sucesso': False,
                'peso': 0,
                'mensagem': 'Biblioteca pyserial não instalada. Execute: pip install pyserial'
            }
        except Exception as e:
            return {
                'sucesso': False,
                'peso': 0,
                'mensagem': f'Erro ao ler balança: {str(e)}'
            }
    
    @staticmethod
    def ler_peso_rede(ip: str, porta: int = 9100, timeout: float = 2.0) -> Dict[str, Any]:
        """
        Lê o peso de uma balança via rede TCP/IP
        
        Args:
            ip: IP da balança
            porta: Porta TCP
            timeout: Timeout da conexão
            
        Returns:
            Dict com peso e status
        """
        try:
            import socket
            
            # Conecta à balança
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            sock.connect((ip, porta))
            
            # Envia comando de leitura
            sock.send(b'\x05')  # ENQ
            
            # Lê resposta
            resposta = sock.recv(1024)
            sock.close()
            
            if resposta:
                peso_str = resposta[2:-1].decode('ascii', errors='ignore').strip()
                
                try:
                    peso = float(peso_str.replace(',', '.'))
                    return {
                        'sucesso': True,
                        'peso': peso,
                        'unidade': 'kg',
                        'mensagem': 'Peso lido com sucesso'
                    }
                except ValueError:
                    return {
                        'sucesso': False,
                        'peso': 0,
                        'mensagem': f'Erro ao converter peso: {peso_str}'
                    }
            else:
                return {
                    'sucesso': False,
                    'peso': 0,
                    'mensagem': 'Nenhuma resposta da balança'
                }
                
        except Exception as e:
            return {
                'sucesso': False,
                'peso': 0,
                'mensagem': f'Erro ao conectar na balança: {str(e)}'
            }
    
    @staticmethod
    def testar_conexao(tipo_conexao: str, **kwargs) -> Dict[str, Any]:
        """
        Testa conexão com a balança
        
        Args:
            tipo_conexao: 'serial' ou 'rede'
            **kwargs: Parâmetros da conexão
            
        Returns:
            Dict com resultado do teste
        """
        if tipo_conexao == 'serial':
            return BalancaIntegradaService.ler_peso_serial(
                porta=kwargs.get('porta', 'COM1'),
                baud_rate=kwargs.get('baud_rate', 9600)
            )
        elif tipo_conexao == 'rede':
            return BalancaIntegradaService.ler_peso_rede(
                ip=kwargs.get('ip'),
                porta=kwargs.get('porta', 9100)
            )
        else:
            return {
                'sucesso': False,
                'mensagem': f'Tipo de conexão inválido: {tipo_conexao}'
            }
