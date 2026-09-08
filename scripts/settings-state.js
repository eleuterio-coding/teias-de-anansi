export const SETTINGS_KEY='hub-rpg:settings:v1';
export const SETTINGS_SCHEMA='hub-rpg/settings/v1';

export const SOURCE_AUTHORITIES=Object.freeze([
 {id:'oficial_atual',label:'Oficial atual (5.5e / 2024)',defaultEnabled:true},
 {id:'oficial_legado',label:'Oficial legado compatível',defaultEnabled:true},
 {id:'terceiro_compativel',label:'Terceiros compatíveis congelados na v1.0',defaultEnabled:true},
 {id:'regra_casa',label:'Regras da Casa — Teias de Anansi',defaultEnabled:true}
]);

export const HOUSE_RULE_PRESETS=Object.freeze([
 {id:'teias-v1',label:'Teias v1.0',description:'Pacote normativo do Hub, sempre habilitado.'}
]);

const FONT_SCALES=new Set(['normal','large','xlarge']);
const CONTRASTS=new Set(['standard','high']);
const MOTIONS=new Set(['system','reduce']);
const DENSITIES=new Set(['comfortable','compact']);
const WORKSPACES=new Set(['auto','jogador','mestre']);
const text=v=>String(v??'').trim();
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const bool=(v,fallback)=>typeof v==='boolean'?v:fallback;
const ALL_SOURCES=Object.freeze(SOURCE_AUTHORITIES.map(x=>x.id));

export function defaultSettings(){
 return{
  schema:SETTINGS_SCHEMA,
  workspace:'auto',
  sources:{enabled:[...ALL_SOURCES]},
  houseRules:{preset:'teias-v1',enabled:[]},
  sheet:{density:'comfortable',showSources:true,stickySections:true},
  accessibility:{fontScale:'normal',contrast:'standard',motion:'system'},
  campaignDefaults:{dmName:'Rafael',setting:'',system:'D&D 5.5e'},
  updatedAt:null
 }
}

export function normalizeSettings(input={}){
 const base=defaultSettings(),source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const sheet=source.sheet&&typeof source.sheet==='object'?source.sheet:{};
 const accessibility=source.accessibility&&typeof source.accessibility==='object'?source.accessibility:{};
 return{
  schema:SETTINGS_SCHEMA,
  workspace:WORKSPACES.has(source.workspace)?source.workspace:base.workspace,
  sources:{enabled:[...ALL_SOURCES]},
  houseRules:{preset:'teias-v1',enabled:[]},
  sheet:{
   density:DENSITIES.has(sheet.density)?sheet.density:base.sheet.density,
   showSources:bool(sheet.showSources,base.sheet.showSources),
   stickySections:bool(sheet.stickySections,base.sheet.stickySections)
  },
  accessibility:{
   fontScale:FONT_SCALES.has(accessibility.fontScale)?accessibility.fontScale:base.accessibility.fontScale,
   contrast:CONTRASTS.has(accessibility.contrast)?accessibility.contrast:base.accessibility.contrast,
   motion:MOTIONS.has(accessibility.motion)?accessibility.motion:base.accessibility.motion
  },
  campaignDefaults:{dmName:'Rafael',setting:'',system:'D&D 5.5e'},
  updatedAt:text(source.updatedAt)||null
 }
}

export function readSettings(storage=globalThis.localStorage){
 if(!storage)return defaultSettings();
 try{return normalizeSettings(JSON.parse(storage.getItem(SETTINGS_KEY)||'{}'))}catch{return defaultSettings()}
}

export function writeSettings(next,storage=globalThis.localStorage,{timestamp=true}={}){
 const clean=normalizeSettings({...clone(next),updatedAt:timestamp?new Date().toISOString():next?.updatedAt});
 if(storage)storage.setItem(SETTINGS_KEY,JSON.stringify(clean));
 if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('hub-rpg:settings-changed',{detail:clean}));
 return clean
}

export function resetSettings(storage=globalThis.localStorage){
 if(storage)storage.removeItem(SETTINGS_KEY);
 const clean=defaultSettings();
 if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('hub-rpg:settings-changed',{detail:clean}));
 return clean
}

// Compatibilidade com módulos antigos: defaults de campanha não são configuráveis.
export function campaignDefaultsFromSettings(){
 return{dmName:'Rafael',setting:'',system:'D&D 5.5e'}
}

export function applyUiPreferences(input,root=globalThis.document?.documentElement){
 const settings=normalizeSettings(input);
 if(!root)return settings;
 root.dataset.hubFontScale=settings.accessibility.fontScale;
 root.dataset.hubContrast=settings.accessibility.contrast;
 root.dataset.hubMotion=settings.accessibility.motion;
 root.dataset.hubSheetDensity=settings.sheet.density;
 root.dataset.hubStickySections=String(settings.sheet.stickySections);
 root.dataset.hubShowSources=String(settings.sheet.showSources);
 return settings
}
