/**
 * Quantum Echo — public-facing explanations and a deliberately simplified model.
 * The Gaussian model below is a teaching device, not a quantum-state simulation,
 * radar engineering model, or reproduction of any cited experiment.
 */

export const stages = [
  {
    id: 'source',
    title: '制备两路量子信号',
    kicker: '01 / 从源头建立联系',
    description: '实验从一对纠缠的模式开始：一路用于探测，一路留作参考。单独看任一路的测量结果，仍会遇到随机性。',
    instruction: '启动信号源，沿两条路径看看探测信号与参考信号分别去哪儿。',
    principle: '模式可以理解为光或微波的一种可区分的传播与振荡形式。源制备的是联合量子状态；画面中成对亮起的光点仅用于说明两路信号的来源。',
    actionLabel: '启动信号源',
    question: {
      prompt: '两路信号的联系在哪里建立？',
      options: ['在信号源制备联合量子状态时', '目标收到信号后才建立', '观察者猜中目标时建立'],
      correct: 0,
      explanation: '纠缠由源制备。后续探测利用两路系统的联合信息，单路测量结果仍有随机性。',
    },
  },
  {
    id: 'reference',
    title: '让参考留在接收端',
    kicker: '02 / 等待回波的伙伴',
    description: '探测信号出发，闲置模式作为参考保留下来，等待与回波共同测量。参考的损失会影响可用的联合信息。',
    instruction: '改变参考保留程度，观察参考路径和后续接收能力的变化。',
    principle: '“闲置”表示这一路不照射目标，它承担参考作用。保存或延迟参考需要实际设备，损耗是影响量子照明表现的重要条件。',
    actionLabel: '保存参考信号',
    question: {
      prompt: '保留参考信号是为了什么？',
      options: ['直接在本地显示远处目标', '等回波返回后参与联合测量', '把目标反射的能量变大'],
      correct: 1,
      explanation: '参考与回波一起进入接收过程。它本身不能告诉我们远处是否存在目标。',
    },
  },
  {
    id: 'signal',
    title: '发射与微弱回波',
    kicker: '03 / 让信号接触目标',
    description: '探测信号进入预定区域。存在目标时，部分信号可能反射回来；传播与反射损失让可收集的回波很弱。',
    instruction: '发出探测信号，观察去程、反射和回程。正式探测时，目标真值会被隐藏。',
    principle: '本实验的问题是“这片区域是否有目标”。目标存在时，接收数据包含微弱的目标贡献；目标不存在时，接收器仍可能收到背景噪声。',
    actionLabel: '发射探测信号',
    question: {
      prompt: '接收器记录到信号，就能确认存在目标吗？',
      options: ['能，所有记录都来自目标', '能，参考信号会提前给出答案', '还需要区分目标贡献与背景噪声'],
      correct: 2,
      explanation: '接收记录可能来自背景。判断目标存在，需要分析观测在“有目标”和“无目标”条件下的差异。',
    },
  },
  {
    id: 'noise',
    title: '让回波进入热噪声',
    kicker: '04 / 接收到的是混合信息',
    description: '环境中的热辐射形成背景，微弱回波混在其中。背景越强，两种目标状态通常越难区分。',
    instruction: '提高背景噪声，比较接收记录的变化，并记住当前噪声设置。',
    principle: '量子照明研究关注的一类条件是低亮度探测、较大损耗和强背景。量子方案的相对优势取决于条件；噪声增强仍会降低绝对探测表现。',
    actionLabel: '接收含噪回波',
    question: {
      prompt: '背景噪声增强，探测会怎样？',
      options: ['两种方案通常都会更难判断', '量子方案一定会更容易判断', '噪声本身就能指出目标位置'],
      correct: 0,
      explanation: '更强的背景会掩盖目标贡献。某些条件下的相对优势，不等于噪声越大越容易探测。',
    },
  },
  {
    id: 'alignment',
    title: '对齐回波与参考',
    kicker: '05 / 为联合测量做好准备',
    description: '接收端需要让相应的回波模式与参考模式正确匹配，例如对齐时间窗口，并按接收方案完成必要校准。',
    instruction: '移动对齐控制，使两条路径进入合适的接收窗口。观察错配怎样损失可用信息。',
    principle: '匹配让接收器处理对应的模式。即使匹配正确，回波仍然含噪；正确对齐也不等于已经发现目标。这里将多种匹配条件合并为一个教学参数。',
    actionLabel: '完成匹配校准',
    question: {
      prompt: '正确匹配回波与参考意味着什么？',
      options: ['背景噪声已被全部消除', '接收器能够处理对应模式', '目标已经被确认存在'],
      correct: 1,
      explanation: '匹配是有效接收的条件。目标判决仍需要后续测量与统计。',
    },
  },
  {
    id: 'receiver',
    title: '共同测量两路系统',
    kicker: '06 / 从联合信息提取证据',
    description: '含噪回波和保留参考一起进入接收器。接收方案把联合量子状态中的可用信息转化为测量结果。',
    instruction: '选择接收方式，观察回波与参考怎样汇入接收器，获得第一份探测记录。',
    principle: '量子照明的优势取决于源、环境、参考保存和接收器。即使传播后的纠缠已被破坏，特定条件下仍可保留检测优势。经典方案也可以利用相关信息。',
    actionLabel: '启动联合接收',
    question: {
      prompt: '联合测量主要做什么？',
      options: ['逐个找回所有丢失的粒子', '保证每次都输出正确答案', '把回波与参考中的信息转为探测证据'],
      correct: 2,
      explanation: '联合接收提供与目标判决有关的测量结果，具体优势取决于物理条件和实现方式。一次结果仍可能误导判断。',
    },
  },
  {
    id: 'sampling',
    title: '重复采样，积累证据',
    kicker: '07 / 让随机结果形成统计规律',
    description: '一次读数可能偏高，也可能偏低。多次观测可以积累区分两种目标状态的信息，但需要额外资源。',
    instruction: '每次追加一批样本，观察累计证据。决定何时停止采样，准备作出判断。',
    principle: '教学模型累加“对数似然比”：正值支持有目标，负值支持无目标。它比较两种假设对数据的解释程度，数值本身不是目标存在概率。',
    actionLabel: '再采集一批',
    question: {
      prompt: '为什么要重复采样？',
      options: ['积累统计证据，减少偶然波动的影响', '确保所有读数最终完全一样', '用采样次数代替目标证据'],
      correct: 0,
      explanation: '独立观测能增加平均可用信息。具体一次追加采样仍可能让证据暂时向另一方向移动。',
    },
  },
  {
    id: 'decision',
    title: '作出判断，再检验表现',
    kicker: '08 / 用多次试验评价方法',
    description: '选择有目标或无目标，再揭晓真值。无目标却报告发现叫误报；有目标却报告没有叫漏检。',
    instruction: '提交判断，然后查看相同教学资源条件下，两种方案多次试验的正确率、误报与漏检。',
    principle: '这里设两种目标状态等可能、两类错误代价相同，以累计证据零点作为阈值。阈值改变会影响误报与漏检的取舍。公平比较还需统一资源和测试条件。',
    actionLabel: '揭晓并比较',
    question: {
      prompt: '怎样比较两种探测方案更合理？',
      options: ['只展示各自表现最好的一次', '统一条件与资源，并统计多次试验的错误', '给量子方案更多样本再比较'],
      correct: 1,
      explanation: '比较需要相同的任务、资源与统计口径。本页数值来自简化教学模型，不代表真实雷达的物理性能。',
    },
  },
];

export const sources = [
  {
    title: 'Tan 等（2008）：Quantum Illumination with Gaussian States',
    url: 'https://arxiv.org/abs/0810.0534',
    note: '理论研究：高斯态量子照明在特定低亮度、高损耗、强噪声条件下的目标检测优势。',
  },
  {
    title: 'Guha 与 Erkmen（2009）：Gaussian-state quantum-illumination receivers for target detection',
    url: 'https://arxiv.org/abs/0911.0950',
    note: '接收器研究：目标检测表现与具体联合接收方案有关。',
  },
  {
    title: 'Assouly 等（2023）：Quantum advantage in microwave quantum radar',
    url: 'https://www.nature.com/articles/s41567-023-02113-4',
    note: '微波实验：在受控实验条件下展示量子优势，不能直接外推为实际部署能力。',
  },
];

export const modelNote = '本页使用简化的高斯统计教学模型，帮助理解噪声、参考质量、匹配和重复采样对判决的影响。参数是为交互体验选取的任意教学值；数值不是物理性能预测，也不是量子态仿真或论文实验复现。';

export const modelDetails = '每次独立观测：无目标时 X 服从均值 0、标准差 1 的高斯分布；有目标时均值为 d、标准差仍为 1。令 n 为噪声、r 为参考保留程度、a 为匹配程度，均限制在 0 至 1。经典教学方案 d = 0.70 × a / (1 + 1.80 × n)；量子教学方案 d = d经典 × (0.70 + 0.50 × r × a)。这些系数是任意教学参数，用于呈现有条件的分布可分性差异；不对应论文中的能量、距离、接收器或性能增益。每次读数 x 增加的对数似然比为 d × x − d² / 2，累计值大于 0 时判断有目标。该规则假设两类目标状态等可能、错误代价相同；恰为 0 时约定判断无目标。对照使用相同样本数、相同噪声与匹配设置、相同目标序列及配对随机数，参考保留参数只影响量子教学方案；总试验数为奇数时，两类目标数量相差一次。误报和漏检均报告次数，并分别给出无目标和有目标试验数作为分母。这里的同资源指教学模型中相同采样预算，真实物理比较还需要明确发射能量等条件。';

function unitInterval(value, label) {
  if (!Number.isFinite(value)) throw new TypeError(`${label} 必须是有限数值`);
  return Math.min(1, Math.max(0, value));
}

function nonnegativeInteger(value, label, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new RangeError(`${label} 必须是大于或等于 ${minimum} 的安全整数`);
  }
  return value;
}

function seededRandom(seed) {
  if (!Number.isFinite(seed)) throw new TypeError('seed 必须是有限数值');
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function normalGenerator(random) {
  let spare = null;
  return () => {
    if (spare !== null) {
      const value = spare;
      spare = null;
      return value;
    }
    const radius = Math.sqrt(-2 * Math.log(1 - random()));
    const angle = 2 * Math.PI * random();
    spare = radius * Math.sin(angle);
    return radius * Math.cos(angle);
  };
}

/**
 * Returns { sample(batch=1), getSnapshot(), decide() }.
 * Snapshots contain numeric readings (a copy), last (number|null), mean, samples,
 * llr, d, mode, noise, retention, alignment, and targetPresent.
 * The caller must hide targetPresent in the challenge UI until revealing truth.
 */
export function createExperiment({
  noise = 0.6,
  retention = 1,
  alignment = 1,
  mode = 'quantum',
  targetPresent = false,
  seed = 1,
} = {}) {
  const n = unitInterval(noise, 'noise');
  const r = unitInterval(retention, 'retention');
  const a = unitInterval(alignment, 'alignment');
  if (mode !== 'quantum' && mode !== 'classical') {
    throw new TypeError('mode 必须是 quantum 或 classical');
  }
  if (typeof targetPresent !== 'boolean') throw new TypeError('targetPresent 必须是布尔值');

  const classicalD = (0.70 * a) / (1 + 1.80 * n);
  const d = mode === 'quantum' ? classicalD * (0.70 + 0.50 * r * a) : classicalD;
  const nextNormal = normalGenerator(seededRandom(seed));
  const readings = [];
  let sum = 0;
  let llr = 0;

  function getSnapshot() {
    return {
      mode,
      noise: n,
      retention: r,
      alignment: a,
      targetPresent,
      d,
      samples: readings.length,
      mean: readings.length ? sum / readings.length : 0,
      llr,
      readings: readings.slice(),
      last: readings.length ? readings[readings.length - 1] : null,
    };
  }

  function sample(batch = 1) {
    nonnegativeInteger(batch, 'batch');
    for (let index = 0; index < batch; index += 1) {
      const reading = nextNormal() + (targetPresent ? d : 0);
      readings.push(reading);
      sum += reading;
      llr += d * reading - (d * d) / 2;
    }
    return getSnapshot();
  }

  return { sample, getSnapshot, decide: () => llr > 0 };
}

/**
 * Paired Monte Carlo teaching comparison. Both modes receive the same sequence
 * of truths and the same standardized Gaussian noise at the same sample budget.
 * falseAlarms/misses are counts, not rates. The corresponding denominators are
 * nAbsent/nPresent. Accuracy lies in [0,1], not [0,100].
 */
export function runComparison({
  noise = 0.6,
  retention = 1,
  alignment = 1,
  trials = 400,
  samples = 24,
  seed = 1,
} = {}) {
  nonnegativeInteger(trials, 'trials', 2);
  nonnegativeInteger(samples, 'samples');
  const n = unitInterval(noise, 'noise');
  const r = unitInterval(retention, 'retention');
  const a = unitInterval(alignment, 'alignment');
  const random = seededRandom(seed);
  const truths = Array.from({ length: trials }, (_, index) => index < Math.floor(trials / 2));
  for (let index = truths.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [truths[index], truths[other]] = [truths[other], truths[index]];
  }

  const empty = () => ({
    accuracy: 0,
    falseAlarms: 0,
    misses: 0,
    total: trials,
    correct: 0,
    nAbsent: trials - Math.floor(trials / 2),
    nPresent: Math.floor(trials / 2),
  });
  const results = { quantum: empty(), classical: empty() };

  for (const targetPresent of truths) {
    const trialSeed = Math.floor(random() * 4294967296);
    for (const mode of ['quantum', 'classical']) {
      const experiment = createExperiment({ noise: n, retention: r, alignment: a, mode, targetPresent, seed: trialSeed });
      experiment.sample(samples);
      const prediction = experiment.decide();
      const result = results[mode];
      if (prediction === targetPresent) result.correct += 1;
      else if (prediction) result.falseAlarms += 1;
      else result.misses += 1;
    }
  }

  for (const result of Object.values(results)) result.accuracy = result.correct / trials;
  return results;
}
