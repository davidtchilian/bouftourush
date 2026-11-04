import {balance,xpForLevel} from '../../data/balance';
import {items,sets,slots,type Slot,type Stats} from '../../data/items';
export type InventoryItem={uid:string;item:string};
export type Profile={level:number;xp:number;kamas:number;inventory:InventoryItem[];equipment:Partial<Record<Slot,string>>;completed:string[]};
export const newProfile=():Profile=>({level:1,xp:0,kamas:0,inventory:[],equipment:{},completed:[]});
export function finalStats(profile:Profile):Stats&{cooldownReduction:number} {
 const stats={hp:balance.startingHp+(profile.level-1)*balance.hpPerLevel,power:(profile.level-1)*balance.powerPerLevel,cooldownReduction:0};
 const equipped=slots.flatMap(slot=>{const instance=profile.inventory.find(i=>i.uid===profile.equipment[slot]);return instance&&items[instance.item]?[items[instance.item]]:[];});
 for(const item of equipped){stats.hp+=item.stats.hp;stats.power+=item.stats.power;stats.cooldownReduction+=item.stats.cooldownReduction??0;}
 for(const [id,set] of Object.entries(sets)) {
  const count=new Set(equipped.filter(i=>i.set===id).map(i=>i.id)).size;
  const threshold=Object.keys(set.thresholds).map(Number).filter(n=>n<=count).sort((a,b)=>b-a)[0];
  if(threshold){stats.hp+=set.thresholds[threshold].hp;stats.power+=set.thresholds[threshold].power;stats.cooldownReduction+=set.thresholds[threshold].cooldownReduction??0;}
 }
 stats.cooldownReduction=Math.min(balance.maxCooldownReduction,Math.max(0,stats.cooldownReduction));
 return stats;
}
export function awardXp(profile:Profile,amount:number):number {
 const old=profile.level;profile.xp+=amount;
 while(profile.level<balance.maxLevel && profile.xp>=xpForLevel(profile.level)){profile.xp-=xpForLevel(profile.level);profile.level++;}
 if(profile.level===balance.maxLevel)profile.xp=0;
 return (profile.level-old)*balance.hpPerLevel;
}
export function equip(profile:Profile,uid:string,slot?:Slot):boolean {
 const instance=profile.inventory.find(i=>i.uid===uid),item=instance&&items[instance.item];if(!item)return false;
 const target=slot??(item.category==='ring'?(!profile.equipment.ring1?'ring1':'ring2'):item.category);
 if(item.category==='ring'?!['ring1','ring2'].includes(target):item.category!==target)return false;
 for(const key of slots)if(profile.equipment[key]===uid)delete profile.equipment[key];
 profile.equipment[target]=uid;return true;
}
