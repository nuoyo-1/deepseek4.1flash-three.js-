import * as THREE from 'three';
import { makeCanvasTexture, toon } from './core.js';
import { LAYOUT } from './layout.js';
import { makeSoftCloudTexture, makeRadialGlowTexture } from './textures.js';

const WALK = LAYOUT.walkY;

function inRect(x, z, r) {
  return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
}

function groundLevelAt(x, z) {
  if (inRect(x, z, LAYOUT.parking)) return 0.048;
  const sw = LAYOUT.sidewalk;
  if (
    inRect(x, z, sw.front) ||
    inRect(x, z, sw.left) ||
    inRect(x, z, sw.right) ||
    inRect(x, z, sw.apartment) ||
    inRect(x, z, LAYOUT.alley)
  ) {
    return WALK + 0.012;
  }
  return LAYOUT.roadY + 0.014;
}

/** Rain lands on roofs and the canopy instead of passing through them. */
function rainFloorAt(x, z) {
  if (inRect(x, z, LAYOUT.store)) return 3.86;
  if (inRect(x, z, LAYOUT.apartment)) return 6.36;
  if (x > LAYOUT.store.x0 - 0.15 && x < LAYOUT.store.x1 && z > -1.58 && z < -0.34) return 2.58;
  if (z < -8.45) return 6.2;
  return groundLevelAt(x, z);
}

function makeRippleTexture() {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
    g.addColorStop(0, 'rgba(210,240,255,0)');
    g.addColorStop(0.62, 'rgba(210,240,255,0)');
    g.addColorStop(0.8, 'rgba(215,242,255,0.55)');
    g.addColorStop(0.86, 'rgba(240,252,255,0.9)');
    g.addColorStop(0.94, 'rgba(210,240,255,0.18)');
    g.addColorStop(1, 'rgba(210,240,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // break the perfect ring up a little
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 36; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = w * (0.78 + Math.random() * 0.12);
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.55})`;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  });
}

export function buildWeather(root, world) {
  /* ------------------------------------------------------------------ *
   *  Rain
   * ------------------------------------------------------------------ */
  const dropCount = world.mobile ? 1100 : 1500;
  const rainData = [];
  for (let i = 0; i < dropCount; i++) {
    const x = -9.75 + Math.random() * 19.5;
    const z = -9.75 + Math.random() * 19.5;
    const floor = rainFloorAt(x, z);
    rainData.push({
      x,
      z,
      floor,
      y: floor + Math.random() * (9.4 - floor),
      speed: 5.5 + Math.random() * 5.0,
      length: 0.2 + Math.random() * 0.34,
      bright: Math.random(),
    });
  }

  const rainGeom = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(dropCount * 6);
  rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0xa8d2ff,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const rain = new THREE.LineSegments(rainGeom, rainMat);
  rain.frustumCulled = false;
  rain.renderOrder = 20;
  root.add(rain);

  const resetDrop = (drop) => {
    const x = -9.75 + Math.random() * 19.5;
    const z = -9.75 + Math.random() * 19.5;
    drop.x = x;
    drop.z = z;
    drop.floor = rainFloorAt(x, z);
    drop.y = 8.2 + Math.random() * 1.6;
    drop.speed = 5.5 + Math.random() * 5.0;
    drop.length = 0.2 + Math.random() * 0.34;
  };

  /* ------------------------------------------------------------------ *
   *  Wet ground ripples
   * ------------------------------------------------------------------ */
  const rippleTex = makeRippleTexture();
  const ripplePool = [];
  const rippleGroup = new THREE.Group();
  root.add(rippleGroup);
  for (let i = 0; i < (world.mobile ? 36 : 52); i++) {
    const mat = new THREE.MeshBasicMaterial({
      map: rippleTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    mesh.renderOrder = 6;
    rippleGroup.add(mesh);
    ripplePool.push({ mesh, mat, active: false, t: 0, life: 1, scale: 1, max: 1, opacity: 0.2 });
  }
  let rippleCursor = 0;
  let rippleAccumulator = 0;

  function spawnRipple(x, y, z, size = 0.6, opacity = 0.24, life = 1.05, stretch = 1) {
    const r = ripplePool[rippleCursor++ % ripplePool.length];
    r.active = true;
    r.t = 0;
    r.life = life;
    r.scale = size * 0.16;
    r.max = size;
    r.opacity = opacity;
    r.stretch = stretch;
    r.mesh.position.set(x, y + 0.006, z);
    r.mesh.scale.set(r.scale, r.scale * stretch, 1);
    r.mesh.visible = true;
    r.mat.opacity = opacity;
    return r;
  }

  /* ------------------------------------------------------------------ *
   *  Canopy and balcony drips
   * ------------------------------------------------------------------ */
  const dripSources = [
    { x: -1.6, y: 2.43, z: -0.51, floor: WALK + 0.015, next: 0.2 },
    { x: 0.9, y: 2.43, z: -0.51, floor: WALK + 0.015, next: 0.8 },
    { x: 3.2, y: 2.43, z: -0.51, floor: WALK + 0.015, next: 1.4 },
    { x: 5.4, y: 2.43, z: -0.51, floor: WALK + 0.015, next: 0.5 },
    { x: 6.6, y: 2.43, z: -0.51, floor: WALK + 0.015, next: 1.8 },
    { x: -8.1, y: 3.02, z: -2.15, floor: WALK + 0.015, next: 1.1 },
    { x: -6.9, y: 3.02, z: -2.15, floor: WALK + 0.015, next: 2.4 },
    { x: -5.7, y: 3.02, z: -2.15, floor: WALK + 0.015, next: 0.4 },
    { x: 6.94, y: 3.45, z: -1.85, floor: WALK + 0.015, next: 1.6 },
  ];
  const dripMat = new THREE.MeshBasicMaterial({
    color: 0xd8f4ff,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const dripGeom = new THREE.SphereGeometry(0.022, 6, 6);
  const dripPool = [];
  const dripGroup = new THREE.Group();
  root.add(dripGroup);
  for (let i = 0; i < 18; i++) {
    const mesh = new THREE.Mesh(dripGeom, dripMat.clone());
    mesh.scale.set(0.8, 3.2, 0.8);
    mesh.visible = false;
    dripGroup.add(mesh);
    dripPool.push({ mesh, active: false, x: 0, z: 0, y: 0, floor: 0.15, speed: 0, source: null });
  }
  let dripCursor = 0;
  function spawnDrip(source) {
    const d = dripPool[dripCursor++ % dripPool.length];
    d.active = true;
    d.x = source.x + (Math.random() - 0.5) * 0.1;
    d.z = source.z;
    d.y = source.y;
    d.floor = source.floor;
    d.speed = 0.6 + Math.random() * 0.4;
    d.source = source;
    d.mesh.position.set(d.x, d.y, d.z);
    d.mesh.visible = true;
  }

  /* ------------------------------------------------------------------ *
   *  Low mist
   * ------------------------------------------------------------------ */
  const cloudTex = makeSoftCloudTexture();
  const mistPlanes = [];
  const mistData = [
    { x: 1.0, y: 0.42, z: 5.5, w: 17, d: 7, opacity: 0.08, dx: 0.025 },
    { x: -3.5, y: 0.55, z: -4.5, w: 9, d: 7, opacity: 0.06, dx: -0.018 },
    { x: 4.0, y: 0.32, z: -1.0, w: 11, d: 4, opacity: 0.045, dx: 0.012 },
  ];
  mistData.forEach((m, i) => {
    const mat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      color: 0xa7c0da,
      transparent: true,
      opacity: m.opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.d), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(m.x, m.y, m.z);
    mesh.renderOrder = 5;
    root.add(mesh);
    mistPlanes.push({ mesh, mat, base: m.opacity, phase: i * 2.2, dx: m.dx });
  });

  // warm mist halo at the streetlamp
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeRadialGlowTexture('rgba(255,190,130,0.25)', 'rgba(255,190,130,0)'),
      color: 0xffc88e,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
  );
  halo.position.set(-2.78, 2.9, 3.8);
  halo.scale.set(4.5, 3.4, 1);
  root.add(halo);

  /* ------------------------------------------------------------------ *
   *  Update loop
   * ------------------------------------------------------------------ */
  world.updatables.push({
    update(dt, elapsed) {
      /* rain streaks */
      const pos = rainPositions;
      const wind = 0.055 + Math.sin(elapsed * 0.33) * 0.02;
      for (let i = 0; i < dropCount; i++) {
        const d = rainData[i];
        d.y -= d.speed * dt;
        if (d.y < d.floor + 0.02) {
          resetDrop(d);
        }
        const i6 = i * 6;
        pos[i6] = d.x;
        pos[i6 + 1] = d.y;
        pos[i6 + 2] = d.z;
        pos[i6 + 3] = d.x + wind * d.length;
        pos[i6 + 4] = d.y + d.length;
        pos[i6 + 5] = d.z;
      }
      rainGeom.attributes.position.needsUpdate = true;
      rainMat.opacity = 0.23 + Math.sin(elapsed * 0.23) * 0.03;

      /* glass runnels */
      if (world.glassRain) {
        world.glassRain.forEach((layer) => {
          layer.texture.offset.y += dt * layer.speed;
        });
      }

      /* ripples */
      rippleAccumulator += dt;
      const rippleInterval = 0.09;
      while (rippleAccumulator > rippleInterval) {
        rippleAccumulator -= rippleInterval;
        const roll = Math.random();
        if (roll < 0.4 && world.puddles.length) {
          const p = world.puddles[Math.floor(Math.random() * world.puddles.length)];
          const a = Math.random() * Math.PI * 2;
          const rr = Math.random() * 0.65;
          spawnRipple(
            p.x + Math.cos(a) * p.rx * rr,
            p.y + 0.005,
            p.z + Math.sin(a) * p.rz * rr,
            0.35 + Math.random() * 0.7,
            0.14 + Math.random() * 0.14,
            0.9 + Math.random() * 0.45,
            Math.max(0.45, p.rz / p.rx)
          );
        } else if (roll < 0.72) {
          const x = -4.4 + Math.random() * 13.2;
          const z = -1.2 + Math.random() * 4.1;
          if (x > 5.1 && z > 0.95) continue;
          const gy = groundLevelAt(x, z);
          spawnRipple(x, gy + 0.004, z, 0.16 + Math.random() * 0.22, 0.09, 0.55, 1);
        } else {
          const x = -8.6 + Math.random() * 17.2;
          const z = 3.5 + Math.random() * 5.3;
          spawnRipple(x, LAYOUT.roadY + 0.018, z, 0.12 + Math.random() * 0.18, 0.075, 0.5, 1);
        }
      }

      ripplePool.forEach((r) => {
        if (!r.active) return;
        r.t += dt;
        const k = r.t / r.life;
        if (k >= 1) {
          r.active = false;
          r.mesh.visible = false;
          return;
        }
        const s = r.scale + (r.max - r.scale) * Math.sqrt(k);
        r.mesh.scale.set(s, s * r.stretch, 1);
        r.mat.opacity = r.opacity * (1 - k) ** 1.3;
      });

      /* drips */
      dripSources.forEach((src) => {
        src.next -= dt;
        if (src.next <= 0) {
          spawnDrip(src);
          src.next = 0.65 + Math.random() * 2.2;
        }
      });
      dripPool.forEach((d) => {
        if (!d.active) return;
        d.speed += 5.2 * dt;
        d.y -= d.speed * dt;
        d.mesh.position.set(d.x, d.y, d.z);
        if (d.y <= d.floor) {
          d.active = false;
          d.mesh.visible = false;
          spawnRipple(d.x, d.floor, d.z, 0.22 + Math.random() * 0.12, 0.18, 0.6, 1);
        }
      });

      /* shimmering wet reflections */
      if (world.reflections) {
        world.reflections.forEach((r) => {
          const shimmer =
            0.86 +
            Math.sin(elapsed * r.speed + r.phase) * 0.09 +
            Math.sin(elapsed * r.speed * 2.7 + r.phase * 1.7) * 0.04;
          r.material.opacity = Math.max(0, r.base * shimmer);
        });
      }

      /* drifting ground mist */
      mistPlanes.forEach((m) => {
        m.mesh.position.x += m.dx * dt;
        if (m.mesh.position.x > 7.5) m.mesh.position.x = -7.5;
        if (m.mesh.position.x < -7.5) m.mesh.position.x = 7.5;
        m.mat.opacity = m.base * (0.8 + Math.sin(elapsed * 0.2 + m.phase) * 0.2);
      });
      halo.material.opacity = 0.1 + Math.sin(elapsed * 0.5) * 0.02;

      /* the wires breathe almost imperceptibly */
      if (world.wireGroup) {
        world.wireGroup.rotation.z = Math.sin(elapsed * 0.35) * 0.0012;
        world.wireGroup.rotation.x = Math.cos(elapsed * 0.27) * 0.0008;
      }
    },
  });

  return { rain, rippleGroup, dripGroup };
}