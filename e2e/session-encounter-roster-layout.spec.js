import {test,expect} from '@playwright/test';

const cid='qa-layout-enc-roster-c',aid='qa-layout-enc-roster-a',sid='qa-layout-enc-roster-s';
const names=['Fernanda','Bruno','Gustavo','Léo'];
const characters=names.map((name,index)=>({id:'qa-layout-char-'+index,name:'Personagem de '+name,refSnapshots:{class:{name:'Guerreiro'}},choices:{class:{level:3}}}));
const campaign={
 id:cid,name:'Ecos do Abismo',status:'active',npcs:[],locations:[],
 members:names.map((name,index)=>({id:'qa-layout-member-'+index,username:'qa-layout-user-'+index,name,role:'player',characterId:characters[index].id,active:true})),
 sessions:[{
  id:sid,adventureId:aid,title:'Cena Teste',status:'current',number:1,order:1,
  participantUsernames:names.map((_,index)=>'qa-layout-user-'+index),
  participantCharacterIds:characters.map(char=>char.id),
  scenes:[],encounters:[{id:'qa-layout-encounter',title:'Cena Teste',status:'planned',kind:'combat',resolutionStatus:'pending',resolutionMethod:'other',combatants:[]}]
 }]
};
const adventure={id:aid,campaignId:cid,title:'Aventura Teste',status:'active',scenes:[],missions:[],monsters:[],npcIds:[],locationIds:[],participantUsernames:[],characterIds:[]};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'qa-layout-master',username:'mestre',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(data.characters));
  localStorage.setItem('hub-rpg:npcs:v1','[]');
 },{campaign,adventure,characters});
});
test('Encontros legíveis e botões compactos; jogadores completos sem overflow',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/sessoes.html?campaign='+cid+'&id='+sid);
 await page.locator('[data-session-stage-button="prepare"]').click();
 const encounter=page.locator('#encontros .encounter-card').first();
 const roster=page.locator('#participantes .session-roster-item');
 await expect(encounter).toBeVisible();
 await expect(roster).toHaveCount(4);
 await expect(roster.first()).toBeVisible();
 await expect(encounter.locator('h3')).toContainText('Cena Teste');
 await expect(encounter.locator('[data-encounter-adventure-npc]')).toHaveCount(1);
 await expect(encounter.locator('[data-encounter-adventure-monster]')).toHaveCount(1);
 const contrast=await encounter.evaluate(node=>{
  const rgb=str=>(str.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
  const luminance=c=>{const channels=c.map(value=>{const v=value/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722};
  const card=rgb(getComputedStyle(node).backgroundColor);
  const head=rgb(getComputedStyle(node.querySelector('h3')).color);
  const h=luminance(head),b=luminance(card);return (Math.max(h,b)+.05)/(Math.min(h,b)+.05);
 });
 expect(contrast,'O titulo deve ter contraste acessível contra o fundo do card').toBeGreaterThanOrEqual(4.5);
 const geometry=await page.evaluate(()=>{
  const encounter=document.querySelector('#encontros .encounter-card').getBoundingClientRect();
  const buttons=[...document.querySelectorAll('#encontros .encounter-picker-row>button')].map(node=>node.getBoundingClientRect());
  const roster=[...document.querySelectorAll('#participantes .session-roster-item')].map(node=>{
   const r=node.getBoundingClientRect();
   const controls=[...node.querySelectorAll('.roster-player-actions button,.roster-player-actions a,.roster-character-picker select')].map(el=>{
    const b=el.getBoundingClientRect();return{left:b.left,right:b.right,width:b.width};
   });
   return {left:r.left,right:r.right,width:r.width,controls};
  });
  return {page:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,encounter:{left:encounter.left,right:encounter.right},buttons:buttons.map(b=>({left:b.left,right:b.right,width:b.width})),roster};
 });
 expect(geometry.page,'Sem rolagem horizontal da pagina').toBeLessThanOrEqual(geometry.viewport+4);
 expect(geometry.buttons).toHaveLength(4);
 for(const button of geometry.buttons){
  expect(button.width,'Botão Adicionar não deve ocupar meia largura da tela').toBeLessThanOrEqual(testInfo.project.name==='mobile-chromium'?geometry.viewport:164);
  expect(button.right).toBeLessThanOrEqual(geometry.encounter.right+3);
 }
 for(const row of geometry.roster)for(const control of row.controls){
  expect(control.width).toBeGreaterThan(0);
  expect(control.right,'Ações dos jogadores não podem sair do card').toBeLessThanOrEqual(row.right+4);
 }
 expect(errors).toEqual([]);
});
