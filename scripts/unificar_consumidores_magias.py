#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'magias.html'
MARKER = 'hub-magias-catalogo-consolidado-v1'
NEEDLE = "(async()=>{try{\n const sourceEntries=Object.entries(REMOTE);"
INSERT = """(async()=>{try{\n // hub-magias-catalogo-consolidado-v1\n try{\n  const catalog=await getJSON('dados/magias-catalogo.json?v=20260821-unified1');\n  if(Array.isArray(catalog.itens)&&catalog.itens.length){\n   DATA={fontes:catalog.fontes||{}};ALL=catalog.itens;\n   ALL.sort((a,b)=>(a.nivel-b.nivel)||String(a.escola||'').localeCompare(String(b.escola||''),'pt-BR')||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));\n   ALL.forEach((x,i)=>x.ordem_catalogo=x.ordem_catalogo||i+1);\n   populateFilters();renderList();if(ALL[0])renderDetail(ALL[0].id);return;\n  }\n }catch(e){console.warn('Catálogo consolidado local indisponível; usando montagem remota.',e)}\n const sourceEntries=Object.entries(REMOTE);"""

html = PAGE.read_text(encoding='utf-8')
if MARKER not in html:
    if NEEDLE not in html:
        raise RuntimeError('Ponto de integração do catálogo não encontrado em magias.html')
    html = html.replace(NEEDLE, INSERT, 1)
    PAGE.write_text(html, encoding='utf-8')

check = PAGE.read_text(encoding='utf-8')
if check.count(MARKER) != 1:
    raise RuntimeError('Integração do catálogo consolidado ausente ou duplicada em magias.html')
if "dados/magias-catalogo.json?v=20260821-unified1" not in check:
    raise RuntimeError('magias.html não referencia o catálogo consolidado')
print('Biblioteca > Magias configurada para consumir dados/magias-catalogo.json.')
