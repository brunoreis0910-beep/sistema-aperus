"""
Serviços de Integração com APIs Bancárias
Implementa OAuth2 e emissão de boletos para diversos bancos
"""

import requests
import json
from datetime import datetime, timedelta
from django.utils import timezone
from .models import ConfiguracaoBancaria, Boleto


class IntegracaoBancaria:
    """
    Classe base para integração com APIs bancárias.
    Implementa autenticação OAuth2 e métodos comuns.
    """
    
    def __init__(self, config_bancaria):
        """
        Inicializa a integração com uma configuração bancária específica.
        
        Args:
            config_bancaria: Instância do model ConfiguracaoBancaria
        """
        self.config = config_bancaria
        self.token = None
        
    def gerar_token(self):
        """
        Gera ou renova o token de acesso OAuth2.
        Salva o token na configuração bancária para reutilização.
        """
        # Verifica se token ainda é válido
        if self.config.access_token and self.config.token_expira_em:
            if self.config.token_expira_em > timezone.now():
                self.token = self.config.access_token
                return self.token
        
        # Token expirado ou não existe - gera novo
        try:
            payload = {
                'grant_type': 'client_credentials',
                'scope': 'boleto-cobranca.read boleto-cobranca.write'
            }
            
            response = requests.post(
                self.config.url_autenticacao,
                data=payload,
                auth=(self.config.client_id, self.config.client_secret),
                timeout=30
            )
            
            if response.status_code == 200:
                dados = response.json()
                self.token = dados.get('access_token')
                expires_in = dados.get('expires_in', 3600)  # Padrão 1 hora
                
                # Salva token na configuração
                self.config.access_token = self.token
                self.config.refresh_token = dados.get('refresh_token')
                self.config.token_expira_em = timezone.now() + timedelta(seconds=expires_in - 300)  # 5min antes
                self.config.save()
                
                return self.token
            else:
                raise Exception(f"Erro ao gerar token: {response.status_code} - {response.text}")
                
        except Exception as e:
            raise Exception(f"Erro na autenticação bancária: {str(e)}")
    
    def _get_headers(self):
        """Retorna headers padrão com autenticação"""
        if not self.token:
            self.gerar_token()
            
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    def registrar_boleto(self, conta_receber):
        """
        Registra um boleto no banco a partir de uma conta a receber.
        
        Args:
            conta_receber: Instância do model FinanceiroConta
            
        Returns:
            Instância do model Boleto criado/atualizado
        """
        # Valida se a conta já tem boleto
        boleto_existente = Boleto.objects.filter(id_conta=conta_receber).first()
        if boleto_existente and boleto_existente.status == 'REGISTRADO':
            raise Exception("Esta conta já possui um boleto registrado")
        
        # Prepara dados do boleto
        cliente = conta_receber.id_cliente
        
        payload = self._preparar_payload_boleto(conta_receber, cliente)
        
        try:
            response = requests.post(
                self.config.url_api_boletos,
                headers=self._get_headers(),
                data=json.dumps(payload),
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                dados_retorno = response.json()
                
                # Cria ou atualiza o boleto
                boleto = self._criar_boleto_from_response(
                    conta_receber, 
                    cliente, 
                    dados_retorno
                )
                
                return boleto
            else:
                erro_msg = response.text
                raise Exception(f"Erro ao registrar boleto: {response.status_code} - {erro_msg}")
                
        except Exception as e:
            raise Exception(f"Erro no registro do boleto: {str(e)}")
            
    def registrar_boleto_saas(self, mensalidade):
        """
        Registra um boleto no banco para uma mensalidade SaaS.
        """
        raise NotImplementedError("Registro de mensalidades não implementado para este banco")
    
    def _preparar_payload_boleto(self, conta, cliente):
        """
        Prepara o payload JSON para registro do boleto.
        Adaptável para cada banco (override em subclasses).
        """
        return {
            "numeroTitulo": str(conta.numero_documento or conta.id_conta),
            "valorNominal": float(conta.valor),
            "dataVencimento": conta.data_vencimento.strftime("%Y-%m-%d"),
            "dataEmissao": conta.data_emissao.strftime("%Y-%m-%d") if conta.data_emissao else datetime.now().strftime("%Y-%m-%d"),
            "pagador": {
                "cpfCnpj": cliente.cpf_cnpj.replace('.', '').replace('-', '').replace('/', ''),
                "nome": cliente.nome_razao_social[:200],
                "endereco": cliente.endereco[:255] if cliente.endereco else "",
                "cidade": cliente.cidade[:100] if cliente.cidade else "",
                "uf": cliente.uf or "",
                "cep": cliente.cep.replace('-', '') if cliente.cep else "",
                "codigoIbgeCidade": cliente.codigo_ibge or ""  # CRÍTICO!
            },
            "multa": {
                "percentual": float(self.config.percentual_multa)
            },
            "juros": {
                "percentualDia": float(self.config.percentual_juros_dia)
            },
            "diasProtesto": self.config.dias_protesto,
            "diasBaixa": self.config.dias_baixa
        }
    
    def _criar_boleto_from_response(self, conta, cliente, dados_retorno):
        """
        Cria ou atualiza registro do boleto no banco de dados.
        """
        boleto, created = Boleto.objects.update_or_create(
            id_conta=conta,
            defaults={
                'id_config_bancaria': self.config,
                'nosso_numero': dados_retorno.get('nossoNumero', ''),
                'numero_documento': str(conta.numero_documento or conta.id_conta),
                'codigo_barras': dados_retorno.get('codigoBarras', ''),
                'linha_digitavel': dados_retorno.get('linhaDigitavel', ''),
                'pagador_nome': cliente.nome_razao_social,
                'pagador_cpf_cnpj': cliente.cpf_cnpj,
                'pagador_endereco': cliente.endereco,
                'pagador_cidade': cliente.cidade,
                'pagador_uf': cliente.uf,
                'pagador_cep': cliente.cep,
                'pagador_codigo_ibge': cliente.codigo_ibge,
                'valor_nominal': conta.valor,
                'valor_multa': conta.valor * self.config.percentual_multa / 100,
                'valor_juros': 0,  # Calculado diariamente pelo banco
                'data_emissao': conta.data_emissao or datetime.now().date(),
                'data_vencimento': conta.data_vencimento,
                'data_registro_banco': timezone.now(),
                'status': 'REGISTRADO',
                'url_boleto': dados_retorno.get('urlBoleto', ''),
                'pix_qr_code': dados_retorno.get('pixQrCode', ''),
                'pix_emv': dados_retorno.get('pixEmv', ''),
                'pix_txid': dados_retorno.get('pixTxid', ''),
                'dados_retorno_json': dados_retorno
            }
        )
        
        return boleto
    
    def consultar_boleto(self, nosso_numero):
        """
        Consulta situação de um boleto no banco.
        """
        try:
            url = f"{self.config.url_api_boletos}/{nosso_numero}"
            response = requests.get(
                url,
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                dados = response.json()
                status_raw = dados.get('status') or dados.get('situacao') or dados.get('codigoSituacao') or ''
                status_mapeado = 'PAGO' if str(status_raw).upper() in ['PAGO', 'LIQUIDADO', 'BAIXADO', '1', 'APPROVED', 'CONFIRMADO'] else 'REGISTRADO'
                
                data_pagamento = dados.get('data_pagamento') or dados.get('dataPagamento') or datetime.now().date().strftime('%Y-%m-%d')
                valor_pago = dados.get('valor_pago') or dados.get('valorPago') or dados.get('valorNominal') or 0
                
                return True, {
                    'status': status_mapeado,
                    'data_pagamento': data_pagamento,
                    'valor_pago': float(valor_pago),
                    'mensagem': f"Consulta realizada com sucesso. Status raw: {status_raw}"
                }
            else:
                return False, {'erro': f"Erro ao consultar boleto: {response.status_code} - {response.text}"}
                
        except Exception as e:
            return False, {'erro': str(e)}
    
    def cancelar_boleto(self, nosso_numero):
        """
        Cancela/baixa um boleto no banco.
        """
        try:
            url = f"{self.config.url_api_boletos}/{nosso_numero}/baixar"
            response = requests.post(
                url,
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code in [200, 204]:
                # Atualiza status do boleto no BD
                boleto = Boleto.objects.filter(nosso_numero=nosso_numero).first()
                if boleto:
                    boleto.status = 'CANCELADO'
                    boleto.save()
                return True
            else:
                raise Exception(f"Erro ao cancelar boleto: {response.status_code}")
                
        except Exception as e:
            raise Exception(f"Erro no cancelamento: {str(e)}")


# ====================================================
# Implementações específicas por banco
# ====================================================

class IntegracaoBancoDoBrasil(IntegracaoBancaria):
    """Implementação específica para Banco do Brasil"""
    
    def _preparar_payload_boleto(self, conta, cliente):
        payload = super()._preparar_payload_boleto(conta, cliente)
        # Ajustes específicos do BB
        payload['numeroConvenio'] = self.config.convenio
        payload['numeroCarteira'] = '17'  # Carteira padrão BB
        return payload


class IntegracaoItau(IntegracaoBancaria):
    """Implementação específica para Itaú"""
    
    def _preparar_payload_boleto(self, conta, cliente):
        payload = super()._preparar_payload_boleto(conta, cliente)
        # Ajustes específicos do Itaú
        payload['carteira'] = self.config.convenio or '109'
        return payload


class IntegracaoSicoob(IntegracaoBancaria):
    """Implementação específica para Sicoob"""
    
    def _preparar_payload_boleto(self, conta, cliente):
        payload = super()._preparar_payload_boleto(conta, cliente)
        # Ajustes específicos do Sicoob
        payload['modalidadeCobranca'] = '01'
        return payload


class IntegracaoMercadoPago(IntegracaoBancaria):
    """Implementação específica para Mercado Pago (Boleto PF)"""
    
    def gerar_token(self):
        """
        Para o Mercado Pago, o Access Token (APP_USR-... ou TEST-...) é de longa duração
        e configurado diretamente no client_secret ou access_token.
        """
        self.token = self.config.client_secret or self.config.access_token
        # Salva para consistência
        if self.token and not self.config.access_token:
            self.config.access_token = self.token
            self.config.save(update_fields=['access_token'])
        return self.token

    def _preparar_payload_boleto(self, conta, cliente):
        """Prepara o payload no formato esperado pelo Mercado Pago"""
        import unicodedata
        def clean_text(texto):
            if not texto:
                return ""
            nfkd = unicodedata.normalize('NFKD', str(texto))
            return "".join([c for c in nfkd if not unicodedata.combining(c)])

        # Divide nome_razao_social em nome e sobrenome
        nome_completo = clean_text(cliente.nome_razao_social.strip())
        partes = nome_completo.split(' ', 1)
        first_name = partes[0]
        last_name = partes[1] if len(partes) > 1 else "Silva"
        
        # CPF/CNPJ limpo
        cpf_cnpj_limpo = cliente.cpf_cnpj.replace('.', '').replace('-', '').replace('/', '').strip()
        doc_type = "CPF" if len(cpf_cnpj_limpo) == 11 else "CNPJ"
        
        # CEP limpo
        cep_limpo = cliente.cep.replace('-', '').strip() if cliente.cep else ""
        
        # Endereço: separa rua e número
        endereco_completo = cliente.endereco or "Rua Nao Informada"
        import re
        num_match = re.search(r',?\s*(\d+)\s*$', endereco_completo)
        if num_match:
            street_number = num_match.group(1)
            street_name = endereco_completo[:num_match.start()].strip(', ')
        else:
            street_number = "1"  # Default to "1" instead of "SN" to avoid bank rejection
            street_name = endereco_completo
            
        payload = {
            "transaction_amount": float(conta.valor_parcela or conta.valor),
            "description": f"Boleto ref. Conta {conta.id_conta}",
            "payment_method_id": "bolbradesco",
            "payer": {
                "email": cliente.email or "financeiro@aperus.com.br",
                "first_name": clean_text(first_name)[:100],
                "last_name": clean_text(last_name)[:100],
                "identification": {
                    "type": doc_type,
                    "number": cpf_cnpj_limpo
                },
                "address": {
                    "zip_code": cep_limpo,
                    "street_name": clean_text(street_name)[:200],
                    "street_number": clean_text(street_number),
                    "neighborhood": clean_text(cliente.bairro or "Centro")[:100],
                    "city": clean_text(cliente.cidade or "Patrocinio")[:100],
                    "federal_unit": clean_text(cliente.uf or "MG")[:2]
                }
            }
        }
        return payload

    def registrar_boleto(self, conta_receber):
        """Registra um boleto no Mercado Pago"""
        # Valida se a conta já tem boleto
        boleto_existente = Boleto.objects.filter(id_conta=conta_receber).first()
        if boleto_existente and boleto_existente.status == 'REGISTRADO':
            raise Exception("Esta conta já possui um boleto registrado")
        
        cliente = conta_receber.id_cliente
        payload = self._preparar_payload_boleto(conta_receber, cliente)
        
        url = self.config.url_api_boletos or "https://api.mercadopago.com/v1/payments"
        
        import uuid
        headers = self._get_headers()
        headers['X-Idempotency-Key'] = str(uuid.uuid4())
        
        try:
             response = requests.post(
                 url,
                 headers=headers,
                 data=json.dumps(payload),
                 timeout=30
             )
             
             if response.status_code in [200, 201]:
                 dados_retorno = response.json()
                 boleto = self._criar_boleto_from_response(conta_receber, cliente, dados_retorno)
                 return boleto
             else:
                 erro_msg = response.text
                 raise Exception(f"Erro ao registrar boleto Mercado Pago: {response.status_code} - {erro_msg}")
                 
        except Exception as e:
             raise Exception(f"Erro no registro do boleto: {str(e)}")

    def _criar_boleto_from_response(self, conta, cliente, dados_retorno):
        """Cria ou atualiza registro de boleto a partir do retorno do Mercado Pago"""
        status_mp = dados_retorno.get('status')
        if status_mp == 'rejected':
            status_detail = dados_retorno.get('status_detail', 'rejected_by_bank')
            raise Exception(f"Transação rejeitada pelo Mercado Pago ({status_detail})")
            
        trans_details = dados_retorno.get('transaction_details', {})
        barcode = trans_details.get('barcode', {})
        vouchers = dados_retorno.get('vouchers', [])
        pdf_url = trans_details.get('external_resource_url', '')
        if not pdf_url and vouchers and len(vouchers) > 0:
            pdf_url = vouchers[0].get('display_info', {}).get('pdf_url', '')
            
        boleto, created = Boleto.objects.update_or_create(
            id_conta=conta,
            defaults={
                'id_config_bancaria': self.config,
                'nosso_numero': str(dados_retorno.get('id', '')),
                'numero_documento': str(conta.numero_documento or conta.id_conta),
                'codigo_barras': barcode.get('content', ''),
                'linha_digitavel': trans_details.get('digitable_line', ''),
                'pagador_nome': cliente.nome_razao_social,
                'pagador_cpf_cnpj': cliente.cpf_cnpj,
                'pagador_endereco': cliente.endereco,
                'pagador_cidade': cliente.cidade,
                'pagador_uf': cliente.uf,
                'pagador_cep': cliente.cep,
                'pagador_codigo_ibge': cliente.codigo_ibge,
                'valor_nominal': conta.valor,
                'valor_multa': 0,
                'valor_juros': 0,
                'data_emissao': conta.data_emissao or datetime.now().date(),
                'data_vencimento': conta.data_vencimento,
                'data_registro_banco': timezone.now(),
                'status': 'REGISTRADO',
                'url_boleto': pdf_url,
                'dados_retorno_json': dados_retorno
            }
        )
        return boleto

    def consultar_boleto(self, nosso_numero):
        """Consulta boleto no Mercado Pago e mapeia para resposta compatível"""
        try:
            url_base = self.config.url_api_boletos or "https://api.mercadopago.com/v1/payments"
            if not url_base.endswith('/payments'):
                url = f"{url_base}/v1/payments/{nosso_numero}"
            else:
                url = f"{url_base}/{nosso_numero}"
                
            response = requests.get(
                url,
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                status_mp = data.get('status')
                
                # Mapeia para os status esperados pelo BaixaAutomaticaBoletos
                status_mapeado = 'PAGO' if status_mp == 'approved' else 'REGISTRADO' if status_mp == 'pending' else status_mp.upper()
                
                # Coleta data de pagamento
                data_pagamento_str = data.get('money_release_date') or data.get('date_approved') or datetime.now().isoformat()
                try:
                    data_pagamento = datetime.fromisoformat(data_pagamento_str.replace('Z', '+00:00')).date()
                except Exception:
                    data_pagamento = datetime.now().date()
                    
                # Coleta valor pago
                valor_pago = data.get('transaction_details', {}).get('net_received_amount') or data.get('transaction_amount') or 0
                
                return True, {
                    'status': status_mapeado,
                    'data_pagamento': data_pagamento.strftime('%Y-%m-%d'),
                    'valor_pago': float(valor_pago),
                    'mensagem': f"Status Mercado Pago: {status_mp}"
                }
            else:
                raise Exception(f"Erro ao consultar boleto MP: {response.status_code} - {response.text}")
                
        except Exception as e:
            return False, {'erro': str(e)}

    def _preparar_payload_mensalidade(self, mensalidade):
        import unicodedata
        def clean_text(texto):
            if not texto:
                return ""
            nfkd = unicodedata.normalize('NFKD', str(texto))
            return "".join([c for c in nfkd if not unicodedata.combining(c)])

        cliente = mensalidade.saas_cliente

        # Divide razao_social em nome e sobrenome
        nome_completo = clean_text(cliente.razao_social.strip())
        partes = nome_completo.split(' ', 1)
        first_name = partes[0]
        last_name = partes[1] if len(partes) > 1 else "Silva"
        
        # CNPJ/CPF limpo
        cnpj_limpo = cliente.cnpj.replace('.', '').replace('-', '').replace('/', '').strip()
        doc_type = "CPF" if len(cnpj_limpo) == 11 else "CNPJ"
        
        # CEP limpo
        cep_limpo = cliente.cep.replace('-', '').strip() if cliente.cep else ""
        
        # Endereço: separa rua e número
        endereco_completo = cliente.endereco or "Rua Nao Informada"
        import re
        num_match = re.search(r',?\s*(\d+)\s*$', endereco_completo)
        if num_match:
            street_number = num_match.group(1)
            street_name = endereco_completo[:num_match.start()].strip(', ')
        else:
            street_number = cliente.numero or "1"
            street_name = endereco_completo
            
        payload = {
            "transaction_amount": float(mensalidade.valor),
            "description": f"Mensalidade SaaS Ref. {mensalidade.nosso_numero}",
            "payment_method_id": "bolbradesco",
            "payer": {
                "email": cliente.email or "financeiro@aperus.com.br",
                "first_name": clean_text(first_name)[:100],
                "last_name": clean_text(last_name)[:100],
                "identification": {
                    "type": doc_type,
                    "number": cnpj_limpo
                },
                "address": {
                    "zip_code": cep_limpo,
                    "street_name": clean_text(street_name)[:200],
                    "street_number": clean_text(street_number),
                    "neighborhood": clean_text(cliente.bairro or "Centro")[:100],
                    "city": clean_text(cliente.cidade or "Patrocinio")[:100],
                    "federal_unit": clean_text(cliente.estado or "MG")[:2]
                }
            }
        }
        return payload

    def registrar_boleto_saas(self, mensalidade):
        """
        Registra um boleto no Mercado Pago para uma mensalidade SaaS.
        """
        payload = self._preparar_payload_mensalidade(mensalidade)
        
        url = self.config.url_api_boletos or "https://api.mercadopago.com/v1/payments"
        
        import uuid
        headers = self._get_headers()
        headers['X-Idempotency-Key'] = str(uuid.uuid4())
        
        try:
            response = requests.post(
                url,
                headers=headers,
                data=json.dumps(payload),
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                dados_retorno = response.json()
                
                status_mp = dados_retorno.get('status')
                if status_mp == 'rejected':
                    status_detail = dados_retorno.get('status_detail', 'rejected_by_bank')
                    raise Exception(f"Transação rejeitada pelo Mercado Pago ({status_detail})")
                
                trans_details = dados_retorno.get('transaction_details', {})
                vouchers = dados_retorno.get('vouchers', [])
                pdf_url = trans_details.get('external_resource_url', '')
                if not pdf_url and vouchers and len(vouchers) > 0:
                    pdf_url = vouchers[0].get('display_info', {}).get('pdf_url', '')
                    
                pix_copia_cola = dados_retorno.get('point_of_interaction', {}).get('transaction_data', {}).get('qr_code', '')
                
                # Atualiza a mensalidade
                mensalidade.nosso_numero = str(dados_retorno.get('id', ''))
                mensalidade.url_boleto = pdf_url
                mensalidade.linha_digitavel = trans_details.get('digitable_line', '')
                if pix_copia_cola:
                    mensalidade.pix_copia_cola = pix_copia_cola
                mensalidade.save()
                
                return mensalidade
            else:
                erro_msg = response.text
                raise Exception(f"Erro ao registrar boleto Mercado Pago: {response.status_code} - {erro_msg}")
        except Exception as e:
            raise Exception(f"Erro no registro do boleto da mensalidade: {str(e)}")


# Factory para criar instância correta
def criar_integracao_bancaria(config_bancaria):
    """
    Factory que retorna a implementação correta baseada no banco.
    
    Args:
        config_bancaria: Instância do model ConfiguracaoBancaria
        
    Returns:
        Instância da classe de integração apropriada
    """
    implementacoes = {
        'BB': IntegracaoBancoDoBrasil,
        'ITAU': IntegracaoItau,
        'SICOOB': IntegracaoSicoob,
        'MERCADOPAGO': IntegracaoMercadoPago,
    }
    
    # Retorna implementação específica ou genérica
    classe = implementacoes.get(config_bancaria.banco, IntegracaoBancaria)
    return classe(config_bancaria)
