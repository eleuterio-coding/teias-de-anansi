(function(){
'use strict';
let ITENS=[],erros=[],carregando=true;
const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(page,name)=>page+'?item='+encodeURIComponent(name);
function add(categoria,nome,custo,href,fonte){
 if(!nome)return;
 ITENS.push({categoria,nome,custo:String(custo||'Não informado'),href,fonte:String(fonte||'—')});
}
function renderPrecos(query='',grupo=''){
 const el=document.getElementById('precos-equipamentos');if(!el)return;
 if(grupo&&grupo!=='catalogos'){el.hidden=true;return;}
 el.hidden=false;
 const q=fold(query).trim();
 if(!q&&grupo!=='catalogos'){el.innerHTML='<p class="roteamento">Os preços de equipamentos são consultados nos próprios catálogos. Para localizá-los aqui, digite um nome, preço ou categoria na busca acima, ou selecione “Preços de equipamentos”.</p>';return;}
 const matches=ITENS.filter(x=>!q||fold([x.categoria,x.nome,x.custo,x.fonte].join(' ')).includes(q));
 const shown=matches.slice(0,80);
 let html='<section class="tabela-card" id="precos"><h3>Preços pesquisáveis dos catálogos</h3><p>Os registros abaixo são referências aos módulos originais; não existem cópias independentes dos itens nesta página. Os valores variáveis dependem da variante.</p>';
 if(carregando)html+='<p>Carregando preços dos catálogos…</p>';
 if(erros.length)html+='<p>Não foi possível consultar todos os catálogos: '+esc(erros.join(', '))+'.</p>';
 html+='<p>'+matches.length+' preços encontrados'+(matches.length>80?' — mostrando 80; refine a busca':'')+'.</p>';
 if(shown.length)html+='<div class="tabela"><table><thead><tr><th>Item</th><th>Categoria</th><th>Preço</th><th>Fonte</th></tr></thead><tbody>'+shown.map(x=>'<tr><td><a href="'+esc(x.href)+'">'+esc(x.nome)+'</a></td><td>'+esc(x.categoria)+'</td><td>'+esc(x.custo)+'</td><td>'+esc(x.fonte)+'</td></tr>').join('')+'</tbody></table></div>';
 if(!shown.length&&!carregando)html+='<p>Nenhum preço corresponde à pesquisa.</p>';
 el.innerHTML=html+'</section>';
}
async function carregarPrecos(){
 const sources=[
 ['Armas','cache/armas-catalogo.json'],
 ['Armaduras','dados/armaduras-pdfs.json'],
 ['Ferramentas','dados/ferramentas-pdfs.json'],
 ['Montarias e Veículos','dados/catalogo-montarias-veiculos-20261104.json'],
 ['Equipamentos de Aventura','dados/equipamentos-aventura-core-pdfs.json']
 ];
 const res=await Promise.allSettled(sources.map(async([nome,url])=>{const r=await fetch(url+'?v=20261116-economia1',{cache:'default'});if(!r.ok)throw Error(nome+' HTTP '+r.status);return{nome,d:await r.json()};}));
 ITENS=[];erros=[];
 for(let i=0;i<res.length;i++){
  const outcome=res[i];if(outcome.status!=='fulfilled'){erros.push(sources[i][0]);continue;}
  const {nome,d}=outcome.value;
  if(nome==='Armas')for(const x of d.itens||[])add(nome,x.nome,x.custo,link('armas.html',x.nome),d.fontes?.[x.fonte]?.titulo||x.fonte);
  if(nome==='Armaduras')for(const x of d.armaduras||[])add(nome,x.nome,x.custo,link('armaduras.html',x.nome),x.fonte);
  if(nome==='Ferramentas')for(const x of d.ferramentas||[]){
   const translated=HubBiblioteca.ferramenta(x.nome);
   add(nome,translated,x.custo,link('ferramentas.html',translated),x.fonte_preco);
   for(const v of x.variantes_2024||[])add(nome,translated+' — '+v.nome,v.custo,link('ferramentas.html',translated),x.fonte_preco);
  }
  if(nome==='Montarias e Veículos')for(const x of d.itens||[]){
   const joined=(x.dados||[]).join(' | ');
   const explicit=joined.match(/Pre[çc]o:\s*([\d.,]+\s*(?:PO|PP|PC|GP|SP|CP)|\d+x o pre[çc]o[^|]*)/i);
   const initial=String(x.dados?.[0]||'').match(/^([\d.,]+\s*(?:PO|PP|PC|GP|SP|CP))/i);
   add(nome,x.nome,explicit?.[1]||initial?.[1]||'Não informado',link('montarias-veiculos.html',x.id),x.livro);
  }
  if(nome==='Equipamentos de Aventura')for(const group of [d.phb,d.heroes]){
   for(const x of group?.itens||[]){
    const translated=HubBiblioteca.equipamento(x[0]);const url=link('equipamentos-aventura.html',x[0]);
    add(nome,translated,x[3],url,group.livro);
    for(const v of x[5]?.variantes||[])if(v.custo)add(nome,translated+' — '+HubBiblioteca.equipamento(v.nome),v.custo,url,group.livro);
   }
  }
 }
 carregando=false;renderPrecos(document.getElementById('busca')?.value,document.getElementById('filtro')?.value);
}
window.renderPrecos=renderPrecos;
window.carregarPrecos=carregarPrecos;
})();