from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]

def load(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8'))

def require(ok,msg):
    if not ok: raise AssertionError(msg)

MODULES=['regras.html','classes.html','subclasses.html','raca.html','antecedentes.html','talentos.html','maestrias-de-arma.html','monstros.html','armaduras.html','armas.html','equipamentos-aventura.html','ferramentas.html','montarias-veiculos.html','comercio-e-despesas.html','bugigangas.html','itens-magicos.html','magias.html','idiomas.html']
for f in MODULES: require((ROOT/f).exists(),f'Módulo ausente: {f}')

policy=load('dados/politica-compatibilidade-5e-5.5e.json')
require(policy['ruleset_ativo']=='5.5e' and policy['revisao_core_ativa']==2024,'Política ativa deve ser 5.5e/2024')
require(policy['regras_da_casa']['talentos_niveis']==[1,3,6,9,12,15,18],'Progressão universal de talentos divergente')
require(policy['regras_da_casa']['aumento_atributo_niveis']==[4,8,12,16,20],'Progressão universal de atributos divergente')

rules=(ROOT/'scripts/character-builder/rules.js').read_text(encoding='utf-8')
state=(ROOT/'scripts/character-builder/state.js').read_text(encoding='utf-8')
catalogs=(ROOT/'scripts/character-builder/catalogs.js').read_text(encoding='utf-8')
languages=(ROOT/'scripts/character-builder/language-mechanics.js').read_text(encoding='utf-8')
builder=(ROOT/'scripts/character-builder.js').read_text(encoding='utf-8')
creation=(ROOT/'criacao-personagem.html').read_text(encoding='utf-8')
require('HOUSE_FEAT_LEVELS=[1,3,6,9,12,15,18]' in rules,'Código diverge da progressão de talentos da casa')
require('HOUSE_ABILITY_LEVELS=[4,8,12,16,20]' in rules,'Código diverge da progressão de atributos da casa')
require('isCompatible55' in rules and 'withLegacyCompatibility' in rules,'Compatibilidade de legado não está ativa no construtor')
require('RAW14' in state and 'FEATFILES' in state,'Fontes legadas necessárias não estão declaradas')
require('dados/especies-pdf-motm-2022.json' in state,'MotM 2022 não está no catálogo de espécies')
require('talentos-tasha-2020.json' in state and 'talentos-xanathar-2017.json' in state,'Talentos legados únicos não estão no catálogo do criador')
require('abilityBonuses:current?arr(r.aumentos_atributo):[]' in catalogs,'Espécie 5e pode estar aplicando ASI antigo em personagem 5.5e')
require('legado_com_conteudo_unico' in catalogs,'Subclasses legadas únicas não estão preservadas')
require("fixed:['Comum'],choose:2" in languages,'Idiomas iniciais 5.5e devem ser Comum + 2 padrão')
require('manual-feat-ui.js?v=20260823-rules-audit1' in builder,'Aviso de talentos não automatizados não está integrado')
require('type="importmap"' in creation and 'rules-audit1' in creation,'Criador não força a árvore auditada de módulos')

motm=load('dados/especies-pdf-motm-2022.json')
require(motm['fonte']['ruleset']=='5e','MotM deve permanecer identificado como 5e')
require(any(x.get('nome')=='Eladrin' for x in motm.get('items',[])),'Eladrin ausente do material do Hub')

sub=load('dados/subclasses-pdfs.json')
require('conteúdo único anterior' in sub.get('regra_precedencia',''),'Política de subclasses não preserva legado único')
legacy_sub=[x for x in sub.get('subclasses',[]) if x.get('status')=='legado_com_conteudo_unico']
require(legacy_sub,'Nenhuma subclasse 5e única marcada para compatibilidade')

magic=load('dados/itens-magicos/manifest.json')
require('5.5e/2024 prevalece' in magic.get('politica_sobreposicao',''),'Itens mágicos sem precedência 2024')
require(magic.get('controle',{}).get('srd51_legado_ativo',0)>=1,'Legado único de itens mágicos foi perdido')
magic_page=(ROOT/'itens-magicos.html').read_text(encoding='utf-8')
require('Espaços de Itens Mágicos' in magic_page and 'Sintonização no Hub' in magic_page,'Itens mágicos ainda tratam Sintonização padrão como regra operacional')

spell_page=(ROOT/'magias.html').read_text(encoding='utf-8')
require('const groups=new Map()' in spell_page and 'versoes_anteriores_descartadas' in spell_page,'Magias não estão consolidando versões por identidade')
feat_page=(ROOT/'dados/_module-source/talentos.html').read_text(encoding='utf-8')
require('function consolidar' in feat_page and 'talentos-tasha-2020.json' in feat_page,'Biblioteca de talentos não aplica precedência 5e/5.5e')
race_page=(ROOT/'dados/_module-source/especies.html').read_text(encoding='utf-8')
require('function consolidate' in race_page and 'legado_compativel' in race_page,'Biblioteca de raças não aplica precedência 5e/5.5e')
class_detail=(ROOT/'classes-v3.html').read_text(encoding='utf-8')
require('STANDARD_ASI=new Set([4,8,12,16,19])' in class_detail and 'Talento — Regra da Casa' in class_detail,'Classes ainda expõem os ASIs regulares substituídos como progressão ativa')

mastery=load('dados/maestrias-de-arma-pdfs.json')
canonical={x.get('nome') for x in mastery.get('itens',[]) if x.get('classificacao',{}).get('origem')=='oficial_aberta' and x.get('classificacao',{}).get('status')=='atual'}
required_masteries={'Cleave','Graze','Nick','Push','Sap','Slow','Topple','Vex'}
require(required_masteries.issubset(canonical),f'Maestrias 2024 ausentes: {sorted(required_masteries-canonical)}')
require(mastery.get('controle',{}).get('oficiais_canonicas')==8,'Quantidade de maestrias oficiais 2024 divergente')

weapon_page=(ROOT/'armas.html').read_text(encoding='utf-8')
armor_page=(ROOT/'armaduras.html').read_text(encoding='utf-8')
require('NÃO CANONIZAR' in weapon_page,'Armas demonstrativas não estão protegidas contra canonização')
require('não canonizar' in armor_page.lower(),'Armaduras demonstrativas não estão protegidas contra canonização')
require((ROOT/'scripts/politica-regras-biblioteca.js').exists(),'Política global da Biblioteca ausente')

print(f'Auditoria 5e/5.5e concluída: {len(MODULES)}/18 módulos presentes; {len(legacy_sub)} subclasses legadas únicas; compatibilidade, regras da casa e proteções de canonização alinhadas.')
