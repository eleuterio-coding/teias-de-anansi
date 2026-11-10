import {test,expect} from '@playwright/test';

// Etapa 6: somente leitura e geometria; nenhuma operação de salvar, editar ou publicar.
const modules=[
 'antecedentes.html','armaduras.html','armas.html','bugigangas.html',
 'classes.html','comercio-e-despesas.html','equipamentos-aventura.html',
 'ferramentas.html','idiomas.html','itens-magicos.html','maestrias-de-arma.html',
 'magias.html','monstros.html','montarias-veiculos.html','raca.html',
 'regras.html','subclasses.html','talentos.html'
];
const pc=(id,name)=>({
 id,name,ruleset:'5.5e',schema:'hub-rpg/personagem/v4',
 refs:{class:null,species:null,background:null,subclass:null},refSnapshots:{},
 baseAbilities:{Força:10,Destreza:10,Constituição:10,Inteligência:10,Sabedoria:10,Carisma:10},
 choices:{class:{level:1,skills:[],equipment:'A'},species:{size:null,lineage:null},
 background:{abilityMode:'2+1',equipment:'A',plusOnes:[]},feats:{},
 equipment:{armor:null,shield:false,weapon:null},spells:{cantrips:[],leveled:[]}},
 updatedAt:'2026-11-10T12:00:00Z'
});
const own=pc('etapa6-own','Ficha própria de auditoria'),other=pc('etapa6-shared','Ficha compartilhada de auditoria');
const camp={id:'etapa6-campaign',name:'Campanha de auditoria',status:'active',members:[
 {id:'m1',username:'bruno',role:'player',characterId:own.id,active:true},
 {id:'m2',username:'outro',role:'player',characterId:other.id,active:true}
],sessions:[]};
const membership={campaignId:camp.id,uid:'etapa6-player',username:'bruno',role:'player',characterId:own.id,active:true};
const cache={schema:'hub-rpg/collaboration-cache/v1',campaigns:{
 [camp.id]:{membership,payload:{campaign:camp,participants:[],revealedAdventures:[]},
 characters:[own,other],characterIds:[own.id,other.id]}
}};
test.beforeEach(async ({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
});
async function start(page,role){
 await page.addInitScript(({role,own,other,membership,cache})=>{
  const session=role==='Mestre'
    ?{uid:'etapa6-master',username:'mestre',isMaster:true,memberships:[]}
    :{uid:'etapa6-player',username:'bruno',isMaster:false,memberships:[membership]};
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(session));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(role==='Mestre'?[own,other]:[own]));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify(cache));
 },{role,own,other,membership,cache});
}
async function shell(page,path,theme){
 await page.goto(path,{waitUntil:'domcontentloaded'});
 await expect(page.locator('.hub-app-shell')).toBeVisible({timeout:25000});
 await page.addStyleTag({url:'/site-light.css?v=etapa6-visual'});
 await expect(page.locator('body')).toHaveClass(theme==='library'?/hub-content-library/:/hub-content-light/);
 const metrics=await page.evaluate(()=>{
  const content=document.querySelector('.hub-app-content');
  return {background:getComputedStyle(content).backgroundColor,
   overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
 });
 expect(metrics.overflow,path+' não deve estourar horizontalmente').toBeLessThanOrEqual(3);
 expect(metrics.background).toBe(theme==='library'?'rgb(8, 13, 20)':'rgb(244, 247, 251)');
}
for(const role of ['Mestre','Jogador']){
 test(role+': 18 módulos da Biblioteca, shell, leitura, largura e rotas',async ({page},testInfo)=>{
  test.setTimeout(180_000);
  await start(page,role);
  await shell(page,'/bibliotecas.html','library');
  const links=await page.locator('.modulos > li > a').evaluateAll(anchors=>
   anchors.map(a=>new URL(a.href).pathname.split('/').pop()));
  expect(links).toEqual(modules);
  await page.screenshot({path:testInfo.outputPath(role+'-biblioteca.png'),animations:'disabled'});
  for(const path of modules){
   await test.step(path,async()=>{
    await shell(page,'/'+path,'library');
    await expect(page.locator('.hub-global-topbar')).toBeVisible();
    await expect(page.locator('.hub-sidebar')).toHaveCount(1);
    await expect(page.locator('body')).not.toHaveClass(/hub-content-light/);
   });
  }
 });

 test(role+': criação, ficha, campos e alvos de toque acessíveis',async ({page},testInfo)=>{
  test.setTimeout(120_000);
  await start(page,role);
  await shell(page,'/criacao-personagem.html','reader');
  await expect(page.locator('#builder')).toBeVisible({timeout:35000});
  await expect(page.locator('#wizard-nav button')).toHaveCount(7);
  await page.screenshot({path:testInfo.outputPath(role+'-criacao.png'),animations:'disabled'});
  await shell(page,'/ficha-personagem.html?id=etapa6-own','reader');
  await expect(page.locator('#sheet')).toBeVisible({timeout:45000});
  await expect(page.locator('#pc-name')).toHaveText('Ficha própria de auditoria');
  await expect(page.locator('#save-sheet')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath(role+'-ficha.png'),animations:'disabled'});
  // Os seletores reais são preservados. A simulação temporária testa só a geometria
  // de um botão de espaço de magia, sem lançar magia nem alterar dados do personagem.
  const sizes=await page.evaluate(()=>{
   const link=document.querySelector('#sheet .section-nav a');
   const mock=document.createElement('div');mock.className='slot';
   mock.innerHTML='<button type="button" aria-label="Ajustar espaço de magia">−</button>';
   document.querySelector('#sheet').appendChild(mock);
   const box=mock.querySelector('button').getBoundingClientRect();
   const nav=link.getBoundingClientRect();
   mock.remove();
   return {navHeight:nav.height,slotWidth:box.width,slotHeight:box.height};
  });
  expect(sizes.navHeight,'aba de navegação: mínimo de 44 px').toBeGreaterThanOrEqual(44);
  expect(sizes.slotWidth,'controle de magia: largura mínima de 44 px').toBeGreaterThanOrEqual(44);
  expect(sizes.slotHeight,'controle de magia: altura mínima de 44 px').toBeGreaterThanOrEqual(44);
  if(role==='Jogador'){
   await shell(page,'/ficha-personagem.html?id=etapa6-shared','reader');
   await expect(page.locator('#sheet')).toBeVisible({timeout:45000});
   await expect(page.locator('#sheet')).toHaveAttribute('data-read-only','true');
   await expect(page.locator('#save-sheet')).toBeHidden();
  }else{
   // Formulários administrativos: apenas constatação visual, nunca submissão.
   await page.goto('/configuracoes.html');
   await expect(page.locator('.hub-app-shell')).toBeVisible();
   await expect(page.locator('.settings-fields select').first()).toBeVisible();
   const width=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
   expect(width).toBeLessThanOrEqual(3);
   await page.screenshot({path:testInfo.outputPath('Mestre-configuracoes.png'),animations:'disabled'});
   await page.goto('/nova-campanha.html');
   await expect(page.locator('.hub-app-shell')).toBeVisible();
   await expect(page.locator('form')).toHaveCount(1);
  }
 });
}
