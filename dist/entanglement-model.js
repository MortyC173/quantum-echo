/**
 * Ideal polarization Bell-pair teaching model, separate from the microwave
 * quantum-illumination model in science.js. All angles below are in degrees.
 * A single computer samples a joint distribution; this is not a physical Bell
 * experiment and the implementation is not a model of communication between
 * spatially separated detectors.
 */

export const bellSettings = Object.freeze({
  a: Object.freeze([0, 45]),
  b: Object.freeze([22.5, -22.5]),
});

export const quantumWinProbability = (2 + Math.SQRT2) / 4;
export const classicalWinLimit = 3 / 4;

export const modelNote = '这是理想偏振纠缠光的概率演示。网页用普通计算机抽样，不能证明产生了真实纠缠。同向测量结果相同，也可能来自普通配对；需要比较不同测法下的完整统计关联。';

export const modelDetails = '演示选择理想的两光子贝尔态 |Φ+⟩ = (|HH⟩ + |VV⟩)/√2，角度单位为度，0 与 1 表示偏振测量的两个输出端口。两路分别使用角度 α、β 时，相同结果的概率为 cos²(α−β)：P(00)=P(11)=cos²(α−β)/2，P(01)=P(10)=sin²(α−β)/2。每一路单独的两种结果各占一半，不随另一侧的测量角度改变，因此这些关联不能用于传递超光速消息。每轮制备新的一对，确定测法后测量一次；单轮结果和同向测量的相同结果都不足以区别纠缠与普通配对。四条检查线对应的 CHSH 挑战中，两边独立、等概率选择问题 x、y，各自只依据本地问题回答，题目与事先共享的资源独立，出题后双方不能通信。只有 x=y=1 时要求两边结果不同，其余组合要求相同。预先写定的四个本地答案最多满足四种组合中的三种，共享随机策略也不能提高平均成功概率的 3/4 上限。理想纠缠方案取 A=[0°,45°]、B=[22.5°,−22.5°]，每种问题组合的成功概率均为 cos²(π/8)≈85.36%；有限轮次的实际比例会波动，短实验超过75%不单独构成科学结论。网页直接采样这组联合概率，既不模拟真实空间分离，也不进行实验检验。偏振贝尔态示例用于解释一类纠缠关联；微波量子照明采用另一类信号与参考资源及联合接收，不能把本挑战的角度、75%或85%当作雷达参数或性能。';

export const entanglementSources = [
  {
    title: 'Clauser、Horne、Shimony 与 Holt（1969）：Proposed Experiment to Test Local Hidden-Variable Theories',
    url: 'https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.23.880',
    note: '原始论文：不同测量设置下的关联与局域预定结果的限制；本地性和设置独立性是关键条件。',
  },
  {
    title: 'Cirel’son（1980）：Quantum generalizations of Bell’s inequality',
    url: 'https://doi.org/10.1007/BF00417500',
    note: '量子关联上限的原始文献。量子关联也受到相应的理论上限约束。',
  },
  {
    title: 'IBM Quantum Learning：CHSH game',
    url: 'https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/entanglement-in-action/chsh-game',
    note: '官方教学推导：独立随机问题、禁止通信、经典 3/4 上限、贝尔态测量角度与理想量子成功概率。',
  },
];

export { entanglementSources as sources };

function finiteNumber(value, name) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} 必须是有限数值`);
  return value;
}

function randomGenerator(seed) {
  let value = finiteNumber(seed, 'seed') >>> 0;
  return () => {
    value = (value + 0x6D2B79F5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function sameProbability(angleA, angleB) {
  finiteNumber(angleA, 'angleA');
  finiteNumber(angleB, 'angleB');
  // Reduce each angle before subtraction so all finite inputs remain finite.
  const difference = ((angleA % 180) - (angleB % 180)) * Math.PI / 180;
  const probability = Math.cos(difference) ** 2;
  // Preserve the exact ideal 0° and 90° limits despite floating-point roundoff.
  if (probability < 1e-15) return 0;
  if (1 - probability < 1e-15) return 1;
  return probability;
}

function sampleJoint(angleA, angleB, random) {
  const probabilitySame = sameProbability(angleA, angleB);
  const a = random() < 0.5 ? 0 : 1;
  const same = random() < probabilitySame;
  const b = same ? a : 1 - a;
  return { angleA, angleB, a, b, same, probabilitySame };
}

/**
 * Sample a newly prepared pair measured once at the supplied angles in degrees.
 * Returns { angleA, angleB, a, b, same, probabilitySame }, with a,b in {0,1}.
 * UI: call at the first measurement, cache this result and reveal its two local
 * outcomes separately. A changed measurement setup should use a fresh pair.
 */
export function samplePhotonPair({ angleA = 0, angleB = 0, seed = 1 } = {}) {
  return sampleJoint(angleA, angleB, randomGenerator(seed));
}

/**
 * Exhaustively score a fixed local plan [a0,a1,b0,b1] over all four question
 * combinations. This is not a finite-sample win rate: at most three can pass.
 */
export function evaluateLocalPlan(plan) {
  if (!Array.isArray(plan) || plan.length !== 4 || [0, 1, 2, 3].some(index => plan[index] !== 0 && plan[index] !== 1)) {
    throw new TypeError('plan 必须是四个 0 或 1：[a0,a1,b0,b1]');
  }
  const cases = [];
  for (const x of [0, 1]) {
    for (const y of [0, 1]) {
      const a = plan[x];
      const b = plan[2 + y];
      const requiredSame = !(x === 1 && y === 1);
      cases.push({ x, y, a, b, requiredSame, win: (a === b) === requiredSame });
    }
  }
  const wins = cases.filter(item => item.win).length;
  return { plan: plan.slice(), cases, wins, total: 4, winRate: wins / 4 };
}

/**
 * Independent uniformly random local questions followed by ideal Bell-pair
 * outcomes. Every round prepares a new pair. Outcomes are not overwritten to
 * guarantee an 85% score. Results expose no counterfactual answers for settings
 * that were not chosen in that round.
 */
export function sampleBellRounds({ rounds = 160, seed = 1 } = {}) {
  if (!Number.isSafeInteger(rounds) || rounds < 0) {
    throw new RangeError('rounds 必须是非负安全整数');
  }
  const random = randomGenerator(seed);
  const history = [];
  let wins = 0;
  for (let index = 0; index < rounds; index += 1) {
    const x = random() < 0.5 ? 0 : 1;
    const y = random() < 0.5 ? 0 : 1;
    const { a, b, angleA, angleB } = sampleJoint(bellSettings.a[x], bellSettings.b[y], random);
    const win = (a !== b) === (x === 1 && y === 1);
    history.push({ x, y, angleA, angleB, a, b, win });
    if (win) wins += 1;
  }
  return {
    rounds: history,
    wins,
    total: rounds,
    winRate: rounds ? wins / rounds : 0,
    expectedWinRate: quantumWinProbability,
  };
}
