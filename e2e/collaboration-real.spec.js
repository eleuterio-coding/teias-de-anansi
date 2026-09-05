import{test,expect}from'@playwright/test';
import{randomBytes}from'node:crypto';

const env={
 adminUsername:process.env.E2E_FIREBASE_ADMIN_USERNAME||'',
 adminPassword:process.env.E2E_FIREBASE_ADMIN_PASSWORD||''
};
const hasCredentials=Boolean(env.adminUsername&&env.adminPassword);
const CAMPAIGN_ID='e2e-collaboration-v101';
const PRIVATE_MARK='E2E_PRIVATE_MASTER_ONLY';
const SHARED_MARK='E2E_SHARED_PLAYER_OK';
const CHARACTER_ID='e2e-player-character';

async function connect(page,username,password){
 await page.goto('/index.html');
 return page.evaluate(async({username,password})=>{
  const url=new URL('/scripts/firebase-collaboration-provider.js?v=v101-real-e2e',location.origin).href;
  const{createFirebaseCollaborationProvider}=await import(url);
  const provider=await createFirebaseCollaborationProvider();
  if(!provider.configured)throw new Error(`Firebase real indisponível: ${provider.reason||'configuração ausente'}`);
  const account=await provider.signInUsername({username,password});
  globalThis.__e2eProvider=provider;
  return{uid:account.uid,username:account.username};
 },{username,password})
}

async function createEphemeralPlayer(page,username,password){
 await page.goto('/index.html');
 return page.evaluate(async({username,password})=>{
  const config=await fetch('/dados/firebase-config.json',{cache:'no-store'}).then(async response=>{
   if(!response.ok)throw new Error(`Configuração Firebase indisponível (HTTP ${response.status}).`);
   return response.json()
  });
  const version=config.sdkVersion||'12.18.0',base=`https://www.gstatic.com/firebasejs/${version}`;
  const appLib=await import(`${base}/firebase-app.js`),authLib=await import(`${base}/firebase-auth.js`);
  const app=appLib.initializeApp({apiKey:config.apiKey,authDomain:config.authDomain,projectId:config.projectId,appId:config.appId},`e2e-player-create-${crypto.randomUUID()}`);
  try{
   const auth=authLib.getAuth(app),technicalEmail=`${username}@${config.usernameDomain}`;
   const result=await authLib.createUserWithEmailAndPassword(auth,technicalEmail,password);
   const uid=result.user.uid;
   await authLib.signOut(auth);
   return{uid,username}
  }finally{await appLib.deleteApp(app).catch(()=>{})}
 },{username,password})
}

async function providerCall(page,operation,args={}){
 return page.evaluate(async({operation,args})=>{
  const p=globalThis.__e2eProvider;
  if(!p)throw new Error('Provider E2E não inicializado.');
  if(operation==='publish')return p.saveCampaignBundle(args.campaign,args.adventures||[]);
  if(operation==='membership')return p.upsertMembership(args);
  if(operation==='bundle')return p.getCampaignBundle(args.campaignId);
  if(operation==='link')return p.linkMembershipCharacter(args.campaignId,args.characterId);
  if(operation==='memberships')return p.listMemberships();
  throw new Error(`Operação E2E desconhecida: ${operation}`)
 },{operation,args})
}

async function cleanupPlayerIdentity(page,{username,password,uid,campaignId}){
 if(!username||!password||!uid)return;
 await page.goto('/index.html').catch(()=>{});
 await page.evaluate(async({username,password,uid,campaignId})=>{
  const config=await fetch('/dados/firebase-config.json',{cache:'no-store'}).then(response=>response.json());
  const version=config.sdkVersion||'12.18.0',base=`https://www.gstatic.com/firebasejs/${version}`;
  const appLib=await import(`${base}/firebase-app.js`),authLib=await import(`${base}/firebase-auth.js`),f=await import(`${base}/firebase-firestore.js`);
  const app=appLib.initializeApp({apiKey:config.apiKey,authDomain:config.authDomain,projectId:config.projectId,appId:config.appId},`e2e-player-cleanup-${crypto.randomUUID()}`);
  try{
   const auth=authLib.getAuth(app),db=f.getFirestore(app),technicalEmail=`${username}@${config.usernameDomain}`;
   const result=await authLib.signInWithEmailAndPassword(auth,technicalEmail,password);
   await f.deleteDoc(f.doc(db,'users',uid)).catch(()=>{});
   await f.deleteDoc(f.doc(db,'memberships',`${campaignId}_${uid}`)).catch(()=>{});
   await authLib.deleteUser(result.user);
  }finally{await appLib.deleteApp(app).catch(()=>{})}
 },{username,password,uid,campaignId}).catch(error=>console.warn(`Cleanup da identidade E2E: ${error.message}`))
}

async function cleanupCampaign(page,{adminUid,campaignId}){
 await page.evaluate(async({adminUid,campaignId})=>{
  const p=globalThis.__e2eProvider;
  if(!p)return;
  const version=p.config.sdkVersion||'12.18.0';
  const f=await import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`);
  await f.deleteDoc(f.doc(p.db,'memberships',`${campaignId}_${adminUid}`)).catch(()=>{});
  await f.deleteDoc(f.doc(p.db,'campaigns',campaignId,'shared','state')).catch(()=>{});
  await f.deleteDoc(f.doc(p.db,'campaigns',campaignId,'private','state')).catch(()=>{});
  await f.deleteDoc(f.doc(p.db,'campaigns',campaignId)).catch(()=>{});
 },{adminUid,campaignId}).catch(error=>console.warn(`Cleanup da Mesa E2E: ${error.message}`))
}

test.describe('Firebase real · login simples e visibilidade por papel',()=>{
 test.skip(!hasCredentials,'Credenciais E2E da conta principal não estão disponíveis.');

 test('Mestre recebe visão privada e Jogador recebe somente a visão compartilhada',async({browser})=>{
  const adminContext=await browser.newContext();
  const playerContext=await browser.newContext();
  const adminPage=await adminContext.newPage();
  const playerPage=await playerContext.newPage();
  const suffix=`${Date.now().toString(36)}-${randomBytes(5).toString('hex')}`;
  const playerUsername=`e2e-player-${suffix}`;
  const playerPassword=`E2E!${randomBytes(24).toString('base64url')}9a`;
  let playerUid='',adminUid='';
  try{
   const admin=await connect(adminPage,env.adminUsername,env.adminPassword);
   adminUid=admin.uid;
   expect(admin.username).toBe(env.adminUsername.toLowerCase());

   const now=new Date().toISOString();
   const campaign={
    schema:'hub-rpg/campaign/v1',id:CAMPAIGN_ID,name:'Mesa E2E · v1.0.1',status:'active',system:'D&D 5.5e',setting:'Homologação',description:'Mesa técnica de visibilidade Mestre/Jogador',dmName:admin.username,
    sharedNotes:SHARED_MARK,dmNotes:PRIVATE_MARK,members:[],sessions:[],createdAt:now,updatedAt:now
   };
   const adventures=[{
    schema:'hub-rpg/adventure/v1',id:'e2e-adventure',campaignId:CAMPAIGN_ID,title:'Aventura E2E',status:'planned',summary:'Homologação',dmNotes:PRIVATE_MARK,
    handouts:[{id:'h-visible',title:'Visível',revealed:true,content:SHARED_MARK},{id:'h-hidden',title:'Oculto',revealed:false,content:PRIVATE_MARK}],
    clues:[{id:'c-visible',title:'Descoberta',status:'discovered',text:SHARED_MARK},{id:'c-hidden',title:'Oculta',status:'hidden',text:PRIVATE_MARK}],createdAt:now,updatedAt:now
   }];
   await providerCall(adminPage,'publish',{campaign,adventures});

   const ephemeral=await createEphemeralPlayer(playerPage,playerUsername,playerPassword);
   playerUid=ephemeral.uid;
   expect(playerUid).toBeTruthy();

   // O primeiro login materializa o perfil simples em users/{uid}; não há autorização extra.
   const firstPlayerLogin=await connect(playerPage,playerUsername,playerPassword);
   expect(firstPlayerLogin.uid).toBe(playerUid);

   await providerCall(adminPage,'membership',{campaignId:CAMPAIGN_ID,uid:playerUid,role:'player'});

   const adminBundle=await providerCall(adminPage,'bundle',{campaignId:CAMPAIGN_ID});
   expect(adminBundle.mode).toBe('private');
   expect(JSON.stringify(adminBundle.payload)).toContain(PRIVATE_MARK);

   const playerBundle=await providerCall(playerPage,'bundle',{campaignId:CAMPAIGN_ID});
   expect(playerBundle.mode).toBe('shared');
   const sharedJson=JSON.stringify(playerBundle.payload);
   expect(sharedJson).toContain(SHARED_MARK);
   expect(sharedJson).not.toContain(PRIVATE_MARK);
   expect(playerBundle.payload.revealedAdventures[0].handouts.map(x=>x.id)).toEqual(['h-visible']);
   expect(playerBundle.payload.revealedAdventures[0].clues.map(x=>x.id)).toEqual(['c-visible']);

   await providerCall(playerPage,'link',{campaignId:CAMPAIGN_ID,characterId:CHARACTER_ID});
   const memberships=await providerCall(playerPage,'memberships');
   const own=memberships.find(row=>row.campaignId===CAMPAIGN_ID);
   expect(own?.role).toBe('player');
   expect(own?.characterId).toBe(CHARACTER_ID);

   await playerPage.evaluate(()=>localStorage.setItem('__e2e_network_marker__','preservar'));
   await playerContext.setOffline(true);
   expect(await playerPage.evaluate(()=>navigator.onLine)).toBe(false);
   expect(await playerPage.evaluate(()=>localStorage.getItem('__e2e_network_marker__'))).toBe('preservar');
   await playerContext.setOffline(false);
   expect(await playerPage.evaluate(()=>navigator.onLine)).toBe(true);
   const afterNetwork=await providerCall(playerPage,'bundle',{campaignId:CAMPAIGN_ID});
   expect(afterNetwork.mode).toBe('shared');
   expect(JSON.stringify(afterNetwork.payload)).not.toContain(PRIVATE_MARK);
  }finally{
   if(playerUid)await cleanupPlayerIdentity(playerPage,{username:playerUsername,password:playerPassword,uid:playerUid,campaignId:CAMPAIGN_ID});
   if(adminUid)await cleanupCampaign(adminPage,{adminUid,campaignId:CAMPAIGN_ID});
   await Promise.allSettled([adminContext.close(),playerContext.close()])
  }
 })
});
