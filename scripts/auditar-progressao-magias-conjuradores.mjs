import{readFileSync,writeFileSync,mkdtempSync,rmSync}from'node:fs';
import{tmpdir}from'node:os';
import{join,resolve}from'node:path';
import{pathToFileURL}from'node:url';

const ROOT=resolve(new URL('..',import.meta.url).pathname),assert=(ok,msg)=>{if(!ok)throw new Error(msg)},num=v=>Number(v)||0;
const stateSource=readFileSync(join(ROOT,'scripts/character-builder/state.js'),'utf8');
const policySource=readFileSync(join(ROOT,'scripts/character-builder/spell-class-policy.js'),'utf8');
const progressionSource=readFileSync(join(ROOT,'scripts/character-builder/spell-progression-rules.js'),'utf8');
const pin=(stateSource.match(/PIN='([^']+)'/)||[])[1];assert(pin,'PIN da fonte SRD não encontrado.');
const temp=mkdtempSync(join(tmpdir(),'hub-spell-audit-'));
try{
 writeFileSync(join(temp,'state.mjs'),stateSource);
 writeFileSync(join(temp,'policy.mjs'),policySource);
 writeFileSync(join(temp,'progression.mjs'),progressionSource.replace("'./state.js'","'./state.mjs'").replace(/'\.\/spell-class-policy\.js\?v=[^']+'/,"'./policy.mjs'"));
 const{state}=await import(pathToFileURL(join(temp,'state.mjs')));
 const policy=await import(pathToFileURL(join(temp,'policy.mjs')));
 const progression=await import(pathToFileURL(join(temp,'progression.mjs')));

 const url=`https://raw.githubusercontent.com/5e-bits/5e-database/${pin}/src/2024/en/5e-SRD-Levels.json`;
 const response=await fetch(url);assert(response.ok,`Não foi possível conferir a progressão SRD 5.2.1: HTTP ${response.status}`);const rows=await response.json();
 const PT={bard:'Bardo',cleric:'Clérigo',druid:'Druida',paladin:'Paladino',ranger:'Patrulheiro',sorcerer:'Feiticeiro',warlock:'Bruxo',wizard:'Mago',artificer:'Artífice'};
 const AB={bard:'Carisma',cleric:'Sabedoria',druid:'Sabedoria',paladin:'Carisma',ranger:'Sabedoria',sorcerer:'Carisma',warlock:'Carisma',wizard:'Inteligência',artificer:'Inteligência'};
 const coreSlugs=['bard','cleric','druid','paladin','ranger','sorcerer','warlock','wizard'],classes={};
 for(const slug of coreSlugs){const levels=rows.filter(row=>row?.class?.index===slug&&!row?.subclass).sort((a,b)=>num(a.level)-num(b.level));assert(levels.length===20,`${PT[slug]}: progressão principal incompleta (${levels.length}/20).`);classes[slug]={id:`audit:${slug}`,slug,name:PT[slug],spellAbility:AB[slug],levels}}
 const art=JSON.parse(readFileSync(join(ROOT,'dados/artificer-2025.json'),'utf8')).classe;const artLevels=(art.progressao||[]).map(row=>({level:num(row.nivel),spellcasting:{cantrips_known:num(row.cantrips),prepared_spells:num(row.magias_preparadas),...Object.fromEntries((row.slots||[]).map((v,i)=>[`spell_slots_level_${i+1}`,num(v)]))}}));assert(artLevels.length===20,'Artífice: progressão 2025 incompleta.');classes.artificer={id:'audit:artificer',slug:'artificer',name:'Artífice',spellAbility:'Inteligência',levels:artLevels};

 const expectedPolicy={
  bard:['level-progression','level-progression','level-up-one','level-up-one','level-up-one'],
  sorcerer:['level-progression','level-progression','level-up-one','level-up-one','level-up-one'],
  warlock:['level-progression','level-progression','level-up-one','level-up-one','level-up-one'],
  cleric:['current-list','level-progression','none','level-up-one','long-rest-all'],
  druid:['current-list','level-progression','none','level-up-one','long-rest-all'],
  paladin:['current-list','none','none','none','long-rest-one'],
  ranger:['current-list','none','none','none','long-rest-one'],
  wizard:['spellbook-progression','current-list','none','long-rest-one','long-rest-all'],
  artificer:['current-list','current-list','none','long-rest-one','long-rest-all']
 };
 for(const[slug,expected]of Object.entries(expectedPolicy)){const p=policy.spellClassPolicy(classes[slug]),actual=[p.leveledMode,p.cantripMode,p.spellChange,p.cantripChange,p.preparedChange];assert(JSON.stringify(actual)===JSON.stringify(expected),`${PT[slug]}: política de conjuração incorreta: ${actual.join(' / ')}`)}

 function rawSpell(row){return row?.spellcasting||row?.class_specific?.spellcasting||{}}
 for(const slug of coreSlugs){
  const k=classes[slug],prepared=[],cantrips=[],max=[];
  for(let level=1;level<=20;level++){
   const raw=rawSpell(k.levels[level-1]),p=progression.classSpellData(k,level),expectedPrepared=num(raw.spells_prepared??raw.prepared_spells??raw.magias_preparadas??raw.spells_known),expectedCantrips=num(raw.cantrips_known??raw.cantrips),expectedSlots=[];
   for(let circle=1;circle<=9;circle++){const count=num(raw[`spell_slots_level_${circle}`]);if(count)expectedSlots.push({level:circle,count})}
   const expectedMax=expectedSlots.length?Math.max(...expectedSlots.map(x=>x.level)):0;
   assert(p.prepared===expectedPrepared,`${PT[slug]} nível ${level}: total preparado divergiu da tabela.`);assert(p.cantrips===expectedCantrips,`${PT[slug]} nível ${level}: truques divergiram da tabela.`);assert(JSON.stringify(p.slots)===JSON.stringify(expectedSlots),`${PT[slug]} nível ${level}: espaços divergiram da tabela.`);assert(p.maxLevel===expectedMax,`${PT[slug]} nível ${level}: círculo máximo incorreto.`);
   prepared.push(p.prepared);cantrips.push(p.cantrips);max.push(p.maxLevel)
  }
  console.log(`${PT[slug]} 1–20 | preparadas: ${prepared.join(',')} | truques: ${cantrips.join(',')} | círculo máx.: ${max.join(',')}`)
 }
 for(let level=1;level<=20;level++){const p=progression.classSpellData(classes.artificer,level),row=artLevels[level-1].spellcasting,slots=[];for(let circle=1;circle<=5;circle++){const count=num(row[`spell_slots_level_${circle}`]);if(count)slots.push({level:circle,count})}assert(p.prepared===num(row.prepared_spells),`Artífice nível ${level}: preparadas incorretas.`);assert(p.cantrips===num(row.cantrips_known),`Artífice nível ${level}: truques incorretos.`);assert(JSON.stringify(p.slots)===JSON.stringify(slots),`Artífice nível ${level}: espaços incorretos.`)}

 const synthetic=[];for(const[slug,k]of Object.entries(classes)){for(let circle=0;circle<=9;circle++)for(let i=1;i<=30;i++)synthetic.push({id:`${slug}:${circle}:${i}`,name:`${PT[slug]} ${circle}-${i}`,level:circle,classes:[PT[slug]],school:'Audit'})}state.catalogs={classes:Object.values(classes),spells:synthetic,species:[],backgrounds:[],subclasses:[],feats:[],armors:[],weapons:[]};
 const spells=(slug,circle)=>synthetic.filter(s=>s.id.startsWith(`${slug}:${circle}:`));
 function reset(k,level){state.c={refs:{class:k.id},choices:{class:{level,skills:[]},spells:{cantrips:[],leveled:[],arcanum:{},progression:null}}}}
 function fillCantripGains(k,target,store){let i=0;for(const step of progression.spellProgressionSteps(k,target)){store[String(step.level)].cantrips=spells(k.slug,0).slice(i,i+step.cantripGain).map(s=>s.id);i+=step.cantripGain}}
 function simulateLevel3Swap(slug,expectedSecondCircle){
  const k=classes[slug],defs=progression.spellProgressionSteps(k,3);assert(defs[2].maxSpellLevel===2,`${PT[slug]} nível 3 deveria liberar o 2º círculo.`);assert(defs[2].leveledGain>0,`${PT[slug]} nível 3 deveria ganhar ao menos uma magia.`);reset(k,3);progression.spellProgressionState(k,3);const store=state.c.choices.spells.progression.steps;fillCantripGains(k,3,store);let firstIndex=0,secondIndex=0,oldForSwap=null;
  for(const step of defs){const key=String(step.level);if(step.level<3){store[key].leveled=spells(slug,1).slice(firstIndex,firstIndex+step.leveledGain).map(s=>s.id);if(!oldForSwap&&store[key].leveled.length)oldForSwap=store[key].leveled[0];firstIndex+=step.leveledGain}else{store[key].leveled=spells(slug,2).slice(secondIndex,secondIndex+step.leveledGain).map(s=>s.id);secondIndex+=step.leveledGain}}
  const replacement=spells(slug,2)[secondIndex].id;store['3'].spellChange={decision:'replace',out:oldForSwap,in:replacement};const result=progression.spellProgressionState(k,3),objects=result.leveled.map(id=>synthetic.find(s=>s.id===id)),level2=objects.filter(s=>s.level===2).length,table=progression.classSpellData(k,3);
  assert(result.complete,`${PT[slug]} nível 3: progressão com substituição deveria ser válida.`);assert(result.leveled.length===table.prepared,`${PT[slug]} nível 3: total final não respeita a tabela.`);assert(level2===expectedSecondCircle,`${PT[slug]} nível 3: esperado ${expectedSecondCircle} magia(s) de 2º círculo após substituição, obtido ${level2}.`);return result
 }
 const bard3=simulateLevel3Swap('bard',2);assert(bard3.leveled.map(id=>synthetic.find(s=>s.id===id)).filter(s=>s.level===1).length===4,'Bardo nível 3 deve aceitar 4 magias de 1º + 2 de 2º após a troca.');
 const sorcGain=progression.spellProgressionSteps(classes.sorcerer,3)[2].leveledGain;simulateLevel3Swap('sorcerer',sorcGain+1);
 const warlockGain=progression.spellProgressionSteps(classes.warlock,3)[2].leveledGain;simulateLevel3Swap('warlock',warlockGain+1);

 for(const[slug,testLevel]of [['cleric',3],['druid',3],['paladin',5],['ranger',5],['artificer',5]]){
  const k=classes[slug],p=progression.classSpellData(k,testLevel);assert(p.maxLevel>=2,`${PT[slug]}: nível de teste deveria ter 2º círculo.`);reset(k,testLevel);state.c.choices.spells.leveled=spells(slug,p.maxLevel).slice(0,p.prepared).map(s=>s.id);if(policy.usesCurrentCantripList(k))state.c.choices.spells.cantrips=spells(slug,0).slice(0,p.cantrips).map(s=>s.id);const current=progression.spellCurrentListState(k,testLevel);assert(current.leveled?.missing===0,`${PT[slug]}: lista atual deveria aceitar qualquer distribuição entre círculos acessíveis.`);assert(current.leveled.selected.length===p.prepared,`${PT[slug]}: total preparado atual incorreto.`)
 }

 const wizardSteps=progression.spellProgressionSteps(classes.wizard,20);assert(wizardSteps[0].leveledGain===6,'Mago nível 1 deve adicionar 6 magias ao grimório.');assert(wizardSteps.slice(1).every(x=>x.leveledGain===2),'Mago deve adicionar 2 magias ao grimório a cada nível após o 1º.');assert(wizardSteps.every(x=>!x.spellSwap),'Mago não usa substituição de magia do grimório ao subir de nível.');
 const arcanumExpected={11:6,13:7,15:8,17:9};for(const step of progression.spellProgressionSteps(classes.warlock,20)){assert(step.arcanumLevel===num(arcanumExpected[step.level]),`Bruxo nível ${step.level}: ganho de Arcano Místico incorreto.`);assert(step.arcanumSwap===(step.level>11),`Bruxo nível ${step.level}: disponibilidade de troca de Arcano incorreta.`)}
 const clericForeign=spells('cleric',1)[0],druidForeign=spells('druid',1)[0],wizardForeign=spells('wizard',1)[0],sorcererForeign=spells('sorcerer',1)[0];assert(!progression.spellProgressionCandidates(classes.bard,9,{kind:'leveled'}).some(s=>s.id===clericForeign.id),'Bardo antes do nível 10 não deve usar Segredos Mágicos.');const secrets=new Set(progression.spellProgressionCandidates(classes.bard,10,{kind:'leveled'}).map(s=>s.id));assert(secrets.has(clericForeign.id)&&secrets.has(druidForeign.id)&&secrets.has(wizardForeign.id),'Bardo nível 10+ deve acessar Bardo/Clérigo/Druida/Mago por Segredos Mágicos.');assert(!secrets.has(sorcererForeign.id),'Segredos Mágicos do Bardo não deve incluir lista de Feiticeiro.');

 const docs={bard:JSON.parse(readFileSync(join(ROOT,'dados/classes-ptbr/bardo.json'),'utf8')).features['bard-spellcasting'].descricao,cleric:JSON.parse(readFileSync(join(ROOT,'dados/classes-ptbr/clerigo.json'),'utf8')).features['cleric-spellcasting'].descricao,druid:JSON.parse(readFileSync(join(ROOT,'dados/classes-ptbr/druida.json'),'utf8')).features['druid-spellcasting'].descricao,wizard:JSON.parse(readFileSync(join(ROOT,'dados/classes-ptbr/mago.json'),'utf8')).features['wizard-spellcasting'].descricao};assert(/ganhar um nível de Bardo/.test(docs.bard),'Texto do Bardo ainda não registra troca no ganho de nível.');assert(/ganhar um nível de Clérigo/.test(docs.cleric),'Texto do Clérigo ainda não registra troca de truque por nível.');assert(/ganhar um nível de Druida/.test(docs.druid),'Texto do Druida ainda não registra troca de truque por nível.');assert(/Descanso Longo.*substituir um Truque/.test(docs.wizard),'Texto do Mago ainda não registra troca de truque no Descanso Longo.');
 console.log('OK: progressão de magia 1–20 auditada para Bardo, Clérigo, Druida, Paladino, Patrulheiro, Feiticeiro, Bruxo, Mago e Artífice.');console.log('OK: regressão Bardo 3 validada em 4 magias de 1º círculo + 2 magias de 2º círculo.');
}finally{rmSync(temp,{recursive:true,force:true})}
