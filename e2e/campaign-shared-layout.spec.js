import{test,expect}from'@playwright/test';
import{campaignSharedProjection,revealedAdventureProjection}from'../scripts/collaboration-model.js';
const cid='mirror-e2e-campaign',aid='mirror-e2e-adventure',sid='mirror-e2e-session';
const campaign={
 id:cid,name:'Reinos de Prata',system:'D&D 5.5e',setting:'Cenário',description:'Uma campanha compartilhada',status:'active',worldPlane:'Plano Material',mainRegion:'Costa',
 members:[{id:'p1',username:'ana',name:'Ana',role:'player',characterId:'ana-char',active:true},{id:'p2',username:'bento',name:'Bento',role:'player',characterId:'bento-char',active:true}],
 sessions:[{id:sid,title:'A convocação',order:3,number:1,status:'current',adventureId:aid,scenes:[]}],
 historySummary:'Resumo público',sharedNotes:'Notas compartilhadas',
 importantNpcIds:['npc-public','npc-hidden'],importantNpcPublicNames:{'npc-public':'NPC Público','npc-hidden':'NPC Secreto'},importantNpcVisibility:{'npc-public':true,'npc-hidden':false},
 importantLocationEntries:[{id:'loc-public',name:'Portal',visibleToPlayers:true,image:null},{id:'loc-hidden',name:'Local Secreto',visibleToPlayers:false,image:null}],importantLocations:'Portal\nLocal Secreto',
 timelineNodes:[{id:'visible',text:'Um evento revelado',visibleToPlayers:true,children:[{id:'visible-child',text:'Outro evento revelado',visibleToPlayers:true,children:[]}]},{id:'hidden',text:'Plano secreto',visibleToPlayers:false,children:[]}],
 dmNotes:'Segredo do mestre'
};
const adventure={id:aid,campaignId:cid,title:'As Rainhas',order:2,status:'active',scenes:[],chapters:[],missions:[]};
const chars=[{id:'ana-char',name:'Aluria'},{id:'bento-char',name:'Dongron'}];
const membership={id:'mb-ana',uid:'ana-uid',username:'ana',role:'player',campaignId:cid,characterId:'ana-char',sessionIds:[sid],adventureIds:[aid],active:true};
const sharedCampaign=campaignSharedProjection(campaign);
const sharedAdventure=revealedAdventureProjection(adventure,campaign);
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
});
function masterData(){return{campaign,adventure,chars}}
function playerData(){return{membership,sharedCampaign,sharedAdventure,chars}}
test('Mestre: Aventuras e Sessões da Campanha têm dimensões iguais',async({page})=>{
 await page.addInitScript(({campaign,adventure,chars})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([adventure]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(chars));
 },masterData());
 await page.goto('/mesa.html?id='+cid);
 await expect(page.locator('#campanha [data-campaign-field="name"]')).toBeVisible();
 await expect(page.locator('#aventuras .campaign-player-story-card')).toHaveCount(1);
 await expect(page.locator('#sessoes .campaign-player-story-card')).toHaveCount(1);
 const boxes=await page.locator('#aventuras,#sessoes').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return{width:r.width,height:r.height,top:r.top}}));
 expect(Math.abs(boxes[0].width-boxes[1].width)).toBeLessThan(2);
 if((await page.evaluate(()=>innerWidth))>900){
  expect(Math.abs(boxes[0].height-boxes[1].height)).toBeLessThan(2);
  expect(Math.abs(boxes[0].top-boxes[1].top)).toBeLessThan(2)
 }
});
test('Jogador: espelho estrutural do Mestre sem exibir ferramentas ou informação privada',async({page})=>{
 await page.addInitScript(({membership,sharedCampaign,sharedAdventure,chars})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'ana-uid',username:'ana',isMaster:false,memberships:[membership]}));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify({schema:'hub-rpg/collaboration-cache/v1',campaigns:{[membership.campaignId]:{membership,payload:{campaign:sharedCampaign,revealedAdventures:[sharedAdventure]},participants:[],characters:chars,characterIds:chars.map(c=>c.id)}}}));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(chars));
 },playerData());
 await page.goto('/mesa.html?id='+cid);
 const root=page.locator('#table-root');
 await expect(root).toHaveAttribute('data-campaign-access','player');
 for(const selector of ['.campaign-product-hero','.campaign-product-summary','#proxima-sessao','.section-nav','#campanha.campaign-editor-card','#jogadores.roster-section','#aventuras.campaign-reference-section','#sessoes.campaign-reference-section','#historia.campaign-editor-card','.campaign-structured-columns','#npcs.campaign-editor-card','#locais.campaign-editor-card','#linha-tempo.campaign-timeline-section']){
  await expect(root.locator(selector)).toBeVisible()
 }
 await expect(root.locator('#campanha input[readonly]')).not.toHaveCount(0);
 await expect(root.locator('#jogadores .roster-player')).toHaveCount(2);
 await expect(root.locator('#aventuras .campaign-player-story-card')).toHaveCount(1);
 await expect(root.locator('#sessoes .campaign-player-story-card')).toHaveCount(1);
 await expect(root.locator('#npcs')).toContainText('NPC Público');
 await expect(root.locator('#locais')).toContainText('Portal');
 await expect(root.locator('#linha-tempo')).toContainText('Um evento revelado');
 for(const hidden of ['NPC Secreto','Local Secreto','Plano secreto','Segredo do mestre'])await expect(root).not.toContainText(hidden);
 await expect(root.locator('[data-campaign-field],[data-remove-member],[data-visible-npc],[data-visible-location],[data-visible-event],[data-timeline-delete],[data-add-npc]')).toHaveCount(0);
 await expect(root.locator('#jogadores a[href*="id=ana-char"]')).toHaveCount(2);
 const button=root.locator('#linha-tempo .timeline-collapse').first();
 await button.click();await expect(button).toHaveAttribute('aria-expanded','true');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('hub-rpg:remote-updated',{detail:{claim(){}}})));
 await expect(button).toHaveAttribute('aria-expanded','true');
 await button.click();await expect(button).toHaveAttribute('aria-expanded','false');
});
