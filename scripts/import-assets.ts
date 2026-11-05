import { cp, mkdir, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { inspectAssets } from './asset-files';
// Aucun téléchargement ni exécution de convertisseur fourni par un manifeste.
const input = process.argv[2];
try {
  if (!input) throw new Error('Usage : pnpm assets:import /chemin/vers/export-png (voir docs/ASSETS.md)');
  const {root, manifest} = await inspectAssets(input);
  const destination = resolve('public/assets');
  if (root === destination || root.startsWith(destination + '/')) throw new Error('La source doit être hors de public/assets');
  const staging = resolve('public/.assets-staging');
  await rm(staging, {recursive:true, force:true});
  await mkdir(staging, {recursive:true});
  for (const path of new Set(['manifest.json', ...Object.values(manifest.assets).flatMap(a => a.frames.map(f => f.path))])) {
    const target = resolve(staging,path);
    await mkdir(resolve(target,'..'),{recursive:true});
    await cp(resolve(root,path),target);
  }
  await inspectAssets(staging);
  // Un lot futur est indépendant du manifeste actif et survit à sa régénération.
  for(const folder of ['prepared','dev-hat'])try { await cp(resolve(destination,folder),resolve(staging,folder),{recursive:true}); }
  catch(error) { if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error; }
  await rm(destination,{recursive:true,force:true});
  await rename(staging,destination);
  console.log('Lot runtime importé dans public/assets. Les restrictions de redistribution restent documentées dans docs/ASSETS.md.');
} catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
