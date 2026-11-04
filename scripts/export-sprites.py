#!/usr/bin/env python3
"""Exporte les timelines imbriquées avec JPEXS local, sans lancer les SWF.
Sortie de recherche privée : pivots et directions sémantiques restent à valider.
"""
import argparse
import hashlib
import importlib.util
import json
import struct
import subprocess
from pathlib import Path

# Le nom du script public comporte un tiret ; chargement local explicite.
spec = importlib.util.spec_from_file_location('inspect_client', Path(__file__).with_name('inspect-client.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('client', type=Path)
    parser.add_argument('--client-version', default='1.40.13-remastered', choices=['1.40.13-remastered'], help='Version déclarée de la source ; à vérifier contre l’archive')
    parser.add_argument('--ffdec', type=Path, default=Path('.local-assets/tools/ffdec/ffdec.jar'))
    parser.add_argument('--sprites', type=int, nargs='+', default=[90, 91, 1566, 1573, 1574, 1581])
    parser.add_argument('--symbols', nargs='+', default=['staticS', 'staticR', 'staticL', 'runS', 'runR', 'runL', 'hitR', 'dieR', 'anim0R'])
    parser.add_argument('--output', type=Path, default=Path('.local-assets/exports-1.40.13'))
    args = parser.parse_args()
    if not args.ffdec.is_file():
        parser.error('JPEXS absent : fournir --ffdec /chemin/ffdec.jar')
    args.output.mkdir(parents=True, exist_ok=True)
    entries, missing = [], []
    for sprite_id in args.sprites:
        relative = Path(f'clips/sprites/{sprite_id}.swf')
        source = args.client / relative
        raw = source.read_bytes()
        info = module.inspect_swf(raw)
        for symbol in args.symbols:
            if symbol not in info['symbols']:
                missing.append(f'{sprite_id}:{symbol}')
                continue
            metadata = info['symbols'][symbol]
            count = metadata['frameCount']
            nested = metadata['maxNestedFrames']
            output = args.output / str(sprite_id) / symbol
            output.mkdir(parents=True, exist_ok=True)
            command = ['java', '-Xmx1g', '-Djava.awt.headless=true', '-jar', str(args.ffdec.resolve()),
                       '-onerror', 'abort', '-selectid', str(metadata['characterId']),
                       '-sublength', str(nested), '-format', 'sprite:png', '-export', 'sprite',
                       str(output.resolve()), str(source.resolve())]
            with (output / 'conversion.log').open('w') as log:
                subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, check=True)
            frames = sorted(output.rglob('*.png'), key=lambda p: tuple(int(part) if part.isdigit() else part for part in p.relative_to(output).with_suffix('').parts))
            if not frames:
                raise RuntimeError(f'Aucune frame : {source}:{symbol}')
            details = []
            hashes = set()
            for frame in frames:
                data = frame.read_bytes()
                hashes.add(hashlib.sha256(data).hexdigest())
                width, height = struct.unpack('>II', data[16:24])
                details.append({'path': frame.relative_to(args.output).as_posix(), 'durationMs': 1000 / info['fps'], 'width': width, 'height': height})
            entries.append({'originalFile': relative.as_posix(), 'sha256': hashlib.sha256(raw).hexdigest(),
                            'symbol': symbol, 'characterId': metadata['characterId'], 'sourceFps': info['fps'],
                            'outerFrames': count, 'maxNestedFrames': nested, 'distinctFrames': len(hashes),
                            'frames': details, 'pivot': None, 'semanticDirection': None,
                            'conversion': 'JPEXS FFDec (version dans conversion.log) ; ' + ' '.join(command[6:]),
                            'status': 'Export de recherche : vérifier les actions timeline, le pivot, les imports externes et la direction avant intégration.'})
            print(f'{sprite_id}:{symbol} : {len(frames)} PNG, {len(hashes)} distincts, {info["fps"]} fps', flush=True)
    catalog = {'declaredClientVersion': args.client_version, 'source': 'Client local fourni ; rattacher à l’archive et à son empreinte dans docs/ASSETS.md',
               'redistributionPermission': 'Non établie : fichiers privés uniquement.', 'animations': entries, 'missingSymbols': missing}
    (args.output / 'research-manifest.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Catalogue écrit. Symboles absents : {", ".join(missing) or "aucun"}')


if __name__ == '__main__':
    main()
