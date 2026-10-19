import test from 'node:test';
import assert from 'node:assert/strict';
import {
  samplePhotonPair,
  evaluateLocalPlan,
  sampleBellRounds,
  bellSettings,
  quantumWinProbability,
  classicalWinLimit,
} from '../dist/entanglement-model.js';

const near = (actual, expected, tolerance) => {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${actual} differs from ${expected} by more than ${tolerance}`);
};

test('理想贝尔态同方向必同、正交方向必反，单路结果仍会变化', () => {
  const observed = new Set();
  for (let seed = 0; seed < 512; seed += 1) {
    const same = samplePhotonPair({ angleA: 0, angleB: 0, seed });
    const opposite = samplePhotonPair({ angleA: 0, angleB: 90, seed });
    assert.equal(same.a, same.b);
    assert.equal(same.probabilitySame, 1);
    assert.equal(opposite.a, 1 - opposite.b);
    assert.equal(opposite.probabilitySame, 0);
    observed.add(same.a);
  }
  assert.deepEqual([...observed].sort(), [0, 1]);
});

test('45度差时四种结果都出现且近似均匀，而非始终对应', () => {
  const counts = [0, 0, 0, 0];
  const trials = 30000;
  for (let seed = 0; seed < trials; seed += 1) {
    const { a, b } = samplePhotonPair({ angleA: 0, angleB: 45, seed });
    counts[2 * a + b] += 1;
  }
  for (const count of counts) near(count / trials, 0.25, 0.015);
});

test('一般角度与直接计算贝尔态投影振幅一致', () => {
  const angleA = 17;
  const angleB = -31;
  const a = angleA * Math.PI / 180;
  const b = angleB * Math.PI / 180;
  // Born rule from projecting (HH + VV)/sqrt(2), independently of the sampler.
  const amplitude00 = (Math.cos(a) * Math.cos(b) + Math.sin(a) * Math.sin(b)) / Math.SQRT2;
  const amplitude01 = (-Math.cos(a) * Math.sin(b) + Math.sin(a) * Math.cos(b)) / Math.SQRT2;
  const expected = [amplitude00 ** 2, amplitude01 ** 2, amplitude01 ** 2, amplitude00 ** 2];
  const counts = [0, 0, 0, 0];
  const trials = 40000;
  for (let seed = 40000; seed < 40000 + trials; seed += 1) {
    const result = samplePhotonPair({ angleA, angleB, seed });
    counts[result.a * 2 + result.b] += 1;
  }
  counts.forEach((count, index) => near(count / trials, expected[index], 0.012));
});

test('偏振角以180度为周期，输入有限角度时输出有效概率', () => {
  for (const angleB of [-31, 0, 45, 90, 765]) {
    const ordinary = samplePhotonPair({ angleA: 17, angleB, seed: 99 });
    const shifted = samplePhotonPair({ angleA: 377, angleB: angleB - 540, seed: 99 });
    near(ordinary.probabilitySame, shifted.probabilitySame, 1e-12);
    assert.equal(ordinary.a, shifted.a);
    assert.equal(ordinary.b, shifted.b);
  }
  const extreme = samplePhotonPair({ angleA: Number.MAX_VALUE, angleB: -Number.MAX_VALUE });
  assert.ok(Number.isFinite(extreme.probabilitySame));
  assert.ok(extreme.probabilitySame >= 0 && extreme.probabilitySame <= 1);
});

test('穷举全部16个本地暗号，没有任何一个通过四种问题组合', () => {
  const totals = new Map();
  for (let mask = 0; mask < 16; mask += 1) {
    const plan = [0, 1, 2, 3].map(index => (mask >> index) & 1);
    const result = evaluateLocalPlan(plan);
    assert.equal(result.cases.length, 4);
    assert.equal(new Set(result.cases.map(c => `${c.x}${c.y}`)).size, 4);
    assert.ok(result.wins <= 3);
    assert.equal(result.winRate, result.wins / 4);
    totals.set(result.wins, (totals.get(result.wins) || 0) + 1);
    // Each answer must depend on its own question only.
    for (const side of [0, 1]) {
      const localA = result.cases.filter(c => c.x === side).map(c => c.a);
      const localB = result.cases.filter(c => c.y === side).map(c => c.b);
      assert.equal(new Set(localA).size, 1);
      assert.equal(new Set(localB).size, 1);
    }
  }
  assert.equal(totals.get(3), 8);
  assert.equal(totals.get(1), 8);
  assert.equal(classicalWinLimit, 0.75);
  assert.equal(evaluateLocalPlan([0, 0, 0, 0]).winRate, classicalWinLimit);
});

test('本地暗号遵守三种相同、双1不同的规则，并隔离调用者数据', () => {
  const plan = [0, 1, 1, 0];
  const result = evaluateLocalPlan(plan);
  assert.deepEqual(result.cases.map(c => c.requiredSame), [true, true, true, false]);
  assert.deepEqual(result.cases.map(c => c.win), [false, true, true, true]);
  plan[0] = 1;
  assert.equal(result.plan[0], 0);
});

test('多轮抽样可重现，轮数与真实胜负记录相符，并保留随机波动', () => {
  const options = { rounds: 160, seed: 1234 };
  const result = sampleBellRounds(options);
  assert.deepEqual(result, sampleBellRounds(options));
  assert.notDeepEqual(result.rounds, sampleBellRounds({ ...options, seed: 1235 }).rounds);
  assert.equal(result.total, 160);
  assert.equal(result.rounds.length, 160);
  assert.equal(result.wins, result.rounds.filter(round => round.win).length);
  assert.equal(result.winRate, result.wins / 160);
  const scores = new Set();
  for (let seed = 0; seed < 20; seed += 1) scores.add(sampleBellRounds({ rounds: 160, seed }).wins);
  assert.ok(scores.size > 1, 'the display must not force every run to a preset percentage');
  for (const round of result.rounds) {
    assert.equal(round.angleA, bellSettings.a[round.x]);
    assert.equal(round.angleB, bellSettings.b[round.y]);
    assert.equal(round.win, (round.a !== round.b) === (round.x === 1 && round.y === 1));
    assert.deepEqual(Object.keys(round).sort(), ['x', 'y', 'angleA', 'angleB', 'a', 'b', 'win'].sort());
  }
});

test('随机问题近似均匀独立；各测法组合中单路各半且量子成功率符合理论', () => {
  const result = sampleBellRounds({ rounds: 100000, seed: 971831 });
  const groups = Array.from({ length: 4 }, () => ({ total: 0, aOn: 0, bOn: 0, wins: 0 }));
  for (const round of result.rounds) {
    const group = groups[2 * round.x + round.y];
    group.total += 1;
    group.aOn += round.a;
    group.bOn += round.b;
    group.wins += Number(round.win);
  }
  const expectedWinRate = Math.cos(Math.PI / 8) ** 2;
  near(quantumWinProbability, expectedWinRate, 1e-12);
  near(result.winRate, expectedWinRate, 0.006);
  for (const group of groups) {
    near(group.total / result.total, 0.25, 0.01);
    near(group.aOn / group.total, 0.5, 0.015);
    near(group.bOn / group.total, 0.5, 0.015);
    near(group.wins / group.total, expectedWinRate, 0.015);
  }
  // A local observer cannot infer which measurement the remote side chose.
  for (const x of [0, 1]) {
    const left = groups[x * 2];
    const right = groups[x * 2 + 1];
    near(left.aOn / left.total, right.aOn / right.total, 0.02);
  }
  for (const y of [0, 1]) {
    const left = groups[y];
    const right = groups[2 + y];
    near(left.bOn / left.total, right.bOn / right.total, 0.02);
  }
});

test('空批次有定义，无效角度、计数或暗号会明确报错', () => {
  const empty = sampleBellRounds({ rounds: 0 });
  assert.deepEqual(empty.rounds, []);
  assert.equal(empty.wins, 0);
  assert.equal(empty.total, 0);
  assert.equal(empty.winRate, 0);
  for (const value of [NaN, Infinity, '45']) {
    assert.throws(() => samplePhotonPair({ angleA: value }), TypeError);
    assert.throws(() => samplePhotonPair({ angleB: value }), TypeError);
    assert.throws(() => samplePhotonPair({ seed: value }), TypeError);
  }
  for (const rounds of [-1, 1.5, NaN, Infinity]) {
    assert.throws(() => sampleBellRounds({ rounds }), RangeError);
  }
  for (const plan of [null, [], new Array(4), [0, 0, 0], [0, 0, 0, 2], [false, 0, 0, 0]]) {
    assert.throws(() => evaluateLocalPlan(plan), TypeError);
  }
});
