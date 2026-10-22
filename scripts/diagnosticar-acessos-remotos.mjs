#!/usr/bin/env node
// Diagnóstico exclusivo de leitura. Não registra IDs, nomes de Campanhas nem dados pessoais.
import fs from 'node:fs';

const config=JSON.parse(fs.readFileSync(new URL('../dados/firebase-config.json',import.meta.url),'utf8'));
const username=(process.env.E2E_FIREBASE_ADMIN_USERNAME||'').trim().toLowerCase();
const password=process.env.E2E_FIREBASE_ADMIN_PASSWORD||'';
if(!username||!password)throw new Error('Credenciais de homologação não configuradas.');
const spec=[{username:config.ownerUsername,authUsername:config.ownerUsername},...(config.playerAccounts||[])].find(x=>x.username===username||x.authUsername===username);
const login=`${spec?.authUsername||username}@${config.usernameDomain}`;
const apiRoot=`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents`;
async function responseJson(url,options={}){
 const response=await fetch(url,{...options,signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(`Firebase API HTTP ${response.status} (${new URL(url).hostname})`);
 return response.json();
}
const auth=await responseJson(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(config.apiKey)}`,{
 method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({email:login,password,returnSecureToken:true})
});
if(!auth.idToken)throw new Error('Identidade não autenticada.');
const headers={Authorization:`Bearer ${auth.idToken}`};
async function list(name){
 let result=[],token='';
 do{
  const url=`${apiRoot}/${name}?pageSize=100${token?'&pageToken='+encodeURIComponent(token):''}`;
  const data=await responseJson(url,{headers});
  result.push(...(data.documents||[]));token=data.nextPageToken||'';
 }while(token);
 return result;
}
function decode(field){
 if(!field)return null;
 if('stringValue'in field)return field.stringValue;
 if('integerValue'in field)return Number(field.integerValue);
 if('doubleValue'in field)return Number(field.doubleValue);
 if('booleanValue'in field)return field.booleanValue;
 if('nullValue'in field)return null;
 if('arrayValue'in field)return(field.arrayValue.values||[]).map(decode);
 if('mapValue'in field)return Object.fromEntries(Object.entries(field.mapValue.fields||{}).map(([k,v])=>[k,decode(v)]));
 return null;
}
const data=d=>Object.fromEntries(Object.entries(d?.fields||{}).map(([k,v])=>[k,decode(v)]));
const [campaignDocuments,membershipDocuments,userDocuments]=await Promise.all([
 list('campaigns'),list('memberships'),list('users')
]);
const memberships=membershipDocuments.map(data),users=userDocuments.map(data);
const fernanda=memberships.filter(m=>String(m.username||'').toLowerCase()==='fernanda'||String(m.email||'').toLowerCase().startsWith('fernanda@'));
const activeFernanda=fernanda.filter(m=>m.active===true);
const result={
 status:'leitura-remota-concluida',campaigns:campaignDocuments.length,users:users.length,
 fernandaProfile:users.filter(u=>String(u.username||'').toLowerCase()==='fernanda').length,
 fernandaMemberships:fernanda.length,fernandaActiveMemberships:activeFernanda.length,
 fernandaRevokedMemberships:fernanda.filter(m=>m.active===false).length,
 fernandaCharacterLinks:activeFernanda.filter(m=>m.characterId).length,
 fernandaSessionLinks:activeFernanda.reduce((n,m)=>n+(m.sessionIds||[]).length,0),
 fernandaAdventureLinks:activeFernanda.reduce((n,m)=>n+(m.adventureIds||[]).length,0),
 fernandaRosterCampaigns:0,fernandaRosterWithoutActiveMembership:0,
 missingPrivateCampaigns:0,missingSharedCampaigns:0,
 missingAssignedSessions:0,missingAssignedAdventures:0
};
async function get(relative){
 const response=await fetch(`${apiRoot}/${relative}`,{headers,signal:AbortSignal.timeout(20000)});
 if(response.status===404)return null;
 if(!response.ok)throw new Error(`Firestore read HTTP ${response.status}`);
 return response.json();
}
for(const document of campaignDocuments){
 const cid=document.name.split('/').pop(),id=encodeURIComponent(cid);
 const [privateDoc,sharedDoc]=await Promise.all([get(`campaigns/${id}/private/state`),get(`campaigns/${id}/shared/state`)]);
 if(!privateDoc)result.missingPrivateCampaigns++;
 if(!sharedDoc)result.missingSharedCampaigns++;
 const camp=data(privateDoc)?.payload?.campaign;
 const hasFernanda=(camp?.members||[]).some(m=>String(m?.username||'').toLowerCase()==='fernanda'&&m?.active!==false&&m?.role==='player');
 if(hasFernanda){
  result.fernandaRosterCampaigns++;
  if(!activeFernanda.some(m=>m.campaignId===cid))result.fernandaRosterWithoutActiveMembership++;
 }
 for(const member of activeFernanda.filter(m=>m.campaignId===cid)){
  for(const sid of member.sessionIds||[])if(!(await get(`campaigns/${id}/sessions/${encodeURIComponent(sid)}`)))result.missingAssignedSessions++;
  for(const aid of member.adventureIds||[])if(!(await get(`campaigns/${id}/adventureViews/${encodeURIComponent(aid)}`)))result.missingAssignedAdventures++;
 }
}
console.log('FIREBASE_ACESSOS_RESULTADO '+JSON.stringify(result));
