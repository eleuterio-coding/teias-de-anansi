import assert from'node:assert/strict';
import fs from'node:fs';
import{state}from'../scripts/character-builder/state.js';
import{applyCampaignInventoryRows,applyInventoryTransaction}from'../scripts/character-sheet-inventory-rules.js';
import{
 weaponPropertyProfile,weaponMasteryLimit,setMasteryChoices,setOffhandWeapon,setMounted,setWeaponGrip,setWeaponAttackMode,weaponCombatProfile,attacksPerAttackAction,lightWeaponExtraAttack,startNewTurn,grantExtraAction,registerWeaponAttack
}from'../scripts/character-sheet-combat-rules.js';
import{automaticResourceDefinitions,syncAutomaticResources,resourceRows,spendResource,restoreResource,addCustomResource}from'../scripts/character-sheet-resource-rules.js';

const fighter={id:'fighter',slug:'fighter',name:'Guerreiro',proficiencies:['Armas marciais','Armas simples'],proficienciesRaw:['Martial Weapons','Simple Weapons'],features:[],hitDie:10};
const wizard={id:'wizard',slug:'wizard',name:'Mago',proficiencies:['Armas simples'],proficienciesRaw:['Simple Weapons'],features:[],hitDie:6};
const rogue={id:'rogue',slug:'rogue',name:'Ladino',proficiencies:['Armas simples','Armas marciais com a propriedade Acuidade ou Leve'],proficienciesRaw:['Simple Weapons','Martial Weapons with the Finesse or Light property'],features:[],hitDie:8};
const longsword={id:'longsword',nome:'Espada Longa',categoria:'Marcial corpo a corpo',dano:'1d8 cortante',propriedades:['Versatile (1d10)'],maestria:'Sap'};
const greatsword={id:'greatsword',nome:'Espada Grande',categoria:'Marcial corpo a corpo',dano:'2d6 cortante',propriedades:['Heavy','Two-Handed'],maestria:'Graze'};
const lance={id:'lance',nome:'Lança de Cavalaria',categoria:'Marcial corpo a corpo',dano:'1d10 perfurante',propriedades:['Heavy','Reach','Two-Handed (unless mounted)'],maestria:'Topple'};
const battleaxe={id:'battleaxe',nome:'Machado de Batalha',categoria:'Marcial corpo a corpo',dano:'1d8 cortante',propriedades:['Versatile (1d10)'],maestria:'Topple'};
const spear={id:'spear',nome:'Lança',categoria:'Simples corpo a corpo',dano:'1d6 perfurante',propriedades:['Thrown (20/60 ft.)','Versatile (1d8)'],maestria:'Sap'};
const dart={id:'dart',nome:'Dardo',categoria:'Simples à distância',dano:'1d4 perfurante',propriedades:['Finesse','Thrown (20/60 ft.)'],maestria:'Vex'};
const glaive={id:'glaive',nome:'Glaive',categoria:'Marcial corpo a corpo',dano:'1d10 cortante',propriedades:['Heavy','Reach','Two-Handed'],maestria:'Graze'};
const longbow={id:'longbow',nome:'Arco Longo',categoria:'Marcial à distância',dano:'1d8 perfurante',propriedades:['Ammunition (150/600 ft.; Arrow)','Heavy','Two-Handed'],maestria:'Slow'};
const handCrossbow={id:'hand-crossbow',nome:'Besta de Mão',categoria:'Marcial à distância',dano:'1d6 perfurante',propriedades:['Ammunition (30/120 ft.; Bolt)','Light','Loading'],maestria:'Vex'};
const shortsword={id:'shortsword',nome:'Espada Curta',categoria:'Marcial corpo a corpo',dano:'1d6 perfurante',propriedades:['Finesse','Light'],maestria:'Vex'};
const scimitar={id:'scimitar',nome:'Cimitarra',categoria:'Marcial corpo a corpo',dano:'1d6 cortante',propriedades:['Finesse','Light'],maestria:'Nick'};
const weapons=[longsword,greatsword,lance,battleaxe,spear,dart,glaive,longbow,handCrossbow,shortsword,scimitar];
state.catalogs.classes=[fighter,wizard,rogue];state.catalogs.species=[];state.catalogs.backgrounds=[];state.catalogs.subclasses=[];state.catalogs.feats=[];state.catalogs.armors=[];state.catalogs.weapons=weapons;state.catalogs.spells=[];
function character(level=5){return{id:'pc-combat',refs:{class:'fighter',species:null,background:null,subclass:null},baseAbilities:{Força:16,Destreza:14,Constituição:14,Inteligência:10,Sabedoria:10,Carisma:10},choices:{class:{level,skills:[],equipment:'A'},species:{},background:{},feats:{},featMechanics:{},equipment:{weapon:'longsword',armor:null,shield:false},spells:{cantrips:[],leveled:[],arcanum:{}}},sheet:{runtime:{conditions:[],exhaustion:0},inventory:{}}}}
function derived(c,klass=fighter){return{klass,level:c.choices.class.level,scores:{...c.baseAbilities},pbonus:3,classFeatures:[]}}
const c=character();state.c=c;
const rows=[{kind:'weapon',refId:'longsword',name:'Espada Longa',qty:1,data:longsword},{kind:'weapon',refId:'shortsword',name:'Espada Curta',qty:1,data:shortsword},{kind:'weapon',refId:'scimitar',name:'Cimitarra',qty:1,data:scimitar},{kind:'belonging',refId:null,name:'Arrow',qty:20},{kind:'belonging',refId:null,name:'Bolt',qty:10}];

const lp=weaponPropertyProfile(longsword);assert.equal(lp.versatile,true);assert.equal(lp.baseDamage,'1d8');assert.equal(lp.versatileDamage,'1d10');
let p=weaponCombatProfile(derived(c),longsword,c,rows);assert.equal(p.damage,'1d8','Espada Longa começa em 1 mão com 1d8.');
setWeaponGrip(c,'longsword','two');p=weaponCombatProfile(derived(c),longsword,c,rows);assert.equal(p.damage,'1d10','Espada Longa em 2 mãos usa 1d10 sem duplicar item.');
c.choices.equipment.shield=true;p=weaponCombatProfile(derived(c),longsword,c,rows);assert.equal(p.hand.grip,'one');assert.equal(p.damage,'1d8','Escudo força arma Versátil de volta para 1 mão.');
let great=weaponCombatProfile(derived(c),greatsword,c,rows);assert.equal(great.available,false);assert.ok(great.unavailable.some(x=>/duas mãos/i.test(x)),'Arma de Duas Mãos deve ser bloqueada com escudo.');
c.choices.equipment.shield=false;
setOffhandWeapon(c,'shortsword');great=weaponCombatProfile(derived(c),greatsword,c,rows);assert.equal(great.available,false,'Arma na mão secundária bloqueia arma de Duas Mãos.');
setOffhandWeapon(c,null);
setMounted(c,true);c.choices.equipment.shield=true;const mountedLance=weaponCombatProfile(derived(c),lance,c,rows);assert.equal(mountedLance.available,true,'Lança de Cavalaria montado ignora a exigência de Duas Mãos.');assert.equal(mountedLance.reach,10);
c.choices.equipment.shield=false;setMounted(c,false);

const lowStr=character();lowStr.baseAbilities.Força=12;state.c=lowStr;const heavyMelee=weaponCombatProfile(derived(lowStr),greatsword,lowStr,rows);assert.equal(heavyMelee.heavyDisadvantage,true,'Heavy corpo a corpo exige Força 13.');lowStr.baseAbilities.Força=13;assert.equal(weaponCombatProfile(derived(lowStr),greatsword,lowStr,rows).heavyDisadvantage,false);
const lowDex=character();lowDex.baseAbilities.Destreza=12;state.c=lowDex;const heavyRanged=weaponCombatProfile(derived(lowDex),longbow,lowDex,rows);assert.equal(heavyRanged.heavyDisadvantage,true,'Heavy à distância exige Destreza 13.');assert.equal(heavyRanged.ammo.count,20);assert.deepEqual(heavyRanged.range,{normal:150,long:600});
const finesse=character();finesse.baseAbilities.Força=16;finesse.baseAbilities.Destreza=12;state.c=finesse;const dartProfile=weaponCombatProfile(derived(finesse),dart,finesse,rows);assert.equal(dartProfile.ability,'Força','Acuidade deve permitir Força mesmo em arma à distância quando for melhor.');
state.c=c;setWeaponAttackMode(c,'spear','thrown');const thrown=weaponCombatProfile(derived(c),spear,c,rows);assert.equal(thrown.mode,'thrown');assert.deepEqual(thrown.range,{normal:20,long:60});assert.equal(weaponCombatProfile(derived(c),glaive,c,rows).reach,10,'Reach deve produzir alcance corpo a corpo de 10 ft.');

setOffhandWeapon(c,'shortsword');const crossBlocked=weaponCombatProfile(derived(c),handCrossbow,c,rows);assert.equal(crossBlocked.ammoHandBlocked,true,'Arma de munição de uma mão precisa de mão livre para carregar.');setOffhandWeapon(c,null);
startNewTurn(c);const cross=weaponCombatProfile(derived(c),handCrossbow,c,rows);let shot=registerWeaponAttack(c,cross,{kind:'action',attackLimit:2});assert.equal(shot.ok,true);shot=registerWeaponAttack(c,cross,{kind:'action',attackLimit:2});assert.equal(shot.ok,false,'Loading bloqueia o segundo disparo na mesma Ação.');grantExtraAction(c);shot=registerWeaponAttack(c,cross,{kind:'action',attackLimit:2});assert.equal(shot.ok,true,'Loading permite novo disparo em uma Ação adicional distinta.');

const dual=character();dual.choices.equipment.weapon='shortsword';state.c=dual;setOffhandWeapon(dual,'scimitar');let main=weaponCombatProfile(derived(dual),shortsword,dual,rows,'main'),off=weaponCombatProfile(derived(dual),scimitar,dual,rows,'offhand');let light=lightWeaponExtraAttack(main,off);assert.equal(light.available,true);assert.equal(light.actionCost,'bonus');assert.equal(light.damageModifier,'+0');startNewTurn(dual);assert.equal(registerWeaponAttack(dual,main,{kind:'action',attackLimit:2}).ok,true);assert.equal(registerWeaponAttack(dual,off,{kind:'bonus',attackLimit:2,lightExtra:true}).ok,true);assert.equal(dual.sheet.combat.turn.bonusUsed,true);
setMasteryChoices(dual,fighter,weapons,5,['scimitar']);off=weaponCombatProfile(derived(dual),scimitar,dual,rows,'offhand');light=lightWeaponExtraAttack(main,off);assert.equal(off.mastered,true);assert.equal(light.nick,true);assert.equal(light.actionCost,'action','Nick move o ataque extra Leve para a ação Atacar.');

assert.equal(weaponMasteryLimit({slug:'barbarian'},1),2);assert.equal(weaponMasteryLimit({slug:'barbarian'},4),3);assert.equal(weaponMasteryLimit({slug:'barbarian'},10),4);assert.equal(weaponMasteryLimit(fighter,1),3);assert.equal(weaponMasteryLimit(fighter,4),4);assert.equal(weaponMasteryLimit(fighter,10),5);assert.equal(weaponMasteryLimit(fighter,16),6);assert.equal(weaponMasteryLimit(rogue,5),2);assert.equal(weaponMasteryLimit(wizard,5),0);
const toppleChar=character();state.c=toppleChar;setMasteryChoices(toppleChar,fighter,weapons,5,['battleaxe']);const topple=weaponCombatProfile(derived(toppleChar),battleaxe,toppleChar,rows);assert.equal(topple.mastered,true);assert.equal(topple.toppleDc,14,'Topple usa CD 8 + modificador do ataque + PB.');
const tired=character();tired.sheet.runtime.exhaustion=2;state.c=tired;const tiredAttack=weaponCombatProfile(derived(tired),longsword,tired,rows);assert.equal(tiredAttack.exhaustionPenalty,-4);assert.equal(tiredAttack.attack,tiredAttack.baseAttack-4,'Exaustão 5.5e deve afetar o Teste de d20 do ataque.');
const stunned=character();stunned.sheet.runtime.conditions=['Atordoado'];state.c=stunned;assert.equal(weaponCombatProfile(derived(stunned),longsword,stunned,rows).available,false,'Condição incapacitante deve bloquear ataque.');

const ammoChar=character();ammoChar.sheet.inventoryCampaign=undefined;const ammoBase=[{kind:'belonging',name:'Arrow',qty:2,source:'Pacote inicial'}];let consumed=applyInventoryTransaction(ammoChar,ammoBase,{movement:'consume',item:ammoBase[0],qty:1});assert.equal(consumed.ok,true);assert.equal(applyCampaignInventoryRows(ammoBase,ammoChar)[0].qty,1,'Ataque com munição pode consumir uma unidade sem alterar saldo.');

let defs=automaticResourceDefinitions(fighter,1,{Carisma:10});assert.equal(defs.find(x=>x.id==='fighter-second-wind')?.max,2);assert.equal(defs.some(x=>x.id==='fighter-action-surge'),false);defs=automaticResourceDefinitions(fighter,17,{Carisma:10});assert.equal(defs.find(x=>x.id==='fighter-second-wind')?.max,4);assert.equal(defs.find(x=>x.id==='fighter-action-surge')?.max,2);assert.equal(defs.find(x=>x.id==='fighter-indomitable')?.max,3);
assert.equal(automaticResourceDefinitions({slug:'monk'},7,{}).find(x=>x.id==='monk-focus')?.max,7);assert.equal(automaticResourceDefinitions({slug:'paladin'},6,{}).find(x=>x.id==='paladin-lay-on-hands')?.max,30);assert.equal(automaticResourceDefinitions({slug:'ranger'},17,{}).find(x=>x.id==='ranger-favored-enemy')?.max,6);assert.equal(automaticResourceDefinitions({slug:'sorcerer'},9,{}).find(x=>x.id==='sorcerer-points')?.max,9);assert.equal(automaticResourceDefinitions(wizard,5,{},[{label:'Pontos de Sorte',max:3}]).find(x=>x.id==='feat-pontos-de-sorte')?.max,3);
const resChar=character(3);syncAutomaticResources(resChar,fighter,3,resChar.baseAbilities);let second=resourceRows(resChar).find(x=>x.id==='fighter-second-wind');spendResource(resChar,second.id,1);syncAutomaticResources(resChar,fighter,4,resChar.baseAbilities);second=resourceRows(resChar).find(x=>x.id==='fighter-second-wind');assert.equal(second.max,3);assert.equal(second.current,2,'Aumentar o máximo por Level preserva a quantidade já gasta.');restoreResource(resChar,second.id,1);assert.equal(second.current,3);
const custom=addCustomResource(resChar,{name:'Dados de Superioridade',max:4,unit:'dado',reset:'short-long'});assert.equal(custom.ok,true);assert.equal(custom.row.current,4);assert.equal(spendResource(resChar,custom.row.id,2).row.current,2);

const ui=fs.readFileSync(new URL('../scripts/character-sheet-combat-ui.js',import.meta.url),'utf8');const rules=fs.readFileSync(new URL('../scripts/character-sheet-combat-rules.js',import.meta.url),'utf8');const resources=fs.readFileSync(new URL('../scripts/character-sheet-resource-rules.js',import.meta.url),'utf8');const equipment=fs.readFileSync(new URL('../scripts/character-sheet-equipment-ownership.js',import.meta.url),'utf8');
for(const token of['Empunhadura','Mão principal','Mão secundária','Maestrias','Novo turno','Nova rodada','Recursos mecânicos','Ataque extra Leve','Weapon Master'])assert.ok(ui.includes(token),`UI de combate sem ${token}`);
for(const token of['Versatile','Loading','Heavy','Ammunition','lightWeaponExtraAttack','registerWeaponAttack'])assert.ok(rules.includes(token),`Motor sem evidência de ${token}`);
for(const token of['Fúria','Segundo Fôlego','Surto de Ação','Pontos de Foco','Imposição das Mãos','Pontos de Feitiçaria'])assert.ok(resources.includes(token),`Recursos sem ${token}`);
assert.ok(equipment.includes("import('./character-sheet-combat-ui.js"),'Combate mecânico deve carregar depois do render legado.');
assert.equal([ui,rules,resources].join('\n').toLowerCase().includes('supabase'),false);
console.log('OK — combate interpreta mãos, propriedades, munição, Loading, Maestria, ações e recursos persistentes.');
