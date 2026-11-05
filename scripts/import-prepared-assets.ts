/** Publie uniquement les PNG du lot de préparation, hors du manifeste de jeu actif. */
import {cp,mkdir,rename,rm,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {inspectPreparedAssets} from './prepared-assets';
import {compactAnimationFrames,framePixels} from './compact-animation';
try{
 const {root,bundle,paths}=await inspectPreparedAssets(process.argv[2]??'.local-assets/future-dungeons-runtime');
 let sourceFrames=0,storedFrames=0;const imageRegions=new Set<string>();
 for(const asset of Object.values(bundle.assets)){
  const count=asset.frames.length;sourceFrames+=count;asset.frames=compactAnimationFrames(asset.frames);storedFrames+=asset.frames.length;
  for(const frame of asset.frames)imageRegions.add(framePixels(frame));
  if(asset.frames.length<count)asset.provenance.conversion+=` ; ${count} frames natives, ${asset.frames.length} entrées après regroupement des pauses identiques, durée conservée`;
 }
 bundle.timelineSummary={sourceFrames,storedFrames,imageRegions:imageRegions.size,pngFiles:paths.size};
 const target=resolve('public/assets/prepared'),staging=resolve('public/.prepared-assets-staging');
 if(root===target||root.startsWith(target+'/'))throw new Error('La source préparée doit rester hors de public/assets/prepared.');
 await rm(staging,{recursive:true,force:true});await mkdir(staging,{recursive:true});
 for(const path of paths){const out=resolve(staging,path);await mkdir(dirname(out),{recursive:true});await cp(resolve(root,path),out);}
 await writeFile(resolve(staging,'manifest.json'),JSON.stringify(bundle,null,2));
 await inspectPreparedAssets(staging);await rm(target,{recursive:true,force:true});await rename(staging,target);
 console.log(`${Object.keys(bundle.assets).length} séquences préparées, six familles non actives, dans public/assets/prepared.`);
 console.log(`${sourceFrames} références natives → ${storedFrames} entrées, ${imageRegions.size} régions d'image, ${paths.size} fichiers PNG.`);
 for(const family of bundle.catalog.families)if(!family.map.source)console.log(`${family.id} : ${family.map.reason}`);
}catch(error){console.error(error instanceof Error?error.message:error);process.exitCode=1;}
