import{test,expect}from'@playwright/test';

const source={
 id:'e2e-adv-source',name:'Reinos de Prata',status:'active',system:'D&D 5.5e',
 members:[{id:'member-1',username:'bruno',role:'player',characterId:'pc-1',active:true}],
 sessions:[{id:'session-1',number:1,title:'Sessão anterior',adventureId:'adv-original',
  scenes:[{id:'session-scene-1',title:'Cena da sessão',adventureSceneId:'scene-1'}]}]
};
const destination={id:'e2e-adv-dest',name:'Campanha de destino',status:'planned',system:'D&D 5.5e',members:[],sessions:[]};
const original={id:'adv-original',campaignId:source.id,title:'As Rainhas',status:'planned',
 chapters:[{id:'chapter-1',title:'O chamado'}],
 scenes:[{id:'scene-1',title:'Conselho das Rainhas',chapterId:'chapter-1',sessionId:'session-1',sessionSceneId:'session-scene-1'}],
 missions:[{id:'mission-1',title:'Defender a cidade'}],
 participantUsernames:['bruno'],characterIds:['pc-1']
};

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.source,data.destination]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.original]));
 },{source,destination,original});
});

test('mudar a campanha no editor reatribui a mesma aventura sem criar duplicata',async({page})=>{
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('/aventuras.html?campaign=e2e-adv-source&id=adv-original');
 await expect(page.locator('#adventure-assignment')).toHaveValue('e2e-adv-source');
 await expect(page.locator('#create-adventure')).toHaveCount(0);
 await page.locator('#adventure-assignment').selectOption('e2e-adv-dest');
 await expect(page.locator('#adventure-assignment')).toHaveValue('e2e-adv-dest');
 await expect(page).toHaveURL(/campaign=e2e-adv-dest.*id=adv-original/);
 await expect(page.locator('.adventure-card')).toHaveCount(0);
 await expect(page.locator('.adventure-operational h2')).toHaveText('As Rainhas');
 const persisted=await page.evaluate(()=>({
  adventures:JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')||'[]'),
  campaigns:JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]')
 }));
 expect(persisted.adventures).toHaveLength(1);
 expect(persisted.adventures[0]).toMatchObject({
  id:'adv-original',campaignId:'e2e-adv-dest',title:'As Rainhas'
 });
 expect(persisted.adventures[0].chapters).toHaveLength(1);
 expect(persisted.adventures[0].scenes[0]).toMatchObject({id:'scene-1',title:'Conselho das Rainhas',sessionId:null});
 expect(persisted.adventures[0].missions[0].id).toBe('mission-1');
 expect(persisted.campaigns[0].sessions[0].adventureId).toBeNull();
 expect(persisted.campaigns[0].sessions[0].scenes[0].adventureSceneId).toBeNull();
});

test('escolher a Campanha ao criar não reatribui uma aventura existente',async({page})=>{
 await page.goto('/aventuras.html');
 await expect(page.locator('#adventure-assignment')).toHaveCount(0);
 await page.locator('#open-adventure-create').click();
 await expect(page.locator('#create-adventure')).toBeVisible();
 await page.locator('#adventure-campaign').selectOption('e2e-adv-dest');
 await expect(page.locator('#adventure-assignment')).toHaveCount(0);
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')||'[]'));
 expect(rows).toHaveLength(1);
 expect(rows[0].campaignId).toBe('e2e-adv-source');
});
