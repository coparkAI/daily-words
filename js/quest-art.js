/* 쌍둥이의 하루 영단어 — G-09 단어 대모험 그림·스테이지 자료 (요구사항 15장, 2026-11-28)
   주인공(C안 스트리트 히어로 16×24), 스테이지 10개(배경·적·음악), 보스 10개(2단계 변신)를 모두 코드로 그린다.
   quest.js(게임 엔진)가 window.TWQuestArt 로 가져다 쓴다. 특정 기존 게임의 캐릭터·그림·음악을 따라 하지 않은 자작 그림이다. */
(() => {
  'use strict';
  const W = 320; const H = 200; const GROUND0 = 150;
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const OUT = '#140c1c';

  // 사각형 목록 [x, y, w, h, 색] 을 1px 어두운 테두리와 함께 그림 (도트 느낌). flip 이면 좌우 뒤집기
  function sprite(c, ox, oy, rects, flip, outline, wFlip) {
    const ow = wFlip || 12;
    const X = (r) => (flip ? ox + ow - r[0] - r[2] : ox + r[0]);
    if (outline !== false) {
      c.fillStyle = outline || OUT;
      for (let i = 0; i < rects.length; i++) { const r = rects[i]; c.fillRect(X(r) - 1, oy + r[1] - 1, r[2] + 2, r[3] + 2); }
    }
    for (let i = 0; i < rects.length; i++) { const r = rects[i]; c.fillStyle = r[4]; c.fillRect(X(r), oy + r[1], r[2], r[3]); }
  }
  function glow(c, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.restore(); }

  // ---------- 배경음 곡 ----------
  function addSongs(S) {
    if (S.qk) return;
    S.q1 = { bpm: 140, wave: 'square', mel: [72, 0, 74, 76, 79, 0, 76, 74, 72, 0, 69, 72, 74, 0, 0, 0, 76, 0, 77, 79, 81, 0, 79, 77, 76, 74, 72, 74, 76, 0, 0, 0], bass: [48, 48, 45, 45, 41, 41, 43, 43], bw: 'triangle', mv: 0.06, drum: true };
    S.q2 = { bpm: 150, wave: 'square', mel: [69, 0, 72, 69, 76, 0, 75, 76, 69, 0, 72, 69, 74, 72, 71, 0, 69, 0, 72, 69, 77, 0, 76, 74, 72, 71, 69, 68, 69, 0, 0, 0], bass: [45, 45, 43, 43, 41, 41, 40, 40], bw: 'sawtooth', mv: 0.055, drum: true };
    S.q3 = { bpm: 128, wave: 'triangle', mel: [77, 81, 84, 81, 79, 77, 76, 77, 79, 0, 74, 0, 76, 0, 0, 0, 77, 81, 84, 89, 88, 84, 81, 79, 77, 76, 74, 76, 77, 0, 0, 0], bass: [41, 41, 38, 38, 34, 34, 36, 36], bw: 'triangle', mv: 0.1, pluck: true, hat: true };
    S.qk = { bpm: 120, wave: 'triangle', mel: [72, 74, 76, 79, 76, 74, 72, 0, 74, 76, 79, 81, 79, 76, 74, 0, 81, 79, 76, 79, 81, 84, 81, 79, 76, 74, 72, 74, 76, 0, 0, 0], bass: [48, 48, 55, 55, 53, 53, 48, 48], bw: 'triangle', mv: 0.11, pluck: true, hat: true };
    S.qc = { bpm: 132, wave: 'square', mel: [79, 0, 81, 84, 86, 84, 81, 79, 76, 79, 81, 0, 79, 76, 74, 0, 76, 79, 81, 84, 86, 88, 86, 84, 81, 79, 76, 79, 79, 0, 0, 0], bass: [43, 43, 48, 48, 45, 45, 43, 43], bw: 'triangle', mv: 0.055, pluck: true, drum: true };
    S.qj = { bpm: 112, wave: 'triangle', mel: [76, 77, 81, 0, 83, 81, 77, 76, 72, 0, 76, 77, 76, 0, 0, 0, 76, 77, 81, 83, 84, 83, 81, 77, 76, 72, 71, 72, 76, 0, 0, 0], bass: [40, 40, 45, 45, 41, 41, 40, 40], bw: 'sine', mv: 0.11, vib: true, pluck: true };
    S.qe = { bpm: 136, wave: 'square', mel: [76, 77, 80, 81, 83, 0, 81, 80, 77, 76, 0, 76, 77, 80, 77, 76, 83, 84, 86, 84, 83, 81, 80, 81, 80, 77, 76, 77, 76, 0, 0, 0], bass: [40, 40, 41, 41, 40, 40, 38, 40], bw: 'triangle', mv: 0.05, drum: true };
    S.qr = { bpm: 126, wave: 'square', mel: [72, 72, 76, 79, 79, 0, 76, 72, 74, 74, 77, 81, 81, 0, 79, 77, 76, 79, 84, 79, 76, 74, 72, 74, 76, 74, 72, 0, 72, 0, 0, 0], bass: [48, 55, 48, 55, 50, 57, 43, 48], bw: 'triangle', mv: 0.05, drum: true };
    S.qu = { bpm: 140, wave: 'triangle', mel: [79, 0, 79, 83, 86, 83, 79, 0, 81, 0, 81, 84, 88, 84, 81, 0, 83, 86, 91, 86, 83, 79, 81, 83, 79, 0, 74, 0, 79, 0, 0, 0], bass: [43, 50, 43, 50, 45, 52, 38, 43], bw: 'triangle', mv: 0.1, hat: true, pluck: true };
    S.qs = { bpm: 150, wave: 'square', mel: [69, 72, 76, 81, 76, 72, 69, 72, 67, 71, 74, 79, 74, 71, 67, 71, 65, 69, 72, 77, 72, 69, 65, 69, 64, 68, 71, 76, 71, 68, 64, 0], bass: [45, 45, 43, 43, 41, 41, 40, 40], bw: 'sawtooth', mv: 0.045, drum: true };
    S.qboss = { bpm: 168, wave: 'square', mel: [62, 62, 65, 62, 69, 0, 68, 69, 62, 62, 65, 62, 70, 0, 69, 67, 62, 62, 65, 62, 72, 0, 70, 69, 67, 65, 64, 65, 62, 0, 0, 0], bass: [38, 38, 38, 38, 34, 34, 36, 36], bw: 'sawtooth', mv: 0.055, drum: true };
    S.qboss2 = { bpm: 184, wave: 'square', mel: [62, 65, 69, 74, 72, 69, 65, 69, 61, 64, 69, 73, 72, 69, 64, 69, 62, 65, 70, 74, 72, 70, 67, 70, 69, 68, 66, 64, 62, 0, 62, 0], bass: [38, 38, 37, 37, 34, 34, 33, 33], bw: 'sawtooth', mv: 0.05, drum: true };
  }

  // ---------- 스테이지 10개 (아시아에서 서쪽으로, 마지막은 우주) ----------
  const STAGES = [
    { name: '정글 숲', en: 'JUNGLE', style: 'jungle', len: 2300, seed: 11, song: 'q1', sky: ['#0d2346', '#2e78b8', '#f7c56a'], sun: '#ffe9a8', far: '#2a5470', far2: '#2c6a6c', front: '#082a1a',
      top: '#5fd068', topHi: '#b4f58c', dirt: '#6b4226', dirt2: '#55331d', dot: '#83563a', pit: 'water', ambient: 'firefly', shot: '#a6ff5a', enemies: { walk: 'beetle', fly: 'bat', hop: 'frog', shoot: 'plant' }, boss: 'golem' },
    { name: '한국 궁궐', en: 'KOREA', style: 'korea', len: 2400, seed: 23, song: 'qk', sky: ['#1d2b5a', '#6b8fd8', '#ffd9a8'], sun: '#fff0c8', far: '#4a6a8a', far2: '#5f82a0', front: '#2a3a2a',
      top: '#d8cfc0', topHi: '#f4ecdc', dirt: '#8a7a64', dirt2: '#6e604c', dot: '#a89a82', pit: 'water', ambient: 'petal', shot: '#6ff7ff', enemies: { walk: 'imp', fly: 'magpie', hop: 'rabbit', shoot: 'archer' }, archer: '#2e6a8a', boss: 'dokkaebi' },
    { name: '중국 만리장성', en: 'CHINA', style: 'china', len: 2500, seed: 37, song: 'qc', sky: ['#2a1030', '#c0503a', '#ffc46a'], sun: '#ffe08a', far: '#7a4a5a', far2: '#9a6a6a', front: '#2a1010',
      top: '#b0a088', topHi: '#d8ccb4', dirt: '#7a6e5e', dirt2: '#625848', dot: '#948670', pit: 'mist', ambient: 'lantern', shot: '#ffd23a', enemies: { walk: 'clay', fly: 'lantern', hop: 'lion', shoot: 'archer' }, archer: '#b0302a', boss: 'terracotta' },
    { name: '일본 벚꽃 성', en: 'JAPAN', style: 'japan', len: 2500, seed: 41, song: 'qj', sky: ['#2a2060', '#e07aa0', '#ffe0ea'], sun: '#fff4f8', far: '#6a7ab8', far2: '#8a8ac8', front: '#3a1a2a',
      top: '#7ab85a', topHi: '#c8f0a0', dirt: '#7a5a3a', dirt2: '#5e442a', dot: '#ffb0d0', pit: 'water', ambient: 'petal', shot: '#ff7ac0', enemies: { walk: 'ninjaling', fly: 'crow', hop: 'tanuki', shoot: 'archer' }, archer: '#2a2a3a', boss: 'ninja' },
    { name: '이집트 피라미드', en: 'EGYPT', style: 'egypt', len: 2600, seed: 53, song: 'qe', sky: ['#2a4ac0', '#7ab8f0', '#ffe7a8'], sun: '#fff8d0', far: '#d8a85a', far2: '#c08a3a', front: '#8a5a20',
      top: '#f0c870', topHi: '#ffe3a0', dirt: '#d0a050', dirt2: '#b8883a', dot: '#e8b860', pit: 'sand', ambient: 'sand', shot: '#ffcf4a', enemies: { walk: 'mummy', fly: 'scarab', hop: 'jackal', shoot: 'cobra' }, boss: 'sphinx' },
    { name: '로마 콜로세움', en: 'ROME', style: 'rome', len: 2600, seed: 61, song: 'qr', sky: ['#2a3a7a', '#7aa0e0', '#ffd8b0'], sun: '#fff0d0', far: '#5a7a5a', far2: '#6e8e64', front: '#3a2a1a',
      top: '#e8e0d0', topHi: '#ffffff', dirt: '#b0a088', dirt2: '#988870', dot: '#f5c542', pit: 'water', ambient: 'dust', shot: '#ffe35a', enemies: { walk: 'legion', fly: 'eagle', hop: 'lion', shoot: 'archer' }, archer: '#b0302a', boss: 'gladiator' },
    { name: '영국 런던 거리', en: 'BRITAIN', style: 'uk', len: 2700, seed: 73, song: 'qu', sky: ['#1e2430', '#4a5468', '#8a94a8'], sun: null, far: '#2e3442', far2: '#3c4454', front: '#14161c',
      top: '#7a7a82', topHi: '#a8a8b0', dirt: '#55555e', dirt2: '#45454c', dot: '#8a8a94', pit: 'water', ambient: 'rain', shot: '#ffd86a', enemies: { walk: 'guard', fly: 'pigeon', hop: 'bulldog', shoot: 'cannon2' }, boss: 'clock' },
    { name: '화산 동굴', en: 'VOLCANO', style: 'volcano', len: 2700, seed: 27, song: 'q2', sky: ['#0e0205', '#3d0a0c', '#ff5a1a'], sun: '#ff9a3c', far: '#26090b', far2: '#3a0f10', front: '#100303',
      top: '#5a4664', topHi: '#ff8a3c', dirt: '#2b2230', dirt2: '#1c1622', dot: '#40324a', pit: 'lava', ambient: 'ember', shot: '#ff6a1a', enemies: { walk: 'slime', fly: 'firebat', hop: 'lavafish', shoot: 'turret' }, boss: 'dragon' },
    { name: '하늘 성', en: 'SKY CASTLE', style: 'sky', len: 2800, seed: 43, song: 'q3', sky: ['#160f4a', '#5a68dc', '#ffc4ea'], sun: '#fff3c4', far: '#7d82d6', far2: '#9b9fea', front: '#5d4fa8',
      top: '#f4f1ff', topHi: '#ffffff', dirt: '#9b8fd0', dirt2: '#8577c0', dot: '#f5c542', pit: 'void', ambient: 'sparkle', shot: '#58d8ff', enemies: { walk: 'knightbot', fly: 'bird', hop: 'orb', shoot: 'cannon' }, boss: 'knight' },
    { name: '우주 정거장', en: 'SPACE', style: 'space', len: 3000, seed: 89, song: 'qs', sky: ['#02010a', '#0a0a2a', '#2a1050'], sun: null, far: '#1a1440', far2: '#241a54', front: '#0a0a18',
      top: '#8a9ab8', topHi: '#d0e0ff', dirt: '#3a4058', dirt2: '#2a3048', dot: '#58d8ff', pit: 'space', ambient: 'star', shot: '#ff5ad8', enemies: { walk: 'alien', fly: 'ufo', hop: 'orb', shoot: 'sturret' }, boss: 'mothership' },
  ];

  // ---------- 주인공: 기존 모험가 (고글·스카프·배낭, 12×19, 발 가운데 기준) ----------
  // 2026-11-28: C안(스트리트 히어로)을 써 봤지만 사용자 의견 "기존이 더 낫다" 로 원래 모습으로 되돌림
  const JACKET = '#2f5d62'; const JACKET2 = '#3f7f84'; const PANTS = '#2a2d48'; const BOOT = '#6a3a1c';
  function drawHero(c, p, t) {
    const acc = p.accent; const acc2 = p.accent2;
    const ox = Math.round(p.x) - 6; const oy = Math.round(p.y) - 19 - (p.board ? 3 : 0);
    const air = !p.onGround; const run = Math.floor(p.anim * 0.67) % 4;
    const R = [];
    const wv = Math.sin(t * 18);
    R.push([-3, 10 + Math.round(wv), 3, 1, acc], [-6, 10 + Math.round(Math.sin(t * 18 - 1.2)), 3, 1, acc2], [-8, 11 + Math.round(Math.sin(t * 18 - 2.2)), 2, 1, acc]);
    R.push([0, 10, 2, 5, '#7a4a24'], [0, 10, 2, 1, '#9a6234']);
    let la; let lb; let ba; let bb;
    if (p.hurt > 0 || p.win) { la = [3, 15, 2, 3]; lb = [6, 15, 2, 3]; ba = [2, 18, 3, 1]; bb = [6, 18, 3, 1]; }
    else if (air) { la = [3, 14, 2, 3]; lb = [7, 15, 2, 2]; ba = [3, 17, 3, 1]; bb = [7, 17, 3, 1]; }
    else if (p.board) { la = [3, 15, 2, 3]; lb = [7, 15, 2, 3]; ba = [2, 18, 3, 1]; bb = [7, 18, 3, 1]; }
    else if (run === 0) { la = [2, 15, 2, 3]; lb = [8, 15, 2, 3]; ba = [1, 18, 3, 1]; bb = [8, 18, 3, 1]; }
    else if (run === 1) { la = [4, 15, 2, 2]; lb = [6, 15, 2, 3]; ba = [4, 17, 3, 1]; bb = [6, 18, 3, 1]; }
    else if (run === 2) { la = [8, 15, 2, 3]; lb = [2, 15, 2, 3]; ba = [8, 18, 3, 1]; bb = [1, 18, 3, 1]; }
    else { la = [6, 15, 2, 3]; lb = [4, 15, 2, 2]; ba = [6, 18, 3, 1]; bb = [4, 17, 3, 1]; }
    R.push([...la, PANTS], [...lb, PANTS], [...ba, BOOT], [...bb, BOOT]);
    R.push([2, 10, 8, 5, JACKET], [3, 10, 2, 5, JACKET2], [2, 14, 8, 1, '#3a2414'], [6, 14, 1, 1, '#ffcf4a']);
    R.push([2, 9, 8, 2, acc], [2, 9, 8, 1, acc2]);
    R.push([2, 3, 8, 6, SKIN], [2, 8, 8, 1, SKIN2], [3, 5, 1, 2, SKIN2]);
    R.push([1, 0, 9, 3, HAIR], [3, -1, 3, 1, HAIR], [7, -1, 2, 1, HAIR], [1, 3, 2, 3, HAIR]);
    R.push([2, 2, 8, 1, '#ffcf4a'], [7, 2, 3, 1, '#7fe3ff']);
    if (p.hurt > 0) R.push([7, 4, 1, 1, OUT], [8, 5, 1, 1, OUT], [7, 6, 1, 1, OUT], [8, 4, 1, 1, OUT]);
    else R.push([8, 4, 1, 2, OUT], [8, 7, 1, 1, p.win ? '#ffffff' : '#b0574a']);
    if (p.throwT > 0) R.push([8, 10, 4, 2, JACKET2], [12, 10, 1, 2, SKIN]);
    else if (p.win) R.push([7, 4, 2, 6, JACKET2], [7, 3, 2, 1, SKIN]);
    else if (air) R.push([7, 8, 2, 3, JACKET2], [7, 7, 2, 1, SKIN]);
    else { const sw = run === 0 || run === 3 ? 1 : -1; R.push([5 + sw, 11, 2, 3, JACKET2], [5 + sw, 14, 2, 1, SKIN]); }
    if (p.inv > 0 && Math.floor(t * 20) % 2 === 0) return;
    if (p.board) sprite(c, ox - 2, oy + 19, [[0, 0, 16, 2, '#e53b44'], [0, 0, 16, 1, '#ff7a7a'], [2, 2, 2, 2, '#222'], [12, 2, 2, 2, '#222']], false, undefined, 16);
    sprite(c, ox, oy, R, false);
    if (p.shield) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + Math.sin(t * 8) * 0.2; c.strokeStyle = '#6ff7ff'; c.beginPath(); c.arc(ox + 6, oy + 9, 13, 0, Math.PI * 2); c.stroke(); c.restore(); }
  }

  // ---------- (보관) C안 스트리트 히어로 16×24 — 지금은 쓰지 않음 ----------
  const SKIN = '#f3c39b'; const SKIN2 = '#d29a72'; const HAIR = '#3b2416'; const GLOVE = '#7fe3ff';
  function drawHeroC(c, p, t) {
    const acc = p.accent; const acc2 = p.accent2;
    const air = !p.onGround; const run = Math.floor(p.anim) % 6;
    const R = []; let bob = 0;
    const legC = '#3a3f58'; const legC2 = '#2c3046';
    const leg = (x, y, h, back) => { R.push([x, y, 2, h, back ? legC2 : legC], [x, y + h - 1, 2, 1, '#ffffff'], [x, y + h, 3, 2, '#f4f4f4'], [x, y + h + 1, 3, 1, acc]); };
    if (p.win) { leg(5, 18, 4, true); leg(9, 18, 4, false); }
    else if (p.hurt > 0) { leg(5, 18, 4, true); leg(8, 17, 4, false); }
    else if (air && p.vy < 0) { leg(5, 17, 3, true); leg(9, 16, 3, false); bob = -1; }
    else if (air) { leg(4, 18, 4, true); leg(10, 17, 4, false); }
    else if (p.board) { leg(5, 18, 4, true); leg(9, 18, 4, false); }
    else {
      const lo = [-3, -1, 1, 3, 1, -1][run]; bob = [0, -1, -1, 0, -1, -1][run];
      leg(7 - lo, 18 - (run === 4 || run === 5 ? 1 : 0), 4, true); leg(7 + lo, 18 - (run === 1 || run === 2 ? 1 : 0), 4, false);
    }
    const y = bob;
    R.push([5, 17 + y, 7, 2, legC]);
    R.push([4, 11 + y, 8, 7, acc], [4, 11 + y, 2, 7, acc2], [5, 15 + y, 6, 2, acc2], [7, 12 + y, 1, 3, '#ffffff'], [9, 12 + y, 1, 3, '#ffffff']);
    R.push([5, 4 + y, 7, 7, SKIN], [5, 10 + y, 7, 1, SKIN2], [6, 7 + y, 1, 2, SKIN2]);
    R.push([4, 3 + y, 2, 4, HAIR], [5, 1 + y, 7, 3, acc], [5, 1 + y, 7, 1, acc2], [11, 3 + y, 4, 1, acc], [7, 2 + y, 2, 1, '#ffffff']);
    if (p.hurt > 0) R.push([9, 5 + y, 1, 1, OUT], [11, 5 + y, 1, 1, OUT], [10, 6 + y, 1, 1, OUT], [9, 7 + y, 1, 1, OUT], [11, 7 + y, 1, 1, OUT]);
    else R.push([10, 6 + y, 1, 2, OUT], [9, 5 + y, 2, 1, HAIR], [10, 9 + y, 2, 1, p.win ? '#ffffff' : '#b0574a']);
    let hx; let hy;
    if (p.throwT > 0) { R.push([9, 12 + y, 5, 2, acc2], [14, 12 + y, 2, 2, GLOVE]); hx = 15; hy = 13 + y; }
    else if (p.win) { R.push([9, 5 + y, 2, 7, acc2], [9, 3 + y, 2, 2, GLOVE]); hx = 10; hy = 4 + y; }
    else if (air) { R.push([9, 10 + y, 2, 3, acc2], [10, 8 + y, 2, 2, GLOVE]); hx = 11; hy = 9 + y; }
    else { const sw = [1, 0, -1, -1, 0, 1][run]; R.push([8 + sw, 13 + y, 2, 4, acc2], [8 + sw, 17 + y, 2, 2, GLOVE]); hx = 9 + sw; hy = 18 + y; }
    if (p.inv > 0 && Math.floor(t * 20) % 2 === 0) return;
    const ox = Math.round(p.x) - 8; const oy = Math.round(p.y) - 24 - (p.board ? 3 : 0);
    if (p.board) sprite(c, ox - 1, oy + 24, [[0, 0, 18, 2, '#e53b44'], [0, 0, 18, 1, '#ff7a7a'], [3, 2, 2, 2, '#222'], [13, 2, 2, 2, '#222']], false, undefined, 18);
    sprite(c, ox, oy, R, false, undefined, 16);
    glow(c, ox + hx, oy + hy, p.throwT > 0 ? 6 : 3.5, GLOVE, 0.35 + 0.15 * Math.sin(t * 10));
    if (p.shield) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + Math.sin(t * 8) * 0.2; c.strokeStyle = '#6ff7ff'; c.beginPath(); c.arc(ox + 8, oy + 12, 15, 0, Math.PI * 2); c.stroke(); c.restore(); }
  }

  // ---------- 적 (왼쪽을 봄) ----------
  function enemyRects(kind, f, st) {
    const a = f % 2;
    const wings = (cl) => [a ? [-3, 0, 7, 3, cl] : [-3, 4, 7, 3, cl], a ? [10, 0, 7, 3, cl] : [10, 4, 7, 3, cl]];
    switch (kind) {
      case 'beetle': return [[1, 3, 12, 6, '#2f9e6b'], [3, 1, 8, 2, '#45c98d'], [4, 3, 2, 2, '#1f6e4a'], [8, 4, 2, 2, '#1f6e4a'], [0, 5, 3, 4, '#24343a'], [0, 6, 1, 1, '#ffef5a'], [2 + a, 9, 2, 2, '#24343a'], [7 - a, 9, 2, 2, '#24343a'], [11, 9, 2, 2, '#24343a']];
      case 'slime': return [[1, 3 + a, 12, 7 - a, '#ff7a2a'], [3, 1 + a, 8, 2, '#ffb15a'], [3, 4 + a, 2, 2, '#fff'], [3, 5 + a, 1, 1, OUT], [8, 4 + a, 2, 2, '#fff'], [8, 5 + a, 1, 1, OUT], [5, 8, 4, 1, '#a8320f']];
      case 'knightbot': return [[2, 1, 10, 9, '#b9c2d6'], [2, 1, 10, 2, '#e5e9f2'], [3, 4, 8, 2, OUT], [4, 4, 2, 2, '#58d8ff'], [1, 10, 12, 1, '#8a93ab'], [3 + a, 11, 2, 2, '#5a6278'], [9 - a, 11, 2, 2, '#5a6278'], [0, 3, 2, 6, '#f5c542']];
      case 'bat': return [[4, 2, 6, 5, '#6b3fa0'], [5, 3, 1, 1, '#ffef5a'], [8, 3, 1, 1, '#ffef5a'], ...wings('#4b2a78')];
      case 'firebat': return [[4, 2, 6, 5, '#c0262a'], [5, 3, 1, 1, '#ffe35a'], [8, 3, 1, 1, '#ffe35a'], ...wings('#ff7a2a'), [6, 7, 2, 2, '#ffb15a']];
      case 'bird': return [[2, 3, 9, 5, '#4fa3ff'], [0, 4, 3, 2, '#ffcf4a'], [3, 4, 1, 1, OUT], [10, 2, 4, 2, '#2f6fd0'], a ? [4, 0, 6, 3, '#9ed2ff'] : [4, 7, 6, 3, '#9ed2ff']];
      case 'frog': return [[1, 4 - a, 12, 6, '#7bd34a'], [2, 2 - a, 3, 3, '#7bd34a'], [9, 2 - a, 3, 3, '#7bd34a'], [3, 3 - a, 1, 1, OUT], [10, 3 - a, 1, 1, OUT], [3, 7 - a, 8, 1, '#3d8a22'], [0, 9, 3, 2, '#5aa832'], [11, 9, 3, 2, '#5aa832']];
      case 'lavafish': return [[1, 2, 11, 7, '#ff8a1a'], [3, 1, 6, 1, '#ffd23a'], [2, 4, 2, 2, '#fff'], [2, 4, 1, 1, OUT], [11, 1, 4, 3, '#ff5a1a'], [11, 6, 4, 3, '#ff5a1a'], [0, 6, 3, 1, '#a8320f']];
      case 'orb': return [[2, 2, 9, 9, st && st.style === 'space' ? '#ff5ad8' : '#ffe35a'], [4, 1, 5, 1, '#fff7b0'], [1, 4, 1, 5, '#ffe35a'], [11, 4, 1, 5, '#ffe35a'], [4, 4, 2, 2, OUT], [8, 4, 2, 2, OUT], a ? [5, 8, 3, 1, OUT] : [5, 8, 3, 1, '#c08a00']];
      case 'plant': return [[5, 7, 3, 7, '#2e8a3a'], [1, 9, 4, 2, '#3fb04a'], [8, 10, 4, 2, '#3fb04a'], [1, 0, 11, 7, '#e0304a'], [1, 0, 11, 2, '#ff6a7a'], [0, 3 + a, 5, 2, '#fff'], [3, 2, 2, 2, '#fff7d6'], [8, 2, 2, 2, '#fff7d6']];
      case 'turret': return [[1, 3, 12, 11, '#3a2e40'], [2, 3, 10, 2, '#5a4664'], [0, 6, 4, 4, '#1c1622'], [1, 7, 2, 2, a ? '#ff8a1a' : '#ffd23a'], [4, 5, 2, 2, '#ff5a1a'], [9, 5, 2, 2, '#ff5a1a']];
      case 'cannon': return [[2, 5, 11, 9, '#f4f1ff'], [2, 5, 11, 2, '#fff'], [0, 7, 5, 4, '#9b8fd0'], [0, 8, 1, 2, a ? '#58d8ff' : '#fff'], [5, 12, 7, 2, '#f5c542'], [6, 8, 2, 2, '#5d4fa8']];
      case 'cannon2': return [[3, 6, 11, 6, '#3a3a42'], [0, 7, 4, 4, '#1a1a22'], [0, 8, 1, 2, a ? '#ffd86a' : '#ff8a3c'], [4, 11, 4, 4, '#6a4a2a'], [10, 11, 4, 4, '#6a4a2a'], [5, 12, 2, 2, '#3a2a1a'], [11, 12, 2, 2, '#3a2a1a'], [8, 4, 3, 2, '#5a5a62']];
      case 'sturret': return [[1, 5, 12, 9, '#5a6278'], [1, 5, 12, 2, '#8a9ab8'], [0, 7, 5, 4, '#3a4058'], [0, 8, 1, 2, a ? '#ff5ad8' : '#58d8ff'], [5, 12, 7, 2, '#58d8ff']];
      case 'imp': return [[3, 3, 8, 8, '#e0503a'], [3, 3, 8, 2, '#ff7a5a'], [6, 0, 2, 3, '#f3e0c0'], [4, 5, 2, 2, '#ffe35a'], [8, 5, 2, 2, '#ffe35a'], [4, 6, 1, 1, OUT], [8, 6, 1, 1, OUT], [5, 9, 4, 1, '#fff'], [0, 3 - a, 2, 8, '#8a5a2a'], [3 + a, 11, 2, 2, '#a8322a'], [8 - a, 11, 2, 2, '#a8322a']];
      case 'magpie': return [[2, 3, 9, 4, '#1a1a2a'], [5, 4, 5, 3, '#ffffff'], [0, 4, 3, 1, '#2a2a3a'], [10, 3, 5, 2, '#1a1a2a'], [3, 4, 1, 1, '#fff'], a ? [4, 0, 6, 3, '#2a3a6a'] : [4, 7, 6, 3, '#2a3a6a']];
      case 'rabbit': return [[2, 5, 9, 6, '#f4f1ff'], [3, 0 + a, 2, 5, '#f4f1ff'], [6, 0 + a, 2, 5, '#f4f1ff'], [3, 1 + a, 1, 3, '#ffb0c8'], [6, 1 + a, 1, 3, '#ffb0c8'], [3, 7, 1, 1, OUT], [1, 8, 2, 1, '#ff9ab0'], [9, 9, 3, 2, '#e0dcf0']];
      case 'archer': { const cl = (st && st.archer) || '#3a6ab8'; return [[3, 0, 6, 3, '#2a2a3a'], [2, 2, 8, 1, '#2a2a3a'], [3, 3, 6, 4, '#f3c39b'], [4, 4, 1, 1, OUT], [2, 7, 8, 6, cl], [2, 7, 8, 1, '#ffffff'], [0, 4, 2, 8, '#8a5a2a'], [0, 5, 1, 6, '#e9e0c8'], [3, 13, 2, 1, '#2a2a3a'], [7, 13, 2, 1, '#2a2a3a']]; }
      case 'clay': return [[3, 0, 6, 3, '#8a5a3a'], [3, 3, 6, 4, '#c98a5a'], [4, 4, 1, 1, OUT], [2, 7, 8, 6, '#a8683a'], [2, 9, 8, 1, '#7a4a2a'], [2, 11, 8, 1, '#7a4a2a'], [0, -2, 1, 14, '#6a4a2a'], [-1, -4, 3, 2, '#c9c9c9'], [3 + a, 13, 2, 2, '#7a4a2a'], [7 - a, 13, 2, 2, '#7a4a2a']];
      case 'lantern': return [[3, 1, 8, 9, '#e0302a'], [3, 1, 8, 1, '#ffd23a'], [3, 9, 8, 1, '#ffd23a'], [6, 10, 2, 3, '#ffd23a'], [5, 4, 1, 2, OUT], [8, 4, 1, 2, OUT], [6, 7 - a, 2, 1, OUT], [6, 0, 2, 1, '#3a2a1a']];
      case 'lion': return [[1, 2, 12, 9, '#e0302a'], [1, 2, 12, 2, '#ffd23a'], [3, 4, 2, 2, '#fff'], [9, 4, 2, 2, '#fff'], [4, 5, 1, 1, OUT], [10, 5, 1, 1, OUT], [4, 8, 6, 2, '#fff'], [0, 1, 3, 4, '#ffd23a'], [11, 1, 3, 4, '#ffd23a'], [3, 11, 8, 1, '#3a8a3a'], [5, 0, 4, 2, '#3a8a3a']];
      case 'ninjaling': return [[3, 0, 8, 5, '#1a1f3a'], [4, 2, 6, 2, '#f3c39b'], [5, 2, 1, 1, OUT], [8, 2, 1, 1, OUT], [3, 5, 8, 6, '#1a1f3a'], [3, 7, 8, 1, '#c0392b'], [11, 3 + a, 3, 1, '#c0392b'], [3 + a, 11, 2, 2, '#1a1f3a'], [8 - a, 11, 2, 2, '#1a1f3a']];
      case 'crow': return [[3, 2, 8, 5, '#1a1a24'], [0, 4, 3, 1, '#ffcf4a'], [4, 3, 1, 1, '#ff4a4a'], [10, 3, 4, 2, '#1a1a24'], ...wings('#2a2a3a')];
      case 'tanuki': return [[1, 4, 12, 7, '#8a6a4a'], [2, 2, 3, 3, '#8a6a4a'], [9, 2, 3, 3, '#8a6a4a'], [3, 5, 8, 2, '#3a2a1a'], [4, 5, 1, 1, '#fff'], [9, 5, 1, 1, '#fff'], [5, 8, 4, 3, '#e9d8b8'], [12, 6, 3, 4, '#6a4a2a'], [13, 7, 2, 1, '#3a2a1a']];
      case 'mummy': return [[3, 0, 8, 13, '#e8dcc0'], [3, 2, 8, 1, '#c8b898'], [3, 5, 8, 1, '#c8b898'], [3, 8, 8, 1, '#c8b898'], [3, 11, 8, 1, '#c8b898'], [4, 3, 2, 1, '#7dff5a'], [8, 3, 2, 1, '#7dff5a'], [0, 5 + a, 3, 2, '#e8dcc0'], [10, 13, 3, 1, '#e8dcc0'], [3 + a, 13, 2, 2, '#c8b898'], [8 - a, 13, 2, 2, '#c8b898']];
      case 'scarab': return [[3, 2, 8, 6, '#2a6ab8'], [3, 2, 8, 2, '#58d8ff'], [6, 2, 1, 6, '#1a3a6a'], [1, 5, 2, 1, '#2a2a2a'], [11, 5, 2, 1, '#2a2a2a'], [1, 3, 2, 2, '#f5c542'], a ? [2, -1, 10, 2, 'rgba(200,240,255,.7)'] : [2, 0, 10, 1, 'rgba(200,240,255,.7)']];
      case 'jackal': return [[1, 4, 12, 5, '#3a2a1a'], [0, 1, 4, 4, '#3a2a1a'], [1, -1, 1, 2, '#3a2a1a'], [3, -1, 1, 2, '#3a2a1a'], [1, 2, 1, 1, '#ffcf4a'], [3, 4, 2, 2, '#f5c542'], [2, 9, 2, 2, '#3a2a1a'], [10, 9, 2, 2, '#3a2a1a'], [12, 3, 3, 1, '#3a2a1a']];
      case 'cobra': return [[4, 9, 8, 5, '#c8a03a'], [6, 3, 4, 7, '#c8a03a'], [4, 1, 8, 4, '#c8a03a'], [5, 2, 6, 2, '#8a6a2a'], [6, 3, 1, 1, '#ff3a3a'], [9, 3, 1, 1, '#ff3a3a'], [2, 4, 2, 1, a ? '#ff5a7a' : '#c8a03a']];
      case 'legion': return [[4, 0, 6, 3, '#c08a3a'], [6, -2, 2, 2, '#e0302a'], [4, 3, 6, 3, '#f3c39b'], [5, 4, 1, 1, OUT], [3, 6, 8, 6, '#b0302a'], [3, 6, 8, 1, '#c08a3a'], [0, 4, 4, 9, '#c0302a'], [1, 7, 2, 2, '#f5c542'], [4 + a, 12, 2, 2, '#6a4a2a'], [8 - a, 12, 2, 2, '#6a4a2a']];
      case 'eagle': return [[2, 3, 10, 5, '#7a4a24'], [0, 3, 3, 3, '#ffffff'], [-1, 4, 2, 1, '#ffcf4a'], [1, 4, 1, 1, OUT], [11, 4, 3, 2, '#5a3418'], ...wings('#5a3418')];
      case 'guard': return [[4, -4, 6, 7, '#1a1a1a'], [4, 3, 6, 3, '#f3c39b'], [5, 4, 1, 1, OUT], [3, 6, 8, 6, '#d0202a'], [3, 9, 8, 1, '#f5c542'], [6, 6, 1, 6, '#f5c542'], [0, 2 - a, 1, 10, '#8a8a94'], [3 + a, 12, 2, 2, '#1a1a3a'], [8 - a, 12, 2, 2, '#1a1a3a']];
      case 'pigeon': return [[2, 3, 9, 5, '#8a8aa0'], [0, 3, 3, 3, '#6a6a80'], [-1, 4, 1, 1, '#ffcf4a'], [1, 4, 1, 1, '#ff5a3a'], [3, 5, 4, 2, '#7ac8a0'], [10, 4, 4, 2, '#6a6a80'], ...wings('#a8a8c0')];
      case 'bulldog': return [[1, 4, 12, 7, '#c8a070'], [0, 2, 6, 6, '#c8a070'], [1, 4, 1, 1, OUT], [0, 6, 4, 2, '#8a6a4a'], [1, 7, 2, 1, '#fff'], [5, 2, 2, 2, '#8a6a4a'], [2 + a, 11, 2, 2, '#a8805a'], [9 - a, 11, 2, 2, '#a8805a'], [12, 5, 2, 2, '#a8805a']];
      case 'alien': return [[2, 3, 10, 9, '#5ad86a'], [2, 3, 10, 2, '#9affa0'], [6, 0, 1, 3, '#5ad86a'], [5, -1, 3, 1, '#ff5ad8'], [3, 5, 6, 4, '#fff'], [4, 6, 2, 2, OUT], [3 + a, 12, 2, 2, '#3a9a4a'], [8 - a, 12, 2, 2, '#3a9a4a']];
      case 'ufo': return [[0, 5, 14, 3, '#b0b8d0'], [3, 2, 8, 3, '#58d8ff'], [5, 1, 4, 1, '#9af0ff'], [1, 6, 2, 1, a ? '#ff5ad8' : '#ffe35a'], [6, 6, 2, 1, a ? '#ffe35a' : '#ff5ad8'], [11, 6, 2, 1, a ? '#ff5ad8' : '#ffe35a'], [6, 3, 2, 1, '#5ad86a']];
      default: return [[0, 0, 12, 10, '#f0f']];
    }
  }
  const ESIZE = { beetle: [13, 11], slime: [13, 10], knightbot: [13, 13], bat: [14, 8], firebat: [14, 9], bird: [14, 9], frog: [13, 11], lavafish: [14, 9], orb: [12, 12], plant: [12, 14], turret: [13, 14], cannon: [13, 14], cannon2: [14, 15], sturret: [13, 14],
    imp: [12, 13], magpie: [14, 9], rabbit: [12, 11], archer: [10, 14], clay: [10, 15], lantern: [12, 13], lion: [14, 12], ninjaling: [12, 13], crow: [14, 8], tanuki: [14, 11], mummy: [12, 15], scarab: [14, 8], jackal: [14, 11], cobra: [12, 14],
    legion: [12, 14], eagle: [14, 9], guard: [12, 14], pigeon: [14, 9], bulldog: [14, 13], alien: [12, 14], ufo: [14, 8] };

  // 과일 7×7 (사과·바나나·포도·수박)
  const FRUIT = [
    [[2, 1, 3, 1, '#3fb04a'], [1, 2, 5, 4, '#e8323c'], [2, 2, 1, 1, '#ff9a9a'], [2, 6, 3, 1, '#b01e28']],
    [[1, 1, 2, 2, '#f5d23a'], [2, 3, 2, 2, '#f5d23a'], [3, 4, 3, 2, '#f5d23a'], [4, 5, 2, 1, '#c09a12'], [0, 0, 2, 1, '#6a4a1a']],
    [[3, 0, 1, 1, '#3fb04a'], [2, 1, 3, 2, '#8a3fd0'], [1, 3, 5, 2, '#8a3fd0'], [2, 5, 3, 1, '#8a3fd0'], [2, 1, 1, 1, '#c49aff']],
    [[0, 2, 7, 3, '#3fb04a'], [1, 1, 5, 2, '#ff4a5a'], [2, 1, 1, 1, OUT], [4, 2, 1, 1, OUT], [0, 4, 7, 1, '#2a7a32']],
  ];

  // ---------- 배경 ----------
  function makeScene(st, rngf) {
    const ridge = (n, base, amp) => { const a = []; let v = 0; for (let i = 0; i < n; i++) { v = v * 0.7 + (rngf() - 0.5) * amp; a.push(base + v + Math.sin(i / 3) * amp * 0.3); } return a; };
    const sharp = st.style === 'china';
    const midObjs = []; for (let i = 0; i < 14; i++) midObjs.push({ x: i * 46 + rngf() * 20, h: 40 + rngf() * 50, k: rngf(), w: 18 + rngf() * 16 });
    const frontObjs = []; for (let i = 0; i < 10; i++) frontObjs.push({ x: i * 70 + rngf() * 30, h: 10 + rngf() * 18, k: rngf() });
    const amb = []; for (let i = 0; i < 30; i++) amb.push({ x: rngf() * W, y: rngf() * H, s: rngf(), ph: rngf() * 6 });
    return { farR: ridge(60, sharp ? 90 : 96, sharp ? 44 : 26), far2R: ridge(60, 118, sharp ? 30 : 20), midObjs, frontObjs, amb };
  }
  function ridgeDraw(c, arr, camX, f, col, step) {
    c.fillStyle = col; const off = camX * f; const per = arr.length * step;
    for (let x = -step; x < W + step; x += 2) {
      const wx = x + off; const m = ((wx % per) + per) % per; const i = Math.floor(m / step); const j = (i + 1) % arr.length;
      const fr = (m % step) / step; const yy = Math.round(arr[i] * (1 - fr) + arr[j] * fr);
      c.fillRect(x, yy, 2, H - yy);
    }
    return (x) => { const wx = x + off; const m = ((wx % per) + per) % per; const i = Math.floor(m / step); const j = (i + 1) % arr.length; const fr = (m % step) / step; return arr[i] * (1 - fr) + arr[j] * fr; };
  }
  function drawFar(c, st, sc, camX, t) {
    const s = st.style;
    if (s === 'space') {
      // 성운 + 고리 행성
      c.save(); c.globalCompositeOperation = 'lighter';
      [[60, 70, 70, '#5a2a9a'], [220, 50, 90, '#1a5a8a'], [300, 120, 60, '#8a2a6a']].forEach(([x, y, r, col], i) => { const xx = ((x - camX * 0.04) % 420 + 420) % 420 - 50; for (let k = 3; k > 0; k--) { c.globalAlpha = 0.07; c.fillStyle = col; c.beginPath(); c.arc(xx, y + i * 4, r * k / 3, 0, Math.PI * 2); c.fill(); } });
      c.restore();
      const px = 250 - (camX * 0.02) % 60; c.fillStyle = '#c87a4a'; c.beginPath(); c.arc(px, 62, 22, 0, Math.PI * 2); c.fill(); c.fillStyle = '#e8a06a'; c.beginPath(); c.arc(px - 6, 56, 12, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#f0d8a8'; c.lineWidth = 2; c.beginPath(); c.ellipse(px, 62, 38, 8, -0.3, 0, Math.PI * 2); c.stroke();
      ridgeDraw(c, sc.far2R, camX, 0.25, st.far2, 10);
      return;
    }
    if (s === 'egypt') {
      ridgeDraw(c, sc.farR.map((v) => v + 30), camX, 0.08, '#e8c080', 14);
      [[40, 70, 52], [150, 46, 36], [260, 60, 44]].forEach(([x, h, w], i) => {
        const xx = ((x - camX * (0.12 + i * 0.02)) % 420 + 420) % 420 - 60; const base = 150;
        for (let k = 0; k < h; k += 2) { const ww = w * (1 - k / h); c.fillStyle = st.far; c.fillRect(Math.round(xx - ww), base - k, Math.round(ww), 2); c.fillStyle = st.far2; c.fillRect(Math.round(xx), base - k, Math.round(ww), 2); }
      });
      return;
    }
    if (s === 'uk') {
      const per = 600;
      for (let i = 0; i < 24; i++) { const x = ((i * 25 - camX * 0.15) % per + per) % per - 30; const h = 30 + Math.floor(hash(i) * 45); c.fillStyle = st.far; c.fillRect(Math.round(x), 150 - h, 22, h); c.fillStyle = 'rgba(255,216,106,.35)'; for (let wy = 150 - h + 4; wy < 146; wy += 6) for (let wx = 3; wx < 20; wx += 6) if (hash(i * 31 + wy + wx) > 0.55) c.fillRect(Math.round(x) + wx, wy, 2, 3); }
      for (let i = 0; i < 18; i++) { const x = ((i * 34 - camX * 0.3) % per + per) % per - 30; const h = 20 + Math.floor(hash(i + 50) * 35); c.fillStyle = st.far2; c.fillRect(Math.round(x), 160 - h, 28, h); c.fillStyle = '#1e2430'; c.fillRect(Math.round(x), 160 - h, 28, 2); }
      return;
    }
    ridgeDraw(c, sc.farR, camX, 0.12, st.far, 12);
    if (s === 'japan') {   // 눈 덮인 큰 산
      const fx = 200 - (camX * 0.05) % 500; const top = 52;
      for (let k = 0; k < 100; k += 2) { const ww = 12 + k * 0.95; c.fillStyle = k < 22 ? '#ffffff' : '#7a86c8'; c.fillRect(Math.round(fx - ww), top + k, Math.round(ww * 2), 2); }
    }
    const f2 = ridgeDraw(c, sc.far2R, camX, 0.25, st.far2, 10);
    if (s === 'china') {   // 산등성이 따라 이어진 성벽
      c.fillStyle = '#c0a888';
      for (let x = 0; x < W; x += 2) { const yy = Math.round(f2(x)) - 4; c.fillRect(x, yy, 2, 4); if (Math.floor((x + camX * 0.25) / 6) % 2 === 0) c.fillRect(x, yy - 2, 2, 2); }
    }
  }
  function drawSky(c, st, t, camX) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, st.sky[0]); g.addColorStop(0.62, st.sky[1]); g.addColorStop(1, st.sky[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (st.style === 'space' || st.style === 'uk') {
      if (st.style === 'space') for (let i = 0; i < 70; i++) { c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i)); c.fillStyle = i % 7 ? '#ffffff' : '#9af0ff'; c.fillRect(Math.round(((hash(i) * 340 - camX * 0.02) % 330 + 330) % 330), Math.round(hash(i + 9) * 150), 1, 1); }
      c.globalAlpha = 1;
      if (st.style === 'uk') { c.fillStyle = 'rgba(200,210,230,.12)'; for (let i = 0; i < 5; i++) { const x = ((i * 90 - camX * 0.05 - t * 4) % 450 + 450) % 450 - 60; c.beginPath(); c.ellipse(x, 30 + i * 9, 60, 10, 0, 0, Math.PI * 2); c.fill(); } }
      return;
    }
    const sx = 230 - (camX * 0.02) % 40; const sy = st.pit === 'lava' ? 150 : 60;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let r = 46; r > 0; r -= 8) { c.globalAlpha = 0.06; c.fillStyle = st.sun; c.beginPath(); c.arc(sx, sy, r + Math.sin(t * 2) * 2, 0, Math.PI * 2); c.fill(); }
    c.restore();
    if (st.pit !== 'lava') { c.fillStyle = st.sun; c.beginPath(); c.arc(sx, sy, st.style === 'egypt' ? 20 : 16, 0, Math.PI * 2); c.fill(); }
    if (st.style === 'sky' || st.style === 'egypt') {
      c.save(); c.globalAlpha = 0.08; c.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) { const a = t * 0.15 + i * 1.26; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a) * 300, sy + Math.sin(a) * 300); c.lineTo(sx + Math.cos(a + 0.12) * 300, sy + Math.sin(a + 0.12) * 300); c.fill(); }
      c.restore();
    }
  }
  // 중간 겹 하나 그리기 (스테이지별)
  function midObj(c, st, o, x, base, t) {
    const R = (cl, a, b, w, h) => { c.fillStyle = cl; c.fillRect(Math.round(x + a), Math.round(base + b), w, h); };
    switch (st.style) {
      case 'jungle':
        R('#3a2a1a', o.w / 2 - 2, -o.h, 4, o.h);
        c.fillStyle = '#18573a'; c.beginPath(); c.arc(x + o.w / 2, base - o.h, o.w * 0.9, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#2a8a52'; c.beginPath(); c.arc(x + o.w / 2 - 4, base - o.h - 4, o.w * 0.5, 0, Math.PI * 2); c.fill();
        if (o.k > 0.6) for (let k = 0; k < 4; k++) R('#2a8a52', o.w / 2 + k * 3 - 5, -o.h + 6, 1, 18 + k * 4);
        break;
      case 'volcano':
        R('#3a1212', 0, -o.h, o.w, o.h); R('#6e2017', 0, -o.h, 3, o.h);
        if (o.k > 0.55) { R('#ff6a1a', o.w / 2 - 3, -o.h, 6, o.h); c.fillStyle = '#ffd23a'; for (let y2 = 0; y2 < o.h; y2 += 6) c.fillRect(Math.round(x + o.w / 2 - 3 + ((y2 / 6 + Math.floor(t * 10)) % 3) * 2), Math.round(base - o.h + y2), 1, 3); }
        break;
      case 'sky':
        if (o.k > 0.5) { R('#c9c2f0', 0, -o.h - 20, 14, o.h + 20); R('#a99fe0', 10, -o.h - 20, 4, o.h + 20); c.fillStyle = '#7a62c8'; c.beginPath(); c.moveTo(x - 3, base - o.h - 20); c.lineTo(x + 7, base - o.h - 36); c.lineTo(x + 17, base - o.h - 20); c.fill(); R('#ffe35a', 5, -o.h - 8, 4, 6); }
        c.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x + k * 10 + 8, base - 10 + (k % 2) * 4, 12, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#ffe1f4'; c.beginPath(); c.arc(x + 14, base - 16, 8, 0, Math.PI * 2); c.fill();
        break;
      case 'korea':
        if (o.k < 0.5) {   // 한옥 대문: 기둥, 흰 벽, 단청, 기와지붕
          const w = 38; const h = 24 + Math.floor(o.h / 6);
          R('#e8dcc0', 6, -h + 6, w - 12, h - 6); R('#b8a888', 6, -6, w - 12, 6);
          R('#c0392b', 4, -h, 3, h); R('#c0392b', w - 7, -h, 3, h);
          R('#2e8a6a', 0, -h - 4, w, 4); for (let k = 2; k < w - 2; k += 6) R('#ff7a5a', k, -h - 3, 2, 2);
          R('#3a3a4a', -5, -h - 9, w + 10, 5); R('#5a5a6a', -5, -h - 9, w + 10, 1); R('#3a3a4a', 1, -h - 14, w - 2, 5); R('#5a5a6a', 1, -h - 14, w - 2, 1);
          R('#3a3a4a', -8, -h - 11, 4, 2); R('#3a3a4a', w + 4, -h - 11, 4, 2); R('#6a6a7a', w / 2 - 6, -h - 16, 12, 2);
        } else {   // 소나무
          R('#8a4a2a', 12, -o.h, 3, o.h); R('#8a4a2a', 9, -o.h - 8, 3, 10);
          c.fillStyle = '#2a6a3a'; [[0, -o.h - 6, 22], [8, -o.h - 18, 18], [14, -o.h + 10, 16]].forEach(([dx, dy, w]) => { c.beginPath(); c.ellipse(x + dx + w / 2, base + dy, w / 2 + 4, 5, 0, 0, Math.PI * 2); c.fill(); });
          c.fillStyle = '#3a8a4a'; c.beginPath(); c.ellipse(x + 10, base - o.h - 8, 8, 2, 0, 0, Math.PI * 2); c.fill();
        }
        break;
      case 'china':
        if (o.k < 0.4) {   // 탑
          for (let k = 0; k < 3; k++) { const w = 26 - k * 6; const yy = -12 - k * 14; R('#b0302a', (30 - w) / 2, yy, w, 12); R('#ffd23a', (30 - w) / 2 + 2, yy + 3, 2, 4); R('#ffd23a', (30 + w) / 2 - 4, yy + 3, 2, 4); R('#2a5a3a', (30 - w) / 2 - 5, yy - 3, w + 10, 3); R('#2a5a3a', (30 - w) / 2 - 7, yy - 5, 3, 2); R('#2a5a3a', (30 + w) / 2 + 4, yy - 5, 3, 2); }
          R('#ffd23a', 14, -60, 2, 10);
        } else {   // 성벽 + 등불
          R('#a89a82', 0, -20, 46, 20); R('#c0b098', 0, -20, 46, 2); for (let k = 0; k < 46; k += 8) R('#a89a82', k, -25, 5, 5); for (let k = 4; k < 46; k += 12) R('#8a7e68', k, -14, 6, 1);
          c.strokeStyle = '#3a2a1a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, base - 34); c.quadraticCurveTo(x + 23, base - 26, x + 46, base - 34); c.stroke();
          for (let k = 8; k < 44; k += 12) { const sw = Math.sin(t * 2 + k) * 1; R('#e0302a', k + sw, -32, 5, 6); R('#ffd23a', k + sw, -32, 5, 1); }
        }
        break;
      case 'japan':
        if (o.k < 0.28) {   // 성
          R('#f4f1ea', 2, -26, 30, 26); R('#3a4058', -2, -30, 38, 4); R('#f4f1ea', 7, -44, 20, 14); R('#3a4058', 3, -48, 28, 4); R('#f4f1ea', 11, -58, 12, 10); R('#3a4058', 8, -62, 18, 4);
          R('#ffd23a', 8, -64, 2, 2); R('#ffd23a', 24, -64, 2, 2); for (let k = 6; k < 30; k += 8) R('#2a2a3a', k, -20, 3, 4); R('#8a8a94', 0, -6, 34, 6);
        } else if (o.k < 0.55) {   // 붉은 문
          R('#d0302a', 4, -34, 3, 34); R('#d0302a', 25, -34, 3, 34); R('#1a1a24', -2, -38, 36, 3); R('#d0302a', 0, -35, 32, 2); R('#d0302a', 2, -28, 28, 2); R('#1a1a24', 14, -34, 4, 6);
        } else {   // 벚나무
          R('#4a2a2a', 12, -o.h * 0.7, 4, o.h * 0.7);
          [['#ffb0d0', 0, -o.h * 0.7 - 4, 14], ['#ff8ab8', 14, -o.h * 0.7 - 10, 12], ['#ffc8e0', 22, -o.h * 0.7, 10]].forEach(([cl, dx, dy, r]) => { c.fillStyle = cl; c.beginPath(); c.arc(x + dx + 6, base + dy, r, 0, Math.PI * 2); c.fill(); });
        }
        break;
      case 'egypt':
        if (o.k < 0.45) {   // 야자수
          for (let k = 0; k < o.h * 0.8; k += 4) R(k % 8 ? '#a8783a' : '#8a5a2a', 10 + Math.sin(k / 18) * 4, -k - 4, 4, 4);
          const tx = x + 12 + Math.sin(o.h * 0.8 / 18) * 4; const ty = base - o.h * 0.8 - 4; c.strokeStyle = '#3a8a3a'; c.lineWidth = 3;
          for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.55 + Math.sin(t * 1.5 + k) * 0.05; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * 12, ty + Math.sin(a) * 12 - 4, tx + Math.cos(a) * 20, ty + Math.sin(a) * 20 + 6); c.stroke(); }
        } else if (o.k < 0.72) {   // 오벨리스크
          const h = 30 + o.h * 0.5; for (let k = 0; k < h; k += 2) { const w = 10 - (k / h) * 4; R('#d8b070', 10 - w / 2, -k - 2, w, 2); }
          R('#ffd23a', 7, -h - 4, 6, 4); for (let k = 8; k < h - 4; k += 7) R('#a8803a', 9, -k, 2, 3);
        } else {   // 기둥
          R('#e0c890', 4, -40, 12, 40); R('#c8a870', 13, -40, 3, 40); R('#e8d4a0', 0, -44, 20, 4); R('#2a5ab8', 4, -36, 12, 2); R('#c0302a', 4, -33, 12, 1);
        }
        break;
      case 'rome':
        if (o.k < 0.45) {   // 기둥과 지붕돌
          [0, 22].forEach((dx) => { R('#ece6d8', dx + 3, -44, 8, 44); R('#c8c0b0', dx + 9, -44, 2, 44); for (let k = 0; k < 3; k++) R('#d8d0c0', dx + 4 + k * 2, -42, 1, 40); R('#ece6d8', dx, -48, 14, 4); });
          R('#ece6d8', -2, -54, 40, 6); R('#d8d0c0', -2, -50, 40, 2); c.fillStyle = '#ece6d8'; c.beginPath(); c.moveTo(x - 2, base - 54); c.lineTo(x + 17, base - 64); c.lineTo(x + 38, base - 54); c.fill();
        } else if (o.k < 0.72) {   // 아치 벽
          R('#d8b890', 0, -50, 44, 50); R('#c8a880', 0, -50, 44, 3);
          [6, 26].forEach((dx) => { c.fillStyle = '#5a4a3a'; c.beginPath(); c.arc(x + dx + 6, base - 28, 6, Math.PI, 0); c.fill(); c.fillRect(Math.round(x + dx), Math.round(base - 28), 12, 28); });
        } else {   // 사이프러스
          c.fillStyle = '#2a4a2a'; c.beginPath(); c.ellipse(x + 8, base - o.h * 0.45, 7, o.h * 0.45, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#3a5a3a'; c.beginPath(); c.ellipse(x + 6, base - o.h * 0.5, 3, o.h * 0.35, 0, 0, Math.PI * 2); c.fill();
        }
        break;
      case 'uk':
        if (o.k > 0.9) {   // 시계탑
          R('#8a7a5a', 2, -100, 20, 100); R('#a8986a', 2, -100, 3, 100); R('#f4f1e0', 6, -88, 12, 12); R('#3a3a42', 11, -86, 1, 5); R('#3a3a42', 12, -82, 4, 1);
          c.fillStyle = '#4a4a52'; c.beginPath(); c.moveTo(x + 1, base - 100); c.lineTo(x + 12, base - 124); c.lineTo(x + 23, base - 100); c.fill();
          glow(c, x + 12, base - 82, 9, '#ffe9a8', 0.18);
        } else if (o.k < 0.5) {   // 벽돌 건물
          const h = 40 + o.h * 0.4; R('#7a3a2a', 0, -h, 40, h); R('#5a2a1e', 0, -h, 40, 3);
          for (let wy = -h + 8; wy < -10; wy += 12) for (let wx = 5; wx < 36; wx += 11) R(hash(wx + wy + o.x) > 0.4 ? '#ffd86a' : '#2a2a34', wx, wy, 5, 7);
          R('#2a2a34', 16, -12, 8, 12);
        } else if (o.k < 0.7) {   // 빨간 공중전화
          R('#d0202a', 6, -26, 12, 26); R('#ff5a5a', 6, -26, 12, 1); for (let k = 0; k < 3; k++) R('#ffe9c8', 8, -22 + k * 6, 8, 4); R('#d0202a', 5, -28, 14, 2);
        } else {   // 가로등
          R('#1a1a22', 10, -40, 2, 40); R('#1a1a22', 7, -44, 8, 5); R('#ffd86a', 8, -43, 6, 3); glow(c, x + 11, base - 42, 10, '#ffd86a', 0.25);
        }
        break;
      case 'space':
        if (o.k < 0.5) {   // 정거장 모듈
          R('#3a4058', 0, -o.h * 0.6, 40, o.h * 0.6); R('#5a6278', 0, -o.h * 0.6, 40, 3); for (let k = 4; k < 40; k += 10) R('#2a3048', k, -o.h * 0.6 + 6, 6, o.h * 0.6 - 10);
          for (let k = 0; k < 4; k++) R(Math.floor(t * 3 + k + o.x) % 2 ? '#58d8ff' : '#ff5ad8', 4 + k * 10, -o.h * 0.6 + 4, 2, 2);
        } else {   // 안테나·접시
          R('#8a9ab8', 14, -46, 2, 46); c.strokeStyle = '#8a9ab8'; c.lineWidth = 1; c.beginPath(); c.arc(x + 15, base - 48, 10, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); R(Math.floor(t * 4) % 2 ? '#ff5ad8' : '#ffffff', 14, -60, 2, 2);
        }
        break;
      default: break;
    }
  }
  function drawMid(c, st, sc, camX, t) {
    const per = 14 * 46; const f = st.style === 'uk' ? 0.55 : 0.5;
    sc.midObjs.forEach((o) => { const x = Math.round(((o.x - camX * f) % per + per) % per) - 40; midObj(c, st, o, x, 175, t); });
  }
  function drawAmbient(c, st, sc, camX, t) {
    c.save();
    const lighter = ['firefly', 'ember', 'sparkle', 'lantern', 'star'].indexOf(st.ambient) >= 0;
    if (lighter) c.globalCompositeOperation = 'lighter';
    sc.amb.forEach((a, i) => {
      let x; let y; let col; let al = 1; let w = a.s > 0.7 ? 2 : 1; let h = w;
      switch (st.ambient) {
        case 'firefly': x = a.x - camX * 0.6 + Math.sin(t + a.ph) * 8; y = 60 + (a.y % 110) + Math.sin(t * 1.3 + a.ph) * 6; col = '#d8ff6a'; al = 0.4 + 0.5 * Math.max(0, Math.sin(t * 3 + a.ph)); break;
        case 'ember': x = a.x - camX * 0.7 + Math.sin(t * 2 + a.ph) * 6; y = H - ((a.y + t * (20 + a.s * 30)) % H); col = a.s > 0.5 ? '#ffb15a' : '#ff5a1a'; al = 0.8; break;
        case 'sparkle': x = a.x - camX * 0.4; y = a.y % 150; col = a.s > 0.5 ? '#ffffff' : '#ffc4ea'; al = Math.max(0, Math.sin(t * 2 + a.ph)); break;
        case 'petal': x = a.x - camX * 0.8 - t * 20 + Math.sin(t * 2 + a.ph) * 10; y = (a.y + t * (18 + a.s * 14)) % H; col = a.s > 0.5 ? '#ffc8e0' : '#ff9ac8'; w = 2; h = 1; break;
        case 'lantern': x = a.x - camX * 0.3 + Math.sin(t + a.ph) * 4; y = H - ((a.y + t * (6 + a.s * 8)) % (H + 20)); col = '#ff9a3c'; al = 0.7; w = 2; h = 3; if (i % 3) return; break;
        case 'sand': x = a.x - camX * 1.1 - t * 90 * (0.5 + a.s); y = 40 + (a.y % 140); col = '#fff0c0'; al = 0.45; w = 4 + Math.floor(a.s * 5); h = 1; break;
        case 'dust': x = a.x - camX * 0.5 + Math.sin(t * 0.7 + a.ph) * 10; y = 30 + (a.y % 130) + Math.sin(t + a.ph) * 5; col = '#fff4d8'; al = 0.35; break;
        case 'rain': x = a.x - camX * 1.2 - t * 60; y = (a.y + t * 260 * (0.7 + a.s * 0.5)) % H; col = '#b8c8e0'; al = 0.45; w = 1; h = 5; break;
        case 'star': x = a.x - camX * 0.05; y = a.y % 150; col = a.s > 0.5 ? '#ffffff' : '#9af0ff'; al = Math.max(0, Math.sin(t * 2.5 + a.ph)); if (i === 0) { const sx = (t * 160) % 700 - 100; c.globalAlpha = 0.8; c.fillStyle = '#ffffff'; c.fillRect(Math.round(W - sx), Math.round(30 + (sx * 0.25)), 6, 1); } break;
        default: return;
      }
      x = ((x % W) + W) % W; c.globalAlpha = al; c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h);
    });
    c.restore();
    if (st.ambient === 'lantern') sc.amb.forEach((a, i) => { if (i % 3) return; const x = (((a.x - camX * 0.3 + Math.sin(t + a.ph) * 4) % W) + W) % W; const y = H - ((a.y + t * (6 + a.s * 8)) % (H + 20)); glow(c, x + 1, y + 1, 4, '#ff7a2a', 0.25); });
  }
  function drawPit(c, st, camX, t) {
    const p = st.pit;
    if (p === 'void' || p === 'mist') {
      c.fillStyle = p === 'mist' ? 'rgba(255,240,230,.7)' : 'rgba(255,255,255,.55)';
      for (let i = 0; i < 12; i++) { const x = ((i * 53 - camX * 0.8) % 640 + 640) % 640 - 40; c.beginPath(); c.arc(x, 196 + Math.sin(i + t * 0.5) * 3, 14, 0, Math.PI * 2); c.fill(); }
      return;
    }
    if (p === 'space') { for (let i = 0; i < 30; i++) { c.fillStyle = i % 3 ? '#9af0ff' : '#ffffff'; c.fillRect(Math.round(((hash(i + 3) * 400 - camX * 0.6) % 330 + 330) % 330), 170 + Math.round(hash(i) * 30), 1, 1); } return; }
    const yL = 184;
    const cols = { lava: ['#ff5a1a', '#ffd23a'], water: ['#1d4f7a', '#5fb3e8'], sand: ['#b8883a', '#e8c070'] }[p] || ['#1d4f7a', '#5fb3e8'];
    c.fillStyle = cols[0]; c.fillRect(0, yL, W, H - yL); c.fillStyle = cols[1];
    for (let x = 0; x < W; x += 6) { const yy = yL + Math.round(Math.sin((x + camX) * 0.08 + t * (p === 'sand' ? 1.5 : 4)) * 1.5); c.fillRect(x, yy, 4, 1); }
    if (p === 'lava') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 + Math.sin(t * 3) * 0.05; c.fillStyle = '#ff5a1a'; c.fillRect(0, 150, W, 50); c.restore(); }
  }
  // 땅 윗면 꾸밈 (스테이지별)
  function groundTop(c, st, sx, sw, y, x0, x1, camX, t) {
    c.fillStyle = st.top; c.fillRect(sx, y, sw, 4); c.fillStyle = st.topHi; c.fillRect(sx, y, sw, 1);
    const each = (step, fn) => { for (let tx = Math.floor(x0 / step) * step; tx < x1; tx += step) fn(Math.round(tx - camX), tx); };
    switch (st.style) {
      case 'jungle': c.fillStyle = st.top; each(4, (px, tx) => { if (hash(tx) > 0.4) c.fillRect(px, y - 1 - Math.floor(hash(tx + 1) * 2), 1, 2); }); c.fillStyle = '#3a9a44'; c.fillRect(sx, y + 4, sw, 1); break;
      case 'japan': c.fillStyle = st.top; each(4, (px, tx) => { if (hash(tx) > 0.5) c.fillRect(px, y - 1, 1, 2); }); c.fillStyle = '#ffb0d0'; each(9, (px, tx) => { if (hash(tx + 7) > 0.6) c.fillRect(px, y + 1, 2, 1); }); c.fillStyle = '#4a8a3a'; c.fillRect(sx, y + 4, sw, 1); break;
      case 'volcano': c.fillStyle = '#ff8a3c'; each(16, (px, tx) => { if (hash(tx + 5) > 0.5) c.fillRect(px + 3, y + 5, 1, 4 + Math.floor(hash(tx) * 6)); }); break;
      case 'sky': c.fillStyle = '#f5c542'; c.fillRect(sx, y + 4, sw, 2); c.fillStyle = '#c99a1a'; c.fillRect(sx, y + 6, sw, 1); break;
      case 'rome': c.fillStyle = '#f5c542'; c.fillRect(sx, y + 4, sw, 1); c.fillStyle = '#c8c0b0'; each(16, (px) => c.fillRect(px, y + 1, 1, 3)); break;
      case 'korea': c.fillStyle = '#a89a82'; each(12, (px) => c.fillRect(px, y, 1, 5)); c.fillStyle = '#c0b49c'; c.fillRect(sx, y + 4, sw, 1); break;
      case 'china': c.fillStyle = '#8a7e68'; each(10, (px, tx) => { c.fillRect(px, y + 2, 1, 3); if ((tx / 10) % 2) c.fillRect(px + 5, y + 6, 1, 3); }); c.fillRect(sx, y + 5, sw, 1); break;
      case 'egypt': c.fillStyle = '#e0b058'; each(14, (px, tx) => c.fillRect(px + Math.floor(hash(tx) * 6), y + 2 + Math.floor(hash(tx + 1) * 3), 5, 1)); break;
      case 'uk': c.fillStyle = '#5a5a62'; each(6, (px, tx) => { c.fillRect(px, y + 1, 4, 1); c.fillRect(px + (Math.floor(tx / 6) % 2 ? 3 : 0), y + 3, 4, 1); }); break;
      case 'space': c.fillStyle = '#5a6a88'; each(24, (px) => c.fillRect(px, y, 1, 5)); c.fillStyle = Math.floor(t * 3) % 2 ? '#58d8ff' : '#ff5ad8'; each(48, (px) => c.fillRect(px + 10, y + 2, 2, 1)); break;
      default: break;
    }
  }
  // 길 위 작은 꾸밈
  function drawProp(c, st, o, x, y) {
    const k = o.k % 3;
    const P = {
      jungle: [[[0, 3, 1, 4, '#2e8a3a'], [2, 1, 1, 6, '#3fb04a'], [4, 2, 1, 5, '#2e8a3a'], [6, 4, 1, 3, '#3fb04a']], [[2, 3, 2, 3, '#f3e0c0'], [0, 0, 6, 3, '#e8323c'], [1, 1, 1, 1, '#fff'], [4, 0, 1, 1, '#fff']], [[0, 0, 2, 2, '#ff7ac0'], [3, 1, 2, 2, '#ffe35a'], [1, 2, 1, 2, '#2e8a3a']]],
      korea: [[[1, 0, 6, 2, '#5a3a24'], [0, 2, 8, 6, '#7a4a2a'], [1, 3, 2, 3, '#9a6234']], [[2, 0, 4, 2, '#8a8a94'], [0, 2, 8, 2, '#a8a8b0'], [2, 4, 4, 4, '#8a8a94'], [3, 5, 2, 2, '#ffd86a']], [[0, 4, 2, 2, '#ffb0d0'], [3, 3, 2, 2, '#ffffff']]],
      china: [[[3, 0, 1, 12, '#3a2a1a'], [0, 2, 7, 5, '#e0302a'], [0, 2, 7, 1, '#ffd23a']], [[1, 0, 5, 2, '#2a6ab8'], [0, 2, 7, 6, '#f4f1ea'], [2, 4, 3, 2, '#2a6ab8']], [[0, 4, 6, 2, '#8a7e68']]],
      japan: [[[2, 0, 4, 2, '#8a8a94'], [1, 2, 6, 2, '#a8a8b0'], [3, 4, 2, 4, '#8a8a94'], [0, 8, 8, 2, '#8a8a94']], [[0, 0, 2, 10, '#5aa84a'], [3, 2, 2, 8, '#6ab85a'], [0, 3, 2, 1, '#3a7a3a']], [[0, 4, 3, 2, '#ffb0d0'], [4, 5, 2, 1, '#ff8ab8']]],
      egypt: [[[2, 0, 3, 1, '#a86a3a'], [1, 1, 5, 6, '#c8783a'], [1, 3, 5, 1, '#2a5ab8']], [[0, 4, 9, 3, '#e8c070'], [2, 2, 5, 2, '#d8b060']], [[0, 2, 2, 5, '#c0c0c0'], [3, 3, 2, 4, '#e0e0e0']]],
      rome: [[[2, 0, 3, 1, '#a86a3a'], [1, 1, 5, 7, '#c8783a'], [0, 2, 1, 3, '#c8783a'], [6, 2, 1, 3, '#c8783a']], [[0, 2, 8, 6, '#ece6d8'], [1, 0, 6, 2, '#d8d0c0']], [[0, 5, 6, 2, '#5a8a3a'], [1, 3, 2, 2, '#7ab85a']]],
      uk: [[[1, 0, 5, 2, '#d0202a'], [0, 2, 7, 8, '#d0202a'], [1, 4, 5, 1, '#1a1a22'], [2, 10, 3, 1, '#1a1a22']], [[0, 3, 12, 2, '#6a4a2a'], [0, 5, 1, 3, '#2a2a2a'], [11, 5, 1, 3, '#2a2a2a'], [0, 0, 12, 1, '#6a4a2a']], [[0, 5, 4, 2, '#5a5a62']]],
      volcano: [[[1, 2, 3, 6, '#ff5a8a'], [2, 0, 1, 2, '#ffb0c8'], [4, 4, 2, 4, '#c03a6a']], [[0, 1, 7, 2, '#e8e0d0'], [1, 0, 2, 1, '#e8e0d0'], [5, 0, 2, 1, '#e8e0d0']], [[0, 3, 4, 3, '#40324a']]],
      sky: [[[1, 0, 4, 2, '#f5c542'], [2, 2, 2, 11, '#e8e4f5'], [0, 13, 6, 1, '#f5c542']], [[0, 0, 1, 10, '#c9c2f0'], [1, 0, 6, 4, '#ff6aa8'], [1, 1, 6, 1, '#ffb0d0']], [[0, 4, 5, 2, '#ffffff']]],
      space: [[[0, 2, 8, 6, '#5a6278'], [0, 2, 8, 1, '#8a9ab8'], [3, 4, 2, 2, '#58d8ff']], [[0, 0, 2, 8, '#8a9ab8'], [2, 3, 6, 2, '#8a9ab8']], [[0, 5, 5, 2, '#3a4058']]],
    }[st.style];
    if (!P) return; const r = P[k]; let h = 0; r.forEach((q) => { h = Math.max(h, q[1] + q[3]); });
    sprite(c, x, y - h, r, false, k === 2 ? false : undefined, 12);
  }
  function drawFront(c, st, sc, camX) {
    const per = 700; c.save(); c.globalAlpha = 0.92;
    sc.frontObjs.forEach((o) => {
      const x = Math.round(((o.x - camX * 1.3) % per + per) % per) - 60; c.fillStyle = st.front;
      if (st.style === 'sky') { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x, H + 6, o.h + 10, 0, Math.PI * 2); c.fill(); }
      else if (st.style === 'volcano' || st.style === 'egypt' || st.style === 'space') { c.beginPath(); c.moveTo(x - 20, H); c.lineTo(x - 6, H - o.h - 8); c.lineTo(x + 4, H - o.h + 2); c.lineTo(x + 18, H - o.h - 4); c.lineTo(x + 30, H); c.fill(); }
      else if (st.style === 'japan' || st.style === 'korea') { c.fillStyle = st.style === 'japan' ? 'rgba(255,150,200,.75)' : 'rgba(40,70,40,.9)'; c.beginPath(); c.ellipse(x, H + 2, 24, o.h + 4, -0.3, 0, Math.PI * 2); c.fill(); }
      else { c.beginPath(); c.ellipse(x, H + 2, 26, o.h + 6, -0.4, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(x + 22, H + 4, 20, o.h, 0.5, 0, Math.PI * 2); c.fill(); }
    });
    c.restore();
  }

  // ---------- 보스 10개 ----------
  // box(b): 맞는 범위 / draw(c, b, x, y, t, col, ph): col(색) 은 맞을 때 하얗게 바꿔 줌 / moves: [1단계, 2단계]
  const BOSSES = {
    golem: { name: '덩굴 골렘', moves: [['roll', 'slam', 'low', 'high'], ['roll', 'slam', 'rain', 'low', 'high', 'slam']], box: (b) => ({ x: b.x - 22, y: b.y - 46, w: 44, h: 46 }),
      draw(c, b, x, y, t, col, ph) {
        const sw = Math.round(Math.sin(t * 2) * 2); const act = b.act > 0 ? 8 : 0;
        const stone = col(ph ? '#5a5a5e' : '#6f7a64'); const stone2 = col(ph ? '#45454a' : '#5f6a56'); const hi = col(ph ? '#7a7a80' : '#8f9a80'); const eye = ph ? '#ff3a3a' : '#ffe35a';
        const moss = col(ph ? '#c0392b' : '#3fb04a'); const moss2 = col(ph ? '#8a1a1a' : '#2e8a3a');
        const R = [[2, 10, 36, 34, stone], [4, 10, 32, 4, hi], [0, 0, 40, 14, stone2], [4, 2, 32, 4, hi], [8, 6, 6, 4, eye], [26, 6, 6, 4, eye], [9, 7, 2, 2, '#fff'], [27, 7, 2, 2, '#fff'],
          [12, 12 + (act ? 2 : 0), 16, 3 + (act ? 3 : 0), OUT], [-7, 14 + sw - act, 8, 22, stone2], [-8, 32 + sw - act, 10, 6, hi], [39, 14 - sw, 8, 22, stone2], [38, 32 - sw, 10, 6, hi],
          [6, 44, 10, 2, stone2], [24, 44, 10, 2, stone2], [3, 0, 8, 3, moss], [16, -2, 10, 3, moss2], [30, 1, 8, 3, moss], [12, 24, 2, 10, moss], [28, 20, 2, 14, moss2], [20, 30, 6, 6, ph ? '#ff7a2a' : '#ff7ac0']];
        if (ph) R.push([14, 18, 1, 10, '#ff7a2a'], [24, 26, 1, 8, '#ff7a2a'], [8, 16, 1, 6, '#ff7a2a']);
        sprite(c, x - 20, y - 46, R, false, undefined, 40);
        if (ph) { glow(c, x - 9, y - 38, 6, '#ff3a3a', 0.35); glow(c, x + 9, y - 38, 6, '#ff3a3a', 0.35); }
      } },
    dokkaebi: { name: '도깨비 대장', summon: 'imp', moves: [['low', 'high', 'slam'], ['summon', 'flame', 'low', 'high', 'slam']], box: (b) => ({ x: b.x - 22, y: b.y - 60, w: 48, h: 60 }),
      draw(c, b, x, y, t, col, ph) {
        const sk = col(ph ? '#8a2a6a' : '#d9483b'); const sk2 = col(ph ? '#5a1a4a' : '#a8322a'); const eye = ph ? '#6ff7ff' : '#ffe35a'; const bb = Math.round(Math.sin(t * 3)); const ay = b.act > 0 ? -14 : 0;
        const R = [[10, 40, 8, 8, sk2], [26, 40, 8, 8, sk2], [8, 46, 12, 2, '#3a2a1a'], [24, 46, 12, 2, '#3a2a1a'],
          [8, 30, 28, 12, '#f5c542'], [10, 30, 3, 12, '#2a1a1a'], [18, 30, 3, 12, '#2a1a1a'], [26, 30, 3, 12, '#2a1a1a'], [33, 30, 2, 12, '#2a1a1a'],
          [6, 12 + bb, 32, 20, sk], [6, 12 + bb, 6, 20, sk2], [14, 18 + bb, 16, 8, sk2],
          [10, bb, 24, 14, sk], [10, bb, 4, 14, sk2], [8, -4 + bb, 28, 6, '#2a1a3a'], [6, -2 + bb, 4, 8, '#2a1a3a'], [34, -2 + bb, 4, 8, '#2a1a3a'], [20, -10 + bb, 4, 7, '#f3e0c0'], [21, -12 + bb, 2, 2, '#f3e0c0'],
          [24, 4 + bb, 6, 4, eye], [26, 5 + bb, 2, 2, OUT], [14, 4 + bb, 6, 4, eye], [16, 5 + bb, 2, 2, OUT], [13, 3 + bb, 7, 1, '#2a1a3a'], [23, 3 + bb, 7, 1, '#2a1a3a'],
          [15, 10 + bb, 14, 3, '#5a1010'], [16, 10 + bb, 2, 2, '#ffffff'], [26, 10 + bb, 2, 2, '#ffffff'],
          [0, 14 + bb, 7, 14, sk], [-2, 26 + bb, 6, 5, sk2], [37, 14 + bb + ay / 2, 7, 12, sk], [40, 24 + bb + ay, 6, 6, sk2],
          [42, -6 + bb + ay, 8, 32, ph ? '#4a2a6a' : '#8a5a2a'], [42, -6 + bb + ay, 2, 32, ph ? '#6a4a9a' : '#a87a4a'], [41, -2 + bb + ay, 2, 2, '#c9c9c9'], [49, 4 + bb + ay, 2, 2, '#c9c9c9'], [41, 10 + bb + ay, 2, 2, '#c9c9c9'], [49, 16 + bb + ay, 2, 2, '#c9c9c9']];
        sprite(c, x - 25, y - 48, R, true, undefined, 50);
        if (ph) for (let i = 0; i < 4; i++) { const a = t * 2 + i * 1.57; const gx = x + Math.cos(a) * 34; const gy = y - 30 + Math.sin(a) * 16; glow(c, gx, gy, 7, '#6ff7ff', 0.4); c.fillStyle = '#e0ffff'; c.fillRect(Math.round(gx - 1), Math.round(gy - 1), 3, 3); }
      } },
    terracotta: { name: '병마용 장군', summon: 'clay', moves: [['low', 'summon', 'high'], ['summon', 'dash', 'low', 'high', 'rain']], box: (b) => ({ x: b.x - 18, y: b.y - 54, w: 36, h: 54 }),
      draw(c, b, x, y, t, col, ph) {
        const clay = col(ph ? '#d8a84a' : '#b8784a'); const clay2 = col(ph ? '#a8782a' : '#8a5a3a'); const skin = col('#c98a5a'); const dark = '#5a3a22'; const sp = b.act > 0 ? -6 : 0;
        const R = [[8, 44, 7, 8, clay2], [20, 44, 7, 8, clay2], [7, 52, 9, 2, dark], [19, 52, 9, 2, dark], [6, 34, 24, 10, clay], [6, 36, 24, 1, clay2], [6, 39, 24, 1, clay2], [6, 42, 24, 1, clay2],
          [5, 18, 26, 16, clay], [5, 18, 26, 2, clay2], [7, 21, 22, 1, clay2], [7, 24, 22, 1, clay2], [7, 27, 22, 1, clay2], [7, 30, 22, 1, clay2], [5, 33, 26, 2, dark],
          [11, 6, 14, 12, skin], [11, 6, 14, 2, clay2], [16, 0, 5, 6, clay2], [15, 3, 7, 2, dark], [13, 10, 3, 2, ph ? '#ffd23a' : OUT], [20, 10, 3, 2, ph ? '#ffd23a' : OUT], [14, 14, 8, 1, dark],
          [0, 18, 6, 14, clay], [30, 18, 6, 14, clay], [0, 32, 6, 4, skin], [30, 32, 6, 4, skin],
          [-2, -10 + sp, 2, 50, '#6a4a2a'], [-3, -16 + sp, 4, 6, '#c9c9c9'], [-4, -10 + sp, 6, 3, '#c0392b']];
        if (ph) R.push([10, 22, 1, 10, '#ffd23a'], [24, 20, 1, 8, '#ffd23a'], [16, 36, 1, 6, '#ffd23a']);
        sprite(c, x - 18, y - 54, R, false, undefined, 36);
        if (ph) glow(c, x, y - 30, 22, '#ffd23a', 0.12);
      } },
    ninja: { name: '닌자 대장', moves: [['high', 'low', 'dash'], ['clones', 'high', 'low', 'dash', 'high']], box: (b) => ({ x: b.x - 12, y: b.y - 40, w: 24, h: 40 }),
      draw(c, b, x, y, t, col, ph) {
        const nv = col(ph ? '#2a0a3a' : '#1a1f3a'); const nv2 = col(ph ? '#4a1a6a' : '#2a3058'); const sc = ph ? '#a020f0' : '#c0392b'; const wv = Math.round(Math.sin(t * 12)); const wv2 = Math.round(Math.sin(t * 12 - 1)); const ha = b.act > 0 ? -4 : 0;
        const R = [[6, 30, 4, 8, nv], [14, 30, 4, 8, nv], [5, 38, 6, 2, '#0a0a14'], [13, 38, 6, 2, '#0a0a14'], [5, 16, 14, 14, nv], [5, 16, 14, 2, nv2], [5, 26, 14, 2, sc],
          [6, 4, 12, 12, nv], [6, 8, 12, 3, '#f3c39b'], [8, 9, 2, 1, ph ? '#ff3a3a' : OUT], [13, 9, 2, 1, ph ? '#ff3a3a' : OUT],
          [18, 10, 4, 2, sc], [21, 11 + wv, 4, 2, sc], [24, 12 + wv2, 3, 2, sc], [16, 0, 2, 18, '#c9c9c9'], [15, 14, 4, 2, '#3a2a1a'],
          [0, 18 + ha, 6, 3, nv2], [-4, 16 + ha, 4, 4, '#d0d0d8']];
        const dashing = b.state === 'dash' || b.state === 'return';
        if (ph || dashing) { c.save(); c.globalAlpha = 0.25; sprite(c, x - 2, y - 40, R, false, false, 24); sprite(c, x + 8, y - 40, R, false, false, 24); c.restore(); }
        sprite(c, x - 12, y - 40, R, false, undefined, 24);
        if (ph) glow(c, x, y - 20, 18, '#a020f0', 0.15);
      } },
    sphinx: { name: '황금 스핑크스', moves: [['roll', 'laser', 'high'], ['rain', 'laser', 'laserHigh', 'roll', 'wave']], box: (b) => ({ x: b.x - 33, y: b.y - 46, w: 66, h: 46 }),
      draw(c, b, x, y, t, col, ph) {
        const g1 = col(ph ? '#c8902a' : '#e0b050'); const g2 = col(ph ? '#9a6a1a' : '#b8883a'); const blue = col(ph ? '#5a1a8a' : '#2a5ab8'); const eye = b.act > 0 || ph ? '#ff3a3a' : OUT;
        const R = [[14, 24, 50, 16, g1], [14, 24, 50, 3, '#f0d080'], [52, 36, 12, 8, g2], [0, 36, 22, 8, g1], [0, 40, 22, 2, g2], [2, 42, 2, 2, g2], [8, 42, 2, 2, g2], [62, 18, 3, 10, g2], [10, 18, 14, 18, g1],
          [6, -2, 22, 10, blue], [6, 0, 22, 1, '#f5c542'], [6, 3, 22, 1, '#f5c542'], [4, 6, 6, 16, blue], [26, 6, 6, 16, blue], [4, 10, 6, 1, '#f5c542'], [26, 10, 6, 1, '#f5c542'], [4, 14, 6, 1, '#f5c542'], [26, 14, 6, 1, '#f5c542'],
          [10, 6, 14, 14, g1], [12, 10, 4, 2, eye], [18, 10, 4, 2, eye], [16, 12, 2, 4, g2], [15, 20, 4, 6, blue], [16, -6, 3, 4, '#f5c542']];
        if (ph) R.push([30, 28, 1, 8, '#58d8ff'], [44, 26, 1, 10, '#58d8ff'], [20, 30, 1, 6, '#58d8ff']);
        sprite(c, x - 33, y - 44, R, false, undefined, 66);
        if (b.act > 0 || ph) { glow(c, x - 19, y - 33, 4, '#ff3a3a', 0.6); glow(c, x - 13, y - 33, 4, '#ff3a3a', 0.6); }
        if (ph) for (let i = 0; i < 3; i++) { const gx = x - 40 + ((t * 20 + i * 30) % 80); c.globalAlpha = 0.6; c.fillStyle = '#ffd23a'; c.fillRect(Math.round(gx), Math.round(y - 60 - i * 6 + Math.sin(t * 3 + i) * 3), 3, 4); c.globalAlpha = 1; }
      } },
    gladiator: { name: '검투사 챔피언', moves: [['dash', 'low', 'slam'], ['dash', 'roll', 'slam', 'high', 'dash']], box: (b) => ({ x: b.x - 14, y: b.y - 42, w: 28, h: 42 }),
      draw(c, b, x, y, t, col, ph) {
        const br = col(ph ? '#f5c542' : '#c08a3a'); const br2 = col(ph ? '#c8982a' : '#8a5a2a'); const red = ph ? '#ff7a2a' : '#c0302a'; const sk = col('#f3c39b'); const sa = b.act > 0 ? -8 : 0;
        const dashing = b.state === 'dash' || b.state === 'return';
        if (dashing) {
          const wr = Math.floor(t * 20) % 2;
          sprite(c, x - 20, y - 14, [[0, 0, 40, 8, '#8a5a2a'], [0, 0, 40, 2, '#f5c542'], [4, 6, 10, 8, '#3a2a1a'], [26, 6, 10, 8, '#3a2a1a'], [8, 7 + wr, 2, 6, '#c9c9c9'], [30, 7 + (1 - wr), 2, 6, '#c9c9c9'], [-6, 2, 6, 2, '#6a4a2a']], false, undefined, 40);
        }
        const R = [[8, 32, 4, 10, sk], [16, 32, 4, 10, sk], [7, 40, 6, 2, '#6a4a2a'], [15, 40, 6, 2, '#6a4a2a'], [6, 26, 16, 6, red], [8, 26, 2, 6, br2], [14, 26, 2, 6, br2], [6, 14, 16, 12, br], [6, 14, 16, 2, '#ffe9a8'], [13, 16, 1, 8, br2],
          [7, 0, 14, 12, br], [9, 5, 10, 5, OUT], [11, 7, 2, 1, '#fff'], [9, -6, 12, 6, red], [-4, 12, 10, 16, br2], [-3, 13, 8, 14, red], [0, 19, 2, 2, '#ffe35a'], [22, 14 + sa, 2, 14, '#d0d0d8'], [21, 26 + sa, 4, 2, br2]];
        if (ph) R.push([11, -9, 2, 3, '#ffd23a'], [15, -10, 2, 4, '#ffd23a']);
        sprite(c, x - 14, y - 42 - (dashing ? 6 : 0), R, false, undefined, 28);
        if (ph) glow(c, x, y - 46, 8, '#ff7a2a', 0.3 + Math.sin(t * 10) * 0.1);
      } },
    clock: { name: '시계탑 태엽 골렘', moves: [['bounce', 'wave', 'high'], ['bounce', 'bounce', 'wave', 'low', 'high', 'laser']], box: (b) => ({ x: b.x - 25, y: b.y - 62, w: 50, h: 62 }),
      draw(c, b, x, y, t, col, ph) {
        const br = col(ph ? '#6a2a2a' : '#8a6a4a'); const br2 = col(ph ? '#4a1a1a' : '#6a4e34'); const win = ph ? '#ff3a3a' : '#ffd86a'; const ay = b.act > 0 ? -10 : 0; const ox = x - 25; const oy = y - 62;
        const R = [[10, 50, 8, 10, '#5a5a62'], [32, 50, 8, 10, '#5a5a62'], [8, 60, 12, 2, '#3a3a42'], [30, 60, 12, 2, '#3a3a42'], [6, 14, 38, 38, br], [6, 14, 38, 3, br2]];
        for (let k = 20; k < 50; k += 5) R.push([6, k, 38, 1, br2]);
        R.push([10, 4, 30, 10, '#3a4a3a'], [23, -6, 4, 10, '#f5c542'], [16, 8, 4, 3, win], [30, 8, 4, 3, win], [-6, 20 + ay, 10, 20, br2], [46, 20 - ay, 10, 20, br2], [-7, 38 + ay, 12, 5, '#5a5a62'], [45, 38 - ay, 12, 5, '#5a5a62']);
        sprite(c, ox, oy, R, false, undefined, 50);
        // 시계 얼굴 + 바늘
        const cx = ox + 25; const cy = oy + 32;
        c.fillStyle = '#f5c542'; c.beginPath(); c.arc(cx, cy, 12, 0, Math.PI * 2); c.fill(); c.fillStyle = ph ? '#ffe0e0' : '#f4f1e0'; c.beginPath(); c.arc(cx, cy, 10, 0, Math.PI * 2); c.fill();
        const sp = ph ? 3 : 1; c.strokeStyle = OUT; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(t * sp) * 7, cy + Math.sin(t * sp) * 7); c.stroke(); c.lineWidth = 1; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(t * sp * 6) * 9, cy + Math.sin(t * sp * 6) * 9); c.stroke();
        // 어깨 톱니
        [[ox + 4, oy + 16], [ox + 46, oy + 16]].forEach(([gx, gy], i) => { c.save(); c.translate(gx, gy); c.rotate(t * (i ? -2 : 2) * sp); c.fillStyle = '#c9a24a'; for (let k = 0; k < 8; k++) { c.rotate(Math.PI / 4); c.fillRect(-1, -8, 3, 4); } c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill(); c.fillStyle = OUT; c.fillRect(-1, -1, 2, 2); c.restore(); });
        if (ph) for (let i = 0; i < 2; i++) { c.globalAlpha = 0.5; c.fillStyle = '#e0e0e8'; c.beginPath(); c.arc(ox + 18 + i * 14, oy - 8 - ((t * 20 + i * 10) % 20), 3 + ((t * 5 + i) % 3), 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
      } },
    dragon: { name: '용암 드래곤', moves: [['low', 'high', 'flame'], ['rain', 'flame', 'low', 'high', 'flame']], box: (b) => ({ x: b.x - 16, y: b.y - 70, w: 34, h: 66 }),
      draw(c, b, x, y, t, col, ph) {
        const j = b.act > 0 ? 5 : 0; const sc = col(ph ? '#5a1a8a' : '#c0302a'); const sc2 = col(ph ? '#3a0a5a' : '#b0262a'); const hi = col(ph ? '#8a4ac8' : '#ff6a4a'); const wing = col(ph ? '#2a0a4a' : '#7a1a1a'); const fl = Math.round(Math.sin(t * 6) * 2);
        const R = [[24, 8 - fl, 14, 4, wing], [28, 4 - fl, 12, 4, wing], [32, 0 - fl, 10, 4, wing], [36, -4 - fl, 6, 4, wing],
          [14, 20, 16, 40, sc2], [16, 20, 4, 40, hi], [0, 0, 34, 18, sc], [2, 0, 30, 4, hi], [0, 18, 30, 4 + j, col(ph ? '#2a0a4a' : '#a01e1e')], [2, 18, 26, 1, '#fff'], [2, 22 + j, 26, 1, '#fff'],
          [6, 5, 6, 4, ph ? '#6ff7ff' : '#ffe35a'], [7, 6, 2, 2, OUT], [22, -6, 4, 7, col('#f3e0c0')], [28, -4, 4, 6, col('#f3e0c0')], [30, 8, 6, 3, col('#ffb15a')], [18, 26, 8, 2, col('#ffb15a')], [18, 34, 8, 2, col('#ffb15a')], [18, 42, 8, 2, col('#ffb15a')]];
        sprite(c, x - 16, y - 70, R, false, undefined, 34);
        if (b.act > 0) glow(c, x - 18, y - 50, 7, ph ? '#6ff7ff' : '#ffb15a', 0.6);
      } },
    knight: { name: '폭풍 기사', moves: [['dash', 'low', 'high', 'slam'], ['dash', 'laser', 'high', 'slam', 'dash']], box: (b) => ({ x: b.x - 10, y: b.y - 36, w: 20, h: 36 }),
      draw(c, b, x, y, t, col, ph) {
        const ar = col(ph ? '#4a4a6a' : '#c9d2ea'); const ar2 = col(ph ? '#2a2a4a' : '#9aa6c8'); const cape = ph ? '#1a1a5a' : '#3a3aa8'; const wv = Math.round(Math.sin(t * 8) * 2); const la = b.act > 0 ? -6 : 0;
        const dashing = b.state === 'dash' || b.state === 'return';
        const R = [[18, 10, 6, 18 + wv, cape], [22, 14, 4, 16 - wv, cape], [2, 0, 14, 12, ar], [2, 0, 14, 3, col('#ffffff')], [3, 5, 12, 3, OUT], [4, 6, 3, 1, ph ? '#ffe35a' : '#58d8ff'], [10, 6, 3, 1, ph ? '#ffe35a' : '#58d8ff'], [7, -5, 4, 5, ph ? '#ffe35a' : '#ff4a6a'],
          [0, 12, 18, 12, ar2], [2, 13, 14, 2, ar], [6, 15, 6, 6, '#f5c542'], [3, 24, 5, 12, '#5a6278'], [10, 24, 5, 12, '#5a6278'], [-14, 14 + la, 16, 3, '#f5c542'], [-18, 15 + la, 4, 1, '#ffffff'], [-2, 10, 4, 10, '#b0b8d0']];
        sprite(c, x - 9, y - 36, R, false, undefined, 18);
        if (dashing) { c.save(); c.globalAlpha = 0.35; c.fillStyle = '#58d8ff'; c.fillRect(x + 10, y - 34, 30, 32); c.restore(); }
        if (ph) { c.strokeStyle = '#ffe35a'; c.lineWidth = 1; for (let i = 0; i < 2; i++) { const a = t * 7 + i * 3; let px = x + Math.cos(a) * 16; let py = y - 18 + Math.sin(a) * 18; c.beginPath(); c.moveTo(px, py); for (let k = 0; k < 3; k++) { px += (Math.random() - 0.5) * 8; py += 4; c.lineTo(px, py); } c.stroke(); } }
      } },
    mothership: { name: '외계 모선', fly: true, summon: 'ufo', moves: [['laser', 'summon', 'high'], ['laserHigh', 'laser', 'summon', 'rain', 'low']], box: (b) => ({ x: b.x - 10, y: b.y - 28, w: 20, h: 20 }),
      draw(c, b, x, y, t, col, ph) {
        const hov = Math.round(Math.sin(t * 2) * 3); const sy = y - 92 + hov;
        // 끈과 약점 코어 (부메랑이 맞는 곳)
        c.fillStyle = '#5a6278'; c.fillRect(Math.round(x - 1), sy + 12, 2, 54 - hov);
        sprite(c, x - 9, y - 28, [[0, 0, 18, 18, col('#5a6278')], [2, 0, 14, 2, col('#8a9ab8')], [5, 5, 8, 8, ph ? '#ff3a3a' : '#58d8ff'], [7, 7, 3, 3, '#ffffff'], [-3, 6, 3, 6, '#3a4058'], [18, 6, 3, 6, '#3a4058']], false, undefined, 18);
        glow(c, x, y - 19, 10, ph ? '#ff3a3a' : '#58d8ff', 0.3 + Math.sin(t * 6) * 0.1);
        // 원반
        c.fillStyle = '#58d8ff'; c.globalAlpha = 0.55; c.beginPath(); c.arc(x, sy, 18, Math.PI, 0); c.fill(); c.globalAlpha = 1;
        sprite(c, x - 6, sy - 12, [[2, 4, 8, 8, '#5ad86a'], [3, 6, 2, 3, OUT], [7, 6, 2, 3, OUT], [5, 0, 2, 4, '#5ad86a']], false, false, 12);
        sprite(c, x - 46, sy, [[6, 0, 80, 6, col(ph ? '#8a5a6a' : '#b0b8d0')], [0, 6, 92, 6, col(ph ? '#6a3a4a' : '#8a93ab')], [10, 12, 72, 3, col('#5a6278')]], false, undefined, 92);
        for (let k = 0; k < 9; k++) { const on = (Math.floor(t * 8) + k) % 3 === 0; c.fillStyle = on ? (ph ? '#ff3a3a' : '#ffe35a') : '#3a4058'; c.fillRect(Math.round(x - 40 + k * 10), sy + 8, 4, 2); }
      } },
  };

  window.TWQuestArt = { W, H, GROUND0, STAGES, BOSSES, addSongs, sprite, glow, drawHero, enemyRects, ESIZE, FRUIT, makeScene, drawSky, drawFar, drawMid, drawAmbient, drawPit, groundTop, drawProp, drawFront };
})();
