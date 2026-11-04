#!/usr/bin/env python3
"""Exporte les quatre icônes depuis icons/up de l'archive Remastered vérifiée."""
import hashlib
import importlib.util
import json
import zipfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('game',Path(__file__).with_name('prepare-game.py'))
game=importlib.util.module_from_spec(spec);spec.loader.exec_module(game)

def main():
 game.hub.validate_remastered_client(game.ROOT)
 manifest=json.loads((game.OUT/'manifest.json').read_text())
 builder=object.__new__(game.Builder);builder.assets=manifest['assets'];builder.info={}
 jobs=[];hashes={}
 archive=Path('.local-assets/dofus-1.40.13-remastered.zip')
 with zipfile.ZipFile(archive) as source:
  for key,id in [('explosive',179),('flaming',165),('magic',161),('power',166)]:
   relative=f'clips/spells/icons/up/{id}.swf';path=game.ROOT/relative
   matches=[name for name in source.namelist() if name==relative or name.endswith('/'+relative)]
   if len(matches)!=1 or source.read(matches[0])!=path.read_bytes():raise RuntimeError(f'Icône non vérifiée dans l’archive Remastered : {relative}')
   asset_id=f'ui.spell.{key}';builder.add(asset_id,relative,first=True)
   svg=next((game.CACHE/asset_id/'svg').rglob('*.svg'))
   jobs.append({'id':asset_id,'svgs':[str(svg)],'icon':True})
   hashes[relative]=hashlib.sha256(path.read_bytes()).hexdigest()
 cache=game.OUT/'_appearance';cache.mkdir(exist_ok=True)
 (cache/'spell-icon-jobs.json').write_text(json.dumps(jobs))
 (cache/'spell-icon-provenance.json').write_text(json.dumps(hashes,indent=2))
 (game.OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
 print('Quatre icônes Remastered vérifiées et exportées.',flush=True)

if __name__=='__main__':main()
