# Status de Ordem de Serviço - Model
from django.db import models

class StatusOrdemServico(models.Model):
    """Status disponíveis para Ordem de Serviço"""
    id_status = models.AutoField(primary_key=True)
    nome_status = models.CharField(max_length=50, unique=True)
    descricao = models.CharField(max_length=200, blank=True, null=True)
    cor = models.CharField(max_length=20, default='blue', help_text='primary, success, warning, error, info')
    ordem = models.IntegerField(default=0, help_text='Ordem de exibição')
    ativo = models.BooleanField(default=True)
    padrao = models.BooleanField(default=False, help_text='Status padrão para novas OS')
    permite_editar = models.BooleanField(default=True)
    permite_excluir = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'status_ordem_servico'
        ordering = ['ordem', 'nome_status']
        verbose_name = 'Status de Ordem de Serviço'
        verbose_name_plural = 'Status de Ordens de Serviço'
    
    def __str__(self):
        return self.nome_status
    
    def save(self, *args, **kwargs):
        # Se marcar como padrão, desmarcar outros
        if self.padrao:
            StatusOrdemServico.objects.filter(padrao=True).exclude(pk=self.pk).update(padrao=False)
        super().save(*args, **kwargs)
