"""Revue explicite des décors, obstacles et limites, sans modifier les graphismes."""
import argparse
import hashlib
import json
from pathlib import Path


def load_navigation_rules():
    return json.loads(Path(__file__).with_name('map-navigation.json').read_text())


def object_layout_hash(layers):
    objects = [{'assetId': layer['assetId'], 'position': layer['position'], 'order': layer['order'],
                'flipX': layer.get('flipX', False), 'rotation': layer.get('rotation', 0),
                'scale': layer.get('scale', [1, 1])}
               for layer in layers if layer['assetId'].startswith('map.object.')]
    # Les nombres entiers et flottants équivalents ont la même représentation.
    for obj in objects:
        obj['position'] = [float(v) if v else 0.0 for v in obj['position']]
        obj['scale'] = [float(v) for v in obj['scale']]
        obj['rotation'] = float(obj['rotation']) if obj['rotation'] else 0.0
        obj['order'] = float(obj['order'])
    payload = json.dumps(sorted(objects, key=lambda obj: obj['order']), sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(payload.encode()).hexdigest()


def apply_navigation_overrides(map_id, cells, layers):
    rules = load_navigation_rules()
    if map_id not in rules['maps']:
        raise ValueError(f'Navigation non revue : carte {map_id}')
    review = rules['maps'][map_id]
    result = {cell['id']: cell for cell in cells}
    objects = [layer for layer in layers if layer['assetId'].startswith('map.object.')]
    for layer in objects:
        if layer['assetId'] not in rules['objects']:
            raise ValueError(f"Objet non revu : {map_id}, {layer['assetId']}")

    decisions = {}
    for category in ('passable', 'outside'):
        for rule in review[category]:
            cell_id = rule['id']
            if cell_id in decisions:
                raise ValueError(f'Décision de navigation répétée : {map_id}, cellule {cell_id}')
            if not any(layer['order'] == 2000 + cell_id
                       and layer['assetId'] == rule['assetId']
                       and layer['position'] == rule['position'] for layer in objects):
                raise ValueError(f'Décor de navigation modifié : {map_id}, cellule {cell_id}')
            if rules['objects'][rule['assetId']]['kind'] != 'decoration':
                raise ValueError(f'Obstacle déclaré traversable : {map_id}, cellule {cell_id}')
            decisions[cell_id] = category
            if category == 'passable':
                result[cell_id] = {'id': cell_id, 'position': rule['position'][:]}
            else:
                result.pop(cell_id, None)

    for layer in objects:
        front = layer['order'] >= 2000
        cell_id = layer['order'] - (2000 if front else 1000)
        if rules['objects'][layer['assetId']]['kind'] == 'obstacle':
            # L'emprise au sol reste distincte des silhouettes hautes et du feuillage.
            # Les autres cellules bloquées par les données source restent exclues.
            result.pop(cell_id, None)
        elif front and cell_id not in decisions:
            raise ValueError(f'Décor sans décision de navigation : {map_id}, cellule {cell_id}')
    if object_layout_hash(layers) != review['layoutSha256']:
        raise ValueError(f'Placement des objets modifié : {map_id} ; revoir les collisions')
    return sorted(result.values(), key=lambda cell: cell['id'])


def validate_manifest_navigation(manifest):
    rules = load_navigation_rules()
    maps = {'hub': manifest['hub'], **manifest.get('maps', {})}
    for map_id, arena in maps.items():
        source = rules['maps'].get(map_id, {}).get('source')
        if not source or source not in arena.get('mapSource', ''):
            raise ValueError(f'Source de navigation modifiée : {map_id}')
        review = rules['maps'][map_id]
        if 'walkable' in review and arena['walkable'] != review['walkable']:
            raise ValueError(f'Navigation périmée : {map_id} ; cellules revues modifiées')
        expected = apply_navigation_overrides(map_id, arena['walkable'], arena['layers'])
        if expected != sorted(arena['walkable'], key=lambda cell: cell['id']):
            raise ValueError(f'Navigation périmée : {map_id} ; régénérer le manifeste')
    return len(maps)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', type=Path, required=True)
    args = parser.parse_args()
    try:
        count = validate_manifest_navigation(json.loads(args.check.read_text()))
    except (ValueError, KeyError) as error:
        parser.exit(1, f'Navigation invalide : {error}\n')
    print(f'Navigation vérifiée : {count} cartes, décors traversables et obstacles bloquants.')
