import{test,expect}from'@playwright/test';
const campaign={id:'e2e-npc-campaign',name:'Reinos de Prata',status:'current',members:[],sessions:[],importantNpcIds:[],importantLocations:'Sharn\nVale das Névoas',activeMissions:'Encontrar a coroa',timeline:'Chegada\nDescoberta',dmNotes:'Nota secreta'};
const npc={id:'npc-e2e-1',name:'Arante',refs:{class:null,species:null,background:null,subclass:null},choices:{class:{level:2}},baseAbilities:{}};
const master={uid:'u-e2e-master',username:'rafael',isMaster:true,memberships:[]},player={uid:'u-e2e-player',username:'bruno',isMaster:false,memberships:[]};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(data=>{
  if(!localStorage.getItem('hub-rpg:collaboration-session:v1'))localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(data.master));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  if(!localStorage.getItem('hub-rpg:npcs:v1'))localStorage.setItem('hub-rpg:npcs:v1',JSON.stringify([data.npc]));
 },{master,campaign,npc});
});
test('NPCs existem sob Personagens no menu do Mestre',async({page})=>{
 await page.goto('/npcs.html');
 await expect(page.locator('.hub-nav-link', {hasText:'NPCs'})).toBeVisible();
 await expect(page.locator('#npc-list')).toContainText('Arante');
 await expect(page.locator('[href="criacao-personagem.html?npc=1"]').first()).toBeVisible();
});
test('Campanha apresenta NPC selecionável, marcadores e linha do tempo sem Encontros e Materiais',async({page})=>{
 await page.goto('/mesa.html?id=e2e-npc-campaign');
 await expect(page.locator('#npcs')).toBeVisible();
 await expect(page.locator('#locais .campaign-bullet-list li')).toHaveCount(2);
 await expect(page.locator('#missoes .campaign-bullet-list li')).toHaveCount(1);
 await expect(page.locator('#linha-tempo .campaign-flow-step')).toHaveCount(2);
 await expect(page.locator('#materiais')).toHaveCount(0);
 await expect(page.locator('#encontros')).toHaveCount(0);
 const order=await page.locator('#notas-mestre,#linha-tempo').evaluateAll(nodes=>nodes.map(node=>node.id));
 expect(order).toEqual(['linha-tempo','notas-mestre']);
 await page.locator('#campaign-npc-picker').selectOption('npc-e2e-1');
 await page.locator('[data-add-npc]').click();
 await expect(page.locator('#npcs')).toContainText('Arante');
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]')[0]);
 expect(data.importantNpcIds).toEqual(['npc-e2e-1']);
 await page.reload();
 await expect(page.locator('#npcs a[href*="npc=1"]')).toContainText('Arante');
 await page.locator('#locais [data-new-line]').fill('Nova região');
 await page.locator('#locais [data-add-line]').click();
 await expect(page.locator('#locais .campaign-bullet-list li')).toHaveCount(3);
 await page.locator('#linha-tempo [data-new-timeline]').fill('Revelação');
 await page.locator('#linha-tempo [data-timeline-add-root]').click();
 await expect(page.locator('#linha-tempo .campaign-flow-step')).toHaveCount(3);
 await page.locator('#linha-tempo .timeline-tree > .timeline-item').nth(2).locator('[data-timeline-move="up"]').first().click();
 const updated=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]')[0]);
 expect(updated.timeline.split('\n')).toEqual(['Chegada','Revelação','Descoberta']);
});
test('jogador não vê NPCs e não pode acessar a biblioteca',async({page})=>{
 await page.goto('/npcs.html');
 await page.evaluate(player=>localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(player)),player);
 await page.reload();
 await expect(page).toHaveURL(/personagens\.html/);
 await expect(page.locator('.hub-nav-link', {hasText:'NPCs'})).toHaveCount(0);
});


test('Mestre cria NPC pelo mesmo construtor de personagens, sem atribuição a jogador',async({page})=>{
 await page.goto('/criacao-personagem.html?npc=1#etapa-origem');
 await expect(page.getByRole('heading',{name:'Criação de NPC'})).toBeVisible();
 await expect(page.locator('#profile-player').locator('xpath=..')).toBeHidden();
 await expect(page.locator('#nome')).toBeVisible({timeout:30000});
 await page.locator('#nome').fill('NPC de Validação');
 await page.locator('#save').click();
 await expect(page.locator('#save-status')).toContainText('Salvo');
 const stored=await page.evaluate(()=>({
  npcs:JSON.parse(localStorage.getItem('hub-rpg:npcs:v1')||'[]'),
  pcs:JSON.parse(localStorage.getItem('hub-rpg:characters:v4')||'[]')
 }));
 expect(stored.npcs.some(n=>n.name==='NPC de Validação')).toBe(true);
 expect(stored.pcs.some(n=>n.name==='NPC de Validação')).toBe(false);
});
