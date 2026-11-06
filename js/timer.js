export class Timer {
  constructor(duration, onTick, onExpire) {
    this.duration = duration;
    this.onTick = onTick;
    this.onExpire = onExpire;
    this.isRunning = false;
    this.startTime = null;
    this.animationFrameId = null;
  }

  start() {
    this.isRunning = true;
    this.startTime = performance.now();
    const tick = (currentTime) => {
      if (!this.isRunning) return;
      const elapsed = (currentTime - this.startTime) / 1000;
      const remaining = Math.max(0, this.duration - elapsed);
      const progress = Math.min(1, elapsed / this.duration);
      
      if (this.onTick) this.onTick(remaining, progress);

      if (remaining > 0) {
        this.animationFrameId = requestAnimationFrame(tick);
      } else {
        this.isRunning = false;
        if (this.onExpire) this.onExpire();
      }
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (!this.startTime) return 0;
    const elapsed = (performance.now() - this.startTime) / 1000;
    return Math.min(elapsed, this.duration);
  }

  getElapsed() {
    if (!this.startTime) return 0;
    const elapsed = (performance.now() - this.startTime) / 1000;
    return Math.min(elapsed, this.duration);
  }

  getRemaining() {
    return Math.max(0, this.duration - this.getElapsed());
  }

  getProgress() {
    return Math.min(1, this.getElapsed() / this.duration);
  }
}
