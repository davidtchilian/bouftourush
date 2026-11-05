import type {Manifest,MapDefinition} from './manifest';
import {monsters,type MonsterId} from '../../data/monsters';

/** Le Crâ et ses sorts sont partagés ; les cartes et familles sont chargées à l'entrée. */
export function worldTexturePaths(manifest:Manifest,map:MapDefinition,kinds:Iterable<MonsterId>):string[]{
 const ids=new Set((map.layers??[]).filter(layer=>!map.backgroundAssetId||layer.order>=2000).map(layer=>layer.assetId));
 if(map.backgroundAssetId)ids.add(map.backgroundAssetId);
 const family=[...kinds];
 const prefixes=[...new Set(family.map(kind=>`mob.${monsters[kind].sprite}.`))];
 for(const kind of family){
  const ranged=monsters[kind].rangedAttack;
  if(ranged){ids.add(ranged.asset);prefixes.push(`${ranged.animation}.`);}
 }
 for(const id of Object.keys(manifest.assets))if(id.startsWith('piece.')||id.startsWith('spell.')||(!manifest.composition&&id.startsWith('cra.'))||prefixes.some(prefix=>id.startsWith(prefix)))ids.add(id);
 return [...new Set([...ids].flatMap(id=>manifest.assets[id].frames.map(frame=>frame.path)))];
}
