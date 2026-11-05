#!/usr/bin/env python3
"""Exporte les classes depuis les SWF Remastered vérifiés et conserve les attaches GAC."""
from class_exports import export_timeline
import copy, hashlib, importlib.util, json, re, subprocess, zipfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('composition',Path(__file__).with_name('prepare-composition.py'))
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
a=c.a;g=a.game
OUT=Path('.local-assets/classes-runtime');CACHE=OUT/'_appearance';CACHE.mkdir(parents=True,exist_ok=True)
a.CACHE=CACHE
g.hub.validate_remastered_client(g.ROOT)
manifest=json.loads(Path('public/assets/manifest.json').read_text());jobs=[]
template=manifest['assets']['cra.idle.south'];folder=CACHE/'pieces';folder.mkdir(exist_ok=True)
archive=zipfile.ZipFile('.local-assets/dofus-1.40.13-remastered.zip')
def verified(relative):
 path=g.ROOT/relative
 if archive.read(relative)!=path.read_bytes():raise RuntimeError(f'Source différente de l’archive : {relative}')
 return path

def add(id,paths,original,durations,loop=False,icon=False,density=3):
 asset=copy.deepcopy(template);asset.update(loop=loop,flipX=False,offset=[0,0],frames=[{'path':'pending.png','durationMs':d} for d in durations])
 asset['provenance'].update(originalFile=original,conversion='JPEXS 26.4.0 ; prepare-classes.py ; vecteurs densité '+str(density)+' ; matrices GAC natives')
 manifest['assets'][id]=asset;jobs.append(dict(id=id,svgs=[str(p) for p in paths],icon=icon,density=density))

for name,sprite in [('sacrier',110),('iop',80),('feca',10)]:
 relative=f'clips/sprites/{sprite}.swf';source=verified(relative);scripts=CACHE/f'scripts-{sprite}'
 if not (scripts/'done').exists():
  scripts.mkdir(exist_ok=True)
  with (scripts/'log').open('w') as log:subprocess.run(a.JAVA+['-export','script',str(scripts.resolve()),str(source.resolve())],stdout=log,stderr=subprocess.STDOUT,check=True)
  (scripts/'done').touch()
 attachments={}
 for path in scripts.rglob('DoAction.as'):
  match=re.search(r'GAC\.applyAccessory\(this,([012]),"([A-Z]+)"',path.read_text())
  if match:attachments[int(re.search(r'DefineSprite_(\d+)',str(path))[1])]=(['bow','hat','cape'][int(match[1])],match[2])
 if not attachments:raise RuntimeError(f'Attaches absentes : {name}')
 symbols=g.hub.inspector.inspect_swf(source.read_bytes())['symbols'];exports={}
 mappings=[]
 for direction,suffix,flip in [('east','S',False),('southeast','R',False),('south','F',False),('southwest','R',True),('west','S',True),('northwest','L',False),('north','B',False),('northeast','L',True)]:
  for action,prefix in [('idle','static'),('run','run')]:mappings.append((f'{name}.{action}.{direction}',prefix+suffix,flip,action=='run'))
 for action,prefix in [('cast','anim0'),('buff','anim0'),('hit','hit'),('death','die')]:
  for side in ['R','L']:mappings.append((f'{name}.{action}.{side}',prefix+side,False,False))
 for id,symbol,flip,loop in mappings:
  cid=symbols[symbol]['characterId'];meta=g.Builder.metadata(source,cid);count=meta['playbackFrames']
  if symbol not in exports:
   frames=a.export(source,cid,count);timeline=[]
   def empty_symbol(child):
    end=g.Builder.metadata(source,child)['playbackFrames'];paths=a.export(source,child,1,end)
    if not paths:
     target=CACHE/f'empty-shape-{sprite}-{child}';target.mkdir(exist_ok=True)
     if not list(target.glob('*.svg')):
      with (target/'log').open('w') as log:subprocess.run(a.JAVA+['-selectid',str(child),'-format','shape:svg','-export','shape',str(target.resolve()),str(source.resolve())],stdout=log,stderr=subprocess.STDOUT,check=True)
     paths=list(target.glob('*.svg'))
    if not paths:raise RuntimeError(f'Définition absente non vide : {relative}#{child}')
    root=a.ET.parse(paths[0]).getroot().find(a.SVG+'g');return root is not None and len(root)==0
   for frame in frames[:count]:
    layers=[]
    for chunk in c.split_frame(frame,attachments,empty_symbol):
     if 'svg' in chunk:
      svg=chunk.pop('svg');digest=hashlib.sha256(svg.encode()).hexdigest()[:24];piece=f'piece.{name}.{digest}'
      if piece not in manifest['assets']:
       path=folder/(digest+'.svg');path.write_text(svg);add(piece,[path],relative+'#'+symbol,[1000/meta['fps']],density=6)
      layers.append(dict(assetId=piece,matrix=c.IDENTITY,hideWithHat=chunk['hideWithHat']))
     elif chunk['slot']!='bow':
      mask=chunk.pop('maskSvg')
      if mask:
       digest=hashlib.sha256(mask.encode()).hexdigest()[:24];piece=f'piece.{name}.mask.{digest}'
       if piece not in manifest['assets']:
        path=folder/(digest+'.svg');path.write_text(mask);add(piece,[path],relative+'#'+symbol,[1000/meta['fps']],density=6)
       chunk['maskAssetId']=piece
      layers.append(chunk)
    timeline.append(dict(durationMs=1000/meta['fps'],layers=layers))
   exports[symbol]=timeline
  timeline=exports[symbol];manifest['composition']['actors'][id]=dict(loop=loop,flipX=flip,frames=timeline)
  asset=copy.deepcopy(template);asset.update(loop=loop,flipX=flip,frames=[dict(path='pending.png',durationMs=f['durationMs']) for f in timeline]);asset['provenance'].update(originalFile=relative+'#'+symbol,conversion='prepare-classes.py ; timeline et attaches GAC originales');manifest['assets'][id]=asset
  print(id,len(timeline),flush=True)
# Les sorts sans sprite dans la table originale utilisent uniquement le geste du personnage.
spell_icons={'dissolution':439,'chastisement':431,'transposition':438,'punishment':446,'sword':160,'jump':142,'intimidation':143,'wrath':159,'glyph':10,'cloudy':9,'teleport':11,'truce':5}
for name,number in spell_icons.items():
 relative=f'clips/spells/icons/up/{number}.swf';source=verified(relative);target=CACHE/f'icon-{number}';target.mkdir(exist_ok=True)
 if not list(target.rglob('*.svg')):
  with (target/'log').open('w') as log:subprocess.run(a.JAVA+['-select','1','-format','frame:svg','-export','frame',str(target.resolve()),str(source.resolve())],stdout=log,stderr=subprocess.STDOUT,check=True)
 add('ui.spell.'+name,[next(target.rglob('*.svg'))],relative,[50],icon=True)
for name,number,cid in [('chastisement',1051,8),('transposition',1055,8),('sword',805,8),('jump',807,5),('intimidation',804,13),('wrath',809,39),('cloudy',111,14),('truce',101,14)]:
 relative=f'clips/spells/{number}.swf';source=verified(relative);meta=g.Builder.metadata(source,cid);frames=export_timeline(a,source,cid);add('spell.'+name+'.cast',frames,relative+'#'+str(cid),[1000/meta['fps']]*len(frames))
# Cellule originale : délimitation persistante des glyphes, sans texture inventée.
relative='clips/gfx/cell.swf';source=verified(relative);frames=a.export(source,32,1);add('spell.glyph.zone',frames,relative+'#s1',[50],True)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));(CACHE/'jobs.json').write_text(json.dumps(jobs));print(len(jobs),'exports vectoriels',flush=True)
