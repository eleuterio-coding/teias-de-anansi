import{state,arr,num,fold}from'./state.js';

export const STANDARD_BACKGROUND_PACKAGE_B_GP=50;
export const STANDARD_PACKAGE_B_GP=STANDARD_BACKGROUND_PACKAGE_B_GP;
export const WEALTH_BY_LEVEL=Object.freeze({1:0,2:25,3:75,4:150,5:650,6:1250,7:2000,8:3000,9:4000,10:5000,11:6500,12:8500,13:11000,14:13500,15:16000,16:18750,17:21500,18:24000,19:27000,20:30000});
export const WEALTH_TIERS=Object.freeze({
 precaria:Object.freeze({id:'precaria',label:'Precária',multiplier:.90}),
 modesta:Object.freeze({id:'modesta',label:'Modesta',multiplier:.95}),
 regular:Object.freeze({id:'regular',label:'Regular',multiplier:1}),
 estavel:Object.freeze({id:'estavel',label:'Estável',multiplier:1.05}),
 prospera:Object.freeze({id:'prospera',label:'Próspera',multiplier:1.10}),
 privilegiada:Object.freeze({id:'privilegiada',label:'Privilegiada',multiplier:1.15})
});

const BACKGROUND_TIER_BY_NAME=Object.freeze({
 acolyte:'modesta',acolito:'modesta',artisan:'estavel',artesao:'estavel',charlatan:'regular',charlatao:'regular',criminal:'modesta',criminoso:'modesta',entertainer:'regular',artista:'regular',farmer:'modesta',fazendeiro:'modesta',guard:'regular',guarda:'regular',guide:'modesta',guia:'modesta',hermit:'precaria',eremita:'precaria',merchant:'prospera',mercador:'prospera',noble:'privilegiada',nobre:'privilegiada',sage:'modesta',sabio:'modesta',sailor:'regular',marinheiro:'regular',scribe:'estavel',escriba:'estavel',soldier:'regular',soldado:'regular',wayfarer:'precaria',viajante:'precaria'
});

const CURRENCY_FACTORS_CP={
 po:100,gp:100,'gold pieces':100,'pecas de ouro':100,
 pp:1000,pl:1000,'platinum pieces':1000,'pecas de platina':1000,
 sp:10,pr:10,'silver pieces':10,'pecas de prata':10,
 cp:1,pc:1,'copper pieces':1,'pecas de cobre':1,
 ep:50,pe:50,'electrum pieces':50,'pecas de electro':50
};
const CURRENCY_CANONICAL={po:'PO',gp:'PO','gold pieces':'PO','pecas de ouro':'PO',pp:'PL',pl:'PL','platinum pieces':'PL','pecas de platina':'PL',sp:'PP',pr:'PP','silver pieces':'PP','pecas de prata':'PP',cp:'PC',pc:'PC','copper pieces':'PC','pecas de cobre':'PC',ep:'PE',pe:'PE','electrum pieces':'PE','pecas de electro':'PE'};
const coin=gp=>({nome:'PO',quantidade:gp});
const item=(nome,quantidade=1,observacao='')=>({nome,quantidade,...(observacao?{observacao}:{})});

const CLASS_STARTING_PACKAGES=Object.freeze({
 barbarian:Object.freeze([
  {id:'A',itens:[item('Greataxe'),item('Handaxe',4),item("Explorer's Pack"),coin(15)]},
  {id:'B',itens:[coin(75)]}
 ]),
 bard:Object.freeze([
  {id:'A',itens:[item('Leather Armor'),item('Dagger',2),item('Musical Instrument',1,'à escolha'),item("Entertainer's Pack"),coin(19)]},
  {id:'B',itens:[coin(90)]}
 ]),
 cleric:Object.freeze([
  {id:'A',itens:[item('Chain Shirt'),item('Shield'),item('Mace'),item('Holy Symbol'),item("Priest's Pack"),coin(7)]},
  {id:'B',itens:[coin(110)]}
 ]),
 druid:Object.freeze([
  {id:'A',itens:[item('Leather Armor'),item('Shield'),item('Sickle'),item('Druidic Focus',1,'Quarterstaff'),item("Explorer's Pack"),item('Herbalism Kit'),coin(9)]},
  {id:'B',itens:[coin(50)]}
 ]),
 fighter:Object.freeze([
  {id:'A',itens:[item('Chain Mail'),item('Greatsword'),item('Flail'),item('Javelin',8),item("Dungeoneer's Pack"),coin(4)]},
  {id:'B',itens:[item('Studded Leather Armor'),item('Scimitar'),item('Shortsword'),item('Longbow'),item('Arrow',20),item('Quiver'),item("Dungeoneer's Pack"),coin(11)]},
  {id:'C',itens:[coin(155)]}
 ]),
 monk:Object.freeze([
  {id:'A',itens:[item('Spear'),item('Dagger',5),item("Artisan's Tools or Musical Instrument",1,'à escolha conforme proficiência'),item("Explorer's Pack"),coin(11)]},
  {id:'B',itens:[coin(50)]}
 ]),
 paladin:Object.freeze([
  {id:'A',itens:[item('Chain Mail'),item('Shield'),item('Longsword'),item('Javelin',6),item('Holy Symbol'),item("Priest's Pack"),coin(9)]},
  {id:'B',itens:[coin(150)]}
 ]),
 ranger:Object.freeze([
  {id:'A',itens:[item('Studded Leather Armor'),item('Scimitar'),item('Shortsword'),item('Longbow'),item('Arrow',20),item('Quiver'),item('Druidic Focus',1,'sprig of mistletoe'),item("Explorer's Pack"),coin(7)]},
  {id:'B',itens:[coin(150)]}
 ]),
 rogue:Object.freeze([
  {id:'A',itens:[item('Leather Armor'),item('Dagger',2),item('Shortsword'),item('Shortbow'),item('Arrow',20),item('Quiver'),item("Thieves' Tools"),item("Burglar's Pack"),coin(8)]},
  {id:'B',itens:[coin(100)]}
 ]),
 sorcerer:Object.freeze([
  {id:'A',itens:[item('Spear'),item('Dagger',2),item('Arcane Focus',1,'crystal'),item("Dungeoneer's Pack"),coin(28)]},
  {id:'B',itens:[coin(50)]}
 ]),
 warlock:Object.freeze([
  {id:'A',itens:[item('Leather Armor'),item('Sickle'),item('Dagger',2),item('Arcane Focus',1,'orb'),item('Book'),item("Scholar's Pack"),coin(15)]},
  {id:'B',itens:[coin(100)]}
 ]),
 wizard:Object.freeze([
  {id:'A',itens:[item('Dagger',2),item('Arcane Focus',1,'Quarterstaff'),item('Robe'),item('Spellbook'),item("Scholar's Pack"),coin(5)]},
  {id:'B',itens:[coin(55)]}
 ]),
 artificer:Object.freeze([
  {id:'A',itens:[item('Studded Leather Armor'),item('Dagger'),item("Thieves' Tools"),item("Tinker's Tools"),item("Dungeoneer's Pack"),coin(16)]},
  {id:'B',itens:[coin(150)]}
 ])
});

const CLASS_ALIASES=Object.freeze({barbaro:'barbarian',bardo:'bard',clerigo:'cleric',druida:'druid',guerreiro:'fighter',monge:'monk',paladino:'paladin',patrulheiro:'ranger',ladino:'rogue',feiticeiro:'sorcerer',bruxo:'warlock',mago:'wizard',artifice:'artificer'});
const currentClass=()=>state.catalogs.classes.find(x=>x.id===state.c?.refs?.class)||null;
const currentBackground=()=>state.catalogs.backgrounds.find(x=>x.id===state.c?.refs?.background)||null;
function classKey(klass){const values=[klass?.slug,klass?.name,klass?.nome,klass?.originalName].map(fold).filter(Boolean);for(const value of values){if(CLASS_STARTING_PACKAGES[value])return value;if(CLASS_ALIASES[value])return CLASS_ALIASES[value]}return''}
function copyPackage(pkg){return pkg?{id:String(pkg.id||'A').toUpperCase(),itens:arr(pkg.itens).map(row=>({...row}))}:null}

export function currencyFactorCp(name){return CURRENCY_FACTORS_CP[fold(name)]||0}
export function isCurrencyItem(row){return currencyFactorCp(row?.nome||row?.name)>0}
export function currencyItemCp(row){const factor=currencyFactorCp(row?.nome||row?.name);return factor?Math.round(num(row?.quantidade??row?.quantity??1)*factor):0}
export function itemsCurrencyCp(items){return arr(items).reduce((sum,row)=>sum+currencyItemCp(row),0)}
export function physicalItems(items){return arr(items).filter(row=>!isCurrencyItem(row))}

function parsePart(part){
 const clean=String(part||'').trim().replace(/[.;]+$/,'');if(!clean)return null;
 const currency=clean.match(/^(\d+(?:[.,]\d+)?)\s*(PO|GP|PP|PL|SP|PR|CP|PC|EP|PE)$/i);
 if(currency){const key=fold(currency[2]),canonical=CURRENCY_CANONICAL[key]||currency[2].toUpperCase();return{nome:canonical,quantidade:Number(currency[1].replace(',','.'))}}
 const qty=clean.match(/^(\d+)\s+(.+)$/);if(qty)return{nome:qty[2].trim(),quantidade:Number(qty[1])};
 return{nome:clean,quantidade:1}
}
export function parseEquipmentText(text){
 const normalized=String(text||'').trim().replace(/[.;]+$/,'').replace(/\s+e\s+(?=\d+(?:[.,]\d+)?\s*(?:PO|GP|PP|PL|SP|PR|CP|PC|EP|PE)\b)/gi,', ');
 return normalized.split(/\s*,\s*/).map(parsePart).filter(Boolean)
}

export function packageA(bg){
 const structured=arr(bg?.equipmentOptions).find(option=>String(option?.id).toUpperCase()==='A')||arr(bg?.equipmentOptions)[0];
 const items=structured?arr(structured.itens).map(row=>({...row})):parseEquipmentText(bg?.equipmentText);
 return{id:'A',itens:items}
}
export function backgroundPackageOptions(bg){
 if(!bg)return[];
 const a=packageA(bg),explicitB=arr(bg?.equipmentOptions).find(option=>String(option?.id).toUpperCase()==='B');
 return[a,explicitB?copyPackage(explicitB):{id:'B',itens:[coin(STANDARD_BACKGROUND_PACKAGE_B_GP)]}]
}
export function selectedBackgroundPackage(bg,choice='A'){
 const options=backgroundPackageOptions(bg);if(!options.length)return null;
 const wanted=String(choice||'A').toUpperCase(),found=options.find(option=>String(option.id).toUpperCase()===wanted);return found||options[0]
}
export function packageCurrencyCp(bg,choice='A'){return itemsCurrencyCp(selectedBackgroundPackage(bg,choice)?.itens)}
export function packagePhysicalItems(bg,choice='A'){return physicalItems(selectedBackgroundPackage(bg,choice)?.itens)}

export function classPackageOptions(klass=currentClass()){
 const key=classKey(klass),rows=CLASS_STARTING_PACKAGES[key];return arr(rows).map(copyPackage).filter(Boolean)
}
export function selectedClassPackage(klass=currentClass(),choice='A'){
 const options=classPackageOptions(klass);if(!options.length)return null;
 const wanted=String(choice||'A').toUpperCase(),found=options.find(option=>String(option.id).toUpperCase()===wanted);return found||options[0]
}
export function classPackageCurrencyCp(klass=currentClass(),choice='A'){return itemsCurrencyCp(selectedClassPackage(klass,choice)?.itens)}
export function classPackagePhysicalItems(klass=currentClass(),choice='A'){return physicalItems(selectedClassPackage(klass,choice)?.itens)}

export function formatPhysicalItems(items){
 const rows=physicalItems(items);if(!rows.length)return'—';
 return rows.map(row=>{const q=Math.max(1,num(row?.quantidade)||1),name=row?.nome||row?.name||'Item',obs=row?.observacao?` (${row.observacao})`:'';return`${q>1?`${q}× `:''}${name}${obs}`}).join(', ')
}
export function clampCreationLevel(value){return Math.max(1,Math.min(20,num(value)||1))}
export function wealthBaseGp(level){const l=clampCreationLevel(level);return l>=2?WEALTH_BY_LEVEL[l]||0:0}
function tierKey(value){const key=fold(value).replace(/[^a-z]/g,'');return WEALTH_TIERS[key]?key:''}
export function backgroundWealthProfile(bg=currentBackground()){
 const explicit=tierKey(bg?.wealthTier||bg?.wealth_tier||bg?.faixaEconomica||bg?.faixa_economica);
 if(explicit)return WEALTH_TIERS[explicit];
 const names=[bg?.name,bg?.nome,bg?.pt,bg?.originalName,bg?.original_name].map(fold).filter(Boolean);
 for(const name of names){const mapped=BACKGROUND_TIER_BY_NAME[name];if(mapped)return WEALTH_TIERS[mapped]}
 return WEALTH_TIERS.regular
}
export function wealthGp(level,bg=currentBackground()){
 const base=wealthBaseGp(level);if(!base)return 0;return Math.round(base*backgroundWealthProfile(bg).multiplier)
}
export function creationBudgetBreakdown(bg=currentBackground(),bgChoice='A',level=1,klass=currentClass(),classChoice=null){
 const l=clampCreationLevel(level),resolvedClassChoice=String(classChoice||state.c?.choices?.class?.equipment||'A').toUpperCase(),resolvedBgChoice=String(bgChoice||'A').toUpperCase(),profile=backgroundWealthProfile(bg),baseWealthGp=wealthBaseGp(l),adjustedWealthGp=l>=2?Math.round(baseWealthGp*profile.multiplier):0,classCp=classPackageCurrencyCp(klass,resolvedClassChoice),backgroundCp=packageCurrencyCp(bg,resolvedBgChoice),wealthCp=adjustedWealthGp*100;
 return{level:l,classChoice:resolvedClassChoice,backgroundChoice:resolvedBgChoice,classCp,backgroundCp,baseWealthGp,wealthTier:profile.id,wealthTierLabel:profile.label,wealthMultiplier:profile.multiplier,adjustedWealthGp,wealthCp,totalCp:classCp+backgroundCp+wealthCp}
}
export function creationBudgetCp(bg=currentBackground(),bgChoice='A',level=1,klass=currentClass(),classChoice=null){return creationBudgetBreakdown(bg,bgChoice,level,klass,classChoice).totalCp}
export function creationPhysicalItems(bg=currentBackground(),bgChoice='A',level=1,klass=currentClass(),classChoice=null){
 const resolvedClassChoice=String(classChoice||state.c?.choices?.class?.equipment||'A').toUpperCase(),resolvedBgChoice=String(bgChoice||'A').toUpperCase();
 return[
  ...classPackagePhysicalItems(klass,resolvedClassChoice).map(row=>({...row,_startingSource:'Pacote inicial · Classe'})),
  ...packagePhysicalItems(bg,resolvedBgChoice).map(row=>({...row,_startingSource:'Pacote inicial · Antecedente'}))
 ]
}
