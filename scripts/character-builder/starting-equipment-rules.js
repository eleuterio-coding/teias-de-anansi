import{arr,num,fold}from'./state.js';

export const STANDARD_PACKAGE_B_GP=75;
export const WEALTH_BY_LEVEL=Object.freeze({1:0,2:225,3:325,4:500,5:1150,6:1450,7:1900,8:2500,9:3500,10:4850,11:11800,12:13200,13:14900,14:17050,15:19650,16:22850,17:75200,18:79450,19:84600,20:90800});

const CURRENCY_FACTORS_CP={
 po:100,gp:100,'gold pieces':100,'pecas de ouro':100,
 pp:1000,pl:1000,'platinum pieces':1000,'pecas de platina':1000,
 sp:10,pr:10,'silver pieces':10,'pecas de prata':10,
 cp:1,pc:1,'copper pieces':1,'pecas de cobre':1,
 ep:50,pe:50,'electrum pieces':50,'pecas de electro':50
};
const CURRENCY_CANONICAL={po:'PO',gp:'PO','gold pieces':'PO','pecas de ouro':'PO',pp:'PL',pl:'PL','platinum pieces':'PL','pecas de platina':'PL',sp:'PP',pr:'PP','silver pieces':'PP','pecas de prata':'PP',cp:'PC',pc:'PC','copper pieces':'PC','pecas de cobre':'PC',ep:'PE',pe:'PE','electrum pieces':'PE','pecas de electro':'PE'};

export function currencyFactorCp(name){return CURRENCY_FACTORS_CP[fold(name)]||0}
export function isCurrencyItem(item){return currencyFactorCp(item?.nome||item?.name)>0}
export function currencyItemCp(item){const factor=currencyFactorCp(item?.nome||item?.name);return factor?Math.round(num(item?.quantidade??item?.quantity??1)*factor):0}
export function itemsCurrencyCp(items){return arr(items).reduce((sum,item)=>sum+currencyItemCp(item),0)}
export function physicalItems(items){return arr(items).filter(item=>!isCurrencyItem(item))}

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
 const items=structured?arr(structured.itens).map(item=>({...item})):parseEquipmentText(bg?.equipmentText);
 return{id:'A',itens:items}
}
export function backgroundPackageOptions(bg){
 if(!bg)return[];
 return[packageA(bg),{id:'B',itens:[{nome:'PO',quantidade:STANDARD_PACKAGE_B_GP}]}]
}
export function selectedBackgroundPackage(bg,choice='A'){
 const id=String(choice||'A').toUpperCase()==='B'?'B':'A';return backgroundPackageOptions(bg).find(option=>option.id===id)||null
}
export function packageCurrencyCp(bg,choice='A'){return itemsCurrencyCp(selectedBackgroundPackage(bg,choice)?.itens)}
export function packagePhysicalItems(bg,choice='A'){return physicalItems(selectedBackgroundPackage(bg,choice)?.itens)}
export function formatPhysicalItems(items){
 const rows=physicalItems(items);if(!rows.length)return'—';
 return rows.map(item=>{const q=Math.max(1,num(item?.quantidade)||1),name=item?.nome||item?.name||'Item',obs=item?.observacao?` (${item.observacao})`:'';return`${q>1?`${q}× `:''}${name}${obs}`}).join(', ')
}
export function clampCreationLevel(value){return Math.max(1,Math.min(20,num(value)||1))}
export function wealthGp(level){const l=clampCreationLevel(level);return l>=2?WEALTH_BY_LEVEL[l]||0:0}
export function creationBudgetCp(bg,choice,level){const l=clampCreationLevel(level);return l>=2?Math.round(wealthGp(l)*100):packageCurrencyCp(bg,choice)}
export function creationPhysicalItems(bg,choice,level){return clampCreationLevel(level)===1?packagePhysicalItems(bg,choice):[]}
