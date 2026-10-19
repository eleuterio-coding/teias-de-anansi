import{test,expect}from'@playwright/test';

const session={uid:'e2e-master',username:'mestre',isMaster:true,memberships:[]};
const campaign={
 id:'e2e-no-glossary',name:'Dragão e magia',status:'current',
 description:'Dragão, monstros, regras e magia',members:[],sessions:[],
 timeline:'Dragão descobre uma magia'
};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(data.session));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
 },{session,campaign});
});
for(const path of [
 '/campanhas.html',
 '/nova-campanha.html',
 '/mesa.html?id=e2e-no-glossary'
]){
 test(`Campanhas: termos de verbete não viram links em ${path}`,async({page})=>{
  let referenceIndexFetches=0;
  await page.route('**/dados/referencias-hub-index.json*',route=>{
   referenceIndexFetches++;
   return route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({
     schema:'hub-rpg.referencias.v3',
     total_entidades:1,modulos:{},aliases_resolvidos:[],
     entidades:[{id:'dragao',nome:'Dragão',aliases:['dragão'],
       status:'publicado',modulo:'Monstros',url:'referencia.html'}]
    })
   });
  });
  await page.goto(path);
  const main=page.locator('main').first();
  await expect(main).toBeVisible();
  if(path.startsWith('/mesa'))await expect(page.locator('#jogadores')).toBeVisible();
  const probe=page.locator('#glossary-probe');
  await main.evaluate((mainEl)=>{
   const p=document.createElement('p');
   p.id='glossary-probe';
   p.innerHTML='Dragão, magia e regras: <a class="hub-ref" href="referencia.html?id=dragao" data-ref-id="dragao">Dragão</a>; <a data-ref-id="termo" href="referencia.html?id=termo">termo</a>; <a href="referencia.html?id=magia">magia</a>; <a class="btn" href="sessoes.html?campaign=e2e-no-glossary">Abrir sessão</a>.';
   mainEl.appendChild(p);
  });
  await expect(probe.locator('a.hub-ref,a[data-ref-id],a[href^="referencia.html?id="]')).toHaveCount(0);
  await expect(probe).toContainText('Dragão, magia e regras');
  await expect(probe.getByRole('link',{name:'Abrir sessão'})).toHaveAttribute('href','sessoes.html?campaign=e2e-no-glossary');
  // Mesmo que o módulo semântico seja carregado por um script antigo,
  // ele deve ignorar por completo páginas de Campanhas.
  await page.addScriptTag({url:'/scripts/referencias-hub.js?v=test-campaign-exclude'});
  await page.waitForTimeout(250);
  expect(referenceIndexFetches).toBe(0);
  await expect(probe.locator('a.hub-ref')).toHaveCount(0);
 });
}
test('A proteção não interfere nos links de verbete da Biblioteca',async({page})=>{
 await page.goto('/bibliotecas.html');
 const main=page.locator('main').first();
 await expect(main).toBeVisible();
 await main.evaluate(el=>{
  const a=document.createElement('a');
  a.className='hub-ref';
  a.href='referencia.html?id=dragao';
  a.textContent='Dragão';
  a.id='library-reference-probe';
  el.appendChild(a);
 });
 await expect(page.locator('#library-reference-probe')).toHaveAttribute('href','referencia.html?id=dragao');
});
