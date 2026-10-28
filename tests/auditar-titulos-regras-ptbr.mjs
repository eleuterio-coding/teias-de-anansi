import assert from 'node:assert/strict';
import fs from 'node:fs';

// Auditoria de títulos traduzidos do Glossário SRD 5.2.1.
// A lista abaixo reflete todos os 41 verbetes com qualificadores
// explícitos [Action], [Condition], [Hazard], [Area of Effect] e [Attitude]
// na fonte SRD fixada pelo módulo. Não inferir qualificadores em outras regras.
const EXPECTED=[
  [
    "Attack",
    "Atacar [Ação]"
  ],
  [
    "Blinded",
    "Cego [Condição]"
  ],
  [
    "Burning",
    "Em Chamas [Perigo]"
  ],
  [
    "Charmed",
    "Enfeitiçado [Condição]"
  ],
  [
    "Cone",
    "Cone [Área de Efeito]"
  ],
  [
    "Cube",
    "Cubo [Área de Efeito]"
  ],
  [
    "Cylinder",
    "Cilindro [Área de Efeito]"
  ],
  [
    "Dash",
    "Disparada [Ação]"
  ],
  [
    "Deafened",
    "Surdo [Condição]"
  ],
  [
    "Dehydration",
    "Desidratação [Perigo]"
  ],
  [
    "Disengage",
    "Desengajar [Ação]"
  ],
  [
    "Dodge",
    "Esquivar [Ação]"
  ],
  [
    "Emanation",
    "Emanação [Área de Efeito]"
  ],
  [
    "Exhaustion",
    "Exaustão [Condição]"
  ],
  [
    "Falling",
    "Queda [Perigo]"
  ],
  [
    "Friendly",
    "Amigável [Atitude]"
  ],
  [
    "Frightened",
    "Amedrontado [Condição]"
  ],
  [
    "Grappled",
    "Agarrado [Condição]"
  ],
  [
    "Help",
    "Ajudar [Ação]"
  ],
  [
    "Hide",
    "Esconder-se [Ação]"
  ],
  [
    "Hostile",
    "Hostil [Atitude]"
  ],
  [
    "Incapacitated",
    "Incapacitado [Condição]"
  ],
  [
    "Indifferent",
    "Indiferente [Atitude]"
  ],
  [
    "Influence",
    "Influenciar [Ação]"
  ],
  [
    "Invisible",
    "Invisível [Condição]"
  ],
  [
    "Line",
    "Linha [Área de Efeito]"
  ],
  [
    "Magic",
    "Magia [Ação]"
  ],
  [
    "Malnutrition",
    "Desnutrição [Perigo]"
  ],
  [
    "Paralyzed",
    "Paralisado [Condição]"
  ],
  [
    "Petrified",
    "Petrificado [Condição]"
  ],
  [
    "Poisoned",
    "Envenenado [Condição]"
  ],
  [
    "Prone",
    "Caído [Condição]"
  ],
  [
    "Ready",
    "Preparar [Ação]"
  ],
  [
    "Restrained",
    "Contido [Condição]"
  ],
  [
    "Search",
    "Procurar [Ação]"
  ],
  [
    "Sphere",
    "Esfera [Área de Efeito]"
  ],
  [
    "Study",
    "Estudar [Ação]"
  ],
  [
    "Stunned",
    "Atordoado [Condição]"
  ],
  [
    "Suffocation",
    "Sufocamento [Perigo]"
  ],
  [
    "Unconscious",
    "Inconsciente [Condição]"
  ],
  [
    "Utilize",
    "Utilizar [Ação]"
  ]
];
const LABELS={"Action":"Ação","Condition":"Condição","Hazard":"Perigo","Area of Effect":"Área de Efeito","Attitude":"Atitude"};
const pieces=[1,2,3,4].map(n=>fs.readFileSync(`dados/regras-atuais-ptbr.part${n}.txt`,'utf8'));
const rules=JSON.parse(pieces.join('')).itens;
const script=fs.readFileSync('scripts/regras-srd-view-v7.js','utf8');
const page=fs.readFileSync('regras.html','utf8');

const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const dict=new Map(rules.map(r=>[norm(r.original),r]));
assert.equal(rules.length,155,'O total de regras traduzidas não deve mudar.');
assert.equal(dict.size,155,'Não deve haver identificadores originais duplicados.');
assert.equal(EXPECTED.length,41,'A amostra deve abranger todos os 41 verbetes tipados do SRD.');

for(const [original,expectedTitle] of EXPECTED){
  const rule=dict.get(norm(original));
  assert.ok(rule, `Regra ausente: ${original}`);
  const match=expectedTitle.match(/^(.+) \[([^\]]+)\]$/);
  assert.ok(match, `Qualificador inválido para ${original}`);
  assert.equal(rule.nome,match[1], `Nome da regra incorreto: ${original}`);
  assert.ok(Object.values(LABELS).includes(match[2]), `Categoria inválida: ${original}`);
}
assert.equal(new Set(EXPECTED.map(x=>norm(x[0]))).size,41);
assert.equal(EXPECTED.filter(x=>x[1].endsWith('[Ação]')).length,12);
assert.equal(EXPECTED.filter(x=>x[1].endsWith('[Condição]')).length,15);
assert.equal(EXPECTED.filter(x=>x[1].endsWith('[Perigo]')).length,5);
assert.equal(EXPECTED.filter(x=>x[1].endsWith('[Área de Efeito]')).length,6);
assert.equal(EXPECTED.filter(x=>x[1].endsWith('[Atitude]')).length,3);
assert.match(script,/function localizedHeading\(entry,rule\)/);
assert.ok(script.includes("entry.tag ? \`${name} [${familyPT(entry.tag)}]\` : name"));
assert.ok(script.includes('const title=localizedHeading(entry,rule);'));
assert.ok(script.includes('name:localizedHeading(x,ptRule(x.original))'));
assert.ok(script.includes('const ddb='));
assert.ok(script.includes('data-hub-original'));
assert.match(page,/scripts\/regras-srd-view-v7\.js\?v=20261028-deeplinks-original1/);
assert.deepEqual(Object.keys(LABELS).sort(),['Action','Area of Effect','Attitude','Condition','Hazard'].sort());
console.log('OK: 41 títulos tipados traduzidos; 155 regras, IDs originais, busca e referências preservados.');
