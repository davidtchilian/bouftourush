#!/usr/bin/env python3
"""Inventaire local d'un client ZIP, sans exécuter de code ActionScript.
Les noms viennent du sprites.xml fourni ; les symboles viennent des tags SWF.
"""
import argparse
import collections
import hashlib
import json
import struct
import xml.etree.ElementTree as ET
import zipfile
import zlib
from pathlib import Path


def tags(data, start):
    offset = start
    while offset + 2 <= len(data):
        header = struct.unpack_from('<H', data, offset)[0]
        offset += 2
        code, length = header >> 6, header & 63
        if length == 63:
            length = struct.unpack_from('<I', data, offset)[0]
            offset += 4
        if offset + length > len(data):
            raise ValueError('Tag SWF tronqué')
        yield code, data[offset:offset + length]
        offset += length
        if code == 0:
            break


def inspect_swf(raw):
    if raw[:3] == b'CWS':
        data = zlib.decompress(raw[8:])
    elif raw[:3] == b'FWS':
        data = raw[8:]
    else:
        raise ValueError('Seuls les SWF FWS/CWS sont pris en charge')
    rect_size = (5 + 4 * (data[0] >> 3) + 7) // 8
    rate, frames = struct.unpack_from('<HH', data, rect_size)
    exports = {}
    sprites = {}
    labels = []
    for code, payload in tags(data, rect_size + 4):
        if code == 39:
            sid, count = struct.unpack_from('<HH', payload)
            frame = 1
            sprite_labels = []
            children = set()
            stops = []
            for subcode, subdata in tags(payload, 4):
                if subcode == 43:
                    sprite_labels.append({'frame': frame, 'label': subdata.split(b'\0')[0].decode('utf-8', 'replace')})
                elif subcode == 12 and subdata == b'\x07\x00':
                    stops.append(frame)
                elif subcode == 1:
                    frame += 1
                elif subcode == 26 and subdata[0] & 2:
                    children.add(struct.unpack_from('<H', subdata, 3)[0])
                elif subcode == 4:
                    children.add(struct.unpack_from('<H', subdata)[0])
            sprites[sid] = {'frameCount': count, 'labels': sprite_labels, 'children': sorted(children), 'stopFrames': stops}
        elif code in (56, 76):
            count = struct.unpack_from('<H', payload)[0]
            offset = 2
            for _ in range(count):
                sid = struct.unpack_from('<H', payload, offset)[0]
                end = payload.index(0, offset + 2)
                exports[payload[offset + 2:end].decode('utf-8', 'replace')] = sid
                offset = end + 1
        elif code == 43:
            labels.append(payload.split(b'\0')[0].decode('utf-8', 'replace'))
    def nested_frames(sid, visited):
        if sid in visited or sid not in sprites:
            return 1
        visited = visited | {sid}
        sprite = sprites[sid]
        return max([sprite['frameCount']] + [nested_frames(child, visited) for child in sprite['children']])

    def playback_frames(sid, visited):
        if sid in visited or sid not in sprites:
            return 1
        sprite = sprites[sid]
        if sprite['frameCount'] > 1:
            return sprite['stopFrames'][0] if sprite['stopFrames'] else sprite['frameCount']
        return max([1] + [playback_frames(child, visited | {sid}) for child in sprite['children']])

    return {'fps': rate / 256, 'mainFrames': frames, 'labels': labels,
            'symbols': {name: {'characterId': sid, **sprites.get(sid, {}), 'maxNestedFrames': nested_frames(sid, set()), 'playbackFrames': playback_frames(sid, set())} for name, sid in exports.items()}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('--output', type=Path, default=Path('.local-assets/client-catalog.json'))
    args = parser.parse_args()
    with zipfile.ZipFile(args.archive) as archive:
        files = [i for i in archive.infolist() if not i.is_dir()]
        names = {i.filename for i in files}
        sprite_names = collections.defaultdict(set)
        if 'clips/sprites/sprites.xml' in names:
            for sprite in ET.fromstring(archive.read('clips/sprites/sprites.xml').decode('utf-8-sig')).iter('sprite'):
                sprite_names[sprite.attrib['id']].add(sprite.attrib.get('name', ''))
        sprite_catalog = []
        for info in files:
            if info.filename.startswith('clips/sprites/') and info.filename.endswith('.swf'):
                sprite_id = Path(info.filename).stem
                entry = {'path': info.filename, 'bytes': info.file_size, 'names': sorted(sprite_names[sprite_id])}
                try:
                    entry.update(inspect_swf(archive.read(info)))
                except (ValueError, struct.error, zlib.error) as error:
                    entry['inspectionError'] = str(error)
                sprite_catalog.append(entry)
        result = {
            'archive': args.archive.name,
            'sha256': hashlib.file_digest(args.archive.open('rb'), 'sha256').hexdigest(),
            'fileCount': len(files), 'uncompressedBytes': sum(i.file_size for i in files),
            'extensions': dict(collections.Counter(Path(i.filename).suffix for i in files)),
            'groups': dict(collections.Counter('/'.join(i.filename.split('/')[:2]) for i in files)),
            'sprites': sprite_catalog,
            'files': [i.filename for i in files],
        }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Inventaire : {len(files)} fichiers, {len(sprite_catalog)} sprites → {args.output}")


if __name__ == '__main__':
    main()
