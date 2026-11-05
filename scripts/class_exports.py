"""Exporter la timeline principale lorsqu’elle avance, sinon les timelines imbriquées."""
import subprocess

def export_timeline(a,source,cid):
 meta=a.game.Builder.metadata(source,cid)
 if meta['frameCount']==1:return a.export(source,cid,meta['playbackFrames'])
 target=a.CACHE/f'timeline-{source.stem}-{cid}';target.mkdir(exist_ok=True)
 if not (target/'done').exists():
  with (target/'log').open('w') as log:subprocess.run(a.JAVA+['-selectid',str(cid),'-format','sprite:svg','-export','sprite',str(target.resolve()),str(source.resolve())],stdout=log,stderr=subprocess.STDOUT,check=True)
  (target/'done').touch()
 return sorted(target.rglob('*.svg'),key=lambda p:tuple(int(s) if s.isdigit() else s for s in p.relative_to(target).with_suffix('').parts))[:meta['playbackFrames']]
