var Module = {};

let FRAME_BYTES = 0;
let ctx = null;
let canvas = null;
let frameRequest = null;
let imageData = null;

/* ===========================
   WASM INIT
=========================== */

Module.onRuntimeInitialized = function () {
  console.log(Module);
  FRAME_BYTES = Module._framebuffer_bytes();
};

/* ===========================
   ROM LOADING
=========================== */

async function load_url(url) {
  let res = await fetch(url);
  if (!res.ok) {
    alert("load of " + url + " failed: " + res.status);
    return;
  }
  let buffer = await res.arrayBuffer();
  rom_load_array(new Uint8Array(buffer));
}

function rom_load_array(data) {
  let ptr = Module._alloc_rom(data.length);
  if (ptr === 0) {
    alert("ROM Larger than supported.");
    return;
  }

  let heap = new Uint8Array(Module.HEAPU8.buffer, ptr, data.length);
  heap.set(data);

  console.log("len:", data.length);
  Module._init(ptr, data.length);
  console.log("file loaded");

  tick();
}

/* ===========================
   CANVAS
=========================== */

function createCanvas() {
  let parent = document.querySelector(CANVAS_PARENT);
  let [w, h] = VIDEO_DIMS;

  let c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.style = `width: ${w}px; height: ${h}px;`;
  c.id = "canvas";

  imageData = new ImageData(w, h);
  parent.appendChild(c);
}

/* ===========================
   DOMAIN LOCK
=========================== */

function lockdown() {

}

/* ===========================
   AUDIO
=========================== */

let audioContext = null;
let audioNode = null;

const SAMPLE_RATE = 44100;
const BUCKET_SAMPLES = SAMPLE_RATE / 10;
const audioBuckets = [];

async function setupAudio() {
  audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

  try {
    await audioContext.audioWorklet.addModule("/audio-worker.js");
    console.log("added audio-worker");
  } catch (e) {
    console.error("Error loading audio worker:", e);
    return;
  }

  audioNode = new AudioWorkletNode(audioContext, "streaming-audio-processor");
  audioNode.connect(audioContext.destination);

  audioNode.port.onmessage = e => {
    audioBuckets.push(e.data);
  };

  console.log("audio state:", audioContext.state);
}

/* ===========================
   BUILT-IN ROM SELECT
=========================== */

function setupBuiltins() {
  let el = document.querySelector("#gamelist");
  if (!el) return;

  el.addEventListener("change", () => {
    load_url(el.value);
    audioContext.resume();
  });
}

/* ===========================
   INPUT
=========================== */

const EMU_KEY_LIST = [];

function setKey(e, down) {
  let key = e.key;
  let idx = EMU_KEY_LIST.findIndex(k => k === key);
  if (idx !== -1) {
    if (e.preventDefault) e.preventDefault();
    Module._set_key(idx, down ? 1 : 0);
  }
}

function setupInput() {
  EMU_KEYS.forEach(([key, selector]) => {
    EMU_KEY_LIST.push(key);

    if (selector !== "") {
      let el = document.getElementById(selector);
      if (!el) return;

      el.addEventListener("mousedown", () => setKey({ key }, true));
      el.addEventListener("touchstart", () => setKey({ key }, true));
      el.addEventListener("mouseup", () => setKey({ key }, false));
      el.addEventListener("touchend", () => setKey({ key }, false));
    }
  });

  document.addEventListener("keydown", e => setKey(e, true));
  document.addEventListener("keyup", e => setKey(e, false));
}

/* ===========================
   MAIN LOOP
=========================== */

function tick() {
  if (frameRequest) cancelAnimationFrame(frameRequest);

  Module._frame();

  let fbPtr = Module._framebuffer();
  let frame = new Uint8ClampedArray(
    Module.HEAPU8.buffer,
    fbPtr,
    FRAME_BYTES
  );

  imageData.data.set(frame);
  ctx.putImageData(imageData, 0, 0);

  if (Module._apu_sample_variable) {
    let bufPtr = Module._alloc_rom(2 * SAMPLE_RATE);
    let samples = Module._apu_sample_variable(bufPtr, SAMPLE_RATE / 60);

    let audio = new Int16Array(
      Module.HEAPU8.buffer,
      bufPtr,
      samples
    );

    let bucket =
      audioBuckets.length > 0
        ? audioBuckets.pop()
        : new Int16Array(BUCKET_SAMPLES);

    bucket.set(audio);
    audioNode.port.postMessage([bucket, samples], [bucket.buffer]);
  }

  if (window.drawControls) window.drawControls();

  frameRequest = requestAnimationFrame(tick);
}

/* ===========================
   PAGE LOAD
=========================== */

function load() {
  console.log("load");

  lockdown();
  createCanvas();

  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d", { alpha: false });

  setupInput();
  setupAudio();
  setupBuiltins();
}

window.addEventListener("load", load);
