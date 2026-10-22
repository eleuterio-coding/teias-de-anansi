// Comparações determinísticas para não regravar documentos sem mudanças.
export function canonicalJson(value){
 if(Array.isArray(value))return '['+value.map(item=>canonicalJson(item===undefined?null:item)).join(',')+']';
 if(value&&typeof value==='object'){
  if(typeof value.toJSON==='function')return canonicalJson(value.toJSON());
  return '{'+Object.keys(value).filter(key=>value[key]!==undefined).sort().map(key=>JSON.stringify(key)+':'+canonicalJson(value[key])).join(',')+'}';
 }
 return JSON.stringify(value)??'null';
}
export function samePersistedFields(stored,expected){
 if(!stored)return false;
 const clean={...stored};
 delete clean.serverUpdatedAt;
 return canonicalJson(clean)===canonicalJson(expected);
}
export function changedEntityIds(before=[],after=[]){
 const old=new Map((Array.isArray(before)?before:[]).filter(row=>row&&row.id!=null).map(row=>[String(row.id),row]));
 const next=new Map((Array.isArray(after)?after:[]).filter(row=>row&&row.id!=null).map(row=>[String(row.id),row]));
 const ids=new Set();
 for(const [id,value]of next)if(!old.has(id)||canonicalJson(old.get(id))!==canonicalJson(value))ids.add(id);
 for(const id of old.keys())if(!next.has(id))ids.add(id);
 return ids;
}
