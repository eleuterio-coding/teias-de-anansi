import{test,expect}from'@playwright/test';
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';
const campaign={id:'e2e-portrait-campaign',name:'Reinos de Prata',status:'active',system:'D&D 5.5e',setting:'Forgotten Realms',worldPlane:'Toril',mainRegion:'Costa da Espada',description:'Campanha compartilhada',
 members:[{id:'f1',username:'fernanda',name:'Fernanda',role:'player',characterId:'char-f',active:true},{id:'g1',username:'gustavo',name:'Gustavo',role:'player',characterId:'char-g',active:true}],
 sessions:[{id:'old',title:'Introdução',number:1,order:1,status:'completed'},{id:'next',title:'Travessia',number:3,order:3,status:'next'},{id:'current',title:'Confronto',number:2,order:2,status:'current'}],
 timelineNodes:[{id:'a',text:'A chegada',visibleToPlayers:true,children:[{id:'b',text:'Descoberta',visibleToPlayers:true,children:[]}]}]
};
const chars=[
 {id:'char-f',name:'Aluria',portraitDataUrl:photo,refSnapshots:{class:{name:'Patrulheira'}},choices:{class:{level:4}}},
 {id:'char-g',name:'Dongron',portraitDataUrl:photo,refSnapshots:{class:{name:'Patrulheiro'}},choices:{class:{level:3}}}
];
const people=[{username:'fernanda',displayName:'Fernanda',avatarDataUrl:photo},{username:'gustavo',displayName:'Gustavo',avatarDataUrl:photo}];
const membership={campaignId:campaign.id,uid:'f-user',username:'fernanda',role:'player',characterId:'char-f',active:true,adventureIds:['adv'],sessionIds:['old','next','current']};
const shared={
 ...campaign,importantNpcEntries:[],importantLocationEntries:[],historySummary:'',
 timeline:'A chegada\nDescoberta',timelineNodes:[{id:'a',text:'A chegada',children:[{id:'b',text:'Descoberta',children:[]}]}]
};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password',playerAccounts:people.map(p=>({username:p.username,displayName:p.displayName}))})}));
});
test('Mestre: Campanha, status Atual, próxima sessão e retratos em participantes',async({page})=>{
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'dm-user',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(data.chars));
  localStorage.setItem('hub-rpg:user-avatar-cache:v1',JSON.stringify(data.people));
 },{campaign,chars,people});
 await page.goto('/mesa.html?id='+campaign.id);
 await expect(page.locator('#proxima-sessao')).toContainText('PLANEJAMENTO DA CAMPANHA');
 await expect(page.locator('#proxima-sessao')).toContainText('Sessão Atual');
 await expect(page.locator('#proxima-sessao')).toContainText('Confronto');
 await expect(page.locator('.campaign-product-summary')).toContainText('Sessão Anterior');
 await expect(page.locator('.campaign-product-summary')).toContainText('Próxima Sessão');
 await expect(page.locator('.campaign-product-summary a').filter({hasText:'Próxima Sessão'})).toHaveAttribute('href',/id=next/);
 await expect(page.locator('#jogadores [data-member-row="f1"] .roster-player-label')).toHaveText('Jogadora');
 await expect(page.locator('#jogadores [data-member-row="f1"] .hub-user-photo img')).toBeVisible();
 await expect(page.locator('#jogadores [data-member-row="f1"] .hub-character-photo img')).toBeVisible();
 await expect(page.locator('#jogadores [data-member-row="g1"] .roster-player-label')).toHaveText('Jogador');
});
test('Sessões aceitam status Atual em novas e existentes',async({page})=>{
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'dm-user',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data]));
 },campaign);
 await page.goto('/sessoes.html?campaign='+campaign.id+'&new=1');
 await expect(page.locator('#new-session-status option[value="current"]')).toHaveText('Atual');
 await page.goto('/sessoes.html?campaign='+campaign.id+'&id=current');
 await expect(page.locator('[data-session-field="status"] option[value="current"]')).toHaveCount(1);
});
test('Jogador: cards pareados e imagens; sessões Atual antes de Próxima; linha do tempo em duas visões',async({page})=>{
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'f-user',username:'fernanda',isMaster:false,memberships:[data.membership]}));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify({campaigns:{[data.campaign.id]:{membership:data.membership,payload:{campaign:data.shared,participants:data.people,revealedAdventures:[{id:'adv',campaignId:data.campaign.id,title:'As Rainhas',summary:'Aventura importante',status:'current'}]},characters:data.chars,characterIds:data.chars.map(c=>c.id)}}}));
 },{campaign,shared,membership,people,chars});
 await page.goto('/mesa.html?id='+campaign.id);
 await expect(page.locator('#jogadores .campaign-player-roster-row')).toHaveCount(2);
 await expect(page.locator('#jogadores .campaign-player-roster-row').first()).toContainText('Jogadora');
 await expect(page.locator('#jogadores .hub-user-photo img')).toHaveCount(2);
 await expect(page.locator('#jogadores .hub-character-photo img')).toHaveCount(2);
 await expect(page.locator('#campanha')).toContainText('Toril');
 await expect(page.locator('#campanha')).toContainText('Costa da Espada');
 const first=page.locator('#sessoes .campaign-player-story-card').first();
 await expect(first).toContainText('Confronto');
 await expect(page.locator('#sessoes .campaign-player-story-card').nth(1)).toContainText('Travessia');
 const pair=await page.evaluate(()=>{
  const bounds=id=>document.getElementById(id).getBoundingClientRect();
  return{camp:bounds('campanha'),players:bounds('jogadores'),adventures:bounds('aventuras'),sessions:bounds('sessoes')}
 });
 if((page.viewportSize()?.width||0)>820){
  expect(Math.abs(pair.camp.y-pair.players.y)).toBeLessThan(5);
  expect(Math.abs(pair.adventures.y-pair.sessions.y)).toBeLessThan(5);
 }else{
  expect(pair.players.y).toBeGreaterThan(pair.camp.y);
  expect(pair.sessions.y).toBeGreaterThan(pair.adventures.y);
 }
 await expect(page.locator('#linha-tempo [data-player-timeline-collapse]')).toHaveCount(1);
 await page.locator('#linha-tempo [data-player-timeline-collapse]').click();
 await expect(page.locator('#linha-tempo .campaign-player-event-children').first()).toBeHidden();
 await page.locator('#linha-tempo [data-player-timeline-view="flowchart"]').click();
 await expect(page.locator('#linha-tempo .campaign-player-diagram')).toBeVisible();
 await page.locator('#linha-tempo [data-player-timeline-collapse]').click();
 await expect(page.locator('#linha-tempo .campaign-player-event-children').first()).toBeHidden();
 await expect(page.locator('#jogadores input,#jogadores select,#jogadores button')).toHaveCount(0);
});
test('Menu Usuário imediatamente acima de Configurações',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]})));
 await page.goto('/usuario.html');
 const nav=page.locator('.hub-nav-secondary .hub-nav-link');
 await expect(nav).toHaveCount(2);
 await expect(nav.first()).toContainText('Usuário');
 await expect(nav.nth(1)).toContainText('Configurações');
 await expect(page.getByRole('heading',{name:'Usuário'})).toBeVisible();
});
test('Cards continuam empilhados no celular',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'f-user',username:'fernanda',isMaster:false,memberships:[data.membership]}));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify({campaigns:{[data.campaign.id]:{membership:data.membership,payload:{campaign:data.shared,participants:data.people,revealedAdventures:[{id:'adv',campaignId:data.campaign.id,title:'As Rainhas'}]},characters:data.chars,characterIds:data.chars.map(c=>c.id)}}}));
 },{campaign,shared,membership,people,chars});
 await page.goto('/mesa.html?id='+campaign.id);
 const positions=await page.evaluate(()=>{
  const r=id=>document.getElementById(id).getBoundingClientRect();
  return{camp:r('campanha'),players:r('jogadores'),adventures:r('aventuras'),sessions:r('sessoes')}
 });
 expect(positions.players.top).toBeGreaterThan(positions.camp.top);
 expect(positions.sessions.top).toBeGreaterThan(positions.adventures.top);
});
