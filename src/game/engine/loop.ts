export function createGameLoop(update: (dt: number) => void, render: () => void) {
  let last = performance.now();
  let animationId: number;
  
  function frame(now: number) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    animationId = requestAnimationFrame(frame);
  }
  
  animationId = requestAnimationFrame(frame);
  
  return () => cancelAnimationFrame(animationId);
}
