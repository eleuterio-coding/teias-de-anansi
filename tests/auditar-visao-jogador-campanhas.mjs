import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {recentCampaignSessions,featuredCampaignAdventures} from '../scripts/campaign-recent-items.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const file of ['scripts/campaign-player-view.js','scripts/campaign-list-ui.js','scripts/app-shell.js','scripts/user-profile-ui.js','scripts/hub-ux.js']){
 execFileSync(process.execPath,['--check',new URL('../'+file,import.meta.url).pathname],{stdio:'pipe'});
}
const player=read('scripts/campaign-player-view.js');
const masterCampaign=read('scripts/campaign-table-ui.js');
const adventureCards=read('scripts/campaign-adventure-card.js');
const masterStructured=read('scripts/campaign-structured-ui.js');
const shell=read('scripts/app-shell.js');
const users=read('scripts/user-profile-ui.js');
const directory=read('usuario.html');
const login=read('usuarios.html');
const campaigns=read('scripts/campaign-list-ui.js');
const styles=read('campaigns.css');
// O Mestre e o Jogador agora compartilham os cards; a proteção vem do readOnly
// e do payload já filtrado, não de renderizadores duplicados.
const shared=read('scripts/campaign-shared-layout.js');
const sessionCards=read('scripts/campaign-session-card.js');
assert.ok(player.includes('renderCampaignOverview(c,adventures,{readOnly:true})'),'Resumo compartilhado em modo Jogador');
assert.ok(player.includes('renderCampaignSettings(c,{readOnly:true})'),'Configurações sem edição');
assert.ok(player.includes('renderCampaignAdventuresSection(c.id,adventures,{readOnly:true})'),'Aventuras compartilhadas sem controles do Mestre');
assert.ok(player.includes('renderCampaignSessionsSection(c,adventures,{readOnly:true})'),'Sessões compartilhadas sem controles do Mestre');
assert.ok(player.includes('renderStructuredDetails(c,[],{readOnly:true})'),'NPCs e locais somente a partir de dados já revelados');
assert.ok(player.includes("renderTimeline(c,'list',null,{readOnly:true,adventures})"),'Linha do Tempo sem ações de edição');
assert.ok(player.includes('canOpenCharacter('),'Abertura de ficha condicionada à permissão');
assert.ok(!player.includes('readNpcs('),'Visão do Jogador não consulta a biblioteca privada de NPCs');
assert.ok(shared.includes('recentCampaignSessions(campaign.sessions||[],{limit:5'),'Limite atual de cinco sessões');
assert.ok(shared.includes('renderCampaignSessionCard(s,campaign.id,'),'Cards de Sessões compartilhados');
assert.ok(sessionCards.includes('campaign-player-story-footer'),'Sessões conservam rodapé com estado e abertura');
assert.ok(shared.includes("Sessões da Campanha")&&shared.includes("Aventuras da Campanha"),'Títulos das seções');
const sampleAdventures=[
 {id:'old-completed',status:'completed',order:2},
 {id:'planned',status:'planned',order:11},
 {id:'new-completed',status:'completed',order:8},
 {id:'older-active',status:'active',order:1},
 {id:'new-active',status:'active',order:9},
 {id:'archived',status:'archived',order:12}
];
const snapshot=JSON.stringify(sampleAdventures);
assert.deepEqual(featuredCampaignAdventures(sampleAdventures).map(a=>a.id),['new-active','new-completed'],'Seleciona somente a ativa e a última concluída');
assert.equal(JSON.stringify(sampleAdventures),snapshot,'Seleção não altera os dados');
assert.deepEqual(featuredCampaignAdventures(sampleAdventures.filter(a=>a.status==='completed')).map(a=>a.id),['new-completed'],'Uma aventura concluída ocupa a seção sozinha');
assert.deepEqual(featuredCampaignAdventures(sampleAdventures.filter(a=>a.status==='planned')),[],'Não promove planejadas');
assert.ok(masterCampaign.includes('renderCampaignAdventuresSection(campaignId,adventuresForCampaign('),'Mestre usa os mesmos cards de aventura');
assert.ok(shared.includes('featuredCampaignAdventures(allAdventures)'),'Seletor de Aventuras compartilhado');
assert.ok(shared.includes('renderCampaignAdventureCard('),'Card de Aventura compartilhado');
assert.ok(adventureCards.includes('campaign-adventure-featured-card'),'Card de Aventura mantém destaque');
assert.ok(styles.includes('#table-root #aventuras .campaign-adventures-feature-grid{'),'Grid das Aventuras presente');
assert.ok(styles.includes('.campaign-player-sessions-grid .campaign-player-story-footer{'),'Rodapé das Sessões estilizado');
assert.ok(styles.includes('margin-left:auto;white-space:nowrap'),'Ação Abrir alinhada à direita');
assert.ok(sessionCards.includes('campaign-player-story-card-featured'),'Sessão Atual destacada');
assert.ok(!player.includes('campaign-player-readonly'),'Sem selo desnecessário de somente leitura');
assert.ok(!campaigns.includes('<span class="badge">Somente leitura</span>'),'Sem selo desnecessário na lista');
assert.ok(shell.includes("function userAreaLabel(){return masterNpcAccess()?'Usuários':'Usuário'}"),'Menu por permissão');
assert.ok(shell.includes("profile.href='usuario.html'"),'Atalho de perfil no topo');
assert.ok(directory.includes('hub-user-directory" hidden'), 'Diretório inicialmente oculto');
assert.ok(users.includes('if(!isMaster){\n  profiles=myProfile?[myProfile]:[];'),'Jogador consulta somente o próprio perfil');
assert.ok(users.includes('if(!isMaster){card.hidden=true;return}'),'Link direto não abre terceiros');
assert.ok(login.includes('id="login-username" type="text"'),'Login digitado');
assert.ok(!login.includes('id="login-username" autocomplete="username" required><option'),'Sem escolha pública de conta');
const samples=[
 {id:'finished',status:'completed',number:1,order:1},
 {id:'next-low',status:'next',number:3,order:3},
 {id:'current',status:'current',number:2,order:2},
 {id:'next-high',status:'next',number:4,order:4}
];
assert.deepEqual(recentCampaignSessions(samples,{limit:3}).map(x=>x.id),['current','next-high','next-low']);
assert.ok(!player.includes('campaign-editor-count'), 'Jogador não recebe contadores de edição fora dos componentes compartilhados');
assert.ok(masterStructured.includes('class="campaign-editor-count"'), 'Linha do Tempo usa o contador de eventos validado no navegador');
const structuredCards=masterStructured.slice(masterStructured.indexOf('function roster('),masterStructured.indexOf('function linkedTimelineHtml('));
assert.ok(!structuredCards.includes('campaign-editor-count'), 'Cards de NPCs e Locais não ganham contadores extras');
assert.ok(!masterCampaign.includes('class="roster-count"'), 'Card de jogadores do mestre sem contador no cabeçalho');
console.log('OK: cards compartilhados, até cinco sessões na UI, visibilidade e ações readOnly, perfis e eventos de Linha do Tempo.');
