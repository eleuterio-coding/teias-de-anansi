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
 await expect(page.locator('#exploracao > .explore-title h2')).toHaveText('Locais');
 await expect(page.locator('#mapas > .explore-title h2')).toHaveText('Mapas');
 await expect(page.locator('.hub-detail-grid > #exploracao')).toHaveCount(1);
 await expect(page.locator('.hub-detail-grid > #mapas')).toHaveCount(1);
 await expect(page.locator('#exploracao #ex-new-level')).toHaveCount(0);
 await expect(page.locator('#mapas #ex-new-level')).toHaveCount(0);
 await expect(page.locator('#mapas #ex-new-area')).toHaveCount(0);
 await expect(page.locator('.hub-detail-grid > #criar-area')).toHaveCount(1);
 await expect(page.locator('.hub-detail-grid > #criar-mapa')).toHaveCount(1);
 await expect(page.locator('.section-nav a[href="#exploracao"]')).toHaveText('Locais');
 await expect(page.locator('.section-nav a[href="#mapas"]')).toHaveText('Mapas');
 await expect(page.locator('#criar-area > h2')).toHaveText('Adicionar local');
 await expect(page.locator('#criar-area #ex-new-area')).toHaveCount(1);
 await expect(page.locator('#criar-mapa > h2')).toHaveText('Adicionar mapa');
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
 await expect(page.locator('#mapas .explore-editor-group')).toHaveCount(3);
 await expect(page.locator('#mapas .explore-editor-group h4')).toHaveText(['Dados do mapa','Descrição e acesso','Imagem do mapa']);
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
 await expect(editor).not.toHaveAttribute('open','');
 await expect(page.locator('#exploracao [data-ex-field="name"]')).toBeHidden();
 const square=await page.locator('#exploracao .explore-area-card').evaluate(card=>{
  const box=card.getBoundingClientRect();
  return {width:box.width,height:box.height};
 });
 expect(Math.abs(square.width-square.height),'O card de Local recolhido deve ser quadrado').toBeLessThanOrEqual(3);
 await expect(page.locator('#exploracao [data-ex-area-visibility]')).toBeVisible();
 await editor.locator('summary').click();
 await expect(editor).toHaveAttribute('open','');
 await expect(page.locator('#exploracao [data-ex-field="name"]')).toBeVisible();
 await expect(page.locator('#exploracao .explore-editor-group')).toHaveCount(3);
 await expect(page.locator('#exploracao .explore-editor-group h4')).toHaveText(['Identificação','Desafios e recompensas','Narrativa e notas']);
 await expect(page.locator('#exploracao .explore-record-status')).toHaveText('Descoberta');
 await expect(page.locator('#mapas .explore-record-summary')).toContainText('1 área vinculada');
 const areaFields=['code','name','status','levelId','type','xp','enemies','hazards','treasure','checks','readAloud','description','dmNotes'];
 for(const field of areaFields)await expect(editor.locator('[data-ex-field="'+field+'"]')).toHaveCount(1);
 const removed=['parentId','locationId','chapterId','order','mapX','mapY','features','outcomes','publicDescription'];
 for(const field of removed)await expect(editor.locator('[data-ex-field="'+field+'"]')).toHaveCount(0);
 await expect(editor.locator('.explore-reference, [data-ex-ref], .explore-reference-grid')).toHaveCount(0);
 await expect(editor.locator('[data-ex-publish]')).toHaveCount(0);
 const visibility=page.locator('#exploracao [data-ex-area-visibility]');
 await expect(visibility).toBeVisible();
 // A opção é independente do editor, inclusive quando os campos estão recolhidos.
 await page.locator('#exploracao [data-ex-close-record="area"]').click();
 await expect(editor).not.toHaveAttribute('open','');
 await expect(visibility).toBeVisible();
 await visibility.check();
 await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))[0].exploration.areas[0].visibleToPlayers)).toBe(true);
 await expect(editor).not.toHaveAttribute('open','');
 // Valores legados ainda existem no armazenamento, mas ficam fora da interface.
 await page.evaluate(()=>{
  const key='hub-rpg:adventures:v1',rows=JSON.parse(localStorage.getItem(key));
  Object.assign(rows[0].exploration.areas[0],{mapX:45.5,mapY:72,order:7,features:'Três portas.',outcomes:'Uma pista é revelada.',publicDescription:'Uma torre antiga.'});
  localStorage.setItem(key,JSON.stringify(rows));
 });
 await page.reload();
 await expect(page.locator('#exploracao [data-ex-area-visibility]')).toBeChecked();
 await expect(page.locator('#exploracao [data-ex-area-editor]')).not.toHaveAttribute('open','');
 await page.locator('#exploracao [data-ex-area-editor] summary').click();
 await expect(page.locator('#exploracao [data-ex-field="name"]')).toBeVisible();
 await editor.locator('[data-ex-field="name"]').fill('Salão de entrada');
 await editor.locator('[data-ex-field="enemies"]').fill('Dois goblins');
 await editor.locator('[data-ex-field="hazards"]').fill('Armadilha de dardos');
 await editor.locator('[data-ex-field="treasure"]').fill('20 moedas de ouro');
 await editor.locator('[data-ex-field="checks"]').fill('Percepção CD 13');
 await editor.locator('[data-ex-field="readAloud"]').fill('Uma porta range.');
 await editor.locator('[data-ex-field="description"]').fill('Entrada da fortaleza');
 await editor.locator('[data-ex-field="dmNotes"]').fill('Armadilha secreta.');
 await editor.locator('[data-ex-field="xp"]').fill('150');
 await editor.locator('[data-ex-field="status"]').selectOption('visited');
 await editor.locator('[data-ex-save-area]').click();
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))[0]);
 expect(state.exploration.levels[0]).toMatchObject({name:'Primeiro andar',type:'Masmorra',mapUrl:'https://example.org/primeiro-andar.png',notes:'Mapa de uso privado.',order:2,visibleToPlayers:true});
 expect(state.exploration.areas[0]).toMatchObject({code:'A01',name:'Salão de entrada',type:'Sala',status:'visited',xp:150,mapX:45.5,mapY:72,order:7,features:'Três portas.',outcomes:'Uma pista é revelada.',publicDescription:'Uma torre antiga.',enemies:'Dois goblins',treasure:'20 moedas de ouro',hazards:'Armadilha de dardos',visibleToPlayers:true,dmNotes:'Armadilha secreta.'});
 expect(state.exploration.history).toHaveLength(1);
 await expect(page.locator('#exploracao .explore-record-status')).toHaveText('Visitada');
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
 await expect(page.locator('#exploracao [data-ex-area-visibility]')).toBeChecked();
 await expect(page.locator('#exploracao [data-ex-field="mapX"]')).toHaveCount(0);
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
