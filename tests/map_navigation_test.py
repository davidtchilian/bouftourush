import importlib.util
import json
from pathlib import Path
import unittest
from copy import deepcopy

script = Path(__file__).resolve().parents[1] / 'scripts/map_navigation.py'
spec = importlib.util.spec_from_file_location('map_navigation', script)
navigation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(navigation)


class MapNavigationTest(unittest.TestCase):
    def setUp(self):
        self.manifest = json.loads((script.parent.parent / 'public/assets/manifest.json').read_text())

    def test_overrides_are_repeatable_and_match_public_map(self):
        rules = navigation.load_navigation_rules()
        for map_id, arena in {'hub': self.manifest['hub'], **self.manifest['maps']}.items():
            with self.subTest(map=map_id):
                ids = {cell['id'] for cell in rules['maps'][map_id]['passable']}
                previous = [c for c in arena['walkable'] if c['id'] not in ids]
                updated = navigation.apply_navigation_overrides(map_id, previous, arena['layers'])
                self.assertEqual(updated, arena['walkable'])
                self.assertEqual(navigation.apply_navigation_overrides(map_id, updated, arena['layers']), updated)

    def test_rejects_changed_source_layout(self):
        with self.assertRaisesRegex(ValueError, 'cellule 124'):
            navigation.apply_navigation_overrides('bouftou', [], [])

    def test_requires_review_for_new_maps(self):
        with self.assertRaisesRegex(ValueError, 'Navigation non revue'):
            navigation.apply_navigation_overrides('nouvelle-carte', [], [])

    def test_rejects_new_objects(self):
        arena = self.manifest['maps']['incarnam']
        arena['layers'].append({'assetId': 'map.object.non-revu', 'position': [100, -200], 'order': 2499})
        with self.assertRaisesRegex(ValueError, 'Objet non revu'):
            navigation.apply_navigation_overrides('incarnam', arena['walkable'], arena['layers'])

    def test_rejects_moved_obstacles(self):
        arena = self.manifest['maps']['ensable']
        obstacle = next(layer for layer in arena['layers'] if layer['assetId'] == 'map.object.3531')
        obstacle['position'][0] += 10
        with self.assertRaisesRegex(ValueError, 'Placement des objets modifié'):
            navigation.apply_navigation_overrides('ensable', arena['walkable'], arena['layers'])

    def test_rejects_stale_runtime(self):
        self.assertEqual(navigation.validate_manifest_navigation(self.manifest), 8)
        for corruption in ('blocked_decoration', 'passable_obstacle', 'wrong_source'):
            with self.subTest(corruption=corruption):
                manifest = deepcopy(self.manifest)
                arena = manifest['maps']['bouftou']
                if corruption == 'blocked_decoration':
                    arena['walkable'] = [cell for cell in arena['walkable'] if cell['id'] != 124]
                elif corruption == 'passable_obstacle':
                    arena['walkable'].append({'id': 366, 'position': [185.5, -337.5]})
                else:
                    arena['mapSource'] = 'autre carte'
                with self.assertRaisesRegex(ValueError, 'Navigation périmée|Source de navigation modifiée'):
                    navigation.validate_manifest_navigation(manifest)
