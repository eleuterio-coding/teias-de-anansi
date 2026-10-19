import {test,expect} from '@playwright/test';
import {sortCampaignAdventures,recentCampaignSessions} from '../scripts/campaign-recent-items.js';
const session={uid:'e2e-mestre',username:'rafael',isMaster:true,memberships:[]};
const campaign={
 id:'e2e-retrospectiva',name:'Cidade Oculta',status:'active',system:'D&D 5.5e',
 members:[],coverImageUrl:'/capa.svg',
 sessions:[
  {id:'session-1',number:1,title:'Prólogo',status:'completed',date:'2026-09-10'},
  {id:'session-2',number:2,title:'Primeiro portão',status:'completed',date:'2026-09-14'},
  {id:'session-3',number:3,title:'Mercado',status:'completed',date:'2026-09-18'},
  {id:'session-4',number:4,title:'Muralha',status:'completed',date:'2026-09-23'},
  {id:'session-5',number:5,title:'Reunião',status:'completed',date:'2026-09-25'},
  {id:'session-6',number:6,title:'A Travessia',status:'completed',date:'2026-10-10'},
  {id:'session-7',number:7,title:'O Portal',status:'current',date:'2026-10-19'},
  {id:'session-8',number:8,title:'Amanhã',status:'planned',date:'2026-10-26'},
  {id:'session-9',number:9,title:'Futura',status:'next',date:'2026-10-29'},
  {id:'session-10',number:10,title:'Cancelada',status:'cancelled'}
 ]
};
const adventures=[
 {id:'adv-1',campaignId:campaign.id,title:'Origem',status:'completed',createdAt:'2026-01-01T00:00:00Z'},
 {id:'adv-2',campaignId:campaign.id,title:'O Espelho',status:'completed',createdAt:'2026-02-01T00:00:00Z'},
 {id:'adv-3',campaignId:campaign.id,title:'As Rainhas',status:'completed',createdAt:'2026-03-01T00:00:00Z'},
 {id:'adv-4',campaignId:campaign.id,title:'A Fortaleza',status:'completed',createdAt:'2026-04-01T00:00:00Z'},
 {id:'adv-5',campaignId:campaign.id,title:'As Muralhas',status:'completed',createdAt:'2026-05-01T00:00:00Z'},
 {id:'adv-6',campaignId:campaign.id,title:'A Cidadela',status:'current',createdAt:'2026-06-01T00:00:00Z'},
 {id:'adv-7',campaignId:campaign.id,title:'Mais tarde',status:'planned',createdAt:'2026-12-01T00:00:00Z',updatedAt:'2026-12-02T00:00:00Z'},
 {id:'adv-other',campaignId:'outra-campanha',title:'Outra aventura',status:'current',createdAt:'2026-09-01T00:00:00Z'}
];
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password',playerAccounts:[]})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(data.session));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  if(!localStorage.getItem('hub-rpg:adventures:v1'))localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify(data.adventures));
 },{session,campaign,adventures});
});
test('ordem narrativa: atual primeiro, retrospectiva descendente e planejadas no final',()=>{
 expect(sortCampaignAdventures(adventures).map(a=>a.id)).toEqual([
  'adv-6','adv-other','adv-5','adv-4','adv-3','adv-2','adv-1','adv-7'
 ]);
 expect(sortCampaignAdventures(adventures.filter(a=>a.campaignId===campaign.id),{includePlanned:false,limit:5}).map(a=>a.id))
  .toEqual(['adv-6','adv-5','adv-4','adv-3','adv-2']);
 expect(recentCampaignSessions(campaign.sessions).map(s=>s.id))
  .toEqual(['session-7','session-6','session-5','session-4','session-3']);
});
test('Campanha mostra até cinco Aventuras e Sessões, atuais primeiro, sem planejadas',async({page})=>{
 await page.goto('/mesa.html?id=e2e-retrospectiva');
 const adventuresArea=page.locator('#aventuras'),sessionsArea=page.locator('#sessoes');
 await expect(adventuresArea.locator('h2')).toHaveText('Aventuras da Campanha');
 await expect(sessionsArea.locator('h2')).toHaveText('Sessões da Campanha');
 await expect(adventuresArea.locator('.campaign-reference-row')).toHaveCount(5);
 await expect(sessionsArea.locator('.campaign-reference-row')).toHaveCount(5);
 const titles=await adventuresArea.locator('.campaign-reference-row strong').allTextContents();
 expect(titles).toEqual(['A Cidadela','As Muralhas','A Fortaleza','As Rainhas','O Espelho']);
 const sessions=await sessionsArea.locator('.campaign-reference-row strong').allTextContents();
 expect(sessions).toEqual(['Sessão 7 · O Portal','Sessão 6 · A Travessia','Sessão 5 · Reunião','Sessão 4 · Muralha','Sessão 3 · Mercado']);
 await expect(adventuresArea).not.toContainText('Mais tarde');
 await expect(sessionsArea).not.toContainText('Amanhã');
 await expect(sessionsArea).not.toContainText('Futura');
 await expect(adventuresArea.getByRole('link',{name:'Abrir Aventuras'})).toHaveAttribute('href','aventuras.html?campaign=e2e-retrospectiva');
 await expect(sessionsArea.getByRole('link',{name:'Planeja Sessão'})).toHaveAttribute('href','sessoes.html?campaign=e2e-retrospectiva&new=1#session-create-card');
});
test('Abrir Aventuras filtra pela Campanha e coloca planejadas por último',async({page})=>{
 await page.goto('/mesa.html?id=e2e-retrospectiva');
 await page.locator('#aventuras').getByRole('link',{name:'Abrir Aventuras'}).click();
 await expect(page).toHaveURL(/aventuras\.html\?campaign=e2e-retrospectiva/);
 const cards=page.locator('#adventure-list [data-adventure-card]');
 await expect(cards).toHaveCount(7);
 const ids=await cards.evaluateAll(items=>items.map(item=>item.dataset.adventureCard));
 expect(ids).toEqual(['adv-6','adv-5','adv-4','adv-3','adv-2','adv-1','adv-7']);
 await expect(cards.last()).toContainText('Planejada');
});
test('Planeja Sessão abre formulário com Campanha preenchida automaticamente',async({page})=>{
 await page.goto('/mesa.html?id=e2e-retrospectiva');
 await page.locator('#sessoes').getByRole('link',{name:'Planeja Sessão'}).click();
 await expect(page).toHaveURL(/sessoes\.html\?campaign=e2e-retrospectiva&new=1#session-create-card/);
 await expect(page.locator('#session-create-card')).toBeVisible();
 await expect(page.locator('#new-session-campaign')).toHaveValue('e2e-retrospectiva');
 await expect(page.locator('#new-session-title')).toBeVisible();
});
test('Salvar fica na borda inferior da capa e pontilhado é branco discreto',async({page},info)=>{
 test.skip(info.project.name!=='desktop-chromium','alinhamento de duas colunas');
 await page.setViewportSize({width:1450,height:950});
 await page.goto('/mesa.html?id=e2e-retrospectiva');
 const positions=await page.locator('#campanha').evaluate(el=>{
  const img=el.querySelector('.image-picker-preview');
  const save=el.querySelector('.campaign-settings-save button');
  const image=img.getBoundingClientRect(),button=save.getBoundingClientRect();
  return {imageBottom:image.bottom,saveBottom:button.bottom,
   border:getComputedStyle(img).borderColor,
   left:image.left,right:button.right};
 });
 expect(Math.abs(positions.imageBottom-positions.saveBottom)).toBeLessThanOrEqual(14);
 expect(positions.border).toBe('rgba(255, 255, 255, 0.17)');
 expect(positions.right).toBeGreaterThan(positions.left);
});
