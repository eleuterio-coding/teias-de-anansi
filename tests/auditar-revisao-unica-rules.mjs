import assert from'node:assert/strict';
import fs from'node:fs';
import path from'node:path';

const ROOT=process.cwd(),REV='20260831-tasha-metamagic1';
const files=[];
function walk(dir){for(const entry of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){const rel=path.posix.join(dir,entry.name);if(entry.isDirectory())walk(rel);else if(entry.name.endsWith('.js'))files.push(rel)}}
walk('scripts/character-builder');
for(const name of fs.readdirSync(path.join(ROOT,'scripts')).filter(x=>/^character-sheet.*\.js$/.test(x)))files.push(`scripts/${name}`);
files.push('scripts/character-builder.js');

const refs=[];
for(const file of files){
 const text=fs.readFileSync(path.join(ROOT,file),'utf8');
 // Exige que "rules.js" seja um segmento de caminho completo. Isso evita
 // confundir módulos independentes como ability-score-rules.js,
 // starting-equipment-rules.js e spell-progression-rules.js com o motor central.
 for(const match of text.matchAll(/(?:['"\/])rules\.js\?v=([A-Za-z0-9._-]+)/g))refs.push({file,revision:match[1],literal:match[0]});
}
assert.ok(refs.length>0,'Nenhuma dependência versionada do motor central rules.js foi encontrada.');
const revisions=[...new Set(refs.map(x=>x.revision))];
assert.deepEqual(revisions,[REV],`O motor central rules.js deve possuir uma única revisão ${REV}; encontradas: ${revisions.join(', ')}.\n${refs.map(x=>`${x.file}: ${x.revision}`).join('\n')}`);

const html=fs.readFileSync(path.join(ROOT,'criacao-personagem.html'),'utf8');
const loader=fs.readFileSync(path.join(ROOT,'scripts/character-builder.js'),'utf8');
assert.ok(html.includes(`character-builder.js?v=${REV}`),`A página deve invalidar o loader para ${REV}.`);
assert.ok(loader.includes(`ui.js?v=${REV}`),`O loader deve invalidar o núcleo para ${REV}.`);
assert.ok(loader.includes(`class-skill-ui.js?v=${REV}`),`O loader deve invalidar a extensão de Classe para ${REV}.`);

console.log(`Revisão única do motor validada: ${refs.length} imports do rules.js central usam ${REV}, com loader e núcleo invalidados.`);
