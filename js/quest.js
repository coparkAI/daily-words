/* 쌍둥이의 하루 영단어 — G-09 단어 대모험 엔진 (요구사항 15장, 2026-11-28)
   옆으로 자동으로 달리는 도트 액션: 점프(2단)·에너지 부메랑, 단어 보물상자 → 파워업, 스테이지 10개 + 보스(2단계 변신).
   그림·스테이지 자료는 js/quest-art.js (window.TWQuestArt). 320×200 도트 화면을 크게 늘려 보여 준다.
   games.js 가 공용 도구(단어·결과 화면·배경음 등)를 api 로 넘겨준다. */
(() => {
  'use strict';
  const ART = () => window.TWQuestArt;
  const W = 320; const H = 200; const GROUND0 = 150;
  let A = null;   // games.js 가 넘겨준 도구

  // ---------- 작은 도구 ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ---------- 효과음 (Web Audio 합성) ----------
  let actx = null;
  function au() { if (!actx) { const s = A.T().sfx; actx = s && s.wake ? s.wake() : null; } return actx; }
  function tone(f0, f1, dur, type, vol, delay) {
    const c = au(); if (!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.03);
  }
  function noise(dur, vol, freq, type) {
    const c = au(); if (!c) return;
    const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(); const f = c.createBiquadFilter(); const g = c.createGain();
    f.type = type || 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  }
  const SND = {
    jump: () => tone(260, 620, 0.12, 'square', 0.05),
    djump: () => { tone(420, 1100, 0.16, 'square', 0.05); tone(840, 1600, 0.1, 'triangle', 0.03, 0.05); },
    land: () => noise(0.06, 0.06, 500),
    throw: () => noise(0.14, 0.07, 2500, 'bandpass'),
    hit: () => { noise(0.09, 0.14, 900); tone(220, 70, 0.1, 'square', 0.06); },
    stomp: () => { tone(700, 180, 0.12, 'square', 0.07); noise(0.05, 0.08, 1200); },
    coin: () => { tone(988, 988, 0.05, 'square', 0.04); tone(1319, 1319, 0.12, 'square', 0.04, 0.05); },
    fruit: () => { tone(660, 990, 0.08, 'triangle', 0.06); tone(990, 1320, 0.1, 'triangle', 0.05, 0.06); },
    hurt: () => { tone(420, 70, 0.35, 'sawtooth', 0.07); noise(0.15, 0.1, 700); },
    boom: () => { noise(0.6, 0.25, 380); tone(130, 30, 0.6, 'sawtooth', 0.09); },
    chest: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.12, 'square', 0.04, i * 0.06)),
    power: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, f * 1.01, 0.14, 'triangle', 0.06, i * 0.07)),
    flag: () => [523, 784, 1047].forEach((f, i) => tone(f, f, 0.16, 'square', 0.04, i * 0.09)),
    roar: () => { tone(110, 45, 0.9, 'sawtooth', 0.1); noise(0.8, 0.12, 300); },
    shield: () => tone(300, 1200, 0.25, 'sine', 0.08),
    laser: () => tone(1400, 300, 0.4, 'sawtooth', 0.05),
    warn: () => tone(880, 880, 0.08, 'square', 0.04),
    clear: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.18, 'square', 0.05, i * 0.11)),
  };

  // 레벨 만들기: 같은 스테이지는 늘 같은 모양 (씨앗 고정)
  function buildLevel(st, D, si) {
    const r = rng(st.seed);
    const segs = []; const plats = []; const ents = []; const props = [];
    const L = st.len; const dens = D.enemy * (1 + si * 0.05);
    let x = 0; let y = GROUND0; let lastChest = 200; let chests = 0; let flagI = 0;
    const flagsAt = [Math.floor(L * 0.36), Math.floor(L * 0.7)];
    const seg = (x0, x1, yy) => { segs.push({ x0, x1, y: yy }); };
    function fill(x0, x1, yy) {
      const len = x1 - x0;
      for (let px = x0 + 8; px < x1 - 8; px += 18 + Math.floor(r() * 30)) if (r() < 0.55) props.push({ x: px, y: yy, k: Math.floor(r() * 3) });
      if (flagI < 2 && x0 < flagsAt[flagI] && x1 > flagsAt[flagI] && len > 70) { ents.push({ t: 'flag', x: clamp(flagsAt[flagI], x0 + 30, x1 - 30), y: yy, up: false }); flagI++; return; }
      if (chests < 6 && x0 - lastChest > 330 && len > 90 && r() < 0.75) { ents.push({ t: 'chest', x: x0 + len * 0.55, y: yy }); lastChest = x0; chests++; }
      if (r() < 0.6) { const cx = x0 + 20 + r() * (len - 60); for (let k = 0; k < 5; k++) ents.push({ t: 'coin', x: cx + k * 12, y: yy - 16 - Math.sin(k / 4 * Math.PI) * 18 }); }
      if (r() < 0.55) ents.push({ t: 'fruit', x: x0 + 30 + r() * (len - 50), y: yy - 14 - (r() < 0.4 ? 26 : 0), k: Math.floor(r() * 4) });
      const n = Math.floor((len / 150) * dens + r() * 0.8);
      for (let k = 0; k < n; k++) {
        const ex = x0 + 40 + r() * Math.max(10, len - 70); const kind = r();
        if (kind < 0.42) ents.push({ t: 'enemy', beh: 'walk', x: ex, y: yy, x0: x0 + 6, x1: x1 - 6 });
        else if (kind < 0.7) ents.push({ t: 'enemy', beh: 'fly', x: ex, y: yy - 38 - r() * 22 });
        else if (kind < 0.85) ents.push({ t: 'enemy', beh: 'shoot', x: ex, y: yy });
        else ents.push({ t: 'enemy', beh: 'hop', x: ex, y: yy, x0: x0 + 6, x1: x1 - 6 });
      }
    }
    seg(-240, 300, y); fill(140, 300, y); x = 300;
    while (x < L - 280) {
      const t = r();
      if (t < 0.3) {
        const g = 30 + Math.floor(r() * 24);
        if (g > 44) plats.push({ x: x + g / 2 - 14, y: y - 30 - Math.floor(r() * 8), w: 28 });
        if (st.pit === 'lava' && r() < 0.7) ents.push({ t: 'enemy', beh: 'hop', fish: true, x: x + g / 2, y: H + 12 });
        x += g;
        y = clamp(y + (Math.floor(r() * 3) - 1) * 10, 126, 162);
        const len = 130 + Math.floor(r() * 110); seg(x, x + len, y); fill(x, x + len, y); x += len;
      } else if (t < 0.5) {
        y = clamp(y + (r() < 0.55 ? -14 : 14), 126, 162);
        const len = 110 + Math.floor(r() * 110); seg(x, x + len, y); fill(x, x + len, y); x += len;
      } else if (t < 0.68) {
        const len = 200 + Math.floor(r() * 80); seg(x, x + len, y);
        const px = x + 50 + r() * 60; const py = y - 42;
        plats.push({ x: px, y: py, w: 44 });
        for (let k = 0; k < 3; k++) ents.push({ t: 'coin', x: px + 10 + k * 12, y: py - 12 });
        if (r() < 0.5) ents.push({ t: 'fruit', x: px + 22, y: py - 24, k: Math.floor(r() * 4) });
        fill(x + 120, x + len, y); x += len;
      } else {
        const len = 150 + Math.floor(r() * 120); seg(x, x + len, y); fill(x, x + len, y); x += len;
      }
    }
    const fy = GROUND0;
    seg(x, L + 420, fy); fill(x, Math.min(x + 160, L - 60), fy);
    if (!ents.some((e) => e.t === 'chest' && e.x > L - 700)) ents.push({ t: 'chest', x: L - 120, y: fy });
    ents.forEach((e, i) => { e.id = i; });
    return { segs, plats, ents, props, L, chests: ents.filter((e) => e.t === 'chest').length };
  }

  // 3×5 도트 숫자 (점수 팝업)
  const DIG = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001010010', 8: '111101111101111', 9: '111101111001111', '+': '000010111010000', '-': '000000111000000', x: '000101010101000' };
  function digits(c, str, x, y, col) {
    let cx = x - (str.length * 4) / 2;
    for (const ch of str) {
      const g = DIG[ch]; if (g) {
        c.fillStyle = '#140c1c'; for (let i = 0; i < 15; i++) if (g[i] === '1') c.fillRect(cx + (i % 3), y + Math.floor(i / 3) + 1, 1, 1);
        c.fillStyle = col; for (let i = 0; i < 15; i++) if (g[i] === '1') c.fillRect(cx + (i % 3), y + Math.floor(i / 3), 1, 1);
      }
      cx += 4;
    }
  }

  // =========================================================
  // 시작 화면 (주인공·스테이지 고르기)
  // =========================================================
  function save() { A.save(); }
  const QT = () => (/[?&]qtest=(\w+)/.exec(location.search) || [])[1] || null;   // 확인용: ?qtest=god(안 다침) · ?qtest=boss(보스 바로 앞, 안 다침)
  function prog(p) {
    const S = A.S; S.quest = S.quest || {};
    const k = `${S.level}-p${p}`;
    const pr = S.quest[k] = S.quest[k] || { un: 1, stars: [] };
    while (pr.stars.length < ART().STAGES.length) pr.stars.push(0);
    return pr;
  }
  function setup(api, player) {
    A = api; ART().addSongs(A.BGM_SONGS);
    A.stop(); A.setTheme();
    const S = A.S; const esc = A.esc; const STAGES = ART().STAGES;
    let who = player != null ? player : (S.questWho || 0);
    const draw = () => {
      const pr = prog(who);
      const best = S.best[`${S.level}-quest-p${who}`];
      const un = QT() ? STAGES.length : pr.un;
      A.app().innerHTML = `
        ${A.topBar('🗺️ 단어 대모험')}
        <div class="qs">
          <div class="qs-title"><span>WORD</span> QUEST<small>단어 대모험 · 세계 일주</small></div>
          <div class="qs-who">
            ${[0, 1].map((p) => `<button class="qs-hero ${p === who ? 'on' : ''} h${p}" data-p="${p}"><i class="qs-face"></i><b>${p ? '🔵' : '🔴'} ${esc(S.names[p])}</b></button>`).join('')}
          </div>
          <div class="qs-stages">
            ${STAGES.map((st, i) => {
              const locked = i + 1 > un; const s = pr.stars[i] || 0; const B = ART().BOSSES[st.boss];
              return `<button class="qs-stage" data-i="${i}" ${locked ? 'disabled' : ''} style="background:linear-gradient(160deg, ${st.sky[2]} 0%, ${st.sky[1]} 45%, ${st.sky[0]} 100%)">
                <span class="qs-no">STAGE ${i + 1} · ${st.en}</span><b>${st.name}</b><span class="qs-boss">BOSS · ${B.name}</span>
                <span class="qs-stars">${locked ? '🔒' : '★'.repeat(s) + '☆'.repeat(3 - s)}</span></button>`;
            }).join('')}
          </div>
          <p class="pool-count">${esc(A.level().name)} · ${esc(A.rangeLabel())} · ${A.DIFFS[S.diff]}${best != null ? ` · 🏆 최고 ${best.toLocaleString()}점` : ''}</p>
        </div>`;
      A.bindQuit(false);
      A.app().querySelectorAll('.qs-hero').forEach((b) => (b.onclick = () => { who = +b.dataset.p; S.questWho = who; save(); draw(); }));
      A.app().querySelectorAll('.qs-stage').forEach((b) => (b.onclick = () => play(who, +b.dataset.i, { score: 0, missed: [] })));
    };
    draw();
  }

  // =========================================================
  // 게임
  // =========================================================
  function play(player, si, run) {
    A.stop(); A.setTheme();
    const AR = ART(); const S = A.S; const esc = A.esc; const st = AR.STAGES[si]; const BD = AR.BOSSES[st.boss];
    const D = { easy: { speed: 62, drain: 1.7, enemy: 0.6, boss: 8, gap: 2.1 }, normal: { speed: 72, drain: 2.4, enemy: 1, boss: 11, gap: 1.6 }, hard: { speed: 82, drain: 3.1, enemy: 1.35, boss: 14, gap: 1.25 } }[S.diff];
    const lv = buildLevel(st, D, si);
    const sc = AR.makeScene(st, rng(st.seed * 7 + 1));
    const P = A.pool(); let wq = A.T().shuffle(P);

    A.app().innerHTML = `
      <div class="q-wrap" id="qWrap">
        ${A.topBar(`🗺️ STAGE ${si + 1} · ${st.name}`, '<button class="btn ghost small" id="qMusic" aria-label="배경음">🎵</button><button class="btn ghost small" id="qPause">⏸</button>')}
        <div class="q-stage" id="qStage">
          <div class="q-screen" id="qScreen">
            <canvas id="qCv" width="${W}" height="${H}"></canvas>
            <div class="q-hud">
              <div class="q-hearts" id="qHearts"></div>
              <div class="q-energy"><span>ENERGY</span><b><i id="qEnergy"></i></b></div>
              <div class="q-score" id="qScore">0</div>
            </div>
            <div class="q-power" id="qPower"></div>
            <div class="q-boss" id="qBoss"><span id="qBossName"></span><b><i id="qBossHp"></i></b></div>
            <div class="q-banner" id="qBanner"></div>
            <div class="q-flash" id="qFlash"></div>
            <div class="q-quiz" id="qQuiz"></div>
            <div class="q-over" id="qOver"></div>
          </div>
          <div class="q-rotate" id="qRotate">📱↻ 폰을 가로로 돌리면 게임 화면이 더 커져요</div>
          <button class="q-btn q-jump" id="qJump" aria-label="점프"><b>JUMP</b><small>점프</small></button>
          <button class="q-btn q-atk" id="qAtk" aria-label="공격"><b>ATTACK</b><small>부메랑</small></button>
        </div>
      </div>`;
    A.bindQuit(); A.fullScreen();
    const $ = (q) => A.app().querySelector(q);
    const cv = $('#qCv'); const c = cv.getContext('2d');
    const stage = $('#qStage'); const screen = $('#qScreen');

    const fit = () => {
      const wrap = $('#qWrap'); if (!wrap) return;
      wrap.style.height = `${Math.max(340, window.innerHeight - wrap.getBoundingClientRect().top - 6)}px`;
      const cw = stage.clientWidth; const ch = stage.clientHeight;
      const portrait = ch > cw * 0.85;
      const room = portrait ? ch - 120 : ch;
      let w = cw; let h = w * H / W;
      if (h > room) { h = room; w = h * W / H; }
      screen.style.width = `${Math.floor(w)}px`; screen.style.height = `${Math.floor(h)}px`;
      screen.style.left = `${Math.floor((cw - w) / 2)}px`;
      const topY = portrait ? Math.max(0, Math.floor((ch - 130 - h) / 2)) : Math.floor((ch - h) / 2);   // 세로 화면: 버튼 위 빈 곳의 가운데
      screen.style.top = `${topY}px`;
      stage.classList.toggle('portrait', portrait);
      const rot = $('#qRotate'); rot.classList.toggle('show', portrait && cw < 640); rot.style.top = `${topY + Math.floor(h) + 6}px`;
    };
    fit(); window.addEventListener('resize', fit); A.onStop(() => window.removeEventListener('resize', fit));

    // ----- 상태 -----
    const p = { x: 40, y: GROUND0, vy: 0, onGround: true, air: 1, coyote: 0, holding: false, holdT: 0, inv: 0, hurt: 0, anim: 0, throwT: 0, win: false,
      board: 0, shield: false, power: null, powerT: 0, accent: player ? '#2e86de' : '#e53b44', accent2: player ? '#7fc4ff' : '#ff8a8a', pushing: false };
    let hearts = 3; let energy = 100; let score = run.score; let lostHeart = false;
    let chestOk = 0; let chestSeen = 0; const missed = run.missed;
    let camX = 0; let t = 0; let timeScale = 1; let freeze = 0; let shake = 0; let paused = false; let over = false;
    let checkpoint = { x: 40 };
    const qt = QT(); const invinc = qt === 'god' || qt === 'boss';   // ?qtest=all 은 스테이지만 모두 열고 평소처럼 다침 (기록 저장 안 함)
    if (qt === 'boss') { p.x = lv.L - 120; checkpoint = { x: p.x }; }
    let booms = []; let shots = []; let parts = []; let popups = []; let quiz = null; let combo = 0; let comboT = 0;
    const ents = lv.ents.map((e) => ({ ...e, alive: true, hp: e.t === 'enemy' ? (e.beh === 'shoot' ? 2 : 1) : 0, vx: -18, vy: 0, shootT: 1 + hash(e.id + 3) * 2, open: false }));
    function sizeEnemy(e) { const sz = AR.ESIZE[e.kind] || [12, 12]; e.w = sz[0]; e.h = sz[1]; e.baseY = e.y; }
    ents.forEach((e) => { if (e.t !== 'enemy') return; e.kind = e.fish ? 'lavafish' : st.enemies[e.beh]; if (e.fish && st.pit !== 'lava') e.alive = false; sizeEnemy(e); });
    let boss = null; let bossOn = false; let camLock = null; let cleared = false;

    // ----- 배경음 -----
    const bgm = A.makeBgm(); A.onStop(() => bgm.dispose()); bgm.play(st.song);
    const musicBtn = () => $('#qMusic').classList.toggle('off', !bgm.on);
    $('#qMusic').onclick = () => { bgm.setOn(!bgm.on); musicBtn(); }; musicBtn();

    function groundTop(x) { for (let i = 0; i < lv.segs.length; i++) { const s = lv.segs[i]; if (x >= s.x0 && x < s.x1) return s.y; } return null; }

    // ----- 효과 -----
    function burst(x, y, n, cols, spd, life, grav, size) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2; const v = (0.3 + Math.random()) * spd;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.3, life: life * (0.6 + Math.random() * 0.6), max: life, col: cols[Math.floor(Math.random() * cols.length)], g: grav == null ? 300 : grav, s: size || 1, glow: false });
      }
    }
    function glowBurst(x, y, n, cols, spd, life) { const k = parts.length; burst(x, y, n, cols, spd, life, 0, 1); for (let i = k; i < parts.length; i++) parts[i].glow = true; }
    function popup(x, y, txt, col) { popups.push({ x, y, txt, col, life: 0.9 }); }
    function addScore(n, x, y, col) { score += n; if (x != null) popup(x, y, `+${n}`, col || '#ffe35a'); }
    function doShake(m) { shake = Math.max(shake, m); }
    let flashT; function flash(col) { const f = $('#qFlash'); f.style.background = col; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); clearTimeout(flashT); flashT = setTimeout(() => f.classList.remove('on'), 300); }
    A.onStop(() => clearTimeout(flashT));
    let bannerT; function banner(html, cls, ms) {
      const b = $('#qBanner'); b.innerHTML = html; b.className = `q-banner show ${cls || ''}`;
      clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('show'), ms || 1600);
    }
    A.onStop(() => clearTimeout(bannerT));
    const timers = []; const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
    A.onStop(() => timers.forEach(clearTimeout));

    // ----- HUD -----
    let hudKey = '';
    function hud() {
      const pw = p.power ? `${p.power}:${Math.ceil(p.powerT)}` : '';
      const k = `${hearts}|${Math.round(energy)}|${score}|${pw}|${p.shield}|${Math.ceil(p.board)}|${boss ? boss.hp : ''}`;
      if (k === hudKey) return; hudKey = k;
      $('#qHearts').innerHTML = [0, 1, 2].map((i) => `<i class="${i < hearts ? 'on' : ''}"></i>`).join('');
      const e = $('#qEnergy'); e.style.width = `${clamp(energy, 0, 100)}%`; e.className = energy < 25 ? 'low' : '';
      $('#qScore').textContent = score.toLocaleString();
      const POW = { triple: '🔱 3갈래', fire: '🔥 불꽃' }; const tags = [];
      if (p.power) tags.push(`<span>${POW[p.power]} ${Math.ceil(p.powerT)}</span>`);
      if (p.shield) tags.push('<span>🛡 방어막</span>');
      if (p.board > 0) tags.push(`<span>🛹 보드 ${Math.ceil(p.board)}</span>`);
      $('#qPower').innerHTML = tags.join('');
      if (boss) $('#qBossHp').style.width = `${(Math.max(0, boss.hp) / boss.max) * 100}%`;
    }

    // ----- 입력 -----
    function jumpDown() {
      if (paused || over || quiz || cleared) return;
      if (p.onGround || p.coyote > 0) {
        p.vy = -245; p.onGround = false; p.coyote = 0; p.air = 1; p.holding = true; p.holdT = 0; SND.jump();
        burst(p.x, p.y, 5, ['#e8e0d0', '#c9bda8'], 40, 0.35, 60);
      } else if (p.air > 0) {
        p.air--; p.vy = -225; p.holding = true; p.holdT = 0.06; SND.djump();
        glowBurst(p.x, p.y - 6, 12, [p.accent2, '#ffffff', '#7fe3ff'], 70, 0.35);
      }
    }
    function jumpUp() { p.holding = false; }
    function attack() {
      if (paused || over || quiz || cleared) return;
      const triple = p.power === 'triple'; const fire = p.power === 'fire';
      if (booms.length >= (triple ? 6 : 2)) return;
      (triple ? [0, -95, 95] : [0]).forEach((vy) => booms.push({ x: p.x + 6, y: p.y - 11, vx: 340, vy, back: false, t: 0, hit: [], fire, rot: 0 }));
      p.throwT = 0.16; SND.throw();
    }
    const jb = $('#qJump'); const ab = $('#qAtk');
    jb.addEventListener('pointerdown', (e) => { e.preventDefault(); jb.classList.add('on'); jumpDown(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => jb.addEventListener(n, () => { jb.classList.remove('on'); jumpUp(); }));
    ab.addEventListener('pointerdown', (e) => { e.preventDefault(); ab.classList.add('on'); attack(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => ab.addEventListener(n, () => ab.classList.remove('on')));
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); jumpDown(); });
    cv.addEventListener('pointerup', jumpUp);
    A.T().setKey((e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (quiz && ['1', '2', '3'].indexOf(k) >= 0) { answerQuiz(+k - 1); return; }
      if (k === ' ' || k === 'arrowup' || k === 'w') { e.preventDefault(); jumpDown(); }
      else if (k === 'z' || k === 'x' || k === 'j' || k === 'k' || k === 'enter') { e.preventDefault(); attack(); }
      else if (k === 'p' || k === 'escape') setPause(!paused);
    });
    const keyUp = (e) => { const k = e.key.toLowerCase(); if (k === ' ' || k === 'arrowup' || k === 'w') jumpUp(); };
    window.addEventListener('keyup', keyUp); A.onStop(() => window.removeEventListener('keyup', keyUp));
    function setPause(v) {
      if (over || cleared) return;
      paused = v; $('#qPause').textContent = v ? '▶' : '⏸';
      const o = $('#qOver');
      if (v) {
        bgm.stop();
        o.innerHTML = `<div class="q-panel"><h3>PAUSE</h3><p>잠깐 멈췄어요</p><div class="q-row"><button class="q-pbtn" id="qResume">▶ 계속하기</button><button class="q-pbtn ghost" id="qToMap">🗺️ 스테이지 고르기</button></div></div>`;
        o.classList.add('show');
        $('#qResume').onclick = () => setPause(false);
        $('#qToMap').onclick = () => setup(A, player);
      } else { o.classList.remove('show'); bgm.resume(); last = performance.now(); }
    }
    $('#qPause').onclick = () => setPause(!paused);
    A.setHelpPause((v) => setPause(v));
    const onVis = () => { if (document.hidden && !paused) setPause(true); };
    document.addEventListener('visibilitychange', onVis); A.onStop(() => document.removeEventListener('visibilitychange', onVis));

    // ----- 다치기 -----
    function hurt() {
      if (p.inv > 0 || over || cleared || invinc) return;
      if (p.shield) { p.shield = false; p.inv = 1; SND.shield(); glowBurst(p.x, p.y - 12, 18, ['#6ff7ff', '#ffffff'], 90, 0.4); return; }
      if (p.board > 0) { p.board = 0; p.inv = 1.2; SND.hit(); burst(p.x, p.y, 10, ['#e53b44', '#222'], 90, 0.5); banner('🛹 보드가 부서졌어요!', 'bad', 1000); return; }
      // 2026-11-28 사용자 요청: 적·보스 공격에 맞으면 에너지가 줄고, 에너지가 바닥나면 ❤️ 하나를 잃는다
      p.inv = 1.4; p.hurt = 0.35; p.vy = -150; combo = 0;
      SND.hurt(); doShake(4); freeze = 0.08; flash('rgba(255,40,60,.45)');
      const dmg = bossOn ? 30 : 25;
      energy -= dmg; popup(p.x, p.y - 26, `-${dmg}`, '#ff6a7a');
      if (energy <= 0) loseHeart('💔 에너지가 바닥났어요!');
    }
    function loseHeart(msg) {
      hearts--; lostHeart = true; energy = 60; p.inv = Math.max(p.inv, 1.6);
      flash('rgba(255,40,60,.6)'); doShake(6);
      if (hearts <= 0) { gameOver(); return; }
      banner(`${msg}<small>❤️ 하나를 잃고 에너지 다시 채움</small>`, 'bad', 1500);
    }
    function fallPit() {
      if (invinc) { p.x += 60; p.y = (groundTop(p.x) || GROUND0) - 30; p.vy = 0; return; }
      hearts--; lostHeart = true; SND.hurt(); flash('rgba(255,40,60,.45)'); doShake(3);
      if (hearts <= 0) { gameOver(); return; }
      p.x = checkpoint.x; p.y = (groundTop(p.x) || GROUND0) - 30; p.vy = 0; p.inv = 2; p.air = 1;
      shots = []; booms = [];
      banner('💫 체크포인트에서 다시!', 'bad', 1200);
    }

    // ----- 보물상자 퀴즈 -----
    function openChest(e) {
      if (e.open || quiz || over) return;
      e.open = true; SND.chest(); glowBurst(e.x, e.y - 8, 26, ['#ffe35a', '#ffffff', '#ffb15a'], 110, 0.7);
      if (!wq.length) wq = A.T().shuffle(P);
      const w = wq.shift();
      const opts = A.T().shuffle([w, ...A.distractors(w, 2, P)]);
      const en2ko = chestSeen % 2 === 0; chestSeen++;
      quiz = { w, opts, en2ko, left: 8, e };
      timeScale = 0.06;
      const qz = $('#qQuiz');
      qz.innerHTML = `<div class="q-panel quiz">
        <div class="qq-tag">📦 단어 보물상자!</div>
        <div class="qq-q">${en2ko ? `<span class="en">${esc(w.word)}</span> <button class="icon-btn" id="qSay" aria-label="듣기">🔊</button>` : esc(A.short(w))}</div>
        <div class="qq-hint">${en2ko ? '뜻을 골라요' : '영어 단어를 골라요'} · 맞히면 파워업!</div>
        <div class="qq-opts">${opts.map((o, i) => `<button class="qq-opt ${en2ko ? '' : 'en'}" data-i="${i}"><small>${i + 1}</small>${esc(en2ko ? A.short(o) : o.word)}</button>`).join('')}</div>
        <div class="qq-time"><i id="qqTime"></i></div></div>`;
      qz.classList.add('show'); screen.classList.add('slowmo');
      if (en2ko) { A.say(w); const sb = $('#qSay'); if (sb) sb.onclick = () => A.say(w); }
      qz.querySelectorAll('.qq-opt').forEach((b) => b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); answerQuiz(+b.dataset.i); }));
    }
    function answerQuiz(i) {
      if (!quiz || quiz.done) return;
      quiz.done = true;
      const ok = i >= 0 && quiz.opts[i] === quiz.w;
      const qz = $('#qQuiz');
      qz.querySelectorAll('.qq-opt').forEach((b, k) => { b.disabled = true; if (quiz.opts[k] === quiz.w) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); });
      const w = quiz.w; const e = quiz.e;
      if (ok) {
        chestOk++; addScore(100, e.x, e.y - 20, '#7dffb0');
        const pick = givePower(); A.sayAfter(w);
        later(() => banner(`${pick}<small>${esc(w.word)} = ${esc(A.short(w))}</small>`, 'good', 1900), 450);
      } else {
        missed.push(w); A.sfx('bad'); A.say(w);
        later(() => banner(`😅 아쉬워요<small>${esc(w.word)} = ${esc(A.short(w))}</small>`, 'bad', 1900), 450);
      }
      later(() => { qz.classList.remove('show'); screen.classList.remove('slowmo'); quiz = null; timeScale = 1; last = performance.now(); }, ok ? 650 : 1300);
    }
    function givePower() {
      SND.power(); flash('rgba(255,240,150,.35)');
      const opts = ['triple', 'fire', 'shield', 'board', 'feast'];
      const wts = [26, 26, 18, 18, hearts < 3 ? 24 : 8];
      let r = Math.random() * wts.reduce((a, b) => a + b, 0); let k = 0;
      while (r > wts[k]) { r -= wts[k]; k++; }
      const kind = opts[k];
      glowBurst(p.x, p.y - 12, 30, ['#ffe35a', '#fff', '#7dffb0', '#6ff7ff'], 120, 0.8);
      if (kind === 'triple') { p.power = 'triple'; p.powerT = 20; return '🔱 3갈래 부메랑!'; }
      if (kind === 'fire') { p.power = 'fire'; p.powerT = 20; return '🔥 불꽃 부메랑!'; }
      if (kind === 'shield') { p.shield = true; SND.shield(); return '🛡 방어막!'; }
      if (kind === 'board') { p.board = 25; return '🛹 스케이트보드!'; }
      energy = 100; hearts = Math.min(3, hearts + 1); return '🍗 잔치! 에너지 가득 + ❤️';
    }

    // ----- 보스 -----
    function startBoss() {
      bossOn = true; camLock = lv.L - 40;
      const hp = Math.round((D.boss + si * 0.75) * 2.5);   // 2026-11-28: 보스가 약하다는 의견 → 약 2.5배 (보통 28대 → 우주 44대)
      boss = { kind: st.boss, x: camLock + 245, y: BD.fly ? GROUND0 : GROUND0 + 60, hp, max: hp, t: 0, cd: 2.4, move: 0, flash: 0, state: 'intro', vy: 0, act: 0, dead: 0, enter: 1.6, ph: 0, tt: 0 };
      bgm.play('qboss'); SND.roar(); doShake(5);
      $('#qBossName').textContent = `BOSS · ${BD.name}`; $('#qBoss').classList.add('show');
      banner(`⚠ BOSS ⚠<small>${BD.name}</small>`, 'boss', 1800);
    }
    const bossBox = () => BD.box(boss);
    const sp = () => (boss && boss.ph ? 1.18 : 1);
    function shot(o) { shots.push(o); return o; }
    function bossShot(type) {
      const b = boss; const gy = GROUND0; const v = sp(); const fx = b.x - (BD.fly ? 10 : 24);
      const fy = BD.fly ? b.y - 19 : null;
      if (type === 'roll') shot({ x: fx, y: gy - 7, vx: -135 * v, vy: 0, r: 7, kind: 'rock', hp: 2 });
      else if (type === 'low') shot({ x: fx, y: gy - 6, vx: -150 * v, vy: 0, r: 5, kind: 'orb', hp: 1, from: fy });
      else if (type === 'high') shot({ x: fx, y: gy - 31, vx: -150 * v, vy: 0, r: 5, kind: 'orb', hp: 1, high: true });
      else if (type === 'wave') shot({ x: fx, y: gy - 6, vx: -160 * v, vy: 0, r: 6, kind: 'wave', hp: 99, w: 18 });
      else if (type === 'flame') shot({ x: fx, y: gy - 7, vx: -170 * v, vy: 0, r: 7, kind: 'flame', hp: 99, w: 34 });
      else if (type === 'bounce') shot({ x: fx, y: gy - 8, vx: -105 * v, vy: -240, r: 7, kind: 'gear', hp: 3, bounce: true });
      else if (type === 'laser' || type === 'laserHigh') { shot({ x: 0, y: type === 'laser' ? gy - 8 : gy - 32, kind: 'laser', t: 0, x1: fx, hp: 99, r: 0 }); SND.warn(); }
      else if (type === 'rain') { [70, 130, 175].forEach((dx, i) => later(() => { if (boss && boss.state !== 'dead') shot({ x: camLock + 70 + dx, y: -10, vx: 0, vy: 0, r: 7, kind: 'rock', hp: 2, fall: true }); }, i * 260)); }
      else if (type === 'summon') {
        const kind = BD.summon || st.enemies.walk; const n = boss.ph ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const e = { t: 'enemy', beh: kind === 'ufo' ? 'fly' : 'walk', kind, x: b.x - 20 - i * 18, y: kind === 'ufo' ? gy - 14 : gy, x0: camLock - 80, x1: b.x, vx: -34, vy: 0, alive: true, hp: 1, id: `s${Math.random()}`, spd: 60, shootT: 9 };
          sizeEnemy(e); ents.push(e); glowBurst(e.x, e.y - 6, 10, ['#ffffff', st.shot], 60, 0.4);
        }
      } else if (type === 'clones') { [0, 420].forEach((d) => later(() => { if (boss && boss.state !== 'dead') shot({ x: b.x - 10, y: gy, vx: -250 * v, vy: 0, kind: 'clone', w: 16, h: 34, hp: 99, r: 0 }); }, d)); }
    }
    function updateBoss(dt) {
      const b = boss; b.t += dt; if (b.flash > 0) b.flash -= dt; if (b.act > 0) b.act -= dt;
      if (b.state === 'dead') {
        b.dead += dt;
        if (b.dead < 1.6 && Math.random() < dt * 14) { const bx = bossBox(); glowBurst(bx.x + Math.random() * bx.w, bx.y + Math.random() * bx.h, 10, ['#fff', '#ffe35a', '#ff7a2a'], 120, 0.5); SND.hit(); doShake(3); }
        if (b.dead > 1.8 && !cleared) stageClear();
        return;
      }
      if (b.state === 'intro') { b.enter -= dt; if (!BD.fly) b.y = GROUND0 + 60 * Math.max(0, b.enter / 1.6); else b.y = GROUND0 - 60 * Math.max(0, b.enter / 1.6); if (b.enter <= 0) { b.state = 'fight'; b.y = GROUND0; } return; }
      if (b.state === 'transform') {
        b.tt -= dt; b.flash = Math.floor(b.tt * 12) % 2 ? 0.05 : 0; doShake(2);
        if (Math.random() < dt * 20) { const bx = bossBox(); glowBurst(bx.x + Math.random() * bx.w, bx.y + Math.random() * bx.h, 4, ['#fff', st.shot], 80, 0.4); }
        if (b.tt <= 0) { b.state = 'fight'; b.cd = 1; }
        return;
      }
      if (b.state === 'dash') { b.x += b.dashV * dt; if (b.x < camLock - 40) { b.state = 'return'; b.x = camLock + W + 40; } return; }
      if (b.state === 'return') { b.x -= 170 * dt; if (b.x <= camLock + 245) { b.x = camLock + 245; b.state = 'fight'; } return; }
      if (b.state === 'jump') {
        b.vy += 700 * dt; b.y += b.vy * dt;
        if (b.y >= GROUND0) { b.y = GROUND0; b.state = 'fight'; doShake(5); SND.boom(); burst(b.x, b.y, 18, ['#c9bda8', '#8a7a64'], 120, 0.6); bossShot('wave'); }
        return;
      }
      b.cd -= dt * (b.ph ? 1.25 : 1);
      if (b.cd <= 0) {
        const list = BD.moves[b.ph ? 1 : 0]; const mv = list[b.move % list.length]; b.move++;
        b.cd = D.gap * (b.ph ? 0.85 : 1); b.act = 0.4;
        if (mv === 'slam' && !BD.fly) { b.state = 'jump'; b.vy = -330; }
        else if (mv === 'dash' && !BD.fly) { b.state = 'dash'; b.dashV = -230 * sp(); SND.roar(); }
        else bossShot(mv === 'slam' || mv === 'dash' ? 'low' : mv);
      }
    }
    function hitBoss(dmg, x, y) {
      if (!boss || boss.state === 'dead' || boss.state === 'intro' || boss.state === 'transform') return;
      boss.hp -= dmg; boss.flash = 0.12; freeze = 0.04; SND.hit();
      glowBurst(x, y, 10, ['#fff', '#ffe35a'], 90, 0.3); popup(x, y - 6, `${dmg}`, '#ffffff');
      if (!boss.ph && boss.hp <= boss.max / 2 && boss.hp > 0) {   // 2단계 변신
        boss.ph = 1; boss.state = 'transform'; boss.tt = 1.4; shots = []; SND.roar(); flash('rgba(255,255,255,.6)'); doShake(6);
        bgm.play('qboss2'); banner(`⚡ 분노 모드! ⚡<small>${BD.name}이(가) 변신했어요</small>`, 'boss', 1700);
      }
      if (boss.hp <= 0) {
        boss.hp = 0; boss.state = 'dead'; shots = []; SND.boom(); doShake(8); flash('rgba(255,255,255,.7)');
        ents.forEach((e) => { if (e.t === 'enemy' && typeof e.id === 'string') e.alive = false; });
        addScore(1000, boss.x, boss.y - 50, '#ffe35a'); timeScale = 0.35; later(() => { timeScale = 1; }, 900);
      }
    }

    // ----- 스테이지 끝 -----
    function stageClear() {
      cleared = true; bgm.stop(); SND.clear(); p.win = true;
      const stars = 1 + (chestOk >= lv.chests && lv.chests > 0 ? 1 : 0) + (lostHeart ? 0 : 1);
      const bonus = hearts * 300; score += bonus;
      const last2 = si === AR.STAGES.length - 1;
      if (!qt) { const pr = prog(player); pr.stars[si] = Math.max(pr.stars[si] || 0, stars); pr.un = Math.max(pr.un, Math.min(AR.STAGES.length, si + 2)); save(); }
      const o = $('#qOver');
      o.innerHTML = `<div class="q-panel clear">
        <h3>STAGE CLEAR!</h3>
        <div class="qc-stars">${[0, 1, 2].map((i) => `<i class="${i < stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</i>`).join('')}</div>
        <ul class="qc-list"><li class="ok">★ 클리어</li><li class="${chestOk >= lv.chests ? 'ok' : ''}">📦 보물상자 정답 ${chestOk} / ${lv.chests}</li><li class="${lostHeart ? '' : 'ok'}">❤️ 하트 안 잃기</li></ul>
        <p class="qc-score">남은 하트 보너스 +${bonus.toLocaleString()} · 점수 <b>${score.toLocaleString()}</b></p>
        <div class="q-row">${last2 ? '<button class="q-pbtn" id="qNext">🏆 결과 보기</button>' : `<button class="q-pbtn" id="qNext">다음: ${esc(AR.STAGES[si + 1].name)} ▶</button>`}<button class="q-pbtn ghost" id="qToMap">🗺️ 스테이지 고르기</button></div></div>`;
      o.classList.add('show');
      $('#qNext').onclick = () => (last2 ? finish(true) : play(player, si + 1, { score, missed }));
      $('#qToMap').onclick = () => { saveBestQuest(); setup(A, player); };
    }
    function saveBestQuest() { if (qt) return; const k = `${S.level}-quest-p${player}`; if (!(S.best[k] >= score)) { S.best[k] = score; save(); } }
    function gameOver() {
      over = true; bgm.stop(); SND.boom(); timeScale = 0.3;
      later(() => {
        const o = $('#qOver'); if (!o) return;
        o.innerHTML = `<div class="q-panel over"><h3>GAME OVER</h3><p>점수 <b>${score.toLocaleString()}</b></p>
          <div class="q-row"><button class="q-pbtn" id="qRetry">🔁 이 스테이지 다시</button><button class="q-pbtn ghost" id="qEnd">결과 보기</button></div></div>`;
        o.classList.add('show');
        $('#qRetry').onclick = () => { saveBestQuest(); play(player, si, { score: 0, missed: [] }); };
        $('#qEnd').onclick = () => finish(false);
      }, 900);
    }
    function finish(allClear) {
      saveBestQuest();
      const k = `${S.level}-quest-p${player}`;
      A.showResult('quest', {
        big: allClear ? '🏆 세계 일주 완료!' : `${score.toLocaleString()}점`,
        sub: `${esc(S.names[player])} · ${allClear ? `점수 ${score.toLocaleString()}점 · ` : `STAGE ${si + 1} ${esc(st.name)}까지 · `}🏆 내 최고 ${(S.best[k] || 0).toLocaleString()}점`,
        score: qt ? null : score, missed,
        again: () => setup(A, player),
        againMissed: null,
      });
    }

    // ----- 그리기 -----
    function drawGround() {
      lv.segs.forEach((s) => {
        const x0 = Math.max(s.x0, camX - 2); const x1 = Math.min(s.x1, camX + W + 2); if (x1 <= x0) return;
        const sx = Math.round(x0 - camX); const sw = Math.round(x1 - x0); const y = s.y;
        c.fillStyle = st.dirt; c.fillRect(sx, y, sw, H - y);
        for (let tx = Math.floor(x0 / 8) * 8; tx < x1; tx += 8) {
          for (let ty = y + 7; ty < H; ty += 8) {
            const hv = hash(tx * 0.13 + ty * 0.71);
            if (hv > 0.62) { c.fillStyle = hv > 0.85 ? st.dot : st.dirt2; c.fillRect(Math.round(tx - camX) + Math.floor(hv * 5), ty + Math.floor(hv * 3), hv > 0.85 ? 2 : 3, 2); }
          }
        }
        AR.groundTop(c, st, sx, sw, y, x0, x1, camX, t);
        if (s.x0 > camX - 2 && s.x0 < camX + W) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(Math.round(s.x0 - camX), y, 2, H - y); }
        if (s.x1 > camX && s.x1 < camX + W + 2) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(Math.round(s.x1 - camX) - 2, y, 2, H - y); }
      });
      lv.plats.forEach((pl) => {
        const sx = Math.round(pl.x - camX); if (sx > W || sx + pl.w < 0) return;
        c.fillStyle = '#140c1c'; c.fillRect(sx - 1, pl.y - 1, pl.w + 2, 9);
        c.fillStyle = st.dirt; c.fillRect(sx, pl.y, pl.w, 7);
        c.fillStyle = st.top; c.fillRect(sx, pl.y, pl.w, 3); c.fillStyle = st.topHi; c.fillRect(sx, pl.y, pl.w, 1);
        c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(sx, pl.y + 5, pl.w, 2);
      });
      lv.props.forEach((o) => { const x = Math.round(o.x - camX); if (x > -20 && x < W + 20) AR.drawProp(c, st, o, x, o.y); });
    }
    const BOOMF = [[[0, 0, 3, 2], [2, 2, 2, 3]], [[0, 0, 2, 3], [-2, 2, 3, 2]], [[1, 1, 3, 2], [-1, -1, 2, 3]], [[1, -1, 2, 3], [2, 1, 3, 2]]];
    function drawBoom(b) {
      const f = BOOMF[Math.floor(b.rot) % 4]; const x = Math.round(b.x - camX) - 2; const y = Math.round(b.y) - 2;
      AR.glow(c, x + 2, y + 2, b.fire ? 7 : 5, b.fire ? '#ff6a1a' : '#7fe3ff', 0.4);
      AR.sprite(c, x, y, f.map((r) => [r[0], r[1], r[2], r[3], b.fire ? '#ffd23a' : '#e0ffff']), false);
    }
    function drawEnt(e) {
      const x = Math.round(e.x - camX); if (x < -30 || x > W + 30) return; const y = Math.round(e.y);
      if (e.t === 'coin') {
        const f = Math.floor(t * 8 + e.id) % 4; const w = [5, 3, 1, 3][f];
        AR.sprite(c, x - Math.floor(w / 2), y - 3, [[0, 0, w, 6, '#ffcf3a'], [0, 0, Math.max(1, w - 2), 1, '#fff4b0']], false, '#7a4a00', w);
      } else if (e.t === 'fruit') {
        AR.sprite(c, x - 3, y - 4 + Math.round(Math.sin(t * 4 + e.id) * 1.5), AR.FRUIT[e.k], false);
      } else if (e.t === 'chest') {
        if (!e.open) {
          AR.glow(c, x, y - 6, 12, '#ffe35a', 0.25 + Math.sin(t * 5) * 0.12);
          AR.sprite(c, x - 7, y - 11, [[0, 3, 14, 8, '#9a5a24'], [0, 0, 14, 4, '#b8702e'], [0, 3, 14, 1, '#f5c542'], [0, 8, 14, 1, '#7a4418'], [6, 3, 2, 3, '#f5c542'], [2, 1, 1, 1, '#ffd88a'], [0, 0, 1, 11, '#f5c542'], [13, 0, 1, 11, '#f5c542']], false, undefined, 14);
          if (Math.floor(t * 3 + e.id) % 4 === 0) { c.fillStyle = '#fff'; c.fillRect(x + 4, y - 13, 1, 1); }
        } else AR.sprite(c, x - 7, y - 11, [[0, 3, 14, 8, '#9a5a24'], [0, 3, 14, 1, '#f5c542'], [0, -3, 14, 3, '#b8702e'], [0, -3, 14, 1, '#f5c542']], false, undefined, 14);
      } else if (e.t === 'flag') {
        AR.sprite(c, x, y - 34, [[0, 0, 2, 34, '#d8d0c0']], false);
        const fy = e.up ? 2 : 24; const wv = Math.round(Math.sin(t * 8));
        AR.sprite(c, x + 2, y - 34 + fy, [[0, 0, 12, 7 + wv, e.up ? p.accent : '#8a8a8a'], [0, 0, 12, 1, e.up ? p.accent2 : '#aaaaaa'], [4, 2, 3, 3, '#fff']], false);
      } else if (e.t === 'enemy') {
        const sz = AR.ESIZE[e.kind] || [12, 12]; const f = Math.floor(e.t2 || 0);
        const ox = x - Math.floor(sz[0] / 2); const oy = y - sz[1]; const R = AR.enemyRects(e.kind, f, st);
        if (e.flashT > 0) AR.sprite(c, ox, oy, R.map((r) => [r[0], r[1], r[2], r[3], '#ffffff']), e.vx > 0 && e.beh === 'walk', '#ffffff', sz[0]);
        else AR.sprite(c, ox, oy, R, e.vx > 0 && e.beh === 'walk', undefined, sz[0]);
        if (e.kind === 'lantern') AR.glow(c, x, y - 7, 8, '#ff7a2a', 0.25);
      }
    }
    function drawShot(s) {
      const x = Math.round(s.x - camX); const y = Math.round(s.y);
      if (s.kind === 'rock') { AR.sprite(c, x - 7, y - 7, [[2, 0, 10, 14, '#8a7a64'], [0, 2, 14, 10, '#8a7a64'], [3, 2, 4, 3, '#b0a088'], [8, 8, 3, 3, '#5a4a38']], Math.floor(t * 12) % 2 === 0, undefined, 14); return; }
      if (s.kind === 'gear') { c.save(); c.translate(x, y); c.rotate(t * 10); c.fillStyle = '#140c1c'; c.beginPath(); c.arc(0, 0, 8, 0, Math.PI * 2); c.fill(); c.fillStyle = '#c9a24a'; for (let k = 0; k < 8; k++) { c.rotate(Math.PI / 4); c.fillRect(-1, -9, 3, 4); } c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill(); c.fillStyle = '#140c1c'; c.fillRect(-1, -1, 3, 3); c.restore(); return; }
      if (s.kind === 'clone') { c.save(); c.globalAlpha = 0.6; AR.sprite(c, x - 8, y - 34, [[2, 0, 12, 12, '#2a0a3a'], [2, 4, 12, 3, '#f3c39b'], [1, 12, 14, 14, '#2a0a3a'], [1, 22, 14, 2, '#a020f0'], [2, 26, 4, 8, '#2a0a3a'], [10, 26, 4, 8, '#2a0a3a'], [14, 8, 6, 2, '#a020f0']], false, false, 16); c.restore(); AR.glow(c, x, y - 17, 14, '#a020f0', 0.2); return; }
      if (s.kind === 'laser') {
        const x0 = Math.round(camLock - 10 - camX); const x1 = Math.round(s.x1 - camX);
        if (s.t < 0.65) { if (Math.floor(s.t * 16) % 2 === 0) { c.fillStyle = 'rgba(255,60,80,.8)'; c.fillRect(x0, y, x1 - x0, 1); c.fillStyle = 'rgba(255,60,80,.25)'; c.fillRect(x0, y - 4, x1 - x0, 9); } }
        else { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = st.shot; c.globalAlpha = 0.5; c.fillRect(x0, y - 6, x1 - x0, 12); c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.fillRect(x0, y - 2, x1 - x0, 4); c.restore(); }
        return;
      }
      if (s.kind === 'wave' || s.kind === 'flame') {
        const w = s.w; const cols = s.kind === 'flame' ? (boss && boss.ph ? ['#2a6aff', '#9af0ff'] : ['#ff5a1a', '#ffd23a']) : ['#c9bda8', '#ffffff'];
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < w; i += 3) { const hh = 4 + Math.round(Math.abs(Math.sin(t * 20 + i)) * (s.kind === 'flame' ? 10 : 6)); c.fillStyle = cols[i % 2 ? 1 : 0]; c.globalAlpha = 0.85; c.fillRect(x + i - w / 2, y + 6 - hh, 3, hh); }
        c.restore(); return;
      }
      const col = s.col || st.shot;
      AR.glow(c, x, y, s.r + 3, col, 0.45);
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, Math.max(2, s.r - 2), 0, Math.PI * 2); c.fill();
      c.fillStyle = col; c.fillRect(x + s.r, y - 1, 6, 2);
    }

    // ----- 갱신 -----
    function update(dt) {
      t += dt;
      if (p.inv > 0) p.inv -= dt; if (p.hurt > 0) p.hurt -= dt; if (p.throwT > 0) p.throwT -= dt;
      if (p.power) { p.powerT -= dt; if (p.powerT <= 0) { p.power = null; banner('파워업이 끝났어요', '', 900); } }
      if (p.board > 0) { p.board -= dt; if (p.board <= 0) { p.board = 0; banner('🛹 보드 시간 끝', '', 900); } }
      if (!bossOn && !cleared) energy -= D.drain * dt;
      if (energy <= 0 && !over && !invinc) loseHeart('🍎 배고파요! 과일을 먹어요');
      let spd = D.speed * (p.board > 0 ? 1.35 : 1);
      if (bossOn) { const stand = camLock + 70; spd = p.x < stand ? 80 : 0; }
      if (p.hurt > 0) spd *= 0.4;
      const nx = p.x + spd * dt; const ga = groundTop(nx + 5);
      if (ga != null && ga < p.y - 3) p.pushing = true; else { p.x = nx; p.pushing = false; }
      let g = 760; if (p.vy < 0 && p.holding && p.holdT < 0.2) { g = 330; p.holdT += dt; }
      p.vy = Math.min(420, p.vy + g * dt);
      const ny = p.y + p.vy * dt; const was = p.onGround; p.onGround = false;
      if (p.vy >= 0) {
        let land = null; const gt = groundTop(p.x);
        if (gt != null && p.y <= gt + 1 && ny >= gt) land = gt;
        lv.plats.forEach((pl) => { if (p.x + 4 > pl.x && p.x - 4 < pl.x + pl.w && p.y <= pl.y + 1 && ny >= pl.y) land = land == null ? pl.y : Math.min(land, pl.y); });
        if (land != null) { p.y = land; p.vy = 0; p.onGround = true; p.air = 1; if (!was) { SND.land(); burst(p.x, p.y, 4, ['#e8e0d0'], 30, 0.25, 50); } }
        else p.y = ny;
      } else p.y = ny;
      p.coyote = p.onGround ? 0.08 : p.coyote - dt;
      p.anim += dt * (p.pushing ? 7 : 14) * (spd > 0 ? 1 : 0);
      if (p.onGround && spd > 0 && Math.random() < dt * 10) parts.push({ x: p.x - 5, y: p.y, vx: -20, vy: -10, life: 0.3, max: 0.3, col: '#d8cfc0', g: 0, s: 1 });
      if (p.board > 0 && p.onGround && Math.random() < dt * 30) parts.push({ x: p.x - 7, y: p.y - 1, vx: -60, vy: -5, life: 0.25, max: 0.25, col: '#ffe35a', g: 0, s: 1, glow: true });
      if (p.y > H + 40 && !over) fallPit();
      if (bossOn) camX += (camLock - camX) * Math.min(1, dt * 3);
      else camX = Math.max(0, p.x - 92);
      if (!bossOn && p.x > lv.L - 30) startBoss();
      const pc = p.y - 10 - (p.board ? 3 : 0);   // 주인공 가운데 높이 (기존 모험가 12×19)
      // 부메랑
      booms = booms.filter((b) => {
        b.t += dt; b.rot += dt * 24;
        if (!b.back) { b.vx -= 300 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy *= Math.max(0, 1 - 2.2 * dt); if (b.vx <= 0) { b.back = true; b.hit = []; } }
        else { const dx = p.x + 2 - b.x; const dy = p.y - 11 - b.y; const d = Math.hypot(dx, dy) || 1; b.x += (dx / d) * 320 * dt; b.y += (dy / d) * 320 * dt; if (d < 9) return false; }
        if (Math.random() < dt * (b.fire ? 40 : 12)) parts.push({ x: b.x, y: b.y, vx: 0, vy: -15, life: 0.25, max: 0.25, col: b.fire ? (Math.random() < 0.5 ? '#ff6a1a' : '#ffd23a') : '#7fe3ff', g: 0, s: 1, glow: true });
        const bb = { x: b.x - 5, y: b.y - 5, w: 10, h: 10 };
        ents.forEach((e) => {
          if (!e.alive) return;
          if (e.t === 'enemy' && b.hit.indexOf(e.id) < 0 && overlap(bb, { x: e.x - e.w / 2, y: e.y - e.h, w: e.w, h: e.h })) { b.hit.push(e.id); damageEnemy(e, b.fire ? 2 : 1); }
          else if (e.t === 'chest' && !e.open && overlap(bb, { x: e.x - 7, y: e.y - 11, w: 14, h: 11 })) openChest(e);
        });
        shots.forEach((s) => { if (s.hp < 50 && Math.abs(s.x - b.x) < s.r + 5 && Math.abs(s.y - b.y) < s.r + 5 && b.hit.indexOf(s) < 0) { b.hit.push(s); s.hp -= b.fire ? 2 : 1; if (s.hp <= 0) { s.dead = true; glowBurst(s.x, s.y, 8, ['#fff', '#ffe35a'], 60, 0.3); addScore(20, s.x, s.y - 6); } } });
        if (boss && boss.state !== 'dead' && b.hit.indexOf('boss') < 0 && overlap(bb, bossBox())) { b.hit.push('boss'); hitBoss(b.fire ? 2 : 1, b.x, b.y); }
        return b.t < 3;
      });
      // 적·물건
      const pbox = { x: p.x - 4, y: p.y - 18 - (p.board ? 3 : 0), w: 8, h: 17 };
      ents.forEach((e) => {
        if (!e.alive) return;
        if (e.x < camX - 60 || e.x > camX + W + 80) return;
        if (e.t === 'coin') { if (Math.abs(e.x - p.x) < 8 && Math.abs(e.y - pc) < 13) { e.alive = false; addScore(10); SND.coin(); glowBurst(e.x, e.y, 5, ['#ffe35a', '#fff'], 40, 0.3); } return; }
        if (e.t === 'fruit') { if (Math.abs(e.x - p.x) < 9 && Math.abs(e.y - pc) < 14) { e.alive = false; energy = Math.min(100, energy + 20); addScore(20, e.x, e.y - 6, '#7dffb0'); SND.fruit(); burst(e.x, e.y, 8, ['#ff4a5a', '#ffe35a', '#7dffb0'], 60, 0.4); } return; }
        if (e.t === 'chest') { if (!e.open && Math.abs(e.x - p.x) < 11 && p.y > e.y - 14) openChest(e); return; }
        if (e.t === 'flag') { if (!e.up && p.x > e.x) { e.up = true; checkpoint = { x: e.x + 4 }; SND.flag(); glowBurst(e.x + 6, e.y - 30, 16, [p.accent2, '#fff', '#ffe35a'], 70, 0.6); banner('🚩 체크포인트!', 'good', 1000); } return; }
        if (e.t !== 'enemy') return;
        e.t2 = (e.t2 || 0) + dt * 6; if (e.flashT > 0) e.flashT -= dt;
        if (e.beh === 'walk') { e.x += e.vx * dt; if (e.x < e.x0) { e.x = e.x0; e.vx = Math.abs(e.vx); } if (e.x > e.x1) { e.x = e.x1; e.vx = -Math.abs(e.vx); } }
        else if (e.beh === 'fly') { e.x -= (e.spd || 20) * dt; e.y = e.baseY + Math.sin(t * 3 + (typeof e.id === 'number' ? e.id : 1)) * (e.spd ? 3 : 10); }
        else if (e.beh === 'hop') {
          if (e.fish) { e.ph = (e.ph || hash(e.id) * 2.6) + dt; const cyc = e.ph % 2.6; e.y = cyc < 1.1 ? H + 12 - Math.sin((cyc / 1.1) * Math.PI) * 95 : H + 30; }
          else { e.vy = (e.vy || 0) + 600 * dt; e.y += e.vy * dt; if (e.y >= e.baseY) { e.y = e.baseY; e.vy = 0; e.hopT = (e.hopT || hash(e.id) * 1.5) - dt; if (e.hopT <= 0) { e.vy = -220; e.hopT = 1.4; } } else e.x = clamp(e.x - 22 * dt, e.x0, e.x1); }
        } else if (e.beh === 'shoot') {
          e.shootT -= dt;
          if (e.shootT <= 0 && e.x > p.x + 24 && e.x < camX + W + 10) { e.shootT = 2.6; shot({ x: e.x - 8, y: e.y - 9, vx: -105, vy: 0, r: 3, kind: 'orb', hp: 1 }); }
        }
        const eb = { x: e.x - e.w / 2 + 1, y: e.y - e.h + 1, w: e.w - 2, h: e.h - 2 };
        if (overlap(pbox, eb)) {
          if (p.vy > 40 && p.y - 5 < e.y - e.h * 0.45 && !e.fish) { p.vy = -210; p.air = 1; combo++; comboT = 1.5; killEnemy(e, true); }
          else hurt();
        }
      });
      // 탄 (보스 공격 포함)
      shots.forEach((s) => {
        if (s.kind === 'laser') {
          s.t += dt; if (s.t >= 0.65 && !s.fired) { s.fired = true; SND.laser(); doShake(2); }
          if (s.t >= 0.65 && s.t < 1.05 && Math.abs(s.y - pc) < 10) hurt();
          if (s.t > 1.1) s.dead = true; return;
        }
        if (s.fall) { s.vy += 600 * dt; s.y += s.vy * dt; if (s.y >= GROUND0 - 7) { s.y = GROUND0 - 7; s.fall = false; s.vy = 0; s.vx = -130 * sp(); doShake(2); burst(s.x, s.y + 6, 8, ['#c9bda8'], 60, 0.4); } }
        else if (s.bounce) { s.vy += 520 * dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.y >= GROUND0 - 8) { s.y = GROUND0 - 8; s.vy = -240; } }
        else { s.x += s.vx * dt; s.y += s.vy * dt; }
        let hit;
        if (s.h) hit = overlap(pbox, { x: s.x - s.w / 2, y: s.y - s.h, w: s.w, h: s.h });
        else { const hw = s.w ? s.w / 2 : s.r; hit = Math.abs(s.x - p.x) < hw + 4 && Math.abs(s.y - pc) < s.r + 8; }
        if (hit && p.inv <= 0) { hurt(); if (s.hp < 50) s.dead = true; }
      });
      shots = shots.filter((s) => !s.dead && (s.kind === 'laser' || (s.x > camX - 40 && s.x < camX + W + 60 && s.y < H + 20)));
      if (boss) updateBoss(dt);
      if (boss && !BD.fly && boss.state !== 'dead' && boss.state !== 'intro' && overlap(pbox, bossBox())) hurt();
      if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
      parts = parts.filter((q) => { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; return q.life > 0; });
      popups = popups.filter((q) => { q.life -= dt; q.y -= 22 * dt; return q.life > 0; });
      if (shake > 0) shake = Math.max(0, shake - dt * 14);
    }
    function damageEnemy(e, dmg) {
      e.hp -= dmg; e.flashT = 0.1; SND.hit(); freeze = Math.max(freeze, 0.03);
      if (e.hp <= 0) { combo++; comboT = 1.5; killEnemy(e, false); }
    }
    function killEnemy(e, stomp) {
      e.alive = false; SND[stomp ? 'stomp' : 'hit']();
      const pts = (stomp ? 80 : 50) * Math.min(4, Math.max(1, combo));
      addScore(pts, e.x, e.y - e.h - 4, combo > 1 ? '#ff9af0' : '#ffe35a');
      burst(e.x, e.y - e.h / 2, 14, ['#ffffff', '#ffe35a', st.top, st.shot], 110, 0.5);
      glowBurst(e.x, e.y - e.h / 2, 6, ['#ffffff'], 50, 0.2);
      doShake(1.5);
      if (combo >= 3) popup(e.x, e.y - e.h - 12, `x${Math.min(4, combo)}`, '#ff9af0');
    }

    function render() {
      AR.drawSky(c, st, t, camX); AR.drawFar(c, st, sc, camX, t); AR.drawMid(c, st, sc, camX, t); AR.drawAmbient(c, st, sc, camX, t); AR.drawPit(c, st, camX, t);
      c.save();
      if (shake > 0) c.translate(Math.round((Math.random() - 0.5) * shake * 2), Math.round((Math.random() - 0.5) * shake * 2));
      const cx0 = camX; camX = Math.round(camX);
      drawGround();
      ents.forEach((e) => { if (e.alive || e.t === 'chest' || e.t === 'flag') drawEnt(e); });
      if (boss && !(boss.state === 'dead' && boss.dead > 1.5)) { const col = (cc) => (boss.flash > 0 ? '#ffffff' : cc); BD.draw(c, boss, Math.round(boss.x - camX), Math.round(boss.y), t, col, boss.ph); }
      shots.forEach(drawShot);
      c.save(); c.translate(-camX, 0); AR.drawHero(c, p, t); c.restore();
      booms.forEach(drawBoom);
      parts.forEach((q) => {
        const a = clamp(q.life / q.max, 0, 1);
        if (q.glow) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.fillStyle = q.col; c.fillRect(Math.round(q.x - camX), Math.round(q.y), q.s + 1, q.s + 1); c.restore(); }
        else { c.globalAlpha = a; c.fillStyle = q.col; c.fillRect(Math.round(q.x - camX), Math.round(q.y), q.s + 1, q.s + 1); c.globalAlpha = 1; }
      });
      popups.forEach((q) => { c.globalAlpha = clamp(q.life * 2, 0, 1); digits(c, q.txt, Math.round(q.x - camX), Math.round(q.y), q.col); c.globalAlpha = 1; });
      camX = cx0;
      c.restore();
      AR.drawFront(c, st, sc, camX);
      if (energy < 25 && !bossOn) { c.save(); c.globalAlpha = 0.12 + Math.sin(t * 8) * 0.08; c.fillStyle = '#ff2040'; c.fillRect(0, 0, W, H); c.restore(); }
      if (boss && boss.ph && boss.state !== 'dead') { c.save(); c.globalAlpha = 0.08 + Math.sin(t * 4) * 0.04; c.fillStyle = '#ff2040'; c.fillRect(0, 0, W, H); c.restore(); }
    }

    // ----- 반복 -----
    let raf; let last = performance.now();
    function loop(ts) {
      raf = requestAnimationFrame(loop);   // 오류가 나도 다음 장면은 항상 예약
      try { step(ts); } catch (err) { if (window.console) console.error(err); }
    }
    function step(ts) {
      const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000)); last = ts;
      if (!paused) {
        if (quiz && !quiz.done) {
          quiz.left -= dt; const bar = $('#qqTime'); if (bar) bar.style.width = `${clamp(quiz.left / 8, 0, 1) * 100}%`;
          if (quiz.left <= 0) answerQuiz(-1);
        }
        if (freeze > 0) freeze -= dt;
        else update(dt * timeScale);
      }
      render(); hud();
    }
    raf = requestAnimationFrame(loop);
    A.onStop(() => cancelAnimationFrame(raf));
    banner(`STAGE ${si + 1}<small>${st.name} · ${st.en}</small>`, 'stage', 1800);
    hud();
  }

  window.TWQuest = { setup };
})();
