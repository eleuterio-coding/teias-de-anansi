import assert from'node:assert/strict';
import{findCurrentCampaignSession,findUpcomingCampaignSession,findPreviousCampaignSession,renderNextCampaignSession}from'../scripts/campaign-next-session-ui.js';
import{recentCampaignSessions}from'../scripts/campaign-recent-items.js';
import{campaignSharedProjection,participantSharedProjection}from'../scripts/collaboration-model.js';
import{playerTerm,characterPicture,validPortrait}from'../scripts/profile-images.js';

const img='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';
assert.equal(playerTerm('fernanda'),'Jogadora');
assert.equal(playerTerm('Fernanda Silva'),'Jogadora');
assert.equal(playerTerm('Gustavo'),'Jogador');
assert.equal(validPortrait(img),img);
assert.equal(validPortrait('javascript:alert(1)'),'');
assert.equal(characterPicture({portraitDataUrl:img}),img);
const campaign={
 id:'c1',name:'Reinos de Prata',status:'active',worldPlane:'Toril',mainRegion:'Costa da Espada',
 sessions:[
  {id:'p',number:1,order:1,status:'completed',title:'Antiga'},
  {id:'n',number:3,order:3,status:'next',title:'A próxima'},
  {id:'c',number:2,order:2,status:'current',title:'A atual'}
 ]
};
assert.deepEqual(recentCampaignSessions(campaign.sessions).map(s=>s.id),['c','n','p']);
assert.deepEqual(recentCampaignSessions(campaign.sessions,{activeAdventureIds:new Set()}).map(s=>s.id),['c']);
assert.equal(findCurrentCampaignSession(campaign)?.id,'c');
assert.equal(findUpcomingCampaignSession(campaign)?.id,'n');
assert.equal(findPreviousCampaignSession(campaign)?.id,'p');
assert.equal(findCurrentCampaignSession({...campaign,sessions:[]}),null);
const currentSessionCard=renderNextCampaignSession(campaign);
assert.equal(currentSessionCard.includes('PLANEJAMENTO DA CAMPANHA'),true);
assert.match(currentSessionCard,/<span class="campaign-next-status status-current">Atual<\/span>/,'A Sessão Atual deve manter o selo de estado current, e não só um título textual.');
assert.equal(currentSessionCard.includes('A atual'),true);
const upcomingCampaign={...campaign,sessions:campaign.sessions.filter(s=>s.status!=='current')};
const upcomingSessionCard=renderNextCampaignSession(upcomingCampaign);
assert.match(upcomingSessionCard,/<span class="campaign-next-status status-next">Próxima<\/span>/,'Sem Sessão Atual, a Próxima deve manter estado next.');
assert.equal(upcomingSessionCard.includes('A próxima'),true);
assert.equal(upcomingSessionCard.includes('A atual'),false);
const shared=campaignSharedProjection(campaign);
assert.equal(shared.worldPlane,'Toril');
assert.equal(shared.mainRegion,'Costa da Espada');
const member=participantSharedProjection({username:'fernanda',role:'player',avatarDataUrl:img});
assert.equal(member.avatarDataUrl,img);
console.log('Terminologia, privacidade, gênero, imagens e sessões da Campanha validados.');
