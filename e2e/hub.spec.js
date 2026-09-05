import{test,expect}from'@playwright/test';

const pages=[
 ['/', 'Teias de Anansi'],
 ['/personagens.html','Personagens'],
 ['/campanhas.html','Campanhas / Mesas'],
 ['/dados.html','Dados e Backup'],
 ['/painel.html','Painel Geral'],
 ['/configuracoes.html','Configurações']
];

async function resetStorage(page){
 await page.goto('/index.html');
 await page.evaluate(()=>localStorage.clear());
}

async function portableSeed(page){
 const character={id:'pc-e2e',name:'Anansi E2E',ruleset:'5.5e',refs:{class:null,species:null,background:null,subclass:null},refSnapshots:{},baseAbilities:{'Força':10,'Destreza':10,'Constituição':10,'Inteligência':10,'Sabedoria':10,'Carisma':10},choices:{class:{level:1,skills:[],equipment:'A'},species:{size:null,lineage:null},background:{abilityMode:'2+1',plus2:null,plus1:null,plusOnes:[],equipment:'A',toolChoice:''},feats:{},equipment:{armor:null,shield:false,weapon:null},spells:{cantrips:[],leveled:[],arcanum:{},progression:null}},updatedAt:'2026-09-05T12:00:00.000Z'};
 const campaign={schema:'hub-rpg/campaign/v1',id:'cmp-e2e',name:'Mesa E2E',status:'active',system:'D&D 5.5e',setting:'Eberron',description:'Homologação',dmName:'Mestre E2E',members:[],sessions:[],createdAt:'2026-09-05T12:00:00.000Z',updatedAt:'2026-09-05T12:00:00.000Z'};
 const adventure={schema:'hub-rpg/adventure/v1',id:'adv-e2e',campaignId:'cmp-e2e',title:'Aventura E2E',status:'planned',chapters:[],scenes:[],locations:[],npcs:[],clues:[],handouts:[],treasures:[],createdAt:'2026-09-05T12:00:00.000Z',updatedAt:'2026-09-05T12:00:00.000Z'};
 await page.evaluate(({character,campaign,adventure})=>{
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify([character]));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([adventure]));
 },{character,campaign,adventure});
}

test.beforeEach(async({page})=>{await resetStorage(page)});

test('superfícies principais carregam sem overflow horizontal',async({page})=>{
 for(const[url,title]of pages){
  const errors=[];
  const onError=error=>errors.push(error.message);
  page.on('pageerror',onError);
  await page.goto(url);
  await expect(page.getByRole('heading',{name:title,exact:false}).first()).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,`${url} não deve criar rolagem horizontal involuntária`).toBeLessThanOrEqual(2);
  expect(errors,`${url} não deve lançar erro JavaScript`).toEqual([]);
  page.off('pageerror',onError);
 }
});

test('Configurações persistem e preferências visuais são aplicadas',async({page})=>{
 await page.goto('/configuracoes.html');
 await page.selectOption('#workspace','mestre');
 await page.selectOption('#sheet-density','compact');
 await page.selectOption('#font-scale','large');
 await page.selectOption('#contrast','high');
 await page.selectOption('#motion','reduce');
 await page.fill('#default-dm','Mestre E2E');
 await page.fill('#default-setting','Eberron');
 await page.fill('#default-system','D&D 5.5e');
 await page.click('#save-settings');
 await expect(page.locator('#settings-status')).toContainText('Configurações salvas');
 await expect(page.locator('html')).toHaveAttribute('data-hub-font-scale','large');
 await expect(page.locator('html')).toHaveAttribute('data-hub-contrast','high');
 await page.reload();
 await expect(page.locator('#workspace')).toHaveValue('mestre');
 await expect(page.locator('#sheet-density')).toHaveValue('compact');
 await expect(page.locator('#default-dm')).toHaveValue('Mestre E2E');
 await expect(page.locator('html')).toHaveAttribute('data-hub-motion','reduce');
});

test('Nova Mesa consome defaults sem persistir preset fictício',async({page})=>{
 await page.goto('/configuracoes.html');
 await page.fill('#default-dm','Mestre E2E');
 await page.fill('#default-setting','Planescape');
 await page.fill('#default-system','D&D 5.5e');
 await page.selectOption('#house-preset','teias-v1');
 await page.click('#save-settings');
 await page.goto('/campanhas.html');
 await expect(page.locator('#campaign-dm')).toHaveValue('Mestre E2E');
 await expect(page.locator('#campaign-setting')).toHaveValue('Planescape');
 await page.fill('#campaign-name','Mesa de Homologação');
 await Promise.all([
  page.waitForURL(/mesa\.html\?id=/),
  page.click('#create-campaign')
 ]);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]'));
 expect(stored).toHaveLength(1);
 expect(stored[0]).toMatchObject({name:'Mesa de Homologação',dmName:'Mestre E2E',setting:'Planescape',system:'D&D 5.5e'});
 expect(Object.prototype.hasOwnProperty.call(stored[0],'houseRules')).toBe(false);
 expect(Object.prototype.hasOwnProperty.call(stored[0],'housePreset')).toBe(false);
});

test('backup completo sobrevive a apagar estado e restaurar arquivo',async({page})=>{
 await portableSeed(page);
 await page.goto('/dados.html');
 await expect(page.locator('#portable-metrics')).toContainText('1');
 const downloadPromise=page.waitForEvent('download');
 await page.click('#export-backup');
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toMatch(/^teias-de-anansi-backup-.*\.json$/);
 const path=await download.path();
 expect(path).toBeTruthy();
 await page.evaluate(()=>{
  localStorage.removeItem('hub-rpg:characters:v4');
  localStorage.removeItem('hub-rpg:campaigns:v1');
  localStorage.removeItem('hub-rpg:adventures:v1');
 });
 await page.reload();
 await expect(page.locator('#portable-metrics')).toContainText('0');
 await page.setInputFiles('#backup-file',path);
 await expect(page.locator('#backup-preview')).toContainText('Backup válido');
 await page.selectOption('#restore-mode','replace');
 await page.fill('#replace-confirm-text','SUBSTITUIR');
 await page.click('#restore-backup');
 await expect(page.locator('#backup-feedback')).toContainText('Restauração concluída');
 const restored=await page.evaluate(()=>({
  characters:JSON.parse(localStorage.getItem('hub-rpg:characters:v4')||'[]'),
  campaigns:JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]'),
  adventures:JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')||'[]')
 }));
 expect(restored.characters[0].name).toBe('Anansi E2E');
 expect(restored.campaigns[0].name).toBe('Mesa E2E');
 expect(restored.adventures[0].campaignId).toBe('cmp-e2e');
});

test('Usuários mantém acesso fechado quando Firebase está indisponível',async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})}));
 await page.goto('/usuarios.html');
 await expect(page.getByRole('heading',{name:/Usuários e Colaboração/i})).toBeVisible();
 await expect(page.locator('#provider-status')).toContainText('ainda não está conectado ao Firebase real');
 await expect(page.locator('#login-form')).toBeHidden();
});
