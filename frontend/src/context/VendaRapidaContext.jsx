import React, { createContext, useState, useContext, useMemo } from 'react';

const VendaRapidaContext = createContext();

export const useVendaRapida = () => useContext(VendaRapidaContext);

export const VendaRapidaProvider = ({ children }) => {
  // Todas as variáveis de estado que estavam em VendaRapidaPage
  // e que precisam ser persistidas entre navegações.
  const [parametros, setParametros] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [vendedor, setVendedor] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [descontoGeral, setDescontoGeral] = useState(0);
  const [valorDescontoGeral, setValorDescontoGeral] = useState(0);
  const [tabelasComerciais, setTabelasComerciais] = useState([]);
  const [tabelaComercial, setTabelaComercial] = useState(null);
  const [promocoesAtivas, setPromocoesAtivas] = useState({ quantidade: 0, dados: [] });
  const [operacoes, setOperacoes] = useState([]);
  const [operacao, setOperacao] = useState(null);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState(null);
  const [parcelas, setParcelas] = useState(1);
  const [dadosVenda, setDadosVenda] = useState({});
  const [vendaFinalizadaInfo, setVendaFinalizadaInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [numeroVenda, setNumeroVenda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', body: '', error: '' });
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isVendedorModalOpen, setIsVendedorModalOpen] = useState(false);
  const [isTabelaModalOpen, setIsTabelaModalOpen] = useState(false);
  const [isProdutoModalOpen, setIsProdutoModalOpen] = useState(false);
  const [isPagamentoModalOpen, setIsPagamentoModalOpen] = useState(false);
  const [isFinalizarVendaModalOpen, setIsFinalizarVendaModalOpen] = useState(false);
  const [isVendaOrigemModalOpen, setIsVendaOrigemModalOpen] = useState(false);
  const [isMenuOperacoesOpen, setIsMenuOperacoesOpen] = useState(false);
  const [isMenuTabelasOpen, setIsMenuTabelasOpen] = useState(false);
  const [isMenuFormasPagamentoOpen, setIsMenuFormasPagamentoOpen] = useState(false);

  // O useMemo garante que o objeto de contexto não seja recriado a cada renderização,
  // otimizando a performance.
  const value = useMemo(() => ({
    parametros, setParametros,
    usuario, setUsuario,
    vendedor, setVendedor,
    cliente, setCliente,
    itens, setItens,
    total, setTotal,
    subtotal, setSubtotal,
    descontoGeral, setDescontoGeral,
    valorDescontoGeral, setValorDescontoGeral,
    tabelasComerciais, setTabelasComerciais,
    tabelaComercial, setTabelaComercial,
    promocoesAtivas, setPromocoesAtivas,
    operacoes, setOperacoes,
    operacao, setOperacao,
    formasPagamento, setFormasPagamento,
    formaPagamento, setFormaPagamento,
    parcelas, setParcelas,
    dadosVenda, setDadosVenda,
    vendaFinalizadaInfo, setVendaFinalizadaInfo,
    isSubmitting, setIsSubmitting,
    numeroVenda, setNumeroVenda,
    isModalOpen, setIsModalOpen,
    modalContent, setModalContent,
    isClienteModalOpen, setIsClienteModalOpen,
    isVendedorModalOpen, setIsVendedorModalOpen,
    isTabelaModalOpen, setIsTabelaModalOpen,
    isProdutoModalOpen, setIsProdutoModalOpen,
    isPagamentoModalOpen, setIsPagamentoModalOpen,
    isFinalizarVendaModalOpen, setIsFinalizarVendaModalOpen,
    isVendaOrigemModalOpen, setIsVendaOrigemModalOpen,
    isMenuOperacoesOpen, setIsMenuOperacoesOpen,
    isMenuTabelasOpen, setIsMenuTabelasOpen,
    isMenuFormasPagamentoOpen, setIsMenuFormasPagamentoOpen
  }), [
    parametros, usuario, vendedor, cliente, itens, total, subtotal, descontoGeral, valorDescontoGeral,
    tabelasComerciais, tabelaComercial, promocoesAtivas, operacoes, operacao, formasPagamento,
    formaPagamento, parcelas, dadosVenda, vendaFinalizadaInfo, isSubmitting, numeroVenda,
    isModalOpen, modalContent, isClienteModalOpen, isVendedorModalOpen, isTabelaModalOpen,
    isProdutoModalOpen, isPagamentoModalOpen, isFinalizarVendaModalOpen, isVendaOrigemModalOpen,
    isMenuOperacoesOpen, isMenuTabelasOpen, isMenuFormasPagamentoOpen
  ]);

  return (
    <VendaRapidaContext.Provider value={value}>
      {children}
    </VendaRapidaContext.Provider>
  );
};