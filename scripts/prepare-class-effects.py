#!/usr/bin/env python3
"""Rejoue hors Flash les transformations de spire du sort 1055, sans redessiner son art."""
from class_exports import export_timeline
import copy,importlib.util,json,random,xml.etree.ElementTree as ET
from pathlib import Path
spec=importlib.util.spec_from_file_location('a',Path(__file__).with_name('prepare-appearance.py'));a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
root=Path('.local-assets/classes-runtime');a.CACHE=root/'_appearance';source=a.ROOT/'clips/spells/1055.swf'
# Les deux formes du symbole spire sont choisies selon la parité du numéro de particule.
forms=[ET.parse(a.export(source,2,1,frame)[0]).getroot() for frame in [1,2]]
rng=random.Random(1055);particles=[]
for index in range(1,11):particles.append(dict(frame=(index+1)%2,y=-rng.randrange(50),va=1+rng.randrange(2),alpha=50+rng.randrange(50),sx=(80+rng.randrange(80))/100,sy=.8,v=.67+1.67*rng.random()))
folder=a.CACHE/'transposition-scripted';folder.mkdir(exist_ok=True);paths=[]
for frame in range(100):
 svg=ET.Element(a.SVG+'svg',{'width':'200px','height':'300px'});container=ET.SubElement(svg,a.SVG+'g')
 for index,p in enumerate(particles):
  if p['alpha']<=0:continue
  form=copy.deepcopy(forms[p['frame']]);g=form.find(a.SVG+'g');g.attrib.pop('transform',None)
  # Isoler les identifiants des définitions de chaque instance originale.
  for element in form.iter():
   for key,value in list(element.attrib.items()):
    if key=='id':element.set(key,f'p{index}-'+value)
    elif key==a.XL+'href' and value.startswith('#'):element.set(key,f'#p{index}-'+value[1:])
    elif 'url(#' in value:element.set(key,value.replace('url(#',f'url(#p{index}-'))
  for child in form:
   if child is not g:svg.append(child)
  wrap=ET.SubElement(container,a.SVG+'g',{'transform':f'matrix({p["sx"]},0,0,{p["sy"]},0,{p["y"]})','opacity':str(p['alpha']/100)});wrap.append(g)
  p['sy']*=1.02;p['v']*=.97;p['y']-=p['v'];p['alpha']-=p['va']
 if not len(container):break
 path=folder/f'{frame:03}.svg';ET.ElementTree(svg).write(path,encoding='unicode');paths.append(str(path))
manifest=json.loads((root/'manifest.json').read_text());jobs=json.loads((root/'_appearance/jobs.json').read_text())
for name,number,cid in [('chastisement',1051,8),('sword',805,8),('jump',807,5),('intimidation',804,13),('wrath',809,39),('cloudy',111,14),('truce',101,14)]:
 source=a.ROOT/f'clips/spells/{number}.swf';paths2=export_timeline(a,source,cid);meta=a.game.Builder.metadata(source,cid);key='spell.'+name+'.cast'
 manifest['assets'][key]['frames']=[dict(path='pending.png',durationMs=1000/meta['fps']) for _ in paths2]
 for job in jobs:
  if job['id']==key:job['svgs']=[str(p) for p in paths2]
id='spell.transposition.cast';asset=manifest['assets'][id];asset['frames']=[dict(path='pending.png',durationMs=1000/60) for _ in paths];asset['provenance']['conversion']+=' ; transformations spire ActionScript transcrites, graine 1055';asset['provenance']['originalFile']='clips/spells/1055.swf#spire + DefineSprite_8/frame_4'
for job in jobs:
 if job['id']==id:job['svgs']=paths
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));(root/'_appearance/jobs.json').write_text(json.dumps(jobs))
