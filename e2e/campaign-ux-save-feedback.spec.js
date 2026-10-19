import{test,expect}from'@playwright/test';

const session={uid:'u-e2e-master',username:'rafael',isMaster:true,memberships:[]};
const characters=[{id:'pc-fernanda',name:'Maga das Névoas'},{id:'pc-bruno',name:'Guardião Rubro'}];
const campaign={
 id:'e2e-campaign-ux',name:'Reinos de Prata',status:'current',system:'D&D 5.5e',
 description:'Campanha para validar a interface.',updatedAt:'2026-10-16T12:00:00Z',
 members:[
  {id:'m1',username:'fernanda',name:'Fernanda',role:'player',characterId:'pc-fernanda',active:true},
  {id:'m2',username:'bruno',name:'Bruno',role:'player',active:true}
 ],sessions:[]
};

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(data.session));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(data.characters));
 },{session,campaign,characters});
});

test('card inteiro abre campanha e preserva Abrir e status editável',async({page})=>{
 await page.goto('/campanhas.html');
 const card=page.locator('[data-campaign-card="e2e-campaign-ux"]');
 await expect(card.locator('.campaign-card-stretched-link')).toHaveAttribute('href','mesa.html?id=e2e-campaign-ux');
 await expect(card.getByRole('link',{name:'Abrir',exact:true})).toHaveCount(1);
 await card.locator('.campaign-status-trigger').click();
 await expect(page).toHaveURL(/campanhas\.html/);
 await expect(card.locator('[data-status-disclosure]')).toHaveAttribute('open','');
 await card.locator('.campaign-status-trigger').click();
 await card.locator('.campaign-card-stretched-link').click({position:{x:8,y:70}});
 await expect(page).toHaveURL(/mesa\.html\?id=e2e-campaign-ux/);
});

test('jogadores organizados e confirmação acessível após salvar',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 const rows=page.locator('#jogadores .roster-player');
 await expect(rows).toHaveCount(2);
 await expect(page.locator('.roster-count')).toContainText('2 jogadores');
 for(const row of await rows.all()){
  await expect(row.locator('.roster-player-name')).toBeVisible();
  await expect(row.locator('[data-member-user]')).toHaveCount(0);
  await expect(row.locator('[data-member-character]')).toBeVisible();
  await expect(row.getByText('Notas',{exact:true})).toHaveCount(0);
  await expect(row.locator('.roster-player-label')).toHaveText('Jogador');
  await expect(row.locator('.roster-player-character label')).toContainText('Personagem');
  await expect(row.locator('.roster-open-button')).toBeVisible();
  await expect(row.locator('.roster-open-button')).toHaveText('Abrir');
  await expect(row.getByRole('button',{name:'Remover'})).toBeVisible();
 }
 await page.locator('#jogadores [data-save-campaign-section]').click();
 await expect(page.locator('#hub-save-notice')).toBeVisible();
 await expect(page.locator('#hub-save-notice .hub-save-title')).toHaveText('Alterações salvas');
 await expect(page.locator('#hub-save-notice')).toHaveAttribute('role','status');
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]'));
 expect(persisted.find(c=>c.id==='e2e-campaign-ux')?.members).toHaveLength(2);
});

test('layout de jogadores não provoca overflow em tela estreita',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 await expect(page.locator('#jogadores .roster-player')).toHaveCount(2);
 const bounds=await page.evaluate(()=>{
  const region=document.querySelector('#jogadores'),rect=region.getBoundingClientRect();
  return{scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,
   left:rect.left,right:rect.right}
 });
 expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth+2);
 expect(bounds.left).toBeGreaterThanOrEqual(-1);
 expect(bounds.right).toBeLessThanOrEqual(bounds.clientWidth+2);
});

test('personagem ocupado não pode ser selecionado por outro jogador',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 const fernanda=page.locator('[data-member-row="m1"]'),bruno=page.locator('[data-member-row="m2"]');
 await expect(fernanda.locator('[data-member-character]')).toHaveValue('pc-fernanda');
 await expect(fernanda.locator('.roster-open-button')).toHaveAttribute('href',/ficha-personagem\.html\?id=pc-fernanda/);
 await expect(bruno.locator('[data-member-character] option[value="pc-fernanda"]')).toHaveCount(0);
 await expect(bruno.locator('[data-member-character] option[value="pc-bruno"]')).toHaveCount(1);
 await bruno.locator('[data-member-character]').selectOption('pc-bruno');
 await expect(fernanda.locator('[data-member-character] option[value="pc-bruno"]')).toHaveCount(0);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]'));
 const members=stored.find(c=>c.id==='e2e-campaign-ux').members;
 expect(members.find(m=>m.id==='m1').characterId).toBe('pc-fernanda');
 expect(members.find(m=>m.id==='m2').characterId).toBe('pc-bruno');
});


test('selecionar personagem preserva o scroll, o foco e o elemento do seletor',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 const select=page.locator('[data-member-row="m2"] [data-member-character]');
 await select.scrollIntoViewIfNeeded();
 await select.focus();
 const before=await page.evaluate(()=>{
  const node=document.querySelector('[data-member-row="m2"] [data-member-character]');
  window.__rosterSelectBefore=node;
  window.__rosterSectionBefore=document.getElementById('jogadores');
  return{scroll:window.scrollY,top:node.getBoundingClientRect().top}
 });
 await select.selectOption('pc-bruno');
 await expect(select).toHaveValue('pc-bruno');
 const after=await page.evaluate(()=>{
  const node=document.querySelector('[data-member-row="m2"] [data-member-character]');
  return{
   scroll:window.scrollY,top:node.getBoundingClientRect().top,
   selectPreserved:node===window.__rosterSelectBefore,
   sectionPreserved:document.getElementById('jogadores')===window.__rosterSectionBefore,
   focused:document.activeElement===node
  }
 });
 expect(after.selectPreserved).toBe(true);
 expect(after.sectionPreserved).toBe(true);
 expect(after.focused).toBe(true);
 expect(Math.abs(after.scroll-before.scroll)).toBeLessThanOrEqual(1);
 expect(Math.abs(after.top-before.top)).toBeLessThanOrEqual(1);
});

test('salvar não reconstrói a Mesa e aviso de sucesso não altera a rolagem',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 const button=page.locator('#jogadores [data-save-campaign-section]');
 await button.scrollIntoViewIfNeeded();
 const before=await page.evaluate(()=>{
  window.__stableRoster=document.getElementById('jogadores');
  window.__stableSelect=document.querySelector('[data-member-row="m1"] [data-member-character]');
  return{scroll:window.scrollY,top:window.__stableRoster.getBoundingClientRect().top}
 });
 await button.click();
 await expect(page.locator('#table-feedback')).toContainText('Etapa salva.');
 await expect(page.locator('#hub-save-notice')).toBeVisible();
 const after=await page.evaluate(()=>({
  scroll:window.scrollY,top:document.getElementById('jogadores').getBoundingClientRect().top,
  sectionPreserved:document.getElementById('jogadores')===window.__stableRoster,
  selectPreserved:document.querySelector('[data-member-row="m1"] [data-member-character]')===window.__stableSelect
 }));
 expect(after.sectionPreserved).toBe(true);
 expect(after.selectPreserved).toBe(true);
 expect(Math.abs(after.scroll-before.scroll)).toBeLessThanOrEqual(1);
 expect(Math.abs(after.top-before.top)).toBeLessThanOrEqual(1);
});

test('campos e botões da mesma linha ficam precisamente alinhados no desktop',async({page})=>{
 await page.setViewportSize({width:1500,height:950});
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 const results=await page.locator('#jogadores .roster-player').evaluateAll(rows=>rows.map(row=>{
  const top=selector=>row.querySelector(selector).getBoundingClientRect().top;
  return{
   avatar:top('.roster-avatar'),user:top('[data-member-user]'),
   character:top('[data-member-character]'),open:top('.roster-open-button'),
   remove:top('[data-remove-member]')
  }
 }));
 expect(results).toHaveLength(2);
 for(const row of results)for(const key of ['avatar','character','open','remove']){
  expect(Math.abs(row[key]-row.user),`Alinhamento de ${key}`).toBeLessThanOrEqual(2);
 }
});
