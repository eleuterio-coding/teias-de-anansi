import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const html=read('regras.html');
const viewer=read('scripts/regras-srd-view-v7.js');
const data=JSON.parse(read('dados/regras-casa-adicionais.json'));
const items=Array.isArray(data.itens)?data.itens:[];
const byOriginal=new Map(items.map(row=>[row.original,row]));

const required={
 'Universal Feat and Ability Progression (House Rule)':'Progressão Universal de Talentos e Atributos',
 'Base Ability Score Distribution (House Rule)':'Distribuição de Atributos Base',
 'Wealth by Level (House Rule)':'Riqueza por Level'
};
for(const[original,name]of Object.entries(required)){
 const row=byOriginal.get(original);assert.ok(row,`Regra ausente do catálogo: ${original}`);
 assert.equal(row.nome,name,`Nome incorreto para ${original}`);
 assert.equal(row.familia,'Regra da Casa',`${name} não está marcada como Regra da Casa`)
}
const universal=byOriginal.get('Universal Feat and Ability Progression (House Rule)');
const sectionsUniversal=Object.fromEntries((universal.secoes||[]).map(s=>[s.titulo,s.texto||'']));
for(const title of['Progressão Universal de Talentos','Aumentos de Atributo','Acúmulo no Nível 12','Substituição dos Marcos Regulares de Classe','Benefícios Adicionais de Classe','Talento de Origem','Multiclasse'])assert.ok(title in sectionsUniversal,`Progressão universal sem seção: ${title}`);
for(const level of[1,3,6,9,12,15,18])assert.match(sectionsUniversal['Progressão Universal de Talentos'],new RegExp(`\\b${level}\\b`),`Talento universal ausente no nível ${level}`);
for(const level of[4,8,12,16,20])assert.match(sectionsUniversal['Aumentos de Atributo'],new RegExp(`\\b${level}\\b`),`Aumento de atributo ausente no nível ${level}`);
assert.match(sectionsUniversal['Substituição dos Marcos Regulares de Classe'],/4, 8, 12, 16 e 19/);
assert.match(sectionsUniversal['Acúmulo no Nível 12'],/1 Talento e \\+1/);
assert.match(sectionsUniversal['Benefícios Adicionais de Classe'],/permanecem válidos/);
assert.equal(items.filter(row=>row.original===universal.original).length,1,'O card de progressão universal não deve ser duplicado.');

const wealth=byOriginal.get('Wealth by Level (House Rule)');
const sections=Object.fromEntries((wealth.secoes||[]).map(s=>[s.titulo,s.texto||'']));
for(const title of['Aplicação','Pacotes Iniciais','Fórmula','Faixas Econômicas','Classificação Padrão dos Antecedentes','Valores por Level'])assert.ok(title in sections,`Riqueza por Level sem seção normativa: ${title}`);
assert.ok(sections['Valores por Level'].includes('Level 20: 30.000 PO'),'Curva vigente de riqueza não termina em 30.000 PO no Level 20.');
assert.ok(!JSON.stringify(wealth).includes('90.800 PO'),'Curva antiga de riqueza ainda está presente.');
assert.ok(sections['Faixas Econômicas'].includes('Precária ×0,90')&&sections['Faixas Econômicas'].includes('Privilegiada ×1,15'),'Faixas econômicas incompletas.');
assert.equal(items.filter(row=>row.original==='Wealth by Level (House Rule)').length,1,'Riqueza por Level deve existir uma única vez.');
for(const token of['id="regra-casa-progressao-universal"','id="regra-casa-atributos-base"','id="regra-casa-wealth-by-level"','id="politica-compatibilidade-5e-55e"','<strong>Compatibilidade 5e / 5.5e no Hub</strong>'])assert.ok(!html.includes(token),`Bloco especial removido voltou ao HTML: ${token}`);
assert.ok(viewer.includes('HOUSE.length!==7')&&viewer.includes('${HOUSE.length}/7'),'Visualizador não exige as sete Regras da Casa.');
assert.ok(viewer.includes('renderHouse')&&viewer.includes("kind:'house'"),'Regras da Casa não usam o renderizador normalizado.');
console.log('Regras da Casa incorporadas ao gate mestre: catálogo, unicidade, riqueza e apresentação validados.');
