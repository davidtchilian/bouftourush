#!/usr/bin/env python3
"""Prépare les icônes et, sur demande, les monstres Remastered Tofu/Scara."""
import importlib.util
import json
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location('game', Path(__file__).with_name('prepare-game.py'))
game = importlib.util.module_from_spec(spec)
spec.loader.exec_module(game)

def main():
    game.hub.validate_remastered_client(game.ROOT)
    catalog = json.loads(Path(__file__).with_name('tofu-scara-assets.json').read_text())
    if catalog['visualVersion'] != '1.40.13-remastered':
        raise RuntimeError('Version visuelle non Remastered')
    builder = game.Builder.__new__(game.Builder)
    builder.manifest = json.loads((game.OUT / 'manifest.json').read_text())
    builder.assets = builder.manifest['assets']
    builder.info = {}
    if '--monsters' in sys.argv:
        for sprite in [1558,1462,1380,1135,1136,1137,1138,1453,1455]:
            builder.actor(sprite)
            (game.OUT / 'manifest.json').write_text(json.dumps(builder.manifest, ensure_ascii=False, indent=2))
    for item in catalog['items']:
        builder.add(f"item.{item['id']}", item['source'], first=True)
    (game.OUT / 'manifest.json').write_text(json.dumps(builder.manifest, ensure_ascii=False, indent=2))
    print(f"{len(catalog['items'])} icônes préparées ; poursuivre le pipeline assets:prepare:tofu-scara avant l'import.")

if __name__ == '__main__':
    main()
