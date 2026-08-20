(()=>{
'use strict';
const M={Cleave:'Trespassar',Graze:'Raspar',Nick:'Talho',Push:'Empurrar',Sap:'Debilitar',Slow:'Lentidão',Topple:'Derrubar',Vex:'Acossar',Disarm:'Desarmar',Bleed:'Sangramento',Form:'Forma',Deflect:'Desviar',Parry:'Aparar',Critic:'Crítico',Distance:'Distância'};
const W={Greataxe:'Machado Grande',Halberd:'Alabarda',Glaive:'Glaive',Greatsword:'Espada Grande',Dagger:'Adaga','Light Hammer':'Martelo Leve',Sickle:'Foice',Scimitar:'Cimitarra',Greatclub:'Clava Grande',Pike:'Pique',Warhammer:'Martelo de Guerra','Heavy Crossbow':'Besta Pesada',Mace:'Maça',Spear:'Lança',Flail:'Mangual',Longsword:'Espada Longa',Morningstar:'Maça-estrela','War Pick':'Picareta de Guerra',Club:'Clava',Javelin:'Azagaia','Light Crossbow':'Besta Leve',Sling:'Funda',Whip:'Chicote',Longbow:'Arco Longo',Musket:'Mosquete','Automatic Rifle':'Rifle Automático','Hunting Rifle':'Rifle de Caça','Laser Rifle':'Rifle de Laser',Handaxe:'Machado de Mão',Dart:'Dardo',Shortbow:'Arco Curto',Rapier:'Rapieira',Shortsword:'Espada Curta',Blowgun:'Zarabatana','Hand Crossbow':'Besta de Mão',Pistol:'Pistola','Semiautomatic Pistol':'Pistola Semiautomática','Laser Pistol':'Pistola de Laser',Shotgun:'Espingarda',Revolver:'Revólver','Antimatter Rifle':'Rifle de Antimatéria',Quarterstaff:'Bordão',Battleaxe:'Machado de Batalha',Lance:'Lança de Cavalaria',Maul:'Malho',Trident:'Tridente','Triple Nunchaku':'Nunchaku Triplo','Hook Sword':'Espada de Gancho','Kris Dagger':'Adaga Kris','Metal Card':'Carta Metálica',Needle:'Agulha',Stiletto:'Estilete','Weighted Chain':'Corrente com Peso','Colossal Axe':'Machado Colossal',Wand:'Varinha',Rod:'Bastão',Staff:'Bordão','Orb / Crystal':'Orbe / Cristal'};
const T={Bleeding:'Sangrando',Prone:'Caído','Weapon Mastery':'Maestria de Arma','5 pés':'1,5 m','10 pés':'3 m','15 pés':'4,5 m','salvaguarda':'teste de resistência','Salvaguarda':'Teste de Resistência'};
const pairs=o=>Object.entries(o).sort((a,b)=>b[0].length-a[0].length);
function tr(s){let o=String(s??'');for(const[k,v]of pairs({...W,...M,...T}))o=o.split(k).join(v);return o}
function setText(n,v){if(n&&v!==n.textContent)n.textContent=v}
function setHtml(n,v){if(n&&v!==n.innerHTML)n.innerHTML=v}
let running=false;
function scan(){if(running)return;running=true;try{
 document.querySelectorAll('.item summary strong').forEach(n=>{const v=M[n.textContent.trim()];if(v)setText(n,v)});
 document.querySelectorAll('#filtro option').forEach(n=>{const v=M[n.textContent.trim()];if(v)setText(n,v)});
 document.querySelectorAll('.chip').forEach(n=>{const v=W[n.textContent.trim()];if(v)setText(n,v)});
 document.querySelectorAll('#opcionais .campo').forEach(n=>setHtml(n,tr(n.innerHTML)));
 document.querySelectorAll('.corpo p,.campo span,.variant p,.warning').forEach(n=>{if(!n.closest('.fonte'))setText(n,tr(n.textContent))});
 document.querySelectorAll('.corpo h3').forEach(n=>setText(n,tr(n.textContent)));
 document.documentElement.dataset.maestriasPtbr='ativo';
}finally{running=false}}
scan();new MutationObserver(()=>queueMicrotask(scan)).observe(document.body,{childList:true,subtree:true});
})();