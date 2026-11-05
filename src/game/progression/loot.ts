export function seededRandom(seed:number):()=>number { let state=seed>>>0||1;return()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;}; }
export function weightedLoot(table:ReadonlyArray<{item:string;weight:number}>,chance:number,random:()=>number):string|null {
 if(!table.length || random()>=chance)return null;
 const total=table.reduce((n,e)=>n+Math.max(0,e.weight),0);if(total===0)return null;
 let ticket=random()*total;
 for(const entry of table){ticket-=Math.max(0,entry.weight);if(ticket<0)return entry.item;}
 return table.at(-1)!.item;
}

/** Tirage principal puis tirage bonus indépendant, une seule pièce par table. */
export function monsterLoot(monster:{loot:ReadonlyArray<{item:string;weight:number}>;bonusLoot?:{chance:number;table:ReadonlyArray<{item:string;weight:number}>}},chance:number,random:()=>number):string[]{
 const drops:string[]=[];
 const ordinary=weightedLoot(monster.loot,chance,random);if(ordinary)drops.push(ordinary);
 if(monster.bonusLoot){const bonus=weightedLoot(monster.bonusLoot.table,monster.bonusLoot.chance,random);if(bonus)drops.push(bonus);}
 return drops;
}
