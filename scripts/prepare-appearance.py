#!/usr/bin/env python3
"""Utilitaires d'export vectoriel Remastered ; entrée compatible vers les pièces indépendantes."""
import hashlib
import importlib.util
import shutil
import subprocess
import struct
import zlib
import xml.etree.ElementTree as ET
from pathlib import Path

spec=importlib.util.spec_from_file_location('game',Path(__file__).with_name('prepare-game.py'))
game=importlib.util.module_from_spec(spec);spec.loader.exec_module(game)
ROOT,OUT,JAVA=game.ROOT,game.OUT,game.JAVA
CACHE=OUT/'_appearance'
SVG='{http://www.w3.org/2000/svg}'
FF='{https://www.free-decompiler.com/flash}'
XL='{http://www.w3.org/1999/xlink}'
ET.register_namespace('','http://www.w3.org/2000/svg')
ET.register_namespace('xlink','http://www.w3.org/1999/xlink')

def export(source,cid,count,start=1):
 target=CACHE/(source.stem+f'-{cid}-{start}-{count}')
 signature=hashlib.sha256(source.read_bytes()).hexdigest()
 if not (target/'done').exists() or (target/'done').read_text()!=signature:
  if target.exists():shutil.rmtree(target)
  target.mkdir(parents=True)
  with (target/'log').open('w') as log:
   subprocess.run(JAVA+['-selectid',str(cid),'-select',f'{cid}:{start}','-sublength',str(count),'-format','sprite:svg','-export','sprite',str(target.resolve()),str(source.resolve())],stdout=log,stderr=subprocess.STDOUT,check=True)
  (target/'done').write_text(signature)
 return sorted(target.rglob('*.svg'),key=lambda p:tuple(int(s) if s.isdigit() else s for s in p.relative_to(target).with_suffix('').parts))

def label_length(source,cid,label_frame):
 raw=source.read_bytes();data=zlib.decompress(raw[8:]) if raw[:3]==b'CWS' else raw[8:]
 start=(5+4*(data[0]>>3)+7)//8+4
 for code,payload in game.hub.inspector.tags(data,start):
  if code!=39 or struct.unpack_from('<H',payload)[0]!=cid:continue
  frame=1;active={}
  for code,p in game.hub.inspector.tags(payload,4):
   if code==26 and p[0]&2:active[struct.unpack_from('<H',p,1)[0]]=struct.unpack_from('<H',p,3)[0]
   elif code==28:active.pop(struct.unpack_from('<H',p)[0],None)
   elif code==1:
    if frame==label_frame:return max([1]+[game.Builder.metadata(source,child)['playbackFrames'] for child in active.values()])
    frame+=1
 raise RuntimeError(f'Timeline accessoire absente : {source}#{cid}:{label_frame}')


def main():
 # Entrée historique conservée ; la génération cartésienne est supprimée.
 spec=importlib.util.spec_from_file_location('composition',Path(__file__).with_name('prepare-composition.py'))
 composition=importlib.util.module_from_spec(spec);spec.loader.exec_module(composition)
 composition.main()

if __name__=='__main__':main()
