import{test,expect}from'@playwright/test';

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(()=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'test-master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([{id:'cmp-explore',name:'Mesa de teste',dmName:'Rafael',sessions:[],members:[],npcs:[],locations:[]}]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([{id:'adv-explore',campaignId:'cmp-explore',title:'Aventura para testar exploração',status:'planned',chapters:[],scenes:[]}]));
 });
});

test('cadastro enxuto de mapa e área, XP/status persistidos e cards preservados',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/aventuras.html?campaign=cmp-explore&id=adv-explore');
 await expect(page.locator('#exploracao > .explore-title h2')).toHaveText('Áreas e Salas');
 await expect(page.locator('#mapas > .explore-title h2')).toHaveText('Mapas e Níveis');
 await expect(page.locator('.hub-detail-grid > #exploracao')).toHaveCount(1);
 await expect(page.locator('.hub-detail-grid > #mapas')).toHaveCount(1);
 await expect(page.locator('#exploracao #ex-new-level')).toHaveCount(0);
 await expect(page.locator('#mapas #ex-new-area')).toHaveCount(0);
 await expect(page.locator('.section-nav a[href="#exploracao"]')).toHaveText('Áreas e Salas');
 await expect(page.locator('.section-nav a[href="#mapas"]')).toHaveText('Mapas e Níveis');
 await expect(page.locator('#ex-create-area summary')).toHaveText('Adicionar área / sala');
 await expect(page.locator('#mapas #ex-level-manager summary')).toHaveText('Adicionar mapa / nível');
 await expect(page.locator('#ex-new-area :is(input,select)')).toHaveCount(4);
 await expect(page.locator('#ex-new-level :is(input,textarea)')).toHaveCount(5);
 await page.locator('#ex-new-level input[name="name"]').fill('Primeiro andar');
 await page.locator('#ex-new-level input[name="type"]').fill('Masmorra');
 await page.locator('#ex-new-level input[name="mapUrl"]').fill('https://example.org/primeiro-andar.png');
 await page.locator('#ex-new-level textarea[name="description"]').fill('Primeiro nível da masmorra.');
 await page.locator('#ex-new-level button[type="submit"]').click();
 await expect(page.locator('.explore-level-card')).toHaveCount(1);
 await expect(page.locator('.explore-level-card .explore-map-upload [data-image-picker]')).toHaveCount(1);
 await page.locator('#ex-new-area input[name="code"]').fill('A01');
 await page.locator('#ex-new-area select[name="status"]').selectOption('discovered');
 await page.locator('#ex-new-area select[name="levelId"]').selectOption({label:'Primeiro andar'});
 await page.locator('#ex-new-area input[name="type"]').fill('Sala');
 await page.locator('#ex-new-area button[type="submit"]').click();
 await expect(page.locator('#exploracao .explore-area-card')).toHaveCount(1);
 await expect(page.locator('#explore-area-detail h3')).toHaveText('Área selecionada');
 await expect(page.locator('#explore-area-detail [data-ex-field]')).toHaveCount(8);
 await expect(page.locator('#explore-area-detail [data-ex-field="type"]')).toHaveValue('Sala');
 await page.locator('#explore-area-detail [data-ex-field="enemies"]').fill('Dois goblins');
 await page.locator('#explore-area-detail [data-ex-field="hazards"]').fill('Armadilha de dardos');
 await page.locator('#explore-area-detail [data-ex-field="treasure"]').fill('20 moedas de ouro');
 await page.locator('#explore-area-detail [data-ex-field="checks"]').fill('Percepção CD 13');
 await page.locator('#explore-area-detail [data-ex-field="readAloud"]').fill('Uma porta range.');
 await page.locator('#explore-area-detail [data-ex-field="description"]').fill('Entrada da fortaleza');
 await page.locator('#explore-area-detail [data-ex-field="xp"]').fill('150');
 await page.locator('[data-ex-save-area]').click();
 await page.locator('[data-ex-quick-status]').selectOption('visited');
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))[0]);
 expect(state.exploration.levels[0]).toMatchObject({name:'Primeiro andar',type:'Masmorra',mapUrl:'https://example.org/primeiro-andar.png',description:'Primeiro nível da masmorra.'});
 expect(state.exploration.areas[0]).toMatchObject({code:'A01',name:'A01',type:'Sala',status:'visited',xp:150,enemies:'Dois goblins',treasure:'20 moedas de ouro',hazards:'Armadilha de dardos'});
 expect(state.exploration.history).toHaveLength(1);
 expect(state.scenes).toHaveLength(0);
 await page.reload();
 await expect(page.locator('#exploracao .explore-area-card')).toContainText('A01');
 await expect(page.locator('#explore-area-detail [data-ex-field="xp"]')).toHaveValue('150');
 expect(errors).toEqual([]);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 expect(overflow,'A exploração não pode criar overflow horizontal').toBeLessThanOrEqual(3);
});

test('Facções é um card separado, com edição própria, ao lado de NPCs',async({page},testInfo)=>{
 await page.goto('/aventuras.html?campaign=cmp-explore&id=adv-explore');
 await expect(page.locator('#faccoes > h2')).toHaveText('Facções');
 await expect(page.locator('#exploracao #faccoes')).toHaveCount(0);
 await expect(page.locator('.section-nav a[href="#faccoes"]')).toHaveCount(1);
 await page.locator('#ex-new-faction input[name="name"]').fill('Guarda da Ponte');
 await page.locator('#ex-new-faction button[type="submit"]').click();
 await expect(page.locator('#faccoes [data-ex-faction]')).toHaveCount(1);
 await expect(page.locator('#faccoes [data-ex-field="name"]')).toHaveValue('Guarda da Ponte');
 await page.locator('#faccoes [data-ex-field="description"]').fill('Protegem a ponte.');
 await page.locator('#faccoes [data-ex-save-faction]').click();
 await expect(page.locator('#faccoes')).toContainText('Guarda da Ponte');
 if(testInfo.project.name==='desktop-chromium'){
  const positions=await page.locator('#npcs, #faccoes').evaluateAll(elements=>elements.map(el=>{
   const rect=el.getBoundingClientRect();return {left:rect.left,top:rect.top,width:rect.width};
  }));
  expect(positions).toHaveLength(2);
  expect(Math.abs(positions[0].top-positions[1].top)).toBeLessThan(5);
  expect(positions[1].left).toBeGreaterThan(positions[0].left);
 }
});
