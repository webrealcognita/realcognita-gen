// Set this to the actual GA event date/time.
const TARGET_DATE = new Date('2026-11-27T09:00:00+08:00');

const AUTOPLAY_MS = 9000;   // dwell time per slide when autoplay is running
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = id => document.getElementById(id);

const els = {
  days: $('days'), hours: $('hours'), minutes: $('minutes'), seconds: $('seconds'),
  overlay: $('countdown-overlay'),
  deck: $('deck'),
  rail: $('rail-fill'),
  hudChapter: $('hud-chapter'),
  hudNow: $('hud-now'),
  hudTotal: $('hud-total'),
  dots: $('deck-dots'),
  cdWhen: $('cd-when'),
  hint: $('deck-hint'),
};

/* ---------- brand GIF availability ----------
   assets/logo.gif drives the whole identity. If it is absent the inline SVG
   hexagon mark takes over (see .no-gif rules in style.css). */
(function checkGif(){
  const probe = new Image();
  probe.onerror = () => document.documentElement.classList.add('no-gif');
  probe.src = 'assets/logo.gif';
})();

/* ---------- masked word splitter ----------
   Wraps every word in its own overflow-hidden box so it can rise into place
   on a pure transform. Runs ONCE at load — nothing here costs frame time. */
function splitWords(node){
  let i = 0;
  node.classList.add('has-mask');
  node.innerHTML = node.innerHTML.replace(/(<[^>]+>)|([^<\s]+)/g,
    (m, tag, word) => tag || `<span class="mask" style="--w:${i++}"><i>${word}</i></span>`);
}

/* ---------- countdown entrance ---------- */
document.querySelectorAll('.cd-title').forEach(splitWords);
document.querySelectorAll('.reveal').forEach(el => el.style.setProperty('--d', el.dataset.delay || 0));
requestAnimationFrame(() => document.body.classList.add('ready'));

/* the footer date is derived from TARGET_DATE, so it can never drift out of sync */
if (els.cdWhen){
  const f = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'Asia/Singapore',
  }).formatToParts(TARGET_DATE);
  const g = t => f.find(x => x.type === t).value;
  els.cdWhen.innerHTML = `${g('day')} ${g('month')} ${g('year')} &nbsp;·&nbsp; ${g('hour')}:${g('minute')} SGT`;
}


/* ============================================================
   COUNTDOWN
   ============================================================ */
let revealed = false;
let timer = null;                       // declared before first use, see below
const pad = n => String(n).padStart(2, '0');

const set = (el, txt) => { if (el.textContent !== txt) el.textContent = txt; };

function renderCountdown(){
  const diff = TARGET_DATE - Date.now();

  if (diff <= 0){
    set(els.days, '00'); set(els.hours, '00'); set(els.minutes, '00'); set(els.seconds, '00');
    stopCountdown();
    openDeck();
    return;
  }

  set(els.days,    pad(Math.floor(diff / 86400000)));
  set(els.hours,   pad(Math.floor(diff / 3600000) % 24));
  set(els.minutes, pad(Math.floor(diff / 60000) % 60));
  set(els.seconds, pad(Math.floor(diff / 1000) % 60));

}

function stopCountdown(){
  if (timer !== null){ clearInterval(timer); timer = null; }
}
// NOTE: the clock is started at the very bottom of this file, after the deck
// is fully wired, so an already-passed date can never open the deck early.


/* ============================================================
   PARTICLE FIELD (countdown only — torn down when the deck opens)
   ============================================================ */
const particleField = (function particles(){
  const canvas = $('particles');
  if (!canvas || REDUCED) return { stop(){} };

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  // getContext can return null (context lost, canvas disabled, low memory).
  // The particles are decoration — never let them take the page down with them.
  if (!ctx){ canvas.remove(); return { stop(){} }; }
  const DPR = Math.min(devicePixelRatio || 1, 1.5);
  let w = 0, h = 0, dots = [], LINK = 0, LINK2 = 0, running = true, raf = 0;

  function resize(){
    w = canvas.width  = innerWidth * DPR;
    h = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    LINK = 130 * DPR; LINK2 = LINK * LINK;
    const count = Math.min(38, Math.round(innerWidth / 42));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .26 * DPR,
      vy: (Math.random() - .5) * .26 * DPR,
      r: (Math.random() * 1.4 + .5) * DPR,
    }));
  }

  function draw(){
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < dots.length; i++){
      const d = dots[i];
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0 || d.x > w) d.vx = -d.vx;
      if (d.y < 0 || d.y > h) d.vy = -d.vy;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 6.283185);
      ctx.fillStyle = 'rgba(38,208,124,.5)';
      ctx.fill();

      for (let j = i + 1; j < dots.length; j++){
        const o = dots[j];
        const dx = d.x - o.x, dy = d.y - o.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK2){
          ctx.beginPath();
          ctx.moveTo(d.x, d.y); ctx.lineTo(o.x, o.y);
          ctx.strokeStyle = `rgba(0,164,153,${(1 - Math.sqrt(d2) / LINK) * .2})`;
          ctx.lineWidth = DPR * .6;
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(draw);
  }

  let rt;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(resize, 150); };
  const onVisibility = () => {
    if (document.hidden){
      running = false;
      cancelAnimationFrame(raf);
    } else if (canvas.isConnected && !running){
      running = true;
      draw();                       // guarded, so we can never stack two loops
    }
  };

  resize();
  addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  draw();

  return {
    stop(){
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(rt);
      removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.remove();
    }
  };
})();


/* ============================================================
   PRESENTATION DECK
   ============================================================ */
const slides = [...document.querySelectorAll('.slide')];
const TOTAL = slides.length;
let current = 0;
let playing = false;
let playTimer = null;
let locked = false;   // ignore input mid-transition so slides can't stack up

// pre-stage the per-element animation delays once, not on every slide change
slides.forEach(s => s.querySelectorAll('[data-anim]').forEach(el => {
  el.style.setProperty('--a', el.dataset.anim || 1);
}));

/* Split every headline into masked words ONCE at load. Each word then rises
   out of its own overflow-hidden box on a pure transform — the whole effect
   is one composited layer per word and costs nothing per frame. */
slides.forEach(slide => slide.querySelectorAll('.title-xl, .title-lg, .statement').forEach(splitWords));

// build the dot rail
slides.forEach((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('aria-label', `Slide ${i + 1}: ${s.dataset.chapter}`);
  b.addEventListener('click', () => goTo(i));
  els.dots.appendChild(b);
});
const dotEls = [...els.dots.children];
els.hudTotal.textContent = pad(TOTAL);

function countUp(node){
  const target = +node.dataset.count;
  if (REDUCED){ node.textContent = target; return; }
  const dur = 1500, t0 = performance.now();
  (function frame(now){
    const t = Math.min(1, (now - t0) / dur);
    node.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(frame);
  })(t0);
}

function goTo(index){
  if (!TOTAL) return;
  const next = (index + TOTAL) % TOTAL;
  if (next === current || locked) return;
  locked = true;

  const out = slides[current];
  const into = slides[next];

  out.classList.remove('is-active');
  out.classList.add('is-leaving');

  // restart the per-element entrance on the incoming slide
  into.querySelectorAll('[data-anim]').forEach(el => {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  });

  into.classList.add('is-active');
  current = next;
  syncChrome();

  into.querySelectorAll('b[data-count]').forEach(countUp);

  setTimeout(() => { out.classList.remove('is-leaving'); locked = false; }, 800);
  if (playing) schedule();
}

const nextSlide = () => goTo(current + 1);
const prevSlide = () => goTo(current - 1);

function syncChrome(){
  if (!TOTAL) return;                  // no slides -> nothing to sync, never throw
  els.rail.style.transform = `scaleX(${(current + 1) / TOTAL})`;
  els.hudChapter.textContent = slides[current].dataset.chapter;
  els.hudNow.textContent = pad(current + 1);
  dotEls.forEach((d, i) => d.classList.toggle('on', i === current));
}

function schedule(){
  clearTimeout(playTimer);
  playTimer = setTimeout(nextSlide, AUTOPLAY_MS);
}

function setPlaying(on){
  playing = on;
  els.deck.classList.toggle('playing', on);
  if (on) schedule(); else clearTimeout(playTimer);
}

/* ---------- controls ---------- */
$('btn-next').addEventListener('click', nextSlide);
$('btn-prev').addEventListener('click', prevSlide);
$('btn-play').addEventListener('click', () => setPlaying(!playing));
$('btn-full').addEventListener('click', toggleFullscreen);

function toggleFullscreen(){
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

document.addEventListener('keydown', e => {
  if (els.deck.hidden) return;
  // never swallow the browser's own shortcuts (Ctrl+F, Ctrl+P, Cmd+...)
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  switch (e.key){
    case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown':
      e.preventDefault(); nextSlide(); break;
    case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
      e.preventDefault(); prevSlide(); break;
    case 'Home': goTo(0); break;
    case 'End': goTo(TOTAL - 1); break;
    case 'f': case 'F': toggleFullscreen(); break;
    case 'p': case 'P': setPlaying(!playing); break;
  }
});

// wheel / swipe, throttled to one step per gesture
let wheelLock = false;
els.deck.addEventListener('wheel', e => {
  if (wheelLock || Math.abs(e.deltaY) < 18) return;
  wheelLock = true;
  e.deltaY > 0 ? nextSlide() : prevSlide();
  setTimeout(() => { wheelLock = false; }, 700);
}, { passive: true });

let touchY = null;
els.deck.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
els.deck.addEventListener('touchend', e => {
  if (touchY === null) return;
  const dy = touchY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 55) dy > 0 ? nextSlide() : prevSlide();
  touchY = null;
}, { passive: true });

// fade the hint out once the presenter is clearly driving
setTimeout(() => els.hint?.classList.add('fade'), 7000);


/* ============================================================
   COUNTDOWN → DECK
   ============================================================ */
function openDeck(){
  if (revealed) return;
  revealed = true;

  els.deck.hidden = false;
  els.overlay.classList.add('hide');

  requestAnimationFrame(() => {
    els.deck.classList.add('live');
    syncChrome();
    slides[0]?.querySelectorAll('b[data-count]').forEach(countUp);
  });

  // once the overlay has faded, delete it and its animation layers outright —
  // nothing offscreen should keep costing frames during the presentation
  stopCountdown();
  setTimeout(() => {
    els.overlay.remove();
    particleField.stop();
  }, 1000);
}

/* ---------- jump straight to the deck ----------
   Add #preview to the URL:  http://localhost:5173/#preview
   Works on load and when you type the hash into an already-open tab. */
function checkPreview(){
  if (location.hash.toLowerCase() === '#preview') openDeck();
}
addEventListener('hashchange', checkPreview);
checkPreview();

/* ---------- start the clock (last, on purpose) ---------- */
timer = setInterval(renderCountdown, 250);
renderCountdown();
