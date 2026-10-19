import{test,expect}from'@playwright/test';
import{sanitizeAdventure,normalizeAdventureOrders,createAdventure,updateAdventure}from'../scripts/adventure-state.js';
import{sanitizeSession,addCampaignSession,readCampaigns,createStandaloneSession}from'../scripts/campaign-state.js';
import{renderTimeline}from'../scripts/campaign-structured-ui.js';
import{sortCampaignAdventures,recentCampaignSessions}from'../scripts/campaign-recent-items.js';
const campaign={id:'e2e-order-campaign',name:'Fortaleza',status:'active',members:[],timelineNodes:[
 {id:'root-one',text:'Primeiro evento',children:[{id:'child-one',text:'Subitem',children:[]}]},
 {id:'root-two',text:'Segundo evento',children:[]}
],sessions:[{id:'session-1',number:1,order:2,title:'Prólogo',status:'completed'}]};
const adventures=[
 {id:'a-one',campaignId:campaign.id,title:'Primeira',status:'completed',order:1},
 {id:'a-two',campaignId:campaign.id,title:'Segunda',status:'active',order:2}
];
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'mestre',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  if(!localStorage.getItem('hub-rpg:adventures:v1'))localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify(data.adventures));
 },{campaign,adventures});
});
test('Aventuras antigas recebem ordem cronológica sem sobrepor valores explícitos',()=>{
 const legacy=normalizeAdventureOrders([
  {id:'old',campaignId:'campaign-1',status:'completed',createdAt:'2026-01-01T00:00:00Z'},
  {id:'new',campaignId:'campaign-1',status:'active',createdAt:'2026-04-01T00:00:00Z'},
  {id:'other',campaignId:'campaign-2',status:'planned',createdAt:'2026-02-01T00:00:00Z'}
 ]);
 expect(legacy.map(a=>a.order)).toEqual([1,2,1]);
 const saved=normalizeAdventureOrders(legacy);
 expect(saved.map(a=>a.order)).toEqual([1,2,1]);
});
test('estado migra Atual da Aventura sem apagá-la e Ordem persiste',()=>{
 const legacy=sanitizeAdventure({id:'legado',campaignId:campaign.id,title:'Antiga',status:'current',order:4});
 expect(legacy.status).toBe('active');
 expect(legacy.order).toBe(4);
 const created=createAdventure(adventures,{campaignId:campaign.id,title:'Nova aventura',status:'planned'});
 expect(created.ok).toBe(true);expect(created.adventure.order).toBe(3);
 const updated=updateAdventure(created.list,created.adventure.id,{order:8});
 expect(updated.ok).toBe(true);expect(updated.adventure.order).toBe(8);
 expect(sortCampaignAdventures(updated.list).map(a=>a.id)).toEqual(['a-two','a-one',created.adventure.id]);
});
test('Sessão mantém número separado da ordem e preserva legado',()=>{
 const legacy=sanitizeSession({id:'legacy',number:3,title:'Legado',status:'next'});
 expect(legacy.order).toBe(3);
 const result=addCampaignSession([campaign],campaign.id,{id:'s-new',number:9,order:5,title:'Mestrada',status:'completed'});
 expect(result.ok).toBe(true);expect(result.session.number).toBe(9);expect(result.session.order).toBe(5);
 expect(recentCampaignSessions(result.campaign.sessions).map(s=>s.id)).toEqual(['s-new','session-1']);
 const standalone=createStandaloneSession([],{id:'s-loose',number:8,order:3,status:'cancelled'});
 expect(standalone.session.number).toBe(8);
 expect(standalone.session.order).toBe(3);
});
test('Linha do tempo inicia com subitens ocultos e permite abrir em Lista e Fluxograma',async({page})=>{
 const html=renderTimeline(campaign,'list');
 expect(html).toContain('aria-expanded="false"');
 await page.goto('/mesa.html?id=e2e-order-campaign');
 const timeline=page.locator('#linha-tempo');
 const toggle=timeline.locator('[data-timeline-toggle="root-one"]');
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await expect(timeline.locator('#timeline-list-children-root-one')).toBeHidden();
 await toggle.click();
 await expect(timeline.locator('#timeline-list-children-root-one')).toBeVisible();
 await page.reload();
 await expect(timeline.locator('#timeline-list-children-root-one')).toBeHidden();
 await timeline.locator('[data-timeline-view="flowchart"]').click();
 await expect(timeline.locator('[data-timeline-toggle="root-one"]')).toHaveAttribute('aria-expanded','false');
 await expect(timeline.locator('#timeline-diagram-children-root-one')).toBeHidden();
 await timeline.locator('[data-timeline-toggle="root-one"]').click();
 await expect(timeline.locator('#timeline-diagram-children-root-one')).toBeVisible();
});
test('criação de Sessão oferece estados e sugere próxima Ordem, salvando-a',async({page})=>{
 await page.goto('/sessoes.html?campaign=e2e-order-campaign&new=1');
 const form=page.locator('#session-create-card');
 await expect(form).toBeVisible();
 const statuses=await form.locator('#new-session-status option').evaluateAll(rows=>rows.map(o=>o.textContent));
 expect(statuses).toEqual(['Planejada','Próxima','Atual','Concluída','Cancelada']);
 await expect(form.locator('#new-session-order')).toHaveValue('3');
 await form.locator('#new-session-order').fill('7');
 await form.locator('#new-session-status').selectOption('completed');
 await form.locator('#new-session-title').fill('O cerco');
 await form.locator('#create-session').click();
 await expect(page).toHaveURL(/sessoes\.html\?campaign=e2e-order-campaign.*id=/);
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0].sessions);
 const newest=rows.find(s=>s.title==='O cerco');
 expect(newest.status).toBe('completed');
 expect(newest.order).toBe(7);
 await expect(page.locator('[data-session-field="order"]')).toHaveValue('7');
});
test('Visão geral de Aventura possui Ordem e não oferece Atual',async({page})=>{
 await page.goto('/aventuras.html?campaign=e2e-order-campaign&id=a-two');
 const form=page.locator('#visao-geral');
 await expect(form.locator('[data-adventure-field="order"]')).toHaveValue('2');
 const statusValues=await form.locator('[data-adventure-field="status"] option').evaluateAll(rows=>rows.map(o=>o.value));
 expect(statusValues).not.toContain('current');
 await form.locator('[data-adventure-field="order"]').fill('5');
 await form.locator('[data-adventure-field="order"]').dispatchEvent('change');
 await expect(form.locator('[data-adventure-field="order"]')).toHaveValue('5');
 const item=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')).find(a=>a.id==='a-two'));
 expect(item.order).toBe(5);
});
test('Salvar divide a linha de Status e termina alinhado à imagem',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='desktop-chromium','apenas layout desktop em duas colunas');
 await page.setViewportSize({width:1450,height:950});
 await page.goto('/mesa.html?id=e2e-order-campaign');
 const coords=await page.locator('#campanha').evaluate(section=>{
  const rect=selector=>section.querySelector(selector).getBoundingClientRect();
  const image=rect('.image-picker-preview'),status=rect('[data-campaign-field="status"]'),save=rect('.campaign-settings-save button');
  return{imgBottom:image.bottom,statusBottom:status.bottom,saveBottom:save.bottom,
   statusRight:status.right,saveLeft:save.left};
 });
 expect(Math.abs(coords.imgBottom-coords.statusBottom)).toBeLessThanOrEqual(18);
 expect(Math.abs(coords.saveBottom-coords.statusBottom)).toBeLessThanOrEqual(5);
 expect(coords.saveLeft).toBeGreaterThan(coords.statusRight);
});
