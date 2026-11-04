#!/usr/bin/env python3
"""Réutilise les vecteurs authentiques pour les portraits agrandis de l'interface."""
import copy
import importlib.util
import json
import subprocess
from pathlib import Path

spec=importlib.util.spec_from_file_location('appearance',Path(__file__).with_name('prepare-appearance.py'))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
manifest=json.loads((a.OUT/'manifest.json').read_text())
boss_sprites=json.loads(subprocess.check_output(['node','--import','tsx','--input-type=module','-e',"import {monsters} from './src/data/monsters.ts'; console.log(JSON.stringify(Object.values(monsters).filter(monster=>monster.boss).map(monster=>monster.sprite)));"],text=True))
boss_assets={f'mob.{sprite}.{action}.R' for sprite in boss_sprites for action in ['idle','attack']}
jobs=[]
for id,asset in list(manifest['assets'].items()):
 if id.startswith('preview.'):continue
 if id not in boss_assets:continue
 relative,symbol=asset['provenance']['originalFile'].split('#')
 source=a.ROOT/relative;info=a.game.hub.inspector.inspect_swf(source.read_bytes())['symbols'][symbol]
 frames=[str(path) for path in a.export(source,info['characterId'],len(asset['frames']))]
 preview='preview.'+id
 manifest['assets'][preview]=copy.deepcopy(asset)
 manifest['assets'][preview]['provenance']['conversion']+=' ; aperçu UI à haute définition depuis les vecteurs originaux'
 jobs.append({'id':preview,'svgs':frames[:len(asset['frames'])],'icon':False})
(a.OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(a.CACHE/'preview-jobs.json').write_text(json.dumps(jobs))
print(len(jobs),'portraits prêts pour la rasterisation.',flush=True)
