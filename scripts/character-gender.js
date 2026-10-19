/** Concordância de IDENTIDADE do personagem, sem alterar nomes normativos ou regras.
 * Não transforme textos narrativos nem todos os finais -o/-a do Hub. */
const fold=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const GENDERS=new Set(['Masculino','Feminino','Outro']);
export function normalizeCharacterGender(value){
 const key=fold(value);
 return ({masculino:'Masculino',masculo:'Masculino',male:'Masculino',feminino:'Feminino',female:'Feminino',outro:'Outro',other:'Outro'}[key])||'';
}
export function characterGender(character){return normalizeCharacterGender(character?.sheet?.profile?.gender)}
export const CHARACTER_GENDER_OPTIONS=['Feminino','Masculino','Outro'];
/* Masculino, feminino, outra forma terminada em e (quando há flexão).
 * Invariáveis são mantidos e formas irregulares são explícitas. */
const classForms=[
 ['Bárbaro','Bárbara','Bárbare'],['Bardo','Barda','Barde'],
 ['Clérigo','Clériga','Clérigue'],['Druida','Druida','Druide'],
 ['Guerreiro','Guerreira','Guerreire'],['Monge','Monja','Monge'],
 ['Paladino','Paladina','Paladine'],['Patrulheiro','Patrulheira','Patrulheire'],
 ['Ladino','Ladina','Ladine'],['Feiticeiro','Feiticeira','Feiticeire'],
 ['Bruxo','Bruxa','Bruxe'],['Mago','Maga','Mage'],
 ['Artífice','Artífice','Artífice']
];
const speciesForms=[
 ['Elfo','Elfa','Elfe'],['Anão','Anã','Anãe'],['Gnomo','Gnoma','Gnome'],
 ['Humano','Humana','Humane'],['Draconato','Draconata','Draconate'],
 ['Meio-Elfo','Meia-Elfa','Meie-Elfe'],['Meio-Orc','Meia-Orca','Meie-Orque'],
 ['Orc','Orca','Orque'],['Metamorfo','Metamorfa','Metamorfe'],
 ['Transmorfo','Transmorfa','Transmorfe'],
 ['Forjado Bélico','Forjada Bélica','Forjade Bélique'],
 ['Golias','Golias','Golias'],['Halfling','Halfling','Halfling'],
 ['Tiefling','Tiefling','Tiefling'],['Kalashtar','Kalashtar','Kalashtar'],
 ['Khoravar','Khoravar','Khoravar'],['Gárgula','Gárgula','Gárgula'],
 ['Medusa','Medusa','Medusa'],['Harpia','Harpia','Harpia'],
 ['Worg','Worg','Worg'],['Gnoll','Gnoll','Gnoll']
];
const backgroundForms=[
 ['Acólito','Acólita','Acólite'],['Soldado','Soldada','Soldade'],
 ['Sábio','Sábia','Sábie'],['Criminoso','Criminosa','Criminose'],
 ['Charlatão','Charlatã','Charlatãe'],['Eremita','Eremita','Eremite'],
 ['Marinheiro','Marinheira','Marinheire'],['Nobre','Nobre','Nobre'],
 ['Artista','Artista','Artiste'],['Artesão','Artesã','Artesãe'],
 ['Forasteiro','Forasteira','Forasteire'],['Órfão','Órfã','Órfãe'],
 ['Herói','Heroína','Heroíne'],['Fazendeiro','Fazendeira','Fazendeire']
];
const tables={
 class:new Map(classForms.flatMap(forms=>forms.map(form=>[fold(form),forms]))),
 species:new Map(speciesForms.flatMap(forms=>forms.map(form=>[fold(form),forms]))),
 background:new Map(backgroundForms.flatMap(forms=>forms.map(form=>[fold(form),forms]))),
 subclass:new Map()
};
const suffixInvariants=new Set(['halfling','tiefling','orc','gnoll','goliath','warforged','aasimar','tabaxi','shifter','gargula','medusa','harpia','nobre','monge','artifice']);
function safeRoleFallback(value,gender){
 // Somente rótulos pessoais simples, nunca nomes de aventuras, títulos,
 // termos normativos em descrições nem frases com artigos/preposições.
 const name=String(value||'').trim(),key=fold(name);
 if(!name||!gender||suffixInvariants.has(key)||name.includes(' ')||name.includes('-'))return name;
 if(gender==='Feminino'&&/o$/i.test(name))return name.slice(0,-1)+'a';
 if(gender==='Outro'&&/[oa]$/i.test(name))return name.slice(0,-1)+'e';
 return name
}
export function genderedCharacterTerm(value,gender,kind='class'){
 const name=String(value??'').trim(),g=normalizeCharacterGender(gender);
 if(!name||!g)return name;
 const forms=tables[kind]?.get(fold(name));
 if(forms)return forms[g==='Feminino'?1:g==='Outro'?2:0];
 if(kind==='class'||kind==='species'||kind==='background')return safeRoleFallback(name,g);
 return name
}
export function characterIdentity(character,{includeName=true,includeClass=true,includeSpecies=true,includeBackground=false,includeLevel=true,levelPrefix='lvl'}={}){
 if(!character)return'';
 const refs=character.refSnapshots||{},gender=characterGender(character);
 const klass=refs.class?.name||'',species=refs.species?.name||'';
 const level=Number(character.choices?.class?.level)||0;
 const bits=[];
 if(includeName)bits.push(character.name||'Personagem sem nome');
 if(includeClass&&klass)bits.push(genderedCharacterTerm(klass,gender,'class')+(includeLevel&&level?' '+levelPrefix+' '+level:''));
 if(includeSpecies&&species)bits.push(genderedCharacterTerm(species,gender,'species'));
 if(includeBackground&&refs.background?.name)bits.push(genderedCharacterTerm(refs.background.name,gender,'background'));
 return bits.join(' · ')
}
