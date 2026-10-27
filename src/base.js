import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  addBox,
  addPlane,
  addCylinder,
  makeCanvasTexture,
  toon,
  texturedGlow,
} from './core.js';
import { LAYOUT } from './layout.js';
import {
  makeAsphaltTexture,
  makePavementTexture,
  makeAlleyTexture,
  makeTactileTexture,
  makeManholeTexture,
  makeBasePlateTexture,
  makeReflectionStreakTexture,
  makeRadialGlowTexture,
} from './textures.js';

const WALK = LAYOUT.walkY;
const ROAD = LAYOUT.roadY;

function normalizeShapeUVs(geometry) {
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  const pos = geometry.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  const width = Math.max(0.0001, bb.max.x - bb.min.x);
  const height = Math.max(0.0001, bb.max.y - bb.min.y);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = (pos.getX(i) - bb.min.x) / width;
    uvs[i * 2 + 1] = (pos.getY(i) - bb.min.y) / height;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return geometry;
}

function makePuddleShape(rx, rz, seed) {
  const shape = new THREE.Shape();
  const points = [];
  const count = 13;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const wobble =
      1 +
      0.14 * Math.sin(a * 3 + seed * 1.7) +
      0.08 * Math.cos(a * 5 + seed * 2.3) +
      0.04 * Math.sin(a * 7 + seed);
    points.push(new THREE.Vector2(Math.cos(a) * rx * wobble, Math.sin(a) * rz * wobble));
  }
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i <= count; i++) {
    shape.lineTo(points[i % count].x, points[i % count].y);
  }
  shape.closePath();
  return shape;
}

function makeGrateTexture() {
  return makeCanvasTexture(256, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d1219';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#8b96a4';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = '#75818f';
    for (let x = 18; x < w - 14; x += 16) {
      ctx.fillRect(x, 18, 6, h - 36);
    }
    ctx.fillStyle = 'rgba(180,200,220,0.15)';
    ctx.fillRect(12, 12, w - 24, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, h - 18, w, 12);
  });
}

export function buildGround(root, world) {
  const group = new THREE.Group();
  group.name = 'ground';
  root.add(group);

  /* ---------------- display base ---------------- */
  const baseMat = toon(0x1b2433);
  const base = new THREE.Mesh(
    new RoundedBoxGeometry(LAYOUT.base, LAYOUT.baseHeight, LAYOUT.base, 5, 0.16),
    baseMat
  );
  base.position.y = -LAYOUT.baseHeight / 2;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // warm brass inlay around the model table
  const inlayMat = toon(0xa88a55);
  addBox(group, inlayMat, 19.93, 0.02, 0.055, 0, 0.01, 9.965, { cast: false });
  addBox(group, inlayMat, 19.93, 0.02, 0.055, 0, 0.01, -9.965, { cast: false });
  addBox(group, inlayMat, 0.055, 0.02, 19.93, 9.965, 0.01, 0, { cast: false });
  addBox(group, inlayMat, 0.055, 0.02, 19.93, -9.965, 0.01, 0, { cast: false });

  // asphalt fills the top of the diorama
  const asphaltMap = makeAsphaltTexture();
  const asphaltMat = toon(0xffffff, { map: asphaltMap });
  const asphalt = addPlane(
    group,
    asphaltMat,
    LAYOUT.base - 0.04,
    LAYOUT.base - 0.04,
    0,
    0.002,
    0,
    { rotation: [-Math.PI / 2, 0, 0], receive: true }
  );
  asphalt.name = 'asphalt';

  // nameplate on the front face of the plinth
  const plateTex = makeBasePlateTexture();
  const plateBacking = addBox(group, toon(0x5b4728), 5.15, 0.66, 0.035, 1.4, -0.37, 10.001, {
    cast: false,
  });
  const plate = addPlane(
    group,
    texturedGlow(plateTex, 0.9, { transparent: true }),
    4.85,
    0.5,
    1.4,
    -0.37,
    10.022
  );
  plate.name = 'nameplate';

  // soft contact shadow beneath the model
  const shadowTex = makeRadialGlowTexture('rgba(0,0,0,0.55)', 'rgba(0,0,0,0)');
  const contact = addPlane(
    group,
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      color: 0x05070b,
    }),
    32,
    32,
    0,
    -1.12,
    0,
    { rotation: [-Math.PI / 2, 0, 0] }
  );
  contact.renderOrder = -2;

  /* ---------------- sidewalks ---------------- */
  const pavementTex = makePavementTexture();
  const makeWalkMat = (w, d) => {
    const map = pavementTex.clone();
    map.needsUpdate = true;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(w / 2.4, d / 2.4);
    return toon(0xd6dbe2, { map });
  };
  const walkMatCap = toon(0xb9c0c9);
  const curbMat = toon(0x9aa1aa);

  function addWalkSlab(x0, x1, z0, z1) {
    const w = x1 - x0;
    const d = z1 - z0;
    const mat = makeWalkMat(w, d);
    const slab = addBox(group, mat, w, WALK, d, (x0 + x1) / 2, WALK / 2, (z0 + z1) / 2, {
      cast: false,
      receive: true,
    });
    slab.name = 'sidewalk';
    return slab;
  }

  const sw = LAYOUT.sidewalk;
  addWalkSlab(sw.front.x0, sw.front.x1, sw.front.z0, sw.front.z1);
  addWalkSlab(sw.left.x0, sw.left.x1, sw.left.z0, sw.left.z1);
  addWalkSlab(sw.right.x0, sw.right.x1, sw.right.z0, sw.right.z1);
  addWalkSlab(sw.apartment.x0, sw.apartment.x1, sw.apartment.z0, sw.apartment.z1);

  const alleyTex = makeAlleyTexture();
  const alleyMat = toon(0xc3c7cc, { map: alleyTex });
  const alleyFloor = addBox(
    group,
    alleyMat,
    LAYOUT.alley.x1 - LAYOUT.alley.x0,
    WALK,
    LAYOUT.alley.z1 - LAYOUT.alley.z0,
    (LAYOUT.alley.x0 + LAYOUT.alley.x1) / 2,
    WALK / 2,
    (LAYOUT.alley.z0 + LAYOUT.alley.z1) / 2,
    { cast: false }
  );
  alleyFloor.name = 'alley-floor';

  // parking apron (at street level)
  const p = LAYOUT.parking;
  const parkingMat = toon(0xffffff, { map: asphaltMap.clone() });
  parkingMat.map.repeat.set(1.2, 0.8);
  addBox(group, parkingMat, p.x1 - p.x0, 0.04, p.z1 - p.z0, (p.x0 + p.x1) / 2, 0.02, (p.z0 + p.z1) / 2, {
    cast: false,
  });

  /* ---------------- curbs ---------------- */
  function curb(x, z, w, d) {
    return addBox(group, curbMat, w, WALK + 0.015, d, x, (WALK + 0.015) / 2, z, {
      cast: true,
      receive: true,
      outline: 0.008,
    });
  }
  // front apron to road
  curb(-2.75, 3.2, 4.1, 0.2);
  curb(3.85, 3.2, 2.7, 0.2);
  // parking apron border
  curb(7.25, 0.9, 4.1, 0.2);
  // left side street edge
  curb(-4.8, 0.8, 0.2, 4.8);
  // apartment sidewalk edge
  curb(-7.4, -1.6, 5.2, 0.2);
  // right walkway edge to base edge? low kerb against the neighbouring plot
  curb(9.32, -4.8, 0.18, 6.4);

  // gentle ramp where the crosswalk climbs the kerb
  const rampMat = toon(0xbbc1c9);
  const ramp = addBox(group, rampMat, 3.15, 0.035, 0.6, 0.9, 0.085, 3.05, {
    cast: false,
    receive: true,
  });
  ramp.rotation.x = -Math.atan2(WALK - 0.03, 0.6);

  // tactile paving by the crossing
  const tactileTex = makeTactileTexture();
  const tactileMat = toon(0xd7c37a, { map: tactileTex });
  addPlane(group, tactileMat, 2.9, 0.38, 0.9, WALK + 0.008, 2.82, {
    rotation: [-Math.PI / 2, 0, 0],
    receive: true,
  });
  addPlane(group, tactileMat, 0.38, 3.3, -4.55, WALK + 0.008, 0.3, {
    rotation: [-Math.PI / 2, 0, 0],
    receive: true,
  });

  /* ---------------- road paint ---------------- */
  const paintMat = toon(0xd4dce1);
  const paintDull = toon(0xaeb8c1);
  const cw = LAYOUT.crosswalk;
  // Japanese zebra stripes run parallel to the road, stacked across the crossing.
  const stripeCount = 8;
  const stripeDepth = 0.34;
  const crossGap = (cw.z1 - cw.z0 - stripeCount * stripeDepth) / (stripeCount - 1);
  const crossCenterX = (cw.x0 + cw.x1) / 2;
  for (let i = 0; i < stripeCount; i++) {
    const z = cw.z0 + stripeDepth / 2 + i * (stripeDepth + crossGap);
    addPlane(
      group,
      paintMat,
      cw.x1 - cw.x0,
      stripeDepth,
      crossCenterX,
      ROAD + 0.012,
      z,
      { rotation: [-Math.PI / 2, 0, 0] }
    );
  }

  // road edge lines
  addPlane(group, paintMat, 19.7, 0.1, 0, ROAD + 0.01, 3.52, { rotation: [-Math.PI / 2, 0, 0] });
  addPlane(group, paintMat, 19.7, 0.1, 0, ROAD + 0.01, 9.1, { rotation: [-Math.PI / 2, 0, 0] });
  // centre line (broken, avoids the crossing)
  for (let x = -9.4; x < 9.2; x += 1.65) {
    const nearCross = x > cw.x0 - 0.7 && x < cw.x1 + 0.2;
    if (nearCross) continue;
    addPlane(group, paintDull, 0.08, 0.75, x, ROAD + 0.011, 6.25, {
      rotation: [-Math.PI / 2, 0, 0],
    });
  }

  // parking bay markings
  const bayZ0 = 1.12;
  const bayZ1 = 3.1;
  [5.35, 7.25, 9.15].forEach((x) => {
    addPlane(group, paintMat, 0.075, bayZ1 - bayZ0, x, ROAD + 0.034, (bayZ0 + bayZ1) / 2, {
      rotation: [-Math.PI / 2, 0, 0],
    });
  });
  addPlane(group, paintMat, 3.85, 0.075, 7.25, ROAD + 0.034, bayZ1, {
    rotation: [-Math.PI / 2, 0, 0],
  });
  const stopMat = toon(0xbcc5cc);
  addBox(group, stopMat, 0.55, 0.09, 0.14, 6.3, 0.095, 1.28, { outline: 0.005 });
  addBox(group, stopMat, 0.55, 0.09, 0.14, 8.2, 0.095, 1.28, { outline: 0.005 });

  /* ---------------- drains & manhole ---------------- */
  const grateTex = makeGrateTexture();
  const grateMat = new THREE.MeshBasicMaterial({
    map: grateTex,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  [-3.1, 1.9, 4.6].forEach((x) => {
    addBox(group, toon(0x222a34), 1.0, 0.02, 0.34, x, 0.016, 3.48, { cast: false });
    addPlane(group, grateMat, 0.9, 0.3, x, 0.028, 3.48, { rotation: [-Math.PI / 2, 0, 0] });
  });
  addBox(group, toon(0x1c242d), 0.5, 0.02, 0.9, -4.76, 0.016, 1.0, { cast: false });
  addPlane(group, grateMat, 0.42, 0.84, -4.76, 0.028, 1.0, { rotation: [-Math.PI / 2, 0, Math.PI / 2] });

  const manholeTex = makeManholeTexture();
  const manholeMat = new THREE.MeshBasicMaterial({
    map: manholeTex,
    transparent: true,
    depthWrite: false,
    color: 0x8b95a2,
    toneMapped: false,
  });
  addPlane(group, manholeMat, 1.22, 1.22, 3.9, ROAD + 0.014, 5.6, {
    rotation: [-Math.PI / 2, 0, 0.4],
  });
  addPlane(group, manholeMat, 0.92, 0.92, -2.7, WALK + 0.012, 0.4, {
    rotation: [-Math.PI / 2, 0, 1.2],
  });

  // gutter seam along the kerb
  const gutterMat = new THREE.MeshBasicMaterial({
    color: 0x0b1119,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  addPlane(group, gutterMat, 19.2, 0.22, 0, ROAD + 0.009, 3.72, { rotation: [-Math.PI / 2, 0, 0] });

  /* ---------------- puddles ---------------- */
  const streakTex = makeReflectionStreakTexture();
  streakTex.wrapS = streakTex.wrapT = THREE.ClampToEdgeWrapping;
  world.reflectionTexture = streakTex;

  const puddles = [
    // road
    { x: 0.8, z: 5.9, rx: 1.25, rz: 0.5, y: ROAD + 0.012, tint: 0x8fd8ff, o: 0.26 },
    { x: -3.9, z: 7.6, rx: 0.9, rz: 0.36, y: ROAD + 0.012, tint: 0xffb77d, o: 0.2 },
    { x: 4.7, z: 4.9, rx: 1.35, rz: 0.48, y: ROAD + 0.012, tint: 0xffa4c8, o: 0.24 },
    { x: -7.4, z: 5.9, rx: 0.82, rz: 0.34, y: ROAD + 0.012, tint: 0x9fd3ff, o: 0.2 },
    { x: 8.0, z: 7.45, rx: 0.72, rz: 0.32, y: ROAD + 0.012, tint: 0xffc47b, o: 0.18 },
    // sidewalk
    { x: 1.6, z: 0.35, rx: 0.78, rz: 0.3, y: WALK + 0.009, tint: 0xffc687, o: 0.28 },
    { x: -1.6, z: 1.9, rx: 1.02, rz: 0.4, y: WALK + 0.009, tint: 0x92d8ff, o: 0.23 },
    { x: 4.2, z: 2.2, rx: 0.54, rz: 0.24, y: WALK + 0.009, tint: 0xffa4c8, o: 0.22 },
    { x: 8.55, z: -0.6, rx: 0.6, rz: 0.28, y: WALK + 0.009, tint: 0x9fe2ff, o: 0.2 },
    // parking
    { x: 7.1, z: 1.8, rx: 0.7, rz: 0.4, y: ROAD + 0.045, tint: 0xff9cc6, o: 0.28 },
    { x: 8.45, z: 2.45, rx: 0.5, rz: 0.24, y: ROAD + 0.045, tint: 0x8fe1ff, o: 0.24 },
    // alley
    { x: -3.6, z: -3.2, rx: 0.72, rz: 0.55, y: WALK + 0.009, tint: 0x86d8d0, o: 0.2 },
    { x: -3.9, z: -5.6, rx: 0.52, rz: 0.4, y: WALK + 0.009, tint: 0xffb573, o: 0.16 },
    // side street
    { x: -7.1, z: 1.2, rx: 1.05, rz: 0.5, y: ROAD + 0.012, tint: 0x9bcaff, o: 0.23 },
  ];

  puddles.forEach((pd, index) => {
    const shape = makePuddleShape(pd.rx, pd.rz, index * 1.7 + 0.4);
    const geometry = normalizeShapeUVs(new THREE.ShapeGeometry(shape, 24));
    const base = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0x07101d,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      })
    );
    base.rotation.x = -Math.PI / 2;
    base.position.set(pd.x, pd.y, pd.z);
    base.renderOrder = 1;
    group.add(base);

    const rim = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0xaad7f2,
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(pd.x, pd.y + 0.001, pd.z);
    rim.scale.setScalar(1.035);
    rim.renderOrder = 1;
    group.add(rim);

    const reflectOpacity = Math.min(0.4, pd.o * 1.25);
    const reflectMat = new THREE.MeshBasicMaterial({
      map: streakTex,
      color: pd.tint,
      transparent: true,
      opacity: reflectOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const reflection = new THREE.Mesh(geometry, reflectMat);
    reflection.rotation.x = -Math.PI / 2;
    reflection.position.set(pd.x, pd.y + 0.002, pd.z);
    reflection.renderOrder = 2;
    group.add(reflection);

    world.puddles.push({ x: pd.x, z: pd.z, rx: pd.rx, rz: pd.rz, y: pd.y });
    world.reflections.push({
      material: reflectMat,
      base: reflectOpacity,
      phase: index * 1.3,
      speed: 0.7 + (index % 3) * 0.2,
    });
  });

  /* ---------------- long neon reflections ---------------- */
  const glowTex = makeRadialGlowTexture('rgba(255,255,255,0.85)', 'rgba(255,255,255,0)');

  function streak(x, y, z, w, d, color, opacity, rot = 0) {
    const mat = new THREE.MeshBasicMaterial({
      map: streakTex,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const mesh = addPlane(group, mat, w, d, x, y, z, {
      rotation: [-Math.PI / 2, 0, rot],
    });
    mesh.renderOrder = 3;
    world.reflections.push({ material: mat, base: opacity, phase: Math.random() * 6, speed: 0.5 });
    return mesh;
  }

  // storefront glow spilling onto wet pavement and road
  streak(1.9, WALK + 0.011, 0.25, 6.4, 2.3, 0xa5ffe8, 0.16);
  streak(1.9, ROAD + 0.015, 5.35, 5.6, 4.2, 0x9fffd9, 0.09);
  streak(3.6, ROAD + 0.016, 6.4, 1.5, 5.0, 0xffc88e, 0.12);
  streak(0.1, WALK + 0.012, 0.25, 0.8, 2.2, 0xffd7a0, 0.26);
  streak(5.5, WALK + 0.012, 0.3, 0.6, 2.0, 0xffc78f, 0.2);
  streak(1.4, WALK + 0.012, 0.28, 0.55, 1.7, 0x9fffe0, 0.14);
  // vending machine and alley light
  streak(-4.15, WALK + 0.011, -0.25, 1.5, 2.0, 0xcffcff, 0.24);
  streak(-4.2, WALK + 0.012, 0.8, 1.0, 2.6, 0xbff8ff, 0.1);
  // pylon sign in the parking bay
  streak(8.15, ROAD + 0.05, 2.55, 1.2, 2.4, 0xff9ecb, 0.33);
  streak(8.15, ROAD + 0.05, 3.1, 0.5, 1.4, 0x8fffe1, 0.2);
  // street lamp pool
  const lampPool = addPlane(
    group,
    new THREE.MeshBasicMaterial({
      map: glowTex,
      color: 0xffc88e,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    6,
    5,
    -4.9,
    ROAD + 0.014,
    1.2,
    { rotation: [-Math.PI / 2, 0, 0] }
  );
  lampPool.renderOrder = 3;

  // traffic signal reflection, tinted by its animation
  const trafficReflectMat = new THREE.MeshBasicMaterial({
    map: streakTex,
    color: 0xff5c5c,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const trafficReflection = addPlane(group, trafficReflectMat, 0.65, 3.2, -9.05, ROAD + 0.016, 4.7, {
    rotation: [-Math.PI / 2, 0, 0.02],
  });
  trafficReflection.renderOrder = 3;
  world.trafficReflection = trafficReflectMat;

  // doorway light pool (animated when the doors open)
  const doorSpillMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    color: 0xffc07a,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const doorSpill = addPlane(group, doorSpillMat, 4.6, 3.4, 3.55, WALK + 0.015, 0.05, {
    rotation: [-Math.PI / 2, 0, 0],
  });
  doorSpill.renderOrder = 3;
  world.doorSpillMat = doorSpillMat;

  // faint cool sheen across the crossing
  const sheenMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    color: 0x8cbfff,
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  addPlane(group, sheenMat, 4.2, 5.4, 0.9, ROAD + 0.013, 5.8, {
    rotation: [-Math.PI / 2, 0, 0],
  });

  // rainwater film in the alley
  addPlane(
    group,
    new THREE.MeshBasicMaterial({
      color: 0x0a1722,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
    }),
    2.3,
    6.2,
    -3.6,
    WALK + 0.006,
    -4.9,
    { rotation: [-Math.PI / 2, 0, 0] }
  );

  return group;
}