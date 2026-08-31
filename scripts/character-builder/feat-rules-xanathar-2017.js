import{AB}from'./state.js';

const ability=(options,extra={})=>({ability:{options,amount:1},...extra});

export const XANATHAR_2017_FEAT_RULES={
 'Bountiful Luck':{combatFlags:['bountifulLuckAllyReroll1']},
 'Dragon Fear':ability(['Força','Constituição','Carisma'],{combatFlags:['dragonFearReplaceBreath','dragonFearWisdomSave'] }),
 'Dragon Hide':ability(['Força','Constituição','Carisma'],{naturalArmorBase:13,unarmedDamage:'1d4 cortante + Força',combatFlags:['dragonHideRetractableClaws']}),
 'Drow High Magic':{fixedSpells:['Detect Magic','Levitate','Dispel Magic'],spellAbilityFixed:'Carisma',combatFlags:['detectMagicAtWill','levitateOnceLongRest','dispelMagicOnceLongRest']},
 'Dwarven Fortitude':ability(['Constituição'],{combatFlags:['dwarvenFortitudeSpendHitDieOnDodge']}),
 'Elven Accuracy':ability(['Destreza','Inteligência','Sabedoria','Carisma'],{combatFlags:['elvenAccuracyRerollAdvantageDie']}),
 'Fade Away':ability(['Destreza','Inteligência'],{combatFlags:['fadeAwayReactionInvisible','fadeAwayShortOrLongRest']}),
 'Fey Teleportation':ability(['Inteligência','Carisma'],{fixedSpells:['Misty Step'],spellAbilityFixed:'Inteligência',combatFlags:['mistyStepOnceShortOrLongRest']}),
 'Flames of Phlegethos':ability(['Inteligência','Carisma'],{combatFlags:['flamesOfPhlegethosRerollFireOnes','flamesOfPhlegethosAura']}),
 'Infernal Constitution':ability(['Constituição'],{fixedResistances:['Frio','Veneno'],combatFlags:['advantageSavesAgainstPoison']}),
 'Orcish Fury':ability(['Força','Constituição'],{combatFlags:['orcishFuryExtraWeaponDie','orcishFuryRelentlessReactionAttack']}),
 'Prodigy':{choices:[{id:'skill',type:'skill',label:'Proficiência em perícia',options:'all'},{id:'tool',type:'tools',count:1,label:'Proficiência em ferramenta'},{id:'expertise',type:'expertise',label:'Especialização',options:'proficient'}]},
 'Second Chance':ability(['Destreza','Constituição','Carisma'],{combatFlags:['secondChanceForceAttackReroll']}),
 'Squat Nimbleness':ability(['Força','Destreza'],{speedBonus:5,choices:[{id:'skill',type:'skill',label:'Proficiência atlética',options:['Acrobacia','Atletismo']}],combatFlags:['squatNimblenessEscapeGrappleAdvantage']}),
 'Wood Elf Magic':{fixedSpells:['Longstrider','Pass Without Trace'],spellAbilityFixed:'Sabedoria',choices:[{id:'cantrip',type:'spells',label:'Truque de Druida',count:1,level:0,spellClasses:['Druid','Druida']}],combatFlags:['woodElfMagicLongstriderOnceLongRest','woodElfMagicPassWithoutTraceOnceLongRest']}
};

export const XANATHAR_2017_FEAT_NAMES=Object.freeze(Object.keys(XANATHAR_2017_FEAT_RULES));
export const XANATHAR_2017_ABILITY_NAMES=Object.freeze([...AB]);