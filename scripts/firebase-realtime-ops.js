const text=value=>String(value??'').trim();
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
export async function deleteRemoteCampaign(provider,campaignId){
 const user=requireProvider(provider),cid=text(campaignId);if(!cid)return false;
 const f=await firestore(provider.config?.sdkVersion||'12.18.0'),db=provider.db,root=f.doc(db,'campaigns',cid),rootSnap=await f.getDoc(root);
 if(!rootSnap.exists())return true;
 if(rootSnap.data()?.ownerId!==user.uid)throw new Error('Somente o Mestre pode excluir esta Campanha.');
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
