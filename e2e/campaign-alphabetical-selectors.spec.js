import{test,expect}from'@playwright/test';

const account={uid:'u-e2e-master',username:'rafael',isMaster:true,memberships:[]};
const players=[
 {username:'zuleica',displayName:'Zuleica'},
 {username:'bruno',displayName:'Bruno'},
 {username:'erica',displayName:'Érica'},
 {username:'alvaro',displayName:'Álvaro'}
];
const characters=[
 {id:'zorro',name:'Zorro'}, {id:'mago-10',name:'Mago 10'},
 {id:'aria',name:'Ária'}, {id:'ebano',name:'Ébano'},
 {id:'mago-2',name:'Mago 2'}
];
const campaign={id:'camp-alphabetical',name:'Campanha alfabética',status:'active',system:'D&D 5.5e',
 members:[{id:'member-bruno',username:'bruno',name:'Bruno',role:'player',characterId:'aria'}],
 sessions:[]};

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password',playerAccounts:players})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(data.account));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(data.characters));
 },{account,campaign,characters});
});

test('Adicionar jogador ordena alfabeticamente jogadores e personagens disponíveis',async({page})=>{
 await page.goto('/mesa.html?id=camp-alphabetical');
 const player=page.locator('#new-member-user');
 const character=page.locator('#new-member-character');
 await expect(player).toBeVisible();
 await expect(character).toBeVisible();
 await expect(player.locator('option')).toHaveText(['— Selecione —','Álvaro','Érica','Zuleica']);
 await expect(character.locator('option')).toHaveText([
  '— Sem personagem —','Ébano','Mago 2','Mago 10','Zorro'
 ]);
 // A seleção do jogador não altera a ordenação dos personagens disponíveis.
 await player.selectOption('zuleica');
 await expect(character.locator('option')).toHaveText([
  '— Sem personagem —','Ébano','Mago 2','Mago 10','Zorro'
 ]);
 await character.selectOption('ebano');
 await page.locator('#add-member').click();
 await expect(page.locator('[data-member-row]')).toHaveCount(2);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]')[0]);
 expect(stored.members.find(x=>x.username==='zuleica')?.characterId).toBe('ebano');
 await expect(player.locator('option')).toHaveText(['— Selecione —','Álvaro','Érica']);
 await expect(character.locator('option')).toHaveText([
  '— Sem personagem —','Mago 2','Mago 10','Zorro'
 ]);
});

test('troca de personagem mantém seleção e ordenação nos jogadores existentes',async({page})=>{
 await page.goto('/mesa.html?id=camp-alphabetical');
 const existing=page.locator('[data-member-row="member-bruno"]');
 await expect(existing.locator('[data-member-user]')).toHaveCount(0);
 await expect(existing.locator('.roster-player-name')).toHaveText('Bruno');
 await expect(existing.locator('[data-member-character] option')).toHaveText([
  '— Sem personagem —','Ária','Ébano','Mago 2','Mago 10','Zorro'
 ]);
 await expect(existing.locator('[data-member-character]')).toHaveValue('aria');
});
