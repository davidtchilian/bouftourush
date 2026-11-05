#!/usr/bin/env python3
"""Aperçus HD des pièces de classes, mêmes vecteurs et matrices que le jeu."""
import copy,json
from pathlib import Path
root=Path('.local-assets/classes-runtime');manifest=json.loads((root/'manifest.json').read_text());jobs=json.loads((root/'_appearance/jobs.json').read_text())
pieces=set()
for id,actor in manifest['composition']['actors'].items():
 if any(id.startswith(name+'.idle.') for name in ['sacrier','iop','feca']):
  for frame in actor['frames']:
   for layer in frame['layers']:
    for field in ['assetId','maskAssetId']:
     if layer.get(field):pieces.add(layer[field])
known={job['id'] for job in jobs}
for job in list(jobs):
 if job['id'] not in pieces or 'preview.'+job['id'] in known:continue
 id='preview.'+job['id'];manifest['assets'][id]=copy.deepcopy(manifest['assets'][job['id']]);manifest['assets'][id]['provenance']['conversion']+=' ; aperçu densité 10';jobs.append({**job,'id':id,'density':10})
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));(root/'_appearance/jobs.json').write_text(json.dumps(jobs))
