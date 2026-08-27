import{state,arr,num,fold,uniq,mod}from'./state.js';

export const MONK_SUBCLASS_NAMES=['Warrior of Mercy','Warrior of Shadow','Warrior of the Elements','Warrior of the Open Hand','Way of the Astral Self','Way of the Drunken Master','Way of the Kensei','Way of the Sun Soul','Way of the Artisan'];
const KNOWN=new Set(MONK_SUBCLASS_NAMES.map(fold));
const ARTISAN_TOOLS=["Alchemist's Supplies","Brewer's Supplies","Calligrapher's Supplies","Carpenter's Tools","Cartographer's Tools","Cobbler's Tools","Cook's Utensils","Glassblower's Tools","Jeweler's Tools","Leatherworker's Tools","Mason's Tools","Painter's Supplies","Potter's Tools","Smith's Tools","Tinker's Tools","Weaver's Tools","Woodcarver's Tools"];
const ELEMENT_TYPES=['Ácido','Frio','Fogo','Elétrico','Trovejante'];
const keyPart=v=>fold(v).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const canonical=d=>d?.sub?.mechanics?.name||d?.sub?.name||'';
const isMonk=d=>d?.klass?.slug==='monk'&&d?.sub&&KNOWN.has(fold(canonical(d)));
const martialArtsDie=l=>l>=17?'d12':l>=11?'d10':l>=5?'d8':'d6';
const dieStepUp=d=>({d4:'d6',d6:'d8',d8:'d10',d10:'d12',d12:'d12'}[d]||d);
const choiceDef=(id,level,label,options,frequency,required=false,note='',kind='select',choose=1)=>({id,level,label,options,frequency,required,note,kind,choose});
function store(d){state.c.choices=state.c.choices||{};state.c.choices.subclassMechanics=state.c.choices.subclassMechanics||{};const k=keyPart(canonical(d));return state.c.choices.subclassMechanics[k]||(state.c.choices.subclassMechanics[k]={})}
function spellByName(name){return state.catalogs?.spells?.find(s=>fold(s.name)===fold(name)||fold(s.originalName)===fold(name))||null}
function weaponOptions(mode){return arr(state.catalogs?.weapons).filter(w=>{const cat=fold(w.categoria),props=arr(w.propriedades).map(fold),isMelee=/corpo a corpo/.test(cat),isRanged=/distancia/.test(cat),heavy=props.some(p=>p==='heavy'),special=props.some(p=>p.startsWith('special'));if(special)return false;if(mode==='melee')return isMelee&&!heavy;if(mode==='ranged')return isRanged&&(!heavy||fold(w.nome_original)==='longbow');return false}).map(w=>({value:w.id,label:`${w.nome} · ${w.dano}`}))}
function optionValue(options,v){return arr(options).map(x=>typeof x==='string'?x:x.value).includes(v)}
export function monkSubclassChoiceDefs(d){
 if(!isMonk(d))return[];const name=canonical(d),l=num(d.level),defs=[],add=(id,level,label,options,frequency,required=false,note='',kind='select',choose=1)=>{if(l>=level)defs.push(choiceDef(id,level,label,options,frequency,required,note,kind,choose))};
 if(name==='Warrior of the Elements'&&l>=17)add('elementalResistance',17,'Resistência elemental atual',ELEMENT_TYPES,'início de cada turno',false,'Estado atual/preferido; pode ser trocado no início de cada turno.');
 else if(name==='Way of the Kensei'){add('kenseiMelee',3,'Arma Kensei corpo a corpo',weaponOptions('melee'),'ao escolher a subclasse',true);add('kenseiRanged',3,'Arma Kensei à distância',weaponOptions('ranged'),'ao escolher a subclasse',true);add('brushTool',3,'Way of the Brush',["Calligrapher's Supplies","Painter's Supplies"],'ao escolher a subclasse',true)}
 else if(name==='Way of the Artisan')add('artisanTools',3,'Ferramentas de artesão',ARTISAN_TOOLS,'ao escolher a subclasse',true,'Escolha dois tipos diferentes.','multi',2);
 return defs
}
export function sanitizeMonkSubclassChoices(d){if(!isMonk(d))return{values:{},pending:[]};const s=store(d),defs=monkSubclassChoiceDefs(d),allowed=new Map(defs.map(x=>[x.id,x])),clean={};for(const[id,v]of Object.entries(s)){const def=allowed.get(id);if(!def)continue;if(def.kind==='multi'){const vals=uniq(arr(v).filter(x=>optionValue(def.options,x))).slice(0,def.choose);if(vals.length)clean[id]=vals}else if(optionValue(def.options,v))clean[id]=v}state.c.choices.subclassMechanics[keyPart(canonical(d))]=clean;const pending=defs.filter(def=>def.required&&(def.kind==='multi'?arr(clean[def.id]).length<def.choose:!clean[def.id]));return{values:clean,pending}}
export function setMonkSubclassChoice(d,id,value){if(!isMonk(d))return;const def=monkSubclassChoiceDefs(d).find(x=>x.id===id),s=store(d);if(!def)return;if(def.kind==='multi'){const vals=uniq(arr(value).filter(x=>optionValue(def.options,x))).slice(0,def.choose);if(vals.length)s[id]=vals;else delete s[id]}else if(optionValue(def.options,value))s[id]=value;else delete s[id]}
export function monkSubclassOutcome(d){
 if(!isMonk(d))return null;const name=canonical(d),l=num(d.level),pbonus=num(d.pbonus),dex=mod(d.scores?.Destreza),wis=mod(d.scores?.Sabedoria),ma=martialArtsDie(l),focusDC=8+pbonus+wis,{values,pending}=sanitizeMonkSubclassChoices(d),features=arr(d.sub?.features).filter(f=>num(f.level)<=l),summary=[],resources=[],defenses=[],attacks=[],skills=[],tools=[],weaponTraining=[],bonusCantrips=[],movementModes={},senses=[],resistances=[],focusTechniques=[];
 const add=(n,value,scope='')=>summary.push({name:n,value,scope}),resource=(n,uses,recovery,detail='')=>resources.push({name:n,uses,recovery,detail}),defense=(n,value,scope='')=>defenses.push({name:n,value,scope}),attack=(n,attackBonus,damage,extra='')=>attacks.push({name:n,attackBonus,damage,extra}),technique=(n,cost,effect,action='')=>focusTechniques.push({name:n,cost,effect,action});
 add('Dado de Artes Marciais',ma);add('CD de Foco',focusDC);resource('Pontos de Foco',l,'Descanso Curto ou Longo','Recurso-base do Monge; as técnicas da subclasse gastam esta mesma reserva.');
 if(name==='Warrior of Mercy'){
  skills.push('Intuição','Medicina');tools.push('Kit de Herbalismo');technique('Hand of Healing',1,`cura ${ma} + ${wis} PV; durante Flurry of Blows pode substituir um golpe sem custo adicional além do Flurry`,'Ação Mágica');technique('Hand of Harm',1,`1/turno após Ataque Desarmado: +${ma} + ${wis} Necrótico`);
  if(l>=6){add("Physician's Touch",'Hand of Harm também causa Envenenado até o fim do próximo turno; Hand of Healing encerra Cego, Surdo, Paralisado, Envenenado ou Atordoado.')}
  if(l>=11){resource('Flurry of Healing and Harm',Math.max(1,wis),'Descanso Longo','Ao usar Flurry of Blows, pode substituir todos os golpes por Hand of Healing e aplicar Hand of Harm em um golpe sem seu custo normal de Focus.');}
  if(l>=17)resource('Hand of Ultimate Mercy',1,'Descanso Longo',`Ação + 5 Focus: criatura morta há até 24 h retorna com 4d10 + ${wis} PV e condições debilitantes aplicáveis são removidas.`)
 }
 else if(name==='Warrior of Shadow'){
  const mi=spellByName('Minor Illusion');if(mi)bonusCantrips.push(mi);senses.push({name:'Darkvision',range:60,stack:'se já possuir, +60 ft'});technique('Shadow Arts — Darkness',1,'conjura Darkness sem componentes; vê dentro da área e pode mover a área para espaço a 60 ft no início de cada turno','Ação Mágica');
  if(l>=6){add('Shadow Step','Ação Bônus: de Dim Light/Darkness, teleporta até 60 ft para espaço visível em Dim Light/Darkness; Vantagem no próximo ataque corpo a corpo do turno.');movementModes.shadowTeleport=60}
  if(l>=11)technique('Improved Shadow Step',1,'Shadow Step ignora a exigência de Dim Light/Darkness e inclui um Ataque Desarmado imediatamente após o teleporte','Ação Bônus');
  if(l>=17)technique('Cloak of Shadows',3,'por 1 min: Invisible persistente, atravessa criaturas/objetos como Difficult Terrain e Flurry of Blows custa 0 Focus; termina se Incapacitado ou ao terminar turno em Bright Light','Ação Bônus em Dim Light/Darkness')
 }
 else if(name==='Warrior of the Elements'){
  const el=spellByName('Elementalism');if(el)bonusCantrips.push(el);technique('Elemental Attunement',1,`10 min; Ataques Desarmados têm alcance 10 ft e podem causar ${ELEMENT_TYPES.join(', ')}; após acerto pode forçar save contra CD ${focusDC} para empurrar/puxar 10 ft`,'início do turno');
  if(l>=6)technique('Elemental Burst',2,`esfera de 20 ft em ponto a 120 ft; DEX save CD ${focusDC}; falha ${`3${ma}`} Acid/Cold/Fire/Lightning/Thunder, sucesso metade`,'Ação Mágica');
  if(l>=11){movementModes.fly={value:num(d.speed),scope:'enquanto Elemental Attunement estiver ativa'};movementModes.swim={value:num(d.speed),scope:'enquanto Elemental Attunement estiver ativa'};add('Stride of the Elements',`Voo e Natação = Speed (${num(d.speed)} ft) durante Elemental Attunement.`)}
  if(l>=17){const type=values.elementalResistance||'escolhível no início de cada turno';defense('Elemental Epitome — Resistência',type,'pode trocar no início de cada turno');add('Elemental Epitome — Step of the Wind',`+20 ft de movimento; criatura de que se aproxima a 5 ft sofre ${ma} dano elemental, conforme a característica.`);add('Elemental Epitome — Golpe',`1/turno, Ataque Desarmado causa +${ma} do tipo elemental escolhido.`)}
 }
 else if(name==='Warrior of the Open Hand'){
  add('Open Hand Technique — Addle','alvo atingido por Flurry não faz Opportunity Attacks até o início do próximo turno.');add('Open Hand Technique — Push',`STR save CD ${focusDC} ou empurrado até 15 ft.`);add('Open Hand Technique — Topple',`DEX save CD ${focusDC} ou Prone.`);
  if(l>=6)resource('Wholeness of Body',Math.max(1,wis),'Descanso Longo',`Ação Bônus: recupera ${ma} + ${wis} PV (mínimo 1).`);
  if(l>=11)add('Fleet Step','Ao usar Ação Bônus que não seja Step of the Wind, pode usar Step of the Wind imediatamente após essa Ação Bônus.');
  if(l>=17)technique('Quivering Palm',4,`após Ataque Desarmado, vibrações duram ${l} dias; ao abrir mão de 1 ataque da ação Attack (ou usar ação), CON save CD ${focusDC}: 10d12 Force na falha, metade no sucesso`)
 }
 else if(name==='Way of the Astral Self'){
  technique('Arms of the Astral Self',1,`10 min; ao surgir, criaturas escolhidas a 10 ft fazem DEX save CD ${focusDC} ou sofrem 2${ma} Force; braços usam SAB em STR checks/saves e em ataque/dano, alcance +5 ft, dano Force`,'Ação Bônus');attack('Braços Astrais',pbonus+wis,`${ma} + ${wis} Force`,'alcance +5 ft no seu turno; usa Sabedoria');
  if(l>=6){technique('Visage of the Astral Self',1,'10 min; visão em Darkness normal/mágica 120 ft, Vantagem em Intuição e Intimidação, voz ampliada ou telepatia 60 ft','Ação Bônus');senses.push({name:'Visage — visão no escuro mágico',range:120})}
  if(l>=11){defense('Deflect Energy — Astral Body',`Reação reduz Acid/Cold/Fire/Force/Lightning/Thunder em 1d10 + ${wis}`);add('Empowered Arms',`1/turno, acerto dos braços causa +${ma}.`)}
  if(l>=17){technique('Awakened Astral Self',5,'10 min; +2 CA e, ao usar Attack, pode fazer 3 ataques com os braços astrais em vez de 2','Ação Bônus');defense('Awakened Astral Self','+2 CA','enquanto a forma completa estiver ativa')}
 }
 else if(name==='Way of the Drunken Master'){
  skills.push('Atuação');tools.push("Brewer's Supplies");add('Drunken Technique','Ao usar Flurry of Blows: benefício de Disengage e Walking Speed +10 ft até o fim do turno.');
  if(l>=6){add('Leap to Your Feet','Levantar de Prone custa 5 ft de movimento.');technique('Redirect Attack',1,'quando ataque corpo a corpo erra você, Reação faz o ataque atingir outra criatura a 5 ft que não seja o atacante','Reação')}
  if(l>=11)technique("Drunkard's Luck",2,'cancela Desvantagem em um ability check, ataque ou save');
  if(l>=17)add('Intoxicated Frenzy','Flurry of Blows pode fazer até 3 ataques adicionais (5 ataques de Flurry no total), desde que cada um mire criatura diferente.')
 }
 else if(name==='Way of the Kensei'){
  const mw=state.catalogs?.weapons?.find(w=>w.id===values.kenseiMelee),rw=state.catalogs?.weapons?.find(w=>w.id===values.kenseiRanged);if(mw)weaponTraining.push(mw.nome);if(rw)weaponTraining.push(rw.nome);if(values.brushTool)tools.push(values.brushTool);add('Armas Kensei',[mw?.nome,rw?.nome].filter(Boolean).join(' · ')||'pendentes');add('Agile Parry','Se fizer Ataque Desarmado na ação Attack segurando arma Kensei melee: +2 CA até início do próximo turno.');add("Kensei's Shot",'Ação Bônus: ataques à distância com arma Kensei causam +1d4 até o fim do turno.');
  if(l>=6){add('One with the Blade','Armas Kensei contam como mágicas para superar resistência/imunidade.');technique('Deft Strike',1,`1/turno após acertar arma Kensei: +${ma} dano`)}
  if(l>=11)technique('Sharpen the Blade','1–3','Ação Bônus: gasta até 3 Focus; arma Kensei compatível recebe bônus igual ao Focus gasto em ataque e dano por 1 min','Ação Bônus');
  if(l>=17)add('Unerring Accuracy','1/turno, quando erra ataque com Monk Weapon, pode rerrolar.')
 }
 else if(name==='Way of the Sun Soul'){
  attack('Radiant Sun Bolt',pbonus+dex,`${ma} + ${dex} Radiant`,'ranged 30 ft; pode substituir ataques da ação Attack');technique('Radiant Sun Bolt — rajada',1,'após usar Attack com Sun Bolt, faz 2 bolts como Ação Bônus','Ação Bônus');
  if(l>=6)technique('Searing Arc Strike',2,'após Attack, conjura Burning Hands como Ação Bônus; Focus adicional aumenta o nível conforme a progressão permitida','Ação Bônus');
  if(l>=11)technique('Searing Sunburst','0–3',`esfera de 20 ft em ponto a 150 ft; CON save CD ${focusDC}; falha 2d6 Radiant +2d6 por Focus gasto (máx. 8d6), sucesso 0`,'Ação');
  if(l>=17){add('Sun Shield','Bright Light 30 ft + Dim Light 30 ft; liga/desliga com Ação Bônus.');add('Sun Shield — Retaliação',`Reação quando ataque corpo a corpo acerta: ${5+wis} Radiant.`)}
 }
 else if(name==='Way of the Artisan'){
  tools.push(...arr(values.artisanTools));const toolDie=dieStepUp(ma);weaponTraining.push(...arr(values.artisanTools).map(x=>`Ferramenta como Monk Weapon: ${x}`));add('Tools of the Trade',`Ferramentas escolhidas são Monk Weapons; dano ${toolDie}, escolhendo Bludgeoning/Piercing/Slashing por acerto.`);const objects=Math.max(1,wis),stored=l>=11?2:1;resource('Soulful Craft',`${objects} objeto(s) × ${stored} Focus`,'Descanso Longo',`objetos Tiny; Focus armazenado pode pagar Deflect Attacks, Flurry of Blows, Patient Defense ou Step of the Wind; objeto é destruído a 0.`);
  if(l>=6)add('Strike of Inspiration','Focus de Soulful Craft melhora: Deflect (+Vantagem e +1d10 no retorno), Flurry (troca golpes por ferramenta), Patient Defense (Reação com ferramenta quando ataque erra) e Step of the Wind (Dash + Disengage).');
  if(l>=11)resource('Art History',1,'Descanso Curto ou Longo','10 min + Wisdom DC 15 em objeto Medium ou menor; revela usuários/trajetória nas últimas 24 h e visão sensorial de 10 min. Soulful Craft tem sucesso automático e é destruído.');
  if(l>=17)resource('Dying Art',1,'Descanso Curto ou Longo',`ao cair a 0 PV, destrói Soulful Craft carregado: permanece consciente, cura 2d8 por Focus armazenado e move até ${Math.floor(num(d.speed)/2)} ft sem provocar OA.`)
 }
 return{name,features,choices:values,pending,martialArtsDie:ma,focusDC,summary,resources,defenses,attacks,skills:uniq(skills),tools:uniq(tools),weaponTraining:uniq(weaponTraining),bonusCantrips:uniq(bonusCantrips),movementModes,senses,resistances:uniq(resistances),focusTechniques}
}
export function applyMonkSubclassMechanics(d){const out=monkSubclassOutcome(d);if(!out)return d;d.subclassMechanics=out;d.skills=uniq([...arr(d.skills),...out.skills]);d.tools=uniq([...arr(d.tools),...out.tools]);d.subclassAttacks=uniq([...arr(d.subclassAttacks),...out.attacks]);d.subclassResources=uniq([...arr(d.subclassResources),...out.resources]);d.subclassDefenses=uniq([...arr(d.subclassDefenses),...out.defenses]);d.subclassWeaponTraining=uniq([...arr(d.subclassWeaponTraining),...out.weaponTraining]);d.subclassBonusCantrips=uniq([...arr(d.subclassBonusCantrips),...out.bonusCantrips]);d.subclassMovementModes={...(d.subclassMovementModes||{}),...out.movementModes};d.subclassSenses=uniq([...arr(d.subclassSenses),...out.senses]);d.subclassFocusTechniques=uniq([...arr(d.subclassFocusTechniques),...out.focusTechniques]);d.focusDC=out.focusDC;d.martialArtsDie=out.martialArtsDie;return d}
