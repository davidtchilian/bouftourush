#!/usr/bin/env python3
"""Import des arènes publiques Tofu/Scara ; exige leur revue de navigation."""
import importlib.util
import json
from pathlib import Path

spec=importlib.util.spec_from_file_location('game',Path(__file__).with_name('prepare-game.py'))
game=importlib.util.module_from_spec(spec);spec.loader.exec_module(game)

def main():
 game.hub.validate_remastered_client(game.ROOT)
 builder=game.Builder.__new__(game.Builder)
 builder.manifest=json.loads((game.OUT/'manifest.json').read_text())
 builder.assets=builder.manifest['assets'];builder.info={}
 for arena,source in [('tofu','maps/9529/9529_0609131545.swf'),('scara','maps/9782/9782_0610211614.swf')]:
  builder.manifest.setdefault('maps',{})[arena]=builder.map(arena,source)
 (game.OUT/'manifest.json').write_text(json.dumps(builder.manifest,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
