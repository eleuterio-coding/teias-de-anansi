// Contrato inicial do Compêndio. Validação estrutural, não homologação.
export const schemaVersion = "hub-compendio/1.0";
export const categories = Object.freeze(["regras","classes","especies","magias","equipamentos","criaturas"]);
export const MAX_BYTES = 20 * 1024 * 1024;
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const text = value => typeof value === "string" && value.trim().length > 0;
const id = value => typeof value === "string" && /^[a-z0-9][a-z0-9._-]{0,127}$/.test(value);
const allowed = (value, keys) => Object.keys(value).every(key => keys.includes(key));
export function validateCompendium(data) {
  const errors = [];
  const fail = (path, message) => { if(errors.length < 100) errors.push(path + ": " + message); };
  if(!object(data)) return {valid:false,errors:["Raiz: objeto JSON obrigatório"],counts:{},importAllowed:false};
  if(!allowed(data,["schemaVersion","systems","publications","records"])) fail("Raiz","campos desconhecidos");
  if(data.schemaVersion !== schemaVersion) fail("schemaVersion","versão incompatível");
  for(const key of ["systems","publications","records"]) {
    if(!Array.isArray(data[key])) fail(key,"lista obrigatória");
  }
  if(errors.length) return {valid:false,errors,counts:{},importAllowed:false};
  const systems = new Set(), publications = new Map(), records = new Set();
  const counts = Object.fromEntries(categories.map(category=>[category,0]));
  for(const [i,s] of data.systems.entries()) {
    const p="systems["+i+"]";
    if(!object(s) || !allowed(s,["id","name","edition"]) || !id(s.id) || !text(s.name) || !text(s.edition)) {fail(p,"id, nome e edição obrigatórios");continue;}
    if(systems.has(s.id)) fail(p,"ID de sistema/edição duplicado");
    systems.add(s.id);
  }
  for(const [i,s] of data.publications.entries()) {
    const p="publications["+i+"]";
    if(!object(s) || !allowed(s,["id","systemId","title","source","rights"]) || !id(s.id) || !systems.has(s.systemId) || !text(s.title) || !text(s.source) || !text(s.rights)) {fail(p,"identidade, sistema, título, fonte e informação de direitos obrigatórios");continue;}
    const key=JSON.stringify([s.systemId,s.id]);
    if(publications.has(key)) fail(p,"publicação duplicada no sistema");
    publications.set(key,s);
  }
  for(const [i,r] of data.records.entries()) {
    const p="records["+i+"]";
    if(!object(r) || !allowed(r,["id","systemId","publicationId","category","title","visibility","locator","data"]) || !id(r.id) || !systems.has(r.systemId) || !publications.has(JSON.stringify([r.systemId,r.publicationId])) || !categories.includes(r.category) || !text(r.title) || !["master","shared"].includes(r.visibility) || !text(r.locator) || !object(r.data)) {fail(p,"registro inválido: identidade, categoria, visibilidade, origem e dados obrigatórios");continue;}
    const key=JSON.stringify([r.systemId,r.publicationId,r.category,r.id]);
    if(records.has(key)) fail(p,"identidade de registro duplicada");
    records.add(key);
    counts[r.category]++;
  }
  return {valid:errors.length===0,errors,counts,importAllowed:false};
}
export async function inspectCompendiumFile(file) {
  if(!file || typeof file.text!=="function") throw Error("Selecione um arquivo JSON.");
  if(file.size>MAX_BYTES) throw Error("Arquivo acima do limite de 20 MiB.");
  let data;
  try { data=JSON.parse(await file.text()); } catch { throw Error("JSON inválido ou ilegível."); }
  return validateCompendium(data);
}
