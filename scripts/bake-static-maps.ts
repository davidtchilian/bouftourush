/** Compose uniquement les couches fixes Remastered, avec leurs transformations et ordre source. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from '@playwright/test';
import {parseManifest} from '../src/game/assets/manifest';
import {composeMapPng} from './map-png';
const root=resolve(process.argv[2]??'.local-assets/game-runtime');
const manifest=parseManifest(JSON.parse(await readFile(join(root,'manifest.json'),'utf8')));
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
try{
 const page=await browser.newPage();
 for(const [id,map] of Object.entries({hub:manifest.hub,...manifest.maps})){
  const layers=(map.layers??[]).filter(layer=>layer.order<2000).sort((a,b)=>a.order-b.order);
  if(!layers.length)continue;
  const png=await composeMapPng(page,root,{...map,layers},manifest.assets);
  const assetId=`map.baked.${id}`,path=`textures/map-baked-${id}/000.png`;
  await mkdir(join(root,`textures/map-baked-${id}`),{recursive:true});await writeFile(join(root,path),png);
  const provenance=structuredClone(manifest.assets[layers[0].assetId].provenance);
  provenance.originalFile=[...new Set(layers.map(layer=>manifest.assets[layer.assetId].provenance.originalFile))].join(' ; ');
  provenance.conversion=`bake-static-maps.ts ; ${layers.length} couches Remastered figées, ordre original ; densité 2 ; disposition ${map.mapSource}`;
  manifest.assets[assetId]={frames:[{path,durationMs:1000}],size:[map.bounds[2]-map.bounds[0],map.bounds[3]-map.bounds[1]],pivot:[0,0],offset:[0,0],loop:false,flipX:false,provenance};
  map.backgroundAssetId=assetId;console.log(`${id} : ${layers.length} couches fixes composées, premier plan conservé.`);
 }
 await writeFile(join(root,'manifest.json'),JSON.stringify(manifest,null,2));
}finally{await browser.close();}
