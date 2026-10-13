/** RNG determinístico (mulberry32) operando sobre um seed mutável em estado. */

export const nextRandom = (seedHolder: { rngSeed: number }): number => {
  seedHolder.rngSeed = (seedHolder.rngSeed + 0x6d2b79f5) | 0;
  let t = seedHolder.rngSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const randomInRange = (
  seedHolder: { rngSeed: number },
  min: number,
  max: number,
): number => min + nextRandom(seedHolder) * (max - min);

export const initialSeed = (): number => (Math.floor(Math.random() * 0xffffffff) | 0) || 1;
