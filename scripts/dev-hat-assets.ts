import {readFile,cp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import type {Manifest} from '../src/game/assets/manifest';
/** Réutilise le lot Champion vérifié, y compris pendant une régénération du jeu. */
export async function mergeDeveloperHat(runtime:Manifest,root:string){
 const folder=join(root,'dev-hat');
 try{await access(join(folder,'manifest.json'));}catch(error){
  if((error as NodeJS.ErrnoException).code!=='ENOENT'||resolve(root)===resolve('public/assets'))throw error;
  await cp(resolve('public/assets/dev-hat'),folder,{recursive:true});
 }
 const bundle=JSON.parse(await readFile(join(folder,'manifest.json'),'utf8'));
 if(!runtime.composition)throw new Error('Composition du Crâ absente.');
 for(const [id,value] of Object.entries(bundle.assets)){
  const asset=structuredClone(value) as Manifest['assets'][string];
  if(asset.provenance.version!=='1.40.13-remastered')throw new Error('Source Champion non Remastered.');
  for(const frame of asset.frames)frame.path='dev-hat/'+frame.path;
  runtime.assets[id]=asset;
 }
 runtime.composition.accessories.devHat=bundle.accessory;
}
