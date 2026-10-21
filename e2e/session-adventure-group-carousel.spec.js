import{test,expect}from'@playwright/test';

const campaigns=[
 {id:'session-group-c1',name:'A Cidadela',status:'active',members:[],
  sessions:[
   ...Array.from({length:5},(_,i)=>({
    id:'group-s'+(i+1),number:i+1,order:i+1,title:'Sessão '+(i+1),
    status:i===0?'current':'planned',adventureId:'group-a1',scenes:[],encounters:[]
   })),
   {id:'group-s6',number:6,title:'Outra aventura',status:'planned',
    adventureId:'group-a2',scenes:[],encounters:[]},
   {id:'group-s7',number:7,title:'Sem vínculo',status:'planned',
    adventureId:null,scenes:[],encounters:[]}
  ]},
 {id:'session-group-c2',name:'Reinos de Prata',status:'active',members:[],
  sessions:[{id:'group-s8',number:1,title:'Sem aventura 2',status:'planned',scenes:[],encounters:[]}]}
];
const adventures=[
 {id:'group-a1',campaignId:'session-group-c1',title:'As Labaredas',status:'active',type:'main',scenes:[],missions:[]},
 {id:'group-a2',campaignId:'session-group-c1',title:'As Rainhas',status:'planned',type:'main',scenes:[],missions:[]}
];
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({
   uid:'group-master',username:'rafael',isMaster:true,memberships:[]
  }));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(data.campaigns));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify(data.adventures));
  localStorage.setItem('hub-rpg:standalone-sessions:v1',JSON.stringify([]));
 },{campaigns,adventures});
});

test('Agrupa sessões por Aventura e preserva sessões sem vínculo',async({page})=>{
 await page.goto('/sessoes.html');
 const groups=page.locator('#sessions-list .session-adventure-group');
 await expect(groups).toHaveCount(4);
 const first=page.locator('[data-session-adventure-group="session-group-c1::group-a1"]');
 await expect(first.locator('[data-session-list-id]')).toHaveCount(5);
 await expect(first.locator('h3 a')).toHaveAttribute('href',
  'aventuras.html?campaign=session-group-c1&id=group-a1');
 await expect(first.locator('.session-adventure-group-count')).toHaveText('5 sessões');
 await expect(page.locator('[data-session-adventure-group="session-group-c1::group-a2"] [data-session-list-id]')).toHaveCount(1);
 await expect(page.locator('[data-session-adventure-group="session-group-c1::__none__"] [data-session-list-id]')).toHaveCount(1);
 await expect(page.locator('[data-session-adventure-group="session-group-c2::__none__"] [data-session-list-id]')).toHaveCount(1);
 await expect(page.locator('#open-session-create')).toBeVisible();
});

test('Três cards de Sessões aparecem por vez no desktop, com rolagem para os demais',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('/sessoes.html');
 const group=page.locator('[data-session-adventure-group="session-group-c1::group-a1"]');
 const track=group.locator('[data-session-track]');
 const positions=await track.evaluate(node=>{
  const bounds=node.getBoundingClientRect();
  const cards=[...node.querySelectorAll('[data-session-list-id]')].map(el=>el.getBoundingClientRect().toJSON());
  return{right:bounds.right,width:node.clientWidth,scroll:node.scrollWidth,cards};
 });
 expect(positions.scroll).toBeGreaterThan(positions.width);
 expect(positions.cards[2].right).toBeLessThanOrEqual(positions.right+5);
 expect(positions.cards[3].left).toBeGreaterThanOrEqual(positions.right-5);
 const next=group.getByRole('button',{name:'Ver próximas sessões de As Labaredas — A Cidadela'});
 await expect(next).toBeEnabled();
 await next.click();
 await expect.poll(()=>track.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 await expect(group.getByRole('button',{name:'Ver sessões anteriores de As Labaredas — A Cidadela'})).toBeEnabled();
});

test('Mobile mostra uma sessão por vez sem expandir a largura da página',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/sessoes.html');
 const group=page.locator('[data-session-adventure-group="session-group-c1::group-a1"]');
 const layout=await group.locator('[data-session-track]').evaluate(node=>{
  const bounds=node.getBoundingClientRect();
  const items=[...node.querySelectorAll('[data-session-list-id]')].map(el=>el.getBoundingClientRect());
  return{end:bounds.right,firstEnd:items[0].right,secondStart:items[1].left,
   docWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth};
 });
 expect(layout.firstEnd).toBeLessThanOrEqual(layout.end+5);
 expect(layout.secondStart).toBeGreaterThanOrEqual(layout.end-5);
 expect(layout.docWidth).toBeLessThanOrEqual(layout.viewport+2);
 await expect(group.locator('[data-session-scroll="1"]')).toBeVisible();
});

test('Continuam disponíveis os controles de status e a abertura de Sessão',async({page})=>{
 await page.goto('/sessoes.html');
 const card=page.locator('[data-session-list-id="group-s2"]');
 await expect(card.locator('.campaign-status-trigger')).toBeVisible();
 await card.locator('.campaign-status-trigger').click();
 await card.getByRole('button',{name:'Próxima'}).click();
 await expect(card.locator('.campaign-card-status')).toHaveClass(/status-next/);
 await card.getByRole('link',{name:'Abrir',exact:true}).click();
 await expect(page.locator('#sessions-list .session-card[data-session-id="group-s2"]')).toBeVisible();
 await expect(page.locator('.session-adventure-group')).toHaveCount(0);
});

test('Modo jogador só exibe Sessões e Aventuras compartilhadas',async({page})=>{
 const membership={id:'member-group',campaignId:'session-group-c1',uid:'player-1',
  username:'jogador',role:'player',active:true,adventureIds:['group-a1'],sessionIds:['group-s1','group-s2']};
 const campaign={...campaigns[0],sessions:campaigns[0].sessions.filter(s=>membership.sessionIds.includes(s.id))};
 await page.addInitScript(({membership,campaign})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({
   uid:'player-1',username:'jogador',isMaster:false,memberships:[membership]
  }));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify({
   schema:'hub-rpg/collaboration-cache/v1',
   campaigns:{[campaign.id]:{membership,payload:{
    campaign,revealedAdventures:[{id:'group-a1',campaignId:campaign.id,title:'As Labaredas',status:'active'}]
   },characterIds:[]}}
  }));
 },{membership,campaign});
 await page.goto('/sessoes.html');
 await expect(page.locator('#sessions-list [data-session-list-id]')).toHaveCount(2);
 await expect(page.locator('#sessions-list .session-adventure-group')).toHaveCount(1);
 await expect(page.locator('.session-adventure-group-identity h3')).toContainText('As Labaredas');
 await expect(page.locator('[data-delete-session-list]')).toHaveCount(0);
 await expect(page.locator('#open-session-create')).toHaveCount(0);
 await expect(page.locator('#sessions-list')).not.toContainText('As Rainhas');
});
