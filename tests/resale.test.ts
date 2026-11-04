import {describe,it,expect} from 'vitest';
import {newProfile,equip,finalStats} from '../src/game/progression/profile';
import {planDuplicateSale,sellDuplicates} from '../src/game/progression/resale';
import {saveProfile,loadProfile} from '../src/game/save/persistence';

describe('revente des doublons',()=>{
 it('garde un exemplaire de chaque objet, privilégie le porté et paie à petit prix une seule fois',()=>{
  const p=newProfile();p.kamas=10;p.inventory=[{uid:'hat-extra',item:'2411'},{uid:'hat-worn',item:'2411'},{uid:'hat-extra2',item:'2411'},{uid:'cape',item:'2414'},{uid:'ring-extra',item:'2419'},{uid:'ring',item:'2419'}];
  equip(p,'hat-worn');equip(p,'ring');
  const before=structuredClone(p);expect(planDuplicateSale(p)).toMatchObject({sold:3,kamas:7});expect(p).toEqual(before);
  expect(sellDuplicates(p)).toEqual({sold:3,kamas:7});expect(p.kamas).toBe(17);
  expect(p.inventory.map(item=>item.uid)).toEqual(['hat-worn','cape','ring']);expect(p.equipment).toEqual({hat:'hat-worn',ring1:'ring'});
  expect(sellDuplicates(p)).toEqual({sold:0,kamas:0});expect(p.kamas).toBe(17);
 });
 it('conserve le premier exemplaire libre et ne vend aucun objet unique',()=>{
  const p=newProfile();expect(sellDuplicates(p)).toEqual({sold:0,kamas:0});
  p.inventory=[{uid:'first',item:'2416'},{uid:'second',item:'2416'},{uid:'cape',item:'2414'}];
  expect(sellDuplicates(p)).toEqual({sold:1,kamas:4});expect(p.inventory.map(item=>item.uid)).toEqual(['first','cape']);
 });
 it('protège les deux anneaux portés, vend la copie libre et produit une sauvegarde valide',()=>{
  const p=newProfile();p.inventory=[{uid:'second-slot',item:'2419'},{uid:'first-slot',item:'2419'},{uid:'free',item:'2419'}];equip(p,'first-slot','ring1');equip(p,'second-slot','ring2');
  expect(finalStats(p)).toEqual({hp:240,power:28,cooldownReduction:0});expect(sellDuplicates(p)).toEqual({sold:1,kamas:1});
  expect(p.inventory.map(item=>item.uid)).toEqual(['second-slot','first-slot']);expect(p.equipment).toEqual({ring1:'first-slot',ring2:'second-slot'});expect(finalStats(p)).toEqual({hp:240,power:28,cooldownReduction:0});
  const memory=new Map<string,string>(),storage={getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>{memory.set(key,value);}};
  saveProfile(storage,p);expect(loadProfile(storage).profile).toEqual(p);expect(loadProfile(storage).warning).toBeFalsy();
 });
});
