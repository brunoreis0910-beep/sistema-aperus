# C:\APERUS\SistemaAperus\api\logic\renderizador.py

def montar_html_gabarito_customizado(layout_json, dados_reais_locais, largura_mm=210, altura_mm=297, tipo_gabarito='A4_RETRATO'):
    """
    Monta um documento HTML completo e limpo para impressão a partir de uma estrutura de layout JSON 
    e um dicionário de dados reais locais.
    """
    # Helper function for layout migration
    def get_banded_layout(layout):
        if not layout:
            return {
                'configuracao_faixas': {'header_height': 120, 'detail_height': 40, 'summary_height': 60, 'footer_height': 80},
                'elementos': []
            }
        if isinstance(layout, dict) and 'configuracao_faixas' in layout and 'elementos' in layout:
            return layout
            
        def infer_section(el):
            sec = el.get('secao')
            if sec in ['header', 'detail', 'summary', 'footer']:
                return sec
            chave = el.get('campo_origem', '')
            if chave.startswith('produto.') or chave == 'venda.itens_tabela':
                return 'detail'
            if chave in ['venda.total', 'venda.subtotal', 'venda.desconto', 'venda.forma_pagamento']:
                return 'summary'
            if chave.startswith('empresa.') or chave.startswith('cliente.') or chave in ['venda.numero', 'venda.data']:
                return 'header'
            return 'header'

        grouped = {'header': [], 'detail': [], 'summary': [], 'footer': []}
        for el in layout:
            sec = infer_section(el)
            grouped[sec].append(el)

        configuracao_faixas = {
            'header_height': 120,
            'detail_height': 40,
            'summary_height': 60,
            'footer_height': 80
        }

        elementos_novos = []

        for sec in ['header', 'detail', 'summary', 'footer']:
            els = grouped[sec]
            if not els:
                continue
            min_y = min([e.get('y', 0) for e in els])
            for el in els:
                rel_y = max(0, el.get('y', 0) - min_y)
                el_copy = dict(el)
                el_copy['secao'] = sec
                el_copy['y'] = rel_y
                elementos_novos.append(el_copy)

            max_rel_y_with_height = max([(e.get('y', 0) - min_y) + (e.get('altura') if e.get('altura') is not None else 30) for e in els])
            default_height = 120 if sec == 'header' else (40 if sec == 'detail' else (60 if sec == 'summary' else 80))
            configuracao_faixas[f'{sec}_height'] = max(default_height, max_rel_y_with_height + 10)

        return {
            'configuracao_faixas': configuracao_faixas,
            'elementos': elementos_novos
        }

    # Define as regras de @page com base no tipo de gabarito
    if tipo_gabarito == 'A4_RETRATO':
        size_css = "A4 portrait"
        width_css = "210mm"
        height_css = "297mm"
    elif tipo_gabarito == 'A4_PAISAGEM':
        size_css = "A4 landscape"
        width_css = "297mm"
        height_css = "210mm"
    elif tipo_gabarito == 'RECIBO':
        size_css = "80mm auto"
        width_css = "80mm"
        height_css = "auto"
    else: # ETIQUETA ou Customizado
        width_css = f"{largura_mm}mm"
        height_css = f"{altura_mm}mm" if altura_mm > 0 else "auto"
        size_css = f"{width_css} {height_css}"

    # 1. Banded layout migration and grouping
    banded = get_banded_layout(layout_json)
    alturas = banded['configuracao_faixas']
    elementos = banded['elementos']
    
    header_elements = [el for el in elementos if el.get('secao') == 'header']
    detail_elements = [el for el in elementos if el.get('secao') == 'detail']
    summary_elements = [el for el in elementos if el.get('secao') == 'summary']
    footer_elements = [el for el in elementos if el.get('secao') == 'footer']
    
    table_element = next((el for el in detail_elements if el.get('campo_origem') == 'venda.itens_tabela'), None)
    
    # Calculate table growth
    itens = dados_reais_locais.get('itens')
    num_items = len(itens) if (itens is not None) else 0
    
    table_growth = 0
    if table_element:
        designed_altura = table_element.get('altura', 150)
        font_size = table_element.get('font_size', 11) or 11
        row_height = max(20, int(font_size * 1.5))
        header_height = 25
        actual_height = header_height + num_items * row_height
        table_growth = max(0, actual_height - designed_altura)

    is_sales_report = any(
        str(el.get('campo_origem', '')).startswith('venda.') or 
        str(el.get('campo_origem', '')).startswith('cliente.')
        for el in elementos
    )

    # Helper to render elements inside a band
    def render_band_elements(elements_list, item_context=None):
        band_html = ""
        for el in elements_list:
            chave_campo = el.get('campo_origem', '')
            is_shape = chave_campo.startswith('forma.')
            is_table = (chave_campo == 'venda.itens_tabela')
            
            x = el.get('x', 0)
            y = el.get('y', 0)
            bold = el.get('bold', False)
            color = el.get('color', '#000000') or '#000000'
            altura = el.get('altura')
            largura = el.get('largura', 150)
            font_size = el.get('font_size', 12) or 12
            
            font_weight_css = "font-weight: bold;" if bold else ""
            color_css = f"color: {color};"
            
            if is_table:
                itens_list = dados_reais_locais.get('itens', []) if is_sales_report else []
                if not is_sales_report:
                    itens_list = [{
                        'produto.codigo': dados_reais_locais.get('produto.codigo', ''),
                        'produto.descricao': dados_reais_locais.get('produto.descricao', ''),
                        'produto.quantidade': dados_reais_locais.get('produto.quantidade', ''),
                        'produto.valor_unit': dados_reais_locais.get('produto.valor_unit', ''),
                        'produto.subtotal': dados_reais_locais.get('produto.subtotal', '')
                    }]
                    
                table_html = f'<table style="width: 100%; border-collapse: collapse; font-size: {font_size}px; color: {color};">'
                table_html += f'<tr style="background-color: #f2f2f2; font-weight: bold; border: 1px solid #ccc;">'
                table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Cód</th>'
                table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Descrição</th>'
                table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: right;">Qtd</th>'
                table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: right;">V.Unit</th>'
                table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: right;">Total</th>'
                table_html += f'</tr>'
                
                for it in itens_list:
                    table_html += f'<tr style="border: 1px solid #ccc;">'
                    table_html += f'<td style="border: 1px solid #ccc; padding: 4px;">{it.get("produto.codigo", "")}</td>'
                    table_html += f'<td style="border: 1px solid #ccc; padding: 4px;">{it.get("produto.descricao", "")}</td>'
                    table_html += f'<td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{it.get("produto.quantidade", "")}</td>'
                    table_html += f'<td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{it.get("produto.valor_unit", "")}</td>'
                    table_html += f'<td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{it.get("produto.subtotal", "")}</td>'
                    table_html += f'</tr>'
                table_html += f'</table>'
                
                h_css = f"height: {altura}px;" if altura is not None else ""
                band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; width: {largura}px; {h_css}">\n            {table_html}\n        </div>\n'
                continue
                
            if chave_campo == 'forma.retangulo':
                border_css = f"border: 1px solid {color};"
                h_css = f"height: {altura}px;" if altura is not None else "height: 50px;"
                band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; width: {largura}px; {h_css} {border_css}"></div>\n'
                continue
                
            if chave_campo == 'forma.linha_h':
                h_css = f"height: {altura}px;" if altura is not None else "height: 2px;"
                bg_css = f"background-color: {color};"
                band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; width: {largura}px; {h_css} {bg_css}"></div>\n'
                continue
            if chave_campo == 'forma.linha_v':
                h_css = f"height: {altura}px;" if altura is not None else "height: 100px;"
                bg_css = f"background-color: {color};"
                band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; width: {largura}px; {h_css} {bg_css}"></div>\n'
                continue
                
            if item_context and chave_campo.startswith('produto.'):
                valor_real = item_context.get(chave_campo, '')
            elif chave_campo == 'texto.livre':
                valor_real = el.get('valor_customizado', '')
                if valor_real:
                    valor_real = str(valor_real).replace('\n', '<br />')
            else:
                valor_real = dados_reais_locais.get(chave_campo, '')
                
            if valor_real is None:
                valor_real = ''
                
            if chave_campo and any(kw in chave_campo for kw in ['logomarca', 'logo', 'imagem']):
                conteudo = f'<img src="{valor_real}" style="max-width: 100%; height: auto; display: block;" />' if valor_real else ''
            else:
                conteudo = valor_real
                
            band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; font-size: {font_size}px; width: {largura}px; {font_weight_css} {color_css}">\n            {conteudo}\n        </div>\n'
        return band_html

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Aperus Custom Report</title>
    <style>
        @page {{
            size: {size_css};
            margin: 0;
        }}
        html, body {{
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
        }}
        .gabarito-container {{
            position: relative;
            width: {width_css};
            min-height: {height_css};
            box-sizing: border-box;
            overflow: visible;
            page-break-after: always;
        }}
        .gabarito-container:last-of-type {{
            page-break-after: avoid;
        }}
        .band {{
            position: relative;
            width: 100%;
            overflow: visible;
            box-sizing: border-box;
        }}
        .elemento-impressao {{
            position: absolute;
            box-sizing: border-box;
            white-space: normal;
            word-break: break-word;
        }}
        @media print {{
            .page-break {{
                page-break-inside: avoid;
            }}
            .no-print {{
                display: none !important;
            }}
        }}
    </style>
</head>
<body>
    <div class="no-print" style="position: fixed; top: 15px; right: 15px; z-index: 99999;">
        <button onclick="window.print()" style="background-color: #2e7d32; color: white; border: none; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 8px; font-family: Arial, sans-serif;">
            🖨️ Imprimir / Salvar PDF
        </button>
    </div>
    <div class="gabarito-container">
"""

    # 1. Page Header Band
    html += f'        <div class="band" style="height: {alturas.get("header_height", 120)}px;">\n'
    html += render_band_elements(header_elements)
    html += f'        </div>\n'
    
    # 2. Detail Band(s)
    if detail_elements:
        if table_element:
            detail_h = alturas.get("detail_height", 40) + table_growth
            html += f'        <div class="band" style="height: {detail_h}px;">\n'
            html += render_band_elements(detail_elements)
            html += f'        </div>\n'
        else:
            detail_h = alturas.get("detail_height", 40)
            if itens:
                for item in itens:
                    html += f'        <div class="band page-break" style="height: {detail_h}px;">\n'
                    html += render_band_elements(detail_elements, item_context=item)
                    html += f'        </div>\n'
            else:
                html += f'        <div class="band" style="height: {detail_h}px;">\n'
                html += render_band_elements(detail_elements)
                html += f'        </div>\n'
    
    # 3. Summary Band
    html += f'        <div class="band" style="height: {alturas.get("summary_height", 60)}px;">\n'
    html += render_band_elements(summary_elements)
    html += f'        </div>\n'
    
    # 4. Report Footer Band
    html += f'        <div class="band" style="height: {alturas.get("footer_height", 80)}px;">\n'
    html += render_band_elements(footer_elements)
    html += f'        </div>\n'
    
    html += f'    </div>\n'
    html += """
</body>
</html>
"""
    return html


def renderizar_ou_fallback(nome_relatorio, dados_locais, fallback_callback, *args, **kwargs):
    import re
    import requests
    from django.conf import settings
    from django.http import HttpResponse
    from api.models import EmpresaConfig
    empresa = EmpresaConfig.objects.exclude(cpf_cnpj='').first() or EmpresaConfig.objects.first()
    if not empresa or not empresa.cpf_cnpj:
        return fallback_callback(*args, **kwargs)
    cnpj_limpo = re.sub(r'\D', '', str(empresa.cpf_cnpj))
    try:
        central_base = getattr(settings, 'SAAS_MOTHER_URL', None) or 'https://central.aperus.com.br'
        url = f'{central_base.rstrip("/")}/api/saas/obter-gabarito/'
        resposta = requests.get(url, params={'cnpj': cnpj_limpo, 'nome_relatorio': nome_relatorio}, timeout=3)
        if resposta.status_code == 200:
            dados = resposta.json()
            layout_json = dados.get('layout_json')
            if layout_json:
                tipo_gabarito = dados.get('tipo_gabarito', 'A4_RETRATO')
                largura_mm = dados.get('largura_gabarito_mm', 210)
                altura_mm = dados.get('altura_gabarito_mm', 297)
                html = montar_html_gabarito_customizado(layout_json, dados_locais, largura_mm, altura_mm, tipo_gabarito)
                return HttpResponse(html)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f'Erro ao renderizar custom: {e}')
    return fallback_callback(*args, **kwargs)