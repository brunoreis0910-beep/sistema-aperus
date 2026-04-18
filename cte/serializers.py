from rest_framework import serializers
from .models import ConhecimentoTransporte, CTeComponenteValor, CTeDocumento
from api.serializers import ClienteSerializer

class CTeComponenteValorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CTeComponenteValor
        fields = '__all__'
        extra_kwargs = {
            'cte': {'read_only': True}
        }

class CTeDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CTeDocumento
        fields = ['id', 'tipo_documento', 'chave_nfe']

class ConhecimentoTransporteSerializer(serializers.ModelSerializer):
    # Campos detalhados para leitura
    remetente_detail = ClienteSerializer(source='remetente', read_only=True)
    destinatario_detail = ClienteSerializer(source='destinatario', read_only=True)
    expedidor_detail = ClienteSerializer(source='expedidor', read_only=True)
    recebedor_detail = ClienteSerializer(source='recebedor', read_only=True)
    tomador_outros_detail = ClienteSerializer(source='tomador_outros', read_only=True)
    
    componentes_valor = CTeComponenteValorSerializer(many=True, required=False)
    documentos = CTeDocumentoSerializer(many=True, required=False)
    
    # URLs auxiliares para frontend
    xml_url = serializers.SerializerMethodField()
    dacte_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ConhecimentoTransporte
        fields = '__all__'
        extra_kwargs = {
            'remetente': {'required': False, 'allow_null': True},
            'destinatario': {'required': False, 'allow_null': True},
            'expedidor': {'required': False, 'allow_null': True},
            'recebedor': {'required': False, 'allow_null': True},
            'tomador_outros': {'required': False, 'allow_null': True},
        }

    def get_xml_url(self, obj):
        if obj.xml_cte:
            return f"/api/ctes/{obj.pk}/baixar_xml/"
        return None

    def get_dacte_url(self, obj):
        # DACTE disponível se tiver chave gerada (mesmo sem autorização pode visualizar preview em alguns casos, mas ideal é após envio)
        if obj.chave_cte: 
            return f"/api/ctes/{obj.pk}/imprimir_dacte/"
        return None

    def create(self, validated_data):
        import logging
        logger = logging.getLogger('django')
        
        logger.info(f"[CTE_SERIALIZER] create chamado com validated_data keys: {list(validated_data.keys())}")
        
        componentes_data = validated_data.pop('componentes_valor', [])
        documentos_data = validated_data.pop('documentos', [])
        
        try:
            cte = ConhecimentoTransporte.objects.create(**validated_data)
            logger.info(f"[CTE_SERIALIZER] Objeto ConhecimentoTransporte criado: {cte.id_cte} - {cte}")
            
            for comp in componentes_data:
                CTeComponenteValor.objects.create(cte=cte, **comp)
            
            for doc in documentos_data:
                CTeDocumento.objects.create(cte=cte, **doc)
                
            return cte
        except Exception as e:
            logger.exception(f"[CTE_SERIALIZER] Erro ao criar dados no Serializer: {e}")
            raise e
