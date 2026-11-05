import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {manifestSchema} from '../src/game/assets/manifest';
import type {Manifest} from '../src/game/assets/manifest';
export type PreparedBundle={version:1;visualVersion:'1.40.13-remastered';preparedOnly:true;assets:Manifest['assets'];maps:Record<string,{layers:{assetId:string}[];navigationReady:false;preparedOnly:true}>;catalog:{families:{id:string;items:{id:string}[];monsters:{sprite:string;boss:boolean;animations:Record<string,string>}[];map:{source:string|null;reason?:string}}[]};accessories:Record<string,{views:Record<string,string>}>;timelineSummary?:{sourceFrames:number;storedFrames:number;imageRegions:number;pngFiles:number}};
export async function inspectPreparedAssets(input:string){
 const root=await realpath(input),bundle=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8')) as PreparedBundle;
 if(bundle.version!==1||bundle.visualVersion!=='1.40.13-remastered'||bundle.preparedOnly!==true)throw new Error('Lot préparé non actif Remastered requis.');
 bundle.assets=manifestSchema.shape.assets.parse(bundle.assets);
 const required:string[]=[];
 for(const family of bundle.catalog.families){
  required.push(...family.items.map(item=>`item.${item.id}`));
  for(const monster of family.monsters){
   for(const key of Object.keys(monster.animations))required.push(`mob.${monster.sprite}.${key.slice(0,-1)}.${key.at(-1)}`);
   if(monster.boss)for(const action of ['idle','attack'])required.push(`preview.mob.${monster.sprite}.${action}.R`);
  }
  if(family.map.source){
   const map=bundle.maps[family.id];if(!map||map.navigationReady!==false||map.preparedOnly!==true)throw new Error(`Carte préparée manquante : ${family.id}`);
   required.push(`preview.map.${family.id}`);
   required.push(...map.layers.map(layer=>layer.assetId));
  }else if(!family.map.reason)throw new Error(`Disposition absente sans diagnostic : ${family.id}`);
 }
 for(const accessory of Object.values(bundle.accessories))for(const id of Object.values(accessory.views))required.push(id,`preview.${id}`);
 for(const id of required)if(!bundle.assets[id])throw new Error(`Séquence préparée absente : ${id}`);
 const paths=new Set(Object.values(bundle.assets).flatMap(asset=>asset.frames.map(frame=>frame.path)));
 for(const path of paths){
  const file=await realpath(resolve(root,path));if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw new Error(`PNG interdit : ${path}`);
  const bytes=await readFile(file);if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error(`PNG invalide : ${path}`);
 }
 for(const [id,asset] of Object.entries(bundle.assets))for(const frame of asset.frames)if(frame.region){const [x,y,w,h,pw,ph]=frame.region;if(x+w>pw||y+h>ph)throw new Error(`Frame hors atlas : ${id}`);}
 return {root,bundle,paths};
}
