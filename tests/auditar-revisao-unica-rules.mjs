import assert from'node:assert/strict';
import fs from'node:fs';
import path from'node:path';

const ROOT=process.cwd(),RULES_REV='20261106-rules-singleton1',PAGE_REV='20261106-wizard-rules1';
const EXPECTED_DIRECT_IMPORTS=48; // 16 versionados + 32 sem query no HEAD de referência
const files=[];
function walk(dir){
  for(const entry of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){
    const rel=path.posix.join(dir,entry.name);
    if(entry.isDirectory())walk(rel);
    else if(entry.name.endsWith('.js'))files.push(rel);
  }
}
walk('scripts');

const refs=[];
const importPattern=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['"]([^'"]*\/rules\.js(?:\?v=([A-Za-z0-9._-]+))?)['"]/g;
for(const file of files){
  const source=fs.readFileSync(path.join(ROOT,file),'utf8');
  for(const match of source.matchAll(importPattern)){
    refs.push({file,revision:match[2]||null,literal:match[1]});
  }
}
assert.equal(refs.length,EXPECTED_DIRECT_IMPORTS,
  `O inventário de imports diretos do motor mudou: esperado ${EXPECTED_DIRECT_IMPORTS}, encontrado ${refs.length}.\n${refs.map(x=>`${x.file}: ${x.literal}`).join('\n')}`);
const withoutVersion=refs.filter(x=>!x.revision);
assert.equal(withoutVersion.length,0,
  `O motor central rules.js não pode ser importado sem versão; encontrados ${withoutVersion.length}:\n${withoutVersion.map(x=>`${x.file}: ${x.literal}`).join('\n')}`);
const revisions=[...new Set(refs.map(x=>x.revision))];
assert.deepEqual(revisions,[RULES_REV],
  `O motor central rules.js deve possuir uma única revisão ${RULES_REV}; encontradas: ${revisions.join(', ')}.\n${refs.map(x=>`${x.file}: ${x.revision}`).join('\n')}`);

const rules=fs.readFileSync(path.join(ROOT,'scripts/character-builder/rules.js'),'utf8');
assert.ok(rules.includes(`export const RULES_REVISION='${RULES_REV}'`),'O módulo central deve declarar a revisão canônica idêntica aos imports.');

const html=fs.readFileSync(path.join(ROOT,'criacao-personagem.html'),'utf8');
const loader=fs.readFileSync(path.join(ROOT,'scripts/character-builder.js'),'utf8');
assert.ok(html.includes(`character-builder.js?v=${PAGE_REV}`),`A página deve usar a revisão atual do fluxo de criação ${PAGE_REV}, independente da revisão normativa do motor.`);
assert.ok(loader.includes(`ui.js?v=${RULES_REV}`),`O loader deve invalidar o núcleo para ${RULES_REV}.`);
assert.ok(loader.includes(`wizard-ui.js?v=${RULES_REV}`),'Wizard deve invalidar importadores transitivos do motor.');
assert.ok(loader.includes(`package-b-purchase-ui.js?v=${RULES_REV}`),'Compras deve invalidar importadores transitivos do motor.');
assert.ok(loader.includes(`class-skill-ui.js?v=${RULES_REV}`),`O loader deve invalidar a extensão de Classe para ${RULES_REV}.`);


const CACHE_PARENT_GRAPH={
  "scripts/character-builder.js": [
    "character-builder/ui.js",
    "character-builder/ability-score-ui.js",
    "character-builder/spell-selection-ui.js",
    "character-builder/spell-swap-ui.js",
    "character-builder/spell-quota-ui.js",
    "character-builder/profile-ui.js",
    "character-builder/species-trait-ui.js",
    "character-builder/class-skill-ui.js",
    "character-builder/feat-ui.js",
    "character-builder/house-rules-ui.js",
    "character-builder/house-feat-prereq-ui.js",
    "character-builder/equipment-ownership-ui.js",
    "character-builder/wizard-ui.js",
    "character-builder/package-b-purchase-ui.js"
  ],
  "scripts/character-builder/wizard-ui.js": [
    "wealth-purchase-creation-ui.js",
    "background-ability-ui.js",
    "house-feat-prereq-ui.js"
  ],
  "scripts/character-builder/package-b-purchase-ui.js": [
    "wealth-purchase-ui.js",
    "starting-equipment-ui.js",
    "starting-equipment-review-ui.js",
    "origin-feat-sync.js",
    "skilled-feat-ui.js"
  ],
  "scripts/character-builder/wealth-purchase-creation-ui.js": [
    "wealth-purchase-ui.js"
  ],
  "scripts/character-builder/profile-ui.js": [
    "language-mechanics.js"
  ],
  "scripts/character-sheet-gameplay-ui.js": [
    "character-sheet-level-up-ui.js"
  ],
  "scripts/character-sheet-level-up-ui.js": [
    "character-sheet-level-up-rules.js"
  ],
  "scripts/character-sheet-encounter-target.js": [
    "character-sheet-resolution-ui.js"
  ],
  "ficha-personagem.html": [
    "scripts/character-sheet.js",
    "scripts/character-sheet-gameplay-ui.js",
    "scripts/character-sheet-skill-checks.js",
    "scripts/character-sheet-equipment-ownership.js",
    "scripts/character-sheet-spell-preparation.js",
    "scripts/character-sheet-spell-runtime.js",
    "scripts/character-sheet-unified-spells.js",
    "scripts/character-sheet-feat-ui.js"
  ]
};
let cacheEdges=0;
for(const [parent,children] of Object.entries(CACHE_PARENT_GRAPH)){
  const source=fs.readFileSync(path.join(ROOT,parent),'utf8');
  for(const child of children){
    cacheEdges++;
    assert.ok(source.includes(`${child}?v=${RULES_REV}`),`${parent} deve invalidar o importador transitivo ${child} com a revisão única do motor.`);
  }
}
assert.equal(cacheEdges,35,'O inventário de dependências transitivas/cache deve preservar 35 vínculos de revisão.');

console.log(`Revisão única do motor validada: ${refs.length} imports do rules.js central usam ${RULES_REV}; cache da página permanece independente em ${PAGE_REV}.`);
