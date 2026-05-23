"""
Serviço de Text-to-Speech (TTS) com Vozes Naturais
Suporta: Google Cloud TTS, ElevenLabs e Azure Cognitive Services

Autor: Sistema Gerencial
Data: 13/03/2026
"""

import os
import tempfile
import hashlib
import base64
from typing import Literal, Optional
from pathlib import Path
import logging
from django.conf import settings
from api.models import TTSAudioCache

logger = logging.getLogger(__name__)


class TTSService:
    """
    Serviço unificado de Text-to-Speech com múltiplos providers
    """
    
    def __init__(self, provider: Literal['google', 'elevenlabs', 'azure', 'edge'] = 'google'):
        """
        Inicializa o serviço de TTS
        
        Args:
            provider: Provider de TTS ('google', 'elevenlabs', 'azure', 'edge')
        """
        self.provider = provider
        self.temp_dir = Path(tempfile.gettempdir()) / 'sistema_gerencial_tts'
        self.temp_dir.mkdir(exist_ok=True)
        self.persistent_dir = Path(settings.BASE_DIR) / 'media' / 'tts_cache'
        self.persistent_dir.mkdir(parents=True, exist_ok=True)

        
    def gerar_audio(
        self, 
        texto: str, 
        voz: Optional[str] = None,
        velocidade: float = 1.0,
        salvar_arquivo: bool = False,
        nome_arquivo: Optional[str] = None
    ) -> dict:
        """
        Gera áudio a partir de texto usando o provider configurado com suporte a cache.
        """
        # Resolve voz default de cada provider para o hash ser consistente
        voz_usada = voz
        if not voz_usada:
            if self.provider == 'google':
                voz_usada = 'pt-BR-Neural2-B'
            elif self.provider == 'elevenlabs':
                voz_usada = 'Daniel'
            elif self.provider == 'azure':
                voz_usada = 'pt-BR-AntonioNeural'
            elif self.provider == 'edge':
                voz_usada = 'pt-BR-AntonioNeural'
            else:
                voz_usada = 'default'

        # Chave de cache baseada nos parâmetros de geração
        payload = f"{self.provider}:{voz_usada}:{velocidade:.2f}:{texto}"
        text_hash = hashlib.md5(payload.encode('utf-8')).hexdigest()
        nome_arquivo_cache = f"tts_{self.provider}_{text_hash}.mp3"

        # Tenta buscar no cache do banco de dados
        try:
            cache_entry = TTSAudioCache.objects.filter(text_hash=text_hash).first()
            if cache_entry:
                if os.path.exists(cache_entry.audio_file_path):
                    logger.info(f"[TTS Cache] Hit no cache DB/disco para {text_hash}")
                    with open(cache_entry.audio_file_path, 'rb') as f:
                        audio_content = f.read()
                    
                    return {
                        'sucesso': True,
                        'audio_path': cache_entry.audio_file_path,
                        'audio_base64': base64.b64encode(audio_content).decode('utf-8'),
                        'provider': cache_entry.provider,
                        'voz_usada': cache_entry.voice,
                        'tamanho_bytes': len(audio_content),
                        'formato': 'mp3',
                        'audio_url': cache_entry.audio_url
                    }
                else:
                    logger.warning(f"[TTS Cache] Entrada no DB existe para {text_hash}, mas o arquivo físico {cache_entry.audio_file_path} sumiu. Invalidando.")
                    cache_entry.delete()
        except Exception as e:
            logger.error(f"[TTS Cache] Erro ao buscar/atualizar cache no banco: {e}", exc_info=True)

        # Se não houver cache, gera o áudio (sempre salvando o arquivo e com o nome de cache)
        if self.provider == 'google':
            resultado = self._gerar_google(texto, voz, velocidade, salvar_arquivo=True, nome_arquivo=nome_arquivo_cache)
        elif self.provider == 'elevenlabs':
            resultado = self._gerar_elevenlabs(texto, voz, velocidade, salvar_arquivo=True, nome_arquivo=nome_arquivo_cache)
        elif self.provider == 'azure':
            resultado = self._gerar_azure(texto, voz, velocidade, salvar_arquivo=True, nome_arquivo=nome_arquivo_cache)
        elif self.provider == 'edge':
            resultado = self._gerar_edge(texto, voz, velocidade, salvar_arquivo=True, nome_arquivo=nome_arquivo_cache)
        else:
            raise ValueError(f"Provider '{self.provider}' não suportado")

        if resultado and resultado.get('sucesso'):
            # Cria a entrada no cache do banco de dados
            try:
                audio_url = f"/api/tts/audio/{nome_arquivo_cache}"
                TTSAudioCache.objects.create(
                    text_hash=text_hash,
                    text=texto,
                    audio_file_path=resultado['audio_path'],
                    audio_url=audio_url,
                    provider=self.provider,
                    voice=voz_usada,
                    velocidade=velocidade
                )
                resultado['audio_url'] = audio_url
                logger.info(f"[TTS Cache] Novo áudio gerado e salvo em cache para {text_hash}")
            except Exception as e:
                logger.error(f"[TTS Cache] Erro ao salvar novo áudio no DB cache: {e}", exc_info=True)
        
        return resultado

    
    def _gerar_google(
        self, 
        texto: str, 
        voz: Optional[str] = None, 
        velocidade: float = 1.0,
        salvar_arquivo: bool = False,
        nome_arquivo: Optional[str] = None
    ) -> dict:
        """
        Gera áudio usando Google Cloud Text-to-Speech
        
        Vozes recomendadas pt-BR:
        - pt-BR-Neural2-A (Feminina, natural)
        - pt-BR-Neural2-B (Masculina, natural)
        - pt-BR-Neural2-C (Feminina, jovem)
        - pt-BR-Wavenet-A (Feminina, WaveNet)
        - pt-BR-Wavenet-B (Masculina, WaveNet)
        """
        try:
            from google.cloud import texttospeech
            import base64
            
            # Inicializa cliente
            client = texttospeech.TextToSpeechClient()
            
            # Voz padrão: pt-BR-Neural2-B (Masculina, natural)
            voz_id = voz or 'pt-BR-Neural2-B'
            
            # Configura a síntese
            synthesis_input = texttospeech.SynthesisInput(text=texto)
            
            voice = texttospeech.VoiceSelectionParams(
                language_code='pt-BR',
                name=voz_id
            )
            
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=velocidade,
                pitch=0.0,
                volume_gain_db=0.0,
                effects_profile_id=['small-bluetooth-speaker-class-device']
            )
            
            # Gera o áudio
            logger.info(f"[Google TTS] Gerando áudio: '{texto[:50]}...' com voz {voz_id}")
            response = client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            # Salva em arquivo
            h = hashlib.md5(texto.encode('utf-8')).hexdigest()
            arquivo_nome = nome_arquivo or f"tts_google_{h}.mp3"
            audio_path = self.persistent_dir / arquivo_nome

            
            with open(audio_path, 'wb') as out:
                out.write(response.audio_content)
            
            logger.info(f"[Google TTS] Áudio gerado: {audio_path}")
            
            # Converte para base64 para envio via API
            audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
            
            resultado = {
                'sucesso': True,
                'audio_path': str(audio_path),
                'audio_base64': audio_base64,
                'provider': 'google',
                'voz_usada': voz_id,
                'tamanho_bytes': len(response.audio_content),
                'formato': 'mp3'
            }
            
            # Remove arquivo se não deve ser salvo
            if not salvar_arquivo:
                # Mantém temporariamente para reprodução, mas marca para exclusão
                resultado['auto_delete'] = True
                
            return resultado
            
        except Exception as e:
            logger.error(f"[Google TTS] Erro ao gerar áudio: {e}", exc_info=True)
            return {
                'sucesso': False,
                'erro': str(e),
                'provider': 'google'
            }
    
    def _gerar_elevenlabs(
        self, 
        texto: str, 
        voz: Optional[str] = None, 
        velocidade: float = 1.0,
        salvar_arquivo: bool = False,
        nome_arquivo: Optional[str] = None
    ) -> dict:
        """
        Gera áudio usando ElevenLabs (vozes ultra-realistas)
        
        Vozes recomendadas:
        - Daniel (Masculina, brasileira)
        - Giovanna (Feminina, brasileira)
        - Adam (Masculina, inglês com sotaque neutro)
        - Rachel (Feminina, inglês com sotaque americano)
        """
        try:
            from elevenlabs import generate, Voice
            import base64
            
            # Voz padrão: Daniel (brasileiro)
            voz_id = voz or 'Daniel'
            
            # API Key da ElevenLabs (pegar do .env)
            api_key = os.getenv('ELEVENLABS_API_KEY')
            if not api_key:
                raise ValueError("ELEVENLABS_API_KEY não configurada no .env")
            
            logger.info(f"[ElevenLabs] Gerando áudio: '{texto[:50]}...' com voz {voz_id}")
            
            # Gera o áudio
            audio_bytes = generate(
                text=texto,
                voice=Voice(
                    voice_id=voz_id,
                    settings={
                        'stability': 0.5,  # Estabilidade (0.0 a 1.0)
                        'similarity_boost': 0.75,  # Similaridade com voz original
                        'style': 0.0,  # Estilo/exageração (0.0 = neutro)
                        'use_speaker_boost': True
                    }
                ),
                model='eleven_multilingual_v2',  # Suporta pt-BR
                api_key=api_key
            )
            
            # Salva em arquivo
            h = hashlib.md5(texto.encode('utf-8')).hexdigest()
            arquivo_nome = nome_arquivo or f"tts_elevenlabs_{h}.mp3"
            audio_path = self.persistent_dir / arquivo_nome

            
            with open(audio_path, 'wb') as out:
                out.write(audio_bytes)
            
            logger.info(f"[ElevenLabs] Áudio gerado: {audio_path}")
            
            # Converte para base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            resultado = {
                'sucesso': True,
                'audio_path': str(audio_path),
                'audio_base64': audio_base64,
                'provider': 'elevenlabs',
                'voz_usada': voz_id,
                'tamanho_bytes': len(audio_bytes),
                'formato': 'mp3'
            }
            
            if not salvar_arquivo:
                resultado['auto_delete'] = True
                
            return resultado
            
        except Exception as e:
            logger.error(f"[ElevenLabs] Erro ao gerar áudio: {e}", exc_info=True)
            return {
                'sucesso': False,
                'erro': str(e),
                'provider': 'elevenlabs'
            }
    
    def _gerar_azure(
        self, 
        texto: str, 
        voz: Optional[str] = None, 
        velocidade: float = 1.0,
        salvar_arquivo: bool = False,
        nome_arquivo: Optional[str] = None
    ) -> dict:
        """
        Gera áudio usando Azure Cognitive Services
        
        Vozes recomendadas pt-BR:
        - pt-BR-FranciscaNeural (Feminina, Neural)
        - pt-BR-AntonioNeural (Masculina, Neural)
        - pt-BR-BrendaNeural (Feminina, jovem)
        - pt-BR-DonatoNeural (Masculino, maduro)
        """
        try:
            import azure.cognitiveservices.speech as speechsdk
            import base64
            
            # Credenciais Azure (pegar do .env)
            subscription_key = os.getenv('AZURE_SPEECH_KEY')
            region = os.getenv('AZURE_SPEECH_REGION', 'brazilsouth')
            
            if not subscription_key:
                raise ValueError("AZURE_SPEECH_KEY não configurada no .env")
            
            # Voz padrão: pt-BR-AntonioNeural (Masculina)
            voz_id = voz or 'pt-BR-AntonioNeural'
            
            logger.info(f"[Azure TTS] Gerando áudio: '{texto[:50]}...' com voz {voz_id}")
            
            # Configura o sintetizador
            speech_config = speechsdk.SpeechConfig(
                subscription=subscription_key, 
                region=region
            )
            speech_config.speech_synthesis_voice_name = voz_id
            speech_config.set_speech_synthesis_output_format(
                speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
            )
            
            # Arquivo de saída
            h = hashlib.md5(texto.encode('utf-8')).hexdigest()
            arquivo_nome = nome_arquivo or f"tts_azure_{h}.mp3"
            audio_path = self.persistent_dir / arquivo_nome

            
            audio_config = speechsdk.audio.AudioOutputConfig(filename=str(audio_path))
            
            # Gera o áudio
            synthesizer = speechsdk.SpeechSynthesizer(
                speech_config=speech_config,
                audio_config=audio_config
            )
            
            # SSML para controle de velocidade e pitch
            ssml = f"""
            <speak version='1.0' xml:lang='pt-BR'>
                <voice name='{voz_id}'>
                    <prosody rate='{velocidade}' pitch='0%'>
                        {texto}
                    </prosody>
                </voice>
            </speak>
            """
            
            result = synthesizer.speak_ssml_async(ssml).get()
            
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                logger.info(f"[Azure TTS] Áudio gerado: {audio_path}")
                
                # Lê o arquivo para base64
                with open(audio_path, 'rb') as f:
                    audio_bytes = f.read()
                    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                
                resultado = {
                    'sucesso': True,
                    'audio_path': str(audio_path),
                    'audio_base64': audio_base64,
                    'provider': 'azure',
                    'voz_usada': voz_id,
                    'tamanho_bytes': len(audio_bytes),
                    'formato': 'mp3'
                }
                
                if not salvar_arquivo:
                    resultado['auto_delete'] = True
                    
                return resultado
            else:
                raise Exception(f"Falha na síntese: {result.reason}")
            
        except Exception as e:
            logger.error(f"[Azure TTS] Erro ao gerar áudio: {e}", exc_info=True)
            return {
                'sucesso': False,
                'erro': str(e),
                'provider': 'azure'
            }
    
    def listar_vozes(self) -> dict:
        """
        Lista todas as vozes disponíveis do provider configurado
        
        Returns:
            dict com lista de vozes e suas características
        """
        if self.provider == 'google':
            return self._listar_vozes_google()
        elif self.provider == 'elevenlabs':
            return self._listar_vozes_elevenlabs()
        elif self.provider == 'azure':
            return self._listar_vozes_azure()
        else:
            return {'erro': f"Provider '{self.provider}' não suportado"}
    
    def _listar_vozes_google(self) -> dict:
        """Lista vozes disponíveis no Google Cloud TTS"""
        try:
            from google.cloud import texttospeech
            
            client = texttospeech.TextToSpeechClient()
            voices = client.list_voices(language_code='pt-BR')
            
            vozes_pt = []
            for voice in voices.voices:
                if 'pt-BR' in voice.language_codes:
                    vozes_pt.append({
                        'nome': voice.name,
                        'genero': voice.ssml_gender.name,
                        'tipo': 'Neural' if 'Neural' in voice.name else 'WaveNet' if 'Wavenet' in voice.name else 'Standard'
                    })
            
            return {
                'sucesso': True,
                'provider': 'google',
                'vozes': vozes_pt,
                'total': len(vozes_pt)
            }
            
        except Exception as e:
            logger.error(f"Erro ao listar vozes Google: {e}")
            return {'sucesso': False, 'erro': str(e)}
    
    def _listar_vozes_elevenlabs(self) -> dict:
        """Lista vozes disponíveis no ElevenLabs"""
        try:
            from elevenlabs import voices as elevenlabs_voices
            
            api_key = os.getenv('ELEVENLABS_API_KEY')
            all_voices = elevenlabs_voices(api_key=api_key)
            
            vozes_lista = []
            for voice in all_voices:
                vozes_lista.append({
                    'nome': voice.name,
                    'voice_id': voice.voice_id,
                    'categoria': voice.category if hasattr(voice, 'category') else 'custom'
                })
            
            return {
                'sucesso': True,
                'provider': 'elevenlabs',
                'vozes': vozes_lista,
                'total': len(vozes_lista)
            }
            
        except Exception as e:
            logger.error(f"Erro ao listar vozes ElevenLabs: {e}")
            return {'sucesso': False, 'erro': str(e)}
    
    def _listar_vozes_azure(self) -> dict:
        """Lista vozes disponíveis no Azure"""
        try:
            import azure.cognitiveservices.speech as speechsdk
            
            subscription_key = os.getenv('AZURE_SPEECH_KEY')
            region = os.getenv('AZURE_SPEECH_REGION', 'brazilsouth')
            
            speech_config = speechsdk.SpeechConfig(
                subscription=subscription_key,
                region=region
            )
            
            synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config)
            result = synthesizer.get_voices_async().get()
            
            vozes_pt = []
            for voice in result.voices:
                if voice.locale.startswith('pt-BR'):
                    vozes_pt.append({
                        'nome': voice.short_name,
                        'nome_completo': voice.local_name,
                        'genero': voice.gender.name,
                        'tipo': 'Neural' if 'Neural' in voice.short_name else 'Standard'
                    })
            
            return {
                'sucesso': True,
                'provider': 'azure',
                'vozes': vozes_pt,
                'total': len(vozes_pt)
            }
            
        except Exception as e:
            logger.error(f"Erro ao listar vozes Azure: {e}")
            return {'sucesso': False, 'erro': str(e)}

    def _gerar_edge(
        self, 
        texto: str, 
        voz: Optional[str] = None, 
        velocidade: float = 1.0,
        salvar_arquivo: bool = False,
        nome_arquivo: Optional[str] = None
    ) -> dict:
        """Gera áudio via Microsoft Edge TTS (gratuito, sem API key, voz neural)."""
        import asyncio
        import base64
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
        voz_id = voz if voz in vozes_edge_ptbr else 'pt-BR-AntonioNeural'
        
        # Converte velocidade (ex: 1.0 -> '+0%', 1.1 -> '+10%', 0.9 -> '-10%')
        rate_percent = int((velocidade - 1.0) * 100)
        rate_str = f"{rate_percent:+}%" if rate_percent != 0 else "+0%"

        # Arquivo de saída
        h = hashlib.md5(texto.encode('utf-8')).hexdigest()
        arquivo_nome = nome_arquivo or f"tts_edge_{h}.mp3"
        audio_path = self.persistent_dir / arquivo_nome

        async def _sintetizar():
            communicate = edge_tts.Communicate(texto, voz_id, rate=rate_str, pitch='+0Hz')
            await communicate.save(str(audio_path))
            with open(audio_path, 'rb') as f:
                return f.read()

        def _rodar_em_thread():
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(_sintetizar())
            finally:
                loop.close()

        try:
            logger.info(f"[Edge TTS] Gerando áudio: '{texto[:50]}...' com voz {voz_id}")
            with ThreadPoolExecutor(max_workers=1) as executor:
                audio_bytes = executor.submit(_rodar_em_thread).result(timeout=30)

            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            resultado = {
                'sucesso': True,
                'audio_path': str(audio_path),
                'audio_base64': audio_base64,
                'provider': 'edge',
                'voz_usada': voz_id,
                'tamanho_bytes': len(audio_bytes),
                'formato': 'mp3'
            }
            return resultado
        except Exception as e:
            logger.error(f"[Edge TTS] Erro ao gerar áudio: {e}", exc_info=True)
            return {
                'sucesso': False,
                'erro': str(e),
                'provider': 'edge'
            }


# Atalhos para uso rápido
def falar_aprovacao_desconto(nome_supervisor: str, valor_desconto: float, cliente: str) -> dict:
    """
    Gera áudio de aprovação de desconto
    
    Exemplo de uso:
        resultado = falar_aprovacao_desconto("João", 150.00, "Maria Silva")
        # Reproduzir: audio_path = resultado['audio_path']
    """
    texto = f"Olá! O supervisor {nome_supervisor} aprovou o desconto de {valor_desconto:.2f} reais para o cliente {cliente}. A venda pode prosseguir."
    
    provider = os.getenv('TTS_PROVIDER', 'google')  # google, elevenlabs ou azure
    tts = TTSService(provider=provider)
    
    return tts.gerar_audio(texto, salvar_arquivo=False)


def falar_rejeicao_desconto(nome_supervisor: str, motivo: str = 'não especificado') -> dict:
    """
    Gera áudio de rejeição de desconto
    """
    texto = f"Atenção! O supervisor {nome_supervisor} rejeitou o desconto. Motivo: {motivo}. Por favor, revise a venda."
    
    provider = os.getenv('TTS_PROVIDER', 'google')
    tts = TTSService(provider=provider)
    
    return tts.gerar_audio(texto, salvar_arquivo=False)


def falar_alerta_estoque(produto: str, quantidade: int) -> dict:
    """
    Gera áudio de alerta de estoque baixo
    """
    texto = f"Alerta! O produto {produto} está com estoque baixo. Restam apenas {quantidade} unidades."
    
    provider = os.getenv('TTS_PROVIDER', 'google')
    tts = TTSService(provider=provider)
    
    return tts.gerar_audio(texto, salvar_arquivo=False)
