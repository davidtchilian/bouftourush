/** Active les deux familles revues en réutilisant leurs PNG Remastered préparés. */
import {readFile,writeFile,cp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mergeDeveloperHat} from './dev-hat-assets';
import {parseManifest,type Manifest} from '../src/game/assets/manifest';
const root=resolve(process.argv[2]??'public/assets');
const runtime=JSON.parse(await readFile(join(root,'manifest.json'),'utf8')) as Manifest;
try{await access(join(root,'prepared/manifest.json'));}
catch(error){
 if((error as NodeJS.ErrnoException).code!=='ENOENT'||root===resolve('public/assets'))throw error;
 await cp(resolve('public/assets/prepared'),join(root,'prepared'),{recursive:true});
}
const prepared=JSON.parse(await readFile(join(root,'prepared/manifest.json'),'utf8'));
const rules=JSON.parse(await readFile('scripts/map-navigation.json','utf8'));
if(prepared.visualVersion!=='1.40.13-remastered'||prepared.preparedOnly!==true)throw new Error('Lot Remastered préparé requis.');
if(!runtime.composition)throw new Error('Composition du Crâ requise.');
const required=new Set<string>();
for(const id of ['chefBwork','blopMulti']){
 const family=prepared.catalog.families.find((f:{id:string})=>f.id===id);
 const map=prepared.maps[id],review=rules.maps[id];
 if(!map.mapSource.includes(review.source)||!review.walkable.length)throw new Error(`Navigation non revue : ${id}`);
 for(const item of family.items){
  required.add(`item.${item.id}`);
  const accessory=prepared.accessories[item.id];
  if(accessory){runtime.composition.accessories[item.id]=accessory;for(const asset of Object.values(accessory.views) as string[])required.add(asset).add(`preview.${asset}`);}
 }
 for(const monster of family.monsters){
  for(const action of ['idle','run','attack','hit','death'])for(const direction of ['R','L'])required.add(`mob.${monster.sprite}.${action}.${direction}`);
  if(monster.boss)for(const action of ['idle','attack'])required.add(`preview.mob.${monster.sprite}.${action}.R`);
 }
 for(const layer of map.layers)required.add(layer.assetId);
 runtime.maps??={};
 runtime.maps[id]={bounds:map.bounds,layers:map.layers,mapSource:map.mapSource,cameraHeight:432,spawn:review.spawn,walkable:review.walkable,enemySpawns:review.enemySpawns};
}
for(const id of required){
 // Les décors communs gardent leur export actif d'origine.
 if(runtime.assets[id]&&!runtime.assets[id].frames[0].path.startsWith('prepared/'))continue;
 const asset=structuredClone(prepared.assets[id]);if(!asset)throw new Error(`Asset préparé absent : ${id}`);
 for(const frame of asset.frames)frame.path=`prepared/${frame.path}`;
 runtime.assets[id]=asset;
}
await mergeDeveloperHat(runtime,root);
parseManifest(runtime);
const manifest=runtime;
const staging=join(root,'manifest.activation.json');await writeFile(staging,JSON.stringify(manifest,null,2));
execFileSync('python3',[fileURLToPath(new URL('./map_navigation.py',import.meta.url)),'--check',staging],{stdio:'inherit'});
await writeFile(join(root,'manifest.json'),JSON.stringify(manifest,null,2));
await (await import('node:fs/promises')).rm(staging);
console.log('Bworks et Blop Multicolore Royal activés : cartes revues, monstres, portraits, objets et accessoires.');
