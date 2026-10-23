import{test,expect}from'@playwright/test';
const master={uid:'mestre-e2e',username:'rafael',isMaster:true,memberships:[]};
const campaign={id:'edit-tree-test',name:'Reinos de Prata',status:'current',
 members:[{id:'fernanda-row',username:'fernanda',name:'Fernanda',role:'player',characterId:'pc-auria'}],
 sessions:[],importantLocations:'Sharn\nCitadela Sem Sol',activeMissions:'Encontrar a Coroa',
 timeline:'Chegada à cidade\nDescoberta do portal',dmNotes:'Segredo importante'};
const characters=[{id:'pc-auria',name:'Áuria'}];
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',
 body:JSON.stringify({enabled:false,authMode:'username-password',playerAccounts:[{username:'fernanda',displayName:'Fernanda'}]})}));
 await page.addInitScript(data=>{
  if(!localStorage.getItem('hub-rpg:collaboration-session:v1'))localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(data.master));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  if(!localStorage.getItem('hub-rpg:characters:v4'))localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(data.characters));
 },{master,campaign,characters});
});
test('Jogador da Mesa é nome fixo, sem dropdown e Notas do Mestre vem por último',async({page})=>{
 await page.goto('/mesa.html?id=edit-tree-test');
 const player=page.locator('[data-member-row="fernanda-row"]');
 await expect(player.locator('.roster-player-name')).toHaveText('Fernanda');
 await expect(player.locator('[data-member-user]')).toHaveCount(0);
 await expect(player.locator('[data-member-character]')).toHaveValue('pc-auria');
 const ids=await page.locator('.campaign-sections > section').evaluateAll(nodes=>nodes.map(n=>n.id));
 expect(ids[ids.length-1]).toBe('notas-mestre');
 expect(ids[ids.length-2]).toBe('linha-tempo');
 await expect(page.locator('#missoes')).toHaveCount(0);
});
test('Locais permitem editar nomes sem exibir Atos antigos',async({page})=>{
 await page.goto('/mesa.html?id=edit-tree-test');
 await page.locator('#locais [data-edit-line]').first().fill('Sharn revisitada');
 await page.locator('#locais [data-edit-line]').first().press('Tab');
 await expect(page.locator('#missoes')).toHaveCount(0);
 await page.reload();
 await expect(page.locator('#locais [data-edit-line]').first()).toHaveValue('Sharn revisitada');
 await expect(page.locator('#missoes')).toHaveCount(0);
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0]);
 expect(persisted.importantLocations).toContain('Sharn revisitada');
 expect(persisted.activeMissions).toBe('Encontrar a Coroa');
});
test('Linha do tempo preserva eventos legados, edita e organiza sem botão de criação',async({page})=>{
 await page.goto('/mesa.html?id=edit-tree-test');
 const area=page.locator('#linha-tempo');
 const roots=area.locator('.timeline-tree > .timeline-item');
 await expect(roots).toHaveCount(2);
 await expect(area.locator('[data-timeline-add-root],[data-timeline-add-child],[data-new-timeline]')).toHaveCount(0);
 await roots.first().locator('[data-timeline-text]').first().fill('Chegada à Citadela');
 await roots.first().locator('[data-timeline-text]').first().press('Tab');
 await roots.nth(1).locator('[data-timeline-move="indent"]').click();
 await expect(roots).toHaveCount(1);
 await expect(roots.first().locator(':scope > .timeline-children > .timeline-item')).toHaveCount(1);
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0]);
 expect(data.timelineNodes).toHaveLength(1);
 expect(data.timelineNodes[0].text).toBe('Chegada à Citadela');
 expect(data.timelineNodes[0].children[0].text).toBe('Descoberta do portal');
 await page.reload();
 await expect(area.locator('.timeline-tree > .timeline-item')).toHaveCount(1);
 await expect(area.locator('#timeline-list-children-legacy-timeline-1')).toBeHidden();
 await area.locator('[data-timeline-card-toggle="legacy-timeline-1"]').click();
 await expect(area.locator('#timeline-list-children-legacy-timeline-1')).toBeVisible();
});

test('Controles acessíveis reorganizam subeventos no mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/mesa.html?id=edit-tree-test');
 const area=page.locator('#linha-tempo');
 const second=area.locator('.timeline-tree > .timeline-item').nth(1);
 await second.locator('[data-timeline-move="indent"]').first().click();
 await expect(area.locator('.timeline-tree > .timeline-item')).toHaveCount(1);
 await expect(area.locator('.timeline-children > .timeline-item')).toHaveCount(1);
 await area.locator('.timeline-children > .timeline-item').first().locator('[data-timeline-move="outdent"]').first().click();
 await expect(area.locator('.timeline-tree > .timeline-item')).toHaveCount(2);
});
