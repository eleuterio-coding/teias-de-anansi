import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const policyPath=path.join(ROOT,'scripts','politica-era-cenario.js');
const code=fs.readFileSync(policyPath,'utf8');
const sandbox={console};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(code,sandbox,{filename:policyPath});
const P=sandbox.HubEraPolicy;
assert(P,'HubEraPolicy não foi exposta.');

const prohibited=[
  'Mosquete','Musket','Pistola','Pistol','Blunderbuss','Revolver','Rifle','Shotgun',
  'Automatic Rifle','Hunting Rifle','Semiautomatic Pistol','Antimatter Rifle','Laser Pistol','Laser Rifle',
  'Gunner','Gunpowder Keg','Powder Horn','Dinamite','Fragmentation Grenade','Granada de fumaça',
  'Motorcycle','Automóvel','Truck','Helicopter','Airplane','Spaceship','Computer','Smartphone'
];
for(const name of prohibited)assert(P.matchesName(name),`Conteúdo moderno não bloqueado: ${name}`);

const allowed=[
  'Espada Longa','Adaga','Arco Longo','Besta Pesada','Funda','Sling Bullet','Carroça','Carruagem','Biga',
  'Dirigível','Airship','Corcel Nimblewright','Artífice','Warhammer','Alquimia','Granada Arcana'
];
for(const name of allowed)assert(!P.matchesName(name),`Falso positivo da política de era: ${name}`);

const core=JSON.parse(fs.readFileSync(path.join(ROOT,'dados','armas-srd.json'),'utf8'));
const coreFiltered=P.sanitizePayload(core);
const coreNames=(coreFiltered.itens||[]).map(x=>x.nome_original||x.nome);
assert(!coreNames.some(x=>P.matchesName(x)),'Armas modernas sobreviveram ao filtro do SRD.');
assert(coreNames.includes('Longsword'),'Arma medieval de controle foi removida indevidamente.');

const larsene=JSON.parse(fs.readFileSync(path.join(ROOT,'dados','armas-fontes','larsene-ledger.json'),'utf8'));
const larseneFiltered=P.sanitizePayload(larsene);
const larseneNames=(larseneFiltered.itens||[]).map(x=>x.nome_original||x.nome);
for(const removed of ['Blunderbuss','Musket','Pistol','Revolver','Rifle']){
  assert(!larseneNames.includes(removed),`Arma de pólvora suplementar não removida: ${removed}`);
}
assert(larseneNames.includes('Chakram'),'Arma fantástica/medieval de controle foi removida indevidamente.');

const masteries=JSON.parse(fs.readFileSync(path.join(ROOT,'dados','maestrias-de-arma-pdfs.json'),'utf8'));
const masteriesFiltered=P.sanitizePayload(masteries);
const masteryText=JSON.stringify(masteriesFiltered);
assert(!/\bShotgun\b/i.test(masteryText),'Associação moderna de maestria permaneceu ativa.');
assert(/\bWarhammer\b/i.test(masteryText),'Associação medieval de maestria foi removida indevidamente.');

const rowFiltered=P.sanitizePayload({itens:[['Gunner','Geral','','Não','x'],['Alert','Origem','','Não','x']]});
assert.equal(rowFiltered.itens.length,1,'Linha tabular moderna não foi removida por inteiro.');
assert.equal(rowFiltered.itens[0][0],'Alert','Linha válida foi danificada ao filtrar talento moderno.');

const assocFiltered=P.sanitizePayload({armas_associadas:{pdf:['Shotgun','Warhammer','Greatsword']}});
assert.deepEqual(Array.from(assocFiltered.armas_associadas.pdf),['Warhammer','Greatsword'],'Lista de associações não foi saneada corretamente.');

const workflow=fs.readFileSync(path.join(ROOT,'.github','workflows','deploy-pages.yml'),'utf8');
assert(workflow.includes('data-hub-era-policy="1"'),'Deploy não injeta a política global de era.');
assert(workflow.includes('scripts/politica-era-cenario.js'),'Deploy não referencia o filtro de era.');
assert(workflow.includes("Path('.').glob('*.html')"),'Política de era não cobre todas as páginas HTML raiz.');
assert(workflow.includes("replace('</head>'"),'Política de era não é carregada antes da aplicação.');

const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'dados','armas-pdfs-manifest.json'),'utf8'));
const scope=String(manifest.politica?.escopo_tematico||'');
assert(!/podem permanecer/i.test(scope),'Manifesto ainda autoriza armas de pólvora antigas.');
assert(/exclui/i.test(scope)&&/(polvora|arma de fogo)/i.test(scope.normalize('NFD').replace(/[\u0300-\u036f]/g,'')),'Manifesto não registra a nova exclusão de armas de fogo.');

console.log('Política de era validada: conteúdo de pólvora, industrial, moderno e futurista bloqueado; fantasia medieval/mágica preservada.');
