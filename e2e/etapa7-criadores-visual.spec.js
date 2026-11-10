import {test,expect} from '@playwright/test';

// Etapa 7: fixtures isoladas, sem conexao de producao e sem salvar dados reais.
const campaign={
 id:'stage7-c',name:'Mesa da Etapa 7',status:'active',system:'D&D 5.5e',dmName:'Mestre',
 members:[{id:'stage7-member',username:'jo',name:'Jo',role:'player',characterId:'stage7-pc',active:true}],
 npcs:[{id:'stage7-npc',name:'Guardiã do Farol',role:'Aliada'}],
 locations:[],importantNpcIds:[],
 sessions:[{id:'stage7-s',number:1,order:1,title:'A Primeira Luz',status:'planned',
  adventureId:'stage7-a',scenes:[],encounters:[],combats:[],participantCharacterIds:['stage7-pc']}]
};
const adventure={
 id:'stage7-a',campaignId:'stage7-c',title:'A Floresta',order:1,status:'active',type:'main',
 description:'Uma trilha antiga conduz ao farol.',participantUsernames:['jo'],characterIds:['stage7-pc'],
 npcIds:['stage7-npc'],locationIds:[],scenes:[],missions:[],monsters:[],
 exploration:{levels:[],areas:[],factions:[],history:[]}
};
const pc={id:'stage7-pc',name:'Viajante da Aurora',
 ruleset:'5.5e',schema:'hub-rpg/personagem/v4',
 ownerUid:'stage7-player',ownerUsername:'jo',
 refs:{class:null,species:null,background:null,subclass:null},refSnapshots:{},
 baseAbilities:{Força:10,Destreza:10,Constituição:10,Inteligência:10,Sabedoria:10,Carisma:10},
 choices:{class:{level:1,skills:[],equipment:'A'},species:{size:null,lineage:null},
 background:{abilityMode:'2+1',equipment:'A',plusOnes:[]},feats:{},
 equipment:{armor:null,shield:false,weapon:null},spells:{cantrips:[],leveled:[]}}};
const member={campaignId:campaign.id,uid:'stage7-player',username:'jo',role:'player',
 characterId:pc.id,sessionIds:['stage7-s'],adventureIds:[adventure.id],active:true};
const shared={schema:'hub-rpg/collaboration-cache/v1',campaigns:{
 [campaign.id]:{membership:member,payload:{campaign,revealedAdventures:[{
 id:adventure.id,campaignId:campaign.id,title:adventure.title,status:'active',
 description:adventure.description,participantUsernames:['jo'],
 locations:[{id:'stage7-public-area',name:'Farol'}],npcs:[{id:'stage7-public-npc',name:'Guardiã'}],
 exploration:{levels:[],areas:[],factions:[]},scenes:[],missions:[],clues:[],handouts:[]}],
 participants:[{uid:'stage7-player',username:'jo',displayName:'Jo'}]},
 characters:[pc],characterIds:[pc.id]}
}};
test.beforeEach(async ({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 // Fixar o retorno da Biblioteca externa de criaturas no navegador de teste.
 await page.route('**/dados/monstros-pdf-extras.json*',route=>route.fulfill({status:200,contentType:'application/json',body:'{"items":[]}'}));
 await page.route('**/dados/monstros-fontes/*.json*',route=>route.fulfill({status:200,contentType:'application/json',body:'{"monster":[]}'}));
 await page.route('https://apisearch.thedmstoolkit.com/api/2024/monsters**',route=>{
  const query=route.request().url().includes('?');
  return route.fulfill({status:200,contentType:'application/json',
   headers:{'access-control-allow-origin':'*'},body:JSON.stringify(query?
    {data:[{name:'Goblin fictício',slug:'goblin-stage7'}]}:
    {data:{name:'Goblin fictício',properties:{'Armor Class':'15','Hit Points':'7','Challenge':'1/4'}}})});
 });
});
async function identity(page,role){
 await page.addInitScript(({role,campaign,adventure,pc,member,shared})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(role==='Mestre'
   ?{uid:'stage7-master',username:'mestre',isMaster:true,memberships:[]}
   :{uid:'stage7-player',username:'jo',isMaster:false,memberships:[member]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([adventure]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([pc]));
  localStorage.setItem('hub-rpg:npcs:v1','[]');
  localStorage.setItem('hub-rpg:standalone-sessions:v1','[]');
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify(shared));
 },{role,campaign,adventure,pc,member,shared});
}
async function stable(page,selector){
 await expect(page.locator('.hub-app-shell')).toBeVisible({timeout:30000});
 if(selector)await expect(page.locator(selector)).toBeVisible({timeout:30000});
}
async function geom(page,label,selector){
 const value=await page.evaluate(sel=>{
  const el=document.querySelector(sel),r=el?.getBoundingClientRect(),doc=document.documentElement;
  return {viewport:doc.clientWidth,scroll:doc.scrollWidth,
   bounds:r?{left:r.left,right:r.right,width:r.width}:null};
 },selector);
 expect(value.bounds,label+' deve existir').not.toBeNull();
 expect(value.bounds.width,label+' largura útil').toBeGreaterThan(0);
 expect(value.scroll-value.viewport,label+' overflow horizontal').toBeLessThanOrEqual(3);
 return value;
}
async function target(page,selector,label){
 const v=await page.locator(selector).first().evaluate(el=>{
  const r=el.getBoundingClientRect();return {w:r.width,h:r.height,visible:r.width>0&&r.height>0};
 });
 expect(v.visible,label+' visível').toBe(true);
 expect(v.h,label+' altura mínima de 44px').toBeGreaterThanOrEqual(44);
}
test('Mestre: criador de Aventura preserva campos e ações, sem overflow',async ({page},info)=>{
 await identity(page,'Mestre');
 await page.goto('/aventuras.html?campaign=stage7-c');
 await stable(page,'#open-adventure-create');
 await page.locator('#open-adventure-create').click();
 await expect(page.locator('#adventure-create-card')).toBeVisible();
 await geom(page,'Nova Aventura','#adventure-create-card');
 for(const id of ['#new-adventure-title','#new-adventure-status','#adventure-campaign']){
  await expect(page.locator(id)).toBeVisible();
 }
 await target(page,'#create-adventure','Criar aventura');
 await page.screenshot({path:info.outputPath('stage7-nova-aventura.png'),animations:'disabled'});
});
test('Mestre: Oficina cobre Cenas, Locais, Mapas, NPCs, Monstros e conteúdo adicional',async ({page},info)=>{
 test.setTimeout(120_000);
 await identity(page,'Mestre');
 await page.goto('/aventuras.html?campaign=stage7-c&id=stage7-a');
 await stable(page,'#adventure-overview-content');
 await expect(page.locator('#adventure-create-content')).toBeHidden();
 await expect(page.locator('#adventure-overview-content .adventure-read-grid :is(button,input,select,textarea)')).toHaveCount(0);
 await page.locator('#adventure-create-tab').click();
 const cases=[
  ['scene','#criar-cena','#add-scene'],
  ['area','#criar-area','#ex-new-area button[type="submit"]'],
  ['map','#criar-mapa','#ex-new-level button[type="submit"]'],
  ['npc','#npcs','#add-campaign-npc'],
  ['monster','#monstros','#add-adventure-monster'],
  ['more','#missoes','#add-mission']
 ];
 for(const [kind,sel,action] of cases){
  await page.locator('[data-adventure-creation-kind="'+kind+'"]').click();
  await stable(page,sel);
  await expect(page.locator('#adventure-active-section-title')).toBeVisible();
  await geom(page,'Oficina '+kind,sel);
  await target(page,action,'Ação '+kind);
  await page.screenshot({path:info.outputPath('stage7-oficina-'+kind+'.png'),animations:'disabled'});
 }
 await page.locator('[data-adventure-creation-kind="area"]').click();
 await page.locator('#ex-new-area [name="code"]').fill('L01');
 await page.locator('#ex-new-area button[type="submit"]').click();
 await expect(page.locator('#exploracao .explore-area-card')).toHaveCount(1);
 await geom(page,'Local criado','#exploracao');
 await page.locator('#adventure-overview-tab').click();
 await expect(page.locator('#overview-locais .adventure-read-card')).toHaveCount(1);
 await expect(page.locator('#adventure-overview-content .adventure-read-grid :is(button,input,select,textarea)')).toHaveCount(0);
});
test('Mestre: formulário de NPC, ficha e catálogos de itens/magias seguem seus temas',async ({page},info)=>{
 test.setTimeout(100_000);
 await identity(page,'Mestre');
 await page.goto('/lista-npcs.html');
 await stable(page,'#npc-master-actions');
 await page.locator('#link-npc').click();
 await stable(page,'#npc-directory-form');
 await geom(page,'Cadastro de NPC','#npc-editor');
 await target(page,'#close-npc-editor','Fechar editor');
 await page.screenshot({path:info.outputPath('stage7-npc-form.png'),animations:'disabled'});
 await page.goto('/criacao-personagem.html?npc=1#etapa-origem');
 await stable(page,'#nome');
 await expect(page.getByRole('heading',{name:'Criação de NPC'})).toBeVisible();
 await expect(page.locator('body')).toHaveClass(/hub-content-light/);
 await geom(page,'Ficha de criação de NPC','#builder');
 await page.screenshot({path:info.outputPath('stage7-npc-ficha.png'),animations:'disabled'});
 await page.goto('/criacao-personagem.html');
 await stable(page,'#builder');
 await expect(page.locator('#magias-escolhas')).toHaveCount(1);
 await page.locator('[data-wizard-step="equipamento"]').click();
 await geom(page,'Equipamentos do construtor','#builder');
 for(const path of ['/itens-magicos.html','/magias.html']){
  await page.goto(path);
  await stable(page,'.hub-app-content');
  await expect(page.locator('body')).toHaveClass(/hub-content-library/);
  await geom(page,'Catálogo '+path,'.hub-app-content');
 }
});
test('Mestre: editor de Encontros permanece na Sessão e respeita a largura',async ({page},info)=>{
 await identity(page,'Mestre');
 await page.goto('/sessoes.html?campaign=stage7-c&id=stage7-s');
 await stable(page,'#encontros [data-new-encounter-title]');
 await geom(page,'Editor de Encontros','#encontros');
 await target(page,'#encontros [data-create-encounter]','Criar encontro');
 await expect(page.locator('#encontros [data-new-encounter-scene]')).toBeVisible();
 await page.screenshot({path:info.outputPath('stage7-encontros.png'),animations:'disabled'});
});
test('Jogador: Aventura e Sessão apenas de leitura, sem formulários exclusivos do Mestre',async ({page},info)=>{
 await identity(page,'Jogador');
 await page.goto('/aventuras.html?campaign=stage7-c&id=stage7-a');
 await stable(page,'.adventure-detail-readonly');
 await expect(page.locator('#adventure-create-tab,#ex-new-area,#new-npc-name,#new-adventure-monster')).toHaveCount(0);
 await geom(page,'Aventura do Jogador','.adventure-detail-readonly');
 await page.screenshot({path:info.outputPath('stage7-jogador-aventura.png'),animations:'disabled'});
 await page.goto('/sessoes.html?campaign=stage7-c&id=stage7-s');
 await stable(page,'#visao-geral');
 await expect(page.locator('[data-save-session-main],#encontros [data-create-encounter]')).toHaveCount(0);
 await geom(page,'Sessão do Jogador','#sessions-list');
 await page.screenshot({path:info.outputPath('stage7-jogador-sessao.png'),animations:'disabled'});
});
test('Jogador: NPCs restritos e criação própria não viram edição do Mestre',async ({page})=>{
 await identity(page,'Jogador');
 await page.goto('/lista-npcs.html');
 await stable(page,'#npc-list');
 await expect(page.locator('#npc-master-actions,#npc-editor')).toBeHidden();
 await geom(page,'Lista de NPCs','#main-content');
 await page.goto('/criacao-personagem.html');
 await stable(page,'#builder');
 await expect(page.getByRole('heading',{name:'Criação de Personagem'})).toBeVisible();
 await expect(page.locator('#magias-escolhas')).toHaveCount(1);
 await geom(page,'Criador próprio','#builder');
 await page.goto('/criacao-personagem.html?npc=1');
 await expect(page).toHaveURL(/personagens\.html/);
 await expect(page.locator('#builder')).toHaveCount(0);
});
