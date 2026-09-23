const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

const NATIVE_LANGUAGE_ROWS=[
  [['Aarakocra'],['Comum','Primordial']],
  [['Aasimar'],['Comum','Celestial']],
  [['Air Genasi'],['Comum','Primordial']],
  [['Anão','Dwarf'],['Comum','Anão']],
  [['Bugbear'],['Comum','Goblin']],
  [['Centaur'],['Comum','Silvestre']],
  [['Draconato','Dragonborn'],['Comum','Dracônico']],
  [['Earth Genasi'],['Comum','Primordial']],
  [['Elfo','Elf'],['Comum','Élfico']],
  [['Fairy'],['Silvestre']],
  [['Firbolg'],['Comum','Gigante','Élfico']],
  [['Fire Genasi'],['Comum','Primordial']],
  [['Forjado Bélico','Warforged'],['Comum']],
  [['Gárgula','Gargoyle'],['Comum','Primordial']],
  [['Githyanki'],['Comum','Gith']],
  [['Githzerai'],['Comum','Gith']],
  [['Gnoll'],['Comum','Gnoll']],
  [['Gnomo','Gnome'],['Comum','Gnômico']],
  [['Goblin'],['Comum','Goblin']],
  [['Golias','Goliath'],['Comum','Gigante']],
  [['Halfling'],['Comum','Halfling']],
  [['Harengon'],['Comum','Silvestre']],
  [['Harpia','Harpy'],['Comum']],
  [['Hobgoblin'],['Comum','Goblin']],
  [['Humano','Human'],['Comum']],
  [['Kalashtar'],['Comum','Quori']],
  [['Kenku'],['Comum','Primordial']],
  [['Khoravar'],['Comum','Élfico']],
  [['Kobold'],['Comum','Dracônico']],
  [['Lizardfolk'],['Comum','Dracônico']],
  [['Medusa'],['Comum','Serpentine']],
  [['Meio-Elfo','Half-Elf'],['Comum','Élfico']],
  [['Meio-Orc','Half-Orc'],['Comum','Orc']],
  [['Metamorfo','Changeling'],['Comum']],
  [['Minotaur','Minotauro'],['Comum','Minotaur']],
  [['Orc'],['Comum','Orc']],
  [['Satyr','Sátiro'],['Comum','Silvestre']],
  [['Tabaxi'],['Comum']],
  [['Tiefling'],['Comum','Infernal']],
  [['Tortle'],['Comum']],
  [['Transmorfo','Shifter'],['Comum']],
  [['Triton'],['Comum','Primordial']],
  [['Water Genasi'],['Comum','Primordial']],
  [['Worg'],['Goblin']],
  [['Yuan-ti','Yuan-Ti'],['Comum','Serpentine']]
];

const BY_NAME=new Map;
for(const [names,languages] of NATIVE_LANGUAGE_ROWS)for(const name of names)BY_NAME.set(fold(name),languages);

export function nativeLanguagesForSpecies(name){
  return [...(BY_NAME.get(fold(name))||[])];
}

export function speciesNativeLanguageEntries(){
  return NATIVE_LANGUAGE_ROWS.map(([names,languages])=>({names:[...names],languages:[...languages]}));
}
