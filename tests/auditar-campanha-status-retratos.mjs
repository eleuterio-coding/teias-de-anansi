import assert from'node:assert/strict';
import fs from'node:fs';
import{execFileSync}from'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
for(const js of ['scripts/campaign-avatar-preview.js','scripts/campaign-table-ui.js','scripts/campaign-player-view.js','scripts/user-profile-ui.js','scripts/campaign-table-router.js'])
 execFileSync(process.execPath,['--check',js],{stdio:'pipe'});
const dm=read('scripts/campaign-table-ui.js'),player=read('scripts/campaign-player-view.js');
const shared=read('scripts/campaign-shared-layout.js'),adventureCard=read('scripts/campaign-adventure-card.js'),sessionCard=read('scripts/campaign-session-card.js');
const portrait=read('scripts/campaign-avatar-preview.js'),user=read('scripts/user-profile-ui.js');
const css=read('campaigns.css'),profileHtml=read('usuario.html');
for(const status of ['planned','next','current','active','completed','cancelled','archived','paused','finished'])
 assert.ok(css.includes('.status-'+status),'Cor específica ausente: '+status);



assert.match(dm,/renderCampaignAdventuresSection/,'Mestre deve usar a seção compartilhada de Aventuras.');
assert.match(dm,/renderCampaignSessionsSection/,'Mestre deve usar a seção compartilhada de Sessões.');
assert.match(player,/renderCampaignAdventuresSection/,'Jogador deve usar a seção compartilhada de Aventuras.');
assert.match(player,/renderCampaignSessionsSection/,'Jogador deve usar a seção compartilhada de Sessões.');
assert.match(shared,/adventures\.map\(a=>renderCampaignAdventureCard\(a,campaignId\)\)/,'Aventuras devem consumir os cards compartilhados.');
assert.match(shared,/sessions\.map\(\(s,i\)=>renderCampaignSessionCard\(s,campaign\.id/,'Sessões devem consumir os cards compartilhados.');
assert.match(adventureCard,/campaign-player-story-status status-\$\{esc\(status\)/,'Aventura deve preservar o selo cromático pelo status.');
assert.match(sessionCard,/campaign-player-story-status status-\$\{esc\(session\.status/,'Sessão deve preservar o selo cromático pelo status.');
assert.match(adventureCard,/statusLabel\(status\)/,'Selo de Aventura deve ter rótulo acessível.');
assert.match(sessionCard,/labels\[session\.status\]/,'Selo de Sessão deve usar rótulo do estado.');
assert.match(css,/border:2px dashed rgba\(255,255,255,\.7\)!important/);
assert.match(css,/campaign-settings-status-row\.wide/);
assert.match(css,/campaign-settings-status-row \.campaign-settings-save/);
assert.match(dm,/roster-player-profile-link/);
assert.match(player,/roster-player-profile-link/);
assert.match(dm,/campaignAvatarHtml\(playerAvatarHtml/);
assert.match(dm,/campaignAvatarHtml\(characterAvatarHtml/);
assert.match(player,/campaignAvatarHtml\(playerAvatarHtml/);
assert.match(player,/campaignAvatarHtml\(characterAvatarHtml/);
assert.match(dm,/bindCampaignAvatarPreviews\(root\)/);
assert.match(player,/bindCampaignAvatarPreviews\(root\)/);
assert.match(portrait,/dialog\.showModal\(\)/);
assert.match(portrait,/dialog\.addEventListener\('close'/);
assert.match(portrait,/event\.preventDefault\(\)/);
assert.match(portrait,/const esc=/);
assert.match(profileHtml,/id="hub-user-focused-profile"/);
assert.match(user,/new URLSearchParams\(location\.search\)\.get\('user'\)/);
assert.match(user,/renderFocusedProfile\(\)/);
console.log('OK: status cromáticos, capa, alinhamento, retratos e perfis vinculados à Campanha.');
