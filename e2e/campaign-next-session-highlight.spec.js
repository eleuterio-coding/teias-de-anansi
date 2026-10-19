import{test,expect}from'@playwright/test';
import{findNextCampaignSession,findPreviousCampaignSession,readableSessionDate}from'../scripts/campaign-next-session-ui.js';
const session={uid:'u-e2e-master',username:'rafael',isMaster:true,memberships:[]};
const pending={
 id:'e2e-campaign-next',name:'Reinos de Prata',status:'current',members:[],
 sessions:[
  {id:'s-planned',number:9,title:'O retorno',date:'2026-11-29',status:'planned'},
  {id:'s-next',number:8,title:'A travessia',date:'2026-11-22',status:'next'},
  {id:'s-current',number:7,title:'A rainha e o véu',date:'2026-11-19',status:'current'}
 ]
};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(data.session));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
 },{session,campaign:pending});
});
test('seleção e data da próxima sessão são consistentes',()=>{
 expect(findNextCampaignSession(pending)?.id).toBe('s-current');
 expect(findNextCampaignSession({...pending,sessions:[]})).toBe(null);
 expect(readableSessionDate('2026-11-19')).toBe('19 de novembro de 2026');
 expect(readableSessionDate('2026-02-30')).toBe('');
});
test('remove Personagens vinculados e destaca Próxima sessão acima do editor',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-next');
 const highlight=page.locator('#proxima-sessao');
 await expect(highlight).toBeVisible();
 await expect(highlight.getByRole('heading',{name:'Próxima sessão'})).toBeVisible();
 await expect(highlight.locator('.campaign-next-name')).toContainText('Sessão 7 · A rainha e o véu');
 await expect(highlight.locator('.campaign-next-status')).toHaveText('Atual');
 await expect(highlight.locator('time[datetime="2026-11-19"]')).toHaveText('19 de novembro de 2026');
 await expect(highlight.getByRole('link',{name:/Abrir sessão/})).toHaveAttribute('href','sessoes.html?campaign=e2e-campaign-next&id=s-current');
 await expect(page.locator('#personagens')).toHaveCount(0);
 await expect(page.locator('a[href="#personagens"]')).toHaveCount(0);
 await expect(page.getByText('Personagens vinculados',{exact:true})).toHaveCount(0);
 const positions=await page.evaluate(()=>{
  const highlight=document.querySelector('#proxima-sessao'),editor=document.querySelector('#campanha');
  return{highlight:highlight.getBoundingClientRect().top,editor:editor.getBoundingClientRect().top}
 });
 expect(positions.highlight).toBeLessThan(positions.editor);
});
test('sem sessão definida exibe convite para planejar, sem informações inventadas',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-next');
 await page.evaluate(()=>{
  const rows=JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'));
  rows[0].sessions=[];
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(rows));
 });
 await page.reload();
 const highlight=page.locator('#proxima-sessao');
 await expect(highlight).toContainText('Nenhuma próxima sessão definida.');
 await expect(highlight.getByRole('link',{name:'Planejar sessão'})).toHaveAttribute('href','sessoes.html?campaign=e2e-campaign-next');
 await expect(highlight.locator('time')).toHaveCount(0);
});
test('destaque responsivo sem transbordamento na tela pequena',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/mesa.html?id=e2e-campaign-next');
 await expect(page.locator('#proxima-sessao')).toBeVisible();
 const bounds=await page.locator('#proxima-sessao').evaluate(el=>{
  const card=el.getBoundingClientRect(),button=el.querySelector('.campaign-next-action').getBoundingClientRect();
  return{cardLeft:card.left,cardRight:card.right,buttonLeft:button.left,buttonRight:button.right,viewport:document.documentElement.clientWidth}
 });
 expect(bounds.cardLeft).toBeGreaterThanOrEqual(-1);
 expect(bounds.cardRight).toBeLessThanOrEqual(bounds.viewport+2);
 expect(bounds.buttonLeft).toBeGreaterThanOrEqual(bounds.cardLeft);
 expect(bounds.buttonRight).toBeLessThanOrEqual(bounds.cardRight+1);
});

test('destaque usa a imagem da sessão selecionada, não a capa da campanha',async({page})=>{
 await page.route('**/mock-session-cover.svg',route=>route.fulfill({
  status:200,contentType:'image/svg+xml',
  body:'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect width="1200" height="400" fill="#517eaa"/></svg>'
 }));
 await page.goto('/mesa.html?id=e2e-campaign-next');
 await page.evaluate(()=>{
  const campaigns=JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'));
  campaigns[0].coverImageUrl='/mock-campaign-cover.svg';
  campaigns[0].sessions.find(s=>s.id==='s-current').coverImageUrl='/mock-session-cover.svg';
  campaigns[0].sessions.find(s=>s.id==='s-next').coverImageUrl='/incorrect-next-cover.svg';
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(campaigns));
 });
 await page.reload();
 const card=page.locator('#proxima-sessao');
 await expect(card).toHaveAttribute('data-has-session-cover','true');
 const image=card.locator('.campaign-next-backdrop');
 await expect(image).toHaveAttribute('src','/mock-session-cover.svg');
 await expect(image).toBeVisible();
 await expect(image).toHaveJSProperty('naturalWidth',1200);
 const geometry=await card.evaluate(el=>{
  const card=el.getBoundingClientRect(),image=el.querySelector('.campaign-next-backdrop').getBoundingClientRect();
  return {card:card.toJSON(),image:image.toJSON(),position:getComputedStyle(el).position};
 });
 expect(geometry.position).toBe('relative');
 // A imagem preenche o interior do card, respeitando borda lateral e cantos arredondados.
 expect(geometry.card.width-geometry.image.width).toBeLessThanOrEqual(6);
 expect(geometry.card.height-geometry.image.height).toBeLessThanOrEqual(3);
 await expect(card.getByRole('link',{name:/Abrir sessão/})).toBeVisible();
});

test('referência da capa sincronizada usa hidratação de mídia com fallback',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-next');
 await page.evaluate(()=>{
  const campaigns=JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'));
  const current=campaigns[0].sessions.find(s=>s.id==='s-current');
  current.coverImage={id:'session-cover-storage-id',campaignId:'e2e-campaign-next',entityType:'session',entityId:'s-current'};
  current.coverImageUrl='/fallback-cover.svg';
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(campaigns));
 });
 await page.reload();
 const card=page.locator('#proxima-sessao');
 const image=card.locator('.campaign-next-backdrop');
 await expect(image).toHaveAttribute('data-hub-media-id','session-cover-storage-id');
 await expect(image).toHaveAttribute('data-fallback-src','/fallback-cover.svg');
 await expect(card).toHaveAttribute('data-has-session-cover','true');
});

test('Sessão anterior é a última concluída antes da sessão corrente, com link',async({page})=>{
 const withHistory={...pending,sessions:[
  ...pending.sessions,
  {id:'s-old',number:4,title:'Prólogo',status:'completed',date:'2026-10-11'},
  {id:'s-previous',number:6,title:'Além das muralhas',status:'completed',date:'2026-10-18'},
  {id:'s-cancelled',number:5,title:'Sessão cancelada',status:'cancelled'}
 ]};
 expect(findPreviousCampaignSession(pending)).toBe(null);
 expect(findPreviousCampaignSession(withHistory)?.id).toBe('s-previous');
 expect(findPreviousCampaignSession({...withHistory,sessions:withHistory.sessions.filter(s=>s.status==='completed')})?.id).toBe('s-previous');
 await page.goto('/mesa.html?id=e2e-campaign-next');
 await expect(page.locator('.campaign-product-summary .metric').last()).toContainText('Sessão anterior');
 await expect(page.locator('.campaign-product-summary .metric').last()).toContainText('Nenhuma sessão anterior');
 await expect(page.locator('.campaign-product-summary .metric').last()).not.toHaveAttribute('href',/./);
 await page.evaluate(sessions=>{
  const rows=JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'));
  rows[0].sessions=sessions;localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(rows));
 },withHistory.sessions);
 await page.reload();
 const previous=page.locator('.campaign-product-summary .metric').last();
 await expect(previous).toContainText('Sessão anterior');
 await expect(previous).toContainText('Sessão 6 · Além das muralhas');
 await expect(previous).toHaveAttribute('href','sessoes.html?campaign=e2e-campaign-next&id=s-previous');
});

test('Abrir sessão ganha CTA visual, preservando o destino e acessibilidade',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-next');
 const button=page.locator('#proxima-sessao .campaign-next-action');
 await expect(button).toBeVisible();
 await expect(button).toHaveAttribute('href','sessoes.html?campaign=e2e-campaign-next&id=s-current');
 await expect(button.locator('.campaign-next-action-kicker')).toHaveText('ACESSAR');
 await expect(button.locator('.campaign-next-action-copy strong')).toHaveText('Abrir sessão');
 await expect(button.locator('.campaign-next-action-icon svg')).toHaveCount(1);
});
