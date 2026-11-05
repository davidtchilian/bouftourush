import type {MonsterDefinition,SpeedBurst} from '../../data/monsters';

/** Premier départ à interval secondes de vie ; les pauses ne font pas avancer cet âge. */
export function speedBurstActive(burst:SpeedBurst|undefined,age:number):boolean {
 return Boolean(burst&&age>=burst.interval&&age%burst.interval<burst.duration);
}

function boostedSeconds(burst:SpeedBurst,age:number):number {
 const elapsed=Math.max(0,age-burst.interval);
 return Math.floor(elapsed/burst.interval)*burst.duration+Math.min(burst.duration,elapsed%burst.interval);
}

/** Intègre les fractions du pas à vitesse normale/accélérée, y compris aux frontières. */
export function enemyMovementSpeed(monster:MonsterDefinition,fromAge:number,toAge:number):number {
 const burst=monster.speedBurst,dt=toAge-fromAge;
 if(!burst||dt<=0)return monster.speed;
 const boosted=boostedSeconds(burst,toAge)-boostedSeconds(burst,fromAge);
 return monster.speed*(1+(burst.multiplier-1)*boosted/dt);
}
