const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const slug=row=>String(row?.refId||row?.data?.id||'').split(':').pop().toLowerCase();
const uniq=values=>[...new Set(values.filter(Boolean))];
const DAMAGE_TYPES=['Ácido','Frio','Fogo','Força','Elétrico','Necrótico','Veneno','Psíquico','Radiante','Trovejante','Concussão','Perfurante','Cortante'];
const damageTypesIn=text=>DAMAGE_TYPES.filter(type=>text.includes(fold(type)));

function semanticTraits(text){const traits=[];
 if(/classe de armadura|\bca\b/.test(text))traits.push('armor-class');
 if(/salvaguarda|teste de resistencia/.test(text))traits.push('saving-throw');
 if(/teste de habilidade|ability check|pericia|furtividade|percepcao|investigacao|atletismo|acrobacia|prestidigitacao/.test(text))traits.push('ability-check');
 if(/forca|destreza|constituicao|inteligencia|sabedoria|carisma/.test(text))traits.push('ability-score');
 if(/resistencia a dano|resistance to/.test(text))traits.push('damage-resistance');
 if(/imunidade|immune|imune/.test(text))traits.push('immunity');
 if(/vulnerabilidade|vulnerable/.test(text))traits.push('vulnerability');
 if(/deslocamento|velocidade|speed|voo|voar|natação|natacao|escalada|escalar/.test(text))traits.push('movement');
 if(/visao no escuro|darkvision|visao verdadeira|truesight|visao cega|blindsight/.test(text))traits.push('sense');
 if(/vantagem|desvantagem|advantage|disadvantage/.test(text))traits.push('advantage-state');
 if(/jogada de ataque|attack roll|dano|damage/.test(text))traits.push('attack-or-damage');
 if(/conjura|conjurar|cast|magia|spell/.test(text))traits.push('spell-access');
 if(/carga|charges?/.test(text))traits.push('resource-charges');
 if(/acao bonus|bonus action/.test(text))traits.push('bonus-action-option');
 if(/reacao|reaction/.test(text))traits.push('reaction-option');
 if(/realizar uma acao|take an action|acao magia|magic action/.test(text))traits.push('action-option');
 if(/invisivel|invisibility|etéreo|etereo|ethereal|gasoso|gaseous|transform/.test(text))traits.push('ongoing-form');
 if(/respirar|breath|idioma|language|telepat/.test(text))traits.push('communication-or-environment');
 if(/cura|healing|pontos de vida|hit point|dado de vida|hit die/.test(text))traits.push('healing-or-hp');
 if(/profici|training/.test(text))traits.push('proficiency');
 if(/aura|raio de|radius/.test(text))traits.push('aura');
 return uniq(traits.length?traits:['ongoing-item-state'])
}

function addFlag(outcome,key,value=true){outcome.flags[key]=value}
function addApplied(outcome,id,effect,value){outcome.applied.push({id,effect,value})}

export function applyGenericMagicItemPersistentContract(outcome,usage){
 const row=usage?.row,item=row?.data||null,id=slug(row);if(!id)return false;
 const text=fold(`${item?.bloco||row?.block||row?.category||''} ${item?.bloco_original||''} ${item?.descricao||row?.description||''}`),traits=semanticTraits(text),active=!!(usage.active||usage.equipped||usage.attuned);
 if(!active)return false;
 const contract={id,sourceId:item?.id||row?.refId||id,traits,requiresAttunement:/sintoniza|attunement/.test(text),equipped:!!usage.equipped,attuned:!!usage.attuned,active:!!usage.active,damageTypes:damageTypesIn(text),catalogBacked:!!item};
 outcome.contracts=outcome.contracts||[];outcome.contracts.push(contract);
 outcome.flags.persistentContracts={...(outcome.flags.persistentContracts||{}),[id]:contract};

 // Efeitos simples e inequívocos que alteram a derivação ou expõem um estado mecânico persistente já no Bloco 10.
 const simple={
  'cloak-of-protection':{ac:1,save:1},'ring-of-protection':{ac:1,save:1},'bracers-of-defense':{conditionalAc:2},
  'gauntlets-of-ogre-power':{ability:['Força',19]},'headband-of-intellect':{ability:['Inteligência',19]},
  'brooch-of-shielding':{resistance:['Força'],flags:['magicMissileDamageImmunity']},
  'boots-of-the-winterlands':{resistance:['Frio'],flags:['ignoreIceSnowDifficultTerrain','extremeColdTolerance']},
  'goggles-of-night':{flags:['darkvision60']},'cloak-of-the-manta-ray':{swim:60,flags:['breatheUnderwater']},
  'ring-of-swimming':{swim:40},'ring-of-free-action':{flags:['freeActionMovementProtection']},
  'mantle-of-spell-resistance':{flags:['advantageOnSavesAgainstSpells']},
  'periapt-of-health':{flags:['diseaseImmunity']},'periapt-of-proof-against-poison':{resistance:['Veneno'],flags:['poisonedConditionImmunity']},
  'boots-of-elvenkind':{flags:['silentSteps','advantageOnStealthChecks']},
  'eyes-of-minute-seeing':{flags:['advantageOnCloseInvestigationChecks']},'eyes-of-the-eagle':{flags:['advantageOnSightPerceptionChecks']},
  'boots-of-striding-and-springing':{flags:['walkingSpeedMinimum30','jumpDistanceTripled']},
  'gloves-of-thievery':{flags:['sleightAndLockpickBonus5']},'bracers-of-archery':{flags:['shortbowLongbowTraining','rangedBowDamageBonus2']},
  'necklace-of-adaptation':{flags:['breatheNormallyAnyEnvironment','advantageAgainstHarmfulGases']},
  'cloak-of-displacement':{flags:['attacksAgainstHaveDisadvantageWhileDisplacementActive']},
  'cloak-of-elvenkind':{flags:['advantageOnStealthChecks','disadvantageOnPerceptionChecksToSeeWearer']},
  'sentinel-shield':{flags:['advantageOnInitiative','advantageOnPerceptionChecks']},
  'spellguard-shield':{flags:['advantageOnSavesAgainstSpells','spellAttacksAgainstHaveDisadvantage']},
  'weapon-of-warning':{flags:['advantageOnInitiative','cannotBeSurprisedWhileWarningWeaponAvailable']},
  'ring-of-warmth':{resistance:['Frio'],flags:['extremeColdTolerance']},
  'ring-of-water-walking':{flags:['canStandAndMoveOnLiquidSurfaces']},
  'ring-of-feather-falling':{flags:['automaticFeatherFallWhileFalling']},
  'ring-of-mind-shielding':{flags:['thoughtReadingBlocked','alignmentDetectionBlocked','creatureTypeDetectionBlocked']},
  'gloves-of-swimming-and-climbing':{flags:['swimAndClimbWithoutExtraMovementCost']},
  'slippers-of-spider-climbing':{flags:['spiderClimbWhileHandsFree']},
  'boots-of-levitation':{flags:['levitationAvailableWhileWorn']},
  'winged-boots':{flags:['flyingMovementAvailable']},
  'cloak-of-arachnida':{flags:['climbSpeedEqualWalking','spiderClimb','webMovementUnrestricted']}
 }[id];
 if(simple){
  if(simple.ac)outcome.acBonus+=simple.ac;if(simple.save)outcome.savingThrowBonus+=simple.save;
  if(simple.ability){const[a,v]=simple.ability;outcome.abilityMinimums[a]=Math.max(Number(outcome.abilityMinimums[a]||0),v)}
  if(simple.resistance)outcome.resistances.push(...simple.resistance);
  if(simple.swim)outcome.movementModes={...(outcome.movementModes||{}),swim:Math.max(Number(outcome.movementModes?.swim||0),simple.swim)};
  for(const flag of simple.flags||[])addFlag(outcome,flag,true);
  if(simple.conditionalAc)outcome.conditionalAcBonuses=[...(outcome.conditionalAcBonuses||[]),{id,value:simple.conditionalAc,condition:'sem-armadura-e-sem-escudo'}];
  addApplied(outcome,id,'persistent-contract',contract);return true
 }

 // Famílias que exigem escolha de variante. A implementação permanece fail-closed até a escolha existir na Ficha.
 if(['belt-of-giant-strength','ioun-stone','ring-of-resistance','potion-of-resistance','dragon-scale-mail','shield-1-2-or-3','wand-of-the-war-mage-1-2-or-3'].includes(id)){
  outcome.pending.push({id,type:'parameter',reason:'Este item possui variante mecânica; registre a variante no estado da Ficha antes de aplicar seu modificador.'});return true
 }

 // Para efeitos cujo impacto final ocorre em uma jogada, ação, reação, alvo, carga ou duração,
 // o estado persistente fica estruturado aqui e a resolução matemática/consumo é responsabilidade do Bloco 11.
 addApplied(outcome,id,'persistent-contract',contract);return true
}
