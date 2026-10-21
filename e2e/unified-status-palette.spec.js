import{test,expect}from'@playwright/test';

const states=['current','next','active','planned','paused','completed','cancelled','archived'];
const campaign={id:'palette-campaign',name:'Campanha de Teste',status:'active',members:[],
 sessions:[{id:'palette-session',title:'Sessão Teste',number:1,status:'current',adventureId:'palette-adventure',scenes:[],encounters:[]}]};
const adventure={id:'palette-adventure',campaignId:campaign.id,title:'Aventura Teste',
 status:'planned',type:'main',chapters:[],scenes:[],missions:[]};

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({
   uid:'palette-master',username:'rafael',isMaster:true,memberships:[]
  }));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure]));
  localStorage.setItem('hub-rpg:standalone-sessions:v1',JSON.stringify([]));
 },{campaign,adventure});
});

async function sampleStatusColors(page,rootSelector,className){
 return page.locator(rootSelector).evaluate((root,{states,className})=>{
  const sample=document.createElement('span');
  sample.className=className;root.appendChild(sample);
  const palette={};
  for(const state of states){
   sample.className=className+' status-'+state;
   const style=getComputedStyle(sample);
   palette[state]={background:style.backgroundColor,border:style.borderTopColor,ink:style.color};
  }
  sample.remove();
  return palette;
 },{states,className});
}

test('As três listas usam a mesma paleta canônica',async({page})=>{
 const palettes={};
 for(const [url,root,key] of [
  ['/campanhas.html','#campaign-list','campaigns'],
  ['/aventuras.html','#adventure-list','adventures'],
  ['/sessoes.html','#sessions-list','sessions']
 ]){
  await page.goto(url);
  await expect(page.locator(root+' .campaign-card').first()).toBeVisible();
  palettes[key]=await sampleStatusColors(page,root,'campaign-card-status');
 }
 expect(palettes.adventures).toEqual(palettes.campaigns);
 expect(palettes.sessions).toEqual(palettes.campaigns);
 expect(palettes.campaigns.archived).not.toEqual(palettes.campaigns.cancelled);
 expect(palettes.campaigns.current).not.toEqual(palettes.campaigns.next);
});

test('Status de Aventuras e Sessões dentro da Campanha também seguem a paleta',async({page})=>{
 await page.goto('/campanhas.html');
 await expect(page.locator('#campaign-list .campaign-card').first()).toBeVisible();
 const master=await sampleStatusColors(page,'#campaign-list','campaign-card-status');
 await page.goto('/mesa.html?id=palette-campaign');
 await expect(page.locator('#table-root')).toBeVisible();
 for(const cls of ['campaign-reference-status','campaign-player-story-status']){
  const palette=await sampleStatusColors(page,'#table-root',cls);
  expect(palette).toEqual(master);
 }
});

test('Indicadores de coleção não sobrescrevem as cores',async({page})=>{
 await page.goto('/aventuras.html');
 await expect(page.locator('#adventure-list .campaign-card').first()).toBeVisible();
 const master=await sampleStatusColors(page,'#adventure-list','campaign-card-status');
 const legacy=await page.locator('#adventure-list').evaluate((root,states)=>{
  const card=document.createElement('div');card.className='hub-collection-card';
  const sample=document.createElement('span');card.appendChild(sample);root.appendChild(card);
  const palette={};
  for(const state of states){
   sample.className='hub-collection-status status-'+state;
   const style=getComputedStyle(sample);
   palette[state]={background:style.backgroundColor,border:style.borderTopColor,ink:style.color};
  }
  card.remove();return palette;
 },states);
 expect(legacy).toEqual(master);
});
