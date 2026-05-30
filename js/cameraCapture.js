/**
 * Capturas cada N segundos → carpeta uploads/ interna (OPFS).
 * Solo HTML/JS — sin Python, sin UI, sin elegir carpeta.
 */

function stampName() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `capture_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.jpg`;
}

export class CameraCapture {
  constructor(video, options = {}) {
    this.video = video;
    this.intervalMs = options.intervalMs ?? 5000;
    this._canvas = document.createElement("canvas");
    this._timer = null;
    this._busy = false;
    this._uploadsDir = null;
    this.lastSaved = null;
    this.count = 0;
  }

  async _getUploadsDir() {
    if (this._uploadsDir) return this._uploadsDir;
    if (!navigator.storage?.getDirectory) {
      throw new Error("OPFS no disponible en este navegador");
    }
    const root = await navigator.storage.getDirectory();
    this._uploadsDir = await root.getDirectoryHandle("uploads", { create: true });
    return this._uploadsDir;
  }

  async _save(blob, filename) {
    const dir = await this._getUploadsDir();
    const fh = await dir.getFileHandle(filename, { create: true });
    const w = await fh.createWritable();
    await w.write(blob);
    await w.close();
  }

  start() {
    if (this._timer) return;
    this._timer = setInterval(() => this.capture(), this.intervalMs);
    this.capture();
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  async capture() {
    if (this._busy || !this.video?.videoWidth) return false;
    this._busy = true;
    try {
      const w = this.video.videoWidth;
      const h = this.video.videoHeight;
      this._canvas.width = w;
      this._canvas.height = h;
      this._canvas.getContext("2d").drawImage(this.video, 0, 0, w, h);

      const blob = await new Promise((resolve) => {
        this._canvas.toBlob(resolve, "image/jpeg", 0.88);
      });
      if (!blob) return false;

      const filename = stampName();
      await this._save(blob, filename);
      this.lastSaved = filename;
      this.count += 1;
      return true;
    } catch (err) {
      console.warn("[CameraCapture]", err);
      return false;
    } finally {
      this._busy = false;
    }
  }
}
