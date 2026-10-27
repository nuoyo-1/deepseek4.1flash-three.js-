import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeCanvasTexture } from './core.js';
import { buildGround } from './base.js';
import { buildStore } from './store.js';
import { buildProps } from './props.js';
import { buildWeather } from './weather.js';

/* ------------------------------------------------------------------ *
 *  Renderer + camera
 * ------------------------------------------------------------------ */
const canvas = document.getElementById('scene');
const isTouch = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820;
const dprCap = isTouch ? 1.4 : 1.75;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  stencil: false,
});
const pixelRatio = Math.min(window.devicePixelRatio || 1, dprCap);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a1424, 0.0125);

function makeBackgroundTexture() {
  return makeCanvasTexture(1024, 1024, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#12213a');
    grad.addColorStop(0.44, '#0b1629');
    grad.addColorStop(0.78, '#070d19');
    grad.addColorStop(1, '#04070d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.52, h * 0.47, 0, w * 0.52, h * 0.47, w * 0.72);
    glow.addColorStop(0, 'rgba(46,80,133,0.22)');
    glow.addColorStop(0.45, 'rgba(28,46,82,0.1)');
    glow.addColorStop(1, 'rgba(6,10,18,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // faint distant drizzle / bokeh
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h * 0.75;
      const r = 0.4 + Math.random() * 1.4;
      ctx.fillStyle = `rgba(150,185,230,${0.01 + Math.random() * 0.05})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.18, w * 0.5, h * 0.5, w * 0.72);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.72, 'rgba(0,0,0,0.18)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  });
}
scene.background = makeBackgroundTexture();

const startAspect = window.innerWidth / window.innerHeight;
const isPortrait = startAspect < 0.82;
const CAMERA_TARGET = new THREE.Vector3(0.6, 1.0, -1.4);
const CAMERA_OFFSET = new THREE.Vector3(19.0, 14.8, 23.7);
const FRAMING_SCALE = isPortrait ? 1.18 : 1.0;

const camera = new THREE.PerspectiveCamera(
  isPortrait ? 48 : 37,
  window.innerWidth / window.innerHeight,
  0.1,
  160
);
const introToPos = CAMERA_TARGET.clone().addScaledVector(CAMERA_OFFSET, FRAMING_SCALE);
const introFromPos = CAMERA_TARGET.clone().addScaledVector(CAMERA_OFFSET, FRAMING_SCALE * 1.13);
camera.position.copy(introFromPos);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(CAMERA_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = isTouch ? 8 : 11;
controls.maxDistance = isTouch ? 90 : 55;
controls.minPolarAngle = 0.16;
controls.maxPolarAngle = 1.43;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.8;
controls.update();

/* ------------------------------------------------------------------ *
 *  Lights
 * ------------------------------------------------------------------ */
const hemi = new THREE.HemisphereLight(0x5e7eae, 0x10141b, 0.62);
scene.add(hemi);

const moon = new THREE.DirectionalLight(0xa8c3ff, 1.6);
moon.position.set(-13, 20, 12);
moon.castShadow = true;
moon.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
moon.shadow.camera.left = -16;
moon.shadow.camera.right = 16;
moon.shadow.camera.top = 16;
moon.shadow.camera.bottom = -16;
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 52;
moon.shadow.bias = -0.0006;
moon.shadow.normalBias = 0.035;
scene.add(moon);
scene.add(moon.target);

const fill = new THREE.DirectionalLight(0x5576ad, 0.32);
fill.position.set(10, 8, 16);
scene.add(fill);

// A very low, cool bounce so the street reads wet rather than pitch black.
const bounce = new THREE.DirectionalLight(0x2f456a, 0.22);
bounce.position.set(2, 2, -12);
scene.add(bounce);

/* ------------------------------------------------------------------ *
 *  World
 * ------------------------------------------------------------------ */
const root = new THREE.Group();
root.name = 'rainy-corner-diorama';
scene.add(root);

const world = {
  updatables: [],
  puddles: [],
  reflections: [],
  glassRain: [],
  mobile: isTouch,
};

buildGround(root, world);
buildStore(root, world);
buildProps(root, world);
buildWeather(root, world);

/* ------------------------------------------------------------------ *
 *  Post-processing
 * ------------------------------------------------------------------ */
const size = new THREE.Vector2();
renderer.getDrawingBufferSize(size);
const renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
  type: THREE.HalfFloatType,
  samples: isTouch ? 2 : 4,
});
const composer = new EffectComposer(renderer, renderTarget);
composer.setPixelRatio(pixelRatio);
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.34,
  0.45,
  1.0
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ------------------------------------------------------------------ *
 *  Interaction polish
 * ------------------------------------------------------------------ */
let introActive = true;
canvas.addEventListener('pointerdown', () => {
  introActive = false;
  document.body.classList.add('dragging');
});
window.addEventListener('pointerup', () => {
  document.body.classList.remove('dragging');
});
window.addEventListener('pointercancel', () => {
  document.body.classList.remove('dragging');
});

/* ------------------------------------------------------------------ *
 *  Loop
 * ------------------------------------------------------------------ */
const clock = new THREE.Clock();
let elapsed = 0;
let started = false;

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  for (let i = 0; i < world.updatables.length; i++) {
    world.updatables[i].update(dt, elapsed);
  }

  controls.update();
  composer.render();

  if (!started) {
    started = true;
    const veil = document.getElementById('veil');
    if (veil) {
      veil.classList.add('hidden');
      setTimeout(() => veil.remove(), 1600);
    }
  }
}

renderer.setAnimationLoop(animate);

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  camera.fov = w / h < 0.82 ? 48 : 37;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.setSize(w, h, false);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  composer.setSize(w, h);
}
window.addEventListener('resize', onResize);

// gentle, non-interactive drift in framing for the first moments
const introStart = performance.now();
const introFrom = introFromPos;
const introTo = introToPos;
camera.position.copy(introFrom);
controls.update();
world.updatables.push({
  update() {
    if (!introActive) return;
    const t = Math.min(1, (performance.now() - introStart) / 2600);
    const k = 1 - Math.pow(1 - t, 3);
    if (t < 1) {
      camera.position.lerpVectors(introFrom, introTo, k);
    }
  },
});

window.__diorama = { scene, camera, renderer, world, composer, controls };