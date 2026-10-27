import {test,expect} from '@playwright/test';

const campaign={id:'layout-parity-c',name:'Reinos de Prata',status:'active',members:[],npcs:[],locations:[],
 sessions:[{id:'layout-parity-s',number:3,order:3,title:'Batalhas dos Campos Carmesim',status:'current',adventureId:'layout-parity-a1',scenes:[],encounters:[]}]};
const adventures=[
 {id:'layout-parity-a1',campaignId:campaign.id,title:'As Labaredas',order:2,status:'active',scenes:[{id:'layout-parity-sc1',title:'Sala do conselho',order:1,areaId:'area-1'}],exploration:{levels:[{id:'map-1',name:'Palácio'}],areas:[{id:'area-1',code:'A01',name:'Sala 1',levelId:'map-1'}],factions:[{id:'fac-1',name:'Guardiões'}]},npcIds:[],missions:[{id:'objective-1',title:'Proteger o reino'}],monsters:[{id:'monster-1',name:'Ogro'}]},
 {id:'layout-parity-a2',campaignId:campaign.id,title:'A emboscada',order:3,status:'planned',scenes:[]}
];
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'layout-master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify(data.adventures));
  localStorage.setItem('hub-rpg:characters:v4','[]');
 },{campaign,adventures});
});
const near=(a,b,limit=6)=>expect(Math.abs(a-b)).toBeLessThanOrEqual(limit);
const measurement=async page=>page.evaluate(()=>{
 const highlight=document.querySelector('#proxima-sessao'),content=highlight?.querySelector('.campaign-next-content'),
  action=highlight?.querySelector('.campaign-next-action'),nav=document.querySelector('.section-nav');
 if(!highlight||!content||!action||!nav)return null;
 const box=highlight.getBoundingClientRect(),text=content.getBoundingClientRect(),btn=action.getBoundingClientRect(),menu=nav.getBoundingClientRect();
 const css=getComputedStyle(action);
 return{centering:text.top+text.height/2-box.top-box.height/2,menuDistance:menu.top-box.bottom,
  actionHeight:btn.height,actionWidth:btn.width,actionRadius:css.borderRadius,actionBackground:css.backgroundImage,
  hasIcon:!!action.querySelector('.campaign-next-action-icon svg')};
});
test('Planejamento é centralizado verticalmente em Campanha e Aventura com o mesmo botão',async({page})=>{
 await page.goto('/mesa.html?id='+campaign.id);
 await expect(page.locator('#proxima-sessao')).toContainText('Batalhas dos Campos Carmesim');
 const original=await measurement(page);expect(original).not.toBeNull();
 near(original.centering,0,7);expect(original.hasIcon).toBe(true);
 await page.goto('/aventuras.html?campaign='+campaign.id+'&id='+adventures[0].id);
 await expect(page.locator('#proxima-sessao')).toContainText('Batalhas dos Campos Carmesim');
 const transformed=await measurement(page);expect(transformed).not.toBeNull();
 near(transformed.centering,0,7);
 near(transformed.actionHeight,original.actionHeight,3);
 near(transformed.actionWidth,original.actionWidth,3);
 expect(transformed.actionRadius).toBe(original.actionRadius);
 expect(transformed.actionBackground).toBe(original.actionBackground);
 expect(transformed.hasIcon).toBe(true);
 near(transformed.menuDistance,original.menuDistance,7);
});
test('Lista usa Campanha: Nome com link, contador à direita e tile da largura dos cards',async({page})=>{
 await page.goto('/aventuras.html');
 const section=page.locator('[data-adventure-campaign-group="'+campaign.id+'"]');
 await expect(section).toBeVisible();
 await expect(section.locator('h3')).toHaveText('Campanha: '+campaign.name);
 await expect(section.locator('h3 a')).toHaveAttribute('href','mesa.html?id='+campaign.id);
 const count=section.locator('.adventure-campaign-group-count');
 await expect(count).toContainText('2');
 const [headRect,countRect,cardRect,tileRect]=await Promise.all([
  section.locator('.adventure-campaign-group-heading').boundingBox(),
  count.boundingBox(),
  section.locator('[data-adventure-card="layout-parity-a1"]').boundingBox(),
  page.locator('#open-adventure-create').boundingBox()
 ]);
 expect(headRect&&countRect&&cardRect&&tileRect).toBeTruthy();
 expect(countRect.x+countRect.width).toBeGreaterThan(headRect.x+headRect.width-28);
 near(tileRect.width,cardRect.width,9);
 await expect(section.locator('[data-adventure-card="layout-parity-a1"] .hub-parent-link')).toContainText('Campanha: As Labaredas');
});
test('Cenas compartilha o layout de Mapas e a criação exibe somente o básico',async({page})=>{
 await page.goto('/aventuras.html?campaign='+campaign.id+'&id='+adventures[0].id);
 const scene=page.locator('#cenas [data-scene-row="layout-parity-sc1"]');
 const map=page.locator('#mapas [data-ex-level="map-1"]');
 await expect(scene).toBeVisible();await expect(map).toBeVisible();
 for(const selector of ['.explore-record-card','.explore-record-editor','.explore-record-summary','.explore-record-body']){
  await expect(scene.locator(selector)).toHaveCount(selector==='.explore-record-card'?0:1);
 }
 await expect(scene).toHaveClass(/explore-record-card/);
 await expect(scene.locator('[data-adventure-grip]')).toBeVisible();
 await scene.locator('summary').click();
 await expect(scene.locator('[data-scene-field="readAloud"]')).toBeVisible();
 await expect(scene.locator('[data-scene-field="description"]')).toBeVisible();
 const create=page.locator('#criar-cena');
 await expect(create.locator('input,select')).toHaveCount(2);
 await expect(create.locator('#new-scene-title')).toBeVisible();
 await expect(create.locator('#new-scene-location')).toBeVisible();
 await create.locator('#new-scene-title').fill('O conselho se reúne');
 await create.locator('#new-scene-location').selectOption('area-1');
 await create.locator('#add-scene').click();
 await expect(page.locator('#cenas [data-scene-row]')).toHaveCount(2);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')).find(a=>a.id==='layout-parity-a1').scenes);
 expect(saved.find(s=>s.title==='O conselho se reúne')?.areaId).toBe('area-1');
});
test('Todos os cards de criação e cadastro têm largura total e títulos solicitados',async({page})=>{
 await page.goto('/aventuras.html?campaign='+campaign.id+'&id='+adventures[0].id);
 const ids=['criar-cena','criar-area','criar-mapa','npcs','faccoes','missoes','monstros'];
 const bounds=await page.evaluate(ids=>{
  const grid=document.querySelector('.hub-detail-grid').getBoundingClientRect();
  return ids.map(id=>{const element=document.getElementById(id),rect=element?.getBoundingClientRect();return{id,left:rect?.left, right:rect?.right,gridLeft:grid.left,gridRight:grid.right}});
 },ids);
 for(const b of bounds){expect(b.left, b.id).toBeDefined();near(b.left,b.gridLeft,3);near(b.right,b.gridRight,3)}
 for(const [id,title]of [['npcs','Adicionar NPC'],['faccoes','Adicionar Facções'],['missoes','Adicionar Objetivos'],['monstros','Adicionar Monstros']])await expect(page.locator('#'+id+' h2').first()).toHaveText(title);
});
