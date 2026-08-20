#!/usr/bin/env python3
import json, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];ERROS=[];AVISOS=[]
def load(path): return json.loads((ROOT/path).read_text(encoding='utf-8'))
def erro(msg): ERROS.append(msg)
def aviso(msg): AVISOS.append(msg)

# Talentos.
loc_tal=load(Path('dados/localizacao-ptbr-talentos.json')).get('nomes',{})
ref_tal={"Lesser Dragonmark":"Marca do Dragão Menor","Lords' Alliance Agent":"Agente da Aliança dos Lordes"}
tal_all={**loc_tal,**ref_tal}
for path in ['dados/talentos-phb-2024.json','dados/talentos-forge-2025.json','dados/talentos-heroes-2025.json','dados/talentos-quickstone-2024.json','dados/talentos-tasha-2020.json','dados/talentos-xanathar-2017.json','dados/talentos-eberron-rising-2019.json']:
 data=load(Path(path))
 for row in data.get('itens',[]):
  original=row[0]
  if original not in loc_tal: erro(f'Talento sem PT-BR: {original} ({path})')

# Subclasses.
loc_sub=load(Path('dados/localizacao-ptbr-subclasses.json'));sub_names=loc_sub.get('nomes',{});sub_classes=loc_sub.get('classes',{})
for row in load(Path('dados/subclasses-pdfs.json')).get('subclasses',[]):
 n=row.get('nome');c=row.get('classe')
 if n and n not in sub_names: erro(f'Subclasse sem PT-BR: {n}')
 if c and c not in sub_classes: erro(f'Classe de subclasse sem PT-BR: {c}')

# Antecedentes.
for path in ROOT.glob('dados/antecedentes-pdf-*.json'):
 data=json.loads(path.read_text(encoding='utf-8'))
 for row in data.get('items',[]):
  if not row.get('pt'): erro(f'Antecedente sem campo pt: {row.get("nome")} ({path.name})')
  t=row.get('talento')
  if t and t not in tal_all: erro(f'Antecedente referencia talento sem PT-BR: {t} ({path.name})')

# Classes.
classes={'barbaro':'Bárbaro','bardo':'Bardo','clerigo':'Clérigo','druida':'Druida','guerreiro':'Guerreiro','monge':'Monge','paladino':'Paladino','patrulheiro':'Patrulheiro','ladino':'Ladino','feiticeiro':'Feiticeiro','bruxo':'Bruxo','mago':'Mago'}
for slug,nome in classes.items():
 p=ROOT/f'dados/classes-ptbr/{slug}.json'
 if not p.exists(): erro(f'Arquivo de classe PT-BR ausente: {p.relative_to(ROOT)}');continue
 d=json.loads(p.read_text(encoding='utf-8'))
 if d.get('nome')!=nome: erro(f'Nome de classe inesperado em {p.name}: {d.get("nome")}')
 for fid,f in d.get('features',{}).items():
  if not str(f.get('nome','')).strip() or not str(f.get('descricao','')).strip(): erro(f'Característica incompleta: {p.name}::{fid}')

# Espécies: todos os pacotes adicionais precisam ter nome e traço explicitamente localizados.
loc_esp=load(Path('dados/localizacao-ptbr-especies.json'));esp_names=loc_esp.get('species',{});esp_traits={**loc_esp.get('trait_names',{}),**{k:v.get('name') for k,v in loc_esp.get('traits',{}).items()}}
for p in [ROOT/'dados/especies-pdf-phb-2024.json',ROOT/'dados/especies-pdf-forge-2025.json',ROOT/'dados/especies-pdf-quickstone-2024.json',ROOT/'dados/especies-pdf-motm-2022.json']:
 if not p.exists(): continue
 data=json.loads(p.read_text(encoding='utf-8'))
 for row in data.get('items',[]):
  n=row.get('nome')
  if n and n not in esp_names: erro(f'Espécie sem decisão PT-BR: {n} ({p.name})')
  for tr in row.get('tracos',[]):
   tn=tr.get('nome')
   if tn and tn not in esp_traits: erro(f'Traço de espécie sem PT-BR: {tn} ({n})')

# Itens mágicos.
items=[]
for i in range(1,19):
 p=ROOT/f'dados/itens-magicos/parte-{i:02}.json'
 if not p.exists(): erro(f'Parte de Itens Mágicos ausente: {p.name}');continue
 d=json.loads(p.read_text(encoding='utf-8'));items.extend(d if isinstance(d,list) else d.get('itens',d.get('items',[])))
if len(items)!=259: erro(f'Itens Mágicos: esperado 259, encontrado {len(items)}')
for row in items:
 if not str(row.get('nome','')).strip(): erro('Item mágico sem nome PT-BR')
 if not str(row.get('descricao','')).strip(): erro(f'Item mágico sem descrição PT-BR: {row.get("nome")}')

# Metadado original não deve ser mostrado.
for fname in ['regras.html','antecedentes.html','talentos.html','subclasses.html','especies.html','itens-magicos.html']:
 p=ROOT/fname
 if not p.exists(): continue
 text=p.read_text(encoding='utf-8')
 for pat in ['<b>Original:</b>','<strong>Nome original:</strong>','class="nome-original"']:
  if pat in text: erro(f'{fname} ainda exibe metadado original: {pat}')

# Localizadores ligados ao build.
clean=(ROOT/'scripts/limpar-metadados-modulos.js').read_text(encoding='utf-8')
for page,script in [('subclasses.html','localizar-subclasses-ptbr.js'),('especies.html','localizar-especies-ptbr.js')]:
 if script not in clean or not (ROOT/'scripts'/script).exists(): erro(f'{page} sem localizador PT-BR conectado ao build: {script}')
classes_html=(ROOT/'classes-v3.html').read_text(encoding='utf-8')
if 'featureLoc' not in classes_html or 'classes-ptbr/' not in classes_html: erro('Classes não está usando a camada PT-BR por característica.')

# Monstros continua bloqueado até a camada PT-BR ser implementada.
mon=(ROOT/'monstros.html').read_text(encoding='utf-8')
if 'description_md||r.description' in mon and 'localizar-monstros-ptbr.js' not in clean: erro('Monstros ainda renderiza conteúdo inglês sem localizador.')
if not (ROOT/'scripts/localizar-monstros-ptbr.js').exists(): erro('Localizador PT-BR de Monstros ainda ausente.')

# Indicadores estáticos. Small/Medium de Espécies são valores internos permitidos se localizador estiver ligado.
UI_PATTERNS={'Saving Throw':'Teste de Resistência','Bonus Action':'Ação Bônus','Long Rest':'Descanso Longo','Short Rest':'Descanso Curto','Hit Points':'Pontos de Vida','Armor Class':'Classe de Armadura','Advantage':'Vantagem','Disadvantage':'Desvantagem','Requires Attunement':'Requer Sintonização'}
for fname in ['antecedentes.html','subclasses.html','armaduras.html','armas.html','equipamentos-aventura.html','ferramentas.html','montarias-veiculos.html','comercio-e-despesas.html','bugigangas.html','magias.html','idiomas.html']:
 p=ROOT/fname
 if not p.exists(): continue
 t=p.read_text(encoding='utf-8')
 for eng,pt in UI_PATTERNS.items():
  if re.search(rf'(?:>|value=["\']){re.escape(eng)}(?:<|["\'])',t): aviso(f'{fname}: literal visível candidato em inglês: {eng} -> {pt}')

for w in sorted(set(AVISOS)): print('AVISO:',w)
if ERROS:
 for e in sorted(set(ERROS)): print('ERRO:',e)
 print(f'\nFalha: {len(set(ERROS))} erro(s) de localização.');sys.exit(1)
print('Localização PT-BR: auditoria estrutural aprovada.')
