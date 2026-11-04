/** Estime la collection d'une panoplie depuis zéro, sans garantie ni anti-doublon. */
import {dungeons} from '../src/data/dungeons';
import {monsters} from '../src/data/monsters';
import {seededRandom,weightedLoot} from '../src/game/progression/loot';
const samples=10000;
for(const dungeon of Object.values(dungeons)){
 const enemies=[...dungeon.normalWaves.flat(),...dungeon.bossWave].map(id=>monsters[id]);
 const target=new Set(enemies.flatMap(enemy=>enemy.loot.map(drop=>drop.item))),attempts:number[]=[];let firstClear=0;
 for(let seed=1;seed<=samples;seed++){
  const random=seededRandom(seed*7919),owned=new Set<string>();let runs=0;
  while(owned.size<target.size&&runs<500){
   runs++;
   for(const enemy of enemies){const drop=weightedLoot(enemy.loot,enemy.boss?dungeon.loot.bossChance:dungeon.loot.normalChance,random);if(drop)owned.add(drop);}
   if(runs===1&&owned.size===target.size)firstClear++;
  }
  attempts.push(runs);
 }
 attempts.sort((a,b)=>a-b);
 console.log(JSON.stringify({dungeon:dungeon.id,samples,enemies:enemies.length,expectedDrops:enemies.reduce((sum,enemy)=>sum+(enemy.boss?dungeon.loot.bossChance:dungeon.loot.normalChance),0),meanRuns:attempts.reduce((sum,runs)=>sum+runs,0)/samples,medianRuns:attempts[Math.floor(samples/2)],p90Runs:attempts[Math.floor(samples*0.9)],completeFirstRun:firstClear/samples}));
}
