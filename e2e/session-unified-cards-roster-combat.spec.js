import {test,expect} from '@playwright/test';
const campaignId='qa-session-cards-c',sessionId='qa-session-cards-s',adventureId='qa-session-cards-a';
const users=['fernanda','bruno','gustavo','leo'];
const members=users.map((username,i)=>({id:'qa-session-cards-m'+i,username,name:username,role:'player',active:true,characterId:'qa-session-cards-ch'+i}));
const characters=users.map((username,i)=>({id:'qa-session-cards-ch'+i,name:'Personagem '+username,refSnapshots:{class:{name:'Guerreiro'}}}));
const encounters=[{id:'qa-session-cards-e1',title:'Guardiões',status:'planned',kind:'combat',combatants:[]},{id:'qa-session-cards-e2',title:'Câmara das Marés',status:'planned',kind:'combat',combatants:[]}];
const campaign={id:campaignId,name:'Campanha de Teste',status:'active',members,
 sessions:[{id:sessionId,title:'Santuário',number:1,order:1,status:'current',adventureId,
 participantUsernames:users,participantCharacterIds:characters.map(x=>x.id),
 encounters,encounterCount:99,combats:[],scenes:[]}]};
const adventure={id:adventureId,campaignId,title:'Aventura de Teste',status:'active',scenes:[],monsters:[],npcIds:[],locationIds:[]};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'qa-session-cards-dm',username:'mestre',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(data.characters));
 },{campaign,adventure,characters});
});
test('Selo Encontros consistente: usa os encontros reais na lista e no detalhe',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/sessoes.html?campaign='+campaignId);
 const stat=page.locator('[data-session-list-id="'+sessionId+'"] [data-session-encounter-count]');
 await expect(stat).toHaveAttribute('data-session-encounter-count','2');
 await expect(stat).toContainText('2');
 await page.goto('/sessoes.html?campaign='+campaignId+'&id='+sessionId);
 await expect(page.locator('.session-product-hero [data-session-encounter-count]')).toHaveAttribute('data-session-encounter-count','2');
 await expect(page.locator('.campaign-product-summary .metric').last()).toContainText('2');
 expect(errors).toEqual([]);
});
test('Jogadores repetem ordem e funções da Campanha; Sessão preserva própria ordem',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/mesa.html?id='+campaignId);
 const reference=page.locator('#jogadores [data-member-row]').first();
 await expect(reference).toBeVisible();
 const referenceGrips=await reference.locator('.roster-grip').evaluate(el=>el.getBoundingClientRect().width);
 const referenceAvatar=await reference.locator('.roster-player-identity .campaign-avatar-trigger,.roster-player-identity .roster-avatar').first().evaluate(el=>el.getBoundingClientRect().width);
 await page.goto('/sessoes.html?campaign='+campaignId+'&id='+sessionId);
 await page.locator('[data-session-stage-button="prepare"]').click();
 const rows=page.locator('#participantes [data-session-roster-row]');
 await expect(rows).toHaveCount(4);
 const first=rows.first();
 const grip=first.locator('.roster-grip');
 await expect(first.locator('.roster-player-actions .roster-move-button')).toHaveCount(2);
 await expect(first.locator('.roster-player-actions .roster-open-button')).toHaveCount(1);
 await expect(first.locator('.roster-player-actions .roster-remove-button')).toHaveCount(1);
 await expect(first.locator('.roster-player-profile-link').first()).toHaveAttribute('href',/usuario\.html/);
 await expect(first.locator('[data-session-character-link]')).toHaveCount(1);
 expect(await grip.evaluate(el=>el.getBoundingClientRect().width)).toBe(referenceGrips);
 expect(await first.locator('.roster-player-identity .campaign-avatar-trigger,.roster-player-identity .roster-avatar').first().evaluate(el=>el.getBoundingClientRect().width)).toBe(referenceAvatar);
 await grip.focus();
 await grip.press('ArrowDown');
 await expect(rows.first()).toHaveAttribute('data-session-roster-row','bruno');
 const state=await page.evaluate(id=>{
  const campaign=JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]').find(c=>c.id===id);
  return{campaignOrder:campaign.members.map(m=>m.username),sessionOrder:campaign.sessions[0].participantUsernames};
 },campaignId);
 expect(state.campaignOrder).toEqual(users);
 expect(state.sessionOrder[0]).toBe('bruno');
 const sizes=await rows.evaluateAll(nodes=>nodes.map(row=>{
  const container=row.getBoundingClientRect();
  const controls=[...row.querySelectorAll('.roster-player-actions button,.roster-player-actions a,.roster-character-picker select')].map(el=>el.getBoundingClientRect());
  return{left:container.left,right:container.right,controls:controls.map(c=>({left:c.left,right:c.right,width:c.width}))};
 }));
 for(const row of sizes)for(const c of row.controls){expect(c.width).toBeGreaterThan(0);expect(c.left).toBeGreaterThanOrEqual(row.left-3);expect(c.right).toBeLessThanOrEqual(row.right+3)}
 expect(errors).toEqual([]);
});
test('Ao vivo apresenta preparação de combate em quatro cards legíveis e utilizáveis',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/sessoes.html?campaign='+campaignId+'&id='+sessionId);
 await page.locator('[data-session-stage-button="live"]').click();
 const setup=page.locator('#combates .combat-setup-card');
 await expect(setup).toHaveCount(4);
 for(const control of ['data-create-quick-combat','data-create-new-encounter-combat','data-create-from-adventure-scene','data-create-from-encounter'])await expect(page.locator('#combates ['+control+']')).toBeVisible();
 const layout=await page.locator('#combates').evaluate(node=>{
  const css=element=>getComputedStyle(element),rect=element=>element.getBoundingClientRect();
  const cards=[...node.querySelectorAll('.combat-setup-card')];
  const dark=css(cards[0]).backgroundColor,label=css(cards[0].querySelector('h5')).color;
  const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
  const lum=arr=>arr.map(n=>{const v=n/255;return v<.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
  const a=lum(rgb(dark)),b=lum(rgb(label));
  return{contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),width:rect(node).width,
   cards:cards.map(card=>({left:rect(card).left,right:rect(card).right,width:rect(card).width}))};
 });
 expect(layout.contrast).toBeGreaterThanOrEqual(4.5);
 for(const card of layout.cards){expect(card.width).toBeGreaterThan(0)}
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(overflow).toBeLessThanOrEqual(4);
 expect(errors).toEqual([]);
});