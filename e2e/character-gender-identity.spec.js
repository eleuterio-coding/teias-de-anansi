import{test,expect}from'@playwright/test';

const character={
 id:'e2e-aluria',name:'Aluria',ruleset:'5.5e',
 refs:{class:'classes:srd521:ranger',species:'especies:srd521:elf',background:null,subclass:null},
 refSnapshots:{
  class:{id:'classes:srd521:ranger',name:'Patrulheiro',source:'SRD 5.2.1'},
  species:{id:'especies:srd521:elf',name:'Elfo',source:'SRD 5.2.1'}
 },
 baseAbilities:{Força:10,Destreza:14,Constituição:12,Inteligência:10,Sabedoria:14,Carisma:10},
 choices:{class:{level:4,skills:[],equipment:'A'},species:{lineage:null,size:null},background:{equipment:'A'},feats:{},equipment:{},spells:{cantrips:[],leveled:[],arcanum:{}}},
 sheet:{profile:{gender:'Feminino'}}
};
const campaign={id:'e2e-gender-camp',name:'Reinos de Prata',status:'active',members:[
 {id:'e2e-member',username:'fernanda',name:'Fernanda',role:'player',characterId:character.id,active:true}
],sessions:[]};
const adventure={id:'e2e-gender-adv',campaignId:campaign.id,title:'As Rainhas',status:'active',
 participantUsernames:['fernanda'],characterIds:[character.id],
 participantAssignments:[{username:'fernanda',characterId:character.id}],scenes:[]};

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password',playerAccounts:[]})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'mestre',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:characters:v4'))localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([data.character]));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure]));
 },{character,campaign,adventure});
});

test('Campanha e Aventura usam Nome · Classe lvl X · Raça no gênero da ficha',async({page})=>{
 await page.goto('/mesa.html?id=e2e-gender-camp');
 const campaignSelect=page.locator('#jogadores [data-member-character]');
 await expect(campaignSelect.locator('option:checked')).toHaveText('Aluria · Patrulheira lvl 4 · Elfa');
 await page.goto('/aventuras.html?campaign=e2e-gender-camp&id=e2e-gender-adv');
 const adventureSelect=page.locator('[data-adventure-member-character]');
 await expect(adventureSelect.locator('option:checked')).toHaveText('Aluria · Patrulheira lvl 4 · Elfa');
});
test('alterar gênero na Ficha é persistido e se reflete nos cards da Campanha',async({page})=>{
 await page.goto('/ficha-personagem.html?id=e2e-aluria');
 await expect(page.locator('#sheet')).toBeVisible();
 const gender=page.locator('#profile-gender');
 await expect(gender).toHaveValue('Feminino');
 await gender.selectOption('Outro');
 await expect(page.locator('#pc-subtitle')).toContainText('Patrulheire');
 const value=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:characters:v4')||'[]')
  .find(c=>c.id==='e2e-aluria')?.sheet?.profile?.gender);
 expect(value).toBe('Outro');
 await page.goto('/mesa.html?id=e2e-gender-camp');
 await expect(page.locator('#jogadores [data-member-character] option:checked')).toHaveText('Aluria · Patrulheire lvl 4 · Elfe');
});
