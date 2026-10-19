import {test,expect} from '@playwright/test';

const all=[
 {id:'c-planned',name:'Projeto Futuro',status:'planned'},
 {id:'c-done',name:'A Encerrada',status:'finished'},
 {id:'c-current',name:'Campanha Antiga',status:'current'},
 {id:'c-cancel',name:'Campanha Cancelada',status:'cancelled'},
 {id:'c-active',name:'Campanha Ativa',status:'active'},
 {id:'c-pause',name:'Campanha Pausada',status:'paused'}
].map((row,i)=>({...row,members:[],sessions:[],updatedAt:new Date(Date.UTC(2026,9,19,i)).toISOString()}));
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password',playerAccounts:[]})}));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'dm-filter',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(data));
 },all);
});
test('prioridade, filtro e conversão do status Atual legado',async({page})=>{
 await page.goto('/campanhas.html');
 const cards=page.locator('#campaign-list [data-campaign-card]');
 await expect(cards).toHaveCount(6);
 expect(await cards.evaluateAll(items=>items.map(item=>item.dataset.campaignCard)))
  .toEqual(['c-active','c-current','c-pause','c-done','c-cancel','c-planned']);
 await expect(page.locator('#campaign-status-filter option')).toHaveText(['Todos os status','Em andamento','Pausada','Concluída','Cancelada','Planejada']);
 await expect(page.locator('#campaign-status-filter option')).not.toContainText('Atual');
 await expect(page.locator('[data-campaign-card="c-current"] .campaign-status-trigger')).toContainText('Em andamento');
 await page.locator('#campaign-status-filter').selectOption('paused');
 await expect(cards).toHaveCount(1);
 await expect(cards.first()).toHaveAttribute('data-campaign-card','c-pause');
 await page.locator('#campaign-status-filter').selectOption('cancelled');
 await expect(cards).toHaveCount(1);
 await expect(cards.first()).toHaveAttribute('data-campaign-card','c-cancel');
 await page.locator('#campaign-status-filter').selectOption('active');
 await expect(cards).toHaveCount(2);
 await page.locator('#campaign-status-filter').selectOption('all');
 await expect(cards).toHaveCount(6);
});
test('status Cancelada no editor e ausência de Atos na Campanha',async({page})=>{
 await page.goto('/mesa.html?id=c-cancel');
 await expect(page.locator('[data-campaign-field="status"]')).toHaveValue('cancelled');
 await expect(page.locator('[data-campaign-field="status"] option[value="current"]')).toHaveCount(0);
 await expect(page.locator('[data-campaign-field="status"] option[value="cancelled"]')).toHaveCount(1);
 await expect(page.locator('#missoes, a[href="#missoes"]')).toHaveCount(0);
 await expect(page.locator('#locais')).toHaveCount(1);
 await expect(page.locator('#npcs')).toHaveCount(1);
});
test('criação de Campanha não apresenta Atual mas preserva Planejada',async({page})=>{
 await page.goto('/nova-campanha.html');
 await expect(page.locator('#campaign-status option[value="current"]')).toHaveCount(0);
 await expect(page.locator('#campaign-status option[value="cancelled"]')).toHaveCount(1);
 await expect(page.locator('#campaign-status option[value="planned"]')).toHaveCount(1);
});