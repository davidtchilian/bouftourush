import {familyLoot,incarnamLoot,mousseLoot} from './items';
export type MonsterId='bouftou'|'white'|'black'|'chief'|'royal'|'milimilou'|'chafer'|'youngWhite'|'youngBlack'|'smallBouftou'|'crabe'|'pichonBlanc'|'pichonBleu'|'pichonVert'|'pichonOrange'|'pichonKloune'|'raulMops'|'etoileMer'|'sponge';
export type MonsterDefinition={name:string;sprite:string;hp:number;speed:number;detect:number;range:number;damage:number;interval:number;xp:number;kamas:number;boss?:boolean;loot:typeof familyLoot};
/** Valeurs propres à cette adaptation temps réel. Graphismes confirmés dans les sources locales. */
export const monsters:Record<MonsterId,MonsterDefinition>={
 white:{name:'Boufton Blanc',sprite:'1570',hp:95,speed:54,detect:700,range:21,damage:16,interval:1.6,xp:7,kamas:3,loot:familyLoot},
 black:{name:'Boufton Noir',sprite:'1571',hp:105,speed:56,detect:700,range:21,damage:18,interval:1.7,xp:8,kamas:3,loot:familyLoot},
 bouftou:{name:'Bouftou',sprite:'1566',hp:150,speed:51,detect:700,range:24,damage:22,interval:1.6,xp:11,kamas:5,loot:familyLoot},
 chief:{name:'Chef de Guerre Bouftou',sprite:'1573',hp:280,speed:64,detect:700,range:27,damage:32,interval:1.6,xp:20,kamas:10,loot:familyLoot},
 royal:{name:'Bouftou Royal',sprite:'1574',hp:1400,speed:49,detect:700,range:32,damage:52,interval:1.8,xp:110,kamas:70,boss:true,loot:familyLoot},
 milimilou:{name:'Milimilou',sprite:'1581',hp:480,speed:64,detect:700,range:28,damage:22,interval:1.7,xp:90,kamas:55,boss:true,loot:incarnamLoot},
 chafer:{name:'Chafer Prépubère',sprite:'1014',hp:90,speed:48,detect:700,range:24,damage:15,interval:1.7,xp:12,kamas:5,loot:incarnamLoot},
 youngWhite:{name:'Jeune Boufton Blanc',sprite:'1570',hp:42,speed:51,detect:700,range:20,damage:7,interval:1.8,xp:6,kamas:2,loot:incarnamLoot},
 youngBlack:{name:'Jeune Boufton Noir',sprite:'1571',hp:48,speed:53,detect:700,range:20,damage:9,interval:1.8,xp:7,kamas:2,loot:incarnamLoot},
 smallBouftou:{name:'Petit Bouftou',sprite:'1566',hp:70,speed:49,detect:700,range:23,damage:12,interval:1.8,xp:9,kamas:4,loot:incarnamLoot},
 // Donjon Ensablé : identités et sprites vérifiés dans les tables locales (1009, 1474, 1481, 1483-1485, 1487-1488, 1546).
 crabe:{name:'Crabe',sprite:'1009',hp:75,speed:44,detect:620,range:18,damage:11,interval:1.7,xp:6,kamas:2,loot:mousseLoot},
 etoileMer:{name:'Étoile de la Mer d’Asse',sprite:'1474',hp:88,speed:41,detect:640,range:22,damage:13,interval:1.9,xp:8,kamas:3,loot:mousseLoot},
 pichonBlanc:{name:'Pichon Blanc',sprite:'1485',hp:104,speed:51,detect:680,range:26,damage:16,interval:1.8,xp:10,kamas:4,loot:mousseLoot},
 pichonBleu:{name:'Pichon Bleu',sprite:'1487',hp:104,speed:51,detect:680,range:26,damage:16,interval:1.8,xp:10,kamas:4,loot:mousseLoot},
 pichonVert:{name:'Pichon Vert',sprite:'1484',hp:104,speed:51,detect:680,range:24,damage:17,interval:1.8,xp:10,kamas:4,loot:mousseLoot},
 pichonOrange:{name:'Pichon Orange',sprite:'1488',hp:104,speed:51,detect:680,range:28,damage:16,interval:1.8,xp:10,kamas:4,loot:mousseLoot},
 pichonKloune:{name:'Pichon Kloune',sprite:'1483',hp:210,speed:53,detect:700,range:25,damage:23,interval:1.7,xp:20,kamas:9,loot:mousseLoot},
 raulMops:{name:'Raul Mops',sprite:'1481',hp:460,speed:55,detect:720,range:29,damage:30,interval:1.8,xp:60,kamas:28,loot:mousseLoot},
 sponge:{name:'Mob l’Éponge',sprite:'1546',hp:850,speed:48,detect:720,range:30,damage:36,interval:1.8,xp:130,kamas:75,boss:true,loot:mousseLoot},
};
