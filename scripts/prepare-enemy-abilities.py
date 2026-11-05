#!/usr/bin/env python3
"""Exporte le lancer et la lance de Raul Mops depuis son sprite Remastered vérifié."""
import copy
import hashlib
import importlib.util
import json
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

spec=importlib.util.spec_from_file_location('appearance',Path(__file__).with_name('prepare-appearance.py'))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)


def main():
 a.game.hub.validate_remastered_client(a.ROOT)
 relative='clips/sprites/1481.swf';source=a.ROOT/relative
 with zipfile.ZipFile('.local-assets/dofus-1.40.13-remastered.zip') as archive:
  if archive.read(relative)!=source.read_bytes():raise RuntimeError('Sprite Raul Mops différent de l’archive Remastered.')
 manifest=json.loads((a.OUT/'manifest.json').read_text());jobs=[]
 template=manifest['assets']['mob.1481.attack.R']
 symbols=a.game.hub.inspector.inspect_swf(source.read_bytes())['symbols']
 for direction in ['R','L']:
  symbol='anim1'+direction;cid=symbols[symbol]['characterId'];meta=a.game.Builder.metadata(source,cid)
  frames=a.export(source,cid,meta['playbackFrames']);id=f'mob.1481.throw.{direction}'
  asset=copy.deepcopy(template);asset['frames']=[{'path':'pending.png','durationMs':1000/meta['fps']} for _ in frames]
  asset['provenance']['originalFile']=relative+'#'+symbol
  asset['provenance']['conversion']='JPEXS 26.4.0 ; prepare-enemy-abilities.py ; timeline anim1 complète ; SVG rasterisés à densité 3'
  manifest['assets'][id]=asset;jobs.append({'id':id,'svgs':[str(frame) for frame in frames],'icon':False,'density':3})
 # Symbole 4 : lance effectivement tenue dans anim1, jusqu’à la frame 33.
 # La frame 34 retire la lance ; l’enveloppe anim1 est à l’échelle source 0,8.
 frame=a.export(source,4,1)[0];root=ET.parse(frame).getroot();group=root.find(a.SVG+'g');group.attrib.pop('transform',None)
 rotated=ET.Element(a.SVG+'g',{'transform':'rotate(90) scale(0.8)'})
 for child in list(group):group.remove(child);rotated.append(child)
 group.append(rotated)
 dest=a.CACHE/'raul-mops-spear.svg';ET.ElementTree(root).write(dest,encoding='unicode')
 id='spell.raulMops.spear';asset=copy.deepcopy(template);asset['frames']=[{'path':'pending.png','durationMs':25}]
 asset['offset']=[0,30];asset['loop']=False;asset['flipX']=False
 asset['provenance']['originalFile']=relative+'#4'
 asset['provenance']['conversion']='JPEXS 26.4.0 ; prepare-enemy-abilities.py ; lance native, échelle source 0,8, rotation 90°, densité 3 ; pivot centré ; hauteur visuelle 30 unités'
 manifest['assets'][id]=asset;jobs.append({'id':id,'svgs':[str(dest)],'icon':False,'density':3,'pivot':[0.5,0.5]})
 (a.OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
 (a.CACHE/'enemy-ability-jobs.json').write_text(json.dumps(jobs))
 (a.CACHE/'enemy-ability-provenance.json').write_text(json.dumps({relative:hashlib.sha256(source.read_bytes()).hexdigest()},indent=2))
 print('Lance et deux timelines de lancer Remastered prêtes.',flush=True)


if __name__=='__main__':main()
