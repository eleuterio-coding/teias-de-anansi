import assert from'node:assert/strict';
import fs from'node:fs';
import{ARTISAN_TOOLS,MUSICAL_INSTRUMENTS,classToolOutcome,classToolRule,sanitizeClassToolChoices}from'../scripts/character-builder/class-tool-mechanics.js';

const klass=slug=>({slug});
assert.equal(ARTISAN_TOOLS.length,17,'A lista normativa deve conter 17 tipos de Ferramentas de Artesão.');
assert.equal(MUSICAL_INSTRUMENTS.length,10,'A lista normativa deve conter 10 Instrumentos Musicais do catálogo core.');
assert.equal(new Set([...ARTISAN_TOOLS,...MUSICAL_INSTRUMENTS]).size,27,'As opções de ferramentas de artesão e instrumentos não podem colidir.');

const bard=classToolRule(klass('bard'));
assert.equal(bard.fixed.length,0);
assert.equal(bard.choices.length,1);
assert.equal(bard.choices[0].choose,3,'Bardo deve escolher 3 Instrumentos Musicais.');
assert.deepEqual(bard.choices[0].options,MUSICAL_INSTRUMENTS);
let out=classToolOutcome(klass('bard'),{'musical-instruments':['Flauta','Alaúde','Lira','Tambor']});
assert.deepEqual(out.selected,['Flauta','Alaúde','Lira'],'Bardo deve limitar a escolha a 3 instrumentos.');
assert.equal(out.complete,true);

out=classToolOutcome(klass('druid'),{});
assert.deepEqual(out.tools,['Kit de Herbalismo'],'Druida deve receber Kit de Herbalismo automaticamente.');
assert.equal(out.complete,true);

const monk=classToolRule(klass('monk'));
assert.equal(monk.choices[0].choose,1,'Monge deve escolher uma ferramenta de artesão ou instrumento musical.');
assert.equal(monk.choices[0].options.length,27);
out=classToolOutcome(klass('monk'),{'artisan-or-instrument':['Viola']});
assert.deepEqual(out.tools,['Viola']);
assert.equal(out.complete,true);

out=classToolOutcome(klass('rogue'),{});
assert.deepEqual(out.tools,['Ferramentas de Ladrão'],'Ladino deve receber Ferramentas de Ladrão automaticamente.');

const artificer=classToolRule(klass('artificer'));
assert.deepEqual(artificer.fixed,['Ferramentas de Ladrão','Ferramentas de Funileiro']);
assert.equal(artificer.choices[0].choose,1,'Artífice deve escolher uma Ferramenta de Artesão além das fixas.');
assert.ok(!artificer.choices[0].options.includes('Ferramentas de Funileiro'),'A escolha do Artífice não deve permitir duplicar Ferramentas de Funileiro já concedidas.');
out=classToolOutcome(klass('artificer'),{'artisan-tools':['Ferramentas de Ferreiro']});
assert.deepEqual(out.tools,['Ferramentas de Ladrão','Ferramentas de Funileiro','Ferramentas de Ferreiro']);

const dirty={'musical-instruments':['Flauta','Flauta','Ferramenta inexistente']};
assert.deepEqual(sanitizeClassToolChoices(klass('bard'),dirty),{'musical-instruments':['Flauta']},'Escolhas inválidas/duplicadas devem ser removidas.');

const rules=fs.readFileSync('scripts/character-builder/rules.js','utf8');
const ui=fs.readFileSync('scripts/character-builder/class-tool-ui.js','utf8');
const skillUi=fs.readFileSync('scripts/character-builder/class-skill-ui.js','utf8');
assert.match(rules,/classToolOutcome/,'Motor principal não integra ferramentas de Classe.');
assert.match(rules,/d\.tools=uniq\(\[\.\.\.arr\(d\.tools\),\.\.\.outcome\.tools\]\)/,'Ferramentas de Classe não chegam ao resultado derivado.');
assert.match(skillUi,/initClassToolUi\(\)/,'UI de ferramentas de Classe não é inicializada pela etapa de Classe.');
assert.match(ui,/data-class-tool-group/,'UI não materializa grupos de escolha de ferramentas.');
assert.match(ui,/data-class-tool-pending/,'Escolhas obrigatórias de ferramenta não entram nas pendências da criação.');

console.log('Ferramentas de Classe validadas: Bardo, Druida, Monge, Ladino e Artífice com escolhas/fixas separadas das perícias.');
