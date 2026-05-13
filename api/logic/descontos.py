# logic/descontos.py
"""
Lógica de negócio para o Módulo de Descontos Inteligentes.
Hierarquia de aplicação: Exceção > Desconto Cliente > Operação Padrão
"""

from decimal import Decimal
import math


def calcular_preco_final(produto, cliente, valor_tabela):
    """
    Calcula o preço final com base na hierarquia: 
    Exceção de Grupo > Desconto Cliente > Operação Padrão.
    
    Args:
        produto: Instância do modelo Produto
        cliente: Instância do modelo Cliente
        valor_tabela: Decimal - preço base do produto
        
    Returns:
        dict com chaves:
            - preco: Preço final após descontos
            - desconto_aplicado: Valor do desconto em R$
            - desconto_percentual: Percentual do desconto (para referência)
            - travado: Boolean - se True, o campo de desconto deve ser travado no React
            - motivo: String descrevendo qual regra foi aplicada
            - grupo_excecao: Nome do grupo em exceção (se aplicável)
    """
    
    if not cliente or not produto:
        return {
            "preco": valor_tabela,
            "desconto_aplicado": Decimal("0.00"),
            "desconto_percentual": Decimal("0.00"),
            "travado": False,
            "motivo": "Produto ou Cliente não fornecido"
        }

    valor_tabela = Decimal(str(valor_tabela))
    
    # ========== REGRA 1: Verifica exceção por grupo de produto ==========
    if produto.id_grupo and cliente.grupos_excecao.filter(id_grupo=produto.id_grupo).exists():
        grupo_exceto = produto.id_grupo
        grupo_nome = produto.id_grupo.nome_grupo if hasattr(produto.id_grupo, 'nome_grupo') else str(grupo_exceto)
        
        return {
            "preco": valor_tabela,
            "desconto_aplicado": Decimal("0.00"),
            "desconto_percentual": Decimal("0.00"),
            "travado": False,
            "motivo": f"Produto em grupo de exceção: {grupo_nome}",
            "grupo_excecao": grupo_nome
        }
    
    # ========== REGRA 2: Desconto personalizado do cliente ==========
    if cliente.valor_desconto and cliente.valor_desconto > 0:
        valor_desconto = Decimal(str(cliente.valor_desconto))
        
        # Aplicar desconto conforme o tipo
        if cliente.tipo_desconto == 'PERCENTUAL':
            valor_desc = (valor_tabela * (valor_desconto / Decimal("100")))
            desconto_percentual = valor_desconto
        else:  # FIXO
            valor_desc = valor_desconto
            desconto_percentual = (valor_desc / valor_tabela * Decimal("100")) if valor_tabela > 0 else Decimal("0.00")
        
        preco_com_desconto = valor_tabela - valor_desc
        
        # ========== REGRA 3: Aplicar lógica de arredondamento (Safe Margin) ==========
        if cliente.percentual_arredondamento and cliente.percentual_arredondamento > 0:
            limite_ajuste = preco_com_desconto * (cliente.percentual_arredondamento / Decimal("100"))
            
            # Se o preço termina em centavos que podem ser arredondados dentro do limite
            preco_arredondado = aplicar_arredondamento_seguro(preco_com_desconto, limite_ajuste)
            
            if preco_arredondado != preco_com_desconto:
                ajuste = preco_com_desconto - preco_arredondado
                valor_desc += ajuste  # Aumenta ligeiramente o desconto para atingir o arredondamento
        
        return {
            "preco": preco_com_desconto,
            "desconto_aplicado": valor_desc,
            "desconto_percentual": desconto_percentual,
            "travado": cliente.priorizar_desconto_cliente,  # Travado se cliente tem prioridade
            "motivo": f"Desconto de Cliente: {cliente.tipo_desconto} - {cliente.valor_desconto}",
        }
    
    # ========== REGRA 4: Sem desconto - usar preço de tabela ==========
    return {
        "preco": valor_tabela,
        "desconto_aplicado": Decimal("0.00"),
        "desconto_percentual": Decimal("0.00"),
        "travado": False,
        "motivo": "Nenhuma regra aplicada - Preço de Tabela"
    }


def aplicar_arredondamento_seguro(preco, limite_ajuste):
    """
    Aplica arredondamento seguro respeitando um limite de margem.
    Funciona arredondando para os decimais mais próximos (.00, .10, .25, .50, .75, .90).
    
    Args:
        preco: Decimal - preço original
        limite_ajuste: Decimal - limite máximo de ajuste permitido
        
    Returns:
        Decimal - preço arredondado ou original se exceder limite
    """
    
    # Possíveis valores de arredondamento (em centavos)
    arredondamentos_possiveis = [
        Decimal("0.00"),
        Decimal("0.05"),
        Decimal("0.10"),
        Decimal("0.25"),
        Decimal("0.50"),
        Decimal("0.75"),
        Decimal("0.90"),
        Decimal("0.95"),
    ]
    
    # Extrair centavos
    centavos = preco % Decimal("1")
    
    # Encontrar o arredondamento mais próximo
    melhor_arredondamento = min(
        arredondamentos_possiveis,
        key=lambda x: abs(centavos - x)
    )
    
    preco_arredondado = (preco - centavos) + melhor_arredondamento
    ajuste = abs(preco - preco_arredondado)
    
    # Retornar arredondado apenas se estiver dentro do limite
    if ajuste <= limite_ajuste:
        return preco_arredondado
    
    return preco


def validar_desconto(cliente, produto, desconto_proposto):
    """
    Valida se um desconto proposto pelo vendedor é permitido conforme as regras.
    
    Args:
        cliente: Instância do modelo Cliente
        produto: Instância do modelo Produto
        desconto_proposto: Decimal - desconto que o vendedor quer aplicar
        
    Returns:
        dict com:
            - permitido: Boolean
            - mensagem: String com motivo
            - desconto_maximo: Decimal - qual seria o desconto máximo permitido
    """
    
    # Calcular desconto automático
    calc_automatico = calcular_preco_final(produto, cliente, Decimal("100.00"))
    desconto_automatico = calc_automatico["desconto_aplicado"]
    
    # Se houver desconto automático e cliente tem prioridade, não permite alteração
    if desconto_automatico > 0 and cliente.priorizar_desconto_cliente:
        return {
            "permitido": False,
            "mensagem": f"Desconto de cliente bloqueado por regra. Desconto automático: R$ {desconto_automatico:.2f}",
            "desconto_maximo": desconto_automatico
        }
    
    # Se proposto é maior que o automático, alertar
    if desconto_proposto > desconto_automatico:
        return {
            "permitido": True,  # Permite mas com aviso
            "mensagem": f"Atenção: Desconto proposto (R$ {desconto_proposto:.2f}) excede o automático (R$ {desconto_automatico:.2f}). Requer aprovação",
            "desconto_maximo": desconto_automatico,
            "requer_aprovacao": True
        }
    
    return {
        "permitido": True,
        "mensagem": "Desconto dentro das regras",
        "desconto_maximo": desconto_automatico,
        "requer_aprovacao": False
    }


def gerar_resumo_desconto_cliente(cliente):
    """
    Gera um resumo legível das regras de desconto do cliente para exibição na UI.
    
    Args:
        cliente: Instância do modelo Cliente
        
    Returns:
        dict com informações formatadas
    """
    
    resumo = {
        "tem_desconto": cliente.valor_desconto and cliente.valor_desconto > 0,
        "tipo": cliente.tipo_desconto or "N/A",
        "valor": str(cliente.valor_desconto) if cliente.valor_desconto else "0.00",
        "prioridade": cliente.priorizar_desconto_cliente,
        "grupos_excecao": list(
            cliente.grupos_excecao.values_list('nome_grupo', flat=True)
        ) if cliente.grupos_excecao.exists() else [],
        "margen_arredondamento": str(cliente.percentual_arredondamento) if cliente.percentual_arredondamento else "0.00",
    }
    
    # Gerar descrição legível
    if not resumo["tem_desconto"]:
        resumo["descricao"] = "Sem desconto personalizado configurado"
    else:
        if resumo["tipo"] == "PERCENTUAL":
            resumo["descricao"] = f"Desconto de {resumo['valor']}% para este cliente"
        else:
            resumo["descricao"] = f"Desconto fixo de R$ {resumo['valor']} para cada item"
        
        if resumo["grupos_excecao"]:
            resumo["descricao"] += f". Excluídos: {', '.join(resumo['grupos_excecao'])}"
        
        if resumo["prioridade"]:
            resumo["descricao"] += " (Prioridade: Bloqueia alterações)"
    
    return resumo
