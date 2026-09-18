const text=value=>String(value??'').trim();
const username=value=>text(value).toLowerCase();
let firestorePromise=null;
async function firestore(version='12.18.0'){
 if(!firestorePromise)firestorePromise=import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`);
 return firestorePromise
}
async function deleteCollection(f,db,path){
 const ref=f.collection(db,...path),snapshot=await f.getDocs(ref);
 await Promise.all(snapshot.docs.map(row=>f.deleteDoc(row.ref)));
 return snapshot.size
}
function requireProvider(provider){if(!provider?.configured||!provider?.db||!provider?.auth)throw new Error('Acesso online indisponível.');const user=provider.auth.currentUser;if(!user)throw new Error('Faça login.');return user}
function isMasterUser(provider,user){const owner=username(provider.config?.ownerUsername||'rafael'),emailUser=username(String(user?.email||'').split('@')[0]);return Boolean(owner&&emailUser===owner)}
async function requireCampaignOwner(provider,campaignId){const user=requireProvider(provider),f=await firestore(provider.config?.sdkVersion||'12.18.0'),root=await f.getDoc(f.doc(provider.db,'campaigns',campaignId));if(!isMasterUser(provider,user)&&(!root.exists()||root.data()?.ownerId!==user.uid))throw new Error('Somente o Mestre pode alterar os acessos desta Campanha.');return{user,f}}
function detachCharacterFromPayload(payload,characterId){
 const id=text(characterId);if(!payload||!id)return{payload,changed:false};
 const clone=structuredClone(payload),campaign=clone?.campaign;if(!campaign)return{payload:clone,changed:false};
 let changed=false;
 if(Array.isArray(campaign.members))campaign.members=campaign.members.map(member=>{if(text(member?.characterId)!==id)return member;changed=true;return{...member,characterId:null}});
 if(Array.isArray(campaign.sessions))campaign.sessions=campaign.sessions.map(session=>{const ids=Array.isArray(session?.participantCharacterIds)?session.participantCharacterIds:[],next=ids.filter(value=>text(value)!==id);if(next.length!==ids.length){changed=true;return{...session,participantCharacterIds:next}}return session});
 return{payload:clone,changed}
}
export async function deleteRemoteCampaign(provider,campaignId){
 const user=requireProvider(provider),cid=text(campaignId);if(!cid)return false;
 const f=await firestore(provider.config?.sdkVersion||'12.18.0'),db=provider.db,root=f.doc(db,'campaigns',cid),rootSnap=await f.getDoc(root);
 if(!rootSnap.exists())return true;
 if(!isMasterUser(provider,user)&&rootSnap.data()?.ownerId!==user.uid)throw new Error('Somente o Mestre pode excluir esta Campanha.');
 const membershipQuery=f.query(f.collection(db,'memberships'),f.where('campaignId','==',cid)),memberships=await f.getDocs(membershipQuery);
 await Promise.all(memberships.docs.map(row=>f.deleteDoc(row.ref)));
 for(const name of['shared','private','sessions','adventureViews','adventures','characters'])await deleteCollection(f,db,['campaigns',cid,name]);
 await f.deleteDoc(root);
 return true
}
export async function deleteRemoteOwnCharacter(provider,characterId){
 const user=requireProvider(provider),id=text(characterId);if(!id)return false;
 const f=await firestore(provider.config?.sdkVersion||'12.18.0'),db=provider.db;
 await f.deleteDoc(f.doc(db,'users',user.uid,'characters',id)).catch(()=>{});
 const memberships=typeof provider.listMemberships==='function'?await provider.listMemberships():[];
 for(const membership of memberships){if(text(membership?.characterId)!==id)continue;await f.deleteDoc(f.doc(db,'campaigns',text(membership.campaignId),'characters',id)).catch(()=>{})}
 return true
}
export async function deleteRemoteManagedCharacter(provider,characterId,ownerUid){
 const user=requireProvider(provider),id=text(characterId),uid=text(ownerUid);if(!id||!uid)return false;if(!isMasterUser(provider,user))throw new Error('Somente Rafael pode excluir fichas de outros jogadores.');
 const f=await firestore(provider.config?.sdkVersion||'12.18.0'),db=provider.db;
 await f.deleteDoc(f.doc(db,'users',uid,'characters',id)).catch(()=>{});
 const q=f.query(f.collection(db,'memberships'),f.where('characterId','==',id)),memberships=await f.getDocs(q).catch(()=>null);
 for(const row of memberships?.docs||[]){const cid=text(row.data()?.campaignId);if(cid)await f.deleteDoc(f.doc(db,'campaigns',cid,'characters',id)).catch(()=>{})}
 return true
}
export async function deleteRemoteCharacterAsMaster(provider,characterId){
 const user=requireProvider(provider),id=text(characterId);if(!id)return false;if(!isMasterUser(provider,user))throw new Error('Somente Rafael pode excluir qualquer personagem do Hub.');
 const f=await firestore(provider.config?.sdkVersion||'12.18.0'),db=provider.db,deletedAt=new Date().toISOString();
 const [users,campaigns,memberships]=await Promise.all([
  f.getDocs(f.collection(db,'users')),
  f.getDocs(f.collection(db,'campaigns')),
  f.getDocs(f.query(f.collection(db,'memberships'),f.where('characterId','==',id))).catch(()=>null)
 ]);
 const stateDocs=[];
 for(const campaign of campaigns.docs){
  const cid=campaign.id;
  const [privateSnap,sharedSnap]=await Promise.all([
   f.getDoc(f.doc(db,'campaigns',cid,'private','state')).catch(()=>null),
   f.getDoc(f.doc(db,'campaigns',cid,'shared','state')).catch(()=>null)
  ]);
  stateDocs.push({cid,privateSnap,sharedSnap})
 }
 const batch=f.writeBatch(db);
 batch.set(f.doc(db,'characterTombstones',id),{characterId:id,deletedByUid:user.uid,deletedAt,serverDeletedAt:f.serverTimestamp()},{merge:true});
 for(const profile of users.docs)batch.delete(f.doc(db,'users',profile.id,'characters',id));
 for(const campaign of campaigns.docs)batch.delete(f.doc(db,'campaigns',campaign.id,'characters',id));
 for(const row of memberships?.docs||[])batch.update(row.ref,{characterId:null,updatedAt:deletedAt});
 for(const {privateSnap,sharedSnap} of stateDocs){
  if(privateSnap?.exists?.()){const result=detachCharacterFromPayload(privateSnap.data()?.payload,id);if(result.changed)batch.set(privateSnap.ref,{payload:result.payload,updatedAt:deletedAt,serverUpdatedAt:f.serverTimestamp()},{merge:true})}
  if(sharedSnap?.exists?.()){const result=detachCharacterFromPayload(sharedSnap.data()?.payload,id);if(result.changed)batch.set(sharedSnap.ref,{payload:result.payload,updatedAt:deletedAt,serverUpdatedAt:f.serverTimestamp()},{merge:true})}
 }
 await batch.commit();
 return{deleted:true,characterId:id,userCopies:users.size,campaignCopies:campaigns.size,membershipsUnlinked:memberships?.size||0}
}

export async function revokeRemoteMembership(provider,campaignId,playerUsername){
 const cid=text(campaignId),target=username(playerUsername);if(!cid||!target)throw new Error('Selecione um jogador e uma Campanha.');
 const{f}=await requireCampaignOwner(provider,cid),db=provider.db,q=f.query(f.collection(db,'memberships'),f.where('campaignId','==',cid)),snapshot=await f.getDocs(q),spec=(provider.config?.playerAccounts||[]).find(row=>username(row?.username)===target),authName=username(spec?.authUsername||target),domain=username(provider.config?.usernameDomain),targetEmail=domain?`${authName}@${domain}`:'';
 const matches=snapshot.docs.filter(row=>{const data=row.data()||{};return username(data.username)===target||username(data.email)===targetEmail});
 if(!matches.length)return false;
 const characterIds=[...new Set(matches.map(row=>text(row.data()?.characterId)).filter(Boolean))];
 await Promise.all(matches.map(row=>f.deleteDoc(row.ref)));
 await Promise.all(characterIds.map(id=>f.deleteDoc(f.doc(db,'campaigns',cid,'characters',id)).catch(()=>{})));
 return true
}
