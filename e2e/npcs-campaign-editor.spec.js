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
test('Menu do Mestre abre a listagem e mantém a criação de NPC',async({page})=>{
 await page.goto('/npcs.html');
 await expect(page.getByRole('heading',{name:'NPCs',exact:true})).toBeVisible();
 await expect(page.locator('a[href="lista-npcs.html"]')).toBeVisible();
 await expect(page.locator('a[href="criacao-personagem.html?npc=1"]')).toBeVisible();
 await page.locator('a[href="lista-npcs.html"]').click();
 await expect(page.locator('#npc-list')).toContainText('Arante');
 await expect(page.locator('#npc-master-actions')).toBeVisible();
});
test('Campanha seleciona NPC e mantém Locais e Linha do Tempo',async({page})=>{
 await page.goto('/mesa.html?id=e2e-npc-campaign');
 await expect(page.locator('#npcs')).toBeVisible();
 await expect(page.locator('#locais .campaign-bullet-list li')).toHaveCount(2);
 await expect(page.locator('#missoes')).toHaveCount(0);
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
 // O editor da Campanha conserva a Linha do Tempo existente; novos
 // eventos são criados no fluxo narrativo, não neste card.
 await expect(page.locator('#linha-tempo .timeline-tree > .timeline-item')).toHaveCount(2);
 await expect(page.locator('#linha-tempo')).toContainText('Linha do tempo');
});
test('Jogador consulta apenas NPCs públicos e não acessa controles do Mestre',async({page})=>{
 await page.goto('/npcs.html');
 await page.evaluate(player=>localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(player)),player);
 await page.reload();
 await expect(page).toHaveURL(/npcs\\.html/);
 await expect(page.locator('[data-master-only]')).toBeHidden();
 await expect(page.locator('a[href="lista-npcs.html"]')).toBeVisible();
 await page.locator('a[href="lista-npcs.html"]').click();
 await expect(page.locator('#npc-list [data-npc-id="npc-e2e-1"]')).toHaveCount(0);
 await expect(page.locator('#npc-list')).not.toContainText('Arante');
 await expect(page.locator('#npc-master-actions')).toBeHidden();
 await expect(page.locator('#npc-editor')).toBeHidden();
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
