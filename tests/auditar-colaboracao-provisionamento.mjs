import assert from'node:assert/strict';
import fs from'node:fs';
const config=JSON.parse(fs.readFileSync(new URL('../dados/firebase-config.json',import.meta.url),'utf8'));
const required=['projectId','apiKey','authDomain','appId'],missing=required.filter(key=>!String(config[key]||'').trim());
assert.equal(config.enabled,true,'BLOQUEADO: Firebase ainda não está ativado em dados/firebase-config.json.');
assert.deepEqual(missing,[],`BLOQUEADO: configuração Firebase incompleta: ${missing.join(', ')}.`);
console.log(`OK — Bloco 15Z: provedor Firebase real configurado (${config.projectId}).`);
