import{KEY as CHARACTER_KEY,LEGACY_KEYS as CHARACTER_LEGACY_KEYS}from'./character-builder/state.js';
import{CAMPAIGN_KEY}from'./campaign-state.js?v=20260902-encounters1';
import{ADVENTURE_KEY}from'./adventure-state.js?v=20260902-adventures1';
import{SETTINGS_KEY,SETTINGS_SCHEMA}from'./settings-state.js?v=20260905-settings1';

export const ENCOUNTER_TARGET_KEY='hub-rpg:encounter-target:v1';
export const COLLAB_CACHE_KEY='hub-rpg:collaboration-cache:v1';
export const COLLAB_SESSION_KEY='hub-rpg:collaboration-session:v1';
export const STORAGE_REGISTRY=Object.freeze([
 {id:'characters',key:CHARACTER_KEY,legacyKeys:[...CHARACTER_LEGACY_KEYS],scope:'durable',portable:false,schema:'hub-rpg/personagem/v4',label:'Personagens'},
 {id:'campaigns',key:CAMPAIGN_KEY,legacyKeys:[],scope:'durable',portable:false,schema:'hub-rpg/campaign/v1',label:'Campanhas e Sessões'},
 {id:'adventures',key:ADVENTURE_KEY,legacyKeys:[],scope:'durable',portable:false,schema:'hub-rpg/adventure/v1',label:'Aventuras'},
 {id:'settings',key:SETTINGS_KEY,legacyKeys:[],scope:'durable',portable:false,schema:SETTINGS_SCHEMA,label:'Configurações locais'},
 {id:'encounter-target',key:ENCOUNTER_TARGET_KEY,legacyKeys:[],scope:'transient',portable:false,schema:null,label:'Alvo transitório de Encontro'},
 {id:'collaboration-cache',key:COLLAB_CACHE_KEY,legacyKeys:[],scope:'cache',portable:false,schema:'hub-rpg/collaboration-cache/v1',label:'Cache regenerável da colaboração remota'},
 {id:'collaboration-session',key:COLLAB_SESSION_KEY,legacyKeys:[],scope:'transient',portable:false,schema:'hub-rpg/collaboration-session/v1',label:'Conta conectada da colaboração'}
]);
export const PORTABLE_STORAGE=[];
export const TRANSIENT_STORAGE=STORAGE_REGISTRY.filter(row=>row.scope==='transient');
export const RECOVERY_STORAGE=[];
export const CLASSIFIED_STORAGE_KEYS=new Set(STORAGE_REGISTRY.flatMap(row=>[row.key,...row.legacyKeys]));
export function storageRecord(id){return STORAGE_REGISTRY.find(row=>row.id===id)||null}