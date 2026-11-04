import type {MonsterId} from '../../data/monsters';
import {dungeonModes,type DungeonMode,type DungeonDefinition} from '../../data/dungeons';
import {balance} from '../../data/balance';
/** Le directeur reçoit uniquement le nombre d'ennemis vivants ; les cadavres ne bloquent pas les vagues. */
export class WaveDirector {
 index=-1;remainingDelay:number=balance.waveDelay;completed=false;private awaitingSpawn=true;
 constructor(readonly dungeon:DungeonDefinition,readonly mode:DungeonMode='normal'){}
 get total(){return this.dungeon.normalWaves.length+1;}
 get boss(){return this.index===this.total-1;}
 update(dt:number,living:number):MonsterId[]|null {
  if(this.completed)return null;
  if(!this.awaitingSpawn){if(living>0)return null;if(this.boss){this.completed=true;return null;}this.awaitingSpawn=true;this.remainingDelay=balance.waveDelay;}
  this.remainingDelay-=dt;if(this.remainingDelay>0)return null;
  this.index++;this.awaitingSpawn=false;
  const wave=this.boss?this.dungeon.bossWave:this.dungeon.normalWaves[this.index];
  return wave.flatMap(kind=>Array.from({length:dungeonModes[this.mode].monsterCount},()=>kind));
 }
}
