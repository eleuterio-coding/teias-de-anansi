import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  ensureSpellcastingState,concentrationCompositionValid,concentrationDc,effectiveConcentrationLevel,
  activeConcentrations,activeConcentration,previewConcentration,startConcentration,endConcentration,
  failConcentrationSave,pendingConcentrationFailure,resolveConcentrationFailure,enforceConcentrationState
} from '../scripts/character-sheet-spellcasting-rules.js';
import {completeRest} from '../scripts/character-sheet-rest-rules.js';

const spell=(id)=>({id,name:id,concentration:true});
const character=()=>({sheet:{runtime:{currentHp:40,conditions:[]}}});
const start=(c,id,category,level=10)=>startConcentration(c,spell(id),'class',{strict:true,category,casterLevel:level});
const preview=(c,id,category,level=10)=>previewConcentration(c,spell(id),{category,casterLevel:level});

// A progressão explícita é a autoridade; nenhuma combinação é inferida por subconjunto.
for(const level of [1,4,5,9,10,19,20]){
 assert.equal(concentrationCompositionValid(['CM'],level),true);
 assert.equal(concentrationCompositionValid(['NC'],level),true);
 assert.equal(concentrationCompositionValid(['CM','CM'],level),false);
 assert.equal(concentrationCompositionValid(['CI','CZ'],level),false);
 assert.equal(concentrationCompositionValid(['CL','CL'],level),false);
 assert.equal(concentrationCompositionValid(['CM','CL'],level),level>=5);
 assert.equal(concentrationCompositionValid(['CI','CL'],level),level>=5);
 assert.equal(concentrationCompositionValid(['CZ','CL'],level),level>=5);
 assert.equal(concentrationCompositionValid(['CM','CL','CL'],level),level>=10);
 assert.equal(concentrationCompositionValid(['CI','CL','CL'],level),level>=10);
 assert.equal(concentrationCompositionValid(['CZ','CL','CL'],level),level>=10);
 assert.equal(concentrationCompositionValid(['CM','CI'],level),level>=20);
 assert.equal(concentrationCompositionValid(['CM','CZ'],level),level>=20);
 assert.equal(concentrationCompositionValid(['CM','CL','CI'],level),false);
 assert.equal(concentrationCompositionValid(['CM','CL','CL','CL'],level),false);
 assert.equal(concentrationCompositionValid(['CM','NC'],level),false);
}
assert.equal(concentrationDc(10),10);
assert.equal(concentrationDc(10,2),12);
assert.equal(concentrationDc(20,3),14);
assert.equal(concentrationDc(100,3),30);
assert.equal(effectiveConcentrationLevel({level:20,klass:{slug:'wizard'}}),20);
assert.equal(effectiveConcentrationLevel({level:20,klass:{slug:'paladin'}}),10);
assert.equal(effectiveConcentrationLevel({level:9,klass:{slug:'ranger'}}),5);
assert.equal(effectiveConcentrationLevel({level:20,klass:{slug:'warlock'}}),20);
assert.equal(effectiveConcentrationLevel({level:20,klass:{slug:'fighter'},spell:{slots:[]}}),1);

const c=character();
assert.equal(start(c,'hold','CM',5).ok,true);
assert.equal(start(c,'shield','CL',5).ok,true);
assert.deepEqual(activeConcentrations(c).map(x=>x.spellId),['hold','shield']);
const before=JSON.stringify(ensureSpellcastingState(c).concentrations);
const invalid=start(c,'another-major','CM',5);
assert.equal(invalid.ok,false);
assert.equal(JSON.stringify(activeConcentrations(c)),before,'Conjuração inválida não deve encerrar Concentração.');
assert.equal(preview(c,'unknown','NC',5).ok,false);
assert.equal(start(c,'shield','CL',10).ok,false,'Não reiniciar a mesma magia sem encerrar a anterior.');
assert.equal(start(c,'haste','CL',10).ok,true);
assert.equal(activeConcentrations(c).length,3);
assert.equal(start(c,'fourth','CL',20).ok,false);
assert.equal(pendingConcentrationFailure(c),null);
const failed=failConcentrationSave(c,'dano recebido');
assert.equal(failed.selectionRequired,true);
assert.equal(activeConcentrations(c).length,3);
assert.equal(start(c,'new','CM',20).ok,false,'Bloquear nova conjuração até a escolha.');
assert.equal(resolveConcentrationFailure(c,'missing').ok,false);
const resolved=resolveConcentrationFailure(c,'shield');
assert.equal(resolved.ok,true);
assert.deepEqual(activeConcentrations(c).map(x=>x.spellId),['hold','haste']);
assert.equal(pendingConcentrationFailure(c),null);
assert.equal(ensureSpellcastingState(c).concentrationHistory.at(-1).endReason,'dano recebido');
assert.equal(endConcentration(c,'manual','haste').ended.spellId,'haste');
assert.equal(activeConcentrations(c).length,1);
const single=failConcentrationSave(c);
assert.equal(single.ok,true);
assert.equal(activeConcentrations(c).length,0);
assert.equal(activeConcentration(c),null);

const pending=character();
assert.equal(start(pending,'not-validated','NC',20).ok,true);
assert.equal(start(pending,'zone','CZ',20).ok,false);
assert.equal(endConcentration(pending,'manual','not-validated').ok,true);
assert.equal(start(pending,'major','CM',20).ok,true);
assert.equal(start(pending,'summon','CI',20).ok,true);
assert.deepEqual(activeConcentrations(pending).map(x=>x.category),['CM','CI']);
assert.equal(start(pending,'zone','CZ',20).ok,false);
pending.sheet.runtime.conditions=['Atordoado'];
const broken=enforceConcentrationState(pending);
assert.equal(broken.endedAll.length,2);
assert.equal(activeConcentrations(pending).length,0);

const zero=character();start(zero,'major','CM');
zero.sheet.runtime.currentHp=0;
assert.equal(enforceConcentrationState(zero).endedAll.length,1);

const old={sheet:{spellcasting:{concentration:{spellId:'legacy',spellName:'Legado',sourceKey:'class',startedAt:'2026-01-01'}}}};
assert.equal(activeConcentration(old).spellId,'legacy');
assert.equal(activeConcentration(old).category,'NC');
assert.equal(activeConcentrations(old).length,1);
endConcentration(old,'fim');
assert.equal(activeConcentrations(old).length,0,'Legado não deve ressurgir após encerrar.');
const long=character();start(long,'a','CM',20);start(long,'b','CI',20);
const rest=completeRest(long,{kind:'long',classSlug:'wizard',level:20,maxHp:50});
assert.equal(rest.ok,true);
assert.equal(activeConcentrations(long).length,0,'Descanso Longo encerra todas as Concentrações.');

const sheetUi=fs.readFileSync(new URL('../scripts/character-sheet-spellcasting-ui.js',import.meta.url),'utf8');
const resolutionUi=fs.readFileSync(new URL('../scripts/character-sheet-resolution-ui.js',import.meta.url),'utf8');
const unified=fs.readFileSync(new URL('../scripts/character-sheet-unified-spells.js',import.meta.url),'utf8');
assert.ok(sheetUi.includes('previewConcentration')&&sheetUi.includes('data-concentration-resolve'));
assert.ok(sheetUi.includes('data-new-cast],[data-free-spell-use],[data-arcanum-use]'));
assert.ok(sheetUi.includes('if(registered)startCE('));
assert.ok(unified.includes('data-ce-manual-start'));
assert.ok(resolutionUi.includes('concentrationDc(result.effective,concentrations.length)'));
assert.ok(resolutionUi.includes('failConcentrationSave(state.c'));
console.log('Concentração Expandida operacional: regras, persistência, limites, testes e integrações aprovados.');
