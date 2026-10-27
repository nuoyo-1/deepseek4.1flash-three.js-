import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  Shared palette + toon rendering primitives
 * ------------------------------------------------------------------ */

export const PALETTE = {
  night: 0x070d19,
  asphalt: 0x222a3a,
  asphaltLight: 0x344056,
  sidewalk: 0x7d8797,
  sidewalkDark: 0x4f5a6b,
  concrete: 0xa8adb4,
  cream: 0xeee9db,
  storeWall: 0xe8e5da,
  mint: 0x4fd6b2,
  mintDeep: 0x1f8f7a,
  coral: 0xff8c5c,
  signNavy: 0x102840,
  warm: 0xffd7a3,
  warmDeep: 0xff9d52,
  cyan: 0x8fe6ff,
  pink: 0xff86b7,
  navy: 0x162536,
  dark: 0x101823,
  metal: 0x9aa7b5,
  metalDark: 0x3b4655,
  white: 0xf3f3ee,
};

// 4-step anime cel ramp (linear-ish values, sampled raw by MeshToonMaterial)
const gradientData = new Uint8Array([58, 118, 184, 255]);
export const toonGradient = new THREE.DataTexture(
  gradientData,
  gradientData.length,
  1,
  THREE.RedFormat
);
toonGradient.minFilter = THREE.NearestFilter;
toonGradient.magFilter = THREE.NearestFilter;
toonGradient.generateMipmaps = false;
toonGradient.needsUpdate = true;

export function toon(color, options = {}) {
  const material = new THREE.MeshToonMaterial({
    color,
    gradientMap: toonGradient,
    ...options,
  });
  return material;
}

/** Flat emissive-looking material. Values > 1 survive into the bloom pass. */
export function glow(color, intensity = 1, options = {}) {
  const c = new THREE.Color(color).multiplyScalar(intensity);
  const material = new THREE.MeshBasicMaterial({
    color: c,
    toneMapped: false,
    ...options,
  });
  return material;
}

export function texturedGlow(map, intensity = 1, options = {}) {
  const material = new THREE.MeshBasicMaterial({
    map,
    color: new THREE.Color(1, 1, 1).multiplyScalar(intensity),
    toneMapped: false,
    ...options,
  });
  return material;
}

/* ------------------------------------------------------------------ *
 *  Outline: expanded normal shell rendered with back faces
 * ------------------------------------------------------------------ */

const outlineMaterials = new Map();

function getOutlineMaterial(thickness, color) {
  const key = `${thickness.toFixed(4)}-${color}`;
  if (outlineMaterials.has(key)) return outlineMaterials.get(key);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: thickness },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: /* glsl */ `
      uniform float uThickness;
      void main() {
        vec3 transformed = position + normal * uThickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      void main() {
        gl_FragColor = vec4(uColor, 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  outlineMaterials.set(key, material);
  return material;
}

export function addOutline(mesh, thickness = 0.012, color = 0x0b1220) {
  if (!mesh.geometry || !mesh.geometry.attributes.normal) return mesh;
  const outline = new THREE.Mesh(mesh.geometry, getOutlineMaterial(thickness, color));
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.frustumCulled = mesh.frustumCulled;
  mesh.add(outline);
  return mesh;
}

/* ------------------------------------------------------------------ *
 *  Geometry helpers
 * ------------------------------------------------------------------ */

export function addBox(
  parent,
  material,
  width,
  height,
  depth,
  x = 0,
  y = 0,
  z = 0,
  options = {}
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.cast ?? true;
  mesh.receiveShadow = options.receive ?? true;
  if (options.outline) addOutline(mesh, options.outline);
  parent.add(mesh);
  return mesh;
}

export function addCylinder(
  parent,
  material,
  radiusTop,
  radiusBottom,
  height,
  segments,
  x = 0,
  y = 0,
  z = 0,
  options = {}
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    material
  );
  mesh.position.set(x, y, z);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.cast ?? true;
  mesh.receiveShadow = options.receive ?? true;
  if (options.outline) addOutline(mesh, options.outline);
  parent.add(mesh);
  return mesh;
}

export function addPlane(
  parent,
  material,
  width,
  height,
  x = 0,
  y = 0,
  z = 0,
  options = {}
) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(x, y, z);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.cast ?? false;
  mesh.receiveShadow = options.receive ?? false;
  parent.add(mesh);
  return mesh;
}

export function addSphere(parent, material, radius, x, y, z, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function setGroupShadows(group, cast = true, receive = true) {
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
  return group;
}

/* ------------------------------------------------------------------ *
 *  Canvas texture utilities
 * ------------------------------------------------------------------ */

export function makeCanvasTexture(width, height, draw, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = options.anisotropy ?? 8;
  if (options.repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(options.repeat[0], options.repeat[1]);
  }
  texture.minFilter = options.mipmaps === false ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  if (options.needsUpdate !== false) texture.needsUpdate = true;
  return texture;
}

export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function drawStar(ctx, cx, cy, outer, inner, points = 5, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = rotation + (i * Math.PI) / points;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawCrescent(ctx, cx, cy, radius, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx + radius * 0.38, cy - radius * 0.2, radius * 0.86, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function japaneseFont(size, weight = 700) {
  return `${weight} ${size}px "Yu Gothic", "Yu Gothic UI", "Meiryo", "Hiragino Kaku Gothic ProN", sans-serif`;
}

export function spacedText(ctx, text, x, y, spacing) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((sum, w) => sum + w, 0) + spacing * (chars.length - 1);
  let cursor = x - total / 2;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, cursor + widths[i] / 2, y);
    cursor += widths[i] + spacing;
  });
  return total;
}

/* ------------------------------------------------------------------ *
 *  Color helpers
 * ------------------------------------------------------------------ */

export function colorVariation(hex, amount = 0.08) {
  const color = new THREE.Color(hex);
  const hsl = {};
  color.getHSL(hsl);
  color.setHSL(
    (hsl.h + (Math.random() - 0.5) * amount * 0.18 + 1) % 1,
    THREE.MathUtils.clamp(hsl.s + (Math.random() - 0.5) * amount, 0, 1),
    THREE.MathUtils.clamp(hsl.l + (Math.random() - 0.5) * amount, 0.05, 0.95)
  );
  return color;
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}