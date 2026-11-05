#!/usr/bin/env python3
"""Ajout incrémental de l'arène Blop depuis sa disposition SQL déjà publique."""
import importlib.util
import json
from pathlib import Path
from public_map_layout import load_public_layout

s=importlib.util.spec_from_file_location('appearance',Path(__file__).with_name('prepare-appearance.py'))
a=importlib.util.module_from_spec(s);s.loader.exec_module(a)
ROOT=Path('.local-assets/future-blop-map')
a.CACHE=Path('.local-assets/future-dungeons-runtime/_appearance')


def main():
 a.game.hub.validate_remastered_client(a.ROOT)
 base=json.loads(Path('.local-assets/future-dungeons-runtime/manifest.json').read_text())
 catalog=json.loads(Path('scripts/future-dungeons-assets.json').read_text())
 config=next(f['map'] for f in catalog['families'] if f['id']=='blopMulti')
 added={};jobs=[];assets=dict(base['assets']);symbols={}
 def register(id,relative,symbol=None,cid=None,first=False,loop=False,offset=(0,0)):
  source=a.ROOT/relative
  if relative not in symbols:symbols[relative]=a.game.hub.inspector.inspect_swf(source.read_bytes())['symbols']
  cid=symbols[relative][symbol]['characterId'];meta=a.game.Builder.metadata(source,cid)
  paths=a.export(source,cid,1)
  asset={'frames':[{'path':'pending.png','durationMs':1000/meta['fps']}],'pivot':[0,0],'size':[1,1],'offset':list(offset),'loop':False,'flipX':False,'provenance':{'source':'https://github.com/dofera/dofedex/releases/tag/1.40.13','version':'1.40.13-remastered','originalFile':relative+'#'+symbol,'conversion':'JPEXS 26.4.0 ; vecteur Remastered ; décor première frame ; densité 2','usageRights':'Préparation locale ; aucun droit de redistribution établi.'}}
  added[id]=assets[id]=asset;jobs.append({'id':id,'svgs':[str(p) for p in paths],'icon':False,'density':2})
  print(id,flush=True);return id
 class Visual(a.game.Builder):
  def add(self,*args,**kwargs):return register(*args,**kwargs)
 b=Visual.__new__(Visual);b.assets=assets;b.info={}
 layout=load_public_layout(config,a.game)
 arena=b.map('blopMulti',config['source'],visual_only=True,layout_script=layout)
 ROOT.mkdir(parents=True,exist_ok=True);(ROOT/'_appearance').mkdir(exist_ok=True)
 (ROOT/'manifest.json').write_text(json.dumps({'version':1,'visualVersion':'1.40.13-remastered','preparedOnly':True,'assets':added,'maps':{'blopMulti':arena}},ensure_ascii=False,indent=2))
 (ROOT/'_appearance/jobs.json').write_text(json.dumps(jobs))
 print(len(jobs),'décors supplémentaires, disposition publique sans clé.',flush=True)

if __name__=='__main__':main()
