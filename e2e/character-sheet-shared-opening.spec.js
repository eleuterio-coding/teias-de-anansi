import{test,expect}from'@playwright/test';

const base=(id,name)=>({
 id,name,ruleset:'5.5e',schema:'hub-rpg/personagem/v4',
 refs:{class:null,species:null,background:null,subclass:null},refSnapshots:{},
 baseAbilities:{Força:10,Destreza:10,Constituição:10,Inteligência:10,Sabedoria:10,Carisma:10},
 choices:{class:{level:1,skills:[],equipment:'A'},species:{size:null,lineage:null},background:{abilityMode:'2+1',equipment:'A',plusOnes:[]},feats:{},equipment:{armor:null,shield:false,weapon:null},spells:{cantrips:[],leveled:[]}},
 updatedAt:'2026-10-21T10:00:00Z'
});
const own=base('char-own','Personagem próprio'),other=base('char-other','Personagem compartilhado');
const camp={id:'campaign-sheet',name:'Campanha da ficha',status:'active',members:[
 {id:'m1',username:'bruno',role:'player',characterId:own.id,active:true},
 {id:'m2',username:'gustavo',role:'player',characterId:other.id,active:true}
],sessions:[]};
const membership={campaignId:camp.id,uid:'uid-bruno',username:'bruno',role:'player',characterId:own.id,active:true};
const cache={schema:'hub-rpg/collaboration-cache/v1',campaigns:{
 [camp.id]:{membership,payload:{campaign:camp,participants:[],revealedAdventures:[]},characters:[own,other],characterIds:[own.id,other.id]}
}};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
});
test('Jogador abre ficha compartilhada mesmo sem cópia no armazenamento local',async({page})=>{
 await page.addInitScript(({membership,cache})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'uid-bruno',username:'bruno',isMaster:false,memberships:[membership]}));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify(cache));
  localStorage.setItem('hub-rpg:characters:v4','[]');
 },{membership,cache});
 await page.goto('/ficha-personagem.html?id=char-other');
 await expect(page.locator('#sheet')).toBeVisible({timeout:45000});
 await expect(page.locator('#pc-name')).toHaveText('Personagem compartilhado');
 await expect(page.locator('#sheet')).toHaveAttribute('data-read-only','true');
 await expect(page.locator('#save-sheet')).toBeHidden();
 await expect(page.locator('#loading')).toBeHidden();
});
test('Jogador abre a própria ficha do cache sem cópia local e mantém acesso de edição',async({page})=>{
 await page.addInitScript(({membership,cache})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'uid-bruno',username:'bruno',isMaster:false,memberships:[membership]}));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify(cache));
  localStorage.setItem('hub-rpg:characters:v4','[]');
 },{membership,cache});
 await page.goto('/ficha-personagem.html?id=char-own');
 await expect(page.locator('#sheet')).toBeVisible({timeout:45000});
 await expect(page.locator('#pc-name')).toHaveText('Personagem próprio');
 await expect(page.locator('#save-sheet')).toBeVisible();
 await expect(page.locator('#sheet')).not.toHaveAttribute('data-read-only','true');
});
test('Ficha indisponível recebe os dados de Campanha sincronizados sem recarregar a página',async({page})=>{
 await page.addInitScript(({membership})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'uid-bruno',username:'bruno',isMaster:false,memberships:[membership]}));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify({schema:'hub-rpg/collaboration-cache/v1',campaigns:{}}));
  localStorage.setItem('hub-rpg:characters:v4','[]');
 },{membership});
 await page.goto('/ficha-personagem.html?id=char-other');
 await expect(page.locator('#loading')).toContainText('Carregando a ficha compartilhada');
 await page.evaluate(value=>{
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('hub-rpg:remote-updated',{detail:{kinds:['permissions','characters']}}));
 },cache);
 await expect(page.locator('#sheet')).toBeVisible({timeout:45000});
 await expect(page.locator('#pc-name')).toHaveText('Personagem compartilhado');
 await expect(page.locator('#sheet')).toHaveAttribute('data-read-only','true');
});
test('Mestre continua abrindo ficha local normalmente',async({page})=>{
 await page.addInitScript(pc=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'uid-master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([pc]));
 },own);
 await page.goto('/ficha-personagem.html?id=char-own');
 await expect(page.locator('#sheet')).toBeVisible({timeout:45000});
 await expect(page.locator('#pc-name')).toHaveText('Personagem próprio');
 await expect(page.locator('#save-sheet')).toBeVisible();
});

test('Ficha do jogador atribuída pela sessão abre com dados locais sem cache da Campanha',async({page})=>{
 await page.addInitScript(({membership,own})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'uid-bruno',username:'bruno',isMaster:false,memberships:[membership]}));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify({schema:'hub-rpg/collaboration-cache/v1',campaigns:{}}));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([own]));
 },{membership,own});
 await page.goto('/lista-personagens.html');
 const card=page.locator('.pc').filter({hasText:'Personagem próprio'});
 await expect(card).toBeVisible();
 await expect(card.getByRole('link',{name:'Abrir Ficha'})).toHaveAttribute('href',/ficha-personagem/);
 await card.getByRole('link',{name:'Abrir Ficha'}).click();
 await expect(page).toHaveURL(/ficha-personagem\.html.*id=char-own/);
 await expect(page.locator('#sheet')).toBeVisible({timeout:30000});
 await expect(page.locator('#pc-name')).toHaveText('Personagem próprio');
 await expect(page.locator('#save-sheet')).toBeVisible();
});
test('A atribuição não concede acesso a outros personagens quando o cache está ausente',async({page})=>{
 await page.addInitScript(({membership,other})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'uid-bruno',username:'bruno',isMaster:false,memberships:[membership]}));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify({schema:'hub-rpg/collaboration-cache/v1',campaigns:{}}));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([other]));
 },{membership,other});
 await page.goto('/lista-personagens.html');
 await expect(page.locator('.pc')).toHaveCount(0);
 await page.goto('/ficha-personagem.html?id=char-other');
 await expect(page.locator('#sheet')).toBeHidden();
 await expect(page.locator('#save-sheet')).not.toBeVisible();
});

test('Quando a autenticação expira, retorno ao login preserva o endereço da ficha',async({page})=>{
 const code=`
 export async function createFirebaseCollaborationProvider(){
  return{configured:true,onAuthChanged(callback){queueMicrotask(()=>callback(null));return()=>{}}}
 }
 `;
 await page.route('**/scripts/firebase-collaboration-provider.js*',route=>route.fulfill({status:200,contentType:'text/javascript',body:code}));
 await page.addInitScript(pc=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'uid-master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([pc]));
 },own);
 await page.goto('/ficha-personagem.html?id=char-own',{waitUntil:'domcontentloaded'});
 await expect(page).toHaveURL(/usuarios\.html\?next=ficha-personagem\.html/, {timeout:20000});
 const next=new URL(page.url()).searchParams.get('next');
 expect(next).toBe('ficha-personagem.html?id=char-own');
});
