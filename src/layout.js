/** Shared dimensions for the miniature block. All units are metres. */
export const LAYOUT = {
  base: 20,
  baseHeight: 0.72,
  roadY: 0.012,
  walkY: 0.15,

  store: {
    x0: -2.4,
    x1: 7.0,
    z0: -8.0,
    z1: -1.6,
    floorY: 0.16,
    wallTop: 3.55,
    roofY: 3.72,
  },

  apartment: {
    x0: -8.8,
    x1: -4.8,
    z0: -8.4,
    z1: -2.8,
    height: 6.1,
  },

  alley: { x0: -4.8, x1: -2.4, z0: -8.0, z1: -1.6 },

  street: {
    frontZ0: 3.2,
    frontZ1: 9.4,
    sideX0: -10,
    sideX1: -4.8,
    sideZ1: 3.2,
    sideZ0: -1.6,
  },

  sidewalk: {
    // strip immediately in front of store / alley
    front: { x0: -4.8, x1: 9.3, z0: -1.6, z1: 0.9 },
    // wider apron left of the parking cut-out
    left: { x0: -4.8, x1: 5.2, z0: 0.9, z1: 3.2 },
    // raised walkway along the right flank of the store
    right: { x0: 7.0, x1: 9.3, z0: -8.0, z1: -1.6 },
    // sidewalk in front of the older apartment
    apartment: { x0: -10, x1: -4.8, z0: -2.8, z1: -1.6 },
  },

  parking: { x0: 5.2, x1: 9.3, z0: 0.9, z1: 3.2 },

  // common focal points used by multiple builders
  door: { x: 3.55, z: -1.6, width: 2.0 },
  crosswalk: { x0: -0.7, x1: 2.5, z0: 3.35, z1: 8.25 },
  pylon: { x: 8.15, z: 2.0 },
};

export const EXCLUSION_ZONES = [
  {
    x0: LAYOUT.store.x0 - 0.25,
    x1: LAYOUT.store.x1 + 0.25,
    z0: LAYOUT.store.z0 - 0.2,
    z1: LAYOUT.store.z1 + 0.15,
  },
  {
    x0: LAYOUT.apartment.x0 - 0.2,
    x1: LAYOUT.apartment.x1 + 0.2,
    z0: LAYOUT.apartment.z0 - 0.2,
    z1: LAYOUT.apartment.z1 + 0.2,
  },
  {
    // canopy keeps the doormat dry
    x0: -2.3,
    x1: 7.0,
    z0: -1.6,
    z1: -0.32,
  },
];

export function insideAnyZone(x, z) {
  for (const zone of EXCLUSION_ZONES) {
    if (x > zone.x0 && x < zone.x1 && z > zone.z0 && z < zone.z1) return true;
  }
  return false;
}