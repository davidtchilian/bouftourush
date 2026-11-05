#!/usr/bin/env python3
"""Prépare les six familles du TODO dans un lot isolé ; n'active aucun contenu."""
import copy
from concurrent.futures import ThreadPoolExecutor
import hashlib
import importlib.util
import json
import re
import shutil
import subprocess
from pathlib import Path
from public_map_layout import load_public_layout

spec=importlib.util.spec_from_file_location('appearance',Path(__file__).with_name('prepare-appearance.py'))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
OUT=Path('.local-assets/future-dungeons-runtime')
a.OUT=OUT;a.CACHE=OUT/'_appearance';a.game.OUT=OUT;a.game.CACHE=OUT/'_conversion'


def main():
 a.game.hub.validate_remastered_client(a.ROOT)
 catalog=json.loads(Path('scripts/future-dungeons-assets.json').read_text())
 if catalog['visualVersion']!='1.40.13-remastered' or not catalog['preparedOnly']:raise RuntimeError('Catalogue de préparation invalide')
 OUT.mkdir(parents=True,exist_ok=True);a.CACHE.mkdir(exist_ok=True)
 assets={};jobs=[];specs=[];symbols={}
 provenance={'source':'https://github.com/dofera/dofedex/releases/tag/1.40.13','version':'1.40.13-remastered','usageRights':'Préparation locale ; aucun droit de redistribution établi.'}
 def register(id,relative,symbol=None,cid=None,first=False,loop=False,offset=(0,0),density=3):
  source=a.ROOT/relative
  if not source.is_file():raise RuntimeError(f'Source Remastered absente : {source}')
  if symbol is not None:
   if relative not in symbols:symbols[relative]=a.game.hub.inspector.inspect_swf(source.read_bytes())['symbols']
   cid=symbols[relative][symbol]['characterId']
  meta=a.game.Builder.metadata(source,cid);count=1 if first else meta['playbackFrames']
  assets[id]={'frames':[{'path':'pending.png','durationMs':1000/meta['fps']} for _ in range(count)],'pivot':[0,0],'size':[1,1],'offset':list(offset),'loop':loop,'flipX':False,'provenance':{**provenance,'originalFile':relative+'#'+str(symbol or cid or 'timeline'),'conversion':f'JPEXS 26.4.0 ; vecteurs Remastered ; densité {density} ; lot préparé non actif'}}
  specs.append({'id':id,'source':source,'cid':cid,'count':count,'density':density,'icon':id.startswith('item.')})
  return id
 class VisualBuilder(a.game.Builder):
  def add(self,*args,**kwargs):return register(*args,**kwargs,density=2)
 builder=VisualBuilder.__new__(VisualBuilder);builder.assets=assets;builder.info={}
 manifest={'version':1,'visualVersion':catalog['visualVersion'],'preparedOnly':True,'assets':assets,'maps':{},'catalog':catalog,'accessories':{}}
 seen=set()
 for family in catalog['families']:
  for item in family['items']:register('item.'+item['id'],item['source'],first=True)
  for monster in family['monsters']:
   if monster['sprite'] in seen:continue
   seen.add(monster['sprite'])
   for action,symbol in monster['animations'].items():
    direction=action[-1];action=action[:-1]
    register(f"mob.{monster['sprite']}.{action}.{direction}",monster['source'],symbol=symbol,loop=action=='run')
  if family['map']['source']:
   manifest['maps'][family['id']]=builder.map(family['id'],family['map']['source'],visual_only=True,layout_script=load_public_layout(family['map'],a.game) if family['map'].get('layoutSourceType')=='public-sql' else None)
 # Un export groupé par fichier source, puis conservation des durées natives attendues.
 groups={}
 for entry in specs:
  if entry['cid'] is not None:groups.setdefault((entry['source'],entry['count']),[]).append(entry)
 def export_group(pair):
  (source,count),entries=pair
  signature=hashlib.sha256(source.read_bytes()).hexdigest()
  missing=[entry for entry in entries if not (a.CACHE/f"{source.stem}-{entry['cid']}-1-{entry['count']}"/'done').exists() or (a.CACHE/f"{source.stem}-{entry['cid']}-1-{entry['count']}"/'done').read_text()!=signature]
  if not missing:return
  target=a.CACHE/f'batch-{source.stem}-{count}'
  if target.exists():shutil.rmtree(target)
  target.mkdir()
  ids=sorted({e['cid'] for e in missing})
  with (target/'log').open('w') as log:
   subprocess.run(a.JAVA+['-selectid',','.join(map(str,ids)),'-select',','.join(f'{cid}:1' for cid in ids),'-sublength',str(count),'-format','sprite:svg','-export','sprite',str(target.resolve()),str(source.resolve())],stdout=log,stderr=subprocess.STDOUT,check=True)
  for entry in missing:
   folders=list(target.glob(f"DefineSprite_{entry['cid']}_*"))
   frames=sorted(folders[0].rglob('*.svg'),key=lambda p:tuple(int(s) if s.isdigit() else s for s in p.relative_to(folders[0]).with_suffix('').parts)) if folders else []
   if len(frames)<entry['count']:raise RuntimeError(f"Timeline incomplète : {entry['id']} ({len(frames)}/{entry['count']})")
   destination=a.CACHE/f"{source.stem}-{entry['cid']}-1-{entry['count']}";destination.mkdir(exist_ok=True)
   for n,frame in enumerate(frames[:entry['count']]):shutil.copyfile(frame,destination/f'{n:04}.svg')
   (destination/'done').write_text(signature)
  shutil.rmtree(target)
  print(source.name,len(entries),'séquences vectorielles',flush=True)
 with ThreadPoolExecutor(max_workers=2) as pool:
  list(pool.map(export_group,groups.items()))
 # Icônes : scène originale, frame 1 ; conversion groupée, sans exécuter l'ActionScript.
 icon_source=a.CACHE/'icon-sources';icon_target=a.CACHE/'icon-vectors';icon_source.mkdir(exist_ok=True);icon_target.mkdir(exist_ok=True)
 icons=[e for e in specs if e['icon']]
 for entry in icons:
  link=icon_source/(entry['id']+'.swf')
  if not link.exists():link.symlink_to(entry['source'].resolve())
 with (a.CACHE/'icons.log').open('w') as log:
  subprocess.run(a.JAVA+['-select','1','-format','frame:svg','-export','frame',str(icon_target.resolve()),str(icon_source.resolve())],stdout=log,stderr=subprocess.STDOUT,check=True)
 for entry in specs:
  if entry['icon']:
   paths=list((icon_target/(entry['id']+'.swf')).rglob('*.svg'))
   if len(paths)!=1:raise RuntimeError(f"Icône non exportée : {entry['id']} : {paths}")
  else:paths=a.export(entry['source'],entry['cid'],entry['count'])
  if len(paths)!=entry['count']:raise RuntimeError(f"Frames absentes : {entry['id']}")
  jobs.append({'id':entry['id'],'svgs':[str(p) for p in paths],'icon':entry['icon'],'density':entry['density']})
 # Les accessoires gardent leurs labels, pivots et timelines indépendants (futurs GAC).
 for family in catalog['families']:
  for item in family['items']:
   if 'accessorySource' not in item:continue
   relative=item['accessorySource'];source=a.ROOT/relative
   info=a.game.hub.inspector.inspect_swf(source.read_bytes())['symbols'][item['accessorySymbol']]
   views={};fps=a.game.Builder.metadata(source,info['characterId'])['fps']
   for label in info['labels']:
    count=a.label_length(source,info['characterId'],label['frame']);paths=a.export(source,info['characterId'],count,label['frame'])
    if len(paths)!=count:raise RuntimeError(f"Vue accessoire incomplète : {item['id']}:{label['label']}")
    id=f"piece.accessory.{item['id']}.{label['label']}";views[label['label']]=id
    asset={'frames':[{'path':'pending.png','durationMs':1000/fps} for _ in paths],'pivot':[0,0],'size':[1,1],'offset':[0,0],'loop':True,'flipX':False,'provenance':{**provenance,'originalFile':relative+'#'+item['accessorySymbol']+':'+label['label'],'conversion':'JPEXS 26.4.0 ; vues originales et timelines ; densité 3, aperçu 10 ; préparation non active'}}
    assets[id]=asset;jobs.append({'id':id,'svgs':[str(p) for p in paths],'icon':False,'density':3})
    assets['preview.'+id]=copy.deepcopy(asset);jobs.append({'id':'preview.'+id,'svgs':[str(p) for p in paths],'icon':False,'density':10})
   manifest['accessories'][item['id']]={'slot':'hat' if item['type']==16 else 'cape','views':views}
 # Portraits HD des gardiens, depuis les mêmes vecteurs que leurs animations de jeu.
 boss_sprites={m['sprite'] for f in catalog['families'] for m in f['monsters'] if m['boss']}
 for job in list(jobs):
  parts=job['id'].split('.')
  if len(parts)==4 and parts[0]=='mob' and parts[1] in boss_sprites and parts[2] in ['idle','attack'] and parts[3]=='R':
   id='preview.'+job['id'];assets[id]=copy.deepcopy(assets[job['id']]);assets[id]['provenance']['conversion']+=' ; aperçu densité 6, maximum 1024 pixels'
   jobs.append({**job,'id':id,'density':6,'maxDimension':1024})
 (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
 (a.CACHE/'jobs.json').write_text(json.dumps(jobs))
 print(len(jobs),'séquences à rasteriser ; contenu préparé uniquement.',flush=True)

if __name__=='__main__':main()
