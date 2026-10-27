import {test,expect} from '@playwright/test';

const campaignId='e2e-adventure-drag-reset',adventureId='e2e-drag-reset';
const campaign={
 id:campaignId,name:'Reinos de Prata',status:'active',members:[
  {id:'m1',username:'fernanda',name:'Fernanda',role:'player',characterId:'pc1',active:true},
  {id:'m2',username:'bruno',name:'Bruno',role:'player',characterId:'pc2',active:true},
  {id:'m3',username:'gustavo',name:'Gustavo',role:'player',characterId:'pc3',active:true}
 ],sessions:[],npcs:[],locations:[]
};
const adventure={
 id:adventureId,campaignId,title:'As Rainhas',status:'active',
 participantAssignments:[
  {username:'fernanda',characterId:'pc1'},{username:'bruno',characterId:'pc2'},{username:'gustavo',characterId:'pc3'}
 ],
 participantUsernames:['fernanda','bruno','gustavo'],characterIds:['pc1','pc2','pc3'],
 exploration:{
  levels:[
   {id:'map1',name:'Mapa 1',type:'Região',order:1},
   {id:'map2',name:'Mapa 2',type:'Região',order:2},
   {id:'map3',name:'Mapa 3',type:'Região',order:3}
  ],
  areas:[
   {id:'area1',code:'A01',name:'Sala 1',order:1,levelId:'map1',status:'discovered'},
   {id:'area2',code:'A02',name:'Sala 2',order:2,levelId:'map2',status:'discovered'},
   {id:'area3',code:'A03',name:'Sala 3',order:3,levelId:'map3',status:'discovered'}
  ]
 }
};
const chars=['pc1','pc2','pc3'].map((id,i)=>({id,name:['Aluria','Tanzan','Dongron'][i]}));
const groups=[
 {title:'Jogadores da Aventura',container:'#adventure-member-list',row:'[data-member-row]',grip:'.roster-grip',data:'memberRow',store:'participantAssignments'},
 {title:'Mapas',container:'#mapas .explore-level-grid',row:'[data-ex-level]',grip:'[data-ex-level-grip]',data:'exLevel',store:'levels'},
 {title:'Locais',container:'#exploracao .explore-area-grid',row:'[data-ex-area]',grip:'[data-ex-area-grip]',data:'exArea',store:'areas'}
];
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master-drag',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  if(!localStorage.getItem('hub-rpg:adventures:v1'))localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure]));
  if(!localStorage.getItem('hub-rpg:characters:v4'))localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(data.chars));
 },{campaign,adventure,chars});
});
async function setup(page){
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await expect(page.locator('#participantes h2')).toContainText('Jogadores da Aventura');
 await expect(page.locator('#mapas .explore-level-grid [data-ex-level]')).toHaveCount(3);
 await expect(page.locator('#exploracao .explore-area-grid [data-ex-area]')).toHaveCount(3);
}
const ids=async(page,g)=>page.locator(g.container).locator(g.row).evaluateAll((nodes,key)=>nodes.filter(n=>!n.hasAttribute('data-adventure-sort-preview')).map(n=>n.dataset[key]),g.data);
const clean=async(page,g)=>{
 await expect(page.locator(g.container+' > [data-adventure-sort-preview]')).toHaveCount(0);
 await expect(page.locator(g.container+' > .adventure-floating-card')).toHaveCount(0);
 const state=await page.locator(g.container).locator(g.row).evaluateAll(nodes=>nodes.map(row=>({
  dragging:[...row.classList].filter(name=>/sort-moving|sort-before|sort-after|drop-target|dragging|drop-before|drop-after/.test(name)),
  visible:row.getBoundingClientRect().width>0
 })));
 expect(state.every(row=>row.dragging.length===0&&row.visible)).toBe(true);
};
for(const group of groups){
 test(group.title+': soltar fora da lista devolve estado normal sem mudar dados',async({page,browserName})=>{
  test.skip(browserName!=='chromium'||test.info().project.name!=='desktop-chromium','Mouse desktop');
  await setup(page);
  const rows=page.locator(group.container).locator(group.row);
  const original=await ids(page,group);
  const handle=rows.first().locator(group.grip);
  await handle.scrollIntoViewIfNeeded();
  const b=await handle.boundingBox(),card=await rows.first().boundingBox();
  expect(b&&card).toBeTruthy();
  const x=b.x+b.width/2,y=b.y+b.height/2;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x+13,y+17,{steps:5});
  const preview=page.locator(group.container+' > [data-adventure-sort-preview]');
  await expect(preview).toBeVisible();
  const floating=await preview.boundingBox();
  expect(Math.abs(floating.x-card.x-(group.store==='participantAssignments'?0:13))).toBeLessThanOrEqual(4);
  expect(Math.abs(floating.width-card.width)).toBeLessThanOrEqual(3);
  await page.mouse.move(2,2,{steps:8});await page.mouse.up();
  await clean(page,group);
  expect(await ids(page,group)).toEqual(original);
  await page.reload();await clean(page,group);
  expect(await ids(page,group)).toEqual(original);
 });
 test(group.title+': reordena e restaura a apresentação após salvar',async({page,browserName})=>{
  test.skip(browserName!=='chromium'||test.info().project.name!=='desktop-chromium','Mouse desktop');
  await setup(page);
  const rows=page.locator(group.container).locator(group.row);
  const original=await ids(page,group);
  const handle=rows.first().locator(group.grip);
  await handle.scrollIntoViewIfNeeded();
  const start=await handle.boundingBox(),target=await rows.last().boundingBox();
  expect(start&&target).toBeTruthy();
  const x=start.x+start.width/2,y=start.y+start.height/2;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x+8,y+12,{steps:4});
  await expect(page.locator(group.container+' > [data-adventure-sort-preview]')).toBeVisible();
  await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:8});
  await page.mouse.up();
  await clean(page,group);
  await expect.poll(()=>ids(page,group)).toEqual([...original.slice(1),original[0]]);
  await page.reload();
  await clean(page,group);
  await expect.poll(()=>ids(page,group)).toEqual([...original.slice(1),original[0]]);
 });
}
test('toque longo em Locais encerrado fora da lista limpa a cópia e a seleção',async({page})=>{
 test.skip(test.info().project.name!=='mobile-chromium','Toque real no Chromium mobile');
 await setup(page);
 const g=groups[2],row=page.locator(g.container).locator(g.row).first(),grip=row.locator(g.grip);
 await grip.scrollIntoViewIfNeeded();
 const b=await grip.boundingBox();expect(b).toBeTruthy();
 const x=b.x+b.width/2,y=b.y+b.height/2;
 const original=await ids(page,g);
 const client=await page.context().newCDPSession(page);
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 await page.waitForTimeout(350);
 await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+5,y:y+15}]});
 await expect(page.locator(g.container+' > [data-adventure-sort-preview]')).toBeVisible();
 await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:2,y:2}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await clean(page,g);
 expect(await ids(page,g)).toEqual(original);
});
