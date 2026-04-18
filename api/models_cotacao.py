"""
Modelos para Sistema de Cotação de Compras
"""
from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
from django.utils import timezone
import uuid


class Cotacao(models.Model):
    """Cotação de compras enviada para fornecedores"""
    
    STATUS_CHOICES = [
        ('Rascunho', 'Rascunho'),
        ('Enviada', 'Enviada'),
        ('Em Análise', 'Em Análise'),
        ('Finalizada', 'Finalizada'),
        ('Cancelada', 'Cancelada'),
    ]
    
    id_cotacao = models.AutoField(primary_key=True, db_column='id_cotacao')
    numero_cotacao = models.CharField(max_length=50, unique=True, db_column='numero_cotacao')
    data_cotacao = models.DateTimeField(default=timezone.now, db_column='data_cotacao')
    prazo_resposta = models.DateTimeField(db_column='prazo_resposta')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Rascunho', db_column='status')
    observacoes = models.TextField(blank=True, null=True, db_column='observacoes')
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_column='criado_por')
    criado_em = models.DateTimeField(auto_now_add=True, db_column='criado_em')
    atualizado_em = models.DateTimeField(auto_now=True, db_column='atualizado_em')
    
    class Meta:
        db_table = 'cotacoes'
        ordering = ['-data_cotacao']
    
    def __str__(self):
        return f'Cotação {self.numero_cotacao}'
    
    def gerar_numero_cotacao(self):
        """Gera número sequencial da cotação"""
        ultimo = Cotacao.objects.filter(
            numero_cotacao__startswith=f'COT{timezone.now().year}'
        ).order_by('-numero_cotacao').first()
        
        if ultimo:
            ultimo_num = int(ultimo.numero_cotacao[-4:])
            novo_num = ultimo_num + 1
        else:
            novo_num = 1
        
        return f'COT{timezone.now().year}{novo_num:04d}'
    
    def save(self, *args, **kwargs):
        if not self.numero_cotacao:
            self.numero_cotacao = self.gerar_numero_cotacao()
        super().save(*args, **kwargs)


class CotacaoItem(models.Model):
    """Itens da cotação (produtos a serem cotados)"""
    
    id_cotacao_item = models.AutoField(primary_key=True, db_column='id_cotacao_item')
    id_cotacao = models.ForeignKey(Cotacao, on_delete=models.CASCADE, related_name='itens', db_column='id_cotacao')
    id_produto = models.ForeignKey('Produto', on_delete=models.CASCADE, db_column='id_produto')
    quantidade_solicitada = models.DecimalField(max_digits=10, decimal_places=3, db_column='quantidade_solicitada')
    observacoes = models.TextField(blank=True, null=True, db_column='observacoes')
    fornecedor_vencedor = models.ForeignKey('Fornecedor', on_delete=models.SET_NULL, null=True, blank=True, 
                                           related_name='itens_cotacao_vencidos', db_column='fornecedor_vencedor')
    valor_vencedor = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, db_column='valor_vencedor')
    
    class Meta:
        db_table = 'cotacao_itens'
    
    def __str__(self):
        return f'Item {self.id_produto.nome_produto} - Cotação {self.id_cotacao.numero_cotacao}'


class CotacaoFornecedor(models.Model):
    """Relação entre cotação e fornecedores convidados"""
    
    STATUS_CHOICES = [
        ('Pendente', 'Pendente'),
        ('Visualizada', 'Visualizada'),
        ('Respondida', 'Respondida'),
        ('Vencedor', 'Vencedor'),
        ('Não Vencedor', 'Não Vencedor'),
    ]
    
    id_cotacao_fornecedor = models.AutoField(primary_key=True, db_column='id_cotacao_fornecedor')
    id_cotacao = models.ForeignKey(Cotacao, on_delete=models.CASCADE, related_name='fornecedores', db_column='id_cotacao')
    id_fornecedor = models.ForeignKey('Fornecedor', on_delete=models.CASCADE, db_column='id_fornecedor')
    token_acesso = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_column='token_acesso')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pendente', db_column='status')
    data_envio = models.DateTimeField(null=True, blank=True, db_column='data_envio')
    data_visualizacao = models.DateTimeField(null=True, blank=True, db_column='data_visualizacao')
    data_resposta = models.DateTimeField(null=True, blank=True, db_column='data_resposta')
    email_enviado = models.BooleanField(default=False, db_column='email_enviado')
    whatsapp_enviado = models.BooleanField(default=False, db_column='whatsapp_enviado')
    
    class Meta:
        db_table = 'cotacao_fornecedores'
        unique_together = ['id_cotacao', 'id_fornecedor']
    
    def __str__(self):
        return f'{self.id_fornecedor.nome_razao_social} - {self.id_cotacao.numero_cotacao}'
    
    def get_link_resposta(self):
        """Retorna o link único para o fornecedor responder"""
        return f'/cotacao/responder/{self.token_acesso}'


class CotacaoResposta(models.Model):
    """Respostas dos fornecedores para cada item da cotação"""
    
    id_cotacao_resposta = models.AutoField(primary_key=True, db_column='id_cotacao_resposta')
    id_cotacao_fornecedor = models.ForeignKey(CotacaoFornecedor, on_delete=models.CASCADE, 
                                              related_name='respostas', db_column='id_cotacao_fornecedor')
    id_cotacao_item = models.ForeignKey(CotacaoItem, on_delete=models.CASCADE, 
                                        related_name='respostas', db_column='id_cotacao_item')
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2, db_column='valor_unitario')
    prazo_entrega_dias = models.IntegerField(null=True, blank=True, db_column='prazo_entrega_dias')
    observacoes = models.TextField(blank=True, null=True, db_column='observacoes')
    valor_total = models.DecimalField(max_digits=12, decimal_places=2, db_column='valor_total')
    
    class Meta:
        db_table = 'cotacao_respostas'
        unique_together = ['id_cotacao_fornecedor', 'id_cotacao_item']
    
    def __str__(self):
        return f'Resposta {self.id_cotacao_fornecedor.id_fornecedor.nome_razao_social}'
    
    def save(self, *args, **kwargs):
        """Calcula valor total automaticamente"""
        if self.valor_unitario and self.id_cotacao_item:
            self.valor_total = self.valor_unitario * self.id_cotacao_item.quantidade_solicitada
        super().save(*args, **kwargs)
