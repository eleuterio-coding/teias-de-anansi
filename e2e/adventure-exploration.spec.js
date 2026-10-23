import{test,expect}from'@playwright/test';

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(()=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'test-master',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([{id:'cmp-explore',name:'Mesa de teste',dmName:'Rafael',sessions:[],members:[],npcs:[],locations:[]}]));
  if(!localStorage.getItem('hub-rpg:adventures:v1'))localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([{id:'adv-explore',campaignId:'cmp-explore',title:'Aventura para testar exploração',status:'planned',chapters:[],scenes:[]}]));
 });
});

test('cadastro em cards separados de mapa e área, XP/status persistidos',async({page},testInfo)=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/aventuras.html?campaign=cmp-explore&id=adv-explore');
 await expect(page.locator('#exploracao > .explore-title h2')).toHaveText('Áreas e Salas');
 await expect(page.locator('#mapas > .explore-title h2')).toHaveText('Mapas e Níveis');
 await expect(page.locator('.hub-detail-grid > #exploracao')).toHaveCount(1);
 await expect(page.locator('.hub-detail-grid > #mapas')).toHaveCount(1);
 await expect(page.locator('#exploracao #ex-new-level')).toHaveCount(0);
 await expect(page.locator('#mapas #ex-new-level')).toHaveCount(0);
 await expect(page.locator('#mapas #ex-new-area')).toHaveCount(0);
 await expect(page.locator('.hub-detail-grid > #criar-area')).toHaveCount(1);
 await expect(page.locator('.hub-detail-grid > #criar-mapa')).toHaveCount(1);
 await expect(page.locator('.section-nav a[href="#exploracao"]')).toHaveText('Áreas e Salas');
 await expect(page.locator('.section-nav a[href="#mapas"]')).toHaveText('Mapas e Níveis');
 await expect(page.locator('#criar-area > h2')).toHaveText('Adicionar área / sala');
 await expect(page.locator('#criar-area #ex-new-area')).toHaveCount(1);
 await expect(page.locator('#criar-mapa > h2')).toHaveText('Adicionar mapa / nível');
 await expect(page.locator('#criar-mapa #ex-new-level')).toHaveCount(1);
 await expect(page.locator('#ex-new-area :is(input,select)')).toHaveCount(4);
 await expect(page.locator('.section-nav a[href="#criar-area"]')).toHaveText('Adicionar área');
 await expect(page.locator('.section-nav a[href="#criar-mapa"]')).toHaveText('Adicionar mapa');
 for(const id of ['#capitulos','#locais','#tesouros'])await expect(page.locator('.hub-detail-grid > '+id)).toHaveCount(0);
 await expect(page.locator('#ex-new-level :is(input,textarea)')).toHaveCount(5);
 if(testInfo.project.name==='desktop-chromium'){
  const positions=await page.locator('#criar-area,#criar-mapa').evaluateAll(elements=>elements.map(el=>{
   const rect=el.getBoundingClientRect();return {left:rect.left,top:rect.top,width:rect.width};
  }));
  expect(positions).toHaveLength(2);
  expect(Math.abs(positions[0].top-positions[1].top)).toBeLessThan(5);
  expect(positions[1].left).toBeGreaterThan(positions[0].left+positions[0].width);
 }
 await page.locator('#ex-new-level input[name="name"]').fill('Primeiro andar');
 await page.locator('#ex-new-level input[name="type"]').fill('Masmorra');
 await page.locator('#ex-new-level input[name="mapUrl"]').fill('https://example.org/primeiro-andar.png');
 await page.locator('#ex-new-level textarea[name="description"]').fill('Primeiro nível da masmorra.');
 await page.locator('#ex-new-level button[type="submit"]').click();
 await expect(page.locator('.explore-level-card')).toHaveCount(1);
 await expect(page.locator('#mapas [data-ex-level-editor][open]')).toHaveCount(1);
 await expect(page.locator('#mapas [data-ex-level-editor] [data-ex-field="name"]')).toHaveValue('Primeiro andar');
 await expect(page.locator('.explore-level-card .explore-map-upload [data-image-picker]')).toHaveCount(1);
 await page.locator('#mapas [data-ex-field="notes"]').fill('Mapa de uso privado.');
 await page.locator('#mapas [data-ex-field="order"]').fill('2');
 await page.locator('#mapas [data-ex-publish]').check();
 await page.locator('#mapas [data-ex-save-level]').click();
 await expect.poll(async()=> page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))[0].exploration.levels[0].notes)).toBe('Mapa de uso privado.');
 await page.locator('#mapas [data-ex-close-record="level"]').click();
 await expect(page.locator('#mapas [data-ex-level-editor]')).not.toHaveAttribute('open','');
 await expect(page.locator('#mapas [data-ex-field="name"]')).toBeHidden();
 await page.locator('#mapas [data-ex-level-editor] summary').click();
 await expect(page.locator('#mapas [data-ex-field="notes"]')).toHaveValue('Mapa de uso privado.');
 await expect(page.locator('#mapas [data-ex-publish]')).toBeChecked();

 await page.locator('#ex-new-area input[name="code"]').fill('A01');
 await page.locator('#ex-new-area select[name="status"]').selectOption('discovered');
 await page.locator('#ex-new-area select[name="levelId"]').selectOption({label:'Primeiro andar'});
 await page.locator('#ex-new-area input[name="type"]').fill('Sala');
 await page.locator('#ex-new-area button[type="submit"]').click();
 await expect(page.locator('#exploracao .explore-area-card')).toHaveCount(1);
 const editor=page.locator('#exploracao [data-ex-area-editor]');
 await expect(editor).toHaveAttribute('open','');
 const areaFields=[
  'code','name','status','levelId','parentId','locationId','chapterId',
  'type','order','xp','mapX','mapY','enemies','hazards','treasure',
  'checks','features','outcomes','readAloud','description',
  'publicDescription','dmNotes'
 ];
 for(const field of areaFields)await expect(editor.locator('[data-ex-field="'+field+'"]')).toHaveCount(1);
 // O editor reúne também os oito grupos de vínculos entre entidades.
 await expect(editor.locator('.explore-reference')).toHaveCount(8);
 await expect(editor.locator('[data-ex-publish]')).toHaveCount(1);
 await editor.locator('[data-ex-field="name"]').fill('Salão de entrada');
 await editor.locator('[data-ex-field="enemies"]').fill('Dois goblins');
 await editor.locator('[data-ex-field="hazards"]').fill('Armadilha de dardos');
 await editor.locator('[data-ex-field="treasure"]').fill('20 moedas de ouro');
 await editor.locator('[data-ex-field="checks"]').fill('Percepção CD 13');
 await editor.locator('[data-ex-field="readAloud"]').fill('Uma porta range.');
 await editor.locator('[data-ex-field="description"]').fill('Entrada da fortaleza');
 await editor.locator('[data-ex-field="publicDescription"]').fill('Uma torre antiga.');
 await editor.locator('[data-ex-field="features"]').fill('Três portas.');
 await editor.locator('[data-ex-field="outcomes"]').fill('Uma pista é revelada.');
 await editor.locator('[data-ex-field="dmNotes"]').fill('Armadilha secreta.');
 await editor.locator('[data-ex-field="xp"]').fill('150');
 await editor.locator('[data-ex-field="mapX"]').fill('45.5');
 await editor.locator('[data-ex-field="mapY"]').fill('72');
 await editor.locator('[data-ex-field="status"]').selectOption('visited');
 await editor.locator('[data-ex-publish]').check();
 await editor.locator('[data-ex-save-area]').click();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))[0]);
 expect(state.exploration.levels[0]).toMatchObject({name:'Primeiro andar',type:'Masmorra',mapUrl:'https://example.org/primeiro-andar.png',notes:'Mapa de uso privado.',order:2,visibleToPlayers:true});
 expect(state.exploration.areas[0]).toMatchObject({code:'A01',name:'Salão de entrada',type:'Sala',status:'visited',xp:150,mapX:45.5,mapY:72,enemies:'Dois goblins',treasure:'20 moedas de ouro',hazards:'Armadilha de dardos',visibleToPlayers:true,dmNotes:'Armadilha secreta.'});
 expect(state.exploration.history).toHaveLength(1);
 expect(state.scenes).toHaveLength(0);
 await page.locator('#exploracao [data-ex-close-record="area"]').click();
 await expect(page.locator('#exploracao [data-ex-area-editor]')).not.toHaveAttribute('open','');
 await expect(page.locator('#exploracao [data-ex-field="name"]')).toBeHidden();
 await page.locator('#exploracao [data-ex-area-editor] summary').click();
 await expect(page.locator('#exploracao [data-ex-field="dmNotes"]')).toHaveValue('Armadilha secreta.');
 await expect(page.locator('#exploracao [data-ex-field="name"]')).toHaveValue('Salão de entrada');
 await page.reload();
 await expect(page.locator('#exploracao .explore-area-card')).toContainText('Salão de entrada');
 await page.locator('#exploracao [data-ex-area-editor] summary').click();
 await expect(page.locator('#exploracao [data-ex-field="xp"]')).toHaveValue('150');
 await expect(page.locator('#exploracao [data-ex-field="mapX"]')).toHaveValue('45.5');
 await page.locator('#mapas [data-ex-level-editor] summary').click();
 await expect(page.locator('#mapas [data-ex-field="notes"]')).toHaveValue('Mapa de uso privado.');
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
