#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re, unicodedata, uuid
from pathlib import Path
from collections import defaultdict

MODULE_ROUTES = {
'Regras':'regras.html','Classes':'classes-v3.html','Subclasses':'subclasses.html','Espécies':'especies.html','Antecedentes':'antecedentes.html','Talentos':'talentos.html','Maestrias de Arma':'maestrias-de-arma.html','Monstros':'monstros.html','Armaduras':'armaduras.html','Armas':'armas.html','Equipamentos de Aventura':'equipamentos-aventura.html','Ferramentas':'ferramentas.html','Montarias e Veículos':'montarias-veiculos.html','Comércio e Despesas':'comercio-e-despesas.html','Bugigangas':'bugigangas.html','Itens Mágicos':'itens-magicos.html','Magias':'magias.html','Idiomas':'idiomas.html',
'Planos e Cosmologia':'referencia.html','Grupos e Facções':'referencia.html','Lendas & Personalidades':'referencia.html','Locais & Assentamentos':'referencia.html','Divindades, Religiões & Cultos':'referencia.html','História & Cronologia':'referencia.html','Bastiões':'referencia.html'
}
PREFIX_MODULE = [
('regras','Regras'),('subclasse','Subclasses'),('classe','Classes'),('espec','Espécies'),('anteced','Antecedentes'),('talento','Talentos'),('maestr','Maestrias de Arma'),('monstro','Monstros'),('armadura','Armaduras'),('armas','Armas'),('equipamento','Equipamentos de Aventura'),('ferramenta','Ferramentas'),('montaria','Montarias e Veículos'),('veiculo','Montarias e Veículos'),('veículo','Montarias e Veículos'),('comercio','Comércio e Despesas'),('despesa','Comércio e Despesas'),('bugiganga','Bugigangas'),('itens-magicos','Itens Mágicos'),('item-magico','Itens Mágicos'),('magia','Magias'),('idioma','Idiomas'),('plano','Planos e Cosmologia'),('facc','Grupos e Facções'),('facç','Grupos e Facções'),('lenda','Lendas & Personalidades'),('personalidade','Lendas & Personalidades'),('local','Locais & Assentamentos'),('assentamento','Locais & Assentamentos'),('divind','Divindades, Religiões & Cultos'),('relig','Divindades, Religiões & Cultos'),('culto','Divindades, Religiões & Cultos'),('hist','História & Cronologia'),('cronol','História & Cronologia'),('bast','Bastiões')]
NAME_KEYS=('nome','name','titulo','title')
ORIGINAL_KEYS=('original','nome_original','original_name')
TEXT_KEYS={'descricao','description','texto','texto_integral','texto_relevante','resumo','notas','notes','efeito','effects','lore','historia','história','regras','regra','detalhes','prerequisite','prerequisites','requisitos'}
EXPLICIT_PATTERNS=[re.compile(r"Veja\s+tamb[eé]m\s+(?:o\s+cap[ií]tulo\s+\d+\s*)?[“\"']([^”\"']+)[”\"']", re.I),re.compile(r"Consulte\s+[“\"']([^”\"']+)[”\"']", re.I),re.compile(r"See\s+also\s+[“\"']([^”\"']+)[”\"']", re.I)]
SEED_RULE_TERMS=['Pontos de Vida','Pontos de Vida Temporários','Classe de Armadura','Dados de Vida','Salvaguarda Contra Morte','Salvaguarda','Vantagem','Desvantagem','Ação','Ação Bônus','Reação','Concentração','Cobertura','Terreno Difícil','Inspiração Heroica','Percepção Passiva','Proficiência']

def norm(s):
 s=unicodedata.normalize('NFKD',str(s or '')); s=''.join(c for c in s if not unicodedata.combining(c)); return re.sub(r'\s+',' ',s.casefold()).strip()
def infer_module(path, obj=None):
 if isinstance(obj,dict):
  for k in ('modulo','módulo'):
   if obj.get(k) in MODULE_ROUTES:return obj[k]
  fam=str(obj.get('familia',''))
  if fam in {'Regra Geral','Ação','Área de Efeito','Atitude','Condição','Perigo','Regra da Casa'}:return 'Regras'
 p=norm(str(path).replace('_','-'))
 for pref,m in PREFIX_MODULE:
  if pref in p:return m
 return None
def pick(obj,keys):
 for k in keys:
  v=obj.get(k) if isinstance(obj,dict) else None
  if isinstance(v,str) and v.strip():return v.strip()
 return None
def aliases(obj,name):
 vals=[name]
 for k in ORIGINAL_KEYS:
  v=obj.get(k)
  if isinstance(v,str) and v.strip():vals.append(v.strip())
 for k in ('aliases','apelidos'):
  v=obj.get(k)
  if isinstance(v,list): vals += [x.strip() for x in v if isinstance(x,str) and x.strip()]
 q=re.fullmatch(r'\s*(.*?)\s*\[[^]]+\]\s*',name or '')
 if q: vals.append(q.group(1).strip())
 text=' '.join(str(obj.get(k,'')) for k in TEXT_KEYS if isinstance(obj.get(k),str))
 m=re.search(r'\b'+re.escape(name)+r'\s*\(([A-ZÁÉÍÓÚÇ]{2,8})\)',text,re.I) if name else None
 if m: vals.append(m.group(1))
 out=[];seen=set()
 for v in vals:
  n=norm(v)
  if n and n not in seen:seen.add(n);out.append(v)
 return out
def source_priority(path):
 p=norm(path)
 if any(x in p for x in ('2025','2024','srd-5.2','dndbeyond-2024')):return 30
 if any(x in p for x in ('2022','2020')):return 20
 if '2014' in p:return 10
 return 15
def stable_id(module,name,original,path):
 key=f'{module}|{norm(original or name)}|{Path(path).name}'
 return 'ref-'+uuid.uuid5(uuid.NAMESPACE_URL,'https://teias-de-anansi.invalid/'+key).hex
def iter_named_dicts(obj):
 if isinstance(obj,dict):
  name=pick(obj,NAME_KEYS)
  if name and (any(k in obj for k in ('descricao','description','familia','fonte','source','original','tipo','type','subtipo','raridade','escola')) or len(obj)>=4):yield obj
  for v in obj.values():yield from iter_named_dicts(v)
 elif isinstance(obj,list):
  for v in obj:yield from iter_named_dicts(v)
def extract_texts(obj):
 if isinstance(obj,dict):
  for k,v in obj.items():
   if k in TEXT_KEYS and isinstance(v,str):yield v
   else:yield from extract_texts(v)
 elif isinstance(obj,list):
  for v in obj:yield from extract_texts(v)
def load_jsonish(path):
 txt=path.read_text(encoding='utf-8',errors='replace')
 try:return json.loads(txt)
 except Exception:return None

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--root',default='.');ap.add_argument('--output',default='dados/referencias-hub-index.json');ap.add_argument('--stubs',default='dados/referencias-hub-stubs.json');args=ap.parse_args()
 root=Path(args.root);records=[];explicit=[]
 files=[p for p in (root/'dados').rglob('*') if p.is_file() and (p.suffix.lower()=='.json' or (p.name.startswith('regras-dndbeyond-2024.part') and p.suffix=='.txt'))]
 for p in files:
  data=load_jsonish(p)
  if data is None:continue
  default_module=infer_module(p)
  for obj in iter_named_dicts(data):
   name=pick(obj,NAME_KEYS);module=infer_module(p,obj) or default_module
   if not name or not module:continue
   if name.lower().startswith(('auditoria ','manifesto ','manifest ','catálogo ','catalogo ')):continue
   original=pick(obj,ORIGINAL_KEYS)
   rid=obj.get('id') if isinstance(obj.get('id'),str) and obj.get('id').strip() else stable_id(module,name,original,p)
   records.append({'id':rid,'nome':name,'aliases':aliases(obj,name),'modulo':module,'url':MODULE_ROUTES[module],'fonte_arquivo':str(p.relative_to(root)).replace('\\','/'),'prioridade':source_priority(str(p)),'status':'publicado'})
   for text in extract_texts(obj):
    for pat in EXPLICIT_PATTERNS:explicit += [(m.group(1).strip(),module,str(p.relative_to(root))) for m in pat.finditer(text)]
 best={}
 for r in records:
  key=(r['modulo'],norm(r['nome']))
  if key not in best or r['prioridade']>best[key]['prioridade']:best[key]=r
 records=list(best.values())
 existing={norm(a) for r in records for a in r['aliases']};stubs=[]
 def add_stub(name,module,reason,source=None):
  n=norm(name)
  if not n or n in existing:return
  rid='ref-'+uuid.uuid5(uuid.NAMESPACE_URL,'https://teias-de-anansi.invalid/stub/'+module+'/'+n).hex
  stubs.append({'id':rid,'nome':name,'aliases':[name],'modulo':module,'url':'referencia.html','status':'pendente','motivo':reason,'fonte_referencia':source});existing.add(n)
 for name in SEED_RULE_TERMS:add_stub(name,'Regras','conceito mecânico central referenciado pela Biblioteca')
 for name,module,src in explicit:add_stub(name,module if module in MODULE_ROUTES else 'Regras','referência editorial explícita',src)
 all_records=records+stubs;amap={}
 for r in all_records:
  for a in r['aliases']:amap.setdefault(norm(a),[]).append(r)
 aliases_resolvidos=[];ambiguos=[]
 for n,rs in amap.items():
  mods={r['modulo'] for r in rs}
  if len(mods)==1:
   rs=sorted(rs,key=lambda x:x.get('prioridade',0),reverse=True);top=rs[0]
   if len(rs)==1 or top.get('prioridade',0)>rs[1].get('prioridade',0) or len({r['id'] for r in rs})==1:aliases_resolvidos.append({'termo':n,'id':top['id']})
   else:ambiguos.append({'termo':n,'ids':[r['id'] for r in rs]})
  else:ambiguos.append({'termo':n,'ids':[r['id'] for r in rs]})
 out={'schema':'hub-rpg.referencias.v1','sintaxe':'[[ID|Texto exibido]]','gerado_automaticamente':True,'total_entidades':len(all_records),'entidades':all_records,'aliases_resolvidos':aliases_resolvidos,'ambiguos':ambiguos,'modulos':MODULE_ROUTES}
 Path(args.output).write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
 Path(args.stubs).write_text(json.dumps({'schema':'hub-rpg.stubs-referencias.v1','total':len(stubs),'itens':stubs},ensure_ascii=False,indent=2),encoding='utf-8')
 print(f'referências: {len(records)} reais, {len(stubs)} stubs, {len(ambiguos)} aliases ambíguos')
if __name__=='__main__':main()
