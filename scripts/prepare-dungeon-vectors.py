#!/usr/bin/env python3
"""Réexporte les vecteurs Tofu/Scara à densité 3 ; cartes statiques à densité 2."""
import importlib.util
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path

spec = importlib.util.spec_from_file_location('appearance', Path(__file__).with_name('prepare-appearance.py'))
a = importlib.util.module_from_spec(spec)
spec.loader.exec_module(a)


def main():
    a.game.hub.validate_remastered_client(a.ROOT)
    manifest = json.loads((a.OUT / 'manifest.json').read_text())
    sprites = {'1558', '1462', '1380', '1135', '1136', '1137', '1138', '1453', '1455'}
    map_assets = {layer['assetId'] for arena in ('tofu', 'scara') for layer in manifest['maps'][arena]['layers']}
    jobs = []
    entries = []
    symbols = {}
    for id, asset in manifest['assets'].items():
        monster = id.startswith('mob.') and id.split('.')[1] in sprites
        if not monster and id not in map_assets:
            continue
        relative, symbol = asset['provenance']['originalFile'].split('#')
        source = a.ROOT / relative
        if relative not in symbols:
            symbols[relative] = a.game.hub.inspector.inspect_swf(source.read_bytes())['symbols']
        info = symbols[relative][symbol]
        count = len(asset['frames']) if monster else 1
        entries.append((id, asset, source, info['characterId'], count, monster))
    # Regrouper les symboles manquants évite de relancer une JVM par décor.
    batches = {}
    for id, asset, source, cid, count, monster in entries:
        signature = hashlib.sha256(source.read_bytes()).hexdigest()
        target = a.CACHE / f'{source.stem}-{cid}-1-{count}'
        if not (target / 'done').exists() or (target / 'done').read_text() != signature:
            batches.setdefault((source, count), []).append(cid)
    for (source, count), ids in batches.items():
        target = a.CACHE / f'batch-vectors-{source.stem}-{count}'
        if target.exists():
            shutil.rmtree(target)
        target.mkdir(parents=True)
        with (target / 'log').open('w') as log:
            subprocess.run(a.JAVA + ['-selectid', ','.join(map(str, ids)),
                           '-select', ','.join(f'{cid}:1' for cid in ids),
                           '-sublength', str(count), '-format', 'sprite:svg',
                           '-export', 'sprite', str(target.resolve()), str(source.resolve())],
                           stdout=log, stderr=subprocess.STDOUT, check=True)
        signature = hashlib.sha256(source.read_bytes()).hexdigest()
        for folder in target.glob('DefineSprite_*'):
            cid = int(re.match(r'DefineSprite_(\d+)', folder.name)[1])
            destination = a.CACHE / f'{source.stem}-{cid}-1-{count}'
            if destination.exists():
                shutil.rmtree(destination)
            shutil.copytree(folder, destination / folder.name)
            (destination / 'done').write_text(signature)
        shutil.rmtree(target)
    for id, asset, source, cid, count, monster in entries:
        frames = a.export(source, cid, count)
        if len(frames) != count:
            raise RuntimeError(f'Timeline incomplète : {id}, {len(frames)}/{count}')
        asset['provenance']['conversion'] += f' ; vecteurs originaux, densité {3 if monster else 2}, cadrage commun de la timeline'
        jobs.append({'id': id, 'svgs': [str(p) for p in frames], 'icon': False, 'density': 3 if monster else 2})
        print(id, count, 'frames vectorielles', flush=True)
    (a.OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    (a.CACHE / 'dungeon-vector-jobs.json').write_text(json.dumps(jobs))


if __name__ == '__main__':
    main()
