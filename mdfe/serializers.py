from rest_framework import serializers
from .models import (
    ManifestoEletronico, MDFeDocumentoVinculado, MDFePercurso,
    MDFeCarregamento, MDFeDescarregamento, MDFeCondutor, MDFeReboque, MDFeLacre,
    MDFeValePedagio, MDFePagamento
)


class MDFeDocumentoVinculadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MDFeDocumentoVinculado
        exclude = ['mdfe']
        read_only_fields = ['id_doc']


class MDFePercursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MDFePercurso
        exclude = ['mdfe']
        read_only_fields = ['id_percurso']


class MDFeCarregamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MDFeCarregamento
        exclude = ['mdfe']
        read_only_fields = ['id_carregamento']


class MDFeDescarregamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MDFeDescarregamento
        exclude = ['mdfe']
        read_only_fields = ['id_descarregamento']


class MDFeCondutorSerializer(serializers.ModelSerializer):
    class Meta:
        model = MDFeCondutor
        fields = '__all__'
        read_only_fields = ['id_condutor']


class MDFeReboqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = MDFeReboque
        fields = '__all__'
        read_only_fields = ['id_reboque']


class MDFeLacreSerializer(serializers.ModelSerializer):
    class Meta:
        model = MDFeLacre
        fields = '__all__'
        read_only_fields = ['id_lacre']


class MDFeValePedagioSerializer(serializers.ModelSerializer):
    class Meta:
        model = MDFeValePedagio
        fields = '__all__'
        read_only_fields = ['id_vale_pedagio']


class MDFePagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MDFePagamento
        fields = '__all__'
        read_only_fields = ['id_pagamento']


class ManifestoEletronicoSerializer(serializers.ModelSerializer):
    # Compatibilidade: frontend espera 'id', mas modelo usa 'id_mdfe'
    id = serializers.IntegerField(source='id_mdfe', read_only=True)
    
    # Related fields
    documentos_vinculados = MDFeDocumentoVinculadoSerializer(many=True, required=False)
    percursos = MDFePercursoSerializer(many=True, required=False)
    carregamentos = MDFeCarregamentoSerializer(many=True, required=False)
    descarregamentos = MDFeDescarregamentoSerializer(many=True, required=False)
    condutores_adicionais = MDFeCondutorSerializer(many=True, required=False)
    reboques = MDFeReboqueSerializer(many=True, required=False)
    lacres = MDFeLacreSerializer(many=True, required=False)
    vales_pedagio = MDFeValePedagioSerializer(many=True, required=False)
    pagamentos = MDFePagamentoSerializer(many=True, required=False)
    
    # URLs auxiliares
    xml_url = serializers.SerializerMethodField()
    damdfe_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ManifestoEletronico
        fields = '__all__'
        read_only_fields = ['id_mdfe', 'criado_em', 'atualizado_em', 'criado_por']
    
    def get_xml_url(self, obj):
        if obj.xml_mdfe and obj.status_mdfe in ['EMITIDO', 'ENCERRADO']:
            return f"/api/mdfe/{obj.pk}/download_xml/"
        return None
    
    def get_damdfe_url(self, obj):
        if obj.chave_mdfe and obj.status_mdfe in ['EMITIDO', 'ENCERRADO']:
            return f"/api/mdfe/{obj.pk}/imprimir_damdfe/"
        return None
    
    def create(self, validated_data):
        print('CREATE PARAMS:', self.initial_data.get('carregamentos'), 'VALIDATED:', validated_data.get('carregamentos'))
        # Extrair dados relacionados
        documentos_data = validated_data.pop('documentos_vinculados', [])
        percursos_data = validated_data.pop('percursos', [])
        carregamentos_data = validated_data.pop('carregamentos', [])
        descarregamentos_data = validated_data.pop('descarregamentos', [])
        condutores_data = validated_data.pop('condutores_adicionais', [])
        reboques_data = validated_data.pop('reboques', [])
        lacres_data = validated_data.pop('lacres', [])
        vales_pedagio_data = validated_data.pop('vales_pedagio', [])
        pagamentos_data = validated_data.pop('pagamentos', [])
        
        # Criar MDF-e
        mdfe = ManifestoEletronico.objects.create(**validated_data)
        
        # Criar relacionados
        for doc_data in documentos_data:
            MDFeDocumentoVinculado.objects.create(mdfe=mdfe, **doc_data)
        
        for percurso_data in percursos_data:
            MDFePercurso.objects.create(mdfe=mdfe, **percurso_data)
        
        for carr_data in carregamentos_data:
            MDFeCarregamento.objects.create(mdfe=mdfe, **carr_data)
        
        for desc_data in descarregamentos_data:
            MDFeDescarregamento.objects.create(mdfe=mdfe, **desc_data)
        
        for cond_data in condutores_data:
            MDFeCondutor.objects.create(mdfe=mdfe, **cond_data)
        
        for reb_data in reboques_data:
            MDFeReboque.objects.create(mdfe=mdfe, **reb_data)
        
        for lacre_data in lacres_data:
            MDFeLacre.objects.create(mdfe=mdfe, **lacre_data)
        
        for vale_data in vales_pedagio_data:
            MDFeValePedagio.objects.create(mdfe=mdfe, **vale_data)
        
        for pag_data in pagamentos_data:
            MDFePagamento.objects.create(mdfe=mdfe, **pag_data)
        
        return mdfe
    
    def update(self, instance, validated_data):
        print('UPDATE PARAMS:', self.initial_data.get('carregamentos'), 'VALIDATED:', validated_data.get('carregamentos'))
        # Não permitir edição se já foi emitido
        if instance.status_mdfe in ['EMITIDO', 'ENCERRADO'] and 'status_mdfe' not in validated_data:
            raise serializers.ValidationError(
                "MDF-e já emitido não pode ser editado. Solicite cancelamento primeiro."
            )
        
        # Extrair dados relacionados
        documentos_data = validated_data.pop('documentos_vinculados', None)
        percursos_data = validated_data.pop('percursos', None)
        carregamentos_data = validated_data.pop('carregamentos', None)
        descarregamentos_data = validated_data.pop('descarregamentos', None)
        condutores_data = validated_data.pop('condutores_adicionais', None)
        reboques_data = validated_data.pop('reboques', None)
        lacres_data = validated_data.pop('lacres', None)
        vales_pedagio_data = validated_data.pop('vales_pedagio', None)
        pagamentos_data = validated_data.pop('pagamentos', None)
        
        # Atualizar campos principais
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Atualizar relacionados se fornecidos
        if documentos_data is not None:
            instance.documentos_vinculados.all().delete()
            for doc_data in documentos_data:
                MDFeDocumentoVinculado.objects.create(mdfe=instance, **doc_data)
        
        if percursos_data is not None:
            instance.percursos.all().delete()
            for percurso_data in percursos_data:
                MDFePercurso.objects.create(mdfe=instance, **percurso_data)
        
        if carregamentos_data is not None:
            instance.carregamentos.all().delete()
            for carr_data in carregamentos_data:
                MDFeCarregamento.objects.create(mdfe=instance, **carr_data)
        
        if descarregamentos_data is not None:
            instance.descarregamentos.all().delete()
            for desc_data in descarregamentos_data:
                MDFeDescarregamento.objects.create(mdfe=instance, **desc_data)
        
        if condutores_data is not None:
            instance.condutores_adicionais.all().delete()
            for cond_data in condutores_data:
                MDFeCondutor.objects.create(mdfe=instance, **cond_data)
        
        if reboques_data is not None:
            instance.reboques.all().delete()
            for reb_data in reboques_data:
                MDFeReboque.objects.create(mdfe=instance, **reb_data)
        
        if lacres_data is not None:
            instance.lacres.all().delete()
            for lacre_data in lacres_data:
                MDFeLacre.objects.create(mdfe=instance, **lacre_data)
        
        if vales_pedagio_data is not None:
            instance.vales_pedagio.all().delete()
            for vale_data in vales_pedagio_data:
                MDFeValePedagio.objects.create(mdfe=instance, **vale_data)
        
        if pagamentos_data is not None:
            instance.pagamentos.all().delete()
            for pag_data in pagamentos_data:
                MDFePagamento.objects.create(mdfe=instance, **pag_data)
        
        return instance
