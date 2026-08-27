import{arr,num,fold,uniq,mod}from'./state.js';

const MANEUVER_RULES={
 'Ambush':{trigger:'Iniciativa ou Destreza (Furtividade)',effect:'Adiciona o dado de Superioridade à rolagem se não estiver Incapacitated.'},
 'Bait and Switch':{trigger:'Movimento, junto a criatura voluntária a 5 ft',effect:'Troca de lugar gastando 5 ft sem provocar OA; você ou a outra criatura recebe CA + dado de Superioridade até início do seu próximo turno.'},
 "Commander's Strike":{trigger:'Ação Attack',effect:'Abre mão de um ataque e usa Ação Bônus; aliado que vê/ouve usa Reação para atacar e adiciona o dado de Superioridade ao dano.'},
 'Commanding Presence':{trigger:'Intimidação, Atuação ou Persuasão',effect:'Adiciona o dado de Superioridade ao teste.'},
 'Disarming Attack':{trigger:'Acerto com ataque',effect:'Adiciona o dado de Superioridade ao dano; Strength save na falha faz largar um objeto segurado.'},
 'Distracting Strike':{trigger:'Acerto com ataque',effect:'Adiciona o dado de Superioridade ao dano; próximo ataque de outra criatura contra o alvo antes do seu próximo turno tem Vantagem.'},
 'Evasive Footwork':{trigger:'Ao mover-se',effect:'Rola Superioridade e soma o resultado à CA enquanto durar o movimento atual.'},
 'Feinting Attack':{trigger:'Ação Bônus, criatura a 5 ft',effect:'Gasta Superioridade para obter Vantagem no próximo ataque contra o alvo neste turno; se acertar, soma o dado ao dano.'},
 'Goading Attack':{trigger:'Acerto com ataque',effect:'Adiciona Superioridade ao dano; Wisdom save ou o alvo tem Desvantagem para atacar outros até fim do seu próximo turno.'},
 'Lunging Attack':{trigger:'Ataque corpo a corpo após mover 10 ft em linha reta',effect:'Amplia o alcance do ataque e, no acerto, adiciona o dado de Superioridade ao dano.'},
 'Maneuvering Attack':{trigger:'Acerto com ataque',effect:'Adiciona Superioridade ao dano; aliado que vê/ouve usa Reação para mover até metade do Speed sem OA do alvo acertado.'},
 'Menacing Attack':{trigger:'Acerto com ataque',effect:'Adiciona Superioridade ao dano; Wisdom save ou Frightened de você até fim do seu próximo turno.'},
 'Parry':{trigger:'Reação ao sofrer dano de ataque corpo a corpo',effect:'Reduz dano em Superioridade + modificador de Força ou Destreza.'},
 'Precision Attack':{trigger:'Quando um ataque erra',effect:'Rola Superioridade e adiciona ao ataque, podendo transformar o erro em acerto.'},
 'Pushing Attack':{trigger:'Acerto com ataque',effect:'Adiciona Superioridade ao dano; Strength save ou empurra alvo Large ou menor até 15 ft.'},
 'Rally':{trigger:'Ação Bônus',effect:'Aliado que vê/ouve recebe PV temporários = Superioridade + maior modificador entre Inteligência, Sabedoria e Carisma.'},
 'Riposte':{trigger:'Reação quando criatura erra ataque corpo a corpo contra você',effect:'Faz um ataque corpo a corpo; no acerto adiciona Superioridade ao dano.'},
 'Sweeping Attack':{trigger:'Acerto corpo a corpo',effect:'Escolhe segunda criatura a 5 ft do alvo e dentro do alcance; se o ataque original também a acertaria, ela sofre dano igual ao dado de Superioridade.'},
 'Tactical Assessment':{trigger:'Investigação, História ou Intuição',effect:'Adiciona o dado de Superioridade ao teste.'},
 'Trip Attack':{trigger:'Acerto com ataque',effect:'Adiciona Superioridade ao dano; Strength save ou alvo Large ou menor fica Prone.'}
};
const STYLE_RULES={
 'Archery':{kind:'attackBonus',value:2,scope:'ataques com armas à distância'},
 'Blind Fighting':{kind:'sense',sense:'Blindsight',range:10},
 'Defense':{kind:'acBonus',value:1,scope:'enquanto usa armadura'},
 'Dueling':{kind:'damageBonus',value:2,scope:'arma corpo a corpo empunhada em uma mão sem outra arma'},
 'Great Weapon Fighting':{kind:'damageFloor',value:3,scope:'dados de dano de arma corpo a corpo com duas mãos/Versatile usada com duas mãos; resultados 1–2 contam como 3'},
 'Interception':{kind:'reaction',scope:'reduzir dano de aliado a 5 ft atingido, enquanto empunha arma ou escudo'},
 'Protection':{kind:'reaction',scope:'com escudo, impor Desvantagem a ataque contra aliado a 5 ft'},
 'Thrown Weapon Fighting':{kind:'damageBonus',value:2,scope:'ataques à distância com armas que tenham propriedade Thrown'},
 'Two-Weapon Fighting':{kind:'lightWeapon',scope:'adiciona o modificador de atributo ao dano do ataque extra da propriedade Light'},
 'Unarmed Fighting':{kind:'unarmed',oneHand:'1d6',twoHands:'1d8',grapple:'1d4 no início do turno contra criatura Grappled por você'}
};
export function applyFighterSubclassRuleDetails(d){
 if(d?.klass?.slug!=='fighter'||!d.subclassMechanics)return d;const out=d.subclassMechanics,name=out.name;
 if(name==='Battle Master'){const dc=8+num(d.pbonus)+Math.max(mod(d.scores?.Força),mod(d.scores?.Destreza)),die=num(d.level)>=18?'d12':num(d.level)>=10?'d10':'d8';d.subclassManeuvers=arr(out.choices?.maneuvers).map(n=>({name:n,die,dc,...MANEUVER_RULES[n]})).filter(x=>x.effect)}
 if(name==='Champion'){d.subclassFightingStyleEffects=arr(out.fightingStyles).map(n=>({name:n,...STYLE_RULES[n]})).filter(x=>x.kind);for(const effect of d.subclassFightingStyleEffects){if(effect.kind==='sense')d.subclassSenses=uniq([...arr(d.subclassSenses),`${effect.sense} ${effect.range} ft`]);if(effect.kind==='damageBonus')d.subclassWeaponDamageModifiers=uniq([...arr(d.subclassWeaponDamageModifiers),effect]);if(effect.kind==='damageFloor')d.subclassWeaponDamageRules=uniq([...arr(d.subclassWeaponDamageRules),effect]);if(effect.kind==='reaction')d.subclassReactions=uniq([...arr(d.subclassReactions),effect]);if(effect.kind==='lightWeapon')d.subclassWeaponDamageRules=uniq([...arr(d.subclassWeaponDamageRules),effect]);if(effect.kind==='unarmed'){d.subclassUnarmedRules=effect;if(!d.unarmedDamage)d.unarmedDamage=`${effect.oneHand} ou ${effect.twoHands} + Força`}}
 }
 if(name==='Rune Knight')d.subclassRunes=arr(out.choices?.runes).map(r=>({name:r,dc:8+num(d.pbonus)+mod(d.scores?.Constituição),detail:out.summary.find(x=>x.name===r)?.value||''}));
 if(name==='Arcane Archer')d.subclassArcaneShots=arr(out.choices?.arcaneShots).map(s=>({name:s,dc:8+num(d.pbonus)+mod(d.scores?.Inteligência),detail:out.summary.find(x=>x.name===s)?.value||''}));
 if(name==='Tavern Brawler')d.subclassBrawlerTechniques=arr(out.summary).filter(x=>['Barroom Wrestler','Piledriver','Throw','Twisting Grapples','Uncanny Technique'].includes(x.name)).map(x=>({name:x.name,detail:x.value,dc:8+num(d.pbonus)+mod(d.scores?.Força)}));
 return d
}
