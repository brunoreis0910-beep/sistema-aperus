// Hook para gerar PDF do Extrato Bancário
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const useRelatorioExtrato = () => {

  const formatarData = (isoStr) => {
    if (!isoStr) return '';
    return new Date(isoStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor || 0);
  };

  const gerarPDFExtrato = (extratoData, empresa = null) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let y = margin;

    // --- Cabeçalho empresa ---
    if (empresa) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(empresa.nome_razao_social || empresa.nome_fantasia || 'Empresa', pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const end = [empresa.endereco, empresa.bairro, empresa.cidade, empresa.estado].filter(Boolean).join(', ');
      if (end) { doc.text(end, pageWidth / 2, y, { align: 'center' }); y += 5; }
      const contato = [empresa.telefone && `Tel: ${empresa.telefone}`, empresa.email && `Email: ${empresa.email}`].filter(Boolean).join(' | ');
      if (contato) { doc.text(contato, pageWidth / 2, y, { align: 'center' }); y += 5; }
    }

    doc.setDrawColor(100);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    // --- Título ---
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('EXTRATO BANCÁRIO', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // --- Dados da conta e período ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const conta = extratoData.conta || {};
    const periodo = extratoData.periodo || {};

    doc.text(`Conta: ${conta.nome_conta || ''}`, margin, y); y += 5;
    if (conta.banco) {
      doc.text(`Banco: ${conta.banco}${conta.agencia ? ' | Agência: ' + conta.agencia : ''}${conta.numero_conta ? ' | CC: ' + conta.numero_conta : ''}`, margin, y); y += 5;
    }
    doc.text(
      `Período: ${formatarData(periodo.data_inicio) || 'Início'} até ${formatarData(periodo.data_fim) || 'Fim'}`,
      margin, y
    ); y += 5;
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, y);
    y += 8;

    // --- Resumo ---
    doc.setFont('helvetica', 'bold');
    doc.text(`Saldo Anterior: R$ ${formatarMoeda(extratoData.saldo_anterior)}`, margin, y); y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 120, 0);
    doc.text(`Total Créditos: R$ ${formatarMoeda(extratoData.total_creditos)}`, margin, y); y += 5;
    doc.setTextColor(180, 0, 0);
    doc.text(`Total Débitos: R$ ${formatarMoeda(extratoData.total_debitos)}`, margin, y); y += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Saldo Final: R$ ${formatarMoeda(extratoData.saldo_final)}`, margin, y);
    y += 8;

    // --- Lançamentos agrupados por dia ---
    const dias = extratoData.dias || [];
    for (const dia of dias) {
      // Verificar espaço na página
      if (y > 250) {
        doc.addPage();
        y = margin;
      }

      // Cabeçalho do dia
      doc.setFillColor(230, 235, 245);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 60, 120);
      doc.text(formatarData(dia.data), margin + 2, y); 
      y += 5;
      doc.setTextColor(0, 0, 0);

      const tableData = dia.lancamentos.map(l => [
        l.tipo_movimento === 'C' ? 'C' : 'D',
        l.descricao || '',
        l.cliente_fornecedor || '',
        l.documento_numero || '',
        l.tipo_movimento === 'C' ? `R$ ${formatarMoeda(l.valor)}` : '',
        l.tipo_movimento === 'D' ? `R$ ${formatarMoeda(l.valor)}` : '',
        `R$ ${formatarMoeda(l.saldo_corrente)}`,
      ]);

      doc.autoTable({
        startY: y,
        head: [['T', 'Descrição', 'Cliente/Fornecedor', 'Documento', 'Crédito', 'Débito', 'Saldo']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 1.5 },
        headStyles: { fillColor: [60, 90, 160], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { cellWidth: 55 },
          2: { cellWidth: 38 },
          3: { cellWidth: 22 },
          4: { halign: 'right', cellWidth: 22, textColor: [0, 120, 0] },
          5: { halign: 'right', cellWidth: 22, textColor: [180, 0, 0] },
          6: { halign: 'right', cellWidth: 24, fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin },
      });

      y = doc.lastAutoTable.finalY + 4;
    }

    return doc;
  };

  const baixarPDFExtrato = (extratoData, empresa = null) => {
    const doc = gerarPDFExtrato(extratoData, empresa);
    const contaNome = extratoData.conta?.nome_conta?.replace(/\s+/g, '_') || 'extrato';
    const hoje = new Date().toISOString().split('T')[0];
    doc.save(`Extrato_${contaNome}_${hoje}.pdf`);
  };

  const imprimirExtrato = (extratoData, empresa = null) => {
    const doc = gerarPDFExtrato(extratoData, empresa);
    doc.autoPrint();
    const blob = doc.output('bloburl');
    window.open(blob, '_blank');
  };

  return { baixarPDFExtrato, imprimirExtrato };
};

export default useRelatorioExtrato;
