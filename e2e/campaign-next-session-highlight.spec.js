import{test,expect}from'@playwright/test';
import{findNextCampaignSession,readableSessionDate}from'../scripts/campaign-next-session-ui.js';
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
