import React, { forwardRef } from 'react'
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Divider } from '@mui/material'

const VendaImpressao = forwardRef(({ dadosVenda }, ref) => {
  if (!dadosVenda) {
    return <div>Dados da venda não disponíveis</div>
  }

  const {
    numero_venda,
    data_venda,
    cliente,
    vendedor,
    operacao,
    produtos = [],
    valor_total,
    desconto,
    valor_final,
    observacoes,
    forma_pagamento,
    condicao_pagamento,
    financeiro = {},
    empresa = {}
  } = dadosVenda

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0)
  }

  const formatarData = (data) => {
    if (!data) return new Date().toLocaleDateString('pt-BR')
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarDataHora = (data) => {
    if (!data) return new Date().toLocaleString('pt-BR')
    return new Date(data).toLocaleString('pt-BR')
  }

  // Calcular total dos produtos
  const totalProdutos = produtos.reduce((total, produto) => {
    return total + ((produto.quantidade || 0) * (produto.valor_unitario || 0))
  }, 0)

  const descontoTotal = parseFloat(desconto) || 0
  const valorFinalCalculado = totalProdutos - descontoTotal

  return (
    <div ref={ref} style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: 'white',
      color: 'black',
      maxWidth: '800px',
      margin: '0 auto',
      fontSize: '14px',
      lineHeight: '1.4'
    }}>
      {/* cabeçalho da Empresa */}
      <Box style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '15px' }}>
        <Typography variant="h4" style={{ fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
          {empresa?.nome || operacao?.empresa?.nome || 'EMPRESA'}
        </Typography>
        {empresa?.cnpj && (
          <Typography variant="body2" style={{ color: '#666' }}>
            CNPJ: {empresa.cnpj}
          </Typography>
        )}
        {empresa?.endereco && (
          <Typography variant="body2" style={{ color: '#666' }}>
            {empresa.endereco}
          </Typography>
        )}
        {empresa?.telefone && (
          <Typography variant="body2" style={{ color: '#666' }}>
            Telefone: {empresa.telefone}
          </Typography>
        )}
      </Box>

      {/* Título do Documento */}
      <Box style={{ textAlign: 'center', marginBottom: '25px' }}>
        <Typography variant="h5" style={{ fontWeight: 'bold', marginBottom: '5px' }}>
          PEDIDO DE VENDA
        </Typography>
        <Typography variant="h6" style={{ color: '#666' }}>
          Operação: {operacao?.nome_operacao || operacao?.nome || 'Operação não definida'}
        </Typography>
        <Typography variant="body1" style={{ fontWeight: 'bold', marginTop: '5px' }}>
          Documento Nº: {numero_venda || 'S/N'}
        </Typography>
        <Typography variant="body2" style={{ color: '#666' }}>
          Data: {formatarDataHora(data_venda)}
        </Typography>
      </Box>

      <Divider style={{ marginBottom: '20px' }} />

      {/* Informações do Cliente e Vendedor */}
      <Box style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Box style={{ flex: 1, marginRight: '20px', border: '1px solid #ddd', padding: '10px' }}>
          <Typography variant="h6" style={{ fontWeight: 'bold', marginBottom: '10px', backgroundColor: '#f5f5f5', padding: '5px' }}>
            DADOS DO CLIENTE
          </Typography>
          <Typography variant="body2" style={{ marginBottom: '3px' }}>
            <strong>Nome:</strong> {cliente?.nome || cliente?.razao_social || 'Cliente não informado'}
          </Typography>
          {cliente?.cpf_cnpj && (
            <Typography variant="body2" style={{ marginBottom: '3px' }}>
              <strong>CPF/CNPJ:</strong> {cliente.cpf_cnpj}
            </Typography>
          )}
          {cliente?.endereco && (
            <Typography variant="body2" style={{ marginBottom: '3px' }}>
              <strong>Endereço:</strong> {cliente.endereco}
            </Typography>
          )}
          {cliente?.telefone && (
            <Typography variant="body2" style={{ marginBottom: '3px' }}>
              <strong>Telefone:</strong> {cliente.telefone}
            </Typography>
          )}
          {cliente?.email && (
            <Typography variant="body2" style={{ marginBottom: '3px' }}>
              <strong>E-mail:</strong> {cliente.email}
            </Typography>
          )}
          {cliente?.cidade && (
            <Typography variant="body2" style={{ marginBottom: '3px' }}>
              <strong>Cidade:</strong> {cliente.cidade}
            </Typography>
          )}
          {cliente?.estado && (
            <Typography variant="body2" style={{ marginBottom: '3px' }}>
              <strong>Estado:</strong> {cliente.estado}
            </Typography>
          )}
          {cliente?.cep && (
            <Typography variant="body2" style={{ marginBottom: '3px' }}>
              <strong>CEP:</strong> {cliente.cep}
            </Typography>
          )}
        </Box>

        <Box style={{ flex: 1, border: '1px solid #ddd', padding: '10px' }}>
          <Typography variant="h6" style={{ fontWeight: 'bold', marginBottom: '10px', backgroundColor: '#f5f5f5', padding: '5px' }}>
            DADOS DO VENDEDOR
          </Typography>
          <Typography variant="body2" style={{ marginBottom: '3px' }}>
            <strong>Nome:</strong> {vendedor?.nome || 'Vendedor não informado'}
          </Typography>
          {vendedor?.codigo && (
            <Typography variant="body2" style={{ marginBottom: '3px' }}>
              <strong>Código:</strong> {vendedor.codigo}
            </Typography>
          )}
          {vendedor?.telefone && (
            <Typography variant="body2" style={{ marginBottom: '3px' }}>
              <strong>Telefone:</strong> {vendedor.telefone}
            </Typography>
          )}
          {vendedor?.email && (
            <Typography variant="body2" style={{ marginBottom: '3px' }}>
              <strong>E-mail:</strong> {vendedor.email}
            </Typography>
          )}
          <Typography variant="body2" style={{ marginBottom: '3px' }}>
            <strong>Operação:</strong> {operacao?.nome_operacao || operacao?.nome || 'Operação não definida'}
          </Typography>
        </Box>
      </Box>

      <Divider style={{ marginBottom: '20px' }} />

      {/* Tabela de Produtos */}
      <Typography variant="h6" style={{ fontWeight: 'bold', marginBottom: '15px', backgroundColor: '#f5f5f5', padding: '8px' }}>
        PRODUTOS VENDIDOS
      </Typography>
      
      <TableContainer style={{ marginBottom: '20px' }}>
        <Table size="small" style={{ border: '2px solid #333' }}>
          <TableHead>
            <TableRow style={{ backgroundColor: '#e0e0e0' }}>
              <TableCell style={{ fontWeight: 'bold', border: '1px solid #333', fontSize: '12px' }}>Código</TableCell>
              <TableCell style={{ fontWeight: 'bold', border: '1px solid #333', fontSize: '12px' }}>Produto</TableCell>
              <TableCell style={{ fontWeight: 'bold', border: '1px solid #333', textAlign: 'center', fontSize: '12px' }}>Qtd</TableCell>
              <TableCell style={{ fontWeight: 'bold', border: '1px solid #333', textAlign: 'right', fontSize: '12px' }}>Valor Unit.</TableCell>
              <TableCell style={{ fontWeight: 'bold', border: '1px solid #333', textAlign: 'right', fontSize: '12px' }}>Desconto</TableCell>
              <TableCell style={{ fontWeight: 'bold', border: '1px solid #333', textAlign: 'right', fontSize: '12px' }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {produtos.map((produto, index) => {
              const subtotal = (produto.quantidade || 0) * (produto.valor_unitario || 0)
              const descontoProduto = produto.desconto_valor || 0
              const totalProduto = subtotal - descontoProduto
              
              return (
                <TableRow key={index}>
                  <TableCell style={{ border: '1px solid #333', fontSize: '11px' }}>
                    {produto.codigo_produto || produto.codigo || '-'}
                  </TableCell>
                  <TableCell style={{ border: '1px solid #333', fontSize: '11px' }}>
                    {produto.nome_produto || produto.nome || 'Produto sem nome'}
                  </TableCell>
                  <TableCell style={{ border: '1px solid #333', textAlign: 'center', fontSize: '11px' }}>
                    {produto.quantidade || 0}
                  </TableCell>
                  <TableCell style={{ border: '1px solid #333', textAlign: 'right', fontSize: '11px' }}>
                    {formatarMoeda(produto.valor_unitario)}
                  </TableCell>
                  <TableCell style={{ border: '1px solid #333', textAlign: 'right', fontSize: '11px' }}>
                    {formatarMoeda(descontoProduto)}
                  </TableCell>
                  <TableCell style={{ border: '1px solid #333', textAlign: 'right', fontSize: '11px', fontWeight: 'bold' }}>
                    {formatarMoeda(totalProduto)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totais */}
      <Box style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <Box style={{ minWidth: '350px', border: '2px solid #333', padding: '10px' }}>
          <Box style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #ddd' }}>
            <Typography variant="body2"><strong>Subtotal dos Produtos:</strong></Typography>
            <Typography variant="body2" style={{ fontWeight: 'bold' }}>{formatarMoeda(totalProdutos)}</Typography>
          </Box>
          
          {descontoTotal > 0 && (
            <Box style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #ddd' }}>
              <Typography variant="body2"><strong>Desconto Total:</strong></Typography>
              <Typography variant="body2" style={{ color: 'red', fontWeight: 'bold' }}>
                - {formatarMoeda(descontoTotal)}
              </Typography>
            </Box>
          )}
          
          <Box style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', backgroundColor: '#f0f0f0', marginTop: '5px' }}>
            <Typography variant="h6" style={{ fontWeight: 'bold' }}>
              VALOR TOTAL:
            </Typography>
            <Typography variant="h6" style={{ fontWeight: 'bold' }}>
              {formatarMoeda(valorFinalCalculado)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Informações Financeiras */}
      <Divider style={{ marginBottom: '15px' }} />
      <Typography variant="h6" style={{ fontWeight: 'bold', marginBottom: '10px', backgroundColor: '#f5f5f5', padding: '8px' }}>
        INFORMAÇÕES FINANCEIRAS
      </Typography>
      
      <Box style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <Box style={{ flex: 1, marginRight: '10px' }}>
          {forma_pagamento && (
            <Typography variant="body2" style={{ marginBottom: '5px' }}>
              <strong>Forma de Pagamento:</strong> {forma_pagamento}
            </Typography>
          )}
          {condicao_pagamento && (
            <Typography variant="body2" style={{ marginBottom: '5px' }}>
              <strong>Condiçéo:</strong> {condicao_pagamento}
            </Typography>
          )}
          {financeiro?.conta && (
            <Typography variant="body2" style={{ marginBottom: '5px' }}>
              <strong>Conta:</strong> {financeiro.conta}
            </Typography>
          )}
        </Box>
        <Box style={{ flex: 1 }}>
          {financeiro?.departamento && (
            <Typography variant="body2" style={{ marginBottom: '5px' }}>
              <strong>Departamento:</strong> {financeiro.departamento}
            </Typography>
          )}
          {financeiro?.vencimento && (
            <Typography variant="body2" style={{ marginBottom: '5px' }}>
              <strong>Vencimento:</strong> {formatarData(financeiro.vencimento)}
            </Typography>
          )}
          {financeiro?.valor_parcela && (
            <Typography variant="body2" style={{ marginBottom: '5px' }}>
              <strong>Valor da Parcela:</strong> {formatarMoeda(financeiro.valor_parcela)}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Observações */}
      {observacoes && (
        <>
          <Divider style={{ margin: '15px 0' }} />
          <Typography variant="h6" style={{ fontWeight: 'bold', marginBottom: '10px' }}>
            OBSERVAÇÕES
          </Typography>
          <Typography variant="body2" style={{ whiteSpace: 'pre-wrap', border: '1px solid #ddd', padding: '10px' }}>
            {observacoes}
          </Typography>
        </>
      )}

      {/* Rodapé */}
      <Box style={{ textAlign: 'center', marginTop: '40px', borderTop: '2px solid #333', paddingTop: '15px' }}>
        <Typography variant="body2" style={{ color: '#666', marginBottom: '5px' }}>
          Este documento foi gerado automaticamente pelo APERUS
        </Typography>
        <Typography variant="body2" style={{ color: '#666', fontSize: '12px' }}>
          Impresso em: {new Date().toLocaleString('pt-BR')}
        </Typography>
        {operacao?.empresa?.nome && (
          <Typography variant="body2" style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>
            {operacao.empresa.nome}
          </Typography>
        )}
      </Box>
    </div>
  )
})

VendaImpressao.displayName = 'VendaImpressao'

export default VendaImpressao