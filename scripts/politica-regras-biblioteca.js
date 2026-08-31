(()=>{
'use strict';
const page=location.pathname.split('/').pop()||'';
const ERA='Escopo de cenário: conteúdo mundano baseado em pólvora, armas de fogo, explosivos industriais, tecnologia industrial/moderna/futurista e veículos motorizados modernos é excluído do catálogo ativo e da aplicação mecânica do Hub. Tecnologia explicitamente mágica ou fantástica não é removida apenas por aparentar ser avançada.';
const POLICY={
 'classes.html':'Regra da Casa: marcos regulares de Talento/Aumento de Atributo da classe são substituídos pela progressão universal do Hub; benefícios realmente adicionais da classe permanecem.',
 'classes-v3.html':'Regra da Casa: marcos regulares de Talento/Aumento de Atributo da classe são substituídos pela progressão universal do Hub; benefícios realmente adicionais da classe permanecem.',
 'subclasses.html':'Compatibilidade: a versão 5.5e/2024 de uma subclasse prevalece sobre a equivalente 5e. Subclasses 5e sem substituta permanecem como legado compatível e usam o nível de subclasse da classe 2024.',
 'raca.html':'Compatibilidade: a versão 5.5e/2024 da mesma raça prevalece. Raças 5e sem substituta permanecem compatíveis; seus aumentos de atributo antigos não são aplicados a personagens 5.5e.',
 'especies.html':'Compatibilidade: a versão 5.5e/2024 da mesma espécie prevalece. Espécies 5e sem substituta permanecem compatíveis; seus aumentos de atributo antigos não são aplicados a personagens 5.5e.',
 'antecedentes.html':'Regra da Casa: qualquer antecedente usado no personagem 5.5e concede +2 em um atributo e +1 em outro diferente, livres, e um Talento de Origem livre. A versão mais recente de mesmo antecedente prevalece.',
 'talentos.html':'Compatibilidade: a versão 5.5e/2024 de mesmo talento prevalece. Talentos 5e únicos permanecem compatíveis e conservam seus pré-requisitos; quando o Hub só possui síntese editorial, a aplicação mecânica é manual. Talentos vinculados especificamente a armas de fogo ou tecnologia moderna não entram no catálogo ativo.',
 'maestrias-de-arma.html':'Canonização: somente as oito Maestrias oficiais 2024 são regras-base. Variações demonstrativas permanecem identificadas como não canônicas e não entram automaticamente na criação de personagem. Associações a armas excluídas pela política de cenário também são removidas.',
 'monstros.html':'Precedência: para a mesma identidade de monstro, o bloco mais recente do catálogo ativo prevalece. Blocos antigos únicos permanecem identificados pela própria fonte; estatísticas de edições diferentes não são mescladas.',
 'armaduras.html':'Canonização: armaduras oficiais 2024 são a referência ativa. Registros demonstrativos permanecem não canônicos e não são oferecidos automaticamente na criação de personagem.',
 'armas.html':'Canonização: a mecânica 2024 prevalece para armas equivalentes. Material demonstrativo permanece não canônico; material suplementar conserva a edição e a fonte em vez de ser convertido artificialmente para 5.5e. Armas de fogo, pólvora e armamento mundano moderno/futurista são excluídos independentemente da fonte ou edição.',
 'equipamentos-aventura.html':'Compatibilidade: regras e subsistemas de suplementos conservam sua fonte. Quando houver conflito com uma regra-base 2024 equivalente, a regra 5.5e/2024 prevalece, salvo Regra da Casa explícita. Equipamento mundano moderno ou futurista é excluído do catálogo ativo.',
 'ferramentas.html':'Compatibilidade: usos suplementares de ferramentas de 5e permanecem como legado compatível. Regras-base 2024 de utilização, teste e fabricação prevalecem quando houver conflito. Ferramentas especificamente modernas/industriais são excluídas.',
 'montarias-veiculos.html':'Compatibilidade: estatísticas e regras conservam a edição da fonte; uma revisão 2024 equivalente prevalece sobre a versão 5e anterior. Veículos mundanos motorizados modernos/futuristas são excluídos; veículos explicitamente mágicos ou fantásticos permanecem elegíveis.',
 'comercio-e-despesas.html':'Compatibilidade: preços e serviços conservam a fonte e o cenário. Uma tabela 2024 equivalente prevalece sobre a versão 5e anterior; subsistemas exclusivos continuam vinculados à própria fonte. Serviços e bens especificamente modernos seguem a política global de exclusão.',
 'bugigangas.html':'Compatibilidade: bugigangas são conteúdo narrativo; versões e tabelas permanecem vinculadas à fonte, sem converter material 5e em regra 5.5e. Objetos inequivocamente modernos/futuristas são filtrados do catálogo ativo.',
 'itens-magicos.html':'Regra da Casa: Sintonização e o limite padrão de três itens sintonizados são substituídos por Espaços de Itens Mágicos. A versão 2024 de mesmo item prevalece; legado único permanece identificado. Itens cuja natureza é explicitamente mágica/fantástica não são classificados como modernos apenas por sua função.',
 'magias.html':'Precedência: a versão mais recente de uma magia de mesmo nome prevalece. Magias 5e sem substituta podem permanecer compatíveis quando a lista/classe atual as admite; a fonte real é preservada.',
 'idiomas.html':'Criação 5.5e: Comum é conhecido automaticamente e o personagem escolhe dois idiomas padrão. Idiomas raros, de cenário ou adicionais só são concedidos por característica, regra específica ou decisão do Mestre.'
};
function inject(){
  if(document.querySelector('[data-hub-rules-policy]'))return;
  const detail=POLICY[page]||'';
  const box=document.createElement('div');
  box.dataset.hubRulesPolicy='1';
  box.className='nota hub-rules-policy';
  box.style.cssText='padding:11px 13px;border:1px dashed #8888;border-radius:10px;margin:12px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:.9rem';
  box.innerHTML=`<strong>Política do Hub.</strong> ${ERA}${detail?` ${detail}`:''}`;
  const header=document.querySelector('header')||document.querySelector('h1');
  if(header)header.insertAdjacentElement('afterend',box);else document.body.prepend(box);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject,{once:true});else inject();
})();
