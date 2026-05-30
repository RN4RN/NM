/** Partículas ambientales (niebla / polvo). */

export class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.running = false;
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.init();
  }

  init(count = 80) {
    this.particles = Array.from({ length: count }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      r: 1 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.1 - Math.random() * 0.4,
      a: 0.1 + Math.random() * 0.25,
    }));
  }

  start() {
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
  }

  loop = () => {
    if (!this.running) return;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) {
        p.y = canvas.height + 10;
        p.x = Math.random() * canvas.width;
      }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 190, 170, ${p.a})`;
      ctx.fill();
    }

    requestAnimationFrame(this.loop);
  };
}

/** Canvas de efectos de escena (destellos, etc.) */
export function drawStageEffects(ctx, w, h, t) {
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.5, w * 0.6);
  g.addColorStop(0, `rgba(120, 30, 30, ${0.03 + Math.sin(t * 0.002) * 0.02})`);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function triggerGlitch(el, ms = 400) {
  el.classList.add("active");
  setTimeout(() => el.classList.remove("active"), ms);
}

export function setTension(on) {
  document.body.classList.toggle("tension", on);
}

export function setFlicker(on) {
  document.body.classList.toggle("flicker", on);
}
