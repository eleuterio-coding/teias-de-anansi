import {test,expect} from '@playwright/test';

const campaignId='modern-demo-c', adventureId='modern-demo-a', sessionId='modern-demo-s1';
const campaign={
 id:campaignId,name:'Ecos do Abismo',status:'active',members:[],
 sessions:[
  {id:sessionId,adventureId,title:'As Portas do Santuário',order:8,number:8,status:'current',summary:'Abrir as portas do santuário.',scenes:[],encounters:[]},
  {id:'modern-demo-s2',adventureId,title:'A Câmara das Marés',order:9,number:9,status:'planned',summary:'Investigar a câmara.',scenes:[],encounters:[]},
  {id:'modern-demo-s3',adventureId,title:'O Farol Caído',order:7,number:7,status:'completed',summary:'O farol foi recuperado.',scenes:[],encounters:[]}
 ]
};
const adventure={
 id:adventureId,campaignId,title:'O Santuário Submerso',status:'active',order:3,
 participantUsernames:[],characterIds:[],npcIds:[],locationIds:[],scenes:[],missions:[],monsters:[]
};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(({campaign,adventure})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'qa-modern-master',username:'mestre',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([adventure]));
  localStorage.setItem('hub-rpg:characters:v4','[]');
  localStorage.setItem('hub-rpg:npcs:v1','[]');
 },{campaign,adventure});
});

test('Sessões: busca, filtros e alternância entre cards e lista preservam os registros',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/sessoes.html');
 await expect(page.locator('#session-discovery')).toBeVisible();
 await expect(page.locator('#sessions-list [data-session-list-id]')).toHaveCount(3);
 await page.locator('#session-search-filter').fill('portas');
 await expect(page.locator('#sessions-list [data-session-list-id]')).toHaveCount(1);
 await expect(page.locator('#session-results-count')).toContainText('1 de 3');
 await page.locator('#session-search-filter').fill('');
 await page.locator('#session-status-filter').selectOption('completed');
 await expect(page.locator('#sessions-list [data-session-list-id]')).toHaveCount(1);
 await expect(page.locator('#sessions-list')).toContainText('O Farol Caído');
 await page.locator('#session-status-filter').selectOption('all');
 await page.locator('[data-session-collection-view="list"]').click();
 await expect(page.locator('.session-adventure-groups')).toHaveClass(/is-list-view/);
 await expect(page.locator('#sessions-list [data-session-list-id]')).toHaveCount(3);
 await expect(page.locator('[data-session-collection-view="list"]')).toHaveAttribute('aria-pressed','true');
 const gridFlow=await page.locator('.session-adventure-track').first().evaluate(element=>getComputedStyle(element).gridAutoFlow);
 expect(gridFlow).toBe('row');
 expect(errors).toEqual([]);
});

test('Sessão: etapas exibem apenas seu contexto e o registro continua persistente',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/sessoes.html?campaign='+campaignId+'&id='+sessionId);
 await expect(page.locator('#session-discovery')).toBeHidden();
 await expect(page.locator('#visao-geral')).toBeVisible();
 await expect(page.locator('#cenas')).toBeHidden();
 await page.locator('[data-session-stage-button="prepare"]').click();
 await expect(page.locator('#cenas')).toBeVisible();
 await expect(page.locator('#participantes')).toBeVisible();
 await expect(page.locator('#encontros')).toBeVisible();
 await page.locator('[data-session-stage-button="live"]').click();
 await expect(page.locator('#combates')).toBeVisible();
 await expect(page.locator('#cenas')).toBeHidden();
 await page.locator('[data-session-stage-button="record"]').click();
 await expect(page.locator('#registro-sessao')).toBeVisible();
 await expect(page.locator('#linha-tempo')).toBeVisible();
 await page.locator('#registro-sessao [data-session-field="quickLog"]').fill('As portas se abriram.');
 await page.locator('#registro-sessao [data-session-field="quickLog"]').blur();
 await expect.poll(()=>page.evaluate(({campaignId,sessionId})=>{
  const rows=JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]');
  return rows.find(c=>c.id===campaignId)?.sessions.find(s=>s.id===sessionId)?.quickLog;
 },{campaignId,sessionId})).toBe('As portas se abriram.');
 await page.locator('[data-session-stage-button="overview"]').click();
 await expect(page.locator('#visao-geral')).toBeVisible();
 await expect(page.locator('#registro-sessao')).toBeHidden();
 expect(errors).toEqual([]);
});

test('Aventura: consulta primeiro; formulário aberto somente ao escolher editar',async({page})=>{
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await expect(page.locator('#adventure-overview-content')).toBeVisible();
 await expect(page.locator('#overview-cenas')).toBeVisible();
 await expect(page.locator('#visao-geral')).toBeHidden();
 await page.locator('[data-open-adventure-settings]').click();
 await expect(page.locator('#visao-geral')).toBeVisible();
 await expect(page.locator('[data-adventure-settings]')).toHaveAttribute('open','');
});
