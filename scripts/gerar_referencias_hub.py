#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,re,unicodedata,uuid
from pathlib import Path
from collections import defaultdict

ROUTES={
"Regras":"regras.html","Classes":"classes.html","Subclasses":"subclasses.html","Espécies":"especies.html",
"Antecedentes":"antecedentes.html","Talentos":"talentos.html","Maestrias de Arma":"maestrias-de-arma.html",
"Monstros":"monstros.html","Armaduras":"armaduras.html","Armas":"armas.html",
"Equipamentos de Aventura":"equipamentos-aventura.html","Ferramentas":"ferramentas.html",
"Montarias e Veículos":"montarias-veiculos.html","Comércio e Despesas":"comercio-e-despesas.html",
"Bugigangas":"bugigangas.html","Itens Mágicos":"itens-magicos.html","Magias":"magias.html","Idiomas":"idiomas.html"}
PREFIX=[
("subclasse","Subclasses"),("regras","Regras"),("classe","Classes"),("espec","Espécies"),("anteced","Antecedentes"),
("talento","Talentos"),("maestr","Maestrias de Arma"),("monstro","Monstros"),("armadura","Armaduras"),("armas","Armas"),
("equipamento","Equipamentos de Aventura"),("ferramenta","Ferramentas"),("montaria","Montarias e Veículos"),
("veiculo","Montarias e Veículos"),("veículo","Montarias e Veículos"),("comercio","Comércio e Despesas"),
("despesa","Comércio e Despesas"),("bugiganga","Bugigangas"),("itens-magicos","Itens Mágicos"),
("item-magico","Itens Mágicos"),("magia","Magias"),("idioma","Idiomas")]
TEXT={"descricao","description","texto","texto_integral","texto_relevante","resumo","notas","notes","efeito","effects",
"lore","historia","história","regras","regra","detalhes","prerequisite","prerequisites","requisitos","beneficios","benefícios",
"properties","propriedades","traits","traços","observacao","observação"}
EXPLICIT=[re.compile(r"Veja\s+tamb[eé]m\s+(?:o\s+cap[ií]tulo\s+\d+\s*)?[“\"']([^”\"']+)[”\"']",re.I),
re.compile(r"Consulte\s+[“\"']([^”\"']+)[”\"']",re.I),re.compile(r"See\s+also\s+[“\"']([^”\"']+)[”\"']",re.I)]
STRUCT={
"classe":"Classes","classes":"Classes","class":"Classes","parent_class":"Classes","classe_base":"Classes",
"subclasse":"Subclasses","subclasses":"Subclasses","parent_subclass":"Subclasses",
"especie":"Espécies","espécie":"Espécies","especies":"Espécies","espécies":"Espécies","species":"Espécies",
"antecedente":"Antecedentes","antecedentes":"Antecedentes","background":"Antecedentes","backgrounds":"Antecedentes",
"talento":"Talentos","talentos":"Talentos","feat":"Talentos","feats":"Talentos","dragonmarks":"Talentos",
"maestria":"Maestrias de Arma","maestrias":"Maestrias de Arma","mastery":"Maestrias de Arma","masteries":"Maestrias de Arma",
"monstro":"Monstros","monstros":"Monstros","monster":"Monstros","monsters":"Monstros",
"armadura":"Armaduras","armaduras":"Armaduras","armor":"Armaduras","arma":"Armas","armas":"Armas","weapon":"Armas","weapons":"Armas",
"equipamento":"Equipamentos de Aventura","equipamentos":"Equipamentos de Aventura","gear":"Equipamentos de Aventura",
"ferramenta":"Ferramentas","ferramentas":"Ferramentas","tool":"Ferramentas","tools":"Ferramentas",
"montaria":"Montarias e Veículos","montarias":"Montarias e Veículos","mount":"Montarias e Veículos","mounts":"Montarias e Veículos",
"veiculo":"Montarias e Veículos","veículo":"Montarias e Veículos","veiculos":"Montarias e Veículos","veículos":"Montarias e Veículos","vehicle":"Montarias e Veículos","vehicles":"Montarias e Veículos",
"servico":"Comércio e Despesas","serviço":"Comércio e Despesas","servicos":"Comércio e Despesas","serviços":"Comércio e Despesas",
"bugiganga":"Bugigangas","bugigangas":"Bugigangas","trinket":"Bugigangas","trinkets":"Bugigangas",
"item_magico":"Itens Mágicos","item_mágico":"Itens Mágicos","itens_magicos":"Itens Mágicos","itens_mágicos":"Itens Mágicos","magic_item":"Itens Mágicos","magic_items":"Itens Mágicos",
"magia":"Magias","magias":"Magias","spell":"Magias","spells":"Magias","idioma":"Idiomas","idiomas":"Idiomas","language":"Idiomas","languages":"Idiomas",
"condicao":"Regras","condição":"Regras","condicoes":"Regras","condições":"Regras","condition":"Regras","conditions":"Regras"}
SEEDS=["Pontos de Vida","Pontos de Vida Temporários","Classe de Armadura","Dados de Vida","Salvaguarda Contra Morte",
"Salvaguarda","Vantagem","Desvantagem","Ação","Ação Bônus","Reação","Concentração","Cobertura","Terreno Difícil",
"Inspiração Heroica","Percepção Passiva","Proficiência"]

def norm(v):
 s=unicodedata.normalize("NFKD",str(v or ""));return re.sub(r"\s+"," ","".join(c for c in s if not unicodedata.combining(c)).casefold()).strip()
NSTRUCT={norm(k):v for k,v in STRUCT.items()}
def module(path,o=None):
 if isinstance(o,dict):
  if o.get("modulo") in ROUTES:return o["modulo"]
  if o.get("módulo") in ROUTES:return o["módulo"]
  if str(o.get("familia","")) in {"Regra Geral","Ação","Área de Efeito","Atitude","Condição","Perigo","Regra da Casa"}:return "Regras"
 p=norm(path)
 for x,m in PREFIX:
  if x in p:return m
def pick(o,keys):
 for k in keys:
  v=o.get(k) if isinstance(o,dict) else None
  if isinstance(v,str) and v.strip():return v.strip()
def aliases(o,n):
 vals=[n]+[o[k].strip() for k in ("original","nome_original","original_name") if isinstance(o.get(k),str) and o[k].strip()]
 for k in ("aliases","apelidos"):
  if isinstance(o.get(k),list):vals += [x.strip() for x in o[k] if isinstance(x,str) and x.strip()]
 q=re.fullmatch(r"\s*(.*?)\s*\[[^]]+\]\s*",n or "")
 if q:vals.append(q.group(1).strip())
 out=[];seen=set()
 for v in vals:
  x=norm(v)
  if x and x not in seen:seen.add(x);out.append(v)
 return out
def priority(p):
 p=norm(p)
 if any(x in p for x in ("2025","2024","srd-5.2","dndbeyond-2024")):return 30
 if any(x in p for x in ("2022","2020")):return 20
 if "2014" in p:return 10
 return 15
def sid(m,n,o,p):
 return "ref-"+uuid.uuid5(uuid.NAMESPACE_URL,f"https://teias-de-anansi.invalid/{m}|{norm(o or n)}|{Path(p).name}").hex
def named(x):
 if isinstance(x,dict):
  n=pick(x,("nome","name","titulo","title"))
  if n and (len(x)>=4 or any(k in x for k in ("descricao","description","familia","fonte","source","original","tipo","type","raridade","escola"))):yield x
  for v in x.values():yield from named(v)
 elif isinstance(x,list):
  for v in x:yield from named(v)
def texts(x):
 if isinstance(x,dict):
  for k,v in x.items():
   if k in TEXT and isinstance(v,str):yield v
   else:yield from texts(v)
 elif isinstance(x,list):
  for v in x:yield from texts(v)
def refs(x,path=""):
 if isinstance(x,dict):
  for k,v in x.items():
   p=f"{path}.{k}" if path else k;t=NSTRUCT.get(norm(k))
   if t:
    vals=[v] if isinstance(v,str) else v if isinstance(v,list) else []
    for s in vals:
     if isinstance(s,str) and 0<len(s.strip())<=100 and "\n" not in s and len(s.split())<=12:yield s.strip(),t,p
   yield from refs(v,p)
 elif isinstance(x,list):
  for i,v in enumerate(x):yield from refs(v,f"{path}[{i}]")
def html_docs(root):
 for m,r in ROUTES.items():
  p=root/r
  if not p.exists():continue
  h=p.read_text(encoding="utf-8",errors="replace");seen=set()
  pats=[re.compile(r"\bnome\s*:\s*'([^'\n]{2,100})'",re.I),re.compile(r'\bnome\s*:\s*"([^"\n]{2,100})"',re.I),
        re.compile(r"<summary[^>]*>\s*<strong[^>]*>([^<]{2,100})</strong>",re.I)]
  for pat in pats:
   for mm in pat.finditer(h):
    n=re.sub(r"\s+"," ",re.sub(r"<[^>]+>","",mm.group(1))).strip();k=norm(n)
    if k and k not in seen and len(n.split())<=14:
     seen.add(k);yield p,{"nome":n,"modulo":m,"descricao":"","_html_catalog":True}
def docs(root):
 for p in (root/"dados").rglob("*.json"):
  try:yield p,json.loads(p.read_text(encoding="utf-8",errors="replace"))
  except Exception:pass
 parts=sorted((root/"dados").glob("regras-dndbeyond-2024.part*.txt"))
 if parts:
  raw="".join(p.read_text(encoding="utf-8",errors="replace") for p in parts)
  try:data=json.loads(raw)
  except Exception as e:raise RuntimeError(f"Falha ao reconstruir regras-dndbeyond-2024: {e}")
  yield root/"dados"/"regras-dndbeyond-2024.reconstruido.json",data
 yield from html_docs(root)

def main():
 ap=argparse.ArgumentParser();ap.add_argument("--root",default=".");ap.add_argument("--output",default="dados/referencias-hub-index.json");ap.add_argument("--stubs",default="dados/referencias-hub-stubs.json");a=ap.parse_args()
 root=Path(a.root);recs=[];explicit=[];struct=[]
 for p,d in docs(root):
  dm=module(p)
  for o in named(d):
   n=pick(o,("nome","name","titulo","title"));m=module(p,o) or dm
   if not n or not m:continue
   orig=pick(o,("original","nome_original","original_name"));rid=o.get("id") if isinstance(o.get("id"),str) and o.get("id").strip() else sid(m,n,orig,p)
   recs.append({"id":rid,"nome":n,"aliases":aliases(o,n),"modulo":m,"url":ROUTES[m],"fonte_arquivo":str(p.relative_to(root)).replace("\\","/"),"prioridade":priority(p),"status":"publicado"})
   for t in texts(o):
    for pat in EXPLICIT:explicit += [(z.group(1).strip(),m,str(p.relative_to(root))) for z in pat.finditer(t)]
  struct += [(n,m,str(p.relative_to(root)),f) for n,m,f in refs(d)]
 best={}
 for r in recs:
  k=(r["modulo"],norm(r["nome"]))
  if k not in best or r["prioridade"]>best[k]["prioridade"]:best[k]=r
 recs=list(best.values());existing=defaultdict(set)
 for r in recs:
  for x in r["aliases"]:existing[r["modulo"]].add(norm(x))
 stubs=[]
 def stub(n,m,why,src=None,field=None):
  k=norm(n)
  if not k or m not in ROUTES or k in existing[m] or k in {"nenhum","nenhuma","qualquer","varia","-","n/a","na"}:return
  rid="ref-"+uuid.uuid5(uuid.NAMESPACE_URL,f"https://teias-de-anansi.invalid/stub/{m}/{k}").hex
  stubs.append({"id":rid,"nome":n,"aliases":[n],"modulo":m,"url":"referencia.html","status":"pendente","motivo":why,"fonte_referencia":src,"campo_referencia":field});existing[m].add(k)
 for n in SEEDS:stub(n,"Regras","conceito mecânico central referenciado pela Biblioteca")
 for n,m,s in explicit:stub(n,m,"referência editorial explícita",s)
 for n,m,s,f in struct:stub(n,m,"referência estrutural sem entidade publicada",s,f)
 allr=recs+stubs;amap=defaultdict(list)
 for r in allr:
  for x in r["aliases"]:amap[norm(x)].append(r)
 resolved=[];amb=[]
 for k,rs in amap.items():
  rs=sorted(rs,key=lambda x:x.get("prioridade",0),reverse=True);mods={r["modulo"] for r in rs}
  official=[r for r in rs if r["modulo"]=="Regras" and r.get("prioridade",0)>=30 and "regras-dndbeyond-2024" in r.get("fonte_arquivo","")]
  if official:resolved.append({"termo":k,"id":official[0]["id"]});continue
  if len(mods)==1 and (len(rs)==1 or rs[0].get("prioridade",0)>rs[1].get("prioridade",0) or len({r["id"] for r in rs})==1):
   resolved.append({"termo":k,"id":rs[0]["id"]})
  else:amb.append({"termo":k,"ids":[r["id"] for r in rs]})
 cov={m:sum(r["modulo"]==m for r in allr) for m in ROUTES}
 out={"schema":"hub-rpg.referencias.v2","sintaxe":"[[ID|Texto exibido]]","gerado_automaticamente":True,"total_entidades":len(allr),"entidades":allr,"aliases_resolvidos":resolved,"ambiguos":amb,"modulos":ROUTES,"cobertura_modulos":cov}
 Path(a.output).write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8");Path(a.stubs).write_text(json.dumps({"schema":"hub-rpg.stubs-referencias.v2","total":len(stubs),"itens":stubs},ensure_ascii=False,indent=2),encoding="utf-8")
 print(f"referências: {len(recs)} reais, {len(stubs)} stubs, {len(amb)} aliases ambíguos");print("cobertura:",", ".join(f"{m}={cov[m]}" for m in ROUTES))
if __name__=="__main__":main()
