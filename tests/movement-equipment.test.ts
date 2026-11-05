import {expect,it} from 'vitest';
import {items,sets} from '../src/data/items';
import {equip,movementSpeedBonus,newProfile} from '../src/game/progression/profile';
it('recalcule la vitesse et le seuil distinct sans accumulation, puis retire les bonus',()=>{
 const original=items['2411'].stats.movementSpeed,threshold=sets.bouftou.thresholds[2].movementSpeed;
 try {
  items['2411'].stats.movementSpeed=8;sets.bouftou.thresholds[2].movementSpeed=12;
  const p=newProfile();p.inventory=[{uid:'hat',item:'2411'},{uid:'cape',item:'2414'}];
  expect(movementSpeedBonus(p)).toBe(0);equip(p,'hat');expect(movementSpeedBonus(p)).toBe(8);
  equip(p,'cape');expect(movementSpeedBonus(p)).toBe(20);
  for(let i=0;i<10;i++)equip(p,'hat');expect(movementSpeedBonus(p)).toBe(20);
  delete p.equipment.hat;expect(movementSpeedBonus(p)).toBe(0);
 } finally {items['2411'].stats.movementSpeed=original;sets.bouftou.thresholds[2].movementSpeed=threshold;}
});
