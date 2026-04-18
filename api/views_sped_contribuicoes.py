"""
Views para geração do SPED Contribuições (EFD-Contribuições)
"""

import os
import logging
import datetime
import zipfile
from django.http import JsonResponse, FileResponse, HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from api.models import EmpresaConfig, ConjuntoOperacao
from api.services.sped_contribuicoes_service import SpedContribuicoesGenerator

logger = logging.getLogger(__name__)


class SpedContribuicoesGerarView(APIView):
    """
    View para gerar o arquivo SPED Contribuições (EFD-Contribuições)
    
    POST /api/sped-contribuicoes/gerar/
    
    Body:
    {
        "data_inicio": "2026-01-01",
        "data_fim": "2026-01-31",
        "conjuntos": [1, 2],  # IDs dos conjuntos de operações (opcional)
        "versao": "135",  # Versão do layout (padrão: 135 = v1.35)
        "diretorio": "C:\\SPED\\2026\\",  # Diretório de saída no servidor
        "blocos": ["C", "F", "M"],  # Blocos a gerar
        "exportar_xml": false,  # Se true, exporta XMLs das notas
        "gerar_relatorio": false  # Se true, gera relatório PDF
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            data = request.data
            
            # Validar datas
            data_inicio_str = data.get('data_inicio')
            data_fim_str = data.get('data_fim')
            
            if not data_inicio_str or not data_fim_str:
                return JsonResponse(
                    {"error": "data_inicio e data_fim são obrigat órios"},
                    status=400
                )
            
            # Converter strings para datetime
            dt_ini = datetime.datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
            dt_fim = datetime.datetime.strptime(data_fim_str, '%Y-%m-%d').date()
            
            # Validar período
            if dt_ini > dt_fim:
                return JsonResponse(
                    {"error": "data_inicio não pode ser maior que data_fim"},
                    status=400
                )
            
            # Obter conjuntos selecionados
            conjuntos_ids = data.get('conjuntos', [])
            
            # Versão do SPED
            versao = data.get('versao', '135')
            
            # Diretório de saída
            diretorio = data.get('diretorio', 'C:\\SPED\\')
            
            # Blocos a gerar
            blocos_gerar = data.get('blocos', ['C', 'F', 'M'])
            
            # Opções de exportação
            exportar_xml = data.get('exportar_xml', False)
            gerar_relatorio = data.get('gerar_relatorio', False)
            
            logger.info(f"SPED Contribuições: Gerando arquivo para período {dt_ini} a {dt_fim}")
            logger.info(f"SPED Contribuições: Conjuntos selecionados: {conjuntos_ids}")
            logger.info(f"SPED Contribuições: Blocos a gerar: {blocos_gerar}")
            
            # Obter operações dos conjuntos
            operacoes_ids = []
            
            if conjuntos_ids:
                for conjunto_id in conjuntos_ids:
                    try:
                        conjunto = ConjuntoOperacao.objects.get(id_conjunto=conjunto_id)
                        ops = conjunto.operacao_conjunto.values_list('id_operacao', flat=True)
                        ops_list = list(ops)
                        operacoes_ids.extend(ops_list)
                        logger.info(f"SPED Contribuições: Conjunto {conjunto_id} '{conjunto.nome_conjunto}' tem operações: {ops_list}")
                    except ConjuntoOperacao.DoesNotExist:
                        logger.warning(f"SPED Contribuições: Conjunto {conjunto_id} não encontrado")
                        continue
                
                # Remover duplicatas
                operacoes_ids = list(set(operacoes_ids))
            
            logger.info(f"SPED Contribuições: Total de operações únicas: {len(operacoes_ids)}")
            
            # Obter configurações da empresa
            try:
                empresa_config = EmpresaConfig.get_ativa()
            except EmpresaConfig.DoesNotExist:
                return JsonResponse(
                    {"error": "Configurações da empresa não encontradas"},
                    status=404
                )
            
            # Garantir que o diretório existe
            os.makedirs(diretorio, exist_ok=True)
            
            # Criar diretório temporário para arquivos
            temp_dir = os.path.join(diretorio, f"temp_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}")
            os.makedirs(temp_dir, exist_ok=True)
            
            logger.info(f"SPED Contribuições: Diretório temporário: {temp_dir}")
            
            try:
                # 1. Gerar SPED Contribuições
                generator = SpedContribuicoesGenerator(dt_ini, dt_fim, operacoes_ids, versao, blocos_gerar)
                conteudo_sped = generator.gerar()
                
                # Salvar arquivo SPED
                filename_sped = f"EFD_CONTRIBUICOES_{versao}_{dt_ini.strftime('%Y%m%d')}_{dt_fim.strftime('%Y%m%d')}.txt"
                filepath_sped = os.path.join(temp_dir, filename_sped)
                
                with open(filepath_sped, 'w', encoding='iso-8859-1', newline='') as f:
                    f.write(conteudo_sped)
                
                arquivos_para_zip = [filepath_sped]
                
                # 2. Exportar XMLs das notas (se solicitado)
                if exportar_xml:
                    logger.info("SPED Contribuições: Exportando XMLs...")
                    xml_dir = os.path.join(temp_dir, 'XMLs')
                    os.makedirs(xml_dir, exist_ok=True)
                    
                    from api.models import Venda
                    vendas = generator.vendas
                    
                    for venda in vendas:
                        if venda.xml_nfe:
                            xml_filename = f"NFe_{venda.chave_nfe or venda.numero_nfe}.xml"
                            xml_path = os.path.join(xml_dir, xml_filename)
                            
                            with open(xml_path, 'w', encoding='utf-8') as f:
                                f.write(venda.xml_nfe)
                            
                            arquivos_para_zip.append(xml_path)
                
                # 3. Gerar relatório PDF (se solicitado)
                if gerar_relatorio:
                    logger.info("SPED Contribuições: Gerando relatório...")
                    try:
                        # Importação dinâmica - serviço de relatório opcional
                        from api.services.sped_contribuicoes_report_service import SpedContribuicoesReportService  # type: ignore
                        
                        report_service = SpedContribuicoesReportService(dt_ini, dt_fim, operacoes_ids, empresa_config)
                        pdf_path = report_service.gerar_relatorio(temp_dir)
                        
                        if pdf_path:
                            arquivos_para_zip.append(pdf_path)
                            logger.info(f"SPED Contribuições: Relatório PDF gerado: {pdf_path}")
                    except (ImportError, Exception) as e:
                        logger.warning(f"SPED Contribuições: Serviço de relatório não disponível ou erro: {e}")
                
                # 4. Criar arquivo ZIP
                zip_filename = f"SPED_CONTRIBUICOES_{dt_ini.strftime('%Y%m%d')}_{dt_fim.strftime('%Y%m%d')}.zip"
                zip_path = os.path.join(diretorio, zip_filename)
                
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    # Adicionar arquivos
                    for arquivo in arquivos_para_zip:
                        if os.path.isfile(arquivo):
                            arcname = os.path.basename(arquivo)
                            zipf.write(arquivo, arcname)
                        elif os.path.isdir(arquivo):
                            # Adicionar diretório (XMLs)
                            for root, dirs, files in os.walk(arquivo):
                                for file in files:
                                    file_path = os.path.join(root, file)
                                    arc_path = os.path.join('XMLs', file)
                                    zipf.write(file_path, arc_path)
                
                # Salvar caminho final
                final_path = zip_path
                
                # Limpar diret ório temporário
                import shutil
                try:
                    shutil.rmtree(temp_dir)
                except Exception as e:
                    logger.warning(f"Erro ao limpar diretório temporário: {e}")
                
                logger.info(f"SPED Contribuições: Arquivo ZIP salvo em: {final_path}")
                
                # Retornar resposta de sucesso
                return JsonResponse({
                    "success": True,
                    "message": "SPED Contribuições gerado com sucesso!",
                    "arquivo": zip_filename,
                    "caminho": final_path,
                    "tamanho": os.path.getsize(final_path),
                    "data_geracao": datetime.datetime.now().isoformat(),
                    "periodo": {
                        "inicio": data_inicio_str,
                        "fim": data_fim_str
                    },
                    "estatisticas": {
                        "total_vendas": generator.vendas.count() if hasattr(generator, 'vendas') else 0,
                        "total_bc_pis": float(generator.total_bc_pis),
                        "total_pis": float(generator.total_pis),
                        "total_bc_cofins": float(generator.total_bc_cofins),
                        "total_cofins": float(generator.total_cofins),
                        "total_credito_pis": float(generator.total_credito_pis),
                        "total_credito_cofins": float(generator.total_credito_cofins)
                    }
                })
                
            except Exception as e:
                # Limpar em caso de erro
                import shutil
                if os.path.exists(temp_dir):
                    try:
                        shutil.rmtree(temp_dir)
                    except:
                        pass
                raise e
            
        except Exception as e:
            logger.error(f"Erro gerando SPED Contribuições: {str(e)}")
            logger.exception(e)
            return JsonResponse(
                {"error": f"Erro ao gerar SPED Contribuições: {str(e)}"},
                status=500
            )


class SpedContribuicoesSalvarConfigView(APIView):
    """
    Salva configurações do SPED Contribuições
    
    POST /api/sped-contribuicoes/salvar-config/
    
    Body:
    {
        "conjuntos": [1, 2],
        "diretorio": "C:\\SPED\\CONTRIBUICOES\\",
        "blocos": ["C", "F", "M"],
        "regime_apuracao": "2",  # 1=Cumulativo, 2=Não-cumulativo
        "regime_credito": "1"  # 1=Apuração consolidada, 2=Individualizada
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            data = request.data
            
            logger.info(f"SPED Contribuições: Salvando configuração: {data}")
            
            # Obter ou criar configuração da empresa
            config = EmpresaConfig.get_ativa()
            if not config:
                return JsonResponse({"error": "Configuração da empresa não encontrada. Por favor, configure os dados da empresa primeiro."}, status=404)
            
            # Salvar conjuntos
            if 'conjuntos' in data:
                conjuntos_str = ','.join(str(c) for c in data['conjuntos'])
                config.sped_contrib_conjuntos = conjuntos_str
            
            # Salvar diretório
            if 'diretorio' in data:
                config.sped_contrib_diretorio = data['diretorio']
            
            # Salvar blocos
            if 'blocos' in data:
                blocos_str = ','.join(data['blocos'])
                config.sped_contrib_blocos = blocos_str
            
            # Salvar regime de apuração
            if 'regime_apuracao' in data:
                config.regime_apuracao_pis_cofins = data['regime_apuracao']
            
            # Salvar regime de crédito
            if 'regime_credito' in data:
                config.regime_cred_pis_cofins = data['regime_credito']
            
            # Salvar versão
            if 'versao' in data:
                config.sped_contrib_versao = data['versao']
                
            # Salvar opções adicionais
            if 'exportar_xml' in data:
                config.sped_contrib_exportar_xml = data.get('exportar_xml', False)
            
            if 'gerar_relatorio' in data:
                config.sped_contrib_gerar_relatorio = data.get('gerar_relatorio', False)
            
            config.save()
            
            logger.info("SPED Contribuições: Configuração salva com sucesso!")
            
            return JsonResponse({
                "success": True,
                "message": "Configurações salvas com sucesso!"
            })
            
        except Exception as e:
            logger.error(f"Erro salvando configuração SPED Contribuições: {str(e)}")
            return JsonResponse(
                {"error": f"Erro ao salvar configurações: {str(e)}"},
                status=500
            )


class SpedContribuicoesCarregarConfigView(APIView):
    """
    Carrega configurações salvas do SPED Contribuições
    
    GET /api/sped-contribuicoes/carregar-config/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            config = EmpresaConfig.get_ativa()
            
            if not config:
                return JsonResponse({
                    "conjuntos": [],
                    "diretorio": "C:\\SPED\\CONTRIBUICOES\\",
                    "blocos": ["C", "F", "M"],
                    "regime_apuracao": "2",
                    "regime_credito": "1"
                })
            
            # Obter conjuntos
            conjuntos_str = getattr(config, 'sped_contrib_conjuntos', '')
            conjuntos = []
            if conjuntos_str:
                try:
                    conjuntos = [int(c.strip()) for c in conjuntos_str.split(',') if c.strip()]
                except:
                    conjuntos = []
            
            # Obter blocos
            blocos_str = getattr(config, 'sped_contrib_blocos', '')
            blocos = []
            if blocos_str:
                blocos = [b.strip() for b in blocos_str.split(',') if b.strip()]
            else:
                blocos = ['C', 'F', 'M']
            
            return JsonResponse({
                "conjuntos": conjuntos,
                "diretorio": getattr(config, 'sped_contrib_diretorio', 'C:\\SPED\\CONTRIBUICOES\\'),
                "blocos": blocos,
                "regime_apuracao": getattr(config, 'regime_apuracao_pis_cofins', '2'),
                "regime_credito": getattr(config, 'regime_cred_pis_cofins', '1')
            })
            
        except Exception as e:
            logger.error(f"Erro carregando configuração SPED Contribuições: {str(e)}")
            return JsonResponse(
                {"error": f"Erro ao carregar configurações: {str(e)}"},
                status=500
            )
