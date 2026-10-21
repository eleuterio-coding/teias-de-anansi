import{test,expect}from'@playwright/test';

const campaign={id:'context-campaign',name:'A Cidadela',status:'active',members:[],sessions:[
 {id:'context-session',number:1,title:'Batalhas dos Campos Carmesim',status:'planned',adventureId:'context-adventure',scenes:[],encounters:[]}
]};
const adventure={id:'context-adventure',title:'As Labaredas',campaignId:campaign.id,status:'active',type:'main',
 description:'Uma nova aventura.',chapters:[],scenes:[],missions:[]};

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({
   uid:'context-master',username:'rafael',isMaster:true,memberships:[]
  }));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure]));
  localStorage.setItem('hub-rpg:standalone-sessions:v1',JSON.stringify([]));
 },{campaign,adventure});
});

test('Aventura identifica a Campanha de forma discreta e navegável',async({page})=>{
 await page.goto('/aventuras.html');
 const card=page.locator('[data-adventure-card="context-adventure"]');
 const trail=card.locator('.hub-ancestry');
 await expect(trail).toBeVisible();
 await expect(trail.locator('.hub-ancestry-campaign')).toContainText('Campanha');
 const campaignLink=trail.getByRole('link',{name:'Abrir campanha A Cidadela'});
 await expect(campaignLink).toHaveAttribute('href','mesa.html?id=context-campaign');
 await expect(card.locator('.campaign-card-details h2')).toHaveText('As Labaredas');
 const visual=await trail.locator('.hub-parent-link').evaluate(node=>{
  const bg=getComputedStyle(node).backgroundColor;
  const border=getComputedStyle(node).borderLeftColor;
  const text=getComputedStyle(node.querySelector('a')).color;
  return{bg,border,text};
 });
 expect(visual.bg).not.toBe('rgb(248, 250, 252)');
 expect(visual.bg).not.toBe('rgb(255, 255, 255)');
 expect(visual.text).not.toBe(visual.border);
});

test('Sessão exibe Campanha › Aventura, com ambos os vínculos navegáveis',async({page})=>{
 await page.goto('/sessoes.html');
 const card=page.locator('[data-session-list-id="context-session"]');
 const trail=card.locator('.session-card-context.hub-ancestry');
 await expect(card.locator('.campaign-card-details h2')).toHaveText('Batalhas dos Campos Carmesim');
 await expect(trail.locator('.hub-parent-link')).toHaveCount(2);
 await expect(trail.locator('.hub-ancestry-chevron')).toHaveText('›');
 await expect(trail.getByRole('link',{name:'Abrir campanha A Cidadela'}))
  .toHaveAttribute('href','mesa.html?id=context-campaign');
 await expect(trail.getByRole('link',{name:'Abrir aventura As Labaredas'}))
  .toHaveAttribute('href','aventuras.html?campaign=context-campaign&id=context-adventure');
 const styles=await trail.evaluate(node=>{
  const pills=[...node.querySelectorAll('.hub-parent-link')];
  return pills.map(pill=>({
   bg:getComputedStyle(pill).backgroundColor,
   accent:getComputedStyle(pill).borderLeftColor,
   link:getComputedStyle(pill.querySelector('a')).color
  }));
 });
 expect(styles[0].bg).toBe(styles[1].bg);
 expect(styles[0].accent).not.toBe(styles[1].accent);
 expect(styles[0].link).not.toBe(styles[1].link);
});

test('As trilhas são responsivas e não causam rolagem horizontal',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const [path,selector] of [
  ['/aventuras.html','[data-adventure-card="context-adventure"]'],
  ['/sessoes.html','[data-session-list-id="context-session"]']
 ]){
  await page.goto(path);
  const trail=page.locator(selector).locator('.hub-ancestry');
  await expect(trail).toBeVisible();
  const bounds=await trail.evaluate(node=>{
   const parent=node.closest('.campaign-card').getBoundingClientRect();
   const own=node.getBoundingClientRect();
   return{left:own.left,right:own.right,cardLeft:parent.left,cardRight:parent.right,
    scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth};
  });
  expect(bounds.left).toBeGreaterThanOrEqual(bounds.cardLeft);
  expect(bounds.right).toBeLessThanOrEqual(bounds.cardRight+1);
  expect(bounds.scroll).toBeLessThanOrEqual(bounds.viewport+2);
 }
});
