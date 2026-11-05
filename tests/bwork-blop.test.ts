import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {dungeons} from '../src/data/dungeons';
import {items} from '../src/data/items';
import {monsters} from '../src/data/monsters';
import {parseManifest} from '../src/game/assets/manifest';
import {Navigation} from '../src/game/movement/navigation';
import {Simulation} from '../src/game/core/simulation';
import {newProfile,equip,finalStats} from '../src/game/progression/profile';
import {saveProfile,loadProfile} from '../src/game/save/persistence';
const manifest=parseManifest(JSON.parse(readFileSync('public/assets/manifest.json','utf8')));
for(const id of ['chefBwork','blopMulti'] as const){
 it(`${id} : terrain entièrement accessible depuis le spawn, obstacles et limites préservés`,()=>{
  const map=manifest.maps![id],nav=new Navigation(map.walkable!);
  const rules=JSON.parse(readFileSync('scripts/map-navigation.json','utf8'));
  for(const cell of map.walkable!)expect(nav.route(map.spawn,cell.position).length,`cellule ${cell.id}`).toBeGreaterThan(0);
  for(const decision of rules.maps[id].passable)expect(nav.contains(decision.position)).toBe(true);
  for(const decision of rules.maps[id].outside)expect(nav.contains(decision.position)).toBe(false);
  for(const layer of map.layers!.filter(l=>rules.objects[l.assetId]?.kind==='obstacle'))expect(nav.contains(layer.position)).toBe(false);
  expect(nav.contains([0,-432])).toBe(false);expect(nav.contains([742,0])).toBe(false);
 });
 it(`${id} : quatre vagues et victoire Extrême sur la vraie carte, panoplie et progression sauvegardées`,()=>{
  const profile=newProfile(),game=new Simulation(manifest,profile);game.enter(id,'extreme');
  for(const source of [...dungeons[id].normalWaves,dungeons[id].bossWave]){
   game.update(2);expect(game.enemies.filter(e=>e.hp>0)).toHaveLength(source.length*5);
   for(const enemy of game.enemies)expect(game.navigation.contains(enemy.position)).toBe(true);
   for(const enemy of game.enemies)enemy.hp=0;
  }
  game.update(0.01);expect(game.phase).toBe('victory');expect(profile.completed).toContain(id);
  const pieces=Object.values(items).filter(i=>i.set===id);expect(profile.inventory.map(i=>i.item).sort()).toEqual(pieces.map(i=>i.id).sort());
  for(const instance of profile.inventory)equip(profile,instance.uid);
  expect(finalStats(profile).power).toBeGreaterThan(300);
  let saved='';const storage={getItem:()=>saved,setItem:(_key:string,value:string)=>{saved=value;}};
  saveProfile(storage,profile);expect(loadProfile(storage)).toEqual({profile});
  expect(dungeons[id].bossWave.filter(kind=>monsters[kind].boss)).toHaveLength(1);
 });
}
it('branche les accessoires Chef Bwork sur chaque attache originale, y compris en panoplie mixte',()=>{
 const composition=manifest.composition!;
 for(const [id,slot] of [['6813','hat'],['6811','cape']]){
  const accessory=composition.accessories[id];expect(accessory.slot).toBe(slot);
  for(const actor of Object.values(composition.actors))for(const frame of actor.frames)for(const layer of frame.layers.filter(l=>l.slot===slot)){
   expect(manifest.assets[accessory.views[layer.label!]]).toBeTruthy();
  }
  for(const view of Object.values(accessory.views))expect(manifest.assets[`preview.${view}`]).toBeTruthy();
 }
 expect(Object.values(items).filter(i=>i.set==='blopMulti')).toHaveLength(4);
});
