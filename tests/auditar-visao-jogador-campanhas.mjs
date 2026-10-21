import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {recentCampaignSessions} from '../scripts/campaign-recent-items.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const file of ['scripts/campaign-player-view.js','scripts/campaign-list-ui.js','scripts/app-shell.js','scripts/user-profile-ui.js','scripts/hub-ux.js']){
 execFileSync(process.execPath,['--check',new URL('../'+file,import.meta.url).pathname],{stdio:'pipe'});
}
const player=read('scripts/campaign-player-view.js');
const masterCampaign=read('scripts/campaign-table-ui.js');
const masterStructured=read('scripts/campaign-structured-ui.js');
const shell=read('scripts/app-shell.js');
const users=read('scripts/user-profile-ui.js');
const directory=read('usuario.html');
const login=read('usuarios.html');
const campaigns=read('scripts/campaign-list-ui.js');
const styles=read('campaigns.css');
assert.ok(player.includes('function playerCampaignSessions(items)'), 'Selecionador de sessões do jogador');
assert.ok(player.includes('recentCampaignSessions(all,{limit:Infinity})'), 'Prioridade compartilhada');
assert.ok(player.includes('return [...priority,...remaining].slice(0,3)'), 'Máximo três sessões');
assert.ok(player.includes("sessionStories(sessions,c.id)"), 'Layout próprio de Sessões');
assert.ok(player.includes("'Sessões da Campanha'")&&player.includes("'Aventuras da Campanha'"),'Títulos');
assert.ok(player.includes('campaign-player-story-card-featured'),'Destaque para Atual');
assert.ok(styles.includes('campaign-player-story-card-featured'),'Estilo do destaque');
assert.ok(player.includes('campaign-player-campaign-summary')&&player.includes('campaign-player-facts'),'Informação hierarquizada');
assert.ok(!player.includes('campaign-player-readonly'),'Sem selo Somente leitura da mesa');
assert.ok(!campaigns.includes('<span class="badge">Somente leitura</span>'),'Sem selo nos cards da lista');
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
assert.ok(!player.includes('campaign-editor-count'), 'Cards da campanha do jogador sem selo numérico de quantidade');
assert.ok(!masterStructured.includes('class="campaign-editor-count"'), 'Cards estruturados do mestre sem selo numérico de quantidade');
assert.ok(!masterCampaign.includes('class="roster-count"'), 'Card de jogadores do mestre sem contador no cabeçalho');
console.log('OK: 3 sessões por prioridade, perfil individual e cards de campanhas sem indicadores de quantidade.');
