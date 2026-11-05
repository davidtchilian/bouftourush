import {tofuScaraItems,tofuScaraSets} from './tofuScara';
export type Stats={hp:number;power:number;cooldownReduction?:number;movementSpeed?:number};
export const slots=['hat','cape','amulet','ring1','ring2','belt','boots','weapon'] as const;
export type Slot=typeof slots[number];
export const slotNames:Record<Slot,string>={hat:'Coiffe',cape:'Cape',amulet:'Amulette',ring1:'Anneau 1',ring2:'Anneau 2',belt:'Ceinture',boots:'Bottes',weapon:'Arme'};
export type ItemDefinition={id:string;name:string;category:Slot|'ring';stats:Stats;set:string;icon:string};
/** Identités/icônes originales vérifiées dans items_fr_450.swf ; stats adaptées au fangame. */
export const items:Record<string,ItemDefinition>={
 '2411':{id:'2411',name:'Coiffe du Bouftou',category:'hat',stats:{hp:44,power:24},set:'bouftou',icon:'item.2411'},
 '2414':{id:'2414',name:'Cape Bouffante',category:'cape',stats:{hp:62,power:18},set:'bouftou',icon:'item.2414'},
 '2416':{id:'2416',name:'Marteau du Bouftou',category:'weapon',stats:{hp:24,power:36},set:'bouftou',icon:'item.2416'},
 '2419':{id:'2419',name:'Anneau de Bouze le Clerc',category:'ring',stats:{hp:30,power:14},set:'bouftou',icon:'item.2419'},
 '2422':{id:'2422',name:'Boufbottes',category:'boots',stats:{hp:42,power:16},set:'bouftou',icon:'item.2422'},
 '2425':{id:'2425',name:'Amulette du Bouftou',category:'amulet',stats:{hp:22,power:26},set:'bouftou',icon:'item.2425'},
 '2428':{id:'2428',name:'Ceinture du Bouftou',category:'belt',stats:{hp:56,power:16},set:'bouftou',icon:'item.2428'},
};
export const sets:Record<string,{name:string;thresholds:Record<number,Stats>}>= {bouftou:{name:'Panoplie du Bouftou',thresholds:{2:{hp:24,power:14},3:{hp:48,power:30},4:{hp:80,power:48},5:{hp:112,power:68},6:{hp:144,power:88},7:{hp:180,power:110}}}};
export const familyLoot=[{item:'2425',weight:4},{item:'2419',weight:4},{item:'2422',weight:3},{item:'2428',weight:3},{item:'2411',weight:2},{item:'2414',weight:2},{item:'2416',weight:2}];
// Icônes et noms confirmés dans la même table ; équipement de départ d'Incarnam.
Object.assign(items,{
 '2473':{id:'2473',name:'Cape de l’Aventurier',category:'cape',stats:{hp:18,power:4},set:'adventurer',icon:'item.2473'},
 '2474':{id:'2474',name:'Chapeau de l’Aventurier',category:'hat',stats:{hp:14,power:6},set:'adventurer',icon:'item.2474'},
 '2475':{id:'2475',name:'Anneau de l’Aventurier',category:'ring',stats:{hp:10,power:4},set:'adventurer',icon:'item.2475'},
 '2476':{id:'2476',name:'Bottes de l’Aventurier',category:'boots',stats:{hp:16,power:3},set:'adventurer',icon:'item.2476'},
 '2477':{id:'2477',name:'Ceinture de l’aventurier',category:'belt',stats:{hp:18,power:3},set:'adventurer',icon:'item.2477'},
 '2478':{id:'2478',name:'Amulette de l’Aventurier',category:'amulet',stats:{hp:8,power:6},set:'adventurer',icon:'item.2478'},
} satisfies Record<string,ItemDefinition>);
sets.adventurer={name:'Panoplie de l’Aventurier',thresholds:{2:{hp:12,power:5},3:{hp:22,power:9},4:{hp:32,power:14},5:{hp:44,power:19},6:{hp:56,power:24}}};
export const incarnamLoot=['2473','2474','2475','2476','2477','2478'].map(item=>({item,weight:1}));
Object.assign(items,{
 '8253':{id:'8253',name:'Amulette en Mousse',category:'amulet',stats:{hp:14,power:10,cooldownReduction:1},set:'mousse',icon:'item.8253'},
 '8254':{id:'8254',name:'Anneau en Mousse',category:'ring',stats:{hp:18,power:6,cooldownReduction:1},set:'mousse',icon:'item.8254'},
 '8255':{id:'8255',name:'Pelle en Mousse',category:'weapon',stats:{hp:10,power:10},set:'mousse',icon:'item.8255'},
 '8256':{id:'8256',name:'Bottes en Mousse',category:'boots',stats:{hp:22,power:6,cooldownReduction:2},set:'mousse',icon:'item.8256'},
 '8257':{id:'8257',name:'Ceinture en Mousse',category:'belt',stats:{hp:30,power:6},set:'mousse',icon:'item.8257'},
 '8258':{id:'8258',name:'Cape en Mousse',category:'cape',stats:{hp:30,power:7,cooldownReduction:1},set:'mousse',icon:'item.8258'},
 '8259':{id:'8259',name:'Coiffe en Mousse',category:'hat',stats:{hp:26,power:10,cooldownReduction:1},set:'mousse',icon:'item.8259'},
} satisfies Record<string,ItemDefinition>);
sets.mousse={name:'Panoplie en Mousse',thresholds:{2:{hp:18,power:8,cooldownReduction:2},3:{hp:32,power:15,cooldownReduction:3},4:{hp:48,power:24,cooldownReduction:4},5:{hp:66,power:34,cooldownReduction:6},6:{hp:86,power:44,cooldownReduction:7},7:{hp:110,power:55,cooldownReduction:9}}};
export const mousseLoot=[{item:'8253',weight:4},{item:'8254',weight:4},{item:'8256',weight:3},{item:'8257',weight:3},{item:'8258',weight:2},{item:'8259',weight:2},{item:'8255',weight:2}];

// Panoplie royale : mêmes emplacements que Bouftou, PV/Puissance et seuils multipliés par 1,5.
// Identités et graphismes vérifiés dans I.u, items_fr_450.swf ; équilibre du fangame.
export const royalUpgrades=[
 ['2411','2438','Boufcoiffe Royale'],['2414','2445','Cape Bouffante Royale'],
 ['2416','2440','Epée Royale du Bouftou'],['2419','2441','Anneau Royal du Bouftou'],
 ['2422','2442','Boufbottes Royales'],['2425','2443','Amulette Royale du Bouftou'],
 ['2428','2444','Ceinture Royale du Bouftou'],
] as const;
for(const [base,id,name] of royalUpgrades){
 const original=items[base];
 items[id]={...original,id,name,set:'royalBouftou',icon:`item.${id}`,stats:{hp:original.stats.hp*1.5,power:original.stats.power*1.5}};
}
sets.royalBouftou={name:'Panoplie du Bouftou Royal',thresholds:Object.fromEntries(Object.entries(sets.bouftou.thresholds).map(([count,stats])=>[count,{hp:stats.hp*1.5,power:stats.power*1.5}]))};
export const royalLoot=royalUpgrades.map(([,item])=>({item,weight:1}));

Object.assign(items,tofuScaraItems);
Object.assign(sets,tofuScaraSets);
export const tofuLoot=Object.values(tofuScaraItems).filter(i=>i.set==='tofu').map(i=>({item:i.id,weight:1}));
export const scaraLoot=Object.values(tofuScaraItems).filter(i=>i.set==='blackScara').map(i=>({item:i.id,weight:1}));
