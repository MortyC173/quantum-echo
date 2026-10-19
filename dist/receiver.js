// A compact, playful explanation of the receiving path. Only lastReading.llr
// determines the reply. Decorative dots never reveal the hidden target.
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function incomingDots(noise) {
  const count = 4 + Math.round(Math.max(0, Math.min(1, Number(noise) || 0)) * 27);
  const dots = Array.from({ length: count }, (_, i) => {
    const x = 9 + ((i * 31 + 11) % 113);
    const y = 10 + ((i * 17 + 5) % 35);
    return `<circle cx="${x}" cy="${y}" r="${i % 5 ? 1.8 : 2.7}" fill="#e5a071" opacity="${.45 + (i % 4) * .12}"/>`;
  }).join('');
  return `<svg class="echo-dots" viewBox="0 0 132 58" role="img" aria-label="构成示意：橙色背景噪声中可能混有回声，点点不能用来判断目标"><ellipse cx="65" cy="29" rx="61" ry="24" fill="#f1e9d5"/>${dots}<circle cx="47" cy="29" r="3" fill="#b0c975"/><circle cx="79" cy="34" r="2.3" fill="#b0c975"/><path d="M18 48l4-3 4 3m78-35 4-3 4 3" stroke="#d6b58a" stroke-width="1.4" fill="none"/></svg>`;
}

function littleRadar(active, ready) {
  return `<svg class="echo-radar ${active ? 'checking' : ''}" viewBox="0 0 148 64" role="img" aria-label="留下的小参和收到的来波，在小雷达里一起检查">
    <path d="M12 31H45M106 31H136" stroke="#d6dfc7" stroke-width="2" stroke-dasharray="3 4"/>
    <g class="echo-green"><circle cx="23" cy="31" r="10" fill="#d2e795"/><circle cx="20" cy="32" r="1.5" fill="#38604a"/><circle cx="26" cy="32" r="1.5" fill="#38604a"/><circle cx="10" cy="24" r="2" fill="#e5a071"/><circle cx="35" cy="38" r="2" fill="#e5a071"/><circle cx="15" cy="44" r="1.7" fill="#e5a071"/></g>
    <g class="echo-purple"><circle cx="125" cy="31" r="10" fill="${ready ? '#c5b0df' : '#ded6e6'}"/><circle cx="122" cy="32" r="1.5" fill="#68567f"/><circle cx="128" cy="32" r="1.5" fill="#68567f"/></g>
    <path d="M40 28l5 3-5 3m68-6-5 3 5 3" fill="none" stroke="#9cac85" stroke-width="1.6"/>
    <ellipse cx="74" cy="55" rx="26" ry="5" fill="#284d3b" opacity=".08"/>
    <rect x="48" y="24" width="52" height="29" rx="10" fill="#e0e6c6" stroke="#3c674d" stroke-width="1.7"/>
    <rect x="54" y="29" width="40" height="15" rx="6" fill="#315b46"/>
    <path d="M63 34v4m21-4v4" stroke="#e1efa2" stroke-width="3" stroke-linecap="round"/>
    <path d="M71 38q3 3 6 0" stroke="#e1efa2" stroke-width="1.5" fill="none"/>
    <path d="M74 24v-7" stroke="#315b46" stroke-width="2"/>
    <ellipse cx="74" cy="15" rx="19" ry="7" fill="#b7d17d" stroke="#426c4b" stroke-width="1.5" transform="rotate(-14 74 15)"/>
    <path d="M74 14l3-9" stroke="#426c4b" stroke-width="1.5"/><circle cx="77" cy="5" r="2.5" fill="#e99d7c"/>
  </svg>`;
}

export function renderReceiver(container, { phase, noise, referenceReady, lastReading, selectedZone, letters = ['A', 'B', 'C'] }) {
  const detailsOpen = container.querySelector('.receiver-curious')?.open;
  const receiving = phase === 'observe' || phase === 'align';
  const r = lastReading;
  const llr = r?.llr;
  const valid = !!r && typeof llr === 'number' && Number.isFinite(llr);
  const zone = index => escape(letters[index] ?? '—');
  // Deliberately soft descriptions; a near-zero model reading remains ambiguous.
  const result = !valid ? '还拿不准' : llr > 3 ? '回声很可疑' : llr > 1 ? '有一些动静' : llr < -2 ? '暂时没发现' : '还拿不准';
  const mood = valid && llr > 1 ? 'curious' : valid && llr < -2 ? 'quiet' : 'unsure';
  const oldReading = !!r && (receiving || Number(r.zone) !== Number(selectedZone));
  const area = r ? `${oldReading ? '上回' : '刚刚'} ${zone(r.zone)} 区` : '等第一声回响';
  const samples = Array.isArray(r?.readings) ? r.readings.filter(Number.isFinite).length : 0;
  const direction = !valid ? '这一轮还没有可用读数。' : `这一轮来自 ${zone(r.zone)} 区，共 ${samples} 份教学模拟读数；合并后的对数似然比为 ${llr >= 0 ? '+' : ''}${llr.toFixed(2)}。正值偏向有目标，负值偏向无目标，接近零时倾向较弱；它不是目标概率。`;
  container.innerHTML = `<div class="receiver-heading"><span class="receiver-now"><i class="receiver-led ${receiving ? 'active' : ''}"></i>${receiving ? `正在听 ${zone(selectedZone)} 区…` : '听一听，再想一想'}</span><button id="revisit-training">量子参考怎么帮忙 ↗</button></div>
    <div class="receiver-path ${receiving ? 'is-listening' : ''}">
      <div class="echo-stop incoming"><strong>收到什么</strong>${incomingDots(noise)}<small>沙沙声 ＋ 可能的回声</small></div>
      <span class="echo-path-arrow" aria-hidden="true">→</span>
      <div class="echo-stop together"><strong>参考与回波</strong>${littleRadar(receiving, referenceReady)}<small>两路一起测量</small></div>
      <span class="echo-path-arrow" aria-hidden="true">→</span>
      <div class="echo-stop reply ${mood}"><span class="echo-area">${area}</span><div class="echo-reply"><span class="echo-expression" aria-hidden="true">${mood === 'curious' ? '!' : mood === 'quiet' ? '·' : '?'}</span><strong>${result}</strong></div><small>${r ? oldReading ? '这是上一回的线索哦' : '再听几次，会更有把握' : receiving ? '等它们一起检查完' : '小雷达正等你出发'}</small></div>
    </div>
    <div class="receiver-bottom"><p>空区域也有噪声。<span>点点是教学示意，单次线索可能误导。</span></p><details class="receiver-curious" ${detailsOpen ? 'open' : ''}><summary>给好奇的你</summary><div class="receiver-science"><p>“小参”是保留在本地的参考信号。每一轮从同一个源重新制备纠缠的两路信号，一路探测，一路留下；有目标时，回波与参考的联合读数统计可能不同于只有背景噪声时；接收器利用这种差异判断。参考单独不包含远处目标的信息，噪声仍然存在。</p><p>${direction}</p><p>这里展示教学模型的结果。彩色点点说明信号构成，不是实际测得的波形，也不能按颜色从真实来波里挑出回声。这张卡显示刚刚一轮的线索，区域按钮显示多轮累积的线索；两处使用相同的教学分界，游戏判断仍使用原始读数。</p></div></details></div>`;
}
