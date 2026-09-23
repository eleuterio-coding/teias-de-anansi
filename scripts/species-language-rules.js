const fold=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

const NATIVE_LANGUAGE_ROWS=[
  [['Aarakocra'],['Common','Primordial']],
  [['Aasimar'],['Common','Celestial']],
  [['Air Genasi'],['Common','Primordial']],
  [['Anão','Dwarf'],['Common','Dwarvish']],
  [['Bugbear'],['Common','Goblin']],
  [['Centaur'],['Common','Sylvan']],
  [['Draconato','Dragonborn'],['Common','Draconic']],
  [['Earth Genasi'],['Common','Primordial']],
  [['Elfo','Elf'],['Common','Elvish']],
  [['Fairy'],['Sylvan']],
  [['Firbolg'],['Common','Giant','Elvish']],
  [['Fire Genasi'],['Common','Primordial']],
  [['Forjado Bélico','Warforged'],['Common']],
  [['Gárgula','Gargoyle'],['Common','Primordial']],
  [['Githyanki'],['Common','Gith']],
  [['Githzerai'],['Common','Gith']],
  [['Gnoll'],['Common','Gnoll']],
  [['Gnomo','Gnome'],['Common','Gnomish']],
  [['Goblin'],['Common','Goblin']],
  [['Golias','Goliath'],['Common','Giant']],
  [['Halfling'],['Common','Halfling']],
  [['Harengon'],['Common','Sylvan']],
  [['Harpia','Harpy'],['Common','Harpy']],
  [['Hobgoblin'],['Common','Goblin']],
  [['Humano','Human'],['Common']],
  [['Kalashtar'],['Common','Quori']],
  [['Kenku'],['Common','Primordial']],
  [['Khoravar'],['Common','Elvish']],
  [['Kobold'],['Common','Draconic']],
  [['Lizardfolk'],['Common','Draconic']],
  [['Medusa'],['Common','Serpentine']],
  [['Meio-Elfo','Half-Elf'],['Common','Elvish']],
  [['Meio-Orc','Half-Orc'],['Common','Orc']],
  [['Metamorfo','Changeling'],['Common']],
  [['Minotaur','Minotauro'],['Common','Minotaur']],
  [['Orc'],['Common','Orc']],
  [['Satyr','Sátiro'],['Common','Sylvan']],
  [['Tabaxi'],['Common']],
  [['Tiefling'],['Common','Infernal']],
  [['Tortle'],['Common','Aquan']],
  [['Transmorfo','Shifter'],['Common']],
  [['Triton'],['Common','Primordial']],
  [['Water Genasi'],['Common','Primordial']],
  [['Worg'],['Goblin']],
  [['Yuan-ti','Yuan-Ti'],['Common','Serpentine']]
];

const BY_NAME=new Map;
for(const [names,languages] of NATIVE_LANGUAGE_ROWS)for(const name of names)BY_NAME.set(fold(name),languages);

export function nativeLanguagesForSpecies(name){
  return [...(BY_NAME.get(fold(name))||[])];
}

export function speciesNativeLanguageEntries(){
  return NATIVE_LANGUAGE_ROWS.map(([names,languages])=>({names:[...names],languages:[...languages]}));
}
