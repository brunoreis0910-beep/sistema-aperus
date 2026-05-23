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

    def _formatar_moeda(self, valor):
        try:
            return f"R$ {float(valor):.2f}".replace('.', ',')
        except (ValueError, TypeError):
            return str(valor)

    def _formatar_numero(self, val):
        try:
            if float(val).is_integer():
                return str(int(val))
            return f"{float(val):.2f}".replace('.', ',')
        except (ValueError, TypeError):
            return str(val)

    def _humanizar_dados_produtos(self, dados_json):
        """Transforma dados de produtos/vendas/etc em texto natural em português."""
        if not isinstance(dados_json, (dict, list)):
            return ""
        
        # Se for uma lista de produtos/itens
        if isinstance(dados_json, list):
            if not dados_json:
                return "Nenhum item listado."
            
            itens_frases = []
            for item in dados_json:
                if not isinstance(item, dict):
                    continue
                # Procura chaves comuns de nome
                nome = item.get('id_produto__nome_produto') or item.get('nome_produto') or item.get('produto') or item.get('nome') or ''
                nome = str(nome).strip().title()
                
                # Procura chaves de quantidade
                qtd = item.get('quantidade_total') or item.get('quantidade') or item.get('qtd') or 0
                qtd_str = self._formatar_numero(qtd)
                
                # Procura chaves de valor/total
                valor = item.get('valor_total') or item.get('valor') or item.get('total') or item.get('valor_total_servico') or 0
                
                if nome:
                    frase = f"{qtd_str} unidades de {nome}"
                    if valor:
                        frase += f" no valor total de {self._formatar_moeda(valor)}"
                    itens_frases.append(frase)
            
            if itens_frases:
                if len(itens_frases) == 1:
                    return itens_frases[0] + "."
                return ", ".join(itens_frases[:-1]) + " e " + itens_frases[-1] + "."
            return ""
            
        # Se for um dicionário (com chaves como top_produtos, produtos, etc.)
        elif isinstance(dados_json, dict):
            # Verifica se tem listas internas que representam listas de itens
            for chave in ['top_produtos', 'produtos', 'itens', 'relatorios_disponiveis']:
                if chave in dados_json and isinstance(dados_json[chave], list):
                    return self._humanizar_dados_produtos(dados_json[chave])
            
            # Humaniza chaves gerais do dicionário
            partes = []
            for k, v in dados_json.items():
                # Pula chaves estruturais de período ou IDs complexos
                if k in ['periodo', 'filtros', 'sucesso', 'tipo', 'modo', 'id'] or k.endswith('_id'):
                    continue
                
                # Formata chave para linguagem falada
                k_falado = k.replace('_', ' ').replace('total ', 'total de ').strip()
                
                # Formata valor
                if isinstance(v, (int, float)):
                    if 'valor' in k or 'ticket' in k or 'total' in k or 'receber' in k or 'pagar' in k:
                        v_formatado = self._formatar_moeda(v)
                    else:
                        v_formatado = self._formatar_numero(v)
                    partes.append(f"{k_falado}: {v_formatado}")
                elif isinstance(v, str) and not v.startswith(('http', '/api')):
                    partes.append(f"{k_falado}: {v}")
                    
            if partes:
                return ". ".join(partes) + "."
                
        return ""

    def _processar_tabela(self, linhas):
        """Converte linhas de uma tabela markdown em frase falada."""
        import re
        rows = []
        for linha in linhas:
            # Separa por '|' e limpa células
            celulas = [c.strip() for c in linha.split('|')[1:-1]]
            rows.append(celulas)
            
        if len(rows) < 2:
            return ""
            
        # O cabeçalho é a primeira linha
        headers = rows[0]
        
        # A segunda linha geralmente é o separador |---|---| (ignora)
        inicio_dados = 1
        if len(rows) > 1 and all(re.match(r'^[\s\-:\+]*$', c) for c in rows[1]):
            inicio_dados = 2
            
        # Se não houver dados, retorna vazio
        if inicio_dados >= len(rows):
            return ""
            
        frases_linhas = []
        for r in rows[inicio_dados:]:
            # Associa cada célula com seu cabeçalho
            pares = []
            for h, c in zip(headers, r):
                if c and h:
                    # Normaliza cabeçalho
                    h_clean = h.lower().replace('.', '').strip()
                    if h_clean in ['qtd', 'quant', 'quantidade']:
                        h_clean = 'quantidade'
                    elif h_clean in ['val', 'valor', 'total', 'val total', 'valor total']:
                        h_clean = 'valor'
                    elif h_clean in ['prod', 'produto', 'nome']:
                        h_clean = 'produto'
                    
                    if h_clean == 'produto':
                        pares.append(c.title())
                    elif h_clean == 'valor':
                        pares.append(f"{h_clean} {self._formatar_moeda(c)}")
                    elif h_clean == 'quantidade':
                        pares.append(f"{h_clean} {self._formatar_numero(c)}")
                    else:
                        pares.append(f"{h_clean} {c}")
            if pares:
                frases_linhas.append(", ".join(pares))
                
        if frases_linhas:
            if len(frases_linhas) == 1:
                return "O item na tabela é: " + frases_linhas[0] + "."
            return "Os itens na tabela são: " + "; ".join(frases_linhas[:-1]) + " e " + frases_linhas[-1] + "."
        return ""

    def _humanizar_tabelas_markdown(self, texto):
        """Detecta tabelas markdown no texto e as converte em frases legíveis por humanos."""
        linhas = texto.split('\n')
        novas_linhas = []
        i = 0
        n = len(linhas)
        
        while i < n:
            linha = linhas[i].strip()
            # Se a linha atual e a próxima forem de tabela (contém '|')
            if linha.startswith('|') and i + 1 < n and '|' in linhas[i+1]:
                # Encontramos uma tabela! Vamos agrupá-la
                linhas_tabela = []
                while i < n and '|' in linhas[i]:
                    linhas_tabela.append(linhas[i].strip())
                    i += 1
                
                # Agora parseia e humaniza a tabela agrupada
                tabela_humanizada = self._processar_tabela(linhas_tabela)
                novas_linhas.append(tabela_humanizada)
            else:
                novas_linhas.append(linhas[i])
                i += 1
                
        return '\n'.join(novas_linhas)

    def _limpar_caracteres_codigo(self, texto):
        """Remove caracteres especiais de JSON/dicionário para evitar que o TTS os soletre."""
        import re
        # Remove chaves, colchetes, aspas duplas, aspas simples
        texto = re.sub(r'[\{\}\[\]\"\'\`]', ' ', texto)
        # Substitui dois pontos que parecem ser de pares de chaves por espaço
        # (mas mantém dois pontos que indicam horas, ex: 14:30)
        texto = re.sub(r'(?<!\d):(?! \d)', ' ', texto)
        # Substitui sublinhados duplicados ou isolados por espaço
        texto = re.sub(r'_', ' ', texto)
        return texto

    def _limpar_e_humanizar_texto(self, texto):
        """Detecta JSONs/dicionários/tabelas no texto e os converte em linguagem natural para TTS."""
        import re
        import json
        if not texto:
            return ""
        
        # 0. Converte tabelas markdown primeiro
        texto = self._humanizar_tabelas_markdown(texto)
        
        # 1. Primeiro limpa markdown de blocos de código
        # Padrão: ```json ... ``` ou ``` ... ```
        padrao_bloco = r'```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```'
        
        def substituir_bloco(match):
            conteudo = match.group(1).strip()
            try:
                dados = json.loads(conteudo)
                humanizado = self._humanizar_dados_produtos(dados)
                if humanizado:
                    return f" {humanizado} "
            except Exception:
                pass
            # Fallback se não conseguir parsear: remove chaves/aspas/etc
            return " " + self._limpar_caracteres_codigo(conteudo) + " "
            
        texto = re.sub(padrao_bloco, substituir_bloco, texto, flags=re.DOTALL)
        
        # 2. Procura por JSONs soltos no texto que começam com { ou [
        padrao_json_solto = r'(\{.*?\}|\[\s*\{.*?\}\s*\])'
        
        def substituir_json_solto(match):
            conteudo = match.group(1).strip()
            # Verifica se parece JSON (contém aspas e dois pontos)
            if '"' in conteudo and ':' in conteudo:
                try:
                    dados = json.loads(conteudo)
                    humanizado = self._humanizar_dados_produtos(dados)
                    if humanizado:
                        return f" {humanizado} "
                except Exception:
                    pass
                return " " + self._limpar_caracteres_codigo(conteudo) + " "
            return conteudo
            
        texto = re.sub(padrao_json_solto, substituir_json_solto, texto, flags=re.DOTALL)
        
        # 3. Limpa markdown padrão (negrito, itálico, cabeçalhos, etc.)
        texto = self._limpar_markdown(texto)
        
        # 4. Limpa caracteres de código residuais
        texto = self._limpar_caracteres_codigo(texto)
        
        # 5. Remove espaços extras e pontuações repetidas
        texto = re.sub(r'\s+', ' ', texto)
        texto = re.sub(r'\.+', '.', texto)
        texto = re.sub(r'\s+\.', '.', texto)
        
        return texto.strip()

    def _gerar_edge_tts(self, texto, voz='pt-BR-AntonioNeural'):
        """Gera áudio via Microsoft Edge TTS (gratuito, sem API key, voz neural)."""
        import asyncio
        import base64
        import tempfile
        import os
        import edge_tts
        from concurrent.futures import ThreadPoolExecutor

        vozes_edge_ptbr = {
            'pt-BR-FranciscaNeural', 'pt-BR-AntonioNeural', 'pt-BR-BrendaNeural',
            'pt-BR-DonatoNeural', 'pt-BR-ElzaNeural', 'pt-BR-FabioNeural',
            'pt-BR-GiovannaNeural', 'pt-BR-HumbertoNeural', 'pt-BR-JulioNeural',
            'pt-BR-LeilaNeural', 'pt-BR-LeticiaNeural', 'pt-BR-ManuelaNeural',
            'pt-BR-NicolauNeural', 'pt-BR-ThalitaNeural', 'pt-BR-ValerioNeural',
            'pt-BR-YaraNeural',
        }
        if voz not in vozes_edge_ptbr:
            voz = 'pt-BR-AntonioNeural'

        async def _sintetizar():
            communicate = edge_tts.Communicate(texto, voz, rate='+5%', pitch='+0Hz')
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
                tmp_path = tmp.name
            await communicate.save(tmp_path)
            with open(tmp_path, 'rb') as f:
                audio_bytes = f.read()
            os.unlink(tmp_path)
            return audio_bytes

        def _rodar_em_thread():
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(_sintetizar())
            finally:
                loop.close()

        with ThreadPoolExecutor(max_workers=1) as executor:
            audio_bytes = executor.submit(_rodar_em_thread).result(timeout=30)

        return base64.b64encode(audio_bytes).decode('utf-8')

    def post(self, request):
        from decouple import config as decouple_config
        import base64
        import os
        from api.services_tts import TTSService

        texto_bruto = request.data.get('texto', '').strip()
        if not texto_bruto:
            return Response(
                {'sucesso': False, 'mensagem': 'Campo "texto" não informado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        texto = self._limpar_e_humanizar_texto(texto_bruto)[:4500]
        voz_solicitada = request.data.get('voz', '')
        
        # Lê configurações do arquivo .env
        env_provider = decouple_config('TTS_PROVIDER', default='').strip().lower()
        env_voice = decouple_config('TTS_VOICE', default='').strip()
        
        google_api_key = decouple_config('GOOGLE_CLOUD_TTS_API_KEY', default='').strip()
        elevenlabs_api_key = decouple_config('ELEVENLABS_API_KEY', default='').strip()

        voz = voz_solicitada or env_voice

        # 1) Determina o provider a ser utilizado
        if env_provider:
            provider = env_provider
        else:
            if google_api_key:
                provider = 'google'
            elif elevenlabs_api_key:
                provider = 'elevenlabs'
            else:
                provider = 'edge'

        # 2) Ajusta as vozes padrões
        if provider == 'google' and not voz:
            voz = 'pt-BR-Neural2-A'
        elif provider == 'edge' and not voz:
            voz = 'pt-BR-FranciscaNeural'
        elif provider == 'elevenlabs' and not voz:
            voz = 'Daniel'

        logger.info(f"[AITtsView] Processando TTS: provider={provider}, voz={voz}")

        try:
            # Instancia o TTSService
            tts_service = TTSService(provider=provider)
            resultado = tts_service.gerar_audio(
                texto=texto,
                voz=voz,
                salvar_arquivo=True
            )
            
            if resultado.get('sucesso'):
                return Response({
                    'sucesso': True,
                    'audio_base64': resultado['audio_base64'],
                    'formato': 'mp3',
                    'provider': resultado['provider'],
                    'audio_url': resultado.get('audio_url')
                })
            
            # Se falhou e o provider era premium (google ou elevenlabs), tenta o Edge de fallback
            if provider in ['google', 'elevenlabs']:
                logger.warning(f"[AITtsView] Falha no provedor {provider} ({resultado.get('erro') or resultado.get('mensagem')}). Iniciando fallback para Edge TTS.")
                tts_fallback = TTSService(provider='edge')
                voz_fallback = 'pt-BR-FranciscaNeural'
                
                resultado_fallback = tts_fallback.gerar_audio(
                    texto=texto,
                    voz=voz_fallback,
                    salvar_arquivo=True
                )
                
                if resultado_fallback.get('sucesso'):
                    return Response({
                        'sucesso': True,
                        'audio_base64': resultado_fallback['audio_base64'],
                        'formato': 'mp3',
                        'provider': 'edge',
                        'audio_url': resultado_fallback.get('audio_url')
                    })
                
            return Response({
                'sucesso': False,
                'mensagem': resultado.get('erro', 'Falha ao gerar áudio.')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            logger.error(f"[AITtsView] Erro ao processar requisição: {e}", exc_info=True)
            return Response({
                'sucesso': False,
                'mensagem': f"Erro interno: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

