from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timezone as datetime_timezone
from api.models import EmpresaConfig
from api.services.signer_service import SignerService
import logging

logger = logging.getLogger(__name__)

class VerificarCertificadoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        config = EmpresaConfig.get_ativa()
        if not config or not config.certificado_digital or not config.certificado_digital.strip():
            return Response({
                "configurado": False, 
                "mensagem": "Certificado digital não cadastrado nas configurações da empresa."
            })

        try:
            # Usa o SignerService que já resolve decodificação de base64 e senha
            signer = SignerService(config.certificado_digital, config.senha_certificado)
            if not signer.certificate:
                return Response({
                    "configurado": False, 
                    "mensagem": "Certificado digital não pôde ser carregado pelo assinador."
                })
            
            valido_ate = signer.certificate.not_valid_after
            
            # Garante que a data seja aware para comparação segura de timezone
            if timezone.is_naive(valido_ate):
                valido_ate = timezone.make_aware(valido_ate, datetime_timezone.utc)
            
            agora = timezone.now()
            dias_restantes = (valido_ate - agora).days
            
            # Alerta com 6 dias ou menos de antecedência (dias_restantes <= 6)
            alerta = dias_restantes <= 6
            
            return Response({
                "configurado": True,
                "data_vencimento": valido_ate.isoformat(),
                "dias_restantes": dias_restantes,
                "vencido": dias_restantes < 0,
                "alerta": alerta
            })
        except Exception as e:
            logger.error(f"Erro ao ler data de validade do certificado: {e}", exc_info=True)
            return Response({
                "configurado": False, 
                "mensagem": f"Falha na leitura do certificado digital: {str(e)}"
            }, status=200) # Retorna 200 para evitar quebrar o layout se o certificado estiver corrompido
