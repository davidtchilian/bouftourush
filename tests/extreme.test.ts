import {describe,it,expect} from 'vitest';
import {dungeons,waveMultipliers,type DungeonId} from '../src/data/dungeons';
import {items} from '../src/data/items';
import {monsters} from '../src/data/monsters';
import {WaveDirector} from '../src/game/dungeons/waves';
import {Simulation} from '../src/game/core/simulation';
import {newProfile} from '../src/game/progression/profile';
import {saveProfile,loadProfile} from '../src/game/save/persistence';
import {fixtureManifest} from './helpers/world';
const setIds=(id:keyof typeof dungeons)=>Object.values(items).filter(item=>item.set===dungeons[id].rewardSet).map(item=>item.id).sort();
/** Pilote les seuls délais de vagues ; le combat réel et les drops sont testés plus bas. */
function clearWaves(game:Simulation){
 for(let wave=0;wave<4;wave++){
  game.update(2);for(const enemy of game.enemies)enemy.hp=0;
 }
 game.update(0.01);
}
describe('donjons Extrême',()=>{
 it('multiplie chaque identité par cinq, y compris tous les boss, sans modifier les vagues normales',()=>{
  for(const dungeon of Object.values(dungeons)){
   const director=new WaveDirector(dungeon,'extreme'),normal=new WaveDirector(dungeon);
   for(const source of [...dungeon.normalWaves,dungeon.bossWave]){
    const wave=director.update(2,0)!;expect(normal.update(2,0)).toEqual(source);expect(wave).toHaveLength(source.length*5);
    for(const id of new Set(source))expect(wave.filter(kind=>kind===id)).toHaveLength(source.filter(kind=>kind===id).length*5);
   }
   director.update(0.01,1);expect(director.completed).toBe(false);director.update(0.01,0);expect(director.completed).toBe(true);
  }
 });
 it('applique PV ×1,5 à chaque vague en gardant les dégâts, vitesses et taux de loot',()=>{
  for(const dungeon of Object.values(dungeons))for(let index=0;index<4;index++){
   const normal=waveMultipliers(dungeon,index),extreme=waveMultipliers(dungeon,index,'extreme');expect(extreme.hp).toBeCloseTo(normal.hp*1.5);expect(extreme.damage).toBe(normal.damage);
  }
  const game=new Simulation(fixtureManifest(),newProfile());game.enter('bouftou','extreme');game.update(2);
  expect(game.enemies).toHaveLength(50);expect(game.snapshot().mode).toBe('extreme');
  for(const enemy of game.enemies){expect(enemy.hp).toBe(Math.round(monsters[enemy.kind].hp*1.5));expect(enemy.damage).toBe(monsters[enemy.kind].damage);}
  expect(new Set(game.enemies.map(enemy=>enemy.position.join(','))).size).toBe(50);
 });
 it.each(Object.keys(dungeons) as DungeonId[])('%s : donne la panoplie complète une seule fois par victoire, avec des identifiants uniques et sauvegardables',id=>{
   const profile=newProfile();profile.inventory.push({uid:'owned',item:setIds(id)[0]});let saved='';
   const storage={getItem:()=>saved,setItem:(_key:string,value:string)=>{saved=value;}};
   const game=new Simulation(fixtureManifest(),profile,()=>{saveProfile(storage,profile);},42);game.enter(id,'extreme');
   expect(profile.inventory).toHaveLength(1);clearWaves(game);
   expect(game.phase).toBe('victory');expect(profile.inventory.slice(1).map(item=>item.item).sort()).toEqual(setIds(id));
   expect(new Set(profile.inventory.map(item=>item.uid)).size).toBe(profile.inventory.length);
   const count=profile.inventory.length;for(let i=0;i<60;i++)game.update(1/60);expect(profile.inventory).toHaveLength(count);
   expect(loadProfile(storage).profile.inventory).toEqual(profile.inventory);
   game.enter(id,'extreme');clearWaves(game);expect(profile.inventory).toHaveLength(1+2*setIds(id).length);
 });
 it('conserve les drops ordinaires en plus de la récompense de fin',()=>{
  const profile=newProfile(),game=new Simulation(fixtureManifest(),profile,()=>{},42,1);game.enter('incarnam','extreme');game.update(2);
  const target=game.enemies[0];target.hp=1;target.position=[game.player.position[0]+40,game.player.position[1]];game.enemies=[target];
  expect(game.cast('magic',target.position)).toBe(true);for(let i=0;i<20;i++)game.update(1/60);
  expect(game.kills).toBe(1);expect(profile.inventory).toHaveLength(1);const drop={...profile.inventory[0]};
  // Finir les trois vagues suivantes avec le même directeur, sans octroyer de faux drops.
  for(let wave=1;wave<4;wave++){game.update(2);for(const enemy of game.enemies)enemy.hp=0;}game.update(0.01);
  expect(game.phase).toBe('victory');expect(profile.inventory[0]).toEqual(drop);expect(profile.inventory.slice(1).map(item=>item.item).sort()).toEqual(setIds('incarnam'));
 });
 it('ne donne aucune panoplie en mode normal, après abandon, après mort ou avant le dernier ennemi',()=>{
  const normal=new Simulation(fixtureManifest(),newProfile());normal.enter('incarnam');clearWaves(normal);expect(normal.profile.inventory).toHaveLength(0);
  const game=new Simulation(fixtureManifest(),newProfile());game.enter('incarnam','extreme');game.update(2);game.returnHub();expect(game.profile.inventory).toHaveLength(0);expect(game.mode).toBe('normal');
  game.enter('incarnam','extreme');game.update(2);game.hp=1;game.enemies[0].position=[...game.player.position];game.enemies[0].attackAt=0;game.update(0.01);
  expect(game.phase).toBe('death');expect(game.profile.inventory).toHaveLength(0);
  game.enter('incarnam','extreme');for(let wave=0;wave<3;wave++){game.update(2);for(const enemy of game.enemies)enemy.hp=0;}game.update(2);
  for(const enemy of game.enemies.slice(1))enemy.hp=0;game.update(0.01);expect(game.phase).toBe('combat');expect(game.profile.inventory).toHaveLength(0);
 });
});
