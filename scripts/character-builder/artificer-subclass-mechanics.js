import{state,arr,num,fold,uniq,mod}from'./state.js';

export const ARTIFICER_SUBCLASS_NAMES=['Alchemist','Armorer','Artillerist','Battle Smith','Cartographer'];
const KNOWN=new Set(ARTIFICER_SUBCLASS_NAMES.map(fold));
const keyPart=v=>fold(v).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const canonical=d=>d?.sub?.mechanics?.name||d?.sub?.name||'';
const choiceDef=(id,level,label,options,frequency,required=false,note='',kind='select')=>({id,level,label,options,frequency,required,note,kind});
const SPELLS={
 Alchemist:{3:['Healing Word','Ray of Sickness'],5:['Flaming Sphere',"Melf's Acid Arrow"],9:['Gaseous Form','Mass Healing Word'],13:['Death Ward','Vitriolic Sphere'],17:['Cloudkill','Raise Dead']},
 Armorer:{3:['Magic Missile','Thunderwave'],5:['Mirror Image','Shatter'],9:['Hypnotic Pattern','Lightning Bolt'],13:['Fire Shield','Greater Invisibility'],17:['Passwall','Wall of Force']},
 Artillerist:{3:['Shield','Thunderwave'],5:['Scorching Ray','Shatter'],9:['Fireball','Wind Wall'],13:['Ice Storm','Wall of Fire'],17:['Cone of Cold','Wall of Force']},
 'Battle Smith':{3:['Heroism','Shield'],5:['Shining Smite','Warding Bond'],9:['Aura of Vitality','Conjure Barrage'],13:['Aura of Purity','Fire Shield'],17:['Banishing Smite','Mass Cure Wounds']},
 Cartographer:{3:['Faerie Fire','Guiding Bolt','Healing Word'],5:['Locate Object','Mind Spike'],9:['Call Lightning','Clairvoyance'],13:['Banishment','Locate Creature'],17:['Scrying','Teleportation Circle']}
};
const FIXED_TOOLS={Alchemist:["Alchemist's Supplies",'Herbalism Kit'],Armorer:["Smith's Tools"],Artillerist:["Woodcarver's Tools"],'Battle Smith':["Smith's Tools"],Cartographer:["Calligrapher's Supplies","Cartographer's Tools"]};
const BASE_TOOLS=["Thieves' Tools","Tinker's Tools"];
const TOOL_PT={
 "Alchemist's Supplies":'Suprimentos de Alquimista',"Brewer's Supplies":'Suprimentos de Cervejeiro',"Calligrapher's Supplies":'Suprimentos de Calígrafo',"Carpenter's Tools":'Ferramentas de Carpinteiro',"Cartographer's Tools":'Ferramentas de Cartógrafo',"Cobbler's Tools":'Ferramentas de Sapateiro',"Cook's Utensils":'Utensílios de Cozinheiro',"Glassblower's Tools":'Ferramentas de Soprador de Vidro',"Jeweler's Tools":'Ferramentas de Joalheiro',"Leatherworker's Tools":'Ferramentas de Coureiro',"Mason's Tools":'Ferramentas de Pedreiro',"Painter's Supplies":'Suprimentos de Pintor',"Potter's Tools":'Ferramentas de Oleiro',"Smith's Tools":'Ferramentas de Ferreiro',"Tinker's Tools":'Ferramentas de Reparador',"Weaver's Tools":'Ferramentas de Tecelão',"Woodcarver's Tools":'Ferramentas de Entalhador','Herbalism Kit':'Kit de Herbalismo',"Thieves' Tools":'Ferramentas de Ladrão'
};
const TOOL_ALIAS=new Map();for(const[name,pt]of Object.entries(TOOL_PT)){TOOL_ALIAS.set(fold(name),name);TOOL_ALIAS.set(fold(pt),name)}
const ELIXIRS=['Cura','Rapidez','Resiliência','Ousadia','Voo','Transformação'];
const MODELS=['Dreadnaught','Guardian','Infiltrator'];
const CANNONS=['Lança-Chamas','Balista de Força','Protetor'];
const toolName=x=>String(x?.name||x?.nome||'').trim();
const toolSubtype=x=>String(x?.subtype||x?.subtipo||'').trim();
const toolKey=v=>fold(String(v||'').replace(/[’‘]/g,"'")).trim();
function toolCatalogName(value){const raw=String(value||'').trim();if(!raw)return'';const alias=TOOL_ALIAS.get(toolKey(raw));if(alias)return alias;const found=arr(state.catalogs?.tools).find(x=>toolKey(toolName(x))===toolKey(raw));return found?toolName(found):raw}
export function artificerToolLabel(value){const name=toolCatalogName(value);return TOOL_PT[name]||name}
export function artificerBaseArtisanToolOptions(){return uniq(arr(state.catalogs?.tools).filter(x=>{const t=fold(toolSubtype(x));return t==='ferramenta de artesao'||t.includes('artisan')}).map(toolName)).sort((a,b)=>artificerToolLabel(a).localeCompare(artificerToolLabel(b),'pt-BR'))}
function artificerChoiceStore(){state.c.choices=state.c.choices||{};return state.c.choices.artificer||(state.c.choices.artificer={})}
export function artificerBaseArtisanTool(){const raw=artificerChoiceStore().baseArtisanTool||'',name=toolCatalogName(raw),options=artificerBaseArtisanToolOptions();if(!name)return null;if(!options.length)return name;return options.includes(name)?name:null}
export function setArtificerBaseArtisanTool(value){const store=artificerChoiceStore(),name=toolCatalogName(value),options=artificerBaseArtisanToolOptions();if(name&&options.includes(name))store.baseArtisanTool=name;else delete store.baseArtisanTool}
function baseToolProficiencies(){return uniq([...BASE_TOOLS,...[artificerBaseArtisanTool()].filter(Boolean)])}
function choiceStore(d){const key=keyPart(canonical(d));state.c.choices=state.c.choices||{};state.c.choices.subclassMechanics=state.c.choices.subclassMechanics||{};return state.c.choices.subclassMechanics[key]||(state.c.choices.subclassMechanics[key]={})}
function isArtificer(d){return d?.klass?.slug==='artificer'&&d?.sub&&KNOWN.has(fold(canonical(d)))}
function spellNames(name,level){const table=SPELLS[name]||{},out=[];for(const[at,names]of Object.entries(table))if(num(at)<=level)out.push(...names);return out}
function resolveSpells(names){return names.map(name=>state.catalogs?.spells?.find(s=>fold(s.name)===fold(name)||fold(s.originalName)===fold(name))).filter(Boolean)}
function elixirCount(level){return level>=15?5:level>=9?4:level>=5?3:2}
function priorToolKeys(d){return new Set([...arr(d?.tools),...baseToolProficiencies()].map(toolCatalogName).map(toolKey).filter(Boolean))}
function toolReplacementDefs(name,level,d){
 if(level<3)return[];const fixed=arr(FIXED_TOOLS[name]),prior=priorToolKeys(d),allFixed=new Set(fixed.map(toolKey)),store=state.c.choices?.subclassMechanics?.[keyPart(name)]||{},duplicates=fixed.map((grant,index)=>({grant,index,id:`toolReplacement${index+1}`})).filter(x=>prior.has(toolKey(x.grant))),artisan=artificerBaseArtisanToolOptions();
 return duplicates.map(row=>{const own=toolCatalogName(store[row.id]||''),blocked=new Set([...prior,...allFixed]);for(const other of duplicates)if(other.id!==row.id&&store[other.id])blocked.add(toolKey(toolCatalogName(store[other.id])));const options=artisan.filter(x=>!blocked.has(toolKey(x))||toolKey(x)===toolKey(own));return choiceDef(row.id,3,`Substituição por proficiência duplicada — ${artificerToolLabel(row.grant)}`,options,'ao receber Tools of the Trade',true,`Você já possui proficiência em ${artificerToolLabel(row.grant)}. Escolha outra Ferramenta de Artesão da Biblioteca; ferramentas em que já possui proficiência ficam indisponíveis.`,'select')})
}

export function artificerSubclassChoiceDefs(d){
 if(!isArtificer(d))return[];const l=num(d.level),name=canonical(d),defs=[...toolReplacementDefs(name,l,d)];
 const add=(id,level,label,options,frequency,required=false,note='',kind='select')=>{if(l>=level)defs.push(choiceDef(id,level,label,options,frequency,required,note,kind))};
 if(name==='Alchemist')add('elixirEffect',3,'Efeito atual/preferido do Elixir Experimental',ELIXIRS,'a cada elixir',false,'O efeito pode mudar entre elixires; esta seleção registra a opção atual ou preferida.');
 else if(name==='Armorer')add('armorModel',3,'Modelo da Armadura Arcana',MODELS,'após Descanso Curto ou Longo',true,'O modelo permanece até você alterá-lo após outro descanso.');
 else if(name==='Artillerist')add('cannonType',3,'Tipo atual/preferido de Canhão Místico',CANNONS,'a cada canhão',false,'O tipo é escolhido quando o canhão é criado.');
 return defs
}
export function sanitizeArtificerSubclassChoices(d){
 if(!isArtificer(d))return{values:{},pending:[]};const store=choiceStore(d),defs=artificerSubclassChoiceDefs(d),allowed=new Map(defs.map(x=>[x.id,x])),clean={},claimedTools=new Set();
 for(const[id,value]of Object.entries(store)){const def=allowed.get(id);if(!def)continue;if(id.startsWith('toolReplacement')){const canonicalValue=toolCatalogName(value),key=toolKey(canonicalValue);if(def.options.includes(canonicalValue)&&!claimedTools.has(key)){clean[id]=canonicalValue;claimedTools.add(key)}}else if(def.kind==='text'){if(String(value||'').trim())clean[id]=String(value).trim()}else if(def.options.includes(value))clean[id]=value}
 state.c.choices.subclassMechanics[keyPart(canonical(d))]=clean;return{values:clean,pending:defs.filter(x=>x.required&&!clean[x.id])}
}
export function setArtificerSubclassChoice(d,id,value){if(!isArtificer(d))return;const def=artificerSubclassChoiceDefs(d).find(x=>x.id===id),store=choiceStore(d);if(!def)return;if(id.startsWith('toolReplacement')){const canonicalValue=toolCatalogName(value);if(def.options.includes(canonicalValue))store[id]=canonicalValue;else delete store[id]}else if(def.kind==='text'){if(String(value||'').trim())store[id]=String(value).trim();else delete store[id]}else if(def.options.includes(value))store[id]=value;else delete store[id]}

export function artificerSubclassOutcome(d){
 if(!isArtificer(d))return null;const l=num(d.level),pb=num(d.pbonus),int=mod(d.scores?.Inteligência),intUses=Math.max(1,int),name=canonical(d),{values,pending}=sanitizeArtificerSubclassChoices(d),features=arr(d.sub?.features).filter(f=>num(f.level)<=l),summary=[],resources=[],defenses=[],attacks=[],movementModes={},tools=arr(FIXED_TOOLS[name]).map(artificerToolLabel),armorTraining=[],weaponTraining=[],companions=[];
 for(const key of['toolReplacement1','toolReplacement2'])if(values[key])tools.push(artificerToolLabel(values[key]));
 const alwaysPreparedSpellNames=spellNames(name,l),alwaysPreparedSpells=resolveSpells(alwaysPreparedSpellNames),missingSpells=alwaysPreparedSpellNames.filter(n=>!alwaysPreparedSpells.some(s=>fold(s.name)===fold(n)||fold(s.originalName)===fold(n)));
 const add=(n,value,scope='')=>summary.push({name:n,value,scope}),resource=(n,uses,recovery,detail='')=>resources.push({name:n,uses,recovery,detail}),defense=(n,value,scope='')=>defenses.push({name:n,value,scope}),attack=(n,damage,extra='',attackBonus=d.spellAttack)=>attacks.push({name:n,attackBonus,damage,extra});
 if(name==='Alchemist'){
  resource('Elixires Experimentais',elixirCount(l),'Descanso Longo','Elixires adicionais podem ser criados gastando espaços de magia.');
  const e=values.elixirEffect;if(e==='Cura')add('Elixir — Cura',`2d4 ${int>=0?'+':'−'} ${Math.abs(int)} PV`);if(e==='Rapidez')add('Elixir — Rapidez','+10 ft de Deslocamento por 1 hora');if(e==='Resiliência')add('Elixir — Resiliência','+1 CA por 10 minutos');if(e==='Ousadia')add('Elixir — Ousadia','+1d4 em ataques e testes de resistência por 1 minuto');if(e==='Voo')add('Elixir — Voo','Deslocamento de Voo 10 ft por 10 minutos');if(e==='Transformação')add('Elixir — Transformação','Alter Self por 10 minutos');
  if(l>=5)add('Alchemical Savant',`+${Math.max(1,int)} em uma rolagem de cura ou dano Acid/Fire/Poison`,'magia de Artífice conjurada usando Suprimentos de Alquimista como foco');
  if(l>=9)resource('Restorative Reagents',intUses,'Descanso Longo','Lesser Restoration sem espaço de magia e sem preparação.');
  if(l>=15){defense('Chemical Mastery','Resistência a Acid e Poison; imunidade a Poisoned');add('Chemical Mastery','+2d8 Force, 1/turno, a um alvo de magia de Artífice que sofra Acid/Fire/Poison');resource("Tasha's Bubbling Cauldron",1,'Descanso Longo','Sem espaço, preparação ou componentes materiais; usa Suprimentos de Alquimista.')}
 }else if(name==='Armorer'){
  armorTraining.push('Pesada');add('Armadura Arcana','Ignora requisito de Força, funciona como foco, não pode ser removida contra sua vontade e integra/substitui membros ausentes');
  const model=values.armorModel,plus=l>=9?1:0;if(model==='Dreadnaught'){
   attack('Force Demolisher',`${l>=15?'2d6':'1d10'} + ${int}${plus?` + ${plus}`:''} Force`,`Arma Simples corpo a corpo · Reach · usa Inteligência${l>=9?' · +1 ataque/dano':''}`,num(d.spellAttack)+plus);add('Wrecking Ball','Ao acertar criatura pelo menos 1 tamanho menor: empurra ou puxa até 10 ft');resource('Giant Stature',intUses,'Descanso Longo',l>=15?'1 minuto; alcance +10 ft; tamanho Large ou Huge; Vantagem em testes e salvaguardas de Força.':'1 minuto; alcance +5 ft; se menor que Large, tamanho Large.')
  }else if(model==='Guardian'){
   attack('Thunder Pulse',`${l>=15?'1d10':'1d8'} + ${int}${plus?` + ${plus}`:''} Thunder`,`Arma Simples corpo a corpo · usa Inteligência${l>=9?' · +1 ataque/dano':''}`,num(d.spellAttack)+plus);add('Distracting Pulse','Alvo atingido tem Desvantagem para atacar outros alvos até seu próximo turno');add('Defensive Field',`${l} PV temporários`,'Ação Bônus enquanto Bloodied');if(l>=15)resource('Perfected Armor — Guardian',intUses,'Descanso Longo',`Reação; alvo Huge ou menor a 30 ft faz Força contra CD ${d.spellDC}; falha puxa até 25 ft e pode gerar ataque corpo a corpo.`)
  }else if(model==='Infiltrator'){
   attack('Lightning Launcher',`${l>=15?'2d6':'1d6'} + ${int}${plus?` + ${plus}`:''} Lightning`,`Arma Simples à distância 90/300 ft · usa Inteligência · +1d6 uma vez por turno${l>=9?' · +1 ataque/dano':''}`,num(d.spellAttack)+plus);movementModes.walkBonus=5;add('Dampening Field','Vantagem em Destreza (Furtividade)');if(l>=15){add('Perfected Armor — Infiltrator','Alvos que sofrem Lightning do lançador brilham e têm Desvantagem em ataques contra você até seu próximo turno');resource('Arcane Flight',intUses,'Descanso Longo',`Ação Bônus: Voo ${Math.max(0,num(d.speed)+5)*2} ft até o fim do turno.`)}
  }
  if(l>=5)add('Extra Attack','2 ataques com a ação Atacar');if(l>=9)add('Improved Armorer','+1 ataque/dano com a arma especial; +1 plano de Armadura e +1 item replicado de Armadura');
 }else if(name==='Artillerist'){
  weaponTraining.push('Armas marciais à distância');resource('Canhão Místico',1,'Descanso Longo','Criação adicional exige um espaço de magia; AC 18, PV = 5 × nível, imune a Poison/Psychic; Mending cura 2d6.');add('Canhão Místico — PV',5*l);const c=values.cannonType,die=l>=9?'3d8':'2d8';if(c==='Lança-Chamas')add('Lança-Chamas',`${die} Fire em cone de 15 ft; Destreza CD ${d.spellDC}, metade no sucesso`);if(c==='Balista de Força')attack('Balista de Força',`${die} Force`,`120 ft; empurra criatura 5 ft`,d.spellAttack);if(c==='Protetor')add('Protetor',`${l>=9?'2d8':'1d8'} + ${Math.max(1,int)} PV temporários`,'canhão e criaturas escolhidas a 10 ft');if(l>=5)add('Arcane Firearm','+1d8 em uma rolagem de dano de magia de Artífice conjurada pelo foco');if(l>=9)add('Explosive Cannon',`Reação quando o canhão sofre dano: detona em 20 ft; 3d10 Force, Destreza CD ${d.spellDC}, metade no sucesso`);if(l>=15)add('Fortified Position','Você e aliados a 10 ft dos canhões recebem Meia Cobertura; pode manter e ativar 2 canhões')
 }else if(name==='Battle Smith'){
  weaponTraining.push('Armas marciais');add('Arcane Empowerment','Pode usar Inteligência no lugar de Força/Destreza para ataque e dano com arma mágica');add('Weapon Knowledge','Armas proficientes podem servir como foco de Artífice');const defData=state.c.choices?.companions?.['artificer-steel-defender']||{},defAC=12+int+(l>=15?2:0),defHP=5+5*l;companions.push({name:defData.name||'Defensor de Aço',appearance:defData.appearance||'',legs:defData.legs||'',ac:defAC,hp:defHP,speed:40,senses:'Visão no Escuro 60 ft',immunities:'Poison; Charmed, Exhaustion, Poisoned',attackBonus:d.spellAttack,attackDamage:`1d8 + 2 + ${int} Force`,repair:`2d8 + ${int} PV · 3/dia`,reaction:l>=15?`Deflect Attack; atacante também sofre 1d4 + ${int} Force`:'Deflect Attack; impõe Desvantagem a ataque contra outro alvo'});attack('Defensor de Aço — Force-Empowered Rend',`1d8 + 2 + ${int} Force`,'alcance 5 ft; bônus igual ao ataque mágico',d.spellAttack);resource('Defensor de Aço — Repair',3,'Dia',`2d8 + ${int} PV em si, Construct ou objeto a 5 ft.`);if(l>=5)add('Extra Attack','2 ataques; pode abrir mão de 1 para comandar Force-Empowered Rend');if(l>=9)resource('Arcane Jolt',intUses,'Descanso Longo',`${l>=15?'4d6':'2d6'} Force extra ou ${l>=15?'4d6':'2d6'} de cura, no máximo 1/turno.`);if(l>=15){defense('Fortified Defender',`Defensor de Aço CA ${defAC}`);add('Improved Deflection',`Deflect Attack causa 1d4 + ${int} Force ao atacante`)}
 }else if(name==='Cartographer'){
  const maps=Math.max(2,1+int);resource("Adventurer's Atlas",maps,'Descanso Longo','Cada portador recebe um mapa mágico e +1d4 na Iniciativa; portadores conhecem as posições uns dos outros no mesmo plano.');add('Atlas — coordenação','Efeitos que normalmente exigem ver outro portador podem ignorar linha de visão/cobertura quando a regra da característica permitir');resource('Mapping Magic — Faerie Fire',intUses,'Descanso Longo','Faerie Fire sem espaço de magia.');add('Portal Jump','Gaste movimento igual à metade do Deslocamento para teleportar 10 ft ou para junto de portador de mapa a 30 ft; indisponível se Speed 0');if(l>=5)add('Guided Precision',`+${int} em uma rolagem de dano, 1/turno`,'magia da lista de Cartógrafo ou acerto contra alvo sob seu Faerie Fire; esse dano não quebra a Concentração de Faerie Fire');if(l>=9)add('Ingenious Movement','Ao usar Flash of Genius, você ou voluntário visível a 30 ft teleporta até 30 ft na mesma Reação');if(l>=15){add('Safe Haven',`Destruir mapa ao cair a 0 PV: fica com ${2*l} PV e teleporta para junto de você ou outro portador`);resource('Find the Path',1,'Descanso Longo','Sem espaço, preparação ou componentes, se estiver segurando um mapa.')}
 }
 return{name,choices:values,pending,features,summary,resources,defenses,attacks,movementModes,tools:uniq(tools),armorTraining:uniq(armorTraining),weaponTraining:uniq(weaponTraining),alwaysPreparedSpellNames,alwaysPreparedSpells,missingSpells,companions}
}

function isMartialRanged(w){const c=fold(w?.categoria||'');return c.includes('marcial')&&(c.includes('distancia')||c.includes('ranged'))}
function isMartial(w){return fold(w?.categoria||'').includes('marcial')}
function isMagicWeapon(w){return !!(w?.magico||w?.magic||w?.magical||w?.magicBonus||w?.bonus_magico||/magic|magica|mágica/i.test(`${w?.tipo||''} ${w?.fonte||''}`))}
export function applyArtificerSubclassMechanics(d){
 if(d?.klass?.slug==='artificer'){const baseTools=baseToolProficiencies();d.tools=uniq([...arr(d.tools),...baseTools]);d.artificerBaseTools=baseTools}
 const out=artificerSubclassOutcome(d);if(!out)return d;d.subclassMechanics=out;d.tools=uniq([...arr(d.tools),...out.tools]);d.subclassTools=out.tools;d.subclassArmorTraining=out.armorTraining;d.subclassWeaponTraining=out.weaponTraining;d.subclassAttacks=out.attacks;d.subclassResources=out.resources;d.subclassDefenses=out.defenses;d.subclassMovementModes=out.movementModes;d.subclassAlwaysPreparedSpells=out.alwaysPreparedSpells;d.subclassAlwaysPreparedSpellNames=out.alwaysPreparedSpellNames;d.preparedSpellsAll=uniq([...arr(d.selectedSpells?.leveled),...out.alwaysPreparedSpells]);d.subclassCompanions=out.companions;
 if(out.name==='Armorer'){
  if(d.armor?.forca_minima&&d.scores?.Força<num(d.armor.forca_minima))d.speed+=10;
  if(out.movementModes.walkBonus)d.speed+=num(out.movementModes.walkBonus)
 }
 if(d.weapon&&!d.wprof&&((out.name==='Artillerist'&&isMartialRanged(d.weapon))||(out.name==='Battle Smith'&&isMartial(d.weapon)))){d.wprof=true;d.attack=num(d.attack)+num(d.pbonus)}
 if(out.name==='Battle Smith'&&d.weapon&&isMagicWeapon(d.weapon)){d.wAbility='Inteligência';d.attack=mod(d.scores.Inteligência)+(d.wprof?d.pbonus:0);d.magicWeaponAbilityOverride='Inteligência'}
 return d
}