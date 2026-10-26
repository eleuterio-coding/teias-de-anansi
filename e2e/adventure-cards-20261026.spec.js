import { test, expect } from '@playwright/test';

const campaignId='qa-adventure-cards-20261026', adventureId='qa-cards-adventure';
const campaign={
 id:campaignId,name:'Reinos de Prata',status:'active',npcs:[],locations:[],members:[],
 sessions:[{id:'qa-session-1',number:1,order:1,title:'O primeiro encontro',status:'planned',adventureId}]
};
const adventure={
 id:adventureId,campaignId,title:'As Rainhas',status:'active',npcIds:[],locationIds:[],
 monsters:[{id:'qa-monster-1',monsterId:'qa-library-monster',name:'Guarda monstruoso',source:'Biblioteca',order:1}],
 scenes:[{id:'qa-scene-1',title:'No salão',order:1,status:'planned',monsterIds:[]}],
 exploration:{
  levels:[{id:'qa-map-1',name:'Palácio das Rainhas',type:'Masmorra',order:1}],
  areas:[{id:'qa-area-1',code:'A01',name:'Salão do Conselho',levelId:'qa-map-1',type:'Salão',status:'discovered'}]
 }
};

const savedAdventure=page=>page.evaluate(id=>
 JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')||'[]').find(item=>item.id===id),adventureId
);
const savedCampaign=page=>page.evaluate(id=>
 JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]').find(item=>item.id===id),campaignId
);
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(({campaign,adventure})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'qa-master-cards',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
  if(!localStorage.getItem('hub-rpg:adventures:v1'))localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([adventure]));
  if(!localStorage.getItem('hub-rpg:characters:v4'))localStorage.setItem('hub-rpg:characters:v4','[]');
  if(!localStorage.getItem('hub-rpg:npcs:v1'))localStorage.setItem('hub-rpg:npcs:v1','[]');
 },{campaign,adventure});
});

test('Locais, Mapas e Sessões têm a hierarquia solicitada no desktop e no celular',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await expect(page.locator('#exploracao .explore-area-card')).toHaveCount(1);
 const local=page.locator('#exploracao .explore-area-card');
 await expect(local.locator('.explore-area-code')).toHaveText('A01');
 await expect(local.locator('.explore-area-name')).toHaveText('Salão do Conselho');
 await expect(local.locator('.explore-area-context')).toContainText('Palácio das Rainhas');
 await expect(local.locator('.explore-area-context')).toContainText('Salão');
 await expect(local.locator('.explore-record-status')).toContainText('Descoberta');
 const dimensions=await local.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
 expect(Math.abs(dimensions.width-dimensions.height)).toBeLessThanOrEqual(4);
 await expect(page.locator('#mapas')).not.toContainText('Organize os mapas e gerencie suas imagens em cada registro.');
 await expect(page.locator('#monstros')).not.toContainText('Selecione uma criatura da Biblioteca para consultar sua ficha ou adicioná-la à Aventura.');
 await expect(page.locator('#linha-tempo')).not.toContainText('As Cenas aparecem automaticamente e acompanham as alterações.');

 const session=page.locator('#sessoes .adventure-session-card-wrap').first();
 const card=session.locator('.campaign-player-story-card');
 await expect(card).toBeVisible();
 const publication=session.locator('.adventure-session-visibility [data-adventure-visible="sessions"]');
 await expect(publication).toBeVisible();
 const pos=await session.evaluate(el=>{
  const rect=sel=>{const b=el.querySelector(sel)?.getBoundingClientRect();return b?{left:b.left,right:b.right,top:b.top,bottom:b.bottom}:null};
  return {card:rect('.campaign-player-story-card'),title:rect('h3'),open:rect('.campaign-player-story-open'),badge:rect('.campaign-player-story-status'),visible:rect('.adventure-session-visibility')};
 });
 expect(pos.title).toBeTruthy();expect(pos.open).toBeTruthy();expect(pos.badge).toBeTruthy();expect(pos.visible).toBeTruthy();
 expect(pos.title.left).toBeLessThan(pos.card.left+pos.card.right-pos.card.left-20);
 expect(pos.title.top).toBeLessThan(pos.open.top);
 expect(pos.open.left).toBeLessThan(pos.badge.left);
 expect(pos.open.bottom).toBeGreaterThan(pos.title.bottom);
 expect(pos.visible.right).toBeGreaterThan(pos.card.left+(pos.card.right-pos.card.left)*.6);
 expect(pos.visible.top).toBeLessThan(pos.open.top);
 await publication.check();
 await expect.poll(async()=>(await savedAdventure(page)).sessionVisibility['qa-session-1']).toBe(true);
 await expect(page.locator('#sessoes .adventure-session-visibility [data-adventure-visible="sessions"]')).toBeChecked();
 expect(errors.filter(s=>/ReferenceError|SyntaxError/.test(s))).toEqual([]);
});

test('Monstros podem ser definidos em uma nova Cena e alterados em uma Cena existente',async({page})=>{
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await expect(page.locator('#new-scene-monster')).toContainText('Guarda monstruoso');
 await page.locator('#new-scene-title').fill('Defesa da torre');
 await page.locator('#new-scene-monster').selectOption('qa-monster-1');
 await page.locator('#add-scene').click();
 await expect.poll(async()=>(await savedAdventure(page)).scenes.find(s=>s.title==='Defesa da torre')?.monsterIds).toEqual(['qa-monster-1']);
 const first=page.locator('#cenas [data-scene-row="qa-scene-1"]');
 await first.locator('[data-scene-editor] summary').click();
 const checkbox=first.locator('[data-scene-link="monsterIds"][value="qa-monster-1"]');
 await checkbox.check();
 await expect.poll(async()=>(await savedAdventure(page)).scenes.find(s=>s.id==='qa-scene-1')?.monsterIds).toEqual(['qa-monster-1']);
 await page.reload();
 await page.locator('#cenas [data-scene-row="qa-scene-1"] [data-scene-editor] summary').click();
 await expect(page.locator('#cenas [data-scene-row="qa-scene-1"] [data-scene-link="monsterIds"]')).toBeChecked();
});

test('Adicionar NPC oferece Abrir ficha e vincula a ficha salva à Campanha',async({page})=>{
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await expect(page.locator('#npcs #add-campaign-npc')).toBeVisible();
 const controls=await page.locator('#npcs #add-campaign-npc,#npcs .form-grid>a.btn,#npcs #add-registered-npc')
  .evaluateAll(els=>els.map(el=>Math.round(el.getBoundingClientRect().height)));
 expect(controls).toHaveLength(3);
 expect(Math.max(...controls)-Math.min(...controls)).toBeLessThanOrEqual(2);
 await page.locator('#new-npc-name').fill('Guardião da biblioteca');
 await page.locator('#new-npc-role').fill('Sentinela');
 await page.locator('#add-campaign-npc').click();
 await expect.poll(async()=>(await savedCampaign(page)).npcs.length).toBe(1);
 const entry=(await savedCampaign(page)).npcs[0];
 const open=page.locator('#npcs [data-campaign-npc="'+entry.id+'"] a').filter({hasText:'Abrir ficha'});
 await expect(open).toHaveAttribute('href',/criacao-personagem\.html\?npc=1.*npcId=/);
 await open.click();
 await expect(page).toHaveURL(/criacao-personagem\.html\?npc=1/);
 await expect(page.locator('#nome')).toHaveValue('Guardião da biblioteca');
 await page.locator('#save').click();
 await expect.poll(async()=>Boolean((await savedCampaign(page)).npcs[0].sheetId)).toBe(true);
 const saved=(await savedCampaign(page)).npcs[0];
 expect(saved.name).toBe('Guardião da biblioteca');
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await expect(page.locator('#npcs [data-campaign-npc="'+entry.id+'"] a').filter({hasText:'Abrir ficha'}))
  .toHaveAttribute('href',new RegExp('ficha-personagem\\.html\\?npc=1&id='+saved.sheetId));
});
