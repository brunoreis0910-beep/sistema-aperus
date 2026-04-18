import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const useImpressaoVenda = (axiosInstance) => {
  const [loading, setLoading] = useState(false);

  const gerarPDF = async (dadosVenda) => {
    try {
      setLoading(true);
      console.log('📄 Iniciando geração de PDF...', dadosVenda);
      console.log('💳 Forma de pagamento recebida:', dadosVenda.forma_pagamento);
      console.log('📊 Número de parcelas recebido:', dadosVenda.num_parcelas);

      // Buscar dados da operação para obter empresa e nome da operação
      let operacao = null;
      let empresa = null;
      let clienteCompleto = null;

      console.log('🔍 INICIANDO BUSCA DE DADOS PARA PDF');
      console.log('📊 dadosVenda completo:', dadosVenda);
      console.log('📊 dadosVenda.operacao:', dadosVenda.operacao);

      // PRIORIDADE 1: Verificar se operacao já veio completa dos dados da venda
      if (dadosVenda.operacao && typeof dadosVenda.operacao === 'object') {
        console.log('✅ Operação já veio nos dados da venda!');
        operacao = dadosVenda.operacao;
        console.log('📋 Operação:', operacao);

        // Verificar se empresa veio aninhada na operação
        if (operacao.empresa && typeof operacao.empresa === 'object') {
          empresa = operacao.empresa;
          console.log('✅ Empresa veio aninhada na operação!');
          console.log('🏢 Empresa:', empresa);
        }
      }

      // PRIORIDADE 2: Se não tem operação completa, buscar via API
      if (!operacao && axiosInstance && dadosVenda.id_operacao) {
        try {
          console.log('📡 Buscando operação ID via API:', dadosVenda.id_operacao);
          const opResponse = await axiosInstance.get(`/operacoes/${dadosVenda.id_operacao}/`);
          operacao = opResponse.data;
          console.log('✅ Operação encontrada via API:', operacao);

          // Se a operação retornou dados_empresa completos
          if (operacao.dados_empresa) {
            empresa = operacao.dados_empresa;
            console.log('✅ Usando dados_empresa do serializer:', empresa);
          }
          // Se a operação tem empresa como objeto
          else if (operacao.empresa && typeof operacao.empresa === 'object') {
            empresa = operacao.empresa;
            console.log('✅ Usando empresa da operação:', empresa);
          }
          // Se tem id_empresa, buscar por ID
          else if (operacao.id_empresa) {
            console.log('📡 Buscando empresa por ID:', operacao.id_empresa);
            try {
              const empResponse = await axiosInstance.get(`/empresa/${operacao.id_empresa}/`);
              empresa = empResponse.data;
              console.log('✅ Empresa encontrada por ID:', empresa);
            } catch (empErr) {
              console.error('❌ Erro ao buscar empresa por ID:', empErr);
            }
          }
        } catch (err) {
          console.error('❌ Erro ao buscar operação via API:', err);
        }
      }

      // FALLBACK: Se ainda não tem empresa, tentar buscar a primeira cadastrada
      if (!empresa && axiosInstance) {
        console.log('⚠️ Empresa não encontrada, buscando primeira cadastrada...');
        try {
          const empResponse = await axiosInstance.get('/empresa/');
          const empresas = empResponse.data.results || empResponse.data;
          if (empresas && empresas.length > 0) {
            empresa = empresas[0];
            console.log('✅ Usando primeira empresa cadastrada:', empresa);
          }
        } catch (empErr) {
          console.error('❌ Erro ao buscar empresas:', empErr);
        }
      }

      // Buscar dados completos do cliente se tivermos id_cliente
      if (axiosInstance && dadosVenda.id_cliente) {
        try {
          console.log('📡 Buscando cliente ID:', dadosVenda.id_cliente);
          const clienteResponse = await axiosInstance.get(`/clientes/${dadosVenda.id_cliente}/`);
          clienteCompleto = clienteResponse.data;
          console.log('✅ Cliente encontrado:', clienteCompleto);
        } catch (err) {
          console.error('❌ Erro ao buscar cliente:', err);
        }
      }

      console.log('📊 Resumo dos dados carregados:');
      console.log('  - Operação:', operacao ? '✅' : '❌', operacao);
      console.log('  - Empresa:', empresa ? '✅' : '❌', empresa);
      console.log('  - Cliente completo:', clienteCompleto ? '✅' : '❌', clienteCompleto);
      console.log('  - Itens da venda:', dadosVenda.itens ? dadosVenda.itens.length : 0);

      // função auxiliar para converter valor seguro
      const formatarValorSeguro = (valor) => {
        const num = parseFloat(valor);
        return isNaN(num) ? 0 : num;
      };

      // função auxiliar para formatar data segura
      const formatarDataSegura = (data) => {
        if (!data) return new Date().toLocaleDateString('pt-BR');
        try {
          return new Date(data).toLocaleDateString('pt-BR');
        } catch {
          return new Date().toLocaleDateString('pt-BR');
        }
      };

      console.log('📄 Criando documento PDF...');
      // Criar novo documento PDF
      const doc = new jsPDF();

      let yPos = 15;

      // ============ cabeçalho DA EMPRESA ============
      if (empresa) {
        console.log('🏢 RENDERIZANDO cabeçalho DA EMPRESA');
        console.log('🏢 Dados completos da empresa:', JSON.stringify(empresa, null, 2));

        // Tentar obter o nome da empresa de múltiplas formas
        const nomeEmpresa = empresa.nome_razao_social || empresa.razao_social || empresa.nome_fantasia ||
          empresa.nome || empresa.fantasia || 'Empresa';

        console.log('🏢 Nome da empresa a ser exibido:', nomeEmpresa);
        console.log('🏢 Endereço:', empresa.endereco, empresa.numero);
        console.log('🏢 Telefone:', empresa.telefone);
        console.log('🏢 Email:', empresa.email);
        console.log('🖼️ Logo URL/Caminho:', empresa.logo_url);

        // Área para logo (se tiver)
        let logoCarregada = false;
        if (empresa.logo_url) {
          console.log('🔄 Tentando carregar logo...');

          try {
            let logoPath = empresa.logo_url;

            // Se não começar com http://, https:// ou /, assume que é nome de arquivo na pasta logos
            if (!logoPath.match(/^(https?:\/\/|\/|[a-zA-Z]:)/i)) {
              logoPath = `/logos/${logoPath}`;
              console.log('📁 Caminho construído:', logoPath);
            }

            console.log('🔍 Carregando de:', logoPath);

            // Carregar a imagem
            const img = new Image();
            // NÃO usar crossOrigin para arquivos locais

            const carregamentoPromise = new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                console.error('⏱️ TIMEOUT ao carregar logo (5s)');
                console.error('❌ O arquivo não foi encontrado ou não carregou a tempo');
                console.error('🔍 Verifique:');
                console.error('   1. Arquivo existe em: frontend/public/logos/logo.png');
                console.error('   2. Nome do arquivo está correto (minúsculas/maiúsculas)');
                console.error('   3. Formato da imagem é válido (PNG, JPG, GIF)');
                reject(new Error('Timeout'));
              }, 5000);

              img.onload = () => {
                clearTimeout(timeout);
                console.log('✅ IMAGEM CARREGADA COM SUCESSO!');
                console.log('📐 Dimensões originais:', img.width, 'x', img.height);
                resolve();
              };

              img.onerror = (err) => {
                clearTimeout(timeout);
                console.error('❌ ERRO AO CARREGAR IMAGEM');
                console.error('📍 Caminho tentado:', logoPath);
                console.error('🔍 Erro:', err);
                console.error('💡 Verifique se o arquivo existe em: frontend/public/logos/');
                reject(err);
              };

              console.log('⏳ Iniciando carregamento da imagem...');
              img.src = logoPath;
            });

            await carregamentoPromise;

            console.log('🎨 Processando imagem para o PDF...');

            // Converter para base64 e adicionar ao PDF
            const canvas = document.createElement('canvas');

            // AUMENTAR O TAMANHO DA LOGO NO PDF
            const logoMaxWidth = 50;  // Era 30, agora 50mm
            const logoMaxHeight = 35; // Era 20, agora 35mm

            let width = img.width;
            let height = img.height;

            // Manter a proporção e usar o tamanho original se for menor que o máximo
            const ratio = Math.min(logoMaxWidth / width, logoMaxHeight / height, 1);

            // Usar dimensões maiores para evitar perda de qualidade
            const finalWidth = width * ratio;
            const finalHeight = height * ratio;

            console.log('📐 Dimensões originais:', img.width, 'x', img.height);
            console.log('📐 Dimensões no PDF:', finalWidth.toFixed(2), 'x', finalHeight.toFixed(2), 'mm');

            // Usar o tamanho original da imagem no canvas para manter qualidade
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');

            // Melhorar a qualidade do rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Desenhar imagem no tamanho original
            ctx.drawImage(img, 0, 0, img.width, img.height);

            // Determinar formato baseado na extensão da imagem
            let format = 'PNG';
            let quality = 1.0; // Qualidade máxima

            // Se for PNG, manter PNG (preserva transparência e qualidade)
            if (empresa.logo_url && empresa.logo_url.toLowerCase().endsWith('.png')) {
              format = 'PNG';
              const imgData = canvas.toDataURL('image/png');
              doc.addImage(imgData, 'PNG', 15, yPos, finalWidth, finalHeight);
            } else {
              // Para JPG, usar qualidade máxima
              const imgData = canvas.toDataURL('image/jpeg', 1.0);
              doc.addImage(imgData, 'JPEG', 15, yPos, finalWidth, finalHeight);
            }

            logoCarregada = true;
            console.log(`✅✅✅ LOGO ADICIONADA AO PDF COM SUCESSO! (${format}) ✅✅✅`);

          } catch (err) {
            console.error('❌❌❌ FALHA GERAL AO CARREGAR LOGO ❌❌❌');
            console.error('Erro:', err.message);
            console.error('Stack:', err.stack);
            logoCarregada = false;
          }
        } else {
          console.log('ℹ️ Nenhuma logo configurada (logo_url vazio)');
        }

        // Placeholder se não carregou
        if (empresa.logo_url && !logoCarregada) {
          console.log('📦 Mostrando placeholder (logo não carregou)');
          doc.setDrawColor(200);
          doc.setLineWidth(0.5);
          doc.rect(15, yPos, 50, 35);  // Atualizado para o novo tamanho
          doc.setFontSize(7);
          doc.setTextColor(150);
          doc.text('LOGO', 40, yPos + 17, { align: 'center' });
          doc.text('(arquivo não encontrado)', 40, yPos + 22, { align: 'center' });
          doc.setTextColor(0);
        }

        // Dados da empresa (ao lado da logo se tiver, centralizado se não)
        const xEmpresa = empresa.logo_url ? 70 : 105;  // Era 50, agora 70 (logo maior)
        const alignEmpresa = empresa.logo_url ? 'left' : 'center';

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(nomeEmpresa, xEmpresa, yPos + 5, { align: alignEmpresa });

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        let yEmpresa = yPos + 10;

        // Endereço completo
        const enderecoPartes = [];
        if (empresa.endereco || empresa.logradouro) {
          enderecoPartes.push(empresa.endereco || empresa.logradouro);
        }
        if (empresa.numero) {
          enderecoPartes.push(empresa.numero);
        }
        if (empresa.bairro) {
          enderecoPartes.push(empresa.bairro);
        }

        if (enderecoPartes.length > 0) {
          doc.text(enderecoPartes.join(', '), xEmpresa, yEmpresa, { align: alignEmpresa });
          yEmpresa += 4;
        }

        // Cidade/Estado/CEP
        const cidadeInfo = [];
        if (empresa.cidade) cidadeInfo.push(empresa.cidade);
        if (empresa.estado) cidadeInfo.push(empresa.estado);
        if (empresa.cep) cidadeInfo.push(`CEP: ${empresa.cep}`);

        if (cidadeInfo.length > 0) {
          doc.text(cidadeInfo.join(' - '), xEmpresa, yEmpresa, { align: alignEmpresa });
          yEmpresa += 4;
        }

        // IE (Inscrição Estadual)
        if (empresa.inscricao_estadual) {
          doc.text(`IE: ${empresa.inscricao_estadual}`, xEmpresa, yEmpresa, { align: alignEmpresa });
          yEmpresa += 4;
        }

        // Contato
        const contatoInfo = [];
        const telefone = empresa.telefone || empresa.fone || empresa.celular || '';
        if (telefone) contatoInfo.push(`Tel: ${telefone}`);

        const email = empresa.email || empresa.e_mail || '';
        if (email) contatoInfo.push(`Email: ${email}`);

        if (contatoInfo.length > 0) {
          doc.text(contatoInfo.join(' - '), xEmpresa, yEmpresa, { align: alignEmpresa });
        }

        yPos = empresa.logo_url ? yPos + 40 : yPos + 30;  // Era 35, agora 40 (logo maior)
      } else {
        console.warn('⚠️ Empresa não encontrada - pulando cabeçalho da empresa');
        yPos = 20; // Ajustar posição inicial se não houver empresa
      }

      // ============ NOME DA OPERação ============
      yPos += 5;
      doc.setFillColor(66, 66, 66);
      doc.rect(15, yPos, 180, 10, 'F');

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);

      // Buscar nome da operação de várias fontes
      console.log('📝 ========== DETERMINANDO TÍTULO DA OPERAÇÃO ==========');
      console.log('📝 operacao completo:', JSON.stringify(operacao, null, 2));
      console.log('📝 dadosVenda.operacao:', JSON.stringify(dadosVenda.operacao, null, 2));
      console.log('📝 dadosVenda.id_operacao:', dadosVenda.id_operacao);

      let nomeOperacao = null;

      // Prioridade 1: dadosVenda.operacao.nome_operacao (vem do backend já serializado)
      if (dadosVenda.operacao && typeof dadosVenda.operacao === 'object' && dadosVenda.operacao.nome_operacao) {
        nomeOperacao = dadosVenda.operacao.nome_operacao;
        console.log('✅ Usando dadosVenda.operacao.nome_operacao:', nomeOperacao);
      }
      // Prioridade 2: operacao.nome_operacao (buscado via API)
      else if (operacao?.nome_operacao) {
        nomeOperacao = operacao.nome_operacao;
        console.log('✅ Usando operacao.nome_operacao:', nomeOperacao);
      }
      // Prioridade 3: dadosVenda.operacao como string
      else if (typeof dadosVenda.operacao === 'string' && dadosVenda.operacao.trim()) {
        nomeOperacao = dadosVenda.operacao;
        console.log('✅ Usando dadosVenda.operacao (string):', nomeOperacao);
      }
      // Prioridade 4: operacao.nome
      else if (operacao?.nome) {
        nomeOperacao = operacao.nome;
        console.log('✅ Usando operacao.nome:', nomeOperacao);
      }

      // Se ainda não encontrou, usar fallback
      if (!nomeOperacao || nomeOperacao.trim() === '') {
        nomeOperacao = 'DOCUMENTO';
        console.warn('⚠️ Nome da operação não encontrado, usando fallback:', nomeOperacao);
      }

      console.log('🎯 ========== TÍTULO FINAL NO PDF:', nomeOperacao, '==========');
      doc.text(nomeOperacao.toUpperCase(), 105, yPos + 7, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPos += 15;

      // ============ INFORMAÇÕES DO DOCUMENTO ============
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');

      // Box com fundo cinza claro - tudo na mesma linha
      doc.setFillColor(245, 245, 245);
      doc.rect(15, yPos, 180, 8, 'F');

      doc.setFont(undefined, 'bold');
      doc.text('Documento:', 17, yPos + 5);
      doc.setFont(undefined, 'normal');
      doc.text(dadosVenda.numero_documento || 'N/A', 42, yPos + 5);

      doc.setFont(undefined, 'bold');
      doc.text('Data:', 80, yPos + 5);
      doc.setFont(undefined, 'normal');
      doc.text(formatarDataSegura(dadosVenda.data_venda), 93, yPos + 5);

      yPos += 13;

      // ============ DADOS DO CLIENTE ============
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('DADOS DO CLIENTE', 15, yPos);
      yPos += 1;
      doc.setLineWidth(0.5);
      doc.line(15, yPos, 195, yPos);
      yPos += 5;

      doc.setFontSize(9);
      if (clienteCompleto) {
        // Nome/Razão Social
        doc.setFont(undefined, 'bold');
        doc.text('Nome/Razão Social:', 17, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(clienteCompleto.nome_razao_social || clienteCompleto.nome || 'Cliente', 60, yPos);
        yPos += 5;

        // CPF/CNPJ e Telefone na mesma linha
        if (clienteCompleto.cpf_cnpj || clienteCompleto.telefone) {
          if (clienteCompleto.cpf_cnpj) {
            doc.setFont(undefined, 'bold');
            doc.text('CPF/CNPJ:', 17, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(clienteCompleto.cpf_cnpj, 40, yPos);
          }

          if (clienteCompleto.telefone) {
            doc.setFont(undefined, 'bold');
            doc.text('Telefone:', 100, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(clienteCompleto.telefone, 120, yPos);
          }
          yPos += 5;
        }

        // IE e Email na mesma linha
        if (clienteCompleto.inscricao_estadual || clienteCompleto.email) {
          if (clienteCompleto.inscricao_estadual) {
            doc.setFont(undefined, 'bold');
            doc.text('IE:', 17, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(clienteCompleto.inscricao_estadual, 25, yPos);
          }
          if (clienteCompleto.email) {
            doc.setFont(undefined, 'bold');
            doc.text('Email:', 100, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(clienteCompleto.email, 115, yPos);
          }
          yPos += 5;
        }

        // Endereço completo
        const enderecoPartes = [];
        if (clienteCompleto.endereco || clienteCompleto.logradouro) enderecoPartes.push(clienteCompleto.endereco || clienteCompleto.logradouro);
        if (clienteCompleto.numero) enderecoPartes.push(clienteCompleto.numero);
        if (clienteCompleto.complemento) enderecoPartes.push(clienteCompleto.complemento);
        if (enderecoPartes.length > 0) {
          doc.setFont(undefined, 'bold');
          doc.text('Endereço:', 17, yPos);
          doc.setFont(undefined, 'normal');
          doc.text(enderecoPartes.join(', '), 40, yPos);
          yPos += 5;
        }

        // Bairro, Cidade/Estado/CEP
        const localPartes = [];
        if (clienteCompleto.bairro) localPartes.push(clienteCompleto.bairro);
        if (clienteCompleto.cidade) localPartes.push(clienteCompleto.cidade);
        if (clienteCompleto.estado || clienteCompleto.uf) localPartes.push(clienteCompleto.estado || clienteCompleto.uf);
        if (clienteCompleto.cep) localPartes.push(`CEP: ${clienteCompleto.cep}`);
        if (localPartes.length > 0) {
          doc.setFont(undefined, 'bold');
          doc.text('Local:', 17, yPos);
          doc.setFont(undefined, 'normal');
          doc.text(localPartes.join(' - '), 32, yPos);
          yPos += 5;
        }
      } else {
        doc.setFont(undefined, 'normal');
        doc.text(dadosVenda.nome_cliente || dadosVenda.cliente || 'Cliente não informado', 17, yPos);
        yPos += 5;
      }

      // Vendedor
      doc.setFont(undefined, 'bold');
      doc.text('Vendedor:', 17, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(dadosVenda.nome_vendedor || dadosVenda.vendedor || 'não informado', 40, yPos);
      yPos += 8;

      // Verificar se há espaço para condições de pagamento
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      // ============ CONDIÇÕES DE PAGAMENTO ============
      console.log('💳 RENDERIZANDO CONDIÇÕES DE PAGAMENTO');
      console.log('   - forma_pagamento:', dadosVenda.forma_pagamento);
      console.log('   - num_parcelas:', dadosVenda.num_parcelas);
      console.log('   - prazo:', dadosVenda.prazo);

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('CONDIÇÕES DE PAGAMENTO', 15, yPos);
      yPos += 1;
      doc.setLineWidth(0.5);
      doc.line(15, yPos, 195, yPos);
      yPos += 5;

      doc.setFontSize(9);

      // Forma de pagamento
      if (dadosVenda.forma_pagamento) {
        console.log('✅ Adicionando forma de pagamento ao PDF:', dadosVenda.forma_pagamento);
        doc.setFont(undefined, 'bold');
        doc.text('Forma de Pagamento:', 17, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(dadosVenda.forma_pagamento, 60, yPos);
        yPos += 5;
      } else {
        console.warn('⚠️ forma_pagamento está vazio ou undefined');
      }

      // Número de parcelas e prazo
      if (dadosVenda.num_parcelas || dadosVenda.prazo) {
        if (dadosVenda.num_parcelas) {
          doc.setFont(undefined, 'bold');
          doc.text('Parcelas:', 17, yPos);
          doc.setFont(undefined, 'normal');
          doc.text(String(dadosVenda.num_parcelas || '1'), 40, yPos);
        }

        if (dadosVenda.prazo) {
          doc.setFont(undefined, 'bold');
          doc.text('Prazo:', 100, yPos);
          doc.setFont(undefined, 'normal');
          doc.text(dadosVenda.prazo, 120, yPos);
        }
        yPos += 5;
      }

      // Observações sobre pagamento
      if (dadosVenda.observacao_pagamento || dadosVenda.observacao) {
        doc.setFont(undefined, 'bold');
        doc.text('Observações:', 17, yPos);
        doc.setFont(undefined, 'normal');
        const obs = dadosVenda.observacao_pagamento || dadosVenda.observacao;
        const obsLinhas = doc.splitTextToSize(obs, 160);
        doc.text(obsLinhas, 17, yPos + 4);
        yPos += (obsLinhas.length * 4) + 1;
      }

      yPos += 3;

      // Verificar se há espaço para tabela de produtos
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      // ============ TABELA DE PRODUTOS ============
      console.log('📦 Criando tabela de produtos...');
      console.log('📦 Itens da venda:', dadosVenda.itens);
      console.log('🖼️ Incluir imagens?', dadosVenda.incluirImagens);
      console.log('📦 ESTRUTURA COMPLETA DOS DADOS DA VENDA:', JSON.stringify(dadosVenda, null, 2));

      // Se incluirImagens for true, usar layout com imagens
      if (dadosVenda.incluirImagens && dadosVenda.itens && dadosVenda.itens.length > 0) {
        console.log('🖼️ Gerando PDF com IMAGENS dos produtos');

        for (const [index, item] of dadosVenda.itens.entries()) {
          console.log(`🖼️ Produto ${index + 1} - ESTRUTURA COMPLETA:`, JSON.stringify(item, null, 2));

          // Verificar se há espaço suficiente na página (precisa de ~50mm)
          if (yPos > 230) {
            doc.addPage();
            yPos = 20;
          }

          // Box do produto
          const temCaixas = item.metragem_caixa && parseFloat(item.metragem_caixa) > 0;
          const temDesconto = formatarValorSeguro(item.desconto_valor || item.desconto || 0) > 0;
          let boxHeight = 45;
          if (temCaixas) boxHeight += 7;
          if (temDesconto) boxHeight += 5;
          doc.setDrawColor(200, 200, 200);
          doc.rect(15, yPos, 180, boxHeight);

          // Área da imagem (quadrado à esquerda)
          const imgSize = 35;
          const imgX = 20;
          const imgY = yPos + 5;

          // Tentar carregar imagem do produto
          let imagemCarregada = false;
          const urlImagem = item.imagem_url || item.imagem || item.foto || item.imagem_produto;

          console.log(`   🔍 Verificando imagem do produto:`, {
            imagem_url: item.imagem_url,
            imagem: item.imagem,
            foto: item.foto,
            imagem_produto: item.imagem_produto,
            urlFinal: urlImagem
          });

          if (urlImagem && urlImagem.trim()) {
            try {
              console.log(`   🖼️ Carregando imagem:`, urlImagem.substring(0, 100) + '...');

              // Verificar se já é base64
              if (urlImagem.trim().startsWith('data:image')) {
                console.log(`   📸 Imagem em formato base64 detectada`);

                // Usar imagem base64 diretamente
                const base64 = urlImagem.trim();

                // Detectar formato da imagem pelo data URI
                let formato = 'JPEG';
                if (base64.includes('data:image/png')) formato = 'PNG';
                else if (base64.includes('data:image/gif')) formato = 'GIF';
                else if (base64.includes('data:image/webp')) formato = 'WEBP';
                else if (base64.includes('data:image/svg')) formato = 'SVG';

                console.log(`   🎨 Formato base64 detectado:`, formato);

                // Adicionar imagem ao PDF
                doc.addImage(base64, formato, imgX, imgY, imgSize, imgSize);
                console.log(`   ✅ Imagem base64 adicionada ao PDF com sucesso!`);
                imagemCarregada = true;

              } else {
                // Processar como URL normal
                let urlCompleta = urlImagem.trim();
                let usarProxy = false;

                if (!urlCompleta.startsWith('http')) {
                  // Se for caminho relativo, adicionar o base URL do backend
                  const baseURL = window.location.origin;
                  urlCompleta = urlCompleta.startsWith('/') ? `${baseURL}${urlCompleta}` : `${baseURL}/${urlCompleta}`;
                } else {
                  // Se for URL externa (http/https), usar proxy para evitar CORS
                  const baseURL = window.location.origin;
                  const urlProxy = `${baseURL}/api/proxy-image/?url=${encodeURIComponent(urlCompleta)}`;
                  console.log(`   🔄 Usando proxy para evitar CORS:`, urlProxy);
                  urlCompleta = urlProxy;
                  usarProxy = true;
                }

                console.log(`   📡 URL completa para fetch:`, urlCompleta);

                // Carregar imagem via fetch com modo no-cors como fallback
                let response;
                try {
                  response = await fetch(urlCompleta, {
                    mode: 'cors',
                    credentials: 'omit' // Não enviar cookies para evitar problemas CORS
                  });
                } catch (corsErr) {
                  console.warn(`   ⚠️ Erro CORS, tentando via proxy...`);
                  // Se der erro CORS, tentar carregar via proxy (mesmo domínio)
                  // Usar um serviço proxy ou carregar via img element
                  throw new Error('CORS bloqueado');
                }

                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const blob = await response.blob();
                console.log(`   📦 Blob recebido:`, blob.type, blob.size, 'bytes');

                // Verificar se o blob é válido
                if (blob.size === 0) {
                  throw new Error('Imagem vazia');
                }

                // Converter para base64
                const base64 = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });

                console.log(`   ✅ Imagem convertida para base64 (${Math.round(base64.length / 1024)}KB)`);

                // Detectar formato da imagem
                let formato = 'JPEG';
                if (blob.type.includes('png')) formato = 'PNG';
                else if (blob.type.includes('gif')) formato = 'GIF';
                else if (blob.type.includes('webp')) formato = 'WEBP';
                else if (blob.type.includes('svg')) formato = 'SVG';

                console.log(`   🎨 Formato detectado:`, formato);

                // Adicionar imagem ao PDF com tratamento de erro
                try {
                  doc.addImage(base64, formato, imgX, imgY, imgSize, imgSize);
                  imagemCarregada = true;
                  console.log(`   ✅ Imagem adicionada ao PDF com sucesso!`);
                } catch (addErr) {
                  console.error(`   ❌ Erro ao adicionar imagem no PDF:`, addErr);
                  throw addErr;
                }
              }

            } catch (err) {
              console.error(`   ❌ Erro ao carregar imagem:`, err.message);
              if (err.message.includes('CORS')) {
                console.warn(`   💡 Dica: Use imagens do mesmo domínio ou configure CORS no servidor`);
              }
            }
          } else {
            console.log(`   ℹ️ Produto sem imagem cadastrada`);
          }

          if (!imagemCarregada) {
            // Desenhar placeholder sem imagem
            doc.setFillColor(245, 245, 245);
            doc.rect(imgX, imgY, imgSize, imgSize, 'F');
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Sem', imgX + imgSize / 2, imgY + imgSize / 2 - 2, { align: 'center' });
            doc.text('Imagem', imgX + imgSize / 2, imgY + imgSize / 2 + 2, { align: 'center' });
            doc.setTextColor(0, 0, 0);
          }

          // Informações do produto (à direita da imagem)
          const textX = imgX + imgSize + 10;
          let textY = imgY + 5;

          // Nome do produto
          let nomeProduto = item.produto_nome || item.produto || item.nome_produto || item.nome || 'Produto';
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text(nomeProduto, textX, textY);
          textY += 6;

          // Código e Marca
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          const codigoProduto = item.codigo_produto || item.codigo || '-';
          const marcaProduto = item.marca_produto || item.marca || '-';
          doc.text(`Código: ${codigoProduto} | Marca: ${marcaProduto}`, textX, textY);
          textY += 8;

          // Quantidade e valores
          doc.setFontSize(9);
          const quantidade = parseFloat(item.quantidade || 0).toFixed(3);
          const valorUnit = formatarValorSeguro(item.valor_unitario || 0).toFixed(2);
          const valorTotal = formatarValorSeguro(item.valor_total || item.subtotal || 0).toFixed(2);

          doc.text(`Quantidade: ${quantidade}`, textX, textY);

          // Informação de caixas para materiais de construção
          if (item.metragem_caixa && parseFloat(item.metragem_caixa) > 0) {
            const metCaixa = parseFloat(item.metragem_caixa);
            const qtdCaixas = Math.ceil(parseFloat(item.quantidade || 0) / metCaixa);
            textY += 5;
            doc.setFontSize(8);
            doc.setTextColor(80, 80, 80);
            doc.text(`Caixas sugeridas: ${qtdCaixas} cx (${metCaixa.toFixed(2)} m\u00B2/cx)`, textX, textY);
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
          }

          textY += 5;
          doc.text(`Valor Unit.: R$ ${valorUnit}`, textX, textY);

          // Desconto do item
          const descontoItem = formatarValorSeguro(item.desconto_valor || item.desconto || 0);
          if (descontoItem > 0) {
            textY += 5;
            doc.setTextColor(200, 0, 0);
            doc.text(`Desconto: -R$ ${descontoItem.toFixed(2)}`, textX, textY);
            doc.setTextColor(0, 0, 0);
          }

          textY += 5;
          doc.setFont(undefined, 'bold');
          doc.text(`Valor Total: R$ ${valorTotal}`, textX, textY);
          doc.setFont(undefined, 'normal');

          yPos += boxHeight + 3;
        }

        yPos += 5; // Espaço extra após os produtos
      } else {
        console.log('📋 Gerando PDF SEM imagens (tabela tradicional)');

        const itensFormatados = (dadosVenda.itens || []).map((item, index) => {
          console.log(`📦 Item ${index + 1} - TODOS OS CAMPOS:`, JSON.stringify(item, null, 2));

          // Tentar múltiplas formas de obter o nome do produto
          let nomeProduto = 'Produto não identificado';

          // Primeira prioridade: campos diretos
          if (item.produto_nome && item.produto_nome.trim()) {
            nomeProduto = item.produto_nome;
            console.log(`   ✅ Nome encontrado em: produto_nome = "${nomeProduto}"`);
          } else if (item.produto && item.produto.trim && item.produto.trim()) {
            nomeProduto = item.produto;
            console.log(`   ✅ Nome encontrado em: produto = "${nomeProduto}"`);
          } else if (item.nome_produto && item.nome_produto.trim()) {
            nomeProduto = item.nome_produto;
            console.log(`   ✅ Nome encontrado em: nome_produto = "${nomeProduto}"`);
          } else if (item.nome && item.nome.trim()) {
            nomeProduto = item.nome;
            console.log(`   ✅ Nome encontrado em: nome = "${nomeProduto}"`);
          } else if (item.descricao && item.descricao.trim()) {
            nomeProduto = item.descricao;
            console.log(`   ✅ Nome encontrado em: descricao = "${nomeProduto}"`);
          } else {
            console.warn(`   ⚠️ NOME DO PRODUTO não ENCONTRADO!`);
            console.warn(`   Campos disponíveis:`, Object.keys(item));
            console.warn(`   Valores dos campos:`, {
              produto_nome: item.produto_nome,
              produto: item.produto,
              nome_produto: item.nome_produto,
              nome: item.nome,
              descricao: item.descricao
            });
            // Se tiver ID do produto, pelo menos mostrar isso
            if (item.id_produto) {
              nomeProduto = `Produto ID: ${item.id_produto}`;
            }
          }

          // Obter código e marca do produto
          const codigoProduto = item.codigo_produto || item.codigo || '';
          const marcaProduto = item.marca_produto || item.marca || '';

          const quantidade = parseFloat(item.quantidade || 0).toFixed(3);
          const valorUnit = formatarValorSeguro(item.valor_unitario || 0).toFixed(2);
          const valorTotal = formatarValorSeguro(item.valor_total || item.subtotal || 0).toFixed(2);

          // Calcular caixas sugeridas para materiais de construção
          let qtdDisplay = quantidade;
          if (item.metragem_caixa && parseFloat(item.metragem_caixa) > 0) {
            const metCaixa = parseFloat(item.metragem_caixa);
            const qtdCaixas = Math.ceil(parseFloat(item.quantidade || 0) / metCaixa);
            qtdDisplay = `${quantidade}\n(${qtdCaixas} cx)`;
          }

          // Desconto do item
          const descontoItem = formatarValorSeguro(item.desconto_valor || item.desconto || 0);
          const descontoStr = descontoItem > 0 ? `R$ ${descontoItem.toFixed(2)}` : '-';

          console.log(`   ➜ Código: "${codigoProduto}" | Nome: "${nomeProduto}" | Marca: "${marcaProduto}"`);
          console.log(`   ➜ Qtd: ${quantidade} | Unit: R$ ${valorUnit} | Desc: ${descontoStr} | Total: R$ ${valorTotal}`);

          return [
            codigoProduto,
            nomeProduto,
            marcaProduto,
            qtdDisplay,
            `R$ ${valorUnit}`,
            descontoStr,
            `R$ ${valorTotal}`
          ];
        });

        console.log('✅ Itens formatados para tabela:', itensFormatados.length, 'itens');

        autoTable(doc, {
          startY: yPos,
          head: [['CÓDIGO', 'PRODUTO', 'MARCA', 'QTD.', 'V. UNIT.', 'DESC.', 'V. TOTAL']],
          body: itensFormatados,
          theme: 'striped',
          headStyles: {
            fillColor: [66, 66, 66],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center'
          },
          styles: {
            fontSize: 8,
            cellPadding: 2,
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
          },
          columnStyles: {
            0: { cellWidth: 22, halign: 'left', fontSize: 7 },
            1: { cellWidth: 48, halign: 'left', fontSize: 8 },
            2: { cellWidth: 22, halign: 'left', fontSize: 8 },
            3: { cellWidth: 20, halign: 'center', fontSize: 8 },
            4: { cellWidth: 22, halign: 'right', fontSize: 8 },
            5: { cellWidth: 20, halign: 'right', fontSize: 8, textColor: [200, 0, 0] },
            6: { cellWidth: 22, halign: 'right', fontSize: 8 }
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250]
          }
        });

        // ============ TOTAL ============
        // Se usou autoTable, pegar a posição final dela
        if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
          yPos = doc.lastAutoTable.finalY + 5;
        }
      } // Fecha o else da verificação de incluirImagens

      // ============ RESUMO FINANCEIRO ============
      // Calcular subtotal dos itens (soma dos valor_total de cada item)
      const subtotalItens = (dadosVenda.itens || []).reduce((acc, item) => {
        return acc + formatarValorSeguro(item.valor_total || item.subtotal || 0);
      }, 0);

      // Calcular total de descontos por item
      const totalDescontoItens = (dadosVenda.itens || []).reduce((acc, item) => {
        return acc + formatarValorSeguro(item.desconto_valor || item.desconto || 0);
      }, 0);

      // Desconto geral e taxa de entrega
      const taxaEntrega = formatarValorSeguro(dadosVenda.taxa_entrega || 0);
      const valorTotal = formatarValorSeguro(dadosVenda.valor_total);

      // Calcular desconto geral: subtotalItens + taxa - valorTotal = desconto_geral
      // Mas se dadosVenda.desconto estiver disponível, usar diretamente
      let descontoGeral = formatarValorSeguro(dadosVenda.desconto || 0);
      if (!descontoGeral && subtotalItens > 0) {
        const descontoCalculado = subtotalItens + taxaEntrega - valorTotal;
        descontoGeral = descontoCalculado > 0.01 ? descontoCalculado : 0;
      }

      const temDescontoItens = totalDescontoItens > 0;
      const temDescontoGeral = descontoGeral > 0;
      const temTaxaEntrega = taxaEntrega > 0;
      const temDetalhes = temDescontoItens || temDescontoGeral || temTaxaEntrega;

      if (temDetalhes) {
        // Subtotal bruto (antes dos descontos por item)
        const subtotalBruto = subtotalItens + totalDescontoItens;
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        const xLabel = 130;
        const xValor = 190;

        doc.text('Subtotal:', xLabel, yPos + 4);
        doc.text(`R$ ${subtotalBruto.toFixed(2)}`, xValor, yPos + 4, { align: 'right' });
        yPos += 5;

        if (temDescontoItens) {
          doc.setTextColor(200, 0, 0);
          doc.text('Desc. Itens:', xLabel, yPos + 4);
          doc.text(`-R$ ${totalDescontoItens.toFixed(2)}`, xValor, yPos + 4, { align: 'right' });
          doc.setTextColor(0, 0, 0);
          yPos += 5;
        }

        if (temDescontoGeral) {
          doc.setTextColor(200, 0, 0);
          doc.text('Desc. Geral:', xLabel, yPos + 4);
          doc.text(`-R$ ${descontoGeral.toFixed(2)}`, xValor, yPos + 4, { align: 'right' });
          doc.setTextColor(0, 0, 0);
          yPos += 5;
        }

        if (temTaxaEntrega) {
          doc.text('Taxa Entrega:', xLabel, yPos + 4);
          doc.text(`R$ ${taxaEntrega.toFixed(2)}`, xValor, yPos + 4, { align: 'right' });
          yPos += 5;
        }

        yPos += 2;
      }

      // Box do total
      doc.setFillColor(66, 66, 66);
      doc.rect(125, yPos, 70, 12, 'F');

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('VALOR TOTAL:', 130, yPos + 8);
      doc.setFontSize(14);
      doc.text(`R$ ${valorTotal.toFixed(2)}`, 190, yPos + 8, { align: 'right' });
      doc.setTextColor(0, 0, 0);

      // ============ CAMPO DE ASSINATURA ============
      yPos += 20;

      // Calcular se há espaço suficiente para assinatura na página atual
      if (yPos > 240) {
        // Se não houver espaço, adicionar nova página
        doc.addPage();
        yPos = 20;
      }

      // Espaço para assinatura
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('ASSINATURA DO CLIENTE', 105, yPos, { align: 'center' });
      yPos += 15;

      // Linha para assinatura
      doc.setLineWidth(0.5);
      doc.line(40, yPos, 170, yPos);
      yPos += 5;

      // Nome do cliente abaixo da linha
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const nomeCliente = clienteCompleto?.nome_razao_social || clienteCompleto?.nome || dadosVenda.nome_cliente || dadosVenda.cliente || 'CLIENTE';
      doc.text(nomeCliente.toUpperCase(), 105, yPos, { align: 'center' });

      // CPF/CNPJ se disponível
      if (clienteCompleto?.cpf_cnpj) {
        yPos += 4;
        doc.setFontSize(8);
        doc.text(`CPF/CNPJ: ${clienteCompleto.cpf_cnpj}`, 105, yPos, { align: 'center' });
      }

      // ============ RODAPÉ ============
      yPos += 10;
      if (yPos > 260) yPos = 260; // Garantir que fique no rodapé

      doc.setFontSize(8);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(100);
      const dataHoraEmissao = new Date().toLocaleString('pt-BR');
      doc.text(`Documento gerado em: ${dataHoraEmissao}`, 105, yPos, { align: 'center' });
      doc.setTextColor(0);

      // Salvar PDF
      const docNumero = dadosVenda.numero_documento || 'sem_numero';
      const nomeArquivo = `${nomeOperacao.toLowerCase().replace(/\s+/g, '_')}_${docNumero}.pdf`;
      console.log('💾 Salvando PDF:', nomeArquivo);

      // Gerar blob do PDF
      const pdfBlob = doc.output('blob');

      // Fazer download
      doc.save(nomeArquivo);

      console.log(' PDF gerado com sucesso!');
      setLoading(false);
      return { success: true, message: 'PDF gerado com sucesso!', pdfBlob: pdfBlob };

    } catch (error) {
      console.error(' Erro ao gerar PDF:', error);
      setLoading(false);
      return { success: false, message: 'Erro ao gerar PDF: ' + error.message };
    }
  };

  const imprimirDireto = async (dadosVenda) => {
    try {
      setLoading(true);
      console.log('🖨️ Gerando PDF para impressão...');

      const resultado = await gerarPDF(dadosVenda);

      if (resultado.success && resultado.pdfBlob) {
        console.log('✅ PDF gerado, abrindo janela de impressão...');

        // Criar URL do blob
        const pdfUrl = URL.createObjectURL(resultado.pdfBlob);

        // Abrir em nova janela e imprimir
        const printWindow = window.open(pdfUrl, '_blank');

        if (printWindow) {
          printWindow.onload = () => {
            console.log('📄 PDF carregado, iniciando impressão...');
            printWindow.print();

            // Limpar URL após um tempo
            setTimeout(() => {
              URL.revokeObjectURL(pdfUrl);
            }, 1000);
          };
        } else {
          console.warn('⚠️ Não foi possível abrir janela de impressão');
          // Fallback: fazer download
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = `venda_${dadosVenda.numero_documento || 'sem_numero'}.pdf`;
          link.click();
          URL.revokeObjectURL(pdfUrl);
        }
      }

      setLoading(false);
      return resultado;
    } catch (error) {
      console.error('❌ Erro ao imprimir:', error);
      setLoading(false);
      return { success: false, message: 'Erro ao imprimir: ' + error.message };
    }
  };

  const compartilharWhatsApp = async (dadosVenda, clienteCompleto = null, gerarPDFJunto = false) => {
    try {
      console.log('📱 Iniciando compartilhamento WhatsApp...');
      console.log('📊 Dados da venda:', dadosVenda);
      console.log('👤 Cliente completo:', clienteCompleto);
      console.log('📄 Gerar PDF junto?', gerarPDFJunto);

      // Se solicitado, gerar PDF primeiro
      if (gerarPDFJunto) {
        console.log('📄 Gerando PDF antes de abrir WhatsApp...');
        try {
          await gerarPDF(dadosVenda);
          console.log('✅ PDF gerado! O usuário pode anexá-lo manualmente no WhatsApp.');
        } catch (err) {
          console.warn('⚠️ Erro ao gerar PDF:', err);
        }
      }

      const formatarValorSeguro = (valor) => {
        const num = parseFloat(valor);
        return isNaN(num) ? 0 : num;
      };

      const formatarDataSegura = (data) => {
        if (!data) return new Date().toLocaleDateString('pt-BR');
        try {
          return new Date(data).toLocaleDateString('pt-BR');
        } catch {
          return new Date().toLocaleDateString('pt-BR');
        }
      };

      // Buscar telefone do cliente
      let telefoneWhatsApp = '';

      // Se cliente completo foi passado, usar dados dele
      if (clienteCompleto) {
        telefoneWhatsApp = clienteCompleto.whatsapp ||
          clienteCompleto.telefone ||
          clienteCompleto.celular ||
          clienteCompleto.fone || '';
      }

      // Se não tem cliente completo mas tem ID, buscar da API
      if (!telefoneWhatsApp && dadosVenda.id_cliente && axiosInstance) {
        try {
          console.log('📡 Buscando telefone do cliente ID:', dadosVenda.id_cliente);
          const response = await axiosInstance.get(`/clientes/${dadosVenda.id_cliente}/`);
          const cliente = response.data;
          telefoneWhatsApp = cliente.whatsapp ||
            cliente.telefone ||
            cliente.celular ||
            cliente.fone || '';
          console.log('✅ Telefone encontrado:', telefoneWhatsApp);
        } catch (err) {
          console.warn('⚠️ Erro ao buscar telefone do cliente:', err);
        }
      }

      // Limpar telefone (remover caracteres especiais)
      telefoneWhatsApp = telefoneWhatsApp.replace(/\D/g, '');

      // Adicionar código do país se não tiver (Brasil = 55)
      if (telefoneWhatsApp && !telefoneWhatsApp.startsWith('55')) {
        telefoneWhatsApp = '55' + telefoneWhatsApp;
      }

      console.log('📞 Telefone formatado:', telefoneWhatsApp);

      let mensagem = `
*VENDA REALIZADA*

*Documento:* ${dadosVenda.numero_documento || 'N/A'}
*Data:* ${formatarDataSegura(dadosVenda.data_venda)}
*Cliente:* ${dadosVenda.nome_cliente || dadosVenda.cliente || 'não informado'}
*Vendedor:* ${dadosVenda.nome_vendedor || dadosVenda.vendedor || 'não informado'}

*TOTAL: R$ ${formatarValorSeguro(dadosVenda.valor_total).toFixed(2)}*`;

      // Adicionar produtos
      if (dadosVenda.itens && dadosVenda.itens.length > 0) {
        mensagem += '\n\n*PRODUTOS:*';
        dadosVenda.itens.forEach((item, index) => {
          // Tentar várias formas de obter o nome do produto
          const nomeProduto = item.produto_nome ||
            item.produto ||
            item.nome_produto ||
            item.descricao ||
            'Produto sem nome';

          const codigoProduto = item.codigo_produto || item.codigo || '';
          const marcaProduto = item.marca_produto || item.marca || '';
          const quantidade = parseFloat(item.quantidade || 0);
          const valorUnit = formatarValorSeguro(item.valor_unitario);
          const valorTotal = formatarValorSeguro(item.valor_total);

          // Montar linha do produto
          mensagem += `\n${index + 1}. ${nomeProduto}`;
          if (codigoProduto) mensagem += ` (Cód: ${codigoProduto})`;
          if (marcaProduto && marcaProduto !== 'Outros') mensagem += ` - ${marcaProduto}`;
          mensagem += `\n   Qtd: ${quantidade.toFixed(0)} x R$ ${valorUnit.toFixed(2)} = R$ ${valorTotal.toFixed(2)}`;
        });
      }

      // Adicionar condições de pagamento se disponíveis
      if (dadosVenda.forma_pagamento || dadosVenda.num_parcelas) {
        mensagem += '\n\n*CONDIÇÕES DE PAGAMENTO*';
        if (dadosVenda.forma_pagamento) {
          mensagem += `\n*Forma:* ${dadosVenda.forma_pagamento}`;
        }
        if (dadosVenda.num_parcelas) {
          mensagem += `\n*Parcelas:* ${dadosVenda.num_parcelas}x`;
        }
        if (dadosVenda.prazo) {
          mensagem += `\n*Prazo:* ${dadosVenda.prazo}`;
        }
      }

      if (dadosVenda.observacao) {
        mensagem += `\n\n*Observações:* ${dadosVenda.observacao}`;
      }

      mensagem = mensagem.trim();

      // Construir URL do WhatsApp
      let url;

      if (telefoneWhatsApp) {
        // Usar link universal wa.me que funciona em qualquer dispositivo
        url = `https://wa.me/${telefoneWhatsApp}?text=${encodeURIComponent(mensagem)}`;
        console.log('✅ Abrindo WhatsApp para:', telefoneWhatsApp);
      } else {
        // Sem número (abre WhatsApp Web)
        url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        console.warn('⚠️ Telefone não encontrado, abrindo sem número específico');
      }

      // Abrir WhatsApp em nova aba
      window.open(url, '_blank');

      return {
        success: true,
        message: telefoneWhatsApp
          ? `WhatsApp aberto para ${telefoneWhatsApp}!`
          : 'WhatsApp aberto para compartilhamento!'
      };

    } catch (error) {
      console.error('Erro ao compartilhar no WhatsApp:', error);
      return { success: false, message: 'Erro ao compartilhar: ' + error.message };
    }
  };

  return {
    loading,
    gerarPDF,
    imprimirDireto,
    compartilharWhatsApp
  };
};

export default useImpressaoVenda;
