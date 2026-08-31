import{state,arr,num,fold}from'./state.js';

const FEATURE_PATTERNS={
 fightingStyle:/^(fighting style|estilo de luta)$/,
 epicBoon:/^(epic boon|dadiva epica)$/
};

function featureName(feature){return fold(feature?.originalName||feature?.name||'')}
export function activeClassFeatures(klass,level){const current=Math.max(1,Math.min(20,num(level)||1));return arr(klass?.features).filter(feature=>num(feature?.level)<=current)}
export function hasClassFeature(klass,level,kind){const pattern=FEATURE_PATTERNS[kind];return!!pattern&&activeClassFeatures(klass,level).some(feature=>pattern.test(featureName(feature)))}

export function classFeatureFeatGrants(klass,level){
 const grants=[];
 if(hasClassFeature(klass,level,'fightingStyle'))grants.push({kind:'fightingStyle',key:'class-feature:fighting-style',choiceKey:'fightingStyle',label:'Estilo de Luta',source:'Classe · Estilo de Luta'});
 if(hasClassFeature(klass,level,'epicBoon'))grants.push({kind:'epicBoon',key:'class-feature:epic-boon',choiceKey:'epicBoon',label:'Dádiva Épica ou outro talento elegível',source:'Classe · nível 19 · Epic Boon'});
 return grants
}

function levelRequirement(feat){const match=fold(feat?.prereq||'').match(/nivel\s*(\d+)\+/);return match?num(match[1]):0}
function abilityRequirements(feat){const p=fold(feat?.prereq||''),out=[];for(const[pt,aliases]of Object.entries({Força:['forca','strength'],Destreza:['destreza','dexterity'],Constituição:['constituicao','constitution'],Inteligência:['inteligencia','intelligence'],Sabedoria:['sabedoria','wisdom'],Carisma:['carisma','charisma']}))if(aliases.some(alias=>p.includes(`${alias} 13+`)))out.push(pt);return out}
function trainedFromContext(context,token){const hay=fold([...(context?.classProficiencies||[]),...(context?.featArmorTraining||[])].join(' '));if(token==='escudo')return/shield|escudo/.test(hay)||!!context?.featShieldTraining;if(token==='armadura leve')return/light armor|armadura leve|all armor|todas as armaduras/.test(hay);if(token==='armadura media')return/medium armor|armadura media|all armor|todas as armaduras/.test(hay);if(token==='armadura pesada')return/heavy armor|armadura pesada|all armor|todas as armaduras/.test(hay);return false}

export function featEligibleForClassGrant(feat,grant,{klass=null,level=1,scores=null,classProficiencies=[],featArmorTraining=[],featShieldTraining=false}={}){
 if(!feat||!grant)return false;
 const current=Math.max(1,Math.min(20,num(level)||1));
 if(grant.kind==='fightingStyle')return feat.category==='Estilo de Luta'&&hasClassFeature(klass,current,'fightingStyle');
 if(grant.kind!=='epicBoon'||!hasClassFeature(klass,current,'epicBoon'))return false;
 if(levelRequirement(feat)>current)return false;
 const prereq=fold(feat.prereq||'');
 if(/fighting style|estilo de luta/.test(prereq)&&!hasClassFeature(klass,current,'fightingStyle'))return false;
 if((/conjuracao|spellcasting|magia de pacto|pact magic/.test(prereq))&&!klass?.spellAbility)return false;
 if(/treinamento com armadura leve|light armor training/.test(prereq)&&!trainedFromContext({classProficiencies,featArmorTraining,featShieldTraining},'armadura leve'))return false;
 if(/treinamento com armadura media|medium armor training/.test(prereq)&&!trainedFromContext({classProficiencies,featArmorTraining,featShieldTraining},'armadura media'))return false;
 if(/treinamento com armadura pesada|heavy armor training/.test(prereq)&&!trainedFromContext({classProficiencies,featArmorTraining,featShieldTraining},'armadura pesada'))return false;
 if(/treinamento com escudo|shield training/.test(prereq)&&!trainedFromContext({classProficiencies,featArmorTraining,featShieldTraining},'escudo'))return false;
 const abilities=abilityRequirements(feat);if(abilities.length&&scores&&!abilities.some(a=>num(scores?.[a])>=13))return false;
 return true
}

function currentClass(){return state.catalogs.classes.find(x=>x.id===state.c?.refs?.class)||null}
function choiceStore(){state.c.choices.classFeatureFeats=state.c.choices.classFeatureFeats||{};return state.c.choices.classFeatureFeats}
export function classFeatureFeatInstances(){
 if(!state.c?.choices)return[];const klass=currentClass(),level=num(state.c.choices.class?.level)||1,choices=choiceStore(),grants=classFeatureFeatGrants(klass,level),out=[];
 for(const grant of grants){const id=choices[grant.choiceKey],feat=state.catalogs.feats.find(x=>x.id===id);if(feat&&featEligibleForClassGrant(feat,grant,{klass,level}))out.push({key:grant.key,feat,source:grant.source,classFeatureGrant:grant})}
 return out
}
export function sanitizeClassFeatureFeatSelections(context={}){
 if(!state.c?.choices)return false;const klass=currentClass(),level=num(state.c.choices.class?.level)||1,grants=classFeatureFeatGrants(klass,level),allowed=new Map(grants.map(g=>[g.choiceKey,g])),choices=choiceStore();let changed=false;
 for(const key of Object.keys(choices))if(!allowed.has(key)){delete choices[key];changed=true}
 for(const[key,grant]of allowed){const id=choices[key];if(!id)continue;const feat=state.catalogs.feats.find(x=>x.id===id);if(!featEligibleForClassGrant(feat,grant,{klass,level,...context})){delete choices[key];changed=true}}
 return changed
}
export function eligibleClassFeatureFeats(grant,context={}){const klass=context.klass||currentClass(),level=context.level??state.c?.choices?.class?.level??1;return state.catalogs.feats.filter(feat=>featEligibleForClassGrant(feat,grant,{klass,level,...context}))}
