/** Fusionne un complément préparé sans toucher au manifeste actif. */
import {readFile,writeFile,realpath,mkdir,cp,rename} from 'node:fs/promises';
import {resolve,join,dirname,sep} from 'node:path';
import {manifestSchema} from '../src/game/assets/manifest';
const root=resolve('.local-assets/future-dungeons-runtime'),input=await realpath(process.argv[2]??'.local-assets/future-blop-map');
const bundle=JSON.parse(await readFile(join(root,'manifest.json'),'utf8')),part=JSON.parse(await readFile(join(input,'manifest.json'),'utf8'));
if(bundle.preparedOnly!==true||part.preparedOnly!==true)throw new Error('Fusion réservée aux lots de préparation non actifs.');
const assets=manifestSchema.shape.assets.parse(part.assets);
for(const [id,asset] of Object.entries(assets)){
 if(bundle.assets[id])throw new Error(`Séquence déjà présente : ${id}`);
 for(const frame of asset.frames){
  const source=await realpath(join(input,frame.path));if(!source.startsWith(input+sep))throw new Error(`PNG hors du complément : ${frame.path}`);
  const bytes=await readFile(source);if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error(`PNG invalide : ${frame.path}`);
  const output=join(root,frame.path);await mkdir(dirname(output),{recursive:true});await cp(source,output);
 }
 bundle.assets[id]=asset;
}
Object.assign(bundle.maps,part.maps);
bundle.catalog=JSON.parse(await readFile('scripts/future-dungeons-assets.json','utf8'));
for(const map of Object.values(bundle.maps) as {layers:{assetId:string}[]}[])for(const layer of map.layers)if(!bundle.assets[layer.assetId])throw new Error(`Décor absent : ${layer.assetId}`);
const staging=join(root,'manifest.merge.json');await writeFile(staging,JSON.stringify(bundle,null,2));await rename(staging,join(root,'manifest.json'));
console.log(`${Object.keys(assets).length} décors ajoutés au lot préparé ; six cartes publiques.`);
