import{state,arr,num,fold,uniq,mod}from'./state.js';

export const BARBARIAN_SUBCLASS_NAMES=[
 'Path of the Berserker','Path of the Wild Heart','Path of the World Tree','Path of the Zealot',
 'Path of the Beast','Path of Wild Magic','Path of the Ancestral Guardian','Path of the Storm Herald',
 'Path of the Demonshard','Path of the Brewmaster'
];
const KNOWN=new Set(BARBARIAN_SUBCLASS_NAMES.map(fold));
const rageDamage=l=>l>=16?4:l>=9?3:2;
const rageUses=l=>l>=17?6:l>=12?5:l>=6?4:l>=3?3:2;
const stormFlat=l=>l>=20?6:l>=15?5:l>=10?4:l>=5?3:2;
const stormSea=l=>l>=20?'4d6':l>=15?'3d6':l>=10?'2d6':'1d6';
const demonDie=l=>l>=20?'1d12':l>=14?'1d10':l>=10?'1d8':l>=6?'1d6':'1d4';
const zealotDice=l=>4+(l>=6?1:0)+(l>=12?1:0)+(l>=17?1:0);
const spiritShield=l=>`${2+(l>=10?1:0)+(l>=14?1:0)}d6`;
const keyPart=v=>fold(v).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const canonical=d=>d?.sub?.mechanics?.name||d?.sub?.name||'';
const choiceDef=(id,level,label,options,frequency,required=false,note='')=>({id,level,label,options,frequency,required,note});
const abilityBonus=v=>v>=0?`+${v}`:`${v}`;

function choiceStore(d){
 const name=canonical(d),key=keyPart(name);state.c.choices=state.c.choices||{};state.c.choices.subclassMechanics=state.c.choices.subclassMechanics||{};
 return state.c.choices.subclassMechanics[key]||(state.c.choices.subclassMechanics[key]={})
}
function isBarbarian(d){return d?.klass?.slug==='barbarian'&&d?.sub&&KNOWN.has(fold(canonical(d)))}

export function barbarianSubclassChoiceDefs(d){
 if(!isBarbarian(d))return[];const l=num(d.level),n=fold(canonical(d)),defs=[];
 const add=(id,level,label,options,frequency,required=false,note='')=>{if(l>=level)defs.push(choiceDef(id,level,label,options,frequency,required,note))};
 if(n===fold('Path of the Wild Heart')){
  add('rageAspect',3,'Aspecto de Rage of the Wilds',['Urso','Águia','Lobo'],'a cada Fúria',false,'Escolha atual/preferida; a regra permite escolher novamente ao ativar a Fúria.');
  add('wildAspect',6,'Aspect of the Wilds',['Coruja','Pantera','Salmão'],'após Descanso Longo',true,'A escolha permanece até ser trocada após outro Descanso Longo.');
  add('powerAspect',14,'Power of the Wilds',['Falcão','Leão','Carneiro'],'a cada Fúria',false,'Escolha atual/preferida; a regra permite escolher novamente ao ativar a Fúria.')
 }else if(n===fold('Path of the Zealot'))add('divineFuryType',3,'Tipo preferido de Divine Fury',['Radiante','Necrótico'],'a cada acerto',false,'O tipo pode ser escolhido sempre que o dano é causado.');
 else if(n===fold('Path of the Beast')){
  add('beastForm',3,'Forma atual/preferida de Form of the Beast',['Mordida','Garras','Cauda'],'a cada Fúria',false,'A arma natural é escolhida ao entrar em Fúria.');
  add('bestialSoul',6,'Adaptação de Bestial Soul',['Natação','Escalada','Salto'],'após Descanso Curto ou Longo',true,'A adaptação permanece até a próxima escolha após um descanso.')
 }else if(n===fold('Path of the Storm Herald'))add('stormAura',3,'Ambiente de Storm Aura',['Deserto','Mar','Tundra'],'ao ganhar nível',true,'O ambiente pode ser trocado quando você ganha um nível de Bárbaro.');
 else if(n===fold('Path of the Demonshard')){
  add('demontongue',3,'Idioma de Demontongue',['Abissal','Infernal'],'na obtenção da característica',true);
  add('punishmentType',3,'Tipo preferido de Fiendish Punishment',['Fogo','Necrótico'],'a cada punição',false,'O tipo é uma escolha de uso, não uma escolha permanente.')
 }else if(n===fold('Path of the Brewmaster')){
  add('ancestralDrink',3,'Bebida atual/preferida de Ancestral Spirits',['Kefir','Kombucha','Mead','Sake','Stout'],'a cada Fúria',false,'A bebida é escolhida quando uma Fúria é ativada.');
  add('brewersGut',6,"Benefício atual de Brewer's Gut",['Beer Jacket','Guts of Steel','Liquid Courage'],'após Descanso Curto ou Longo',true);
  add('drinkingBuddies',10,'Bebida atual de Drinking Buddies',['Ginger Ale','Pulque','Warm Cider'],'durante Descanso Curto ou Longo',false,'Representa a preparação atualmente distribuída ao grupo, para até 10 criaturas.')
 }
 return defs
}
export function sanitizeBarbarianSubclassChoices(d){
 if(!isBarbarian(d))return{values:{},pending:[]};const store=choiceStore(d),defs=barbarianSubclassChoiceDefs(d),allowed=new Map(defs.map(x=>[x.id,x])),clean={};
 for(const[id,value]of Object.entries(store)){const def=allowed.get(id);if(def&&def.options.includes(value))clean[id]=value}
 const key=keyPart(canonical(d));state.c.choices.subclassMechanics[key]=clean;
 return{values:clean,pending:defs.filter(x=>x.required&&!clean[x.id])}
}
export function setBarbarianSubclassChoice(d,id,value){
 if(!isBarbarian(d))return;const def=barbarianSubclassChoiceDefs(d).find(x=>x.id===id),store=choiceStore(d);if(!def)return;
 if(def.options.includes(value))store[id]=value;else delete store[id]
}

export function barbarianSubclassOutcome(d){
 if(!isBarbarian(d))return null;const l=num(d.level),pb=num(d.pbonus),str=mod(d.scores?.Força),con=mod(d.scores?.Constituição),n=fold(canonical(d)),{values,pending}=sanitizeBarbarianSubclassChoices(d),features=arr(d.sub?.features).filter(f=>num(f.level)<=l),summary=[],resources=[],defenses=[],attacks=[],movementModes={},senses=[],tools=[],languages=[],weaponTraining=[];
 const rDamage=rageDamage(l),rages=rageUses(l),strDC=8+pb+str,conDC=8+pb+con;
 const add=(name,value,scope='')=>summary.push({name,value,scope});
 const resource=(name,uses,recovery,detail='')=>resources.push({name,uses,recovery,detail});
 const defense=(name,value,scope='')=>defenses.push({name,value,scope});
 const attack=(name,damage,extra='')=>attacks.push({name,attackBonus:str+pb,damage,extra,scope:'durante a Fúria'});

 if(n===fold('Path of the Berserker')){
  add('Frenzy',`${rDamage}d6 adicionais no primeiro acerto elegível do turno`,'Fúria + Ataque Descuidado');
  if(l>=6)defense('Mindless Rage','Imunidade a Enfeitiçado e Amedrontado','durante a Fúria; ativá-la encerra essas condições');
  if(l>=10)add('Retaliation','Ataque corpo a corpo como Reação','quando criatura a 5 ft causa dano em você');
  if(l>=14){add('CD de Intimidating Presence',strDC,'8 + mod. Força + PB');resource('Intimidating Presence',1,'Descanso Longo','Ação Bônus; criaturas escolhidas em 30 ft fazem salvaguarda de Sabedoria ou ficam Amedrontadas por até 1 min. Pode restaurar o uso gastando uma Fúria.')}
 }else if(n===fold('Path of the Wild Heart')){
  add('Animal Speaker','Beast Sense e Speak with Animals como rituais','Sabedoria');
  const a=values.rageAspect;if(a==='Urso')defense('Rage of the Wilds — Urso','Resistência a todos os tipos de dano exceto Force, Necrotic, Psychic e Radiant','durante a Fúria');
  if(a==='Águia')add('Rage of the Wilds — Águia','Dash + Disengage juntos','na ativação e como Ação Bônus durante a Fúria');
  if(a==='Lobo')add('Rage of the Wilds — Lobo','Aliados têm Vantagem contra inimigos adjacentes a você','durante a Fúria');
  if(l>=6){const a6=values.wildAspect;if(a6==='Coruja')senses.push({name:'Visão no Escuro',value:'60 ft; se já possuir, +60 ft'});if(a6==='Pantera')movementModes.climb=d.speed;if(a6==='Salmão')movementModes.swim=d.speed}
  if(l>=10)add('Nature Speaker','Commune with Nature como ritual','sem exigir preparação de magia');
  if(l>=14){const a14=values.powerAspect;if(a14==='Falcão')add('Power of the Wilds — Falcão',`Voo ${d.speed} ft`,'durante a Fúria e sem armadura');if(a14==='Leão')add('Power of the Wilds — Leão','Inimigos adjacentes têm Desvantagem ao atacar outros alvos','durante a Fúria');if(a14==='Carneiro')add('Power of the Wilds — Carneiro','Pode deixar criatura Grande ou menor Caída ao acertar ataque corpo a corpo','durante a Fúria')}
 }else if(n===fold('Path of the World Tree')){
  add('Vitality of the Tree',`${l} PV temporários ao ativar a Fúria`);add('Life-Giving Force',`${rDamage}d6 PV temporários`,'para outra criatura a 10 ft no início de cada turno em Fúria');
  if(l>=6){add('CD de Branches of the Tree',strDC,'8 + mod. Força + PB');add('Branches of the Tree','Teleporta o alvo para junto de você e reduz o Speed dele a 0 até o fim do turno','Reação contra criatura visível que começa turno a 30 ft e falha em salvaguarda de Força')}
  if(l>=10)add('Battering Roots','+10 ft de alcance com armas corpo a corpo Heavy ou Versatile; Push/Topple adicional','em seus turnos');
  if(l>=14)add('Travel Along the Tree','Teleporte 60 ft; 1/Fúria pode chegar a 150 ft e levar até 6 voluntários','ativação da Fúria e Ação Bônus')
 }else if(n===fold('Path of the Zealot')){
  add('Divine Fury',`1d6 + ${Math.floor(l/2)} ${values.divineFuryType||'Radiante/Necrótico'}`,'primeiro acerto por turno durante a Fúria');
  resource('Warrior of the Gods',`${zealotDice(l)}d12`,'Descanso Longo','Ação Bônus para gastar dados e recuperar PV.');
  if(l>=6)add('Fanatical Focus',`Repetição de salvaguarda com +${rDamage}`,'1 vez por Fúria');
  if(l>=10)resource('Zealous Presence',1,'Descanso Longo','Ação Bônus: até 10 criaturas a 60 ft têm Vantagem em ataques e salvaguardas até seu próximo turno. Pode restaurar o uso gastando uma Fúria.');
  if(l>=14){defense('Rage of the Gods','Resistência a Necrotic, Psychic e Radiant','forma divina');add('Rage of the Gods',`Voo ${d.speed} ft com Hover; proteção de aliado deixa-o com ${l} PV`,'forma 1/Descanso Longo; proteção gasta Fúria')}
 }else if(n===fold('Path of the Beast')){
  const f=values.beastForm;if(f==='Mordida')attack('Mordida',`1d8 ${abilityBonus(str)} Perfurante`,`Fúria +${rDamage}; 1/turno abaixo de metade dos PV: cura ${pb} PV`);if(f==='Garras')attack('Garras',`1d6 ${abilityBonus(str)} Cortante`,`Fúria +${rDamage}; 1/turno: ataque de garra adicional na ação Atacar`);if(f==='Cauda')attack('Cauda',`1d8 ${abilityBonus(str)} Perfurante`,`Fúria +${rDamage}; Reach; Reação: +1d8 à CA contra ataque que acertaria`);
  if(l>=6){add('Bestial Soul','Armas naturais contam como mágicas');if(values.bestialSoul==='Natação'){movementModes.swim=d.speed;add('Bestial Soul — Natação','Respira debaixo d’água','até a próxima escolha após descanso')}if(values.bestialSoul==='Escalada'){movementModes.climb=d.speed;add('Bestial Soul — Escalada','Escala superfícies difíceis e tetos sem teste','até a próxima escolha após descanso')}if(values.bestialSoul==='Salto')add('Bestial Soul — Salto','Saltos ampliados por teste de Atletismo','até a próxima escolha após descanso')}
  if(l>=10){add('CD de Infectious Fury',conDC,'8 + mod. Constituição + PB');resource('Infectious Fury',pb,'Descanso Longo','Ao acertar com arma natural: salvaguarda de Sabedoria; falha força ataque reativo do alvo ou causa 2d12 Psychic.')}
  if(l>=14)resource('Call the Hunt',pb,'Descanso Longo',`Ao entrar em Fúria, até ${Math.max(1,con)} criatura(s) voluntária(s) a 30 ft; você ganha 5 PV temporários por criatura e cada aliado afetado causa +1d6 1/turno.`)
 }else if(n===fold('Path of Wild Magic')){
  resource('Magic Awareness',pb,'Descanso Longo','Ação; detecta localização de magias e itens mágicos a 60 ft até o fim do próximo turno e identifica escola das magias.');add('CD de Wild Surge',conDC,'8 + mod. Constituição + PB');add('Wild Surge','Rola 1d8 ao entrar em Fúria e aplica o efeito correspondente da tabela','efeitos de teleporte, energia, proteção, terreno, arma de força ou retaliação; usa Constituição quando houver CD');
  if(l>=6)resource('Bolstering Magic',pb,'Descanso Longo','Ação de toque: 1d3 em ataques/testes por 10 min ou recuperação de slot gasto de nível até o resultado; cada criatura só recupera slot assim 1/Descanso Longo.');
  if(l>=10)add('Unstable Backlash','Rola novamente Wild Surge como Reação e substitui o efeito atual','ao sofrer dano ou falhar em salvaguarda durante a Fúria');
  if(l>=14)add('Controlled Surge','Rola dois dados e escolhe; resultados iguais permitem escolher qualquer efeito','ao rolar Wild Surge')
 }else if(n===fold('Path of the Ancestral Guardian')){
  add('Ancestral Protectors','Primeiro inimigo acertado no turno tem Desvantagem contra outros alvos; se ainda acertar outro alvo, esse alvo tem resistência ao dano do ataque','até o início do seu próximo turno durante a Fúria');
  if(l>=6)add('Spirit Shield',`Redução de ${spiritShield(l)} de dano`,'Reação, criatura visível a 30 ft durante a Fúria');
  if(l>=10)resource('Consult the Spirits',1,'Descanso Curto ou Longo','Augury ou Clairvoyance sem slot/componentes materiais; Sabedoria.');
  if(l>=14)add('Vengeful Ancestors','Dano Force igual ao dano impedido por Spirit Shield','contra o agressor')
 }else if(n===fold('Path of the Storm Herald')){
  const env=values.stormAura;add('CD de Storm Aura',conDC,'8 + mod. Constituição + PB');add('Storm Aura','Aura de 10 ft; ativa ao entrar em Fúria e pode ser reativada como Ação Bônus durante a Fúria');
  if(env==='Deserto')add('Storm Aura — Deserto',`${stormFlat(l)} de dano de Fogo`,'todas as outras criaturas na aura de 10 ft');
  if(env==='Mar')add('Storm Aura — Mar',`${stormSea(l)} de dano de Lightning`,'uma criatura na aura; salvaguarda de Destreza, metade no sucesso');
  if(env==='Tundra')add('Storm Aura — Tundra',`${stormFlat(l)} PV temporários`,'criaturas escolhidas na aura');
  if(l>=6&&env==='Deserto'){defense('Storm Soul — Deserto','Resistência a Fogo','permanente');add('Storm Soul — Deserto','Tolerância a calor extremo')}
  if(l>=6&&env==='Mar'){defense('Storm Soul — Mar','Resistência a Lightning','permanente');movementModes.swim=30;add('Storm Soul — Mar','Respira debaixo d’água')}
  if(l>=6&&env==='Tundra'){defense('Storm Soul — Tundra','Resistência a Frio','permanente');add('Storm Soul — Tundra','Tolerância a frio extremo; pode congelar água tocada')}
  if(l>=10)add('Shielding Storm','Compartilha a resistência de Storm Soul com criaturas escolhidas na aura','durante a Fúria');
  if(l>=14&&env==='Deserto')add('Raging Storm — Deserto',`${Math.floor(l/2)} de dano de Fogo em falha de salvaguarda de Destreza`,'Reação quando criatura na aura acerta você');
  if(l>=14&&env==='Mar')add('Raging Storm — Mar','Salvaguarda de Força ou Caído','Reação quando você acerta criatura na aura');
  if(l>=14&&env==='Tundra')add('Raging Storm — Tundra','Salvaguarda de Força ou Speed 0 até o início do seu próximo turno','quando ativa a aura')
 }else if(n===fold('Path of the Demonshard')){
  if(values.demontongue)languages.push(values.demontongue);add('Fiendish Punishment',`${demonDie(l)} ${values.punishmentType||'Fogo/Necrótico'}`,'1/turno durante a Fúria ao sofrer dano de criatura visível a 60 ft; também pode punir agressor de aliado a 10 ft por Reação');
  if(l>=6){defense('Just One Master','Resistência a Psychic','durante a Fúria');add('Just One Master','Vantagem em salvaguardas contra Enfeitiçado e Amedrontado','durante a Fúria');add('Just One Master','Se sofrer Psychic ou fizer salvaguarda contra Enfeitiçado/Amedrontado, deve usar Reação para entrar em Fúria se possível; essa ativação não gasta uso de Fúria')}
  if(l>=10)add('Overflowing Malice',`Espalha os mesmos ${demonDie(l)} para todas as outras criaturas a 10 ft do alvo`);
  if(l>=14){add('CD de Aspect of Tyranny',conDC,'8 + mod. Constituição + PB; -1 por outra criatura afetada pela mesma punição no turno');add('Aspect of Tyranny','Falha em salvaguarda de Sabedoria: +1d10 Necrótico e Amedrontado por até 1 min, com novo teste ao fim dos turnos','Reação quando Fiendish Punishment/Overflowing Malice causa dano')}
 }else if(n===fold('Path of the Brewmaster')){
  tools.push('Suprimentos de Cervejeiro');weaponTraining.push('Armas improvisadas');add('Brewer',`+${l>=10?2:1} em ataque e dano com armas improvisadas`,l>=6?'ataques contam como mágicos':'');resource('Ancestral Spirits',Math.min(6,rages),'Descanso Longo','Quantidade de bebidas preparadas acompanha o máximo de usos de Fúria, até 6. Uma bebida pode ser consumida ao entrar em Fúria.');
  const drink=values.ancestralDrink,stout=l>=10?'1d8':'1d4';if(drink==='Kefir')add('Kefir','Vantagem em salvaguardas de Constituição','durante a Fúria');if(drink==='Kombucha')add('Kombucha','Reação adicional por rodada somente para Ataque de Oportunidade, mantendo 1 Reação por turno','durante a Fúria');if(drink==='Mead')add('Mead','+10 ft de deslocamento e OA contra você com Desvantagem','durante a Fúria');if(drink==='Sake')add('Sake','Vantagem em salvaguardas de Sabedoria','durante a Fúria');if(drink==='Stout')add('Stout',`${stout} PV temporários no início do turno; abaixo de metade dos PV, cura ${stout} em vez disso`,'durante a Fúria');
  if(l>=6&&values.brewersGut==='Beer Jacket')defense("Brewer's Gut — Beer Jacket",'Resistência a Frio','até a próxima escolha após descanso');if(l>=6&&values.brewersGut==='Guts of Steel')defense("Brewer's Gut — Guts of Steel",'Resistência a Veneno','até a próxima escolha após descanso');if(l>=6&&values.brewersGut==='Liquid Courage'){defense("Brewer's Gut — Liquid Courage",'Imunidade a Amedrontado','até a próxima escolha após descanso');add("Brewer's Gut — Liquid Courage",'Ação Bônus: aliado Amedrontado ao alcance repete a salvaguarda contra a condição com Vantagem')}
  if(l>=10){add('Drinking Buddies','Prepara bebida para até 10 criaturas em 30 min durante Descanso Curto ou Longo; benefício dura até o próximo descanso');const buddy=values.drinkingBuddies;if(buddy==='Ginger Ale')add('Drinking Buddies — Ginger Ale','Vantagem em Iniciativa');if(buddy==='Pulque')add('Drinking Buddies — Pulque',`+${Math.max(1,con)} em testes de Carisma`);if(buddy==='Warm Cider')add('Drinking Buddies — Warm Cider','3 PV temporários no início de cada turno')}
  if(l>=14){resource('Fermented Binge',1,'Descanso Curto ou Longo','Ao entrar em Fúria e beber Ancestral Spirits, pode intensificar a bebida.');if(drink==='Kefir'){defense('Fermented Binge — Kefir','Imunidade a dano de Veneno e à condição Poisoned','durante a Fúria');add('Fermented Binge — Kefir','Vantagem em testes para evitar ou encerrar Exhaustion','durante a Fúria')}if(drink==='Kombucha')add('Fermented Binge — Kombucha','Criaturas provocam Ataque de Oportunidade ao se moverem dentro do seu alcance','durante a Fúria');if(drink==='Mead')add('Fermented Binge — Mead','+10 ft adicionais (total +20 ft) e Disengage como Ação Bônus','durante a Fúria');if(drink==='Sake')defense('Fermented Binge — Sake','Resistência a Psychic e imunidade a Enfeitiçado','durante a Fúria');if(drink==='Stout')add('Fermented Binge — Stout','Dobra os PV recuperados ou PV temporários concedidos pela bebida','durante a Fúria')}
 }
 return{name:canonical(d),level:l,rageDamage:rDamage,rages,choices:values,choiceDefs:barbarianSubclassChoiceDefs(d),pending,features,summary,resources,defenses,attacks,movementModes,senses,tools:uniq(tools),languages:uniq(languages),weaponTraining:uniq(weaponTraining)}
}

export function applyBarbarianSubclassMechanics(d){
 const out=barbarianSubclassOutcome(d);if(!out)return d;d.subclassFeatures=out.features;d.subclassMechanics=out;d.tools=uniq([...arr(d.tools),...out.tools]);d.subclassAttacks=out.attacks;d.subclassResources=out.resources;d.subclassDefenses=out.defenses;d.subclassMovementModes={walk:d.speed,...out.movementModes};d.subclassSenses=out.senses;d.subclassLanguages=out.languages;d.subclassWeaponTraining=out.weaponTraining;return d
}
