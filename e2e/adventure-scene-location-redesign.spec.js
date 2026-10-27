import {test,expect} from '@playwright/test';

const campaignId='qa-scene-redesign',adventureId='qa-scene-redesign-adv';
const campaign={id:campaignId,name:'Mesa de Teste',status:'active',system:'D&D 5.5e',
 members:[],sessions:[],locations:[],npcs:[
 {id:'npc-1',name:'Aldeã',role:'Aliada'},
 {id:'npc-2',name:'Bandido',role:'Inimigo'}
]};
const adventure={
 id:adventureId,campaignId,title:'Investigação',status:'active',npcIds:['npc-1','npc-2'],
 missions:[{id:'objective-1',title:'Descobrir o segredo',description:'Objetivo privado',status:'active',order:1}],
 monsters:[{id:'monster-1',name:'Ogro',monsterId:'ogre',order:1},{id:'monster-2',name:'Lobo',monsterId:'wolf',order:2}],
 scenes:[{id:'scene-1',title:'A chegada',areaId:'area-1',status:'planned',order:1,missionIds:['objective-1'],visibleToPlayers:true}],
 exploration:{
  levels:[{id:'map-1',name:'Palácio',order:1},{id:'map-2',name:'Jardim',order:2}],
  areas:[{id:'area-1',code:'A01',name:'Sala 1',status:'discovered',levelId:'map-1',order:1},{id:'area-2',code:'A02',name:'Sala 2',status:'discovered',levelId:'map-2',order:2}],
  factions:[{id:'faction-1',name:'Guardiões',order:1}]
 }
};
const stored=page=>page.evaluate(id=>(JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')||'[]').find(row=>row.id===id)),adventureId);
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master-audit',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  if(!localStorage.getItem('hub-rpg:adventures:v1'))localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure]));
  if(!localStorage.getItem('hub-rpg:characters:v4'))localStorage.setItem('hub-rpg:characters:v4','[]');
 },{campaign,adventure});
});
const visit=async page=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await expect(page.locator('#cenas [data-scene-row]')).toHaveCount(1);
 expect(errors).toEqual([]);
};

test('cards da Aventura na ordem correta, criação independente e listas anexadas',async({page})=>{
 await visit(page);
 const order=await page.locator('.hub-detail-grid > section[id]').evaluateAll(rows=>rows.map(n=>n.id));
 expect(order.indexOf('cenas')+1).toBe(order.indexOf('exploracao'));
 expect(order.indexOf('criar-cena')).toBeGreaterThan(order.indexOf('cenas'));
 await expect(page.locator('#criar-cena #new-scene-title')).toBeVisible();
 await expect(page.locator('#criar-cena #new-scene-location option[value="area-1"]')).toHaveText('A01 - Sala 1');
 for(const [id,part] of [['npcs','NPCs'],['missoes','Objetivos'],['faccoes','Facções']]){
  const detail=page.locator('#'+id+' .adventure-attached-list');
  await expect(detail).toHaveCount(1);
  await expect(detail.locator('summary')).toContainText(part+' adicionados à Aventura');
  await detail.locator('summary').click();
  await expect(detail).toHaveAttribute('open','');
 }
 await expect(page.locator('#criar-mapa [name="description"]')).toHaveCount(0);
 await page.locator('#criar-mapa [name="name"]').fill('Caverna');
 await page.locator('#criar-mapa button[type="submit"]').click();
 await expect.poll(async()=> (await stored(page)).exploration.levels.map(l=>l.name)).toContain('Caverna');
});

test('Cenas usam mesmo cadastro e edição, mantém narração e vínculos privados',async({page})=>{
 await visit(page);
 const row=page.locator('#cenas [data-scene-row="scene-1"]');
 await row.locator('[data-scene-editor] summary').click();
 await expect(row.locator('[data-scene-field="areaId"] option[value="area-1"]')).toHaveText('A01 - Sala 1');
 await expect(row.locator('[data-scene-field="readAloud"]')).toBeVisible();
 await expect(row.locator('[data-scene-field="description"]')).toBeVisible();
 await row.locator('[data-scene-link="npcIds"][value="npc-1"]').check();
 await row.locator('[data-scene-reveal="visibleNpcIds"][value="npc-1"]').check();
 await row.locator('[data-scene-link="monsterIds"][value="monster-1"]').check();
 await row.locator('[data-scene-reveal="visibleMonsterIds"][value="monster-1"]').check();
 await row.locator('[data-scene-field="readAloud"]').fill('A porta range ao abrir.');
 await row.locator('[data-scene-field="readAloud"]').blur();
 await row.locator('[data-scene-field="description"]').fill('O segredo está atrás da parede.');
 await row.locator('[data-scene-field="description"]').blur();
 const saved=await stored(page),scene=saved.scenes.find(s=>s.id==='scene-1');
 expect(scene.visibleNpcIds).toEqual(['npc-1']);
 expect(scene.visibleMonsterIds).toEqual(['monster-1']);
 expect(scene.missionIds).toEqual(['objective-1']);
 expect(scene.readAloud).toContain('porta range');
 expect(scene.description).toContain('segredo');
 const projection=await page.evaluate(async({id})=>{
  const {revealedAdventureProjection}=await import('/scripts/collaboration-model.js?v=20261027-scenes-cast-v1');
  const a=JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))[0],c=JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0];
  return revealedAdventureProjection(a,c).scenes.find(s=>s.id===id);
 },{id:'scene-1'});
 expect(projection.npcNames).toEqual(['Aldeã']);
 expect(projection.monsterNames).toEqual(['Ogro']);
 expect(projection).not.toHaveProperty('missionIds');
 expect(projection.description).toBeUndefined();
 await page.locator('#criar-cena #new-scene-title').fill('Cena seguinte');
 await page.locator('#criar-cena #new-scene-location').selectOption('area-2');
 await expect(page.locator('#criar-cena [id="new-scene-read-aloud"]')).toHaveCount(0);
 await page.locator('#criar-cena #add-scene').click();
 await expect(page.locator('#cenas [data-scene-row]')).toHaveCount(2);
 const newScene=page.locator('#cenas [data-scene-row]').filter({has:page.locator('strong', {hasText:'Cena seguinte'})});
 await newScene.locator('[data-scene-editor] summary').click();
 await newScene.locator('[data-scene-field="readAloud"]').fill('O portão se abre.');
 await newScene.locator('[data-scene-field="readAloud"]').blur();
 await newScene.locator('[data-scene-field="description"]').fill('Há um segredo.');
 await newScene.locator('[data-scene-field="description"]').blur();
 const second=(await stored(page)).scenes.find(s=>s.title==='Cena seguinte');
 expect(second.areaId).toBe('area-2');
 expect(second.readAloud).toBe('O portão se abre.');
 expect(second.description).toBe('Há um segredo.');
 await expect(page.locator('#linha-tempo .campaign-timeline-flow > .timeline-item')).toHaveCount(2);
 await expect(page.locator('#linha-tempo')).toContainText('Cena seguinte');
 await page.reload();
 await expect(page.locator('#linha-tempo .campaign-timeline-flow > .timeline-item')).toHaveCount(2);
});

test('Locais vinculam NPCs e monstros como inimigos ou aliados e filtram publicação',async({page})=>{
 await visit(page);
 const details=page.locator('#exploracao [data-ex-area="area-1"] [data-ex-area-editor]');
 await details.locator('summary').click();
 await details.locator('[data-ex-ref="npcIds"][value="npc-1"]').check();
 await details.locator('[data-ex-visible="npc"][value="npc-1"]').check();
 await details.locator('[data-ex-ref="npcIds"][value="npc-2"]').check();
 await details.locator('[data-ex-enemy="npc"][value="npc-2"]').check();
 await details.locator('[data-ex-ref="monsterIds"][value="monster-1"]').check();
 await details.locator('[data-ex-enemy="monster"][value="monster-1"]').check();
 await details.locator('[data-ex-visible="monster"][value="monster-1"]').check();
 await details.locator('[data-ex-field="status"]').selectOption('discovered');
 await details.locator('[data-ex-save-area]').click();
 const saved=(await stored(page)).exploration.areas.find(a=>a.id==='area-1');
 expect(saved.npcIds).toEqual(['npc-1','npc-2']);
 expect(saved.enemyNpcIds).toEqual(['npc-2']);
 expect(saved.monsterIds).toEqual(['monster-1']);
 expect(saved.enemyMonsterIds).toEqual(['monster-1']);
 expect(saved.visibleNpcIds).toEqual(['npc-1']);
 expect(saved.visibleMonsterIds).toEqual(['monster-1']);
 await expect(page.locator('#exploracao [data-ex-area="area-1"] .adventure-presence-summary')).toContainText('Bandido');
 // Publication is gated by the parent location visibility.
 const output=await page.evaluate(async()=>{
  const {revealedAdventureProjection}=await import('/scripts/collaboration-model.js?v=20261027-scenes-cast-v1');
  const a=JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))[0],c=JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0];
  a.exploration.areas[0].visibleToPlayers=true;
  return revealedAdventureProjection(a,c).exploration.areas[0];
 });
 expect(output.npcs.map(n=>n.name)).toEqual(['Aldeã']);
 expect(output.monsters.map(m=>m.name)).toEqual(['Ogro']);
 expect(output.npcs.some(n=>n.name==='Bandido')).toBe(false);
});
