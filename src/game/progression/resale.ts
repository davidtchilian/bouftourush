import {items} from '../../data/items';
import {resalePrices} from '../../data/resale';
import type {Profile} from './profile';

/** Conserve les équipements portés ; sinon garde un seul exemplaire libre par objet. */
export function planDuplicateSale(profile:Pick<Profile,'inventory'|'equipment'>){
 const equippedUids=new Set(Object.values(profile.equipment));
 const wornTypes=new Set(profile.inventory.filter(instance=>equippedUids.has(instance.uid)).map(instance=>instance.item));
 const keptUids=new Set<string>(),seen=new Set<string>();
 for(const instance of profile.inventory){
  if(equippedUids.has(instance.uid)){keptUids.add(instance.uid);continue;}
  if(!wornTypes.has(instance.item)&&!seen.has(instance.item)){keptUids.add(instance.uid);seen.add(instance.item);}
 }
 const soldItems=profile.inventory.filter(instance=>!keptUids.has(instance.uid));
 const kamas=soldItems.reduce((total,instance)=>total+resalePrices[items[instance.item].category],0);
 return {keptUids,sold:soldItems.length,kamas};
}

export function sellDuplicates(profile:Profile){
 const sale=planDuplicateSale(profile);
 if(sale.sold){
  profile.inventory=profile.inventory.filter(instance=>sale.keptUids.has(instance.uid));
  profile.kamas+=sale.kamas;
 }
 return {sold:sale.sold,kamas:sale.kamas};
}
