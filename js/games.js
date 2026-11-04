/* 쌍둥이의 하루 영단어 — 게임 (요구사항 9장, 화면설계 11장)
     #/game          게임 메뉴 (단어 범위·난이도 선택)
     #/game/blocks   G-01 철자 블록 맞추기
     #/game/rain     G-02 떨어지는 단어 막기
     #/game/ox       G-03 스피드 O/X 퀴즈
     #/game/battle   G-04 쌍둥이 대결
   app.js 가 window.TW 로 공용 도구(단어 데이터, 소리, 도우미)를 넘겨준다.
*/
(() => {
  'use strict';

  const KEY = 'twins-game';
  const GAMES = {
    blocks: { icon: '🧩', name: '철자 블록', desc: '섞인 알파벳으로 단어 완성', unit: '점' },
    rain: { icon: '☔', name: '떨어지는 단어', desc: '바닥에 닿기 전에 영단어 쓰기', unit: '점' },
    catch: { icon: '🧺', name: '바구니 받기', desc: '영단어·과일은 받고 못 먹는 건 피하기', unit: '점' },
    ox: { icon: '⭕', name: '스피드 O/X', desc: '단어와 뜻이 맞는지 빠르게', unit: '개' },
    battle: { icon: '⚔️', name: '쌍둥이 대결', desc: '마주 앉아 먼저 맞히기', unit: '' },
  };
  // ⓘ 버튼으로 보는 조작 방법
  const HELP = {
    blocks: ['뜻을 보고 소리를 들은 뒤, 알파벳 블록을 단어 순서대로 눌러요.', 'PC는 키보드로 글자를 쳐도 돼요. 스페이스 = 다시 듣기', '💡 힌트는 다음 글자 블록을 반짝여 줘요.', '힌트를 쓰거나 "모르겠어요"를 누른 단어는 놓친 단어로 남아요.'],
    rain: ['위에서 한글 뜻 카드가 떨어져요.', '바닥에 닿기 전에 그 영단어를 입력칸에 써요. 맞으면 Enter 없이 바로 터져요.', '✍️ 펜으로 쓰기를 켜면 손글씨로 쓸 수 있고, 단어가 조금 천천히 떨어져요.', '카드가 바닥에 3개 닿으면 끝나요. ⏸ 로 잠깐 멈출 수 있어요.'],
    catch: ['화면을 누르거나 손가락으로 끌면 아이가 그쪽으로 달려가요.', 'PC는 ← → 키로 움직이고, 스페이스로 잠깐 멈춰요.', '영단어 +10점 · 과일 🍎🍌🍇 +5점', '못 먹는 것 🪨🧦👟🔩🧱🪣🧽 은 피해요. 받으면 −5점!', '영단어를 받으면 뜻을 보여 주고 발음을 들려줘요. 영단어가 다 떨어지면 끝나요.'],
    ox: ['영단어와 뜻이 짝으로 나와요.', '맞는 짝이면 ⭕, 틀린 짝이면 ❌ 를 눌러요.', 'PC는 ← 또는 O 키 = ⭕, → 또는 X 키 = ❌', '틀리면 정답을 보여 주고 2초 쉬어요. 시간이 끝날 때까지 최대한 많이 맞혀요.'],
    battle: ['태블릿을 책상에 눕혀 놓고 마주 앉아요. 위쪽 화면은 맞은편 사람 쪽으로 뒤집혀 있어요.', '같은 문제를 먼저 맞히면 1점!', '틀리면 그 문제는 기회가 끝나요. 둘 다 틀리면 정답을 보여 줘요.', '10문제를 풀고 점수가 많은 사람이 이겨요.'],
  };
  const DIFFS = { easy: '쉬움', normal: '보통', hard: '어려움' };

  // ---------- 설정 (기기에 기억) ----------
  const S = (() => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { /* 저장 불가 환경 */ }
    return { level: 'e', mode: 'today', from: 1, to: 10, topic: '', diff: 'normal', pen: false, penGuide: false, names: ['형', '동생'], best: {}, ...s };
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* 저장 불가 환경 */ } };

  // ---------- 정리 (화면을 떠나면 타이머·애니메이션 중지) ----------
  let cleanups = [];
  const onStop = (fn) => cleanups.push(fn);
  const later = (fn, ms) => { const t = setTimeout(fn, ms); onStop(() => clearTimeout(t)); return t; };
  const every = (fn, ms) => { const t = setInterval(fn, ms); onStop(() => clearInterval(t)); return t; };
  function stop() { cleanups.forEach((f) => f()); cleanups = []; helpPause = null; document.body.classList.remove('game-full'); }
  const fullScreen = () => document.body.classList.add('game-full');

  // ---------- 단어 범위 ----------
  const T = () => window.TW;
  const level = () => T().data[S.level];
  const todayDay = () => T().store.get()[S.level] || 1;
  function pool() {
    const lv = level();
    const ok = (w) => w.meaning;
    if (S.mode === 'topic') return lv.words.filter((w) => ok(w) && w.topic === S.topic);
    const [a, b] = S.mode === 'today' ? [todayDay(), todayDay()] : [Math.min(S.from, S.to), Math.max(S.from, S.to)];
    return lv.words.filter((w) => ok(w) && w.day >= a && w.day <= b);
  }
  const rangeLabel = () => S.mode === 'today' ? `Day ${todayDay()}` : S.mode === 'topic' ? S.topic : (S.from === S.to ? `Day ${S.from}` : `Day ${Math.min(S.from, S.to)}~${Math.max(S.from, S.to)}`);
  // 퀴즈·떨어지는 카드에 쓸 짧은 뜻: 첫 품사 뜻만, 괄호 설명 빼기
  const short = (w) => w.meaning.split(';')[0].replace(/\s*\([^)]*\)/g, '').trim();
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  // 정답 단어와 다른 보기 고르기 (같은 주제 우선, 뜻이 겹치지 않게)
  function distractors(w, n, from = pool()) {
    const src = from.length > n ? from : level().words.filter((x) => x.meaning);
    const seen = new Set([short(w)]);
    const out = [];
    for (const x of [...T().shuffle(src.filter((x) => x.topic === w.topic)), ...T().shuffle(src)]) {
      if (out.length >= n) break;
      if (x.word === w.word || seen.has(short(x))) continue;
      seen.add(short(x)); out.push(x);
    }
    return out;
  }
  const bestKey = (g) => `${S.level}-${g}`;
  function saveBest(g, v) { const k = bestKey(g); const isBest = !(S.best[k] >= v); if (isBest) { S.best[k] = v; save(); } return isBest; }

  // 화면 공통
  const app = () => T().app;
  const esc = (s) => T().esc(s);
  function setTheme() { document.body.dataset.level = level().key; document.title = '게임 · 쌍둥이의 하루 영단어'; }
  function topBar(title, right = '') {
    return `<div class="game-bar"><button class="close-x" id="gQuit" aria-label="게임 메뉴로">✕</button><span class="game-title">${title}</span><span class="game-stats">${right}</span><button class="btn ghost small help-btn" id="gHelp" aria-label="조작 방법">ⓘ</button></div>`;
  }
  let helpPause = null;   // 설명을 보는 동안 게임을 멈추는 함수 (떨어지는 단어·바구니)
  function showHelp() {
    const g = (location.hash.split('/')[2] || '').split('?')[0];
    const info = GAMES[g]; if (!info) return;
    if (helpPause) helpPause(true);
    let dlg = document.getElementById('gameHelp');
    if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'gameHelp'; dlg.className = 'voice-dlg game-help'; document.body.append(dlg); }
    dlg.innerHTML = `<h3>${info.icon} ${info.name} — 이렇게 해요</h3>
      <ul>${HELP[g].map((t) => `<li>${t}</li>`).join('')}</ul>
      <div class="done-actions"><button class="btn primary" id="helpClose">알겠어요${helpPause ? ' ▶ 계속하기' : ''}</button></div>`;
    const close = () => { dlg.close(); if (helpPause) helpPause(false); };
    dlg.querySelector('#helpClose').onclick = close;
    dlg.oncancel = (e) => { e.preventDefault(); close(); };
    dlg.showModal();
  }

  function bindQuit(confirmFirst = true) {
    const h = app().querySelector('#gHelp');
    if (h) h.onclick = showHelp;
    const b = app().querySelector('#gQuit');
    if (b) b.onclick = () => { if (!confirmFirst || confirm('게임을 그만둘까요?')) T().go('#/game'); };
  }
  const say = (w) => T().tts.say(w.word);
  const sfx = (k) => T().sfx?.[k]();
  const sayAfter = (w) => T().sayAfterSfx(w.word);

  // =========================================================
  // S-07 게임 메뉴
  // =========================================================
  function renderMenu() {
    setTheme();
    const lv = level();
    // 학교급을 바꾸면 이전 학교급의 주제·일차가 남아 있을 수 있으니 범위부터 바로잡는다
    const topics = [...new Set(lv.words.map((w) => w.topic))];
    if (!topics.includes(S.topic)) S.topic = topics[0];
    S.from = Math.min(Math.max(1, S.from), lv.totalDays); S.to = Math.min(Math.max(1, S.to), lv.totalDays);
    const p = pool();
    const enough = p.length >= 4;
    const best = (g) => {
      const v = S.best[bestKey(g)];
      return g === 'battle' ? '2인 대전' : v != null ? `최고 ${v.toLocaleString()}${GAMES[g].unit}` : '첫 도전!';
    };
    app().innerHTML = `
      <div class="topbar">
        <button class="close-x" onclick="location.hash='#/'" aria-label="홈으로">◀</button>
        <h2>🎮 게임</h2>
        ${T().voiceBtn()}
      </div>
      <section class="game-setup card">
        <div class="setup-row"><span class="setup-label">학교급</span>
          <span class="seg">${Object.values(T().data).map((l) => `<button class="btn small ${l.code === S.level ? 'primary' : ''}" data-lv="${l.code}">${l.emoji} ${l.name}</button>`).join('')}</span>
        </div>
        <div class="setup-row"><span class="setup-label">범위</span>
          <span class="range-opts">
            <label><input type="radio" name="mode" value="today" ${S.mode === 'today' ? 'checked' : ''}> 오늘 일차 (Day ${todayDay()})</label>
            <label><input type="radio" name="mode" value="range" ${S.mode === 'range' ? 'checked' : ''}> Day
              <input type="number" id="gFrom" min="1" max="${lv.totalDays}" value="${S.from}"> ~
              <input type="number" id="gTo" min="1" max="${lv.totalDays}" value="${S.to}"></label>
            <label><input type="radio" name="mode" value="topic" ${S.mode === 'topic' ? 'checked' : ''}> 주제
              <select id="gTopic">${topics.map((t) => `<option ${t === S.topic ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
          </span>
        </div>
        <div class="setup-row"><span class="setup-label">난이도</span>
          <span class="seg">${Object.entries(DIFFS).map(([k, v]) => `<button class="btn small ${k === S.diff ? 'primary' : ''}" data-diff="${k}">${v}</button>`).join('')}</span>
        </div>
        <p class="pool-count ${enough ? '' : 'warn'}">${enough ? `→ <b>${p.length}단어</b>로 게임해요 (${esc(rangeLabel())})` : `단어가 ${p.length}개뿐이에요. 범위를 넓혀 주세요 (4개 이상)`}</p>
      </section>
      <section class="game-cards">
        ${Object.entries(GAMES).map(([g, info]) => `
          <button class="game-card" data-game="${g}" ${enough ? '' : 'disabled'}>
            <span class="gc-icon" aria-hidden="true">${info.icon}</span>
            <span class="gc-name">${info.name}</span>
            <span class="gc-desc">${info.desc}</span>
            <span class="gc-best">${best(g)}</span>
          </button>`).join('')}
      </section>`;
    const $ = (s) => app().querySelector(s);
    const $$ = (s) => [...app().querySelectorAll(s)];
    const rerender = () => { save(); renderMenu(); };
    $$('[data-lv]').forEach((b) => (b.onclick = () => { S.level = b.dataset.lv; S.from = 1; S.to = Math.min(10, T().data[S.level].totalDays); rerender(); }));
    $$('[data-diff]').forEach((b) => (b.onclick = () => { S.diff = b.dataset.diff; rerender(); }));
    $$('input[name=mode]').forEach((r) => (r.onchange = () => { S.mode = r.value; rerender(); }));
    $('#gFrom').onchange = (e) => { S.from = +e.target.value || 1; S.mode = 'range'; rerender(); };
    $('#gTo').onchange = (e) => { S.to = +e.target.value || 1; S.mode = 'range'; rerender(); };
    $('#gTopic').onchange = (e) => { S.topic = e.target.value; S.mode = 'topic'; rerender(); };
    $$('[data-game]').forEach((b) => (b.onclick = () => T().go(`#/game/${b.dataset.game}`)));
  }

  // =========================================================
  // S-12 결과 (공통)
  // =========================================================
  function showResult(g, { big, sub, score, missed, again, againMissed }) {
    stop(); T().setKey(null);   // 게임 타이머·키 입력 정리 (stop 이 game-full 도 해제)
    const isBest = score != null && saveBest(g, score);
    if (isBest || g === 'battle') sfx('combo');
    const uniq = [...new Map(missed.map((w) => [w.word, w])).values()];
    app().innerHTML = `
      <div class="stage"><article class="card game-result">
        <div class="party">${uniq.length ? '👏' : '🎉'}</div>
        <div class="result-score">${big}</div>
        <p class="result-sub">${sub}</p>
        ${isBest ? '<p class="best-badge">⭐ 최고 기록!</p>' : ''}
        ${uniq.length ? `<h3 class="missed-title">놓친 단어 ${uniq.length}개</h3>
          <ul class="wrong-list">${uniq.map((w) => `<li><span style="color:var(--bad)">✗</span><span class="en">${esc(w.word)}</span><span>${esc(w.meaning)}</span><button class="icon-btn" data-tts="${esc(w.word)}" style="margin-left:auto" aria-label="듣기">🔊</button></li>`).join('')}</ul>` : ''}
        <div class="done-actions">
          <button class="btn primary" id="rAgain">🔁 다시 하기</button>
          ${uniq.length && againMissed ? '<button class="btn soft" id="rMissed">놓친 단어로 다시</button>' : ''}
          <button class="btn" onclick="location.hash='#/game'">🎮 게임 메뉴</button>
        </div>
      </article></div>`;
    T().bindAudio(app());
    app().querySelector('#rAgain').onclick = again;
    const m = app().querySelector('#rMissed');
    if (m) m.onclick = () => againMissed(uniq);
    T().setKey(null);
  }

  // =========================================================
  // G-01 철자 블록 맞추기
  // =========================================================
  function playBlocks(list) {
    stop(); setTheme();
    const words = list || T().shuffle(pool()).slice(0, 10);
    const DECOYS = { easy: 0, normal: 2, hard: 4 }[S.diff];
    const t0 = Date.now();
    let i = 0; let mistakes = 0; let hints = 0;
    const missed = [];
    let w; let chars; let pos; let blocks; let wordMistakes; let busy;

    const isLetter = (c) => /[a-z]/i.test(c);
    const timeStr = () => { const s = Math.floor((Date.now() - t0) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

    function next() {
      if (i >= words.length) return finish();
      w = words[i];
      chars = [...w.word];
      pos = chars.findIndex(isLetter);
      wordMistakes = 0; busy = false;
      const need = chars.filter(isLetter).map((c) => c.toLowerCase());
      const decoys = Array.from({ length: DECOYS }, () => 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]);
      blocks = T().shuffle([...need, ...decoys]).map((ch) => ({ ch, used: false }));
      draw();
      later(() => say(w), 250);
    }
    function draw() {
      app().innerHTML = `
        ${topBar(`🧩 철자 블록 · ${esc(rangeLabel())}`, `<span>${i + 1} / ${words.length}</span><span id="bTime">⏱ ${timeStr()}</span>`)}
        <div class="progress game-progress"><i style="width:${(i / words.length) * 100}%"></i></div>
        <div class="stage"><article class="card blocks-card">
          <div class="write-head"><span class="meaning">${esc(w.meaning)}</span><span class="pos">${esc(w.pos)}</span>
            <button class="icon-btn" id="bSay" aria-label="듣기">🔊</button></div>
          <div class="slots en">${chars.map((c, k) => `<span class="slot ${isLetter(c) ? '' : 'fixed'} ${k < pos || !isLetter(c) && k < chars.length ? 'filled' : ''}">${!isLetter(c) || k < pos ? esc(c) : ''}</span>`).join('')}</div>
          <div class="blocks en">${blocks.map((b, k) => `<button class="block ${b.used ? 'used' : ''}" data-k="${k}" ${b.used ? 'disabled' : ''}>${esc(b.ch)}</button>`).join('')}</div>
          <div class="hint-row">
            <button class="btn soft small" id="bHint">💡 힌트</button>
            <button class="btn ghost small" id="bGive">모르겠어요</button>
          </div>
        </article></div>`;
      bindQuit();
      const $ = (s) => app().querySelector(s);
      $('#bSay').onclick = () => say(w);
      $('#bHint').onclick = hint;
      $('#bGive').onclick = giveUp;
      app().querySelectorAll('.block').forEach((b) => (b.onpointerdown = (e) => { e.preventDefault(); press(+b.dataset.k); }));
    }
    function press(k) {
      if (busy) return;
      const b = blocks[k];
      if (!b || b.used) return;
      const el = app().querySelector(`.block[data-k="${k}"]`);
      if (b.ch === chars[pos].toLowerCase()) {
        b.used = true;
        el.classList.add('used'); el.disabled = true;
        const slot = app().querySelectorAll('.slot')[pos];
        slot.textContent = chars[pos]; slot.classList.add('filled', 'pop');
        do { pos++; } while (pos < chars.length && !isLetter(chars[pos]));
        if (pos >= chars.length) solved();
      } else {
        mistakes++; wordMistakes++; sfx('bad');
        el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
        if (wordMistakes === 3) missed.push(w);
      }
    }
    function hint() {
      if (busy) return;
      const k = blocks.findIndex((b) => !b.used && b.ch === chars[pos].toLowerCase());
      if (k < 0) return;
      hints++;
      if (!missed.includes(w)) missed.push(w);
      app().querySelector(`.block[data-k="${k}"]`).classList.add('glow');
    }
    function giveUp() {
      if (busy) return;
      busy = true;
      if (!missed.includes(w)) missed.push(w);
      app().querySelectorAll('.slot').forEach((s, k) => { s.textContent = chars[k]; s.classList.add('filled', 'revealed'); });
      say(w);
      later(() => { i++; next(); }, 1600);
    }
    function solved() {
      busy = true;
      app().querySelector('.slots').classList.add('done');
      sfx('ok'); sayAfter(w);
      later(() => { i++; next(); }, 1200);
    }
    function finish() {
      const solvedCount = words.length - new Set(missed.map((x) => x.word)).size;
      const secs = Math.round((Date.now() - t0) / 1000);
      const score = Math.max(0, words.length * 100 - mistakes * 10 - hints * 30 - Math.max(0, secs - words.length * 8));
      showResult('blocks', {
        big: `${solvedCount} / ${words.length}`,
        sub: `실수 ${mistakes}번 · 힌트 ${hints}번 · ⏱ ${timeStr()} · <b>${score}점</b>`,
        score, missed,
        again: () => playBlocks(),
        againMissed: (ws) => playBlocks(ws),
      });
    }
    T().setKey((e) => {
      if (e.key === ' ') { e.preventDefault(); say(w); return; }
      if (!/^[a-z]$/i.test(e.key)) return;
      const ch = e.key.toLowerCase();
      // 정답 글자면 그 블록을, 아니면 같은 글자 블록을 눌러(틀림 처리) 준다
      const k = blocks.findIndex((b) => !b.used && b.ch === ch);
      if (k >= 0) press(k);
    });
    every(() => { const t = app().querySelector('#bTime'); if (t) t.textContent = `⏱ ${timeStr()}`; }, 1000);
    next();
  }

  // =========================================================
  // G-02 떨어지는 단어 막기
  // =========================================================
  function playRain() {
    stop(); setTheme();
    const P = pool();
    const BASE = { e: 26, m: 32, h: 38 }[S.level];               // 처음 낙하 속도 (px/초)
    const MULT = { easy: 0.75, normal: 1, hard: 1.3 }[S.diff];
    let lives = 3; let score = 0; let stage = 1; let hits = 0;
    const missed = [];
    let cards = []; let queue = []; let paused = false; let over = false;
    let spawnIn = 0.3; let last = performance.now(); let raf;

    app().innerHTML = `
      <div class="rain-wrap" id="rWrap">
        ${topBar('☔ 떨어지는 단어', `<span id="rLives">❤️❤️❤️</span><span id="rScore">0점</span><span id="rStage">단계 1</span><button class="btn ghost small" id="rPause">⏸</button>`)}
        <div class="rain-area" id="rArea"><div class="rain-floor"></div><div class="rain-msg" id="rMsg"></div></div>
        <div class="rain-input">
          <input id="rIn" class="spell-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="영어로 쓰세요" aria-label="영단어 입력">
          <button class="btn primary" id="rOk">✓</button>
          <button class="btn ${S.pen ? 'soft' : 'ghost'} small" id="rPen">✍️ 펜으로 쓰기${S.pen ? ' ON' : ''}</button>
        </div>
      </div>`;
    bindQuit(); fullScreen();
    const $ = (s) => app().querySelector(s);
    const wrap = $('#rWrap'); const area = $('#rArea'); const input = $('#rIn');

    // 화면(키보드가 올라온 높이 포함)에 맞춰 게임 영역 크기 조절
    const fit = () => {
      const vv = window.visualViewport;
      const h = (vv ? vv.height : window.innerHeight) - wrap.getBoundingClientRect().top - (vv ? 0 : 0) - 8;
      wrap.style.height = `${Math.max(320, h)}px`;
    };
    fit();
    const vv = window.visualViewport;
    if (vv) { vv.addEventListener('resize', fit); onStop(() => vv.removeEventListener('resize', fit)); }
    window.addEventListener('resize', fit); onStop(() => window.removeEventListener('resize', fit));

    const speed = () => BASE * MULT * (S.pen ? 0.7 : 1) * (1 + (stage - 1) * 0.12);
    const spawnGap = () => Math.max(1.3, 3.4 - (stage - 1) * 0.25) / (S.pen ? 0.8 : 1);
    const maxCards = () => Math.min(2 + stage, 6);
    function nextWord() {
      if (!queue.length) queue = T().shuffle(P);
      const onScreen = new Set(cards.map((c) => c.w.word));
      const idx = queue.findIndex((x) => !onScreen.has(x.word));
      return queue.splice(idx < 0 ? 0 : idx, 1)[0];
    }
    function spawn() {
      const w = nextWord();
      const el = document.createElement('div');
      el.className = 'rain-card';
      el.textContent = short(w);
      area.appendChild(el);
      const maxX = Math.max(0, area.clientWidth - el.offsetWidth - 8);
      const x = 4 + Math.random() * maxX;
      el.style.transform = `translate(${x}px, -60px)`;
      cards.push({ w, el, x, y: -el.offsetHeight });
    }
    const hud = () => {
      $('#rLives').textContent = '❤️'.repeat(lives) + '🤍'.repeat(3 - lives);
      $('#rScore').textContent = `${score}점`;
      $('#rStage').textContent = `단계 ${stage}`;
    };
    function msg(text, ok) {
      const m = $('#rMsg'); if (!m) return;
      m.innerHTML = text; m.className = `rain-msg show ${ok ? 'ok' : 'bad'}`;
      later(() => { m.className = 'rain-msg'; }, 1100);
    }
    function remove(c) { c.el.remove(); cards = cards.filter((x) => x !== c); }
    function pop(c) {
      c.el.classList.add('popped');
      later(() => c.el.remove(), 300);
      cards = cards.filter((x) => x !== c);
      score += 10 * stage; hits++;
      if (hits % 6 === 0) { stage++; msg(`🚀 단계 ${stage}!`, true); sfx('combo'); } else sfx('ok');
      sayAfter(c.w); hud();
    }
    function land(c) {
      remove(c);
      lives--; missed.push(c.w); sfx('bad');
      area.classList.remove('hit'); void area.offsetWidth; area.classList.add('hit');
      msg(`<span class="en">${esc(c.w.word)}</span> = ${esc(short(c.w))}`, false);
      hud();
      if (lives <= 0) end();
    }
    function loop(ts) {
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      if (!paused && !over) {
        spawnIn -= dt;
        if (spawnIn <= 0 && cards.length < maxCards()) { spawn(); spawnIn = spawnGap(); }
        const floor = area.clientHeight - 6;
        for (const c of [...cards]) {
          c.y += speed() * dt;
          c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
          if (c.y + c.el.offsetHeight >= floor) land(c);
        }
      }
      if (!over) raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    onStop(() => cancelAnimationFrame(raf));

    const matches = (c, v) => T().answers(c.w).some((a) => a.startsWith(v));
    const exact = (c, v) => T().answers(c.w).includes(v);
    function check(submit) {
      const v = input.value.trim().toLowerCase();
      cards.forEach((c) => c.el.classList.toggle('aim', v.length > 0 && matches(c, v)));
      if (!v) return;
      // 가장 아래(급한) 카드부터 정답 확인 — 손글씨 입력은 Enter 없이도 맞으면 바로 터진다
      const hit = [...cards].sort((a, b) => b.y - a.y).find((c) => exact(c, v));
      if (hit) { pop(hit); input.value = ''; cards.forEach((c) => c.el.classList.remove('aim')); return; }
      if (submit) { sfx('bad'); input.classList.remove('no'); void input.offsetWidth; input.classList.add('no'); later(() => { input.value = ''; input.classList.remove('no'); }, 350); }
    }
    input.oninput = () => check(false);
    input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); check(true); } };
    $('#rOk').onclick = () => { check(true); input.focus(); };
    const setPause = (p) => {
      if (over) return;
      paused = p; last = performance.now();
      $('#rPause').textContent = p ? '▶' : '⏸';
      area.classList.toggle('paused', p);
      if (p) msg('⏸ 잠깐 멈춤 — ▶ 를 누르면 계속해요', true); else input.focus();
    };
    $('#rPause').onclick = () => setPause(!paused);
    helpPause = setPause;
    const onVis = () => { if (document.hidden) setPause(true); };
    document.addEventListener('visibilitychange', onVis); onStop(() => document.removeEventListener('visibilitychange', onVis));
    $('#rPen').onclick = () => {
      S.pen = !S.pen; save();
      const b = $('#rPen'); b.textContent = `✍️ 펜으로 쓰기${S.pen ? ' ON' : ''}`; b.className = `btn ${S.pen ? 'soft' : 'ghost'} small`;
      if (S.pen && !S.penGuide) {
        S.penGuide = true; save(); setPause(true);
        alert('✍️ 펜(손글씨)으로 쓰는 방법 (갤럭시탭)\n\n① S펜: 입력칸 가까이에 펜을 대면 나오는 "펜으로 쓰기" 아이콘을 누르고 칸에 바로 쓰기\n② 키보드: 삼성 키보드나 Gboard의 ✍️ 필기 모드로 바꿔서 쓰기\n\n맞게 쓰면 Enter 없이도 바로 터져요.\n펜 모드에서는 단어가 조금 천천히 떨어져요.');
      }
      input.focus();
    };
    function end() {
      over = true;
      later(() => showResult('rain', {
        big: `${score.toLocaleString()}점`,
        sub: `막은 단어 ${hits}개 · 단계 ${stage}${S.pen ? ' · 펜 모드' : ''}`,
        score, missed,
        again: () => playRain(),
        againMissed: null,
      }), 700);
    }
    hud();
    input.focus();
  }

  // =========================================================
  // G-05 바구니 받기 — 영단어(+10)·과일(+5)은 받고, 못 먹는 것(-5)은 피하기
  // =========================================================
  const FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍑', '🍒', '🍍', '🥝'];
  const JUNK = ['🪨', '🧦', '👟', '🔩', '🧱', '🪣', '🧽'];
  function playCatch() {
    stop(); setTheme();
    const P = pool();
    const TOTAL = { easy: 10, normal: 15, hard: 20 }[S.diff];         // 이번 판에 떨어질 영단어 수
    const FALL = { easy: 95, normal: 120, hard: 150 }[S.diff];         // 낙하 속도 (px/초)
    const JUNK_RATE = { easy: 0.3, normal: 0.45, hard: 0.55 }[S.diff]; // 단어가 아닌 것 중 못 먹는 것 비율
    const words = T().shuffle(P).slice(0, TOTAL);
    while (words.length < TOTAL) words.push(pick(P));
    let score = 0; let gotWords = 0; let gotFruit = 0; let gotJunk = 0;
    const missed = [];
    let items = []; let paused = false; let over = false; let raf; let last = performance.now();
    let wordIn = 0.8; let extraIn = 1.6;
    let kidX = 0; let targetX = null; let keyDir = 0;

    app().innerHTML = `
      <div class="catch-wrap" id="cWrap">
        ${topBar('🧺 바구니 받기', `<span id="cLeft">단어 ${TOTAL}개 남음</span><span id="cScore">0점</span><button class="btn ghost small" id="cPause">⏸</button>`)}
        <div class="catch-area" id="cArea">
          <div class="catch-help" id="cHelp">손가락으로 아이를 끌어서 움직여요 (PC는 ← →)<br>영단어 <b>+10</b> · 과일 <b>+5</b> · 못 먹는 것 <b>−5</b></div>
          <div class="catch-msg" id="cMsg"></div>
          <div class="catcher" id="cKid"><span class="basket">🧺</span><span class="kid">🧒</span></div>
        </div>
      </div>`;
    bindQuit(); fullScreen();
    const $ = (s) => app().querySelector(s);
    const wrap = $('#cWrap'); const area = $('#cArea'); const kid = $('#cKid');
    const fit = () => { wrap.style.height = `${Math.max(360, window.innerHeight - wrap.getBoundingClientRect().top - 8)}px`; };
    fit(); window.addEventListener('resize', fit); onStop(() => window.removeEventListener('resize', fit));
    kidX = (area.clientWidth - kid.offsetWidth) / 2;

    const left = () => words.length + items.filter((it) => it.w).length;
    const hud = () => {
      $('#cScore').textContent = `${score}점`;
      $('#cLeft').textContent = `단어 ${left()}개 남음`;
    };
    let msgT;
    function msg(html, ok) {
      const m = $('#cMsg'); if (!m) return;
      m.innerHTML = html; m.className = `catch-msg show ${ok ? 'ok' : 'bad'}`;
      clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove('show'), 1400);
    }
    onStop(() => clearTimeout(msgT));
    function float(text, x, y, ok) {
      const f = document.createElement('div');
      f.className = `catch-float ${ok ? 'ok' : 'bad'}`; f.textContent = text;
      f.style.left = `${x}px`; f.style.top = `${y}px`;
      area.appendChild(f); later(() => f.remove(), 800);
    }
    function spawn(kind) {
      const el = document.createElement('div');
      let w = null;
      if (kind === 'word') { w = words.shift(); el.className = 'catch-item word en'; el.textContent = w.word; }
      else { el.className = 'catch-item emoji'; el.textContent = pick(kind === 'fruit' ? FRUITS : JUNK); }
      area.appendChild(el);
      const x = 4 + Math.random() * Math.max(0, area.clientWidth - el.offsetWidth - 8);
      const it = { kind, w, el, x, y: -el.offsetHeight, v: FALL * (kind === 'word' ? 1 : 0.9 + Math.random() * 0.4) };
      el.style.transform = `translate(${x}px, ${it.y}px)`;
      items.push(it); hud();
    }
    function catchIt(it) {
      const fx = it.x + it.el.offsetWidth / 2; const fy = it.y;
      it.el.remove();
      if (it.kind === 'word') {
        score += 10; gotWords++; sfx('ok'); sayAfter(it.w);
        float('+10', fx, fy, true);
        msg(`<span class="en">${esc(it.w.word)}</span> = ${esc(short(it.w))}`, true);
      } else if (it.kind === 'fruit') {
        score += 5; gotFruit++; sfx('ok'); float('+5 냠냠', fx, fy, true);
      } else {
        score = Math.max(0, score - 5); gotJunk++; sfx('bad'); float('−5 퉤!', fx, fy, false);
        kid.classList.remove('yuck'); void kid.offsetWidth; kid.classList.add('yuck');
        kid.querySelector('.kid').textContent = '😖';
        later(() => { const k = kid.querySelector('.kid'); if (k) k.textContent = '🧒'; }, 600);
      }
      hud();
    }
    function loop(ts) {
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      if (!paused && !over) {
        // 아이 움직이기: 누른 곳을 따라가거나 ← → 키
        const maxX = area.clientWidth - kid.offsetWidth;
        const RUN = 900;
        if (keyDir) { kidX += keyDir * RUN * 0.7 * dt; targetX = null; }
        else if (targetX != null) { const d = targetX - kidX; kidX += Math.sign(d) * Math.min(Math.abs(d), RUN * dt); }
        kidX = Math.max(0, Math.min(maxX, kidX));
        kid.style.transform = `translateX(${kidX}px)`;

        // 떨어뜨리기: 영단어는 정해진 개수만, 과일·못 먹는 것은 그 사이사이에
        if (words.length) { wordIn -= dt; if (wordIn <= 0) { spawn('word'); wordIn = Math.max(1.2, 1.9 - (TOTAL - words.length) * 0.03); } }
        extraIn -= dt;
        if (extraIn <= 0 && left()) { spawn(Math.random() < JUNK_RATE ? 'junk' : 'fruit'); extraIn = 1.1 + Math.random() * 1.2; }

        // 바구니 위치 (아이 요소 안에서 바구니가 차지하는 칸)
        const bk = kid.querySelector('.basket');
        const bL = kidX + bk.offsetLeft + 4; const bR = bL + bk.offsetWidth - 8;
        const bT = kid.offsetTop + bk.offsetTop;
        for (const it of [...items]) {
          it.y += it.v * dt;
          it.el.style.transform = `translate(${it.x}px, ${it.y}px)`;
          const h = it.el.offsetHeight; const w = it.el.offsetWidth;
          const bottom = it.y + h;
          if (bottom >= bT && bottom <= bT + 36 && it.x + w * 0.75 >= bL && it.x + w * 0.25 <= bR) {
            items = items.filter((x) => x !== it); catchIt(it); continue;
          }
          if (it.y > area.clientHeight) {
            items = items.filter((x) => x !== it); it.el.remove();
            if (it.kind === 'word') { missed.push(it.w); msg(`놓쳤어요: <span class="en">${esc(it.w.word)}</span> = ${esc(short(it.w))}`, false); }
            hud();
          }
        }
        if (!left()) { end(); return; }
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    onStop(() => cancelAnimationFrame(raf));

    // 터치·마우스: 누른 곳으로 아이가 달려가고, 끌면 따라온다
    const aim = (e) => { const a = area.getBoundingClientRect(); targetX = e.clientX - a.left - kid.offsetWidth / 2; $('#cHelp')?.remove(); };
    area.onpointerdown = (e) => { e.preventDefault(); try { area.setPointerCapture(e.pointerId); } catch { /* 무시 */ } aim(e); };
    area.onpointermove = (e) => { if (e.buttons || e.pointerType !== 'mouse') aim(e); };
    T().setKey((e) => {
      if (e.key === 'ArrowLeft') keyDir = -1; else if (e.key === 'ArrowRight') keyDir = 1;
      else if (e.key === ' ') { e.preventDefault(); setPause(!paused); return; } else return;
      e.preventDefault(); $('#cHelp')?.remove();
    });
    const up = (e) => { if ((e.key === 'ArrowLeft' && keyDir < 0) || (e.key === 'ArrowRight' && keyDir > 0)) keyDir = 0; };
    document.addEventListener('keyup', up); onStop(() => document.removeEventListener('keyup', up));

    function setPause(p) {
      if (over) return;
      paused = p; last = performance.now();
      $('#cPause').textContent = p ? '▶' : '⏸';
      area.classList.toggle('paused', p);
      if (p) msg('⏸ 잠깐 멈춤 — ▶ 를 누르면 계속해요', true);
    }
    $('#cPause').onclick = () => setPause(!paused);
    helpPause = setPause;
    const onVis = () => { if (document.hidden) setPause(true); };
    document.addEventListener('visibilitychange', onVis); onStop(() => document.removeEventListener('visibilitychange', onVis));

    function end() {
      over = true;
      later(() => showResult('catch', {
        big: `${score.toLocaleString()}점`,
        sub: `영단어 ${gotWords}/${TOTAL}개 · 과일 ${gotFruit}개 · 못 먹는 것 ${gotJunk}개`,
        score, missed,
        again: () => playCatch(),
        againMissed: null,
      }), 500);
    }
    hud();
  }

  // =========================================================
  // G-03 스피드 O/X 퀴즈
  // =========================================================
  function playOX() {
    stop(); setTheme();
    const P = pool();
    const total = ({ e: 90, m: 60, h: 60 }[S.level]) + ({ easy: 20, normal: 0, hard: -15 }[S.diff]);
    const t0 = Date.now();
    let right = 0; let tries = 0; let combo = 0; let bestCombo = 0; let locked = false; let over = false;
    const missed = [];
    let q;

    function newQ() {
      const w = pick(P);
      const truth = Math.random() < 0.5;
      const other = truth ? w : distractors(w, 1, P)[0] || w;
      q = { w, truth: truth || other === w, shown: short(other) };
      drawQ();
    }
    function drawQ() {
      app().querySelector('#oxWord').textContent = q.w.word;
      app().querySelector('#oxMean').textContent = q.shown;
      app().querySelector('#oxCard').className = 'ox-card';
    }
    app().innerHTML = `
      ${topBar('⭕ 스피드 O/X', `<span id="oxTime">⏱ ${total}초</span><span id="oxRight">맞힌 수 0</span><span id="oxCombo"></span>`)}
      <div class="progress game-progress"><i id="oxBar" style="width:100%"></i></div>
      <div class="stage">
        <article class="card ox-card" id="oxCard">
          <div class="word-big" id="oxWord"></div>
          <div class="ox-eq">=</div>
          <div class="meaning ox-mean" id="oxMean"></div>
          <div class="ox-answer" id="oxAns"></div>
        </article>
        <div class="ox-buttons">
          <button class="ox-btn o" data-a="1"><span>⭕</span>맞다<small>← 키</small></button>
          <button class="ox-btn x" data-a="0"><span>❌</span>틀리다<small>→ 키</small></button>
        </div>
      </div>`;
    bindQuit();
    const $ = (s) => app().querySelector(s);
    function answer(a) {
      if (locked || over) return;
      tries++;
      const ok = (a === 1) === q.truth;
      const card = $('#oxCard');
      if (ok) {
        right++; combo++; bestCombo = Math.max(bestCombo, combo);
        sfx(combo % 5 === 0 ? 'combo' : 'ok');
        card.className = 'ox-card right';
        later(newQ, 250);
      } else {
        combo = 0; missed.push(q.w); locked = true; sfx('bad');
        card.className = 'ox-card wrong';
        $('#oxAns').innerHTML = `정답: <span class="en">${esc(q.w.word)}</span> = ${esc(short(q.w))}`;
        sayAfter(q.w);
        later(() => { locked = false; $('#oxAns').textContent = ''; newQ(); }, 1800);
      }
      $('#oxRight').textContent = `맞힌 수 ${right}`;
      $('#oxCombo').textContent = combo >= 3 ? `🔥 콤보 ${combo}` : '';
    }
    app().querySelectorAll('.ox-btn').forEach((b) => (b.onpointerdown = (e) => { e.preventDefault(); answer(+b.dataset.a); }));
    T().setKey((e) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'o') answer(1);
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'x') answer(0);
    });
    every(() => {
      const left = Math.max(0, total - (Date.now() - t0) / 1000);
      $('#oxTime').textContent = `⏱ ${Math.ceil(left)}초`;
      $('#oxBar').style.width = `${(left / total) * 100}%`;
      $('#oxTime').classList.toggle('hurry', left <= 10);
      if (left <= 0 && !over) {
        over = true;
        showResult('ox', {
          big: `${right}개`,
          sub: `${tries}문제 중 ${right}개 · 최고 콤보 ${bestCombo}`,
          score: right, missed,
          again: () => playOX(),
          againMissed: null,
        });
      }
    }, 100);
    newQ();
  }

  // =========================================================
  // G-04 쌍둥이 대결
  // =========================================================
  function battleSetup() {
    stop(); setTheme();
    app().innerHTML = `
      ${topBar('⚔️ 쌍둥이 대결')}
      <div class="stage"><article class="card battle-setup">
        <p class="q-title">태블릿을 책상에 눕혀 놓고 마주 앉아요. 같은 문제를 먼저 맞히면 1점!</p>
        <div class="names">
          <label class="p1">🔴 <input id="n1" value="${esc(S.names[0])}" maxlength="8" aria-label="첫째 이름"></label>
          <span class="vs">VS</span>
          <label class="p2">🔵 <input id="n2" value="${esc(S.names[1])}" maxlength="8" aria-label="둘째 이름"></label>
        </div>
        <p class="pool-count">${esc(T().data[S.level].name)} · ${esc(rangeLabel())} · 10문제</p>
        <div class="done-actions"><button class="btn primary" id="bStart">대결 시작 ▶</button></div>
      </article></div>`;
    bindQuit(false);
    app().querySelector('#bStart').onclick = () => {
      S.names = [app().querySelector('#n1').value.trim() || '1P', app().querySelector('#n2').value.trim() || '2P'];
      save(); playBattle();
    };
  }
  function playBattle(list) {
    stop(); setTheme();
    const P = pool();
    const qs = (list || T().shuffle(P)).slice(0, 10);
    while (qs.length < 10 && P.length) qs.push(pick(P));
    const score = [0, 0];
    const missed = [];
    let n = 0; let q; let locked; let done;

    app().innerHTML = `
      <div class="battle" id="bWrap">
        ${[1, 0].map((p) => `
          <section class="half p${p} ${p === 1 ? 'top' : ''}" data-p="${p}">
            <div class="half-head"><span class="pname">${p === 0 ? '🔴' : '🔵'} ${esc(S.names[p])}</span><span class="pscore" id="s${p}">0점</span></div>
            <div class="half-prompt" id="pr${p}"></div>
            <div class="half-choices" id="ch${p}"></div>
            <div class="half-msg" id="m${p}"></div>
          </section>
          ${p === 1 ? `<div class="battle-mid"><button class="close-x" id="gQuit" aria-label="그만하기">✕</button><span id="bCount">1 / 10</span><button class="icon-btn" id="bSay" aria-label="듣기">🔊</button><button class="btn ghost small help-btn" id="gHelp" aria-label="조작 방법">ⓘ</button></div>` : ''}`).join('')}
      </div>`;
    bindQuit(); fullScreen();
    const $ = (s) => app().querySelector(s);
    const fit = () => { const wrap = $('#bWrap'); if (wrap) wrap.style.height = `${window.innerHeight - wrap.getBoundingClientRect().top - 8}px`; };
    fit(); window.addEventListener('resize', fit); onStop(() => window.removeEventListener('resize', fit));
    $('#bSay').onclick = () => q && say(q.w);

    function ask() {
      if (n >= qs.length) return finish();
      const w = qs[n];
      const en2ko = n % 2 === 0;
      const opts = [w, ...distractors(w, 3, P)];
      q = { w, en2ko };
      locked = [false, false]; done = false;
      $('#bCount').textContent = `${n + 1} / ${qs.length}`;
      [0, 1].forEach((p) => {
        $(`#pr${p}`).innerHTML = en2ko ? `<span class="word-big">${esc(w.word)}</span>` : `<span class="meaning">${esc(short(w))}</span>`;
        $(`#m${p}`).textContent = en2ko ? '뜻을 골라요' : '영단어를 골라요';
        const half = app().querySelector(`.half.p${p}`); half.classList.remove('locked', 'won', 'lost');
        // 서로 보기 순서를 다르게 섞어 상대 화면을 따라 누르지 못하게
        $(`#ch${p}`).innerHTML = T().shuffle(opts).map((o) => `<button class="choice ${en2ko ? '' : 'en-choice'}" data-ok="${o === w ? 1 : 0}">${esc(en2ko ? short(o) : o.word)}</button>`).join('');
        app().querySelectorAll(`#ch${p} .choice`).forEach((b) => (b.onpointerdown = (e) => { e.preventDefault(); choose(p, b); }));
      });
    }
    function reveal() {
      [0, 1].forEach((p) => app().querySelectorAll(`#ch${p} .choice`).forEach((b) => { b.disabled = true; if (b.dataset.ok === '1') b.classList.add('right'); }));
    }
    function choose(p, b) {
      if (done || locked[p]) return;
      if (b.dataset.ok === '1') {
        done = true; score[p]++;
        b.classList.add('right');
        $(`#s${p}`).textContent = `${score[p]}점`;
        app().querySelector(`.half.p${p}`).classList.add('won');
        app().querySelector(`.half.p${1 - p}`).classList.add('lost');
        $(`#m${p}`).textContent = '⭐ 먼저 맞혔어요! +1';
        $(`#m${1 - p}`).textContent = '상대가 먼저 맞혔어요';
        reveal(); sfx('ok'); sayAfter(q.w);
        n++; later(ask, 1500);
      } else {
        locked[p] = true; sfx('bad');
        b.classList.add('wrong');
        app().querySelector(`.half.p${p}`).classList.add('locked');
        $(`#m${p}`).textContent = '✗ 이번 문제는 기회 끝';
        if (locked[0] && locked[1]) {
          done = true; missed.push(q.w); reveal(); say(q.w);
          [0, 1].forEach((x) => { $(`#m${x}`).innerHTML = `정답: <span class="en">${esc(q.w.word)}</span> = ${esc(short(q.w))}`; });
          n++; later(ask, 2000);
        }
      }
    }
    function finish() {
      const [a, b] = score;
      const winner = a === b ? '🤝 무승부!' : `🏆 ${esc(S.names[a > b ? 0 : 1])} 승리!`;
      showResult('battle', {
        big: winner,
        sub: `🔴 ${esc(S.names[0])} ${a}점 : ${b}점 ${esc(S.names[1])} 🔵`,
        score: null, missed,
        again: () => playBattle(),
        againMissed: (ws) => playBattle(ws),
      });
    }
    ask();
  }

  // ---------- 공개 ----------
  window.TWGames = {
    stop,
    render(sub) {
      stop();
      T().setKey(null);
      if (!T().data[S.level]) S.level = 'e';
      if (sub && pool().length < 4) { T().toast('단어 범위를 먼저 골라 주세요'); return T().go('#/game'); }
      ({ blocks: playBlocks, rain: playRain, catch: playCatch, ox: playOX, battle: battleSetup }[sub] || renderMenu)();
    },
    // 학습 완료 화면에서 "오늘 단어로 게임"
    useDay(code, day) { S.level = code; S.mode = 'range'; S.from = day; S.to = day; save(); },
  };
})();
