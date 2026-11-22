(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mq = matchMedia('(max-width: 899px)');
  const isMobile = () => mq.matches;

  /* ---------- fit the 1440 canvas ---------- */
  const ba = $('#ba'), baMac = $('.ba-mac');
  function fit() {
    const z = isMobile() ? 1 : Math.min(1, document.documentElement.clientWidth / 1440);
    document.documentElement.style.setProperty('--z', z);
    // the before/after laptop keeps its desktop geometry; scale it to fit on phones
    // (930 = 834px lid + the base sticking out 48px on each side)
    if (isMobile()) {
      const s = baMac.parentElement.clientWidth / 930;
      baMac.style.transform = `scale(${s})`;
      baMac.style.marginLeft = `${48 * s}px`;
      baMac.style.marginBottom = `${-baMac.offsetHeight * (1 - s)}px`;
    } else { baMac.style.transform = ''; baMac.style.marginLeft = ''; baMac.style.marginBottom = ''; }
  }
  fit();
  addEventListener('resize', fit);

  /* ---------- intro ---------- */
  const start = () => requestAnimationFrame(() => document.body.classList.add('loaded'));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
  setTimeout(start, 1200);

  /* ---------- charts ---------- */
  const C = 2 * Math.PI * 80;
  $$('svg[data-segs]').forEach(svg => {
    let acc = 0;
    svg.innerHTML = svg.dataset.segs.split(',').map(s => {
      const [v, cls] = s.split(':');
      const len = C * (+v / 100);
      const c = `<circle class="${cls}" cx="110" cy="110" r="80" stroke-dasharray="0 ${C}" stroke-dashoffset="${-acc}" data-len="${len}"/>`;
      acc += len;
      return c;
    }).join('');
  });
  function runChart(el) {
    $$('circle[data-len]', el).forEach((c, i) => {
      setTimeout(() => c.setAttribute('stroke-dasharray', `${c.dataset.len} ${C}`), reduce ? 0 : 120 + i * 140);
    });
    $$('.bar span', el).forEach(b => { b.style.height = (+b.dataset.v * 2.78) + 'px'; });
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      if (el.hasAttribute('data-chart')) runChart(el);
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  const targets = $$('.r, [data-io], .conn');
  targets.forEach(el => io.observe(el));
  // ?static → reveal everything at once (for full-page snapshots)
  if (location.search.includes('static')) targets.forEach(el => {
    el.classList.add('in'); if (el.hasAttribute('data-chart')) runChart(el);
  });

  /* ---------- scroll-driven bits ---------- */
  const bar = $('.progress span');
  const words = $$('.watermark');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
      if (reduce || isMobile()) return;
      const vh = innerHeight;
      words.forEach(w => {
        const r = w.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const c = (r.top + r.height / 2 - vh / 2) / vh;
        w.style.transform = `translateX(${(c * 90 * +w.dataset.drift).toFixed(1)}px)`;
      });
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- hero: light + parallax ---------- */
  const hero = $('#hero'), card = $('.hero-card'), heroImg = $('.hero-move');
  if (!reduce) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (x * 100) + '%');
      card.style.setProperty('--my', (y * 100) + '%');
      heroImg.style.setProperty('--px', ((x - .5) * -16).toFixed(1) + 'px');
      heroImg.style.setProperty('--py', ((y - .5) * -10).toFixed(1) + 'px');
    });
    hero.addEventListener('pointerleave', () => {
      heroImg.style.setProperty('--px', '0px');
      heroImg.style.setProperty('--py', '0px');
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (!reduce) $$('.magnetic').forEach(b => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.translate = `${(e.clientX - r.left - r.width / 2) * .18}px ${(e.clientY - r.top - r.height / 2) * .28}px`;
    });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });

  /* ---------- before / after ---------- */
  // the old screenshot covers the left 414px of the 802px screen
  const MAX = 414, W = 802;
  const setX = (x) => {
    x = Math.max(0, Math.min(MAX, x));
    ba.style.setProperty('--x', x + 'px');
    ba.setAttribute('aria-valuenow', Math.round(x / W * 100));
  };
  const toX = (e) => {
    const r = ba.getBoundingClientRect();
    return (e.clientX - r.left) / r.width * W;
  };
  let drag = false;
  ba.addEventListener('pointerdown', (e) => { drag = true; ba.setPointerCapture(e.pointerId); setX(toX(e)); });
  ba.addEventListener('pointermove', (e) => { if (drag) setX(toX(e)); });
  ba.addEventListener('pointerup', () => { drag = false; });
  ba.addEventListener('keydown', (e) => {
    const cur = parseFloat(getComputedStyle(ba).getPropertyValue('--x')) || MAX;
    if (e.key === 'ArrowLeft') { setX(cur - 20); e.preventDefault(); }
    if (e.key === 'ArrowRight') { setX(cur + 20); e.preventDefault(); }
  });
  // a short hint sweep the first time it comes into view
  if (!reduce) {
    const hint = new IntersectionObserver((ents) => {
      if (!ents[0].isIntersecting) return;
      hint.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / 1800);
        if (drag) return;
        setX(MAX - Math.sin(p * Math.PI) * 260);
        if (p < 1) requestAnimationFrame(step);
      };
      setTimeout(() => requestAnimationFrame(step), 500);
    }, { threshold: .5 });
    hint.observe(ba);
  }

  /* ---------- copy swatch hex ---------- */
  const toast = $('#toast');
  $$('.sw').forEach(sw => sw.addEventListener('click', () => {
    const hex = sw.dataset.hex;
    (navigator.clipboard ? navigator.clipboard.writeText(hex) : Promise.reject()).catch(() => {});
    toast.textContent = `Copied ${hex}`;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 1400);
  }));
})();
