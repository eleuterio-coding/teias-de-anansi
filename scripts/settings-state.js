export const SETTINGS_KEY='hub-rpg:settings:v1';
export const SETTINGS_SCHEMA='hub-rpg/settings/v1';

export const SOURCE_AUTHORITIES=Object.freeze([
 {id:'oficial_atual',label:'Oficial atual (5.5e / 2024)',defaultEnabled:true},
 {id:'oficial_legado',label:'Oficial legado compatível',defaultEnabled:true},
 {id:'terceiro_compativel',label:'Terceiros compatíveis congelados na v1.0',defaultEnabled:true},
 {id:'regra_casa',label:'Regras da Casa — Teias de Anansi',defaultEnabled:true}
]);

export const HOUSE_RULE_PRESETS=Object.freeze([
 {id:'teias-v1',label:'Teias v1.0',description:'Pacote normativo congelado da v1.0, com as Regras da Casa validadas pelo Hub.'},
 {id:'mesa-personalizada',label:'Mesa personalizada',description:'Permite registrar nas Configurações quais Regras da Casa o Mestre pretende usar como perfil preferido. Não reescreve personagens já existentes.'}
]);

const FONT_SCALES=new Set(['normal','large','xlarge']);
const CONTRASTS=new Set(['standard','high']);
const MOTIONS=new Set(['system','reduce']);
const DENSITIES=new Set(['comfortable','compact']);
const WORKSPACES=new Set(['auto','jogador','mestre']);
const PRESETS=new Set(HOUSE_RULE_PRESETS.map(x=>x.id));
const text=v=>String(v??'').trim();
const bool=(v,fallback)=>typeof v==='boolean'?v:fallback;
const arr=v=>Array.isArray(v)?v:[];
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));

export function defaultSettings(){
 return{
  schema:SETTINGS_SCHEMA,
  workspace:'auto',
  sources:{enabled:SOURCE_AUTHORITIES.filter(x=>x.defaultEnabled).map(x=>x.id)},
  houseRules:{preset:'teias-v1',enabled:[]},
  sheet:{density:'comfortable',showSources:true,stickySections:true},
  accessibility:{fontScale:'normal',contrast:'standard',motion:'system'},
  campaignDefaults:{dmName:'',setting:'',system:'D&D 5.5e'},
  updatedAt:null
 }
}

export function normalizeSettings(input={}){
 const base=defaultSettings(),source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const sourceSettings=source.sources&&typeof source.sources==='object'?source.sources:{};
 const house=source.houseRules&&typeof source.houseRules==='object'?source.houseRules:{};
 const sheet=source.sheet&&typeof source.sheet==='object'?source.sheet:{};
 const accessibility=source.accessibility&&typeof source.accessibility==='object'?source.accessibility:{};
 const campaign=source.campaignDefaults&&typeof source.campaignDefaults==='object'?source.campaignDefaults:{};
 const allowedSources=new Set(SOURCE_AUTHORITIES.map(x=>x.id));
 const enabledSources=[...new Set(arr(sourceSettings.enabled).map(text).filter(x=>allowedSources.has(x)))];
 return{
  schema:SETTINGS_SCHEMA,
  workspace:WORKSPACES.has(source.workspace)?source.workspace:base.workspace,
  sources:{enabled:enabledSources.length?enabledSources:[...base.sources.enabled]},
  houseRules:{
   preset:PRESETS.has(house.preset)?house.preset:base.houseRules.preset,
   enabled:[...new Set(arr(house.enabled).map(text).filter(Boolean))]
  },
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
  campaignDefaults:{
   dmName:text(campaign.dmName),
   setting:text(campaign.setting),
   system:text(campaign.system)||base.campaignDefaults.system
  },
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

export function campaignDefaultsFromSettings(input){
 const settings=normalizeSettings(input);
 return{
  dmName:settings.campaignDefaults.dmName,
  setting:settings.campaignDefaults.setting,
  system:settings.campaignDefaults.system
 }
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
