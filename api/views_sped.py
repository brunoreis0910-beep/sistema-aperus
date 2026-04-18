from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse, JsonResponse
from api.services.sped_service import SpedEFDGenerator
from api.services.export_xml_service import ExportXMLService
from api.services.sped_report_service import SpedReportService
from api.services.sped_contribuicoes_service import SpedContribuicoesGenerator
from api.models import ConjuntoOperacao, EmpresaConfig
import datetime
import logging
import os

import shutil
import tempfile
import zipfile
from django.core.files.base import ContentFile
from wsgiref.util import FileWrapper

class SpedGerarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Gera o arquivo SPED ICMS/IPI.
        Payload:
        {
            "versao": "020",  # Versão do layout
            "conjuntos": [1, 2, 3],  # IDs dos conjuntos de operação
            "blocos": ["C", "D", "E", "K"],  # Blocos a serem gerados (C=NFe/NFCe, D=CTe, E=Apuração)
            "data_inicio": "2024-01-01",  # Data inicial (opcional)
            "data_fim": "2024-01-31",  # Data final (opcional)
            "exportar_xml": true,  # Exportar XMLs em pastas separadas (opcional)
            "gerar_relatorio": true,  # Gerar relatório PDF (opcional)
            "compactar": true  # Retornar como ZIP
        }
        """
        data = request.data
        
        # Pega a versão do SPED (padrão 020)
        versao = data.get('versao', '020')
        
        # Pega os blocos a serem gerados (incluir D para CTes)
        blocos_gerar = data.get('blocos', ['C', 'D', 'E'])
        
        # Pega as opções de exportação
        exportar_xml = data.get('exportar_xml', False)
        gerar_relatorio = data.get('gerar_relatorio', False)
        compactar = True  # Sempre compactar se tiver mix de arquivos, mas o usuário pediu explícito
        
        # Pega os IDs dos conjuntos selecionados
        conjuntos_ids = data.get('conjuntos', [])
        if not conjuntos_ids:
            return JsonResponse({'error': 'Selecione pelo menos um conjunto de operação'}, status=400)
        
        logger = logging.getLogger(__name__)
        logger.info(f"SPED VIEW: Conjuntos selecionados: {conjuntos_ids}")
        logger.info(f"SPED VIEW: Exportar XML: {exportar_xml}, Gerar Relatório: {gerar_relatorio}")
        
        # Busca todas as operações dos conjuntos selecionados
        operacoes_ids = []
        for conjunto_id in conjuntos_ids:
            try:
                conjunto = ConjuntoOperacao.objects.get(id_conjunto=conjunto_id)
                # Pega os IDs das operações deste conjunto
                ops = conjunto.operacoes.values_list('id_operacao', flat=True)
                ops_list = list(ops)
                logger.info(f"SPED VIEW: Conjunto {conjunto_id} '{conjunto.nome_conjunto}' tem operações: {ops_list}")
                operacoes_ids.extend(ops_list)
            except ConjuntoOperacao.DoesNotExist:
                logger.warning(f"SPED VIEW: Conjunto {conjunto_id} não encontrado")
                continue
        
        # Remove duplicatas (caso uma operação esteja em múltiplos conjuntos)
        operacoes_ids = list(set(operacoes_ids))
        
        logger.info(f"SPED VIEW: Total de operações únicas a filtrar: {operacoes_ids}")
        
        if not operacoes_ids:
            return JsonResponse({'error': 'Nenhuma operação encontrada nos conjuntos selecionados'}, status=400)
        
        # Pega as datas do payload ou usa o mês anterior como período
        data_inicio = data.get('data_inicio')
        data_fim = data.get('data_fim')
        
        if data_inicio and data_fim:
            # Converte strings para date
            try:
                dt_ini = datetime.datetime.strptime(data_inicio, '%Y-%m-%d').date()
                dt_fim = datetime.datetime.strptime(data_fim, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({'error': 'Formato de data inválido. Use YYYY-MM-DD'}, status=400)
        else:
            # Usa o mês anterior como período padrão
            hoje = datetime.date.today()
            mes_anterior = hoje.month - 1 if hoje.month > 1 else 12
            ano = hoje.year if hoje.month > 1 else hoje.year - 1
            dt_ini = datetime.date(ano, mes_anterior, 1)
            # Último dia do mês anterior
            if mes_anterior == 12:
                dt_fim = datetime.date(ano, 12, 31)
            else:
                dt_fim = datetime.date(ano, mes_anterior + 1, 1) - datetime.timedelta(days=1)

        try:
            # Cria diretório temporário para gerar os arquivos
            temp_dir = tempfile.mkdtemp()
            logger.info(f"SPED VIEW: Diretório temporário criado: {temp_dir}")
            
            # 1. Gerar SPED
            generator = SpedEFDGenerator(dt_ini, dt_fim, operacoes_ids, versao, blocos_gerar)
            content = generator.generate()
            
            filename_sped = f"SPED_{versao}_{dt_ini.strftime('%Y%m%d')}_{dt_fim.strftime('%Y%m%d')}.txt"
            filepath_sped = os.path.join(temp_dir, filename_sped)
            
            with open(filepath_sped, 'w', encoding='iso-8859-1', newline='') as f:
                f.write(content)
            
            arquivos_para_zip = [filepath_sped]
            pastas_para_zip = []

            # 2. Exportar XMLs
            if exportar_xml:
                logger.info("Iniciando exportação de XMLs...")
                xml_service = ExportXMLService(dt_ini, dt_fim, operacoes_ids, temp_dir)
                xml_stats = xml_service.exportar_xmls()
                
                # Adicionar pastas de XML ao ZIP
                if xml_stats['nfe'] > 0: pastas_para_zip.append(os.path.join(temp_dir, 'NFe'))
                if xml_stats['nfce'] > 0: pastas_para_zip.append(os.path.join(temp_dir, 'NFCe'))
                if xml_stats['cte'] > 0: pastas_para_zip.append(os.path.join(temp_dir, 'CTe'))

            # Buscar configuração da empresa (para relatório e contribuições)
            empresa_config = EmpresaConfig.get_ativa()

            # 3. Gerar Relatório PDF
            if gerar_relatorio:
                logger.info("Iniciando geração de relatório PDF...")
                try:
                    # empresa_config já carregado
                    report_service = SpedReportService(dt_ini, dt_fim, operacoes_ids, empresa_config)
                    
                    filename_pdf = f"Relatorio_Fiscal_{dt_ini.strftime('%Y%m%d')}_{dt_fim.strftime('%Y%m%d')}.pdf"
                    filepath_pdf = os.path.join(temp_dir, filename_pdf)
                    
                    if report_service.gerar_pdf(filepath_pdf):
                        arquivos_para_zip.append(filepath_pdf)
                except Exception as e:
                    logger.error(f"Erro ao gerar relatório: {str(e)}")

            # 3.5 Gerar SPED Contribuições (se configurado)
            gerar_contribuicoes = data.get('gerar_contribuicoes', False)
            
            logger.debug(f"SPED CONTRIB DEBUG: gerar_contribuicoes={gerar_contribuicoes}, empresa_config={empresa_config is not None}")

            # Verifica banco de dados se não enviado no payload
            if not gerar_contribuicoes and empresa_config:
                if hasattr(empresa_config, 'sped_gerar_contribuicoes_junto'):
                    gerar_contribuicoes = empresa_config.sped_gerar_contribuicoes_junto
                    logger.debug(f"SPED CONTRIB: sped_gerar_contribuicoes_junto={gerar_contribuicoes}")

            logger.debug(f"SPED CONTRIB: decisão final gerar_contribuicoes={gerar_contribuicoes}")

            if gerar_contribuicoes:
                logger.info("Iniciando geração de SPED Contribuições...")
                    
                logger.info("Iniciando geração de SPED Contribuições...")
                try:
                    contrib_versao = '135'
                    contrib_blocos = ['C', 'F', 'M']
                    
                    if empresa_config:
                        if hasattr(empresa_config, 'sped_contrib_versao') and empresa_config.sped_contrib_versao:
                            contrib_versao = empresa_config.sped_contrib_versao
                        if hasattr(empresa_config, 'sped_contrib_blocos') and empresa_config.sped_contrib_blocos:
                            contrib_blocos = [b.strip() for b in empresa_config.sped_contrib_blocos.split(',')]
                    
                    logger.debug(f"SPED CONTRIB: versão={contrib_versao}, blocos={contrib_blocos}, periodo={dt_ini} a {dt_fim}")

                    contrib_generator = SpedContribuicoesGenerator(
                        dt_ini, dt_fim, operacoes_ids, contrib_versao, contrib_blocos
                    )
                    
                    content_contrib = contrib_generator.gerar()
                    logger.debug(f"SPED CONTRIB: conteúdo gerado com {len(content_contrib)} chars")
                    
                    filename_contrib = f"SPED_CONTRIB_{contrib_versao}_{dt_ini.strftime('%Y%m%d')}_{dt_fim.strftime('%Y%m%d')}.txt"
                    filepath_contrib = os.path.join(temp_dir, filename_contrib)
                    
                    with open(filepath_contrib, 'w', encoding='iso-8859-1', newline='') as f:
                        f.write(content_contrib)
                    
                    arquivos_para_zip.append(filepath_contrib)
                    logger.info(f"SPED Contribuições gerado: {filepath_contrib}")
                except Exception as e:
                    import traceback
                    logger.error(f"Erro ao gerar SPED Contribuições: {str(e)}")
                    logger.error(traceback.format_exc())

            # 4. Criar ZIP
            zip_filename = f"SPED_PACOTE_{dt_ini.strftime('%Y%m%d')}_{dt_fim.strftime('%Y%m%d')}.zip"
            zip_filepath = os.path.join(temp_dir, zip_filename)
            
            with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
                # Adicionar arquivos soltos (SPED, PDF)
                for file_path in arquivos_para_zip:
                    if os.path.exists(file_path):
                        zipf.write(file_path, os.path.basename(file_path))
                
                # Adicionar pastas (XMLs)
                for folder_path in pastas_para_zip:
                    if os.path.exists(folder_path):
                        foldername = os.path.basename(folder_path)
                        for root, dirs, files in os.walk(folder_path):
                            for file in files:
                                file_path = os.path.join(root, file)
                                arcname = os.path.join(foldername, file)
                                zipf.write(file_path, arcname)

            # Verificar se foi solicitado salvar em diretório específico
            diretorio_destino = data.get('diretorio')
            
            if diretorio_destino:
                try:
                    # Cria o diretório (e todos os pais necessários) se não existir
                    os.makedirs(diretorio_destino, exist_ok=True)
                    final_path = os.path.join(diretorio_destino, zip_filename)
                    shutil.move(zip_filepath, final_path)
                    logger.info(f"SPED ZIP salvo em: {final_path}")
                except Exception as save_err:
                    logger.error(f"Erro ao salvar SPED em {diretorio_destino}: {save_err}")
                    return JsonResponse({'error': f'Arquivo gerado mas não foi possível salvar em "{diretorio_destino}": {str(save_err)}'}, status=500)
                
                # Limpa temp
                try:
                    shutil.rmtree(temp_dir)
                except:
                    pass
                
                return JsonResponse({
                    'success': True,
                    'message': f'Arquivo salvo com sucesso em {final_path}',
                    'filepath': final_path,
                    'filename': zip_filename
                })
            
            # Se não, retorna como download (comportamento padrão)
            elif os.path.exists(zip_filepath):
                with open(zip_filepath, 'rb') as f:
                    response = HttpResponse(f.read(), content_type='application/zip')
                    response['Content-Disposition'] = f'attachment; filename="{zip_filename}"'
                    
                    # Limpar temp dir após ler o arquivo
                    try:
                        shutil.rmtree(temp_dir)
                    except:
                        pass
                        
                    return response
            else:
                return JsonResponse({"error": "Erro ao criar arquivo ZIP"}, status=500)
            
        except Exception as e:
            import traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Erro gerando SPED: {str(e)}")
            logger.error(traceback.format_exc())
            return JsonResponse({"error": f"Erro ao gerar SPED: {str(e)}"}, status=500)


class SpedSalvarConfigView(APIView):
    permission_classes = [IsAuthenticated]  # Dados fiscais da empresa — requer autenticação
    
    def post(self, request):
        """
        Salva as configurações de SPED (conjuntos, diretório e blocos).
        Payload:
        {
            "conjuntos": "1,2,3",  # IDs separados por vírgula
            "diretorio": "C:\\SPED\\2026\\",
            "bloco_c": true,
            "bloco_d": false,
            "bloco_e": true,
            "bloco_g": false,
            "bloco_h": false,
            "bloco_k": false
        }
        """
        data = request.data
        
        logger = logging.getLogger(__name__)
        logger.info(f"SPED SALVAR CONFIG: Recebido payload: {data}")
        logger.info(f"SPED SALVAR CONFIG: Campo 'gerar_contribuicoes' no payload: {data.get('gerar_contribuicoes', 'NÃO ENVIADO')}")
        
        try:
            config = EmpresaConfig.get_ativa()
            if not config:
                # Se não existe config, não cria nova, apenas retorna erro
                return JsonResponse({"error": "Configure primeiro os dados da empresa em /config-nfce/"}, status=400)
            
            # Salvar conjuntos (lista de IDs para string separada por vírgula)
            if 'conjuntos' in data:
                conjuntos = data['conjuntos']
                if isinstance(conjuntos, list):
                    config.sped_conjuntos_selecionados = ','.join(str(c) for c in conjuntos)
                else:
                    config.sped_conjuntos_selecionados = str(conjuntos)
            
            if 'diretorio' in data:
                config.sped_diretorio_saida = data.get('diretorio', '')
            
            logger.info(f"SPED SALVAR CONFIG: Salvando conjuntos: {config.sped_conjuntos_selecionados}")
            logger.info(f"SPED SALVAR CONFIG: Salvando diretório: {config.sped_diretorio_saida}")
            
            # Save Revenue Code if provided
            if 'codigo_receita_icms' in data:
                config.codigo_receita_icms = data.get('codigo_receita_icms')
            
            # Salvar versão
            if 'versao' in data:
                config.sped_icms_versao = data.get('versao', '020')
            
            # Salvar blocos selecionados
            if 'bloco_c' in data:
                config.sped_gerar_bloco_c = data.get('bloco_c', True)
            if 'bloco_d' in data:
                config.sped_gerar_bloco_d = data.get('bloco_d', False)
            if 'bloco_e' in data:
                config.sped_gerar_bloco_e = data.get('bloco_e', True)
            if 'bloco_g' in data:
                config.sped_gerar_bloco_g = data.get('bloco_g', False)
            if 'bloco_h' in data:
                config.sped_gerar_bloco_h = data.get('bloco_h', False)
            if 'bloco_k' in data:
                config.sped_gerar_bloco_k = data.get('bloco_k', False)
            
            # Salvar opções adicionais
            if 'exportar_xml' in data:
                config.sped_icms_exportar_xml = data.get('exportar_xml', False)
            if 'gerar_relatorio' in data:
                config.sped_icms_gerar_relatorio = data.get('gerar_relatorio', False)
            
            if 'gerar_contribuicoes' in data:
                valor_contribuicoes = data.get('gerar_contribuicoes', False)
                config.sped_gerar_contribuicoes_junto = valor_contribuicoes
                logger.info(f"SPED SALVAR CONFIG: Salvando gerar_contribuicoes_junto = {valor_contribuicoes}")
            
            config.save()
            
            logger.info(f"SPED SALVAR CONFIG: Configuração salva com sucesso!")
            logger.info(f"SPED SALVAR CONFIG: Valor atual no BD: {config.sped_gerar_contribuicoes_junto}")
            
            return JsonResponse({'success': True, 'message': 'Configurações salvas com sucesso'})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return JsonResponse({"error": f"Erro ao salvar configurações: {str(e)}"}, status=500)


class SpedEnviarEmailView(APIView):
    """POST /api/sped/enviar-email/ - Envia arquivo SPED por e-mail para o contador"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from api.services_email import EmailService, EmailServiceError

        filepath = request.data.get('filepath', '').strip()
        email = request.data.get('email', '').strip()
        periodo = request.data.get('periodo', 'SPED')
        contador_nome = request.data.get('contador_nome', 'Contador')

        if not filepath or not email:
            return Response({'success': False, 'error': 'filepath e email são obrigatórios'}, status=400)

        if not os.path.exists(filepath):
            return Response({'success': False, 'error': f'Arquivo não encontrado: {filepath}'}, status=404)

        try:
            empresa = EmpresaConfig.get_ativa()
            if not empresa:
                return Response({'success': False, 'error': 'Empresa não configurada no sistema'}, status=400)

            filename = os.path.basename(filepath)
            with open(filepath, 'rb') as f:
                file_content = f.read()

            empresa_nome = empresa.nome_fantasia or empresa.nome_razao_social or 'APERUS'

            assunto = f'SPED Fiscal - {periodo}'
            html_body = f"""
                <h2>SPED Fiscal - {periodo}</h2>
                <p>Prezado(a) {contador_nome},</p>
                <p>Segue em anexo o arquivo SPED Fiscal referente ao período: <strong>{periodo}</strong>.</p>
                <p>Arquivo: <strong>{filename}</strong></p>
                <br>
                <p>Atenciosamente,<br><strong>{empresa_nome}</strong></p>
            """

            ext = os.path.splitext(filename)[1].lower()
            if ext == '.zip':
                mime_type = 'application/zip'
            elif ext == '.txt':
                mime_type = 'text/plain'
            else:
                mime_type = 'application/octet-stream'

            service = EmailService(empresa_id=empresa.id_empresa)
            service.send(
                destinatario_email=email,
                assunto=assunto,
                html_body=html_body,
                destinatario_nome=contador_nome,
                anexos=[{'nome': filename, 'conteudo': file_content, 'mime_type': mime_type}]
            )

            return Response({'success': True, 'message': f'E-mail enviado com sucesso para {email}'})

        except EmailServiceError as e:
            return Response({'success': False, 'error': str(e)}, status=400)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=500)
