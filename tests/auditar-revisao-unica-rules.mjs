import assert from'node:assert/strict';
import fs from'node:fs';
import path from'node:path';

const ROOT=process.cwd(),RULES_REV='20260831-tasha-metamagic1',PAGE_REV='20261106-wizard-ready1';
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
const importPattern=/(?:\\bfrom\\s*|\\bimport\\s*(?:\\(\\s*)?)['"]([^'"]*\\/rules\\.js(?:\\?v=([A-Za-z0-9._-]+))?)['"]/g;
for(const file of files){
  const source=fs.readFileSync(path.join(ROOT,file),'utf8');
  for(const match of source.matchAll(importPattern)){
    refs.push({file,revision:match[2]||null,literal:match[1]});
  }
}
assert.equal(refs.length,EXPECTED_DIRECT_IMPORTS,
  `O inventário de imports diretos do motor mudou: esperado ${EXPECTED_DIRECT_IMPORTS}, encontrado ${refs.length}.\\n${refs.map(x=>`${x.file}: ${x.literal}`).join('\\n')}`);
const withoutVersion=refs.filter(x=>!x.revision);
assert.equal(withoutVersion.length,0,
  `O motor central rules.js não pode ser importado sem versão; encontrados ${withoutVersion.length}:\\n${withoutVersion.map(x=>`${x.file}: ${x.literal}`).join('\\n')}`);
const revisions=[...new Set(refs.map(x=>x.revision))];
assert.deepEqual(revisions,[RULES_REV],
  `O motor central rules.js deve possuir uma única revisão ${RULES_REV}; encontradas: ${revisions.join(', ')}.\\n${refs.map(x=>`${x.file}: ${x.revision}`).join('\\n')}`);

const html=fs.readFileSync(path.join(ROOT,'criacao-personagem.html'),'utf8');
const loader=fs.readFileSync(path.join(ROOT,'scripts/character-builder.js'),'utf8');
assert.ok(html.includes(`character-builder.js?v=${PAGE_REV}`),`A página deve usar a revisão atual do fluxo de criação ${PAGE_REV}, independente da revisão normativa do motor.`);
assert.ok(loader.includes(`ui.js?v=${RULES_REV}`),`O loader deve invalidar o núcleo para ${RULES_REV}.`);
assert.ok(loader.includes(`class-skill-ui.js?v=${RULES_REV}`),`O loader deve invalidar a extensão de Classe para ${RULES_REV}.`);

console.log(`Revisão única do motor validada: ${refs.length} imports do rules.js central usam ${RULES_REV}; cache da página permanece independente em ${PAGE_REV}.`);
