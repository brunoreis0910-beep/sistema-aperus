/**
 * Utilitário para download/compartilhamento de PDFs que funciona tanto no navegador quanto no Capacitor
 */
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

const isCapacitor = () => {
  if (typeof window === 'undefined' || !window.Capacitor) return false;
  
  try {
    // Verifica se está em plataforma nativa (iOS, Android, etc)
    if (typeof window.Capacitor.getPlatform === 'function') {
      const platform = window.Capacitor.getPlatform();
      // Se é 'web', não é nativo
      if (platform === 'web') return false;
      // Se é 'ios', 'android', 'electron', etc - é nativo
      return true;
    }
    
    if (typeof window.Capacitor.isNativePlatform === 'function') {
      return window.Capacitor.isNativePlatform() === true;
    }
  } catch (e) {
    console.warn('Erro ao detectar Capacitor:', e);
    return false;
  }
  
  return false;
};

const hasShareCapability = async () => {
  if (typeof Share.canShare === 'function') {
    try {
      const result = await Share.canShare();
      return !!result?.value;
    } catch {
      return false;
    }
  }

  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
};

/**
 * Abre/visualiza um PDF (compartilha para visualizador)
 * @param {jsPDF} doc - Documento jsPDF
 * @param {string} filename - Nome do arquivo (sem extensão)
 */
export const visualizarPDF = async (doc, filename) => {
  try {
    if (isCapacitor()) {
      try {
        const pdfBase64 = doc.output('dataurlstring').split(',')[1];
        
        const savedFile = await Filesystem.writeFile({
          path: `${filename}.pdf`,
          data: pdfBase64,
          directory: Directory.Cache,
        });
        
        console.log('📄 Arquivo salvo:', savedFile.uri);
        
        const canShareResult = await hasShareCapability();
        if (canShareResult) {
          try {
            await Share.share({
              title: `${filename}.pdf`,
              text: 'Visualizar ou compartilhar PDF',
              url: savedFile.uri,
              dialogTitle: 'Abrir PDF'
            });
            return true;
          } catch (shareError) {
            console.warn('Erro ao compartilhar, fazendo fallback para navegador:', shareError);
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            window.open(url, '_blank');
            return true;
          }
        } else {
          const pdfBlob = doc.output('blob');
          const url = URL.createObjectURL(pdfBlob);
          window.open(url, '_blank');
          return true;
        }
      } catch (error) {
        console.warn('Erro em Capacitor, fazendo fallback para navegador:', error);
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
        return true;
      }
    } else {
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      return true;
    }
  } catch (error) {
    console.error('❌ Erro ao abrir PDF:', error);
    alert('Erro ao abrir PDF.');
    return false;
  }
};

/**
 * Compartilha um PDF
 * @param {jsPDF} doc - Documento jsPDF
 * @param {string} filename - Nome do arquivo (sem extensão)
 */
export const compartilharPDF = async (doc, filename) => {
  try {
    if (isCapacitor()) {
      try {
        const pdfBase64 = doc.output('dataurlstring').split(',')[1];
        
        const savedFile = await Filesystem.writeFile({
          path: `${filename}.pdf`,
          data: pdfBase64,
          directory: Directory.Cache,
        });
        
        const canShareResult = await hasShareCapability();
        if (canShareResult) {
          try {
            await Share.share({
              title: filename,
              text: `Compartilhar ${filename}`,
              url: savedFile.uri,
              dialogTitle: 'Compartilhar PDF'
            });
            return true;
          } catch (shareError) {
            console.warn('Erro ao compartilhar:', shareError);
            alert('Compartilhamento não disponível.');
            return false;
          }
        } else {
          alert('Compartilhamento não disponível neste dispositivo.');
          return false;
        }
      } catch (error) {
        console.warn('Erro em Capacitor:', error);
        alert('Erro ao compartilhar PDF.');
        return false;
      }
    } else {
      doc.save(`${filename}.pdf`);
      return true;
    }
  } catch (error) {
    console.error('❌ Erro ao compartilhar PDF:', error);
    alert('Erro ao compartilhar PDF.');
    return false;
  }
};

/**
 * Visualiza um PDF de blob (de API)
 * @param {Blob} blob - Blob do PDF
 * @param {string} filename - Nome do arquivo
 */
export const visualizarPDFBlob = async (blob, filename) => {
  try {
    if (isCapacitor()) {
      try {
        // Tenta salvar em cache
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
        
        const canShareResult = await hasShareCapability();
        if (canShareResult) {
          try {
            // Compartilha (usuário pode escolher visualizar ou enviar)
            await Share.share({
              title: filename,
              text: 'Visualizar ou compartilhar PDF',
              url: savedFile.uri,
              dialogTitle: 'Abrir PDF'
            });
            return true;
          } catch (shareError) {
            console.warn('Erro ao compartilhar, fazendo fallback para navegador:', shareError);
            // Fallback: abre em nova aba no navegador
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            return true;
          }
        } else {
          // Share não disponível, abre em nova aba
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          return true;
        }
      } catch (error) {
        console.warn('Erro em Capacitor, fazendo fallback para navegador:', error);
        // Fallback: abre em nova aba
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        return true;
      }
    } else {
      // Navegador web: abre em nova aba
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      return true;
    }
  } catch (error) {
    console.error('❌ Erro ao abrir PDF:', error);
    alert('Erro ao abrir PDF.');
    return false;
  }
};

/**
 * Compartilha um PDF de blob (de API)
 * @param {Blob} blob - Blob do PDF
 * @param {string} filename - Nome do arquivo
 */
export const compartilharPDFBlob = async (blob, filename) => {
  try {
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
        
        const canShareResult = await hasShareCapability();
        if (canShareResult) {
          try {
            await Share.share({
              title: filename,
              text: `Compartilhar ${filename}`,
              url: savedFile.uri,
              dialogTitle: 'Compartilhar PDF'
            });
            return true;
          } catch (shareError) {
            console.warn('Erro ao compartilhar:', shareError);
            alert('Compartilhamento não disponível.');
            return false;
          }
        } else {
          alert('Compartilhamento não disponível neste dispositivo.');
          return false;
        }
      } catch (error) {
        console.warn('Erro em Capacitor:', error);
        alert('Erro ao compartilhar PDF.');
        return false;
      }
    } else {
      // No navegador: fazer download
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
  } catch (error) {
    console.error('❌ Erro ao compartilhar PDF:', error);
    alert('Erro ao compartilhar PDF.');
    return false;
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
