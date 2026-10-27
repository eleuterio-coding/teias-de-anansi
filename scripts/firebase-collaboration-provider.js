import{normalizeAccount,normalizeMembership,normalizeUsername,campaignSharedCoreProjection,sessionSharedProjection,adventureSharedRecord,collaborationMemberBundle}from'./collaboration-model.js?v=20261027-scenes-cast-v1';
import{canonicalJson,samePersistedFields}from'./collaboration-quota-utils.js?v=20261022-quota1';
const CONFIG_URL='dados/firebase-config.json?v=20260917-player-catalog1';
const text=v=>String(v??'').trim(),now=()=>new Date().toISOString(),arr=v=>Array.isArray(v)?v:[],unique=v=>[...new Set(arr(v).map(text).filter(Boolean))];
export async function loadFirebaseConfig(fetcher=fetch){const r=await fetcher(CONFIG_URL,{cache:'no-store'});if(!r.ok)throw new Error(`Configuração de acesso indisponível (HTTP ${r.status}).`);const c=await r.json(),required=['projectId','apiKey','authDomain','appId','usernameDomain'];return{...c,configured:c.enabled===true&&c.authMode==='username-password'&&required.every(k=>text(c[k]))}}
async function sdk(version='12.18.0'){const base=`https://www.gstatic.com/firebasejs/${version}`;const[app,auth,firestore]=await Promise.all([import(`${base}/firebase-app.js`),import(`${base}/firebase-auth.js`),import(`${base}/firebase-firestore.js`)]);return{app,auth,firestore}}
export async function createFirebaseCollaborationProvider({config=null}={}){
 const c=config||await loadFirebaseConfig();
 if(!c.configured)return{configured:false,reason:'Acesso online ainda não configurado.',config:c};
 const lib=await sdk(c.sdkVersion||'12.18.0'),firebaseOptions={apiKey:c.apiKey,authDomain:c.authDomain,projectId:c.projectId,appId:c.appId,storageBucket:c.storageBucket||undefined,messagingSenderId:c.messagingSenderId||undefined},app=lib.app.getApps().length?lib.app.getApp():lib.app.initializeApp(firebaseOptions),auth=lib.auth.getAuth(app),db=lib.firestore.getFirestore(app),f=lib.firestore;
 const ownerUsername=normalizeUsername(c.ownerUsername||'rafael');
 const playerAccounts=arr(c.playerAccounts).map(row=>({username:normalizeUsername(row?.username),displayName:text(row?.displayName)||text(row?.username),authUsername:normalizeUsername(row?.authUsername||row?.username)})).filter(row=>row.username);
 const ownerAccount={username:ownerUsername,displayName:text(c.ownerDisplayName)||'Rafael',authUsername:ownerUsername};
 const accountSpecs=[ownerAccount,...playerAccounts];
 const accountSpec=value=>{const key=normalizeUsername(value);return accountSpecs.find(row=>row.username===key||row.authUsername===key)||null};
 const canonicalUsername=value=>accountSpec(value)?.username||normalizeUsername(value);
 const displayNameFor=value=>accountSpec(value)?.displayName||canonicalUsername(value)||'Usuário';
 const requireUsername=value=>{const normalized=normalizeUsername(value);if(!/^[a-z0-9._-]{1,64}$/.test(normalized))throw new Error('Usuário inválido.');return normalized};
 const authUsernameFor=value=>requireUsername(accountSpec(value)?.authUsername||value);
 const technicalEmail=value=>`${authUsernameFor(value)}@${c.usernameDomain}`;
 const normalizeMember=value=>{const m=normalizeMembership(value),raw=m.username||text(m.email).split('@')[0],canonical=canonicalUsername(raw);return{...m,username:canonical,displayName:displayNameFor(canonical)}};
 const membershipId=(campaignId,email)=>`${campaignId}_${text(email).toLowerCase()}`;
 const membershipRef=(campaignId,email)=>f.doc(db,'memberships',membershipId(campaignId,email));
 const accountFor=firebaseUser=>{if(!firebaseUser)throw new Error('Faça login.');const raw=normalizeAccount(firebaseUser,{domain:c.usernameDomain}),spec=accountSpec(raw.username);return{...raw,username:spec?.username||raw.username,displayName:spec?.displayName||raw.displayName||raw.username}};
 const campaignRole=async(campaignId,firebaseUser=auth.currentUser)=>{if(!firebaseUser?.email)return null;const ms=await f.getDoc(membershipRef(campaignId,firebaseUser.email));return ms.exists()?normalizeMember({...ms.data(),id:ms.id}):null};
 const canManageCampaign=async(campaignId,uid)=>{if(auth.currentUser&&accountFor(auth.currentUser).username===ownerUsername)return true;const root=await f.getDoc(f.doc(db,'campaigns',campaignId));return root.exists()&&root.data().ownerId===uid};
 const campaignMemberships=async campaignId=>{const q=f.query(f.collection(db,'memberships'),f.where('campaignId','==',campaignId));const snap=await f.getDocs(q);return snap.docs.map(d=>normalizeMember({...d.data(),id:d.id})).filter(m=>m.active!==false)};
 const canReadCampaign=async(campaignId,firebaseUser=auth.currentUser)=>{if(!firebaseUser)return false;if(await canManageCampaign(campaignId,firebaseUser.uid))return true;const membership=await campaignRole(campaignId,firebaseUser);return Boolean(membership?.active)};
 // Reconciliação diferencial: nunca regravar sessões/aventuras idênticas.
 const replaceCollection=async(ref,records)=>{
  const previous=await f.getDocs(ref),byId=new Map(previous.docs.map(doc=>[doc.id,doc]));
  const wanted=new Set(records.map(row=>String(row.id))),changes=[];
  for(const record of records){
   const old=byId.get(String(record.id));
   if(!old||!samePersistedFields(old.data(),record))changes.push({kind:'set',ref:f.doc(ref,record.id),record});
  }
  for(const doc of previous.docs)if(!wanted.has(doc.id))changes.push({kind:'delete',ref:doc.ref});
  for(let i=0;i<changes.length;i+=300){
   const batch=f.writeBatch(db);
   for(const change of changes.slice(i,i+300))if(change.kind==='set')batch.set(change.ref,change.record,{merge:false});else batch.delete(change.ref);
   await batch.commit();
  }
  return{changed:changes.length,unchanged:records.length-changes.filter(change=>change.kind==='set').length};
 };
 const bundleSignatures=new Map(),characterSignatures=new Map();
 const fetchAssigned=async(ref,ids)=>{const rows=[];for(const id of unique(ids)){const snap=await f.getDoc(f.doc(ref,id));if(snap.exists())rows.push(snap.data())}return rows};
 const normalizeCharacterOwner=(payload,ownerUid,ownerName)=>payload&&text(payload.id)?{...payload,ownerUid:text(payload.ownerUid)||text(ownerUid),ownerUsername:canonicalUsername(payload.ownerUsername||ownerName)}:null;
 const provider={configured:true,config:{...c,ownerUsername,playerAccounts,playerUsernames:playerAccounts.map(row=>row.username)},auth,db,
  loginAccounts(){return[ownerAccount,...playerAccounts].map(row=>({...row}))},
  playerAccounts(){return playerAccounts.map(row=>({...row}))},
  onAuthChanged(cb){return lib.auth.onAuthStateChanged(auth,async firebaseUser=>{if(!firebaseUser){cb(null);return}try{cb(await provider.ensureProfile(firebaseUser))}catch{cb(accountFor(firebaseUser))}})},
  async currentUser(){return auth.currentUser?accountFor(auth.currentUser):null},
  subscribeRealtime(onChange,onError=()=>{}){
   const u=auth.currentUser;if(!u?.email)return()=>{};
   const account=accountFor(u),children=new Map(),playerChildren=new Map();
   const signal=snapshot=>{if(snapshot?.metadata?.hasPendingWrites)return;onChange?.()};
   const wanted=(key,ref)=>({key,ref});
   // Reutiliza assinaturas inalteradas em vez de fechar/reabrir todas as
   // coleções sempre que uma única sessão ou aventura é atribuída.
   const syncWatchers=(active,desired)=>{
    const target=new Map(desired.map(item=>[item.key,item.ref]));
    for(const[key,stop]of active)if(!target.has(key)){try{stop()}catch{}active.delete(key)}
    for(const[key,ref]of target)if(!active.has(key)){
     let initial=true;
     active.set(key,f.onSnapshot(ref,snapshot=>{
      // A consulta raiz já agenda o pull de bootstrap; não duplicar
      // consultas por cada snapshot inicial das assinaturas filhas.
      if(initial){initial=false;return}
      signal(snapshot);
     },onError));
    }
   };
   const clearWatchers=active=>{for(const stop of active.values())try{stop()}catch{}active.clear()};
   let rootStop;
   if(account.username===ownerUsername){
    const campaignsQuery=f.query(f.collection(db,'campaigns'),f.where('ownerId','==',u.uid));
    const campaignsStop=f.onSnapshot(campaignsQuery,snapshot=>{
     const desired=[wanted('own-characters',f.collection(db,'users',u.uid,'characters'))];
     for(const row of snapshot.docs){
      const cid=row.id;
      desired.push(wanted('private:'+cid,f.doc(db,'campaigns',cid,'private','state')));
      desired.push(wanted('campaign-characters:'+cid,f.collection(db,'campaigns',cid,'characters')));
      desired.push(wanted('campaign-members:'+cid,f.query(f.collection(db,'memberships'),f.where('campaignId','==',cid))));
     }
     syncWatchers(children,desired);
     signal(snapshot);
    },onError);
    const usersStop=f.onSnapshot(f.collection(db,'users'),snapshot=>{
     const eligible=snapshot.docs.filter(row=>row.id!==u.uid&&playerAccounts.some(spec=>spec.username===canonicalUsername(row.data()?.username)));
     syncWatchers(playerChildren,eligible.map(row=>wanted('player-characters:'+row.id,f.collection(db,'users',row.id,'characters'))));
     signal(snapshot);
    },onError);
    rootStop=()=>{try{campaignsStop()}catch{}try{usersStop()}catch{}};
   }else{
    const email=String(u.email).toLowerCase(),q=f.query(f.collection(db,'memberships'),f.where('email','==',email));
    rootStop=f.onSnapshot(q,snapshot=>{
     const memberships=snapshot.docs.map(d=>normalizeMember({...d.data(),id:d.id})).filter(m=>m.active!==false&&m.role==='player');
     const desired=[
      wanted('own-characters',f.collection(db,'users',u.uid,'characters')),
      wanted('profiles',f.collection(db,'users'))
     ];
     for(const m of memberships){
      const cid=m.campaignId;
      desired.push(wanted('shared:'+cid,f.doc(db,'campaigns',cid,'shared','state')));
      for(const sid of unique(m.sessionIds))desired.push(wanted('session:'+cid+':'+sid,f.doc(db,'campaigns',cid,'sessions',sid)));
      for(const aid of unique(m.adventureIds))desired.push(wanted('adventure:'+cid+':'+aid,f.doc(db,'campaigns',cid,'adventureViews',aid)));
      desired.push(wanted('campaign-characters:'+cid,f.collection(db,'campaigns',cid,'characters')));
      desired.push(wanted('campaign-members:'+cid,f.query(f.collection(db,'memberships'),f.where('campaignId','==',cid))));
     }
     syncWatchers(children,desired);
     signal(snapshot);
    },onError);
   }
   return()=>{try{rootStop?.()}catch{}clearWatchers(children);clearWatchers(playerChildren)}
  },
  async signInUsername({username,password}={}){const canonical=canonicalUsername(username),spec=accountSpec(canonical);if(!spec)throw new Error('Selecione uma conta válida.');if(!text(password))throw new Error('Informe a senha.');let result;try{result=await lib.auth.signInWithEmailAndPassword(auth,technicalEmail(canonical),password)}catch(error){if(['auth/invalid-credential','auth/user-not-found','auth/wrong-password','auth/invalid-login-credentials'].includes(error?.code))throw new Error('Usuário ou senha incorretos.');if(error?.code==='auth/user-disabled')throw new Error('Este login está desativado.');if(error?.code==='auth/too-many-requests')throw new Error('Muitas tentativas. Tente novamente mais tarde.');throw new Error('Não foi possível entrar agora. Tente novamente.')}try{return await provider.ensureProfile(result.user)}catch(error){await lib.auth.signOut(auth).catch(()=>{});if(['permission-denied','firestore/permission-denied'].includes(error?.code))throw new Error('O login existe, mas o acesso online ainda não está atualizado.');throw error}},
  async createPlayerLogin({username,password}={}){const current=auth.currentUser?accountFor(auth.currentUser):null;if(!current||current.username!==ownerUsername)throw new Error('Somente Rafael pode criar logins de jogadores.');const canonical=canonicalUsername(username),spec=playerAccounts.find(row=>row.username===canonical);if(!spec)throw new Error('Selecione Bruno, Gustavo, Léo ou Fernanda.');if(text(password).length<6)throw new Error('A senha precisa ter pelo menos 6 caracteres.');const secondaryName=`player-provision-${Date.now()}-${Math.random().toString(36).slice(2)}`;let secondaryApp=null;try{secondaryApp=lib.app.initializeApp(firebaseOptions,secondaryName);const secondaryAuth=lib.auth.getAuth(secondaryApp),secondaryDb=lib.firestore.getFirestore(secondaryApp);const credential=await lib.auth.createUserWithEmailAndPassword(secondaryAuth,technicalEmail(canonical),password);await f.setDoc(f.doc(secondaryDb,'users',credential.user.uid),{uid:credential.user.uid,username:spec.username,displayName:spec.displayName,role:'player',updatedAt:f.serverTimestamp()},{merge:true});await lib.auth.signOut(secondaryAuth);return{uid:credential.user.uid,username:spec.username,displayName:spec.displayName}}catch(error){if(error?.code==='auth/email-already-in-use')throw new Error(`${spec.displayName} já possui login.`);if(error?.code==='auth/weak-password')throw new Error('Escolha uma senha com pelo menos 6 caracteres.');throw new Error('Não foi possível criar este login agora.')}finally{if(secondaryApp)await lib.app.deleteApp(secondaryApp).catch(()=>{})}},
  async signOut(){await lib.auth.signOut(auth)},
  async ensureProfile(firebaseUser=auth.currentUser){
   const u=accountFor(firebaseUser),ref=f.doc(db,'users',u.uid),snap=await f.getDoc(ref),
     saved=snap.exists()?snap.data()||{}:{},displayName=text(saved.displayName)||u.displayName;
   const role=u.username===ownerUsername?'dm':'player';
   const update={};
   // Não atualizar updatedAt a cada leitura: perfis têm listeners ativos.
   // Só escrever quando houver criação, correção da identidade ou nome ausente.
   if(!snap.exists()||text(saved.uid)!==u.uid)update.uid=u.uid;
   if(!snap.exists()||text(saved.username)!==u.username)update.username=u.username;
   if(!snap.exists()||saved.role!==role)update.role=role;
   // Um nome definido pelo Mestre não pode ser substituído a cada login.
   if(!text(saved.displayName))update.displayName=displayName;
   if(Object.keys(update).length){update.updatedAt=f.serverTimestamp();await f.setDoc(ref,update,{merge:true})}
   return{...u,displayName};
  },
  async getMyProfile(){if(typeof auth.authStateReady==='function')await auth.authStateReady();const u=auth.currentUser;if(!u)throw new Error('Faça login.');const snap=await f.getDoc(f.doc(db,'users',u.uid));const saved=snap.exists()?snap.data()||{}:{};return{...accountFor(u),displayName:text(saved.displayName)||accountFor(u).displayName,avatarDataUrl:String(saved.avatarDataUrl||'')}},
  async saveMyAvatar(avatarDataUrl=''){if(typeof auth.authStateReady==='function')await auth.authStateReady();const u=auth.currentUser;if(!u)throw new Error('Faça login.');const safe=avatarDataUrl===''?'':/^data:image\/(?:webp|jpeg|png);base64,[a-zA-Z0-9+/=]+$/.test(avatarDataUrl)&&avatarDataUrl.length<=125000?avatarDataUrl:null;
   if(safe===null)throw new Error('Imagem de perfil inválida.');
   await f.setDoc(f.doc(db,'users',u.uid),{avatarDataUrl:safe,updatedAt:f.serverTimestamp()},{merge:true});
   return provider.getMyProfile()
  },
  async listUsers(){if(typeof auth.authStateReady==='function')await auth.authStateReady();if(!auth.currentUser)throw new Error('Faça login.');const snap=await f.getDocs(f.collection(db,'users')),seen=new Map();for(const d of snap.docs){const data=d.data()||{},name=canonicalUsername(data.username),row={uid:d.id,username:name||'usuario',displayName:text(data.displayName)||displayNameFor(name),avatarDataUrl:String(data.avatarDataUrl||'')};seen.set(row.username,row)}return[...seen.values()].sort((a,b)=>a.displayName.localeCompare(b.displayName,'pt-BR'))},
  async saveManagedUserProfile({uid,displayName,avatarDataUrl}={}){
   if(typeof auth.authStateReady==='function')await auth.authStateReady();
   const current=auth.currentUser;
   if(!current||String(current.email||'').toLowerCase()!==technicalEmail(ownerUsername).toLowerCase())
     throw new Error('Somente o Mestre autenticado pode editar outros perfis.');
   const targetUid=text(uid);
   if(!targetUid)throw new Error('Selecione um usuário válido.');
   const ref=f.doc(db,'users',targetUid),snapshot=await f.getDoc(ref);
   if(!snapshot.exists())throw new Error('Este usuário ainda não possui login no Hub.');
   const saved=snapshot.data()||{},username=canonicalUsername(saved.username);
   if(!accountSpecs.some(row=>row.username===username)||!username)throw new Error('Conta não autorizada no Hub.');
   const update={updatedAt:f.serverTimestamp()};
   if(displayName!==undefined){
     const name=text(displayName);
     if(!name||name.length>80||[...name].some(char=>char.charCodeAt(0)<32||char.charCodeAt(0)===127))
       throw new Error('O nome deve ter entre 1 e 80 caracteres válidos.');
     update.displayName=name;
   }
   if(avatarDataUrl!==undefined){
     const safe=avatarDataUrl===''?'':typeof avatarDataUrl==='string'
       && /^data:image\/(?:webp|jpeg|png);base64,[a-zA-Z0-9+/=]+$/.test(avatarDataUrl)
       && avatarDataUrl.length<=125000?avatarDataUrl:null;
     if(safe===null)throw new Error('Imagem de perfil inválida.');
     update.avatarDataUrl=safe;
   }
   if(!('displayName' in update)&&!('avatarDataUrl' in update))throw new Error('Nenhuma alteração selecionada.');
   await f.updateDoc(ref,update);
   return{uid:targetUid,username,displayName:update.displayName||text(saved.displayName)||displayNameFor(username),
     avatarDataUrl:update.avatarDataUrl??String(saved.avatarDataUrl||'')};
  },
  async listCampaignMemberships(campaignId){const u=auth.currentUser,cid=text(campaignId);if(!u||!cid)return[];if(!await canManageCampaign(cid,u.uid))throw new Error('Somente Rafael pode administrar os jogadores desta Campanha.');return campaignMemberships(cid)},
  async listVisibleCampaignMemberships(campaignId){const u=auth.currentUser,cid=text(campaignId);if(!u||!cid)return[];if(!await canReadCampaign(cid,u))throw new Error('Esta conta não participa desta Campanha.');return campaignMemberships(cid)},
  async upsertMembership({campaignId,username,characterId=null,sessionIds=[],adventureIds=[]}={}){const current=auth.currentUser;if(!current)throw new Error('Faça login.');const cid=text(campaignId),playerUsername=canonicalUsername(username),email=technicalEmail(playerUsername),linkedCharacter=text(characterId)||null;if(!cid)throw new Error('Selecione uma Campanha.');if(!await canManageCampaign(cid,current.uid))throw new Error('Somente Rafael pode definir os acessos dos jogadores.');if(playerUsername===ownerUsername)throw new Error('Rafael já é o Mestre da Campanha.');const membership={id:membershipId(cid,email),campaignId:cid,uid:'',username:playerUsername,email,role:'player',characterId:linkedCharacter,sessionIds:unique(sessionIds),adventureIds:unique(adventureIds),displayName:displayNameFor(playerUsername),active:true,updatedAt:now()};await f.setDoc(membershipRef(cid,email),membership,{merge:false});return normalizeMember(membership)},
  async saveOwnCharacter(character){const u=auth.currentUser;if(!u)throw new Error('Faça login para sincronizar personagens.');const charId=text(character?.id);if(!charId)throw new Error('Personagem inválido.');const signatureKey=`${u.uid}:own:${charId}`,signature=canonicalJson(character);if(characterSignatures.get(signatureKey)===signature)return;const account=await provider.ensureProfile(u),payload={...character,ownerUid:u.uid,ownerUsername:account.username};await f.setDoc(f.doc(db,'users',u.uid,'characters',charId),{ownerId:u.uid,ownerUsername:account.username,payload,updatedAt:payload.updatedAt||now(),serverUpdatedAt:f.serverTimestamp()},{merge:true});characterSignatures.set(signatureKey,signature)},
  async saveManagedPlayerCharacter(character){const u=auth.currentUser;if(!u)throw new Error('Faça login.');const account=accountFor(u);if(account.username!==ownerUsername)throw new Error('Somente Rafael pode administrar fichas de outros jogadores.');const charId=text(character?.id),ownerName=canonicalUsername(character?.ownerUsername);if(!charId||!ownerName||ownerName===ownerUsername)throw new Error('Selecione um jogador válido para esta ficha.');const signatureKey=`managed:${charId}:${ownerName}:${text(character.ownerUid)}`,signature=canonicalJson(character);if(characterSignatures.get(signatureKey)===signature)return;const users=await f.getDocs(f.collection(db,'users')),target=[...users.docs].find(row=>canonicalUsername(row.data()?.username)===ownerName),ownerUid=text(character?.ownerUid)||text(target?.id);if(!ownerUid||!target||target.id!==ownerUid)throw new Error('O jogador selecionado precisa possuir um login ativo no Hub.');const payload={...character,ownerUid,ownerUsername:ownerName},updatedAt=payload.updatedAt||now(),memberships=await f.getDocs(f.query(f.collection(db,'memberships'),f.where('characterId','==',charId))).catch(()=>null),batch=f.writeBatch(db);for(const profile of users.docs)if(profile.id!==ownerUid)batch.delete(f.doc(db,'users',profile.id,'characters',charId));batch.set(f.doc(db,'users',ownerUid,'characters',charId),{ownerId:ownerUid,ownerUsername:ownerName,payload,updatedAt,serverUpdatedAt:f.serverTimestamp()},{merge:true});for(const row of memberships?.docs||[])if(canonicalUsername(row.data()?.username)!==ownerName)batch.update(row.ref,{characterId:null,updatedAt});await batch.commit();characterSignatures.set(signatureKey,signature)},
  async listOwnCharacters(){const u=auth.currentUser;if(!u)return[];const account=accountFor(u),ref=f.collection(db,'users',u.uid,'characters'),snap=typeof f.getDocsFromServer==='function'?await f.getDocsFromServer(ref):await f.getDocs(ref);return snap.docs.map(d=>normalizeCharacterOwner(d.data()?.payload,u.uid,account.username)).filter(Boolean)},
  async listCharacterTombstones(){if(!auth.currentUser)return[];const ref=f.collection(db,'characterTombstones'),snap=typeof f.getDocsFromServer==='function'?await f.getDocsFromServer(ref):await f.getDocs(ref);return snap.docs.map(d=>({id:d.id,...d.data()}))},
  async listPlayerCharacters(){const u=auth.currentUser;if(!u)return[];const account=accountFor(u);if(account.username!==ownerUsername)throw new Error('Somente Rafael pode ver fichas pessoais dos jogadores antes do vínculo.');const users=await f.getDocs(f.collection(db,'users')),rows=[];for(const profileDoc of users.docs){if(profileDoc.id===u.uid)continue;const profile=profileDoc.data()||{},name=canonicalUsername(profile.username);if(!playerAccounts.some(spec=>spec.username===name))continue;const displayName=text(profile.displayName)||displayNameFor(name),ref=f.collection(db,'users',profileDoc.id,'characters'),snap=typeof f.getDocsFromServer==='function'?await f.getDocsFromServer(ref):await f.getDocs(ref);for(const docSnap of snap.docs){const character=normalizeCharacterOwner(docSnap.data()?.payload,profileDoc.id,name);if(character)rows.push({...character,ownerDisplayName:displayName})}}return rows.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))},
  // O elenco escolhido pelo Mestre constitui vínculo explícito com a Campanha.
  // Cria apenas memberships inexistentes: seleções já definidas na tela de
  // acessos (inclusive arrays vazios) permanecem soberanas.
  async reconcileRosterMemberships(campaign,adventures=[]){
   const u=auth.currentUser,owner=accountFor(u).username,cid=text(campaign?.id);
   if(owner!==ownerUsername||!cid)return{created:0};
   // Inclui recusas registradas (active:false); elas nunca são reativadas automaticamente.
   const query=f.query(f.collection(db,'memberships'),f.where('campaignId','==',cid)),snapshot=await f.getDocs(query);
   const existing=snapshot.docs.map(doc=>normalizeMember({...doc.data(),id:doc.id})),allowed=new Set(playerAccounts.map(p=>p.username));
   const roster=arr(campaign.members).filter(m=>m?.role==='player'&&m?.active!==false&&allowed.has(canonicalUsername(m.username)));
   let created=0;
   for(const member of roster){
    const playerUsername=canonicalUsername(member.username);
    if(existing.some(m=>m.role==='player'&&m.username===playerUsername))continue;
    const characterId=text(member.characterId)||null;
    const sessions=arr(campaign.sessions).filter(s=>text(s.id)&&(
     arr(s.participantUsernames).map(canonicalUsername).includes(playerUsername)
     ||(characterId&&arr(s.participantCharacterIds).map(text).includes(characterId))
    ));
    const sessionIds=unique(sessions.map(s=>s.id));
    const adventureIds=unique(arr(adventures).filter(a=>a?.campaignId===cid&&text(a.id)&&(
     arr(a.participantUsernames).map(canonicalUsername).includes(playerUsername)
     ||(characterId&&arr(a.characterIds).map(text).includes(characterId))
     ||sessions.some(s=>text(s.adventureId)===text(a.id))
    )).map(a=>a.id));
    await provider.upsertMembership({campaignId:cid,username:playerUsername,characterId,sessionIds,adventureIds});
    existing.push({username:playerUsername,role:'player',active:true});
    created++;
   }
   return{created}
  },
  async saveCampaignBundle(campaign,adventures=[],characters=[]){const u=auth.currentUser;if(!u)throw new Error('Faça login para sincronizar a Campanha.');const account=accountFor(u),cid=campaign.id,mref=membershipRef(cid,u.email),cref=f.doc(db,'campaigns',cid);
   const publicationKey=`${u.uid}:${cid}`,linkedForSignature=new Set(arr(campaign.members).map(m=>text(m.characterId)).filter(Boolean));
   const publicationSignature=canonicalJson({campaign,adventures:arr(adventures).filter(a=>a?.campaignId===cid),characters:arr(characters).filter(ch=>linkedForSignature.has(text(ch?.id)))});
   if(bundleSignatures.get(publicationKey)===publicationSignature)return{campaignId:cid,unchanged:true};
   let ownerId;if(account.username===ownerUsername){ownerId=u.uid;await f.setDoc(cref,{id:cid,ownerId,name:campaign.name||'',updatedAt:campaign.updatedAt||now(),serverUpdatedAt:f.serverTimestamp()},{merge:true})}else{const existing=await f.getDoc(cref);if(!existing.exists()||existing.data().ownerId!==u.uid)throw new Error('Somente Rafael pode sincronizar a visão do Mestre.');ownerId=existing.data().ownerId;await f.setDoc(cref,{id:cid,ownerId,name:campaign.name||'',updatedAt:campaign.updatedAt||now(),serverUpdatedAt:f.serverTimestamp()},{merge:true})}if(ownerId===u.uid)await f.setDoc(mref,{id:membershipId(cid,u.email),campaignId:cid,uid:u.uid,username:account.username,email:String(u.email||'').toLowerCase(),role:'dm',characterId:null,sessionIds:[],adventureIds:[],displayName:'Rafael',active:true,updatedAt:now()},{merge:false});const sharedCore={campaign:campaignSharedCoreProjection(campaign)};await f.setDoc(f.doc(db,'campaigns',cid,'shared','state'),{payload:sharedCore,updatedAt:campaign.updatedAt||now(),serverUpdatedAt:f.serverTimestamp()},{merge:false});await f.setDoc(f.doc(db,'campaigns',cid,'private','state'),{payload:{campaign,adventures},updatedAt:campaign.updatedAt||now(),serverUpdatedAt:f.serverTimestamp()},{merge:false});const sessionRecords=arr(campaign.sessions).filter(s=>text(s.id)).map(s=>{const payload=sessionSharedProjection(s,campaign,adventures);return{id:payload.id,payload,updatedAt:campaign.updatedAt||now()}});await replaceCollection(f.collection(db,'campaigns',cid,'sessions'),sessionRecords);const campaignAdventures=arr(adventures).filter(a=>a?.campaignId===cid&&text(a.id)),adventureRecords=campaignAdventures.map(a=>{const record=adventureSharedRecord(a,campaign);return{id:a.id,payload:record.payload,updatedAt:a.updatedAt||campaign.updatedAt||now()}});await replaceCollection(f.collection(db,'campaigns',cid,'adventureViews'),adventureRecords);
  if(ownerId===u.uid){const memberships=await campaignMemberships(cid),currentAdventureIds=new Set(campaignAdventures.map(a=>text(a.id)));for(const member of memberships.filter(m=>m.role==='player')){const ids=new Set(unique(member.adventureIds).filter(id=>currentAdventureIds.has(id)));for(const adventure of campaignAdventures){if(adventure?.participantAccessConfigured!==true)continue;const selected=unique(adventure.participantUsernames).map(canonicalUsername).includes(canonicalUsername(member.username));if(selected)ids.add(text(adventure.id));else ids.delete(text(adventure.id))}if(canonicalJson([...ids].sort())!==canonicalJson(unique(member.adventureIds).sort()))await f.setDoc(membershipRef(cid,member.email||technicalEmail(member.username)),{adventureIds:[...ids],updatedAt:now()},{merge:true})}}
  const linkedIds=new Set(arr(campaign.members).map(m=>text(m.characterId)).filter(Boolean));for(const character of arr(characters).filter(ch=>linkedIds.has(text(ch?.id)))){const charId=text(character.id),charRef=f.doc(db,'campaigns',cid,'characters',charId),old=await f.getDoc(charRef),ownerUid=text(character.ownerUid)||text(old.data()?.ownerUid)||u.uid,ownerName=canonicalUsername(character.ownerUsername||old.data()?.ownerUsername||account.username),payload={...character,ownerUid,ownerUsername:ownerName};const nextCharacterRecord={characterId:charId,ownerUid,ownerUsername:ownerName,payload,updatedAt:payload.updatedAt||now()};
   if(!old.exists()||!samePersistedFields(old.data(),nextCharacterRecord))await f.setDoc(charRef,{...nextCharacterRecord,serverUpdatedAt:f.serverTimestamp()},{merge:true})}
   await provider.reconcileRosterMemberships(campaign,campaignAdventures);
   bundleSignatures.set(publicationKey,publicationSignature);
   return{campaignId:cid}},
  async getCampaignBundle(campaignId){const u=auth.currentUser;if(!u)throw new Error('Faça login.');const cid=text(campaignId),membership=await campaignRole(cid,u),root=await f.getDoc(f.doc(db,'campaigns',cid));if(!root.exists())return null;const ownerId=root.data().ownerId;if(ownerId===u.uid){const[p,participants]=await Promise.all([f.getDoc(f.doc(db,'campaigns',cid,'private','state')),campaignMemberships(cid)]);return{mode:'private',ownerId,membership,participants,payload:p.exists()?p.data().payload:null}}if(!membership?.active||membership.role!=='player')throw new Error('Esta conta não participa desta Campanha.');const s=await f.getDoc(f.doc(db,'campaigns',cid,'shared','state')),core=s.exists()?s.data().payload:null;if(!core)return{mode:'shared',ownerId,membership,payload:null};const[sessions,visibleAdventures,participants]=await Promise.all([fetchAssigned(f.collection(db,'campaigns',cid,'sessions'),membership.sessionIds),fetchAssigned(f.collection(db,'campaigns',cid,'adventureViews'),membership.adventureIds),campaignMemberships(cid).catch(()=>[membership])]);const profiles=await provider.listUsers().catch(()=>[]),byUsername=new Map(profiles.map(p=>[p.username,p]));return{mode:'shared',ownerId,membership,payload:collaborationMemberBundle(core,sessions,visibleAdventures,participants.map(p=>({...p,displayName:byUsername.get(p.username)?.displayName||p.displayName,avatarDataUrl:byUsername.get(p.username)?.avatarDataUrl||''})))}},
  // Evita exigir índice composto: consulta pelo e-mail e filtra vínculos ativos.
  async listMemberships(){const u=auth.currentUser;if(!u?.email)return[];const q=f.query(f.collection(db,'memberships'),f.where('email','==',String(u.email).toLowerCase()));const snap=await f.getDocs(q);return snap.docs.map(d=>normalizeMember({...d.data(),id:d.id})).filter(m=>m.active!==false)},
  // Não sobrescreve conteúdo remoto já publicado durante a reconciliação.
  async campaignPublicationStatus(campaignId){const u=auth.currentUser;if(!u||accountFor(u).username!==ownerUsername)throw new Error('Somente o Mestre pode verificar publicações.');const cid=text(campaignId);if(!cid)throw new Error('Campanha inválida.');const root=await f.getDoc(f.doc(db,'campaigns',cid));if(!root.exists())return{exists:false,published:false};const state=await f.getDoc(f.doc(db,'campaigns',cid,'private','state'));return{exists:true,published:state.exists()&&Boolean(state.data()?.payload?.campaign)}},
  // Restaura somente o vínculo do Mestre, sem modificar a Campanha remota.
  async ensureMasterMembership(campaignId){const u=auth.currentUser;if(!u||accountFor(u).username!==ownerUsername)throw new Error('Somente o Mestre pode recuperar seu vínculo.');const cid=text(campaignId);if(!cid)throw new Error('Campanha inválida.');const email=String(u.email||'').toLowerCase();await f.setDoc(membershipRef(cid,email),{id:membershipId(cid,email),campaignId:cid,uid:u.uid,username:ownerUsername,email,role:'dm',characterId:null,sessionIds:[],adventureIds:[],displayName:displayNameFor(ownerUsername),active:true,updatedAt:now()},{merge:true})},
  async saveCampaignCharacter(campaignId,character){const u=auth.currentUser;if(!u)throw new Error('Faça login.');const account=accountFor(u),cid=text(campaignId),charId=text(character?.id);if(!cid||!charId)throw new Error('Campanha ou personagem inválido.');const manager=await canManageCampaign(cid,u.uid),membership=await campaignRole(cid,u);if(!manager&&!(membership?.active&&membership.role==='player'&&membership.characterId===charId))throw new Error('Você só pode alterar a ficha atribuída a você nesta Campanha.');const signatureKey=`${u.uid}:campaign:${cid}:${charId}`,signature=canonicalJson(character);if(characterSignatures.get(signatureKey)===signature)return;const charRef=f.doc(db,'campaigns',cid,'characters',charId),old=await f.getDoc(charRef),ownerUid=manager?(text(character.ownerUid)||text(old.data()?.ownerUid)||u.uid):u.uid,ownerName=manager?canonicalUsername(character.ownerUsername||old.data()?.ownerUsername||account.username):account.username,payload={...character,ownerUid,ownerUsername:ownerName};const expected={characterId:charId,ownerUid,ownerUsername:ownerName,payload,updatedAt:payload.updatedAt||now()};if(!old.exists()||!samePersistedFields(old.data(),expected))await f.setDoc(charRef,{...expected,serverUpdatedAt:f.serverTimestamp()},{merge:true});characterSignatures.set(signatureKey,signature)},
  async saveCampaignMediaState({campaign,adventures=[],entityType='campaign',entityId=null}={}){
   if(typeof auth.authStateReady==='function')await auth.authStateReady();
   const u=auth.currentUser;if(!u)throw new Error('Faça login para sincronizar a imagem.');
   const account=accountFor(u),cid=text(campaign?.id),type=text(entityType),eid=text(entityId)||cid,allowed=new Set(['campaign','adventure','session']);
   if(!cid||!allowed.has(type)||!eid)throw new Error('Campanha ou entidade inválida para sincronização da imagem.');
   const manager=await canManageCampaign(cid,u.uid);if(!manager)throw new Error('Você não pode alterar imagens desta Campanha.');
   const cref=f.doc(db,'campaigns',cid),root=await f.getDoc(cref),ownerId=text(root.data()?.ownerId)||u.uid,batch=f.writeBatch(db),updatedAt=campaign.updatedAt||now();
   batch.set(cref,{id:cid,ownerId,name:campaign.name||'',updatedAt,serverUpdatedAt:f.serverTimestamp()},{merge:true});
   if(account.username===ownerUsername)batch.set(membershipRef(cid,u.email),{id:membershipId(cid,u.email),campaignId:cid,uid:u.uid,username:account.username,email:String(u.email||'').toLowerCase(),role:'dm',characterId:null,sessionIds:[],adventureIds:[],displayName:'Rafael',active:true,updatedAt:now()},{merge:true});
   batch.set(f.doc(db,'campaigns',cid,'private','state'),{payload:{campaign,adventures:arr(adventures).filter(row=>text(row?.campaignId)===cid)},updatedAt,serverUpdatedAt:f.serverTimestamp()},{merge:false});
   if(type==='campaign'){
    batch.set(f.doc(db,'campaigns',cid,'shared','state'),{payload:{campaign:campaignSharedCoreProjection(campaign)},updatedAt,serverUpdatedAt:f.serverTimestamp()},{merge:false})
   }else if(type==='adventure'){
    const adventure=arr(adventures).find(row=>text(row?.id)===eid&&text(row?.campaignId)===cid);if(!adventure)throw new Error('Aventura vinculada à imagem não encontrada.');
    const record=adventureSharedRecord(adventure,campaign);batch.set(f.doc(db,'campaigns',cid,'adventureViews',eid),{id:eid,payload:record.payload,updatedAt:adventure.updatedAt||updatedAt,serverUpdatedAt:f.serverTimestamp()},{merge:false})
   }else{
    const session=arr(campaign.sessions).find(row=>text(row?.id)===eid);if(!session)throw new Error('Sessão vinculada à imagem não encontrada.');
    const payload=sessionSharedProjection(session,campaign,adventures);batch.set(f.doc(db,'campaigns',cid,'sessions',eid),{id:eid,payload,updatedAt:session.updatedAt||updatedAt,serverUpdatedAt:f.serverTimestamp()},{merge:false})
   }
   await batch.commit();return{campaignId:cid,entityType:type,entityId:eid}
  },
  async saveMedia({campaignId=null,entityType,entityId,mime='image/webp',width=0,height=0,size=0,bytes=null}={}){
   if(typeof auth.authStateReady==='function')await auth.authStateReady();
   const u=auth.currentUser;if(!u)throw new Error('Faça login para salvar imagens.');
   const type=text(entityType),eid=text(entityId),allowed=new Set(['campaign','adventure','session']),payloadBytes=bytes instanceof Uint8Array?bytes:null;
   if(!allowed.has(type)||!eid||!payloadBytes?.byteLength)throw new Error('Imagem ou destino inválido.');
   if(mime!=='image/webp'||payloadBytes.byteLength>1800000)throw new Error('A imagem preparada ultrapassou o limite do Hub.');
   const mediaId=globalThis.crypto?.randomUUID?.()||`media-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,chunkSize=480*1024,chunkCount=Math.ceil(payloadBytes.byteLength/chunkSize),account=accountFor(u),metaRef=f.doc(db,'media',mediaId),chunksRef=f.collection(metaRef,'chunks'),createdAt=now(),meta={id:mediaId,ownerId:u.uid,ownerUsername:account.username,campaignId:text(campaignId)||null,entityType:type,entityId:eid,mime,width:Math.max(1,Math.floor(Number(width)||1)),height:Math.max(1,Math.floor(Number(height)||1)),size:payloadBytes.byteLength,chunkCount,status:'uploading',createdAt,updatedAt:createdAt};
   try{
    await f.setDoc(metaRef,{...meta,serverUpdatedAt:f.serverTimestamp()},{merge:false});
    const batch=f.writeBatch(db);
    for(let i=0;i<chunkCount;i++){const part=payloadBytes.slice(i*chunkSize,Math.min(payloadBytes.byteLength,(i+1)*chunkSize));batch.set(f.doc(chunksRef,String(i).padStart(3,'0')),{order:i,size:part.byteLength,bytes:f.Bytes.fromUint8Array(part)},{merge:false})}
    await batch.commit();
    await f.updateDoc(metaRef,{status:'ready',updatedAt:now(),serverUpdatedAt:f.serverTimestamp()});
    return{id:mediaId,campaignId:meta.campaignId,entityType:type,entityId:eid,mime,width:meta.width,height:meta.height,size:meta.size}
   }catch(error){
    try{const snap=await f.getDocs(chunksRef),cleanup=f.writeBatch(db);for(const row of snap.docs)cleanup.delete(row.ref);cleanup.delete(metaRef);await cleanup.commit()}catch{}
    throw new Error('Não foi possível salvar a imagem agora.')
   }
  },
  async readMedia(mediaId){
   if(typeof auth.authStateReady==='function')await auth.authStateReady();
   if(!auth.currentUser)throw new Error('Faça login para abrir imagens.');
   const id=text(mediaId);if(!id)return null;
   const metaRef=f.doc(db,'media',id),metaSnap=typeof f.getDocFromServer==='function'?await f.getDocFromServer(metaRef):await f.getDoc(metaRef);if(!metaSnap.exists()||metaSnap.data()?.status!=='ready')return null;
   const meta=metaSnap.data(),chunksRef=f.collection(metaRef,'chunks'),snap=typeof f.getDocsFromServer==='function'?await f.getDocsFromServer(chunksRef):await f.getDocs(chunksRef),parts=snap.docs.map(row=>row.data()).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)),total=parts.reduce((sum,row)=>sum+(Number(row.size)||row.bytes?.toUint8Array?.().byteLength||0),0),bytes=new Uint8Array(total);let offset=0;
   for(const row of parts){const part=row.bytes?.toUint8Array?.()||new Uint8Array;bytes.set(part,offset);offset+=part.byteLength}
   return{...meta,bytes}
  },
  async deleteMedia(mediaId){
   if(typeof auth.authStateReady==='function')await auth.authStateReady();
   if(!auth.currentUser)return;
   const id=text(mediaId);if(!id)return;
   const metaRef=f.doc(db,'media',id),snap=await f.getDocs(f.collection(metaRef,'chunks')),batch=f.writeBatch(db);for(const row of snap.docs)batch.delete(row.ref);batch.delete(metaRef);await batch.commit()
  },
  async listCampaignCharacters(campaignId){const u=auth.currentUser;if(!u)return[];const cid=text(campaignId),manager=await canManageCampaign(cid,u.uid),membership=manager?null:await campaignRole(cid,u);if(!manager&&!(membership?.active&&membership.role==='player'))return[];const snap=await f.getDocs(f.collection(db,'campaigns',cid,'characters'));return snap.docs.map(d=>{const data=d.data()||{};return normalizeCharacterOwner(data.payload,data.ownerUid,data.ownerUsername)}).filter(Boolean)}
 };
 return provider
}
