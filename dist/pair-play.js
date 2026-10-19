// This scene changes an explanatory view, never measures or samples a state.
// Characters and connecting light are explanatory artwork, not measured data.
const SOURCE_BRIGHTNESS = 0.05;
const CLASSICAL_CORRELATION = 2 * SOURCE_BRIGHTNESS;
const SOURCE_CORRELATION = 2 * Math.sqrt(SOURCE_BRIGHTNESS * (SOURCE_BRIGHTNESS + 1));
const CORRELATION_SCALE = 0.5;

function character(side, state) {
  const isSignal = side === 'signal';
  const name = isSignal ? '小探' : '小参';
  const selected = state.view === side || state.view === 'both';
  return `<button type="button" class="qi-orb-button qi-${side} ${selected && state.active ? 'is-selected' : ''}" data-action="pair-view-${side}" ${!state.active || state.saved ? 'disabled' : ''} aria-label="${state.saved ? (isSignal ? '小探准备出发' : '小参已留在本地') : '单看' + name}" aria-pressed="${state.active && state.view === side}"><span class="qi-orb"><span class="qi-orb-shine"></span><span class="qi-orb-face"><i></i><i></i><b></b></span><span class="qi-orb-cheek"></span><span class="qi-orb-shadow"></span></span><strong>${name}</strong><small>${isSignal ? '去接触目标的光' : state.saved ? '已保存 · 尚未测量' : '留作参考的光'}</small></button>`;
}

function localTrace(side, state) {
  const visible = state.active && !state.saved && state.view === side;
  return `<div class="qi-local-view qi-${side} ${visible ? 'is-visible' : ''}" aria-hidden="${!visible}"><span class="qi-random-label">单次读数有随机性</span></div>`;
}

function stage(state) {
  const together = state.active && state.view === 'both';
  return `<div class="qi-stage ${state.active ? 'is-active' : ''} ${together ? 'is-together' : ''} ${state.saved ? 'is-saved' : ''} ${state.justStarted ? 'is-born' : ''}" data-view="${state.view}"><div class="qi-stage-specks" aria-hidden="true"><i>✧</i><i>·</i><i>+</i><i>·</i></div><svg class="qi-stage-art" viewBox="0 0 680 350" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="qi-state-gradient"><stop stop-color="#b5d76b" stop-opacity=".35"/><stop offset=".52" stop-color="#dbe9b5" stop-opacity=".16"/><stop offset="1" stop-color="#b99bd5" stop-opacity=".38"/></linearGradient></defs><g class="qi-joint-halo"><ellipse cx="340" cy="144" rx="258" ry="115" fill="url(#qi-state-gradient)"/><path d="M92 132C120 3 500 5 581 111S487 284 224 245S55 169 92 132Z"/><path d="M100 174C121 265 499 279 577 176S447 16 231 44S78 114 100 174Z"/></g><g class="qi-source-paths"><path class="qi-source-signal" d="M328 294C262 275 209 242 184 158"/><path class="qi-source-reference" d="M352 294C418 275 471 242 496 158"/></g></svg><div class="qi-storage" aria-hidden="${!state.saved}"><span>本地保存盒</span><i></i></div>${character('signal', state)}${character('reference', state)}${localTrace('signal', state)}${localTrace('reference', state)}<div class="qi-whole-caption" aria-hidden="${!together}"><span>一起准备的</span><strong>量子联系</strong></div><div class="qi-source" aria-hidden="true"><span class="qi-source-spark">✧</span><i></i><i></i><i></i></div><span class="qi-source-label">纠缠光源 <i>·</i> 一起准备</span>${state.saved ? '<span class="qi-saved-stamp">小探准备去照射目标 ↗</span>' : ''}</div>`;
}

function correlationStrip() {
  return `<div class="qi-correlation"><h3>发出的光同样少，这类关联可以更强。</h3><div class="qi-correlation-header"><span>两种源亮度相同 · 弱照明</span><small>源头比较</small></div><div class="qi-correlation-row"><span>经典相关光的关联上限</span><div class="qi-correlation-track"><i class="qi-classical-fill" style="width:${CLASSICAL_CORRELATION / CORRELATION_SCALE * 100}%"></i></div></div><div class="qi-correlation-row"><span>这一类纠缠光的关联</span><div class="qi-correlation-track"><i class="qi-quantum-fill" style="width:${SOURCE_CORRELATION / CORRELATION_SCALE * 100}%"></i></div></div><p>源头关联示意，不是探测成功率。</p></div>`;
}

function scienceDetails() {
  return `<details class="qi-science"><summary>好奇多一点：纠缠和普通配对有什么不同？ <span>＋</span></summary><div><p>一双手套也能配成一对：拿到左手套，就知道另一只是右手套。这样的配对关系，可以事先安排好。纠缠的区别更深：两路的整体量子状态，无法通过分别准备各路，再按普通随机规则配对来得到。</p><p>只看到两次结果相同，或两条曲线相似，仍不足以判断存在纠缠。严格的判定需要选择合适的测量，并分析统计结果。这里用角色和光带说明两路的分工与联系；切换视角没有测量光子，也没有改变它们的状态。图中的联系不表示两路在隔空传递消息。</p><p>在量子物理中，纠缠态不能表示为两路各自量子态的乘积，也不能表示为这些乘积态的经典随机混合。角色代表两路光或微波模式，不限定为每路恰好一个光子。</p></div></details><details class="qi-science"><summary>进阶：这种光源为什么用于量子照明？ <span>＋</span></summary><div><p>在探测光和参考光的亮度分别相同的条件下，这类纠缠源的特定关联，可以超过经典光能达到的上限。让探测光接触目标，保留参考光；有目标时，回波与参考之间可能留下可供接收器利用的联系。经过多次探测，接收器积累判断目标是否存在的证据。</p>${correlationStrip()}<p>比较条采用理想两模压缩真空源：两种源的探测路和参考路各自平均光子数相同，均为 Nₛ = 0.05，且场均值为零。用 aₛ、aᵢ 表示两路的湮灭算符，比较相敏交叉关联幅度 C = 2|⟨aₛaᵢ⟩|。经典相关光上限为 C经典 = 2Nₛ = 0.10；这一类源为 C量子 = 2√[Nₛ(Nₛ+1)] ≈ 0.45826。两条使用同一标尺，标尺上限为 0.50。此处的经典界指具有正 P 表示的经典光；C 不是概率、相关系数或检测增益。</p><p>能否更可靠地判断目标，还取决于回波损耗、环境背景、参考保存与接收方式。传播可能破坏纠缠；在特定条件下，最初制备的量子资源仍能带来检测优势。</p><p>原理来源：<a href="https://arxiv.org/abs/0810.0534" target="_blank" rel="noopener noreferrer">Tan 等，量子照明理论（2008）↗</a></p></div></details>`;
}

function explanation(state) {
  if (state.saved) return `<div class="qi-lesson qi-lesson-saved"><h3>留下小参，是为了等回波一起检查。</h3><p>小参还没有被测量，保存的是参考光本身。回波回来后，接收器把它和小参一起测量。每次重新准备两束光，反复探测，积累目标的线索。</p><p class="qi-key-point">小参独自在家时，并不知道远处有没有目标。</p></div>`;
  if (!state.active) return `<div class="qi-lesson"><h3>先准备，再分工。</h3><p>小探去照射目标，小参保存在本地。先按下按钮，看看光源怎样把它们一起准备好。</p></div>`;
  if (state.view !== 'both') return `<div class="qi-lesson"><h3>单看${state.view === 'signal' ? '小探' : '小参'}，每次测量的读数都有随机性。</h3><p>要了解两束光之间的联系，还得看两路测量结果如何配合。切换到“两束一起看”，了解这层关系。</p></div>`;
  return `<div class="qi-lesson"><h3>特别之处，在两束光的关系里。</h3><div class="qi-explain-grid"><div><span>单独测一束</span><strong>每次读数有随机性</strong></div><div><span>每次重新准备，再比较多次结果</span><strong>结果之间有特殊关联</strong></div></div><p>这里的两束光具有<strong>纠缠</strong>：它们的整体状态，无法靠各自准备、再随机配对得到。</p><p class="qi-key-point">接下来保留小参，让这份联系有机会用于检查回波。</p></div>`;
}

function progress(state) {
  const current = state.saved ? 2 : state.active ? 1 : 0;
  return `<ol class="qi-steps" aria-label="认识纠缠源的三个小步骤">${['准备两束光', '看看它们的联系', '留一束等回波'].map((label, index) => `<li ${index === current ? 'aria-current="step"' : ''} class="${index <= current ? 'is-reached' : ''}"><span>${index < current ? '✓' : index + 1}</span>${label}</li>`).join('')}</ol>`;
}

export function createPairPlay() {
  const initial = () => ({ active: false, view: 'signal', seenTogether: false, saved: false, justStarted: false });
  let state = initial();

  function viewButton(view, text) {
    return `<button type="button" class="qi-view-button ${state.active && state.view === view ? 'is-current' : ''}" data-action="pair-view-${view}" aria-pressed="${state.active && state.view === view}" ${!state.active || state.saved ? 'disabled' : ''}>${text}</button>`;
  }

  return {
    render() {
      const together = state.active && state.view === 'both';
      const title = state.saved ? '小探出发，小参留下' : !state.active ? '一台光源，准备两束光' : together ? '两束一起看，才看到联系' : '先看一束，再看两束';
      const intro = state.saved ? '出发去接触目标的，只有小探。小参留在本地等回波。' : !state.active ? '下面这台装置叫纠缠源。它一起准备两束带有特殊量子关联的光。' : '小探是探测光，小参是参考光。它们在同一个光源中一起准备好。';
      return `<section class="qi-pair" aria-label="认识纠缠光源与两路量子光"><header class="qi-heading"><span>出发前 · 认识纠缠源</span><h2>${title}</h2><p>${intro}</p></header>${progress(state)}${stage(state)}${state.active && !state.saved ? `<div class="qi-view-switch" role="group" aria-label="教学观察视角">${viewButton('signal', '单看小探')}${viewButton('reference', '单看小参')}${viewButton('both', '两束一起看')}</div>` : ''}<div class="qi-explanation" aria-live="polite">${explanation(state)}</div><div class="qi-actions">${!state.active ? '<button type="button" class="qi-main-action" data-action="pair-start">准备小探和小参 <span>✧</span></button>' : state.saved ? '<button type="button" class="qi-main-action" data-action="pair-depart">让小探出发 <span>→</span></button>' : state.seenTogether ? '<button type="button" class="qi-main-action is-purple" data-action="pair-store">把小参留下，等回波 <span>＋</span></button>' : '<button type="button" class="qi-main-action" data-action="pair-view-both">看看两束光的联系 <span>→</span></button>'}<button type="button" class="qi-skip" data-action="pair-skip">跳过讲解，直接体验 ↗</button></div><p class="qi-perspective-note">角色与光带是讲解示意 · 此时还没有测量光子</p>${scienceDetails()}</section>`;
    },
    act(action) {
      if (typeof action !== 'string' || !action.startsWith('pair-')) return { handled: false };
      if (action === 'pair-skip') return { handled: true, finish: true, measured: false, sound: 'next' };
      state.justStarted = false;
      if (action === 'pair-start' && !state.active) { state.active = true; state.justStarted = true; return { handled: true, sound: 'source' }; }
      if (action.startsWith('pair-view-') && state.active && !state.saved) {
        const next = action.slice('pair-view-'.length);
        if (['signal', 'reference', 'both'].includes(next)) { state.view = next; if (next === 'both') state.seenTogether = true; }
        return { handled: true, sound: 'reference' };
      }
      if (action === 'pair-store' && state.active && state.seenTogether && !state.saved) { state.saved = true; state.view = 'both'; return { handled: true, sound: 'reference' }; }
      if (action === 'pair-depart' && state.active && state.saved) return { handled: true, finish: true, prepared: true, referenceSaved: true, measured: false, sound: 'next' };
      return { handled: true };
    },
    reset() { state = initial(); },
  };
}
