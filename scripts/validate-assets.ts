import {classes,missingClassAssets} from '../src/data/classes';
import { inspectAssets } from './asset-files';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
try {
  const {root,manifest} = await inspectAssets(process.argv[2] ?? 'public/assets');
  for(const definition of Object.values(classes).filter(c=>c.id!=='cra'))if(Object.keys(manifest.assets).some(id=>id.startsWith(definition.sprite+'.'))){const missing=missingClassAssets(manifest,definition);if(missing.length)throw new Error(missing.join(', '));}
  const navigation=execFileSync('python3',[fileURLToPath(new URL('./map_navigation.py',import.meta.url)),'--check',join(root,'manifest.json')],{encoding:'utf8'});
  console.log(navigation.trim());
  console.log(`Assets valides : ${Object.keys(manifest.assets).length} séquences. La provenance déclarée doit être vérifiée par le fournisseur.`);
} catch (error) { console.error('Assets incomplets :', error instanceof Error ? error.message : error); process.exitCode = 1; }
