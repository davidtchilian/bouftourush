export function animationFrame(animation: {frames:readonly {durationMs:number}[];loop:boolean}, elapsedMs: number): number {
  const total = animation.frames.reduce((sum, f) => sum + f.durationMs, 0);
  let time = animation.loop ? Math.max(0, elapsedMs) % total : Math.min(Math.max(0, elapsedMs), total - Number.EPSILON);
  for (let i = 0; i < animation.frames.length; i++) {
    time -= animation.frames[i].durationMs;
    if (time < 0) return i;
  }
  return animation.frames.length - 1;
}
