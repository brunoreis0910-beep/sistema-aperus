"""
Views para o Assistente de IA
Endpoints para chat e análises inteligentes
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import logging
import base64

from api.services.ai_service import ai_service

logger = logging.getLogger(__name__)


class AITranscribeView(APIView):
    """
    Transcreve áudio usando Gemini — compatível com todos os browsers (Firefox incluso).

    POST /api/ai/transcribe/
    Body (multipart/form-data):
        audio: arquivo de áudio (webm, ogg, wav, mp4…)
    """
    permission_classes = [IsAuthenticated]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        if not ai_service.is_available():
            return Response({'sucesso': False, 'mensagem': 'IA não configurada.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        audio_file = request.FILES.get('audio')
        if not audio_file:
            return Response({'sucesso': False, 'mensagem': 'Nenhum arquivo de áudio enviado.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            audio_bytes = audio_file.read()
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            mime = audio_file.content_type or 'audio/webm'

            try:
                from google.genai import types as genai_types
                
                # Monta prompt para transcrição
                prompt_transcricao = genai_types.Content(parts=[
                    genai_types.Part(
                        inline_data=genai_types.Blob(mime_type=mime, data=audio_b64)
                    ),
                    genai_types.Part(
                        text='Transcreva exatamente o que foi dito em português brasileiro. Retorne apenas o texto transcrito, sem explicações, sem formatação.'
                    ),
                ])
                
                # Usa o método com retry do ai_service
                # Nota: Como não temos acesso direto ao método _chamar_gemini_com_retry aqui,
                # vamos fazer um retry manual simples
                import time, re as _re

                max_tentativas = 3
                delay_inicial = 2.0

                for tentativa in range(1, max_tentativas + 1):
                    try:
                        response = ai_service.client.models.generate_content(
                            model=ai_service.model_name,
                            contents=prompt_transcricao
                        )
                        texto = response.text.strip()
                        break  # Sucesso, sai do loop

                    except Exception as e_tentativa:
                        erro_str = str(e_tentativa)
                        is_503 = '503' in erro_str or 'UNAVAILABLE' in erro_str
                        is_429 = '429' in erro_str or 'RESOURCE_EXHAUSTED' in erro_str

                        if (is_503 or is_429) and tentativa < max_tentativas:
                            # Tenta extrair o retryDelay sugerido pelo Google (ex: "54s")
                            m = _re.search(r'retryDelay["\s:]+(\d+)', erro_str)
                            suggested = int(m.group(1)) if m else None
                            if is_429 and suggested and suggested > 30:
                                # Quota diária esgotada — não adianta esperar minutos no request
                                raise
                            delay = min(suggested or (delay_inicial * (2 ** (tentativa - 1))), 15)
                            logger.warning(f"Gemini erro {429 if is_429 else 503} na transcrição (tentativa {tentativa}). Aguardando {delay}s...")
                            time.sleep(delay)
                            continue
                        else:
                            raise  # Relança se não for 503/429 ou última tentativa

            except Exception as e:
                logger.error(f'Erro Gemini na transcrição: {e}', exc_info=True)
                erro_str = str(e)

                if '503' in erro_str or 'UNAVAILABLE' in erro_str:
                    mensagem_erro = 'O serviço do Google Gemini está temporariamente sobrecarregado. Tente novamente em 1-2 minutos.'
                elif '429' in erro_str or 'RESOURCE_EXHAUSTED' in erro_str:
                    mensagem_erro = 'Limite diário de transcrições atingido (cota gratuita do Gemini). Por favor, use a digitação até amanhã ou configure uma chave de API paga.'
                else:
                    mensagem_erro = f'Erro na transcrição: {erro_str}'

                return Response({'sucesso': False, 'mensagem': mensagem_erro}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            return Response({'sucesso': True, 'texto': texto})

        except Exception as e:
            logger.error(f'Erro no endpoint de transcrição: {e}', exc_info=True)
            return Response({'sucesso': False, 'mensagem': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIChatView(APIView):
    """
    Endpoint para chat com IA
    
    POST /api/ai/chat/
    Body: {
        "mensagem": "Quanto vendemos este mês?",
        "historico": [] (opcional)
    }
    """
    permission_classes = [IsAuthenticated]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        """Processa mensagem do usuário"""
        try:
            mensagem = request.data.get('mensagem', '').strip()
            
            if not mensagem:
                return Response({
                    'sucesso': False,
                    'mensagem': 'Mensagem não pode estar vazia'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verifica se IA está disponível
            if not ai_service.is_available():
                return Response({
                    'sucesso': False,
                    'mensagem': 'Serviço de IA não disponível. Configure GEMINI_API_KEY no arquivo .env',
                    'resposta': 'Desculpe, o assistente de IA não está configurado. Entre em contato com o administrador do sistema.',
                    'tipo': 'erro'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            logger.info(f"Processando consulta IA: {mensagem} (usuário: {request.user.username})")
            
            # Processa a consulta
            resultado = ai_service.processar_consulta(mensagem, request.user)
            
            # Log do resultado
            if resultado.get('sucesso'):
                logger.info(f"Consulta processada com sucesso. Tipo: {resultado.get('tipo')}")
            else:
                logger.warning(f"Erro ao processar consulta: {resultado.get('mensagem')}")
            
            return Response(resultado, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Erro no endpoint de chat: {e}", exc_info=True)
            return Response({
                'sucesso': False,
                'mensagem': f'Erro ao processar mensagem: {str(e)}',
                'tipo': 'erro'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIStatusView(APIView):
    """
    Verifica status do serviço de IA
    
    GET /api/ai/status/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retorna status do serviço de IA"""
        disponivel = ai_service.is_available()
        
        return Response({
            'disponivel': disponivel,
            'mensagem': 'Serviço de IA disponível (Google Gemini)' if disponivel else 'Configure GEMINI_API_KEY no .env'
        })


class AIAnaliseView(APIView):
    """
    Endpoint para análises automáticas
    
    POST /api/ai/analise/
    Body: {
        "tipo": "vendas|estoque|financeiro|inadimplencia",
        "periodo": "hoje|esta_semana|este_mes" (opcional)
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Gera análise automática"""
        try:
            tipo_analise = request.data.get('tipo', 'geral')
            periodo = request.data.get('periodo', 'este_mes')
            
            # Monta pergunta baseada no tipo
            perguntas = {
                'vendas': f'Faça uma análise das vendas {periodo}',
                'estoque': 'Faça uma análise do estoque atual',
                'financeiro': f'Faça uma análise financeira {periodo}',
                'inadimplencia': 'Analise os riscos de inadimplência dos clientes',
                'geral': f'Faça um resumo geral do negócio {periodo}'
            }
            
            pergunta = perguntas.get(tipo_analise, perguntas['geral'])
            
            resultado = ai_service.processar_consulta(pergunta, request.user)
            
            return Response(resultado)
            
        except Exception as e:
            logger.error(f"Erro na análise: {e}")
            return Response({
                'sucesso': False,
                'mensagem': f'Erro ao gerar análise: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIAnaliseNegocioView(APIView):
    """
    POST /api/ai/analise-negocio/
    Gera análise estratégica completa do negócio usando Gemini como
    Consultor de Negócios. Retorna resumo Markdown + insights estruturados.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            resultado = ai_service.gerar_analise_negocio(request.user)
            http_status = (
                status.HTTP_200_OK if resultado.get('sucesso')
                else status.HTTP_503_SERVICE_UNAVAILABLE
            )
            return Response(resultado, status=http_status)
        except Exception as e:
            logger.error(f"Erro em analise-negocio: {e}", exc_info=True)
            return Response(
                {'sucesso': False, 'mensagem': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AITtsView(APIView):
    """
    Converte texto em fala usando TTS neural.

    Prioridade:
    1. Google Cloud TTS (se GOOGLE_CLOUD_TTS_API_KEY estiver configurada no .env)
    2. Edge TTS - Microsoft (gratuito, sem API key, vozes neurais pt-BR)

    POST /api/ai/tts/
    Body: {"texto": "...", "voz": "pt-BR-FranciscaNeural"}  (voz é opcional)
    Response: {"sucesso": true, "audio_base64": "<mp3 em base64>", "formato": "mp3"}
    """
    permission_classes = [IsAuthenticated]

    _MD_LIMPAR = [
        (r'#{1,6}\s', ''),
        (r'\*\*(.*?)\*\*', r'\1'),
        (r'\*(.*?)\*', r'\1'),
        (r'`(.*?)`', r'\1'),
        (r'\[(.*?)\]\(.*?\)', r'\1'),
        (r'[-*+]\s', ''),
        (r'\n{2,}', '. '),
        (r'\n', ' '),
    ]

    def _limpar_markdown(self, texto):
        import re
        for padrao, sub in self._MD_LIMPAR:
            texto = re.sub(padrao, sub, texto)
        return texto.strip()

    def _gerar_edge_tts(self, texto, voz='pt-BR-FranciscaNeural'):
        """Gera áudio via Microsoft Edge TTS (gratuito, sem API key, voz neural)."""
        import asyncio
        import base64
        import tempfile
        import os
        import edge_tts

        vozes_edge_ptbr = {
            'pt-BR-FranciscaNeural', 'pt-BR-AntonioNeural', 'pt-BR-BrendaNeural',
            'pt-BR-DonatoNeural', 'pt-BR-ElzaNeural', 'pt-BR-FabioNeural',
            'pt-BR-GiovannaNeural', 'pt-BR-HumbertoNeural', 'pt-BR-JulioNeural',
            'pt-BR-LeilaNeural', 'pt-BR-LeticiaNeural', 'pt-BR-ManuelaNeural',
            'pt-BR-NicolauNeural', 'pt-BR-ThalitaNeural', 'pt-BR-ValerioNeural',
            'pt-BR-YaraNeural',
        }
        if voz not in vozes_edge_ptbr:
            voz = 'pt-BR-FranciscaNeural'

        async def _sintetizar():
            communicate = edge_tts.Communicate(texto, voz, rate='+5%', pitch='+0Hz')
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
                tmp_path = tmp.name
            await communicate.save(tmp_path)
            with open(tmp_path, 'rb') as f:
                audio_bytes = f.read()
            os.unlink(tmp_path)
            return audio_bytes

        audio_bytes = asyncio.run(_sintetizar())
        return base64.b64encode(audio_bytes).decode('utf-8')

    def post(self, request):
        import requests as http_requests
        from decouple import config as decouple_config

        texto_bruto = request.data.get('texto', '').strip()
        if not texto_bruto:
            return Response(
                {'sucesso': False, 'mensagem': 'Campo "texto" não informado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        texto = self._limpar_markdown(texto_bruto)[:4500]
        voz_solicitada = request.data.get('voz', '')

        # 1) Tenta Google Cloud TTS se a chave estiver configurada
        api_key = decouple_config('GOOGLE_CLOUD_TTS_API_KEY', default='').strip()
        if api_key:
            voz_google = voz_solicitada if voz_solicitada in {
                'pt-BR-Neural2-A', 'pt-BR-Neural2-B', 'pt-BR-Neural2-C',
                'pt-BR-Wavenet-A', 'pt-BR-Wavenet-B', 'pt-BR-Wavenet-C',
                'pt-BR-Standard-A', 'pt-BR-Standard-B', 'pt-BR-Standard-C',
            } else 'pt-BR-Neural2-A'
            try:
                url = 'https://texttospeech.googleapis.com/v1/text:synthesize'
                payload = {
                    'input': {'text': texto},
                    'voice': {'languageCode': 'pt-BR', 'name': voz_google},
                    'audioConfig': {'audioEncoding': 'MP3', 'speakingRate': 1.05, 'pitch': 0.0},
                }
                resp = http_requests.post(url, json=payload, params={'key': api_key}, timeout=15)
                if resp.status_code == 200:
                    audio_b64 = resp.json().get('audioContent', '')
                    return Response({'sucesso': True, 'audio_base64': audio_b64, 'formato': 'mp3', 'provider': 'google'})
                logger.warning(f'Google TTS falhou ({resp.status_code}), usando Edge TTS como fallback.')
            except Exception as e:
                logger.warning(f'Google TTS erro: {e}. Usando Edge TTS como fallback.')

        # 2) Edge TTS (Microsoft) — gratuito, neural, sem API key
        try:
            voz_edge = voz_solicitada if voz_solicitada else 'pt-BR-FranciscaNeural'
            audio_b64 = self._gerar_edge_tts(texto, voz=voz_edge)
            return Response({'sucesso': True, 'audio_base64': audio_b64, 'formato': 'mp3', 'provider': 'edge'})
        except Exception as e:
            logger.error(f'Edge TTS erro: {e}', exc_info=True)
            return Response(
                {'sucesso': False, 'mensagem': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
