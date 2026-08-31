from pathlib import Path
import json, re, posixpath, sys

REV = "20260831-tasha-metamagic1"

def read(path):
    return Path(path).read_text(encoding="utf-8")

def write(path, text):
    Path(path).write_text(text, encoding="utf-8")

def must_replace(path, old, new, count=1):
    text = read(path)
    if new in text:
        return
    if old not in text:
        raise RuntimeError(f"Âncora ausente em {path}: {old[:120]!r}")
    write(path, text.replace(old, new, count))

# 1. Metamagic Adept: pool separado e restrito a Metamagia.
path = "scripts/character-builder/tasha-feat-mechanics.js"
text = read(path)
text = text.replace(
    "d.sorceryPointsBonus=num(d.sorceryPointsBonus)+2;",
    "d.metamagicAdeptSorceryPoints=num(d.metamagicAdeptSorceryPoints)+2;"
)
write(path, text)

path = "tests/auditar-talentos-tasha-2020.mjs"
text = read(path)
text = text.replace("sorceryPointsBonus:0,", "metamagicAdeptSorceryPoints:0,")
text = text.replace(
    "assert.equal(d.sorceryPointsBonus,2);",
    "assert.equal(d.metamagicAdeptSorceryPoints,2);"
)
needle = "assert.equal(d.metamagicAdeptSorceryPoints,2);"
extra = needle + "assert.equal(d.sorceryPoints,undefined,'Metamagic Adept não pode engrossar o pool normal de Pontos de Feitiçaria.');"
if extra not in text:
    if needle not in text:
        raise RuntimeError("Âncora do teste de pool restrito ausente")
    text = text.replace(needle, extra, 1)
write(path, text)

# 2. Registrar as regras Tasha no motor principal de talentos.
path = "scripts/character-builder/feat-mechanics.js"
text = read(path)
anchor = "import{XANATHAR_2017_FEAT_RULES}from'./feat-rules-xanathar-2017.js?v=20260831-xanathar-feats1';\n"
addition = "import{TASHA_2020_FEAT_RULES}from'./feat-rules-tasha-2020.js?v=20260831-tasha-metamagic1';\n"
if addition not in text:
    if anchor not in text:
        raise RuntimeError("Import Xanathar não encontrado em feat-mechanics")
    text = text.replace(anchor, anchor + addition, 1)
if "...TASHA_2020_FEAT_RULES" not in text:
    old = " ...XANATHAR_2017_FEAT_RULES\n};"
    new = " ...XANATHAR_2017_FEAT_RULES,\n ...TASHA_2020_FEAT_RULES\n};"
    if old not in text:
        raise RuntimeError("Spread Xanathar não encontrado em FEAT_RULES")
    text = text.replace(old, new, 1)
write(path, text)

# 3. Inicializar Metamagia e controles Tasha junto à etapa de Classe.
path = "scripts/character-builder/class-skill-ui.js"
text = read(path)
anchor = "import{initInvocationUi}from'./invocation-ui.js?v=20260831-warlock-invocations2';\n"
additions = (
    "import{initMetamagicUi}from'./metamagic-ui.js?v=20260831-tasha-metamagic1';\n"
    "import{initTashaFeatUi}from'./tasha-feat-ui.js?v=20260831-tasha-metamagic1';\n"
)
if "initMetamagicUi" not in text:
    if anchor not in text:
        raise RuntimeError("Import de Invocações não encontrado em class-skill-ui")
    text = text.replace(anchor, anchor + additions, 1)
old = "initClassToolUi();initClassFeatureFeatUi();initFeatMultiOptionUi();initInvocationUi();"
new = "initClassToolUi();initClassFeatureFeatUi();initFeatMultiOptionUi();initInvocationUi();initMetamagicUi();initTashaFeatUi();"
if new not in text:
    if old not in text:
        raise RuntimeError("Inicializadores de Classe não encontrados")
    text = text.replace(old, new, 1)
write(path, text)

# 4. Integrar Metamagia/Tasha no rules.js.
path = "scripts/character-builder/rules.js"
text = read(path)
anchor = "import{invocationOutcome,sanitizeWarlockInvocations}from'./invocation-mechanics.js?v=20260831-warlock-invocations2';\n"
additions = (
    "import{metamagicOutcome,sanitizeSorcererMetamagic}from'./metamagic-mechanics.js?v=20260831-tasha-metamagic1';\n"
    "import{applyTashaFeatEffects,tashaOriginFeatInstances,sanitizeTashaFeatChoices}from'./tasha-feat-mechanics.js?v=20260831-tasha-metamagic1';\n"
)
if "applyTashaFeatEffects" not in text:
    if anchor not in text:
        raise RuntimeError("Import de invocation-mechanics não encontrado em rules.js")
    text = text.replace(anchor, anchor + additions, 1)

if "function withSupplementalOriginFeats" not in text:
    pattern = re.compile(r"function withInvocationOriginFeats\(fn\)\{.*?\}\nexport function speciesTraitChoiceDefs", re.S)
    replacement = """function withSupplementalOriginFeats(fn){const classGrants=arr(invocationOutcome().originFeatIds).map(id=>({id,kind:'invocation',source:'Invocação Mística · Lessons of the First Ones'})),tashaGrants=tashaOriginFeatInstances().map(inst=>({id:inst.feat.id,kind:'tasha-invocation',source:inst.source})),grants=[...classGrants,...tashaGrants],klass=(state.catalogs.classes||[]).find(x=>x.id===state.c?.refs?.class);if(!grants.length||!klass||!state.c?.choices)return fn();const progression=klass._houseFeatProgression,choices=state.c.choices.feats||(state.c.choices.feats={}),saved={};klass._houseFeatProgression=[...arr(progression)];grants.forEach((grant,index)=>{const slot=`supplemental-origin-${index}`;saved[slot]=Object.prototype.hasOwnProperty.call(choices,slot)?choices[slot]:undefined;choices[slot]=grant.id;klass._houseFeatProgression.push({level:1,kind:grant.kind,slot,index,source:grant.source})});try{return fn()}finally{klass._houseFeatProgression=progression;for(const[id,value]of Object.entries(saved)){if(value===undefined)delete choices[id];else choices[id]=value}}}
export function speciesTraitChoiceDefs"""
    text, n = pattern.subn(replacement, text, count=1)
    if n != 1:
        raise RuntimeError("withInvocationOriginFeats não encontrado")

old = "export function sanitizeSelections(){applyHouseRules();syncSorcererSpellAccess();const result=withLineagePackage(()=>withLegacyCompatibility(()=>base.sanitizeSelections()));sanitizeWarlockInvocations();applyHouseRules();return result}"
new = "export function sanitizeSelections(){applyHouseRules();syncSorcererSpellAccess();const result=withLineagePackage(()=>withLegacyCompatibility(()=>base.sanitizeSelections()));sanitizeWarlockInvocations();sanitizeSorcererMetamagic();sanitizeTashaFeatChoices();applyHouseRules();return result}"
if new not in text:
    if old not in text:
        raise RuntimeError("sanitizeSelections esperado não encontrado")
    text = text.replace(old, new, 1)

pattern = re.compile(r"function sourceForInstance\(inst,klass\)\{.*?\}\nfunction applyEpicAbilityScores", re.S)
replacement = """function sourceForInstance(inst,klass){if(inst.key==='background')return'Talento de Origem · Antecedente';if(!inst.key?.startsWith('class:'))return inst.source;const slot=inst.key.slice(6),entry=arr(klass?._houseFeatProgression).find(x=>x.slot===slot);if(!entry)return inst.source;if(entry.kind==='invocation')return'Invocação Mística · Lessons of the First Ones';if(entry.kind==='tasha-invocation')return entry.source||'Eldritch Adept · Lessons of the First Ones';if(entry.kind==='house')return`Regra da Casa · nível ${entry.level}`;return`Classe · nível ${entry.level} · talento adicional`}
function applyEpicAbilityScores"""
text, n = pattern.subn(replacement, text, count=1)
if n != 1:
    raise RuntimeError("sourceForInstance não encontrado")

anchor = "function applyFeatAttackEffects(d){if(d.attack!=null&&d.weapon&&/distancia/.test(fold(d.weapon.categoria||'')))d.attack+=num(d.featMechanics?.rangedAttackBonus);return d}\n"
helper = "function applyMetamagicEffects(d){const outcome=metamagicOutcome();d.metamagicClass=outcome;d.metamagicOptions=uniq([...arr(d.metamagicOptions),...outcome.options.map(x=>x.option.id)]);d.sorceryPoints=outcome.sorceryPoints;return d}\n"
if helper not in text:
    if anchor not in text:
        raise RuntimeError("applyFeatAttackEffects não encontrado")
    text = text.replace(anchor, helper + anchor, 1)

pattern = re.compile(r"export function derive\(\)\{.*?return d\}\n/\* Compatibilidade", re.S)
derive = """export function derive(){applyHouseRules();syncSorcererSpellAccess();let d=withLineagePackage(()=>withSupplementalOriginFeats(()=>base.derive()));d=applyEpicAbilityScores(d);d=applyLineagePackageEffects(d);d=applyInvocationEffects(d);d=applyClassToolEffects(d);d=applyMetamagicEffects(d);d=applyTashaFeatEffects(d);applyBarbarianSubclassMechanics(d);applyArtificerSubclassMechanics(d);applyBardSubclassMechanics(d);applyDruidSubclassMechanics(d);applyFighterSubclassMechanics(d);applyFighterSubclassRuleDetails(d);applyMonkSubclassMechanics(d);applyMonkSubclassRuleDetails(d);applyPaladinSubclassMechanics(d);applyPaladinSubclassRuleDetails(d);applyRangerSubclassMechanics(d);applyRangerSubclassRuleDetails(d);applyRogueSubclassMechanics(d);applySorcererSubclassMechanics(d);applyWarlockSubclassMechanics(d);applyWizardSubclassMechanics(d);applyFeatAttackEffects(d);d.classFeatures=arr(d.classFeatures).filter(feature=>!isReplacedClassFeat(feature));d.houseFeatProgression=arr(d.klass?._houseFeatProgression).filter(entry=>entry.level<=d.level).map(entry=>({...entry}));const choices=state.c.choices.houseAbilities||{};d.houseAbilityProgression=HOUSE_ABILITY_LEVELS.filter(level=>level<=d.level).map(level=>({level,ability:choices[String(level)]||choices[level]||null}));if(d.featMechanics){d.featMechanics.instances=arr(d.featMechanics.instances).map(inst=>({...inst,source:sourceForInstance(inst,d.klass)}));d.featMechanics.houseAbilityProgression=d.houseAbilityProgression}const skillChecks=deriveSkillCheckMechanics(d);d.skillChecks=skillChecks.checks;d.jackOfAllTrades=skillChecks.jackOfAllTrades;d.passive=skillChecks.passivePerception;return d}
/* Compatibilidade"""
text, n = pattern.subn(derive, text, count=1)
if n != 1:
    raise RuntimeError("derive() central não encontrado")
write(path, text)

# 5. Escopo fail-closed.
path = "dados/auditoria-criacao-escopo.json"
data = json.loads(read(path))
classes = next(d for d in data["dominios"] if d["id"] == "classes")
if "dados/metamagias-feiticeiro-2024.json" not in classes["fontes"]:
    classes["fontes"].append("dados/metamagias-feiticeiro-2024.json")
for test in ["tests/auditar-metamagias-feiticeiro-2024.mjs", "tests/auditar-talentos-tasha-2020.mjs"]:
    if test not in data["testes_criticos"]:
        data["testes_criticos"].append(test)
write(path, json.dumps(data, ensure_ascii=False, indent=2) + "\n")

# 6. Workflow normativo observa e executa os novos gates.
path = ".github/workflows/auditar-proveniencia-normativa.yml"
text = read(path)
if "      - 'dados/metamagias-feiticeiro-2024.json'\n" not in text:
    marker = "      - 'dados/artificer-2025.json'\n"
    if marker not in text:
        raise RuntimeError("watch de artificer não encontrado no workflow normativo")
    text = text.replace(marker, marker + "      - 'dados/metamagias-feiticeiro-2024.json'\n", 1)
if "      - 'tests/auditar-metamagias-feiticeiro-2024.mjs'\n" not in text:
    marker = "      - 'tests/auditar-ferramentas-classe.mjs'\n"
    if marker not in text:
        raise RuntimeError("watch de ferramentas não encontrado")
    text = text.replace(marker, marker + "      - 'tests/auditar-metamagias-feiticeiro-2024.mjs'\n      - 'tests/auditar-talentos-tasha-2020.mjs'\n", 1)
marker = "      - name: 11B/11C/11E · Validar Invocações Místicas do Bruxo 2024\n        run: node tests/auditar-invocacoes-bruxo-2024.mjs\n"
extra = (
    "      - name: 11B/11E · Validar Metamagia do Feiticeiro 2024\n"
    "        run: node tests/auditar-metamagias-feiticeiro-2024.mjs\n"
    "      - name: 11B/11E · Validar talentos Tasha 2020\n"
    "        run: node tests/auditar-talentos-tasha-2020.mjs\n"
)
if "Validar Metamagia do Feiticeiro 2024" not in text:
    if marker not in text:
        raise RuntimeError("step Invocações não encontrado no workflow normativo")
    text = text.replace(marker, marker + extra, 1)
write(path, text)

# 7. Invalidação de cache por grafo de dependências.
roots = {
    "scripts/character-builder/rules.js",
    "scripts/character-builder/feat-mechanics.js",
    "scripts/character-builder/class-skill-ui.js",
    "scripts/character-builder/invocation-mechanics.js",
    "scripts/character-builder/metamagic-catalog.js",
    "scripts/character-builder/metamagic-mechanics.js",
    "scripts/character-builder/metamagic-ui.js",
    "scripts/character-builder/tasha-feat-mechanics.js",
    "scripts/character-builder/tasha-feat-ui.js",
    "scripts/character-builder/feat-rules-tasha-2020.js",
}
jsfiles = list(Path("scripts").rglob("*.js"))
changed = set(roots)
spec_re = re.compile(r"(?P<q>['\"])(?P<spec>\.\.?/[^'\"]+?\.js)(?:\?v=[A-Za-z0-9._-]+)?(?P=q)")

def resolve(src, spec):
    return posixpath.normpath(posixpath.join(posixpath.dirname(src), spec))

while True:
    newly_changed = set()
    for p in jsfiles:
        rel = p.as_posix()
        text = p.read_text(encoding="utf-8")
        touched = [False]
        def repl(m):
            spec = m.group("spec")
            target = resolve(rel, spec)
            if target not in changed:
                return m.group(0)
            desired = f"{m.group('q')}{spec}?v={REV}{m.group('q')}"
            if desired != m.group(0):
                touched[0] = True
            return desired
        new = spec_re.sub(repl, text)
        if touched[0]:
            p.write_text(new, encoding="utf-8")
            if rel not in changed:
                newly_changed.add(rel)
    if not newly_changed:
        break
    changed.update(newly_changed)

# Entrada HTML invalida o loader se o loader mudou.
path = "criacao-personagem.html"
text = read(path)
text = re.sub(r"character-builder\.js\?v=[A-Za-z0-9._-]+", f"character-builder.js?v={REV}", text)
write(path, text)

# 8. Contratos da revisão canônica.
path = "tests/auditar-revisao-unica-rules.mjs"
text = read(path)
text = re.sub(r"const ROOT=process\.cwd\(\),REV='[^']+';", f"const ROOT=process.cwd(),REV='{REV}';", text, count=1)
write(path, text)

path = "tests/auditar-criacao-sem-travamento.mjs"
text = read(path)
text = re.sub(r"const REV='[^']+';", f"const REV='{REV}';", text, count=1)
text = re.sub(r"const SKILL_REV='[^']+';", f"const SKILL_REV='{REV}';", text, count=1)
loader = read("scripts/character-builder.js")
m = re.search(r"package-b-purchase-ui\.js\?v=([A-Za-z0-9._-]+)", loader)
if not m:
    raise RuntimeError("Revisão de package-b não encontrada no loader")
wealth_rev = m.group(1)
text = re.sub(r"const WEALTH_REV='[^']+';", f"const WEALTH_REV='{wealth_rev}';", text, count=1)
write(path, text)

for path in [".github/workflows/auditar-skilled.yml", ".github/workflows/auditar-escolhas-raca-pacote-b.yml"]:
    text = read(path)
    text = re.sub(r"REV='20260831-(?:class-tools1|warlock-invocations2)'", f"REV='{wealth_rev}'", text)
    write(path, text)

print(f"Integração preparada. Revisão central={REV}; cadeia de compras={wealth_rev}; módulos propagados={len(changed)}")
