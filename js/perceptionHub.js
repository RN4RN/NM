/**

 * Percepción unificada — emite eventos narrativos cada frame.

 */



import { StoryEvents, EV } from "./events.js";

import { HandTracker } from "./handTracker.js";

import { FaceTracker } from "./faceTracker.js";

import { EyeTracker } from "./eyeTracker.js";

import { MouthTracker } from "./mouthTracker.js";



export class PerceptionHub {

  constructor(video, canvas) {

    this.events = new StoryEvents();

    this.hand = new HandTracker(video, canvas);

    this.face = new FaceTracker(video);

    this.eyes = new EyeTracker(this.face);

    this.mouth = new MouthTracker(this.face);

    this.mirror = true;

    this._micLevel = 0;

    this._micActive = false;

  }



  async init() {

    await Promise.all([this.hand.init(), this.face.init()]);

  }



  async start() {

    const stream = await navigator.mediaDevices.getUserMedia({

      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },

      audio: false,

    });

    this.hand.video.srcObject = stream;

    await this.hand.video.play();

    this.hand.setRunning(true);

    this.face.setRunning(true);

    this.hand.mirror = this.mirror;

    this.face.mirror = this.mirror;

  }



  async enableMic() {

    if (this._micActive) return;

    try {

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const ctx = new AudioContext();

      const src = ctx.createMediaStreamSource(stream);

      const analyser = ctx.createAnalyser();

      analyser.fftSize = 512;

      src.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      this._micActive = true;

      const tick = () => {

        if (!this._micActive) return;

        analyser.getByteFrequencyData(data);

        let sum = 0;

        for (let i = 0; i < data.length; i += 1) sum += data[i];

        this._micLevel = sum / data.length / 255;

        requestAnimationFrame(tick);

      };

      tick();

    } catch {

      this._micActive = false;

    }

  }



  get micLoud() {

    return this._micLevel > 0.12;

  }



  detect(now, dt) {

    this.hand.detect(now);

    this.face.detect(now);

    this.hand.updateMotion();

    const eye = this.eyes.analyze(dt);

    const mouth = this.mouth.analyze(dt);



    const faceVisible = this.face.isVisible();



    this.events.edge("hand", this.hand.isVisible(), EV.HAND_DETECTED, EV.HAND_LOST);

    this.events.edge("face", faceVisible, EV.FACE_FOUND, EV.FACE_LOST);

    this.events.edge("smile", mouth.smiling, EV.SMILE_DETECTED, EV.SMILE_LOST, { confidence: mouth.confidence });

    if (faceVisible) {

      this.events.edge("eyes", eye.open, EV.EYES_OPENED, EV.EYES_CLOSED, { closedTime: eye.closedTime });

    } else {

      this.events.clearEdge("eyes");

    }

    this.events.edge("mouth", !mouth.mouthOpen, EV.MOUTH_CLOSED, EV.MOUTH_OPENED);



    const gesture = this.hand.getGesture();

    this.events.edge("handWave", gesture === "wave", EV.HAND_WAVE, EV.HAND_WAVE_END);

    this.events.edge("handPush", gesture === "push", EV.HAND_PUSH, EV.HAND_PUSH_END);



    const threat = this.face.isLookingAtThreat();

    this.events.edge("gazeThreat", threat, EV.GAZE_ON_THREAT, EV.GAZE_OFF_THREAT);



    this.last = { eye, mouth, threat, faceVisible, gesture };

    return this.last;

  }



  draw() {

    const eye = this.last?.eye ?? this.eyes.analyze(0);

    const mouth = this.last?.mouth ?? this.mouth.analyze(0);

    this.hand.draw(this.hand.ctx, (ctx, cw, ch) => {

      this.face.drawOverlay(ctx, cw, ch, eye.open, mouth);

    });

  }



  resize(w, h) {

    this.hand.resize(w, h);

  }



  resetSessionTrackers() {

    this.hand.resetStability();

    this.face.resetHeadStability();

    this.eyes.reset();

    this.mouth.reset();

    this.events.resetEdges();

  }

}



export { EV };


