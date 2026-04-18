// Hook para gerar relatório bancário em PDF e compartilhar via WhatsApp
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const useRelatorioBancario = () => {

  const gerarPDFRelatorio = (movimentos, filtros, totais, empresa = null) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;
    let yPosition = margin;

    // cabeçalho - DADOS DA EMPRESA
    if (empresa) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const nomeEmpresa = empresa.nome_razao_social || empresa.razao_social || empresa.nome_fantasia || 'Empresa';
      doc.text(nomeEmpresa, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 7;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      const endereco = empresa.endereco || '';
      const bairro = empresa.bairro || '';
      const cidade = empresa.cidade || '';
      const estado = empresa.estado || '';
      const cep = empresa.cep || '';

      if (endereco) {
        const enderecoCompleto = `${endereco}${bairro ? ', ' + bairro : ''}${cidade ? ' - ' + cidade : ''}${estado ? '/' + estado : ''}${cep ? ' - CEP: ' + cep : ''}`;
        doc.text(enderecoCompleto, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
      }

      const telefone = empresa.telefone || empresa.fone || '';
      const email = empresa.email || '';
      if (telefone || email) {
        const contato = `${telefone ? 'Tel: ' + telefone : ''}${telefone && email ? ' | ' : ''}${email ? 'Email: ' + email : ''}`;
        doc.text(contato, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
      }
    }

    yPosition += 3;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // TÍTULO DO RELATÓRIO
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE MOVIMENTAÇÕES BANCÁRIAS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // INFORMAÇÕES DO PERÍODO E FILTROS
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const dataInicial = filtros.dataInicial ? new Date(filtros.dataInicial + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
    const dataFinal = filtros.dataFinal ? new Date(filtros.dataFinal + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';

    doc.text(`Período: ${dataInicial} até ${dataFinal}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Tipo de Movimento: ${filtros.tipoMovimento || 'Todos'}`, margin, yPosition);
    yPosition += 6;

    if (filtros.contaBancaria) {
      doc.text(`Conta Bancária: ${filtros.contaBancaria}`, margin, yPosition);
      yPosition += 6;
    }

    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition);
    yPosition += 10;

    // TABELA DE MOVIMENTOS
    if (movimentos && movimentos.length > 0) {
      const tableData = movimentos.map(mov => {
        const isReceita = mov.tipo_conta === 'Receber';
        const valor = parseFloat(mov.valor_liquidado || 0);
        const dataPagamento = mov.data_pagamento ? new Date(mov.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';

        return [
          dataPagamento,
          mov.descricao || '',
          isReceita ? 'RECEITA' : 'DESPESA',
          mov.forma_pagamento || 'N/A',
          isReceita ? `R$ ${valor.toFixed(2)}` : '',
          !isReceita ? `R$ ${valor.toFixed(2)}` : ''
        ];
      });

      doc.autoTable({
        startY: yPosition,
        head: [['Data', 'Descriçéo', 'Tipo', 'Forma Pgto', 'Receitas', 'Despesas']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [63, 81, 181], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 55 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' }
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          // Rodapé em cada página
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `Página ${doc.internal.getCurrentPageInfo().pageNumber} de ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    } else {
      doc.text('Nenhuma movimentação encontrada para o período selecionado.', margin, yPosition);
      yPosition += 10;
    }

    // RESUMO DOS TOTAIS
    if (totais) {
      // Verifica se precisa de nova página
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO DO PERÍODO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Receitas
      doc.setTextColor(0, 128, 0); // Verde
      doc.text(`Total de Receitas:`, margin + 10, yPosition);
      doc.text(`R$ ${totais.receitas.toFixed(2)}`, pageWidth - margin - 10, yPosition, { align: 'right' });
      yPosition += 8;

      // Despesas
      doc.setTextColor(255, 0, 0); // Vermelho
      doc.text(`Total de Despesas:`, margin + 10, yPosition);
      doc.text(`R$ ${totais.despesas.toFixed(2)}`, pageWidth - margin - 10, yPosition, { align: 'right' });
      yPosition += 8;

      // Linha de separação
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.line(margin + 10, yPosition, pageWidth - margin - 10, yPosition);
      yPosition += 6;

      // Saldo
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(totais.saldo >= 0 ? 0 : 255, totais.saldo >= 0 ? 0 : 0, totais.saldo >= 0 ? 255 : 0);
      doc.text(`SALDO DO PERÍODO:`, margin + 10, yPosition);
      doc.text(`R$ ${totais.saldo.toFixed(2)}`, pageWidth - margin - 10, yPosition, { align: 'right' });

      doc.setTextColor(0, 0, 0); // Volta para preto
    }

    return doc;
  };

  const imprimirRelatorio = async (movimentos, filtros, totais, empresa = null) => {
    try {
      const doc = gerarPDFRelatorio(movimentos, filtros, totais, empresa);
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } catch (error) {
      console.error('Erro ao imprimir relatório:', error);
      throw error;
    }
  };

  const baixarPDFRelatorio = async (movimentos, filtros, totais, empresa = null) => {
    try {
      const doc = gerarPDFRelatorio(movimentos, filtros, totais, empresa);
      const dataInicial = filtros.dataInicial || 'inicio';
      const dataFinal = filtros.dataFinal || 'fim';
      const nomeArquivo = `Relatorio_Bancario_${dataInicial}_a_${dataFinal}.pdf`;
      doc.save(nomeArquivo);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      throw error;
    }
  };

  const compartilharWhatsApp = async (movimentos, filtros, totais, empresa = null, telefone = '') => {
    try {
      const doc = gerarPDFRelatorio(movimentos, filtros, totais, empresa);
      const pdfBlob = doc.output('blob');

      // Converte blob para base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);

      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64data = reader.result;

          // Cria mensagem para WhatsApp
          const dataInicial = filtros.dataInicial ? new Date(filtros.dataInicial + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
          const dataFinal = filtros.dataFinal ? new Date(filtros.dataFinal + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';

          let mensagem = `*RELATÓRIO DE MOVIMENTAÇÕES BANCÁRIAS*\n\n`;
          mensagem += `📅 *Período:* ${dataInicial} até ${dataFinal}\n`;
          mensagem += `📊 *Tipo:* ${filtros.tipoMovimento || 'Todos'}\n\n`;

          if (totais) {
            mensagem += `💰 *Total Receitas:* R$ ${totais.receitas.toFixed(2)}\n`;
            mensagem += `💸 *Total Despesas:* R$ ${totais.despesas.toFixed(2)}\n`;
            mensagem += `📈 *Saldo:* R$ ${totais.saldo.toFixed(2)}\n\n`;
          }

          mensagem += `📄 *Total de Movimentos:* ${movimentos.length}\n\n`;
          mensagem += `_Relatório detalhado em anexo (PDF)_`;

          // Prepara URL do WhatsApp
          const mensagemEncoded = encodeURIComponent(mensagem);
          let whatsappUrl = `https://wa.me/`;

          if (telefone) {
            const tel = telefone.replace(/\D/g, '');
            whatsappUrl += `${tel}?`;
          } else {
            whatsappUrl += '?';
          }

          whatsappUrl += `text=${mensagemEncoded}`;

          // Abre WhatsApp Web
          window.open(whatsappUrl, '_blank');

          // Nota: O PDF precisa ser enviado manualmente pelo usuário
          // Para envio automático seria necessário backend com API do WhatsApp Business

          alert('WhatsApp aberto! Obs: Você precisará anexar o PDF manualmente. Use o botão "Baixar PDF" para salvar o arquivo primeiro.');

          resolve({ success: true, base64: base64data });
        };

        reader.onerror = (error) => {
          reject(error);
        };
      });
    } catch (error) {
      console.error('Erro ao compartilhar via WhatsApp:', error);
      throw error;
    }
  };

  return {
    imprimirRelatorio,
    baixarPDFRelatorio,
    compartilharWhatsApp
  };
};

export default useRelatorioBancario;
