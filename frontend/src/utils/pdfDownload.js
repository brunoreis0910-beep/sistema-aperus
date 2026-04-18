/**
 * Utilitário para download/compartilhamento de PDFs que funciona tanto no navegador quanto no Capacitor
 */
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

const isCapacitor = () => {
  return !!(window.Capacitor);
};

/**
 * Abre/visualiza um PDF (compartilha para visualizador)
 * @param {jsPDF} doc - Documento jsPDF
 * @param {string} filename - Nome do arquivo (sem extensão)
 */
export const visualizarPDF = async (doc, filename) => {
  if (isCapacitor()) {
    try {
      const pdfBase64 = doc.output('dataurlstring').split(',')[1];
      
      // Salva temporariamente
      const savedFile = await Filesystem.writeFile({
        path: `${filename}.pdf`,
        data: pdfBase64,
        directory: Directory.Cache,
      });
      
      console.log('📄 Arquivo salvo:', savedFile.uri);
      
      // Compartilha (usuário pode escolher visualizar ou enviar)
      await Share.share({
        title: `${filename}.pdf`,
        text: 'Visualizar ou compartilhar PDF',
        url: savedFile.uri,
        dialogTitle: 'Abrir PDF'
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao abrir PDF:', error);
      alert('Erro ao abrir PDF.');
      return false;
    }
  } else {
    // No navegador: abrir em nova aba
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
    return true;
  }
};

/**
 * Compartilha um PDF
 * @param {jsPDF} doc - Documento jsPDF
 * @param {string} filename - Nome do arquivo (sem extensão)
 */
export const compartilharPDF = async (doc, filename) => {
  if (isCapacitor()) {
    try {
      const pdfBase64 = doc.output('dataurlstring').split(',')[1];
      
      const savedFile = await Filesystem.writeFile({
        path: `${filename}.pdf`,
        data: pdfBase64,
        directory: Directory.Cache,
      });
      
      await Share.share({
        title: filename,
        text: `Compartilhar ${filename}`,
        url: savedFile.uri,
        dialogTitle: 'Compartilhar PDF'
      });
      
      console.log('✅ PDF compartilhado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao compartilhar PDF:', error);
      alert('Erro ao compartilhar PDF.');
      return false;
    }
  } else {
    // No navegador: fazer download
    doc.save(`${filename}.pdf`);
    return true;
  }
};

/**
 * Visualiza um PDF de blob (de API)
 * @param {Blob} blob - Blob do PDF
 * @param {string} filename - Nome do arquivo
 */
export const visualizarPDFBlob = async (blob, filename) => {
  if (isCapacitor()) {
    try {
      // Converte blob para base64
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Salva temporariamente
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });
      
      // Compartilha (usuário pode escolher visualizar ou enviar)
      await Share.share({
        title: filename,
        text: 'Visualizar ou compartilhar PDF',
        url: savedFile.uri,
        dialogTitle: 'Abrir PDF'
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao abrir PDF:', error);
      alert('Erro ao abrir PDF.');
      return false;
    }
  } else {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    return true;
  }
};

/**
 * Compartilha um PDF de blob (de API)
 * @param {Blob} blob - Blob do PDF
 * @param {string} filename - Nome do arquivo
 */
export const compartilharPDFBlob = async (blob, filename) => {
  if (isCapacitor()) {
    try {
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });
      
      await Share.share({
        title: filename,
        text: `Compartilhar ${filename}`,
        url: savedFile.uri,
        dialogTitle: 'Compartilhar PDF'
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao compartilhar PDF:', error);
      alert('Erro ao compartilhar PDF.');
      return false;
    }
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }
};

// Mantém compatibilidade com código antigo
export const salvarPDF = visualizarPDF;
export const baixarPDFBlob = visualizarPDFBlob;

/**
 * Abre um PDF em uma nova aba (apenas navegador)
 * @param {Blob} blob - Blob do PDF
 */
export const abrirPDFNovaAba = (blob) => {
  if (isCapacitor()) {
    console.warn('⚠️ Abrir em nova aba não suportado no Capacitor. Use baixarPDFBlob() para compartilhar.');
    return false;
  }
  
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  return true;
};
