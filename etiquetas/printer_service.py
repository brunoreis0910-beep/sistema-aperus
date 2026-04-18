"""
Serviço de impressão de etiquetas para impressoras Zebra e Elgin
"""
from decimal import Decimal
from typing import Dict, List, Any
import socket


class ZebraPrinterService:
    """Serviço para gerar comandos ZPL para impressoras Zebra"""
    
    @staticmethod
    def gerar_zpl_produto(produto: Dict[str, Any], layout: Dict[str, Any]) -> str:
        """
        Gera código ZPL para impressão de etiqueta de produto
        
        Args:
            produto: Dicionário com dados do produto
            layout: Configurações do layout da etiqueta
            
        Returns:
            String com comandos ZPL
        """
        # Extrair configurações do layout (convertendo mm para dots - 8 dots/mm para 203dpi)
        largura = int(float(layout.get('largura_etiqueta', 50)) * 8)
        altura = int(float(layout.get('altura_etiqueta', 30)) * 8)
        campos = layout.get('campos_visiveis', {})
        
        # Iniciar comando ZPL
        zpl = "^XA\n"  # Início do formato
        
        # Configurar largura da etiqueta
        zpl += f"^PW{largura}\n"
        
        # Configurar orientação e origem
        zpl += "^FO0,0\n"  # Field Origin
        
        # Posição Y inicial
        pos_y = 10
        
        # Nome do produto (sempre visível)
        if campos.get('nome_produto', {}).get('visivel', True):
            nome = produto.get('nome_produto', '')[:30]  # Limitar caracteres
            zpl += f"^FO10,{pos_y}^A0N,25,25^FD{nome}^FS\n"
            pos_y += 35
        
        # Código de barras
        if campos.get('codigo_barras', {}).get('visivel', True) and produto.get('codigo_barras'):
            codigo_barras = produto.get('codigo_barras', '')
            # Código de barras EAN-13
            zpl += f"^FO10,{pos_y}^BCN,60,Y,N,N^FD{codigo_barras}^FS\n"
            pos_y += 70
        
        # Preço
        if campos.get('valor_venda', {}).get('visivel', True):
            valor = produto.get('valor_venda', 0)
            if isinstance(valor, (int, float, Decimal)):
                preco_formatado = f"R$ {float(valor):.2f}".replace('.', ',')
                zpl += f"^FO10,{pos_y}^A0N,30,30^FD{preco_formatado}^FS\n"
                pos_y += 40
        
        # Código do produto
        if campos.get('codigo_produto', {}).get('visivel', True):
            codigo = produto.get('codigo_produto', '')
            zpl += f"^FO10,{pos_y}^A0N,20,20^FDCod: {codigo}^FS\n"
            pos_y += 25
        
        # Marca/Modelo
        if campos.get('marca', {}).get('visivel', True) and produto.get('marca'):
            marca = produto.get('marca', '')
            zpl += f"^FO10,{pos_y}^A0N,18,18^FD{marca}^FS\n"
            pos_y += 23
        
        # Tamanho/Cor
        detalhes = []
        if campos.get('tamanho', {}).get('visivel', True) and produto.get('tamanho'):
            detalhes.append(f"Tam: {produto.get('tamanho')}")
        if campos.get('cor', {}).get('visivel', True) and produto.get('cor'):
            detalhes.append(f"Cor: {produto.get('cor')}")
        
        if detalhes:
            texto_detalhes = ' | '.join(detalhes)
            zpl += f"^FO10,{pos_y}^A0N,16,16^FD{texto_detalhes}^FS\n"
            pos_y += 20
        
        # Localização no estoque
        if campos.get('localizacao', {}).get('visivel', True) and produto.get('localizacao'):
            localizacao = produto.get('localizacao', '')
            zpl += f"^FO10,{pos_y}^A0N,16,16^FDLoc: {localizacao}^FS\n"
        
        # Finalizar comando ZPL
        zpl += "^XZ\n"  # Fim do formato
        
        return zpl
    
    @staticmethod
    def enviar_para_impressora(zpl: str, ip_impressora: str, porta: int = 9100) -> bool:
        """
        Envia comandos ZPL diretamente para impressora Zebra via rede
        
        Args:
            zpl: Comandos ZPL
            ip_impressora: Endereço IP da impressora
            porta: Porta da impressora (padrão 9100)
            
        Returns:
            True se enviado com sucesso
        """
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect((ip_impressora, porta))
            sock.send(zpl.encode('utf-8'))
            sock.close()
            return True
        except Exception as e:
            print(f"Erro ao enviar para impressora Zebra: {str(e)}")
            return False


class ElginPrinterService:
    """Serviço para gerar comandos para impressoras Elgin"""
    
    @staticmethod
    def gerar_escpos_produto(produto: Dict[str, Any], layout: Dict[str, Any]) -> bytes:
        """
        Gera comandos ESC/POS para impressão de etiqueta de produto em impressoras Elgin
        
        Args:
            produto: Dicionário com dados do produto
            layout: Configurações do layout da etiqueta
            
        Returns:
            Bytes com comandos ESC/POS
        """
        campos = layout.get('campos_visiveis', {})
        
        # Comandos ESC/POS
        ESC = b'\x1b'
        GS = b'\x1d'
        
        comandos = b''
        
        # Inicializar impressora
        comandos += ESC + b'@'
        
        # Centralizar texto
        comandos += ESC + b'a\x01'
        
        # Nome do produto - Negrito e aumentado
        if campos.get('nome_produto', {}).get('visivel', True):
            nome = produto.get('nome_produto', '')[:30]
            comandos += ESC + b'E\x01'  # Negrito ON
            comandos += GS + b'!\x11'  # Altura dupla
            comandos += nome.encode('cp850', errors='ignore') + b'\n'
            comandos += ESC + b'E\x00'  # Negrito OFF
            comandos += GS + b'!\x00'  # Tamanho normal
        
        # Código de barras
        if campos.get('codigo_barras', {}).get('visivel', True) and produto.get('codigo_barras'):
            codigo_barras = produto.get('codigo_barras', '')
            # Configurar código de barras EAN-13
            comandos += GS + b'h\x50'  # Altura do código de barras (80 pontos)
            comandos += GS + b'w\x02'  # Largura do código de barras
            comandos += GS + b'H\x02'  # Posição do texto (abaixo)
            comandos += GS + b'k\x43'  # Tipo EAN-13
            comandos += bytes([len(codigo_barras)]) + codigo_barras.encode('ascii') + b'\n'
        
        # Preço - Grande destaque
        if campos.get('valor_venda', {}).get('visivel', True):
            valor = produto.get('valor_venda', 0)
            if isinstance(valor, (int, float, Decimal)):
                preco_formatado = f"R$ {float(valor):.2f}".replace('.', ',')
                comandos += GS + b'!\x22'  # Altura e largura dupla
                comandos += ESC + b'E\x01'  # Negrito ON
                comandos += preco_formatado.encode('cp850', errors='ignore') + b'\n'
                comandos += ESC + b'E\x00'  # Negrito OFF
                comandos += GS + b'!\x00'  # Tamanho normal
        
        # Alinhar à esquerda para detalhes
        comandos += ESC + b'a\x00'
        
        # Código do produto
        if campos.get('codigo_produto', {}).get('visivel', True):
            codigo = produto.get('codigo_produto', '')
            comandos += f"Codigo: {codigo}".encode('cp850', errors='ignore') + b'\n'
        
        # Marca
        if campos.get('marca', {}).get('visivel', True) and produto.get('marca'):
            marca = produto.get('marca', '')
            comandos += f"Marca: {marca}".encode('cp850', errors='ignore') + b'\n'
        
        # Tamanho e Cor
        if campos.get('tamanho', {}).get('visivel', True) and produto.get('tamanho'):
            tamanho = produto.get('tamanho', '')
            comandos += f"Tamanho: {tamanho}".encode('cp850', errors='ignore') + b'\n'
        
        if campos.get('cor', {}).get('visivel', True) and produto.get('cor'):
            cor = produto.get('cor', '')
            comandos += f"Cor: {cor}".encode('cp850', errors='ignore') + b'\n'
        
        # Localização
        if campos.get('localizacao', {}).get('visivel', True) and produto.get('localizacao'):
            localizacao = produto.get('localizacao', '')
            comandos += f"Localizacao: {localizacao}".encode('cp850', errors='ignore') + b'\n'
        
        # Cortar papel (se suportado)
        comandos += b'\n\n'
        comandos += GS + b'V\x00'  # Corte parcial
        
        return comandos
    
    @staticmethod
    def enviar_para_impressora(comandos: bytes, ip_impressora: str, porta: int = 9100) -> bool:
        """
        Envia comandos ESC/POS diretamente para impressora Elgin via rede
        
        Args:
            comandos: Comandos ESC/POS em bytes
            ip_impressora: Endereço IP da impressora
            porta: Porta da impressora (padrão 9100)
            
        Returns:
            True se enviado com sucesso
        """
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect((ip_impressora, porta))
            sock.send(comandos)
            sock.close()
            return True
        except Exception as e:
            print(f"Erro ao enviar para impressora Elgin: {str(e)}")
            return False


class PrinterManager:
    """Gerenciador de impressoras - interface unificada"""
    
    TIPO_ZEBRA = 'zebra'
    TIPO_ELGIN = 'elgin'
    
    @staticmethod
    def imprimir_etiqueta(produto: Dict[str, Any], layout: Dict[str, Any], 
                         tipo_impressora: str, ip_impressora: str = None,
                         quantidade: int = 1) -> Dict[str, Any]:
        """
        Imprime etiqueta em qualquer impressora suportada
        
        Args:
            produto: Dados do produto
            layout: Configurações do layout
            tipo_impressora: 'zebra' ou 'elgin'
            ip_impressora: IP da impressora (opcional para USB)
            quantidade: Número de cópias
            
        Returns:
            Dicionário com resultado da impressão
        """
        resultado = {
            'sucesso': False,
            'mensagem': '',
            'codigo_gerado': ''
        }
        
        try:
            if tipo_impressora.lower() == PrinterManager.TIPO_ZEBRA:
                # Gerar código ZPL
                zpl = ZebraPrinterService.gerar_zpl_produto(produto, layout)
                
                # Repetir para múltiplas cópias
                zpl_completo = zpl * quantidade
                
                resultado['codigo_gerado'] = zpl_completo
                
                if ip_impressora:
                    # Enviar para impressora via rede
                    sucesso = ZebraPrinterService.enviar_para_impressora(zpl_completo, ip_impressora)
                    resultado['sucesso'] = sucesso
                    resultado['mensagem'] = 'Enviado para impressora Zebra' if sucesso else 'Erro ao enviar para impressora'
                else:
                    # Apenas retornar código para impressão via navegador/app
                    resultado['sucesso'] = True
                    resultado['mensagem'] = 'Código ZPL gerado com sucesso'
                    
            elif tipo_impressora.lower() == PrinterManager.TIPO_ELGIN:
                # Gerar comandos ESC/POS
                comandos_base = ElginPrinterService.gerar_escpos_produto(produto, layout)
                
                # Repetir para múltiplas cópias
                comandos_completo = comandos_base * quantidade
                
                # Converter para base64 para transporte
                import base64
                resultado['codigo_gerado'] = base64.b64encode(comandos_completo).decode('utf-8')
                
                if ip_impressora:
                    # Enviar para impressora via rede
                    sucesso = ElginPrinterService.enviar_para_impressora(comandos_completo, ip_impressora)
                    resultado['sucesso'] = sucesso
                    resultado['mensagem'] = 'Enviado para impressora Elgin' if sucesso else 'Erro ao enviar para impressora'
                else:
                    # Apenas retornar código para impressão via navegador/app
                    resultado['sucesso'] = True
                    resultado['mensagem'] = 'Comandos ESC/POS gerados com sucesso'
            else:
                resultado['mensagem'] = f'Tipo de impressora não suportado: {tipo_impressora}'
                
        except Exception as e:
            resultado['mensagem'] = f'Erro ao gerar etiqueta: {str(e)}'
        
        return resultado
    
    @staticmethod
    def gerar_etiqueta_cliente(cliente: Dict[str, Any], layout: Dict[str, Any]) -> str:
        """
        Gera etiqueta de endereço para cliente (formato ZPL padrão)
        
        Args:
            cliente: Dados do cliente
            layout: Configurações do layout
            
        Returns:
            String com comandos ZPL
        """
        campos = layout.get('campos_visiveis', {})
        largura = int(float(layout.get('largura_etiqueta', 100)) * 8)
        
        zpl = "^XA\n"
        zpl += f"^PW{largura}\n"
        
        pos_y = 20
        
        # Nome do cliente
        if campos.get('cliente_nome', {}).get('visivel', True):
            nome = cliente.get('nome_razao_social', '')[:40]
            zpl += f"^FO20,{pos_y}^A0N,28,28^FD{nome}^FS\n"
            pos_y += 35
        
        # CPF/CNPJ
        if campos.get('cliente_cpf_cnpj', {}).get('visivel', True) and cliente.get('cpf_cnpj'):
            cpf_cnpj = cliente.get('cpf_cnpj', '')
            zpl += f"^FO20,{pos_y}^A0N,22,22^FDDoc: {cpf_cnpj}^FS\n"
            pos_y += 28
        
        # Endereço completo
        if campos.get('cliente_endereco', {}).get('visivel', True):
            endereco = cliente.get('endereco', '')
            numero = cliente.get('numero', '')
            if endereco:
                zpl += f"^FO20,{pos_y}^A0N,20,20^FD{endereco}, {numero}^FS\n"
                pos_y += 25
            
            bairro = cliente.get('bairro', '')
            if bairro:
                zpl += f"^FO20,{pos_y}^A0N,20,20^FD{bairro}^FS\n"
                pos_y += 25
        
        # Cidade/Estado/CEP
        cidade = cliente.get('cidade', '')
        estado = cliente.get('estado', '')
        cep = cliente.get('cep', '')
        if cidade or estado:
            linha_cidade = f"{cidade} - {estado}".strip(' -')
            zpl += f"^FO20,{pos_y}^A0N,20,20^FD{linha_cidade}^FS\n"
            pos_y += 25
        
        if cep:
            zpl += f"^FO20,{pos_y}^A0N,20,20^FDCEP: {cep}^FS\n"
            pos_y += 25
        
        # Telefone
        if campos.get('cliente_telefone', {}).get('visivel', True) and cliente.get('telefone'):
            telefone = cliente.get('telefone', '')
            zpl += f"^FO20,{pos_y}^A0N,20,20^FDTel: {telefone}^FS\n"
        
        zpl += "^XZ\n"
        
        return zpl
