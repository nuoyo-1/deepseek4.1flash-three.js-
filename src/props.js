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
  japaneseFont,
  PALETTE,
} from './core.js';
import { LAYOUT } from './layout.js';
import {
  makeVendingFrontTexture,
  makeNoticeboardTexture,
  makeStreetSignTexture,
  makeNeonSignTexture,
  makeRadialGlowTexture,
  makeConeTexture,
  makeApartmentWallTexture,
  makeShutterTexture,
  makeWindowGlowTexture,
  makePosterPlaceholderTexture,
  makeReflectionStreakTexture,
  makePylonTexture,
} from './textures.js';

const WALK = LAYOUT.walkY;

/* ------------------------------------------------------------------ *
 *  Small shared geometry helpers
 * ------------------------------------------------------------------ */

function tubeBetween(parent, a, b, radius, material, outline = 0) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const length = dir.length();
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 8),
    material
  );
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (outline) addOutline(mesh, outline);
  parent.add(mesh);
  return mesh;
}

function makeSpokeTexture() {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = 'rgba(205,218,228,0.75)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
      ctx.lineTo(Math.cos(a) * 104, Math.sin(a) * 104);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(160,175,188,0.8)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 104, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(120,135,148,0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
  });
}

function addFakeLightPool(parent, x, z, radius, color, opacity, y = LAYOUT.roadY + 0.018) {
  const tex = makeRadialGlowTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
  const mesh = addPlane(
    parent,
    new THREE.MeshBasicMaterial({
      map: tex,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    radius * 2,
    radius * 2,
    x,
    y,
    z,
    { rotation: [-Math.PI / 2, 0, 0] }
  );
  mesh.renderOrder = 3;
  return mesh;
}

/* ------------------------------------------------------------------ *
 *  Vending machine
 * ------------------------------------------------------------------ */

function buildVendingMachine(root, world) {
  const g = new THREE.Group();
  g.position.set(-4.02, WALK, -0.98);
  g.rotation.y = 0.055;
  g.name = 'vending-machine';
  root.add(g);

  const bodyMat = toon(0xeee9df);
  const redMat = toon(0xc34a51);
  const darkMat = toon(0x2d353b);

  addBox(g, darkMat, 1.14, 0.1, 0.82, 0, 0.05, 0, { outline: 0.006 });
  addBox(g, bodyMat, 1.06, 1.72, 0.72, 0, 0.96, 0, { outline: 0.01 });
  addBox(g, redMat, 1.08, 0.23, 0.76, 0, 1.88, 0, { outline: 0.008 });
  addBox(g, redMat, 0.06, 1.5, 0.7, -0.53, 0.97, 0, { cast: false });
  addBox(g, toon(0xffffff), 1.0, 0.1, 0.06, 0, 1.83, 0.34, { cast: false });

  const front = addPlane(
    g,
    texturedGlow(makeVendingFrontTexture(), 0.92, { toneMapped: false }),
    0.96, 1.44,
    0, 1.0, 0.365
  );
  front.renderOrder = 4;

  // 3D coin slot + dispenser lip
  addBox(g, darkMat, 0.18, 0.24, 0.03, 0.36, 0.5, 0.385, { outline: 0.002 });
  addBox(g, glow(0xffb869, 1.0), 0.12, 0.04, 0.01, 0.36, 0.57, 0.4, { cast: false });
  addBox(g, toon(0x30383f), 0.75, 0.11, 0.06, -0.05, 0.3, 0.39, { outline: 0.003, cast: false });
  addBox(g, glow(0x9df5ff, 0.35), 0.6, 0.015, 0.01, -0.05, 0.29, 0.422, { cast: false });

  // tiny selection buttons
  for (let i = 0; i < 4; i++) {
    addBox(g, glow(i === 1 ? 0x6fffd2 : 0xbfefff, 0.7), 0.035, 0.018, 0.008, -0.32 + i * 0.19, 1.6, 0.375, { cast: false });
  }

  const light = new THREE.PointLight(0xd4fbff, 5.5, 4.2, 1.8);
  light.position.set(0, 1.3, 0.72);
  g.add(light);

  addFakeLightPool(root, -4.0, -0.25, 1.35, 0xa8f4ff, 0.16, WALK + 0.014);

  // slim recycling bin beside the machine
  const bin = new THREE.Group();
  bin.position.set(0.82, 0, -0.03);
  g.add(bin);
  addBox(bin, toon(0x3b6b6f), 0.34, 0.72, 0.36, 0, 0.36, 0, { outline: 0.006 });
  addBox(bin, toon(0x2b3b40), 0.27, 0.07, 0.29, 0, 0.72, 0, { cast: false });
  addBox(bin, toon(0x142023), 0.14, 0.04, 0.22, 0, 0.665, 0, { cast: false });

  world.updatables.push({
    update(dt, elapsed) {
      front.material.color.setScalar(0.92 + Math.sin(elapsed * 1.1 + 1.4) * 0.012);
    },
  });
}

/* ------------------------------------------------------------------ *
 *  Bicycle
 * ------------------------------------------------------------------ */

function buildBicycle(root) {
  const g = new THREE.Group();
  g.position.set(-2.86, WALK, 0.35);
  g.rotation.y = 0.12;
  g.name = 'bicycle';
  root.add(g);

  const frameMat = toon(0x2f6e68);
  const tireMat = toon(0x161d22);
  const silverMat = toon(0xaeb8c1);
  const darkMat = toon(0x303940);

  const wheelR = 0.31;
  const wheelY = 0.47;
  const spokeTex = makeSpokeTexture();
  const spokeMat = new THREE.MeshBasicMaterial({
    map: spokeTex,
    transparent: true,
    alphaTest: 0.12,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  [-0.56, 0.56].forEach((x) => {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(wheelR, 0.035, 7, 28), tireMat);
    tire.position.set(x, wheelY, 0);
    tire.castShadow = true;
    tire.receiveShadow = true;
    addOutline(tire, 0.004);
    g.add(tire);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(wheelR - 0.038, 0.009, 5, 24), silverMat);
    rim.position.set(x, wheelY, 0);
    g.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.075, 8), silverMat);
    hub.position.set(x, wheelY, 0);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
    addPlane(g, spokeMat, wheelR * 1.86, wheelR * 1.86, x, wheelY, 0, { cast: false });
    // fender arc
    const fender = new THREE.Mesh(
      new THREE.TorusGeometry(wheelR + 0.025, 0.018, 5, 20, Math.PI * 0.85),
      frameMat
    );
    fender.position.set(x, wheelY, 0);
    fender.rotation.z = 0.12;
    g.add(fender);
  });

  const points = {
    rear: new THREE.Vector3(-0.56, wheelY, 0),
    front: new THREE.Vector3(0.56, wheelY, 0),
    bottom: new THREE.Vector3(0.0, 0.31, 0),
    seat: new THREE.Vector3(-0.25, 0.83, 0),
    head: new THREE.Vector3(0.38, 0.82, 0),
    handle: new THREE.Vector3(0.44, 1.02, 0),
  };
  tubeBetween(g, points.bottom, points.seat, 0.025, frameMat, 0.004);
  tubeBetween(g, points.seat, points.head, 0.023, frameMat, 0.004);
  tubeBetween(g, points.head, points.bottom, 0.027, frameMat, 0.004);
  tubeBetween(g, points.rear, points.seat, 0.019, frameMat, 0.004);
  tubeBetween(g, points.rear, points.bottom, 0.017, frameMat, 0.003);
  tubeBetween(g, points.head, points.handle, 0.02, silverMat, 0.003);
  tubeBetween(g, points.seat, new THREE.Vector3(points.seat.x, 0.93, 0), 0.018, silverMat, 0.003);
  // handlebar
  addCylinder(g, silverMat, 0.016, 0.016, 0.46, 8, 0.45, 1.03, 0, {
    rotation: [Math.PI / 2, 0, 0],
    outline: 0.003,
  });
  // saddle
  addBox(g, darkMat, 0.28, 0.07, 0.14, -0.27, 0.98, 0, { outline: 0.004 });
  addBox(g, darkMat, 0.22, 0.07, 0.3, -0.62, 0.82, 0, { outline: 0.004 });
  // front basket
  addBox(g, silverMat, 0.3, 0.23, 0.3, 0.64, 0.9, 0, { outline: 0.004, cast: false });
  addBox(g, new THREE.MeshBasicMaterial({ color: 0x24343a, transparent: true, opacity: 0.3 }), 0.26, 0.19, 0.26, 0.64, 0.9, 0, { cast: false });
  addBox(g, toon(0xd8e5e1), 0.17, 0.13, 0.17, 0.64, 0.89, 0, { cast: false });
  // kickstand
  tubeBetween(g, points.bottom, new THREE.Vector3(-0.08, 0.02, 0.18), 0.012, silverMat);
  // headlight
  addCylinder(g, glow(0xfff0c8, 0.9), 0.045, 0.045, 0.04, 10, 0.58, 0.9, 0, {
    rotation: [0, 0, Math.PI / 2],
    cast: false,
  });
  // basket stays
  tubeBetween(g, points.front, new THREE.Vector3(0.52, 0.82, 0.12), 0.009, silverMat);
  tubeBetween(g, points.front, new THREE.Vector3(0.52, 0.82, -0.12), 0.009, silverMat);
}

/* ------------------------------------------------------------------ *
 *  Umbrella stand + bins + noticeboard
 * ------------------------------------------------------------------ */

function buildEntranceProps(root) {
  /* umbrella stand */
  const u = new THREE.Group();
  u.position.set(4.92, WALK, -1.2);
  u.rotation.y = -0.08;
  root.add(u);
  const steel = toon(0x9aa6af);
  addBox(u, toon(0x364149), 0.54, 0.06, 0.38, 0, 0.03, 0, { outline: 0.004 });
  addBox(u, steel, 0.04, 0.62, 0.34, -0.25, 0.33, 0, { outline: 0.003 });
  addBox(u, steel, 0.04, 0.62, 0.34, 0.25, 0.33, 0, { outline: 0.003 });
  addBox(u, steel, 0.5, 0.035, 0.04, 0, 0.6, 0.15, { outline: 0.002 });
  const umbrellaColors = [0x6fd9c7, 0xffb0c7, 0x476a86];
  umbrellaColors.forEach((color, i) => {
    const x = -0.16 + i * 0.16;
    addCylinder(u, toon(0x313b41), 0.012, 0.012, 0.82, 6, x, 0.44, 0.02, { cast: false });
    addCylinder(u, toon(color), 0.062, 0.018, 0.5, 10, x, 0.64, 0.02, { outline: 0.003 });
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 10, Math.PI), toon(0x2e383f));
    handle.position.set(x, 0.07, 0.02);
    handle.rotation.z = Math.PI / 2;
    u.add(handle);
  });
  addPlane(
    u,
    texturedGlow(
      (() => {
        return makeCanvasTexture(512, 128, (ctx, w, h) => {
          ctx.fillStyle = '#193a34';
          roundRect(ctx, 4, 20, w - 8, h - 40, 20);
          ctx.fill();
          ctx.fillStyle = '#d8fff2';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = japaneseFont(52, 700);
          ctx.fillText('傘立て', w / 2, h / 2);
        });
      })(),
      0.9
    ),
    0.46, 0.11, 0, 0.68, 0.2
  );

  /* recycle / burnable bins */
  const binDefs = [
    { x: 6.18, color: 0x2e5e74, label: 'かん・びん', bg: '#2d6b82' },
    { x: 6.66, color: 0x8a5b40, label: '燃えるゴミ', bg: '#8d5a3d' },
  ];
  binDefs.forEach((def) => {
    const b = new THREE.Group();
    b.position.set(def.x, WALK, -1.16);
    b.rotation.y = -0.16;
    root.add(b);
    addBox(b, toon(def.color), 0.4, 0.78, 0.4, 0, 0.39, 0, { outline: 0.006 });
    addBox(b, toon(0x252e34), 0.34, 0.08, 0.34, 0, 0.79, 0, { outline: 0.003 });
    addBox(b, toon(0x11181c), 0.22, 0.1, 0.02, 0, 0.55, 0.21, { cast: false });
    const label = addPlane(
      b,
      texturedGlow(
        makeCanvasTexture(512, 256, (ctx, w, h) => {
          ctx.fillStyle = '#f1ede1';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = def.bg;
          ctx.fillRect(0, 0, w, 76);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = japaneseFont(38, 800);
          ctx.fillText(def.label, w / 2, 41);
          ctx.strokeStyle = '#33404a';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(w / 2, 152, 44, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#33404a';
          ctx.font = japaneseFont(28, 700);
          ctx.fillText(def.label === '燃えるゴミ' ? 'MOERU' : 'KAN BIN', w / 2, 216);
        }),
        0.95
      ),
      0.27, 0.135,
      0, 0.44, 0.205
    );
    label.renderOrder = 4;
  });
}

function buildNoticeboard(root) {
  const g = new THREE.Group();
  g.position.set(-4.16, WALK, 1.62);
  g.rotation.y = 0.16;
  root.add(g);
  const wood = toon(0x6b4f36);
  addBox(g, wood, 0.07, 1.5, 0.07, -0.66, 0.75, 0, { outline: 0.004 });
  addBox(g, wood, 0.07, 1.5, 0.07, 0.66, 0.75, 0, { outline: 0.004 });
  addBox(g, wood, 1.47, 0.1, 0.1, 0, 1.48, 0, { outline: 0.004 });
  addBox(g, wood, 1.4, 0.08, 0.09, 0, 1.15, 0, { outline: 0.003, cast: false });
  addBox(g, toon(0x3b2e22), 1.42, 1.0, 0.08, 0, 0.94, -0.02, { outline: 0.004 });
  const board = addPlane(
    g,
    texturedGlow(makeNoticeboardTexture(), 0.9),
    1.34, 0.92,
    0, 0.94, 0.03
  );
  board.renderOrder = 4;
  // little rain hood
  const hood = addBox(g, toon(0x34434b), 1.55, 0.05, 0.28, 0, 1.6, 0.08, { outline: 0.003 });
  hood.rotation.x = -0.16;
  addFakeLightPool(root, -4.16, 1.25, 1.1, 0x97b9d9, 0.07, WALK + 0.012);
}

/* ------------------------------------------------------------------ *
 *  Street lamp
 * ------------------------------------------------------------------ */

function buildStreetLamp(root, world) {
  const g = new THREE.Group();
  g.position.set(-2.78, WALK, 2.78);
  root.add(g);
  const iron = toon(0x3b464f);
  addCylinder(g, iron, 0.18, 0.22, 0.24, 12, 0, 0.12, 0, { outline: 0.006 });
  addCylinder(g, iron, 0.055, 0.075, 4.05, 10, 0, 2.15, 0, { outline: 0.005 });
  addCylinder(g, iron, 0.11, 0.14, 0.16, 12, 0, 0.33, 0, { outline: 0.004 });

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 4.14, 0),
    new THREE.Vector3(0, 4.47, 0.28),
    new THREE.Vector3(0, 4.52, 0.7),
    new THREE.Vector3(0, 4.3, 1.0),
  ]);
  const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.038, 6, false), iron);
  arm.castShadow = true;
  g.add(arm);
  addOutline(arm, 0.004);

  const head = new THREE.Group();
  head.position.set(0, 4.22, 1.04);
  g.add(head);
  addCylinder(head, iron, 0.16, 0.22, 0.16, 12, 0, 0.06, 0, { outline: 0.004 });
  addCylinder(head, toon(0xa6b0b8), 0.21, 0.16, 0.08, 12, 0, -0.02, 0, { cast: false });
  addCylinder(head, glow(0xfff0c4, 2.4, { toneMapped: false }), 0.16, 0.16, 0.025, 16, 0, -0.075, 0, { cast: false });

  const glowTex = makeRadialGlowTexture('rgba(255,220,160,0.85)', 'rgba(255,220,160,0)');
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffd39c,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
  );
  halo.scale.set(2.2, 2.2, 1);
  halo.position.set(0, 4.15, 1.05);
  g.add(halo);

  const coneTex = makeConeTexture();
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(2.15, 4.0, 20, 1, true),
    new THREE.MeshBasicMaterial({
      map: coneTex,
      color: 0xffd49a,
      transparent: true,
      opacity: 0.055,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
  );
  cone.position.set(0, 2.15, 1.05);
  cone.renderOrder = 4;
  g.add(cone);

  const light = new THREE.PointLight(0xffc98e, 18, 10, 1.8);
  light.position.set(0, 4.05, 1.05);
  light.castShadow = false;
  g.add(light);

  addFakeLightPool(root, -2.78, 3.75, 2.9, 0xffc586, 0.24, LAYOUT.roadY + 0.02);
  addFakeLightPool(root, -2.78, 1.9, 1.8, 0xffd7a1, 0.12, WALK + 0.012);

  // faint rain hazing around the lamp
  world.updatables.push({
    update(dt, elapsed) {
      halo.material.opacity = 0.32 + Math.sin(elapsed * 2.3) * 0.02;
      light.intensity = 18 + Math.sin(elapsed * 1.7) * 0.25;
    },
  });
}

/* ------------------------------------------------------------------ *
 *  Utility pole + wires
 * ------------------------------------------------------------------ */

function createWire(parent, a, b, sag, material, radius = 0.013) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const geo = new THREE.TubeGeometry(curve, 28, radius, 4, false);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function buildUtilityPole(root, world) {
  const g = new THREE.Group();
  g.position.set(-4.86, WALK, 2.4);
  root.add(g);
  const concrete = toon(0x8a8f94);
  const dark = toon(0x3b434b);
  const metal = toon(0x767f86);

  addCylinder(g, toon(0x50575c), 0.22, 0.3, 0.18, 12, 0, 0.09, 0, { outline: 0.006 });
  addCylinder(g, concrete, 0.11, 0.17, 7.2, 12, 0, 3.75, 0, { outline: 0.006 });
  // pole bands
  for (let i = 0; i < 5; i++) {
    addCylinder(g, toon(0x6e7479), 0.115, 0.115, 0.035, 12, 0, 1.4 + i * 1.1, 0, { cast: false });
  }
  // transformer
  addCylinder(g, metal, 0.27, 0.27, 0.72, 14, 0, 4.9, 0, { outline: 0.006 });
  addCylinder(g, dark, 0.29, 0.29, 0.08, 14, 0, 4.53, 0, { cast: false });
  addCylinder(g, dark, 0.29, 0.29, 0.08, 14, 0, 5.27, 0, { cast: false });
  addBox(g, dark, 0.1, 0.48, 0.42, 0.26, 4.9, 0, { cast: false });
  // crossarms
  addBox(g, dark, 2.1, 0.08, 0.1, 0, 6.42, 0, { outline: 0.004 });
  addBox(g, dark, 1.5, 0.07, 0.08, 0, 6.9, 0, { outline: 0.003 });
  const insulatorPositions = [
    [-0.9, 6.5, 0], [0.9, 6.5, 0], [-0.6, 6.98, 0], [0.3, 6.98, 0], [0.8, 6.98, 0],
  ];
  insulatorPositions.forEach(([x, y, z]) => {
    addCylinder(g, toon(0xd4d8d4), 0.055, 0.05, 0.16, 8, x, y, z, { cast: false });
    addCylinder(g, toon(0x7a817f), 0.08, 0.08, 0.03, 8, x, y - 0.075, z, { cast: false });
  });
  // service boxes + ladder rungs
  addBox(g, toon(0x656d72), 0.32, 0.5, 0.22, 0, 2.5, 0.17, { outline: 0.004 });
  addBox(g, toon(0x4f585e), 0.25, 0.35, 0.2, 0.25, 3.2, 0, { outline: 0.004 });
  for (let i = 0; i < 10; i++) {
    addBox(g, toon(0x5b6268), 0.04, 0.025, 0.3, 0, 1.2 + i * 0.45, 0.2, { cast: false });
  }
  // pole number plate
  addBox(g, glow(0xe9e5d8, 0.42), 0.3, 0.18, 0.02, 0, 2.9, 0.195, { cast: false });

  // street name sign + stop sign
  const streetSign = addPlane(
    g,
    texturedGlow(makeStreetSignTexture('street'), 0.9, { transparent: true, depthWrite: false }),
    1.35, 1.35,
    0, 3.63, 0.21
  );
  streetSign.renderOrder = 4;
  addBox(g, dark, 0.05, 0.05, 0.1, -0.35, 3.63, 0.16, { cast: false });
  addBox(g, dark, 0.05, 0.05, 0.1, 0.35, 3.63, 0.16, { cast: false });
  const stopSign = addPlane(
    g,
    texturedGlow(makeStreetSignTexture('stop'), 0.92, { transparent: true, depthWrite: false }),
    0.86, 0.86,
    0, 2.04, 0.2
  );
  stopSign.renderOrder = 4;
  addBox(g, dark, 0.06, 0.06, 0.08, 0, 2.5, 0.16, { cast: false });

  // wires: all anchoring on the miniature so the model remains self-contained
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x0a0e16, toneMapped: false });
  const wireRoot = new THREE.Group();
  wireRoot.name = 'overhead-wires';
  root.add(wireRoot);
  const topA = new THREE.Vector3(-4.86 - 0.9, WALK + 6.58, 2.4);
  const topB = new THREE.Vector3(-4.86 + 0.9, WALK + 6.58, 2.4);
  const highA = new THREE.Vector3(-5.15, WALK + 7.52, 2.4);
  const storeAntenna = new THREE.Vector3(5.9, WALK + 5.5, -2.6);
  const storeAnchor2 = new THREE.Vector3(6.55, WALK + 4.04, -1.95);
  const aptAnchor = new THREE.Vector3(-5.3, WALK + 6.24, -2.85);
  const aptAnchor2 = new THREE.Vector3(-8.2, WALK + 6.18, -2.9);
  const backAnchor = new THREE.Vector3(-1.9, WALK + 6.3, -8.95);
  const backAnchor2 = new THREE.Vector3(3.6, WALK + 7.4, -9.2);
  createWire(wireRoot, topA, storeAntenna, 1.5, wireMat);
  createWire(wireRoot, topA.clone().add(new THREE.Vector3(0, 0.12, 0)), storeAnchor2, 1.0, wireMat, 0.011);
  createWire(wireRoot, topB, aptAnchor, 0.5, wireMat);
  createWire(wireRoot, topB, aptAnchor2, 0.8, wireMat, 0.011);
  createWire(wireRoot, highA, backAnchor, 1.3, wireMat, 0.012);
  createWire(wireRoot, highA, backAnchor2, 1.8, wireMat, 0.012);
  createWire(wireRoot, topA, storeAnchor2, 0.72, wireMat, 0.01);
  // a service drop curving down to the shop's alley wall
  createWire(wireRoot, topB, new THREE.Vector3(-2.42, WALK + 4.2, -1.95), 0.45, wireMat, 0.009);

  world.wireGroup = wireRoot;
}

function buildPylonSign(root, world) {
  const g = new THREE.Group();
  g.position.set(LAYOUT.pylon.x, 0.04, LAYOUT.pylon.z);
  g.name = 'pylon-sign';
  root.add(g);

  const dark = toon(0x26323c);
  addBox(g, toon(0x4d575e), 0.7, 0.12, 0.7, 0, 0.06, 0, { outline: 0.005 });
  addBox(g, dark, 0.18, 3.2, 0.18, 0, 1.72, 0, { outline: 0.005 });
  addBox(g, dark, 1.02, 2.5, 0.28, 0, 4.5, 0, { outline: 0.008 });
  addBox(g, toon(0x0b1c2e), 0.96, 2.42, 0.1, 0, 4.5, 0.13, { cast: false });

  const tex = makePylonTexture();
  const signMat = texturedGlow(tex, 0.96, { toneMapped: false });
  const front = addPlane(g, signMat, 0.9, 2.36, 0, 4.5, 0.185);
  front.renderOrder = 4;
  const back = addPlane(
    g,
    texturedGlow(tex, 0.9, { toneMapped: false }),
    0.9, 2.36,
    0, 4.5, -0.185,
    { rotation: [0, Math.PI, 0] }
  );
  back.renderOrder = 4;
  // mint + coral edge lights
  addBox(g, glow(0x61f0c6, 1.1), 0.06, 2.32, 0.03, -0.47, 4.5, 0.17, { cast: false });
  addBox(g, glow(0xff9a67, 1.1), 0.06, 2.32, 0.03, 0.47, 4.5, 0.17, { cast: false });
  // top cap + support braces
  addBox(g, toon(0x56626a), 1.08, 0.1, 0.34, 0, 5.8, 0, { outline: 0.005 });
  const braceMat = toon(0x3d474f);
  tubeBetween(g, new THREE.Vector3(0, 1.2, -0.06), new THREE.Vector3(0, 3.3, -0.3), 0.035, braceMat);
  tubeBetween(g, new THREE.Vector3(0, 3.3, 0.35), new THREE.Vector3(0, 1.25, 0.08), 0.028, braceMat);

  const light = new THREE.PointLight(0xa8ffe4, 10, 6, 1.8);
  light.position.set(0, 4.35, 0.7);
  g.add(light);

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeRadialGlowTexture('rgba(150,255,226,0.6)', 'rgba(150,255,226,0)'),
      color: 0x9fffe4,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
  );
  halo.position.set(0, 4.5, 0.35);
  halo.scale.set(3.0, 4.6, 1);
  g.add(halo);

  let timer = 5;
  let value = 1;
  world.updatables.push({
    update(dt, elapsed) {
      timer -= dt;
      if (timer <= 0) {
        timer = 0.05 + Math.random() * 0.16;
        const r = Math.random();
        if (r < 0.09) value = 0.34;
        else if (r < 0.18) value = 1.18;
        else value = 1;
      }
      const breath = 1 + Math.sin(elapsed * 1.4) * 0.012;
      signMat.color.setScalar(0.96 * value * breath);
      light.intensity = 6 * (0.55 + value * 0.45);
      halo.material.opacity = 0.22 * (0.5 + value * 0.5);
    },
  });
}

/* ------------------------------------------------------------------ *
 *  Guardrail, parking sign, traffic signal
 * ------------------------------------------------------------------ */

function buildGuardrail(root) {
  const g = new THREE.Group();
  root.add(g);
  const white = toon(0xd7dde0);
  const capMat = toon(0xaeb6bb);
  addBox(g, toon(0x535c63), 0.6, 0.04, 0.3, -4.7, WALK + 0.02, 3.0, { cast: false });

  // rail along the front kerb
  const xs = [-4.55, -3.65, -2.75, -1.85, -1.15];
  xs.forEach((x) => {
    addCylinder(g, white, 0.035, 0.035, 0.78, 8, x, WALK + 0.39, 3.02, { outline: 0.004 });
    addCylinder(g, capMat, 0.05, 0.05, 0.03, 8, x, WALK + 0.79, 3.02, { cast: false });
  });
  addCylinder(g, white, 0.028, 0.028, 3.42, 8, -2.85, WALK + 0.67, 3.02, {
    rotation: [0, 0, Math.PI / 2],
    outline: 0.003,
  });
  addCylinder(g, white, 0.025, 0.025, 3.42, 8, -2.85, WALK + 0.45, 3.02, {
    rotation: [0, 0, Math.PI / 2],
    outline: 0.003,
  });

  // rail wrapping the side-street corner
  const zs = [-1.3, -0.4, 0.5, 1.4, 2.3, 3.0];
  zs.forEach((z) => {
    addCylinder(g, white, 0.035, 0.035, 0.78, 8, -4.67, WALK + 0.39, z, { outline: 0.004 });
    addCylinder(g, capMat, 0.05, 0.05, 0.03, 8, -4.67, WALK + 0.79, z, { cast: false });
  });
  addCylinder(g, white, 0.028, 0.028, 4.3, 8, -4.67, WALK + 0.67, 0.85, {
    rotation: [Math.PI / 2, 0, 0],
    outline: 0.003,
  });
  addCylinder(g, white, 0.025, 0.025, 4.3, 8, -4.67, WALK + 0.45, 0.85, {
    rotation: [Math.PI / 2, 0, 0],
    outline: 0.003,
  });
  // corner post tie
  addCylinder(g, capMat, 0.055, 0.055, 0.86, 8, -4.6, WALK + 0.43, 2.98, { outline: 0.004 });
}

function buildParkingSign(root) {
  const g = new THREE.Group();
  g.position.set(8.95, WALK, 0.52);
  root.add(g);
  addCylinder(g, toon(0x8d969d), 0.035, 0.045, 2.05, 8, 0, 1.02, 0, { outline: 0.004 });
  const sign = addPlane(
    g,
    texturedGlow(makeStreetSignTexture('parking'), 0.92, { transparent: true, depthWrite: false }),
    0.68, 0.68,
    0, 1.88, 0.05
  );
  sign.renderOrder = 4;
  addBox(g, toon(0x727b82), 0.06, 0.06, 0.08, 0, 1.88, 0.01, { cast: false });
}

function buildTrafficSignal(root, world) {
  const g = new THREE.Group();
  g.position.set(-9.15, 0, 5.9);
  g.scale.setScalar(0.8);
  root.add(g);
  const dark = toon(0x3e474e);
  // corner island under the signal
  addBox(g, toon(0x59636b), 1.2, 0.12, 1.2, 0.18, 0.06, -0.12, { outline: 0.004 });
  addBox(g, toon(0x7f8890), 1.2, 0.03, 0.1, 0.18, 0.13, -0.68, { cast: false });
  addCylinder(g, toon(0x666f75), 0.34, 0.4, 0.14, 12, 0, 0.22, 0, { outline: 0.004 });
  addCylinder(g, dark, 0.09, 0.11, 4.1, 10, 0, 2.22, 0, { outline: 0.004 });
  addCylinder(g, toon(0x2e373e), 0.16, 0.2, 0.15, 10, 0, 0.29, 0, { cast: false });
  addBox(g, dark, 0.12, 0.12, 1.1, 0, 3.95, -0.5, { outline: 0.003 });
  addBox(g, toon(0x202b31), 1.0, 0.31, 0.24, 0, 3.95, -0.98, { outline: 0.006 });

  const lensData = [
    { color: 0xff5f5f, x: -0.33 },
    { color: 0xffc95c, x: 0 },
    { color: 0x5ff2c0, x: 0.33 },
  ];
  const lenses = lensData.map((l) => {
    const mat = new THREE.MeshBasicMaterial({ color: 0x1c2226, toneMapped: false });
    const mesh = addCylinder(g, mat, 0.105, 0.105, 0.035, 16, l.x, 3.95, -0.845, {
      rotation: [Math.PI / 2, 0, 0],
      cast: false,
    });
    addBox(g, dark, 0.24, 0.035, 0.22, l.x, 4.02, -0.88, { rotation: [-0.2, 0, 0], cast: false });
    return { mesh, mat, color: new THREE.Color(l.color) };
  });

  const signalLight = new THREE.PointLight(0xff6262, 2.6, 4.5, 1.8);
  signalLight.position.set(0, 3.9, -0.6);
  g.add(signalLight);

  world.updatables.push({
    update(dt, elapsed) {
      const t = elapsed % 20;
      let active = 2;
      let color = 0x5ff2c0;
      if (t > 8) {
        active = 0;
        color = 0xff5f5f;
      } else if (t > 6.8) {
        active = 1;
        color = 0xffc95c;
      }
      lenses.forEach((lens, i) => {
        const on = i === active;
        if (on) {
          lens.mat.color.copy(lens.color).multiplyScalar(1.3);
        } else {
          lens.mat.color.setHex(0x1c2226);
        }
      });
      signalLight.color.setHex(color);
      signalLight.intensity = 2.2 + (active === 1 ? Math.sin(elapsed * 8) * 0.3 : 0);
      world.trafficReflection.color.setHex(color);
    },
  });
}

/* ------------------------------------------------------------------ *
 *  Apartment block
 * ------------------------------------------------------------------ */

function buildApartment(root, world) {
  const A = LAYOUT.apartment;
  const w = A.x1 - A.x0;
  const d = A.z1 - A.z0;
  const cx = (A.x0 + A.x1) / 2;
  const cz = (A.z0 + A.z1) / 2;
  const g = new THREE.Group();
  g.name = 'apartment';
  root.add(g);

  const wallTex = makeApartmentWallTexture();
  const wallMat = toon(0xffffff, { map: wallTex });
  const roofMat = toon(0x555f68);
  const frameMat = toon(0x2b353d);
  const shutterTex = makeShutterTexture();

  addBox(g, wallMat, w, 6.1, d, cx, WALK + 3.05, cz, {
    outline: 0.018,
    receive: true,
  });
  addBox(g, roofMat, w + 0.2, 0.18, d + 0.2, cx, 6.25 + 0.09, cz, { outline: 0.01 });
  // parapet
  addBox(g, toon(0x7b858c), w + 0.2, 0.32, 0.1, cx, 6.5, A.z1 - 0.05, { outline: 0.005 });
  addBox(g, toon(0x7b858c), w + 0.2, 0.32, 0.1, cx, 6.5, A.z0 + 0.05, { outline: 0.005 });
  addBox(g, toon(0x7b858c), 0.1, 0.32, d + 0.2, A.x0 + 0.05, 6.5, cz, { outline: 0.005 });
  addBox(g, toon(0x7b858c), 0.1, 0.32, d + 0.2, A.x1 - 0.05, 6.5, cz, { outline: 0.005 });

  // windows facing the little side street
  const litWindows = [
    [-7.95, 2.45, true, 0xffd59a],
    [-6.85, 2.45, false, 0x91b6db],
    [-5.75, 2.45, true, 0xffc17e],
    [-7.95, 4.35, false, 0x8fb3d6],
    [-6.85, 4.35, true, 0xffd89e],
    [-5.75, 4.35, true, 0xffc079],
  ];
  litWindows.forEach(([x, y, lit, color]) => {
    addBox(g, frameMat, 1.04, 1.13, 0.1, x, y, A.z1 + 0.02, { outline: 0.004 });
    const tex = makeWindowGlowTexture(
      lit
        ? `rgba(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255},0.95)`
        : 'rgba(30,49,67,0.9)'
    );
    const pane = addPlane(
      g,
      lit
        ? texturedGlow(tex, 0.8)
        : toon(0x233141, { map: tex }),
      0.9, 0.98,
      x, y, A.z1 + 0.075
    );
    pane.renderOrder = lit ? 3 : 0;
    // curtains
    if (lit && (x === -6.85 || x === -5.75)) {
      addPlane(g, toon(0xecd8b1), 0.33, 0.9, x - 0.22, y, A.z1 + 0.083);
    }
  });

  // balcony
  addBox(g, toon(0x6e777c), 3.7, 0.12, 0.72, -6.85, 3.06, A.z1 + 0.3, { outline: 0.006 });
  for (let i = 0; i <= 10; i++) {
    addBox(g, toon(0x727d84), 0.035, 0.65, 0.035, -8.6 + i * 0.35, 3.44, A.z1 + 0.64, { cast: false });
  }
  addBox(g, toon(0x79838a), 3.7, 0.04, 0.04, -6.85, 3.77, A.z1 + 0.64, { cast: false });
  addBox(g, toon(0x79838a), 3.7, 0.04, 0.04, -6.85, 3.12, A.z1 + 0.64, { cast: false });
  // laundry pole + towel
  addCylinder(g, toon(0x9ca5a9), 0.022, 0.022, 0.75, 6, -8.22, 3.95, A.z1 + 0.45, { rotation: [0, 0, Math.PI / 2], cast: false });
  addBox(g, toon(0xd4dbe0), 0.44, 0.66, 0.018, -8.25, 3.64, A.z1 + 0.45, { cast: false });
  // balcony pot
  addCylinder(g, toon(0x9b6d4d), 0.13, 0.1, 0.2, 8, -5.68, 3.18, A.z1 + 0.55, { outline: 0.003 });
  addSphere(g, toon(0x3f6e4c), 0.18, -5.68, 3.38, A.z1 + 0.55, 8);
  addCylinder(g, toon(0x8d7870), 0.02, 0.02, 1.1, 5, -8.1, 3.55, A.z1 + 0.52, { cast: false });

  // ground floor: shuttered shop + doorway
  addBox(g, toon(0x343d45), 2.3, 2.25, 0.12, -7.25, 1.3, A.z1 + 0.05, { outline: 0.005 });
  addPlane(
    g,
    toon(0xffffff, { map: shutterTex }),
    2.12, 2.06,
    -7.25, 1.3, A.z1 + 0.125
  );
  const tobaccoTex = makeNeonSignTexture('たばこ', '#ffb46b', false);
  const tobacco = addPlane(g, texturedGlow(tobaccoTex, 1.15, { transparent: true }), 0.96, 0.3, -7.25, 2.65, A.z1 + 0.15);
  tobacco.renderOrder = 4;
  const tobaccoLight = new THREE.PointLight(0xffb46b, 4, 3.5, 1.8);
  tobaccoLight.position.set(-7.25, 2.5, A.z1 + 0.5);
  g.add(tobaccoLight);
  // small lit doorway
  addBox(g, frameMat, 0.85, 2.0, 0.12, -5.65, 1.15, A.z1 + 0.06, { outline: 0.004 });
  addPlane(g, glow(0xffdca8, 0.36), 0.63, 1.7, -5.65, 1.15, A.z1 + 0.13);
  addBox(g, toon(0x38434b), 0.55, 0.34, 0.1, -5.65, 2.55, A.z1 + 0.15, { outline: 0.003 });
  addBox(g, glow(0xfff0c9, 0.85), 0.22, 0.05, 0.03, -5.65, 2.45, A.z1 + 0.22, { cast: false });
  // vertical pink neon on the facade corner
  const neonTex = makeNeonSignTexture('スナック星', '#ff8fbb', true);
  const neon = addPlane(g, texturedGlow(neonTex, 1.1, { transparent: true }), 0.5, 1.5, -4.98, 4.7, A.z1 + 0.16);
  neon.renderOrder = 4;
  const neonLight = new THREE.PointLight(0xff8fbb, 5, 4, 1.8);
  neonLight.position.set(-4.9, 4.6, A.z1 + 0.8);
  g.add(neonLight);
  world.updatables.push({
    update(dt, elapsed) {
      const f = Math.sin(elapsed * 7.3) > 0.97 ? 0.4 : 1;
      neonLight.intensity = 4.2 * f;
    },
  });

  // alley-facing side (visible through the gap)
  addBox(g, frameMat, 1.0, 1.15, 0.08, -4.74, 2.0, -5.75, {
    rotation: [0, Math.PI / 2, 0],
    outline: 0.004,
  });
  addPlane(
    g,
    glow(0xffd59a, 0.28),
    0.8, 0.9,
    -4.69, 2.0, -5.75,
    { rotation: [0, Math.PI / 2, 0] }
  );
  addCylinder(g, toon(0x646d73), 0.08, 0.08, 5.6, 8, -4.7, 3.1, -4.9, { outline: 0.003 });
  addCylinder(g, toon(0x646d73), 0.065, 0.065, 4.0, 8, -4.66, 2.2, -7.4, { outline: 0.003 });
  // back door in the alley
  addBox(g, toon(0x38434a), 0.08, 1.95, 0.85, -4.74, 1.1, -7.05, {
    rotation: [0, Math.PI / 2, 0],
    outline: 0.004,
  });
  addBox(g, frameMat, 0.05, 0.23, 1.05, -4.72, 2.22, -7.05, { rotation: [0, Math.PI / 2, 0], cast: false });
  addCylinder(g, glow(0xffe0ae, 1.5), 0.075, 0.075, 0.03, 10, -4.6, 2.34, -7.05, {
    rotation: [0, 0, Math.PI / 2],
    cast: false,
  });
  const alleyDoorLight = new THREE.PointLight(0xffc98c, 5, 3.2, 1.8);
  alleyDoorLight.position.set(-4.4, 2.2, -7.05);
  g.add(alleyDoorLight);
  // pipes / AC
  buildACUnit(g, -4.62, 0.95, -4.2, -Math.PI / 2);
  buildACUnit(g, -4.62, 3.5, -6.25, -Math.PI / 2);

  // roof clutter
  addCylinder(g, toon(0x76818a), 0.48, 0.48, 1.0, 16, -7.6, 6.83, -6.7, { outline: 0.008 });
  addCylinder(g, toon(0x69747c), 0.5, 0.5, 0.08, 16, -7.6, 7.36, -6.7, { cast: false });
  for (let i = 0; i < 4; i++) {
    addCylinder(g, toon(0x59646c), 0.035, 0.035, 0.4, 6, -7.95 + i * 0.23, 6.4, -6.7, { cast: false });
  }
  addBox(g, toon(0x7c868d), 0.9, 0.42, 0.55, -5.8, 6.55, -7.6, { outline: 0.004 });
  addCylinder(g, toon(0x2f3940), 0.018, 0.018, 2.2, 6, -5.2, 7.3, -7.0, { outline: 0.002 });
  addBox(g, toon(0x2f3940), 1.0, 0.02, 0.02, -5.2, 8.1, -7.0, { cast: false });
  addSphere(g, glow(0xff6060, 0.75), 0.032, -5.2, 8.42, -7.0, 8);
}

function buildACUnit(parent, x, y, z, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  parent.add(g);
  addBox(g, toon(0xa9afb1), 0.55, 0.55, 0.42, 0, 0, 0, { outline: 0.005 });
  addCylinder(g, toon(0x3e484e), 0.17, 0.17, 0.025, 16, 0, 0, 0.215, {
    rotation: [Math.PI / 2, 0, 0],
    cast: false,
  });
  addCylinder(g, toon(0xc2c8c8), 0.13, 0.13, 0.03, 16, 0, 0, 0.225, {
    rotation: [Math.PI / 2, 0, 0],
    cast: false,
  });
  for (let i = 0; i < 3; i++) {
    const bar = addBox(g, toon(0x707a80), 0.24, 0.02, 0.01, 0, 0, 0.24);
    bar.rotation.z = (i / 3) * Math.PI;
  }
  addBox(g, toon(0x6d767b), 0.06, 0.08, 0.5, 0, -0.3, 0, { cast: false });
  return g;
}

/* ------------------------------------------------------------------ *
 *  Backdrop buildings
 * ------------------------------------------------------------------ */

function buildBackdrop(root, world) {
  const g = new THREE.Group();
  g.name = 'backdrop-buildings';
  root.add(g);
  const darkWalls = [0x303b4b, 0x394457, 0x2c3645, 0x3b4451];
  const buildings = [
    { x0: -9.8, x1: -5.2, h: 8.3, z0: -9.85, z1: -8.42 },
    { x0: -4.7, x1: -1.7, h: 6.4, z0: -9.7, z1: -8.45 },
    { x0: 0.2, x1: 4.4, h: 7.5, z0: -9.8, z1: -8.45 },
    { x0: 5.2, x1: 9.5, h: 6.2, z0: -9.75, z1: -8.45 },
  ];
  const windows = [];
  buildings.forEach((b, index) => {
    const cx = (b.x0 + b.x1) / 2;
    const cz = (b.z0 + b.z1) / 2;
    const mat = toon(darkWalls[index % darkWalls.length]);
    addBox(g, mat, b.x1 - b.x0, b.h, b.z1 - b.z0, cx, b.h / 2, cz, {
      outline: 0.016,
      receive: true,
      cast: true,
    });
    addBox(g, toon(0x222a34), b.x1 - b.x0 + 0.1, 0.18, b.z1 - b.z0 + 0.1, cx, b.h + 0.09, cz, {
      outline: 0.008,
    });
    // windows
    const cols = Math.max(2, Math.floor((b.x1 - b.x0) / 0.8));
    const floors = Math.max(2, Math.floor((b.h - 1.2) / 1.0));
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const lit = Math.random() > 0.62;
        const warm = Math.random() > 0.42;
        windows.push({
          x: b.x0 + 0.55 + c * ((b.x1 - b.x0 - 1.1) / Math.max(1, cols - 1)),
          y: 1.3 + f * 0.95,
          z: b.z1 + 0.012,
          color: lit
            ? new THREE.Color(warm ? 0xffcf91 : 0x9dc7f1).multiplyScalar(1.15)
            : new THREE.Color(0x182330),
          w: 0.34,
          h: 0.5,
        });
      }
    }
    // rooftop extras
    addBox(g, toon(0x77828a), 1.0, 0.6, 0.7, cx - 0.5, b.h + 0.4, cz, { outline: 0.005 });
    addCylinder(g, toon(0x4e5860), 0.02, 0.02, 2.2, 5, b.x0 + 0.8, b.h + 1.2, cz, { cast: false });
    addBox(g, toon(0x4e5860), 0.9, 0.02, 0.02, b.x0 + 0.8, b.h + 1.95, cz, { cast: false });
    if (index === 0) {
      addBox(g, glow(0xff9f93, 0.85), 0.5, 0.24, 0.03, cx + 0.7, b.h + 1.2, b.z1 + 0.02, { cast: false });
    }
  });

  // window instancing
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0, 0);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, side: THREE.DoubleSide });
  const inst = new THREE.InstancedMesh(geo, mat, windows.length);
  const dummy = new THREE.Object3D();
  windows.forEach((win, i) => {
    dummy.position.set(win.x, win.y, win.z);
    dummy.scale.set(win.w, win.h, 1);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
    inst.setColorAt(i, win.color);
  });
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  g.add(inst);

  // distant red aircraft beacon
  const beaconMat = glow(0xff5555, 1.2, { toneMapped: false });
  const beacon = addSphere(g, beaconMat, 0.06, -8.2, 8.65, -9.0, 8);
  world.updatables.push({
    update(dt, elapsed) {
      const on = Math.sin(elapsed * 2.1) > 0.35;
      beaconMat.color.setRGB(on ? 1.7 : 0.12, on ? 0.22 : 0.02, on ? 0.2 : 0.02);
    },
  });

  world.backdrop = g;
}

/* ------------------------------------------------------------------ *
 *  Tree + alley clutter + service door
 * ------------------------------------------------------------------ */

function buildTree(root) {
  // Low planters instead of a large street tree — the old shutter stays readable.
  const g = new THREE.Group();
  g.name = 'doorway-planters';
  root.add(g);
  const potMat = toon(0x7b5944);
  const potRim = toon(0x937055);
  const soilMat = toon(0x2d241d);
  const leafMats = [toon(0x315e49), toon(0x3d7254), toon(0x284f40)];
  const flowerMats = [toon(0xeab0c2), toon(0xf3dfb0)];

  // long planter beside the old shop door
  addBox(g, potMat, 0.7, 0.3, 0.34, -6.3, WALK + 0.15, -2.6, { outline: 0.004 });
  addBox(g, potRim, 0.73, 0.045, 0.37, -6.3, WALK + 0.29, -2.6, { cast: false });
  addBox(g, soilMat, 0.62, 0.02, 0.27, -6.3, WALK + 0.315, -2.6, { cast: false });
  const bushPositions = [
    [-6.5, 0.52, -2.6, 0.22], [-6.28, 0.6, -2.59, 0.25], [-6.08, 0.5, -2.61, 0.19],
  ];
  bushPositions.forEach(([x, y, z, r], i) => {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leafMats[i % leafMats.length]);
    bush.position.set(x, WALK + y, z);
    bush.scale.set(1.15, 0.8, 0.95);
    bush.castShadow = true;
    bush.receiveShadow = true;
    addOutline(bush, 0.008);
    g.add(bush);
  });
  [[-6.45, 0.61, -2.5], [-6.18, 0.68, -2.47], [-6.02, 0.57, -2.53]].forEach(([x, y, z], i) => {
    addSphere(g, flowerMats[i % 2], 0.028, x, WALK + y, z, 6);
  });

  // slim potted evergreen on the other side of the doorway
  addCylinder(g, potMat, 0.16, 0.13, 0.31, 10, -5.03, WALK + 0.155, -2.59, { outline: 0.003 });
  addCylinder(g, potRim, 0.18, 0.17, 0.045, 10, -5.03, WALK + 0.31, -2.59, { cast: false });
  addBox(g, soilMat, 0.24, 0.02, 0.24, -5.03, WALK + 0.335, -2.59, { cast: false });
  addCylinder(g, toon(0x4d3c2c), 0.025, 0.035, 0.6, 6, -5.03, WALK + 0.63, -2.59, { cast: false });
  const coneMats = [toon(0x2b5742), toon(0x35694e)];
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.3 - i * 0.055, 0.52, 8),
      coneMats[i % 2]
    );
    cone.position.set(-5.03, WALK + 0.72 + i * 0.23, -2.59);
    cone.castShadow = true;
    cone.receiveShadow = true;
    addOutline(cone, 0.006);
    g.add(cone);
  }
  addSphere(g, toon(0x9cbf84), 0.14, -5.03, WALK + 1.38, -2.59, 7);
}

function buildAlleyClutter(root, world) {
  const g = new THREE.Group();
  g.name = 'alley-clutter';
  root.add(g);

  // store service door on the alley wall
  const steel = toon(0x4b565d);
  addBox(g, steel, 0.08, 2.0, 0.95, LAYOUT.store.x0 - 0.04, 1.15, -6.4, { outline: 0.005 });
  addBox(g, toon(0x2d363c), 0.04, 0.38, 0.56, LAYOUT.store.x0 - 0.1, 1.55, -6.4, { cast: false });
  addCylinder(g, toon(0xb5bec3), 0.018, 0.018, 0.22, 6, LAYOUT.store.x0 - 0.11, 1.05, -6.15, {
    rotation: [Math.PI / 2, 0, 0],
    cast: false,
  });
  addBox(g, glow(0xffe0b0, 0.55), 0.03, 0.12, 0.62, LAYOUT.store.x0 - 0.095, 2.48, -6.4, { cast: false });
  addSphere(g, glow(0xfff0c8, 1.2), 0.06, LAYOUT.store.x0 - 0.16, 2.38, -6.4, 8);

  // wall lamp with warm pool
  const lamp = new THREE.PointLight(0xffc98d, 7, 4.5, 1.8);
  lamp.position.set(-3.3, 2.2, -6.35);
  g.add(lamp);

  // crates and bottles
  const crateMats = [toon(0xb4763c), toon(0x8a4a3c), toon(0x4c6a73)];
  for (let i = 0; i < 3; i++) {
    const c = addBox(g, crateMats[i % 3], 0.48, 0.3, 0.36, -3.15 + i * 0.05, WALK + 0.15 + i * 0.3, -7.25, {
      outline: 0.004,
    });
    c.rotation.y = i * 0.08;
    for (let k = 0; k < 3; k++) {
      addBox(g, toon(0x2a1c14), 0.25, 0.18, 0.02, -3.15 + i * 0.05, WALK + 0.16 + i * 0.3, -7.06, { cast: false });
    }
  }
  addCylinder(g, toon(0x6d7d80), 0.15, 0.13, 0.3, 10, -4.2, WALK + 0.15, -3.4, { outline: 0.003 });
  addCylinder(g, toon(0x536264), 0.025, 0.025, 0.9, 6, -4.2, WALK + 0.55, -3.4, { cast: false });

  // the alley dead-ends against a weathered back wall
  addBox(g, toon(0x4a4d50), 2.4, 4.2, 0.16, -3.6, 2.25, -8.02, { outline: 0.01 });
  addBox(g, toon(0x32383d), 0.9, 2.0, 0.07, -3.25, 1.15, -7.92, { outline: 0.004 });
  addBox(g, glow(0xffd6a2, 0.5), 0.62, 1.65, 0.01, -3.25, 1.15, -7.88, { cast: false });
  addBox(g, toon(0x56595a), 0.02, 2.6, 0.24, -4.4, 1.6, -7.96, { cast: false });
  addBox(g, toon(0x2d3134), 2.0, 0.1, 0.32, -3.6, 4.28, -7.93, { cast: false });

  // little warm sign at the alley end
  const barMat = new THREE.MeshBasicMaterial({
    map: makeNeonSignTexture('BAR 星', '#ff86a8', false),
    transparent: true,
    toneMapped: false,
  });
  const barSign = addPlane(g, barMat, 0.82, 0.28, -3.65, 2.35, -7.905);
  barSign.renderOrder = 4;
  const barLight = new THREE.PointLight(0xff86a8, 5, 4, 1.8);
  barLight.position.set(-3.6, 1.9, -7.5);
  g.add(barLight);
  world.updatables.push({
    update(dt, elapsed) {
      const flick = Math.sin(elapsed * 9.1) > 0.96 ? 0.25 : 1;
      barLight.intensity = 4 * flick;
    },
  });

  // a small "路地" sign at the alley mouth
  addBox(g, toon(0x3b4a50), 0.06, 0.8, 0.06, -4.7, 2.0, -1.72, { outline: 0.003 });
  const roji = addPlane(
    g,
    texturedGlow(
      makeCanvasTexture(256, 512, (ctx, w, h) => {
        ctx.fillStyle = '#f0e6d0';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#283a45';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = japaneseFont(92, 800);
        ['路', '地', '入', '口'].forEach((ch, i) => ctx.fillText(ch, w / 2, 100 + i * 108));
      }),
      0.7
    ),
    0.28, 0.66, -4.66, 2.35, -1.68, { rotation: [0, 0.12, 0] }
  );
}

/* ------------------------------------------------------------------ *
 *  Small extra props
 * ------------------------------------------------------------------ */

function buildSmallProps(root) {
  // traffic cone by the parking bay
  const cone = new THREE.Group();
  cone.position.set(9.1, 0.04, 1.3);
  root.add(cone);
  addBox(cone, toon(0x2d3338), 0.3, 0.04, 0.3, 0, 0.02, 0, { cast: false });
  addCylinder(cone, toon(0xf17a45), 0.045, 0.14, 0.5, 10, 0, 0.29, 0, { outline: 0.004 });
  addCylinder(cone, toon(0xf6e7d4), 0.075, 0.1, 0.08, 10, 0, 0.32, 0, { cast: false });

  // potted plant near the entrance
  const plant = new THREE.Group();
  plant.position.set(5.26, WALK, -1.3);
  root.add(plant);
  addCylinder(plant, toon(0x7c5c45), 0.14, 0.11, 0.24, 10, 0, 0.12, 0, { outline: 0.003 });
  addSphere(plant, toon(0x3f6c4d), 0.22, 0, 0.34, 0, 8);
  addSphere(plant, toon(0x4b7d57), 0.16, 0.14, 0.24, 0.07, 8);
  addSphere(plant, toon(0x355e46), 0.14, -0.13, 0.26, -0.04, 8);

  // fallen leaf or two in the gutter
  for (let i = 0; i < 5; i++) {
    const leaf = addPlane(
      root,
      toon(0x634e2c),
      0.08,
      0.04,
      -3.0 + Math.random() * 4.0,
      WALK + 0.01,
      2.1 + Math.random() * 0.7,
      { rotation: [-Math.PI / 2, 0, Math.random() * Math.PI] }
    );
    leaf.receiveShadow = false;
  }

  // a small red postbox-shaped ashtray outside the store
  const ash = new THREE.Group();
  ash.position.set(5.95, WALK, -1.28);
  root.add(ash);
  addCylinder(ash, toon(0x6e4a3a), 0.08, 0.1, 0.7, 8, 0, 0.35, 0, { outline: 0.003 });
  addCylinder(ash, toon(0x2b3339), 0.12, 0.1, 0.08, 8, 0, 0.74, 0, { cast: false });
}

/* ------------------------------------------------------------------ *
 *  Public entry
 * ------------------------------------------------------------------ */

export function buildProps(root, world) {
  buildVendingMachine(root, world);
  buildBicycle(root);
  buildEntranceProps(root);
  buildNoticeboard(root);
  buildStreetLamp(root, world);
  buildUtilityPole(root, world);
  buildGuardrail(root);
  buildParkingSign(root);
  buildPylonSign(root, world);
  buildTrafficSignal(root, world);
  buildApartment(root, world);
  buildBackdrop(root, world);
  buildTree(root);
  buildAlleyClutter(root, world);
  buildSmallProps(root);
}