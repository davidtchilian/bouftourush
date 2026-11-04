import { realpath, readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { parseManifest, type Manifest } from '../src/game/assets/manifest';
export async function inspectAssets(directory: string): Promise<{ root: string; manifest: Manifest }> {
  let root: string;
  try { root = await realpath(directory); } catch { throw new Error(`Répertoire absent : ${directory}. Fournir un export PNG autorisé avec manifest.json ; voir docs/ASSETS.md.`); }
  const manifest = parseManifest(JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8')));
  const paths=new Set(Object.values(manifest.assets).flatMap(asset=>asset.frames.map(frame=>frame.path)));
  for (const relative of paths) {
    const path = await realpath(resolve(root, relative));
    if (!path.startsWith(root + sep) || !(await stat(path)).isFile()) throw new Error(`Fichier interdit : ${relative}`);
    const bytes = await readFile(path);
    if (!bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error(`PNG invalide : ${relative}`);
  }
  return {root, manifest};
}
