import { useRef, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const useVendaImpressao = () => {
  const componentRef = useRef()

  // função para impressão direta
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Nota de Venda',
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    `
  })

  // função para gerar PDF
  const gerarPDF = useCallback(async (dadosVenda) => {
    if (!componentRef.current) {
      throw new Error('Componente de impressão não encontrado')
    }

    try {
      // Capturar o componente como imagem
      const canvas = await html2canvas(componentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      // Criar PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Adicionar primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Adicionar páginas extras se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      return pdf
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      throw new Error('Falha ao gerar PDF: ' + error.message)
    }
  }, [])

  // função para baixar PDF
  const baixarPDF = useCallback(async (dadosVenda) => {
    try {
      const pdf = await gerarPDF(dadosVenda)
      const nomeArquivo = `venda_${dadosVenda?.numero_venda || 'sem_numero'}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(nomeArquivo)
      return { success: true, nomeArquivo }
    } catch (error) {
      console.error('Erro ao baixar PDF:', error)
      return { success: false, error: error.message }
    }
  }, [gerarPDF])

  // função para compartilhar via WhatsApp
  const compartilharWhatsApp = useCallback(async (dadosVenda, numeroTelefone = '') => {
    try {
      // Preparar texto da mensagem
      const cliente = dadosVenda?.cliente?.nome || dadosVenda?.cliente?.razao_social || 'Cliente'
      const numeroVenda = dadosVenda?.numero_venda || 'S/N'
      const valorTotal = dadosVenda?.valor_final || dadosVenda?.valor_total || 0
      const dataVenda = dadosVenda?.data_venda ? new Date(dadosVenda.data_venda).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')
      const operacao = dadosVenda?.operacao?.nome_operacao || dadosVenda?.operacao?.nome || 'N/A'
      const empresa = dadosVenda?.empresa?.nome || dadosVenda?.operacao?.empresa?.nome || 'EMPRESA'

      const mensagem = `🏪 *${empresa.toUpperCase()}*

🧾 *NOTA DE VENDA*
📄 *Documento Nº:* ${numeroVenda}
📅 *Data:* ${dataVenda}
� *Operação:* ${operacao}
� *Cliente:* ${cliente}

📦 *PRODUTOS:*
${dadosVenda?.produtos?.map((produto, index) => {
  const total = (produto.quantidade || 0) * (produto.valor_unitario || 0)
  return `${index + 1}. ${produto.nome_produto || produto.nome}
   Qtd: ${produto.quantidade} x ${Number(produto.valor_unitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} = ${Number(total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
}).join('\n\n') || 'Nenhum produto listado'}

💰 *TOTAL: ${Number(valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*

Obrigado pela preferência! 😊

---
_Mensagem enviada automaticamente pelo APERUS_`

      // Criar URL do WhatsApp
      const textoEncoded = encodeURIComponent(mensagem)
      let urlWhatsApp
      
      // Limpar número de telefone
      const numeroLimpo = numeroTelefone.replace(/\D/g, '')
      
      if (numeroLimpo && numeroLimpo.length >= 10) {
        // Adicionar código do país se não tiver
        const numeroCompleto = numeroLimpo.startsWith('55') ? numeroLimpo : '55' + numeroLimpo
        urlWhatsApp = `https://wa.me/${numeroCompleto}?text=${textoEncoded}`
      } else {
        // WhatsApp Web sem número específico
        urlWhatsApp = `https://web.whatsapp.com/send?text=${textoEncoded}`
      }

      // Abrir WhatsApp
      const novaJanela = window.open(urlWhatsApp, '_blank', 'width=800,height=600')
      
      if (!novaJanela) {
        // Se bloqueou popup, tentar redirecionamento direto
        window.location.href = urlWhatsApp
      }
      
      return { success: true, url: urlWhatsApp }
    } catch (error) {
      console.error('Erro ao compartilhar no WhatsApp:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // função para compartilhar PDF via WhatsApp (usando base64)
  const compartilharPDFWhatsApp = useCallback(async (dadosVenda, numeroTelefone = '') => {
    try {
      // Para compartilhar PDF pelo WhatsApp, normalmente seria necessário um servidor
      // Por ora, vamos compartilhar apenas o texto e sugerir anexar o PDF manualmente
      const resultado = await compartilharWhatsApp(dadosVenda, numeroTelefone)
      
      if (resultado.success) {
        // Também gerar o PDF para download
        await baixarPDF(dadosVenda)
        
        alert('WhatsApp aberto! O PDF foi baixado automaticamente. Você pode anexá-lo manualmente na conversa.')
      }
      
      return resultado
    } catch (error) {
      console.error('Erro ao compartilhar PDF via WhatsApp:', error)
      return { success: false, error: error.message }
    }
  }, [compartilharWhatsApp, baixarPDF])

  return {
    componentRef,
    handlePrint,
    gerarPDF,
    baixarPDF,
    compartilharWhatsApp,
    compartilharPDFWhatsApp
  }
}

export default useVendaImpressao