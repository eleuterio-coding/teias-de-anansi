export const SPELL_CLASS_POLICIES={
 bard:{leveledMode:'level-progression',cantripMode:'level-progression',spellChange:'level-up-one',cantripChange:'level-up-one',preparedChange:'level-up-one',label:'Magias preparadas'},
 sorcerer:{leveledMode:'level-progression',cantripMode:'level-progression',spellChange:'level-up-one',cantripChange:'level-up-one',preparedChange:'level-up-one',label:'Magias preparadas'},
 warlock:{leveledMode:'level-progression',cantripMode:'level-progression',spellChange:'level-up-one',cantripChange:'level-up-one',preparedChange:'level-up-one',label:'Magias de Pact Magic',pactMagic:true,mysticArcanum:true},
 wizard:{leveledMode:'spellbook-progression',cantripMode:'current-list',spellChange:'none',cantripChange:'long-rest-one',preparedChange:'long-rest-all',label:'Magias no grimório',preparedPool:'spellbook',memorizeSpellLevel:5},
 cleric:{leveledMode:'current-list',cantripMode:'level-progression',spellChange:'none',cantripChange:'level-up-one',preparedChange:'long-rest-all',label:'Magias preparadas',preparedPool:'class'},
 druid:{leveledMode:'current-list',cantripMode:'level-progression',spellChange:'none',cantripChange:'level-up-one',preparedChange:'long-rest-all',label:'Magias preparadas',preparedPool:'class'},
 paladin:{leveledMode:'current-list',cantripMode:'none',spellChange:'none',cantripChange:'none',preparedChange:'long-rest-one',label:'Magias preparadas',preparedPool:'class'},
 ranger:{leveledMode:'current-list',cantripMode:'none',spellChange:'none',cantripChange:'none',preparedChange:'long-rest-one',label:'Magias preparadas',preparedPool:'class'},
 artificer:{leveledMode:'current-list',cantripMode:'current-list',spellChange:'none',cantripChange:'long-rest-one',preparedChange:'long-rest-all',label:'Magias preparadas',preparedPool:'class'}
};

const DEFAULT={leveledMode:'none',cantripMode:'none',spellChange:'none',cantripChange:'none',preparedChange:'none',label:'Magias'};
export const spellClassPolicy=klass=>SPELL_CLASS_POLICIES[klass?.slug]||DEFAULT;
export const usesLeveledProgression=klass=>['level-progression','spellbook-progression'].includes(spellClassPolicy(klass).leveledMode);
export const usesCurrentLeveledList=klass=>spellClassPolicy(klass).leveledMode==='current-list';
export const usesCantripProgression=klass=>spellClassPolicy(klass).cantripMode==='level-progression';
export const usesCurrentCantripList=klass=>spellClassPolicy(klass).cantripMode==='current-list';
export const levelUpSpellSwap=klass=>spellClassPolicy(klass).spellChange==='level-up-one';
export const levelUpCantripSwap=klass=>spellClassPolicy(klass).cantripChange==='level-up-one';

export function preparedChangeText(klass){
 const p=spellClassPolicy(klass);
 if(p.preparedChange==='level-up-one')return'Ao ganhar um nível nesta classe, você pode substituir 1 magia preparada por outra magia elegível.';
 if(p.preparedChange==='long-rest-one')return'Após um Descanso Longo, você pode substituir 1 magia preparada por outra magia elegível.';
 if(p.preparedChange==='long-rest-all')return'Após um Descanso Longo, você pode substituir qualquer quantidade de magias preparadas por outras magias elegíveis.';
 return'Consulte a característica de conjuração da classe para alterar esta lista.'
}

export function cantripChangeText(klass){
 const p=spellClassPolicy(klass);
 if(p.cantripChange==='level-up-one')return'Ao ganhar um nível nesta classe, você pode substituir 1 truque desta característica por outro truque elegível.';
 if(p.cantripChange==='long-rest-one')return'Após um Descanso Longo, você pode substituir 1 truque desta característica por outro truque elegível.';
 return''
}
