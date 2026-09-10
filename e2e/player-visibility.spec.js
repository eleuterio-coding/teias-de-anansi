import{test,expect}from'@playwright/test';

const membership={campaignId:'c-gus',uid:'u-gus',username:'gus',email:'gus@teias.invalid',displayName:'gus',role:'player',characterId:'pc-gus',sessionIds:['s-gus'],adventureIds:['a-gus'],active:true};
const session={uid:'u-gus',username:'gus',isMaster:false,memberships:[membership]};
const sharedCampaign={id:'c-gus',name:'Mesa do Gus',status:'active',system:'D&D 5.5e',setting:'Eberron',dmName:'Rafael',sharedNotes:'NOTA COMPARTILHADA GUS',members:[{id:'m-gus',name:'Gus',role:'player',characterId:'pc-gus',active:true}],sessions:[{id:'s-gus',number:1,title:'Sessão do Gus',status:'planned',summary:'RESUMO GUS',sharedNotes:'SESSÃO COMPARTILHADA',participantCharacterIds:['pc-gus']}],updatedAt:'2026-09-05T00:00:00Z'};
const cache={schema:'hub-rpg/collaboration-cache/v1',campaigns:{'c-gus':{membership,payload:{campaign:sharedCampaign,revealedAdventures:[{id:'a-gus',campaignId:'c-gus',title:'Aventura do Gus',status:'active',summary:'AVENTURA COMPARTILHADA',clues:[{id:'clue',title:'Pista revelada',text:'PISTA VISÍVEL',status:'discovered'}],handouts:[]}]}}}};
const localCampaigns=[{id:'c-master',name:'MESA SECRETA DO MESTRE',sessions:[{id:'s-master',title:'SESSÃO SECRETA'}],members:[],status:'active',updatedAt:'2026-09-05T00:00:00Z'}];
const localCharacters=[{id:'pc-gus',name:'Ficha do Gus',updatedAt:'2026-09-05T00:00:00Z'},{id:'pc-outro',name:'FICHA DE OUTRO JOGADOR',updatedAt:'2026-09-05T00:00:00Z'}];

test.beforeEach(async({page})=>{await page.addInitScript(({session,cache,localCampaigns,localCharacters})=>{localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(session));localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify(cache));localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(localCampaigns));localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(localCharacters));localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([{id:'a-master',campaignId:'c-master',title:'AVENTURA SECRETA DO MESTRE'}]));},{session,cache,localCampaigns,localCharacters})});

test('Jogador vê somente Campanha, Sessão, Aventura e ficha atribuídas',async({page})=>{
 await page.goto('/campanhas.html');
 await expect(page.getByRole('heading',{name:'Mesa do Gus'})).toBeVisible();
 await expect(page.getByText('MESA SECRETA DO MESTRE')).toHaveCount(0);
 await expect(page.locator('#campaign-create-card')).toBeHidden();
 await expect(page.getByRole('button',{name:'Excluir'})).toHaveCount(0);

 await page.goto('/sessoes.html');
 await expect(page.getByText('Sessão do Gus',{exact:true})).toBeVisible();
 await expect(page.getByText('SESSÃO SECRETA')).toHaveCount(0);

 await page.goto('/mesa.html?id=c-gus');
 await expect(page.getByText(/somente leitura/i).first()).toBeVisible();
 await expect(page.getByText('NOTA COMPARTILHADA GUS')).toBeVisible();
 await expect(page.getByRole('heading',{name:/Sessão 1 · Sessão do Gus/})).toBeVisible();
 await expect(page.getByText('Aventura do Gus',{exact:true})).toBeVisible();
 await expect(page.getByRole('button')).toHaveCount(0);

 await page.goto('/aventuras.html?campaign=c-gus');
 await expect(page.getByRole('heading',{name:'Aventura do Gus'})).toBeVisible();
 await expect(page.getByText('PISTA VISÍVEL',{exact:true})).toBeVisible();
 await expect(page.getByText('AVENTURA SECRETA DO MESTRE')).toHaveCount(0);

 await page.goto('/lista-personagens.html');
 await expect(page.getByRole('heading',{name:'Ficha do Gus'})).toBeVisible();
 await expect(page.getByText('FICHA DE OUTRO JOGADOR')).toHaveCount(0);
 await expect(page.locator('#create-character-action')).toBeHidden();
 await expect(page.getByText('Editar estrutura')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Excluir'})).toHaveCount(0);

 await page.goto('/bibliotecas.html');
 await expect(page).toHaveURL(/bibliotecas\.html/);
 await expect(page.locator('body')).toContainText('Biblioteca');
});