import{state,blank,json,arr,fold,esc}from'./character-builder/state.js';
import{loadSpecies}from'./character-builder/catalogs.js?v=20261031-idiomas-40-ptbr1';
import{nativeLanguagesForSpecies}from'./species-language-rules.js?v=20261031-idiomas-40-ptbr1';

const NOMES_NATIVOS_PTBR={Common:'Comum',Draconic:'Dracônico',Dwarvish:'Anão',Elvish:'Élfico',Giant:'Gigante',Gnomish:'Gnômico',Goblin:'Goblin',Halfling:'Pequenino',Orc:'Orc',Aquan:'Aquano',Celestial:'Celestial',Infernal:'Infernal',Primordial:'Primordial',Sylvan:'Silvestre',Gith:'Gith',Gnoll:'Gnoll',Harpy:'Harpia',Quori:'Quori',Serpentine:'Serpentino'};
const nomesNativos=items=>items.filter(x=>!['Minotaur','Minotauro','Kharolian','Kharoliano'].includes(x)).map(x=>NOMES_NATIVOS_PTBR[x]||x);

const $=id=>document.getElementById(id);
let DATA=[];

function lineageTraits(lineage){return arr(lineage?.traits)}
function sourceLabel(lineage,species){return lineage?.source||species?.source||'Fonte não informada'}
function statusLabel(row){return row?.ruleset==='5e'?'Legado 5e compatível':'5.5e / 2024'}
function searchable(species){return fold([
 species.name,species.source,species.lineageLabel,...nomesNativos(arr(species.nativeLanguages).length?species.nativeLanguages:nativeLanguagesForSpecies(species.name)),...arr(species.traits).flatMap(t=>[t.name,t.originalName,t.text]),
 ...arr(species.lineages).flatMap(l=>[l.name,...arr(l.aliases),l.source,...lineageTraits(l).flatMap(t=>[t.name,t.originalName,t.text])])
].filter(Boolean).join(' '))}
let GLOSSARIO=new Map(),GLOSSARIO_RX=null;
function carregarGlossario(termos){
 const entries=Object.entries(termos||{}).filter(([original,traducao])=>original&&typeof traducao==='string'&&traducao);
 GLOSSARIO=new Map(entries.map(([original,traducao])=>[original.toLocaleLowerCase('pt-BR'),traducao]));
 const escaped=entries.sort((a,b)=>b[0].length-a[0].length).map(([key])=>key.replace(/[.*+?^$()|[\]{}]/g,'\\const medida=v=>String(v??'')'));
 GLOSSARIO_RX=escaped.length?new RegExp('(?<![\\p{L}\\p{N}])('+escaped.join('|')+')(?![\\p{L}\\p{N}])','giu'):null;
}
function traduzirTermos(v){return GLOSSARIO_RX?String(v||'').replace(GLOSSARIO_RX,t=>GLOSSARIO.get(t.toLocaleLowerCase('pt-BR'))||t):String(v||'')}
const medida=v=>String(v??'')
 .replace(/(\d+(?:[.,]\d+)?)\s*(?:ft\.?|feet|pés)\b/gi,(_,n)=>formatNumber(parseFloat(n.replace(',','.'))*.3)+' m')
 .replace(/(\d+(?:[.,]\d+)?)\s*(?:lb\.?|lbs\.?|libras?)\b/gi,(_,n)=>formatNumber(parseFloat(n.replace(',','.'))*.45359237)+' kg');
function formatNumber(n){return (Math.round(n*100)/100).toLocaleString('pt-BR',{maximumFractionDigits:2})}
const traduz=txt=>traduzirTermos(medida(txt)).replace(/\bMedium\b/gi,'Médio').replace(/\bSmall\b/gi,'Pequeno')
 .replace(/\bLarge\b/gi,'Grande').replace(/\bTiny\b/gi,'Minúsculo')
 .replace(/\bDarkvision\b/gi,'Visão no Escuro').replace(/\bFlight\b/gi,'Voo')
 .replace(/\bHumanoid\b/gi,'Humanoide').replace(/\bFey\b/gi,'Fada')
 .replace(/\bSpeed\b/gi,'Deslocamento').replace(/\bLong Rest\b/gi,'Descanso Longo')
 .replace(/\bBonus Action\b/gi,'Ação Bônus').replace(/\bSaving Throw\b/gi,'Salvaguarda');
const livro=orig=>HubBiblioteca.livro(orig||'Não informado');
function deslocamentoVoo(species){
 const traits=[...arr(species.traits),...arr(species.lineages).flatMap(l=>arr(l.traits))];
 const voo=traits.filter(t=>/^(?:Flight|Voo|Heavenly Wings|Asas Celestiais|Draconic Flight|Voo Dracônico)$/i.test(t.originalName||t.name||'')||/\bdeslocamento de voo\b/i.test(t.text||''));
 if(!voo.length)return'';
 const terrestre=formatNumber((Number(species.speed)||30)*.3)+' m';
 const temporario=voo.some(t=>/nível\s+\d+|temporári|até.*minutos|aç[aã]o b[oô]nus/i.test(t.text||''));
 return 'Deslocamento de Voo: '+terrestre+(temporario?' (quando o traço estiver ativo)':' (conforme traço racial)');
}
function renderTrait(t){return'<article class="trait"><h4>'+esc(traduz(t.name||t.originalName||'Traço'))+'</h4><p>'+esc(traduz(t.text||''))+'</p></article>'}
function renderLineage(lineage,species){
 const kind=species.lineageLabel||'Linhagem',source=livro(sourceLabel(lineage,species));
 return'<article class="linhagem"><div class="linhagem-head"><h4>'+esc(traduz(kind))+': '+esc(traduz(lineage.name))+'</h4></div>'+
 (lineage.replaceBaseTraits?'<p class="mini">Esta escolha substitui os traços da raça-base.</p>':lineage.replaceTraitNames?.length?'<p class="mini">Substitui: '+esc(arr(lineage.replaceTraitNames).map(traduz).join(', '))+'.</p>':'')+
 lineageTraits(lineage).map(renderTrait).join('')+
 '<footer class="livro-raca"><strong>Livro:</strong> '+esc(source)+'</footer></article>';
}
function renderSpecies(species){
 const lineages=arr(species.lineages),fly=deslocamentoVoo(species),base=livro(species.source);
 return'<details class="especie" data-id="'+esc(species.id)+'"><summary><strong>'+esc(traduz(species.name))+'</strong></summary><div class="corpo"><div class="stats">'+
 '<div class="stat"><strong>Tamanho</strong>'+esc(arr(species.sizes).map(traduz).join(' / ')||'—')+'</div>'+
 '<div class="stat"><strong>Deslocamento</strong>'+formatNumber((Number(species.speed)||30)*.3)+' m</div>'+
 (fly?'<div class="stat"><strong>Voo</strong>'+esc(fly.replace(/^Deslocamento de Voo: /,''))+'</div>':'')+
 '<div class="stat"><strong>Idiomas</strong>'+esc(nomesNativos(arr(species.nativeLanguages).length?species.nativeLanguages:nativeLanguagesForSpecies(species.name)).join(', ')||'—')+'</div></div>'+
 '<section class="bloco"><h3>Traços da raça-base</h3>'+ (arr(species.traits).map(renderTrait).join('')||'<p class="muted">Os traços são definidos pela linhagem escolhida.</p>')+'</section>'+
 (lineages.length?'<section class="bloco"><h3>'+esc(traduz(species.lineageLabel||'Linhagens / escolhas'))+'</h3>'+lineages.map(l=>renderLineage(l,species)).join('')+'</section>':'')+
 '<footer class="livro-raca"><strong>Livro:</strong> '+esc(base)+'</footer></div></details>';
}
function buildSources(){
 const sel=$('fonte'),sources=[...new Set(DATA.flatMap(s=>[s.source,...arr(s.lineages).map(l=>l.source)].filter(Boolean)))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 sel.innerHTML='<option value="">Todas as fontes</option>'+sources.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')
}
function render(){
 const q=fold($('busca').value),rs=$('ruleset').value,src=$('fonte').value;
 const rows=DATA.filter(s=>{
  if(rs&&s.ruleset!==rs&&!arr(s.lineages).some(l=>l.ruleset===rs))return false;
  if(src&&s.source!==src&&!arr(s.lineages).some(l=>l.source===src))return false;
  return!q||searchable(s).includes(q)
 });
 $('resultado').textContent='';
 $('lista').innerHTML=rows.map(renderSpecies).join('')||'<div class="vazio">Nenhuma raça corresponde aos filtros.</div>';const pedido=new URLSearchParams(location.search).get('item');if(pedido){const x=rows.find(x=>fold(x.name)===fold(pedido)||fold(x.id)===fold(pedido)||fold(state.LOCSP.species?.[pedido])===fold(x.name));const el=x?[...document.querySelectorAll('.especie')].find(d=>d.dataset.id===x.id):null;if(el)el.open=true}
}

async function init(){
 state.c=blank();
 const[g,loc,glossario]=await Promise.all([
  json('dados/localizacao-ptbr-global.json').catch(()=>({})),
  json('dados/localizacao-ptbr-especies.json').catch(()=>({species:{},lineages:{},traits:{}})),
  json('dados/localizacao-ptbr-termos-mecanicos.json').catch(()=>({termos:{}}))
 ]);
 state.G=g;state.LOCSP=loc;carregarGlossario(glossario.termos);DATA=await loadSpecies();state.catalogs.species=DATA;
 const lineages=DATA.reduce((n,s)=>n+arr(s.lineages).length,0),playable=DATA.length+lineages;
 $('resumo').textContent=`${DATA.length} raças-base · ${lineages} linhagens, legados e ancestralidades · ${playable} opções jogáveis.`;
 buildSources();['busca','ruleset','fonte'].forEach(id=>$(id).addEventListener(id==='busca'?'input':'change',render));render()
}

init().catch(err=>{
 $('resumo').textContent='Falha ao carregar o catálogo de raças.';
 $('lista').innerHTML=`<div class="erro"><strong>Falha de carregamento.</strong><br>${esc(err.message)}</div>`;
 console.error('[race-library]',err)
});
