# -*- coding: utf-8 -*-
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection
from datetime import datetime, timedelta
from decimal import Decimal
import traceback


class GraficosComparativosView(APIView):
    """
    View que retorna dados comparativos de vendas e compras:
    - Mês atual vs mês anterior
    - Mês atual vs mesmo mês do ano passado
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Verificar permissão específica de gráficos
            if not request.user.is_staff:
                try:
                    from .models import UserPermissions
                    permissions = UserPermissions.objects.filter(user=request.user).first()
                    if not permissions or not permissions.graficos_acessar:
                        return Response(
                            {'error': 'Você não tem permissão para acessar gráficos.'}, 
                            status=403
                        )
                except Exception as e:
                    print(f"❌ Erro ao verificar permissões: {e}")
                    return Response({'error': 'Erro ao verificar permissões.'}, status=500)
            
            # Data atual
            hoje = datetime.now()
            print(f"📊 Iniciando busca de dados comparativos para {hoje}")

            # Permitir filtro por período via query params: ?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
            inicio_param = request.query_params.get('inicio') or request.query_params.get('start')
            fim_param = request.query_params.get('fim') or request.query_params.get('end')

            if inicio_param and fim_param:
                # Esperamos formato YYYY-MM-DD
                try:
                    inicio_dt = datetime.strptime(inicio_param, '%Y-%m-%d')
                    fim_dt = datetime.strptime(fim_param, '%Y-%m-%d')
                except Exception:
                    return Response({'error': 'Parâmetros "inicio" e "fim" devem estar no formato YYYY-MM-DD'}, status=400)

                # Normalizar início ao começo do dia e fim ao final do dia
                mes_atual_inicio = inicio_dt.replace(hour=0, minute=0, second=0, microsecond=0)
                mes_atual_fim = fim_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
                print(f"🔎 Usando período filtrado: {mes_atual_inicio} até {mes_atual_fim}")
            else:
                # Períodos para comparação por padrão: mês atual
                mes_atual_inicio = hoje.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                # Pegar até o final do dia atual para incluir todas as vendas de hoje
                mes_atual_fim = hoje.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            # Calcular período anterior com mesma duração e mesmo período no ano passado
            from calendar import monthrange

            # Se foi passado período customizado, calcular período anterior com mesma duração
            if inicio_param and fim_param:
                duracao_days = (mes_atual_fim.date() - mes_atual_inicio.date()).days + 1

                mes_anterior_fim = (mes_atual_inicio - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
                mes_anterior_inicio = (mes_anterior_fim - timedelta(days=duracao_days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)

                # Mesmo período ano passado: tentar manter dia/mês, ajustando quando necessário
                try:
                    ano_passado_inicio = mes_atual_inicio.replace(year=mes_atual_inicio.year - 1)
                except Exception:
                    # Ajuste para 28/02 em anos não bissextos, etc.
                    ano_passado_month = mes_atual_inicio.month
                    ano_passado_year = mes_atual_inicio.year - 1
                    last_day = monthrange(ano_passado_year, ano_passado_month)[1]
                    day = min(mes_atual_inicio.day, last_day)
                    ano_passado_inicio = mes_atual_inicio.replace(year=ano_passado_year, day=day)

                try:
                    ano_passado_fim = mes_atual_fim.replace(year=mes_atual_fim.year - 1)
                except Exception:
                    ano_passado_month = mes_atual_fim.month
                    ano_passado_year = mes_atual_fim.year - 1
                    last_day = monthrange(ano_passado_year, ano_passado_month)[1]
                    day = min(mes_atual_fim.day, last_day)
                    ano_passado_fim = mes_atual_fim.replace(year=ano_passado_year, day=day)

                ano_passado_inicio = ano_passado_inicio.replace(hour=0, minute=0, second=0, microsecond=0)
                ano_passado_fim = ano_passado_fim.replace(hour=23, minute=59, second=59, microsecond=999999)
            else:
                # Comportamento padrão: mês anterior e mesmo mês do ano passado
                # Mês anterior
                if mes_atual_inicio.month == 1:
                    mes_anterior_inicio = mes_atual_inicio.replace(year=mes_atual_inicio.year - 1, month=12)
                else:
                    mes_anterior_inicio = mes_atual_inicio.replace(month=mes_atual_inicio.month - 1)

                # Calcular último dia do mês anterior
                if mes_atual_inicio.month == 1:
                    ultimo_dia_mes_anterior = 31
                else:
                    # Dia 0 do mês atual = último dia do mês anterior
                    ultimo_dia_mes_anterior = monthrange(mes_anterior_inicio.year, mes_anterior_inicio.month)[1]

                mes_anterior_fim = mes_anterior_inicio.replace(day=ultimo_dia_mes_anterior, hour=23, minute=59, second=59)

                # Mesmo mês do ano passado
                ano_passado_inicio = mes_atual_inicio.replace(year=mes_atual_inicio.year - 1)
                # Calcular último dia do mesmo mês do ano passado
                ultimo_dia_ano_passado = monthrange(ano_passado_inicio.year, ano_passado_inicio.month)[1]
                ano_passado_fim = ano_passado_inicio.replace(day=ultimo_dia_ano_passado, hour=23, minute=59, second=59)
            
            # Query para vendas
            print(f"📅 Períodos: {mes_atual_inicio} a {mes_atual_fim}")
            with connection.cursor() as cursor:
                # Vendas mês atual - usando DATE() para ignorar hora
                print("🔍 Buscando vendas do mês atual...")
                cursor.execute("""
                    SELECT COALESCE(SUM(valor_total), 0) as total, COUNT(*) as quantidade
                    FROM vendas
                    WHERE DATE(data_documento) >= DATE(%s) AND DATE(data_documento) <= DATE(%s)
                """, [mes_atual_inicio, mes_atual_fim])
                vendas_mes_atual = cursor.fetchone()
                print(f"✅ Vendas mês atual: {vendas_mes_atual}")
                
                # Vendas mês anterior
                cursor.execute("""
                    SELECT COALESCE(SUM(valor_total), 0) as total, COUNT(*) as quantidade
                    FROM vendas
                    WHERE DATE(data_documento) >= DATE(%s) AND DATE(data_documento) <= DATE(%s)
                """, [mes_anterior_inicio, mes_anterior_fim])
                vendas_mes_anterior = cursor.fetchone()
                
                # Vendas ano passado (mesmo período)
                cursor.execute("""
                    SELECT COALESCE(SUM(valor_total), 0) as total, COUNT(*) as quantidade
                    FROM vendas
                    WHERE DATE(data_documento) >= DATE(%s) AND DATE(data_documento) <= DATE(%s)
                """, [ano_passado_inicio, ano_passado_fim])
                vendas_ano_passado = cursor.fetchone()
                
                # Compras mês atual (usando valor_total_nota como nome real da coluna)
                cursor.execute("""
                    SELECT COALESCE(SUM(valor_total_nota), 0) as total, COUNT(*) as quantidade
                    FROM compras
                    WHERE DATE(data_movimento_entrada) >= DATE(%s) AND DATE(data_movimento_entrada) <= DATE(%s)
                """, [mes_atual_inicio, mes_atual_fim])
                compras_mes_atual = cursor.fetchone()
                
                # Compras mês anterior
                cursor.execute("""
                    SELECT COALESCE(SUM(valor_total_nota), 0) as total, COUNT(*) as quantidade
                    FROM compras
                    WHERE DATE(data_movimento_entrada) >= DATE(%s) AND DATE(data_movimento_entrada) <= DATE(%s)
                """, [mes_anterior_inicio, mes_anterior_fim])
                compras_mes_anterior = cursor.fetchone()
                
                # Compras ano passado (mesmo período)
                cursor.execute("""
                    SELECT COALESCE(SUM(valor_total_nota), 0) as total, COUNT(*) as quantidade
                    FROM compras
                    WHERE DATE(data_movimento_entrada) >= DATE(%s) AND DATE(data_movimento_entrada) <= DATE(%s)
                """, [ano_passado_inicio, ano_passado_fim])
                compras_ano_passado = cursor.fetchone()
                
                # Devoluções mês atual
                cursor.execute("""
                    SELECT COALESCE(SUM(valor_total_devolucao), 0) as total, COUNT(*) as quantidade
                    FROM devolucoes
                    WHERE DATE(data_devolucao) >= DATE(%s) AND DATE(data_devolucao) <= DATE(%s)
                """, [mes_atual_inicio, mes_atual_fim])
                devolucoes_mes_atual = cursor.fetchone()
                
                # Devoluções mês anterior
                cursor.execute("""
                    SELECT COALESCE(SUM(valor_total_devolucao), 0) as total, COUNT(*) as quantidade
                    FROM devolucoes
                    WHERE DATE(data_devolucao) >= DATE(%s) AND DATE(data_devolucao) <= DATE(%s)
                """, [mes_anterior_inicio, mes_anterior_fim])
                devolucoes_mes_anterior = cursor.fetchone()
                
                # Devoluções ano passado
                cursor.execute("""
                    SELECT COALESCE(SUM(valor_total_devolucao), 0) as total, COUNT(*) as quantidade
                    FROM devolucoes
                    WHERE DATE(data_devolucao) >= DATE(%s) AND DATE(data_devolucao) <= DATE(%s)
                """, [ano_passado_inicio, ano_passado_fim])
                devolucoes_ano_passado = cursor.fetchone()
                
                # Contas a receber - com ou sem filtro de período
                if inicio_param and fim_param:
                    # Com filtro: buscar apenas do período selecionado
                    print(f"🔍 Buscando contas a receber do período {mes_atual_inicio} até {mes_atual_fim}")
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total_contas,
                            COALESCE(SUM(valor_parcela), 0) as valor_total,
                            COALESCE(SUM(CASE WHEN data_pagamento IS NOT NULL THEN valor_parcela ELSE 0 END), 0) as valor_pago,
                            COALESCE(SUM(CASE WHEN data_pagamento IS NULL THEN valor_parcela ELSE 0 END), 0) as valor_pendente,
                            COUNT(CASE WHEN data_pagamento IS NOT NULL THEN 1 END) as qtd_pago,
                            COUNT(CASE WHEN data_pagamento IS NULL THEN 1 END) as qtd_pendente
                        FROM financeiro_contas
                        WHERE tipo_conta = 'Receber'
                        AND (
                            (DATE(data_emissao) >= DATE(%s) AND DATE(data_emissao) <= DATE(%s))
                            OR (DATE(data_vencimento) >= DATE(%s) AND DATE(data_vencimento) <= DATE(%s))
                            OR (DATE(data_pagamento) >= DATE(%s) AND DATE(data_pagamento) <= DATE(%s))
                        )
                    """, [mes_atual_inicio, mes_atual_fim, mes_atual_inicio, mes_atual_fim, mes_atual_inicio, mes_atual_fim])
                else:
                    # Sem filtro: buscar TODAS as contas ativas
                    print(f"🔍 Buscando TODAS as contas a receber (sem filtro de período)")
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total_contas,
                            COALESCE(SUM(valor_parcela), 0) as valor_total,
                            COALESCE(SUM(CASE WHEN data_pagamento IS NOT NULL THEN valor_parcela ELSE 0 END), 0) as valor_pago,
                            COALESCE(SUM(CASE WHEN data_pagamento IS NULL THEN valor_parcela ELSE 0 END), 0) as valor_pendente,
                            COUNT(CASE WHEN data_pagamento IS NOT NULL THEN 1 END) as qtd_pago,
                            COUNT(CASE WHEN data_pagamento IS NULL THEN 1 END) as qtd_pendente
                        FROM financeiro_contas
                        WHERE tipo_conta = 'Receber'
                    """)
                
                contas_receber_atual = cursor.fetchone()
                print(f"✅ Resumo contas a receber: Total={contas_receber_atual[0]}, Valor Total={contas_receber_atual[1]}, Pago={contas_receber_atual[4]}/{contas_receber_atual[2]}, Pendente={contas_receber_atual[5]}/{contas_receber_atual[3]}")
                
                # Contas a pagar - com ou sem filtro de período
                if inicio_param and fim_param:
                    # Com filtro: buscar apenas do período selecionado
                    print(f"🔍 Buscando contas a pagar do período {mes_atual_inicio} até {mes_atual_fim}")
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total_contas,
                            COALESCE(SUM(valor_parcela), 0) as valor_total,
                            COALESCE(SUM(CASE WHEN data_pagamento IS NOT NULL THEN valor_parcela ELSE 0 END), 0) as valor_pago,
                            COALESCE(SUM(CASE WHEN data_pagamento IS NULL THEN valor_parcela ELSE 0 END), 0) as valor_pendente,
                            COUNT(CASE WHEN data_pagamento IS NOT NULL THEN 1 END) as qtd_pago,
                            COUNT(CASE WHEN data_pagamento IS NULL THEN 1 END) as qtd_pendente
                        FROM financeiro_contas
                        WHERE tipo_conta = 'Pagar'
                        AND (
                            (DATE(data_emissao) >= DATE(%s) AND DATE(data_emissao) <= DATE(%s))
                            OR (DATE(data_vencimento) >= DATE(%s) AND DATE(data_vencimento) <= DATE(%s))
                            OR (DATE(data_pagamento) >= DATE(%s) AND DATE(data_pagamento) <= DATE(%s))
                        )
                    """, [mes_atual_inicio, mes_atual_fim, mes_atual_inicio, mes_atual_fim, mes_atual_inicio, mes_atual_fim])
                else:
                    # Sem filtro: buscar TODAS as contas ativas
                    print(f"🔍 Buscando TODAS as contas a pagar (sem filtro de período)")
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total_contas,
                            COALESCE(SUM(valor_parcela), 0) as valor_total,
                            COALESCE(SUM(CASE WHEN data_pagamento IS NOT NULL THEN valor_parcela ELSE 0 END), 0) as valor_pago,
                            COALESCE(SUM(CASE WHEN data_pagamento IS NULL THEN valor_parcela ELSE 0 END), 0) as valor_pendente,
                            COUNT(CASE WHEN data_pagamento IS NOT NULL THEN 1 END) as qtd_pago,
                            COUNT(CASE WHEN data_pagamento IS NULL THEN 1 END) as qtd_pendente
                        FROM financeiro_contas
                        WHERE tipo_conta = 'Pagar'
                    """)
                
                contas_pagar_atual = cursor.fetchone()
                print(f"✅ Resumo contas a pagar: Total={contas_pagar_atual[0]}, Valor Total={contas_pagar_atual[1]}, Pago={contas_pagar_atual[4]}/{contas_pagar_atual[2]}, Pendente={contas_pagar_atual[5]}/{contas_pagar_atual[3]}")
            
            # Calcular variações percentuais
            def calcular_variacao(atual, anterior):
                if anterior and anterior > 0:
                    return round(((atual - anterior) / anterior) * 100, 2)
                return 0 if atual == 0 else 100
            
            # Converter Decimal para float
            def converter_decimal(valor):
                return float(valor) if isinstance(valor, Decimal) else valor
            
            # Nomes dos meses em português
            meses_pt = {
                1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
                5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
                9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
            }
            
            def formatar_periodo(data):
                return f"{meses_pt[data.month]}/{data.year}"
            
            print(f"📊 Vendas atual: {vendas_mes_atual}")
            print(f"📊 Compras atual: {compras_mes_atual}")
            print(f"📊 Devoluções atual: {devolucoes_mes_atual}")
            
            resultado = {
                'periodos': {
                    'mes_atual': {
                        'inicio': mes_atual_inicio.strftime('%Y-%m-%d'),
                        'fim': mes_atual_fim.strftime('%Y-%m-%d'),
                        'label': formatar_periodo(mes_atual_inicio)
                    },
                    'mes_anterior': {
                        'inicio': mes_anterior_inicio.strftime('%Y-%m-%d'),
                        'fim': mes_anterior_fim.strftime('%Y-%m-%d'),
                        'label': formatar_periodo(mes_anterior_inicio)
                    },
                    'ano_passado': {
                        'inicio': ano_passado_inicio.strftime('%Y-%m-%d'),
                        'fim': ano_passado_fim.strftime('%Y-%m-%d'),
                        'label': formatar_periodo(ano_passado_inicio)
                    }
                },
                'vendas': {
                    'mes_atual': {
                        'total': converter_decimal(vendas_mes_atual[0]),
                        'quantidade': vendas_mes_atual[1]
                    },
                    'mes_anterior': {
                        'total': converter_decimal(vendas_mes_anterior[0]),
                        'quantidade': vendas_mes_anterior[1]
                    },
                    'ano_passado': {
                        'total': converter_decimal(vendas_ano_passado[0]),
                        'quantidade': vendas_ano_passado[1]
                    },
                    'variacoes': {
                        'vs_mes_anterior': calcular_variacao(
                            converter_decimal(vendas_mes_atual[0]),
                            converter_decimal(vendas_mes_anterior[0])
                        ),
                        'vs_ano_passado': calcular_variacao(
                            converter_decimal(vendas_mes_atual[0]),
                            converter_decimal(vendas_ano_passado[0])
                        )
                    }
                },
                'compras': {
                    'mes_atual': {
                        'total': converter_decimal(compras_mes_atual[0]),
                        'quantidade': compras_mes_atual[1]
                    },
                    'mes_anterior': {
                        'total': converter_decimal(compras_mes_anterior[0]),
                        'quantidade': compras_mes_anterior[1]
                    },
                    'ano_passado': {
                        'total': converter_decimal(compras_ano_passado[0]),
                        'quantidade': compras_ano_passado[1]
                    },
                    'variacoes': {
                        'vs_mes_anterior': calcular_variacao(
                            converter_decimal(compras_mes_atual[0]),
                            converter_decimal(compras_mes_anterior[0])
                        ),
                        'vs_ano_passado': calcular_variacao(
                            converter_decimal(compras_mes_atual[0]),
                            converter_decimal(compras_ano_passado[0])
                        )
                    }
                },
                'devolucoes': {
                    'mes_atual': {
                        'total': converter_decimal(devolucoes_mes_atual[0]),
                        'quantidade': devolucoes_mes_atual[1]
                    },
                    'mes_anterior': {
                        'total': converter_decimal(devolucoes_mes_anterior[0]),
                        'quantidade': devolucoes_mes_anterior[1]
                    },
                    'ano_passado': {
                        'total': converter_decimal(devolucoes_ano_passado[0]),
                        'quantidade': devolucoes_ano_passado[1]
                    },
                    'variacoes': {
                        'vs_mes_anterior': calcular_variacao(
                            converter_decimal(devolucoes_mes_atual[0]),
                            converter_decimal(devolucoes_mes_anterior[0])
                        ),
                        'vs_ano_passado': calcular_variacao(
                            converter_decimal(devolucoes_mes_atual[0]),
                            converter_decimal(devolucoes_ano_passado[0])
                        )
                    }
                },
                'contas_receber': {
                    'total_contas': contas_receber_atual[0],
                    'valor_total': converter_decimal(contas_receber_atual[1]),
                    'valor_pago': converter_decimal(contas_receber_atual[2]),
                    'valor_pendente': converter_decimal(contas_receber_atual[3]),
                    'qtd_pago': contas_receber_atual[4],
                    'qtd_pendente': contas_receber_atual[5]
                },
                'contas_pagar': {
                    'total_contas': contas_pagar_atual[0],
                    'valor_total': converter_decimal(contas_pagar_atual[1]),
                    'valor_pago': converter_decimal(contas_pagar_atual[2]),
                    'valor_pendente': converter_decimal(contas_pagar_atual[3]),
                    'qtd_pago': contas_pagar_atual[4],
                    'qtd_pendente': contas_pagar_atual[5]
                }
            }
            
            print(f"✅ Resultado final:")
            print(f"   Vendas: Atual={resultado['vendas']['mes_atual']['total']}, Anterior={resultado['vendas']['mes_anterior']['total']}")
            print(f"   Compras: Atual={resultado['compras']['mes_atual']['total']}, Anterior={resultado['compras']['mes_anterior']['total']}")
            print(f"   Devoluções: Atual={resultado['devolucoes']['mes_atual']['total']}, Anterior={resultado['devolucoes']['mes_anterior']['total']}")
            print(f"   Contas Receber: Total={resultado['contas_receber']['total_contas']}, Pago={resultado['contas_receber']['qtd_pago']}, Pendente={resultado['contas_receber']['qtd_pendente']}")
            print(f"   Contas Pagar: Total={resultado['contas_pagar']['total_contas']}, Pago={resultado['contas_pagar']['qtd_pago']}, Pendente={resultado['contas_pagar']['qtd_pendente']}")
            
            return Response(resultado)
            
        except Exception as e:
            print(f"❌ Erro ao buscar dados comparativos:")
            print(traceback.format_exc())
            return Response({
                'error': str(e),
                'details': traceback.format_exc()
            }, status=500)
