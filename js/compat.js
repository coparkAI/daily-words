// 옛 브라우저(iOS 12 사파리 = Safari 12) 호환 보완 — 다른 스크립트보다 먼저 불러온다.
// 최신 브라우저에는 이미 있는 기능이라 아무것도 하지 않는다.
// 이 파일과 app.js·games.js 는 ES2018 문법까지만 쓴다 (?. ?? 금지 — tools/check_compat.js 로 검사).
(function () {
  'use strict';

  // ---------- 1) 포인터 이벤트 (Safari 13 부터 지원) ----------
  // 터치·마우스 이벤트를 받아 pointerdown/move/up/cancel 이벤트를 만들어 같은 대상에 보낸다.
  // 코드에서는 반드시 addEventListener('pointer…') 로 받는다 (onpointerdown 속성은 옛 브라우저가 모름).
  if (!window.PointerEvent) {
    var lastTouch = 0;
    var mouseDown = false;
    var fire = function (type, src, target, e, extra) {
      var ev;
      try { ev = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: src.clientX, clientY: src.clientY, screenX: src.screenX, screenY: src.screenY }); }
      catch (err) { ev = document.createEvent('MouseEvents'); ev.initMouseEvent(type, true, true, window, 0, src.screenX, src.screenY, src.clientX, src.clientY, false, false, false, false, 0, null); }
      var props = { pointerId: extra.id, pointerType: extra.type, pressure: extra.pressure, isPrimary: true, width: 1, height: 1, tiltX: 0, tiltY: 0 };
      Object.keys(props).forEach(function (k) { try { Object.defineProperty(ev, k, { value: props[k] }); } catch (err) { /* 무시 */ } });
      try { Object.defineProperty(ev, 'buttons', { value: extra.buttons }); } catch (err) { /* 무시 */ }
      target.dispatchEvent(ev);
      if (ev.defaultPrevented && e.cancelable) e.preventDefault();
    };
    var MAP = { touchstart: 'pointerdown', touchmove: 'pointermove', touchend: 'pointerup', touchcancel: 'pointercancel' };
    Object.keys(MAP).forEach(function (tt) {
      document.addEventListener(tt, function (e) {
        lastTouch = Date.now();
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          // 터치는 손을 뗄 때까지 처음 누른 요소가 대상 (포인터 캡처와 같은 효과)
          fire(MAP[tt], t, t.target, e, {
            id: t.identifier + 2, type: t.touchType === 'stylus' ? 'pen' : 'touch',
            pressure: tt === 'touchend' || tt === 'touchcancel' ? 0 : (t.force || 0.5), buttons: tt === 'touchend' || tt === 'touchcancel' ? 0 : 1,
          });
        }
      }, { capture: true, passive: false });
    });
    var MOUSE = { mousedown: 'pointerdown', mousemove: 'pointermove', mouseup: 'pointerup' };
    Object.keys(MOUSE).forEach(function (mt) {
      document.addEventListener(mt, function (e) {
        if (Date.now() - lastTouch < 1000) return; // 터치 뒤에 따라오는 가짜 마우스 이벤트는 무시
        if (mt === 'mousedown') mouseDown = true;
        if (mt === 'mouseup') mouseDown = false;
        fire(MOUSE[mt], e, e.target, e, { id: 1, type: 'mouse', pressure: mouseDown ? 0.5 : 0, buttons: mouseDown ? 1 : 0 });
      }, true);
    });
    if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = function () {};
    if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = function () {};
  }

  // ---------- 2) <dialog> 창 (Safari 15.4 부터 지원) ----------
  // makeDialog(id, className): 없으면 만들고, showModal/close/open 이 없으면 채워 넣는다.
  window.makeDialog = function (id, className) {
    var dlg = document.getElementById(id);
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = id; dlg.className = className;
    document.body.appendChild(dlg);
    if (typeof dlg.showModal !== 'function') {
      dlg.classList.add('dlg-shim');
      var backdrop = document.createElement('div');
      backdrop.className = 'dlg-shim-backdrop';
      Object.defineProperty(dlg, 'open', { get: function () { return dlg.hasAttribute('open'); } });
      dlg.showModal = function () {
        document.body.appendChild(backdrop); document.body.appendChild(dlg);
        dlg.setAttribute('open', '');
      };
      dlg.close = function () {
        dlg.removeAttribute('open');
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      };
      // Esc 키 = 취소 (진짜 dialog 처럼 oncancel 을 먼저 부른다)
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !dlg.open) return;
        var ev = { defaultPrevented: false, preventDefault: function () { this.defaultPrevented = true; } };
        if (typeof dlg.oncancel === 'function') dlg.oncancel(ev);
        if (!ev.defaultPrevented) dlg.close();
      });
    }
    return dlg;
  };

  // ---------- 3) flex gap (Safari 14.1 부터 지원) ----------
  // 지원하지 않으면 <html class="no-flexgap"> — CSS 에서 여백을 대신 준다.
  try {
    var f = document.createElement('div');
    f.style.display = 'flex'; f.style.flexDirection = 'column'; f.style.rowGap = '1px'; f.style.position = 'absolute';
    f.appendChild(document.createElement('div')); f.appendChild(document.createElement('div'));
    document.documentElement.appendChild(f);
    if (f.scrollHeight !== 1) document.documentElement.classList.add('no-flexgap');
    document.documentElement.removeChild(f);
  } catch (err) { /* 무시 */ }
})();
