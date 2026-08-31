import fs from 'node:fs';

const path='dados/subclasses-mecanicas-tasha-2020.json';
const data=JSON.parse(fs.readFileSync(path,'utf8'));
const getSubclass=name=>{
 const row=data.subclasses?.find(x=>x.nome===name);
 if(!row)throw new Error(`Subclasse não encontrada: ${name}`);
 return row;
};
const getFeature=(subclass,name)=>{
 const row=getSubclass(subclass).progressao?.find(x=>x.nome===name);
 if(!row)throw new Error(`Característica não encontrada: ${subclass} / ${name}`);
 return row;
};
const replace=(subclass,feature,expected,newText)=>{
 const row=getFeature(subclass,feature);
 if(row.descricao!==expected)throw new Error(`Descrição inesperada em ${subclass} / ${feature}. Abortando migração.`);
 row.descricao=newText;
};

replace(
 'Circle of Wildfire','Cauterizing Flames',
 'Quando criatura Small ou maior morre a 30 pés, pode usar Reação para criar chama espectral no espaço por 1 minuto. Quando criatura entra no espaço, pode fazê-la recuperar 2d10 + Sabedoria PV ou sofrer o mesmo valor de Fire. Usos = modificador de Sabedoria (mín. 1) por Descanso Longo.',
 'Quando uma criatura Small ou maior morre a até 30 pés de você ou do Wildfire Spirit, uma chama espectral surge no espaço do morto por 1 minuto. Quando uma criatura que você possa ver entra nesse espaço, você pode usar sua Reação para extinguir a chama e escolher fazê-la recuperar 2d10 + modificador de Sabedoria PV ou sofrer o mesmo valor de Fire. Usos dessa Reação = PB por Descanso Longo.'
);
replace(
 'The Genie','Sanctuary Vessel',
 'Ao entrar no Vessel pode levar até cinco criaturas voluntárias a 30 pés. Permanecer 10 minutos no interior pode completar Descanso Curto; criaturas que gastam Hit Dice ali recuperam PV adicionais iguais ao seu PB por dado gasto.',
 'Ao entrar no Vessel pode levar até cinco criaturas voluntárias que você veja a até 30 pés. Como Ação Bônus pode ejetar qualquer quantidade delas; todos são ejetados se você sair, morrer ou o Vessel for destruído. Quem permanecer ali por pelo menos 10 minutos recebe os benefícios de um Descanso Curto; se gastar qualquer Hit Die nesse descanso, adiciona seu PB uma única vez ao total de PV recuperados.'
);
replace(
 'Phantom','Ghost Walk',
 'Ação Bônus assume forma espectral por 10 minutos: Fly Speed 10 pés com Hover, ataques contra você têm Desvantagem e pode atravessar criaturas/objetos como Difficult Terrain, sofrendo dano se terminar dentro deles. 1/Descanso Longo ou reutiliza destruindo Soul Trinket.',
 'Ação Bônus assume forma espectral por 10 minutos: Fly Speed 10 pés com Hover, ataques contra você têm Desvantagem e pode atravessar criaturas/objetos como Difficult Terrain. Se terminar o turno dentro de criatura ou objeto, sofre 1d10 Force. Pode encerrar a forma como Ação Bônus; para ativá-la novamente, precisa concluir Descanso Longo ou destruir um Soul Trinket como parte da Ação Bônus de ativação.'
);
replace(
 'Way of the Astral Self','Awakened Astral Self',
 'Ação Bônus + 5 Ki manifesta forma completa por 10 minutos. Recebe +2 CA e, ao usar Attack, pode atacar três vezes com braços astrais em vez de duas.',
 'Ação Bônus + 5 Ki manifesta braços, visage e corpo astrais por 10 minutos; termina antes se ficar Incapacitated ou morrer. Recebe +2 CA. Quando usar a característica Extra Attack para atacar duas vezes, pode atacar três vezes em vez disso, desde que todos os ataques sejam feitos com os braços astrais.'
);
replace(
 'Order of Scribes','Master Scrivener',
 'Após Descanso Longo pode criar scroll mágico especial contendo uma magia de nível 1 ou 2 do spellbook; apenas você pode usá-lo e, ao fazê-lo, a magia funciona como se conjurada um nível acima. O scroll desaparece no próximo Descanso Longo. Também reduz pela metade tempo/custo de criar Spell Scrolls.',
 'Após Descanso Longo pode criar um scroll mágico especial com uma magia de nível 1 ou 2 do Awakened Spellbook que tenha tempo de conjuração de 1 Ação. Apenas você pode lê-lo; a magia conta como um nível acima e o scroll desaparece após ser usado ou no próximo Descanso Longo. Também reduz pela metade tempo e custo de criar Spell Scrolls.'
);
replace(
 'Order Domain',"Order's Wrath",
 'Quando causa Divine Strike em uma criatura, ela fica marcada até o início do seu próximo turno. A primeira vez que um aliado acerta a criatura marcada, o alvo sofre +2d8 Psychic e a marca termina.',
 'Quando causa o dano de Divine Strike a uma criatura no seu turno, pode amaldiçoá-la até o início do seu próximo turno. A próxima vez que um aliado acertar a criatura amaldiçoada com um ataque, ela sofre +2d8 Psychic e a maldição termina. Só pode amaldiçoar uma criatura dessa forma uma vez por turno.'
);

fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n','utf8');
console.log('Semântica Tasha 2020 corrigida em 6 características de alto risco.');
