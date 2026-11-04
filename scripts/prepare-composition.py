#!/usr/bin/env python3
"""Exporte des pièces indépendantes ; aucun produit cartésien d'équipements."""
import copy
import hashlib
import importlib.util
import json
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

spec = importlib.util.spec_from_file_location('appearance', Path(__file__).with_name('prepare-appearance.py'))
a = importlib.util.module_from_spec(spec); spec.loader.exec_module(a)
IDENTITY = [1, 0, 0, 1, 0, 0]


def multiply(m, n):
 return [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]]


def matrix(element):
 value = element.get('transform')
 if not value: return IDENTITY
 match = re.fullmatch(r'matrix\(([^)]+)\)', value)
 if not match: raise RuntimeError(f'Transformation SWF non prise en charge : {value}')
 values = [float(v) for v in re.split(r'[,\s]+', match[1].strip())]
 if len(values) != 6: raise RuntimeError(f'Matrice invalide : {value}')
 return values


def split_frame(path, attachments, empty_symbol=lambda cid: False):
 """Parcourt l'arbre d'affichage, y compris les symboles dans defs, dans son ordre source.
 Les groupes SVG (masques, filtres, opacité et transformations) restent imbriqués.
 Seules les matrices des clips d'attache vides sont cumulées pour le runtime.
 """
 root = ET.parse(path).getroot(); group = root.find(a.SVG+'g'); group.attrib.pop('transform', None)
 definitions = {e.get('id'): e for e in root.iter() if e.get('id')}
 chunks = []; pending = []; pending_hair = False
 def flush():
  nonlocal pending
  if pending: chunks.append({'nodes': pending, 'hideWithHat': pending_hair}); pending = []
 def wrap(node, ancestors):
  node = copy.deepcopy(node)
  for parent in reversed(ancestors):
   wrapper = ET.Element(a.SVG+'g', {k:v for k,v in parent.attrib.items() if k != 'id'}); wrapper.append(node); node = wrapper
  return node
 def special(node, seen=frozenset()):
  if 'cheveux' in node.get('id', '').lower(): return True
  if int(node.get(a.FF+'characterId', '0')) in attachments: return True
  if node.tag == a.SVG+'use':
   target = node.get(a.XL+'href', '')[1:]
   return target not in seen and target in definitions and special(definitions[target], seen | {target})
  return any(special(child, seen) for child in node)
 def visit(node, ancestors, transform, hair=False):
  nonlocal pending_hair
  total = multiply(transform, matrix(node)); hair = hair or 'cheveux' in node.get('id', '').lower()
  cid = int(node.get(a.FF+'characterId', '0'))
  if cid in attachments:
   flush(); slot, label = attachments[cid]
   masks = []; opacity = 1
   ancestor_transform = IDENTITY
   for parent in ancestors:
    ancestor_transform = multiply(ancestor_transform,matrix(parent))
    opacity *= float(parent.get('opacity','1'))
    if parent.get('filter') or parent.get('mask'): raise RuntimeError(f'Filtre accessoire non pris en charge : {path}#{cid}')
    if parent.get('clip-path'):
     clip_id = re.fullmatch(r'url\(#([^)]*)\)',parent.get('clip-path'))[1]
     clip = definitions[clip_id]
     svg = ET.Element(a.SVG+'svg'); g = ET.SubElement(svg,a.SVG+'g')
     transformed = ET.SubElement(g,a.SVG+'g',{'transform':'matrix('+','.join(map(str,ancestor_transform))+')'})
     transformed.extend(copy.deepcopy(list(clip)))
     masks.append(ET.tostring(svg,encoding='unicode'))
   if len(masks)>1: raise RuntimeError(f'Masques imbriqués accessoires non pris en charge : {path}#{cid}')
   chunks.append({'slot':slot,'label':label,'matrix':total,'sourceCharacterId':cid,'maskSvg':masks[0] if masks else None,'opacity':opacity}); return
  if node.tag == a.SVG+'use' and node.get(a.XL+'href', '')[1:] not in definitions and node.get('width') == node.get('height') == '0.0':
   return  # Autres clips d'attache vides (arme de dos, bouclier), sans dessin.
  if node.tag == a.SVG+'use' and special(node):
   target = definitions[node.get(a.XL+'href')[1:]]
   wrapper = ET.Element(a.SVG+'g', {k:v for k,v in node.attrib.items() if k not in [a.XL+'href','id','width','height',a.FF+'characterId']})
   visit(target, ancestors+[wrapper], total, hair); return
  if node.tag == a.SVG+'g' and special(node):
   for child in node: visit(child, ancestors+[node], total, hair)
   return
  if pending and pending_hair != hair: flush()
  pending_hair = hair; pending.append(wrap(node, ancestors))
 visit(group, [], IDENTITY); flush()
 for chunk in chunks:
  if 'nodes' not in chunk: continue
  svg = ET.Element(a.SVG+'svg'); g = ET.SubElement(svg,a.SVG+'g'); g.extend(chunk.pop('nodes'))
  # Ne garder que les définitions transitivement référencées (textures bitmap incluses).
  defs = ET.SubElement(svg,a.SVG+'defs'); seen = set()
  def references(element):
   for e in element.iter():
    for key,value in e.attrib.items():
     refs = re.findall(r'url\(#([^)]*)\)',value)
     if key == a.XL+'href' and value.startswith('#'): refs.append(value[1:])
     for ref in refs:
      if ref in seen: continue
      seen.add(ref)
      if ref not in definitions:
       if e.tag == a.SVG+'use' and (e.get('width') == e.get('height') == '0.0' or empty_symbol(int(e.get(a.FF+'characterId','0')))): continue
       raise RuntimeError(f'Définition SVG absente : {ref}')
      target = copy.deepcopy(definitions[ref]); defs.append(target); references(target)
  references(g); chunk['svg'] = ET.tostring(svg, encoding='unicode')
  chunk['empty'] = not any(e.tag in {a.SVG+tag for tag in ['path','rect','image','circle','ellipse','polygon','polyline','line']} for e in svg.iter())
 return [chunk for chunk in chunks if not chunk.pop('empty',False)]


def main():
 a.game.hub.validate_remastered_client(a.ROOT)
 manifest = json.loads((a.OUT/'manifest.json').read_text())
 # Les références de comparaison restent locales. Aucun ancien atlas n'est publié à nouveau.
 reference = a.CACHE/'reference-manifest.json'
 if not reference.exists(): reference.write_text(json.dumps(manifest))
 manifest['assets'] = {id:asset for id,asset in manifest['assets'].items() if not id.startswith(('appearance.','piece.','preview.appearance.','preview.cra.','preview.piece.'))}
 source = a.ROOT/'clips/sprites/90.swf'; scripts = a.CACHE/'scripts'
 signature = hashlib.sha256(source.read_bytes()).hexdigest()
 if not (scripts/'done').exists() or (scripts/'done').read_text() != signature:
  if scripts.exists(): shutil.rmtree(scripts)
  scripts.mkdir(parents=True)
  with (scripts/'log').open('w') as log:
   subprocess.run(a.JAVA+['-export','script',str(scripts.resolve()),str(source.resolve())],stdout=log,stderr=subprocess.STDOUT,check=True)
  (scripts/'done').write_text(signature)
 attachments = {}
 for path in scripts.rglob('DoAction.as'):
  match = re.search(r'GAC\.applyAccessory\(this,([012]),"([A-Z]+)"', path.read_text())
  if match: attachments[int(re.search(r'DefineSprite_(\d+)',str(path))[1])] = (['bow','hat','cape'][int(match[1])],match[2])
 if not attachments: raise RuntimeError('Attaches GAC absentes.')
 jobs = []; folder = a.CACHE/'pieces'; folder.mkdir(exist_ok=True)
 template = copy.deepcopy(manifest['assets']['cra.idle.south'])
 def add(id, svgs, original, loop=False, durations=None):
  asset = copy.deepcopy(template); asset['loop'] = loop; asset['flipX'] = False; asset['offset'] = [0,0]
  asset['frames'] = [{'path':'pending.png','durationMs':duration} for duration in (durations or [50]*len(svgs))]
  asset['provenance']['originalFile'] = original
  asset['provenance']['conversion'] = 'JPEXS 26.4.0 ; prepare-composition.py ; pièces vectorielles indépendantes ; densité jeu 3 ; hiérarchie source et matrices GAC'
  manifest['assets'][id] = asset; jobs.append({'id':id,'svgs':svgs,'icon':False,'density':3})
 accessories = {}
 for item, library, symbol, slot in [('2411','a1','16_41','hat'),('2474','a1','16_44','hat'),('8259','a1','16_143','hat'),('2414','a2','17_44','cape'),('2473','a2','17_48','cape'),('8258','a2','17_109','cape'),('bow','a4','2_1','bow')]:
  relative = f'clips/sprites/accessories/{library}.swf'; path = a.ROOT/relative
  info = a.game.hub.inspector.inspect_swf(path.read_bytes())['symbols'][symbol]; views = {}
  fps = a.game.Builder.metadata(path,info['characterId'])['fps']
  for label in info['labels']:
   frames = a.export(path,info['characterId'],a.label_length(path,info['characterId'],label['frame']),label['frame'])
   # Retirer le seul cadrage de l'exporteur, sans modifier les coordonnées natives.
   paths = []
   for index,frame in enumerate(frames):
    root = ET.parse(frame).getroot(); root.find(a.SVG+'g').attrib.pop('transform',None)
    dest = folder/f'{item}-{label["label"]}-{index}.svg'; ET.ElementTree(root).write(dest,encoding='unicode'); paths.append(str(dest))
   id = f'piece.accessory.{item}.{label["label"]}'; add(id,paths,relative+'#'+symbol,True,[1000/fps]*len(paths)); views[label['label']] = id
  accessories[item] = {'slot':slot,'views':views}
 empty_cache = {}
 def empty_symbol(cid):
  # JPEXS omet la définition d'un clip arrêté sur une frame vide (effet hit #284).
  # Vérifier cette frame dans le SWF au lieu d'ignorer une référence manquante.
  if cid not in empty_cache:
   end = a.game.Builder.metadata(source,cid)['playbackFrames']
   last = ET.parse(a.export(source,cid,1,end)[0]).getroot().find(a.SVG+'g')
   empty_cache[cid] = last is not None and len(last) == 0
  return empty_cache[cid]
 actors = {}; symbols = a.game.hub.inspector.inspect_swf(source.read_bytes())['symbols']
 for id, asset in list(manifest['assets'].items()):
  if not id.startswith('cra.'): continue
  symbol = asset['provenance']['originalFile'].split('#')[1].split(' + ')[0]
  frames = a.export(source,symbols[symbol]['characterId'],len(asset['frames']))
  if len(frames) < len(asset['frames']): raise RuntimeError(f'Frames vectorielles du Crâ absentes : {id}')
  timeline = []
  for index,path in enumerate(frames[:len(asset['frames'])]):
   layers = []
   for chunk in split_frame(path,attachments,empty_symbol):
    if 'svg' in chunk:
     svg = chunk.pop('svg'); digest = hashlib.sha256(svg.encode()).hexdigest()[:24]; piece = f'piece.body.{digest}'
     if piece not in manifest['assets']:
      dest = folder/(digest+'.svg'); dest.write_text(svg); add(piece,[str(dest)],'clips/sprites/90.swf#'+symbol)
     layers.append({'assetId':piece,'matrix':IDENTITY,'hideWithHat':chunk['hideWithHat']})
    elif chunk['slot'] != 'bow' or id.startswith('cra.cast.'):
     mask = chunk.pop('maskSvg')
     if mask:
      digest = hashlib.sha256(mask.encode()).hexdigest()[:24]; mask_id = f'piece.mask.{digest}'
      if mask_id not in manifest['assets']:
       dest = folder/(digest+'.svg'); dest.write_text(mask); add(mask_id,[str(dest)],'clips/sprites/90.swf#'+symbol)
      chunk['maskAssetId'] = mask_id
     layers.append(chunk)
   timeline.append({'durationMs':asset['frames'][index]['durationMs'],'layers':layers})
  actors[id] = {'loop':asset['loop'],'flipX':asset.get('flipX',False),'frames':timeline}
  print('Composition indépendante :',id,len(timeline),flush=True)
 manifest['composition'] = {'version':1,'actors':actors,'accessories':accessories}
 # Seules les pièces réellement utilisées par les portraits idle ont un export HD.
 preview_pieces = set()
 for id,actor in actors.items():
  if not id.startswith('cra.idle.'): continue
  for frame in actor['frames']:
   for layer in frame['layers']:
    if layer.get('assetId'): preview_pieces.add(layer['assetId'])
    if layer.get('maskAssetId'): preview_pieces.add(layer['maskAssetId'])
    if layer.get('slot'):
     for accessory in accessories.values():
      if accessory['slot'] == layer['slot']: preview_pieces.add(accessory['views'][layer['label']])
 for job in list(jobs):
  if job['id'] not in preview_pieces: continue
  preview = 'preview.'+job['id']; manifest['assets'][preview] = copy.deepcopy(manifest['assets'][job['id']])
  manifest['assets'][preview]['provenance']['conversion'] += ' ; aperçu vectoriel indépendant densité 10'
  jobs.append({**job,'id':preview,'density':10})

 # Les icônes conservent leur recadrage transparent depuis les vecteurs originaux.
 for id in manifest['assets']:
  if id.startswith('item.'):
   jobs.append({'id':id,'svgs':[str(next((a.OUT/'_conversion'/id/'svg').rglob('*.svg')))],'icon':True})
 (a.OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
 (a.CACHE/'jobs.json').write_text(json.dumps(jobs))
 print(len(jobs),'exports indépendants ;',len(actors),'animations ;',len(accessories),'accessoires.')

if __name__ == '__main__': main()
