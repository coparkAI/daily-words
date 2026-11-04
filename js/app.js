/* 쌍둥이의 하루 영단어 — 화면 동작
   주소(hash) 규칙
     #/                     홈
     #/e                    일차 선택 (e·m·h = 초·중·고)
     #/e/12/read|write|test|done   학습 단계
     #/e/print              진도표 출력
     #/e/12/print           일차 단어장 출력
     #/game, #/game/blocks|rain|ox|battle   게임 (js/games.js)
*/
(() => {
  'use strict';

  const LEVELS = {
    e: { key: 'elementary', name: '초등', emoji: '🌱', deco: '🌳' },
    m: { key: 'middle', name: '중등', emoji: '🌊', deco: '⛵' },
    h: { key: 'high', name: '고등', emoji: '🌙', deco: '✨' },
  };
  const STEPS = [['read', '① 읽기'], ['write', '② 쓰기'], ['test', '③ 암기']];
  const STORE_KEY = 'twins-words';
  const DAYS_PER_PAGE = 40;   // 진도표 한 장에 들어가는 일차 수
  const app = document.getElementById('app');

  // ---------- 데이터 ----------
  const data = {};
  for (const [code, lv] of Object.entries(LEVELS)) {
    const src = window.WORDS[lv.key];
    const days = {};
    src.words.forEach((w) => (days[w.day] = days[w.day] || []).push(w));
    data[code] = { ...lv, code, words: src.words, totalDays: Math.ceil(src.totalWords / 10), totalWords: src.totalWords, days };
  }
  const isReady = (lv, day) => (lv.days[day] || []).length > 0 && lv.days[day].every((w) => w.meaning);
  const topicsOf = (words) => [...new Set(words.map((w) => w.topic))];

  // ---------- 저장 (마지막 학습 일차만) ----------
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; } },
    setLast(code, day) { try { const s = store.get(); s[code] = day; localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* 저장 불가 환경 */ } },
  };

  // ---------- 도우미 ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (sel, el = app) => el.querySelector(sel);
  const $$ = (sel, el = app) => [...el.querySelectorAll(sel)];
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const go = (hash) => { location.hash = hash; };
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9'\- ]/g, ' ').replace(/\s+/g, ' ').trim();
  const reWord = (w) => new RegExp(`(^|[^A-Za-z])(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[^A-Za-z]|$)`, 'i');
  const highlight = (ex, w) => esc(ex).replace(reWord(esc(w)), '$1<b>$2</b>');
  const blankOut = (ex, w) => esc(ex).replace(reWord(esc(w)), (m, p) => p + '_'.repeat(Math.max(4, w.length)));
  const answers = (w) => [w.word, ...w.variants].map((x) => x.toLowerCase());

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- 소리 (TTS) ----------
  // 영어 원어민 음성만 쓴다. 한국어 음성이 영어를 읽으면 '콩글리시'처럼 들리므로 절대 대체하지 않는다.
  const ACCENTS = {
    us: { lang: 'en-US', label: '미국식', test: 'Hello! I can say water, tomato, and schedule.',
      prefer: ['Google US English', 'Samantha', 'Ava', 'Allison', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Guy', 'Microsoft Ana', 'Alex'] },
    uk: { lang: 'en-GB', label: '영국식', test: 'Hello! I can say water, tomato, and schedule.',
      prefer: ['Google UK English Female', 'Google UK English Male', 'Daniel', 'Serena', 'Kate', 'Martha', 'Arthur', 'Microsoft Sonia', 'Microsoft Libby', 'Microsoft Ryan'] },
  };
  // macOS·iOS 의 장난스러운 효과음 음성은 제외
  const NOVELTY = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Junior|Organ|Pipe|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Kathy|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley/i;
  const VOICE_KEY = 'twins-voice';
  const tts = {
    settings: (() => { try { return { accent: 'us', name: '', ...JSON.parse(localStorage.getItem(VOICE_KEY)) }; } catch { return { accent: 'us', name: '' }; } })(),
    save() { try { localStorage.setItem(VOICE_KEY, JSON.stringify(tts.settings)); } catch { /* 저장 불가 환경 */ } },
    // 선택한 억양에 맞는 영어 음성 목록 (좋은 음성 먼저)
    list(accent = tts.settings.accent) {
      const want = ACCENTS[accent];
      const score = (v) => {
        let s = 0;
        const i = want.prefer.findIndex((p) => v.name.startsWith(p));
        if (i >= 0) s += 100 - i;
        if (/Natural|Neural|Online|Premium|Enhanced/i.test(v.name)) s += 50;
        if (v.localService === false) s += 5;
        return s;
      };
      return speechSynthesis.getVoices()
        .filter((v) => v.lang.replace('_', '-').toLowerCase() === want.lang.toLowerCase() && !NOVELTY.test(v.name))
        .sort((a, b) => score(b) - score(a));
    },
    current() {
      const vs = tts.list();
      return vs.find((v) => v.name === tts.settings.name) || vs[0] || null;
    },
    warned: false,
    say(text, slow = false, btn) {
      if (!('speechSynthesis' in window)) return toast('이 브라우저는 소리 듣기를 지원하지 않아요');
      const voice = tts.current();
      if (!voice) {
        // 음성 목록이 아직 안 불러와졌으면 잠시 뒤 한 번 더 시도
        if (!tts.retried) { tts.retried = true; return setTimeout(() => tts.say(text, slow, btn), 400); }
        if (!tts.warned) { tts.warned = true; toast(`이 기기에 ${ACCENTS[tts.settings.accent].label} 영어 음성이 없어요. 🔊 발음 설정을 확인해 주세요`); }
        return;
      }
      tts.retried = false;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice; u.lang = voice.lang; u.rate = slow ? 0.6 : 0.9;
      if (btn) { btn.classList.add('playing'); u.onend = u.onerror = () => btn.classList.remove('playing'); }
      speechSynthesis.speak(u);
    },
  };
  if ('speechSynthesis' in window) speechSynthesis.getVoices(); // 일부 브라우저는 첫 호출 때 목록을 불러오기 시작한다

  // 발음 설정 창
  function openVoiceSettings() {
    let dlg = document.getElementById('voiceDlg');
    if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'voiceDlg'; dlg.className = 'voice-dlg'; document.body.append(dlg); }
    const draw = () => {
      const s = tts.settings;
      const vs = 'speechSynthesis' in window ? tts.list() : [];
      const cur = vs.length ? tts.current() : null;
      dlg.innerHTML = `
        <h3>🔊 발음 설정</h3>
        <div class="accent-pick">
          ${Object.entries(ACCENTS).map(([k, a]) => `<button class="btn ${s.accent === k ? 'primary' : ''}" data-accent="${k}">${a.label}</button>`).join('')}
        </div>
        ${vs.length ? `
          <label class="voice-pick">음성
            <select id="voiceSel">${vs.map((v) => `<option value="${esc(v.name)}" ${cur && v.name === cur.name ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>
          </label>
          <p class="voice-note">맨 위가 이 기기에서 가장 자연스러운 음성이에요. 들어 보고 바꿀 수 있어요.</p>`
        : `<p class="voice-note warn">이 기기에는 ${ACCENTS[s.accent].label} 영어 음성이 없어요.<br>
            안드로이드(갤럭시탭): 설정 → 일반 → 텍스트 음성 변환 → 기본 엔진을 <b>Google 음성 인식 및 합성</b>으로 바꾸고, 엔진 설정 → 음성 데이터 설치 → 영어(미국/영국)를 내려받아 주세요.<br>
            아이패드: 설정 → 손쉬운 사용 → 읽기 및 말하기 → 음성 → 영어에서 음성을 내려받아 주세요.<br>
            윈도우: 설정 → 시간 및 언어 → 음성에서 영어 음성을 추가해 주세요.</p>`}
        <p class="voice-note">발음기호는 미국식 기준이에요.</p>
        <div class="done-actions">
          <button class="btn soft" id="voiceTest" ${vs.length ? '' : 'disabled'}>▶ 들어 보기</button>
          <button class="btn primary" id="voiceClose">닫기</button>
        </div>`;
      dlg.querySelectorAll('[data-accent]').forEach((b) => (b.onclick = () => { s.accent = b.dataset.accent; s.name = ''; tts.save(); draw(); tts.say(ACCENTS[s.accent].test); }));
      const sel = dlg.querySelector('#voiceSel');
      if (sel) sel.onchange = () => { s.name = sel.value; tts.save(); tts.say(ACCENTS[s.accent].test); };
      dlg.querySelector('#voiceTest').onclick = () => tts.say(ACCENTS[s.accent].test);
      dlg.querySelector('#voiceClose').onclick = () => { dlg.close(); route(); };
    };
    draw();
    if ('speechSynthesis' in window && !tts.list().length) speechSynthesis.onvoiceschanged = () => dlg.open && draw();
    dlg.showModal();
  }
  const voiceBtn = () => `<button class="btn ghost small voice-btn" data-voice>🔊 ${ACCENTS[tts.settings.accent].label}</button>`;
  document.addEventListener('click', (e) => { if (e.target.closest('[data-voice]')) openVoiceSettings(); });

  // ---------- 따라 읽기 (음성 인식) ----------
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  // 음성 인식은 숫자를 아라비아 숫자로 돌려주기도 하므로 단어로 맞춰 비교한다
  const NUM_WORDS = { 0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 20: 'twenty', 30: 'thirty', 100: 'hundred' };
  const speechWords = (s) => norm(s).split(' ').filter(Boolean).map((w) => NUM_WORDS[w] || w);
  let activeRec = null;

  function listen(target, btn, out) {
    // 듣는 중에 다시 누르면 그만 듣기
    if (activeRec) { activeRec.stop(); return; }
    const isSentence = /\s/.test(target.trim());
    const MAX_MS = isSentence ? 15000 : 8000; // 최대 듣는 시간
    const SILENCE_MS = 2500;                    // 말이 끝난 뒤 이만큼 조용하면 채점
    const rec = new Recognition();
    rec.lang = ACCENTS[tts.settings.accent].lang;
    rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 3;
    activeRec = rec;
    btn.classList.add('listening');
    const label = btn.innerHTML;
    btn.innerHTML = '■ 그만';
    out.className = 'mic-result'; out.textContent = '말해 보세요… (다 읽었으면 ■ 그만)';

    const heard = new Set();   // 모든 후보 문장에서 들린 단어
    let shown = '';            // 화면에 보여 줄 들린 문장
    let silence = null;
    const maxTimer = setTimeout(() => rec.stop(), MAX_MS);
    rec.onresult = (e) => {
      clearTimeout(silence);
      // 안드로이드 크롬은 앞 결과를 포함한 문장을 다시 보내기도 해서("I eat" → "I eat an apple")
      // 앞 문장이 다음 문장에 그대로 들어 있으면 긴 쪽만 남긴다
      const finals = []; let interim = '';
      for (const r of e.results) {
        if (r.isFinal) {
          const t = r[0].transcript.trim();
          const prev = finals[finals.length - 1];
          if (prev && norm(t).startsWith(norm(prev))) finals[finals.length - 1] = t;
          else if (!prev || !norm(prev).endsWith(norm(t))) finals.push(t);
          [...r].forEach((alt) => speechWords(alt.transcript).forEach((w) => heard.add(w)));
        } else interim += r[0].transcript + ' ';
      }
      shown = [...finals, interim.trim()].filter(Boolean).join(' ');
      out.className = 'mic-result'; out.innerHTML = `듣는 중… <span class="en">“${esc(shown)}”</span>`;
      silence = setTimeout(() => rec.stop(), SILENCE_MS);
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      out.className = 'mic-result retry';
      out.textContent = e.error === 'not-allowed' ? '마이크를 허용하면 따라 읽기를 확인할 수 있어요' : '잘 안 들렸어요. 다시 해 볼까요?';
      heard.clear(); shown = '__error__';
    };
    rec.onend = () => {
      clearTimeout(maxTimer); clearTimeout(silence);
      activeRec = null;
      btn.classList.remove('listening'); btn.innerHTML = label;
      if (shown === '__error__') return;
      if (!shown) { out.className = 'mic-result retry'; out.textContent = '아무 소리도 안 들렸어요. 마이크 가까이에서 다시 읽어 볼까요?'; return; }
      // 단어마다 들렸는지 표시
      const parts = target.split(/\s+/);
      const marks = parts.map((p) => {
        const key = speechWords(p)[0];
        const ok = !key || heard.has(key);
        return { p, ok };
      });
      const total = marks.filter((m) => speechWords(m.p).length).length;
      const right = marks.filter((m) => m.ok && speechWords(m.p).length).length;
      const msg = right === total ? '✓ 완벽해요!'
        : right / total >= 0.75 ? '잘 읽었어요! 주황색 단어만 한 번 더 연습해요'
        : '다시 해 볼까요? 주황색 단어를 또박또박 읽어 봐요';
      out.className = `mic-result ${right / total >= 0.75 ? 'ok' : 'retry'}`;
      out.innerHTML = `
        <div class="word-check en">${marks.map((m) => `<span class="${m.ok ? 'hit' : 'miss'}">${m.ok ? '' : '✗'}${esc(m.p)}</span>`).join(' ')}</div>
        <div><b>${msg}</b> (${total}개 중 ${right}개)</div>
        <div class="heard">들린 말: <span class="en">“${esc(shown)}”</span></div>`;
    };
    rec.start();
  }
  const micButton = (target, label) => Recognition
    ? `<button class="btn soft small mic" data-say="${esc(target)}">🎤 ${label}</button>`
    : '';

  // ---------- 공통 조각 ----------
  function studyBar(lv, day, step, idx, total) {
    const stepIdx = STEPS.findIndex(([s]) => s === step);
    const topics = topicsOf(lv.days[day]).join(' · ');
    return `
      <div class="study-bar">
        <div class="row1">
          <button class="close-x" id="quit" aria-label="그만하기">✕</button>
          <div class="progress"><i style="width:${total ? (idx / total) * 100 : 0}%"></i></div>
          <div class="counter">${total ? `${Math.min(idx + 1, total)} / ${total}` : ''}</div>
        </div>
        <div class="row2">
          <span>${lv.emoji} ${lv.name} · Day ${day} · ${esc(topics)} ${voiceBtn()}</span>
          <span class="steps">${STEPS.map(([s, label], i) => `<button data-step="${s}" class="${i < stepIdx ? 'done' : ''} ${i === stepIdx ? 'current' : ''}" ${i > stepIdx ? 'disabled' : ''}>${i < stepIdx ? '✓ ' : ''}${label}</button>`).join('')}</span>
        </div>
      </div>`;
  }
  function bindStudyBar(lv, day) {
    $('#quit').onclick = () => { if (confirm('학습을 그만둘까요?')) go(`#/${lv.code}`); };
    $$('.steps button').forEach((b) => (b.onclick = () => go(`#/${lv.code}/${day}/${b.dataset.step}`)));
  }
  function bindAudio(root = app) {
    $$('[data-tts]', root).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); tts.say(b.dataset.tts, b.dataset.slow === '1', b); }));
    $$('.mic', root).forEach((b) => (b.onclick = (e) => { e.stopPropagation(); listen(b.dataset.say, b, b.closest('.card, .face').querySelector('.mic-result')); }));
  }
  const audioBtns = (text) => `<button class="icon-btn" data-tts="${esc(text)}" aria-label="듣기">🔊</button><button class="icon-btn" data-tts="${esc(text)}" data-slow="1" aria-label="느리게 듣기">🐢</button>`;

  // 키보드·스와이프 처리 (화면이 바뀔 때마다 교체)
  let keyHandler = null;
  document.addEventListener('keydown', (e) => { if (keyHandler && !e.target.matches('input')) keyHandler(e); });
  function onSwipe(el, left, right) {
    let x0 = null;
    el.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    el.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 70) (dx < 0 ? left : right)();
    });
  }

  // =========================================================
  // S-01 홈
  // =========================================================
  function renderHome() {
    const last = store.get();
    app.innerHTML = `
      <section class="home-hero">
        <div class="twins" aria-hidden="true">👦👦</div>
        <h1>쌍둥이의 하루 영단어</h1>
        <p>교육부 지정 필수 영단어 3,000개 · 하루 10단어씩 읽고, 쓰고, 외워요</p>
      </section>
      <section class="level-cards">
        ${Object.values(data).map((lv) => `
          <div class="level-card ${lv.key}" role="button" tabindex="0" data-go="#/${lv.code}">
            <span class="deco" aria-hidden="true">${lv.deco}</span>
            <span class="emoji" aria-hidden="true">${lv.emoji}</span>
            <span class="name">${lv.name}</span>
            <span class="meta">${lv.totalWords.toLocaleString()}단어 · ${lv.totalDays}일</span>
            ${last[lv.code] ? `<button class="resume" data-go="#/${lv.code}/${last[lv.code]}/read">▶ 이어서 Day ${last[lv.code]}</button>` : ''}
          </div>`).join('')}
      </section>
      <button class="game-entry" data-go="#/game">
        <span class="game-entry-icon" aria-hidden="true">🎮</span>
        <span><b>게임으로 복습하기</b><br><small>철자 블록 · 떨어지는 단어 · 스피드 O/X · 쌍둥이 대결</small></span>
        <span aria-hidden="true">▶</span>
      </button>
      <p class="home-foot">✏️ 진도는 출력한 진도표에 직접 체크해요 <button class="btn ghost small" id="how">사용 방법</button> ${voiceBtn()}</p>`;
    $$('[data-go]').forEach((el) => {
      el.onclick = (e) => { e.stopPropagation(); go(el.dataset.go); };
      el.onkeydown = (e) => { if (e.key === 'Enter') go(el.dataset.go); };
    });
    $('#how').onclick = () => alert('📘 하루 공부 순서\n\n① 읽기 — 단어와 예문을 듣고 소리 내어 따라 읽어요\n② 쓰기 — 펜으로 따라 쓰고, 철자를 직접 입력해요\n③ 암기 — 카드로 스스로 점검하고 퀴즈를 풀어요\n\n✏️ 다 끝나면 출력한 진도표에 체크하고 점수를 적어요');
  }

  // =========================================================
  // S-02 일차 선택
  // =========================================================
  function renderDays(lv) {
    const last = store.get()[lv.code];
    const allTopics = topicsOf(lv.words);
    let filter = null;
    const draw = () => {
      const cards = [];
      for (let d = 1; d <= lv.totalDays; d++) {
        const ws = lv.days[d] || [];
        if (filter && !ws.some((w) => w.topic === filter)) continue;
        const ready = isReady(lv, d);
        cards.push(`
          <div class="day-cell">
            <button class="day-card ${d === last ? 'recent' : ''}" data-day="${d}" ${ready ? '' : 'disabled'}>
              <span class="d">Day ${d}</span>
              <span class="t">${ready ? esc(topicsOf(ws).join(' · ')) : '준비 중'}</span>
              <span class="w en">${ready ? esc(ws.slice(0, 3).map((w) => w.word).join(', ')) + '…' : '&nbsp;'}</span>
            </button>
            ${ready ? `<button class="print-day" data-print="${d}" title="이 일차 단어장 출력" aria-label="Day ${d} 단어장 출력">🖨</button>` : ''}
          </div>`);
      }
      $('#grid').innerHTML = cards.join('');
      $$('.chip').forEach((c) => c.classList.toggle('on', (c.dataset.topic || null) === filter));
      $$('.day-card').forEach((b) => (b.onclick = () => go(`#/${lv.code}/${b.dataset.day}/read`)));
      $$('.print-day').forEach((b) => (b.onclick = () => go(`#/${lv.code}/${b.dataset.print}/print`)));
    };
    app.innerHTML = `
      <div class="topbar">
        <button class="close-x" onclick="location.hash='#/'" aria-label="홈으로">◀</button>
        <h2>${lv.emoji} ${lv.name} <span class="badge">${lv.totalWords.toLocaleString()}단어 · ${lv.totalDays}일</span></h2>
        ${voiceBtn()}
        <button class="btn soft small" onclick="location.hash='#/${lv.code}/print'">🖨 진도표 출력</button>
      </div>
      ${last && isReady(lv, last) ? `<div class="resume-bar"><span>▶ 이어서 하기: <b>Day ${last}</b> · ${esc(topicsOf(lv.days[last]).join(' · '))}</span><button class="btn primary small" onclick="location.hash='#/${lv.code}/${last}/read'">시작</button></div>` : ''}
      <div class="filter">
        <button class="chip" data-topic="">전체</button>
        ${allTopics.map((t) => `<button class="chip" data-topic="${esc(t)}">${esc(t)}</button>`).join('')}
      </div>
      <div class="day-grid" id="grid"></div>`;
    $$('.chip').forEach((c) => (c.onclick = () => { filter = c.dataset.topic || null; draw(); }));
    draw();
    const recent = $('.day-card.recent');
    if (recent) recent.scrollIntoView({ block: 'center' });
  }

  // =========================================================
  // S-03 읽기
  // =========================================================
  function renderRead(lv, day) {
    const words = lv.days[day];
    store.setLast(lv.code, day);
    let i = 0;
    let masked = false;
    const seen = new Set();
    const draw = (autoplay) => {
      const w = words[i];
      seen.add(i);
      app.innerHTML = `
        ${studyBar(lv, day, 'read', i, words.length)}
        <div class="stage">
          <article class="card ${masked ? 'mask' : ''}" id="card">
            <button class="btn ghost small hide-toggle" id="mask">${masked ? '👁 뜻 보기' : '🙈 뜻 가리기'}</button>
            <div class="word-head">
              <div class="word-big">${esc(w.word)}</div>
              <div class="phon">${esc(w.phonetic)}<span class="pos">${esc(w.pos)}</span></div>
              <div class="meaning">${esc(w.meaning)}</div>
              ${w.variants.length ? `<div class="sub">다른 형태: <span class="en">${esc(w.variants.join(', '))}</span></div>` : ''}
              ${w.related.length ? `<div class="sub">관련어: <span class="en">${esc(w.related.join(', '))}</span></div>` : ''}
              <div class="audio-row">${audioBtns(w.word)}${micButton(w.word, '단어 따라 읽기')}</div>
            </div>
            <div class="example-box">
              <div class="ex-en">${highlight(w.example, w.word)}</div>
              <div class="ex-ko">${esc(w.exampleKo)}</div>
              <div class="ex-actions">
                ${audioBtns(w.example)}
                ${micButton(w.example, '예문 따라 읽기')}
                <span class="speak-hint">🗣 소리 내어 3번 따라 읽어 보세요</span>
              </div>
              <div class="mic-result"></div>
            </div>
          </article>
          <div class="nav-row">
            <button class="btn" id="prev" ${i === 0 ? 'disabled' : ''}>◀ 이전</button>
            <div class="dots">${words.map((_, k) => `<button data-k="${k}" class="${k === i ? 'on' : seen.has(k) ? 'seen' : ''}" aria-label="${k + 1}번째 단어"></button>`).join('')}</div>
            ${i < words.length - 1
              ? '<button class="btn primary" id="next">다음 ▶</button>'
              : `<button class="btn primary" id="nextStep">② 쓰기로 ▶</button>`}
          </div>
        </div>`;
      bindStudyBar(lv, day);
      bindAudio();
      $('#mask').onclick = () => { masked = !masked; draw(); };
      $$('#card.mask .meaning, #card.mask .ex-ko').forEach((el) => (el.onclick = () => { masked = false; draw(); }));
      $('#prev').onclick = prev;
      if ($('#next')) $('#next').onclick = next;
      if ($('#nextStep')) $('#nextStep').onclick = () => go(`#/${lv.code}/${day}/write`);
      $$('.dots button').forEach((b) => (b.onclick = () => { i = +b.dataset.k; draw(true); }));
      onSwipe($('#card'), next, prev);
      if (autoplay) setTimeout(() => tts.say(w.word), 250);
    };
    const next = () => { if (i < words.length - 1) { i++; draw(true); } };
    const prev = () => { if (i > 0) { i--; draw(true); } };
    keyHandler = (e) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ') { e.preventDefault(); tts.say(words[i].word); }
    };
    draw(true);
  }

  // =========================================================
  // S-04 쓰기 — (가) 펜 따라 쓰기 → (나) 철자 입력
  // =========================================================
  const isTouch = matchMedia('(pointer: coarse)').matches;

  function makePad(el, guideText) {
    const bg = document.createElement('canvas');
    const ink = document.createElement('canvas');
    el.append(bg, ink);
    const dpr = window.devicePixelRatio || 1;
    const w = el.clientWidth; const h = el.clientHeight;
    [bg, ink].forEach((c) => { c.width = w * dpr; c.height = h * dpr; c.getContext('2d').scale(dpr, dpr); });
    // 영어 공책 4선 — 색은 테마(라이트/다크)에서 가져온다
    const style = getComputedStyle(document.body);
    const css = (name) => style.getPropertyValue(name).trim();
    const g = bg.getContext('2d');
    const top = h * 0.18; const bottom = h * 0.86; const gap = (bottom - top) / 3;
    [[top, 1, []], [top + gap, 0.7, [6, 6]], [top + gap * 2, 1, []], [bottom, 1, []]].forEach(([y, alpha, dash], k) => {
      g.strokeStyle = k === 2 ? '#e9a0a0' : css('--pad-line');
      g.globalAlpha = alpha; g.lineWidth = 1.2; g.setLineDash(dash); g.beginPath(); g.moveTo(10, y); g.lineTo(w - 10, y); g.stroke();
    });
    g.globalAlpha = 1;
    if (guideText) {
      g.setLineDash([]);
      g.font = `500 ${gap * 2.35}px ${css('--font-en')}`;
      g.fillStyle = css('--muted');
      g.globalAlpha = 0.35;
      g.textBaseline = 'alphabetic';
      g.fillText(guideText, 24, top + gap * 2, w - 48);
      g.globalAlpha = 1;
    }
    const ctx = ink.getContext('2d');
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = css('--ink');
    let drawing = false; let last = null; let strokes = 0;
    const pt = (e) => { const r = ink.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || 0.5 }; };
    ink.addEventListener('pointerdown', (e) => { drawing = true; last = pt(e); ink.setPointerCapture(e.pointerId); strokes++; e.preventDefault(); });
    ink.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const p = pt(e);
      ctx.lineWidth = e.pointerType === 'pen' ? 2 + p.p * 4 : 4;
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p; e.preventDefault();
    });
    const end = () => { drawing = false; };
    ink.addEventListener('pointerup', end); ink.addEventListener('pointercancel', end);
    return { clear: () => ctx.clearRect(0, 0, w, h), get used() { return strokes > 0; } };
  }

  function renderWrite(lv, day) {
    const words = lv.days[day];
    let i = 0;
    let phase = isTouch ? 'trace' : 'spell';
    let hints = 0;
    let misses = 0;       // 이 단어에서 틀린 횟수
    let revealed = false; // 정답 보기 상태
    const drawTrace = () => {
      const w = words[i];
      app.innerHTML = `
        ${studyBar(lv, day, 'write', i, words.length)}
        <div class="stage">
          <article class="card">
            <div class="write-head"><span class="meaning">${esc(w.meaning)}</span><span class="pos">${esc(w.pos)}</span>${audioBtns(w.word)}</div>
            <div class="pad-label">✏️ 따라 쓰기 <span>흐린 글씨 위에 펜이나 손가락으로 써요</span></div>
            <div class="pad" id="padA"></div>
            <div class="pad-label">✍️ 혼자 쓰기 <span>안 보고 한 번 더 써 봐요</span></div>
            <div class="pad" id="padB"></div>
            <div class="write-actions">
              <button class="btn" id="clear">🧽 지우기</button>
              <span>
                <button class="btn ghost" id="skip">건너뛰기</button>
                <button class="btn primary" id="doneTrace">다 썼어요 ▶</button>
              </span>
            </div>
          </article>
        </div>`;
      bindStudyBar(lv, day); bindAudio();
      const a = makePad($('#padA'), w.word); const b = makePad($('#padB'), '');
      $('#clear').onclick = () => { a.clear(); b.clear(); };
      $('#skip').onclick = $('#doneTrace').onclick = () => { phase = 'spell'; draw(); };
      tts.say(w.word);
    };
    const drawSpell = () => {
      const w = words[i];
      // 정답 보기: 모든 칸 공개 / 힌트 2: 글자 수 + 첫 글자 / 힌트 1: 첫 글자
      const boxes = revealed ? `<div class="spell-boxes">${[...w.word].map((c) => `<span class="given">${esc(c)}</span>`).join('')}</div>`
        : hints >= 2 ? `<div class="spell-boxes">${[...w.word].map((c, k) => `<span class="${k === 0 ? 'given' : ''}">${k === 0 ? esc(c) : ''}</span>`).join('')}</div>`
        : hints === 1 ? `<div class="spell-boxes"><span class="given">${esc(w.word[0])}</span><span>…</span></div>` : '';
      app.innerHTML = `
        ${studyBar(lv, day, 'write', i, words.length)}
        <div class="stage">
          <article class="card">
            ${!isTouch ? '<button class="btn ghost small hide-toggle" id="toTrace">✏️ 따라 쓰기</button>' : ''}
            <div class="write-head"><span class="meaning">${esc(w.meaning)}</span><span class="pos">${esc(w.pos)}</span>${audioBtns(w.word)}</div>
            ${boxes}
            <input class="spell-input" id="spell" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="latin" aria-label="영단어 입력" placeholder="영어로 써 보세요">
            <div class="feedback" id="fb">${revealed ? '👀 위 철자를 보고 똑같이 써 보세요' : ''}</div>
            <div class="blank-ex">${blankOut(w.example, w.word)}</div>
            <div class="hint-row">
              ${revealed ? '' : `<button class="btn soft small" id="hint" ${hints >= 2 ? 'disabled' : ''}>💡 ${hints === 0 ? '첫 글자' : '글자 수'} 보기</button>
              <button class="btn soft small" id="reveal">👀 정답 보기</button>`}
              <button class="btn primary" id="check">확인 ⏎</button>
              ${revealed ? '<button class="btn ghost small" id="skipWord">다음 단어로 ▶</button>' : ''}
            </div>
          </article>
          <div class="nav-row"><span></span><span class="speak-hint">${i + 1}번째 단어 · 모르겠으면 👀 정답 보기를 눌러요</span><span></span></div>
        </div>`;
      bindStudyBar(lv, day); bindAudio();
      const input = $('#spell');
      input.focus();
      if ($('#toTrace')) $('#toTrace').onclick = () => { phase = 'trace'; draw(); };
      if ($('#hint')) $('#hint').onclick = () => { hints++; drawSpell(); };
      if ($('#reveal')) $('#reveal').onclick = () => { revealed = true; drawSpell(); };
      const nextWord = () => {
        if (i < words.length - 1) { i++; hints = 0; misses = 0; revealed = false; phase = isTouch ? 'trace' : 'spell'; draw(); }
        else finish();
      };
      if ($('#skipWord')) $('#skipWord').onclick = nextWord;
      const check = () => {
        const val = input.value.trim().toLowerCase();
        if (!val) return input.focus();
        if (answers(w).includes(val)) {
          input.classList.add('ok'); input.disabled = true;
          $('#fb').innerHTML = '<b style="color:var(--good)">✓ 정답!</b>';
          tts.say(w.word);
          setTimeout(nextWord, 1100);
        } else {
          misses++;
          const diff = [...w.word].map((c, k) => `<span class="${val[k] === c.toLowerCase() ? '' : 'x'}">${esc(c)}</span>`).join('');
          input.classList.remove('no'); void input.offsetWidth; input.classList.add('no');
          $('#fb').innerHTML = `정답은 <span class="diff">${diff}</span> — 다시 써 볼까요?`;
          // 두 번 틀리면 정답을 계속 보여 주고 '다음 단어로' 버튼을 연다
          setTimeout(() => {
            if (misses >= 2 && !revealed) { revealed = true; drawSpell(); return; }
            input.value = ''; input.classList.remove('no'); input.focus();
          }, 2000);
        }
      };
      $('#check').onclick = check;
      input.onkeydown = (e) => { if (e.key === 'Enter') check(); };
      tts.say(w.word);
    };
    const finish = () => {
      app.innerHTML = `
        ${studyBar(lv, day, 'write', words.length, words.length)}
        <div class="stage"><article class="card" style="text-align:center">
          <div style="font-size:56px">✍️</div>
          <h2 style="font-family:var(--font-display);font-weight:400;margin:6px 0">쓰기 완료!</h2>
          <p style="color:var(--muted)">10단어 쓰기 연습을 마쳤어요. 이제 외웠는지 확인해 볼까요?</p>
          <button class="btn primary" id="nextStep">③ 암기 확인으로 ▶</button>
        </article></div>`;
      bindStudyBar(lv, day);
      $('#nextStep').onclick = () => go(`#/${lv.code}/${day}/test`);
    };
    const draw = () => (phase === 'trace' ? drawTrace() : drawSpell());
    keyHandler = null;
    draw();
  }

  // =========================================================
  // S-05 암기 확인 — (가) 뒤집기 카드 → (나) 퀴즈
  // =========================================================
  function renderTest(lv, day) {
    const words = lv.days[day];
    const hard = new Set();
    const hardCount = {};
    let queue = words.map((_, k) => k);
    let known = 0;

    // (가) 뒤집기 카드
    const drawFlip = () => {
      if (!queue.length) return startQuiz();
      const w = words[queue[0]];
      app.innerHTML = `
        ${studyBar(lv, day, 'test', known, words.length)}
        <div class="stage">
          <p class="q-title">스스로 점검 — 뜻이 떠오르면 카드를 뒤집어 확인해요</p>
          <div class="flip-wrap">
            <div class="flip" id="flip" role="button" tabindex="0" aria-label="카드 뒤집기">
              <div class="face front">
                <div class="word-big">${esc(w.word)}</div>
                <div class="phon"><span class="pos">${esc(w.pos)}</span></div>
                <div class="audio-row"><button class="icon-btn" data-tts="${esc(w.word)}" aria-label="듣기">🔊</button></div>
                <div class="tap">탭해서 뒤집기 (Space)</div>
              </div>
              <div class="face back">
                <div class="meaning">${esc(w.meaning)}</div>
                <hr>
                <div class="ex-en">${highlight(w.example, w.word)}</div>
                <div class="ex-ko">${esc(w.exampleKo)}</div>
              </div>
            </div>
          </div>
          <div class="judge hidden" id="judge">
            <button class="btn hard" id="hard">◀ 아직 어려워요</button>
            <button class="btn know" id="know">외웠어요 ▶</button>
          </div>
        </div>`;
      bindStudyBar(lv, day); bindAudio();
      const flip = $('#flip');
      const turn = () => { flip.classList.toggle('flipped'); $('#judge').classList.toggle('hidden', !flip.classList.contains('flipped')); };
      flip.onclick = turn;
      const judge = (ok) => {
        if (!flip.classList.contains('flipped')) return;
        const k = queue.shift();
        if (ok) known++;
        else {
          hard.add(k); hardCount[k] = (hardCount[k] || 0) + 1;
          if (hardCount[k] >= 3) { known++; toast('퀴즈에서 한 번 더 확인해 봐요 💪'); }
          else queue.push(k);
        }
        drawFlip();
      };
      $('#hard').onclick = () => judge(false);
      $('#know').onclick = () => judge(true);
      onSwipe(flip, () => judge(false), () => judge(true));
      keyHandler = (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); turn(); }
        else if (e.key === 'ArrowLeft') judge(false);
        else if (e.key === 'ArrowRight') judge(true);
      };
    };

    // (나) 퀴즈
    let questions = []; let qi = 0; let firstScore = null; let wrong = [];
    function makeQuestions(idxs) {
      const types = shuffle(['en2ko', 'en2ko', 'en2ko', 'en2ko', 'ko2en', 'ko2en', 'ko2en', 'listen', 'listen', 'listen']).slice(0, idxs.length);
      // 어렵다고 한 단어는 뜻→영어, 듣고 쓰기 문제로 먼저 배정
      const order = [...idxs].sort((a, b) => hard.has(b) - hard.has(a));
      const hardTypes = types.filter((t) => t !== 'en2ko'); const easyTypes = types.filter((t) => t === 'en2ko');
      return shuffle(order.map((k) => ({ k, type: (hard.has(k) ? hardTypes.shift() || easyTypes.shift() : easyTypes.shift() || hardTypes.shift()) })));
    }
    function options(w) {
      const pool = lv.words.filter((x) => x.word !== w.word && x.meaning);
      const same = shuffle(pool.filter((x) => x.topic === w.topic));
      const others = shuffle(pool.filter((x) => x.topic !== w.topic));
      return shuffle([w, ...[...same, ...others].slice(0, 3)]);
    }
    const startQuiz = () => { questions = makeQuestions(words.map((_, k) => k)); qi = 0; wrong = []; drawQ(); };
    const drawQ = () => {
      if (qi >= questions.length) return drawResult();
      const q = questions[qi]; const w = words[q.k];
      let body = '';
      if (q.type === 'listen') {
        body = `
          <p class="q-title">잘 듣고 영어로 써 보세요</p>
          <div class="audio-row">${audioBtns(w.word)}</div>
          <input class="spell-input" id="spell" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="들은 단어 입력">
          <div class="feedback" id="fb"></div>
          <div class="hint-row"><button class="btn primary" id="check">확인 ⏎</button></div>`;
      } else {
        const opts = options(w);
        const en2ko = q.type === 'en2ko';
        body = `
          <p class="q-title">${en2ko ? '다음 단어의 뜻은?' : '이 뜻을 가진 영단어는?'}</p>
          <div class="q-word">${en2ko ? `<div class="word-big">${esc(w.word)}</div><div class="audio-row"><button class="icon-btn" data-tts="${esc(w.word)}">🔊</button></div>` : `<div class="meaning" style="font-size:32px">${esc(w.meaning)}</div>`}</div>
          <div class="choices">${opts.map((o, n) => `<button class="choice ${en2ko ? '' : 'en-choice'}" data-ok="${o === w ? 1 : 0}"><span class="n">${n + 1}</span>${esc(en2ko ? o.meaning : o.word)}</button>`).join('')}</div>`;
      }
      app.innerHTML = `
        ${studyBar(lv, day, 'test', qi, questions.length)}
        <div class="stage"><article class="card">${body}</article></div>`;
      bindStudyBar(lv, day); bindAudio();
      const answer = (ok) => {
        if (!ok) wrong.push(q.k);
        setTimeout(() => { qi++; drawQ(); }, ok ? 800 : 1600);
      };
      if (q.type === 'listen') {
        const input = $('#spell'); input.focus();
        setTimeout(() => tts.say(w.word), 300);
        const check = () => {
          const val = input.value.trim().toLowerCase();
          if (!val) return;
          const ok = answers(w).includes(val);
          input.classList.add(ok ? 'ok' : 'no'); input.disabled = true; $('#check').disabled = true;
          $('#fb').innerHTML = ok ? '<b style="color:var(--good)">✓ 정답!</b>' : `정답은 <span class="diff">${esc(w.word)}</span>`;
          answer(ok);
        };
        $('#check').onclick = check;
        input.onkeydown = (e) => { if (e.key === 'Enter') check(); };
        keyHandler = null;
      } else {
        const choose = (btn) => {
          if ($('.choice:disabled')) return;
          const ok = btn.dataset.ok === '1';
          $$('.choice').forEach((c) => { c.disabled = true; if (c.dataset.ok === '1') c.classList.add('right'); });
          if (!ok) btn.classList.add('wrong');
          if (q.type === 'en2ko' || ok) tts.say(w.word);
          answer(ok);
        };
        $$('.choice').forEach((c) => (c.onclick = () => choose(c)));
        keyHandler = (e) => { const n = +e.key; if (n >= 1 && n <= 4) choose($$('.choice')[n - 1]); };
      }
    };
    const drawResult = () => {
      if (firstScore === null) firstScore = words.length - wrong.length;
      const perfect = wrong.length === 0;
      app.innerHTML = `
        ${studyBar(lv, day, 'test', questions.length, questions.length)}
        <div class="stage"><article class="card">
          <div class="result-score">${questions.length - wrong.length} / ${questions.length}</div>
          <p style="text-align:center;margin:4px 0 0">${perfect ? '모두 맞혔어요! 🎉' : '잘했어요! 틀린 단어만 다시 풀어 봐요'}</p>
          ${firstScore !== questions.length - wrong.length || questions.length !== words.length ? `<p style="text-align:center;color:var(--muted);font-size:15px">진도표에 적을 점수(첫 시도): <b>${firstScore} / ${words.length}</b></p>` : ''}
          ${wrong.length ? `<ul class="wrong-list">${wrong.map((k) => `<li><span style="color:var(--bad)">✗</span><span class="en">${esc(words[k].word)}</span><span>${esc(words[k].meaning)}</span><button class="icon-btn" data-tts="${esc(words[k].word)}" style="margin-left:auto">🔊</button></li>`).join('')}</ul>` : ''}
          <div class="done-actions">
            ${wrong.length ? '<button class="btn" id="retry">🔁 틀린 단어만 다시</button>' : ''}
            <button class="btn primary" id="finish">학습 완료 ▶</button>
          </div>
        </article></div>`;
      bindStudyBar(lv, day); bindAudio();
      if ($('#retry')) $('#retry').onclick = () => { questions = makeQuestions(wrong); qi = 0; wrong = []; drawQ(); };
      $('#finish').onclick = () => { sessionStorage.setItem(`score-${lv.code}-${day}`, firstScore); go(`#/${lv.code}/${day}/done`); };
      keyHandler = null;
    };
    drawFlip();
  }

  // =========================================================
  // S-06 학습 완료
  // =========================================================
  function renderDone(lv, day) {
    const words = lv.days[day];
    const score = sessionStorage.getItem(`score-${lv.code}-${day}`);
    const hasNext = day < lv.totalDays && isReady(lv, day + 1);
    app.innerHTML = `
      <div class="stage"><article class="card">
        <div class="done-head">
          <div class="party">🎉</div>
          <h2>Day ${day} 완료!</h2>
          ${score !== null ? `<p style="margin:0;color:var(--muted)">암기 확인 점수 <b style="color:var(--accent-deep)">${score} / ${words.length}</b> (첫 시도)</p>` : ''}
        </div>
        <div class="today-words">${words.map((w) => `<div><span class="en">${esc(w.word)}</span><span>${esc(w.meaning)}</span></div>`).join('')}</div>
        <div class="check-note">✏️ 진도표에 체크하세요 — Day ${day} &nbsp;읽기 ☑ 쓰기 ☑ 암기 ☑ ${score !== null ? `&nbsp;점수 ${score}` : ''}</div>
        <div class="done-actions">
          <button class="btn" onclick="location.hash='#/${lv.code}/${day}/print'">🖨 오늘 단어장 출력</button>
          <button class="btn" onclick="location.hash='#/${lv.code}'">일차 목록</button>
          <button class="btn soft" id="toGame">🎮 오늘 단어로 게임</button>
          ${hasNext ? `<button class="btn primary" onclick="location.hash='#/${lv.code}/${day + 1}/read'">Day ${day + 1} 시작 ▶</button>`
            : day >= lv.totalDays ? `<span class="badge" style="font-size:16px;padding:10px 16px">🎓 ${lv.name} 과정을 모두 마쳤어요!</span>` : ''}
        </div>
      </article></div>`;
    $('#toGame').onclick = () => { window.TWGames?.useDay(lv.code, day); go('#/game'); };
    keyHandler = null;
  }

  // =========================================================
  // P-01 진도표
  // =========================================================
  function renderProgressPrint(lv) {
    let from = 1; let to = lv.totalDays; let name = '';
    const draw = () => {
      const days = []; for (let d = from; d <= to; d++) days.push(d);
      const pages = []; for (let p = 0; p < days.length; p += DAYS_PER_PAGE) pages.push(days.slice(p, p + DAYS_PER_PAGE));
      $('#sheets').innerHTML = pages.map((pg, pi) => `
        <section class="sheet">
          <div class="sheet-head">
            <h3>${lv.emoji} ${lv.name} 필수 영단어 ${lv.totalWords.toLocaleString()} — 진도표</h3>
            <div class="fields">이름: <b>${esc(name) || '__________'}</b> &nbsp; 시작일: ____년 __월 __일</div>
          </div>
          <table class="prog">
            <thead><tr><th style="width:11%">Day</th><th>주제</th><th style="width:12%">학습일</th><th style="width:8%">읽기</th><th style="width:8%">쓰기</th><th style="width:8%">암기</th><th style="width:10%">점수</th><th style="width:11%">확인</th></tr></thead>
            <tbody>${pg.map((d) => `<tr><td><b>${d}</b></td><td class="topic">${esc(topicsOf(lv.days[d] || []).join(' · '))}</td><td>&nbsp;&nbsp;/</td><td><span class="box"></span></td><td><span class="box"></span></td><td><span class="box"></span></td><td style="text-align:right">/10</td><td></td></tr>`).join('')}</tbody>
          </table>
          <div class="foot">쌍둥이의 하루 영단어 · ${pi + 1} / ${pages.length}쪽</div>
        </section>`).join('');
    };
    app.innerHTML = `
      <div class="topbar no-print">
        <button class="close-x" onclick="history.back()" aria-label="뒤로">◀</button>
        <h2>🖨 ${lv.name} 진도표 출력</h2>
      </div>
      <div class="print-ui no-print">
        <label>이름 <input type="text" id="name" placeholder="비워 두면 손으로"></label>
        <label>Day <input type="number" id="from" min="1" max="${lv.totalDays}" value="1"></label>
        <label>~ <input type="number" id="to" min="1" max="${lv.totalDays}" value="${lv.totalDays}"></label>
        <span style="color:var(--muted);font-size:15px">한 장에 ${DAYS_PER_PAGE}일</span>
        <button class="btn primary small" style="margin-left:auto" onclick="window.print()">인쇄하기</button>
      </div>
      <div id="sheets"></div>`;
    const clamp = (v) => Math.min(lv.totalDays, Math.max(1, +v || 1));
    $('#name').oninput = (e) => { name = e.target.value; draw(); };
    $('#from').onchange = (e) => { from = clamp(e.target.value); if (from > to) to = from; draw(); };
    $('#to').onchange = (e) => { to = clamp(e.target.value); if (to < from) from = to; draw(); };
    keyHandler = null;
    draw();
  }

  // =========================================================
  // P-02 일차 단어장
  // =========================================================
  function renderDayPrint(lv, day) {
    const words = lv.days[day];
    let mode = 'all';
    const draw = () => {
      $('#sheets').innerHTML = `
        <section class="sheet">
          <div class="sheet-head">
            <h3>${lv.emoji} ${lv.name} Day ${day} · ${esc(topicsOf(words).join(' · '))}</h3>
            <div class="fields">이름: ________ &nbsp; 날짜: ____ / ____</div>
          </div>
          <table class="daysheet">
            <thead><tr><th>#</th><th>단어</th><th>뜻</th><th>예문</th></tr></thead>
            <tbody>${words.map((w, n) => `
              <tr>
                <td class="n">${n + 1}</td>
                <td class="w">${mode === 'hideWord' ? '<span class="blank">.</span>' : esc(w.word)}</td>
                <td class="m">${mode === 'hideMeaning' ? '<span class="blank">.</span>' : `${esc(w.meaning)}<div class="ko">${esc(w.pos)}</div>`}</td>
                <td><div class="en">${mode === 'hideWord' ? blankOut(w.example, w.word) : highlight(w.example, w.word)}</div><div class="ko">${esc(w.exampleKo)}</div></td>
              </tr>`).join('')}</tbody>
          </table>
          <div class="trace-lines">${words.map((w) => `<div class="trace-row"><span class="lbl">${mode === 'hideWord' ? '' : esc(w.word)}</span><span class="lines"></span></div>`).join('')}</div>
          <div class="foot">쌍둥이의 하루 영단어</div>
        </section>`;
    };
    app.innerHTML = `
      <div class="topbar no-print">
        <button class="close-x" onclick="history.back()" aria-label="뒤로">◀</button>
        <h2>🖨 Day ${day} 단어장 출력</h2>
      </div>
      <div class="print-ui no-print">
        <label><input type="radio" name="mode" value="all" checked> 기본</label>
        <label><input type="radio" name="mode" value="hideMeaning"> 뜻 가리기</label>
        <label><input type="radio" name="mode" value="hideWord"> 단어 가리기</label>
        <button class="btn primary small" style="margin-left:auto" onclick="window.print()">인쇄하기</button>
      </div>
      <div id="sheets"></div>`;
    $$('input[name=mode]').forEach((r) => (r.onchange = () => { mode = r.value; draw(); }));
    keyHandler = null;
    draw();
  }

  // ---------- 게임(games.js)에 넘겨주는 공용 도구 ----------
  window.TW = {
    app, data, esc, shuffle, toast, go, answers, tts, voiceBtn, store, topicsOf, bindAudio,
    setKey: (fn) => { keyHandler = fn; },
  };

  // ---------- 라우터 ----------
  function route() {
    window.speechSynthesis?.cancel();
    if (activeRec) activeRec.abort();
    window.TWGames?.stop();
    keyHandler = null;
    const [code, a, b] = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (code === 'game' && window.TWGames) { window.scrollTo(0, 0); return window.TWGames.render(a); }
    const lv = data[code];
    document.body.dataset.level = lv ? lv.key : 'home';
    document.title = lv ? `${lv.name} · 쌍둥이의 하루 영단어` : '쌍둥이의 하루 영단어';
    window.scrollTo(0, 0);
    if (!lv) return renderHome();
    if (!a) return renderDays(lv);
    if (a === 'print') return renderProgressPrint(lv);
    const day = +a;
    if (!isReady(lv, day)) { toast('아직 준비 중인 일차예요'); return go(`#/${code}`); }
    const views = { read: renderRead, write: renderWrite, test: renderTest, done: renderDone, print: renderDayPrint };
    (views[b] || renderRead)(lv, day);
  }
  window.addEventListener('hashchange', route);
  route();
})();
