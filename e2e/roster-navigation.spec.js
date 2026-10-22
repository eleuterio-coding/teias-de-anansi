import {test,expect} from '@playwright/test';
const character={id:'pc1',name:'Arannis',ownerUsername:'gus',refSnapshots:{class:{name:'Mago'},species:{name:'Humano'},background:{name:'Sábio'}},choices:{class:{level:5}}};
const other={id:'pc2',name:'Tharion',refSnapshots:{class:{name:'Guerreiro'}}};
const outsider={id:'pc3',name:'Pessoa Fora da Campanha'};
const campaign={id:'cmp1',name:'Reinos de Prata',members:[{id:'m1',username:'gus',name:'Gustavo',role:'player',characterId:'pc1'},{id:'m2',username:'leo',name:'Léo',role:'player',characterId:'pc2'}],sessions:[{id:'session1',number:1,title:'Encontro inicial',status:'completed',adventureId:'adv2',participantCharacterIds:['pc1'],scenes:[{id:'s-npc',status:'completed',npcIds:['npc1']}]},{id:'session2',number:2,title:'Sessão futura',status:'planned',adventureId:'adv1',participantCharacterIds:['pc1'],scenes:[]}],locations:[{id:'loc1',name:'Taverna da Coruja'}],npcs:[{id:'npc1',name:'Merlin',status:'vivo'},{id:'npc2',name:'Vilão secreto',status:'vivo'}],npcDirectory:[{id:'npc1',name:'Merlin',role:'Mentor',status:'vivo',visibleToPlayers:true,publicName:'Sábio',publicRole:'Mentor'}]};
const adventures=[{id:'adv1',campaignId:'cmp1',title:'As Rainhas',status:'active',order:2,characterIds:['pc1'],npcIds:['npc1'],locationIds:['loc1'],activeSceneId:'scene1',scenes:[{id:'scene1',status:'active',locationId:'loc1',npcIds:['npc1']}]},{id:'adv2',campaignId:'cmp1',title:'O Prelúdio',status:'completed',order:1,characterIds:['pc1'],npcIds:['npc1'],locationIds:[],scenes:[]}];
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(({character,other,outsider,campaign,adventures})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([character,other,outsider]));
  localStorage.setItem('hub-rpg:npcs:v1',JSON.stringify([{id:'npc1',name:'Merlin',refSnapshots:{class:{name:'Mago'},species:{name:'Elfo'},background:{name:'Erudito'}},choices:{class:{level:8}}}]));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify(adventures));
 },{character,other,outsider,campaign,adventures});
});
test('Menus oferecem quatro cards em duas colunas e sem criação no topo',async({page})=>{
 await page.goto('/personagens.html');
 await expect(page.locator('.hub-roster-menu li')).toHaveCount(4);
 await expect(page.getByText('Abrir fichas',{exact:true})).toBeVisible();
 await expect(page.getByText('Aventuras',{exact:true}).last()).toBeVisible();
 await expect(page.locator('.hub-global-topbar').getByText('Novo personagem')).toHaveCount(0);
 expect(await page.locator('.hub-roster-menu').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
 await page.goto('/npcs.html');
 await expect(page.locator('.hub-roster-menu li')).toHaveCount(4);
 await expect(page.locator('.hub-global-topbar').getByText('Novo NPC')).toHaveCount(0);
});
test('Campanhas -> selecionar -> elenco com informações completas',async({page})=>{
 await page.goto('/personagens.html');
 await page.getByRole('link',{name:/Campanhas Selecionar campanha/}).click();
 await expect(page).toHaveURL(/lista-personagens\.html\?mode=campanhas/);
 await page.locator('.hub-roster-choice').filter({hasText:'Reinos de Prata'}).click();
 await expect(page.locator('.pc')).toHaveCount(2);
 const card=page.locator('.pc').filter({hasText:'Arannis'});
 await expect(card).toContainText('Gustavo');
 await expect(card).toContainText('Mago');
 await expect(card).toContainText('Nível 5');
 await expect(card).toContainText('Humano');
 await expect(card).toContainText('Sábio');
 await expect(card).toContainText('As Rainhas');
 await expect(card).toContainText('O Prelúdio');
 await expect(card).toContainText('Taverna da Coruja');
 await expect(card).toContainText('Encontro inicial');
 await expect(card).not.toContainText('Sessão futura');
 await expect(page.getByText('Pessoa Fora da Campanha')).toHaveCount(0);
});
test('Aventuras -> selecionar -> apenas personagens vinculados',async({page})=>{
 await page.goto('/lista-personagens.html?mode=aventuras');
 await page.locator('.hub-roster-choice').filter({hasText:'As Rainhas'}).click();
 await expect(page.locator('.pc')).toHaveCount(1);
 await expect(page.locator('.pc')).toContainText('Arannis');
 await expect(page.getByText('Tharion')).toHaveCount(0);
});
test('NPCs -> Campanhas/Aventuras -> somente os NPCs vinculados',async({page})=>{
 await page.goto('/lista-npcs.html?mode=aventuras');
 await page.locator('.hub-roster-choice').filter({hasText:'As Rainhas'}).click();
 await expect(page.locator('#npc-list .hub-directory-card')).toHaveCount(1);
 await expect(page.locator('#npc-list')).toContainText('Merlin');
 await expect(page.locator('#npc-list')).toContainText('Elfo');
 await expect(page.locator('#npc-list')).toContainText('Taverna da Coruja');
 await expect(page.getByText('Vilão secreto')).toHaveCount(0);
 await page.goto('/lista-npcs.html?mode=campanhas');
 await page.locator('.hub-roster-choice').filter({hasText:'Reinos de Prata'}).click();
 await expect(page.locator('#npc-list .hub-directory-card')).toHaveCount(2);
});
