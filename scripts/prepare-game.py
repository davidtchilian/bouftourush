#!/usr/bin/env python3
"""Compilation locale des donjons, monstres, sorts, icônes et éléments UI originaux."""
import hashlib
import importlib.util
import json
import re
import shutil
import struct
import subprocess
import xml.etree.ElementTree as ET
import zlib
from pathlib import Path

navigation_spec=importlib.util.spec_from_file_location('map_navigation',Path(__file__).with_name('map_navigation.py'))
map_navigation=importlib.util.module_from_spec(navigation_spec);navigation_spec.loader.exec_module(map_navigation)

spec=importlib.util.spec_from_file_location('hub',Path(__file__).with_name('prepare-hub.py'))
hub=importlib.util.module_from_spec(spec);spec.loader.exec_module(hub)
ROOT=Path('.local-assets/client-1.40.13-remastered')
DEX=Path('.local-assets/dofedex')
OUT=Path('.local-assets/game-runtime')
CACHE=OUT/'_conversion'
JAVA=['java','-Xmx2g','-Djava.awt.headless=true','-jar',str(Path('.local-assets/tools/ffdec/ffdec.jar').resolve()),'-onerror','abort']


class Builder:
 def __init__(self):
  hub.validate_remastered_client(ROOT)
  self.manifest=json.loads(Path('.local-assets/hub-runtime/manifest.json').read_text())
  OUT.mkdir(parents=True,exist_ok=True)
  for asset in self.manifest['assets'].values():
   for frame in asset['frames']:
    target=OUT/frame['path'];target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(Path('.local-assets/hub-runtime')/frame['path'],target)
  self.assets=self.manifest['assets']
  self.info={}

 @staticmethod
 def metadata(source,cid):
  raw=source.read_bytes();data=zlib.decompress(raw[8:]) if raw[:3]==b'CWS' else raw[8:]
  offset=(5+4*(data[0]>>3)+7)//8
  fps=struct.unpack_from('<H',data,offset)[0]/256
  definitions={}
  for code,p in hub.inspector.tags(data,offset+4):
   if code!=39:continue
   sid,count=struct.unpack_from('<HH',p);frame=1;stop=[];children=[]
   for c,q in hub.inspector.tags(p,4):
    if c==1:frame+=1
    elif c==12 and q==b'\x07\x00':stop.append(frame)
    elif c==26 and q[0]&2:children.append(struct.unpack_from('<H',q,3)[0])
   definitions[sid]=(count,stop,children)
  def count(sid,seen):
   if sid not in definitions or sid in seen:return 1
   n,stops,children=definitions[sid]
   if n>1:return stops[0] if stops else n
   return max([1]+[count(c,seen|{sid}) for c in children])
  if cid is None:
   return {'frameCount':struct.unpack_from('<H',data,offset+2)[0],'playbackFrames':1,'fps':fps}
  return {'frameCount':definitions.get(cid,(1,[],[]))[0],'playbackFrames':count(cid,set()),'fps':fps}

 def add(self,id,relative,symbol=None,cid=None,first=False,loop=False,offset=(0,0)):
  source=ROOT/relative
  if not source.is_file():raise RuntimeError(f'Asset absent : {source}')
  if symbol is not None:
   if relative not in self.info:self.info[relative]=hub.inspector.inspect_swf(source.read_bytes())
   if symbol not in self.info[relative]['symbols']:raise RuntimeError(f'Symbole absent : {relative}#{symbol}')
   cid=self.info[relative]['symbols'][symbol]['characterId']
  meta=self.metadata(source,cid)
  count=1 if first else meta['playbackFrames']
  destination=CACHE/id
  signature=hashlib.sha256(source.read_bytes()).hexdigest()+f':{cid}:{count}:v2'
  marker=destination/'done'
  if not marker.exists() or marker.read_text()!=signature:
   if destination.exists():shutil.rmtree(destination)
   destination.mkdir(parents=True,exist_ok=True)
   for fmt in ['png','svg']:
    target=destination/fmt;target.mkdir()
    cmd=JAVA[:]
    if cid is None:
     cmd+=['-select','1','-format','frame:'+fmt,'-export','frame',str(target.resolve()),str(source.resolve())]
    else:
     cmd+=['-selectid',str(cid)]
     if fmt=='svg' or first:cmd+=['-select',f'{cid}:1']
     elif meta['frameCount']==1:cmd+=['-select',f'{cid}:1','-sublength',str(count)]
     cmd+=['-format','sprite:'+fmt,'-export','sprite',str(target.resolve()),str(source.resolve())]
    with (destination/(fmt+'.log')).open('w') as log:subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,check=True)
   marker.write_text(signature)
  frames=sorted((destination/'png').rglob('*.png'),key=lambda p:tuple(int(s) if s.isdigit() else s for s in p.relative_to(destination/'png').with_suffix('').parts))[:count]
  if not frames:raise RuntimeError(f'Export vide : {relative}#{symbol or cid}')
  svg=ET.parse(next((destination/'svg').rglob('*.svg'))).getroot()
  w,h=float(svg.attrib['width'].removesuffix('px')),float(svg.attrib['height'].removesuffix('px'))
  g=svg.find('{http://www.w3.org/2000/svg}g')
  match=re.search(r'matrix\(([^)]+)\)',g.attrib.get('transform','')) if g is not None else None
  transform=[float(v) for v in match[1].split(',')] if match else [1,0,0,1,0,0]
  if w<=0 or h<=0:raise RuntimeError(f'Graphisme sans dimensions : {relative}#{cid}')
  folder=Path('textures')/id.replace('.','-');(OUT/folder).mkdir(parents=True,exist_ok=True)
  outframes=[]
  for i,frame in enumerate(frames):
   path=folder/f'{i:03}.png';shutil.copyfile(frame,OUT/path);outframes.append({'path':path.as_posix(),'durationMs':1000/meta['fps']})
  self.assets[id]={'frames':outframes,'pivot':[transform[4]/w,transform[5]/h],'size':[w,h],'offset':list(offset),'loop':loop,'flipX':False,
   'provenance':{'source':'https://github.com/dofera/dofedex/releases/tag/1.40.13','version':'1.40.13-remastered','originalFile':relative+(f'#{symbol or cid}' if cid is not None else '#timeline'),
    'conversion':'JPEXS 26.4.0 ; scripts/prepare-game.py ; frames et origine du SVG source','usageRights':'Usage local, redistribution non autorisée.'}}
  print(id,len(frames),'frames',flush=True)
  return id

 def actor(self,sprite):
  relative=f'clips/sprites/{sprite}.swf'
  symbols=hub.inspector.inspect_swf((ROOT/relative).read_bytes())['symbols']
  run='run' if 'runR' in symbols else 'walk'
  for action,prefix in [('idle','static'),('run',run),('attack','anim0'),('hit','hit'),('death','die')]:
   for direction in ['R','L']:
    self.add(f'mob.{sprite}.{action}.{direction}',relative,symbol=prefix+direction,loop=action=='run')

 def map(self,id,source):
  destination=CACHE/('map-'+id)
  script=destination/'scripts/frame_1/DoAction.as'
  if not script.exists():
   destination.mkdir(parents=True,exist_ok=True)
   with (destination/'map.log').open('w') as log:subprocess.run(JAVA+['-export','script',str(destination.resolve()),str((DEX/source).resolve())],stdout=log,stderr=subprocess.STDOUT,check=True)
  text=script.read_text();cells=hub.decode_map(text)
  background=int(re.search(r'backgroundNum\s*=\s*(\d+)',text)[1])
  needed={'ground':{background} if background else set(),'object':set()}
  for c in cells:
   if not c['active']:continue
   if c['slope']!=1:raise RuntimeError(f'Pente non prise en charge : {id}:{c["id"]}')
   needed['ground'].add(c['ground']);needed['object'].update([c['object1'],c['object2']])
  for ns in needed.values():ns.discard(0)
  lookup={}
  for file in sorted((ROOT/'clips/gfx').glob('*.swf')):
   kind='ground' if file.stem.startswith('g') else 'object' if file.stem.startswith('o') else None
   if not kind:continue
   info=hub.inspector.inspect_swf(file.read_bytes())
   for sid in needed[kind]:
    if str(sid) in info['symbols']:lookup[(kind,sid)]=(file.relative_to(ROOT).as_posix(),str(sid))
  for kind,ns in needed.items():
   for sid in sorted(ns):
    asset=f'map.{kind}.{sid}'
    if asset in self.assets:continue
    if (kind,sid) not in lookup:raise RuntimeError(f'Décor manquant : {kind}:{sid}')
    rel,symbol=lookup[(kind,sid)];self.add(asset,rel,symbol=symbol,first=True)
  layers=[]
  if background:layers.append({'assetId':f'map.ground.{background}','position':[0,0],'order':0,'flipX':False})
  for c in cells:
   if not c['active']:continue
   for key,kind,order in [('ground','ground',100),('object1','object',1000),('object2','object',2000)]:
    if not c[key]:continue
    rot=c.get(key+'Rotation',0)
    layers.append({'assetId':f'map.{kind}.{c[key]}','position':[c['x'],-c['y']],'order':order+c['id'],'flipX':c.get(key+'Flip',False),
     'rotation':-rot*90,'scale':[0.5185,1.9286] if rot%2 else [1,1]})
  free=[{'id':c['id'],'position':[c['x'],-c['y']]} for c in cells if c['active'] and c['movement']>1 and not c['object2'] and 20<c['x']<720 and 10<c['y']<425]
  free=map_navigation.apply_navigation_overrides(id,free,layers)
  # Plus grande composante accessible : aucune apparition de l'autre côté d'un mur.
  adjacency={c['id']:[n['id'] for n in free if abs(c['position'][0]-n['position'][0])<=26.51 and abs(c['position'][1]-n['position'][1])<=13.51] for c in free}
  pending={c['id'] for c in free};components=[]
  while pending:
   group={pending.pop()};queue=list(group)
   while queue:
    for neighbor in adjacency[queue.pop()]:
     if neighbor in pending:pending.remove(neighbor);group.add(neighbor);queue.append(neighbor)
   components.append(group)
  largest=max(components,key=len);free=[c for c in free if c['id'] in largest]
  spawn=min(free,key=lambda c:(c['position'][0]-371)**2+(c['position'][1]+330)**2)['position']
  positions=sorted(free,key=lambda c:-(c['position'][0]-spawn[0])**2-(c['position'][1]-spawn[1])**2)
  spawns=[]
  for cell in positions:
   if all((cell['position'][0]-p[0])**2+(cell['position'][1]-p[1])**2>40**2 for p in spawns):spawns.append(cell['position'])
   if len(spawns)>=8:break
  return {'bounds':[0,-432,742,0],'spawn':spawn,'cameraHeight':432,'layers':layers,'walkable':free,'enemySpawns':spawns,'mapSource':source+' ; bibliothèques Remastered 1.40.13'}


def main():
 b=Builder()
 # Familles réelles, dont les variantes d'Incarnam partagent les mêmes sprites.
 for sprite in [1566,1570,1571,1573,1574,1581,1014,1009,1474,1481,1483,1484,1485,1487,1488,1546]:b.actor(sprite)
 for action,prefix in [('cast','anim10'),('buff','anim0'),('hit','hit'),('death','die')]:
  for direction in ['R','L']:b.add(f'cra.{action}.{direction}','clips/sprites/90.swf',symbol=prefix+direction)
 # Correspondances sprite confirmées dans les données Ancestra-Evolutive (sorts 161/165/166/179).
 for id,relative,symbol,cid in [
  ('spell.magic.projectile','902','move',None),('spell.magic.impact','902','shoot',None),
  ('spell.explosive.projectile','910','move',None),('spell.explosive.impact','910','shoot',None),
  ('spell.flaming.projectile','909',None,22),('spell.flaming.impact','909',None,41),('spell.power.cast','904',None,14)]:
  b.add(id,f'clips/spells/{relative}.swf',symbol=symbol,cid=cid,offset=(0,18) if 'power' not in id else (0,0))
 for id,symbol in [('ui.window','UI_InventoryGridBackground'),('ui.button','ButtonNormalUp'),('ui.button.hover','ButtonNormalDown'),('ui.button.down','ButtonNormalDown'),('ui.slot','UI_InventoryGridBackground'),('ui.heart','Heart'),('ui.close','ButtonCloseUp'),('ui.portrait','LookSelectorBackground'),('ui.selection','UI_InventoryGridHighlight')]:
  b.add(id,'modules/core.swf',symbol=symbol,first=True)
 # Tables I.u : type et g du fichier items_fr_450.swf.
 for id,category,gfx in [(2411,16,41),(2414,17,44),(2416,7,23),(2419,9,44),(2422,11,26),(2425,1,48),(2428,10,29),
                         (2473,17,48),(2474,16,44),(2475,9,48),(2476,11,32),(2477,10,33),(2478,1,52),
                         (8253,1,106),(8254,9,112),(8255,8,44),(8256,11,84),(8257,10,102),(8258,17,109),(8259,16,143)]:
  b.add(f'item.{id}',f'clips/items/{category}/{gfx}.swf',first=True)
 b.manifest['maps']={'incarnam':b.map('incarnam','maps/10360/10360_0703281543.swf'),'bouftou':b.map('bouftou','maps/2073/2073_0505170920.swf'),'ensable':b.map('ensable','maps/10155/10155_0701221531.swf')}
 # Les cartes restent figées sur leur première frame, végétation comprise.
 b.manifest['gameplayReady']=True
 (OUT/'manifest.json').write_text(json.dumps(b.manifest,ensure_ascii=False,indent=2))
 print('Jeu préparé :',len(b.assets),'séquences.',flush=True)


if __name__=='__main__':main()
