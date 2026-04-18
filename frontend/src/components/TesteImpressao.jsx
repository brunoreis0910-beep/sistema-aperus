import React, { useState } from 'react'
import { Button, Box } from '@mui/material'
import VendaImpressao from './VendaImpressao'

const TesteImpressao = () => {
  const [mostrarImpressao, setMostrarImpressao] = useState(false)

  // Dados de teste que simulam a estrutura da listagem
  const dadosTesteVenda = {
    id: 56,
    numero_documento: '56',
    data: '2025-10-30T12:42:12',
    cliente: 'CLIENTE TESTE LTDA',
    vendedor: 'Joéo Silva',
    operacao: 'VENDA A VISTA',
    valor_total: 10.00,
    desconto: 0,
    // Simular produtos
    produtos: [
      {
        codigo_produto: 'PROD1',
        nome_produto: 'Produto 1',
        quantidade: 1,
        valor_unitario: 10.00,
        desconto_valor: 0
      }
    ]
  }

  const prepararDados = (vendaRow) => {
    return {
      numero_venda: vendaRow.numero_documento || '56',
      data_venda: vendaRow.data || '2025-10-30T12:42:12',
      cliente: {
        nome: 'CLIENTE TESTE LTDA',
        razao_social: 'CLIENTE TESTE LTDA',
        cpf_cnpj: '12.345.678/0001-90',
        telefone: '(11) 99999-9999',
        email: 'cliente@teste.com',
        endereco: 'Rua Teste, 123',
        cidade: 'são Paulo',
        estado: 'SP',
        cep: '01234-567'
      },
      vendedor: {
        nome: 'Joéo Silva',
        codigo: 'VEND001',
        telefone: '(11) 88888-8888',
        email: 'joao@empresa.com'
      },
      operacao: {
        nome_operacao: 'VENDA A VISTA',
        nome: 'VENDA A VISTA'
      },
      empresa: {
        nome: 'MINHA EMPRESA LTDA',
        cnpj: '00.123.456/0001-78',
        endereco: 'Av. Principal, 456 - Centro',
        telefone: '(11) 1234-5678'
      },
      produtos: [
        {
          id_produto: 'prod1',
          codigo_produto: 'PROD1',
          nome_produto: 'Produto 1',
          quantidade: 1,
          valor_unitario: 10.00,
          desconto_valor: 0
        }
      ],
      valor_total: 10.00,
      desconto: 0,
      valor_final: 10.00,
      forma_pagamento: 'Dinheiro',
      condicao_pagamento: 'À vista',
      financeiro: {
        conta: '',
        departamento: '',
        vencimento: '',
        valor_parcela: 10.00,
        gera_financeiro: false
      },
      observacoes: ''
    }
  }

  const dadosImpressao = prepararDados(dadosTesteVenda)

  return (
    <Box p={2}>
      <Button
        variant="contained"
        onClick={() => setMostrarImpressao(!mostrarImpressao)}
      >
        {mostrarImpressao ? 'Ocultar' : 'Mostrar'} Teste de Impressão
      </Button>

      {mostrarImpressao && (
        <Box mt={2}>
          <VendaImpressao dadosVenda={dadosImpressao} />
        </Box>
      )}
    </Box>
  )
}

export default TesteImpressao