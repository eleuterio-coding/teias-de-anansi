import {test,expect} from '@playwright/test';

const campaignId='qa-sessoes-cards-campanha',adventureId='qa-sessoes-cards-aventura';
const campaign={id:campaignId,name:'Reinos de Prata',status:'active',members:[],npcs:[],locations:[],
 sessions:[
  {id:'qa-sessao-1',adventureId,number:1,order:1,title:'O Conselho',status:'planned',date:'2026-10-28',summary:'As rainhas convocam o grupo.'},
  {id:'qa-sessao-2',adventureId,number:2,order:2,title:'A Emboscada',status:'active',summary:'Atravessar a estrada em segurança.'}
 ]};
const adventure={id:adventureId,campaignId,title:'As Rainhas',status:'active',
 participantUsernames:[],characterIds:[],npcIds:[],locationIds:[],scenes:[],missions:[],monsters:[]};

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(({campaign,adventure})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({
   uid:'qa-sessoes-cards-mestre',username:'rafael',isMaster:true,memberships:[]
  }));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([adventure]));
  localStorage.setItem('hub-rpg:characters:v4','[]');
 },{campaign,adventure});
});

test('Sessões vinculadas conservam os cards clássicos e abrem a sessão sem edição na Visão Geral',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 const section=page.locator('#overview-sessoes');
 await expect(section).toBeVisible();
 await expect(section.locator('.campaign-player-story-grid')).toBeVisible();
 const links=section.locator('.adventure-linked-session .adventure-session-card-wrap > a.campaign-player-story-card');
 await expect(links).toHaveCount(2);
 await expect(links.first()).toHaveAttribute('href','sessoes.html?campaign='+campaignId+'&id=qa-sessao-1');
 await expect(links.first()).toContainText('O Conselho');
 await expect(links.first()).toContainText('As rainhas convocam o grupo.');
 await expect(links.first()).toContainText('Planejada');
 await expect(links.first().locator('.campaign-player-story-open')).toContainText('Abrir');
 await expect(links.nth(1)).toContainText('Em andamento');
 await expect(section.locator('button,input,select,textarea,[data-adventure-visible]')).toHaveCount(0);
 // CSS do card clássico: capa em plano de fundo e conteúdo na base.
 const style=await links.first().evaluate(node=>{
  const card=getComputedStyle(node);
  const image=node.querySelector('.campaign-player-story-image');
  const picture=image?getComputedStyle(image):null;
  return {position:card.position,display:card.display,minimum:parseFloat(card.minHeight),imagePosition:picture?.position||null};
 });
 expect(style.position).toBe('relative');
 expect(style.display).toBe('flex');
 expect(style.minimum).toBeGreaterThanOrEqual(178);
 await page.locator('#adventure-create-tab').click();
 await expect(section).toBeHidden();
 await expect(page.locator('#sessoes')).toBeHidden();
 expect(errors).toEqual([]);
});
