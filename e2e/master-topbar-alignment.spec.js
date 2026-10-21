import{test,expect}from'@playwright/test';
const session={uid:'e2e-master-alignment',username:'rafael',isMaster:true,memberships:[]};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(session=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify(session));
 },session);
});

async function inspectAlignment(page,{expectLabels}){
 const root=page.locator('[data-hub-master-tools]');
 await expect(root).toBeVisible();
 const user=page.locator('[data-hub-preview-user]');
 const layout=page.locator('[data-hub-layout-select]');
 await expect(user).toBeVisible();
 await expect(layout).toHaveCount(0);
 await expect(user).toHaveValue('');

 const actual=await root.evaluate(root=>{
  const rect=node=>{const r=node.getBoundingClientRect();return{top:r.top,bottom:r.bottom,center:r.top+r.height/2,height:r.height,width:r.width}};
  const visible=node=>{const s=getComputedStyle(node);return s.display!=='none'&&s.visibility!=='hidden'};
  const title=root.querySelector('.hub-master-tools-title');
  const controls=[...root.querySelectorAll('.hub-master-control')];
  const labels=controls.map(el=>el.querySelector('span'));
  return{
   title:rect(title),titleVisible:visible(title),
   controls:controls.map(rect),selectors:controls.map(el=>rect(el.querySelector('select'))),
   labels:labels.map(rect),labelsVisible:labels.map(visible),
   toolCenter:rect(root).center,
   viewport:document.documentElement.clientWidth,
   scrollWidth:document.documentElement.scrollWidth
  }
 });
 expect(actual.selectors).toHaveLength(1);


 for(const r of actual.controls)expect(Math.abs(r.center-actual.selectors[0].center)).toBeLessThanOrEqual(1);
 for(const r of actual.selectors)expect(r.height).toBeGreaterThanOrEqual(35);
 if(expectLabels){
  expect(actual.titleVisible).toBe(true);
  expect(actual.labelsVisible).toEqual([true]);
  expect(Math.abs(actual.title.center-actual.selectors[0].center)).toBeLessThanOrEqual(1);
  for(const r of actual.labels)expect(Math.abs(r.center-actual.selectors[0].center)).toBeLessThanOrEqual(1);
 }else{
  expect(actual.titleVisible).toBe(false);
  expect(actual.labelsVisible).toEqual([false]);
 }
 expect(actual.scrollWidth).toBeLessThanOrEqual(actual.viewport+2);
}
test('Mestre e seletor de Usuário ficam alinhados no topo sem Layout',async({page})=>{
 await page.goto('/painel.html');
 await inspectAlignment(page,{expectLabels:await page.evaluate(()=>document.documentElement.clientWidth>760)});
});
test('alinhamento persiste na Campanha e após mudar largura',async({page})=>{
 await page.goto('/campanhas.html');
 for(const width of [1440,1024,760,390]){
  await page.setViewportSize({width,height:850});
  await inspectAlignment(page,{expectLabels:width>760});
 }
});
test('seletor de Usuário permanece acessível sem Layout',async({page})=>{
 await page.goto('/painel.html');
 await expect(page.locator('[data-hub-preview-user] option[value=""]')).toHaveText('Mestre');
 await expect(page.locator('[data-hub-layout-select]')).toHaveCount(0);


});
