/* Padrões de apresentação da Biblioteca: textos, medidas, livros e verbetes. */
(function(){
'use strict';
const EQUIP={
'Acid':'Ácido','Alchemist’s Fire':'Fogo Alquímico','Ammunition':'Munição','Antitoxin':'Antitoxina','Arcane Focus':'Foco Arcano',
'Backpack':'Mochila','Ball Bearings':'Esferas de Metal','Barrel':'Barril','Basket':'Cesto','Bedroll':'Saco de Dormir',
'Bell':'Sino','Blanket':'Cobertor','Block and Tackle':'Roldana e Polia','Book':'Livro','Bottle, Glass':'Garrafa de Vidro',
'Bucket':'Balde','Burglar’s Pack':'Pacote de Assaltante','Caltrops':'Estrepes','Candle':'Vela','Case, Crossbow Bolt':'Estojo para Virotes',
'Case, Map or Scroll':'Tubo para Mapas ou Pergaminhos','Chain':'Corrente','Chest':'Baú','Climber’s Kit':'Kit de Escalada',
'Clothes, Fine':'Roupas Finas','Clothes, Traveler’s':'Roupas de Viajante','Component Pouch':'Bolsa de Componentes',
'Costume':'Fantasia','Crowbar':'Pé de Cabra','Diplomat’s Pack':'Pacote de Diplomata','Druidic Focus':'Foco Druídico',
'Dungeoneer’s Pack':'Pacote de Explorador de Masmorras','Entertainer’s Pack':'Pacote de Artista','Explorer’s Pack':'Pacote de Explorador',
'Flask':'Frasco','Grappling Hook':'Gancho de Escalada','Healer’s Kit':'Kit de Curandeiro','Holy Symbol':'Símbolo Sagrado',
'Holy Water':'Água Benta','Hunting Trap':'Armadilha de Caça','Ink':'Tinta','Ink Pen':'Pena de Escrita','Jug':'Jarro',
'Ladder':'Escada','Lamp':'Lâmpada','Lantern, Bullseye':'Lanterna Direcional','Lantern, Hooded':'Lanterna Coberta',
'Lock':'Cadeado','Magnifying Glass':'Lupa','Manacles':'Algemas','Map':'Mapa','Mirror':'Espelho','Net':'Rede',
'Oil':'Óleo','Paper':'Papel','Parchment':'Pergaminho','Perfume':'Perfume','Poison, Basic':'Veneno Básico',
'Pole':'Vara','Pot, Iron':'Panela de Ferro','Pouch':'Bolsa','Priest’s Pack':'Pacote de Sacerdote',
'Quiver':'Aljava','Ram, Portable':'Aríete Portátil','Rations':'Rações','Robe':'Manto','Rope':'Corda',
'Sack':'Saco','Scholar’s Pack':'Pacote de Estudioso','Shovel':'Pá','Signal Whistle':'Apito de Sinalização',
'Spikes, Iron':'Cravos de Ferro','Spyglass':'Luneta','String':'Barbante','Tent':'Tenda','Tinderbox':'Caixa de Fogo',
'Torch':'Tocha','Vial':'Ampola','Waterskin':'Cantil','Bright Fungal Cloak':'Capa Fúngica Brilhante',
'Desert Clothing':'Roupas do Deserto','Devil Mask':'Máscara Diabólica','Garb of Light and Shadow':'Traje de Luz e Sombra',
'Genie Robe':'Manto de Gênio','Locking Spellbook':'Grimório com Fechadura','Monster Camouflage':'Camuflagem de Monstro',
'Warm Fungal Clothing':'Roupas Fúngicas Quentes','Winter Camouflage':'Camuflagem Invernal'
};
const TOOLS={
"Alchemist's Supplies":"Suprimentos de Alquimista","Brewer's Supplies":"Suprimentos de Cervejeiro",
"Calligrapher's Supplies":"Suprimentos de Calígrafo","Carpenter's Tools":"Ferramentas de Carpinteiro",
"Cartographer's Tools":"Ferramentas de Cartógrafo","Cobbler's Tools":"Ferramentas de Sapateiro",
"Cook's Utensils":"Utensílios de Cozinheiro","Glassblower's Tools":"Ferramentas de Vidreiro",
"Jeweler's Tools":"Ferramentas de Joalheiro","Leatherworker's Tools":"Ferramentas de Coureiro",
"Mason's Tools":"Ferramentas de Pedreiro","Painter's Supplies":"Suprimentos de Pintor",
"Potter's Tools":"Ferramentas de Oleiro","Smith's Tools":"Ferramentas de Ferreiro",
"Tinker's Tools":"Ferramentas de Funileiro","Weaver's Tools":"Ferramentas de Tecelão",
"Woodcarver's Tools":"Ferramentas de Entalhador","Disguise Kit":"Kit de Disfarce",
"Forgery Kit":"Kit de Falsificação","Gaming Set":"Conjunto de Jogos","Herbalism Kit":"Kit de Herbalismo",
"Musical Instrument":"Instrumento Musical","Navigator's Tools":"Ferramentas de Navegador",
"Poisoner's Kit":"Kit de Envenenador","Thieves' Tools":"Ferramentas de Ladrão"
};
const SKILLS={Acrobatics:'Acrobacia',AnimalHandling:'Adestrar Animais',Arcana:'Arcanismo',Athletics:'Atletismo',
Deception:'Enganação',History:'História',Insight:'Intuição',Intimidation:'Intimidação',Investigation:'Investigação',
Medicine:'Medicina',Nature:'Natureza',Perception:'Percepção',Performance:'Atuação',Persuasion:'Persuasão',
Religion:'Religião',SleightofHand:'Prestidigitação',Stealth:'Furtividade',Survival:'Sobrevivência'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function livro(v){
 let s=String(v||'').trim();
 if(/(?:Player[’']?s Handbook|Livro do Jogador)/i.test(s))return 'Livro do Jogador · 2024';
 s=s.replace(/^Forgotten Realms\s*\(([^)]+)\)$/i,'Forgotten Realms: $1');
 s=s.replace(/^Eberron\s*\(([^)]+)\)$/i,'Eberron: $1');
 return s.replace(/\s*\((?:19|20)\d{2}\)\s*$/,'');
}
function equipamento(v){return EQUIP[v]||v||'—'}
function ferramenta(v){return TOOLS[v]||v||'—'}
function pericia(v){return SKILLS[String(v||'').replace(/[^A-Za-z]/g,'')]||v||'—'}
function moedas(v){
 return String(v??'').replace(/\bGP\b/gi,'PO').replace(/\bSP\b/gi,'PP').replace(/\bCP\b/gi,'PC')
 .replace(/\bEP\b/gi,'5 PP').replace(/\bPP\s*\(platinum\b/gi,'PL (platina');
}
function medidas(v){
 return moedas(v).replace(/(\d+)(?:\s*½|½)?\s*(?:lb\.?|lbs\.?|libras?)\b/gi,(m,n)=>{
   const n2=/½/.test(m)?Number(n)+0.5:Number(n);return (Math.round(n2*.45359237*100)/100).toLocaleString('pt-BR',{maximumFractionDigits:2})+' kg';
 }).replace(/(\d+(?:[,.]\d+)?)\s*(?:ft\.?|feet|pés)\b/gi,(_,n)=>
   (Math.round(Number(n.replace(',','.'))*.3048*10)/10).toLocaleString('pt-BR',{maximumFractionDigits:1})+' m')
 .replace(/\bVaries\b/gi,'Varia').replace(/\bNone\b/gi,'Nenhum').replace(/\bSee text\b/gi,'Ver descrição');
}
function regraUrl(original){return 'regras.html?original='+encodeURIComponent(original)}
function regra(label,original){return '<a class="hub-verbete" href="'+esc(regraUrl(original||label))+'">'+esc(label)+'</a>'}
function equipamentoUrl(nome){return 'equipamentos-aventura.html?item='+encodeURIComponent(nome)}
function ferramentaUrl(nome){return 'ferramentas.html?item='+encodeURIComponent(nome)}
function item(label,url){return '<a class="hub-verbete" href="'+esc(url)+'">'+esc(label)+'</a>'}
function moedaHtml(v){
 return esc(medidas(v)).replace(/\b(PL|PO|PP|PC)\b/g,(_,m)=>item(m,'comercio-e-despesas.html#moedas'));
}
function termosHtml(v){
 let x=esc(medidas(v));
 x=x.replace(/\b(PL|PO|PP|PC)\b/g,(_,m)=>item(m,'comercio-e-despesas.html#moedas'));
 x=x.replace(/\b(descanso longo|descanso curto|Dados de Vida)\b/gi,(m)=>regra(m,normalize(m)==='descanso longo'?'Long Rest':normalize(m)==='descanso curto'?'Short Rest':'Hit Dice'));
 x=x.replace(/\b(galões|galão)\b/gi,m=>item(m,equipamentoUrl('Jug')));
 return x;
}
function periciasHtml(v){return String(v||'').split(/\s*;\s*|\s*,\s*|\s+e\s+/).filter(Boolean)
 .map(p=>regra(pericia(p),'Skill: '+p.trim())).join(', ')||'—'}
window.HubBiblioteca={esc,normalize,livro,equipamento,ferramenta,pericia,moedas,medidas,regraUrl,regra,item,equipamentoUrl,ferramentaUrl,moedaHtml,termosHtml,periciasHtml};
})();