/* 쌍둥이의 하루 영단어 — G-10 단어 타워 디펜스 엔진 (요구사항 16장, 2026-11-28)
   옆 문제판에서 단어를 맞혀 골드를 벌고, 정해진 터에 탑을 지어 괴물을 막는다. 맵 5개 × 웨이브 10 + 보스.
   그림은 js/td-art.js (window.TWTdArt). games.js 가 공용 도구를 api 로 넘겨준다. */
(() => {
  'use strict';
  const ART = () => window.TWTdArt;
  let A = null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- 효과음 ----------
  let actx = null;
  function au() { if (!actx) { const s = A.T().sfx; actx = s && s.wake ? s.wake() : null; } return actx; }
  function tone(f0, f1, dur, type, vol, delay) {
    const c = au(); if (!c) return; const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(); const g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.03);
  }
  function noise(dur, vol, freq, type) {
    const c = au(); if (!c) return;
    const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(); const f = c.createBiquadFilter(); const g = c.createGain(); f.type = type || 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  }
  let sndBudget = 0;   // 같은 순간에 소리가 너무 많이 겹치지 않게
  const lim = (fn) => () => { if (sndBudget > 6) return; sndBudget++; fn(); };
  const SND = {
    arrow: lim(() => tone(900, 400, 0.06, 'triangle', 0.03)),
    ice: lim(() => { tone(1800, 1200, 0.12, 'sine', 0.03); tone(2400, 2000, 0.08, 'sine', 0.02, 0.03); }),
    bolt: lim(() => { noise(0.12, 0.06, 3000, 'highpass'); tone(200, 1200, 0.08, 'sawtooth', 0.02); }),
    cannon: lim(() => { noise(0.18, 0.1, 400); tone(140, 50, 0.18, 'square', 0.04); }),
    boom: lim(() => { noise(0.3, 0.12, 500); tone(110, 40, 0.3, 'sawtooth', 0.04); }),
    coin: () => { tone(1320, 1320, 0.05, 'square', 0.025); tone(1760, 1760, 0.08, 'square', 0.025, 0.05); },
    build: () => { noise(0.12, 0.12, 300); tone(220, 330, 0.15, 'square', 0.05, 0.05); },
    up: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.1, 'square', 0.04, i * 0.06)),
    sell: () => tone(800, 400, 0.15, 'triangle', 0.05),
    leak: () => { tone(300, 100, 0.3, 'sawtooth', 0.06); noise(0.2, 0.08, 600); },
    roar: () => { tone(110, 40, 1, 'sawtooth', 0.1); noise(0.9, 0.12, 300); },
    meteor: () => { noise(0.7, 0.25, 300); tone(160, 30, 0.7, 'sawtooth', 0.08); },
    freeze: () => [2093, 1760, 1568, 2349].forEach((f, i) => tone(f, f * 0.98, 0.2, 'sine', 0.04, i * 0.05)),
    wave: () => [392, 523, 659].forEach((f, i) => tone(f, f, 0.14, 'square', 0.04, i * 0.08)),
    win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.18, 'square', 0.05, i * 0.11)),
  };
  function addSongs(S) {
    if (S.tdm1) return;
    S.tdm1 = { bpm: 116, wave: 'triangle', mel: [72, 76, 79, 76, 77, 81, 84, 81, 79, 76, 72, 76, 74, 0, 0, 0, 72, 76, 79, 84, 83, 79, 76, 79, 77, 74, 71, 74, 72, 0, 0, 0], bass: [48, 48, 53, 53, 55, 55, 48, 48], bw: 'triangle', mv: 0.1, pluck: true, hat: true };
    S.tdm2 = { bpm: 124, wave: 'square', mel: [69, 70, 73, 74, 76, 0, 74, 73, 70, 69, 0, 69, 70, 73, 70, 69, 76, 77, 79, 77, 76, 74, 73, 74, 73, 70, 69, 70, 69, 0, 0, 0], bass: [45, 45, 46, 46, 45, 45, 43, 45], bw: 'triangle', mv: 0.045, drum: true };
    S.tdm3 = { bpm: 108, wave: 'sine', mel: [79, 0, 83, 86, 84, 0, 81, 79, 76, 0, 79, 81, 79, 0, 0, 0, 79, 0, 83, 88, 86, 84, 83, 81, 79, 76, 74, 76, 79, 0, 0, 0], bass: [43, 43, 40, 40, 36, 36, 38, 38], bw: 'sine', mv: 0.11, vib: true, pluck: true };
    S.tdm4 = { bpm: 140, wave: 'sawtooth', mel: [64, 0, 64, 67, 0, 64, 70, 0, 69, 0, 67, 0, 64, 0, 62, 0, 64, 0, 64, 67, 0, 64, 71, 0, 72, 71, 69, 67, 64, 0, 0, 0], bass: [40, 40, 40, 40, 43, 43, 38, 38], bw: 'square', mv: 0.04, drum: true };
    S.tdm5 = { bpm: 120, wave: 'square', mel: [62, 65, 69, 74, 73, 69, 65, 62, 61, 64, 69, 73, 72, 69, 64, 61, 58, 62, 65, 70, 69, 65, 62, 58, 57, 61, 64, 69, 68, 64, 61, 0], bass: [38, 38, 37, 37, 34, 34, 33, 33], bw: 'sawtooth', mv: 0.045, drum: true };
    S.tdboss = { bpm: 172, wave: 'square', mel: [62, 62, 74, 62, 72, 62, 70, 69, 62, 62, 74, 62, 72, 70, 69, 67, 60, 60, 72, 60, 70, 60, 69, 67, 65, 64, 62, 64, 65, 67, 69, 0], bass: [38, 38, 38, 38, 36, 36, 34, 33], bw: 'sawtooth', mv: 0.05, drum: true };
  }

  // ---------- 탑 능력치 ----------
  const TS = {
    arrow: { 1: { dmg: 9, rate: 0.55, range: 78, shot: 'arrow', spd: 330, air: true }, 2: { dmg: 14, rate: 0.5, range: 86 }, 3: { dmg: 20, rate: 0.45, range: 94 },
      a: { dmg: 85, rate: 1.5, range: 150, shot: 'snipe', spd: 900, target: 'strong', crit: 0.25 }, b: { dmg: 14, rate: 0.14, range: 96 } },
    ice: { 1: { dmg: 4, rate: 0.9, range: 70, shot: 'shard', spd: 270, slow: 0.4, slowT: 1.6, air: true }, 2: { dmg: 6, rate: 0.85, range: 76, slow: 0.5 }, 3: { dmg: 9, rate: 0.8, range: 82, slow: 0.6, splashSlow: 28 },
      a: { pulse: true, dmg: 14, rate: 1.3, range: 72, slow: 0.65, slowT: 1.8 }, b: { dmg: 60, rate: 1.4, range: 112, shot: 'spear', spd: 430, pierce: true, stun: 0.25, stunT: 1, slow: 0 } },
    bolt: { 1: { dmg: 14, rate: 1.1, range: 74, chain: 3, air: true }, 2: { dmg: 21, rate: 1.05, range: 80, chain: 4 }, 3: { dmg: 29, rate: 1, range: 86, chain: 5 },
      a: { dmg: 36, rate: 1, range: 98, chain: 8 }, b: { dmg: 21, rate: 0.28, range: 86, chain: 2 } },
    cannon: { 1: { dmg: 26, rate: 1.6, range: 84, splash: 26, shot: 'ball', spd: 200 }, 2: { dmg: 40, rate: 1.55, range: 88, splash: 30 }, 3: { dmg: 58, rate: 1.5, range: 94, splash: 34 },
      a: { dmg: 100, rate: 2.6, range: 150, splash: 44, shot: 'shell', spd: 150, burn: 14 }, b: { dmg: 48, rate: 1.3, range: 112, splash: 22, shot: 'missile', spd: 220, count: 2, air: true } },
  };
  function stats(type, lvl, br) { return Object.assign({}, TS[type][1], lvl >= 2 ? TS[type][2] : {}, lvl >= 3 ? TS[type][3] : {}, br ? TS[type][br] : {}); }
  const upCost = (type, lvl) => Math.round(ART().TOWER_INFO[type].cost * (lvl === 1 ? 0.8 : 1.25));
  const brCost = (type) => ART().TOWER_INFO[type].cost * 2;

  // ---------- 웨이브 ----------
  function makeWave(mi, w, bossKey) {
    const q = [];
    const pool = ['slime'];
    if (w >= 2) pool.push('runner');
    if (w >= 3 && mi >= 1) pool.push('flyer');
    if (w >= 4) pool.push('tank');
    if (w >= 5) pool.push('flyer');
    if (w >= 6) pool.push('splitter');
    if (w >= 7) pool.push('healer');
    if (mi >= 1 && w >= 5) pool.push('knight');
    if (w === 10) {
      for (let i = 0; i < 6; i++) q.push({ type: pool[i % pool.length], gap: 0.7 });
      q.push({ type: bossKey, gap: 2.5, boss: true });
      for (let i = 0; i < 8; i++) q.push({ type: pool[(i + 2) % pool.length], gap: i ? 0.7 : 3 });
      return q;
    }
    const n = 8 + w * 2 + mi * 2; let k = 0;
    while (q.length < n) {
      const type = pool[(k * 7 + w) % pool.length]; const g = 3 + (k % 3); k++;
      for (let i = 0; i < g && q.length < n; i++) q.push({ type, gap: type === 'runner' ? 0.45 : type === 'tank' || type === 'knight' ? 1.1 : 0.75 });
      if (q.length) q[q.length - 1].gapAfter = 1.2;
    }
    return q;
  }

  // ---------- 저장 ----------
  const TT = () => (/[?&]tdtest=(\w+)/.exec(location.search) || [])[1] || null;   // 확인용: all(맵 모두 열림) · rich(골드 많이) · boss(10웨이브부터). 기록 저장 안 함
  function prog(p) {
    const S = A.S; S.td = S.td || {};
    const k = `${S.level}-p${p}`;
    const pr = S.td[k] = S.td[k] || { un: 1, stars: [0, 0, 0, 0, 0] };
    return pr;
  }

  // =========================================================
  // 시작 화면
  // =========================================================
  function setup(api, player) {
    A = api; addSongs(A.BGM_SONGS); A.stop(); A.setTheme();
    const S = A.S; const esc = A.esc; const MAPS = ART().MAPS;
    let who = player != null ? player : (S.tdWho || 0);
    const draw = () => {
      const pr = prog(who); const un = TT() ? MAPS.length : pr.un; const best = S.best[`${S.level}-td-p${who}`];
      A.app().innerHTML = `
        ${A.topBar('🏰 단어 타워 디펜스')}
        <div class="qs tds">
          <div class="qs-title"><span>WORD</span> TOWER<small>단어 타워 디펜스</small></div>
          <div class="qs-who">${[0, 1].map((p) => `<button class="qs-hero ${p === who ? 'on' : ''} h${p}" data-p="${p}"><i class="qs-face"></i><b>${p ? '🔵' : '🔴'} ${esc(S.names[p])}</b></button>`).join('')}</div>
          <div class="qs-stages tds-maps">
            ${MAPS.map((m, i) => { const locked = i + 1 > un; const s = pr.stars[i] || 0; return `<button class="qs-stage" data-i="${i}" ${locked ? 'disabled' : ''} style="background:linear-gradient(160deg, ${m.bg[0]} 0%, ${m.bg[1]} 100%)">
              <span class="qs-no">MAP ${i + 1} · ${m.en}</span><b>${m.name}</b><span class="qs-boss">BOSS · ${ART().BOSS_NAME[m.boss]}</span><span class="qs-stars">${locked ? '🔒' : '★'.repeat(s) + '☆'.repeat(3 - s)}</span></button>`; }).join('')}
          </div>
          <p class="pool-count">${esc(A.level().name)} · ${esc(A.rangeLabel())} · ${A.DIFFS[S.diff]}${best != null ? ` · 🏆 최고 ${best.toLocaleString()}점` : ''}</p>
        </div>`;
      A.bindQuit(false);
      A.app().querySelectorAll('.qs-hero').forEach((b) => (b.onclick = () => { who = +b.dataset.p; S.tdWho = who; A.save(); draw(); }));
      A.app().querySelectorAll('.qs-stage').forEach((b) => (b.onclick = () => play(who, +b.dataset.i)));
    };
    draw();
  }

  // =========================================================
  // 게임
  // =========================================================
  function play(player, mi) {
    A.stop(); A.setTheme();
    const AR = ART(); const S = A.S; const esc = A.esc; const map = AR.MAPS[mi]; const L = AR.layout(map);
    const BW = AR.BW; const BH = AR.BH; const tt = TT();
    const DF = { easy: { hp: 0.75, gold: 170 }, normal: { hp: 1, gold: 140 }, hard: { hp: 1.3, gold: 120 } }[S.diff];
    const MAPMULT = [1, 1.3, 1.6, 1.95, 2.3][mi];   // 2026-11-28 밸런스: 뒤쪽 맵이 너무 어려워 완만하게
    const P = A.pool(); let wq = A.T().shuffle(P);

    A.app().innerHTML = `
      <div class="td-wrap" id="tdWrap">
        ${A.topBar(`🏰 MAP ${mi + 1} · ${map.name}`, '<span class="td-stat" id="tdLives">❤️ 20</span><span class="td-stat gold" id="tdGold">💰 0</span><span class="td-stat" id="tdWave">🌊 1/10</span><button class="btn ghost small" id="tdSpeed">▶▶</button><button class="btn ghost small" id="tdMusic">🎵</button><button class="btn ghost small" id="tdPause">⏸</button>')}
        <div class="td-main" id="tdMain">
          <div class="td-board" id="tdBoard">
            <canvas id="tdCv"></canvas>
            <div class="td-menu" id="tdMenu"></div>
            <div class="td-bossbar" id="tdBoss"><span id="tdBossName"></span><b><i id="tdBossHp"></i></b></div>
            <div class="td-banner" id="tdBanner"></div>
            <button class="td-go" id="tdGo"></button>
            <div class="td-target" id="tdTarget">☄️ 유성을 떨어뜨릴 곳을 톡! <button id="tdTargetX">취소</button></div>
            <div class="td-over" id="tdOver"></div>
          </div>
          <div class="td-rotate" id="tdRotate">📱↻ 폰을 가로로 돌리면 전장이 더 커져요</div>
          <div class="td-quiz" id="tdQuiz">
            <div class="tq-head"><span id="tqCombo"></span><span id="tqReward"></span></div>
            <div class="tq-q" id="tqQ"></div>
            <div class="tq-hint" id="tqHint"></div>
            <div class="tq-opts" id="tqOpts"></div>
            <div class="tq-lock" id="tqLock"></div>
            <div class="tq-mana"><span>✨ 마법</span><b><i id="tqMana"></i></b><em id="tqCharge"></em></div>
            <div class="tq-skills"><button class="tq-skill" id="tqMeteor">☄️ 유성<small>Q</small></button><button class="tq-skill" id="tqFreeze">❄️ 얼리기<small>W</small></button></div>
          </div>
        </div>
      </div>`;
    A.bindQuit(); A.fullScreen();
    const $ = (q) => A.app().querySelector(q);
    const cv = $('#tdCv'); const c = cv.getContext('2d'); const board = $('#tdBoard'); const main = $('#tdMain');
    let scale = 1; let dpr = 1; let bg = null; let anims = [];

    function fit() {
      const wrap = $('#tdWrap'); if (!wrap) return;
      wrap.style.height = `${Math.max(380, window.innerHeight - wrap.getBoundingClientRect().top - 6)}px`;
      const mw = main.clientWidth; const mh = main.clientHeight;
      const land = mw > mh * 1.15;
      main.classList.toggle('land', land);
      let bw; let bh;
      if (land) { bw = Math.min(mw - 250, mh * BW / BH); bh = bw * BH / BW; }
      else { bw = mw; bh = bw * BH / BW; if (bh > mh - 230) { bh = mh - 230; bw = bh * BW / BH; } }
      bw = Math.floor(bw); bh = Math.floor(bh);
      board.style.width = `${bw}px`; board.style.height = `${bh}px`;
      $('#tdRotate').classList.toggle('show', !land && mw < 640);
      dpr = Math.min(2, window.devicePixelRatio || 1); scale = bw / BW;
      cv.width = Math.round(bw * dpr); cv.height = Math.round(bh * dpr); cv.style.width = `${bw}px`; cv.style.height = `${bh}px`;
      bg = document.createElement('canvas'); bg.width = cv.width; bg.height = cv.height;
      const bc = bg.getContext('2d'); bc.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0); anims = AR.renderMap(bc, map, L, 77 + mi * 13);
      if (menu) placeMenu();
    }

    // ----- 상태 -----
    let lives = 20; let gold = tt && tt.indexOf('rich') >= 0 ? 5000 : DF.gold; let score = 0; const tBoss = !!tt && tt.indexOf('boss') >= 0; let wave = tBoss ? 10 : 1; let state = 'prep'; let prepT = tBoss ? 3 : 15;
    let queue = []; let spawnT = 0; let mons = []; const towers = []; let shots = []; let parts = []; let pops = [];
    let speed = 1; let paused = false; let over = false; let t = 0; let castleHit = 0; let shake = 0; let freezeAll = 0;
    let mana = 0; let combo = 0; let menu = null; let targeting = false; let boss = null; let leaked = 0;
    const missed = []; let qn = 0; let quiz = null; let lockT = 0; let mid = 0;
    const bgm = A.makeBgm(); A.onStop(() => bgm.dispose()); bgm.play(map.song);
    const musicBtn = () => $('#tdMusic').classList.toggle('off', !bgm.on);
    $('#tdMusic').onclick = () => { bgm.setOn(!bgm.on); musicBtn(); }; musicBtn();
    const timers = []; const later = (fn, ms) => timers.push(setTimeout(fn, ms)); A.onStop(() => timers.forEach(clearTimeout));

    // ----- HUD -----
    let hk = '';
    function hud() {
      const k = `${lives}|${gold}|${wave}|${state}|${Math.ceil(prepT)}|${mana}|${boss ? Math.ceil(boss.hp) : ''}`; if (k === hk) return; hk = k;
      $('#tdLives').textContent = `❤️ ${lives}`; $('#tdLives').classList.toggle('low', lives <= 5);
      $('#tdGold').textContent = `💰 ${gold.toLocaleString()}`; $('#tdWave').textContent = `🌊 ${Math.min(wave, 10)}/10`;
      const go = $('#tdGo');
      if (state === 'prep' && !over) { go.style.display = ''; go.innerHTML = `${wave === 10 ? '⚠ 보스 웨이브' : `🌊 웨이브 ${wave}`} 시작 ▶ <small>${Math.ceil(prepT)}초${wave > 1 || prepT < 15 ? ` · 지금 시작하면 +${Math.ceil(prepT) * 2}💰` : ''}</small>`; }
      else go.style.display = 'none';
      $('#tqMana').style.width = `${(mana % 5) / 5 * 100}%`;
      const ch = Math.floor(mana / 5); $('#tqCharge').textContent = ch ? `${'◆'.repeat(ch)}` : '';
      $('#tqMeteor').disabled = ch < 1; $('#tqFreeze').disabled = ch < 1;
      if (boss) $('#tdBossHp').style.width = `${clamp(boss.hp / boss.max, 0, 1) * 100}%`;
    }
    let bannerT; function banner(html, cls, ms) { const b = $('#tdBanner'); b.innerHTML = html; b.className = `td-banner show ${cls || ''}`; clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('show'), ms || 1600); }
    A.onStop(() => clearTimeout(bannerT));

    // ----- 문제판 -----
    function nextQ() {
      if (!wq.length) wq = A.T().shuffle(P);
      const w = wq.shift(); const en2ko = qn % 2 === 0; qn++;
      const opts = A.T().shuffle([w, ...A.distractors(w, 2, P)]);
      quiz = { w, opts, en2ko, done: false };
      if (tt && tt.indexOf('bot') >= 0) window.__tdRight = opts.indexOf(w);   // 확인용 자동 플레이
      $('#tqQ').innerHTML = en2ko ? `<span class="en">${esc(w.word)}</span> <button class="icon-btn" id="tqSay" aria-label="듣기">🔊</button>` : esc(A.short(w));
      $('#tqHint').textContent = en2ko ? '뜻을 골라요' : '영어 단어를 골라요';
      $('#tqOpts').innerHTML = opts.map((o, i) => `<button class="tq-opt ${en2ko ? '' : 'en'}" data-i="${i}"><small>${i + 1}</small>${esc(en2ko ? A.short(o) : o.word)}</button>`).join('');
      $('#tqOpts').querySelectorAll('.tq-opt').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); answer(+b.dataset.i); }));
      const sb = $('#tqSay'); if (sb) sb.onclick = () => A.say(w);
      $('#tqReward').textContent = `맞히면 +${reward()}💰`;
      $('#tqCombo').textContent = combo >= 2 ? `🔥 ${combo}연속` : '';
    }
    const reward = () => 10 + Math.min(combo, 5) * 2;
    function answer(i) {
      if (!quiz || quiz.done || lockT > 0 || over) return;
      quiz.done = true; const ok = quiz.opts[i] === quiz.w; const w = quiz.w;
      $('#tqOpts').querySelectorAll('.tq-opt').forEach((b, k) => { b.disabled = true; if (quiz.opts[k] === w) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); });
      if (ok) {
        const g = reward(); gold += g; score += g; combo++; mana = Math.min(15, mana + 1); A.sfx(combo % 5 === 0 ? 'combo' : 'ok'); A.sayAfter(w);
        if (mana % 5 === 0) banner('✨ 마법 1칸 충전!', 'good', 1000);
        const q = $('#tdQuiz'); q.classList.remove('ok'); void q.offsetWidth; q.classList.add('ok');
        later(nextQ, 380);
      } else {
        combo = 0; missed.push(w); A.sfx('bad'); A.say(w); lockT = 2;
        $('#tqLock').innerHTML = `<b>2초 쉬어요</b><span>${esc(w.word)} = ${esc(A.short(w))}</span>`; $('#tqLock').classList.add('show');
        later(() => { $('#tqLock').classList.remove('show'); nextQ(); }, 2000);
      }
      hud();
    }

    // ----- 탑 메뉴 -----
    function towerAt(x, y) { return towers.find((tw) => Math.hypot(tw.x - x, tw.y - y) < 15); }
    function padAt(x, y) { return L.pads.find((p) => Math.hypot(p.x - x, p.y - y) < 15 && !towers.some((tw) => tw.pad === p)); }
    function closeMenu() { menu = null; $('#tdMenu').innerHTML = ''; $('#tdMenu').classList.remove('show'); }
    function openMenu(m) { menu = m; buildMenu(); }
    function buildMenu() {
      const el = $('#tdMenu'); const TI = AR.TOWER_INFO; let items = [];
      if (menu.pad) {
        items = Object.keys(TI).map((type) => ({ icon: AR.towerIcon(type), label: TI[type].name, cost: TI[type].cost, act: () => build(menu.pad, type) }));
      } else {
        const tw = menu.tw; const info = TI[tw.type];
        if (!tw.br && tw.lvl < 3) items.push({ icon: AR.towerIcon(tw.type), label: `⬆ ${tw.lvl + 1}단계`, cost: upCost(tw.type, tw.lvl), act: () => upgrade(tw) });
        if (!tw.br && tw.lvl === 3) ['a', 'b'].forEach((b) => items.push({ icon: AR.towerIcon(tw.type, b), label: info[b].name, cost: brCost(tw.type), act: () => evolve(tw, b) }));
        items.push({ sell: true, label: '팔기', cost: -Math.floor(tw.spent * 0.7), act: () => sell(tw) });
      }
      const n = items.length;
      el.innerHTML = `<div class="td-menu-title">${menu.pad ? '탑 짓기' : `${menu.tw.br ? AR.TOWER_INFO[menu.tw.type][menu.tw.br].name : `${AR.TOWER_INFO[menu.tw.type].name} ${menu.tw.lvl}단계`}`}</div>` + items.map((it, i) => {
        const ang = -Math.PI / 2 + (i - (n - 1) / 2) * (n > 3 ? 0.95 : 1.15);
        const can = it.sell || gold >= it.cost;
        return `<button class="td-mi ${it.sell ? 'sell' : ''} ${can ? '' : 'poor'}" data-i="${i}" style="--dx:${Math.cos(ang) * 58}px;--dy:${Math.sin(ang) * 58 + 4}px">${it.sell ? '<i>💰</i>' : `<img src="${it.icon}" alt="">`}<span>${it.label}</span><b>${it.sell ? `+${-it.cost}` : `${it.cost}💰`}</b></button>`;
      }).join('');
      el.classList.add('show'); placeMenu();
      el.querySelectorAll('.td-mi').forEach((b) => b.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation(); const it = items[+b.dataset.i];
        if (!it.sell && gold < it.cost) { banner(`💰 골드가 ${it.cost - gold} 모자라요 — 단어를 맞혀요!`, 'bad', 1300); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return; }
        it.act();
      }));
    }
    function placeMenu() { const el = $('#tdMenu'); const p = menu.pad || menu.tw; el.style.left = `${p.x * scale}px`; el.style.top = `${p.y * scale}px`; }
    function build(pad, type) {
      const cost = AR.TOWER_INFO[type].cost; gold -= cost;
      const tw = { type, lvl: 1, br: null, x: pad.x, y: pad.y, pad, cd: 0.2, ang: 0, kick: 0, spent: cost, frozen: 0, sealed: 0 };
      tw.s = stats(type, 1, null); towers.push(tw); SND.build(); dust(pad.x, pad.y, '#c8c0b0'); closeMenu(); hud();
    }
    function upgrade(tw) { const cost = upCost(tw.type, tw.lvl); gold -= cost; tw.spent += cost; tw.lvl++; tw.s = stats(tw.type, tw.lvl, null); SND.up(); sparkle(tw.x, tw.y - 14, '#ffe35a'); openMenu({ tw }); hud(); }
    function evolve(tw, b) { const cost = brCost(tw.type); gold -= cost; tw.spent += cost; tw.br = b; tw.s = stats(tw.type, 3, b); SND.up(); sparkle(tw.x, tw.y - 14, '#ff7ae0'); sparkle(tw.x, tw.y - 14, '#ffffff'); banner(`✨ ${AR.TOWER_INFO[tw.type][b].name}으로 진화!`, 'good', 1300); closeMenu(); hud(); }
    function sell(tw) { const g = Math.floor(tw.spent * 0.7); gold += g; towers.splice(towers.indexOf(tw), 1); SND.sell(); coinPop(tw.x, tw.y - 10, g); dust(tw.x, tw.y, '#c8c0b0'); closeMenu(); hud(); }

    // ----- 입력 -----
    function boardXY(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale]; }
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault(); if (over || paused) return;
      const [x, y] = boardXY(e);
      if (targeting) { castMeteor(x, y); return; }
      const tw = towerAt(x, y); if (tw) { if (menu && menu.tw === tw) closeMenu(); else openMenu({ tw }); return; }
      const pad = padAt(x, y); if (pad) { if (menu && menu.pad === pad) closeMenu(); else openMenu({ pad }); return; }
      closeMenu();
    });
    $('#tdGo').onclick = () => { if (state !== 'prep') return; const bonus = wave > 1 || prepT < 15 ? Math.ceil(prepT) * 2 : 0; if (bonus) { gold += bonus; banner(`⏩ 빨리 시작 +${bonus}💰`, 'good', 900); } startWave(); };
    $('#tdSpeed').onclick = () => { speed = speed === 1 ? 2 : 1; $('#tdSpeed').classList.toggle('on', speed === 2); };
    $('#tdPause').onclick = () => setPause(!paused);
    $('#tqMeteor').onclick = () => { if (Math.floor(mana / 5) < 1 || over) return; targeting = !targeting; $('#tdTarget').classList.toggle('show', targeting); closeMenu(); };
    $('#tdTargetX').onclick = (e) => { e.stopPropagation(); targeting = false; $('#tdTarget').classList.remove('show'); };
    $('#tqFreeze').onclick = () => castFreeze();
    A.T().setKey((e) => {
      if (e.repeat) return; const k = e.key.toLowerCase();
      if (['1', '2', '3'].indexOf(k) >= 0) answer(+k - 1);
      else if (k === 'q') $('#tqMeteor').onclick();
      else if (k === 'w') castFreeze();
      else if (k === ' ' && state === 'prep') { e.preventDefault(); $('#tdGo').onclick(); }
      else if (k === 'p' || k === 'escape') setPause(!paused);
    });
    function setPause(v) {
      if (over) return; paused = v; $('#tdPause').textContent = v ? '▶' : '⏸';
      const o = $('#tdOver');
      if (v) { bgm.stop(); o.innerHTML = '<div class="td-panel"><h3>PAUSE</h3><div class="q-row"><button class="q-pbtn" id="tdResume">▶ 계속하기</button><button class="q-pbtn ghost" id="tdToMap">🗺️ 맵 고르기</button></div></div>'; o.classList.add('show'); $('#tdResume').onclick = () => setPause(false); $('#tdToMap').onclick = () => setup(A, player); }
      else { o.classList.remove('show'); bgm.resume(); last = performance.now(); }
    }
    A.setHelpPause((v) => setPause(v));
    const onVis = () => { if (document.hidden && !paused) setPause(true); };
    document.addEventListener('visibilitychange', onVis); A.onStop(() => document.removeEventListener('visibilitychange', onVis));
    window.addEventListener('resize', fit); A.onStop(() => window.removeEventListener('resize', fit));

    // ----- 마법 -----
    function castMeteor(x, y) {
      targeting = false; $('#tdTarget').classList.remove('show');
      if (Math.floor(mana / 5) < 1) return; mana -= 5;
      shots.push({ k: 'meteor', x, y, t: 0, fall: 0.6 }); SND.meteor(); hud();
    }
    function castFreeze() {
      if (Math.floor(mana / 5) < 1 || over) return; mana -= 5; freezeAll = 4; SND.freeze();
      board.classList.remove('frozen'); void board.offsetWidth; board.classList.add('frozen'); later(() => board.classList.remove('frozen'), 4000 / speed);
      banner('❄️ 모두 꽁꽁!', 'good', 1100); hud();
    }

    // ----- 효과 -----
    function dust(x, y, col) { for (let i = 0; i < 10; i++) { const a = Math.random() * Math.PI * 2; parts.push({ x, y, vx: Math.cos(a) * 40, vy: Math.sin(a) * 25 - 10, life: 0.5, max: 0.5, col, r: 2 + Math.random() * 2 }); } }
    function sparkle(x, y, col) { for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2; const v = 30 + Math.random() * 50; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6, max: 0.6, col, r: 1.5, glow: true }); } }
    function coinPop(x, y, n) { pops.push({ x, y, txt: `+${n}`, life: 0.9, coin: true }); }
    function boom(x, y, r, col) { shots.push({ k: 'boom', x, y, r, t: 0, life: 0.4, col }); for (let i = 0; i < 12; i++) { const a = Math.random() * Math.PI * 2; const v = 30 + Math.random() * 60; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0.5, max: 0.5, col: i % 2 ? '#ffb03a' : '#5a5060', r: 1.5 + Math.random() * 2 }); } }

    // ----- 괴물 -----
    function spawn(type, d, opts) {
      const D = AR.MON[type]; const o = opts || {};
      const hpMul = D.boss ? DF.hp : (1 + 0.15 * (wave - 1)) * MAPMULT * DF.hp;
      const hp = Math.round((o.hp || D.hp) * hpMul);
      const m = { id: ++mid, type, hp, max: hp, d: d || 0, x: -20, y: 0, slowT: 0, slowF: 0, stunT: 0, burnT: 0, burnD: 0, flash: 0, seed: Math.random(), fx: 1, abil: 3, shield: 0, hidden: 0, stompT: 0 };
      const p = AR.posAt(L, m.d); m.x = p.x; m.y = p.y; mons.push(m);
      if (D.boss) {
        boss = m; bgm.play('tdboss'); SND.roar(); shake = 6;
        $('#tdBossName').textContent = `BOSS · ${AR.BOSS_NAME[type]}`; $('#tdBoss').classList.add('show');
        banner(`⚠ BOSS ⚠<small>${AR.BOSS_NAME[type]}</small>`, 'boss', 1800);
      }
      return m;
    }
    function hit(m, dmg, ignoreArmor, src) {
      if (m.dead || m.hidden) return;
      if (m.shield > 0) { sparkle(m.x, m.y - 20, '#d0a0ff'); return; }
      const D = AR.MON[m.type]; let d = dmg;
      if (D.armor && !ignoreArmor) d = Math.max(dmg * 0.25, dmg - D.armor);
      m.hp -= d; m.flash = 0.07;
      if (src === 'crit') pops.push({ x: m.x, y: m.y - 22, txt: `${Math.round(d)}!`, life: 0.7, crit: true });
      if (m.hp <= 0) kill(m);
    }
    function kill(m) {
      if (m.dead) return; m.dead = true; const D = AR.MON[m.type];
      gold += D.gold; score += D.gold; coinPop(m.x, m.y - 14, D.gold); SND.coin();
      for (let i = 0; i < (D.boss ? 40 : 10); i++) { const a = Math.random() * Math.PI * 2; const v = 20 + Math.random() * (D.boss ? 120 : 50); parts.push({ x: m.x, y: m.y - D.r * 0.6, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0.6, max: 0.6, col: i % 3 ? map.tint : '#ffffff', r: 1.5 + Math.random() * 2, glow: D.boss }); }
      if (m.type === 'splitter') for (let k = 0; k < 2; k++) spawn('mini', Math.max(0, m.d - k * 8), { hp: D.hp * 0.3 });
      if (m.type === 'kingslime') for (let k = 0; k < 4; k++) spawn('slime', Math.max(0, m.d - k * 10), { hp: 160 });
      if (D.boss) { boss = null; $('#tdBoss').classList.remove('show'); shake = 8; boom(m.x, m.y - 10, 50, '#ffffff'); banner(`🎉 ${AR.BOSS_NAME[m.type]} 물리침!`, 'good', 1600); bgm.play(map.song); }
    }
    function bossAbility(m, dt) {
      m.abil -= dt; if (m.stompT > 0) m.stompT -= dt; if (m.shield > 0) m.shield -= dt; if (m.hidden > 0) { m.hidden -= dt; if (m.hidden <= 0) m.hidden = 0; }
      if (m.abil > 0) return;
      switch (m.type) {
        case 'scorpion': m.hidden = 2; m.abil = 6; banner('🦂 땅속으로 숨었어요!', 'bad', 1000); break;
        case 'giant': m.abil = 7; m.stompT = 0.4; shake = 5; SND.boom(); shots.push({ k: 'pulse', x: m.x, y: m.y, r: 95, t: 0, life: 0.6, col: '#8ae0ff' });
          towers.forEach((tw) => { if (Math.hypot(tw.x - m.x, tw.y - m.y) < 95) tw.frozen = 2.5; }); banner('🧊 쿵! 주변 탑이 얼었어요', 'bad', 1100); break;
        case 'dragon': m.abil = 6; for (let k = 0; k < 3; k++) spawn('imp', Math.max(0, m.d - 10 - k * 12)); banner('🔥 불꼬마 소환!', 'bad', 900); break;
        case 'demon': m.abil = 9; m.shield = 2; spawn('knight', Math.max(0, m.d - 12)); spawn('knight', Math.max(0, m.d - 26));
          if (m.hp < m.max / 2 && towers.length) { const tw = towers[Math.floor(Math.random() * towers.length)]; tw.sealed = 2.5; banner('🔮 마왕이 탑을 봉인했어요!', 'bad', 1100); } else banner('🛡 마왕의 보호막!', 'bad', 1000);
          break;
        default: m.abil = 99;
      }
    }

    // ----- 웨이브 -----
    function startWave() {
      state = 'run'; queue = makeWave(mi, wave, map.boss); spawnT = 0.3; SND.wave();
      banner(wave === 10 ? '⚠ 마지막 웨이브 ⚠' : `🌊 웨이브 ${wave}`, wave === 10 ? 'boss' : '', 1300); hud();
    }
    function waveDone() {
      const bonus = 20 + wave * 4; gold += bonus; score += bonus;
      if (wave >= 10) { victory(); return; }
      banner(`웨이브 ${wave} 통과! +${bonus}💰`, 'good', 1500); wave++; state = 'prep'; prepT = 9; hud();
    }

    // ----- 탑 공격 -----
    function inRange(tw, m, r) { return Math.hypot(m.x - tw.x, m.y - tw.y) <= r; }
    function canHit(tw, m) { const D = AR.MON[m.type]; return !m.dead && !m.hidden && (!D.fly || tw.s.air) && m.d > 4; }
    function pickTarget(tw) {
      let best = null;
      mons.forEach((m) => { if (!canHit(tw, m) || !inRange(tw, m, tw.s.range)) return; if (!best || (tw.s.target === 'strong' ? m.hp > best.hp : m.d > best.d)) best = m; });
      return best;
    }
    function fire(tw) {
      const s = tw.s; const tg = pickTarget(tw); if (!tg) return false;
      tw.ang = Math.atan2(tg.y - (tw.y - 18), tg.x - tw.x); tw.kick = 0.12;
      if (tw.type === 'bolt') {
        const hitList = [tg]; let cur = tg; let dmg = s.dmg;
        for (let k = 1; k < s.chain; k++) { let nx = null; let nd = 1e9; mons.forEach((m) => { if (hitList.indexOf(m) >= 0 || m.dead || m.hidden) return; const d = Math.hypot(m.x - cur.x, m.y - cur.y); if (d < 55 && d < nd) { nd = d; nx = m; } }); if (!nx) break; hitList.push(nx); cur = nx; }
        const pts = [[tw.x, tw.y - 25]]; hitList.forEach((m, i) => { pts.push([m.x, m.y - 6]); hit(m, dmg * Math.pow(0.85, i), true); });
        shots.push({ k: 'bolt', pts, t: 0, life: 0.18 }); SND.bolt(); return true;
      }
      if (s.pulse) {
        mons.forEach((m) => { if (!m.dead && !m.hidden && inRange(tw, m, s.range)) { hit(m, s.dmg); m.slowT = s.slowT; m.slowF = Math.max(m.slowF, s.slow); } });
        shots.push({ k: 'pulse', x: tw.x, y: tw.y - 6, r: s.range, t: 0, life: 0.5, col: '#bff4ff' }); SND.ice(); return true;
      }
      const sx = tw.x; const sy = tw.y - (tw.type === 'cannon' ? 8 : 20);
      const n = s.count || 1;
      for (let k = 0; k < n; k++) {
        const sh = { k: s.shot, x: sx, y: sy, tg, tx: tg.x, ty: tg.y, spd: s.spd, tw, t: 0, ang: tw.ang + (k ? 0.5 : 0), hitIds: [] };
        if (s.shot === 'ball' || s.shot === 'shell') { const d = Math.hypot(tg.x - sx, tg.y - sy); sh.life = d / s.spd; sh.sx = sx; sh.sy = sy; sh.arc = d * 0.3; }
        if (s.shot === 'spear') { sh.vx = Math.cos(tw.ang) * s.spd; sh.vy = Math.sin(tw.ang) * s.spd; sh.life = (s.range + 30) / s.spd; }
        shots.push(sh);
      }
      ({ arrow: SND.arrow, ice: SND.ice, cannon: SND.cannon }[tw.type] || SND.arrow)();
      return true;
    }
    function impact(sh) {
      const s = sh.tw.s;
      if (s.splash) {
        mons.forEach((m) => { if (m.dead || m.hidden) return; const D = AR.MON[m.type]; if (D.fly && !s.air) return; if (Math.hypot(m.x - sh.x, m.y - sh.y) < s.splash) { hit(m, s.dmg); if (s.burn) { m.burnT = 3; m.burnD = s.burn; } } });
        boom(sh.x, sh.y, s.splash, sh.k === 'missile' ? '#ffb03a' : '#ffa040'); SND.boom(); if (sh.k === 'shell') shake = Math.max(shake, 2);
        return;
      }
      const m = sh.tg; if (!m || m.dead) return;
      let dmg = s.dmg; let src = null; if (s.crit && Math.random() < s.crit) { dmg *= 2.5; src = 'crit'; }
      hit(m, dmg, false, src);
      if (s.slow) { m.slowT = s.slowT || 1.5; m.slowF = Math.max(m.slowF, s.slow); if (s.splashSlow) mons.forEach((o) => { if (o !== m && !o.dead && Math.hypot(o.x - m.x, o.y - m.y) < s.splashSlow) { o.slowT = s.slowT || 1.5; o.slowF = Math.max(o.slowF, s.slow * 0.7); } }); }
    }

    // ----- 갱신 -----
    function update(dt) {
      t += dt; sndBudget = Math.max(0, sndBudget - dt * 30);
      if (castleHit > 0) castleHit -= dt; if (shake > 0) shake = Math.max(0, shake - dt * 12); if (freezeAll > 0) freezeAll -= dt;
      if (state === 'prep') { prepT -= dt; if (prepT <= 0) startWave(); }
      else if (state === 'run') {
        if (queue.length) { spawnT -= dt; if (spawnT <= 0) { const q = queue.shift(); spawn(q.type, 0); spawnT = (q.gapAfter || 0) + (queue.length ? queue[0].gap : 0); } }
        else if (!mons.some((m) => !m.dead)) waveDone();
      }
      // 괴물
      mons.forEach((m) => {
        if (m.dead) return; const D = AR.MON[m.type];
        if (m.flash > 0) m.flash -= dt; if (m.slowT > 0) { m.slowT -= dt; if (m.slowT <= 0) m.slowF = 0; } if (m.stunT > 0) m.stunT -= dt; if (m.healPulse > 0) m.healPulse -= dt * 1.5;
        if (m.burnT > 0) { m.burnT -= dt; hit(m, m.burnD * dt, true); if (m.dead) return; }
        if (D.boss) bossAbility(m, dt);
        if (m.type === 'healer') { m.healT = (m.healT || 1) - dt; if (m.healT <= 0) { m.healT = 1; m.healPulse = 1; mons.forEach((o) => { if (o !== m && !o.dead && !AR.MON[o.type].boss && Math.hypot(o.x - m.x, o.y - m.y) < 50) o.hp = Math.min(o.max, o.hp + o.max * 0.08); }); } }
        const stop = m.stunT > 0 || freezeAll > 0;
        const sp = D.spd * (1 - m.slowF) * (m.hidden ? 1.6 : 1);
        if (!stop) m.d += sp * dt;
        const p = AR.posAt(L, m.d); if (p.dx) m.fx = p.dx; m.x = p.x; m.y = p.y;
        if (m.d >= L.len) {
          m.dead = true; lives -= D.lives; leaked += D.lives; castleHit = 0.5; shake = 3; SND.leak();
          if (D.boss) { boss = null; $('#tdBoss').classList.remove('show'); bgm.play(map.song); }
          if (lives <= 0) { lives = 0; defeat(); }
        }
      });
      mons = mons.filter((m) => !m.dead);
      // 탑
      towers.forEach((tw) => {
        if (tw.kick > 0) tw.kick -= dt; if (tw.frozen > 0) { tw.frozen -= dt; return; } if (tw.sealed > 0) { tw.sealed -= dt; return; }
        tw.cd -= dt; if (tw.cd <= 0) { if (fire(tw)) tw.cd = tw.s.rate; else tw.cd = 0.1; }
        if (tw.type !== 'ice' && tw.type !== 'bolt') { const tg = pickTarget(tw); if (tg) { const want = Math.atan2(tg.y - (tw.y - 18), tg.x - tw.x); tw.ang += Math.atan2(Math.sin(want - tw.ang), Math.cos(want - tw.ang)) * Math.min(1, dt * 12); } }
      });
      // 탄
      shots = shots.filter((sh) => {
        sh.t += dt;
        switch (sh.k) {
          case 'arrow': case 'snipe': case 'shard': case 'missile': {
            if (sh.tg && !sh.tg.dead && !sh.tg.hidden) { sh.tx = sh.tg.x; sh.ty = sh.tg.y - 6; }
            else if (sh.k === 'missile') { let best = null; let bd = 1e9; mons.forEach((m) => { if (m.dead || m.hidden) return; const d = Math.hypot(m.x - sh.x, m.y - sh.y); if (d < bd) { bd = d; best = m; } }); if (best) sh.tg = best; }
            const dx = sh.tx - sh.x; const dy = sh.ty - sh.y; const d = Math.hypot(dx, dy) || 1;
            if (sh.k === 'missile') { const want = Math.atan2(dy, dx); sh.ang += Math.atan2(Math.sin(want - sh.ang), Math.cos(want - sh.ang)) * Math.min(1, dt * 7); sh.x += Math.cos(sh.ang) * sh.spd * dt; sh.y += Math.sin(sh.ang) * sh.spd * dt; if (Math.random() < 0.5) parts.push({ x: sh.x, y: sh.y, vx: 0, vy: -6, life: 0.4, max: 0.4, col: 'rgba(200,200,210,.8)', r: 2 }); }
            else { sh.ang = Math.atan2(dy, dx); const st = Math.min(d, sh.spd * dt); sh.x += (dx / d) * st; sh.y += (dy / d) * st; }
            if (d < 6) { if (sh.k === 'missile') { sh.x = sh.tx; sh.y = sh.ty; } impact(sh); return false; }
            return sh.t < 3;
          }
          case 'spear': {
            sh.x += sh.vx * dt; sh.y += sh.vy * dt;
            mons.forEach((m) => { if (m.dead || m.hidden || sh.hitIds.indexOf(m.id) >= 0) return; if (Math.hypot(m.x - sh.x, m.y - 6 - sh.y) < AR.MON[m.type].r + 4) { sh.hitIds.push(m.id); hit(m, sh.tw.s.dmg); if (Math.random() < sh.tw.s.stun && !AR.MON[m.type].boss) m.stunT = sh.tw.s.stunT; } });
            return sh.t < sh.life;
          }
          case 'ball': case 'shell': {
            const f = Math.min(1, sh.t / sh.life); sh.x = sh.sx + (sh.tx - sh.sx) * f; sh.y = sh.sy + (sh.ty - sh.sy) * f; sh.h = Math.sin(f * Math.PI) * sh.arc;
            if (f >= 1) { impact(sh); return false; } return true;
          }
          case 'meteor':
            if (sh.t >= sh.fall && !sh.done) {
              sh.done = true; const dmg = 320 * (1 + mi * 0.6) * DF.hp;
              mons.forEach((m) => { if (!m.dead && !m.hidden && Math.hypot(m.x - sh.x, m.y - sh.y) < 40) { hit(m, dmg, true); m.burnT = 3; m.burnD = 20; } });
              boom(sh.x, sh.y, 46, '#ff7a2a'); shake = 7; return false;
            }
            return true;
          default: return sh.t < (sh.life || 0.5);
        }
      });
      parts = parts.filter((q) => { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 60 * dt; return q.life > 0; });
      pops = pops.filter((q) => { q.life -= dt; q.y -= 20 * dt; return q.life > 0; });
    }

    // ----- 그리기 -----
    function render() {
      c.setTransform(1, 0, 0, 1, 0, 0);
      if (bg) c.drawImage(bg, 0, 0);
      const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0; const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      c.setTransform(scale * dpr, 0, 0, scale * dpr, sx * scale * dpr, sy * scale * dpr);
      AR.drawAnims(c, anims, t);
      if (menu) { const p = menu.tw || menu.pad; const r = menu.tw ? menu.tw.s.range : 78; c.fillStyle = 'rgba(255,255,255,.12)'; c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.2; c.setLineDash([4, 4]); c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill(); c.stroke(); c.setLineDash([]); }
      if (state === 'prep' || menu) L.pads.forEach((p) => { if (!towers.some((tw) => tw.pad === p)) { c.strokeStyle = `rgba(255,240,140,${0.35 + Math.sin(t * 4) * 0.25})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(p.x, p.y - 1, 12, 9, 0, 0, Math.PI * 2); c.stroke(); } });
      // 아래에서 위 순서로 (겹침)
      const draws = [];
      towers.forEach((tw) => draws.push({ y: tw.y, f: () => AR.drawTower(c, tw, t) }));
      mons.forEach((m) => draws.push({ y: m.y + (AR.MON[m.type].fly ? 20 : 0), f: () => AR.drawMonster(c, m, t, map) }));
      draws.sort((a, b) => a.y - b.y).forEach((d) => d.f());
      AR.drawCastle(c, L, t, castleHit, lives);
      shots.forEach((sh) => AR.drawShot(c, sh, t));
      parts.forEach((q) => { const a = clamp(q.life / q.max, 0, 1); if (q.glow) AR.glow(c, q.x, q.y, q.r * 3, q.col, a); else { c.globalAlpha = a; AR.circle(c, q.x, q.y, q.r, q.col); c.globalAlpha = 1; } });
      pops.forEach((q) => {
        const a = clamp(q.life * 2, 0, 1); c.globalAlpha = a;
        if (q.coin) AR.drawCoin(c, q.x - 8, q.y - 3, a);
        c.font = `900 ${q.crit ? 12 : 9}px "Fredoka", "Jua", sans-serif`; c.textAlign = 'center'; c.lineWidth = 2.5; c.strokeStyle = 'rgba(20,12,28,.85)'; c.strokeText(q.txt, q.x + (q.coin ? 3 : 0), q.y); c.fillStyle = q.crit ? '#ff7ae0' : '#ffe35a'; c.fillText(q.txt, q.x + (q.coin ? 3 : 0), q.y); c.globalAlpha = 1;
      });
      if (freezeAll > 0) { c.fillStyle = `rgba(180,230,255,${0.18 + Math.sin(t * 6) * 0.04})`; c.fillRect(0, 0, BW, BH); }
      if (lives <= 5 && !over) { c.fillStyle = `rgba(255,40,60,${0.08 + Math.sin(t * 5) * 0.05})`; c.fillRect(0, 0, BW, BH); }
    }

    // ----- 끝 -----
    function victory() {
      over = true; bgm.stop(); SND.win(); closeMenu();
      const stars = lives >= 18 ? 3 : lives >= 10 ? 2 : 1; const fin = score + lives * 30;
      if (!tt) {
        const pr = prog(player); pr.stars[mi] = Math.max(pr.stars[mi] || 0, stars); pr.un = Math.max(pr.un, Math.min(AR.MAPS.length, mi + 2));
        const k = `${S.level}-td-p${player}`; if (!(S.best[k] >= fin)) S.best[k] = fin; A.save();
      }
      const last2 = mi === AR.MAPS.length - 1; const o = $('#tdOver');
      o.innerHTML = `<div class="td-panel clear"><h3>VICTORY!</h3>
        <div class="qc-stars">${[0, 1, 2].map((i) => `<i class="${i < stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</i>`).join('')}</div>
        <ul class="qc-list"><li class="ok">🏰 성을 지켰어요 — 남은 ❤️ ${lives}</li><li>★★★ ❤️ 18 이상 · ★★ ❤️ 10 이상</li><li>📖 놓친 단어 ${missed.length}개</li></ul>
        <p class="qc-score">점수 <b>${fin.toLocaleString()}</b></p>
        <div class="q-row">${last2 ? '' : `<button class="q-pbtn" id="tdNext">다음: ${esc(AR.MAPS[mi + 1].name)} ▶</button>`}<button class="q-pbtn ghost" id="tdRes">결과·놓친 단어</button><button class="q-pbtn ghost" id="tdToMap2">🗺️ 맵 고르기</button></div></div>`;
      o.classList.add('show');
      const nx = $('#tdNext'); if (nx) nx.onclick = () => play(player, mi + 1);
      $('#tdRes').onclick = () => finish(true, fin); $('#tdToMap2').onclick = () => setup(A, player);
    }
    function defeat() {
      over = true; bgm.stop(); SND.leak(); closeMenu();
      const o = $('#tdOver');
      o.innerHTML = `<div class="td-panel over"><h3>성이 무너졌어요</h3><p>웨이브 ${wave} / 10 · 점수 <b>${score.toLocaleString()}</b></p><p class="td-tip">💡 문제를 많이 맞혀 골드를 벌고, 탑을 강화·진화시켜 보세요!</p>
        <div class="q-row"><button class="q-pbtn" id="tdRetry">🔁 다시 도전</button><button class="q-pbtn ghost" id="tdRes2">결과·놓친 단어</button><button class="q-pbtn ghost" id="tdToMap3">🗺️ 맵 고르기</button></div></div>`;
      o.classList.add('show');
      $('#tdRetry').onclick = () => play(player, mi); $('#tdRes2').onclick = () => finish(false, score); $('#tdToMap3').onclick = () => setup(A, player);
    }
    function finish(won, fin) {
      A.showResult('td', { big: won ? `🏰 ${map.name} 클리어!` : `웨이브 ${wave}까지`, sub: `${esc(S.names[player])} · 점수 ${fin.toLocaleString()} · 남은 ❤️ ${lives}`, score: tt ? null : fin, missed, again: () => setup(A, player), againMissed: null });
    }

    // ----- 반복 -----
    let raf; let last = performance.now();
    function loop(ts) {
      raf = requestAnimationFrame(loop);
      try {
        const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000)); last = ts;
        if (lockT > 0) lockT -= dt;
        if (!paused && !over) update(dt * speed);
        else if (over) { t += dt; parts = parts.filter((q) => { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; return q.life > 0; }); }
        render(); hud();
      } catch (err) { if (window.console) console.error(err); }
    }
    fit(); nextQ(); hud();
    raf = requestAnimationFrame(loop); A.onStop(() => cancelAnimationFrame(raf));
    banner(`MAP ${mi + 1} · ${map.name}<small>길가의 ⭕ 터를 톡 → 탑 짓기 · 옆 문제를 맞혀 💰 벌기</small>`, 'stage', 2600);
  }

  window.TWTd = { setup };
})();
