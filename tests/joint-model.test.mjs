import test from 'node:test';
import assert from 'node:assert/strict';
import { createJointReceiver, receiverTheory, RECEIVER_GROUP_SIZE } from '../dist/joint-model.js';

const close = (actual, expected, tolerance) => assert.ok(Math.abs(actual - expected) <= tolerance,
  `${actual} 应在 ${expected} ± ${tolerance} 内`);

test('计数差的解析矩保留真空噪声、热背景和两出口协方差', () => {
  for (const noise of [0, .4, 1]) {
    const nb = .5 + 9.5 * noise;
    const absent = receiverTheory({ noise });
    const present = receiverTheory({ noise, targetPresent: true });
    const mismatched = receiverTheory({ noise, targetPresent: true, paired: false });
    close(absent.mean, 0, 1e-12);
    close(present.mean, .1449137674618944, 1e-12);
    close(mismatched.mean, 0, 1e-12);
    close(absent.variance, 1.1 * nb + 1.15, 1e-12);
    close(present.variance, 1.1 * nb + 1.166, 1e-12);
    close(mismatched.variance, 1.1 * nb + 1.1555, 1e-12);
  }
});

test('实际出口计数的均值、差值方差和协方差符合独立解析结果', () => {
  for (const settings of [
    { noise: 0, targetPresent: false },
    { noise: 1, targetPresent: false },
    { noise: 1, targetPresent: true },
    { noise: 1, targetPresent: true, paired: false },
  ]) {
    const theory = receiverTheory(settings);
    const snapshot = createJointReceiver({ ...settings, seed: 876123 }).sampleGroup(250000);
    close(snapshot.mean, theory.mean, 6 * Math.sqrt(theory.variance / snapshot.modes));
    close(snapshot.empirical.varianceDifference, theory.variance, theory.variance * .04);
    close(snapshot.empirical.covarianceAB, theory.covarianceAB, theory.covarianceAB * .05);
    close(snapshot.totalA / snapshot.modes, theory.meanA, .04);
    close(snapshot.totalB / snapshot.modes, theory.meanB, .04);
  }
});

test('分组不改变抽样结果，每个出口为非负整数且累计差值可追溯', () => {
  const options = { noise: .7, targetPresent: true, seed: 456 };
  const split = createJointReceiver(options);
  const first = split.sampleGroup();
  assert.equal(first.modes, RECEIVER_GROUP_SIZE);
  const second = split.sampleGroup();
  const whole = createJointReceiver(options).sampleGroup(2 * RECEIVER_GROUP_SIZE);
  assert.equal(second.totalA, whole.totalA);
  assert.equal(second.totalB, whole.totalB);
  assert.equal(second.totalDifference, second.groups.reduce((sum, group) => sum + group.difference, 0));
  for (const group of second.groups) {
    assert.ok(Number.isSafeInteger(group.a) && group.a >= 0);
    assert.ok(Number.isSafeInteger(group.b) && group.b >= 0);
    assert.equal(group.difference, group.a - group.b);
  }
  first.groups[0].a = -1;
  first.last.a = -1;
  assert.equal(split.getSnapshot().groups[0].a, second.groups[0].a);
});

test('初始读数为空，错误配对保留单路亮度但消除平均交叉项', () => {
  const empty = createJointReceiver().getSnapshot();
  assert.equal(empty.last, null);
  assert.equal(empty.modes, 0);
  const good = receiverTheory({ targetPresent: true });
  const wrong = receiverTheory({ targetPresent: true, paired: false });
  close(good.meanA + good.meanB, wrong.meanA + wrong.meanB, 1e-12);
  close(wrong.meanA, wrong.meanB, 1e-12);
  assert.ok(good.mean > wrong.mean);
});

test('拒绝无效参数与模式数', () => {
  for (const noise of [NaN, Infinity, -.1, 1.1]) assert.throws(() => createJointReceiver({ noise }));
  assert.throws(() => createJointReceiver({ paired: 'yes' }));
  assert.throws(() => createJointReceiver({ targetPresent: 1 }));
  assert.throws(() => createJointReceiver({ seed: NaN }));
  for (const size of [0, -1, .5, Infinity, 1000001]) assert.throws(() => createJointReceiver().sampleGroup(size));
});
