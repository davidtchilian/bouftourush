/** Aperçus complets des cartes en préparation ; aucune donnée de navigation ou de combat. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from '@playwright/test';
import {composeMapPng} from './map-png';
import type {Manifest,MapDefinition} from '../src/game/assets/manifest';
const root=resolve(process.argv[2]??'.local-assets/future-dungeons-runtime');
const bundle=JSON.parse(await readFile(join(root,'manifest.json'),'utf8')) as {preparedOnly:boolean;assets:Manifest['assets'];maps:Record<string,Pick<MapDefinition,'bounds'|'layers'>&{mapSource:string}>};
if(!bundle.preparedOnly)throw new Error('Ce préparateur exige un lot futur explicitement non actif.');
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
try{
 const page=await browser.newPage();
 for(const [id,map] of Object.entries(bundle.maps)){
  const png=await composeMapPng(page,root,map,bundle.assets);
  const path=`textures/preview-map-${id}/000.png`;await mkdir(join(root,`textures/preview-map-${id}`),{recursive:true});await writeFile(join(root,path),png);
  const provenance=structuredClone(bundle.assets[map.layers![0].assetId].provenance);
  provenance.originalFile=map.mapSource;provenance.conversion='Composition de toutes les couches originales Remastered ; première frame ; densité 2 ; aperçu de préparation sans navigation.';
  bundle.assets[`preview.map.${id}`]={frames:[{path,durationMs:1000}],size:[map.bounds[2]-map.bounds[0],map.bounds[3]-map.bounds[1]],pivot:[0,0],offset:[0,0],loop:false,flipX:false,provenance};
  console.log(`Aperçu préparé : ${id}`);
 }
 await writeFile(join(root,'manifest.json'),JSON.stringify(bundle,null,2));
}finally{await browser.close();}
