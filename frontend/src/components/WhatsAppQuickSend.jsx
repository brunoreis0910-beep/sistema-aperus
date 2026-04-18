import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, Chip, Alert,
  FormControl, InputLabel, Select, MenuItem, IconButton,
  CircularProgress, FormControlLabel, Checkbox
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  Send as SendIcon,
  PictureAsPdf as PdfIcon,
  Description as XmlIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

/**
 * Componente para envio rÃ¡pido de WhatsApp
 * Pode ser usado em qualquer tela do sistema
 * 
 * Props:
 * - telefone: Telefone padrÃ£o (opcional)
 * - nome: Nome do destinatÃ¡rio (opcional)
 * - mensagemPadrao: Mensagem prÃ©-preenchida (opcional)
 * - tipoEnvio: Tipo do envio (manual, vendas, nfe, etc)
 * - idRelacionado: ID do registro relacionado
 * - linkPDF: Link para download do PDF/DANFE (opcional)
 * - linkXML: Link para download do XML (opcional)
 * - onSuccess: Callback apÃ³s envio bem-sucedido
 */
export default function WhatsAppQuickSend({
  telefone = '',
  nome = '',
  mensagemPadrao = '',
  tipoEnvio = 'manual',
  idRelacionado = null,
  linkPDF = '',
  linkXML = '',
  onSuccess = () => {}
}) {
  const { axiosInstance } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [incluirPDF, setIncluirPDF] = useState(!!linkPDF);
  const [incluirXML, setIncluirXML] = useState(false);
  const [formData, setFormData] = useState({
    telefone: telefone,
    nome_destinatario: nome,
    mensagem: mensagemPadrao,
    prioridade: 5
  });

  const handleOpen = () => {
    // Atualiza dados ao abrir
    setFormData({
      telefone: telefone || formData.telefone,
      nome_destinatario: nome || formData.nome_destinatario,
      mensagem: mensagemPadrao || formData.mensagem,
      prioridade: 5
    });
    
    // ForÃ§ar seleÃ§Ã£o automÃ¡tica dos anexos se disponÃ­veis
    if (linkPDF && linkPDF !== '') setIncluirPDF(true);
    if (linkXML && linkXML !== '') setIncluirXML(true);
    
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleEnviar = async () => {
    if (!formData.telefone || !formData.mensagem) {
      alert('Preencha telefone e mensagem!');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/whatsapp/fila/', {
        ...formData,
        tipo_envio: tipoEnvio,
        id_relacionado: idRelacionado
      });

      alert('Mensagem adicionada Ã  fila de envio! âœ…');
      handleClose();
      
      // Limpar formulÃ¡rio
      setFormData({
        telefone: '',
        nome_destinatario: '',
        mensagem: '',
        prioridade: 5
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert('Erro ao adicionar mensagem: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const abrirWhatsAppDireto = async () => {
    // Abrir WhatsApp diretamente apÃ³s confirmaÃ§Ã£o no modal
    if (!formData.telefone) {
      alert('Telefone nÃ£o informado!');
      return;
    }

    // Fazer download dos arquivos se marcados
    if (incluirPDF && linkPDF) {
      try {
        // Construir URL absoluta se necessÃ¡rio
        const pdfUrl = linkPDF.startsWith('http') ? linkPDF : `${window.location.origin}${linkPDF}`;
        console.log('Baixando PDF de:', pdfUrl);
        
        // Buscar o arquivo
        const response = await axiosInstance.get(linkPDF, {
          responseType: 'blob'
        });
        
        // Criar blob e fazer download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const linkElement = document.createElement('a');
        linkElement.href = url;
        linkElement.download = `DANFE_${Date.now()}.pdf`;
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        window.URL.revokeObjectURL(url);
        
        console.log('PDF baixado com sucesso!');
      } catch (error) {
        console.error('Erro ao baixar PDF:', error);
        alert('Erro ao baixar PDF. Verifique o console.');
      }
    }
    
    if (incluirXML && linkXML) {
      try {
        // Pequeno delay para nÃ£o travar o navegador
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Construir URL absoluta se necessÃ¡rio
        const xmlUrl = linkXML.startsWith('http') ? linkXML : `${window.location.origin}${linkXML}`;
        console.log('Baixando XML de:', xmlUrl);
        
        // Buscar o arquivo
        const response = await axiosInstance.get(linkXML, {
          responseType: 'blob'
        });
        
        // Criar blob e fazer download
        const blob = new Blob([response.data], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const linkElement = document.createElement('a');
        linkElement.href = url;
        linkElement.download = `NFe_${Date.now()}.xml`;
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        window.URL.revokeObjectURL(url);
        
        console.log('XML baixado com sucesso!');
      } catch (error) {
        console.error('Erro ao baixar XML:', error);
        alert('Erro ao baixar XML. Verifique o console.');
      }
    }

    // Limpar telefone (remover caracteres especiais)
    let telefoneFormatado = formData.telefone.replace(/\D/g, '');
    
    // Adicionar cÃ³digo do Brasil se necessÃ¡rio
    if (telefoneFormatado.length === 11 || telefoneFormatado.length === 10) {
      telefoneFormatado = '55' + telefoneFormatado;
    }

    // Construir mensagem informando sobre os arquivos
    let mensagemCompleta = formData.mensagem || '';
    
    // Adicionar informaÃ§Ã£o sobre os arquivos baixados
    if ((incluirPDF && linkPDF) || (incluirXML && linkXML)) {
      mensagemCompleta += '\n\nðŸ“Ž *Arquivos foram baixados:*';
      
      if (incluirPDF && linkPDF) {
        mensagemCompleta += '\nâ€¢ PDF (DANFE)';
      }
      
      if (incluirXML && linkXML) {
        mensagemCompleta += '\nâ€¢ XML da NF-e';
      }
      
      mensagemCompleta += '\n\nðŸ’¡ *PrÃ³ximo passo:* Clique no ðŸ“Ž (clip) e selecione os arquivos baixados para anexar.';
    }

    // Preparar mensagem para URL
    const mensagemUrl = mensagemCompleta 
      ? `?text=${encodeURIComponent(mensagemCompleta)}`
      : '';

    // Pequeno delay antes de abrir o WhatsApp para garantir que os downloads iniciaram
    await new Promise(resolve => setTimeout(resolve, 800));

    // Abrir WhatsApp usando wa.me (funciona em qualquer dispositivo)
    const url = `https://wa.me/${telefoneFormatado}${mensagemUrl}`;
    window.open(url, '_blank');
    
    // Fechar modal apÃ³s abrir
    handleClose();
  };

  return (
    <>
      {/* BotÃ£o para abrir modal de confirmaÃ§Ã£o */}
      <IconButton
        color="success"
        onClick={handleOpen}
        size="small"
        sx={{
          bgcolor: '#25D366',
          color: 'white',
          '&:hover': { bgcolor: '#20BA5A' }
        }}
        title="Enviar WhatsApp"
      >
        <WhatsAppIcon />
      </IconButton>

      {/* Dialog com dados do cliente e mensagem */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WhatsAppIcon sx={{ color: '#25D366' }} />
            <Typography variant="h6">Enviar WhatsApp</Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="success" sx={{ mb: 1 }}>
              Confira os dados antes de abrir o WhatsApp
            </Alert>

            {/* Dados do Cliente */}
            <Box sx={{ 
              bgcolor: '#f5f5f5', 
              p: 2, 
              borderRadius: 1,
              border: '1px solid #e0e0e0'
            }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ðŸ“± Dados do Cliente
              </Typography>
              
              <TextField
                fullWidth
                label="Nome do DestinatÃ¡rio"
                value={formData.nome_destinatario}
                onChange={(e) => setFormData({ ...formData, nome_destinatario: e.target.value })}
                placeholder="JoÃ£o Silva"
                size="small"
                sx={{ mt: 1 }}
              />

              <TextField
                fullWidth
                required
                label="Telefone (com DDD)"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="11999999999"
                helperText="Apenas nÃºmeros, com DDD"
                size="small"
                sx={{ mt: 2 }}
              />
            </Box>

            {/* Mensagem */}
            <Box sx={{ 
              bgcolor: '#e8f5e9', 
              p: 2, 
              borderRadius: 1,
              border: '1px solid #c8e6c9'
            }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ðŸ’¬ Mensagem que serÃ¡ enviada
              </Typography>
              
              <TextField
                fullWidth
                required
                multiline
                rows={6}
                label="Mensagem"
                value={formData.mensagem}
                onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                placeholder="Digite a mensagem que serÃ¡ enviada..."
                helperText={`${formData.mensagem.length} caracteres`}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>

            {/* Anexos - PDF e XML */}
            {((linkPDF && linkPDF !== '' && linkPDF !== null) || (linkXML && linkXML !== '' && linkXML !== null)) && (
              <Box sx={{ 
                bgcolor: '#fff3e0', 
                p: 2, 
                borderRadius: 1,
                border: '1px solid #ffe0b2'
              }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ðŸ“Ž Anexos DisponÃ­veis
                </Typography>
                
                <Box sx={{ mt: 1 }}>
                  {(linkPDF && linkPDF !== '' && linkPDF !== null) && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={incluirPDF}
                          onChange={(e) => setIncluirPDF(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PdfIcon color="error" />
                          <Typography variant="body2">
                            Incluir impressÃ£o/DANFE (PDF)
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                  
                  {(linkXML && linkXML !== '' && linkXML !== null) && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={incluirXML}
                          onChange={(e) => setIncluirXML(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <XmlIcon color="primary" />
                          <Typography variant="body2">
                            Incluir arquivo XML
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                </Box>

                <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem' }}>
                  âš¡ Os arquivos serÃ£o baixados automaticamente quando vocÃª clicar em "Abrir WhatsApp". Depois basta anexÃ¡-los na conversa!
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={abrirWhatsAppDireto}
            variant="contained"
            startIcon={<WhatsAppIcon />}
            sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#20BA5A' } }}
          >
            Abrir WhatsApp
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


/**
 * Hook para templates de mensagens por contexto
 */
export const useWhatsAppTemplates = () => {
  const templates = {
    venda_concluida: (cliente, numeroVenda, valor) => 
      `OlÃ¡ ${cliente}! âœ…\n\n` +
      `Sua compra #${numeroVenda} foi finalizada com sucesso!\n\n` +
      `ðŸ’° Valor: R$ ${valor}\n\n` +
      `Obrigado pela preferÃªncia!\n\n` +
      `Atenciosamente,\nAPERUS`,

    nfce_emitida: (cliente, numeroNota, valor, chave) =>
      `OlÃ¡ ${cliente}! ðŸ“„\n\n` +
      `Sua NFC-e foi emitida com sucesso!\n\n` +
      `ðŸ“‹ NÃºmero: ${numeroNota}\n` +
      `ðŸ’° Valor: R$ ${valor}\n` +
      `ðŸ”‘ Chave: ${chave.substring(0, 20)}...\n\n` +
      `Obrigado pela compra!`,

    nfe_emitida: (cliente, numeroNota, valor) =>
      `OlÃ¡ ${cliente}! ðŸ“„\n\n` +
      `Sua NF-e #${numeroNota} foi emitida!\n\n` +
      `ðŸ’° Valor: R$ ${valor}\n\n` +
      `O XML e DANFE foram enviados para seu e-mail.\n\n` +
      `Atenciosamente,\nAPERUS`,

    cte_emitido: (cliente, numeroCte, destino) =>
      `OlÃ¡ ${cliente}! ðŸšš\n\n` +
      `Seu CT-e #${numeroCte} foi emitido!\n\n` +
      `ðŸ“ Destino: ${destino}\n\n` +
      `Acompanhe o transporte pelo nosso sistema.\n\n` +
      `Atenciosamente,\nAPERUS`,

    boleto_vencendo: (cliente, valor, vencimento) =>
      `OlÃ¡ ${cliente}! ðŸ’°\n\n` +
      `Lembrete: VocÃª possui um boleto a vencer.\n\n` +
      `ðŸ’µ Valor: R$ ${valor}\n` +
      `ðŸ“… Vencimento: ${vencimento}\n\n` +
      `Evite multa e juros! Pague atÃ© a data de vencimento.\n\n` +
      `Atenciosamente,\nAPERUS`,

    ordem_servico_pronta: (cliente, numeroOS) =>
      `OlÃ¡ ${cliente}! âœ…\n\n` +
      `Sua Ordem de ServiÃ§o #${numeroOS} estÃ¡ pronta!\n\n` +
      `VocÃª pode retirar a qualquer momento em nosso estabelecimento.\n\n` +
      `Atenciosamente,\nAPERUS`,

    comanda_fechada: (cliente, numeroComanda, valor) =>
      `OlÃ¡ ${cliente}! ðŸ½ï¸\n\n` +
      `Sua comanda #${numeroComanda} foi fechada.\n\n` +
      `ðŸ’° Total: R$ ${valor}\n\n` +
      `Obrigado pela preferÃªncia!\n\n` +
      `Volte sempre!`,

    relatorio_enviado: (cliente, tipoRelatorio) =>
      `OlÃ¡ ${cliente}! ðŸ“Š\n\n` +
      `Seu relatÃ³rio de ${tipoRelatorio} foi gerado com sucesso e estÃ¡ disponÃ­vel no sistema.\n\n` +
      `Acesse com suas credenciais para visualizar.\n\n` +
      `Atenciosamente,\nAPERUS`,

    produto_disponivel: (cliente, produto, preco) =>
      `OlÃ¡ ${cliente}! ðŸ“¦\n\n` +
      `O produto *${produto}* que vocÃª procurava estÃ¡ disponÃ­vel!\n\n` +
      `ðŸ’° PreÃ§o: R$ ${preco}\n\n` +
      `Entre em contato para garantir o seu!\n\n` +
      `Atenciosamente,\nAPERUS`,

    promocao: (cliente, produto, precoAntigo, precoNovo) =>
      `OlÃ¡ ${cliente}! ðŸŽ‰\n\n` +
      `PromoÃ§Ã£o especial para vocÃª!\n\n` +
      `ðŸ“¦ ${produto}\n` +
      `ðŸ’° De: ~~R$ ${precoAntigo}~~ por *R$ ${precoNovo}*\n\n` +
      `Aproveite! VÃ¡lido por tempo limitado.\n\n` +
      `Atenciosamente,\nAPERUS`
  };

  return templates;
};
