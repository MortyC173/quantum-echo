// Pure presentation: drawings never encode a target or invent a result.
// All measured values and chart points come from the supplied model snapshot.
const finite = value => typeof value === 'number' && Number.isFinite(value);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const number = (value, fallback = 0) => finite(value) ? value : fallback;
const integer = value => finite(value) ? Math.round(value).toLocaleString('zh-CN') : '—';
const decimal = value => finite(value) ? (Math.abs(value) < .0005 ? '0.000' : value.toFixed(3)) : '—';
const signed = value => finite(value) ? `${value > 0 ? '+' : ''}${integer(value)}` : '—';
const escapeText = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const speck = (i, salt) => { const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return v - Math.floor(v); };
const phases = ['input', 'conjugated', 'mixed', 'read'];

function incoming(noise) {
  const n = clamp(number(noise), 0, 1);
  const dots = Array.from({ length: 12 + Math.round(n * 35) }, (_, i) => `<circle cx="${(10 + speck(i + 1, 1) * 194).toFixed(2)}" cy="${(8 + speck(i + 1, 2) * 46).toFixed(2)}" r="${(1 + speck(i + 1, 3) * 1.2).toFixed(2)}" fill="#849574" opacity=".4"/>`).join('');
  const points = Array.from({ length: 55 }, (_, i) => `${7 + i * 3.7},${(31 + (speck(i + 1, 7) - .5) * (10 + 30 * n)).toFixed(2)}`).join(' ');
  return `<svg viewBox="0 0 214 62" role="img" aria-label="收到的来波：信号和噪声混在一起；这幅示意不显示有无目标"><rect x="1" y="1" width="212" height="60" rx="16" fill="#edf1df" stroke="#d6e1c6"/>${dots}<polyline points="${points}" fill="none" stroke="#668153" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

// Identical artwork for either pairing and every measurement stage.
function reference() {
  return `<svg viewBox="0 0 214 62" role="img" aria-label="留在本地、尚未单独测量的参考光；波纹只是光路示意"><rect x="1" y="1" width="212" height="60" rx="16" fill="#f1eaf6" stroke="#ddd0e8"/><circle cx="32" cy="30" r="18" fill="#cfbae1"/><circle cx="27" cy="28" r="2" fill="#74568b"/><circle cx="37" cy="28" r="2" fill="#74568b"/><path d="M28 35q4 4 8 0" fill="none" stroke="#74568b" stroke-width="1.7" stroke-linecap="round"/><circle cx="26" cy="20" r="5" fill="#efe4fa" opacity=".65"/><path d="M63 31q9-17 18 0t18 0t18 0t18 0t18 0t18 0t18 0" fill="none" stroke="#a285ba" stroke-width="2.2" stroke-linecap="round"/></svg>`;
}

function waveform(x, y, width, amplitude, color, inverse = false) {
  const points = Array.from({ length: 36 }, (_, i) => `${(x + width * i / 35).toFixed(1)},${(y + Math.sin(i / 35 * Math.PI * 4) * amplitude * (inverse ? -1 : 1)).toFixed(1)}`).join(' ');
  return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
}

function lightPath(d, color, active, flow = false) {
  return `<path d="${d}" class="jl-optical-path ${active ? 'is-lit' : ''}" stroke="${color}"/>${flow ? `<path d="${d}" class="jl-travel" stroke="${color}"/>` : ''}`;
}

function opticalBench(phase) {
  const stage = phases.indexOf(phase);
  const adjusted = stage >= 1, mixed = stage >= 2, read = stage >= 3;
  return `<svg class="jl-optics" viewBox="0 0 360 312" role="img" aria-label="来波先调整相位，再与未先测量的参考光一起进入分束器；两路光在这里干涉，形成叠加和相减两个出口，最后由A和B探测器计数">
    <path d="M88 2V16" class="jl-optical-path is-lit" stroke="#87a65f"/>
    ${lightPath('M272 2V108H180V130', '#a78ac0', mixed, phase === 'mixed')}
    <g class="jl-adjuster ${adjusted ? 'is-active' : ''}"><rect x="27" y="18" width="122" height="57" rx="15"/><text x="88" y="42" text-anchor="middle" class="jl-svg-label">调整回波</text>${waveform(61, 59, 54, 4, '#7e9c58', true)}</g>
    ${lightPath('M88 77V153H158', '#87a65f', adjusted, phase === 'conjugated' || phase === 'mixed')}
    <g class="jl-input-wave ${adjusted ? 'is-active' : ''}">${waveform(95, 153, 53, 6, '#7f9d58')}</g>
    <g class="jl-input-wave ${mixed ? 'is-active' : ''}">${waveform(202, 108, 57, 6, '#a185b8')}</g>
    <g class="jl-beamsplitter ${mixed ? 'is-active' : ''}"><rect x="158" y="131" width="44" height="44" rx="8"/><path d="M161 172L199 134"/><circle cx="180" cy="153" r="8"/><circle class="jl-meeting-pulse" cx="180" cy="153" r="23"/></g>
    <g class="jl-output-wave ${mixed ? 'is-active' : ''}">${waveform(164, 150, 32, 4, '#76964f')}${waveform(164, 156, 32, 4, '#9470ad')}</g>
    <text x="180" y="93" text-anchor="middle" class="jl-svg-small">两路光在这里碰面</text>
    ${lightPath('M180 178V194Q180 205 166 205H88V251', '#80a05c', mixed, phase === 'mixed')}
    ${lightPath('M205 153H260Q272 153 272 167V251', '#a38ab8', mixed, phase === 'mixed')}
    <g class="jl-output-wave ${mixed ? 'is-active' : ''}">${waveform(100, 205, 57, 6, '#83a460')}${waveform(100, 205, 57, 3, '#a588bc')}${waveform(211, 153, 44, 6, '#83a460')}${waveform(211, 153, 44, 4, '#a588bc', true)}</g>
    <g class="jl-combination-label ${mixed ? 'is-active' : ''}"><text x="88" y="235" text-anchor="middle">＋ 叠加</text><text x="272" y="235" text-anchor="middle">− 相减</text></g>
    <g class="jl-detector ${read ? 'is-active' : ''}"><rect x="49" y="253" width="78" height="47" rx="15"/><path d="M65 270v12m8-17v17m8-8v8"/><text x="104" y="283" text-anchor="middle">A</text></g>
    <g class="jl-detector jl-detector-b ${read ? 'is-active' : ''}"><rect x="233" y="253" width="78" height="47" rx="15"/><path d="M249 270v12m8-17v17m8-8v8"/><text x="288" y="283" text-anchor="middle">B</text></g>
  </svg>`;
}

function soloBench(hasReading) {
  return `<svg class="jl-optics jl-solo-optics" viewBox="0 0 360 115" role="img" aria-label="${hasReading ? '只测收到的来波。' : '收到的来波已到达接收器。'}本地参考光的光路尚未接入">
    ${lightPath('M88 2V58', '#87a65f', true)}
    <path d="M272 2V23m0 22v13" class="jl-disconnected-path"/>
    <rect x="264" y="20" width="16" height="13" rx="4" fill="#cfb9df"/><path d="M268 33v5m8-5v5" stroke="#a88abb" stroke-width="2"/>
    <g class="jl-detector ${hasReading ? 'is-active' : ''}"><rect x="40" y="62" width="96" height="42" rx="14"/><text x="88" y="89" text-anchor="middle" class="jl-svg-label">${hasReading ? '直接计数' : '来波就位'}</text></g>
    <text x="272" y="86" text-anchor="middle" class="jl-svg-label jl-purple-label">尚未接入</text>
  </svg>`;
}

function measuredGroup(snapshot) {
  const last = snapshot?.last;
  return last && finite(last.a) && finite(last.b) && finite(last.difference) && finite(last.modes) && last.modes > 0 ? last : null;
}

function readout(snapshot, phase) {
  const last = phase === 'read' ? measuredGroup(snapshot) : null;
  const count = value => last ? integer(value) : '<span class="jl-waiting">等待测量</span>';
  const level = value => last ? `${clamp(value / Math.max(last.a, last.b, 1) * 100, 0, 100).toFixed(1)}%` : '0%';
  return `<section class="jl-readout ${last ? 'has-reading' : ''}" aria-label="两个出口的探测计数及其差值">
    <div class="jl-reading-caption"><strong>${last ? `第 ${integer(last.index)} 组 · 两个出口读数` : '最后才把光变成读数'}</strong><span>本组 ${integer(last?.modes || 1024)} 对 · 每次重新制备</span></div>
    <div class="jl-arithmetic" aria-live="polite" aria-atomic="true">
      <div class="jl-count"><span>A 出口</span><strong data-joint-count="a">${count(last?.a)}</strong><i class="jl-count-level" style="--jl-level:${level(last?.a)}" aria-hidden="true"></i></div><span class="jl-math-symbol" aria-hidden="true">−</span>
      <div class="jl-count jl-count-b"><span>B 出口</span><strong data-joint-count="b">${count(last?.b)}</strong><i class="jl-count-level" style="--jl-level:${level(last?.b)}" aria-hidden="true"></i></div><span class="jl-math-symbol" aria-hidden="true">=</span>
      <div class="jl-count jl-count-difference"><span>计数差</span><strong data-joint-count="difference">${last ? signed(last.difference) : '<span class="jl-waiting">等待测量</span>'}</strong><i class="jl-count-level" aria-hidden="true"></i></div>
    </div>
    <p class="jl-readout-note">${last ? '看的是两个出口相差多少。每一组都可能因噪声而上下波动。' : '先在光路中干涉，再测量 A、B；输入的两路光没有先被单独测量。'}</p>
  </section>`;
}

function accumulation(snapshot) {
  const groups = Array.isArray(snapshot?.groups) ? snapshot.groups.filter(group => finite(group.index) && finite(group.mean) && finite(group.cumulativeMean)) : [];
  if (!groups.length) return '';
  const maxMagnitude = Math.max(...groups.flatMap(group => [Math.abs(group.mean), Math.abs(group.cumulativeMean)]), .001) * 1.18;
  const left = 51, right = 344, top = 15, bottom = 143, center = (top + bottom) / 2;
  const x = i => groups.length === 1 ? (left + right) / 2 : left + (right - left) * i / (groups.length - 1);
  const y = value => center - value / maxMagnitude * (bottom - top) / 2;
  const points = key => groups.map((group, i) => `${x(i).toFixed(2)},${y(group[key]).toFixed(2)}`).join(' ');
  const label = value => Math.abs(value) >= 1 ? value.toFixed(1) : value.toFixed(3);
  return `<section class="jl-accumulation" aria-label="每组计数差和累计平均的变化">
    <div class="jl-chart-heading"><strong>多测几组，看看规律</strong><span>已测 ${integer(groups.length)} 组</span></div>
    <p>把计数差除以本组对数，再看多组平均值。</p>
    <div class="jl-chart-legend"><span class="jl-legend-group">每组差 / 对数</span><span class="jl-legend-mean">累计平均</span></div>
    <svg class="jl-history-chart" viewBox="0 0 360 176" role="img" aria-label="每组计数差除以对数的折线，以及累计平均折线。零线标示没有计数差的位置，图形不自动判定目标">
      <path d="M${left} ${top}H${right}M${left} ${bottom}H${right}" class="jl-chart-grid"/>
      <path d="M${left} ${center}H${right}" class="jl-zero-line"/>
      <text x="43" y="${top + 5}" text-anchor="end" class="jl-chart-tick">${label(maxMagnitude)}</text>
      <text x="43" y="${center + 5}" text-anchor="end" class="jl-chart-tick">0</text>
      <text x="43" y="${bottom + 5}" text-anchor="end" class="jl-chart-tick">−${label(maxMagnitude)}</text>
      <polyline points="${points('mean')}" class="jl-chart-series jl-group-series"/>
      <polyline points="${points('cumulativeMean')}" class="jl-chart-series jl-mean-series"/>
      ${groups.map((group, i) => `<circle cx="${x(i).toFixed(2)}" cy="${y(group.mean).toFixed(2)}" r="3" class="jl-group-point"/><circle cx="${x(i).toFixed(2)}" cy="${y(group.cumulativeMean).toFixed(2)}" r="3.5" class="jl-mean-point"/>`).join('')}
      <text x="${x(0)}" y="168" text-anchor="middle" class="jl-chart-tick">第 ${integer(groups[0].index)} 组</text>
      ${groups.length > 1 ? `<text x="${right}" y="168" text-anchor="end" class="jl-chart-tick">第 ${integer(groups.at(-1).index)} 组</text>` : ''}
    </svg>
    <div class="jl-current-mean"><span>累计平均计数差 / 对</span><strong>${decimal(snapshot.mean)}</strong></div>
  </section>`;
}

const stageCopy = {
  input: ['两路都还是光', '收到的来波和保留的参考，将在同一个接收器里碰面。'],
  conjugated: ['先调整回波', '把来波的起伏翻个方向，方便把两路的联系读出来。'],
  mixed: ['让两路光先碰面', '光也有起伏：起伏同向时会加强，反向时会减弱。接收器把这种配合变成两个出口的强弱差。'],
  read: ['看看两个出口差多少', '两路之间的联系，会影响两个出口的计数差。噪声仍会让每组结果上下波动。']
};

function interferencePrinciple() {
  const example = inverse => `<div><svg viewBox="0 0 120 68" role="img" aria-label="原理示意：${inverse ? '起伏反向时，相互减弱' : '起伏同向时，相互加强'}"><path d="M8 18H112M8 51H112" stroke="#dce4ce" stroke-width="1"/>${waveform(8, 16, 104, 7, '#83a460')}${waveform(8, 20, 104, 7, '#a588bc', inverse)}${waveform(8, 51, 104, inverse ? 1.5 : 12, '#6f8658')}</svg><span>${inverse ? '反向时 · 减弱' : '同向时 · 加强'}</span></div>`;
  return `<div class="jl-interference-principle"><small>看原理 · 此时还没有测量数字</small><div>${example(false)}${example(true)}</div></div>`;
}

export function renderJointLens({ connected = false, phase = 'input', noise = .4, paired = true, snapshot = null, soloCount = null, actions = '', hint = '' } = {}) {
  const activePhase = phases.includes(phase) ? phase : 'input';
  const stage = phases.indexOf(activePhase);
  const [title, explanation] = stageCopy[activePhase];
  const steps = ['送入两路光', '调整回波', '光路合流', '读出计数差'];
  return `<section class="joint-lens ${connected ? 'is-connected' : 'is-disconnected'} jl-phase-${activePhase}" data-joint-phase="${activePhase}" aria-label="看得见的联合接收实验台">
    ${connected ? `<ol class="jl-stages" aria-label="联合测量的四个阶段">${steps.map((step, i) => `<li class="${i === stage ? 'is-current' : i < stage ? 'is-done' : ''}" ${i === stage ? 'aria-current="step"' : ''}><span>${i + 1}</span><b>${step}</b></li>`).join('')}</ol>` : `<p class="jl-solo-heading">${finite(soloCount) ? '只测来波，读到的是总计数' : '让两路光在接收器里碰面'}</p>`}
    ${actions || hint ? `<div class="jl-guided-action">${hint ? `<p aria-live="polite">${escapeText(hint)}</p>` : ''}${actions ? `<div class="training-controls">${actions}</div>` : ''}</div>` : ''}
    <div class="jl-bench-content"><div class="jl-light-bench">
      <div class="jl-inputs"><div class="jl-input"><strong>收到的来波</strong><span>混着噪声</span><div data-joint-lens-input>${incoming(noise)}</div></div><div class="jl-input jl-reference"><strong>${paired ? '保留的小参' : '另一轮的参考'}</strong><span>仍是光 · 尚未测量</span><div data-joint-lens-reference>${reference()}</div></div></div>
      ${connected ? opticalBench(activePhase) : soloBench(finite(soloCount))}
      <small class="jl-optics-note">光路与波纹为示意，不代表本次读数</small>
    </div>
    <div class="jl-observation">
      ${connected ? `<div class="jl-stage-story" aria-live="polite"><span>第 ${stage + 1} 步</span><h3>${title}</h3><p>${explanation}</p>${activePhase === 'mixed' ? interferencePrinciple() : ''}</div>${readout(snapshot, activePhase)}` : finite(soloCount) ? `<div class="jl-solo-reading" aria-live="polite"><span>来波总探测计数</span><strong data-joint-solo-count>${integer(soloCount)}</strong><p>只有来波总计数，还未读出与参考的关联。</p></div>` : '<div class="jl-stage-story"><span>准备联合接收</span><h3>把留下的小参接进来</h3><p>小参保存的是光，收到的来波也是光。接上后，让两路一起进入光路，之后再测量。</p></div>'}
    </div></div>
    ${connected && activePhase === 'read' ? accumulation(snapshot) : ''}
    ${connected ? `<details class="jl-science-detail"><summary>光在里面怎样变化？</summary><p>这里演示相位共轭接收器。它先对来波做相位共轭处理，再让处理后的光与保留的参考光同时进入 50:50 分束器。两个出口分别得到两路光场的和与差，然后才进行光子探测。</p><p>相加、相减发生在光的振动上。两路关联会影响出口计数差的统计分布；多组实验才能看出平均差值的变化。</p></details>` : ''}
  </section>`;
}
