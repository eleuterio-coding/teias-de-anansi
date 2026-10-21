import{test,expect}from'@playwright/test';

const campaign={
 id:'e2e-session-switch',name:'Reinos de Prata',status:'active',members:[],
 coverImageUrl:'/campanha-capa.svg',
 sessions:[
  {id:'session-old',number:1,order:8,title:'Prólogo',status:'completed',
   adventureId:'adv-old',scenes:[
    {id:'session-scene',title:'Cena importada',adventureSceneId:'adventure-scene',notes:'Preservar esta nota'},
    {id:'session-own',title:'Cena própria',notes:'Não apagar'}]},
  {id:'session-next',number:2,order:9,title:'Próxima sessão',status:'next',adventureId:'adv-new'},
  {id:'session-done',number:3,order:3,title:'Sessão concluída',status:'completed',adventureId:'adv-new'},
  {id:'session-planned',number:4,order:12,title:'Planejada',status:'planned',adventureId:'adv-new'}
 ]
};
const adventures=[
 {id:'adv-old',campaignId:campaign.id,title:'O Cerco',status:'completed',order:1,
  scenes:[{id:'adventure-scene',title:'Cena importada',sessionId:'session-old',sessionSceneId:'session-scene'}]},
 {id:'adv-new',campaignId:campaign.id,title:'As Rainhas',status:'active',order:2,
  coverImageUrl:'/aventura-capa.svg',scenes:[]}
];
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password',playerAccounts:[]})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify(data.adventures));
 },{campaign,adventures});
});
test('Campanha filtra próxima e concluída pela Aventura em andamento, em Ordem decrescente',async({page})=>{
 await page.goto('/mesa.html?id=e2e-session-switch');
 const cards=page.locator('#sessoes .campaign-player-story-card');
 await expect(cards).toHaveCount(2);
 await expect(cards.nth(0)).toContainText('Próxima sessão');
 await expect(cards.nth(1)).toContainText('Sessão concluída');
 await expect(cards.first().locator('.campaign-player-story-open')).toContainText('Abrir');
 await expect(page.locator('#aventuras .campaign-player-story-card').first()).toContainText('As Rainhas');
});
test('Sessão existente troca Aventura e limpa vínculos anteriores sem excluir cenas',async({page})=>{
 await page.goto('/sessoes.html?campaign=e2e-session-switch&id=session-old');
 const card=page.locator('[data-session-id="session-old"]');
 await expect(card.locator('[data-session-adventure]')).toHaveValue('adv-old');
 await expect(card.getByRole('link',{name:'Abrir Campanha'})).toHaveAttribute('href','mesa.html?id=e2e-session-switch');
 await expect(card.locator('[data-remove-session]')).toHaveText('×');
 await expect(card.locator('[data-remove-session]')).toHaveCSS('width','38px');
 await card.locator('[data-session-adventure]').selectOption('adv-new');
 await expect(card.locator('[data-session-adventure]')).toHaveValue('adv-new');
 const data=await page.evaluate(()=>({
  campaign:JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0],
  adventures:JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))
 }));
 const saved=data.campaign.sessions.find(s=>s.id==='session-old');
 expect(saved.adventureId).toBe('adv-new');
 expect(saved.scenes).toHaveLength(2);
 expect(saved.scenes.find(s=>s.id==='session-scene')).toMatchObject({adventureSceneId:null,notes:'Preservar esta nota'});
 expect(saved.scenes.find(s=>s.id==='session-own')).toMatchObject({title:'Cena própria',notes:'Não apagar'});
 expect(data.adventures[0].scenes[0]).toMatchObject({sessionId:null,sessionSceneId:null});
 await page.goto('/mesa.html?id=e2e-session-switch');
 await expect(page.locator('#sessoes .campaign-player-story-card')).toHaveCount(3);
 await expect(page.locator('#sessoes .campaign-player-story-card').first()).toContainText('Próxima sessão');
 await expect(page.locator('#sessoes .campaign-player-story-card').nth(1)).toContainText('Prólogo');
});
test('Novo status Atual não é oferecido na criação de sessões',async({page})=>{
 await page.goto('/sessoes.html?campaign=e2e-session-switch&new=1');
 const values=await page.locator('#new-session-status option').evaluateAll(options=>options.map(option=>option.value));
 expect(values).toEqual(['planned','next','completed','cancelled']);
});
