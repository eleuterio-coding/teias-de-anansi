import{test,expect}from'@playwright/test';

const character={id:'qa-roster-pc',name:'Aluria',refSnapshots:{class:{name:'Patrulheiro'}},choices:{class:{level:4}}};
const campaign={id:'qa-roster-parity',name:'Reinos de Prata',status:'active',
 members:[{id:'qa-member',username:'aluria',name:'Jogadora Aluria',role:'player',characterId:character.id,active:true}],
 sessions:[{id:'qa-session',title:'Sessão de teste',number:1,order:1,status:'next',participantUsernames:['aluria'],participantCharacterIds:[character.id],scenes:[]}]};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'qa-master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([data.character]));
  localStorage.setItem('hub-rpg:adventures:v1','[]');
 },{campaign,character});
});

test('Sessão compartilha hierarquia visual, alinhamento e ações do elenco da Campanha',async({page},testInfo)=>{
 const inspect=async(selector)=>page.locator(selector).first().evaluate(el=>{
  const styles=getComputedStyle(el);
  const rect=sel=>el.querySelector(sel)?.getBoundingClientRect();
  const name=rect('.roster-player-name'),avatar=rect('.roster-player-identity .campaign-avatar-trigger, .roster-player-identity .roster-avatar');
  const character=rect('.roster-player-character'),open=rect('.roster-open-button'),remove=rect('.roster-remove-button');
  return {
   columns:styles.gridTemplateColumns.split(' ').map(v=>Math.round(parseFloat(v))),
   rows:styles.gridTemplateRows.split(' ').map(v=>Math.round(parseFloat(v))),
   nameTop:name?.top,characterTop:character?.top,
   avatarHeight:avatar?.height,openWidth:open?.width,removeWidth:remove?.width,
   openHeight:open?.height,removeHeight:remove?.height,
   width:el.getBoundingClientRect().width,
   overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
  };
 });
 await page.goto('/mesa.html?id=qa-roster-parity');
 const campaignRow=page.locator('#jogadores .roster-player').first();
 await expect(campaignRow).toBeVisible();
 const expected=await inspect('#jogadores .roster-player');
 await page.goto('/sessoes.html?campaign=qa-roster-parity&id=qa-session');
 const sessionRow=page.locator('#participantes .session-roster-item').first();
 await expect(sessionRow).toBeVisible();
 await expect(page.locator('#participantes h2')).toHaveText('Jogadores da Sessão');
 await expect(sessionRow.locator('.roster-grip')).toHaveCount(1);
 await expect(sessionRow.locator('.roster-player-display')).toHaveCount(1);
 await expect(sessionRow.locator('.roster-character-picker select')).toHaveCount(1);
 await expect(sessionRow.locator('.roster-player-actions button.roster-move-button')).toHaveCount(2);
 await expect(sessionRow.locator('.roster-open-button')).toHaveCount(1);
 await expect(sessionRow.locator('.roster-remove-button')).toHaveCount(1);
 await expect(page.locator('#participantes .roster-add-panel')).toBeVisible();
 const actual=await inspect('#participantes .session-roster-item');
 expect(actual.openWidth).toBeGreaterThanOrEqual(43);
 expect(actual.removeWidth).toBeGreaterThanOrEqual(43);
 expect(actual.openHeight).toBeGreaterThanOrEqual(43);
 expect(actual.removeHeight).toBeGreaterThanOrEqual(43);
 expect(actual.overflow).toBeLessThanOrEqual(3);
 if(testInfo.project.name==='desktop-chromium'){
  expect(actual.columns).toHaveLength(5);
  expect(expected.columns).toHaveLength(5);
  expect(actual.columns[0]).toBe(expected.columns[0]);
  expect(actual.columns[1]).toBe(expected.columns[1]);
  expect(actual.columns[4]).toBe(expected.columns[4]);
  expect(Math.abs(actual.nameTop-actual.characterTop)).toBeLessThan(24);
 }else{
  expect(actual.columns.length).toBeLessThanOrEqual(4);
 }
});
