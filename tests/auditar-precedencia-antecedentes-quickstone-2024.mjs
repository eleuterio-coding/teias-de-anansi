import fs from 'node:fs';
import assert from 'node:assert/strict';
import {backgroundPackageOptions,itemsCurrencyCp,STANDARD_BACKGROUND_PACKAGE_B_GP} from '../scripts/character-builder/starting-equipment-rules.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const bg=read('dados/antecedentes-pdf-quickstone-2024.json');
const feats=read('dados/talentos-quickstone-2024.json');
assert.equal(bg.controle.quantidade,2);
assert.deepEqual(bg.items.map(x=>x.nome).sort(),['Magewright','Wandslinger']);
assert.ok(!('migracao_forge_2025' in bg));
assert.ok(!('exclusoes' in feats));
for(const row of bg.items){
 assert.equal(row.talento,'Magic Initiate');
 const opts=backgroundPackageOptions({equipmentOptions:[],equipmentText:row.equipamento});
 assert.deepEqual(opts.map(x=>x.id),['A','B']);
 assert.equal(itemsCurrencyCp(opts[1].itens),STANDARD_BACKGROUND_PACKAGE_B_GP*100,`${row.nome}: pacote B deve ser 50 PO`);
}
console.log('Quickstone: apenas antecedentes e talentos permitidos; pacote B preservado.');
