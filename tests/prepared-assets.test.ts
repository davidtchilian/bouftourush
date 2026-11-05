import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {items} from '../src/data/items';
import {dungeons} from '../src/data/dungeons';
const catalog=JSON.parse(readFileSync('scripts/future-dungeons-assets.json','utf8')) as {preparedOnly:boolean;visualVersion:string;families:{id:string;items:{id:string;source:string}[];monsters:{sprite:string;source:string;animations:Record<string,string>}[];map:{source:string|null;navigationReady:boolean;reason?:string}}[]};
it('garde les quatre familles restantes hors des données actives',()=>{
 expect(catalog.preparedOnly).toBe(true);expect(catalog.visualVersion).toBe('1.40.13-remastered');expect(catalog.families).toHaveLength(6);
 const runtime=JSON.parse(readFileSync('public/assets/manifest.json','utf8'));
 for(const family of catalog.families.filter(f=>!['chefBwork','blopMulti'].includes(f.id))){
  expect(Object.hasOwn(dungeons,family.id)).toBe(false);
  for(const item of family.items){expect(Object.hasOwn(items,item.id)).toBe(false);expect(runtime.assets[`item.${item.id}`]).toBeUndefined();}
  expect(family.map.navigationReady).toBe(false);
  if(!family.map.source)expect(family.map.reason).toBeTruthy();
 }
});
it('décrit les dix gestes et directions originaux de chaque sprite à préparer',()=>{
 for(const family of catalog.families)for(const monster of family.monsters){
  expect(monster.source).toBe(`clips/sprites/${monster.sprite}.swf`);
  for(const action of ['idle','run','attack','hit','death'])for(const direction of ['R','L'])expect(monster.animations[action+direction]).toBeTruthy();
 }
});
