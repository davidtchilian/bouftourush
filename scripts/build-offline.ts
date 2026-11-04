import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
async function files(root:string,prefix=''):Promise<string[]>{
 const result:string[]=[];
 for(const entry of await readdir(join(root,prefix),{withFileTypes:true})){
  const path=prefix?`${prefix}/${entry.name}`:entry.name;
  if(entry.isDirectory())result.push(...await files(root,path));else if(path!=='offline-manifest.json')result.push(path);
 }
 return result.sort();
}
const paths=await files('dist'),hash=createHash('sha256');
for(const path of paths){hash.update(path);hash.update(await readFile(join('dist',path)));}
const version=hash.digest('hex').slice(0,16);
await writeFile('dist/offline-manifest.json',JSON.stringify({version,paths:['/',...paths.map(path=>'/'+path)]}));
// Une nouvelle compilation doit aussi renouveler le service worker, même si son code fonctionnel reste identique.
await writeFile('dist/sw.js',(await readFile('dist/sw.js','utf8'))+`\n/* compilation ${version} */\n`);
console.log(`Cache hors connexion préparé : ${paths.length} fichiers locaux.`);
