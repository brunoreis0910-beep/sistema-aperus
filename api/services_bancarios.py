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
                return response.json()
            else:
                raise Exception(f"Erro ao consultar boleto: {response.status_code}")
                
        except Exception as e:
            raise Exception(f"Erro na consulta: {str(e)}")
    
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
    }
    
    # Retorna implementação específica ou genérica
    classe = implementacoes.get(config_bancaria.banco, IntegracaoBancaria)
    return classe(config_bancaria)
