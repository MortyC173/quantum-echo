/**
 * Ideal phase-conjugate receiver for the Gaussian quantum-illumination model.
 * Guha & Erkmen, arXiv:0911.0950, section B, equations (7)-(8).
 * We sample the nonnegative Glauber–Sudarshan P Gaussian state AFTER physical phase conjugation:
 * C = sqrt(2) V + R†. The +1 vacuum-noise contribution is included.
 * Auxiliary complex amplitudes are not measurements of the original idler.
 * Perfect reference storage, independent thermal background, stable compensated
 * return phase, and ideal photon counters are assumed. No performance claim
 * against a classical transmitter follows from the matched/mismatched control.
 */
export const RECEIVER_GROUP_SIZE = 1024;
export const SOURCE_PHOTONS = 0.05;
export const RETURN_FRACTION = 0.1;

function randomGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// Circular complex Gaussian with E[|z|²] = 1.
function circularGaussian(random) {
  const radius = Math.sqrt(-Math.log(1 - random()));
  const phase = 2 * Math.PI * random();
  return [radius * Math.cos(phase), radius * Math.sin(phase)];
}

// Exact Poisson sampling. Independent chunks avoid exp(-rate) underflow.
function poisson(rate, random) {
  let count = 0;
  while (rate > 0) {
    const chunk = Math.min(rate, 20);
    const threshold = Math.exp(-chunk);
    let product = 1, draws = 0;
    do { product *= 1 - random(); draws += 1; } while (product > threshold);
    count += draws - 1;
    rate -= chunk;
  }
  return count;
}

function parameters({ noise = .6, targetPresent = false, paired = true } = {}) {
  if (!Number.isFinite(noise) || noise < 0 || noise > 1) throw new RangeError('noise 必须在0到1之间');
  if (typeof targetPresent !== 'boolean' || typeof paired !== 'boolean') throw new TypeError('目标和配对状态必须是布尔值');
  const background = .5 + 9.5 * noise;
  const c = background + 1 + (targetPresent ? RETURN_FRACTION * SOURCE_PHOTONS : 0);
  const s = SOURCE_PHOTONS;
  const correlation = targetPresent && paired ? Math.sqrt(RETURN_FRACTION * s * (s + 1)) : 0;
  return { noise, targetPresent, paired, background, c, s, correlation };
}

export function receiverTheory(options = {}) {
  const { c, s, correlation: m, background } = parameters(options);
  return {
    mean: 2 * m,
    variance: c + s + 2 * c * s + 2 * m * m,
    meanA: (c + s + 2 * m) / 2,
    meanB: (c + s - 2 * m) / 2,
    covarianceAB: (c - s) ** 2 / 4,
    background,
  };
}

export function createJointReceiver(options = {}) {
  const p = parameters(options);
  const seed = options.seed ?? 1;
  if (!Number.isFinite(seed)) throw new TypeError('seed 必须是有限数值');
  // Independent streams keep the prepared fields independent of the number of
  // random draws used by either detector. z3 is drawn even in the matched mode.
  const fields = randomGenerator(seed);
  const detectorA = randomGenerator((seed >>> 0) ^ 0xa5377d21);
  const detectorB = randomGenerator((seed >>> 0) ^ 0x71e3a9b5);
  const sourceScale = Math.sqrt(p.s);
  const sharedScale = p.targetPresent ? Math.sqrt(RETURN_FRACTION * (p.s + 1)) : 0;
  const backgroundScale = Math.sqrt(p.background + 1 - (p.targetPresent ? RETURN_FRACTION : 0));
  let modes = 0, totalA = 0, totalB = 0, sumDifferenceSquared = 0, sumAB = 0;
  const groups = [];

  function getSnapshot() {
    const difference = totalA - totalB;
    const mean = modes ? difference / modes : 0;
    return {
      modes, totalA, totalB, totalDifference: difference, mean,
      last: groups.length ? { ...groups.at(-1) } : null,
      groups: groups.map(group => ({ ...group })),
      empirical: {
        varianceDifference: modes ? sumDifferenceSquared / modes - mean * mean : 0,
        covarianceAB: modes ? sumAB / modes - totalA * totalB / (modes * modes) : 0,
      },
    };
  }

  function sampleGroup(size = RECEIVER_GROUP_SIZE) {
    if (!Number.isSafeInteger(size) || size < 1 || size > 1000000) throw new RangeError('每组模式数必须是1到1000000的整数');
    if (!Number.isSafeInteger(modes + size)) throw new RangeError('累计模式数超出可精确表示范围');
    let a = 0, b = 0;
    for (let index = 0; index < size; index++) {
      const z1 = circularGaussian(fields), z2 = circularGaussian(fields), z3 = circularGaussian(fields);
      const idler = p.paired ? z1 : z3;
      const cRe = sharedScale * z1[0] + backgroundScale * z2[0];
      const cIm = sharedScale * z1[1] + backgroundScale * z2[1];
      const iRe = sourceScale * idler[0], iIm = sourceScale * idler[1];
      const energyA = ((cRe + iRe) ** 2 + (cIm + iIm) ** 2) / 2;
      const energyB = ((cRe - iRe) ** 2 + (cIm - iIm) ** 2) / 2;
      const countA = poisson(energyA, detectorA), countB = poisson(energyB, detectorB);
      a += countA; b += countB;
      sumDifferenceSquared += (countA - countB) ** 2;
      sumAB += countA * countB;
    }
    modes += size; totalA += a; totalB += b;
    groups.push({ index: groups.length + 1, modes: size, a, b, difference: a - b,
      mean: (a - b) / size, cumulativeMean: (totalA - totalB) / modes });
    return getSnapshot();
  }

  return { sampleGroup, getSnapshot };
}
