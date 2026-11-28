/* 쌍둥이의 하루 영단어 — G-10 단어 타워 디펜스 그림·맵 자료 (요구사항 16장, 2026-11-28)
   부드러운 카툰 판타지 스타일. 맵 5개(길·꾸밈), 탑 4종×3단계+분기, 괴물 7종, 보스 5종, 탄·효과를 모두 코드로 그린다.
   좌표는 480×300 전장(칸 30px, 16×10). td.js(엔진)가 window.TWTdArt 로 쓴다. */
(() => {
  'use strict';
  const BW = 480; const BH = 300; const CELL = 30;
  const TAU = Math.PI * 2;
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const circle = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const ellipse = (c, x, y, rx, ry, col, rot) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fill(); };
  const shadow = (c, x, y, rx, ry) => ellipse(c, x, y, rx, ry || rx * 0.45, 'rgba(0,0,0,.25)');
  function glow(c, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore(); }
  function rrect(c, x, y, w, h, r, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); c.fill(); }
  function outlineStroke(c, col, w) { c.strokeStyle = col; c.lineWidth = w || 1.2; c.stroke(); }

  // ---------- 맵 5개 ----------
  const MAPS = [
    { key: 'meadow', name: '초원', en: 'MEADOW', song: 'tdm1', path: [[-1, 2], [4, 2], [4, 6], [8, 6], [8, 2], [12, 2], [12, 7], [16, 7]],
      ground: ['#86d364', '#78c656', '#6ab64a'], road: ['#8a6a42', '#d6b47c', '#c49e66'], tint: '#6fd86a', boss: 'kingslime', bg: ['#6ab64a', '#3f8a32'] },
    { key: 'desert', name: '사막', en: 'DESERT', song: 'tdm2', path: [[-1, 7], [3, 7], [3, 2], [7, 2], [7, 8], [11, 8], [11, 3], [16, 3]],
      ground: ['#f2d48e', '#ecc97a', '#e2bb68'], road: ['#9a7448', '#d2ac78', '#bf9864'], tint: '#ff9a4a', boss: 'scorpion', bg: ['#ecc97a', '#c8984a'] },
    { key: 'ice', name: '얼음 나라', en: 'ICELAND', song: 'tdm3', path: [[-1, 1], [13, 1], [13, 4], [2, 4], [2, 7], [16, 7]],
      ground: ['#f2f8ff', '#e2eefc', '#d4e4f6'], road: ['#5a7aa0', '#a8c4e2', '#94b2d4'], tint: '#58c8ff', boss: 'giant', bg: ['#e2eefc', '#9ab8dc'] },
    { key: 'lava', name: '용암 지대', en: 'LAVA', song: 'tdm4', path: [[-1, 5], [3, 5], [3, 1], [6, 1], [6, 8], [10, 8], [10, 1], [13, 1], [13, 5], [16, 5]],
      ground: ['#4e3e42', '#44363a', '#3a2e32'], road: ['#1a1216', '#3a2c30', '#30242a'], tint: '#ff5a2a', boss: 'dragon', bg: ['#44363a', '#2a1c20'] },
    { key: 'castle', name: '마왕성', en: 'DARK CASTLE', song: 'tdm5', path: [[-1, 8], [2, 8], [2, 1], [5, 1], [5, 6], [9, 6], [9, 2], [12, 2], [12, 8], [14, 8], [14, 4], [16, 4]],
      ground: ['#4a3e64', '#42365a', '#3a2e50'], road: ['#2a2238', '#6a5e82', '#5c5074'], tint: '#b06aff', boss: 'demon', bg: ['#42365a', '#241c34'] },
  ];
  // 길 칸·터 계산 (터: 길 옆 칸 중 길을 많이 내려다보는 곳부터, 서로 붙지 않게 최대 12개)
  function layout(map) {
    const pts = map.path.map(([cx, cy]) => [cx * CELL + CELL / 2, cy * CELL + CELL / 2]);
    const pathSet = new Set();
    for (let i = 0; i < map.path.length - 1; i++) {
      let [x, y] = map.path[i]; const [x2, y2] = map.path[i + 1];
      const dx = Math.sign(x2 - x); const dy = Math.sign(y2 - y);
      pathSet.add(`${x},${y}`);
      while (x !== x2 || y !== y2) { x += dx; y += dy; pathSet.add(`${x},${y}`); }
    }
    const onPath = (x, y) => pathSet.has(`${x},${y}`);
    const cand = [];
    for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) {
      if (onPath(x, y)) continue;
      let adj = false; let cover = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (onPath(x + dx, y + dy)) { cover++; if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) adj = true; }
      if (adj) cand.push({ x, y, cover });
    }
    cand.sort((a, b) => b.cover - a.cover || a.x - b.x || a.y - b.y);
    const pads = [];
    cand.forEach((cd) => { if (pads.length >= 12) return; if (pads.some((p) => Math.abs(p.cx - cd.x) <= 1 && Math.abs(p.cy - cd.y) <= 1)) return; pads.push({ cx: cd.x, cy: cd.y, x: cd.x * CELL + CELL / 2, y: cd.y * CELL + CELL / 2 }); });
    let len = 0; const segs = [];
    for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i]; const [bx, by] = pts[i + 1]; const l = Math.hypot(bx - ax, by - ay); segs.push({ ax, ay, bx, by, l, s: len }); len += l; }
    return { pts, segs, len, pads, onPath };
  }
  function posAt(L, d) {
    const s = L.segs; let k = 0;
    while (k < s.length - 1 && d > s[k].s + s[k].l) k++;
    const g = s[k]; const f = Math.max(0, Math.min(1, (d - g.s) / g.l));
    return { x: g.ax + (g.bx - g.ax) * f, y: g.ay + (g.by - g.ay) * f, dx: Math.sign(g.bx - g.ax), dy: Math.sign(g.by - g.ay) };
  }

  // ---------- 배경 미리 그리기 (한 번) ----------
  function drawTree(c, x, y, s, cols) { shadow(c, x + 3, y + 4, 10 * s, 5 * s); c.fillStyle = '#6a4424'; c.fillRect(x - 2 * s, y - 2 * s, 4 * s, 8 * s); circle(c, x, y - 6 * s, 10 * s, cols[0]); circle(c, x - 4 * s, y - 9 * s, 6 * s, cols[1]); circle(c, x + 3 * s, y - 3 * s, 5 * s, cols[2]); }
  function drawPine(c, x, y, s, snow) { shadow(c, x + 3, y + 3, 9 * s, 4 * s); c.fillStyle = '#5a3a22'; c.fillRect(x - 1.5 * s, y - 2 * s, 3 * s, 6 * s); [[14, 0], [11, -7], [8, -13]].forEach(([w, dy]) => { c.fillStyle = '#2e7a52'; c.beginPath(); c.moveTo(x - w / 2 * s, y + dy * s); c.lineTo(x, y + (dy - 11) * s); c.lineTo(x + w / 2 * s, y + dy * s); c.fill(); if (snow) { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x - w / 4 * s, y + (dy - 5) * s); c.lineTo(x, y + (dy - 11) * s); c.lineTo(x + w / 4 * s, y + (dy - 5) * s); c.fill(); } }); }
  function drawRock(c, x, y, s, col, hi) { shadow(c, x + 2, y + 3, 8 * s, 3 * s); c.fillStyle = col; c.beginPath(); c.moveTo(x - 8 * s, y + 3 * s); c.lineTo(x - 6 * s, y - 4 * s); c.lineTo(x, y - 7 * s); c.lineTo(x + 7 * s, y - 3 * s); c.lineTo(x + 8 * s, y + 3 * s); c.closePath(); c.fill(); c.fillStyle = hi; c.beginPath(); c.moveTo(x - 5 * s, y - 3 * s); c.lineTo(x, y - 6 * s); c.lineTo(x + 2 * s, y - 2 * s); c.closePath(); c.fill(); }
  function drawCrystal(c, x, y, s, col, hi) { shadow(c, x + 2, y + 2, 7 * s, 3 * s); [[-4, 0, 9], [0, -2, 14], [4, 1, 8]].forEach(([dx, dy, h]) => { c.fillStyle = col; c.beginPath(); c.moveTo(x + (dx - 2.5) * s, y + dy * s); c.lineTo(x + dx * s, y + (dy - h) * s); c.lineTo(x + (dx + 2.5) * s, y + dy * s); c.fill(); c.fillStyle = hi; c.beginPath(); c.moveTo(x + (dx - 1) * s, y + (dy - 1) * s); c.lineTo(x + dx * s, y + (dy - h + 2) * s); c.lineTo(x + dx * s, y + dy * s); c.fill(); }); }
  function renderMap(c, map, L, seed) {
    const r = rng(seed);
    // 땅
    c.fillStyle = map.ground[0]; c.fillRect(0, 0, BW, BH);
    for (let i = 0; i < 260; i++) { const x = r() * BW; const y = r() * BH; ellipse(c, x, y, 6 + r() * 16, 3 + r() * 8, r() < 0.5 ? map.ground[1] : map.ground[2], r() * 3); }
    if (map.key === 'meadow') for (let i = 0; i < 120; i++) { c.strokeStyle = r() < 0.5 ? '#5aa83e' : '#9be07a'; c.lineWidth = 1; const x = r() * BW; const y = r() * BH; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 3); c.stroke(); }
    if (map.key === 'desert') for (let i = 0; i < 14; i++) { const x = r() * BW; const y = r() * BH; ellipse(c, x, y, 30 + r() * 30, 8 + r() * 6, 'rgba(255,240,200,.45)', 0); ellipse(c, x + 4, y + 4, 26 + r() * 20, 5, 'rgba(180,130,60,.25)', 0); }
    if (map.key === 'lava') for (let i = 0; i < 40; i++) { c.strokeStyle = 'rgba(255,120,40,.35)'; c.lineWidth = 1; let x = r() * BW; let y = r() * BH; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 16; y += (r() - 0.5) * 16; c.lineTo(x, y); } c.stroke(); }
    if (map.key === 'castle') { c.strokeStyle = 'rgba(20,12,40,.35)'; c.lineWidth = 1; for (let y = 0; y < BH; y += 15) for (let x = (y / 15) % 2 ? 0 : 15; x < BW; x += 30) c.strokeRect(x + 0.5, y + 0.5, 30, 15); }
    if (map.key === 'ice') for (let i = 0; i < 60; i++) circle(c, r() * BW, r() * BH, 1 + r() * 1.5, 'rgba(255,255,255,.8)');
    // 길
    const road = () => { c.beginPath(); L.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
    c.lineJoin = 'round'; c.lineCap = 'round';
    road(); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 30; c.translate(0, 3); c.stroke(); c.translate(0, -3);
    road(); c.strokeStyle = map.road[0]; c.lineWidth = 28; c.stroke();
    road(); c.strokeStyle = map.road[1]; c.lineWidth = 23; c.stroke();
    road(); c.strokeStyle = map.road[2]; c.lineWidth = 9; c.setLineDash([2, 9]); c.stroke(); c.setLineDash([]);
    for (let i = 0; i < 90; i++) { const p = posAt(L, r() * L.len); ellipse(c, p.x + (r() - 0.5) * 16, p.y + (r() - 0.5) * 16, 1.5 + r() * 2, 1 + r(), map.road[2], r() * 3); }
    // 꾸밈 (길·터를 피해서)
    const free = (x, y, rad) => { const cx = Math.floor(x / CELL); const cy = Math.floor(y / CELL); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const px = (cx + dx) * CELL + 15; const py = (cy + dy) * CELL + 15; if (L.onPath(cx + dx, cy + dy) && Math.hypot(px - x, py - y) < 15 + rad) return false; } return !L.pads.some((p) => Math.hypot(p.x - x, p.y - y) < 16 + rad) && x > 8 && x < BW - 36 && y > 10; };
    const items = [];
    for (let i = 0; i < 400 && items.length < 46; i++) { const x = r() * BW; const y = r() * BH; if (free(x, y, 8) && !items.some((it) => Math.hypot(it.x - x, it.y - y) < 18)) items.push({ x, y, k: r(), s: 0.8 + r() * 0.5 }); }
    items.sort((a, b) => a.y - b.y);
    const anims = [];
    items.forEach((it) => {
      const { x, y, k, s } = it;
      switch (map.key) {
        case 'meadow': if (k < 0.5) drawTree(c, x, y, s, ['#3f9a3a', '#5cc04e', '#2f7f2e']); else if (k < 0.7) drawRock(c, x, y, s * 0.8, '#9a9aa6', '#c4c4cc'); else { [['#ff7ac0', -3, 0], ['#ffe35a', 2, -2], ['#ffffff', 4, 2]].forEach(([cl, dx, dy]) => circle(c, x + dx, y + dy, 2, cl)); } break;
        case 'desert': if (k < 0.3) { shadow(c, x + 2, y + 3, 6, 3); c.fillStyle = '#4a9a4a'; rrect(c, x - 2.5 * s, y - 14 * s, 5 * s, 16 * s, 2.5 * s, '#4a9a4a'); rrect(c, x - 8 * s, y - 9 * s, 4 * s, 7 * s, 2 * s, '#4a9a4a'); rrect(c, x + 4 * s, y - 11 * s, 4 * s, 6 * s, 2 * s, '#4a9a4a'); } else if (k < 0.65) drawRock(c, x, y, s, '#c08a50', '#e0b070'); else if (k < 0.8) { shadow(c, x + 3, y + 2, 12, 4); c.fillStyle = '#d8a860'; c.beginPath(); c.moveTo(x - 12 * s, y + 2); c.lineTo(x, y - 12 * s); c.lineTo(x + 12 * s, y + 2); c.fill(); c.fillStyle = '#b8884a'; c.beginPath(); c.moveTo(x, y - 12 * s); c.lineTo(x + 12 * s, y + 2); c.lineTo(x, y + 2); c.fill(); } else { c.strokeStyle = '#f4ecd8'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 5, y - 2); c.stroke(); circle(c, x - 6, y, 2, '#f4ecd8'); } break;
        case 'ice': if (k < 0.5) drawPine(c, x, y, s, true); else if (k < 0.8) drawCrystal(c, x, y, s, '#8ad8ff', '#e0f8ff'); else ellipse(c, x, y, 10 * s, 4 * s, '#ffffff'); break;
        case 'lava': if (k < 0.35) { ellipse(c, x, y, 12 * s, 6 * s, '#2a1a1a'); ellipse(c, x, y, 10 * s, 4.5 * s, '#ff5a1a'); ellipse(c, x - 2, y - 1, 5 * s, 2 * s, '#ffd23a'); anims.push({ k: 'lavaglow', x, y, r: 16 * s }); } else if (k < 0.7) drawRock(c, x, y, s, '#2a2024', '#4a3a40'); else drawCrystal(c, x, y, s, '#ff3a4a', '#ffb0a0'); break;
        case 'castle': if (k < 0.25) { shadow(c, x + 2, y + 3, 5, 2); c.fillStyle = '#5a5a66'; c.fillRect(x - 2, y - 14, 4, 15); c.fillStyle = '#3a3a44'; c.fillRect(x - 3, y - 16, 6, 3); anims.push({ k: 'torch', x, y: y - 18 }); } else if (k < 0.55) { c.strokeStyle = '#2a2034'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y + 2); c.lineTo(x, y - 14 * s); c.moveTo(x, y - 8 * s); c.lineTo(x - 6 * s, y - 14 * s); c.moveTo(x, y - 10 * s); c.lineTo(x + 6 * s, y - 16 * s); c.stroke(); } else if (k < 0.8) drawCrystal(c, x, y, s, '#a050ff', '#e0b0ff'); else drawRock(c, x, y, s, '#5a5070', '#7a7090'); break;
        default: break;
      }
    });
    // 터 (돌 발판)
    L.pads.forEach((p) => { shadow(c, p.x + 1, p.y + 4, 13, 5); ellipse(c, p.x, p.y + 1, 13, 10, '#6a6470'); ellipse(c, p.x, p.y - 1, 12, 9, '#a8a2b0'); ellipse(c, p.x, p.y - 1, 9, 6.5, '#c4bece'); c.strokeStyle = 'rgba(80,70,90,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x - 6, p.y - 1); c.lineTo(p.x + 6, p.y - 1); c.moveTo(p.x, p.y - 6); c.lineTo(p.x, p.y + 4); c.stroke(); });
    // 입구(동굴)
    const [ex, ey] = L.pts[0]; const sx = Math.max(6, ex + CELL); ellipse(c, sx - 10, ey, 14, 17, '#1a1420'); ellipse(c, sx - 8, ey, 10, 13, '#0a060e');
    return anims;
  }
  // 성 (출구) — 맞으면 깜빡
  function drawCastle(c, L, t, hitT, lives) {
    const [x0, y0] = L.pts[L.pts.length - 1]; const x = Math.min(BW - 22, x0 - 14); const y = y0;
    shadow(c, x + 4, y + 16, 26, 8);
    const wall = hitT > 0 && Math.floor(t * 20) % 2 ? '#ffb0b0' : '#dcd6e8';
    rrect(c, x - 20, y - 10, 40, 26, 3, '#9a92b0'); rrect(c, x - 18, y - 12, 36, 25, 3, wall);
    for (let k = -18; k < 18; k += 8) rrect(c, x + k, y - 17, 5, 6, 1, wall);
    [-20, 14].forEach((dx) => { rrect(c, x + dx, y - 26, 8, 40, 2, '#c8c0da'); c.fillStyle = '#3a6ad8'; c.beginPath(); c.moveTo(x + dx - 2, y - 26); c.lineTo(x + dx + 4, y - 38); c.lineTo(x + dx + 10, y - 26); c.fill(); });
    rrect(c, x - 5, y + 2, 10, 14, 5, '#6a4a2a');
    const wv = Math.sin(t * 6) * 2; c.fillStyle = '#e53b44'; c.beginPath(); c.moveTo(x + 18, y - 38); c.lineTo(x + 28, y - 35 + wv); c.lineTo(x + 18, y - 31); c.fill(); c.strokeStyle = '#4a4a54'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 18, y - 40); c.lineTo(x + 18, y - 26); c.stroke();
    if (lives <= 5) glow(c, x, y, 34, 'rgba(255,60,60,1)', 0.15 + Math.sin(t * 6) * 0.08);
  }
  function drawAnims(c, anims, t) {
    anims.forEach((a) => {
      if (a.k === 'lavaglow') glow(c, a.x, a.y, a.r + Math.sin(t * 2 + a.x) * 2, '#ff6a2a', 0.35);
      else if (a.k === 'torch') { const f = Math.sin(t * 14 + a.x) * 1.2; ellipse(c, a.x, a.y + 1, 3, 5 + f, '#ff8a2a'); ellipse(c, a.x, a.y + 2, 1.6, 3 + f * 0.5, '#ffe35a'); glow(c, a.x, a.y, 16, '#ffa040', 0.45); }
    });
  }

  // ---------- 탑 ----------
  // tw: { type, lvl(1~3), br('a'|'b'|null), x, y, ang, kick(쏜 직후 움찔), frozen, sealed }
  const TOWER_INFO = {
    arrow: { name: '화살탑', icon: '🏹', cost: 50, a: { name: '저격탑', icon: '🎯' }, b: { name: '연사탑', icon: '🔁' } },
    ice: { name: '얼음탑', icon: '❄️', cost: 60, a: { name: '눈보라탑', icon: '🌨' }, b: { name: '얼음창탑', icon: '🔷' } },
    bolt: { name: '번개탑', icon: '⚡', cost: 80, a: { name: '폭풍탑', icon: '🌩' }, b: { name: '테슬라탑', icon: '🔌' } },
    cannon: { name: '대포', icon: '💣', cost: 70, a: { name: '박격포', icon: '🎇' }, b: { name: '미사일탑', icon: '🚀' } },
  };
  function towerBase(c, x, y, lvl, br) {
    shadow(c, x + 1, y + 6, 13, 5);
    ellipse(c, x, y + 3, 12, 8, '#4a4452'); ellipse(c, x, y + 1, 11.5, 7.5, br ? '#8a7aa8' : lvl >= 3 ? '#c8a050' : '#9a94a6');
    ellipse(c, x, y, 9, 5.5, br ? '#a898c8' : lvl >= 3 ? '#e8c870' : '#b8b2c4');
  }
  function pips(c, x, y, lvl, br) {
    if (br) { c.fillStyle = '#ff7ae0'; c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x + 3, y + 9); c.lineTo(x, y + 12); c.lineTo(x - 3, y + 9); c.fill(); glow(c, x, y + 9, 6, '#ff7ae0', 0.5); return; }
    for (let i = 0; i < lvl; i++) circle(c, x - (lvl - 1) * 3 + i * 6, y + 9, 1.6, '#ffe35a');
  }
  function drawTower(c, tw, t) {
    const { x, y, lvl, br } = tw; const ang = tw.ang || 0; const kick = tw.kick > 0 ? tw.kick * 3 : 0;
    towerBase(c, x, y, lvl, br);
    c.save();
    switch (tw.type) {
      case 'arrow': {
        const body = lvl === 1 ? '#a8743e' : '#9a94a6'; const body2 = lvl === 1 ? '#8a5a2a' : '#7a7488';
        if (br === 'a') { rrect(c, x - 5, y - 24, 10, 26, 2, '#6a6480'); rrect(c, x - 5, y - 24, 4, 26, 2, '#8a84a0'); }
        else { rrect(c, x - 7, y - 16, 14, 18, 2, body); rrect(c, x - 7, y - 16, 5, 18, 2, body2); for (let k = -6; k < 7; k += 5) rrect(c, x + k, y - 20, 3, 5, 1, body); }
        if (lvl >= 2 && !br) { c.fillStyle = '#4a4458'; c.fillRect(x - 7, y - 9, 14, 1.5); }
        if (lvl >= 3 && !br) { c.fillStyle = '#e53b44'; c.beginPath(); c.moveTo(x + 6, y - 22); c.lineTo(x + 13, y - 19); c.lineTo(x + 6, y - 16); c.fill(); }
        const hy = br === 'a' ? y - 26 : y - 19;
        c.translate(x, hy); c.rotate(ang);
        if (br === 'b') { [-3, 3].forEach((oy) => { c.fillStyle = '#6a4424'; c.fillRect(-4 - kick, oy - 1, 12, 2.5); c.strokeStyle = '#3a2414'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(4 - kick, oy - 6); c.quadraticCurveTo(0 - kick, oy, 4 - kick, oy + 6); c.stroke(); }); }
        else if (br === 'a') { c.fillStyle = '#3a3448'; c.fillRect(-6 - kick, -1.5, 22, 3); c.fillStyle = '#8af0ff'; c.fillRect(2, -4, 4, 2.5); glow(c, 4, -3, 4, '#8af0ff', 0.6); }
        else { c.fillStyle = '#6a4424'; c.fillRect(-4 - kick, -1.2, 13, 2.6); c.strokeStyle = '#3a2414'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(5 - kick, -7); c.quadraticCurveTo(-1 - kick, 0, 5 - kick, 7); c.stroke(); c.strokeStyle = '#e8e0d0'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(5 - kick, -7); c.lineTo(-2 - kick, 0); c.lineTo(5 - kick, 7); c.stroke(); }
        break;
      }
      case 'ice': {
        rrect(c, x - 6, y - 10, 12, 12, 3, '#7a9ac8'); rrect(c, x - 6, y - 10, 4, 12, 3, '#9ab8e0');
        const bob = Math.sin(t * 3 + x) * 2; const big = lvl >= 3 || br;
        const cr = (cx, cy, s, rot) => { c.save(); c.translate(cx, cy); c.rotate(rot); c.fillStyle = '#9ae8ff'; c.beginPath(); c.moveTo(0, -9 * s); c.lineTo(5 * s, 0); c.lineTo(0, 9 * s); c.lineTo(-5 * s, 0); c.closePath(); c.fill(); c.fillStyle = '#e8fbff'; c.beginPath(); c.moveTo(0, -9 * s); c.lineTo(2 * s, 0); c.lineTo(0, 9 * s); c.closePath(); c.fill(); c.restore(); };
        if (br === 'b') { c.fillStyle = '#9ae8ff'; c.beginPath(); c.moveTo(x - 4, y - 8); c.lineTo(x, y - 34); c.lineTo(x + 4, y - 8); c.fill(); c.fillStyle = '#e8fbff'; c.beginPath(); c.moveTo(x - 1, y - 9); c.lineTo(x, y - 32); c.lineTo(x + 2, y - 9); c.fill(); glow(c, x, y - 30, 8, '#8af0ff', 0.6); }
        else {
          glow(c, x, y - 20 + bob, big ? 16 : 11, '#8af0ff', 0.45);
          cr(x, y - 20 + bob, big ? 1.25 : 1, Math.sin(t * 1.5) * 0.3);
          if (lvl >= 2) { cr(x - 8, y - 14 + bob * 0.5, 0.45, t * 2); cr(x + 8, y - 14 - bob * 0.5, 0.45, -t * 2); }
          if (br === 'a') for (let k = 0; k < 6; k++) { const a = t * 2 + k * 1.05; circle(c, x + Math.cos(a) * 14, y - 16 + Math.sin(a) * 6, 1.6, '#ffffff'); }
        }
        break;
      }
      case 'bolt': {
        rrect(c, x - 4, y - 22, 8, 24, 2, '#5a5a6a'); rrect(c, x - 4, y - 22, 3, 24, 2, '#7a7a8a');
        const rings = lvl + (br ? 1 : 0); for (let k = 0; k < rings; k++) ellipse(c, x, y - 6 - k * 5, 7 - k * 0.5, 2.2, '#c8783a');
        const oy = y - 25; const pulse = 4 + Math.sin(t * 10) * 0.8 + (lvl >= 3 ? 1 : 0);
        if (br === 'b') { [-5, 5].forEach((dx) => { c.strokeStyle = '#8a8a9a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, oy + 4); c.lineTo(x + dx, oy - 4); c.stroke(); circle(c, x + dx, oy - 5, 2.6, '#bff6ff'); glow(c, x + dx, oy - 5, 8, '#7ae0ff', 0.6); }); }
        else { circle(c, x, oy, pulse, '#bff6ff'); circle(c, x - 1, oy - 1, pulse * 0.5, '#ffffff'); glow(c, x, oy, 14 + (br === 'a' ? 6 : 0), '#7ae0ff', 0.55); if (br === 'a') { ellipse(c, x, oy - 8, 10, 4, 'rgba(90,100,130,.85)'); ellipse(c, x + 4, oy - 10, 6, 3, 'rgba(120,130,160,.85)'); } }
        if (Math.floor(t * 8 + x) % 3 === 0) { c.strokeStyle = '#bff6ff'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, oy); c.lineTo(x + (Math.random() - 0.5) * 12, oy + (Math.random() - 0.5) * 12); c.stroke(); }
        break;
      }
      case 'cannon': {
        ellipse(c, x, y - 4, 11, 8, lvl >= 3 ? '#5a5464' : '#6a6474'); ellipse(c, x, y - 6, 10, 6.5, lvl >= 3 ? '#7a7488' : '#8a8498');
        if (lvl >= 2) for (let k = 0; k < 6; k++) { const a = k * 1.05; circle(c, x + Math.cos(a) * 9, y - 5 + Math.sin(a) * 6, 1.2, '#c8a050'); }
        c.translate(x, y - 7);
        if (br === 'a') { c.rotate(-0.4); rrect(c, -6, -10, 12, 12, 3, '#3a3444'); ellipse(c, 0, -10, 6, 2.5, '#1a1420'); }
        else if (br === 'b') { c.rotate(ang); rrect(c, -6, -7, 14, 14, 2, '#4a5468'); [-3, 3].forEach((oy) => { rrect(c, 6 - kick, oy - 2, 7, 4, 2, '#e8e8f0'); c.fillStyle = '#e53b44'; c.fillRect(11 - kick, oy - 2, 2, 4); }); }
        else { c.rotate(ang); const len = 11 + lvl * 2; rrect(c, -3 - kick, -3.2 - lvl * 0.4, len, 6.4 + lvl * 0.8, 2, '#2e2a36'); circle(c, len - 3 - kick, 0, 3 + lvl * 0.4, '#1a1620'); }
        break;
      }
      default: break;
    }
    c.restore();
    if (tw.frozen > 0) { c.save(); c.globalAlpha = 0.75; rrect(c, x - 12, y - 30, 24, 34, 4, '#bfefff'); c.restore(); c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.strokeRect(x - 12, y - 30, 24, 34); }
    if (tw.sealed > 0) { glow(c, x, y - 12, 20, '#b06aff', 0.6); c.strokeStyle = '#d0a0ff'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y - 12, 14, t * 3, t * 3 + 4.5); c.stroke(); }
    pips(c, x, y, lvl, br);
  }

  // ---------- 괴물 ----------
  const MON = {
    slime: { r: 8, hp: 40, spd: 36, gold: 3, lives: 1 },
    runner: { r: 7, hp: 28, spd: 66, gold: 3, lives: 1 },
    tank: { r: 10, hp: 150, spd: 24, gold: 8, lives: 2, armor: 4 },
    flyer: { r: 7, hp: 38, spd: 44, gold: 5, lives: 1, fly: true },
    splitter: { r: 11, hp: 85, spd: 32, gold: 6, lives: 1 },
    mini: { r: 5, hp: 26, spd: 46, gold: 1, lives: 1 },
    healer: { r: 8, hp: 65, spd: 32, gold: 7, lives: 1 },
    knight: { r: 9, hp: 95, spd: 30, gold: 7, lives: 2, armor: 8 },
    imp: { r: 6, hp: 40, spd: 70, gold: 2, lives: 1 },
    kingslime: { r: 22, hp: 1100, spd: 16, gold: 120, lives: 10, boss: true },
    scorpion: { r: 20, hp: 1400, spd: 17, gold: 140, lives: 10, boss: true, armor: 6 },
    giant: { r: 22, hp: 1900, spd: 14, gold: 160, lives: 10, boss: true, armor: 4 },
    dragon: { r: 22, hp: 2200, spd: 18, gold: 180, lives: 10, boss: true, fly: true },
    demon: { r: 22, hp: 2800, spd: 15, gold: 250, lives: 10, boss: true, armor: 6 },
  };
  const BOSS_NAME = { kingslime: '킹 슬라임', scorpion: '사막 전갈 왕', giant: '얼음 거인', dragon: '화염 용', demon: '마왕' };
  function eyes(c, x, y, gap, r, look) { [-1, 1].forEach((s) => { circle(c, x + s * gap, y, r, '#ffffff'); circle(c, x + s * gap + look, y + 0.3, r * 0.55, '#1a1420'); circle(c, x + s * gap + look - r * 0.2, y - r * 0.3, r * 0.2, '#ffffff'); }); }
  function hpBar(c, m, x, y, w) {
    if (m.hp >= m.max) return;
    const f = Math.max(0, m.hp / m.max);
    rrect(c, x - w / 2 - 1, y - 1, w + 2, 4, 2, 'rgba(20,12,28,.75)');
    rrect(c, x - w / 2, y, w * f, 2.4, 1.2, f > 0.5 ? '#6af06a' : f > 0.25 ? '#ffd23a' : '#ff4a4a');
  }
  function drawMonster(c, m, t, map) {
    const D = MON[m.type]; const x = m.x; const face = m.fx || 1; const ph = t * 8 + m.seed * 6;
    const fly = D.fly; const by = fly ? m.y - 12 + Math.sin(ph * 0.7) * 2 : m.y; const tint = map.tint;
    if (m.hidden) { ellipse(c, x, m.y + 2, D.r * 1.1, D.r * 0.45, '#8a6a40'); for (let k = 0; k < 3; k++) circle(c, x + (Math.random() - 0.5) * D.r, m.y + (Math.random() - 0.5) * 4, 1.5, '#c8a070'); return; }
    shadow(c, x, m.y + D.r * 0.7, D.r * (fly ? 0.7 : 1), D.r * 0.35);
    c.save(); c.translate(x, by); c.scale(face, 1);
    const hit = m.flash > 0;
    const C = (col) => (hit ? '#ffffff' : col);
    switch (m.type) {
      case 'slime': case 'mini': case 'splitter': case 'kingslime': {
        const r = D.r; const sq = Math.sin(ph) * 0.12;
        const col = m.type === 'splitter' ? '#b05ad8' : m.type === 'kingslime' ? '#4ad86a' : tint;
        ellipse(c, 0, -r * (0.55 - sq * 0.3), r * (1 + sq), r * (0.85 - sq), C(col));
        ellipse(c, -r * 0.35, -r * 0.95, r * 0.35, r * 0.2, 'rgba(255,255,255,.55)');
        if (m.type === 'splitter') { circle(c, -r * 0.3, -r * 0.4, r * 0.25, 'rgba(255,255,255,.25)'); circle(c, r * 0.3, -r * 0.5, r * 0.22, 'rgba(255,255,255,.25)'); }
        eyes(c, r * 0.15, -r * 0.6, r * 0.32, r * 0.2, 0.6);
        if (m.type === 'kingslime') { c.fillStyle = C('#ffd23a'); c.beginPath(); c.moveTo(-9, -r * 1.25); c.lineTo(-9, -r * 1.65); c.lineTo(-4, -r * 1.45); c.lineTo(0, -r * 1.8); c.lineTo(4, -r * 1.45); c.lineTo(9, -r * 1.65); c.lineTo(9, -r * 1.25); c.closePath(); c.fill(); circle(c, 0, -r * 1.42, 2, '#e53b44'); }
        break;
      }
      case 'runner': case 'imp': {
        const r = D.r; const lg = Math.sin(ph * 1.6) * 3; const col = m.type === 'imp' ? '#ff6a2a' : '#8a8aa0';
        c.strokeStyle = C('#4a4a5a'); c.lineWidth = 2; c.beginPath(); c.moveTo(-3, 0); c.lineTo(-3 + lg, 5); c.moveTo(3, 0); c.lineTo(3 - lg, 5); c.stroke();
        ellipse(c, 0, -3, r * 1.2, r * 0.75, C(col)); ellipse(c, r * 0.9, -6, r * 0.6, r * 0.5, C(col));
        c.fillStyle = C(col); c.beginPath(); c.moveTo(r * 0.6, -9); c.lineTo(r * 0.8, -14); c.lineTo(r * 1.1, -9); c.fill();
        c.strokeStyle = C(col); c.lineWidth = 2.5; c.beginPath(); c.moveTo(-r * 1.1, -4); c.quadraticCurveTo(-r * 1.7, -8 + lg * 0.5, -r * 1.9, -2); c.stroke();
        circle(c, r * 1.1, -7, 1.3, '#ffe35a'); circle(c, r * 1.4, -5, 1, '#1a1420');
        break;
      }
      case 'tank': {
        const r = D.r; const lg = Math.sin(ph) * 1.5;
        [[-6, 1], [6, 1]].forEach(([dx, dy]) => ellipse(c, dx + lg, dy + 2, 3, 2.5, C('#5a7a4a')));
        ellipse(c, 0, -5, r * 1.15, r * 0.85, C('#6a6a7a')); ellipse(c, 0, -7, r * 0.9, r * 0.6, C('#8a8a9a'));
        [[-5, -8], [3, -9], [-1, -4], [6, -5]].forEach(([dx, dy]) => ellipse(c, dx, dy, 2.6, 2, C('#5a5a68')));
        ellipse(c, r * 1.1, -3, 4, 3.4, C('#7a9a5a')); circle(c, r * 1.3, -4, 1, '#1a1420');
        break;
      }
      case 'flyer': {
        const w = Math.sin(ph * 2) * 5; const col = map.key === 'lava' ? '#c0302a' : '#6a3aa8';
        c.fillStyle = C(col); [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(0, -3); c.quadraticCurveTo(s * 9, -10 + w, s * 13, -2 + w * 0.6); c.quadraticCurveTo(s * 8, 0, 0, 0); c.fill(); });
        ellipse(c, 0, -2, 5, 5.5, C(col)); [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(s * 2, -6); c.lineTo(s * 4, -10); c.lineTo(s * 4, -5); c.fill(); });
        circle(c, -1.8, -3, 1.2, '#ffe35a'); circle(c, 1.8, -3, 1.2, '#ffe35a');
        break;
      }
      case 'healer': {
        const sw = Math.sin(ph * 0.5) * 0.15;
        c.fillStyle = C('#3a8a5a'); c.beginPath(); c.moveTo(-7, 2); c.lineTo(0, -16); c.lineTo(7, 2); c.closePath(); c.fill();
        circle(c, 0, -14, 4.5, C('#f3c39b')); c.fillStyle = C('#2a6a4a'); c.beginPath(); c.arc(0, -15, 5, Math.PI, 0); c.fill();
        circle(c, 1.5, -13.5, 0.9, '#1a1420');
        c.save(); c.rotate(sw); c.strokeStyle = C('#8a5a2a'); c.lineWidth = 1.6; c.beginPath(); c.moveTo(7, 2); c.lineTo(7, -18); c.stroke(); c.restore();
        circle(c, 7, -19, 2.4, '#7aff9a'); glow(c, 7, -19, 8, '#7aff9a', 0.6);
        break;
      }
      case 'knight': {
        const lg = Math.sin(ph * 1.2) * 2;
        c.strokeStyle = C('#4a4a5a'); c.lineWidth = 2.4; c.beginPath(); c.moveTo(-2, -2); c.lineTo(-2 + lg, 4); c.moveTo(2, -2); c.lineTo(2 - lg, 4); c.stroke();
        rrect(c, -5, -12, 10, 11, 2, C('#a8b0c8')); rrect(c, -5, -12, 3, 11, 2, C('#c8d0e0'));
        circle(c, 0, -15, 4.6, C('#b8c0d4')); c.fillStyle = '#1a1420'; c.fillRect(-1, -16, 5, 1.6);
        c.fillStyle = C('#e53b44'); c.beginPath(); c.moveTo(-1, -19); c.quadraticCurveTo(-6, -24, -8, -18); c.lineTo(-2, -18); c.fill();
        rrect(c, 4, -13, 6, 11, 3, C('#3a5ab8')); circle(c, 7, -8, 1.6, '#ffd23a');
        break;
      }
      case 'scorpion': {
        const r = D.r; const lg = Math.sin(ph) * 2;
        for (let k = -1; k <= 1; k++) { c.strokeStyle = C('#6a3a1a'); c.lineWidth = 2; c.beginPath(); c.moveTo(k * 7, -4); c.lineTo(k * 8 + lg, 6); c.stroke(); }
        ellipse(c, 0, -6, r * 0.8, r * 0.5, C('#c0602a')); [-6, 0, 6].forEach((dx) => ellipse(c, dx, -9, 3, 2, C('#e08040')));
        let tx = -r * 0.7; let ty = -8; c.fillStyle = C('#c0602a'); for (let k = 0; k < 5; k++) { tx -= 3; ty -= 5; circle(c, tx + k, ty, 4 - k * 0.4, C('#c0602a')); }
        c.fillStyle = C('#3a1a1a'); c.beginPath(); c.moveTo(tx + 3, ty - 3); c.lineTo(tx + 9, ty - 1); c.lineTo(tx + 4, ty + 2); c.fill();
        [-1, 1].forEach((s) => { c.strokeStyle = C('#c0602a'); c.lineWidth = 3; c.beginPath(); c.moveTo(r * 0.6, -6 + s * 3); c.lineTo(r * 1.1, -6 + s * 8); c.stroke(); ellipse(c, r * 1.25, -6 + s * 9, 4, 2.6, C('#e08040')); });
        eyes(c, r * 0.6, -10, 2, 1.6, 0.5);
        break;
      }
      case 'giant': {
        const sw = Math.sin(ph * 0.5) * 2; const st = m.stompT > 0 ? -4 : 0;
        rrect(c, -8, -6, 6, 10, 2, C('#7aa8d8')); rrect(c, 2, -6, 6, 10, 2, C('#7aa8d8'));
        rrect(c, -14, -30, 28, 26, 8, C('#a8d8ff')); rrect(c, -14, -30, 9, 26, 8, C('#c8e8ff'));
        circle(c, 0, -34, 9, C('#c8e8ff')); eyes(c, 3, -35, 3.2, 2, 0.6); c.fillStyle = '#5a8ab8'; c.fillRect(-1, -29, 8, 1.5);
        [-1, 1].forEach((s) => { rrect(c, s * 14 - 4, -27 + sw * s + st, 8, 16, 4, C('#8ac0f0')); circle(c, s * 16, -10 + sw * s + st, 5.5, C('#a8d8ff')); });
        drawCrystalM(c, -6, -40); drawCrystalM(c, 6, -41);
        break;
      }
      case 'dragon': {
        const w = Math.sin(ph * 1.4) * 8;
        c.fillStyle = C('#8a1a1a'); [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(-2, -10); c.quadraticCurveTo(-6, -30 + w * (s > 0 ? 1 : 0.6) - 4, -18 + s * 4, -24 + w); c.lineTo(-10, -8); c.closePath(); c.fill(); });
        ellipse(c, 0, -8, 16, 9, C('#d0302a')); ellipse(c, 2, -6, 11, 5, C('#ffb15a'));
        c.strokeStyle = C('#d0302a'); c.lineWidth = 5; c.beginPath(); c.moveTo(-14, -8); c.quadraticCurveTo(-26, -6, -30, -14 + Math.sin(ph) * 3); c.stroke();
        ellipse(c, 16, -14, 8, 6, C('#d0302a')); c.fillStyle = C('#f3e0c0'); c.beginPath(); c.moveTo(12, -19); c.lineTo(10, -26); c.lineTo(15, -20); c.fill();
        circle(c, 18, -16, 1.8, '#ffe35a'); if (Math.floor(t * 3) % 2) glow(c, 25, -12, 8, '#ff8a2a', 0.6);
        break;
      }
      case 'demon': {
        const fl = Math.sin(ph * 0.6) * 2;
        c.fillStyle = C('#2a1440'); c.beginPath(); c.moveTo(-14, 4); c.quadraticCurveTo(-18 + fl, -14, -8, -28); c.lineTo(8, -28); c.quadraticCurveTo(18 - fl, -14, 14, 4); c.closePath(); c.fill();
        rrect(c, -9, -28, 18, 22, 4, C('#5a2a8a')); rrect(c, -9, -28, 6, 22, 4, C('#7a4aaa'));
        circle(c, 0, -33, 8, C('#8a3aa0')); c.fillStyle = C('#f3e0c0'); [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(s * 5, -38); c.quadraticCurveTo(s * 12, -44, s * 10, -50); c.lineTo(s * 7, -40); c.fill(); });
        circle(c, -3, -34, 1.8, '#ff3a3a'); circle(c, 3, -34, 1.8, '#ff3a3a'); glow(c, 0, -34, 8, '#ff3a3a', 0.4);
        c.strokeStyle = C('#3a2a4a'); c.lineWidth = 2; c.beginPath(); c.moveTo(13, 2); c.lineTo(13, -36); c.stroke(); circle(c, 13, -38, 3.5, '#d06aff'); glow(c, 13, -38, 10, '#d06aff', 0.6);
        if (m.shield > 0) { c.globalAlpha = 0.35 + Math.sin(t * 8) * 0.1; circle(c, 0, -20, 26, '#b06aff'); c.globalAlpha = 1; c.strokeStyle = '#e0b0ff'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -20, 26, 0, TAU); c.stroke(); }
        break;
      }
      default: circle(c, 0, -6, 7, '#f0f');
    }
    c.restore();
    if (m.slowT > 0) { c.save(); c.globalAlpha = 0.35; circle(c, x, by - D.r * 0.6, D.r * 1.05, '#8ae0ff'); c.restore(); }
    if (m.stunT > 0) { c.save(); c.globalAlpha = 0.7; rrect(c, x - D.r - 2, by - D.r * 1.9, D.r * 2 + 4, D.r * 2.2, 3, '#cff4ff'); c.restore(); }
    if (m.burnT > 0) for (let k = 0; k < 2; k++) { const fx = x + (Math.random() - 0.5) * D.r; ellipse(c, fx, by - D.r - Math.random() * 4, 1.6, 3, '#ffa03a'); }
    if (m.healPulse > 0) { c.strokeStyle = `rgba(122,255,154,${m.healPulse})`; c.lineWidth = 1.5; c.beginPath(); c.arc(x, m.y - 6, 50 * (1 - m.healPulse) + 6, 0, TAU); c.stroke(); }
    hpBar(c, m, x, by - D.r * (D.boss ? 2.6 : 2) - 4, D.boss ? 40 : 18);
  }
  function drawCrystalM(c, x, y) { c.fillStyle = '#e8fbff'; c.beginPath(); c.moveTo(x - 2.5, y + 4); c.lineTo(x, y - 6); c.lineTo(x + 2.5, y + 4); c.fill(); }

  // ---------- 탄·효과 ----------
  function drawShot(c, s, t) {
    switch (s.k) {
      case 'arrow': { c.save(); c.translate(s.x, s.y); c.rotate(s.ang); c.strokeStyle = '#6a4424'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-7, 0); c.lineTo(4, 0); c.stroke(); c.fillStyle = '#d0d0d8'; c.beginPath(); c.moveTo(6, 0); c.lineTo(2, -2.2); c.lineTo(2, 2.2); c.fill(); c.fillStyle = '#e8e0d0'; c.fillRect(-8, -2, 3, 1.2); c.fillRect(-8, 0.8, 3, 1.2); c.restore(); break; }
      case 'snipe': { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(138,240,255,.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - Math.cos(s.ang) * 22, s.y - Math.sin(s.ang) * 22); c.stroke(); c.restore(); break; }
      case 'shard': { c.save(); c.translate(s.x, s.y); c.rotate(s.ang); glow(c, 0, 0, 7, '#8af0ff', 0.6); c.fillStyle = '#e0fbff'; c.beginPath(); c.moveTo(6, 0); c.lineTo(0, -2.5); c.lineTo(-5, 0); c.lineTo(0, 2.5); c.fill(); c.restore(); break; }
      case 'spear': { c.save(); c.translate(s.x, s.y); c.rotate(s.ang); glow(c, 0, 0, 10, '#8af0ff', 0.7); c.fillStyle = '#e0fbff'; c.beginPath(); c.moveTo(12, 0); c.lineTo(-8, -3); c.lineTo(-8, 3); c.fill(); c.restore(); break; }
      case 'ball': case 'shell': { const h = s.h || 0; shadow(c, s.x, s.y + 2, 3, 1.5); circle(c, s.x, s.y - h, s.k === 'shell' ? 4 : 3.2, '#1e1a26'); circle(c, s.x - 1, s.y - h - 1, 1.2, '#6a6478'); if (s.k === 'shell') glow(c, s.x, s.y - h, 7, '#ff8a2a', 0.5); break; }
      case 'missile': { c.save(); c.translate(s.x, s.y); c.rotate(s.ang); c.fillStyle = '#e8e8f0'; c.fillRect(-5, -1.6, 9, 3.2); c.fillStyle = '#e53b44'; c.beginPath(); c.moveTo(6, 0); c.lineTo(4, -1.6); c.lineTo(4, 1.6); c.fill(); glow(c, -6, 0, 5, '#ffb03a', 0.8); c.restore(); break; }
      case 'boom': { const f = s.t / s.life; c.save(); c.globalAlpha = 1 - f; glow(c, s.x, s.y, s.r * (0.6 + f), s.col || '#ffa040', 0.9); c.strokeStyle = s.ring || '#fff0c0'; c.lineWidth = 2 * (1 - f) + 0.5; c.beginPath(); c.arc(s.x, s.y, s.r * (0.3 + f), 0, TAU); c.stroke(); c.restore(); break; }
      case 'bolt': { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - s.t / s.life; for (let pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? '#ffffff' : '#7ae0ff'; c.lineWidth = pass ? 1 : 3; c.beginPath(); s.pts.forEach((p, i) => { if (!i) { c.moveTo(p[0], p[1]); return; } const q = s.pts[i - 1]; const n = 4; for (let k = 1; k <= n; k++) { const fx = q[0] + (p[0] - q[0]) * k / n + (k < n ? (Math.random() - 0.5) * 8 : 0); const fy = q[1] + (p[1] - q[1]) * k / n + (k < n ? (Math.random() - 0.5) * 8 : 0); c.lineTo(fx, fy); } }); c.stroke(); } c.restore(); break; }
      case 'pulse': { const f = s.t / s.life; c.save(); c.globalAlpha = (1 - f) * 0.7; c.strokeStyle = s.col; c.lineWidth = 3; c.beginPath(); c.arc(s.x, s.y, s.r * f, 0, TAU); c.stroke(); c.restore(); break; }
      case 'meteor': { const f = s.t / s.fall; const mx = s.x + (1 - f) * 90; const my = s.y - (1 - f) * 220; c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) glow(c, mx + k * 9, my - k * 22, 14 - k * 2, '#ff8a2a', 0.5); c.restore(); circle(c, mx, my, 9, '#5a2a1a'); circle(c, mx - 2, my - 2, 5, '#ffb03a'); c.strokeStyle = 'rgba(255,80,40,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(s.x, s.y, 34, 0, TAU); c.stroke(); break; }
      default: break;
    }
  }
  function drawCoin(c, x, y, a) { c.save(); c.globalAlpha = a; circle(c, x, y, 4, '#c8901a'); circle(c, x, y, 3.2, '#ffd23a'); c.fillStyle = '#fff4b0'; c.fillRect(x - 1.5, y - 2, 1.5, 3); c.restore(); }
  // 메뉴 아이콘용 작은 탑 그림
  function towerIcon(type, br) {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c = cv.getContext('2d');
    c.scale(1.6, 1.6); drawTower(c, { type, lvl: br ? 3 : 1, br: br || null, x: 20, y: 30, ang: -0.3 }, 0.5);
    return cv.toDataURL();
  }

  window.TWTdArt = { BW, BH, CELL, MAPS, MON, BOSS_NAME, TOWER_INFO, layout, posAt, renderMap, drawCastle, drawAnims, drawTower, drawMonster, drawShot, drawCoin, towerIcon, glow, circle, rng };
})();
