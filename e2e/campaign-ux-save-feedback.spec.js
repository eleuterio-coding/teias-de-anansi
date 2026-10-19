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
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
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

test('campos e ações de jogadores ficam alinhados na coluna compacta do desktop',async({page})=>{
 await page.setViewportSize({width:1500,height:950});
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 await expect(page.locator('#jogadores .roster-player')).toHaveCount(2);
 const results=await page.locator('#jogadores .roster-player').evaluateAll(rows=>rows.map(row=>{
  const rect=s=>row.querySelector(s).getBoundingClientRect();
  return {
   avatar:rect('.roster-avatar').toJSON(),user:rect('.roster-player-name').toJSON(),
   character:rect('[data-member-character]').toJSON(),
   open:rect('.roster-open-button').toJSON(),
   remove:rect('[data-remove-member]').toJSON(),row:row.getBoundingClientRect().toJSON()
  }
 }));
 expect(results).toHaveLength(2);
 for(const row of results){
  expect(Math.abs(row.avatar.top-row.user.top),'Avatar e nome na mesma linha').toBeLessThanOrEqual(2);
  expect(Math.abs(row.character.top-row.user.top),'Jogador e Personagem na mesma linha').toBeLessThanOrEqual(2);
  expect(row.character.left,'Personagem à direita da identificação').toBeGreaterThan(row.user.right);
  expect(Math.abs(row.open.top-row.remove.top),'Botões alinhados entre si').toBeLessThanOrEqual(2);
  expect(row.open.left,'Ações à direita do personagem').toBeGreaterThanOrEqual(row.character.right);
  expect(Math.abs(row.open.top-row.character.top),'Ações na mesma linha do seletor').toBeLessThanOrEqual(5);
  expect(row.remove.right).toBeLessThanOrEqual(row.row.right+2);
 }
});
test('Campanha ocupa largura inteira acima dos Jogadores e capa mantém ações',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 const campaignCard=page.locator('#campanha'),playersCard=page.locator('#jogadores');
 await expect(campaignCard).toBeVisible();
 await expect(playersCard).toBeVisible();
 const geometry=await page.evaluate(()=>{
  const bounds=id=>{const r=document.getElementById(id).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}};
  const picker=document.querySelector('#campanha [data-image-picker]');
  const preview=picker.querySelector('[data-image-dropzone]').getBoundingClientRect();
  const actions=picker.querySelector('.image-picker-actions').getBoundingClientRect();
  const controls=[...picker.querySelectorAll('.image-picker-actions :is(.image-picker-button,button[data-image-remove])')].filter(el=>!el.hidden).map(el=>el.getBoundingClientRect());
  return {campaign:bounds('campanha'),players:bounds('jogadores'),preview:preview.toJSON(),actions:actions.toJSON(),controls:controls.map(r=>r.toJSON()),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth};
 });
 expect(geometry.players.top).toBeGreaterThanOrEqual(geometry.campaign.bottom);
 expect(Math.abs(geometry.players.left-geometry.campaign.left)).toBeLessThanOrEqual(2);
 expect(Math.abs(geometry.campaign.width-geometry.players.width)).toBeLessThanOrEqual(2);
 expect(geometry.campaign.width).toBeGreaterThan(700);
 expect(geometry.players.width).toBeGreaterThan(700);
 const columns=await campaignCard.evaluate(el=>{
  const main=el.querySelector('.campaign-settings-primary').getBoundingClientRect();
  const info=el.querySelector('.campaign-settings-details').getBoundingClientRect();
  return {main:main.toJSON(),info:info.toJSON()};
 });
 expect(columns.info.left).toBeGreaterThanOrEqual(columns.main.right);
 expect(Math.abs(columns.info.top-columns.main.top)).toBeLessThan(3);
 expect(geometry.actions.top).toBeGreaterThanOrEqual(geometry.preview.top);
 expect(geometry.actions.left).toBeGreaterThan(geometry.preview.left);
 expect(geometry.actions.right).toBeLessThanOrEqual(geometry.preview.right+1);
 expect(geometry.controls.length).toBeGreaterThan(0);
 expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth+2);
 await expect(campaignCard.locator('[data-image-input]')).toHaveCount(1);
 await expect(campaignCard.locator('[data-image-remove]')).toHaveCount(1);
 await expect(campaignCard.locator('.image-picker-button')).toBeVisible();
});
test('mobile mantém Campanha e Jogadores empilhados e controles da capa sobre a imagem',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 await expect(page.locator('#campanha [data-image-picker]')).toBeVisible();
 await expect(page.locator('#jogadores')).toBeVisible();
 const geo=await page.evaluate(()=>{
  const campaign=document.querySelector('#campanha').getBoundingClientRect();
  const players=document.querySelector('#jogadores').getBoundingClientRect();
  const picker=document.querySelector('#campanha [data-image-picker]');
  const preview=picker.querySelector('[data-image-dropzone]').getBoundingClientRect();
  const actions=picker.querySelector('.image-picker-actions').getBoundingClientRect();
  return {campaign:campaign.toJSON(),players:players.toJSON(),preview:preview.toJSON(),actions:actions.toJSON(),scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}
 });
 expect(geo.players.top).toBeGreaterThanOrEqual(geo.campaign.bottom);
 expect(Math.abs(geo.players.left-geo.campaign.left)).toBeLessThan(2);
 expect(geo.actions.top).toBeGreaterThanOrEqual(geo.preview.top);
 expect(geo.actions.right).toBeLessThanOrEqual(geo.preview.right+1);
 expect(geo.campaign.right).toBeLessThanOrEqual(geo.clientWidth+2);
 expect(geo.players.right).toBeLessThanOrEqual(geo.clientWidth+2);
});

test('reorganização dos jogadores por teclado persiste, sem alterar vínculos',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 const list=page.locator('#member-list');
 await expect(list.locator('[data-member-row]')).toHaveCount(2);
 const bruno=list.locator('[data-member-row="m2"] .roster-grip');
 await bruno.focus();
 await bruno.press('ArrowUp');
 await expect(list.locator('[data-member-row]').first()).toHaveAttribute('data-member-row','m2');
 await expect(list.locator('[data-member-row="m2"] .roster-grip')).toBeFocused();
 await page.reload();
 await expect(list.locator('[data-member-row]').first()).toHaveAttribute('data-member-row','m2');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0].members);
 expect(saved.map(m=>m.id)).toEqual(['m2','m1']);
 expect(saved.find(m=>m.id==='m1')?.characterId).toBe('pc-fernanda');
});

test('arrastar jogador sobre outro reordena sem perder personagens',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='desktop-chromium','arraste nativo em desktop');
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 const list=page.locator('#member-list');
 const handle=list.locator('[data-member-row="m1"] .roster-grip');
 const target=list.locator('[data-member-row="m2"]');
 await handle.scrollIntoViewIfNeeded();
 const from=await handle.boundingBox(),to=await target.boundingBox();
 await page.mouse.move(from.x+from.width/2,from.y+from.height/2);
 await page.mouse.down();
 await page.mouse.move(to.x+to.width/2,to.y+to.height*.80,{steps:14});
 await page.mouse.up();
 await expect(list.locator('[data-member-row]').first()).toHaveAttribute('data-member-row','m2');
 await expect(list.locator('[data-member-row]').last()).toHaveAttribute('data-member-row','m1');
 await page.reload();
 await expect(list.locator('[data-member-row]').last()).toHaveAttribute('data-member-row','m1');
});

test('borda da capa é suave e ações do editor continuam operacionais',async({page})=>{
 await page.goto('/mesa.html?id=e2e-campaign-ux');
 const preview=page.locator('#campanha .image-picker-preview');
 await expect(preview).toBeVisible();
 const border=await preview.evaluate(el=>getComputedStyle(el).borderColor);
 expect(border).toMatch(/rgba\(255, 255, 255, 0\.17\)/);
 const section=page.locator('#campanha');
 await expect(section.locator('[data-campaign-field="name"]')).toBeVisible();
 await expect(section.locator('[data-image-input]')).toHaveCount(1);
 await expect(section.locator('[data-save-campaign-section]')).toBeVisible();
});
