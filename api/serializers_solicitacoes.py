# -*- coding: utf-8 -*-
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import SolicitacaoAprovacao
import json


class UserSimpleSerializer(serializers.ModelSerializer):
    """Serializer simples para exibir informações do usuário"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class SolicitacaoAprovacaoSerializer(serializers.ModelSerializer):
    solicitante = UserSimpleSerializer(source='id_usuario_solicitante', read_only=True)
    supervisor = UserSimpleSerializer(source='id_usuario_supervisor', read_only=True)
    dados_solicitacao_json = serializers.SerializerMethodField()
    
    class Meta:
        model = SolicitacaoAprovacao
        fields = [
            'id_solicitacao',
            'id_usuario_solicitante',
            'id_usuario_supervisor',
            'solicitante',
            'supervisor',
            'tipo_solicitacao',
            'id_registro',
            'dados_solicitacao',
            'dados_solicitacao_json',
            'observacao_solicitante',
            'observacao_supervisor',
            'status',
            'data_solicitacao',
            'data_aprovacao'
        ]
        read_only_fields = ['id_solicitacao', 'data_solicitacao', 'data_aprovacao']
    
    def get_dados_solicitacao_json(self, obj):
        """Converte dados_solicitacao de string JSON para dict"""
        if obj.dados_solicitacao:
            try:
                return json.loads(obj.dados_solicitacao)
            except:
                return obj.dados_solicitacao
        return {}
