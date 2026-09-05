import{test,expect}from'@playwright/test';

const env={
 adminUsername:process.env.E2E_FIREBASE_ADMIN_USERNAME||'',
 adminPassword:process.env.E2E_FIREBASE_ADMIN_PASSWORD||'',
 playerUsername:process.env.E2E_FIREBASE_PLAYER_USERNAME||'',
 playerPassword:process.env.E2E_FIREBASE_PLAYER_PASSWORD||'',
 playerUid:process.env.E2E_FIREBASE_PLAYER_UID||''
};
const hasCredentials=Object.values(env).every(Boolean);
const CAMPAIGN_ID='__e2e_release_v1__';
const PRIVATE_MARK='E2E_PRIVATE_DO_NOT_SHARE';
const SHARED_MARK='E2E_SHARED_OK';
const CHARACTER_ID='__e2e_player_character__';

async function connect(page,username,password){
 await page.goto('/index.html');
 return page.evaluate(async({username,password})=>{
  const url=new URL('/scripts/firebase-collaboration-provider.js?v=release-v1-real-e2e',location.origin).href;
  const{createFirebaseCollaborationProvider}=await import(url);
  const provider=await createFirebaseCollaborationProvider();
  if(!provider.configured)throw new Error(`Firebase real indisponível: ${provider.reason||'configuração ausente'}`);
  const account=await provider.signInUsername({username,password});
  globalThis.__releaseV1Provider=provider;
  return{uid:account.uid,username:account.username,isAdmin:account.isAdmin};
 },{username,password})
}

async function providerCall(page,operation,args={}){
 return page.evaluate(async({operation,args})=>{
  const p=globalThis.__releaseV1Provider;
  if(!p)throw new Error('Provider E2E não inicializado.');
  if(operation==='publish')return p.saveCampaignBundle(args.campaign,args.adventures||[]);
  if(operation==='membership')return p.upsertMembership(args);
  if(operation==='bundle')return p.getCampaignBundle(args.campaignId);
  if(operation==='link')return p.linkMembershipCharacter(args.campaignId,args.characterId);
  if(operation==='memberships')return p.listMemberships();
  throw new Error(`Operação E2E desconhecida: ${operation}`)
 },{operation,args})
}

test.describe('Firebase real · gate multiusuário v1',()=>{
 test.skip(!hasCredentials,'Credenciais E2E reais não estão disponíveis. O workflow dedicado deve falhar no preflight em vez de tratar este skip como aceite.');

 test('Mestre e Jogador respeitam projeções, Rules, membership e retomada de rede',async({browser})=>{
  const adminContext=await browser.newContext();
  const playerContext=await browser.newContext();
  const adminPage=await adminContext.newPage();
  const playerPage=await playerContext.newPage();
  try{
   const admin=await connect(adminPage,env.adminUsername,env.adminPassword);
   expect(admin.isAdmin,'A conta E2E de administração precisa continuar administradora.').toBe(true);

   const now=new Date().toISOString();
   const campaign={
    schema:'hub-rpg/campaign/v1',id:CAMPAIGN_ID,name:'Mesa E2E · Release v1',status:'active',system:'D&D 5.5e',setting:'Homologação',description:'Mesa técnica reutilizável do gate de release',dmName:admin.username,
    sharedNotes:SHARED_MARK,dmNotes:PRIVATE_MARK,members:[],sessions:[],createdAt:now,updatedAt:now
   };
   const adventures=[{
    schema:'hub-rpg/adventure/v1',id:'__e2e_adventure__',campaignId:CAMPAIGN_ID,title:'Aventura E2E',status:'planned',summary:'Homologação',dmNotes:PRIVATE_MARK,
    handouts:[{id:'h-visible',title:'Visível',revealed:true,content:SHARED_MARK},{id:'h-hidden',title:'Oculto',revealed:false,content:PRIVATE_MARK}],
    clues:[{id:'c-visible',title:'Descoberta',status:'discovered',text:SHARED_MARK},{id:'c-hidden',title:'Oculta',status:'hidden',text:PRIVATE_MARK}],createdAt:now,updatedAt:now
   }];
   await providerCall(adminPage,'publish',{campaign,adventures});
   await providerCall(adminPage,'membership',{campaignId:CAMPAIGN_ID,uid:env.playerUid,role:'player'});

   const adminBundle=await providerCall(adminPage,'bundle',{campaignId:CAMPAIGN_ID});
   expect(adminBundle.mode).toBe('private');
   expect(JSON.stringify(adminBundle.payload)).toContain(PRIVATE_MARK);

   const player=await connect(playerPage,env.playerUsername,env.playerPassword);
   expect(player.uid,'E2E_FIREBASE_PLAYER_UID deve corresponder à conta de jogador usada no login.').toBe(env.playerUid);
   expect(player.isAdmin,'A segunda identidade deve provar um papel não administrativo.').toBe(false);
   const playerBundle=await providerCall(playerPage,'bundle',{campaignId:CAMPAIGN_ID});
   expect(playerBundle.mode).toBe('shared');
   const sharedJson=JSON.stringify(playerBundle.payload);
   expect(sharedJson).toContain(SHARED_MARK);
   expect(sharedJson).not.toContain(PRIVATE_MARK);
   expect(playerBundle.payload.revealedAdventures[0].handouts.map(x=>x.id)).toEqual(['h-visible']);
   expect(playerBundle.payload.revealedAdventures[0].clues.map(x=>x.id)).toEqual(['c-visible']);

   const forbidden=await playerPage.evaluate(async({campaignId})=>{
    const p=globalThis.__releaseV1Provider;
    const f=await import('https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js');
    try{
     await f.setDoc(f.doc(p.db,'campaigns',campaignId,'private','e2e-forbidden-write'),{probe:true,at:new Date().toISOString()});
     return{blocked:false,code:null,message:null}
    }catch(error){return{blocked:true,code:error?.code||null,message:error?.message||String(error)}}
   },{campaignId:CAMPAIGN_ID});
   expect(forbidden.blocked,'Jogador não pode gravar estado privado da Mesa.').toBe(true);
   expect(String(forbidden.code||forbidden.message)).toMatch(/permission-denied|missing or insufficient permissions/i);

   await providerCall(playerPage,'link',{campaignId:CAMPAIGN_ID,characterId:CHARACTER_ID});
   const memberships=await providerCall(playerPage,'memberships');
   const own=memberships.find(row=>row.campaignId===CAMPAIGN_ID);
   expect(own?.role).toBe('player');
   expect(own?.characterId,'Jogador deve poder alterar apenas o vínculo de personagem permitido pela Rule.').toBe(CHARACTER_ID);

   await playerPage.evaluate(()=>localStorage.setItem('__e2e_network_marker__','preservar'));
   await playerContext.setOffline(true);
   expect(await playerPage.evaluate(()=>navigator.onLine)).toBe(false);
   expect(await playerPage.evaluate(()=>localStorage.getItem('__e2e_network_marker__'))).toBe('preservar');
   await playerContext.setOffline(false);
   expect(await playerPage.evaluate(()=>navigator.onLine)).toBe(true);
   const afterNetwork=await providerCall(playerPage,'bundle',{campaignId:CAMPAIGN_ID});
   expect(afterNetwork.mode).toBe('shared');
   expect(JSON.stringify(afterNetwork.payload)).not.toContain(PRIVATE_MARK);
   expect(await playerPage.evaluate(()=>localStorage.getItem('__e2e_network_marker__'))).toBe('preservar');
  }finally{
   await Promise.allSettled([adminContext.close(),playerContext.close()])
  }
 })
});
