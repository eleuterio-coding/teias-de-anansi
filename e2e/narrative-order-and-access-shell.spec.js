import{test,expect}from'@playwright/test';
import{numberedAdventureTitle,numberedSessionTitle}from'../scripts/narrative-labels.js';

const campaign={id:'narrative-c1',name:'Reinos de Prata',status:'active',
 members:[{id:'member-ana',username:'ana',name:'Ana',role:'player',characterId:'char-ana',active:true}],
 sessions:[{id:'narrative-s1',number:1,order:8,title:'A convocação',status:'current',adventureId:'narrative-a1',participantCharacterIds:['char-ana'],scenes:[]}]};
const adventure={id:'narrative-a1',campaignId:campaign.id,title:'As Rainhas',order:5,status:'active',type:'main',scenes:[],chapters:[],missions:[]};
const character={id:'char-ana',name:'Aluria'},otherCharacter={id:'char-other',name:'Outro personagem'};
const membership={id:'membership-ana',uid:'ana-uid',username:'ana',role:'player',campaignId:campaign.id,
 characterId:character.id,sessionIds:['narrative-s1'],adventureIds:['narrative-a1'],active:true};

test('rótulos usam exclusivamente Ordem, sem recontar pelo número interno',()=>{
 expect(numberedAdventureTitle(adventure)).toBe('Aventura 5 · As Rainhas');
 expect(numberedSessionTitle(campaign.sessions[0])).toBe('Sessão 8 · A convocação');
});
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
});
test('Mestre vê numeração nos cards e layout idêntico de sessões em Campanhas',async({page})=>{
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure]));
 },{campaign,adventure});
 await page.goto('/aventuras.html');
 await expect(page.locator('[data-adventure-card="narrative-a1"] h2')).toHaveText('Aventura 5 · As Rainhas');
 await page.goto('/sessoes.html');
 const card=page.locator('[data-session-list-id="narrative-s1"]');
 await expect(card.locator('h2')).toHaveText('Sessão 8 · A convocação');
 await expect(card.locator('.hub-ancestry-adventure')).toContainText('Aventura 5 · As Rainhas');
 await page.goto('/mesa.html?id=narrative-c1');
 await expect(page.locator('#aventuras .campaign-player-story-card h3')).toContainText('Aventura 5 · As Rainhas');
 const sess=page.locator('#sessoes .campaign-player-story-card');
 await expect(sess.locator('h3')).toContainText('Sessão 8 · A convocação');
 await expect(sess.locator('.campaign-player-story-open')).toBeVisible();
 const styles=await sess.evaluate(card=>{
  const button=card.querySelector('.campaign-player-story-open').getBoundingClientRect();
  const footer=card.querySelector('.campaign-player-story-footer').getBoundingClientRect();
  return{left:button.left-footer.left};
 });
 expect(styles.left).toBeLessThan(18);
});
test('Jogador vê somente seus vínculos em Início com números persistidos',async({page})=>{
 await page.addInitScript(data=>{
  const session={uid:'ana-uid',username:'ana',isMaster:false,memberships:[data.membership]};
  const row={membership:data.membership,payload:{campaign:data.campaign,revealedAdventures:[data.adventure]},
   characters:[data.character,data.otherCharacter],characterIds:[data.character.id,data.otherCharacter.id]};
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(session));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify({schema:'hub-rpg/collaboration-cache/v1',campaigns:{[data.campaign.id]:row}}));
 },{campaign,adventure,character,otherCharacter,membership});
 await page.goto('/painel.html');
 const section=page.locator('#player-assignment');
 await expect(section).toBeVisible();
 await expect(section).toContainText('Aluria');
 await expect(section).toContainText('Reinos de Prata');
 await expect(section).toContainText('Aventura 5 · As Rainhas');
 await expect(section).toContainText('Sessão 8 · A convocação');
 await expect(section).not.toContainText('Outro personagem');
 await expect(section.locator('a[href="ficha-personagem.html?id=char-ana"]')).toHaveCount(1);
 await page.goto('/mesa.html?id=narrative-c1');
 await expect(page.locator('#aventuras .campaign-player-story-card h3')).toContainText('Aventura 5 · As Rainhas');
 await expect(page.locator('#sessoes .campaign-player-story-card h3')).toContainText('Sessão 8 · A convocação');
});
test('Usuário exibe Minha Imagem antes da prévia',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
 });
 await page.goto('/usuario.html');
 const card=page.locator('#own-profile-card');
 await expect(card.locator('.hub-user-image-title')).toHaveText('Minha Imagem');
 const order=await card.evaluate(node=>Array.from(node.children).map(element=>element.className));
 expect(order.indexOf('hub-user-image-title')).toBeLessThan(order.indexOf('hub-user-avatar-preview'));
});
