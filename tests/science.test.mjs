import test from 'node:test';
import assert from 'node:assert/strict';
import { createExperiment, runComparison } from '../dist/science.js';

// These tests establish the behavior of the declared teaching model only.
// They do not validate physical quantum-radar performance or published gains.
const closeTo = (actual, expected, tolerance = 1e-10) => {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`);
};

const gaussianDensity = (value, mean) =>
  Math.exp(-((value - mean) ** 2) / 2) / Math.sqrt(2 * Math.PI);

// Independent normal-CDF approximation, used to check Monte Carlo calibration.
function normalCdf(value) {
  const magnitude = Math.abs(value);
  const t = 1 / (1 + 0.2316419 * magnitude);
  const polynomial = t * (0.319381530 + t * (-0.356563782
    + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const upperTail = Math.exp(-(magnitude ** 2) / 2) / Math.sqrt(2 * Math.PI) * polynomial;
  return value >= 0 ? 1 - upperTail : upperTail;
}

test('累计证据等于两种高斯假设的联合密度之比的对数', () => {
  for (const mode of ['quantum', 'classical']) {
    for (const targetPresent of [false, true]) {
      const experiment = createExperiment({ mode, targetPresent, seed: 8201 });
      const snapshot = experiment.sample(37);
      const independentLogRatio = snapshot.readings.reduce((total, value) =>
        total + Math.log(gaussianDensity(value, snapshot.d) / gaussianDensity(value, 0)), 0);
      closeTo(snapshot.llr, independentLogRatio);
      assert.equal(experiment.decide(), independentLogRatio > 0);
      closeTo(snapshot.mean,
        snapshot.readings.reduce((total, value) => total + value, 0) / snapshot.samples);
    }
  }
});

test('同一种子可以重现实验，分批与一次采样相同，空批次不消耗随机数', () => {
  const options = { mode: 'quantum', noise: 0.8, targetPresent: true, seed: 73901 };
  const continuous = createExperiment(options);
  const partitioned = createExperiment(options);
  const initial = partitioned.getSnapshot();
  assert.deepEqual(partitioned.sample(0), initial);
  partitioned.sample();
  partitioned.sample(5);
  partitioned.sample(0);
  partitioned.sample(17);
  assert.deepEqual(partitioned.sample(41), continuous.sample(64));
  assert.notDeepEqual(continuous.getSnapshot().readings,
    createExperiment({ ...options, seed: 73902 }).sample(64).readings);
});

test('界面修改取得的快照不会改变实验状态或未来样本', () => {
  const experiment = createExperiment({ targetPresent: true, seed: 18 });
  const control = createExperiment({ targetPresent: true, seed: 18 });
  const snapshot = experiment.sample(9);
  control.sample(9);
  snapshot.readings.fill(1e9);
  snapshot.llr = -1e9;
  snapshot.samples = 0;
  assert.deepEqual(experiment.getSnapshot(), control.getSnapshot());
  assert.deepEqual(experiment.sample(7), control.sample(7));
});

test('观测符合单位标准差高斯模型，目标通过均值偏移进入数据', () => {
  const options = { seed: 731, mode: 'quantum', noise: 0.6 };
  const absent = createExperiment({ ...options, targetPresent: false }).sample(20000);
  const present = createExperiment({ ...options, targetPresent: true }).sample(20000);
  const variance = absent.readings.reduce((sum, value) =>
    sum + (value - absent.mean) ** 2, 0) / absent.samples;
  closeTo(absent.mean, 0, 0.025);
  closeTo(variance, 1, 0.035);
  closeTo(present.mean - absent.mean, present.d);
  for (let index = 0; index < absent.samples; index += 1) {
    closeTo(present.readings[index] - absent.readings[index], present.d);
  }
});

test('端点参数产生有限结果，完全错配时两种目标状态不可分', () => {
  for (const mode of ['quantum', 'classical']) {
    for (const noise of [0, 1]) {
      for (const retention of [0, 1]) {
        for (const alignment of [0, 1]) {
          const options = { mode, noise, retention, alignment, seed: 93 };
          const present = createExperiment({ ...options, targetPresent: true });
          const initial = present.getSnapshot();
          assert.equal(initial.last, null);
          assert.equal(initial.samples, 0);
          assert.equal(initial.llr, 0);
          assert.equal(present.decide(), false);
          const snapshot = present.sample(32);
          assert.ok([snapshot.mean, snapshot.llr, snapshot.d, ...snapshot.readings].every(Number.isFinite));
          if (alignment === 0) {
            const absent = createExperiment({ ...options, targetPresent: false }).sample(32);
            assert.deepEqual(snapshot.readings, absent.readings);
            assert.equal(snapshot.llr, 0);
            assert.equal(present.decide(), false);
          }
        }
      }
    }
  }
});

test('界面越界值被限制在参数范围内，无效计数与非有限数值被拒绝', () => {
  const bounded = createExperiment({ noise: 0, retention: 1, alignment: 0, seed: 4 }).sample(8);
  const outOfRange = createExperiment({ noise: -10, retention: 10, alignment: -10, seed: 4 }).sample(8);
  assert.deepEqual(outOfRange, bounded);
  for (const field of ['noise', 'retention', 'alignment', 'seed']) {
    for (const value of [NaN, Infinity, -Infinity]) {
      assert.throws(() => createExperiment({ [field]: value }), TypeError);
    }
  }
  for (const batch of [-1, 0.5, Infinity, NaN]) {
    assert.throws(() => createExperiment().sample(batch), RangeError);
  }
  assert.throws(() => createExperiment({ mode: 'unknown' }), TypeError);
  assert.throws(() => createExperiment({ targetPresent: 'false' }), TypeError);
  assert.throws(() => runComparison({ trials: 1 }), RangeError);
  assert.throws(() => runComparison({ samples: -1 }), RangeError);
});

test('对照可重复，两种方法使用同一类别构成，错误次数各有正确分母', () => {
  for (const trials of [400, 401]) {
    const options = { trials, samples: 24, seed: 42 };
    const comparison = runComparison(options);
    assert.deepEqual(comparison, runComparison(options));
    assert.equal(comparison.quantum.nAbsent, comparison.classical.nAbsent);
    assert.equal(comparison.quantum.nPresent, comparison.classical.nPresent);
    for (const result of Object.values(comparison)) {
      assert.equal(result.total, trials);
      assert.equal(result.nAbsent + result.nPresent, trials);
      assert.ok(Math.abs(result.nAbsent - result.nPresent) <= 1);
      assert.equal(result.correct + result.falseAlarms + result.misses, trials);
      assert.equal(result.accuracy, result.correct / trials);
      assert.ok(result.accuracy >= 0 && result.accuracy <= 1);
      assert.ok(Number.isInteger(result.falseAlarms) && result.falseAlarms <= result.nAbsent);
      assert.ok(Number.isInteger(result.misses) && result.misses <= result.nPresent);
    }
  }
});

test('没有信息时按约定判断无目标，误报和漏检不会混用分母', () => {
  for (const options of [{ samples: 0 }, { alignment: 0, samples: 24 }]) {
    const comparison = runComparison({ ...options, trials: 401, seed: 82 });
    assert.deepEqual(comparison.quantum, comparison.classical);
    for (const result of Object.values(comparison)) {
      assert.equal(result.falseAlarms, 0);
      assert.equal(result.misses, result.nPresent);
      assert.equal(result.correct, result.nAbsent);
      assert.equal(result.accuracy, result.nAbsent / result.total);
    }
  }
});

test('批量判决接近高斯二元检测的理论正确率与两类错误率', () => {
  const options = { noise: 0.6, retention: 1, alignment: 1, samples: 24, trials: 5000, seed: 125 };
  const comparison = runComparison(options);
  for (const mode of ['quantum', 'classical']) {
    const d = createExperiment({ ...options, mode }).getSnapshot().d;
    const expectedAccuracy = normalCdf(d * Math.sqrt(options.samples) / 2);
    const result = comparison[mode];
    closeTo(result.accuracy, expectedAccuracy, 0.035);
    closeTo(result.falseAlarms / result.nAbsent, 1 - expectedAccuracy, 0.05);
    closeTo(result.misses / result.nPresent, 1 - expectedAccuracy, 0.05);
  }
});

test('教学优势有条件：参考保存变差可以消除优势，经典对照保持不变', () => {
  const options = { trials: 5000, samples: 24, noise: 0.6, seed: 123 };
  const retained = runComparison({ ...options, retention: 1 });
  const lost = runComparison({ ...options, retention: 0 });
  assert.ok(retained.quantum.accuracy > retained.classical.accuracy + 0.02);
  assert.ok(lost.quantum.accuracy < lost.classical.accuracy - 0.02);
  assert.deepEqual(retained.classical, lost.classical);
  assert.ok(retained.quantum.falseAlarms + retained.quantum.misses > 0,
    'ideal reference must not create a perfect-answer mode');
});

test('噪声或错配降低绝对表现，更多样本提高平均判别能力', () => {
  const options = { trials: 4000, samples: 24, seed: 173 };
  const quiet = runComparison({ ...options, noise: 0.1 });
  const noisy = runComparison({ ...options, noise: 1 });
  const misaligned = runComparison({ ...options, noise: 0.1, alignment: 0.25 });
  const fewSamples = runComparison({ ...options, noise: 0.6, samples: 1 });
  const manySamples = runComparison({ ...options, noise: 0.6, samples: 64 });
  for (const mode of ['quantum', 'classical']) {
    assert.ok(quiet[mode].accuracy > noisy[mode].accuracy + 0.05);
    assert.ok(quiet[mode].accuracy > misaligned[mode].accuracy + 0.05);
    assert.ok(manySamples[mode].accuracy > fewSamples[mode].accuracy + 0.10);
  }
});
