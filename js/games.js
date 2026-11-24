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
    drive: { icon: '🚗', name: '단어 드라이브', desc: '뜻에 맞는 단어를 먹으며 달리기', unit: '점' },
    run: { icon: '🏃', name: '3D 단어 런', desc: '달리면서 맞는 뜻의 문으로', unit: '점' },
    ox: { icon: '⭕', name: '스피드 O/X', desc: '단어와 뜻이 맞는지 빠르게', unit: '개' },
    battle: { icon: '⚔️', name: '쌍둥이 대결', desc: '마주 앉아 먼저 맞히기', unit: '' },
  };
  // ⓘ 버튼으로 보는 조작 방법
  const HELP = {
    blocks: ['뜻을 보고 소리를 들은 뒤, 알파벳 블록을 단어 순서대로 눌러요.', 'PC는 키보드로 글자를 쳐도 돼요. 스페이스 = 다시 듣기', '💡 힌트는 다음 글자 블록을 반짝여 줘요.', '힌트를 쓰거나 "모르겠어요"를 누른 단어는 놓친 단어로 남아요.'],
    rain: ['위에서 한글 뜻 카드가 떨어져요.', '바닥에 닿기 전에 그 영단어를 입력칸에 써요. 맞으면 Enter 없이 바로 터져요.', '✍️ 펜으로 쓰기를 켜면 손글씨로 쓸 수 있고, 단어가 조금 천천히 떨어져요.', '카드가 바닥에 3개 닿으면 끝나요. ⏸ 로 잠깐 멈출 수 있어요.'],
    run: ['형이나 동생을 골라 2차선 길을 달려요. 위에 영어 단어가 나오고 발음도 들려줘요.', '앞에서 뜻이 적힌 문 두 개가 다가와요. 맞는 뜻의 문 쪽 차선으로 옮겨서 지나가세요!', '태블릿: 화면 왼쪽·오른쪽을 누르거나 좌우로 밀기. PC: ← → 키', '맞히면 +10점, 3번 연속 ×2, 6번 연속 ×3. 💰 코인은 +2점이에요.', '틀리면 ❤️ 하나를 잃어요. 3개를 다 잃으면 끝! 오래 달릴수록 빨라져요.', '3D 그림이라 인터넷이 필요하고, 오래된 기기에서는 안 될 수도 있어요.'],
    drive: ['화면 위 🎯 뜻을 보고, 그 뜻의 영어 단어가 있는 도로로 차를 옮겨 먹어요. 맞으면 +10점!', '태블릿: 화면 왼쪽·오른쪽을 누르거나 좌우로 밀어서 차선을 바꿔요. PC: ← → 키', '틀린 단어 −10 연료, 💀 −20 연료, ⛽ +25 연료. 연료는 계속 조금씩 닳고, 0이 되면 끝나요.', '3번 연속 맞히면 점수 ×2, 6번 연속이면 ×3. 🛡 방패는 한 번 막아 줘요.', '맞는 단어 5개를 먹으면 🚀 부스터! 누르면(스페이스) 3초 동안 아주 빠르고, 무적에 점수 2배예요.', '시간이 갈수록 빨라지고, 30초마다 낮 → 노을 → 밤 → 비로 풍경이 바뀌어요.'],
    catch: ['화면을 누르거나 손가락으로 끌면 아이가 그쪽으로 달려가요.', 'PC는 ← → 키로 움직이고, 스페이스로 잠깐 멈춰요.', '영단어 +10점 · 과일 🍎🍌🍇 +5점', '못 먹는 것 💀💣🔨🪨🧦👟 등은 피해요. 받으면 −5점!', '영단어를 받으면 뜻을 보여 주고 발음을 들려줘요. 영단어가 다 떨어지면 끝나요.'],
    ox: ['영단어와 뜻이 짝으로 나와요.', '맞는 짝이면 ⭕, 틀린 짝이면 ❌ 를 눌러요.', 'PC는 ← 또는 O 키 = ⭕, → 또는 X 키 = ❌', '틀리면 정답을 보여 주고 2초 쉬어요. 시간이 끝날 때까지 최대한 많이 맞혀요.'],
    battle: ['태블릿을 책상에 눕혀 놓고 마주 앉아요. 위쪽 화면은 맞은편 사람 쪽으로 뒤집혀 있어요.', '같은 문제를 먼저 맞히면 1점!', '틀리면 그 문제는 기회가 끝나요. 둘 다 틀리면 정답을 보여 줘요.', '10문제를 풀고 점수가 많은 사람이 이겨요.'],
  };
  const DIFFS = { easy: '쉬움', normal: '보통', hard: '어려움' };

  // ---------- 설정 (기기에 기억) ----------
  const S = (() => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { /* 저장 불가 환경 */ }
    return { level: 'e', mode: 'today', from: 1, to: 10, topic: '', diff: 'normal', pen: false, penGuide: false, names: ['형', '동생'], best: {}, ...s };
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 불가 환경 */ } };

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
    const dlg = window.makeDialog('gameHelp', 'voice-dlg game-help');
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
  const sfx = (k) => { const s = T().sfx; if (s) s[k](); };
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
      app().querySelectorAll('.block').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(+b.dataset.k); }));
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
    const BASE = { e: 26, m: 32, h: 38, t: 38, a: 24, b: 26 }[S.level];               // 처음 낙하 속도 (px/초)
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
      const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000)); last = ts;
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
  const JUNK = ['💀', '💣', '🔨', '🪨', '🧦', '👟', '🔩', '🧱', '🪣', '🧽'];
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
      const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000)); last = ts;
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
    const rmHelp = () => { const h = $('#cHelp'); if (h) h.remove(); };
    const aim = (e) => { const a = area.getBoundingClientRect(); targetX = e.clientX - a.left - kid.offsetWidth / 2; rmHelp(); };
    area.addEventListener('pointerdown', (e) => { e.preventDefault(); try { area.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ } aim(e); });
    area.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType !== 'mouse') { e.preventDefault(); aim(e); } });
    T().setKey((e) => {
      if (e.key === 'ArrowLeft') keyDir = -1; else if (e.key === 'ArrowRight') keyDir = 1;
      else if (e.key === ' ') { e.preventDefault(); setPause(!paused); return; } else return;
      e.preventDefault(); rmHelp();
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
  // G-06 단어 드라이브 — 도로 3개, 뜻에 맞는 영단어 먹기 · ⛽ 연료 · 💀 해골 · 🛡 방패 · 🚀 부스터
  // =========================================================
  function playDrive() {
    stop(); setTheme();
    const P = pool();
    const D = {
      easy: { speed: 130, drain: 0.7 },
      normal: { speed: 160, drain: 1 },
      hard: { speed: 190, drain: 1.5 },
    }[S.diff];
    const SCENES = [['day', '☀️ 낮'], ['sunset', '🌇 노을'], ['night', '🌙 밤'], ['rain', '🌧 비']];
    let queue = T().shuffle(P);
    let score = 0; let combo = 0; let bestCombo = 0; let gotWords = 0;
    let fuel = 100; let gauge = 0; let shield = false; let boostLeft = 0;
    let km = 0; let elapsed = 0; let lane = 1; let target = null;
    let items = []; let rowId = 0; let wordRowLive = false;
    let wordIn = 1.2; let extraIn = 2.2; let roadOffset = 0;
    let paused = false; let over = false; let raf; let last = performance.now();
    const missed = [];

    app().innerHTML = `
      <div class="drive-wrap" id="dWrap">
        ${topBar('🚗 단어 드라이브', `<span id="dScore">0점</span><span id="dCombo"></span><span id="dKm">0.0km</span><button class="btn ghost small" id="dPause">⏸</button>`)}
        <div class="drive-hud">
          <div class="drive-target">🎯 <span id="dTarget">준비…</span></div>
          <div class="drive-gauges">
            <div class="gauge fuel"><span>⛽</span><div class="bar"><i id="dFuel"></i></div></div>
            <div class="gauge boost"><span>🚀</span><div class="bar"><i id="dGauge"></i></div></div>
          </div>
        </div>
        <div class="drive-road day" id="dRoad">
          <div class="roadside left"></div><div class="roadside right"></div>
          <div class="asphalt"><div class="lane-line l1"></div><div class="lane-line l2"></div></div>
          <div class="drive-scene" id="dScene">☀️ 낮</div>
          <div class="drive-msg" id="dMsg"></div>
          <div class="drive-car" id="dCar"><svg class="car" viewBox="0 0 60 100" aria-hidden="true">
            <rect x="2" y="16" width="9" height="18" rx="3" fill="#1f2937"/><rect x="49" y="16" width="9" height="18" rx="3" fill="#1f2937"/>
            <rect x="2" y="66" width="9" height="18" rx="3" fill="#1f2937"/><rect x="49" y="66" width="9" height="18" rx="3" fill="#1f2937"/>
            <rect x="7" y="4" width="46" height="92" rx="16" fill="#ef4444"/>
            <rect x="7" y="4" width="46" height="92" rx="16" fill="none" stroke="#b91c1c" stroke-width="2"/>
            <path d="M14 30 Q30 22 46 30 L43 42 Q30 38 17 42 Z" fill="#bfdbfe"/>
            <rect x="16" y="44" width="28" height="22" rx="5" fill="#dc2626"/>
            <path d="M17 68 Q30 72 43 68 L45 78 Q30 84 15 78 Z" fill="#93c5fd"/>
            <rect x="12" y="6" width="10" height="5" rx="2" fill="#fef08a"/><rect x="38" y="6" width="10" height="5" rx="2" fill="#fef08a"/>
            <rect x="12" y="89" width="9" height="4" rx="2" fill="#7f1d1d"/><rect x="39" y="89" width="9" height="4" rx="2" fill="#7f1d1d"/>
          </svg></div>
          <button class="drive-boost" id="dBoost" disabled aria-label="부스터">🚀</button>
        </div>
      </div>`;
    bindQuit(); fullScreen();
    const $ = (s) => app().querySelector(s);
    const wrap = $('#dWrap'); const road = $('#dRoad'); const car = $('#dCar');
    const fit = () => { wrap.style.height = `${Math.max(380, window.innerHeight - wrap.getBoundingClientRect().top - 8)}px`; };
    fit(); window.addEventListener('resize', fit); onStop(() => window.removeEventListener('resize', fit));

    const SIDE = 0.14;
    const laneW = () => (road.clientWidth * (1 - SIDE * 2)) / 3;
    const laneX = (l) => road.clientWidth * SIDE + laneW() * (l + 0.5);
    const placeCar = () => {
      const w = Math.max(40, Math.min(72, laneW() * 0.5));
      car.style.width = `${w}px`; car.style.height = `${w * 1.65}px`;
      car.style.transform = `translateX(${laneX(lane) - w / 2}px)`;
    };
    placeCar();
    const speedMul = () => Math.min(2, 1 + Math.floor(elapsed / 20) * 0.08);
    const speed = () => D.speed * speedMul() * (boostLeft > 0 ? 1.8 : 1);
    const multiplier = () => (combo >= 6 ? 3 : combo >= 3 ? 2 : 1) * (boostLeft > 0 ? 2 : 1);

    let msgT;
    function msg(html, ok) {
      const m = $('#dMsg'); if (!m) return;
      m.innerHTML = html; m.className = `drive-msg show ${ok ? 'ok' : 'bad'}`;
      clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove('show'), 1300);
    }
    onStop(() => clearTimeout(msgT));
    function hud() {
      $('#dScore').textContent = `${score.toLocaleString()}점`;
      $('#dCombo').textContent = combo >= 3 ? `🔥×${multiplier() / (boostLeft > 0 ? 2 : 1)} 콤보 ${combo}` : '';
      $('#dKm').textContent = `${km.toFixed(1)}km`;
      const f = $('#dFuel'); f.style.width = `${Math.max(0, fuel)}%`; f.className = fuel < 25 ? 'low' : '';
      $('#dGauge').style.width = `${(gauge / 5) * 100}%`;
      const b = $('#dBoost'); b.disabled = gauge < 5 || boostLeft > 0; b.classList.toggle('ready', gauge >= 5 && boostLeft <= 0);
      car.classList.toggle('shield', shield);
      road.classList.toggle('boosting', boostLeft > 0);
    }
    function nextTarget() {
      if (!queue.length) queue = T().shuffle(P);
      target = queue.shift();
      $('#dTarget').textContent = short(target);
    }
    function addItem(kind, l, y, extra) {
      const el = document.createElement('div');
      el.className = `drive-item ${kind}`;
      if (kind === 'word') { el.textContent = extra.w.word; el.classList.add('en'); } else el.textContent = { fuel: '⛽', skull: '💀', shield: '🛡' }[kind];
      road.appendChild(el);
      const it = { kind, lane: l, y, el, ...extra };
      el.style.transform = `translate(${laneX(l) - el.offsetWidth / 2}px, ${y}px)`;
      items.push(it);
      return it;
    }
    function spawnWords() {
      nextTarget();
      const n = Math.random() < 0.5 ? 2 : 3;
      const lanes = T().shuffle([0, 1, 2]).slice(0, n);
      const wrong = distractors(target, n - 1, P);
      const id = ++rowId;
      lanes.forEach((l, k) => addItem('word', l, -50, { w: k === 0 ? target : wrong[k - 1], ok: k === 0, row: id }));
      wordRowLive = true;
    }
    function spawnExtra() {
      // 단어 줄과 겹치지 않게 위쪽이 비어 있을 때만
      if (items.some((it) => it.y < 60)) return;
      const r = Math.random();
      const kind = r < 0.42 ? 'fuel' : r < 0.85 ? 'skull' : 'shield';
      addItem(kind, Math.floor(Math.random() * 3), -50, {});
    }
    function removeRow(id) {
      items.filter((it) => it.row === id).forEach((it) => { it.el.classList.add('gone'); later(() => it.el.remove(), 250); });
      items = items.filter((it) => it.row !== id);
      wordRowLive = false; wordIn = 0.9;
    }
    function hit(it) {
      const protectedNow = boostLeft > 0;
      if (it.kind === 'word') {
        if (it.ok) {
          combo++; bestCombo = Math.max(bestCombo, combo); gotWords++;
          score += 10 * multiplier(); gauge = Math.min(5, gauge + 1);
          sfx(combo % 5 === 0 ? 'combo' : 'ok'); sayAfter(it.w);
          msg(`⭕ <span class="en">${esc(it.w.word)}</span> = ${esc(short(it.w))}`, true);
        } else if (protectedNow) {
          msg('🚀 부스터로 통과!', true);
        } else if (shield) {
          shield = false; sfx('bad'); msg('🛡 방패가 막아 줬어요', true);
          missed.push(target); combo = 0;
        } else {
          fuel -= 10; combo = 0; sfx('bad'); missed.push(target);
          msg(`❌ 정답은 <span class="en">${esc(target.word)}</span>`, false);
          road.classList.remove('hit'); void road.offsetWidth; road.classList.add('hit');
        }
        removeRow(it.row);
      } else {
        it.el.remove(); items = items.filter((x) => x !== it);
        if (it.kind === 'fuel') { fuel = Math.min(100, fuel + 25); sfx('ok'); msg('⛽ 연료 +25', true); }
        else if (it.kind === 'shield') { shield = true; sfx('ok'); msg('🛡 방패를 얻었어요', true); }
        else if (protectedNow) msg('🚀 해골도 문제없어요', true);
        else if (shield) { shield = false; sfx('bad'); msg('🛡 방패가 막아 줬어요', true); }
        else {
          fuel -= 20; combo = 0; sfx('bad'); msg('💀 연료 −20', false);
          road.classList.remove('hit'); void road.offsetWidth; road.classList.add('hit');
        }
      }
      hud();
    }
    function loop(ts) {
      const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000)); last = ts;
      if (!paused && !over) {
        elapsed += dt;
        if (boostLeft > 0) boostLeft = Math.max(0, boostLeft - dt);
        fuel -= D.drain * dt;
        km += speed() * dt / 900;
        // 풍경: 30초마다
        const scene = SCENES[Math.floor(elapsed / 30) % SCENES.length];
        if (!road.classList.contains(scene[0])) {
          SCENES.forEach(([c]) => road.classList.remove(c)); road.classList.add(scene[0]);
          const s = $('#dScene'); s.textContent = scene[1]; s.classList.remove('show'); void s.offsetWidth; s.classList.add('show');
        }
        // 차선 무늬
        roadOffset = (roadOffset + speed() * dt) % 320;
        road.style.setProperty('--road-y', `${roadOffset % 80}px`);
        road.style.setProperty('--side-y', `${roadOffset % 160}px`);
        // 떨어뜨리기
        if (!wordRowLive) { wordIn -= dt; if (wordIn <= 0) spawnWords(); }
        extraIn -= dt;
        if (extraIn <= 0) { spawnExtra(); extraIn = 1.3 + Math.random() * 1.6; }
        // 움직이기·부딪힘
        const carTop = car.offsetTop + 6; const carBottom = car.offsetTop + car.offsetHeight - 6;
        for (const it of [...items]) {
          if (!items.includes(it)) continue;
          it.y += speed() * dt;
          it.el.style.transform = `translate(${laneX(it.lane) - it.el.offsetWidth / 2}px, ${it.y}px)`;
          const mid = it.y + it.el.offsetHeight / 2;
          if (it.lane === lane && mid >= carTop && mid <= carBottom) { hit(it); continue; }
          if (it.y > road.clientHeight) {
            if (it.kind === 'word') {
              if (it.ok) { combo = 0; missed.push(target); msg(`놓쳤어요: <span class="en">${esc(target.word)}</span>`, false); }
              removeRow(it.row);
            } else { it.el.remove(); items = items.filter((x) => x !== it); }
          }
        }
        hud();
        if (fuel <= 0) { end(); return; }
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    onStop(() => cancelAnimationFrame(raf));

    // 조작: ← → / 화면 왼쪽·오른쪽 누르기 / 좌우로 밀기 / 🚀 · 스페이스
    const move = (d) => { if (paused || over) return; lane = Math.max(0, Math.min(2, lane + d)); placeCar(); };
    function boost() {
      if (paused || over || gauge < 5 || boostLeft > 0) return;
      gauge = 0; boostLeft = 3; sfx('combo'); msg('🚀 부스터! 3초 동안 무적 · 점수 2배', true); hud();
    }
    let x0 = null;
    road.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#dBoost')) return;
      e.preventDefault(); x0 = e.clientX;
    });
    road.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 30) move(dx < 0 ? -1 : 1);
      else { const r = road.getBoundingClientRect(); move(e.clientX - r.left < laneX(lane) ? -1 : 1); }
    });
    $('#dBoost').addEventListener('pointerdown', (e) => { e.preventDefault(); boost(); });
    T().setKey((e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
      else if (e.key === ' ') { e.preventDefault(); boost(); }
    });
    window.addEventListener('resize', placeCar); onStop(() => window.removeEventListener('resize', placeCar));

    function setPause(p) {
      if (over) return;
      paused = p; last = performance.now();
      $('#dPause').textContent = p ? '▶' : '⏸';
      road.classList.toggle('paused', p);
      if (p) msg('⏸ 잠깐 멈춤 — ▶ 를 누르면 계속해요', true);
    }
    $('#dPause').onclick = () => setPause(!paused);
    helpPause = setPause;
    const onVis = () => { if (document.hidden) setPause(true); };
    document.addEventListener('visibilitychange', onVis); onStop(() => document.removeEventListener('visibilitychange', onVis));

    function end() {
      over = true;
      const kmKey = `${bestKey('drive')}-km`;
      const kmBest = !(S.best[kmKey] >= km);
      if (kmBest) { S.best[kmKey] = Math.round(km * 10) / 10; save(); }
      later(() => showResult('drive', {
        big: `${score.toLocaleString()}점`,
        sub: `🏁 ${km.toFixed(1)}km${kmBest ? ' (최고 거리!)' : ''} · 맞힌 단어 ${gotWords}개 · 최고 콤보 ${bestCombo}`,
        score, missed,
        again: () => playDrive(),
        againMissed: null,
      }), 500);
    }
    hud();
  }

  // =========================================================
  // G-07 🏃 3D 단어 런 — three.js r128 (이 게임에 들어올 때만 불러옴)
  // =========================================================
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  let threeLoading = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threeLoading) return threeLoading;
    threeLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = THREE_URL; s.async = true;
      s.onload = () => (window.THREE ? resolve(window.THREE) : reject(new Error('no THREE')));
      s.onerror = () => { threeLoading = null; reject(new Error('load failed')); };
      document.head.appendChild(s);
    });
    return threeLoading;
  }
  function hasWebGL() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  }

  function runSetup() {
    stop(); setTheme();
    app().innerHTML = `
      ${topBar('🏃 단어 런')}
      <article class="card run-setup">
        <p>위에 나온 <b>영어 단어</b>의 뜻이 적힌 문으로 달려가요. 틀리면 ❤️ 하나를 잃어요!</p>
        <p class="run-pick-title">누가 달릴까요?</p>
        <div class="run-pick">
          <button class="run-who p0" data-who="0"><span class="dot"></span>${esc(S.names[0])}<small>빨간 옷</small></button>
          <button class="run-who p1" data-who="1"><span class="dot"></span>${esc(S.names[1])}<small>파란 옷</small></button>
        </div>
        <p class="run-note" id="runNote"></p>
      </article>`;
    bindQuit(false);
    const note = app().querySelector('#runNote');
    if (!hasWebGL()) { note.textContent = '이 기기·브라우저에서는 3D 게임을 할 수 없어요. 다른 게임을 즐겨 주세요!'; app().querySelectorAll('.run-who').forEach((b) => (b.disabled = true)); return; }
    app().querySelectorAll('.run-who').forEach((b) => (b.onclick = () => {
      S.runner = +b.dataset.who; save();
      note.textContent = '3D 준비 중…';
      app().querySelectorAll('.run-who').forEach((x) => (x.disabled = true));
      loadThree().then(() => playRun()).catch(() => {
        note.textContent = '3D 프로그램을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.';
        app().querySelectorAll('.run-who').forEach((x) => (x.disabled = false));
      });
    }));
  }

  function playRun() {
    stop(); setTheme();
    const THREE = window.THREE;
    const P = pool();
    const BASE = { easy: 9, normal: 11, hard: 13 }[S.diff];
    const LANE = 1.3;               // 차선 중심 x (왼쪽 -1.3, 오른쪽 +1.3)
    const SHIRT = [0xe5484d, 0x3b82f6][S.runner || 0];
    let queue = T().shuffle(P);
    let hearts = 3; let score = 0; let combo = 0; let bestCombo = 0; let right = 0; let coins = 0; let dist = 0;
    let lane = 0; let runnerX = -LANE; let elapsed = 0; let target = null;
    let gate = null; let nextQIn = 1.0; let coinIn = 1.5;
    let paused = false; let over = false; let raf; let last = performance.now();
    const missed = [];

    app().innerHTML = `
      <div class="run-wrap" id="rnWrap">
        ${topBar('🏃 단어 런', `<span id="rnHearts">❤️❤️❤️</span><span id="rnScore">0점</span><span id="rnCoins">💰 0</span><span id="rnCombo"></span><button class="btn ghost small" id="rnPause">⏸</button>`)}
        <div class="run-stage" id="rnStage">
          <div class="run-word" id="rnWord"><span class="en" id="rnEn">준비…</span><button class="icon-btn" id="rnSay" aria-label="듣기">🔊</button></div>
          <div class="run-msg" id="rnMsg"></div>
        </div>
      </div>`;
    bindQuit(); fullScreen();
    const $ = (s) => app().querySelector(s);
    const wrap = $('#rnWrap'); const stage = $('#rnStage');

    // ----- 3D 장면 -----
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    stage.insertBefore(renderer.domElement, stage.firstChild);
    const scene = new THREE.Scene();
    const SKY = 0x9fd6ff;
    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(SKY, 30, 75);
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.set(0, 4.2, 8.6);
    camera.lookAt(0, 1.2, -8);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6aa35a, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 0.7); sun.position.set(5, 10, 4); scene.add(sun);

    const mat = (color) => new THREE.MeshLambertMaterial({ color });
    const box = (w, h, d, color) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    // 땅·길
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat(0x6fbf5a)); grass.rotation.x = -Math.PI / 2; scene.add(grass);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 200), mat(0x5b6472)); road.rotation.x = -Math.PI / 2; road.position.y = 0.01; scene.add(road);
    [-2.8, 2.8].forEach((x) => { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 200), mat(0xfacc15)); e.rotation.x = -Math.PI / 2; e.position.set(x, 0.02, 0); scene.add(e); });
    // 가운데 점선 (흘러가는 것)
    const dashes = [];
    for (let i = 0; i < 16; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.6), mat(0xffffff)); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.03, -i * 5); scene.add(d); dashes.push(d); }
    // 길가 나무
    const trees = [];
    for (let i = 0; i < 24; i++) {
      const t = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1, 6), mat(0x8b5a2b)); trunk.position.y = 0.5; t.add(trunk);
      const leaf = new THREE.Mesh(i % 3 ? new THREE.ConeGeometry(0.9, 2, 7) : new THREE.SphereGeometry(0.9, 8, 6), mat(i % 2 ? 0x2e7d32 : 0x43a047)); leaf.position.y = 1.9; t.add(leaf);
      t.position.set((i % 2 ? 1 : -1) * (4 + Math.random() * 4), 0, -i * 3.5);
      scene.add(t); trees.push(t);
    }
    // 구름 (멀리, 고정)
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Group();
      for (let k = 0; k < 3; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(1.2 + Math.random(), 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); p.position.set(k * 1.4, Math.random() * 0.5, 0); c.add(p); }
      c.position.set(-20 + i * 8, 12 + Math.random() * 4, -70 - Math.random() * 20); scene.add(c);
    }
    // 달리는 아이 (블록)
    const runner = new THREE.Group();
    const SKIN = 0xf2c9a0;
    const body = box(0.7, 0.8, 0.4, SHIRT); body.position.y = 1.35; runner.add(body);
    const head = box(0.55, 0.55, 0.55, SKIN); head.position.y = 2.05; runner.add(head);
    const hair = box(0.58, 0.2, 0.58, 0x3b2a1a); hair.position.y = 2.33; runner.add(hair);
    const limb = (w, h, color, x, y) => { const g = new THREE.Group(); const m = box(w, h, w, color); m.position.y = -h / 2; g.add(m); g.position.set(x, y, 0); runner.add(g); return g; };
    const armL = limb(0.2, 0.7, SKIN, -0.47, 1.7); const armR = limb(0.2, 0.7, SKIN, 0.47, 1.7);
    const legL = limb(0.26, 0.95, 0x1e3a8a, -0.18, 0.95); const legR = limb(0.26, 0.95, 0x1e3a8a, 0.18, 0.95);
    runner.position.set(runnerX, 0, 0);
    scene.add(runner);

    // 뜻 표지판 글자 (캔버스 그림 → 텍스처)
    function signTexture(text) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 256;
      const g = c.getContext('2d');
      const r = 36; g.fillStyle = '#ffffff'; g.strokeStyle = '#1f2937'; g.lineWidth = 12;
      g.beginPath(); g.moveTo(r, 6); g.arcTo(506, 6, 506, 250, r); g.arcTo(506, 250, 6, 250, r); g.arcTo(6, 250, 6, 6, r); g.arcTo(6, 6, 506, 6, r); g.closePath(); g.fill(); g.stroke();
      let t = text; let size = 92;
      g.fillStyle = '#111827'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const font = () => `bold ${size}px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`;
      g.font = font();
      while (g.measureText(t).width > 460 && size > 40) { size -= 6; g.font = font(); }
      while (g.measureText(t).width > 460 && t.length > 2) t = `${t.slice(0, -2)}…`;
      g.fillText(t, 256, 132);
      return new THREE.CanvasTexture(c);
    }
    function makeSign(text, x) {
      const g = new THREE.Group();
      const post = (px) => { const p = box(0.12, 2.6, 0.12, 0x6b7280); p.position.set(px, 1.3, 0); g.add(p); };
      post(-1.05); post(1.05);
      const tex = signTexture(text);
      const board = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.15), new THREE.MeshBasicMaterial({ map: tex }));
      board.position.set(0, 2.2, 0.07); g.add(board);
      g.position.set(x, 0, 0);
      g.userData.tex = tex;
      return g;
    }
    function spawnGate() {
      if (!queue.length) queue = T().shuffle(P);
      target = queue.shift();
      const wrong = distractors(target, 1, P)[0];
      const correctLane = Math.random() < 0.5 ? 0 : 1;
      const group = new THREE.Group();
      // 표지판에는 첫 번째 뜻만 크게 (두 뜻이 같아 보이면 전체 뜻)
      let a = short(target).split(',')[0].trim(); let b = short(wrong).split(',')[0].trim();
      if (a === b) { a = short(target); b = short(wrong); }
      [0, 1].forEach((l) => group.add(makeSign(l === correctLane ? a : b, l ? LANE : -LANE)));
      group.position.z = -55;
      scene.add(group);
      gate = { group, correctLane, done: false };
      $('#rnEn').textContent = target.word;
      $('#rnWord').classList.remove('pop'); void $('#rnWord').offsetWidth; $('#rnWord').classList.add('pop');
      say(target);
    }
    function disposeGroup(g) {
      scene.remove(g);
      g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    }
    // 코인
    const coinGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16);
    const coinMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0x6b4d00 });
    let coinList = [];
    function spawnCoins() {
      if (gate && gate.group.position.z < -40) return; // 문 바로 앞에는 두지 않기
      const l = Math.random() < 0.5 ? 0 : 1;
      for (let k = 0; k < 3; k++) {
        const m = new THREE.Mesh(coinGeo, coinMat); m.rotation.x = Math.PI / 2;
        m.position.set(l ? LANE : -LANE, 0.8, -50 - k * 2.2); scene.add(m); coinList.push({ m, lane: l });
      }
    }

    // 화면 크기
    const fit = () => {
      wrap.style.height = `${Math.max(380, window.innerHeight - wrap.getBoundingClientRect().top - 8)}px`;
      const w = stage.clientWidth; const h = stage.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    fit(); window.addEventListener('resize', fit); onStop(() => window.removeEventListener('resize', fit));

    let msgT;
    function msg(html, ok) {
      const m = $('#rnMsg'); if (!m) return;
      m.innerHTML = html; m.className = `run-msg show ${ok ? 'ok' : 'bad'}`;
      clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove('show'), 1500);
    }
    onStop(() => clearTimeout(msgT));
    const mult = () => (combo >= 6 ? 3 : combo >= 3 ? 2 : 1);
    function hud() {
      $('#rnHearts').textContent = '❤️'.repeat(Math.max(0, hearts)) + '🤍'.repeat(3 - Math.max(0, hearts));
      $('#rnScore').textContent = `${score.toLocaleString()}점`;
      $('#rnCoins').textContent = `💰 ${coins}`;
      $('#rnCombo').textContent = combo >= 3 ? `🔥×${mult()} 콤보 ${combo}` : '';
    }
    function judge() {
      gate.done = true;
      if (lane === gate.correctLane) {
        combo++; bestCombo = Math.max(bestCombo, combo); right++;
        score += 10 * mult();
        sfx(combo % 5 === 0 ? 'combo' : 'ok');
        msg(`⭕ <span class="en">${esc(target.word)}</span> = ${esc(short(target))}`, true);
      } else {
        hearts--; combo = 0; missed.push(target); sfx('bad');
        msg(`❌ <span class="en">${esc(target.word)}</span> = ${esc(short(target))}`, false);
        stage.classList.remove('hit'); void stage.offsetWidth; stage.classList.add('hit');
      }
      hud();
      if (hearts <= 0) end();
    }

    function loop(ts) {
      const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000)); last = ts;
      if (!paused && !over) {
        elapsed += dt;
        const speed = BASE * Math.min(2, 1 + Math.floor(elapsed / 15) * 0.08);
        const dz = speed * dt;
        dist += dz;
        // 흘러가는 것들
        dashes.forEach((d) => { d.position.z += dz; if (d.position.z > 6) d.position.z -= 80; });
        trees.forEach((t) => { t.position.z += dz; if (t.position.z > 8) { t.position.z -= 84; t.position.x = (t.position.x > 0 ? 1 : -1) * (4 + Math.random() * 4); } });
        // 문(표지판)
        if (!gate) { nextQIn -= dt; if (nextQIn <= 0) spawnGate(); }
        if (gate) {
          gate.group.position.z += dz;
          if (!gate.done && gate.group.position.z >= 0) judge();
          if (gate && gate.group.position.z > 9) { disposeGroup(gate.group); gate = null; nextQIn = 0.6; }
        }
        // 코인
        coinIn -= dt;
        if (coinIn <= 0) { spawnCoins(); coinIn = 2.5 + Math.random() * 2; }
        coinList = coinList.filter((c) => {
          c.m.position.z += dz; c.m.rotation.z += dt * 4;
          if (Math.abs(c.m.position.z) < 0.6 && c.lane === lane) { coins++; score += 2; scene.remove(c.m); hud(); return false; }
          if (c.m.position.z > 8) { scene.remove(c.m); return false; }
          return true;
        });
        // 달리기 동작
        const tx = lane ? LANE : -LANE;
        runnerX += (tx - runnerX) * Math.min(1, dt * 12);
        runner.position.x = runnerX;
        const sw = Math.sin(elapsed * speed * 1.1) * 0.8;
        armL.rotation.x = sw; armR.rotation.x = -sw; legL.rotation.x = -sw; legR.rotation.x = sw;
        runner.position.y = Math.abs(Math.sin(elapsed * speed * 1.1)) * 0.12;
        camera.position.x = runnerX * 0.35; camera.lookAt(runnerX * 0.2, 1.2, -8);
      }
      renderer.render(scene, camera);
      if (!over) raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    onStop(() => {
      cancelAnimationFrame(raf);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
      renderer.dispose();
    });

    // 조작
    const move = (to) => { if (!paused && !over) lane = to; };
    let x0 = null;
    stage.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; e.preventDefault(); x0 = e.clientX; });
    stage.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 30) move(dx < 0 ? 0 : 1);
      else { const r = stage.getBoundingClientRect(); move(e.clientX - r.left < r.width / 2 ? 0 : 1); }
    });
    T().setKey((e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(0); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    });
    $('#rnSay').onclick = () => { if (target) say(target); };

    function setPause(p) {
      if (over) return;
      paused = p; last = performance.now();
      $('#rnPause').textContent = p ? '▶' : '⏸';
      if (p) msg('⏸ 잠깐 멈춤 — ▶ 를 누르면 계속해요', true);
    }
    $('#rnPause').onclick = () => setPause(!paused);
    helpPause = setPause;
    const onVis = () => { if (document.hidden) setPause(true); };
    document.addEventListener('visibilitychange', onVis); onStop(() => document.removeEventListener('visibilitychange', onVis));

    function end() {
      over = true;
      const km = dist / 1000;
      later(() => showResult('run', {
        big: `${score.toLocaleString()}점`,
        sub: `맞힌 단어 ${right}개 · 💰 ${coins}개 · 🏃 ${Math.round(dist)}m · 최고 콤보 ${bestCombo}`,
        score, missed,
        again: () => playRun(),
        againMissed: null,
      }), 700);
      return km;
    }
    hud();
  }

  // =========================================================
  // G-03 스피드 O/X 퀴즈
  // =========================================================
  function playOX() {
    stop(); setTheme();
    const P = pool();
    const total = ({ e: 90, m: 60, h: 60, t: 60, a: 90, b: 90 }[S.level]) + ({ easy: 20, normal: 0, hard: -15 }[S.diff]);
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
    app().querySelectorAll('.ox-btn').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); answer(+b.dataset.a); }));
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
        app().querySelectorAll(`#ch${p} .choice`).forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); choose(p, b); }));
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
      ({ blocks: playBlocks, rain: playRain, catch: playCatch, drive: playDrive, run: runSetup, ox: playOX, battle: battleSetup }[sub] || renderMenu)();
    },
    // 학습 완료 화면에서 "오늘 단어로 게임"
    useDay(code, day) { S.level = code; S.mode = 'range'; S.from = day; S.to = day; save(); },
  };
})();
