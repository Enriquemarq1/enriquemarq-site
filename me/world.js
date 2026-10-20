/* Enrique's hub.
   1. The blue world: when "I strive for a life…" reaches the middle of the screen, the whole page turns
      into his blue, and a sunrise is printed behind the words in his dot matrix.
   2. The changing word under the headline, the hand that high-fives, the rings drawn around a few words,
      and the heart that opens what he plays. Everything else stays still. */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(v) { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); }

  /* ---------- the blue world ---------- */
  function sky() {
    var section = document.querySelector('.vision'); if (!section) return;
    var canvas = section.querySelector('canvas.sky'), ctx = canvas && canvas.getContext('2d');
    var inner = section.querySelector('.vision-in');
    var live = false, visible = false, show = 0, cleared = true, quiet = null;
    var w, h, dpr, cell, cols, rows, c, sprites, seed, S = 10;

    function layout() {
      if (!ctx) return;
      w = section.clientWidth; h = section.clientHeight; if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cell = w < 700 ? 11 : 13;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      cols = Math.ceil(w / cell) + 1; rows = Math.ceil(h / cell) + 1;
      c = Math.ceil(cell * dpr);
      sprites = document.createElement('canvas'); sprites.width = S * c; sprites.height = 2 * c;
      var x = sprites.getContext('2d');
      ['#61AEFA', '#EAF4FF'].forEach(function (col, j) {
        x.fillStyle = col;
        for (var i = 1; i < S; i++) { x.beginPath(); x.arc(i * c + c / 2, j * c + c / 2, c * 0.5 * (0.16 + 0.8 * i / (S - 1)), 0, 6.2832); x.fill(); }
      });
      seed = new Float32Array(cols * rows);
      for (var k = 0; k < seed.length; k++) { var s = Math.sin(k * 127.1 + 311.7) * 43758.5453; seed[k] = s - Math.floor(s); }
      /* nothing is printed behind the words */
      if (inner) { var a = inner.getBoundingClientRect(), b = section.getBoundingClientRect(); quiet = { x0: a.left - b.left - 36, x1: a.right - b.left + 36, y1: a.bottom - b.top + 34 }; }
      cleared = false;
    }

    function frame(now) {
      if (!ctx || !w) return;
      show += ((live ? 1 : 0) - show) * (reduce ? 1 : easy ? 0.09 : 0.045);
      if (show < 0.004) { if (!cleared) { ctx.clearRect(0, 0, canvas.width, canvas.height); cleared = true; } return; }
      cleared = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var t = reduce ? 0 : now / 1000, e = smooth(show);
      var rect = section.getBoundingClientRect(), vh = window.innerHeight;
      var through = clamp((vh - rect.top) / (vh + rect.height), 0, 1);       /* how far the section has travelled */
      var H = h - Math.min(h * 0.2, 170);                                    /* the horizon */
      var Rs = Math.min(w * (w < 700 ? 0.42 : 0.23), h * 0.34);
      var cx = w / 2, cy = H + Rs * 0.22 + (1 - e) * Rs * 0.95 - (through - 0.5) * 46;   /* the sun rises as the page turns */
      var ox = (w - cols * cell) / 2, tick = Math.floor(t * 1.1);
      for (var r = 0, i = 0; r < rows; r++) {
        var y = r * cell + cell / 2;
        for (var q = 0; q < cols; q++, i++) {
          var x = ox + q * cell + cell / 2, v = 0, white = 0;
          if (quiet && y < quiet.y1 && x > quiet.x0 && x < quiet.x1) continue;
          if (y < H) {
            var dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy);
            if (d < Rs) { v = 0.3 + 0.7 * Math.pow(1 - d / Rs, 0.5); white = d < Rs * 0.42 ? 1 : 0; }
            else {
              var g = 1 - (d - Rs) / (Rs * 0.5);
              if (g > 0) v = g * g * 0.3 * (0.8 + 0.2 * Math.sin(t * 0.9 - d * 0.035));     /* the glow breathes outward */
              var s = seed[i];
              if (s > 0.9875 && y < H * 0.8) { var tw = 0.12 + 0.16 * (0.5 + 0.5 * Math.sin(t * 1.5 + s * 400)); if (tw > v) { v = tw; white = 1; } }
            }
          } else {
            var depth = (y - H) / (h - H);
            var wave = 0.5 + 0.5 * Math.sin(x * 0.014 + y * 0.09 - t * 0.7 + Math.sin(x * 0.006 + t * 0.25) * 1.6);
            v = (0.1 + 0.5 * depth) * wave;
            var refl = 1 - Math.abs(x - cx) / (Rs * (1 - depth * 0.5));                     /* the sun on the water */
            if (refl > 0 && (r + tick) % 2 === 0) { var rv = 0.28 + 0.62 * refl * (1 - depth * 0.45); if (rv > v) { v = rv; white = refl > 0.55 ? 1 : 0; } }
          }
          v *= e; if (v < 0.07) continue;
          var idx = Math.round(v * (S - 1)); if (idx > S - 1) idx = S - 1;
          ctx.drawImage(sprites, idx * c, white * c, c, c, Math.round((x - cell / 2) * dpr), Math.round((y - cell / 2) * dpr), c, c);
        }
      }
    }

    /* the sentence arrives phrase by phrase */
    var say = section.querySelector('.say');
    if (say) { var parts = say.children; for (var p = 0; p < parts.length; p++) { parts[p].classList.add('wd'); parts[p].style.setProperty('--n', p); } }

    function turn(on) {
      live = on;
      document.body.classList.toggle('deep', on);
      if (on) section.classList.add('live');
      var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', on ? '#1C4E8E' : '#ffffff');
    }
    if ('IntersectionObserver' in window) {
      /* the page turns when this part crosses the middle of the screen */
      new IntersectionObserver(function (es) { turn(es[0].isIntersecting); }, { rootMargin: '-46% 0px -46% 0px' }).observe(section);
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: '80px 0px' }).observe(section);
    } else { section.classList.add('live'); }
    layout();
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    var easy = matchMedia('(pointer: coarse)').matches, skip = false;
    (function loop(now) { requestAnimationFrame(loop); if (document.hidden || !(visible || show > 0.004)) return; if (easy && (skip = !skip)) return; frame(now); })(performance.now());
  }

  /* ---------- the changing word: one word at a time, quietly ---------- */
  function words() {
    var slot = document.querySelector('.who-slot'); if (!slot) return;
    var list = slot.querySelectorAll('.w'), at = 0;
    if (list.length < 2) return;
    function fit() { slot.style.width = list[at].offsetWidth + 'px'; }
    function next() {
      var from = list[at]; at = (at + 1) % list.length; var to = list[at];
      from.classList.remove('on'); from.classList.add('out');
      to.classList.remove('out'); to.classList.add('on');
      fit();
      setTimeout(function () { from.classList.remove('out'); }, 600);
    }
    list[0].classList.add('on'); fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    addEventListener('resize', fit);
    if (!reduce) setInterval(function () { if (!document.hidden) next(); }, 2600);
  }

  /* ---------- rings drawn by hand around a few words ---------- */
  function rings() {
    var marks = document.querySelectorAll('mark.m-circle');
    function draw(el) {
      var old = el.querySelector('svg.ring'); if (old) el.removeChild(old);
      var fs = parseFloat(getComputedStyle(el).fontSize), w = el.offsetWidth + fs * 0.66, h = el.offsetHeight + fs * 0.12;
      if (!w || !h) return;
      var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'), path = document.createElementNS(ns, 'path');
      svg.setAttribute('class', 'ring'); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('width', w); svg.setAttribute('height', h); svg.setAttribute('aria-hidden', 'true');
      var cx = w / 2, cy = h / 2, rx = w / 2 - fs * 0.1, ry = h / 2 - fs * 0.1, d = '', n = 80, a0 = -2.5, sweep = 6.2832 * 1.1;
      for (var i = 0; i <= n; i++) {
        var t = i / n, a = a0 + sweep * t, k = 1.03 - 0.09 * t + 0.025 * Math.sin(a * 2 + 1);
        d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rx * k).toFixed(1) + ' ' + (cy + Math.sin(a) * ry * (k + 0.03 * Math.sin(a * 3))).toFixed(1);
      }
      path.setAttribute('d', d); svg.appendChild(path); el.appendChild(svg);
      var len = Math.ceil(path.getTotalLength()); path.style.strokeDasharray = len; path.style.setProperty('--len', len);
    }
    function all() { for (var i = 0; i < marks.length; i++) draw(marks[i]); }
    all();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(all, 160); });
  }

  /* ---------- the hand: it waves, and it gives a high five ---------- */
  function hand() {
    var btn = document.querySelector('.hi'); if (!btn) return;
    btn.addEventListener('click', function () {
      btn.classList.remove('pop'); void btn.getBoundingClientRect(); btn.classList.add('pop');
      if (reduce) return;
      for (var i = 0; i < 9; i++) {
        var sp = document.createElement('i'); sp.className = 'spark';
        sp.style.setProperty('--a', (i * 40 - 20 + Math.random() * 16) + 'deg');
        sp.style.setProperty('--d', (0.75 + Math.random() * 0.6) + 'em');
        if (i % 3 === 0) sp.classList.add('deep');
        btn.appendChild(sp);
        (function (node) { setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 720); })(sp);
      }
    });
  }

  /* ---------- things you can open: the heart (what he plays) and "solarpunk vibe" (how it feels) ---------- */
  function peeks() {
    var btns = document.querySelectorAll('[data-peek]'), open = null;
    function aim(btn, card) {
      /* the card sits above what you pressed and points at it, without leaving the screen */
      var host = card.parentNode.getBoundingClientRect(), r = btn.getBoundingClientRect(), half = card.offsetWidth / 2;
      var cx = r.left + r.width / 2, left = Math.min(Math.max(cx, half + 12), window.innerWidth - half - 12);
      card.style.left = (left - host.left) + 'px';
      card.style.setProperty('--ax', (cx - left + half) + 'px');
    }
    function set(btn, yes) {
      var card = document.getElementById(btn.getAttribute('aria-controls')), film = card.querySelector('video');
      clearTimeout(card._t);
      btn.setAttribute('aria-expanded', yes ? 'true' : 'false');
      if (yes) {
        if (open && open !== btn) set(open, false);
        open = btn; card.hidden = false; aim(btn, card); card.classList.add('on'); btn.classList.add('known');
        /* a tall card on a small screen: bring its top below the bar so it can be read from the start */
        var bar = document.querySelector('.bar'), need = (bar ? bar.getBoundingClientRect().bottom : 0) + 12, top = card.getBoundingClientRect().top - 8;
        if (top < need) window.scrollBy({ top: top - need, behavior: reduce ? 'auto' : 'smooth' });
        if (film && !reduce) { if (!film.getAttribute('src')) film.setAttribute('src', film.getAttribute('data-src')); var p = film.play(); if (p && p.catch) p.catch(function () {}); }
      } else {
        if (open === btn) open = null;
        card.classList.remove('on'); card._t = setTimeout(function () { card.hidden = true; }, 220);
        if (film && !film.paused) film.pause();
      }
    }
    for (var i = 0; i < btns.length; i++) (function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); set(btn, btn.getAttribute('aria-expanded') !== 'true'); });
    })(btns[i]);
    document.addEventListener('click', function (e) { if (open && !document.getElementById(open.getAttribute('aria-controls')).contains(e.target)) set(open, false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) set(open, false); });
    addEventListener('resize', function () { if (open) aim(open, document.getElementById(open.getAttribute('aria-controls'))); });
  }

  function start() {
    if ('IntersectionObserver' in window) {
      var seen = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('seen'); seen.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      var parts = document.querySelectorAll('.beat');
      for (var k = 0; k < parts.length; k++) seen.observe(parts[k]);
    } else {
      document.documentElement.classList.remove('js');
    }
    sky();
    words();
    rings();
    hand();
    peeks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
