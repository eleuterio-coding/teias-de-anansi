const ARTISAN_TOOLS=[
 'Suprimentos de Alquimista','Suprimentos de Cervejeiro','Suprimentos de Calígrafo','Ferramentas de Carpinteiro','Ferramentas de Cartógrafo','Ferramentas de Sapateiro','Utensílios de Cozinheiro','Ferramentas de Vidreiro','Ferramentas de Joalheiro','Ferramentas de Coureiro','Ferramentas de Pedreiro','Suprimentos de Pintor','Ferramentas de Oleiro','Ferramentas de Ferreiro','Ferramentas de Funileiro','Ferramentas de Tecelão','Ferramentas de Entalhador'
];
const MUSICAL_INSTRUMENTS=['Gaita de Foles','Tambor','Dulcimer','Flauta','Trompa','Alaúde','Lira','Flauta de Pã','Charamela','Viola'];
const RULES={
 bard:{fixed:[],choices:[{id:'musical-instruments',label:'Instrumentos musicais',choose:3,options:MUSICAL_INSTRUMENTS}]},
 druid:{fixed:['Kit de Herbalismo'],choices:[]},
 monk:{fixed:[],choices:[{id:'artisan-or-instrument',label:'Ferramenta de artesão ou instrumento musical',choose:1,options:[...ARTISAN_TOOLS,...MUSICAL_INSTRUMENTS]}]},
 rogue:{fixed:['Ferramentas de Ladrão'],choices:[]},
 artificer:{fixed:['Ferramentas de Ladrão','Ferramentas de Funileiro'],choices:[{id:'artisan-tools',label:'Ferramenta de artesão',choose:1,options:ARTISAN_TOOLS.filter(x=>x!=='Ferramentas de Funileiro')}]}
};
const arr=v=>Array.isArray(v)?v:[];
const uniq=a=>[...new Set(a.filter(Boolean))];
export{ARTISAN_TOOLS,MUSICAL_INSTRUMENTS};
export function classToolRule(klass){return RULES[klass?.slug]||{fixed:[],choices:[]}}
export function sanitizeClassToolChoices(klass,input={}){
 const rule=classToolRule(klass),clean={};
 for(const group of rule.choices){
  const values=uniq(arr(input?.[group.id]).filter(x=>group.options.includes(x))).slice(0,group.choose);
  if(values.length)clean[group.id]=values
 }
 return clean
}
export function classToolOutcome(klass,input={}){
 const rule=classToolRule(klass),choices=sanitizeClassToolChoices(klass,input),selected=rule.choices.flatMap(group=>arr(choices[group.id])),tools=uniq([...rule.fixed,...selected]),pending=rule.choices.filter(group=>arr(choices[group.id]).length<group.choose).map(group=>({id:group.id,label:group.label,remaining:group.choose-arr(choices[group.id]).length}));
 return{rule,choices,tools,fixed:[...rule.fixed],selected,pending,complete:pending.length===0}
}
