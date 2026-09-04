import assert from'node:assert/strict';
import fs from'node:fs';
import{characterSummary,chooseCharacterInPlay,chooseNextSession,summarizeDashboard}from'../scripts/dashboard-state.js';

const characters=[
 {id:'pc1',name:'Anansi',refs:{class:'fighter',species:'human',background:'noble'},refSnapshots:{class:{name:'Guerreiro'},species:{name:'Humano'},background:{name:'Nobre'}},choices:{class:{level:5}},updatedAt:'2026-09-04T12:00:00Z'},
 {id:'pc2',name:'',refs:{class:'wizard',species:null,background:null},choices:{class:{level:2}},updatedAt:'2026-09-03T12:00:00Z'}
];
const campaigns=[
 {id:'c1',name:'Teias',status:'active',updatedAt:'2026-09-04T13:00:00Z',members:[{id:'m1',active:true,characterId:'pc1'}],activeSessionId:'s1',sessions:[
  {id:'s1',number:1,title:'Em jogo',status:'active',participantCharacterIds:['pc1'],updatedAt:'2026-09-04T13:10:00Z'},
  {id:'s2',number:2,title:'Próxima',status:'planned',date:'2026-09-10',participantCharacterIds:[],updatedAt:'2026-09-04T13:20:00Z'},
  {id:'s3',number:3,title:'Sem data',status:'planned',date:'',participantCharacterIds:[],updatedAt:'2026-09-04T13:30:00Z'}
 ]},
 {id:'c2',name:'Outra Mesa',status:'active',updatedAt:'2026-09-02T10:00:00Z',members:[],sessions:[]}
];
const adventures=[{id:'a1',campaignId:'c1',title:'Mistério',status:'active',activeSceneId:null,scenes:[{id:'sc1',status:'planned'}],updatedAt:'2026-09-04T14:00:00Z'}];
const now=new Date('2026-09-04T15:00:00Z');

assert.equal(characterSummary(characters[0]).complete,true);
assert.equal(characterSummary(characters[1]).complete,false);
assert.equal(chooseCharacterInPlay(characters,campaigns)?.character.id,'pc1','Personagem participante da sessão ativa deve ser destacado como em jogo.');
assert.equal(chooseNextSession(campaigns,now)?.session.id,'s2','Próxima sessão deve priorizar a menor data futura.');
const dash=summarizeDashboard({characters,campaigns,adventures,now});
assert.deepEqual(dash.metrics,{characters:2,activeCampaigns:2,upcomingSessions:2,pending:4});
assert.equal(dash.characterInPlay.character.id,'pc1');
assert.equal(dash.nextSession.session.id,'s2');
assert.ok(dash.pending.some(x=>x.kind==='character'&&x.title==='Personagem sem nome'),'Personagem incompleto deve aparecer nas pendências.');
assert.ok(dash.pending.some(x=>x.kind==='session'&&x.title==='Sem data'),'Sessão planejada sem data deve aparecer nas pendências.');
assert.ok(dash.pending.some(x=>x.kind==='campaign'&&x.title==='Outra Mesa'),'Mesa ativa sem sessão planejada deve aparecer nas pendências.');
assert.ok(dash.pending.some(x=>x.kind==='adventure'&&x.title==='Mistério'),'Aventura ativa sem cena ativa deve aparecer nas pendências.');
assert.equal(dash.activity[0].title,'Mistério','Atividade recente deve ordenar por updatedAt decrescente.');

const page=fs.readFileSync(new URL('../painel.html',import.meta.url),'utf8'),ui=fs.readFileSync(new URL('../scripts/dashboard-ui.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../dashboard.css',import.meta.url),'utf8'),home=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const id of['character-in-play','next-session','campaign-dashboard-list','pending-list','activity-list','dashboard-status'])assert.ok(page.includes(`id="${id}"`),`Painel sem ${id}.`);
for(const token of['readCharacters','readCampaigns','readAdventures','summarizeDashboard'])assert.ok(ui.includes(token),`UI do painel sem ${token}.`);
assert.ok(css.includes('@media(max-width:820px)')&&css.includes('@media(max-width:520px)'),'Painel deve ser responsivo.');
assert.ok(home.includes('href="painel.html'),'Início deve expor o Painel Geral.');
assert.equal((home.match(/aria-disabled="true"/g)||[]).length,1,'Após o Bloco 16 somente Configurações deve permanecer indisponível.');
console.log('OK — Bloco 16: Painel Geral agrega personagens, Mesas, próxima sessão, personagem em jogo, pendências e atividade recente.');
