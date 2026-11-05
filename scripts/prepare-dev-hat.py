#!/usr/bin/env python3
"""Exporte le vrai graphisme Champion Remastered pour la Coiffe du dev personnalisée."""
import hashlib
import zipfile
import importlib.util
import json
from pathlib import Path
import subprocess

spec=importlib.util.spec_from_file_location('appearance',Path(__file__).with_name('prepare-appearance.py'))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
OUT=Path('.local-assets/dev-hat-runtime');a.CACHE=OUT/'_appearance';a.CACHE.mkdir(parents=True,exist_ok=True)

def main():
 a.game.hub.validate_remastered_client(a.ROOT)
 archive=Path('.local-assets/dofus-1.40.13-remastered.zip')
 with archive.open('rb') as file:digest=hashlib.file_digest(file,'sha256').hexdigest()
 if digest!='aa9bccb901feb8bc06c16464c36ffbef1a46f8db27ce497bf252b9bd8c5d42d5':raise RuntimeError('Archive Remastered non conforme.')
 with zipfile.ZipFile(archive) as bundle:
  for relative in ['clips/items/16/127.swf','clips/sprites/accessories/a1.swf']:
   entries=[name for name in bundle.namelist() if name.endswith(relative)]
   if len(entries)!=1 or (a.ROOT/relative).read_bytes()!=bundle.read(entries[0]):raise RuntimeError('Source Champion non conforme à l’archive Remastered : '+relative)
 assets={};jobs=[]
 provenance={'source':'https://github.com/dofera/dofedex/releases/tag/1.40.13','version':'1.40.13-remastered','usageRights':'Graphismes Ankama ; aucun droit de redistribution établi.','archiveSha256':'aa9bccb901feb8bc06c16464c36ffbef1a46f8db27ce497bf252b9bd8c5d42d5'}
 def add(id,paths,original,fps=20,density=3,icon=False,loop=True):
  assets[id]={'frames':[{'path':'pending.png','durationMs':1000/fps} for _ in paths],'size':[1,1],'pivot':[0,0],'offset':[0,0],'loop':loop,'flipX':False,'provenance':{**provenance,'originalFile':original,'conversion':f'JPEXS 26.4.0 ; vecteurs originaux ; densité {density} ; icône recadrée 192px ; Coiffe du Champion 8069, skin uniquement, objet personnalisé Coiffe du dev'}}
  jobs.append({'id':id,'svgs':[str(p) for p in paths],'icon':icon,'density':density})
 icon='clips/items/16/127.swf';folder=a.CACHE/'icon'
 subprocess.run(a.JAVA+['-select','1','-format','frame:svg','-export','frame',str(folder.resolve()),str((a.ROOT/icon).resolve())],check=True)
 paths=list(folder.rglob('*.svg'))
 if len(paths)!=1:raise RuntimeError('Icône Champion non exportée')
 add('item.devHat',paths,icon,icon=True,loop=False)
 relative='clips/sprites/accessories/a1.swf';source=a.ROOT/relative;symbol='16_127'
 info=a.game.hub.inspector.inspect_swf(source.read_bytes())['symbols'][symbol];fps=a.game.Builder.metadata(source,info['characterId'])['fps'];views={}
 for label in info['labels']:
  paths=a.export(source,info['characterId'],a.label_length(source,info['characterId'],label['frame']),label['frame'])
  id='piece.accessory.devHat.'+label['label'];views[label['label']]=id
  add(id,paths,relative+'#'+symbol+':'+label['label'],fps=fps)
  add('preview.'+id,paths,relative+'#'+symbol+':'+label['label'],fps=fps,density=10)
 if set(views)!={'R','L','F','B','S'}:raise RuntimeError('Directions Champion incomplètes : '+str(views))
 (OUT/'manifest.json').write_text(json.dumps({'version':1,'assets':assets,'accessory':{'slot':'hat','views':views}},ensure_ascii=False,indent=2))
 (a.CACHE/'jobs.json').write_text(json.dumps(jobs));print('Coiffe Champion : icône et cinq vues originales, jeu et aperçu HD.')

if __name__=='__main__':main()
