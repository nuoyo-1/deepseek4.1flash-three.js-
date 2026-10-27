import * as THREE from 'three';
import {
  addBox,
  addCylinder,
  addPlane,
  addSphere,
  addOutline,
  toon,
  glow,
  texturedGlow,
  makeCanvasTexture,
  roundRect,
  drawStar,
  drawCrescent,
  japaneseFont,
  spacedText,
  easeInOutCubic,
  PALETTE,
} from './core.js';
import { LAYOUT } from './layout.js';
import {
  makeStoreSignTexture,
  makePylonTexture,
  makeStoreFloorTexture,
  makeAwningTexture,
  makeSodaPosterTexture,
  makeOdenPosterTexture,
  makeCoffeePosterTexture,
  makeShelfSignTexture,
  makeWindowDecalTexture,
  makeMagazineCoverTexture,
  makePosterPlaceholderTexture,
  makeRainGlassTexture,
  makeRadialGlowTexture,
} from './textures.js';

const S = LAYOUT.store;
const W = S.x1 - S.x0;
const D = S.z1 - S.z0;
const CX = (S.x0 + S.x1) / 2;
const CZ = (S.z0 + S.z1) / 2;
const FLOOR = 0.19;
const CEIL = 3.0;
const WALK_PLUS = LAYOUT.walkY;

const SNACK_COLORS = [
  '#ff8f6b', '#ffd166', '#6fd6c3', '#8ec5ff', '#f7a8c8', '#b6a6ff',
  '#f2e6c8', '#a9dd8a', '#ffb48f', '#76c7e8', '#e8d6a0', '#ff9e9e',
];
const DRINK_COLORS = [
  '#c8f2ff', '#ffe08a', '#ff9b8a', '#9fe4b0', '#7eb9ff', '#ffc4dc',
  '#d7f0e2', '#e8c58a', '#bfe8f5',
];
const CIG_COLORS = ['#f4f1e8', '#d95b4a', '#3e7cc4', '#e2b75a', '#77a88a', '#b6a2c9'];

function labelTexture(text, opts = {}) {
  const width = opts.width ?? 512;
  const height = opts.height ?? 128;
  return makeCanvasTexture(width, height, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (opts.bg) {
      ctx.fillStyle = opts.bg;
      roundRect(ctx, 4, 4, w - 8, h - 8, opts.radius ?? 12);
      ctx.fill();
    }
    if (opts.border) {
      ctx.strokeStyle = opts.border;
      ctx.lineWidth = 4;
      roundRect(ctx, 10, 10, w - 20, h - 20, opts.radius ?? 10);
      ctx.stroke();
    }
    ctx.fillStyle = opts.fg ?? '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = opts.font ?? japaneseFont(Math.round(h * 0.5), 700);
    ctx.fillText(text, w / 2, h / 2 + (opts.offsetY ?? 0));
  });
}

function makeDoormatTexture() {
  return makeCanvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1f4a3d';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2f6b58';
    ctx.fillRect(12, 12, w - 24, h - 24);
    ctx.strokeStyle = 'rgba(230,255,240,0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, w - 60, h - 60);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(245,255,246,0.92)';
    ctx.font = '700 52px "Trebuchet MS", sans-serif';
    ctx.fillText('WELCOME', w / 2, 98);
    ctx.font = japaneseFont(33, 600);
    ctx.fillText('いらっしゃいませ', w / 2, 158);
    // rubber ridges
    for (let y = 18; y < h; y += 12) {
      ctx.fillStyle = 'rgba(8,20,16,0.08)';
      ctx.fillRect(16, y, w - 32, 2);
    }
  });
}

function makeFloorArrowTexture() {
  return makeCanvasTexture(256, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(78,196,154,0.92)';
    roundRect(ctx, 24, 24, w - 48, h - 48, 24);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.beginPath();
    ctx.moveTo(w / 2, 76);
    ctx.lineTo(w / 2 + 66, 214);
    ctx.lineTo(w / 2 + 26, 214);
    ctx.lineTo(w / 2 + 26, 388);
    ctx.lineTo(w / 2 - 26, 388);
    ctx.lineTo(w / 2 - 26, 214);
    ctx.lineTo(w / 2 - 66, 214);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(23,64,50,0.8)';
    ctx.font = japaneseFont(30, 700);
    ctx.textAlign = 'center';
    ctx.fillText('店内へ', w / 2, 448);
  });
}

function makeClockFaceTexture() {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f7f1df';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 116, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b3945';
    ctx.lineWidth = 10;
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.strokeStyle = i % 3 === 0 ? '#22313d' : '#7c877f';
      ctx.lineWidth = i % 3 === 0 ? 6 : 3;
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.cos(a) * 88, h / 2 + Math.sin(a) * 88);
      ctx.lineTo(w / 2 + Math.cos(a) * 100, h / 2 + Math.sin(a) * 100);
      ctx.stroke();
    }
    ctx.fillStyle = '#8c7d5e';
    ctx.font = '600 14px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOSHIZORA', w / 2, h / 2 + 52);
  });
}

function makeMenuBoardTexture() {
  return makeCanvasTexture(512, 768, (ctx, w, h) => {
    ctx.fillStyle = '#132d3a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#5cd9b8';
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e9fff7';
    ctx.font = japaneseFont(52, 800);
    ctx.fillText('COFFEE', w / 2, 92);
    ctx.font = japaneseFont(26, 600);
    ctx.fillStyle = '#8fffe0';
    ctx.fillText('淹れたて ・ テイクアウト', w / 2, 138);
    ctx.textAlign = 'left';
    const rows = [
      ['ブレンド S', '100'],
      ['ブレンド M', '150'],
      ['カフェラテ', '180'],
      ['抹茶ラテ', '180'],
      ['ホットココア', '160'],
    ];
    rows.forEach((row, i) => {
      const y = 220 + i * 86;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(46, y - 44, w - 92, 68);
      ctx.fillStyle = '#f7f2e4';
      ctx.font = japaneseFont(28, 600);
      ctx.fillText(row[0], 70, y);
      ctx.fillStyle = '#ffcb85';
      ctx.font = '700 32px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`¥${row[1]}`, w - 70, y);
      ctx.textAlign = 'left';
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8fffe0';
    ctx.font = japaneseFont(22, 600);
    ctx.fillText('HOSHIZORA MART  /  COFFEE STAND', w / 2, h - 54);
  });
}

function makeOdenHeaderTexture() {
  return makeCanvasTexture(512, 160, (ctx, w, h) => {
    ctx.fillStyle = '#2b1a13';
    roundRect(ctx, 6, 6, w - 12, h - 12, 14);
    ctx.fill();
    ctx.fillStyle = '#ffb15e';
    roundRect(ctx, 16, 16, w - 32, h - 32, 9);
    ctx.fill();
    ctx.fillStyle = '#402515';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = japaneseFont(66, 900);
    ctx.fillText('おでん ・ ホット', w / 2, h / 2 + 4);
  });
}

function makeSmallShopLabelTexture() {
  return makeCanvasTexture(512, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    roundRect(ctx, 8, 22, w - 16, h - 44, 20);
    ctx.fill();
    ctx.fillStyle = '#183246';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = japaneseFont(40, 700);
    ctx.fillText('自動ドア ・ 安全確認', w / 2, h / 2);
  });
}

function makeAtmSideTexture() {
  return makeCanvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#eef4f5';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3b6ea8';
    ctx.fillRect(0, 0, w, 100);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '900 58px "Trebuchet MS", sans-serif';
    ctx.fillText('ATM', w / 2, 66);
    ctx.fillStyle = '#203848';
    ctx.font = japaneseFont(22, 600);
    ctx.fillText('24時間', w / 2, 140);
    ctx.fillStyle = '#1a2a34';
    ctx.fillRect(24, 180, w - 48, 150);
    const g = ctx.createLinearGradient(0, 180, 0, 330);
    g.addColorStop(0, '#6df0d0');
    g.addColorStop(1, '#2a7e86');
    ctx.fillStyle = g;
    ctx.fillRect(38, 198, w - 76, 116);
    ctx.fillStyle = 'rgba(8,22,26,0.75)';
    ctx.font = '700 22px "Trebuchet MS", sans-serif';
    ctx.fillText('WELCOME', w / 2, 262);
    ctx.fillStyle = '#8f9ba3';
    ctx.fillRect(30, 380, w - 60, 86);
    ctx.fillStyle = '#525e68';
    for (let i = 0; i < 4; i++) ctx.fillRect(44, 396 + i * 16, w - 88, 6);
  });
}

function makeStaffSign() {
  return makeCanvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#e8dfc7';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#33414a';
    ctx.textAlign = 'center';
    ctx.font = japaneseFont(24, 700);
    ctx.fillText('関係者以外', w / 2, 48);
    ctx.fillText('立入禁止', w / 2, 82);
    ctx.strokeStyle = '#9e8f70';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);
  });
}

export function buildStore(root, world) {
  const group = new THREE.Group();
  group.name = 'convenience-store';
  root.add(group);

  /* ------------------------------------------------------------------ *
   *  Materials
   * ------------------------------------------------------------------ */
  const wallMat = toon(0xd9d2c2);
  const wallInMat = toon(0xeee6d4);
  const trimMat = toon(0x25333d);
  const metalMat = toon(0x9aa5ae);
  const darkMetalMat = toon(0x3d4952);
  const mintMat = toon(0x48c7a8);
  const coralMat = toon(0xf08a58);
  const roofMat = toon(0x49545f);
  const floorTex = makeStoreFloorTexture();
  const floorMat = toon(0xffffff, { map: floorTex });
  const glassMat = new THREE.MeshBasicMaterial({
    color: 0x9fc9d9,
    transparent: true,
    opacity: 0.072,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const coolerGlassMat = new THREE.MeshBasicMaterial({
    color: 0xbcefff,
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  /* ------------------------------------------------------------------ *
   *  Shell
   * ------------------------------------------------------------------ */
  const floorSlab = addBox(group, toon(0x666a6d), W, 0.19, D, CX, 0.095, CZ, {
    cast: false,
    receive: true,
  });
  floorSlab.name = 'store-floor';

  const floor = addPlane(group, floorMat, W - 0.34, D - 0.34, CX, FLOOR + 0.004, CZ, {
    rotation: [-Math.PI / 2, 0, 0],
    receive: true,
  });
  floor.name = 'store-interior-floor';

  // back + side walls
  addBox(group, wallMat, W, 3.4, 0.18, CX, 1.89, S.z0 + 0.09, {
    receive: true,
    outline: 0.016,
  });
  addBox(group, wallMat, 0.18, 3.4, D, S.x0 + 0.09, 1.89, CZ, {
    receive: true,
    outline: 0.016,
  });
  addBox(group, wallMat, 0.18, 3.4, D, S.x1 - 0.09, 1.89, CZ, {
    receive: true,
    outline: 0.016,
  });
  // front header above glazing
  addBox(group, wallMat, W, 1.13, 0.18, CX, 2.985, S.z1 - 0.09, {
    receive: true,
    outline: 0.016,
  });
  // front kick plate
  addBox(group, trimMat, W - 0.1, 0.3, 0.12, CX, 0.29, S.z1 - 0.05, {
    outline: 0.008,
  });
  // mint accent line along kick plate
  addBox(group, mintMat, W - 0.3, 0.035, 0.02, CX, 0.39, S.z1 + 0.025, { cast: false });

  // interior wall finish panels
  addPlane(group, wallInMat, W - 0.36, CEIL - FLOOR, CX, (CEIL + FLOOR) / 2, S.z0 + 0.19, {
    receive: true,
  });
  addPlane(
    group,
    wallInMat,
    D - 0.36,
    CEIL - FLOOR,
    S.x0 + 0.19,
    (CEIL + FLOOR) / 2,
    CZ,
    { rotation: [0, Math.PI / 2, 0], receive: true }
  );
  addPlane(
    group,
    wallInMat,
    D - 0.36,
    CEIL - FLOOR,
    S.x1 - 0.19,
    (CEIL + FLOOR) / 2,
    CZ,
    { rotation: [0, -Math.PI / 2, 0], receive: true }
  );
  // mint skirting inside
  addBox(group, mintMat, W - 0.5, 0.06, 0.03, CX, 0.25, S.z0 + 0.2, { cast: false });
  addBox(group, mintMat, 0.03, 0.06, D - 0.5, S.x0 + 0.2, 0.25, CZ, { cast: false });
  addBox(group, mintMat, 0.03, 0.06, D - 0.5, S.x1 - 0.2, 0.25, CZ, { cast: false });

  // interior ceiling
  addBox(group, toon(0xf0eadb), W - 0.36, 0.07, D - 0.36, CX, CEIL + 0.04, CZ, {
    cast: false,
    receive: true,
  });

  /* ------------------------------------------------------------------ *
   *  Glass facade + automatic doors
   * ------------------------------------------------------------------ */
  const doorLeft = 2.55;
  const doorRight = 4.55;
  const glassY = 1.44;
  const glassH = 1.98;
  const paneZ = S.z1 - 0.055;
  const fixedPanes = [
    [S.x0 + 0.15, -0.55],
    [-0.55, 1.15],
    [1.15, doorLeft],
    [doorRight, S.x1 - 0.15],
  ];
  const mullionX = [S.x0 + 0.15, -0.55, 1.15, doorLeft, doorRight, S.x1 - 0.15];

  // large glass panes
  fixedPanes.forEach(([x0, x1]) => {
    addPlane(group, glassMat, x1 - x0 - 0.02, glassH, (x0 + x1) / 2, glassY, paneZ);
  });

  // mullions and rails
  mullionX.forEach((x) => {
    addBox(group, trimMat, 0.07, 2.16, 0.09, x, 1.43, paneZ, { outline: 0.006 });
  });
  addBox(group, trimMat, W - 0.14, 0.07, 0.1, CX, 0.45, paneZ, { outline: 0.006 });
  addBox(group, trimMat, W - 0.14, 0.07, 0.1, CX, 2.43, paneZ, { outline: 0.006 });
  addBox(group, trimMat, W - 0.14, 0.11, 0.13, CX, 2.51, paneZ, { outline: 0.006 });

  // automatic sliding doors
  const doorGroups = [];
  const doorInfo = [
    { x: (doorLeft + (doorLeft + doorRight) / 2) / 2, dir: -1 },
    { x: ((doorLeft + doorRight) / 2 + doorRight) / 2, dir: 1 },
  ];
  doorInfo.forEach((info, index) => {
    const dg = new THREE.Group();
    dg.position.set(info.x, 0, paneZ + 0.02);
    group.add(dg);
    const width = (doorRight - doorLeft) / 2;
    const frameMat = trimMat;
    addBox(dg, frameMat, 0.055, glassH + 0.02, 0.07, -width / 2 + 0.03, glassY, 0, {
      outline: 0.004,
    });
    addBox(dg, frameMat, 0.055, glassH + 0.02, 0.07, width / 2 - 0.03, glassY, 0, {
      outline: 0.004,
    });
    addBox(dg, frameMat, width, 0.06, 0.07, 0, glassY - glassH / 2 + 0.03, 0, {
      outline: 0.004,
    });
    addBox(dg, frameMat, width, 0.06, 0.07, 0, glassY + glassH / 2 - 0.03, 0, {
      outline: 0.004,
    });
    addBox(dg, frameMat, width, 0.055, 0.06, 0, 0.93, 0.01, { outline: 0.003 });
    addPlane(dg, glassMat, width - 0.09, glassH - 0.08, 0, glassY, 0);
    // vertical pull handle
    addBox(dg, metalMat, 0.028, 0.62, 0.05, index === 0 ? width / 2 - 0.13 : -width / 2 + 0.13, 1.35, 0.06);
    // door decal
    const decal = addPlane(
      dg,
      texturedGlow(makeSmallShopLabelTexture(), 0.96, { transparent: true }),
      width * 0.72,
      0.18,
      0,
      0.64,
      0.045
    );
    decal.renderOrder = 8;
    doorGroups.push({ group: dg, baseX: info.x, dir: info.dir });
  });

  // door frame + header + sensor
  addBox(group, trimMat, doorRight - doorLeft + 0.12, 0.16, 0.15, (doorLeft + doorRight) / 2, 2.48, paneZ, {
    outline: 0.006,
  });
  addBox(group, darkMetalMat, 0.28, 0.09, 0.11, (doorLeft + doorRight) / 2, 2.3, paneZ + 0.11);
  const sensorMat = new THREE.MeshBasicMaterial({ color: 0x66ffb3, toneMapped: false });
  const sensorLed = addSphere(group, sensorMat, 0.024, (doorLeft + doorRight) / 2 + 0.06, 2.3, paneZ + 0.18, 10);
  addBox(group, trimMat, 0.55, 0.25, 0.05, (doorLeft + doorRight) / 2, 2.03, paneZ + 0.04, {
    outline: 0.004,
  });
  const entranceBrand = addPlane(
    group,
    texturedGlow(labelTexture('HOSHIZORA MART', {
      width: 512,
      height: 96,
      fg: '#effff8',
      font: '700 42px "Trebuchet MS", sans-serif',
    }), 1.0, { transparent: true }),
    0.45,
    0.085,
    (doorLeft + doorRight) / 2,
    2.03,
    paneZ + 0.07
  );
  entranceBrand.renderOrder = 8;

  // threshold strip
  addBox(group, metalMat, doorRight - doorLeft + 0.1, 0.025, 0.24, (doorLeft + doorRight) / 2, 0.157, S.z1 + 0.06);

  // rain running down the fixed glass panes
  world.glassRain = world.glassRain || [];
  function addGlassRain(parent, width, height, x, y, z, speed = 0.06) {
    const texture = makeRainGlassTexture();
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(Math.max(1, width / 2.4), Math.max(1, height / 2.6));
    texture.offset.set(Math.random(), Math.random());
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const mesh = addPlane(parent, material, width, height, x, y, z);
    mesh.renderOrder = 9;
    world.glassRain.push({ texture, speed });
    return mesh;
  }
  fixedPanes.forEach(([x0, x1], i) => {
    addGlassRain(group, x1 - x0 - 0.03, glassH - 0.03, (x0 + x1) / 2, glassY, paneZ + 0.015, 0.045 + i * 0.008);
  });
  doorGroups.forEach(({ group: dg }, i) => {
    addGlassRain(dg, 0.9, glassH - 0.05, 0, glassY, 0.04, 0.055 + i * 0.01);
  });

  // window graphics
  const decal24 = addPlane(
    group,
    texturedGlow(makeWindowDecalTexture('24h'), 0.62, { transparent: true, depthWrite: false }),
    0.62, 0.62, 6.18, 1.16, paneZ + 0.035
  );
  decal24.renderOrder = 10;
  const decalAtm = addPlane(
    group,
    texturedGlow(makeWindowDecalTexture('atm'), 0.6, { transparent: true, depthWrite: false }),
    0.48, 0.48, -1.35, 0.98, paneZ + 0.035
  );
  decalAtm.renderOrder = 10;
  const decalCopy = addPlane(
    group,
    texturedGlow(makeWindowDecalTexture('copy'), 0.55, { transparent: true, depthWrite: false }),
    0.46, 0.46, 0.42, 2.02, paneZ + 0.035
  );
  decalCopy.renderOrder = 10;

  // posters taped inside the glass
  const coffeePoster = addPlane(
    group,
    texturedGlow(makeCoffeePosterTexture(), 0.98),
    0.64, 0.96,
    -1.35, 1.78, paneZ + 0.022
  );
  coffeePoster.renderOrder = 8;
  const sodaPoster = addPlane(
    group,
    texturedGlow(makeSodaPosterTexture(), 0.98),
    0.62, 0.93,
    5.9, 1.78, paneZ + 0.022
  );
  sodaPoster.renderOrder = 8;
  // poster tape strips
  for (const [px, py] of [[-1.35, 2.24], [5.9, 2.24]]) {
    addPlane(group, glow(0xd8e2df, 0.55, { transparent: true, opacity: 0.4 }), 0.26, 0.035, px, py, paneZ + 0.03);
  }

  /* ------------------------------------------------------------------ *
   *  Signboard and canopy
   * ------------------------------------------------------------------ */
  const signBacking = addBox(group, toon(0x0c2237), 9.2, 0.98, 0.18, CX, 3.02, S.z1 - 0.03, {
    outline: 0.01,
  });
  const signTex = makeStoreSignTexture();
  const signMat = texturedGlow(signTex, 1.02, { toneMapped: false });
  const signPlane = addPlane(group, signMat, 7.2, 0.9, CX, 3.02, S.z1 + 0.068);
  signPlane.name = 'main-sign';
  addBox(group, glow(0x58e6c1, 1.1, { toneMapped: false }), 0.12, 0.74, 0.03, -1.32, 3.02, S.z1 + 0.078);
  addBox(group, glow(0xff9362, 1.1, { toneMapped: false }), 0.12, 0.74, 0.03, 5.92, 3.02, S.z1 + 0.078);
  addBox(group, wallMat, 9.6, 0.2, 0.36, CX, 3.6, S.z1 - 0.05, { outline: 0.01 });
  addBox(group, mintMat, 9.5, 0.045, 0.2, CX, 3.49, S.z1 + 0.06, { cast: false });

  // flat rain canopy
  const canopy = addBox(group, toon(0x46515d), 9.1, 0.09, 1.15, CX, 2.53, S.z1 + 0.53, {
    outline: 0.008,
    cast: true,
  });
  addBox(group, trimMat, 9.1, 0.16, 0.1, CX, 2.47, S.z1 + 1.11, { outline: 0.005 });
  addBox(group, glow(0xffe0ae, 0.3), 8.7, 0.018, 0.06, CX, 2.475, S.z1 + 1.0, { cast: false });
  for (let i = 0; i < 6; i++) {
    const x = -1.75 + i * 1.65;
    const disc = addCylinder(group, glow(0xffe0ae, 0.82, { toneMapped: false }), 0.075, 0.075, 0.022, 12, x, 2.47, S.z1 + 0.7);
    disc.castShadow = false;
  }

  // awning over the alley-side service door
  const awnTex = makeAwningTexture();
  const awnMat = toon(0xffffff, { map: awnTex, side: THREE.DoubleSide });
  const awning = addBox(group, awnMat, 0.08, 0.06, 1.5, S.x0 - 0.3, 2.72, -6.4, { outline: 0.005 });
  awning.rotation.z = 0.18;

  // entrance mat
  const matTexture = makeDoormatTexture();
  addBox(group, toon(0x1c372e), 1.8, 0.028, 0.82, LAYOUT.door.x, WALK_PLUS, S.z1 + 0.64, {
    cast: false,
  });
  addPlane(
    group,
    toon(0xffffff, { map: matTexture }),
    1.68, 0.72,
    LAYOUT.door.x, WALK_PLUS + 0.017, S.z1 + 0.64,
    { rotation: [-Math.PI / 2, 0, 0] }
  );

  /* ------------------------------------------------------------------ *
   *  Interior lighting
   * ------------------------------------------------------------------ */
  const lightPanels = [];
  const lightPositions = [
    [-0.7, -5.6], [1.6, -5.6], [3.9, -5.6],
    [-0.7, -3.2], [1.6, -3.2], [3.9, -3.2],
  ];
  lightPositions.forEach(([x, z]) => {
    addBox(group, trimMat, 0.9, 0.03, 0.9, x, CEIL - 0.055, z, { cast: false });
    const panel = addBox(
      group,
      glow(0xffe2ae, 0.78, { toneMapped: false }),
      0.78, 0.018, 0.78,
      x, CEIL - 0.075, z,
      { cast: false }
    );
    lightPanels.push(panel);
  });
  // under-shelf light strips (warm detail)
  addBox(group, glow(0xffdca7, 0.34), 8.4, 0.02, 0.03, CX, 2.79, -5.0, { cast: false });

  const warmLightA = new THREE.PointLight(0xffe0b2, 16, 11, 1.8);
  warmLightA.position.set(0.9, 2.62, -4.6);
  group.add(warmLightA);
  const warmLightB = new THREE.PointLight(0xffd8a6, 13, 10, 1.8);
  warmLightB.position.set(4.2, 2.62, -3.1);
  group.add(warmLightB);
  const warmLightC = new THREE.PointLight(0xffc98d, 8, 6, 1.7);
  warmLightC.position.set(3.55, 2.1, -2.1);
  group.add(warmLightC);
  const coolerLight = new THREE.PointLight(0xbff4ff, 8, 6.5, 1.7);
  coolerLight.position.set(2.5, 2.15, -6.85);
  group.add(coolerLight);
  const counterLight = new THREE.PointLight(0xffd7a0, 6, 4.5, 1.7);
  counterLight.position.set(5.9, 1.9, -3.4);
  group.add(counterLight);

  const canopyLight = new THREE.PointLight(0xffd6a0, 8, 6, 1.7);
  canopyLight.position.set(3.55, 2.35, -0.6);
  group.add(canopyLight);
  const signLight = new THREE.PointLight(0x8effdd, 4, 4.5, 2);
  signLight.position.set(2.2, 2.95, -0.65);
  group.add(signLight);

  /* ------------------------------------------------------------------ *
   *  Interior: cooler bank
   * ------------------------------------------------------------------ */
  const coolerX0 = 0.05;
  const coolerX1 = 4.95;
  const coolerW = coolerX1 - coolerX0;
  const coolerCX = (coolerX0 + coolerX1) / 2;
  const coolerZ = -7.34;
  addBox(group, toon(0x303a42), coolerW, 2.4, 0.72, coolerCX, 1.39, -7.53, {
    outline: 0.008,
    receive: true,
  });
  const coolerBack = addPlane(
    group,
    glow(0xcdf6f2, 1.15, { toneMapped: false }),
    coolerW - 0.24,
    2.16,
    coolerCX,
    1.43,
    -7.74
  );
  // light shelves and bottles
  const bottleGeom = new THREE.CylinderGeometry(0.034, 0.038, 0.22, 7);
  const bottleMat = toon(0xffffff);
  const bottleDummy = new THREE.Object3D();
  const bottleRows = [0.58, 0.98, 1.38, 1.78];
  const bottlePlacements = [];
  bottleRows.forEach((y, row) => {
    addBox(group, darkMetalMat, coolerW - 0.22, 0.028, 0.5, coolerCX, y, -7.5, { cast: false });
    for (let i = 0; i < 18; i++) {
      for (let depth = 0; depth < 2; depth++) {
        const x = coolerX0 + 0.2 + i * 0.255;
        const z = -7.47 + depth * 0.19;
        bottlePlacements.push({
          x, y: y + 0.13, z,
          color: DRINK_COLORS[(i + row * 3 + depth) % DRINK_COLORS.length],
        });
      }
    }
  });
  const bottleMesh = new THREE.InstancedMesh(bottleGeom, bottleMat, bottlePlacements.length);
  bottlePlacements.forEach((p, i) => {
    bottleDummy.position.set(p.x, p.y, p.z);
    bottleDummy.rotation.y = 0;
    bottleDummy.scale.set(1, 1, 1);
    bottleDummy.updateMatrix();
    bottleMesh.setMatrixAt(i, bottleDummy.matrix);
    bottleMesh.setColorAt(i, new THREE.Color(p.color));
  });
  bottleMesh.instanceMatrix.needsUpdate = true;
  if (bottleMesh.instanceColor) bottleMesh.instanceColor.needsUpdate = true;
  bottleMesh.castShadow = false;
  bottleMesh.receiveShadow = true;
  group.add(bottleMesh);

  // cooler doors
  addBox(group, trimMat, coolerW, 0.06, 0.06, coolerCX, 2.56, -7.02, { cast: false });
  for (let i = 0; i <= 4; i++) {
    addBox(group, trimMat, 0.045, 2.3, 0.05, coolerX0 + (i * coolerW) / 4, 1.4, -7.03, { cast: false });
  }
  for (let i = 0; i < 4; i++) {
    addPlane(group, coolerGlassMat, coolerW / 4 - 0.04, 2.24, coolerX0 + coolerW / 8 + (i * coolerW) / 4, 1.4, -7.01);
  }
  // header sign
  const coolerHeader = addPlane(
    group,
    texturedGlow(makeShelfSignTexture('つめたい飲みもの', '#2d9dd4'), 0.98),
    2.4, 0.27, coolerCX, 2.3, -7.0
  );
  coolerHeader.renderOrder = 4;

  /* ------------------------------------------------------------------ *
   *  Interior: shelving
   * ------------------------------------------------------------------ */
  const snackBoxGeom = new THREE.BoxGeometry(0.085, 0.18, 0.2);
  const snackMat = toon(0xffffff);
  const productDummy = new THREE.Object3D();
  const snackPlacements = [];

  function addPriceStrip(x, y, z, depth, alongZ = true) {
    addBox(
      group,
      glow(0xf6f2e4, 0.5, { toneMapped: false }),
      alongZ ? 0.012 : depth,
      0.026,
      alongZ ? depth : 0.012,
      x, y, z,
      { cast: false }
    );
  }

  function buildGondola(x0, x1, z0, z1, signLabel, index) {
    const gx = (x0 + x1) / 2;
    const gz = (z0 + z1) / 2;
    const width = x1 - x0;
    addBox(group, darkMetalMat, width, 0.18, z1 - z0, gx, FLOOR + 0.09, gz, {
      outline: 0.006,
    });
    addBox(group, trimMat, 0.1, 1.27, z1 - z0 - 0.06, gx, 0.88, gz, { outline: 0.004 });
    const shelfY = [0.52, 0.93, 1.34];
    shelfY.forEach((y) => {
      addBox(group, metalMat, width, 0.035, z1 - z0, gx, y, gz, { outline: 0.004 });
      addPriceStrip(x0 + 0.03, y + 0.035, gz, z1 - z0 - 0.1);
      addPriceStrip(x1 - 0.03, y + 0.035, gz, z1 - z0 - 0.1);
    });
    addBox(group, trimMat, width, 0.05, z1 - z0, gx, 1.53, gz, { outline: 0.004 });
    // end panel
    addBox(group, toon(0xd6d0c0), width, 1.3, 0.06, gx, 0.82, z1, { outline: 0.005 });
    addPlane(
      group,
      texturedGlow(makePosterPlaceholderTexture(index === 0 ? '#f08a58' : '#5baf92'), 0.9),
      0.52, 0.72,
      gx, 1.03, z1 + 0.036
    );
    // product rows
    for (const side of [-1, 1]) {
      const px = side < 0 ? x0 + 0.16 : x1 - 0.16;
      for (let level = 0; level < shelfY.length; level++) {
        for (let i = 0; i < 11; i++) {
          const z = z0 + 0.22 + i * ((z1 - z0 - 0.44) / 10);
          snackPlacements.push({
            x: px,
            y: shelfY[level] + 0.115,
            z,
            color: SNACK_COLORS[(i * 2 + level * 3 + (side > 0 ? 4 : 0)) % SNACK_COLORS.length],
            height: 0.18 + (i % 3) * 0.012,
          });
        }
      }
    }
    // little shelf header
    const sign = addPlane(
      group,
      texturedGlow(makeShelfSignTexture(signLabel, index === 0 ? '#e8834f' : '#4a9b80'), 0.95, { transparent: true }),
      0.92, 0.23,
      gx, 2.02, gz + 1.1
    );
    sign.renderOrder = 4;
    const wireMat = toon(0x2d3740);
    addCylinder(group, wireMat, 0.006, 0.006, 0.27, 4, gx - 0.32, 2.2, gz + 1.1, { cast: false });
    addCylinder(group, wireMat, 0.006, 0.006, 0.27, 4, gx + 0.32, 2.2, gz + 1.1, { cast: false });
  }
  buildGondola(-0.4, 0.6, -6.7, -3.35, 'おにぎり・パン', 0);
  buildGondola(1.5, 2.5, -6.7, -3.35, 'お菓子・スナック', 1);

  // left wall shelving
  const leftShelfX = -1.88;
  for (let level = 0; level < 4; level++) {
    const y = 0.48 + level * 0.4;
    addBox(group, metalMat, 0.58, 0.035, 3.9, leftShelfX, y, -4.95, { outline: 0.004 });
    addPriceStrip(leftShelfX + 0.27, y + 0.03, -4.95, 3.7);
    for (let i = 0; i < 12; i++) {
      snackPlacements.push({
        x: leftShelfX + 0.2,
        y: y + 0.11,
        z: -6.75 + i * 0.31,
        color: SNACK_COLORS[(i + level * 5) % SNACK_COLORS.length],
        height: 0.18 + (i % 2) * 0.02,
      });
    }
  }
  addBox(group, darkMetalMat, 0.62, 2.1, 0.05, leftShelfX, 1.25, -6.96, { outline: 0.005 });
  addBox(group, darkMetalMat, 0.62, 2.1, 0.05, leftShelfX, 1.25, -2.95, { outline: 0.005 });
  addBox(group, darkMetalMat, 0.06, 2.1, 3.9, leftShelfX - 0.3, 1.25, -4.95, { outline: 0.005 });

  // onigiri on the left shelf
  const onigiriShape = new THREE.Shape();
  onigiriShape.moveTo(-0.075, -0.07);
  onigiriShape.lineTo(0.075, -0.07);
  onigiriShape.lineTo(0, 0.095);
  onigiriShape.closePath();
  const onigiriGeom = new THREE.ExtrudeGeometry(onigiriShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1,
  });
  onigiriGeom.center();
  const onigiriMat = toon(0xf6f0df);
  const onigiriMesh = new THREE.InstancedMesh(onigiriGeom, onigiriMat, 7);
  const bandGeom = new THREE.BoxGeometry(0.01, 0.055, 0.16);
  const bandMesh = new THREE.InstancedMesh(bandGeom, toon(0x25303a), 7);
  for (let i = 0; i < 7; i++) {
    const z = -6.55 + i * 0.28;
    const dummy = new THREE.Object3D();
    dummy.position.set(leftShelfX + 0.24, 1.02, z);
    dummy.rotation.y = Math.PI / 2;
    dummy.updateMatrix();
    onigiriMesh.setMatrixAt(i, dummy.matrix);
    const bd = new THREE.Object3D();
    bd.position.set(leftShelfX + 0.285, 1.0, z);
    bd.updateMatrix();
    bandMesh.setMatrixAt(i, bd.matrix);
  }
  onigiriMesh.instanceMatrix.needsUpdate = true;
  bandMesh.instanceMatrix.needsUpdate = true;
  group.add(onigiriMesh, bandMesh);

  // combined instanced snack boxes
  const snackMesh = new THREE.InstancedMesh(snackBoxGeom, snackMat, snackPlacements.length);
  snackPlacements.forEach((p, i) => {
    productDummy.position.set(p.x, p.y, p.z);
    productDummy.rotation.set(0, Math.random() * 0.15 - 0.075, 0);
    productDummy.scale.set(1, p.height / 0.18, 1);
    productDummy.updateMatrix();
    snackMesh.setMatrixAt(i, productDummy.matrix);
    snackMesh.setColorAt(i, new THREE.Color(p.color));
  });
  snackMesh.instanceMatrix.needsUpdate = true;
  if (snackMesh.instanceColor) snackMesh.instanceColor.needsUpdate = true;
  snackMesh.castShadow = false;
  snackMesh.receiveShadow = true;
  group.add(snackMesh);

  // bento display at the end of the left shelf, near the entrance
  const bentoMat = toon(0x1f2b33);
  const bentoTop = toon(0xffffff);
  const bentoGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const by = 0.22 + Math.floor(i / 2) * 0.19;
    const bx = -1.92 + (i % 2) * 0.3;
    addBox(group, bentoMat, 0.28, 0.09, 0.2, bx, by, -2.7, { cast: false });
    addBox(group, toon(['#f0b45c', '#d66b54', '#86b56a', '#e2c98c'][i]), 0.24, 0.025, 0.16, bx, by + 0.055, -2.7, { cast: false });
    addBox(group, glow(0xffe2aa, 0.35), 0.22, 0.006, 0.13, bx, by + 0.07, -2.7, { cast: false });
  }

  /* ------------------------------------------------------------------ *
   *  Interior: counter + equipment
   * ------------------------------------------------------------------ */
  const counterX0 = 5.02;
  const counterX1 = 6.75;
  const counterZ0 = -4.95;
  const counterZ1 = -2.18;
  addBox(
    group,
    toon(0xe6e0d1),
    counterX1 - counterX0,
    0.9,
    counterZ1 - counterZ0,
    (counterX0 + counterX1) / 2,
    FLOOR + 0.45,
    (counterZ0 + counterZ1) / 2,
    { outline: 0.008, receive: true }
  );
  addBox(
    group,
    toon(0x44515a),
    counterX1 - counterX0 + 0.12,
    0.06,
    counterZ1 - counterZ0 + 0.12,
    (counterX0 + counterX1) / 2,
    FLOOR + 0.91,
    (counterZ0 + counterZ1) / 2,
    { outline: 0.006 }
  );
  addBox(group, toon(0x3d7f6d), counterX1 - counterX0 - 0.08, 0.14, 0.02, (counterX0 + counterX1) / 2, FLOOR + 0.16, counterZ1 + 0.01, { cast: false });
  addBox(group, glow(0xffdca7, 0.55), 0.02, 0.022, counterZ1 - counterZ0 - 0.2, counterX0 - 0.005, FLOOR + 0.82, (counterZ0 + counterZ1) / 2, { cast: false });

  // under-counter cupboards
  for (let i = 0; i < 3; i++) {
    const z = -4.4 + i * 0.9;
    addBox(group, toon(0xd6cfbf), 0.025, 0.58, 0.72, counterX0 - 0.012, FLOOR + 0.32, z, { cast: false });
    addBox(group, darkMetalMat, 0.03, 0.09, 0.04, counterX0 - 0.03, FLOOR + 0.36, z, { cast: false });
  }

  // register
  const register = new THREE.Group();
  register.position.set(6.02, FLOOR + 0.94, -2.46);
  group.add(register);
  addBox(register, toon(0x27323a), 0.36, 0.16, 0.28, 0, 0.08, 0, { outline: 0.004 });
  const regScreen = addBox(register, toon(0x1d262d), 0.34, 0.28, 0.03, 0, 0.31, 0.04, { outline: 0.003 });
  regScreen.rotation.x = -0.22;
  addPlane(register, glow(0x76e4ec, 0.9), 0.27, 0.17, 0, 0.315, 0.059, { rotation: [-0.22, 0, 0] });
  addBox(register, toon(0x202b32), 0.24, 0.035, 0.16, 0, 0.02, -0.16, { cast: false });
  const cardReader = addBox(register, toon(0x3b4650), 0.12, 0.08, 0.1, 0.26, 0.04, -0.02, { outline: 0.003 });
  cardReader.rotation.y = 0.25;
  addPlane(register, glow(0x6dffc7, 0.7), 0.05, 0.03, 0.26, 0.09, 0.03, { rotation: [-Math.PI / 2, 0, 0] });

  // coffee machine
  const coffee = new THREE.Group();
  coffee.position.set(6.08, FLOOR + 0.94, -4.3);
  group.add(coffee);
  addBox(coffee, toon(0x2d3136), 0.44, 0.62, 0.52, 0, 0.31, 0, { outline: 0.005 });
  addBox(coffee, toon(0x171b1e), 0.38, 0.21, 0.04, 0, 0.31, 0.27, { outline: 0.002 });
  addPlane(coffee, glow(0x9de8ff, 1.05), 0.26, 0.12, 0, 0.33, 0.295);
  addBox(coffee, toon(0x8e5b3c), 0.09, 0.1, 0.09, -0.09, 0.5, 0.18, { cast: false });
  addBox(coffee, glow(0xffb15c, 0.55), 0.3, 0.02, 0.1, 0, 0.19, 0.2, { cast: false });
  addBox(coffee, toon(0xc7d0d5), 0.06, 0.16, 0.05, 0.1, 0.14, 0.24, { cast: false });

  // oden warmer
  const oden = new THREE.Group();
  oden.position.set(5.9, FLOOR + 0.94, -3.8);
  group.add(oden);
  addBox(oden, toon(0x6e4a32), 0.62, 0.12, 0.46, 0, 0.06, 0, { outline: 0.004 });
  addBox(oden, toon(0x9e866a), 0.54, 0.16, 0.38, 0, 0.17, 0, { outline: 0.003 });
  addPlane(oden, glow(0xffb765, 0.55), 0.44, 0.28, 0, 0.255, 0, { rotation: [-Math.PI / 2, 0, 0] });
  for (let i = 0; i < 6; i++) {
    addCylinder(oden, toon(0xe7d6ae), 0.008, 0.008, 0.34, 4, -0.18 + i * 0.07, 0.3, 0.02 + (i % 2) * 0.06, { cast: false });
    addSphere(oden, toon(['#d79a54', '#e6c08a', '#f2e6d0', '#b86a43', '#d9aa6c', '#e8d9b2'][i]), 0.035, -0.18 + i * 0.07, 0.27, 0.02 + (i % 2) * 0.06, 8);
  }
  const odenHeader = addPlane(oden, texturedGlow(makeOdenHeaderTexture(), 1.0), 0.56, 0.17, 0, 0.47, 0);
  odenHeader.rotation.x = -0.15;
  odenHeader.renderOrder = 4;

  // hot snack case
  const hotCase = new THREE.Group();
  hotCase.position.set(5.85, FLOOR + 0.94, -3.12);
  group.add(hotCase);
  addBox(hotCase, toon(0x343d43), 0.6, 0.06, 0.42, 0, 0.03, 0, { cast: false });
  addBox(hotCase, toon(0x9a7a4a), 0.55, 0.3, 0.36, 0, 0.21, 0, { outline: 0.003 });
  addBox(hotCase, glow(0xffc16a, 0.8), 0.5, 0.22, 0.31, 0, 0.22, 0, { cast: false });
  addBox(hotCase, toon(0xecd6a4), 0.08, 0.06, 0.3, -0.13, 0.28, 0, { cast: false });
  addBox(hotCase, toon(0xd9a45e), 0.08, 0.06, 0.3, 0.04, 0.28, 0, { cast: false });
  addBox(hotCase, toon(0xc27845), 0.08, 0.06, 0.3, 0.21, 0.28, 0, { cast: false });
  addBox(hotCase, new THREE.MeshBasicMaterial({ color: 0xcfe8ee, transparent: true, opacity: 0.13, depthWrite: false }), 0.6, 0.45, 0.42, 0, 0.24, 0, { cast: false });

  // coffee menu board on the right wall behind the counter
  const menuBoard = addPlane(
    group,
    texturedGlow(makeMenuBoardTexture(), 0.95),
    0.72, 1.1,
    S.x1 - 0.205, 2.0, -4.85,
    { rotation: [0, -Math.PI / 2, 0] }
  );
  menuBoard.renderOrder = 4;

  // cigarette cabinet (right wall)
  addBox(group, toon(0x29353d), 0.13, 1.9, 1.5, S.x1 - 0.23, 1.5, -5.55, { outline: 0.005 });
  const cigMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.1, 0.075), toon(0xffffff), 72);
  const cigDummy = new THREE.Object3D();
  let cigIndex = 0;
  for (let level = 0; level < 6; level++) {
    for (let row = 0; row < 12; row++) {
      cigDummy.position.set(S.x1 - 0.31, 0.78 + level * 0.28, -6.22 + row * 0.115);
      cigDummy.rotation.set(0, 0, 0);
      cigDummy.updateMatrix();
      cigMesh.setMatrixAt(cigIndex, cigDummy.matrix);
      cigMesh.setColorAt(cigIndex, new THREE.Color(CIG_COLORS[(level + row) % CIG_COLORS.length]));
      cigIndex++;
    }
  }
  cigMesh.instanceMatrix.needsUpdate = true;
  if (cigMesh.instanceColor) cigMesh.instanceColor.needsUpdate = true;
  group.add(cigMesh);
  addBox(group, glow(0xffe5b4, 0.45), 0.02, 0.02, 1.35, S.x1 - 0.34, 2.38, -5.55, { cast: false });

  // ATM by the back-right corner
  const atmWidth = 0.72;
  addBox(group, toon(0xe4e9e6), 0.5, 1.6, atmWidth, S.x1 - 0.4, FLOOR + 0.8, -6.85, { outline: 0.005 });
  addPlane(
    group,
    texturedGlow(makeAtmSideTexture(), 0.92),
    0.44, 1.45,
    S.x1 - 0.66, FLOOR + 0.8, -6.85,
    { rotation: [0, -Math.PI / 2, 0] }
  );
  addBox(group, glow(0x8ce8ff, 0.65), 0.03, 0.08, 0.5, S.x1 - 0.67, 2.15, -6.85, { cast: false });

  // staff door on the back wall
  addBox(group, toon(0x435159), 1.1, 2.15, 0.08, -1.55, FLOOR + 1.07, S.z0 + 0.2, { outline: 0.006 });
  addBox(group, glow(0xffe1b0, 0.8), 0.02, 0.5, 0.025, -1.2, FLOOR + 1.1, S.z0 + 0.25, { cast: false });
  addPlane(
    group,
    texturedGlow(makeStaffSign(), 0.9),
    0.42, 0.21,
    -1.55, 2.48, S.z0 + 0.245
  );

  // wall clock above the cooler
  const clockGroup = new THREE.Group();
  clockGroup.position.set(5.35, 2.68, S.z0 + 0.2);
  group.add(clockGroup);
  addCylinder(clockGroup, toon(0x27323a), 0.3, 0.3, 0.05, 24, 0, 0, 0, { rotation: [Math.PI / 2, 0, 0], outline: 0.003 });
  const clockFace = addPlane(clockGroup, texturedGlow(makeClockFaceTexture(), 0.95, { transparent: true }), 0.57, 0.57, 0, 0, 0.035);
  clockFace.renderOrder = 4;
  const hourHand = addBox(clockGroup, toon(0x29343d), 0.022, 0.14, 0.012, 0, 0.055, 0.045);
  hourHand.geometry.translate(0, 0.055, 0);
  const minuteHand = addBox(clockGroup, toon(0x29343d), 0.014, 0.21, 0.012, 0, 0.09, 0.05);
  minuteHand.geometry.translate(0, 0.09, 0);
  addSphere(clockGroup, toon(0x29343d), 0.024, 0, 0, 0.055, 10);
  const clockStart = 9 * 60 + 47;
  hourHand.rotation.z = -((clockStart / 60 / 12) * Math.PI * 2);
  minuteHand.rotation.z = -(((clockStart % 60) / 60) * Math.PI * 2);

  // floor mat + arrows + baskets
  addPlane(
    group,
    toon(0xffffff, { map: makeDoormatTexture() }),
    1.7, 0.76,
    LAYOUT.door.x, FLOOR + 0.008, -2.32,
    { rotation: [-Math.PI / 2, 0, 0] }
  );
  const arrowTex = makeFloorArrowTexture();
  addPlane(group, texturedGlow(arrowTex, 0.8, { transparent: true }), 0.6, 1.2, 3.5, FLOOR + 0.01, -3.4, {
    rotation: [-Math.PI / 2, 0, 0],
  });
  addPlane(group, texturedGlow(arrowTex, 0.6, { transparent: true }), 0.42, 0.85, 4.1, FLOOR + 0.011, -4.6, {
    rotation: [-Math.PI / 2, 0, Math.PI],
  });

  // basket stack
  const basketColors = [0xdd6f55, 0x4b8fc7, 0xdd6f55, 0x4b8fc7];
  basketColors.forEach((c, i) => {
    const b = addBox(group, toon(c), 0.5, 0.17, 0.36, 3.1, FLOOR + 0.09 + i * 0.14, -2.6, { outline: 0.004 });
    b.rotation.y = (i % 2 ? -1 : 1) * 0.08;
  });

  // magazine rack against the right-hand glass
  addBox(group, toon(0x33414a), 1.85, 0.07, 0.34, 5.7, FLOOR + 0.035, -1.88, { outline: 0.004 });
  addBox(group, toon(0x8a7a63), 0.07, 1.2, 0.34, 4.8, FLOOR + 0.6, -1.88, { outline: 0.004 });
  addBox(group, toon(0x8a7a63), 0.07, 1.2, 0.34, 6.6, FLOOR + 0.6, -1.88, { outline: 0.004 });
  addBox(group, toon(0x39464f), 1.85, 0.05, 0.32, 5.7, FLOOR + 0.55, -1.88, { cast: false });
  for (let row = 0; row < 2; row++) {
    const y = FLOOR + 0.19 + row * 0.51;
    addBox(group, toon(0x39464f), 1.75, 0.03, 0.28, 5.7, y, -1.86, { cast: false });
    for (let i = 0; i < 7; i++) {
      const cover = addPlane(
        group,
        texturedGlow(makeMagazineCoverTexture(row === 0 ? i : i + 3), 0.92),
        0.2, 0.27,
        4.92 + i * 0.225, y + 0.17, -1.72
      );
      cover.rotation.x = -0.12;
      cover.renderOrder = 4;
    }
    addBox(group, toon(0x2b353d), 1.8, 0.04, 0.03, 5.7, y + 0.38, -1.67, { cast: false });
  }
  // rack header
  addPlane(
    group,
    texturedGlow(makeShelfSignTexture('雑誌・コミック', '#d58b6b'), 0.9),
    0.8, 0.16,
    5.7, FLOOR + 1.34, -1.7
  );

  // interior soft floor glints
  const glintTex = world.reflectionTexture;
  [ [1.2, -4.1], [4.4, -3.2] ].forEach(([x, z], i) => {
    const mat = new THREE.MeshBasicMaterial({
      map: glintTex,
      color: 0xffe3b3,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    addPlane(group, mat, 1.8, 3.2, x, FLOOR + 0.012, z, { rotation: [-Math.PI / 2, 0, 0] });
  });

  // hanging aisle signs
  const aisleSigns = [
    { x: -1.15, z: -4.2, label: 'パン・おにぎり', color: '#e8905a' },
    { x: 0.1, z: -5.3, label: 'お菓子', color: '#dd8eaa' },
    { x: 2.0, z: -6.1, label: '飲みもの', color: '#419bc9' },
    { x: 5.6, z: -3.6, label: 'レジ・おでん', color: '#cf6f4e' },
  ];
  aisleSigns.forEach((s) => {
    const texture = makeShelfSignTexture(s.label, s.color, '#ffffff');
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      toneMapped: false,
    });
    const sign = addPlane(group, mat, 1.05, 0.26, s.x, 2.0, s.z);
    sign.rotation.y = 0.2;
    sign.renderOrder = 4;
    addCylinder(group, toon(0x2d3740), 0.005, 0.005, 0.3, 4, s.x - 0.35, 2.16, s.z, { cast: false });
    addCylinder(group, toon(0x2d3740), 0.005, 0.005, 0.3, 4, s.x + 0.35, 2.16, s.z, { cast: false });
  });

  // ceiling security camera near the door
  addBox(group, toon(0x2a333b), 0.15, 0.12, 0.12, 2.2, 2.86, -2.1, { outline: 0.002 });
  addSphere(group, glow(0xff6b6b, 0.5), 0.018, 2.2, 2.8, -2.04, 8);

  /* ------------------------------------------------------------------ *
   *  Roof
   * ------------------------------------------------------------------ */
  addBox(group, roofMat, W + 0.24, 0.16, D + 0.24, CX, 3.63, CZ, {
    cast: true,
    receive: true,
    outline: 0.012,
  });
  // parapets
  const parapetH = 0.32;
  addBox(group, wallMat, W + 0.24, parapetH, 0.12, CX, 3.87, S.z1 + 0.06, { outline: 0.008 });
  addBox(group, wallMat, W + 0.24, parapetH, 0.12, CX, 3.87, S.z0 - 0.06, { outline: 0.008 });
  addBox(group, wallMat, 0.12, parapetH, D + 0.24, S.x0 - 0.06, 3.87, CZ, { outline: 0.008 });
  addBox(group, wallMat, 0.12, parapetH, D + 0.24, S.x1 + 0.06, 3.87, CZ, { outline: 0.008 });
  // roof seams
  for (let i = 0; i < 5; i++) {
    addBox(group, toon(0x4f5a62), W - 0.2, 0.008, 0.02, CX, 3.716, -7.2 + i * 1.2, { cast: false });
  }
  // roof access box
  addBox(group, toon(0x79838a), 1.35, 1.05, 1.1, 0.1, 4.22, -7.0, { outline: 0.008 });
  addBox(group, trimMat, 0.72, 0.8, 0.04, 0.1, 4.13, -6.43, { outline: 0.004 });
  addBox(group, glow(0xffe8c1, 0.6), 0.47, 0.05, 0.02, 0.1, 3.85, -6.41, { cast: false });

  function rooftopAC(x, z, rotation = 0) {
    const g = new THREE.Group();
    g.position.set(x, 3.72, z);
    g.rotation.y = rotation;
    group.add(g);
    addBox(g, toon(0x9da6ad), 0.95, 0.62, 0.55, 0, 0.38, 0, { outline: 0.006 });
    addBox(g, toon(0x5f6b74), 0.05, 0.62, 0.55, -0.48, 0.38, 0, { cast: false });
    addCylinder(g, toon(0x2e373e), 0.18, 0.18, 0.03, 20, 0.15, 0.38, 0.29, { rotation: [Math.PI / 2, 0, 0] });
    addCylinder(g, toon(0xb7c0c6), 0.15, 0.15, 0.04, 20, 0.15, 0.38, 0.3, { rotation: [Math.PI / 2, 0, 0] });
    for (let i = 0; i < 4; i++) {
      const bar = addBox(g, toon(0x68737b), 0.26, 0.025, 0.012, 0.15, 0.38, 0.325);
      bar.rotation.z = (i / 4) * Math.PI;
    }
    addBox(g, toon(0x737d84), 0.9, 0.05, 0.12, 0, 0.07, 0, { cast: false });
  }
  rooftopAC(4.9, -4.6, 0.15);
  rooftopAC(6.0, -6.2, -0.1);

  // shallow rain puddle on the roof
  const roofPuddleBase = new THREE.MeshBasicMaterial({
    map: makeRadialGlowTexture('rgba(0,0,0,0.52)', 'rgba(0,0,0,0)'),
    color: 0x050b12,
    transparent: true,
    depthWrite: false,
  });
  const roofPuddle = addPlane(group, roofPuddleBase, 2.7, 1.5, 2.35, 3.735, -3.55, {
    rotation: [-Math.PI / 2, 0, 0],
  });
  roofPuddle.renderOrder = 1;
  const roofReflectMat = new THREE.MeshBasicMaterial({
    map: world.reflectionTexture,
    color: 0xa9d8ff,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  addPlane(group, roofReflectMat, 2.2, 1.1, 2.35, 3.74, -3.55, { rotation: [-Math.PI / 2, 0, 0] });
  world.reflections.push({ material: roofReflectMat, base: 0.1, phase: 3.4, speed: 0.5 });

  // ductwork between the roof units
  addBox(group, toon(0x828d94), 2.5, 0.24, 0.34, 5.25, 4.34, -5.45, { outline: 0.005 });
  addBox(group, toon(0x66727a), 2.5, 0.03, 0.38, 5.25, 4.23, -5.45, { cast: false });
  for (let i = 0; i < 4; i++) {
    addBox(group, toon(0x6d7880), 0.035, 0.26, 0.38, 4.2 + i * 0.7, 4.34, -5.45, { cast: false });
  }
  // small satellite dish
  addCylinder(group, toon(0x59646b), 0.022, 0.022, 1.15, 6, 6.55, 4.3, -7.35, { outline: 0.002 });
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.36),
    toon(0xb9c2c5, { side: THREE.DoubleSide })
  );
  dish.position.set(6.55, 4.82, -7.35);
  dish.rotation.set(-1.05, 0.35, 0.15);
  dish.castShadow = true;
  addOutline(dish, 0.006);
  group.add(dish);
  addCylinder(group, toon(0x707b81), 0.012, 0.012, 0.34, 5, 6.45, 4.72, -7.22, {
    rotation: [0.5, 0, 0.4],
    cast: false,
  });
  // parapet ladder at the back
  for (let i = 0; i < 2; i++) {
    addCylinder(group, toon(0x59656c), 0.022, 0.022, 1.25, 6, 6.15 + i * 0.34, 4.42, -8.06, { outline: 0.002 });
  }
  for (let i = 0; i < 5; i++) {
    addBox(group, toon(0x59656c), 0.36, 0.022, 0.022, 6.32, 3.95 + i * 0.24, -8.06, { cast: false });
  }

  // roof vent + antenna
  addCylinder(group, metalMat, 0.09, 0.09, 0.8, 10, -1.25, 4.05, -5.6, { outline: 0.004 });
  addCylinder(group, metalMat, 0.09, 0.09, 0.9, 10, -1.0, 4.1, -5.6, { outline: 0.004 });
  addBox(group, metalMat, 0.55, 0.08, 0.25, -1.1, 4.45, -5.6, { outline: 0.003 });
  addCylinder(group, toon(0x2f3940), 0.018, 0.018, 2.0, 6, 5.9, 4.6, -2.6, { outline: 0.002 });
  addBox(group, toon(0x2f3940), 1.1, 0.02, 0.02, 5.9, 5.38, -2.6, { cast: false });
  addBox(group, toon(0x2f3940), 0.8, 0.02, 0.02, 5.9, 5.12, -2.6, { cast: false });
  addSphere(group, glow(0xff6262, 0.8), 0.035, 5.9, 5.62, -2.6, 8);
  addBox(group, toon(0x66717a), 0.9, 0.18, 0.9, 1.6, 3.77, -3.2, { outline: 0.004 });
  addBox(group, new THREE.MeshBasicMaterial({ color: 0xa9d9df, transparent: true, opacity: 0.3, depthWrite: false }), 0.72, 0.03, 0.72, 1.6, 3.87, -3.2, { cast: false });

  // downpipes
  addCylinder(group, darkMetalMat, 0.045, 0.045, 3.35, 8, S.x0 + 0.02, 1.85, S.z1 - 0.14, { outline: 0.003 });
  addCylinder(group, darkMetalMat, 0.045, 0.045, 3.35, 8, S.x1 - 0.02, 1.85, S.z1 - 0.14, { outline: 0.003 });

  // side 24H lightbox
  const sideSign = addPlane(
    group,
    texturedGlow(makePylonTexture(), 0.88),
    0.62, 1.65,
    S.x1 + 0.075, 2.38, -2.25,
    { rotation: [0, Math.PI / 2, 0] }
  );
  sideSign.renderOrder = 4;
  addBox(group, toon(0x0c2237), 0.08, 1.78, 0.72, S.x1 + 0.025, 2.38, -2.25, { outline: 0.005 });

  // right-hand flank: service door, vents, pipes and a small back-of-house AC
  addBox(group, toon(0x9c9383), 0.018, 0.16, 5.6, S.x1 + 0.012, 0.54, -4.85, { cast: false });
  for (let i = 0; i < 3; i++) {
    addBox(group, toon(0xaba291), 0.012, 0.012, 5.65, S.x1 + 0.007, 1.25 + i * 1.05, -4.85, { cast: false });
  }
  // service door
  addBox(group, toon(0x37424a), 0.055, 2.18, 1.12, S.x1 + 0.03, 1.24, -5.7, { outline: 0.005 });
  addBox(group, toon(0x59656c), 0.035, 1.94, 0.9, S.x1 + 0.06, 1.18, -5.7, { cast: false });
  addBox(group, toon(0x2c363d), 0.02, 0.42, 0.6, S.x1 + 0.083, 1.56, -5.7, { cast: false });
  addCylinder(group, toon(0xbcc5c8), 0.018, 0.018, 0.22, 6, S.x1 + 0.09, 1.02, -5.34, {
    rotation: [Math.PI / 2, 0, 0],
    cast: false,
  });
  addBox(group, toon(0x353f46), 0.55, 0.06, 1.25, S.x1 + 0.28, 2.42, -5.7, { outline: 0.004 });
  addBox(group, glow(0xffddb0, 0.6), 0.3, 0.018, 0.4, S.x1 + 0.31, 2.38, -5.7, { cast: false });
  const backDoorLight = new THREE.PointLight(0xffc98d, 4, 3.4, 1.8);
  backDoorLight.position.set(S.x1 + 0.55, 2.1, -5.7);
  group.add(backDoorLight);
  const sidePoster = addPlane(
    group,
    texturedGlow(makePosterPlaceholderTexture('#5baf92'), 0.84),
    0.56, 0.79,
    S.x1 + 0.02, 1.52, -3.85,
    { rotation: [0, Math.PI / 2, 0] }
  );
  sidePoster.renderOrder = 4;
  // vent grille
  addBox(group, toon(0x47525a), 0.05, 0.52, 0.78, S.x1 + 0.02, 2.62, -3.5, { outline: 0.003 });
  for (let i = 0; i < 4; i++) {
    addBox(group, toon(0x7f8a90), 0.02, 0.035, 0.66, S.x1 + 0.05, 2.44 + i * 0.11, -3.5, { cast: false });
  }
  // pipes
  addCylinder(group, toon(0x6e787e), 0.045, 0.045, 3.25, 8, S.x1 + 0.06, 1.8, -6.85, { outline: 0.003 });
  addCylinder(group, toon(0x6e787e), 0.035, 0.035, 3.1, 8, S.x1 + 0.06, 1.68, -2.95, { outline: 0.002 });
  // wall-mounted air conditioner
  addBox(group, toon(0x9fa8ab), 0.54, 0.55, 0.46, S.x1 + 0.28, 1.08, -7.0, { outline: 0.005 });
  addCylinder(group, toon(0x3d474d), 0.17, 0.17, 0.03, 16, S.x1 + 0.56, 1.08, -7.0, {
    rotation: [0, 0, Math.PI / 2],
    cast: false,
  });
  addCylinder(group, toon(0xbec6c8), 0.13, 0.13, 0.035, 16, S.x1 + 0.57, 1.08, -7.0, {
    rotation: [0, 0, Math.PI / 2],
    cast: false,
  });
  addBox(group, toon(0x707b81), 0.5, 0.07, 0.5, S.x1 + 0.28, 0.79, -7.0, { cast: false });

  /* ------------------------------------------------------------------ *
   *  Animation controllers
   * ------------------------------------------------------------------ */
  let doorState = 'closed';
  let doorTimer = 5.5;
  let doorT = 0;
  let doorOffset = 0;
  const doorHold = 4.2;
  const doorCycleMin = 13;
  const doorCycleMax = 21;
  world.doorOpenAmount = 0;
  world.updatables.push({
    update(dt, elapsed) {
      if (doorState === 'closed') {
        doorTimer -= dt;
        if (doorTimer <= 0) {
          doorState = 'opening';
          doorT = 0;
          sensorMat.color.setHex(0x8fffd0);
        }
      } else if (doorState === 'opening') {
        doorT += dt;
        const k = Math.min(1, doorT / 1.15);
        doorOffset = easeInOutCubic(k) * 0.94;
        if (k >= 1) {
          doorState = 'open';
          doorTimer = doorHold;
        }
      } else if (doorState === 'open') {
        doorTimer -= dt;
        if (doorTimer <= 0) {
          doorState = 'closing';
          doorT = 0;
          sensorMat.color.setHex(0xff8b7a);
        }
      } else if (doorState === 'closing') {
        doorT += dt;
        const k = Math.min(1, doorT / 1.3);
        doorOffset = (1 - easeInOutCubic(k)) * 0.94;
        if (k >= 1) {
          doorState = 'closed';
          doorTimer = doorCycleMin + Math.random() * (doorCycleMax - doorCycleMin);
          sensorMat.color.setHex(0x66ffb3);
        }
      }
      doorGroups[0].group.position.x = doorGroups[0].baseX - doorOffset;
      doorGroups[1].group.position.x = doorGroups[1].baseX + doorOffset;
      world.doorOpenAmount = doorOffset / 0.94;
      world.doorSpillMat.opacity = 0.16 + world.doorOpenAmount * 0.14;
      sensorLed.material.color.setHex(sensorMat.color.getHex());
    },
  });

  // subtle breathing/flicker of the shop sign
  signMat.color.setScalar(1.02);
  let flickerTimer = 3;
  let flickerValue = 1;
  world.updatables.push({
    update(dt, elapsed) {
      flickerTimer -= dt;
      if (flickerTimer <= 0) {
        flickerTimer = 0.04 + Math.random() * 0.1;
        const r = Math.random();
        if (r < 0.08) flickerValue = 0.62;
        else if (r < 0.16) flickerValue = 1.14;
        else flickerValue = 1.0;
      }
      const wobble = 0.985 + Math.sin(elapsed * 1.6) * 0.015;
      signMat.color.setScalar(1.02 * wobble * flickerValue);
      signLight.intensity = 4 * (0.94 + wobble * 0.06) * (0.8 + flickerValue * 0.2);
    },
  });

  // clock hands (runs a little faster than real time, like a film clock)
  world.updatables.push({
    update(dt, elapsed) {
      const minutes = (clockStart + elapsed * 0.2) % 720;
      hourHand.rotation.z = -((minutes / 720) * Math.PI * 2);
      minuteHand.rotation.z = -(((minutes % 60) / 60) * Math.PI * 2);
    },
  });

  // steam over the coffee machine & oden
  const steamCount = 26;
  const steamGeom = new THREE.BufferGeometry();
  const steamPositions = new Float32Array(steamCount * 3);
  const steamData = [];
  for (let i = 0; i < steamCount; i++) {
    const overOden = i > 16;
    steamData.push({
      x: (overOden ? 5.9 : 6.08) + (Math.random() - 0.5) * 0.3,
      y: FLOOR + (overOden ? 1.3 : 1.5) + Math.random() * 0.5,
      z: (overOden ? -3.8 : -4.3) + (Math.random() - 0.5) * 0.25,
      speed: 0.08 + Math.random() * 0.12,
      phase: Math.random() * 10,
      overOden,
    });
  }
  steamGeom.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
  const steamMat = new THREE.PointsMaterial({
    color: 0xfff1d0,
    size: 0.07,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const steam = new THREE.Points(steamGeom, steamMat);
  steam.frustumCulled = false;
  group.add(steam);
  world.updatables.push({
    update(dt, elapsed) {
      const arr = steamGeom.attributes.position.array;
      steamData.forEach((p, i) => {
        const h = (elapsed * p.speed + p.phase) % 1;
        arr[i * 3] = p.x + Math.sin(elapsed * 1.5 + p.phase) * 0.05 * h;
        arr[i * 3 + 1] = p.y + h * 0.55;
        arr[i * 3 + 2] = p.z + Math.cos(elapsed * 1.2 + p.phase) * 0.03 * h;
      });
      steamGeom.attributes.position.needsUpdate = true;
      steamMat.opacity = 0.16 + Math.sin(elapsed * 1.3) * 0.03;
    },
  });

  world.store = {
    group,
    signMat,
    signLight,
    doorGroups,
    doorSensorMat: sensorMat,
    lightPanels,
  };

  return group;
}