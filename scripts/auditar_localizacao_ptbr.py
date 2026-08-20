#!/usr/bin/env python3
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERROS=[]
AVISOS=[]

def load(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8'))

def erro(msg): ERROS.append(msg)
def aviso(msg): AVISOS.append(msg)

# 1) Talentos: toda identidade publicada precisa de nome PT-BR.
loc_tal=load(Path('dados/localizacao-ptbr-talentos.json')).get('nomes',{})
for path in [
    'dados/talentos-phb-2024.json','dados/talentos-forge-2025.json','dados/talentos-heroes-2025.json',
    'dados/talentos-quickstone-2024.json','dados/talentos-tasha-2020.json','dados/talentos-xanathar-2017.json',
    'dados/talentos-eberron-rising-2019.json']:
    data=load(Path(path))
    for row in data.get('itens',[]):
        original=row[0]
        if original not in loc_tal:
            erro(f'Talento sem PT-BR: {original} ({path})')

# 2) Subclasses: toda identidade publicada precisa de nome PT-BR e classe PT-BR.
loc_sub=load(Path('dados/localizacao-ptbr-subclasses.json'))
sub_names=loc_sub.get('nomes',{})
sub_classes=loc_sub.get('classes',{})
sub_data=load(Path('dados/subclasses-pdfs.json'))
for row in sub_data.get('subclasses',[]):
    n=row.get('nome')
    c=row.get('classe')
    if n and n not in sub_names:
        erro(f'Subclasse sem PT-BR: {n}')
    if c and c not in sub_classes and c not in {'Tamer'}:
        erro(f'Classe de subclasse sem PT-BR: {c}')

# 3) Antecedentes: pacotes novos precisam de nome pt e talentos referenciados devem ser localizados.
for path in ROOT.glob('dados/antecedentes-pdf-*.json'):
    data=json.loads(path.read_text(encoding='utf-8'))
    for row in data.get('items',[]):
        if not row.get('pt'):
            erro(f'Antecedente sem campo pt: {row.get("nome")} ({path.name})')
        t=row.get('talento')
        if t and t not in loc_tal:
            erro(f'Antecedente referencia talento sem PT-BR: {t} ({path.name})')

# 4) Classes: 12 arquivos PT-BR obrigatórios, com nomes e características localizadas.
classes={
 'barbaro':'Bárbaro','bardo':'Bardo','clerigo':'Clérigo','druida':'Druida','guerreiro':'Guerreiro','monge':'Monge',
 'paladino':'Paladino','patrulheiro':'Patrulheiro','ladino':'Ladino','feiticeiro':'Feiticeiro','bruxo':'Bruxo','mago':'Mago'}
for slug,nome in classes.items():
    p=ROOT/f'dados/classes-ptbr/{slug}.json'
    if not p.exists():
        erro(f'Arquivo de classe PT-BR ausente: {p.relative_to(ROOT)}'); continue
    d=json.loads(p.read_text(encoding='utf-8'))
    if d.get('nome')!=nome:
        erro(f'Nome de classe inesperado em {p.name}: {d.get("nome")}')
    feats=d.get('features',{})
    if not feats:
        erro(f'Classe sem características PT-BR: {p.name}')
    for fid,f in feats.items():
        if not str(f.get('nome','')).strip() or not str(f.get('descricao','')).strip():
            erro(f'Característica incompleta: {p.name}::{fid}')

# 5) Itens mágicos: 18 partes e 259 registros; todo registro precisa de nome/descritivo PT-BR.
items=[]
for i in range(1,19):
    p=ROOT/f'dados/itens-magicos/parte-{i:02}.json'
    if not p.exists():
        erro(f'Parte de Itens Mágicos ausente: {p.name}'); continue
    d=json.loads(p.read_text(encoding='utf-8'))
    rows=d if isinstance(d,list) else d.get('itens',d.get('items',[]))
    items.extend(rows)
if len(items)!=259:
    erro(f'Itens Mágicos: esperado 259, encontrado {len(items)}')
for row in items:
    if not str(row.get('nome','')).strip(): erro('Item mágico sem nome PT-BR')
    if not str(row.get('descricao','')).strip(): erro(f'Item mágico sem descrição PT-BR: {row.get("nome")}')

# 6) Páginas não podem exibir explicitamente o original em inglês.
for fname in ['regras.html','antecedentes.html','talentos.html','subclasses.html','especies.html','itens-magicos.html']:
    p=ROOT/fname
    if not p.exists(): continue
    text=p.read_text(encoding='utf-8')
    for pat in ['<b>Original:</b>','<strong>Nome original:</strong>','class="nome-original"']:
        if pat in text:
            erro(f'{fname} ainda exibe metadado original: {pat}')

# 7) Falhas estruturais conhecidas: conteúdo inglês não pode ser usado como fallback visível.
classes_html=(ROOT/'classes-v3.html').read_text(encoding='utf-8')
if 'f.description}</p>' in classes_html or 'f.name)' in classes_html and 'featureLoc' not in classes_html:
    erro('Classes ainda possui fallback visível para feature inglesa.')
mon=(ROOT/'monstros.html').read_text(encoding='utf-8')
if 'description_md||r.description' in mon:
    erro('Monstros ainda renderiza description_md/description inglês diretamente.')
if "const SRD='https://apisearch.thedmstoolkit.com/api/2024/monsters'" in mon:
    aviso('Monstros ainda depende do endpoint inglês; permitido apenas se texto exibido vier de camada PT-BR local.')

# 8) Indicadores grosseiros em UI estática (não inclui títulos bibliográficos/metadados de fonte).
UI_PATTERNS={
 'Small':'Pequeno','Medium':'Médio','Large':'Grande','Humanoid':'Humanoide','Saving Throw':'Teste de Resistência',
 'Bonus Action':'Ação Bônus','Long Rest':'Descanso Longo','Short Rest':'Descanso Curto','Hit Points':'Pontos de Vida',
 'Armor Class':'Classe de Armadura','Advantage':'Vantagem','Disadvantage':'Desvantagem','Requires Attunement':'Requer Sintonização'
}
for fname in ['especies.html','antecedentes.html','subclasses.html','monstros.html','armaduras.html','armas.html','equipamentos-aventura.html','ferramentas.html','montarias-veiculos.html','comercio-e-despesas.html','bugigangas.html','magias.html','idiomas.html']:
    p=ROOT/fname
    if not p.exists(): continue
    t=p.read_text(encoding='utf-8')
    for eng,pt in UI_PATTERNS.items():
        # só acusa literal em opções/rótulos/HTML, não código de dicionário de tradução.
        if re.search(rf'(?:>|value=["\']){re.escape(eng)}(?:<|["\'])',t):
            aviso(f'{fname}: literal visível candidato em inglês: {eng} -> {pt}')

for w in AVISOS: print('AVISO:',w)
if ERROS:
    for e in ERROS: print('ERRO:',e)
    print(f'\nFalha: {len(ERROS)} erro(s) de localização.')
    sys.exit(1)
print('Localização PT-BR: auditoria estrutural aprovada.')
