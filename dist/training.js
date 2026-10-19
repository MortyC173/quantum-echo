import { createJointReceiver, RECEIVER_GROUP_SIZE } from './joint-model.js';
import { createPairPlay } from './pair-play.js';
import { renderJointLens } from './joint-lens.js';

const freshSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const steps = ['认识这份联系', '回波遇上噪声', '参考派上用场'];
const speck = (index, salt = 0) => { const v = Math.sin((index + 1) * 127.1 + 311.7 + salt * 13.7) * 43758.5453; return v - Math.floor(v); };

function referenceScene(state) {
  const character = (color, name, line) => `<div class="training-orb-station training-station-${color}"><div class="training-character training-character-${color}" aria-label="${name}，${line}"><span class="training-character-shine"></span><span class="training-character-face"><i></i><i></i><b></b></span><span class="training-character-foot"></span></div><span class="training-character-name">${name}<small>${line}</small></span></div>`;
  return `<div class="training-pair-world training-reference-world ${state.prepared ? 'is-awake' : ''} ${state.prepared && !state.referenceSaved ? 'is-new-pair' : ''} ${state.referenceSaved ? 'reference-saved' : ''}"><div class="training-world-stars" aria-hidden="true"><i>✧</i><i>+</i><i>·</i><i>✧</i></div><svg class="training-source-routes" viewBox="0 0 670 325" preserveAspectRatio="none" aria-hidden="true"><path d="M335 264Q199 257 169 144" class="training-source-probe-route"/><path d="M335 264Q470 257 501 144" class="training-source-idler-route"/></svg><div class="training-together-halo" aria-hidden="true"></div><div class="training-storage-box"><span>${state.referenceSaved ? '✓ 本地保存盒' : '本地保存盒'}</span><small>${state.referenceSaved ? '参考光已保留 · 尚未测量' : '等小参进来'}</small></div><div class="training-source-machine" aria-hidden="true"><span>✧</span><i></i><i></i><i></i></div><span class="training-source-label">纠缠光源 · 一起制备</span>${character('green', '小探', state.referenceSaved ? '探测光 · 准备去目标' : '探测光')}${character('purple', '小参', state.referenceSaved ? '参考光 · 留在本地' : '参考光')}<span class="training-target-destination">${state.referenceSaved ? '去接触目标 ↗' : '先准备好这一对'}</span></div>`;
}

function journeyScene(state, withReference = false) {
  const count = Math.round(8 + state.noise * 62);
  const noise = Array.from({ length: count }, (_, i) => `<circle cx="${(300 + speck(i) * 236).toFixed(1)}" cy="${(48 + speck(i, 1) * 169).toFixed(1)}" r="${(2 + speck(i, 2) * 2.9).toFixed(1)}" fill="#e8a372" opacity="${(.38 + speck(i, 3) * .4).toFixed(2)}" class="training-noise-speck" style="animation-delay:-${(speck(i, 4) * 4).toFixed(2)}s"/>`).join('');
  const target = state.target;
  return `<svg class="training-journey-svg" viewBox="0 0 600 ${withReference ? 320 : 250}" role="img" aria-label="${target ? '已知目标将少量探测信号反射回接收筒。' : '已移开目标，没有目标回波。'}橙色环境噪声仍进入接收筒。${withReference ? (state.connected ? '本地参考已接入，噪声保持不变。' : '本地参考等待接入。') : ''}"><defs><linearGradient id="training-jar" x2="0" y2="1"><stop stop-color="#507a5b"/><stop offset="1" stop-color="#305642"/></linearGradient><linearGradient id="training-ball" x2="0" y2="1"><stop stop-color="#e8fba6"/><stop offset="1" stop-color="#b3d467"/></linearGradient><linearGradient id="training-purple-ball" x2="0" y2="1"><stop stop-color="#e9dcfa"/><stop offset="1" stop-color="#b79ad8"/></linearGradient></defs><ellipse cx="300" cy="226" rx="267" ry="15" fill="#d9e4c5" opacity=".7"/><path d="M87 143Q173 77 263 126" class="training-probe-path"/><path d="M283 142Q372 172 496 142" class="training-return-path ${target ? '' : 'is-quiet'}"/><text x="162" y="77" text-anchor="middle" class="training-art-label">探测光出发</text><g><ellipse cx="76" cy="190" rx="35" ry="10" fill="#b7ce90"/><rect x="45" y="151" width="62" height="39" rx="13" fill="#b6cd8d"/><ellipse cx="76" cy="153" rx="31" ry="10" fill="#d9e8b9"/><circle cx="76" cy="136" r="25" fill="url(#training-ball)" stroke="#a0bc6c"/><circle cx="68" cy="134" r="2.6" fill="#527041"/><circle cx="83" cy="134" r="2.6" fill="#527041"/><path d="M71 143Q76 148 81 143" fill="none" stroke="#527041" stroke-width="2"/><text x="76" y="217" text-anchor="middle" class="training-art-title">小探出发点</text></g><g opacity="${target ? 1 : .32}"><rect x="232" y="111" width="63" height="72" rx="15" fill="#f5cf9f" stroke="#c69d70" stroke-width="2"/><rect x="241" y="121" width="45" height="39" rx="9" fill="#fff3cf"/><path d="M253 147L263 130L273 147Z" fill="#c99766"/><circle cx="249" cy="171" r="3" fill="#c99766"/><circle cx="278" cy="171" r="3" fill="#c99766"/><text x="263" y="212" text-anchor="middle" class="training-art-title">${target ? '已知目标' : '目标移开了'}</text></g><g>${noise}</g>${target ? '<circle cx="326" cy="151" r="5" fill="#a0c85f" class="training-echo-speck"/><circle cx="389" cy="155" r="4" fill="#a0c85f" class="training-echo-speck" style="animation-delay:-1s"/>' : ''}<text x="410" y="41" text-anchor="middle" class="training-noise-word">${state.noise > .6 ? '沙沙沙沙沙……' : '沙…沙…'}</text><g><rect x="491" y="99" width="67" height="101" rx="22" fill="url(#training-jar)"/><ellipse cx="524" cy="105" rx="33" ry="13" fill="#71916b"/><ellipse cx="524" cy="102" rx="26" ry="8" fill="#2d4d3a"/><rect x="506" y="128" width="37" height="40" rx="10" fill="#dae9b7"/><path d="M512 151l5-9 6 16 5-13 9 8" fill="none" stroke="#719557" stroke-width="2.5"/><circle cx="524" cy="183" r="4" fill="#c7e58a"/><text x="524" y="226" text-anchor="middle" class="training-art-title">接收筒</text></g>${withReference ? `<path d="M102 275H451Q480 275 497 200" class="training-reference-path ${state.connected ? 'is-connected' : ''}"/><g class="training-journey-partner ${state.connected ? 'is-connected' : ''}"><circle cx="76" cy="275" r="24" fill="url(#training-purple-ball)" stroke="#ac90c7"/><circle cx="69" cy="273" r="2.4" fill="#7d6494"/><circle cx="83" cy="273" r="2.4" fill="#7d6494"/><path d="M71 282Q76 286 81 282" fill="none" stroke="#7d6494" stroke-width="1.8"/></g><text x="152" y="300" class="training-art-label">${state.connected ? '小参已接入 · 一起测量' : '小参一直留在本地'}</text>` : ''}</svg>`;
}

export function mountTraining(container, { onComplete = () => {}, onSound = () => {}, onExit } = {}) {
  const initial = () => ({ step: 0, introDone: false, prepared: false, referenceSaved: false, noise: .15, target: true, highNoiseTried: false, absentTried: false, connected: false, receiverPhase: 'input', paired: true, receiver: null, readings: null, referenceResults: { matched: null, unmatched: null } });
  let state = initial();
  const pairPlay = createPairPlay();
  let destroyed = false;
  let completed = false;
  container.classList.add('training-host');
  const sound = kind => onSound(kind);
  const details = (label, text) => `<details class="training-details"><summary>${label}</summary><p>${text}</p></details>`;
  const scroll = () => container.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

  function frame(body) {
    return `<section class="training-shell" aria-label="两束光的小冒险"><header class="training-header"><span class="training-eyebrow">两束光的小冒险</span><ol aria-label="体验进度">${steps.map((s, i) => `<li class="${state.step === i ? 'is-current' : state.step > i ? 'is-done' : ''}" ${state.step === i ? 'aria-current="step"' : ''}><span>${state.step > i ? '✓' : i + 1}</span><b>${s}</b></li>`).join('')}</ol></header>${body}<footer class="training-footer"><button type="button" data-action="restart">从头玩一次 ↺</button>${typeof onExit === 'function' ? '<button type="button" data-action="exit">返回游戏 ↗</button>' : ''}</footer></section>`;
  }

  function referenceStep() {
    const text = !state.prepared ? '先让光源共同准备两路量子光。' : !state.referenceSaved ? '小探去照射目标，小参留在本地等回波。' : '保存的是参考光本身，接收时才参与测量。';
    const action = !state.prepared ? '<button class="training-button" data-action="prepare-pair">启动纠缠光源 ✧</button>' : !state.referenceSaved ? '<button class="training-button training-button-purple" data-action="save-reference">把小参留下 ＋</button>' : '<button class="training-button" data-action="next">让小探出发 →</button>';
    return `<div class="training-heading"><span>第一幕</span><h2>一个出发，一个留下</h2><p>两路共同制备。出发前的关联，留给之后的联合接收使用。</p></div>${referenceScene(state)}<div class="training-play-area"><p class="training-reaction">${text}</p><div class="training-controls">${action}</div></div>`;
  }

  function noiseStep() {
    const ready = state.highNoiseTried && state.absentTried;
    return `<div class="training-heading"><span>第二幕 · 小参仍在本地保存</span><h2>回来的，混着好多噪声</h2><p>小探照到目标，只有一点回波回来。周围的杂乱信号，也会挤进接收筒。</p></div><div class="training-journey-card"><span class="training-scene-badge">拆开看成分 · 颜色用于讲解</span><div data-training="journey">${journeyScene(state)}</div><div class="training-color-key"><span class="training-key-green">弱弱的目标回波</span><span class="training-key-orange">环境噪声</span></div></div><div class="training-noise-controls"><div class="training-noise-slider"><label for="training-noise"><span>把噪声调大</span><b data-training="noise-word">${noiseWord()}</b></label><input id="training-noise" type="range" min="0" max="100" value="${Math.round(state.noise * 100)}" data-input="noise" aria-label="背景噪声强度"/><div><small>安静</small><small>吵闹</small></div></div><button type="button" class="training-button training-button-light" data-action="target">${state.target ? '把目标移开 ↗' : '把目标放回来 ↩'}</button></div><div class="training-play-area"><p class="training-reaction" data-training="noise-reaction" aria-live="polite">${noiseReaction()}</p><div class="training-checks"><span data-training="noise-check">${state.highNoiseTried ? '✓' : '○'} 调大噪声</span><span>${state.absentTried ? '✓' : '○'} 移开目标</span></div><div class="training-controls"><button type="button" class="training-button" data-action="next" ${ready ? '' : 'disabled'}>用留下的联系找线索 →</button></div></div>${details('接收器能直接认出哪一点是回波吗？', '图中用颜色拆解已知的回波和背景，真实接收不会带着这样的来源标签。目标存在时，来波可能含衰减的探测信号和环境背景；目标不存在时，接收器仍会收到背景。微波量子照明常面对很强的热噪声。')}`;
  }

  function referenceComparison() {
    const records = state.referenceResults;
    if (!records.matched && !records.unmatched) return '';
    const row = (label, record) => '<tr><th scope="row">' + label + '</th><td>' + (record ? record.groups + ' 组' : '还没测') + '</td><td>' + (record ? (record.mean >= 0 ? '+' : '−') + Math.abs(record.mean).toFixed(3) : '—') + '</td></tr>';
    return '<table class="training-reference-results"><caption>同一目标、同一噪声下的测量记录</caption><thead><tr><th scope="col">参考</th><th scope="col">已测</th><th scope="col">平均差 / 对</th></tr></thead><tbody>' + row('同一轮', records.matched) + row('另一轮', records.unmatched) + '</tbody></table><p class="training-tiny-note">每组都是1024对新信号。先各测相同组数，再比较；少量数据仍可能误导。</p>';
  }

  function partnerStep() {
    const { connected, receiverPhase: phase, readings, paired } = state;
    const groups = readings?.groups.length || 0;
    const actions = !connected
      ? '<button type="button" class="training-button training-button-purple" data-action="connect">把留下的小参接进来 ＋</button>'
      : phase === 'input'
        ? '<button type="button" class="training-button" data-action="joint-conjugate">① 调整来波，准备碰面 →</button>'
        : phase === 'conjugated'
          ? '<button type="button" class="training-button" data-action="joint-mix">② 让两路光碰面 →</button>'
          : phase === 'mixed'
            ? '<button type="button" class="training-button" data-action="listen">③ 测两个出口，算算差多少 →</button>'
            : '<button type="button" class="training-button" data-action="listen">再测一组 ↺</button><button type="button" class="training-button training-button-light" data-action="listen-many">连续测 4 组</button>';
    const next = !connected ? '小参一直保存为光。先把它接进来，等两路在接收器里相遇。'
      : phase === 'input' ? '先调整来波的起伏方向，让出发时的联系能在接下来的干涉中显现。'
      : phase === 'conjugated' ? '小参还没有被单独测量。现在，让它和处理后的来波一起进入汇合处。'
      : phase === 'mixed' ? '两路光先干涉，再分到 A、B 两个出口。现在才测量出口，看看计数相差多少。'
      : '每组都用 1024 对新准备的信号。单组会有偶然起伏，多测几组，看平均差值怎样变化。';
    return `<div class="training-heading"><span>第三幕 · 打开接收器看看</span><h2>两路一起，找目标的线索</h2><p>先让两路光相遇、干涉，再测两个出口差多少。</p></div>
      <p class="training-calibration-state">练习场：目标${state.target ? '已放入' : '已移开'} · ${noiseWord()}</p>
      ${renderJointLens({ connected, phase, noise: state.noise, paired, snapshot: readings, actions, hint: next })}
      <div class="training-play-area">
      ${groups >= 2 ? '<button type="button" class="training-button training-button-light training-finish" data-action="complete">进入隐藏目标任务 →</button>' : ''}</div>
      ${connected ? `<div class="training-reference-test"><h3>试试：换成另一轮的小参，会怎样？</h3><p>两路平均亮度保持一样，换掉它们的对应关系，再重新测量。</p><div class="training-target-choices" role="group" aria-label="选择参考的对应关系"><button type="button" data-action="reference-matched" class="${paired ? 'selected' : ''}" aria-pressed="${paired}">用同一轮的小参</button><button type="button" data-action="reference-unmatched" class="${!paired ? 'selected' : ''}" aria-pressed="${!paired}">换另一轮的小参</button></div><p class="training-tiny-note">${paired ? '同一轮的小参：有机会读出回波保留的源头联系。' : '另一轮的小参：亮度相同，但与这次来波没有源头联系。'}</p>${referenceComparison()}</div>` : ''}
      <div class="training-target-choices" role="group" aria-label="校准目标状态"><span>再试试：</span><button type="button" data-action="calibration-present" class="${state.target ? 'selected' : ''}" aria-pressed="${state.target}">放入目标</button><button type="button" data-action="calibration-absent" class="${!state.target ? 'selected' : ''}" aria-pressed="${!state.target}">移开目标</button>${connected ? '<button type="button" data-action="disconnect">拔下参考</button>' : ''}</div>
      <p class="training-tiny-note training-reset-note">换目标、换参考或拔插参考，都会清空计数，重新准备信号。</p>
      ${details('为什么两个出口的差能带来线索？', '光有起伏，碰面时会发生干涉。接收器把两路光以两种方式组合到两个出口：一个叠加，一个相减。两路之间的关联会改变两端的平均计数差。有目标且正确配对时，回波可能保留与小参的关联，许多次测量的差值会出现平均偏移。独立背景也会与小参产生偶然的干涉，但在这个模型中，它对计数差的平均贡献为零；有限次测量仍有噪声起伏。因此，不能靠一次正差值就确定目标。')}
      <details class="training-details"><summary>这个示范采用哪种接收器？</summary><div class="training-model-copy"><p>以相位共轭接收器为例：先在光路内对来波做相位共轭处理，再让它与保存的参考通过均匀分束器干涉，最后分别探测两个出口并计算光子计数差。小参在汇合之前保持为物理模式，画中的光波和光点只是路径示意。</p><p>原理来自 <a href="https://arxiv.org/abs/0911.0950" target="_blank" rel="noopener noreferrer">Guha 与 Erkmen（2009），B 节与图 3 ↗</a>。不同量子照明接收器有不同的具体结构，这里展示其中一种。</p><p>这里使用理想双模压缩真空源、无损参考保存、稳定且已补偿的传播相位、独立热背景和理想探测器。实际装置还会受到存储损耗、相位漂移和探测效率等因素影响。</p></div></details>
      <details class="training-details"><summary>数字从哪里来？</summary><div class="training-model-copy"><p>每组包含 1024 对全新、彼此独立的模式。源每路平均光子数 Nₛ=0.05，回波比例 κ=0.1；背景平均光子数 Nᵦ=0.5+9.5×噪声滑块值。计数由理想相位共轭接收器的统计模型抽样，包含共轭过程必需的真空噪声。</p><p>实现中从共轭后的非负高斯 P 分布采样辅助场幅 C、I，再计算两出口幅度 (C+I)/√2 和 (C−I)/√2，并以各自强度为均值做条件独立的泊松计数。辅助场幅是计算变量，没有对原始小参提前测量。</p><p>有目标、正确配对时，每对模式的平均计数差为 2√[κNₛ(Nₛ+1)]≈0.145；无目标或换用独立参考时为零。实际抽样围绕这些均值波动。图中每组差值与累计平均都除以相应的模式数，零线不是判断目标的分界线。</p><p>参考对照用来说明关联如何被读出；它没有比较最佳经典探测方案，因此不能据此量化量子优势。数值不是实际雷达性能预测。主游戏与八步实验台保留原来的高斯统计教学模型。</p></div></details>`;
  }

  function noiseWord() { return state.noise < .3 ? '轻轻沙沙' : state.noise < .65 ? '有点吵了' : '沙沙沙沙！'; }
  function noiseReaction() { return !state.target ? '目标移开了，噪声还在！有动静不等于有目标。' : state.noise >= .65 ? '回波很弱，已经淹没在大片噪声里。' : '调大噪声，再移开目标，看看接收筒。'; }
  function render() { if (!destroyed) container.innerHTML = frame(state.step === 0 ? (state.introDone ? referenceStep() : pairPlay.render()) : state.step === 1 ? noiseStep() : partnerStep()); }
  function resetReadings(preserveComparison = false) {
    if (!preserveComparison) state.referenceResults = { matched: null, unmatched: null };
    state.receiverPhase = 'input';
    state.readings = null;
    state.receiver = state.connected ? createJointReceiver({ noise: state.noise, targetPresent: state.target, paired: state.paired, seed: freshSeed() }) : null;
  }
  function focusReceiverAction() {
    const action = !state.connected ? 'connect' : state.receiverPhase === 'input' ? 'joint-conjugate' : state.receiverPhase === 'conjugated' ? 'joint-mix' : 'listen';
    container.querySelector('[data-action="' + action + '"]')?.focus({ preventScroll: true });
  }
  function click(event) {
    if (destroyed || completed) return;
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (state.step === 0 && !state.introDone) {
      const response = pairPlay.act(action);
      if (response.handled) {
        if (response.finish) {
          state.introDone = true;
          state.prepared = Boolean(response.prepared);
          state.referenceSaved = Boolean(response.referenceSaved);
          if (state.prepared && state.referenceSaved) state.step = 1;
        }
        sound(response.sound || 'next'); render();
        if (!response.finish) {
          const focusScope = button.closest('.qi-view-switch') ? '.qi-view-switch ' : '';
          const nextFocus = button.classList.contains('qi-main-action')
            ? container.querySelector('.qi-main-action')
            : container.querySelector(`${focusScope}[data-action="${action}"]`);
          nextFocus?.focus({ preventScroll: true });
        }
        if (response.scroll || response.finish) scroll();
        return;
      }
    }
    if (action === 'prepare-pair' && state.step === 0 && state.introDone) { state.prepared = true; sound('source'); render(); }
    if (action === 'save-reference' && state.step === 0 && state.prepared) { state.referenceSaved = true; sound('reference'); render(); }
    if (action === 'next') {
      const ready = state.step === 0 ? state.prepared && state.referenceSaved : state.step === 1 && state.highNoiseTried && state.absentTried;
      if (!ready) return;
      state.step += 1;
      if (state.step === 2) { state.target = true; resetReadings(); }
      sound('next'); render(); scroll();
    }
    if (action === 'target' && state.step === 1) { state.target = !state.target; if (!state.target) state.absentTried = true; sound('target'); render(); }
    if ((action === 'calibration-present' || action === 'calibration-absent') && state.step === 2) {
      const target = action === 'calibration-present';
      if (target === state.target) return;
      state.target = target; resetReadings(); sound('target'); render(); focusReceiverAction();
    }
    if (action === 'connect' && state.step === 2 && state.referenceSaved && !state.connected) {
      state.connected = true; resetReadings(); sound('reference'); render(); focusReceiverAction();
    }
    if (action === 'disconnect' && state.step === 2) {
      state.connected = false; resetReadings(); sound('reference'); render(); focusReceiverAction();
    }
    if ((action === 'reference-matched' || action === 'reference-unmatched') && state.step === 2 && state.connected) {
      const paired = action === 'reference-matched';
      if (paired === state.paired) return;
      state.paired = paired; resetReadings(true); sound('reference'); render(); focusReceiverAction();
    }
    if (action === 'joint-conjugate' && state.step === 2 && state.connected && state.receiverPhase === 'input') {
      state.receiverPhase = 'conjugated'; sound('next'); render(); focusReceiverAction();
    }
    if (action === 'joint-mix' && state.step === 2 && state.connected && state.receiverPhase === 'conjugated') {
      state.receiverPhase = 'mixed'; sound('next'); render(); focusReceiverAction();
    }
    if ((action === 'listen' || action === 'listen-many') && state.step === 2 && state.connected && state.receiver && ['mixed', 'read'].includes(state.receiverPhase)) {
      const batches = action === 'listen-many' ? 4 : 1;
      for (let group = 0; group < batches; group++) state.readings = state.receiver.sampleGroup(RECEIVER_GROUP_SIZE);
      state.referenceResults[state.paired ? 'matched' : 'unmatched'] = { groups: state.readings.groups.length, mean: state.readings.mean };
      state.receiverPhase = 'read'; sound('receive'); render(); focusReceiverAction();
    }
    if (action === 'restart') { state = initial(); pairPlay.reset(); sound('next'); render(); scroll(); }
    if (action === 'exit' && typeof onExit === 'function') onExit();
    if (action === 'complete' && state.step === 2 && state.connected && state.readings?.groups.length >= 2) { completed = true; button.disabled = true; sound('complete'); onComplete({ noise: state.noise, referenceQuality: 1 }); }
  }
  function input(event) {
    if (event.target.dataset.input !== 'noise' || destroyed) return;
    state.noise = Number(event.target.value) / 100;
    if (state.noise >= .65) state.highNoiseTried = true;
    container.querySelector('[data-training="journey"]').innerHTML = journeyScene(state);
    container.querySelector('[data-training="noise-word"]').textContent = noiseWord();
    container.querySelector('[data-training="noise-check"]').textContent = `${state.highNoiseTried ? '✓' : '○'} 调大噪声`;
    container.querySelector('[data-training="noise-reaction"]').textContent = noiseReaction();
    container.querySelector('[data-action="next"]').disabled = !(state.highNoiseTried && state.absentTried);
  }
  container.addEventListener('click', click); container.addEventListener('input', input); render();
  return { destroy() { destroyed = true; container.removeEventListener('click', click); container.removeEventListener('input', input); container.innerHTML = ''; container.classList.remove('training-host'); } };
}
