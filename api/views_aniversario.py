# -*- coding: utf-8 -*-
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection
from datetime import datetime
import requests
import json


class AniversariantesView(APIView):
    """
    View para buscar clientes aniversariantes do dia
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            hoje = datetime.now()
            dia = hoje.day
            mes = hoje.month

            with connection.cursor() as cursor:
                # Busca clientes que fazem aniversário hoje
                # Verifica se existe coluna data_nascimento, se não, retorna lista vazia
                cursor.execute("""
                    SELECT 
                        id_cliente,
                        nome_razao_social,
                        COALESCE(whatsapp, telefone) as telefone,
                        data_nascimento
                    FROM clientes
                    WHERE DAY(data_nascimento) = %s 
                    AND MONTH(data_nascimento) = %s
                    AND data_nascimento IS NOT NULL
                    ORDER BY nome_razao_social
                """, [dia, mes])
                
                aniversariantes = []
                for row in cursor.fetchall():
                    id_cliente, nome, telefone, data_nascimento = row
                    
                    # Calcular idade
                    if data_nascimento:
                        idade = hoje.year - data_nascimento.year
                        if (hoje.month, hoje.day) < (data_nascimento.month, data_nascimento.day):
                            idade -= 1
                    else:
                        idade = None
                    
                    aniversariantes.append({
                        'id_cliente': id_cliente,
                        'nome': nome,
                        'telefone': telefone,
                        'data_nascimento': data_nascimento.strftime('%d/%m/%Y') if data_nascimento else None,
                        'idade': idade
                    })

            return Response({
                'total': len(aniversariantes),
                'aniversariantes': aniversariantes,
                'data': hoje.strftime('%d/%m/%Y')
            })

        except Exception as e:
            # Se der erro (ex: coluna não existe), retorna lista vazia
            print(f"❌ Erro ao buscar aniversariantes: {str(e)}")
            return Response({
                'total': 0,
                'aniversariantes': [],
                'data': datetime.now().strftime('%d/%m/%Y'),
                'erro': str(e)
            })


class EnviarMensagemAniversarioView(APIView):
    """
    View para enviar mensagem de aniversário via WhatsApp
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            id_cliente = request.data.get('id_cliente')
            telefone = request.data.get('telefone')
            nome = request.data.get('nome')
            mensagem_personalizada = request.data.get('mensagem')

            if not telefone:
                return Response({
                    'sucesso': False,
                    'mensagem': 'Cliente não possui número de telefone cadastrado'
                }, status=400)

            # Limpar telefone (remover caracteres especiais)
            telefone_limpo = ''.join(filter(str.isdigit, telefone))
            
            # Adicionar código do país se necessário (Brasil = 55)
            if not telefone_limpo.startswith('55'):
                telefone_limpo = '55' + telefone_limpo

            # Mensagem padrão se não for fornecida
            if not mensagem_personalizada:
                mensagem_personalizada = f"""🎉 *Feliz Aniversário, {nome}!* 🎂

Desejamos um dia repleto de alegria, saúde e realizações!

Que este novo ano de vida seja cheio de momentos especiais! 🎈

Atenciosamente,
Sua equipe"""

            # Aqui você pode integrar com API do WhatsApp
            # Por enquanto, vou retornar sucesso e a URL para abrir o WhatsApp
            
            # URL para abrir WhatsApp Web/App com mensagem pré-preenchida
            mensagem_encoded = requests.utils.quote(mensagem_personalizada)
            whatsapp_url = f"https://wa.me/{telefone_limpo}?text={mensagem_encoded}"

            print(f"📱 Mensagem de aniversário para {nome} ({telefone_limpo})")
            print(f"   URL: {whatsapp_url}")

            return Response({
                'sucesso': True,
                'mensagem': 'Link do WhatsApp gerado com sucesso',
                'whatsapp_url': whatsapp_url,
                'telefone': telefone_limpo
            })

        except Exception as e:
            print(f"❌ Erro ao enviar mensagem: {str(e)}")
            return Response({
                'sucesso': False,
                'mensagem': f'Erro ao enviar mensagem: {str(e)}'
            }, status=500)
