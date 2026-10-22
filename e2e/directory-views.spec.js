import {test,expect} from '@playwright/test';

const master={uid:'m-1',username:'rafael',isMaster:true,memberships:[]};
const membership={campaignId:'camp-1',uid:'p-1',username:'gus',role:'player',active:true,characterId:'pj-1',sessionIds:[],adventureIds:[]};
const player={uid:'p-1',username:'gus',isMaster:false,memberships:[membership]};
const npc={id:'npc-1',name:'Nome verdadeiro secreto',refSnapshots:{class:{name:'Mago'}},choices:{class:{level:5}},updatedAt:'2026-10-22T00:00:00Z'};
const campaign={id:'camp-1',name:'Reinos de Prata',status:'active',members:[{id:'m1',name:'Gus',username:'gus',role:'player',characterId:'pj-1'}],sessions:[],npcDirectory:[],npcs:[]};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
});

test('Mestre pode vincular NPC existente, configurar revelação e consultar ficha atual',async({page})=>{
 await page.addInitScript(({master,campaign,npc})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(master));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
  localStorage.setItem('hub-rpg:npcs:v1',JSON.stringify([npc]));
 },{master,campaign,npc});
 await page.goto('/lista-npcs.html');
 await expect(page.getByRole('heading',{name:'NPCs',exact:true})).toBeVisible();
 await expect(page.locator('#npc-list').getByRole('heading',{name:npc.name})).toBeVisible();
 await expect(page.locator('#npc-master-actions')).toBeVisible();
 await expect(page.locator('#npc-list').getByRole('link',{name:'Abrir ficha'})).toBeVisible();
 await page.locator('#npc-list [data-config-npc="npc-1"]').click();
 await expect(page.locator('#npc-editor')).toBeVisible();
 await page.locator('#npc-role').fill('Antagonista oculto');
 await page.locator('#npc-notes').fill('NUNCA_REVELAR_123');
 await page.locator('#npc-reveal').check();
 await page.locator('#npc-public-name').fill('Lorde Seren');
 await page.locator('#npc-public-role').fill('Nobre');
 await page.locator('#npc-public-relationship').fill('Amigável');
 await page.locator('#npc-directory-form button[type="submit"]').click();
 const entry=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0].npcDirectory[0]);
 expect(entry.id).toBe('npc-1');
 expect(entry.visibleToPlayers).toBe(true);
 expect(entry.publicName).toBe('Lorde Seren');
 expect(entry.notes).toBe('NUNCA_REVELAR_123');
 await expect(page.locator('#npc-list').getByText('Revelado')).toBeVisible();
});

test('Jogador vê apenas os NPCs revelados, sem acesso aos dados privados ou ações administrativas',async({page})=>{
 const publicCampaign={id:'camp-1',name:'Reinos de Prata',npcPublicEntries:[{id:'npc-1',name:'Lorde Seren',role:'Nobre',relationship:'Amigável',description:'Um nobre local.'}]};
 const cache={campaigns:{'camp-1':{membership,payload:{campaign:publicCampaign,revealedAdventures:[]},characters:[],characterIds:['pj-1']}}};
 await page.addInitScript(({player,cache,campaign,npc})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(player));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify(cache));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([{...campaign,npcs:[{id:'hidden',name:'Vilão secreto',notes:'NUNCA_REVELAR_123'}]}]));
  localStorage.setItem('hub-rpg:npcs:v1',JSON.stringify([npc]));
 },{player,cache,campaign,npc});
 await page.goto('/lista-npcs.html');
 await expect(page.locator('#npc-list').getByRole('heading',{name:'Lorde Seren'})).toBeVisible();
 await expect(page.locator('#npc-list').getByText('Nobre')).toBeVisible();
 await expect(page.getByText('Nome verdadeiro secreto')).toHaveCount(0);
 await expect(page.getByText('Vilão secreto')).toHaveCount(0);
 await expect(page.getByText('NUNCA_REVELAR_123')).toHaveCount(0);
 await expect(page.locator('#npc-master-actions')).toBeHidden();
 await expect(page.locator('#npc-editor')).toBeHidden();
 await expect(page.locator('.hub-nav-link[href="npcs.html"]')).toBeVisible();
 await page.locator('#npc-list .hub-directory-details summary').click();
 const note=page.locator('[data-npc-note]');
 await note.fill('Meu palpite sobre o nobre.');
 await page.locator('[data-save-player-note]').click();
 await page.reload();
 await page.locator('#npc-list .hub-directory-details summary').click();
 await expect(page.locator('[data-npc-note]')).toHaveValue('Meu palpite sobre o nobre.');
});

test('Personagens compartilham a lista e respeitam controle de edição do jogador',async({page})=>{
 const owned={id:'pj-1',name:'Arannis',ownerUid:'p-1',ownerUsername:'gus',refSnapshots:{class:{name:'Mago'}},choices:{class:{level:4}}};
 const peer={id:'pj-2',name:'Tharion',ownerUid:'p-2',ownerUsername:'leo'};
 const sharedCampaign={...campaign,members:[...campaign.members,{id:'m2',name:'Leo',role:'player',characterId:'pj-2'}]};
 const cache={campaigns:{'camp-1':{membership,payload:{campaign:sharedCampaign,revealedAdventures:[]},characters:[owned,peer],characterIds:['pj-1','pj-2']}}};
 await page.addInitScript(({player,owned,peer,cache})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(player));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify(cache));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([owned,peer]));
 },{player,owned,peer,cache});
 await page.goto('/lista-personagens.html');
 await expect(page.getByRole('heading',{name:'Personagens',exact:true})).toBeVisible();
 await expect(page.locator('.pc').filter({hasText:'Arannis'})).toContainText('Seu personagem');
 await expect(page.locator('.pc').filter({hasText:'Tharion'})).toContainText('somente leitura');
 await expect(page.locator('.pc').filter({hasText:'Tharion'}).getByText('Editar estrutura')).toHaveCount(0);
 await page.locator('#directory-search').fill('Tharion');
 await expect(page.locator('.pc')).toHaveCount(1);
 await page.locator('#view-list').click();
 await expect(page.locator('#lista')).toHaveClass(/is-list/);
});
