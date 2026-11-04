/** Pas fixe, rattrapage borné après un onglet en arrière-plan. */
export function startLoop(update: (dt: number) => void, render: () => void): () => void {
  const step = 1 / 60;
  let previous = performance.now(), accumulator = 0, frame = 0;
  function tick(now: number) {
    accumulator += Math.min((now - previous) / 1000, 0.1);
    previous = now;
    while (accumulator >= step) { update(step); accumulator -= step; }
    render();
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
