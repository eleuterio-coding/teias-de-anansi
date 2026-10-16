import assert from'node:assert/strict';
import fs from'node:fs';
import{chooseNextSession,chooseCurrentSession,chooseCurrentCampaign,chooseCurrentAdventure,summarizeDashboard}from'../scripts/dashboard-state.js';

const campaigns=[
 {id:'c1',name:'Teias',status:'active',setting:'Planescape',updatedAt:'2026-09-04T13:00:00Z',activeSessionId:'s1',sessions:[
  {id:'s1',number:1,title:'Em jogo',status:'active',adventureId:'a1',date:'2026-09-04',updatedAt:'2026-09-04T13:10:00Z'},
  {id:'s2',number:2,title:'Próxima',status:'planned',date:'2026-09-10',updatedAt:'2026-09-04T13:20:00Z'}
 ]},
 {id:'c2',name:'Outra Campanha',status:'planned',updatedAt:'2026-09-02T10:00:00Z',sessions:[]}
];
const adventures=[
 {id:'a1',campaignId:'c1',title:'Mistério',status:'active',activeSceneId:'sc1',scenes:[{id:'sc1',status:'active'}],updatedAt:'2026-09-04T14:00:00Z'},
 {id:'a2',campaignId:'c1',title:'Prólogo',status:'completed',updatedAt:'2026-09-03T14:00:00Z'}
];
const standaloneSessions=[{id:'sx',number:1,title:'Avulsa',status:'planned',date:'2026-09-12',updatedAt:'2026-09-04T13:40:00Z'}];
const now=new Date('2026-09-04T15:00:00Z');

assert.equal(chooseNextSession(campaigns,now,standaloneSessions)?.session.id,'s2','Próxima sessão deve priorizar a menor data futura.');
const currentSession=chooseCurrentSession(campaigns,standaloneSessions);
assert.equal(currentSession?.session.id,'s1','Sessão ativa da Campanha deve definir a Sessão atual.');
assert.equal(chooseCurrentCampaign(campaigns,currentSession)?.id,'c1','Campanha da Sessão ativa deve definir a Campanha atual.');
assert.equal(chooseCurrentAdventure(adventures,campaigns[0],currentSession)?.id,'a1','Aventura vinculada à Sessão ativa deve definir a Aventura atual.');

const dash=summarizeDashboard({campaigns,adventures,standaloneSessions,now});
assert.deepEqual(dash.metrics,{campaigns:2,adventures:2,sessions:3});
assert.equal(dash.campaigns.length,2,'Painel deve listar as Campanhas existentes.');
assert.equal(dash.adventures.length,2,'Painel deve listar as Aventuras existentes.');
assert.equal(dash.sessions.length,3,'Painel deve listar Sessões de Campanha e avulsas.');
assert.equal(dash.nextSession.session.id,'s2');
assert.equal(dash.currentCampaign.id,'c1');
assert.equal(dash.currentAdventure.id,'a1');
assert.equal(dash.currentSession.session.id,'s1');

const page=fs.readFileSync(new URL('../painel.html',import.meta.url),'utf8'),ui=fs.readFileSync(new URL('../scripts/dashboard-ui.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../dashboard.css',import.meta.url),'utf8'),home=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const id of['campaign-dashboard-list','adventure-dashboard-list','session-dashboard-list','next-session','current-campaign','current-adventure','current-session'])assert.ok(page.includes(`id="${id}"`),`Painel sem ${id}.`);
assert.match(page,/dashboard-context-column--sessions[\s\S]*id="current-session"[\s\S]*id="next-session"/,'Sessão atual deve vir antes da Próxima Sessão na mesma coluna.');
assert.match(page,/dashboard-context-column--campaign[\s\S]*id="current-campaign"[\s\S]*id="current-adventure"/,'Campanha atual e Aventura atual devem permanecer na mesma coluna.');
assert.ok(page.includes('id="current-session" class="focus-card focus-card--current-session"'),'Sessão atual deve usar a variante visual ampliada.');
assert.match(css,/\.dashboard-context-column--sessions\{[^}]*grid-template-rows:minmax\(260px,1fr\) minmax\(160px,auto\)/,'Coluna de sessões deve reservar mais altura para a Sessão atual no topo.');
assert.match(css,/\.focus-card--current-session\{min-height:260px\}/,'Card da Sessão atual deve ser maior que o da Próxima Sessão.');
for(const forbidden of['character-in-play','dashboard-status','pending-list','activity-list','href="usuarios.html','>Início</a>'])assert.ok(!page.includes(forbidden),`Painel ainda contém elemento removido: ${forbidden}`);
assert.ok(!ui.includes('Nenhum personagem em jogo agora'),'Painel não deve mais exibir estado de personagem em jogo.');
assert.ok(!ui.includes('Atualizado às'),'Painel não deve mais exibir horário de atualização.');
for(const token of['readCampaigns','readAdventures','readStandaloneSessions','summarizeDashboard','imageElementHtml','hydrateMediaImages','playerMode','sharedCampaignRows'])assert.ok(ui.includes(token),`UI do painel sem ${token}.`);
assert.ok(ui.includes('coverImage')&&ui.includes('coverImageUrl'),'Painel deve consumir as capas salvas de Campanhas, Aventuras e Sessões.');
assert.ok(css.includes('.dashboard-row-cover')&&css.includes('.focus-card-cover'),'Painel deve possuir estilos para capas nas listas e nos cards de contexto.');
assert.ok(css.includes('@media(max-width:820px)')&&css.includes('@media(max-width:520px)'),'Painel deve ser responsivo.');
assert.ok(home.includes('href="painel.html'),'Início deve expor o Painel Geral.');
console.log('OK — Painel Geral prioriza Campanhas, Aventuras, Sessões, próxima Sessão e contexto atual.');
