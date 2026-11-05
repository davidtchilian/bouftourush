import {z} from 'zod';
import {items,slots} from '../../data/items';
import {xpForLevel} from '../../data/balance';
import {newProfile,type Profile} from '../progression/profile';
const key='bouftourush.save.v1';
const profileSchema=z.object({level:z.number().int().min(1).max(100),xp:z.number().finite().nonnegative().max(1e8),kamas:z.number().int().nonnegative().max(1e10),inventory:z.array(z.object({uid:z.string().min(1).max(120),item:z.string().refine(id=>Object.hasOwn(items,id))})).max(10000),equipment:z.record(z.string(),z.string()),completed:z.array(z.enum(['incarnam','bouftou','ensable','tofu','scara'])).max(5)});
export type StorageLike=Pick<Storage,'getItem'|'setItem'>;
export function loadProfile(storage:StorageLike):{profile:Profile;warning?:string} {
 try {
  const raw=storage.getItem(key);if(!raw)return{profile:newProfile()};
  const save=JSON.parse(raw);if(save.version!==1)throw new Error('version');
  const profile=profileSchema.parse(save.profile) as Profile;
  if(new Set(profile.inventory.map(i=>i.uid)).size!==profile.inventory.length)throw new Error('doublons');
  if(profile.level<100&&profile.xp>=xpForLevel(profile.level))throw new Error('xp incohérente');
  const seen=new Set<string>();
  for(const [slot,uid] of Object.entries(profile.equipment)){
   const item=profile.inventory.find(i=>i.uid===uid),definition=item&&items[item.item];
   if(!slots.includes(slot as typeof slots[number])||!definition||seen.has(uid)||(definition.category==='ring'?!['ring1','ring2'].includes(slot):definition.category!==slot))throw new Error('équipement');
   seen.add(uid);
  }
  return{profile};
 } catch {return{profile:newProfile(),warning:'Sauvegarde illisible ou incompatible : un nouveau personnage a été chargé.'};}
}
export function saveProfile(storage:StorageLike,profile:Profile):boolean {try{storage.setItem(key,JSON.stringify({version:1,profile}));return true;}catch{return false;}}
