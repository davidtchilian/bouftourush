import {describe,it,expect} from 'vitest';
import {balance,xpForLevel} from '../src/data/balance';
import {newProfile,awardXp,equip,finalStats} from '../src/game/progression/profile';
import {weightedLoot,seededRandom} from '../src/game/progression/loot';
import {saveProfile,loadProfile} from '../src/game/save/persistence';
import {WaveDirector} from '../src/game/dungeons/waves';
import {dungeons} from '../src/data/dungeons';
import {items,mousseLoot} from '../src/data/items';
import {monsters} from '../src/data/monsters';
describe('progression, équipement et persistance',()=>{
 it('monte plusieurs niveaux et retourne seulement le gain de HP maximum',()=>{
  const p=newProfile();const hp=awardXp(p,xpForLevel(1)+xpForLevel(2)+2);expect(p.level).toBe(3);expect(p.xp).toBe(2);expect(hp).toBe(2*balance.hpPerLevel);expect(finalStats(p).power).toBe(8);
 });
 it('recalcule les équipements et le meilleur seuil de panoplie sans accumulation',()=>{
  const p=newProfile();p.inventory=[{uid:'a',item:'2411'},{uid:'b',item:'2414'},{uid:'c',item:'2425'}];
  equip(p,'a');equip(p,'b');expect(finalStats(p)).toEqual({hp:310,power:56,cooldownReduction:0});
  for(let i=0;i<20;i++)equip(p,'a');expect(finalStats(p)).toEqual({hp:310,power:56,cooldownReduction:0});
  equip(p,'c');expect(finalStats(p)).toEqual({hp:356,power:98,cooldownReduction:0});delete p.equipment.cape;expect(finalStats(p)).toEqual({hp:270,power:64,cooldownReduction:0});
 });
 it('compte les pièces distinctes et empêche un même exemplaire dans deux slots',()=>{
  const p=newProfile();p.inventory=[{uid:'a',item:'2419'},{uid:'b',item:'2419'}];equip(p,'a','ring1');equip(p,'a','ring2');expect(p.equipment.ring1).toBeUndefined();equip(p,'b','ring1');expect(finalStats(p)).toEqual({hp:240,power:28,cooldownReduction:0});expect(equip(p,'a','hat')).toBe(false);
 });
 it('pondère les drops et garde les garanties seulement dans les tests',()=>{
  const table=[{item:'a',weight:1},{item:'b',weight:3}];const sequence=[0.1,0.9];expect(weightedLoot(table,1,()=>sequence.shift()!)).toBe('b');expect(weightedLoot(table,0,()=>0)).toBe(null);
  const a=seededRandom(42),b=seededRandom(42);expect(Array.from({length:10},()=>a())).toEqual(Array.from({length:10},()=>b()));
 });
 it('fait tomber la panoplie Mousse sur tous les monstres du Donjon Ensablé',()=>{
  const ensable=['crabe','etoileMer','pichonBlanc','pichonBleu','pichonVert','pichonOrange','pichonKloune','raulMops','sponge'] as const;
  for(const id of ensable)expect(monsters[id].loot).toBe(mousseLoot);
  expect(new Set(mousseLoot.map(drop=>drop.item)).size).toBe(7);
  expect(mousseLoot.every(drop=>items[drop.item]?.set==='mousse')).toBe(true);
 });
 it('charge une sauvegarde versionnée et ignore les données corrompues ou anciennes',()=>{
  const memory=new Map<string,string>(),storage={getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>{memory.set(key,value);}};
  const p=newProfile();p.kamas=27;p.inventory.push({uid:'hat',item:'2411'});equip(p,'hat');expect(saveProfile(storage,p)).toBe(true);expect(loadProfile(storage).profile).toEqual(p);
  memory.set('bouftourush.save.v1','{oops');expect(loadProfile(storage).warning).toBeTruthy();memory.set('bouftourush.save.v1',JSON.stringify({version:0,profile:p}));expect(loadProfile(storage).profile.level).toBe(1);
  p.equipment.weapon='hat';saveProfile(storage,p);expect(loadProfile(storage).warning).toBeTruthy();
 });
 it('supporte le refus de localStorage',()=>expect(saveProfile({getItem:()=>null,setItem:()=>{throw new Error('quota');}},newProfile())).toBe(false));
});
it('le directeur attend les ennemis vivants et termine seulement après le boss',()=>{
 const director=new WaveDirector(dungeons.incarnam);expect(director.update(0.1,0)).toBeNull();expect(director.update(2,0)?.length).toBeGreaterThan(0);expect(director.update(20,1)).toBeNull();
 for(let wave=1;wave<4;wave++)expect(director.update(2,0)?.length).toBeGreaterThan(0);
 expect(director.boss).toBe(true);expect(director.completed).toBe(false);director.update(1,1);expect(director.completed).toBe(false);director.update(1,0);expect(director.completed).toBe(true);
});
