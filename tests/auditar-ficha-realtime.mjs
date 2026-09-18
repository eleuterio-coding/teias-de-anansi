import assert from'node:assert/strict';
import fs from'node:fs';
import{writeCollaborationSession,readCollaborationSession}from'../scripts/collaboration-view.js';

class MemoryStorage{
 constructor(){this.rows=new Map();this.writes=0;this.removes=0}
 getItem(key){return this.rows.has(key)?this.rows.get(key):null}
 setItem(key,value){this.writes+=1;this.rows.set(key,String(value))}
 removeItem(key){this.removes+=1;this.rows.delete(key)}
}

const storage=new MemoryStorage();
const firstMembership={id:'c1_gus',campaignId:'c1',username:'gustavo',role:'player',active:true,characterId:'pc1',sessionIds:['s2','s1'],adventureIds:['a2','a1']};
const secondMembership={id:'c2_leo',campaignId:'c2',username:'leo',role:'player',active:true,characterId:'pc2',sessionIds:['s4','s3'],adventureIds:['a4','a3']};
const first=writeCollaborationSession({uid:'u-master',username:'rafael',isMaster:true,memberships:[firstMembership,secondMembership]},storage);
assert.equal(storage.writes,1,'A primeira sessão deve ser persistida.');
const second=writeCollaborationSession({uid:'u-master',username:'RAFAEL',isMaster:true,memberships:[{...secondMembership,sessionIds:['s3','s4'],adventureIds:['a3','a4']},{...firstMembership,sessionIds:['s1','s2'],adventureIds:['a1','a2']}]},storage);
assert.equal(storage.writes,1,'A mesma sessão semântica não pode ser regravada só por ordem/timestamp.');
assert.equal(second.updatedAt,first.updatedAt,'Sessão idêntica deve preservar updatedAt e não gerar alteração falsa.');
assert.equal(readCollaborationSession(storage).updatedAt,first.updatedAt);

const realtime=fs.readFileSync(new URL('../scripts/collaboration-realtime.js',import.meta.url),'utf8');
const view=fs.readFileSync(new URL('../scripts/collaboration-view.js',import.meta.url),'utf8');
const hubUx=fs.readFileSync(new URL('../scripts/hub-ux.js',import.meta.url),'utf8');
const sheet=fs.readFileSync(new URL('../ficha-personagem.html',import.meta.url),'utf8');

assert.ok(realtime.includes('sessionComparable()'),'Realtime deve comparar apenas o estado semântico da sessão.');
assert.equal(realtime.includes('persistAuthenticatedAccount([])'),false,'Bootstrap não pode zerar memberships antes do pull.');
assert.ok(realtime.includes("collaboration-view.js?v=20260917-master-full-control1"),'Realtime deve carregar a sessão idempotente sem cache antigo.');
assert.ok(view.includes('sameSession(current,base)'),'Persistência da sessão deve ser idempotente.');
assert.ok(hubUx.includes("collaboration-realtime.js?v=20260918-no-page-reload1"),'Hub deve carregar a revisão realtime atual, preservando a correção anti-loop.');
assert.ok(sheet.includes('scripts/hub-ux.js?v=20260918-no-page-reload1'),'Ficha deve forçar a revisão corrigida no navegador.');
const autosave=fs.readFileSync(new URL('../scripts/character-sheet-autosave.js',import.meta.url),'utf8');
const sheetJs=fs.readFileSync(new URL('../scripts/character-sheet.js',import.meta.url),'utf8');
assert.equal(realtime.includes('location.reload'),false,'Realtime global não pode recarregar a página.');
assert.equal(autosave.includes('location.reload'),false,'Autosave da ficha não pode recarregar a página.');
assert.ok(autosave.includes('hub-rpg:sheet-remote-refresh'),'Autosave deve solicitar atualização in-place da ficha.');
assert.ok(sheetJs.includes('refreshSheetFromRemote')&&sheetJs.includes('Ficha atualizada em tempo real.'),'Ficha deve redesenhar o personagem recebido sem reload.');

console.log('OK — abertura da ficha não transforma bootstrap/regravação de sessão em alteração remota e não entra em reload infinito.');
