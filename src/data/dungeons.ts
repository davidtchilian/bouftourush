import type {MonsterId} from './monsters';
export type DungeonMode='normal'|'extreme';
export const dungeonModes={normal:{label:'Normal',monsterCount:1,hp:1,completeSet:false},extreme:{label:'Extrême',monsterCount:5,hp:1.5,completeSet:true}} as const;
export type DungeonId='incarnam'|'bouftou'|'ensable'|'tofu'|'scara';
export type DungeonDefinition={id:DungeonId;name:string;map:string;rewardSet:string;tier:1|2|3|4|5;recommendedGear:string;normalWaves:MonsterId[][];bossWave:MonsterId[];description:string;scaling:{hpPerWave:number;damagePerWave:number};loot:{normalChance:number;bossChance:number}};
const group=(...groups:[MonsterId,number][]):MonsterId[]=>groups.flatMap(([kind,count])=>Array.from({length:count},()=>kind));
/** Équilibrage propre au fangame. Les paliers conseillent un parcours, sans bloquer les entrées. */
export const dungeons:Record<DungeonId,DungeonDefinition>={
 incarnam:{id:'incarnam',name:'Donjon d’Incarnam',map:'incarnam',rewardSet:'adventurer',tier:1,recommendedGear:'Premiers équipements',description:'Palier 1 · Panoplie de l’Aventurier. Des vagues de plus en plus résistantes.',
  scaling:{hpPerWave:0.10,damagePerWave:0.06},loot:{normalChance:0.05,bossChance:0.4},
  normalWaves:[group(['youngWhite',3],['youngBlack',3]),group(['youngWhite',3],['youngBlack',3],['smallBouftou',2]),group(['chafer',2],['smallBouftou',4],['youngWhite',2],['youngBlack',2])],
  bossWave:group(['milimilou',1],['smallBouftou',2],['youngWhite',2],['youngBlack',1])},
 ensable:{id:'ensable',name:'Donjon Ensablé',map:'ensable',rewardSet:'mousse',tier:2,recommendedGear:'Panoplie de l’Aventurier conseillée',description:'Palier 2 · Panoplie en Mousse : Vie, Puissance et recharge plus rapide.',
  scaling:{hpPerWave:0.14,damagePerWave:0.10},loot:{normalChance:0.035,bossChance:0.35},
  normalWaves:[group(['crabe',5],['etoileMer',3]),group(['pichonBlanc',3],['pichonBleu',3],['pichonVert',2],['pichonOrange',2]),group(['crabe',2],['etoileMer',2],['pichonKloune',2],['pichonBlanc',2],['pichonBleu',2],['pichonVert',1],['pichonOrange',1])],
  bossWave:group(['sponge',1],['raulMops',1],['pichonKloune',2],['pichonBlanc',1],['pichonBleu',1],['pichonVert',1],['pichonOrange',1])},
 bouftou:{id:'bouftou',name:'Donjon des Bouftous',map:'bouftou',rewardSet:'bouftou',tier:3,recommendedGear:'Panoplie en Mousse conseillée',description:'Palier 3 · Panoplie du Bouftou : de solides bonus de Vie et de Puissance.',
  scaling:{hpPerWave:0.16,damagePerWave:0.12},loot:{normalChance:0.025,bossChance:0.3},
  normalWaves:[group(['bouftou',4],['white',3],['black',3]),group(['bouftou',6],['white',3],['black',3]),group(['chief',3],['bouftou',5],['white',3],['black',3])],
  bossWave:group(['royal',1],['chief',3],['bouftou',4],['white',1],['black',1])},
 tofu:{id:'tofu',name:'Donjon des Tofus',map:'tofu',rewardSet:'tofu',tier:4,recommendedGear:'Panoplie du Bouftou conseillée',description:'Panoplie du Tofu : mobilité et récupération.',scaling:{hpPerWave:0.12,damagePerWave:0.08},loot:{normalChance:0.035,bossChance:0.4},normalWaves:[group(['tofu',8]),group(['tofu',6],['blackTofu',4]),group(['tofu',6],['blackTofu',6])],bossWave:group(['batofu',1],['blackTofu',4],['tofu',3])},
 scara:{id:'scara',name:'Donjon des Scarafeuilles',map:'scara',rewardSet:'blackScara',tier:5,recommendedGear:'Panoplie du Bouftou ou du Tofu conseillée',description:'Panoplie du Scarafeuille Noir : Vie et Puissance.',scaling:{hpPerWave:0.12,damagePerWave:0.08},loot:{normalChance:0.03,bossChance:0.4},normalWaves:[group(['blueScara',2],['redScara',2],['greenScara',2],['whiteScara',2]),group(['blueScara',2],['redScara',2],['greenScara',2],['whiteScara',2],['blackScara',2]),group(['blackScara',4],['blueScara',2],['redScara',2],['greenScara',2],['whiteScara',2])],bossWave:group(['goldScara',1],['blackScara',3],['blueScara',1],['redScara',1],['greenScara',1],['whiteScara',1])},
};
/** Index 0 = première vague ; aucune adaptation cachée au niveau ou à l’équipement. */
export function waveMultipliers(dungeon:DungeonDefinition,index:number,mode:DungeonMode='normal'):{hp:number;damage:number}{
 const step=Math.max(0,Math.floor(index));return {hp:(1+step*dungeon.scaling.hpPerWave)*dungeonModes[mode].hp,damage:1+step*dungeon.scaling.damagePerWave};
}
