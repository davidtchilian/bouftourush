/** Le clic simple garde sa destination ; maintenir suit le curseur. */
export function bindPointer(canvas: HTMLCanvasElement, move: (x:number,y:number)=>void, aim:(x:number,y:number)=>void): {tick:(dt:number)=>void; dispose:()=>void} {
  let held=false, x=0, y=0, elapsed=0;
  const update=(e:PointerEvent)=>{x=e.clientX;y=e.clientY;aim(x,y);};
  const down=(e:PointerEvent)=>{update(e);if(e.button!==2)return;e.preventDefault();held=true;elapsed=0;move(x,y);canvas.setPointerCapture?.(e.pointerId);};
  const pointerMove=(e:PointerEvent)=>{update(e);};
  const up=(e:PointerEvent)=>{if(e.button===2)held=false;};
  const cancel=()=>{held=false;};
  canvas.addEventListener('pointerdown',down);window.addEventListener('pointermove',pointerMove);
  window.addEventListener('pointerup',up);window.addEventListener('blur',cancel);canvas.addEventListener('pointercancel',cancel);
  return {tick(dt){if(!held)return;elapsed+=dt;if(elapsed>=0.12){elapsed=0;move(x,y);}},dispose(){canvas.removeEventListener('pointerdown',down);window.removeEventListener('pointermove',pointerMove);window.removeEventListener('pointerup',up);window.removeEventListener('blur',cancel);canvas.removeEventListener('pointercancel',cancel);}};
}
