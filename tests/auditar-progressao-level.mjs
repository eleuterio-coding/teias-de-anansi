import assert from'node:assert/strict';
import fs from'node:fs';
import{ensureProgressionState,levelUpPlan,preserveDamageOnLevelUp,recordLevelUp,progressionLabel}from'../scripts/character-sheet-level-up-rules.js';

const fighter={id:'classes:test:fighter',slug:'fighter',name:'Guerreiro',hitDie:10,features:[{level:6,name:'Nova característica',text:'Teste.'},{level:8,name:'Ability Score Improvement',text:'Substituída pela Regra da Casa.'}],featSlots:[],_houseFeatProgression:[{level:6,slot:'house-6',kind:'house'}],spellAbility:''};
const directLevel5={id:'pc-direct-5',choices:{class:{level:5}},sheet:{runtime:{currentHp:30}}};
const progression=ensureProgressionState(directLevel5);
assert.equal(progression.startingLevel,5,'Criação direta no Level 5 deve registrar Level de criação 5.');
assert.deepEqual(progression.history,[],'Personagem recém-criado não deve ganhar histórico artificial de progressão.');

const plan6=levelUpPlan(directLevel5,fighter,null,6);
assert.equal(plan6.validTarget,true,'Level 5 deve poder avançar somente para Level 6.');
assert.equal(plan6.targetLevel,6);
assert.equal(plan6.economy.wealthGrantedCp,0,'Level-up nunca concede Riqueza por Level.');
assert.equal(plan6.economy.reapplyStartingPackages,false,'Level-up nunca reaplica pacotes iniciais.');
assert.equal(plan6.economy.reapplyCreationBudget,false,'Level-up nunca recria o orçamento inicial.');
assert.equal(plan6.featEntries.length,1,'Level 6 deve reconhecer o talento da Progressão Universal.');
assert.equal(plan6.featEntries[0].slot,'house-6');
assert.equal(plan6.classFeatures.some(f=>f.name==='Nova característica'),true);
assert.equal(levelUpPlan(directLevel5,fighter,null,7).validTarget,false,'Não é permitido saltar Levels.');

const level7={id:'pc-7',choices:{class:{level:7}},sheet:{}};
const plan8=levelUpPlan(level7,fighter,null,8);
assert.equal(plan8.abilityMilestone,true,'Level 8 deve exigir o +1 da Regra da Casa.');
assert.equal(plan8.classFeatures.some(f=>/Ability Score Improvement/i.test(f.name)),false,'ASI padrão substituído não deve reaparecer no Level-up.');

assert.equal(preserveDamageOnLevelUp(30,40,48),38,'Deve preservar 10 pontos de dano ao aumentar PV máximo.');
assert.equal(preserveDamageOnLevelUp(40,40,48),48,'Personagem sem dano continua sem dano.');
assert.equal(preserveDamageOnLevelUp(0,40,48),0,'Level-up não pode levantar personagem a 0 PV.');

recordLevelUp(directLevel5,{from:5,to:6,maxHpBefore:40,maxHpAfter:48,currentHpBefore:30,currentHpAfter:38,summary:['Nova característica']});
const after=progressionLabel(directLevel5);
assert.equal(after.startingLevel,5);
assert.equal(after.currentLevel,5,'Registrar histórico sozinho não altera o Level; a transação da ficha é a autoridade para isso.');
assert.equal(after.history.length,1);
assert.equal(after.history[0].wealthGrantedCp,0);
assert.equal(after.history[0].startingPackagesReapplied,false);
assert.equal(after.history[0].creationBudgetReapplied,false);

const level20={id:'pc-20',choices:{class:{level:20}},sheet:{}};
const cap=levelUpPlan(level20,fighter,null,20);
assert.equal(cap.atCap,true);
assert.equal(cap.validTarget,false,'Level 20 não pode progredir além do limite.');

const ui=fs.readFileSync(new URL('../scripts/character-sheet-level-up-ui.js',import.meta.url),'utf8');
const rules=fs.readFileSync(new URL('../scripts/character-sheet-level-up-rules.js',import.meta.url),'utf8');
const gameplay=fs.readFileSync(new URL('../scripts/character-sheet-gameplay-ui.js',import.meta.url),'utf8');
const builderGuard=fs.readFileSync(new URL('../scripts/character-builder-level-guard.js',import.meta.url),'utf8');
const builderBridge=fs.readFileSync(new URL('../scripts/character-builder/package-b-purchase-ui.js',import.meta.url),'utf8');
for(const token of['Progressão de Level','Subir de Level','Concluir Level','data-gameplay-ignore','hub-rpg:level-up-completed'])assert.ok(ui.includes(token),`UI de progressão sem ${token}`);
for(const forbidden of['creationBudgetCp(','creationBudgetBreakdown(','WEALTH_BY_LEVEL'])assert.equal(ui.includes(forbidden),false,`Level-up não pode chamar ${forbidden}`);
for(const token of['wealthGrantedCp:0','reapplyStartingPackages:false','reapplyCreationBudget:false'])assert.ok(rules.includes(token),`Política econômica ausente: ${token}`);
assert.ok(gameplay.includes("import'./character-sheet-level-up-ui.js"),'Modo de Jogo deve carregar a progressão.');
assert.ok(gameplay.includes("closest?.('[data-gameplay-ignore]')"),'Autosave deve ignorar o rascunho de progressão.');
assert.ok(builderGuard.includes('readOnly=true'),'Construtor deve proteger Level após a primeira progressão.');
assert.ok(builderGuard.includes('Progressão de Level'),'Construtor deve orientar a usar a ficha.');
assert.ok(builderBridge.includes("import'../character-builder-level-guard.js"),'Proteção deve ser carregada no construtor.');

for(const name of['sorcerer','warlock','wizard']){
 const source=fs.readFileSync(new URL(`../scripts/character-builder/${name}-subclass-mechanics.js`,import.meta.url),'utf8');
 const pascal=name[0].toUpperCase()+name.slice(1);
 assert.ok(source.includes(`export function ${name}SubclassChoiceDefs`),`${name}: defs de subclasse ausentes.`);
 assert.ok(source.includes(`export function set${pascal}SubclassChoice`),`${name}: setter de subclasse ausente.`)
}

console.log('OK — progressão pós-criação é sequencial, transacional, preserva dano e não reaplica riqueza/pacotes.');
