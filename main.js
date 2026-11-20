(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- progress bar ---------- */
  const bar = $('#progress');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- step observer helper ---------- */
  function steps(selector, cb) {
    const els = $$(selector);
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) cb(e.target, els.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ---------- map ---------- */
  const asia = $('#mapAsia'), lake = $('#mapLake');
  steps('#where .step', el => {
    const m = el.dataset.map;
    asia.classList.toggle('show', m === 'asia');
    asia.classList.toggle('zoom', m === 'lake');
    lake.classList.toggle('on', m === 'lake');
  });

  /* ---------- dolphin grid ---------- */
  const D = '<svg viewBox="0 0 40 22"><path d="M3 13c0-5 5-9 13-9 7 0 12 2 16 6l4-4-.5 6 3 5-5-2c-4 3-10 4-16 4C9 19 3 17 3 13zm13-9c1-2 3-3 5-3l-1 4z"/></svg>';
  const grid = $('#dgrid');
  const TOTAL = 102;
  grid.innerHTML = D.repeat(TOTAL);
  const icons = [...grid.children];
  const count = $('#count'), lbl = $('#countLbl');
  let shown = TOTAL;
  function setCount(n, y) {
    icons.forEach((s, i) => {
      s.classList.toggle('gone', i >= n);
      s.classList.toggle('last', n <= 13 && i < n);
    });
    lbl.textContent = 'ตัว · ' + y;
    if (reduce) { count.textContent = n; shown = n; return; }
    const from = shown, t0 = performance.now(), dur = 900;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      count.textContent = Math.round(from + (n - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    shown = n;
  }
  const bgs = $$('.numbg');
  steps('#numbers .step', el => {
    setCount(+el.dataset.n, el.dataset.y);
    bgs.forEach(b => b.classList.toggle('on', b.dataset.bg === el.dataset.bg));
  });

  /* ---------- goal icons 13 -> 20 ---------- */
  const goal = $('#goal');
  if (goal) {
    goal.innerHTML = D.repeat(20);
    [...goal.children].forEach((s, i) => { if (i >= 13) s.classList.add('new'); });
  }

  /* ---------- timeline chart ---------- */
  const svg = $('#chart');
  if (svg) {
    const NS = 'http://www.w3.org/2000/svg';
    const W = 1000, H = 440, L = 60, R = 30, T = 30, B = 60;
    const x0 = 2540, x1 = 2569, yMax = 110;
    const X = y => L + (y - x0) / (x1 - x0) * (W - L - R);
    const Y = v => T + (1 - v / yMax) * (H - T - B);
    const el = (tag, attrs, txt) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (txt != null) n.textContent = txt;
      svg.appendChild(n); return n;
    };
    // death-rate bands
    [[2540, 2545, 'ตายเฉลี่ย 4–5 ตัว/ปี'], [2550, 2555, 'ตายราว 10 ตัว/ปี'], [2562, 2564.9, 'เกยตื้น 1–2 ตัว/ปี']].forEach(([a, b, t], i) => {
      el('rect', { class: 'band', x: X(a), y: T, width: X(b) - X(a), height: H - T - B });
      el('text', { class: 'bandt', x: X(a) + 6, y: T + 16 + (i === 2 ? 22 : 0) }, t);
    });
    // axes
    [0, 25, 50, 75, 100].forEach(v => {
      el('line', { class: 'ax', x1: L, x2: W - R, y1: Y(v), y2: Y(v), opacity: v ? .35 : 1 });
      el('text', { x: L - 10, y: Y(v) + 4, 'text-anchor': 'end' }, v);
    });
    [2545, 2550, 2555, 2560, 2565].forEach(y => el('text', { x: X(y), y: H - B + 24, 'text-anchor': 'middle' }, y));
    el('text', { x: X(2541.5), y: H - B + 24, 'text-anchor': 'middle' }, 'ก่อน 2545');
    el('text', { x: L - 10, y: T - 12, 'text-anchor': 'end' }, 'ตัว');
    // data: [start, end, value, label]
    const data = [[2541.5, 2541.5, 102, 'ราว 102'], [2545, 2548, 18, '18'], [2558, 2562, 27, '27'], [2563, 2563, 20, '20'], [2565, 2567, 14, '14'], [2568, 2568, 13, '13']];
    for (let i = 0; i < data.length - 1; i++) {
      const a = data[i], b = data[i + 1];
      el('line', { class: 'gap', x1: X(a[1]), y1: Y(a[2]), x2: X(b[0]), y2: Y(b[2]) });
    }
    data.forEach(([a, b, v, t], i) => {
      if (b > a) el('line', { class: 'seg', x1: X(a), x2: X(b), y1: Y(v), y2: Y(v) });
      else el('circle', { class: 'dot', cx: X(a), cy: Y(v), r: 6 });
      const tx = el('text', { class: 'val', x: (X(a) + X(b)) / 2, y: Y(v) - 14, 'text-anchor': 'middle' }, t);
      if (i === data.length - 1) { tx.setAttribute('fill', '#f6b93b'); tx.textContent = '13 ตัวสุดท้าย'; tx.setAttribute('text-anchor', 'end'); tx.setAttribute('x', X(a) + 8); tx.setAttribute('y', Y(v) + 30); }
    });
    el('text', { x: X(2545) + 4, y: Y(18) + 26 }, 'เริ่มทำประมงปลาบึก');
  }

  /* ---------- reveal ---------- */
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  $$('.rv, .cause').forEach(e => rio.observe(e));

  /* ---------- videos: play only when visible ---------- */
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; if (!reduce) v.play().catch(() => {}); }
    else v.pause();
  }), { rootMargin: '10% 0px' });
  $$('video[data-auto]').forEach(v => { v.muted = true; vio.observe(v); });

  /* ---------- audio players ---------- */
  const PLAY = '<svg viewBox="0 0 10 10"><path d="M2 1l7 4-7 4z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 10 10"><path d="M2 1h2v8H2zM6 1h2v8H6z"/></svg>';
  let current = null;
  $$('.aud').forEach(btn => {
    const icon = $('.b', btn), fill = $('.bar i', btn);
    icon.innerHTML = PLAY;
    let a = null;
    btn.addEventListener('click', () => {
      if (!a) {
        a = new Audio(btn.dataset.src);
        a.addEventListener('timeupdate', () => { fill.style.width = (a.currentTime / a.duration * 100 || 0) + '%'; });
        a.addEventListener('ended', () => { icon.innerHTML = PLAY; fill.style.width = '0'; });
        a.addEventListener('pause', () => { icon.innerHTML = PLAY; });
        a.addEventListener('play', () => { icon.innerHTML = PAUSE; });
      }
      if (a.paused) { if (current && current !== a) current.pause(); current = a; a.play(); }
      else a.pause();
    });
  });

  /* ---------- lightbox ---------- */
  const lb = $('#lb'), lbImg = $('#lb img');
  const open = src => { lbImg.src = src; lb.classList.add('on'); };
  $$('.zoomable, .album img').forEach(i => i.addEventListener('click', () => open(i.currentSrc || i.src)));
  $$('[data-lb]').forEach(b => b.addEventListener('click', () => open(b.dataset.lb)));
  lb.addEventListener('click', () => lb.classList.remove('on'));
  addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('on'); });

  /* ---------- tell a parent page our height (for auto-resizing embeds) ---------- */
  if (window.parent !== window) {
    const post = () => parent.postMessage({ type: 'irrawaddy:height', height: document.documentElement.scrollHeight }, '*');
    addEventListener('load', post); addEventListener('resize', post);
  }
})();
