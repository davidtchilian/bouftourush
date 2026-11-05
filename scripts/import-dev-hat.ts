import {cp,readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {parseManifest} from '../src/game/assets/manifest';
import {mergeDeveloperHat} from './dev-hat-assets';
const source=resolve('.local-assets/dev-hat-runtime'),root=resolve(process.argv[2]??'public/assets');
const bundle=JSON.parse(await readFile(join(source,'manifest.json'),'utf8'));
for(const path of new Set<string>(['manifest.json',...Object.values(bundle.assets).flatMap(asset=>(asset as {frames:{path:string}[]}).frames.map(frame=>frame.path))])){
 const target=join(root,'dev-hat',path);await mkdir(dirname(target),{recursive:true});await cp(join(source,path),target);
}
const runtime=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));await mergeDeveloperHat(runtime,root);parseManifest(runtime);
await writeFile(join(root,'manifest.json'),JSON.stringify(runtime,null,2));
console.log('Coiffe du dev : icône Champion, cinq vues portées et aperçus HD intégrés.');
