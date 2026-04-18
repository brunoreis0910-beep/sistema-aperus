"""
Serviço para exportar XMLs de documentos fiscais
"""
import os
import shutil
from datetime import date, datetime, time
from django.utils import timezone
from api.models import Venda, Compra
import logging

logger = logging.getLogger(__name__)

class ExportXMLService:
    def __init__(self, data_inicio: date, data_fim: date, operacoes_ids: list, diretorio_base: str):
        """
        Inicializa o serviço de exportação de XMLs.
        
        Args:
            data_inicio: Data inicial do período
            data_fim: Data final do período
            operacoes_ids: Lista de IDs de operações a incluir
            diretorio_base: Diretório base onde serão criadas as pastas
        """
        # Converter date para datetime timezone-aware para funcionar com DateTimeField
        dt_inicio_naive = datetime.combine(data_inicio, time.min)
        dt_fim_naive = datetime.combine(data_fim, time.max)
        self.data_inicio_dt = timezone.make_aware(dt_inicio_naive)
        self.data_fim_dt = timezone.make_aware(dt_fim_naive)
        self.operacoes_ids = operacoes_ids
        self.diretorio_base = diretorio_base
        
        # Criar pastas para cada tipo de documento
        self.diretorios = {
            '55': os.path.join(diretorio_base, 'NFe'),
            '65': os.path.join(diretorio_base, 'NFCe'),
            '57': os.path.join(diretorio_base, 'CTe')
        }
        
        # Criar as pastas se não existirem
        for dir_path in self.diretorios.values():
            os.makedirs(dir_path, exist_ok=True)
            logger.info(f"Diretório criado/verificado: {dir_path}")
    
    def exportar_xmls(self):
        """
        Exporta os XMLs de todas as vendas/compras do período e operações selecionadas.
        Retorna estatísticas da exportação.
        """
        stats = {
            'total': 0,
            'nfe': 0,
            'nfce': 0,
            'cte': 0,
            'sem_xml': 0,
            'erros': []
        }
        
        # Buscar vendas do período com as operações selecionadas
        vendas = Venda.objects.filter(
            data_documento__gte=self.data_inicio_dt,
            data_documento__lte=self.data_fim_dt,
            id_operacao__id_operacao__in=self.operacoes_ids,
            status_nfe__in=['EMITIDA', 'AUTORIZADA']  # Apenas documentos autorizados
        ).select_related('id_operacao')
        
        logger.info(f"Encontradas {vendas.count()} vendas para exportar XMLs")
        
        for venda in vendas:
            try:
                # Verificar se tem XML
                if not venda.xml_nfe or venda.xml_nfe.strip() == '':
                    stats['sem_xml'] += 1
                    logger.warning(f"Venda {venda.id_venda} sem XML")
                    continue
                
                # Identificar o tipo de documento
                modelo = venda.id_operacao.modelo_documento if venda.id_operacao else '55'
                
                # Verificar se é um modelo que conhecemos
                if modelo not in self.diretorios:
                    logger.warning(f"Modelo de documento desconhecido: {modelo} para venda {venda.id_venda}")
                    continue
                
                # Gerar nome do arquivo
                chave = venda.chave_nfe or f"SEM_CHAVE_{venda.id_venda}"
                filename = f"{chave}-nfe.xml"
                
                # Caminho completo do arquivo
                filepath = os.path.join(self.diretorios[modelo], filename)
                
                # Salvar o XML
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(venda.xml_nfe)
                
                # Atualizar estatísticas
                stats['total'] += 1
                if modelo == '55':
                    stats['nfe'] += 1
                elif modelo == '65':
                    stats['nfce'] += 1
                elif modelo == '57':
                    stats['cte'] += 1
                
                logger.info(f"XML exportado: {filename} para {self.diretorios[modelo]}")
                
            except Exception as e:
                error_msg = f"Erro ao exportar XML da venda {venda.id_venda}: {str(e)}"
                logger.error(error_msg)
                stats['erros'].append(error_msg)
        
        # Buscar CTes (Conhecimentos de Transporte)
        try:
            from cte.models import ConhecimentoTransporte
            
            ctes = ConhecimentoTransporte.objects.filter(
                data_emissao__gte=self.data_inicio_dt,
                data_emissao__lte=self.data_fim_dt,
                status_cte__in=['EMITIDO', 'ENVIADO', 'AUTORIZADO']  # Incluir todos os CTes autorizados
            )
            
            logger.info(f"Encontrados {ctes.count()} CTes para exportar XMLs")
            
            for cte in ctes:
                try:
                    # Verificar se tem XML
                    if not cte.xml_cte or cte.xml_cte.strip() == '':
                        stats['sem_xml'] += 1
                        logger.warning(f"CTe {cte.id_cte} sem XML")
                        continue
                    
                    # Gerar nome do arquivo
                    chave = cte.chave_cte or f"SEM_CHAVE_{cte.id_cte}"
                    filename = f"{chave}-cte.xml"
                    
                    # Caminho completo do arquivo (CTe sempre vai para pasta CTe)
                    filepath = os.path.join(self.diretorios['57'], filename)
                    
                    # Salvar o XML
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(cte.xml_cte)
                    
                    # Atualizar estatísticas
                    stats['total'] += 1
                    stats['cte'] += 1
                    
                    logger.info(f"XML CTe exportado: {filename} para {self.diretorios['57']}")
                    
                except Exception as e:
                    error_msg = f"Erro ao exportar XML do CTe {cte.id_cte}: {str(e)}"
                    logger.error(error_msg)
                    stats['erros'].append(error_msg)
                    
        except ImportError:
            logger.warning("Modelo ConhecimentoTransporte não disponível")
        except Exception as e:
            logger.warning(f"Erro ao processar CTes: {str(e)}")
        
        return stats
