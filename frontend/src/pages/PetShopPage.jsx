import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Button, Alert, CircularProgress,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Card, CardContent, RadioGroup, FormControlLabel, Radio,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PrintIcon from '@mui/icons-material/Print';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useAuth } from '../context/AuthContext';

const PetShopPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [agendamentos, setAgendamentos] = useState([]);
  const [pets, setPets] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tiposServico, setTiposServico] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const { axiosInstance, user, permissions, isLoading: authLoading } = useAuth();

  // Estados para modais
  const [openNovoAgendamento, setOpenNovoAgendamento] = useState(false);
  const [openNovoPet, setOpenNovoPet] = useState(false);
  const [openAvaliacao, setOpenAvaliacao] = useState(false);
  const [openExcluir, setOpenExcluir] = useState(false);
  const [openEditarServico, setOpenEditarServico] = useState(false);
  const [editandoServico, setEditandoServico] = useState(null);
  const [openEditarStatus, setOpenEditarStatus] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState(null);
  const [formStatus, setFormStatus] = useState({
    status: '',
    data_conclusao: ''
  });
  const [openEditarSessao, setOpenEditarSessao] = useState(false);
  const [sessaoEditando, setSessaoEditando] = useState(null);
  const [formSessao, setFormSessao] = useState({
    status: '',
    data_realizacao: ''
  });
  const [openGerarFinanceiro, setOpenGerarFinanceiro] = useState(false);
  const [agendamentoFinanceiro, setAgendamentoFinanceiro] = useState(null);
  const [momentoPagamento, setMomentoPagamento] = useState('inicio');
  const [tipoPagamentoPacote, setTipoPagamentoPacote] = useState('completo');

  // Filtro de período - carregar do localStorage ou usar 'todos' como padrão
  const [filtroPeriodo, setFiltroPeriodo] = useState(() => {
    return localStorage.getItem('petshop_filtro_periodo') || 'todos';
  });

  const [formAgendamento, setFormAgendamento] = useState({
    id_pet: '',
    id_cliente: '',
    id_tipo_servico: '',
    data_agendamento: '',
    preco_servico: '',
    observacoes: '',
    tipo_agendamento: 'Único',
    quantidade_sessoes: 1,
    sessoes: []
  });

  const [formPet, setFormPet] = useState({
    id_cliente: '',
    nome_pet: '',
    raca: '',
    sexo: 'M',
    peso: '',
    cor: ''
  });

  const [formAvaliacao, setFormAvaliacao] = useState({
    id_agendamento: '',
    nota: 5,
    comentario: ''
  });

  const [itemExcluir, setItemExcluir] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [agendResp, petsResp, clientesResp, servicosResp, avaliacoesResp] = await Promise.all([
        axiosInstance.get('/agendamentos/'),
        axiosInstance.get('/pets/'),
        axiosInstance.get('/clientes/?page_size=1000'),
        axiosInstance.get('/tipo-servicos/'),
        axiosInstance.get('/avaliacoes/')
      ]);

      const _sa = d => Array.isArray(d) ? d : Array.isArray(d?.results) ? d.results : [];
      setAgendamentos(_sa(agendResp.data));
      setPets(_sa(petsResp.data));
      setClientes(_sa(clientesResp.data));
      setTiposServico(_sa(servicosResp.data));
      setAvaliacoes(_sa(avaliacoesResp.data));
    } catch (err) {
      setError('Erro ao carregar dados do pet shop');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [axiosInstance]);

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user?.is_staff && !permissions?.petshop_acessar) {
    return (
      <Box p={3}>
        <Alert severity="warning">Você não tem permissão para acessar Pet Shop.</Alert>
      </Box>
    );
  }

  // Salvar filtro no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('petshop_filtro_periodo', filtroPeriodo);
  }, [filtroPeriodo]);

  // Função para filtrar agendamentos por período
  const filtrarAgendamentosPorPeriodo = (agendamentos) => {
    if (filtroPeriodo === 'todos') {
      return agendamentos;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let dataLimite = new Date(hoje);

    switch (filtroPeriodo) {
      case 'hoje':
        dataLimite.setDate(hoje.getDate() + 1);
        break;
      case '3dias':
        dataLimite.setDate(hoje.getDate() + 3);
        break;
      case '5dias':
        dataLimite.setDate(hoje.getDate() + 5);
        break;
      case '10dias':
        dataLimite.setDate(hoje.getDate() + 10);
        break;
      default:
        return agendamentos;
    }

    return agendamentos.filter(agendamento => {
      // Para agendamentos únicos
      if (agendamento.tipo_agendamento === 'Único') {
        const dataAgendamento = new Date(agendamento.data_agendamento);
        dataAgendamento.setHours(0, 0, 0, 0);
        return dataAgendamento >= hoje && dataAgendamento < dataLimite;
      }

      // Para pacotes, verificar se alguma sessão está no período
      if (agendamento.sessoes && agendamento.sessoes.length > 0) {
        return agendamento.sessoes.some(sessao => {
          const dataSessao = new Date(sessao.data_sessao);
          dataSessao.setHours(0, 0, 0, 0);
          return dataSessao >= hoje && dataSessao < dataLimite;
        });
      }

      return false;
    });
  };

  // Aplicar filtro aos agendamentos
  const agendamentosFiltrados = filtrarAgendamentosPorPeriodo(agendamentos);

  const handleNovoAgendamento = async () => {
    // Validações básicas
    if (!formAgendamento.id_pet || !formAgendamento.id_cliente || !formAgendamento.id_tipo_servico) {
      setError('Selecione cliente, pet e serviço');
      return;
    }

    // Validar preço
    if (!formAgendamento.preco_servico || parseFloat(formAgendamento.preco_servico) <= 0) {
      setError('Preço do serviço inválido');
      return;
    }

    const tipoAgendamento = formAgendamento.tipo_agendamento === 'Pacote';

    // Se for pacote, validar datas das sessões
    if (tipoAgendamento) {
      if (!formAgendamento.sessoes || formAgendamento.sessoes.length === 0) {
        setError('Defina a quantidade de sessões');
        return;
      }

      // Verificar se todas as datas foram preenchidas
      const todasDatasPreenchidas = formAgendamento.sessoes.every(s => s.data_sessao && s.data_sessao.trim() !== '');
      if (!todasDatasPreenchidas) {
        setError('Preencha as datas de todas as sessões');
        return;
      }
    } else {
      // Se for único, validar data/hora
      if (!formAgendamento.data_agendamento) {
        setError('Preencha a data e hora do agendamento');
        return;
      }
    }

    const preco = tipoAgendamento
      ? parseFloat(formAgendamento.preco_servico) * formAgendamento.quantidade_sessoes
      : parseFloat(formAgendamento.preco_servico);

    // Se for pacote, usar a data da primeira sessão como data_agendamento principal
    let dataAgendamento = formAgendamento.data_agendamento;
    if (tipoAgendamento && formAgendamento.sessoes && formAgendamento.sessoes.length > 0) {
      dataAgendamento = formAgendamento.sessoes[0].data_sessao;
    }

    const payload = {
      id_pet: formAgendamento.id_pet,
      id_cliente: formAgendamento.id_cliente,
      id_tipo_servico: formAgendamento.id_tipo_servico,
      data_agendamento: dataAgendamento,
      preco_servico: formAgendamento.preco_servico,
      observacoes: formAgendamento.observacoes,
      tipo_agendamento: formAgendamento.tipo_agendamento,
      quantidade_sessoes: formAgendamento.quantidade_sessoes,
      preco_total_pacote: tipoAgendamento ? preco : 0
    };

    console.log('📤 Enviando agendamento:', payload);

    try {
      const response = await axiosInstance.post('/agendamentos/', payload);
      const agendamentoId = response.data.id_agendamento;

      // Criar sessões se for pacote
      if (tipoAgendamento && formAgendamento.sessoes && formAgendamento.sessoes.length > 0) {
        for (let i = 0; i < formAgendamento.sessoes.length; i++) {
          const sessao = formAgendamento.sessoes[i];
          if (sessao.data_sessao) {
            await axiosInstance.post('/sessoes-agendamento/', {
              id_agendamento: agendamentoId,
              numero_sessao: i + 1,
              data_sessao: sessao.data_sessao,
              status: 'Agendada'
            });
          }
        }
      }

      setOpenNovoAgendamento(false);
      setFormAgendamento({
        id_pet: '', id_cliente: '', id_tipo_servico: '', data_agendamento: '',
        preco_servico: '', observacoes: '', tipo_agendamento: 'Único',
        quantidade_sessoes: 1, sessoes: []
      });
      fetchData();
    } catch (err) {
      console.error('Erro completo:', err);

      // Tentar extrair todos os erros de validação
      let errorMsg = 'Erro ao criar agendamento. Verifique os dados.';

      if (err.response?.data) {
        const errorData = err.response.data;

        // Coletar todas as mensagens de erro
        const erros = [];
        Object.keys(errorData).forEach(campo => {
          if (Array.isArray(errorData[campo])) {
            erros.push(...errorData[campo]);
          } else if (typeof errorData[campo] === 'string') {
            erros.push(errorData[campo]);
          }
        });

        if (erros.length > 0) {
          errorMsg = erros.join('. ');
        }
      }

      setError(errorMsg);
    }
  };

  const handleNovoPet = async () => {
    if (!formPet.id_cliente || !formPet.nome_pet) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }
    try {
      await axiosInstance.post('/pets/', formPet);
      setOpenNovoPet(false);
      setFormPet({ id_cliente: '', nome_pet: '', raca: '', sexo: 'M', peso: '', cor: '' });
      fetchData();
    } catch (err) {
      setError('Erro ao criar pet');
      console.error(err);
    }
  };

  const handleNovaAvaliacao = async () => {
    if (!formAvaliacao.id_agendamento) {
      setError('Selecione um agendamento');
      return;
    }
    try {
      await axiosInstance.post('/avaliacoes/', formAvaliacao);
      setOpenAvaliacao(false);
      setFormAvaliacao({ id_agendamento: '', nota: 5, comentario: '' });
      fetchData();
    } catch (err) {
      setError('Erro ao criar avaliação');
      console.error(err);
    }
  };

  const handleExcluir = async () => {
    try {
      if (itemExcluir.tipo === 'agendamento') {
        await axiosInstance.delete(`/agendamentos/${itemExcluir.id}/`);
      } else if (itemExcluir.tipo === 'pet') {
        await axiosInstance.delete(`/pets/${itemExcluir.id}/`);
      } else if (itemExcluir.tipo === 'servico') {
        await axiosInstance.delete(`/tipo-servicos/${itemExcluir.id}/`);
      }
      setOpenExcluir(false);
      setItemExcluir(null);
      fetchData();
    } catch (err) {
      setError('Erro ao excluir');
      console.error(err);
    }
  };

  const handleEditarStatus = async () => {
    if (!formStatus.status) {
      setError('Selecione um status');
      return;
    }

    try {
      const payload = {
        status: formStatus.status
      };

      // Se o status for "Concluído" e uma data foi informada, incluir data_conclusao
      if (formStatus.status === 'Concluído' && formStatus.data_conclusao) {
        payload.data_conclusao = formStatus.data_conclusao;
      }

      await axiosInstance.patch(`/agendamentos/${agendamentoEditando.id_agendamento}/`, payload);

      setOpenEditarStatus(false);
      setAgendamentoEditando(null);
      setFormStatus({ status: '', data_conclusao: '' });
      fetchData();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      const errorMsg = err.response?.data?.status?.[0] ||
        err.response?.data?.detail ||
        'Erro ao atualizar status';
      setError(errorMsg);
    }
  };

  const handleEditarSessao = async () => {
    if (!formSessao.status) {
      setError('Selecione um status');
      return;
    }

    try {
      const payload = {
        status: formSessao.status
      };

      // Se o status for "Concluída" e uma data foi informada, incluir data_realizacao
      if (formSessao.status === 'Concluída' && formSessao.data_realizacao) {
        payload.data_realizacao = formSessao.data_realizacao;
      } else if (formSessao.status === 'Concluída' && !formSessao.data_realizacao) {
        // Se não informou data, usar a data atual
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const localDate = new Date(now.getTime() - (offset * 60 * 1000));
        payload.data_realizacao = localDate.toISOString().slice(0, 16);
      }

      await axiosInstance.patch(`/sessoes-agendamento/${sessaoEditando.id_sessao}/`, payload);

      setOpenEditarSessao(false);
      setSessaoEditando(null);
      setFormSessao({ status: '', data_realizacao: '' });
      fetchData();
    } catch (err) {
      console.error('Erro ao atualizar sessão:', err);
      const errorMsg = err.response?.data?.status?.[0] ||
        err.response?.data?.detail ||
        'Erro ao atualizar sessão';
      setError(errorMsg);
    }
  };

  const handleGerarFinanceiro = async () => {
    try {
      const agendamento = agendamentoFinanceiro;
      const isPacote = agendamento.tipo_agendamento === 'Pacote';

      // Buscar contas existentes para este agendamento
      const responseContas = await axiosInstance.get('/contas/', {
        params: { tipo_conta: 'Receber' }
      });

      const contasExistentes = responseContas.data.filter(c =>
        c.documento_numero && (
          c.documento_numero === `AGD-${agendamento.id_agendamento}` ||
          c.documento_numero.startsWith(`AGD-${agendamento.id_agendamento}-`)
        )
      );

      // Se for pacote e escolheu por sessão, gerar uma conta para cada sessão
      if (isPacote && tipoPagamentoPacote === 'sessao') {
        const sessoes = agendamento.sessoes || [];
        if (sessoes.length === 0) {
          setError('Nenhuma sessão encontrada no pacote');
          return;
        }

        // Verificar quais sessões já têm financeiro gerado
        const sessoesComFinanceiro = contasExistentes
          .map(c => {
            const match = c.documento_numero.match(/AGD-\d+-S(\d+)/);
            return match ? parseInt(match[1]) : null;
          })
          .filter(n => n !== null);

        const valorPorSessao = parseFloat(agendamento.preco_servico || 0);
        let contasGeradas = 0;

        for (let i = 0; i < sessoes.length; i++) {
          const sessao = sessoes[i];

          // Verificar se esta sessão já tem financeiro gerado
          if (sessoesComFinanceiro.includes(sessao.numero_sessao)) {
            console.log(`Sessão ${sessao.numero_sessao} já possui financeiro gerado`);
            continue;
          }

          // Data de vencimento da sessão
          let dataVencimento;
          if (momentoPagamento === 'inicio') {
            dataVencimento = new Date(sessao.data_sessao).toISOString().split('T')[0];
          } else {
            dataVencimento = sessao.data_realizacao
              ? new Date(sessao.data_realizacao).toISOString().split('T')[0]
              : new Date(sessao.data_sessao).toISOString().split('T')[0];
          }

          const payload = {
            tipo_conta: 'Receber',
            id_cliente_fornecedor: agendamento.id_cliente,
            descricao: `Pet Shop - ${agendamento.servico_nome} - ${agendamento.pet_nome} - Sessão ${sessao.numero_sessao}`,
            valor_parcela: valorPorSessao,
            valor_liquidado: 0,
            data_vencimento: dataVencimento,
            status_conta: 'Pendente',
            parcela_numero: sessao.numero_sessao,
            parcela_total: sessoes.length,
            documento_numero: `AGD-${agendamento.id_agendamento}-S${sessao.numero_sessao}`,
            gerencial: false
          };

          await axiosInstance.post('/contas/', payload);
          contasGeradas++;
        }

        if (contasGeradas === 0) {
          alert('⚠️ Todas as sessões já possuem financeiro gerado!');
        } else if (contasGeradas === sessoes.length) {
          alert(`✅ ${contasGeradas} contas geradas com sucesso (uma por sessão)!`);
        } else {
          alert(`✅ ${contasGeradas} de ${sessoes.length} contas geradas com sucesso!\n${sessoes.length - contasGeradas} sessões já possuíam financeiro.`);
        }
      } else {
        // Verificar se já existe financeiro completo
        const financeiroCompleto = contasExistentes.find(c =>
          c.documento_numero === `AGD-${agendamento.id_agendamento}`
        );

        if (financeiroCompleto) {
          alert('⚠️ Este agendamento já possui financeiro gerado!\n\nPara gerar financeiro por sessão, selecione a opção "Gerar por Sessão".');
          setOpenGerarFinanceiro(false);
          setAgendamentoFinanceiro(null);
          return;
        }

        // Verificar se já existem financeiros por sessão
        if (contasExistentes.length > 0) {
          alert('⚠️ Este agendamento já possui financeiro gerado por sessão!\n\nNão é possível gerar financeiro completo.');
          setOpenGerarFinanceiro(false);
          setAgendamentoFinanceiro(null);
          return;
        }

        // Gerar financeiro completo (comportamento original)
        const valorTotal = isPacote
          ? parseFloat(agendamento.preco_total_pacote || 0)
          : parseFloat(agendamento.preco_servico || 0);

        let dataVencimento;
        if (momentoPagamento === 'inicio') {
          dataVencimento = new Date(agendamento.data_agendamento).toISOString().split('T')[0];
        } else {
          dataVencimento = agendamento.data_conclusao
            ? new Date(agendamento.data_conclusao).toISOString().split('T')[0]
            : new Date(agendamento.data_agendamento).toISOString().split('T')[0];
        }

        const payload = {
          tipo_conta: 'Receber',
          id_cliente_fornecedor: agendamento.id_cliente,
          descricao: `Pet Shop - ${agendamento.servico_nome} - ${agendamento.pet_nome}${isPacote ? ' (Pacote Completo)' : ''}`,
          valor_parcela: valorTotal,
          valor_liquidado: 0,
          data_vencimento: dataVencimento,
          status_conta: 'Pendente',
          parcela_numero: 1,
          parcela_total: 1,
          documento_numero: `AGD-${agendamento.id_agendamento}`,
          gerencial: false
        };

        await axiosInstance.post('/contas/', payload);
        alert('✅ Financeiro gerado com sucesso!');
      }

      setOpenGerarFinanceiro(false);
      setAgendamentoFinanceiro(null);
      setMomentoPagamento('inicio');
      setTipoPagamentoPacote('completo');
    } catch (err) {
      console.error('Erro ao gerar financeiro:', err);
      const errorMsg = err.response?.data?.detail ||
        'Erro ao gerar financeiro';
      setError(errorMsg);
    }
  };

  const handleImprimirAgendamento = async (agendamento) => {
    // Buscar informações financeiras do agendamento pelo documento_numero
    let valorPago = 0;
    let valorAberto = 0;
    let statusFinanceiro = 'Não gerado';

    try {
      // Buscar todas as contas do tipo Receber
      const response = await axiosInstance.get('/contas/', {
        params: {
          tipo_conta: 'Receber'
        }
      });

      if (response.data && response.data.length > 0) {
        // Filtrar contas que pertencem a este agendamento
        // Formato: AGD-{id} ou AGD-{id}-S{numero_sessao}
        const contasAgendamento = response.data.filter(c =>
          c.documento_numero && (
            c.documento_numero === `AGD-${agendamento.id_agendamento}` ||
            c.documento_numero.startsWith(`AGD-${agendamento.id_agendamento}-`)
          )
        );

        if (contasAgendamento.length > 0) {
          valorPago = contasAgendamento
            .filter(c => c.status_conta === 'Paga')
            .reduce((sum, c) => sum + parseFloat(c.valor_parcela || 0), 0);
          valorAberto = contasAgendamento
            .filter(c => c.status_conta !== 'Paga')
            .reduce((sum, c) => sum + parseFloat(c.valor_parcela || 0), 0);

          if (valorAberto === 0 && valorPago > 0) {
            statusFinanceiro = 'Pago';
          } else if (valorPago > 0 && valorAberto > 0) {
            statusFinanceiro = 'Parcialmente pago';
          } else if (valorAberto > 0) {
            statusFinanceiro = 'Em aberto';
          }
        }
      }
    } catch (err) {
      console.log('Erro ao buscar informações financeiras:', err);
    }

    const printWindow = window.open('', '_blank');

    // Formatar valores
    const valorTotalNum = agendamento.tipo_agendamento === 'Pacote'
      ? parseFloat(agendamento.preco_total_pacote || 0)
      : parseFloat(agendamento.preco_servico || 0);
    const valorTotal = valorTotalNum.toFixed(2).replace('.', ',');
    const valorPagoFormatado = valorPago.toFixed(2).replace('.', ',');
    const valorAbertoFormatado = valorAberto.toFixed(2).replace('.', ',');

    // Montar HTML da impressão
    let sessoesHTML = '';
    if (agendamento.tipo_agendamento === 'Pacote' && agendamento.sessoes?.length > 0) {
      sessoesHTML = `
        <div style="margin: 20px 0;">
          <div style="font-weight: bold; color: #333; margin-bottom: 8px; font-size: 14px;">Sessões:</div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left; font-size: 13px;">Sessão</th>
                <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left; font-size: 13px;">Data</th>
                <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left; font-size: 13px;">Horário</th>
                <th style="border: 1px solid #dee2e6; padding: 10px; text-align: center; font-size: 13px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${agendamento.sessoes.map((sessao, index) => `
                <tr>
                  <td style="border: 1px solid #dee2e6; padding: 10px; font-size: 13px;">Sessão ${index + 1}</td>
                  <td style="border: 1px solid #dee2e6; padding: 10px; font-size: 13px;">
                    ${new Date(sessao.data_sessao).toLocaleDateString('pt-BR')}
                  </td>
                  <td style="border: 1px solid #dee2e6; padding: 10px; font-size: 13px;">${sessao.horario || '-'}</td>
                  <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center; font-size: 13px;">
                    <span style="padding: 4px 12px; border-radius: 12px; background-color: ${sessao.status === 'Concluída' ? '#d4edda' :
          sessao.status === 'Cancelada' ? '#f8d7da' : '#fff3cd'
        }; color: ${sessao.status === 'Concluída' ? '#155724' :
          sessao.status === 'Cancelada' ? '#721c24' : '#856404'
        }; font-size: 12px; font-weight: 500;">
                      ${sessao.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      sessoesHTML = `
        <div style="margin: 20px 0;">
          <div style="font-weight: bold; color: #333; margin-bottom: 4px; font-size: 14px;">Data e Horário:</div>
          <div style="color: #495057; font-size: 13px;">
            ${new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')} às ${agendamento.horario || '-'}
          </div>
        </div>
      `;
    }

    const observacoesHTML = agendamento.observacoes ? `
      <div style="margin: 20px 0;">
        <div style="font-weight: bold; color: #333; margin-bottom: 4px; font-size: 14px;">Observações:</div>
        <div style="color: #495057; font-size: 13px; white-space: pre-wrap;">${agendamento.observacoes}</div>
      </div>
    ` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Agendamento #${agendamento.id_agendamento}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 30px;
              background: white;
              color: #212529;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #0d6efd;
            }
            .header h1 {
              color: #0d6efd;
              font-size: 28px;
              margin-bottom: 5px;
            }
            .header .subtitle {
              color: #6c757d;
              font-size: 14px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 20px 0;
            }
            .info-item {
              margin: 15px 0;
            }
            .info-label {
              font-weight: bold;
              color: #333;
              margin-bottom: 4px;
              font-size: 14px;
            }
            .info-value {
              color: #495057;
              font-size: 13px;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 500;
            }
            .status-agendado {
              background-color: #fff3cd;
              color: #856404;
            }
            .status-concluido {
              background-color: #d4edda;
              color: #155724;
            }
            .status-cancelado {
              background-color: #f8d7da;
              color: #721c24;
            }
            .valor-destaque {
              font-size: 20px;
              font-weight: bold;
              color: #198754;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #dee2e6;
              text-align: center;
              color: #6c757d;
              font-size: 12px;
            }
            @media print {
              body {
                padding: 20px;
              }
              .container {
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Agendamento #${agendamento.id_agendamento}</h1>
              <div class="subtitle">Comprovante de Agendamento Pet Shop</div>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Pet:</div>
                <div class="info-value">${agendamento.pet_nome}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Cliente:</div>
                <div class="info-value">${agendamento.cliente_nome}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Serviço:</div>
                <div class="info-value">${agendamento.servico_nome}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Tipo:</div>
                <div class="info-value">${agendamento.tipo_agendamento}</div>
              </div>
            </div>
            
            ${sessoesHTML}
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Valor Total:</div>
                <div class="valor-destaque">R$ ${valorTotal}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Status:</div>
                <div>
                  <span class="status-badge ${agendamento.status === 'Concluído' ? 'status-concluido' :
        agendamento.status === 'Cancelado' ? 'status-cancelado' : 'status-agendado'
      }">
                    ${agendamento.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid ${statusFinanceiro === 'Pago' ? '#198754' : statusFinanceiro === 'Parcialmente pago' ? '#ffc107' : statusFinanceiro === 'Em aberto' ? '#dc3545' : '#6c757d'};">
              <div style="font-weight: bold; color: #333; margin-bottom: 12px; font-size: 16px;">Situação Financeira</div>
              <div class="info-grid">
                <div class="info-item" style="margin: 8px 0;">
                  <div class="info-label">Status:</div>
                  <div style="color: ${statusFinanceiro === 'Pago' ? '#198754' : statusFinanceiro === 'Parcialmente pago' ? '#ffc107' : statusFinanceiro === 'Em aberto' ? '#dc3545' : '#6c757d'}; font-weight: bold; font-size: 14px;">
                    ${statusFinanceiro}
                  </div>
                </div>
                
                <div class="info-item" style="margin: 8px 0;">
                  <div class="info-label">Valor Pago:</div>
                  <div style="color: #198754; font-weight: bold; font-size: 16px;">R$ ${valorPagoFormatado}</div>
                </div>
                
                <div class="info-item" style="margin: 8px 0;">
                  <div class="info-label">Valor em Aberto:</div>
                  <div style="color: ${valorAberto > 0 ? '#dc3545' : '#6c757d'}; font-weight: bold; font-size: 16px;">R$ ${valorAbertoFormatado}</div>
                </div>
              </div>
            </div>
            
            ${observacoesHTML}
            
            <div class="footer">
              <div>Documento impresso em ${new Date().toLocaleString('pt-BR')}</div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleEditarServico = async () => {
    try {
      await axiosInstance.put(`/tipo-servicos/${editandoServico.id_tipo_servico}/`, editandoServico);
      setOpenEditarServico(false);
      setEditandoServico(null);
      fetchData();
    } catch (err) {
      setError('Erro ao atualizar serviço');
      console.error(err);
    }
  };

  const handleAbrirEditarServico = (servico) => {
    setEditandoServico({ ...servico });
    setOpenEditarServico(true);
  };

  const gerarSessoes = (quantidade) => {
    const sessoes = [];
    for (let i = 0; i < quantidade; i++) {
      sessoes.push({ data_sessao: '', data_realizacao: null, numero_sessao: i + 1 });
    }
    return sessoes;
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ p: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
          <Tab label={`Agendamentos (${agendamentosFiltrados.length})`} />
          <Tab label={`Meus Pets (${pets.length})`} />
          <Tab label={`Avaliações (${avaliacoes.length})`} />
          <Tab label="Serviços Disponíveis" />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 3 }}>
        {/* TAB 0: AGENDAMENTOS */}
        {tabValue === 0 && (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6">Agendamentos de Banho e Tosa</Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={filtroPeriodo}
                    label="Período"
                    onChange={(e) => setFiltroPeriodo(e.target.value)}
                    startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    <MenuItem value="hoje">Hoje</MenuItem>
                    <MenuItem value="3dias">Próximos 3 dias</MenuItem>
                    <MenuItem value="5dias">Próximos 5 dias</MenuItem>
                    <MenuItem value="10dias">Próximos 10 dias</MenuItem>
                    <MenuItem value="todos">Todos</MenuItem>
                  </Select>
                </FormControl>

                {filtroPeriodo !== 'todos' && agendamentos.length !== agendamentosFiltrados.length && (
                  <Chip
                    label={`${agendamentosFiltrados.length} de ${agendamentos.length}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setFormAgendamento({
                      id_pet: '',
                      id_cliente: '',
                      id_tipo_servico: '',
                      data_agendamento: '',
                      preco_servico: '',
                      observacoes: '',
                      tipo_agendamento: 'Único',
                      quantidade_sessoes: 1,
                      sessoes: []
                    });
                    setOpenNovoAgendamento(true);
                  }}
                >
                  Novo Agendamento
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><strong>Data/Hora</strong></TableCell>
                    <TableCell><strong>Pet</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Serviço</strong></TableCell>
                    <TableCell align="right"><strong>Valor</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agendamentosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3, color: '#999' }}>
                        Nenhum agendamento
                      </TableCell>
                    </TableRow>
                  ) : (
                    agendamentosFiltrados.map((agendamento) => (
                      <React.Fragment key={agendamento.id_agendamento}>
                        <TableRow>
                          <TableCell>
                            {new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')}
                            {' '}
                            {new Date(agendamento.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {agendamento.status === 'Concluído' && agendamento.data_conclusao && (
                              <Typography variant="caption" display="block" color="success.main" sx={{ mt: 0.5 }}>
                                ✓ Concluído em: {new Date(agendamento.data_conclusao).toLocaleDateString('pt-BR')} {new Date(agendamento.data_conclusao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{agendamento.pet_nome}</TableCell>
                          <TableCell>{agendamento.cliente_nome}</TableCell>
                          <TableCell>{agendamento.servico_nome}</TableCell>
                          <TableCell align="right">
                            R$ {agendamento.tipo_agendamento === 'Pacote'
                              ? parseFloat(agendamento.preco_total_pacote || 0).toFixed(2)
                              : parseFloat(agendamento.preco_servico || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={agendamento.tipo_agendamento || 'Único'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={agendamento.status}
                              color={
                                agendamento.status === 'Concluído' ? 'success' :
                                  agendamento.status === 'Cancelado' ? 'error' :
                                    agendamento.status === 'Em Andamento' ? 'warning' :
                                      'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleImprimirAgendamento(agendamento)}
                              title="Imprimir"
                            >
                              <PrintIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                setAgendamentoFinanceiro(agendamento);
                                setMomentoPagamento('inicio');
                                setOpenGerarFinanceiro(true);
                              }}
                              title="Gerar Financeiro"
                            >
                              <AttachMoneyIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setAgendamentoEditando(agendamento);
                                setFormStatus({
                                  status: agendamento.status,
                                  data_conclusao: agendamento.data_conclusao || ''
                                });
                                setOpenEditarStatus(true);
                              }}
                              title="Editar Status"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setItemExcluir({ id: agendamento.id_agendamento, tipo: 'agendamento' });
                                setOpenExcluir(true);
                              }}
                              title="Excluir"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        {/* Mostrar sessões do pacote */}
                        {agendamento.tipo_agendamento === 'Pacote' && agendamento.sessoes && agendamento.sessoes.length > 0 && (
                          <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                            <TableCell colSpan={8} sx={{ p: 2 }}>
                              <Box sx={{ ml: 4 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                  Sessões ({agendamento.sessoes.length})
                                </Typography>
                                <Grid container spacing={1}>
                                  {agendamento.sessoes.map((sessao, idx) => (
                                    <Grid item xs={12} sm={6} md={4} key={sessao.id_sessao}>
                                      <Card variant="outlined" sx={{ p: 1.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                          Sessão {sessao.numero_sessao}
                                        </Typography>
                                        <Typography variant="caption" display="block">
                                          Agendada: {new Date(sessao.data_sessao).toLocaleDateString('pt-BR')}
                                        </Typography>
                                        {sessao.data_realizacao && (
                                          <Typography variant="caption" display="block" sx={{ color: 'green' }}>
                                            ✓ Realizada: {new Date(sessao.data_realizacao).toLocaleDateString('pt-BR')}
                                          </Typography>
                                        )}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                          <Chip
                                            label={sessao.status}
                                            size="small"
                                            color={
                                              sessao.status === 'Concluída' ? 'success' :
                                                sessao.status === 'Cancelada' ? 'error' :
                                                  'default'
                                            }
                                          />
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => {
                                              setSessaoEditando(sessao);
                                              setFormSessao({
                                                status: sessao.status,
                                                data_realizacao: sessao.data_realizacao || ''
                                              });
                                              setOpenEditarSessao(true);
                                            }}
                                            title="Editar Sessão"
                                          >
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      </Card>
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 1: MEUS PETS */}
        {tabValue === 1 && (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Meus Pets</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setFormPet({
                    id_cliente: '',
                    nome_pet: '',
                    raca: '',
                    sexo: 'M',
                    peso: '',
                    cor: ''
                  });
                  setOpenNovoPet(true);
                }}
              >
                Novo Pet
              </Button>
            </Box>

            <Grid container spacing={2}>
              {pets.length === 0 ? (
                <Grid item xs={12}>
                  <Typography color="textSecondary" align="center">Nenhum pet cadastrado</Typography>
                </Grid>
              ) : (
                pets.map((pet) => (
                  <Grid item xs={12} sm={6} md={4} key={pet.id_pet}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{pet.nome_pet}</Typography>
                        <Typography color="textSecondary" variant="body2">
                          Raça: {pet.raca || '-'}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                          Sexo: {pet.sexo === 'M' ? 'Macho' : 'Fêmea'}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                          Peso: {pet.peso ? `${pet.peso} kg` : '-'}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                          Cor: {pet.cor || '-'}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            color="error"
                            onClick={() => {
                              setItemExcluir({ id: pet.id_pet, tipo: 'pet' });
                              setOpenExcluir(true);
                            }}
                          >
                            Excluir
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>
        )}

        {/* TAB 2: AVALIAÇÕES */}
        {tabValue === 2 && (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Avaliações de Serviços</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAvaliacao(true)}
              >
                Nova Avaliação
              </Button>
            </Box>

            <Grid container spacing={2}>
              {avaliacoes.length === 0 ? (
                <Grid item xs={12}>
                  <Typography color="textSecondary" align="center">Nenhuma avaliação</Typography>
                </Grid>
              ) : (
                avaliacoes.map((avaliacao) => (
                  <Grid item xs={12} sm={6} md={4} key={avaliacao.id_avaliacao}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">
                          {'⭐'.repeat(avaliacao.nota)}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                          Cliente: {avaliacao.cliente_nome}
                        </Typography>
                        <Typography sx={{ mt: 1 }}>
                          {avaliacao.comentario}
                        </Typography>
                        <Typography color="textSecondary" variant="caption">
                          {new Date(avaliacao.data_avaliacao).toLocaleDateString('pt-BR')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>
        )}

        {/* TAB 3: SERVIÇOS DISPONÍVEIS */}
        {tabValue === 3 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Serviços de Banho e Tosa</Typography>
            <Grid container spacing={2}>
              {tiposServico.length === 0 ? (
                <Grid item xs={12}>
                  <Typography color="textSecondary" align="center">Nenhum serviço disponível</Typography>
                </Grid>
              ) : (
                tiposServico.map((servico) => (
                  <Grid item xs={12} sm={6} md={4} key={servico.id_tipo_servico}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6">{servico.nome_servico}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleAbrirEditarServico(servico)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setItemExcluir({ id: servico.id_tipo_servico, tipo: 'servico' });
                                setOpenExcluir(true);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography color="textSecondary" variant="body2">
                          {servico.descricao}
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 1, color: '#2e7d32' }}>
                          R$ {parseFloat(servico.preco_base || 0).toFixed(2)}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                          Duração: {servico.duracao_minutos} minutos
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={servico.ativo ? 'Ativo' : 'Inativo'}
                            color={servico.ativo ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* DIALOG: NOVO AGENDAMENTO */}
      <Dialog open={openNovoAgendamento} onClose={() => setOpenNovoAgendamento(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Agendamento</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Cliente *</InputLabel>
            <Select
              value={formAgendamento.id_cliente}
              label="Cliente *"
              onChange={(e) => {
                setFormAgendamento({ ...formAgendamento, id_cliente: e.target.value });
                const cliente = clientes.find(c => c.id_cliente === e.target.value);
                const petsDo = pets.filter(p => p.id_cliente === e.target.value);
              }}
            >
              {clientes.map(cliente => (
                <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                  {cliente.nome_razao_social}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Pet *</InputLabel>
            <Select
              value={formAgendamento.id_pet}
              label="Pet *"
              onChange={(e) => {
                const petSelecionado = pets.find(p => p.id_pet === e.target.value);
                if (petSelecionado) {
                  setFormAgendamento({
                    ...formAgendamento,
                    id_pet: e.target.value,
                    id_cliente: petSelecionado.id_cliente
                  });
                }
              }}
            >
              {pets.filter(p => p.id_cliente === formAgendamento.id_cliente).map(pet => (
                <MenuItem key={pet.id_pet} value={pet.id_pet}>
                  {pet.nome_pet}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Serviço *</InputLabel>
            <Select
              value={formAgendamento.id_tipo_servico}
              label="Serviço *"
              onChange={(e) => {
                setFormAgendamento({ ...formAgendamento, id_tipo_servico: e.target.value });
                const servico = tiposServico.find(s => s.id_tipo_servico === e.target.value);
                if (servico) {
                  setFormAgendamento(prev => ({ ...prev, preco_servico: servico.preco_base }));
                }
              }}
            >
              {tiposServico.map(servico => (
                <MenuItem key={servico.id_tipo_servico} value={servico.id_tipo_servico}>
                  {servico.nome_servico} (R$ {parseFloat(servico.preco_base).toFixed(2)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Tipo de Agendamento */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Tipo de Agendamento</Typography>
            <RadioGroup
              value={formAgendamento.tipo_agendamento}
              onChange={(e) => {
                const tipo = e.target.value;
                const novasSessoes = tipo === 'Pacote' ? gerarSessoes(formAgendamento.quantidade_sessoes) : [];
                setFormAgendamento({
                  ...formAgendamento,
                  tipo_agendamento: tipo,
                  sessoes: novasSessoes
                });
              }}
            >
              <FormControlLabel value="Único" control={<Radio />} label="Serviço Único" />
              <FormControlLabel value="Pacote" control={<Radio />} label="Pacote de Serviços" />
            </RadioGroup>
          </FormControl>

          {/* Quantidade de Sessões (apenas para Pacote) */}
          {formAgendamento.tipo_agendamento === 'Pacote' && (
            <TextField
              fullWidth
              label="Quantidade de Sessões"
              type="number"
              inputProps={{ min: 2, max: 10 }}
              value={formAgendamento.quantidade_sessoes}
              onChange={(e) => {
                const qtd = parseInt(e.target.value) || 1;
                setFormAgendamento({
                  ...formAgendamento,
                  quantidade_sessoes: qtd,
                  sessoes: gerarSessoes(qtd)
                });
              }}
              sx={{ mb: 2 }}
            />
          )}

          {/* Datas das Sessões (apenas para Pacote) */}
          {formAgendamento.tipo_agendamento === 'Pacote' && formAgendamento.sessoes && formAgendamento.sessoes.length > 0 && (
            <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Datas das Sessões</Typography>
              {formAgendamento.sessoes.map((sessao, idx) => (
                <TextField
                  key={idx}
                  fullWidth
                  label={`Sessão ${idx + 1}`}
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={sessao.data_sessao}
                  onChange={(e) => {
                    const novasSessoes = [...formAgendamento.sessoes];
                    novasSessoes[idx].data_sessao = e.target.value;
                    setFormAgendamento({ ...formAgendamento, sessoes: novasSessoes });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.preventDefault();
                      const now = new Date();
                      const offset = now.getTimezoneOffset();
                      const localDate = new Date(now.getTime() - offset * 60000);
                      const dataHoraAtual = localDate.toISOString().slice(0, 16);
                      const novasSessoes = [...formAgendamento.sessoes];
                      novasSessoes[idx].data_sessao = dataHoraAtual;
                      setFormAgendamento({ ...formAgendamento, sessoes: novasSessoes });
                    }
                  }}
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          )}

          {/* Data para agendamento único */}
          {formAgendamento.tipo_agendamento === 'Único' && (
            <TextField
              fullWidth
              label="Data/Hora *"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={formAgendamento.data_agendamento}
              onChange={(e) => setFormAgendamento({ ...formAgendamento, data_agendamento: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === ' ') {
                  e.preventDefault();
                  const now = new Date();
                  const offset = now.getTimezoneOffset();
                  const localDate = new Date(now.getTime() - offset * 60000);
                  const dataHoraAtual = localDate.toISOString().slice(0, 16);
                  setFormAgendamento({ ...formAgendamento, data_agendamento: dataHoraAtual });
                }
              }}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            label="Observações"
            multiline
            rows={2}
            value={formAgendamento.observacoes}
            onChange={(e) => setFormAgendamento({ ...formAgendamento, observacoes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNovoAgendamento(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleNovoAgendamento}>Agendar</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: NOVO PET */}
      <Dialog open={openNovoPet} onClose={() => setOpenNovoPet(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cadastrar Novo Pet</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Cliente *</InputLabel>
            <Select
              value={formPet.id_cliente}
              label="Cliente *"
              onChange={(e) => setFormPet({ ...formPet, id_cliente: e.target.value })}
            >
              {clientes.map(cliente => (
                <MenuItem key={cliente.id_cliente} value={cliente.id_cliente}>
                  {cliente.nome_razao_social}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Nome do Pet *"
            value={formPet.nome_pet}
            onChange={(e) => setFormPet({ ...formPet, nome_pet: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Raça"
            value={formPet.raca}
            onChange={(e) => setFormPet({ ...formPet, raca: e.target.value })}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Sexo</InputLabel>
            <Select
              value={formPet.sexo}
              label="Sexo"
              onChange={(e) => setFormPet({ ...formPet, sexo: e.target.value })}
            >
              <MenuItem value="M">Macho</MenuItem>
              <MenuItem value="F">Fêmea</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Peso (kg)"
            type="number"
            inputProps={{ step: '0.1' }}
            value={formPet.peso}
            onChange={(e) => setFormPet({ ...formPet, peso: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Cor"
            value={formPet.cor}
            onChange={(e) => setFormPet({ ...formPet, cor: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNovoPet(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleNovoPet}>Cadastrar</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: NOVA AVALIAÇÃO */}
      <Dialog open={openAvaliacao} onClose={() => setOpenAvaliacao(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Avaliação</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Selecione o Agendamento *</InputLabel>
            <Select
              value={formAvaliacao.id_agendamento}
              label="Selecione o Agendamento *"
              onChange={(e) => setFormAvaliacao({ ...formAvaliacao, id_agendamento: e.target.value })}
            >
              {agendamentos.filter(a => a.status === 'Concluído').map(agend => (
                <MenuItem key={agend.id_agendamento} value={agend.id_agendamento}>
                  {agend.pet_nome} - {new Date(agend.data_agendamento).toLocaleDateString('pt-BR')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Avaliação *</InputLabel>
            <Select
              value={formAvaliacao.nota}
              label="Avaliação *"
              onChange={(e) => setFormAvaliacao({ ...formAvaliacao, nota: e.target.value })}
            >
              <MenuItem value={5}>⭐⭐⭐⭐⭐ Excelente</MenuItem>
              <MenuItem value={4}>⭐⭐⭐⭐ Muito Bom</MenuItem>
              <MenuItem value={3}>⭐⭐⭐ Bom</MenuItem>
              <MenuItem value={2}>⭐⭐ Ruim</MenuItem>
              <MenuItem value={1}>⭐ Muito Ruim</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Comentário"
            multiline
            rows={3}
            value={formAvaliacao.comentario}
            onChange={(e) => setFormAvaliacao({ ...formAvaliacao, comentario: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAvaliacao(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleNovaAvaliacao}>Avaliar</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: EXCLUIR */}
      <Dialog open={openExcluir} onClose={() => setOpenExcluir(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Alert severity="error">Tem certeza que deseja excluir?</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExcluir(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleExcluir}>Excluir</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: EDITAR SERVIÇO */}
      <Dialog open={openEditarServico} onClose={() => setOpenEditarServico(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Serviço</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editandoServico && (
            <>
              <TextField
                fullWidth
                label="Nome do Serviço *"
                value={editandoServico.nome_servico || ''}
                onChange={(e) => setEditandoServico({ ...editandoServico, nome_servico: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={2}
                value={editandoServico.descricao || ''}
                onChange={(e) => setEditandoServico({ ...editandoServico, descricao: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Duração (minutos)"
                type="number"
                inputProps={{ min: 15, max: 480, step: 15 }}
                value={editandoServico.duracao_minutos || 60}
                onChange={(e) => setEditandoServico({ ...editandoServico, duracao_minutos: parseInt(e.target.value) })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Preço (R$)"
                type="number"
                inputProps={{ step: '0.01' }}
                value={editandoServico.preco_base || 0}
                onChange={(e) => setEditandoServico({ ...editandoServico, preco_base: parseFloat(e.target.value) })}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editandoServico.ativo ? 'ativo' : 'inativo'}
                  label="Status"
                  onChange={(e) => setEditandoServico({ ...editandoServico, ativo: e.target.value === 'ativo' })}
                >
                  <MenuItem value="ativo">Ativo</MenuItem>
                  <MenuItem value="inativo">Inativo</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditarServico(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditarServico}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: EDITAR STATUS DO AGENDAMENTO */}
      <Dialog open={openEditarStatus} onClose={() => setOpenEditarStatus(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Status do Agendamento</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {agendamentoEditando && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Pet:</strong> {agendamentoEditando.pet_nome}<br />
                  <strong>Serviço:</strong> {agendamentoEditando.servico_nome}<br />
                  <strong>Data:</strong> {new Date(agendamentoEditando.data_agendamento).toLocaleString('pt-BR')}
                </Typography>
              </Alert>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status *</InputLabel>
                <Select
                  value={formStatus.status}
                  label="Status *"
                  onChange={(e) => setFormStatus({ ...formStatus, status: e.target.value })}
                >
                  <MenuItem value="Agendado">Agendado</MenuItem>
                  <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                  <MenuItem value="Concluído">Concluído</MenuItem>
                  <MenuItem value="Cancelado">Cancelado</MenuItem>
                  <MenuItem value="Não Compareceu">Não Compareceu</MenuItem>
                </Select>
              </FormControl>

              {formStatus.status === 'Concluído' && (
                <TextField
                  fullWidth
                  label="Data de Conclusão"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={formStatus.data_conclusao}
                  onChange={(e) => setFormStatus({ ...formStatus, data_conclusao: e.target.value })}
                  helperText="Deixe em branco para usar a data/hora atual"
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditarStatus(false)}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleEditarStatus}>
            Atualizar Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: EDITAR SESSÃO DO PACOTE */}
      <Dialog open={openEditarSessao} onClose={() => setOpenEditarSessao(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Sessão do Pacote</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {sessaoEditando && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Sessão:</strong> {sessaoEditando.numero_sessao}<br />
                  <strong>Data Agendada:</strong> {new Date(sessaoEditando.data_sessao).toLocaleString('pt-BR')}<br />
                  {sessaoEditando.data_realizacao && (
                    <><strong>Data Realizada:</strong> {new Date(sessaoEditando.data_realizacao).toLocaleString('pt-BR')}</>
                  )}
                </Typography>
              </Alert>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status *</InputLabel>
                <Select
                  value={formSessao.status}
                  label="Status *"
                  onChange={(e) => setFormSessao({ ...formSessao, status: e.target.value })}
                >
                  <MenuItem value="Agendada">Agendada</MenuItem>
                  <MenuItem value="Concluída">Concluída</MenuItem>
                  <MenuItem value="Cancelada">Cancelada</MenuItem>
                </Select>
              </FormControl>

              {formSessao.status === 'Concluída' && (
                <TextField
                  fullWidth
                  label="Data de Realização"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={formSessao.data_realizacao}
                  onChange={(e) => setFormSessao({ ...formSessao, data_realizacao: e.target.value })}
                  helperText="Deixe em branco para usar a data/hora atual"
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditarSessao(false)}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleEditarSessao}>
            Atualizar Sessão
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: GERAR FINANCEIRO */}
      <Dialog open={openGerarFinanceiro} onClose={() => setOpenGerarFinanceiro(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gerar Financeiro do Agendamento</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {agendamentoFinanceiro && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Pet:</strong> {agendamentoFinanceiro.pet_nome}<br />
                  <strong>Cliente:</strong> {agendamentoFinanceiro.cliente_nome}<br />
                  <strong>Serviço:</strong> {agendamentoFinanceiro.servico_nome}<br />
                  <strong>Valor:</strong> R$ {
                    agendamentoFinanceiro.tipo_agendamento === 'Pacote'
                      ? parseFloat(agendamentoFinanceiro.preco_total_pacote || 0).toFixed(2)
                      : parseFloat(agendamentoFinanceiro.preco_servico || 0).toFixed(2)
                  }
                </Typography>
              </Alert>

              {/* Opção para pacotes: gerar financeiro completo ou por sessão */}
              {agendamentoFinanceiro.tipo_agendamento === 'Pacote' && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Como gerar o financeiro?
                  </Typography>

                  <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
                    <RadioGroup
                      value={tipoPagamentoPacote}
                      onChange={(e) => setTipoPagamentoPacote(e.target.value)}
                    >
                      <FormControlLabel
                        value="completo"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="bold">Pacote Completo</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Gerar 1 conta com valor total: R$ {parseFloat(agendamentoFinanceiro.preco_total_pacote || 0).toFixed(2)}
                            </Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="sessao"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="bold">Por Sessão</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Gerar {agendamentoFinanceiro.sessoes?.length || agendamentoFinanceiro.quantidade_sessoes} contas de R$ {parseFloat(agendamentoFinanceiro.preco_servico || 0).toFixed(2)} cada
                            </Typography>
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </>
              )}

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Quando o cliente irá pagar?
              </Typography>

              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  value={momentoPagamento}
                  onChange={(e) => setMomentoPagamento(e.target.value)}
                >
                  <FormControlLabel
                    value="inicio"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="bold">No Início do Atendimento</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Vencimento na data do agendamento: {new Date(agendamentoFinanceiro.data_agendamento).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="final"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="bold">No Final do Atendimento</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Vencimento na data de conclusão
                          {agendamentoFinanceiro.data_conclusao &&
                            `: ${new Date(agendamentoFinanceiro.data_conclusao).toLocaleDateString('pt-BR')}`
                          }
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGerarFinanceiro(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleGerarFinanceiro}
            startIcon={<AttachMoneyIcon />}
          >
            Gerar Financeiro
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default PetShopPage;
