/** Pilote de test uniquement : déplacement et AZER ordinaires, sans bonus caché. */
import type {DungeonId} from '../src/data/dungeons';
import {items} from '../src/data/items';
import {newProfile,equip,type Profile} from '../src/game/progression/profile';
import {Navigation,type Point} from '../src/game/movement/navigation';
import {segmentDistance} from '../src/game/combat/damage';
export function auditProfile(dungeon:DungeonId):Profile{
 const profile=newProfile();
 const stage={incarnam:{level:1,set:null},ensable:{level:8,set:'adventurer'},bouftou:{level:16,set:'mousse'}}[dungeon];
 profile.level=stage.level;
 for(const item of Object.values(items).filter(item=>item.set===stage.set)){
  const uid=`audit-${item.id}`;profile.inventory.push({uid,item:item.id});equip(profile,uid);
 }
 return profile;
}
export function combatDestination(navigation:Navigation,player:Point,enemies:{position:Point}[]):Point|null{
 const distance=(a:Point,b:Point)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const nearest=[...enemies].sort((a,b)=>distance(player,a.position)-distance(player,b.position))[0];if(!nearest)return null;
 const gap=distance(player,nearest.position);
 if(gap<110){
  const candidates=navigation.cells.filter(cell=>{const step=distance(player,cell.position);return step>=55&&step<=140&&navigation.clear(player,cell.position)&&enemies.every(enemy=>distance(player,enemy.position)<24||segmentDistance(enemy.position,player,cell.position)>24);});
  const safety=(point:Point)=>Math.min(...enemies.map(enemy=>distance(point,enemy.position)))-distance(player,point)*0.12;
  candidates.sort((a,b)=>safety(b.position)-safety(a.position));
  if(candidates[0])return candidates[0].position;
 }
 if(gap>205||!navigation.clear(player,nearest.position))return nearest.position;
 return null;
}
