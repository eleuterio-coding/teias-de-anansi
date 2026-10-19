import{test,expect}from'@playwright/test';

const session={uid:'e2e-roster-master',username:'rafael',isMaster:true,memberships:[]};
const campaign={
 id:'e2e-campaign-roster-images',name:'Reinos de Prata',status:'active',system:'D&D 5.5e',
 importantLocations:'Fenda do Carvalho\nPortão de Baldur',
 members:[
  {id:'player-f',username:'fernanda',name:'Fernanda',role:'player',active:true,characterId:'char-aluria'},
  {id:'player-g',username:'gustavo',name:'Gustavo',role:'player',active:true,characterId:'char-dongron'},
  {id:'player-l',username:'leo',name:'Léo',role:'player',active:true,characterId:null}
 ],sessions:[]
};
const characters=[
 {id:'char-aluria',name:'Aluria',refSnapshots:{class:{name:'Patrulheiro'}},choices:{class:{level:4}}},
 {id:'char-dongron',name:'Dongron',refSnapshots:{class:{name:'Patrulheiro'}},choices:{class:{level:3}}}
];

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password',playerAccounts:[
   {username:'fernanda',displayName:'Fernanda'},{username:'gustavo',displayName:'Gustavo'},{username:'leo',displayName:'Léo'}
  ]})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(data.session));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  if(!localStorage.getItem('hub-rpg:characters:v4'))localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(data.characters));
  if(!localStorage.getItem('hub-rpg:adventures:v1'))localStorage.setItem('hub-rpg:adventures:v1','[]');
 },{session,campaign,characters});
});

test('Imagem quadrada fica entre os seis pontos e o ponto azul em Locais importantes',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-roster-images');
 await expect(page.locator('#jogadores h2')).toHaveText('Jogadores da Campanha');
 const locations=page.locator('#locais .campaign-bullet-entry');
 await expect(locations).toHaveCount(2);
 for(const row of await locations.all()){
  await expect(row.locator('.campaign-location-thumb')).toBeVisible();
  await expect(row.locator('[data-location-image-file]')).toHaveAttribute('accept','image/jpeg,image/png,image/webp');
  const layout=await row.evaluate(element=>{
   const grip=element.querySelector('.campaign-reorder-grip').getBoundingClientRect();
   const image=element.querySelector('.campaign-location-thumb').getBoundingClientRect();
   const dot=element.querySelector('.campaign-list-marker').getBoundingClientRect();
   const name=element.querySelector('input[data-edit-line]').getBoundingClientRect();
   return{gripRight:grip.right,imageLeft:image.left,imageRight:image.right,dotLeft:dot.left,dotRight:dot.right,nameLeft:name.left,width:image.width,height:image.height};
  });
  expect(layout.imageLeft).toBeGreaterThan(layout.gripRight);
  expect(layout.dotLeft).toBeGreaterThan(layout.imageRight);
  expect(layout.nameLeft).toBeGreaterThan(layout.dotRight);
  expect(Math.abs(layout.width-layout.height)).toBeLessThanOrEqual(2);
 }
});

test('Imagens continuam associadas ao local ao alterar nome e ordem',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-roster-images');
 await page.evaluate(()=>{
  const rows=JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]');
  rows[0].importantLocationEntries=[
   {id:'location-fenda',name:'Fenda do Carvalho',image:{id:'image-fenda',campaignId:rows[0].id,entityType:'campaign',entityId:rows[0].id}},
   {id:'location-baldur',name:'Portão de Baldur',image:{id:'image-baldur',campaignId:rows[0].id,entityType:'campaign',entityId:rows[0].id}}
  ];
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(rows));
 });
 await page.reload();
 const locations=page.locator('#locais .campaign-bullet-entry');
 await locations.first().locator('[data-line-move="down"]').click();
 const reordered=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0].importantLocationEntries);
 expect(reordered.map(row=>row.id)).toEqual(['location-baldur','location-fenda']);
 expect(reordered.map(row=>row.image.id)).toEqual(['image-baldur','image-fenda']);
 await locations.first().locator('[data-edit-line]').fill('Portão de Baldur — Norte');
 await locations.first().locator('[data-edit-line]').blur();
 await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0].importantLocationEntries[0].name)).toBe('Portão de Baldur — Norte');
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0].importantLocationEntries);
 expect(rows[0].image.id).toBe('image-baldur');
 await locations.first().locator('[data-location-preview]').click();
 await expect(page.locator('dialog.campaign-location-lightbox')).toBeVisible();
 await page.locator('dialog [data-close-location-image]').click();
 await expect(page.locator('dialog.campaign-location-lightbox')).toHaveCount(0);
});

test('Nova Aventura na Campanha herda todos os jogadores e personagens',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-roster-images');
 await page.getByRole('link',{name:'Nova Aventura'}).click();
 await expect(page).toHaveURL(/aventuras\.html\?campaign=e2e-campaign-roster-images&new=1/);
 await page.locator('#new-adventure-title').fill('As Rainhas');
 await page.locator('#create-adventure').click();
 await expect(page.locator('#participantes h2')).toHaveText('Jogadores da Aventura');
 const rows=page.locator('#adventure-member-list [data-member-row]');
 await expect(rows).toHaveCount(3);
 await expect(page.locator('[data-member-row="fernanda"] [data-adventure-member-character]')).toHaveValue('char-aluria');
 await expect(page.locator('[data-member-row="gustavo"] [data-adventure-member-character]')).toHaveValue('char-dongron');
 await expect(page.locator('[data-member-row="leo"] [data-adventure-member-character]')).toHaveValue('');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))[0]);
 expect(saved.participantUsernames).toEqual(['fernanda','gustavo','leo']);
 expect(saved.characterIds).toEqual(['char-aluria','char-dongron']);
 expect(saved.participantAssignments).toHaveLength(3);
 await page.reload();
 await expect(page.locator('#adventure-member-list [data-member-row]')).toHaveCount(3);
});

test('Jogadores da Aventura podem ser reordenados e removidos sem modificar Campanha',async({page})=>{
 page.on('dialog',dialog=>dialog.accept());
 await page.goto('/aventuras.html?campaign=e2e-campaign-roster-images&new=1');
 await page.locator('#create-adventure').click();
 const fernanda=page.locator('#adventure-member-list [data-member-row="fernanda"]');
 await fernanda.locator('[data-roster-move="down"]').click();
 const order=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))[0].participantAssignments.map(m=>m.username));
 expect(order).toEqual(['gustavo','fernanda','leo']);
 await page.locator('[data-member-row="leo"] [data-adventure-remove-member]').click();
 await expect(page.locator('#adventure-member-list [data-member-row]')).toHaveCount(2);
 await page.locator('#new-adventure-member-user').selectOption('leo');
 await page.locator('#add-adventure-member').click();
 await expect(page.locator('#adventure-member-list [data-member-row]')).toHaveCount(3);
 const c=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0]);
 expect(c.members).toHaveLength(3);
});

test('Criação sem atalho de Campanhas não adiciona jogadores automaticamente',async({page})=>{
 await page.goto('/aventuras.html');
 await page.locator('#open-adventure-create').click();
 await page.locator('#create-adventure').click();
 await expect(page.locator('#participantes h2')).toHaveText('Jogadores da Aventura');
 await expect(page.locator('#adventure-member-list [data-member-row]')).toHaveCount(0);
});
