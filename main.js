/* Hansika Gupta — Portfolio interactions */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.getElementById('theme-toggle').addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('hg-theme', next); } catch (e) {}
  });

  /* ---------- Nav state + progress ---------- */
  var nav = document.getElementById('nav');
  var bar = document.getElementById('progress-bar');
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 24);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { if (s) spy.observe(s); });
  }

  /* ---------- Count-up ---------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    if (reduceMotion) { el.textContent = to; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  /* ---------- Gauges ---------- */
  var CIRC = 2 * Math.PI * 52;
  function fillGauge(g) {
    var v = parseFloat(g.getAttribute('data-value'));
    var max = parseFloat(g.getAttribute('data-max'));
    var fill = g.querySelector('.g-fill');
    fill.style.strokeDashoffset = (CIRC * (1 - v / max)).toFixed(2);
  }

  /* ---------- Rank dots (each dot = 10 teams) ---------- */
  document.querySelectorAll('.rank-dots').forEach(function (box) {
    var total = Math.round(parseInt(box.getAttribute('data-total'), 10) / 10);
    var hit = Math.max(1, Math.round(parseInt(box.getAttribute('data-hit'), 10) / 10));
    var frag = document.createDocumentFragment();
    for (var i = 0; i < total; i++) {
      var d = document.createElement('i');
      if (i < hit) d.className = 'hit';
      frag.appendChild(d);
    }
    box.appendChild(frag);
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('in');
        el.querySelectorAll('.count').forEach(countUp);
        el.querySelectorAll('.gauge').forEach(fillGauge);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el, i) {
      // light stagger for siblings
      var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(sibs, 4) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    document.querySelectorAll('.gauge').forEach(fillGauge);
  }

  /* ---------- Project filters ---------- */
  var chips = document.querySelectorAll('.chip');
  var projects = document.querySelectorAll('.proj');
  // an odd card out spans the full row so the grid never ends half-empty
  function balance() {
    var vis = Array.prototype.filter.call(projects, function (p) { return !p.classList.contains('is-hidden'); });
    projects.forEach(function (p) { p.classList.remove('is-wide'); });
    if (vis.length % 2 === 1) vis[vis.length - 1].classList.add('is-wide');
  }
  balance();
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      projects.forEach(function (p) {
        var cats = p.getAttribute('data-cat').split(' ');
        var show = f === 'all' || cats.indexOf(f) !== -1;
        p.classList.toggle('is-hidden', !show);
        if (show) { p.classList.add('in'); }
      });
      balance();
    });
  });

  /* ---------- Copy email ---------- */
  var toast = document.getElementById('toast');
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1800);
  }
  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () { btn.textContent = 'Copied'; showToast(text + ' copied'); setTimeout(function () { btn.textContent = 'Copy'; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { window.location.href = 'mailto:' + text; });
      } else {
        window.location.href = 'mailto:' + text;
      }
    });
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Hero: two-source wave interference ---------- */
  var canvas = document.getElementById('wave');
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, dpr = 1, spacing = 22, cols = 0, rows = 0;
  var mouse = { x: null, y: null, tx: null, ty: null };
  var running = true, t = 0;

  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spacing = W < 600 ? 18 : 22;
    cols = Math.ceil(W / spacing) + 1;
    rows = Math.ceil(H / spacing) + 1;
  }

  function waveColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--wave').trim() || '23,22,26';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var rgb = waveColor();
    // Two sources: one drifts on a slow orbit, the other follows the cursor (or drifts too)
    var s1x = W * (0.72 + 0.06 * Math.sin(t * 0.00025));
    var s1y = H * (0.30 + 0.08 * Math.cos(t * 0.0003));
    if (mouse.tx !== null) {
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
    }
    var s2x = mouse.x !== null ? mouse.x : W * (0.88 + 0.05 * Math.cos(t * 0.0002));
    var s2y = mouse.y !== null ? mouse.y : H * (0.72 + 0.06 * Math.sin(t * 0.00035));
    var k = 0.055, w = t * 0.0024;

    for (var i = 0; i < cols; i++) {
      var x = i * spacing;
      for (var j = 0; j < rows; j++) {
        var y = j * spacing;
        var d1 = Math.sqrt((x - s1x) * (x - s1x) + (y - s1y) * (y - s1y));
        var d2 = Math.sqrt((x - s2x) * (x - s2x) + (y - s2y) * (y - s2y));
        var a = (Math.sin(d1 * k - w) + Math.sin(d2 * k - w)) * 0.5; // -1..1
        var amp = a * a;                                               // intensity 0..1
        var rad = 0.5 + amp * 2.1;
        ctx.fillStyle = 'rgba(' + rgb + ',' + (0.08 + amp * 0.42).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, 6.2832);
        ctx.fill();
      }
    }
  }

  function loop(ts) {
    if (!running) return;
    t = ts;
    draw();
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);
  var hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
    if (mouse.x === null) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
  });
  hero.addEventListener('pointerleave', function () { mouse.tx = mouse.ty = mouse.x = mouse.y = null; });

  if (reduceMotion) {
    t = 4000; draw();
  } else if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !running) { running = true; requestAnimationFrame(loop); }
      else if (!vis) { running = false; }
    }).observe(hero);
    requestAnimationFrame(loop);
  } else {
    requestAnimationFrame(loop);
  }
  // redraw once on theme change when paused
  new MutationObserver(function () { if (!running || reduceMotion) draw(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
