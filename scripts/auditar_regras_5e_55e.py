from pathlib import Path
import json
import unicodedata

ROOT = Path(__file__).resolve().parents[1]


def load(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def text(path):
    return (ROOT / path).read_text(encoding='utf-8')


def require(ok, msg):
    if not ok:
        raise AssertionError(msg)


def norm(value):
    raw = unicodedata.normalize('NFD', str(value or ''))
    return ''.join(c for c in raw if unicodedata.category(c) != 'Mn').casefold().strip()


MODULES = [
    'regras.html', 'classes.html', 'subclasses.html', 'raca.html', 'antecedentes.html',
    'talentos.html', 'maestrias-de-arma.html', 'monstros.html', 'armaduras.html',
    'armas.html', 'equipamentos-aventura.html', 'ferramentas.html',
    'montarias-veiculos.html', 'comercio-e-despesas.html', 'bugigangas.html',
    'itens-magicos.html', 'magias.html', 'idiomas.html'
]
for f in MODULES:
    require((ROOT / f).exists(), f'Módulo ausente: {f}')

# Política global: 2024 é a revisão ativa, sem apagar conteúdo 2014 único e compatível.
policy = load('dados/politica-compatibilidade-5e-5.5e.json')
require(policy['ruleset_ativo'] == '5.5e' and policy['revisao_core_ativa'] == 2024,
        'Política ativa deve ser 5.5e/2024')
require(policy['regras_da_casa']['talentos_niveis'] == [1, 3, 6, 9, 12, 15, 18],
        'Progressão universal de talentos divergente')
require(policy['regras_da_casa']['aumento_atributo_niveis'] == [4, 8, 12, 16, 20],
        'Progressão universal de atributos divergente')
precedencia = ' '.join(policy.get('precedencia', []))
require('versão 5.5e/2024' in precedencia and 'permanece disponível' in precedencia,
        'Política não expressa simultaneamente precedência 2024 e preservação do legado único')

# As sete Regras da Casa devem existir como dados pesquisáveis, e não apenas como texto de interface.
hub_rules = load('dados/regras-hub.json')
extra_rules = load('dados/regras-casa-adicionais.json')
house = [*hub_rules.get('itens', []), *extra_rules.get('itens', [])]
house_names = {x.get('original') for x in house}
required_house = {
    'Magic Items Slots (D&D 3.5e - House Rule)',
    'Expanded Concentration (House Rule)',
    'Backgrounds: Mechanical Rule (House Rule)',
    'Backgrounds and Organizations: Narrative Rules  (House Rule)',
    'Universal Feat and Ability Progression (House Rule)',
    'Base Ability Score Distribution (House Rule)',
    'Wealth by Level (House Rule)',
}
require(len(house) == 7, f'Quantidade inesperada de Regras da Casa: {len(house)}/7')
require(required_house.issubset(house_names),
        f'Regras da Casa ausentes: {sorted(required_house - house_names)}')
viewer = text('scripts/regras-srd-view-v7.js')
require('HOUSE.length!==7' in viewer and 'Regras da Casa inesperadas: ${HOUSE.length}/7' in viewer,
        'Catálogo de Regras ainda espera quantidade antiga de Regras da Casa')
wealth_rules = [x for x in house if x.get('original') == 'Wealth by Level (House Rule)']
require(len(wealth_rules) == 1, 'Riqueza por Level deve existir uma única vez e substituir a versão anterior')
wealth = wealth_rules[0]
require(wealth.get('nome') == 'Riqueza por Level', 'Nome vigente da regra deve ser Riqueza por Level')
wealth_text = json.dumps(wealth, ensure_ascii=False)
require('Level 20: 30.000 PO' in wealth_text and '90.800 PO' not in wealth_text,
        'Riqueza por Level ainda contém a curva anterior ou não contém a curva vigente')
require('Precária ×0,90' in wealth_text and 'Privilegiada ×1,15' in wealth_text,
        'Faixas Econômicas da Riqueza por Level estão incompletas')

# A matriz semântica curada histórica cobre as cinco regras que já possuíam relações cruzadas.
# As duas regras econômicas/atributos permanecem pesquisáveis no módulo mesmo sem relações semânticas curadas.
curated = load('dados/referencias-regras-curadas.json')
curated_house = required_house - {
    'Base Ability Score Distribution (House Rule)',
    'Wealth by Level (House Rule)',
}
require(curated.get('total_regras') == 160,
        f'Matriz curada com contagem inesperada: {curated.get("total_regras")}/160')
require(curated_house.issubset(set(curated.get('regras', {}))),
        'Matriz curada não inclui as Regras da Casa historicamente relacionadas')
curated_js = text('scripts/referencias-regras-curadas.js')
require('curated.total_regras!==160' in curated_js,
        'Consumidor da matriz curada diverge da contagem publicada')

# Criador de personagem: progressão da casa e compatibilidade 2014/2024.
rules = text('scripts/character-builder/rules.js')
state = text('scripts/character-builder/state.js')
catalogs = text('scripts/character-builder/catalogs.js')
race_variants = text('scripts/character-builder/race-variants.js')
languages = text('scripts/character-builder/language-mechanics.js')
builder = text('scripts/character-builder.js')
creation = text('criacao-personagem.html')
require('HOUSE_FEAT_LEVELS=[1,3,6,9,12,15,18]' in rules,
        'Código diverge da progressão de talentos da casa')
require('HOUSE_ABILITY_LEVELS=[4,8,12,16,20]' in rules,
        'Código diverge da progressão de atributos da casa')
require('isCompatible55' in rules and 'withLegacyCompatibility' in rules,
        'Compatibilidade de legado não está ativa no construtor')
require('RAW14' in state and 'FEATFILES' in state,
        'Fontes legadas necessárias não estão declaradas')
require('dados/especies-pdf-motm-2022.json' in state,
        'MotM 2022 não está no catálogo de espécies')
require('talentos-tasha-2020.json' in state and 'talentos-xanathar-2017.json' in state,
        'Talentos legados únicos não estão no catálogo do criador')
require('abilityBonuses:current?arr(r.aumentos_atributo):[]' in catalogs,
        'Espécie 5e pode estar aplicando ASI antigo em personagem 5.5e')
require('legado_com_conteudo_unico' in catalogs,
        'Subclasses legadas únicas não estão preservadas')
require("weapons:arr(w.itens).filter(x=>x.status!=='nao_canonizar'&&(x.ruleset==='5.5e'||x.ruleset==='5e'))" in catalogs,
        'Criador está descartando armas 5e únicas do catálogo já consolidado')
require("import('./spells.js')" in catalogs,
        'Carregador secundário de magias diverge do carregador consolidado do criador')
require("fixed:['Comum'],choose:2" in languages,
        'Idiomas iniciais 5.5e devem ser Comum + 2 padrão')
require('type="importmap"' not in creation,
        'Criador não deve depender de importmap para carregar os dropdowns')
require('Carregando catálogos e regras...' not in creation,
        'Texto de carregamento removido voltou ao criador')
require('scripts/character-builder.js?v=' in creation and "import('./character-builder/ui.js?v=" in builder,
        'Criador deve manter revisão explícita de cache na entrada e no núcleo, sem congelar uma revisão histórica específica')
require('organizeRaceVariants' in catalogs and 'race-variants.js' in catalogs,
        'Catálogo racial não usa a normalização compartilhada de variantes')
for token in ['Eladrin', 'Elfo do Mar', 'Shadar-kai', 'Duergar', 'Gnomo das Profundezas',
              'Legado Tiefling', 'Legado Kobold', 'Dolurrhi', 'Draconic Sorcery']:
    require(token in race_variants, f'Variante racial obrigatória ausente do normalizador: {token}')
require('withLineagePackage' in rules and 'replaceTraitNames' in rules,
        'Linhagens substitutivas podem estar acumulando indevidamente os traços da espécie-base')

# Espécies e subclasses legadas devem manter metadados reais de 5e.
motm = load('dados/especies-pdf-motm-2022.json')
require(motm['fonte']['ruleset'] == '5e', 'MotM deve permanecer identificado como 5e')
require(any(x.get('nome') == 'Eladrin' for x in motm.get('items', [])),
        'Eladrin ausente do material do Hub')

sub = load('dados/subclasses-pdfs.json')
require('conteúdo único anterior' in sub.get('regra_precedencia', ''),
        'Política de subclasses não preserva legado único')
legacy_sub = [x for x in sub.get('subclasses', []) if x.get('status') == 'legado_com_conteudo_unico']
require(legacy_sub, 'Nenhuma subclasse 5e única marcada para compatibilidade')

# Itens mágicos: 2024 prevalece por identidade; itens 2014 únicos continuam ativos.
magic = load('dados/itens-magicos/manifest.json')
require('5.5e/2024 prevalece' in magic.get('politica_sobreposicao', ''),
        'Itens mágicos sem precedência 2024')
require(magic.get('controle', {}).get('srd51_legado_ativo', 0) >= 1,
        'Legado único de itens mágicos foi perdido')
magic_page = text('itens-magicos.html')
require('Espaços de Itens Mágicos' in magic_page and 'Sintonização no Hub' in magic_page,
        'Itens mágicos ainda tratam Sintonização padrão como regra operacional')

# Magias: o catálogo consolidado precisa manter 2024 + conteúdo 2014 sem equivalente.
spell_loader = text('scripts/character-builder/spells.js')
require("json('dados/magias-catalogo.json" in spell_loader,
        'Criador não usa o catálogo consolidado de magias')
spells = load('dados/magias-catalogo.json')
spell_items = spells.get('itens', [])
require(spells.get('controle', {}).get('validado') is True and len(spell_items) >= 500,
        'Catálogo consolidado de magias está incompleto ou não validado')
require(any(x.get('ruleset') == '5.5e' for x in spell_items),
        'Catálogo de magias perdeu conteúdo 5.5e/2024')
require(any(x.get('ruleset') == '5e' for x in spell_items),
        'Catálogo de magias perdeu conteúdo legado 5e sem equivalente')
spell_page = text('magias.html')
require('const groups=new Map()' in spell_page and 'versoes_anteriores_descartadas' in spell_page,
        'Biblioteca de Magias não está consolidando versões por identidade')

# Concentração Expandida: 2024 determina concentração; classificação é explícita, nunca heurística.
ce = text('scripts/concentracao-expandida-selos.js')
require("NC: 'Pendente de classificação'" in ce and "return 'NC';" in ce,
        'Magias novas de concentração ainda podem ser classificadas sem validação explícita')
for forbidden in ('miscTags', 'areaTags', 'strongConditions', 'majorName'):
    require(forbidden not in ce,
            f'Heurística proibida voltou à Concentração Expandida: {forbidden}')
for conjure in ('Conjure Celestial', 'Conjure Minor Elementals', 'Conjure Woodland Beings'):
    require(conjure in ce, f'Reclassificação 2024 ausente na Concentração Expandida: {conjure}')
no_concentration_2024 = {
    'Barkskin', 'Divine Favor', 'Magic Weapon', 'True Strike',
    'Searing Smite', 'Thunderous Smite', 'Wrathful Smite'
}
current_by_name = {
    norm(x.get('nome_original') or x.get('nome')): x
    for x in spell_items if x.get('ruleset') == '5.5e'
}
for name in no_concentration_2024:
    row = current_by_name.get(norm(name))
    require(row is not None, f'Magia 2024 ausente do catálogo: {name}')
    require(row.get('concentracao') is False,
            f'{name} 2024 não pode ocupar vaga da Concentração Expandida')

# Talentos e raças: visualização ativa prefere 2024 e preserva legado único.
feat_page = text('dados/_module-source/talentos.html')
require('function consolidar' in feat_page and 'talentos-tasha-2020.json' in feat_page,
        'Biblioteca de talentos não aplica precedência 5e/5.5e')
race_page = text('dados/_module-source/especies.html')
race_library = text('scripts/race-library.js')
require('scripts/race-library.js' in race_page and 'loadSpecies' in race_library and 'loadSpecies' in catalogs,
        'Biblioteca de raças não compartilha o catálogo normalizado do construtor')
require('precedência 2024' in race_page and 'mesmo catálogo do construtor' in race_page,
        'Biblioteca de raças não explicita a política de precedência e sincronização')
class_detail = text('classes-v3.html')
require('STANDARD_ASI=new Set([4,8,12,16,19])' in class_detail and 'Talento — Regra da Casa' in class_detail,
        'Classes ainda expõem os ASIs regulares substituídos como progressão ativa')

# Armas, armaduras e maestrias.
mastery = load('dados/maestrias-de-arma-pdfs.json')
canonical = {
    x.get('nome') for x in mastery.get('itens', [])
    if x.get('classificacao', {}).get('origem') == 'oficial_aberta'
    and x.get('classificacao', {}).get('status') == 'atual'
}
required_masteries = {'Cleave', 'Graze', 'Nick', 'Push', 'Sap', 'Slow', 'Topple', 'Vex'}
require(required_masteries.issubset(canonical),
        f'Maestrias 2024 ausentes: {sorted(required_masteries - canonical)}')
require(mastery.get('controle', {}).get('oficiais_canonicas') == 8,
        'Quantidade de maestrias oficiais 2024 divergente')
weapons = load('dados/armas-srd.json')
require(weapons.get('controle', {}).get('legados_5e', 0) >= 1,
        'Catálogo de armas perdeu conteúdo 5e sem equivalente')
require(any(x.get('ruleset') == '5e' for x in weapons.get('itens', [])),
        'Nenhuma arma 5e única permanece no catálogo consolidado')
weapon_page = text('armas.html')
armor_page = text('armaduras.html')
require('NÃO CANONIZAR' in weapon_page,
        'Armas demonstrativas não estão protegidas contra canonização')
require('não canonizar' in armor_page.lower(),
        'Armaduras demonstrativas não estão protegidas contra canonização')

# PDFs registrados: fontes, manifesto e artefatos de runtime precisam ser rastreáveis.
# `artefatos_relacionados` também guarda linhagem histórica/intermediária e não implica
# que cada arquivo antigo deva permanecer publicado no repositório atual.
pdf_registry = load('dados/fontes-pdf-registradas.json')
pdf_manifest = load('dados/importacao-pdfs-manifest.json')
require(pdf_registry.get('controle', {}).get('quantidade') == len(pdf_registry.get('fontes', [])) >= 2,
        'Registro de PDFs inconsistente')
registered_pdf_names = {x.get('arquivo') for x in pdf_registry.get('fontes', [])}
require(registered_pdf_names == set(pdf_manifest.get('fontes_pdf', [])),
        'Manifesto de importação e registro de PDFs divergem')
require(pdf_manifest.get('status') == 'publicado_verificado',
        'Importação dos PDFs não está em estado publicado/verificado')

critical_pdf_artifacts = [
    'dados/monstros-pdf-extras.json',
    'dados/auditoria-monstros-pdfs.json',
    'dados/monstros-pdfs-auditoria.json',
    'dados/ferramentas-pdfs.json',
    'dados/bugigangas-pdfs.json',
    'dados/armaduras-pdfs.json',
    'dados/armas-pdfs-manifest.json',
    'dados/equipamentos-aventura-pdfs.json',
    'dados/equipamentos-aventura-core-pdfs.json',
]
for artifact in critical_pdf_artifacts:
    require((ROOT / artifact).exists(), f'Artefato PDF materializado ausente: {artifact}')

historical_missing = []
for src in pdf_registry.get('fontes', []):
    require(src.get('status') == 'registrado', f'PDF não registrado: {src.get("arquivo")}')
    require(src.get('uso_no_hub'), f'PDF sem módulos de uso: {src.get("arquivo")}')
    related = src.get('artefatos_relacionados', [])
    existing = [artifact for artifact in related if (ROOT / artifact).exists()]
    require(existing, f'PDF sem nenhum artefato relacionado materializado: {src.get("arquivo")}')
    historical_missing.extend(
        f'{src.get("arquivo")}::{artifact}'
        for artifact in related if not (ROOT / artifact).exists()
    )

require((ROOT / 'scripts/politica-regras-biblioteca.js').exists(),
        'Política global da Biblioteca ausente')

print(
    'Auditoria 5e/5.5e concluída: '
    f'{len(MODULES)}/18 módulos; {len(house)} Regras da Casa pesquisáveis; '
    f'{len(spell_items)} magias consolidadas; {len(legacy_sub)} subclasses legadas únicas; '
    f'{len(registered_pdf_names)} PDFs registrados e rastreados; '
    f'{len(historical_missing)} referências históricas de artefatos não materializadas no runtime atual; '
    'precedência 2024 + legado 2014 compatível validados.'
)