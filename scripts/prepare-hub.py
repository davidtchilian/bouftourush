#!/usr/bin/env python3
"""Prépare Astrub 7411 depuis sa variante publique non chiffrée et les SWF Classic.
Conversion de graphismes originaux uniquement. Tous les résultats restent locaux.
"""
import argparse
import hashlib
import importlib.util
import json
import re
import shutil
import struct
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

spec = importlib.util.spec_from_file_location('inspector', Path(__file__).with_name('inspect-client.py'))
inspector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inspector)
navigation_spec = importlib.util.spec_from_file_location('map_navigation', Path(__file__).with_name('map_navigation.py'))
map_navigation = importlib.util.module_from_spec(navigation_spec)
navigation_spec.loader.exec_module(map_navigation)
ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'


def decode_map(script):
    data = re.search(r'mapData\s*=\s*"([^"]+)"', script)[1]
    if len(data) % 10 or any(c not in ALPHABET for c in data):
        raise ValueError('Données de carte non prises en charge : seule la variante publique non chiffrée est acceptée')
    width = int(re.search(r'width\s*=\s*(\d+)', script)[1])
    cells = []
    x, row, offset, row_last = -1, 0, 0, width - 1
    for index in range(0, len(data), 10):
        if x == row_last:
            x = 0
            row += 1
            offset = 26.5 if offset == 0 else 0
            row_last += -1 if offset else 1
        else:
            x += 1
        v = [ALPHABET.index(c) for c in data[index:index+10]]
        cells.append({'id': index // 10, 'x': x*53+offset, 'y': row*13.5-20*((v[1]&15)-7),
                      'active': bool(v[0]&32), 'movement': (v[2]&56)>>3,
                      'ground': ((v[0]&24)<<6)+((v[2]&7)<<6)+v[3],
                      'groundRotation': (v[1]&48)>>4, 'slope': (v[4]&60)>>2, 'groundFlip': bool(v[4]&2),
                      'object1': ((v[0]&4)<<11)+((v[4]&1)<<12)+(v[5]<<6)+v[6],
                      'object1Rotation': (v[7]&48)>>4, 'object1Flip': bool(v[7]&8),
                      'object2': ((v[0]&2)<<12)+((v[7]&1)<<12)+(v[8]<<6)+v[9], 'object2Flip': bool(v[7]&4)})
    return cells


def validate_remastered_client(client):
    """Ancre de l'archive Remastered 1.40.13 vérifiée ; empêche un import Classic mal étiqueté."""
    source = client / 'clips/sprites/90.swf'
    if not source.is_file():
        raise ValueError(f'Client Remastered absent : {source}. Voir docs/ASSETS.md.')
    if hashlib.sha256(source.read_bytes()).hexdigest() != '9a5e7f9c168df67e0c90867da3443b478f0840ec34e196948e4eba23d0a664f0':
        raise ValueError('Client refusé : fournir le Dofus Retro Remastered 1.40.13 original référencé dans docs/ASSETS.md ; aucun repli Classic autorisé.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--client', type=Path, default=Path('.local-assets/client-1.40.13-remastered'))
    parser.add_argument('--dofedex', type=Path, default=Path('.local-assets/dofedex'))
    parser.add_argument('--ffdec', type=Path, default=Path('.local-assets/tools/ffdec/ffdec.jar'))
    parser.add_argument('--output', type=Path, default=Path('.local-assets/hub-runtime'))
    args = parser.parse_args()
    validate_remastered_client(args.client)
    output = args.output
    cache = output / '_conversion'
    cache.mkdir(parents=True, exist_ok=True)
    java = ['java', '-Xmx2g', '-Djava.awt.headless=true', '-jar', str(args.ffdec.resolve()), '-onerror', 'abort']

    def convert(source, target, ids, fmt, nested=1):
        marker = target / '.complete'
        signature=hashlib.sha256(source.read_bytes()).hexdigest()+f':{ids}:{fmt}:{nested}:v1'
        if marker.exists() and marker.read_text()==signature:
            return
        if target.exists():
            shutil.rmtree(target)
        target.mkdir(parents=True, exist_ok=True)
        command = java + ['-selectid', ','.join(map(str, ids)), '-select', ','.join(f'{cid}:1' for cid in ids), '-sublength', str(nested),
                          '-format', 'sprite:'+fmt, '-export', 'sprite', str(target.resolve()), str(source.resolve())]
        with (target / 'conversion.log').open('w') as log:
            subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, check=True)
        marker.write_text(signature)

    map_source = args.dofedex / 'maps/7411/7411_0612131401.swf'
    map_as = cache / 'map/scripts/frame_1/DoAction.as'
    if not map_as.exists():
        with (cache / 'map.log').open('w') as log:
            subprocess.run(java + ['-export', 'script', str((cache/'map').resolve()), str(map_source.resolve())], stdout=log, stderr=subprocess.STDOUT, check=True)
    cells = decode_map(map_as.read_text())
    needed = {'ground': {71}, 'object': set()}
    for c in cells:
        if not c['active']:
            continue
        if c['slope'] != 1 or c['groundRotation'] or c['object1Rotation']:
            raise ValueError(f'Transformation de cellule à implémenter : {c["id"]}')
        needed['ground'].add(c['ground'])
        needed['object'].update([c['object1'], c['object2']])
    for ids in needed.values():
        ids.discard(0)
    libraries = {}
    lookup = {}
    for source in sorted((args.client / 'clips/gfx').glob('*.swf')):
        category = 'ground' if source.stem.startswith('g') else 'object' if source.stem.startswith('o') else None
        if category is None:
            continue
        info = inspector.inspect_swf(source.read_bytes())
        selected = {name: meta for name, meta in info['symbols'].items() if name.isdigit() and int(name) in needed[category]}
        if selected:
            libraries[source] = selected
            for name in selected:
                key = (category, int(name))
                if key in lookup:
                    raise ValueError(f'Symbole ambigu : {key}')
                lookup[key] = source
    for category, ids in needed.items():
        for sid in ids:
            if (category,sid) not in lookup:
                raise ValueError(f'Décor introuvable : {category}:{sid}')
    for source, selected in libraries.items():
        ids = [m['characterId'] for m in selected.values()]
        for fmt in ['png','svg']:
            print('Conversion',source.name,fmt,len(ids),'symboles',flush=True)
            convert(source,cache/source.stem/fmt,ids,fmt)

    assets = {}
    rights = 'Usage local uniquement ; aucune autorisation de redistribution établie.'

    def register(asset_id, source, symbol, metadata, png_root, svg_root):
        cid = metadata['characterId']
        png_dir = next(p for p in png_root.iterdir() if p.is_dir() and p.name.startswith(f'DefineSprite_{cid}_'))
        svg_dir = next(p for p in svg_root.iterdir() if p.is_dir() and p.name.startswith(f'DefineSprite_{cid}_'))
        svg = ET.parse(next(svg_dir.rglob('*.svg'))).getroot()
        group = svg.find('{http://www.w3.org/2000/svg}g')
        matrix = [float(v) for v in re.search(r'matrix\(([^)]+)\)',group.attrib['transform'])[1].split(',')]
        width, height = float(svg.attrib['width'].removesuffix('px')), float(svg.attrib['height'].removesuffix('px'))
        frames = sorted(png_dir.rglob('*.png'), key=lambda p: tuple(int(s) if s.isdigit() else s for s in p.relative_to(png_dir).with_suffix('').parts))
        frames = frames[:metadata.get('playbackFrames', len(frames))]
        relative = Path('textures') / asset_id.replace('.','-')
        (output/relative).mkdir(parents=True,exist_ok=True)
        result = []
        for i, frame in enumerate(frames):
            target = relative/f'{i:03}.png'
            shutil.copyfile(frame,output/target)
            result.append({'path':target.as_posix(),'durationMs':1000/metadata.get('fps',20)})
        assets[asset_id] = {'frames':result,'pivot':[matrix[4]/width,matrix[5]/height], 'size':[width,height],
                            'offset':[0,0],'loop':True,'provenance':{'source':'https://github.com/dofera/dofedex/releases/tag/1.40.13',
                            'version':'1.40.13-remastered','originalFile':source.relative_to(args.client).as_posix()+'#'+symbol,
                            'conversion':'JPEXS 26.4.0 PNG + origine extraite du SVG original ; scripts/prepare-hub.py','usageRights':rights}}
        return asset_id

    for (category,sid), source in lookup.items():
        register(f'map.{category}.{sid}',source,str(sid),libraries[source][str(sid)],cache/source.stem/'png',cache/source.stem/'svg')
    # Crâ : cinq vues natives, miroirs conformes au loader de référence.
    cra = args.client/'clips/sprites/90.swf'
    info = inspector.inspect_swf(cra.read_bytes())
    symbols = {name:info['symbols'][name] for name in ['staticS','staticR','staticF','staticL','staticB','runS','runR','runF','runL','runB']}
    for fmt in ['svg']:
        convert(cra,cache/'cra'/fmt,[m['characterId'] for m in symbols.values()],fmt)
    for name,meta in symbols.items():
        convert(cra,cache/'cra'/name,[meta['characterId']],'png',meta['maxNestedFrames'])
    for direction, suffix, flip in [('east','S',False),('southeast','R',False),('south','F',False),('southwest','R',True),('west','S',True),('northwest','L',False),('north','B',False),('northeast','L',True)]:
        for action, prefix in [('idle','static'),('run','run')]:
            symbol=prefix+suffix
            register(f'cra.{action}.{direction}',cra,symbol,{**symbols[symbol],'fps':info['fps']},cache/'cra'/symbol,cache/'cra'/'svg')
            assets[f'cra.{action}.{direction}']['flipX']=flip
            assets[f'cra.{action}.{direction}']['loop']=action=='run'
    layers=[{'assetId':'map.ground.71','position':[0,0],'order':0,'flipX':False}]
    for c in cells:
        if not c['active']:
            continue
        for key,category,order in [('ground','ground',100),('object1','object',1000),('object2','object',2000)]:
            if c[key]:
                layers.append({'assetId':f'map.{category}.{c[key]}','position':[c['x'],-c['y']], 'order': order+c['id'], 'flipX':c.get(key+'Flip',False)})
    # Alias de la couche de fond, la carte réelle est l'ensemble hub.layers.
    assets['map.astrub.zaap']=assets['map.ground.71']
    walkable=[{'id':c['id'],'position':[c['x'],-c['y']]} for c in cells if c['active'] and c['movement']>1 and not c['object2'] and 27<c['x']<715 and 14<c['y']<418]
    walkable=map_navigation.apply_navigation_overrides('hub',walkable,layers)
    spawn=min(walkable,key=lambda c:(c['position'][0]-318)**2+(c['position'][1]+324)**2)['position']
    manifest={'version':1,'assets':assets,'hub':{'bounds':[0,-432,742,0],'spawn':spawn,'cameraHeight':432,'layers':layers,'walkable':walkable,
              'mapSource':'Dofedex maps/7411/7411_0612131401.swf ; disposition historique, bibliothèques Remastered 1.40.13'}}
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    print(f'Manifeste préparé : {len(layers)} couches et {len(walkable)} cellules traversables → {output}',flush=True)


if __name__ == '__main__':
    main()
