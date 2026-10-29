/* 공통: 메뉴(GNB)·단축키·효과음·로고/행사명 — 관리자 > 화면/효과음 탭에서 설정 */
(() => {
  const URL_ = 'https://pmpifokwmrkqrmumycjx.supabase.co', KEY_ = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcGlmb2t3bXJrcXJtdW15Y2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTQ0ODcsImV4cCI6MjEwNzczMDQ4N30.e4x2eWP33EyTq9_GoAyL9M8WXSzhMKeUdKv6RRLRScY';
  const PAGES = {
    'monitor.html': { label: '출석 현황', desc: '실시간 출석 수와 QR 코드' },
    'draw.html': { label: '경품 추첨', desc: '상품 소개와 추첨 (관리자 비밀번호 필요)' },
    'program.html': { label: '식순', desc: '행사 순서 안내' },
    'rps.html': { label: '가위바위보', desc: '화면이 멈추면 이긴 사람만 생존' },
  };
  const DEF = {
    nav: [{ page: 'monitor.html', label: '출석 현황', key: '1', show: true }, { page: 'draw.html', label: '경품 추첨', key: '2', show: true },
          { page: 'program.html', label: '식순', key: '3', show: true }, { page: 'rps.html', label: '가위바위보', key: '4', show: true }],
    sounds: [{ name: '박수', src: 'builtin:applause', key: 'q', vol: .9 }, { name: '팡파르', src: 'builtin:fanfare', key: 'w', vol: .9 }, { name: '딩동댕', src: 'builtin:ding', key: 'e', vol: .8 }],
    brand: { logo: 'logo.png', h: 34, title: '창립 20주년 기념행사', org: '한국경제TV 노동조합' },
  };
  const parse = (v, d) => { try { const x = JSON.parse(v); return x ?? d; } catch { return d; } };
  let cfg = Object.assign({}, DEF, parse(localStorage.getItem('union20_cfg'), {}));
  const here = (location.pathname.split('/').pop() || 'screen.html').toLowerCase();

  /* ── 브랜드 ── */
  function applyBrand(){
    const b = Object.assign({}, DEF.brand, cfg.brand || {});
    document.querySelectorAll('.sign .lg img, img.brand').forEach(img => { if (b.logo && img.getAttribute('src') !== b.logo) img.src = b.logo; });
    document.querySelectorAll('.sign .lg img').forEach(img => { img.style.height = (+b.h || 34) + 'px'; });
    document.querySelectorAll('.sign .t, [data-brand="title"]').forEach(el => { el.textContent = b.title || ''; });
    document.querySelectorAll('[data-brand="org"]').forEach(el => { el.textContent = b.org || ''; });
    document.querySelectorAll('[data-brand="orgtitle"]').forEach(el => { el.textContent = [b.org, b.title].filter(Boolean).join(' '); });
  }

  /* 간판 아래 끝 위치를 CSS 변수(--sign-b)로 알려줌 → 로고가 커져도 화면 제목이 가려지지 않게 */
  function measureSign(){ const el = document.querySelector('.sign'); if (!el) return; document.documentElement.style.setProperty('--sign-b', Math.round(el.getBoundingClientRect().bottom) + 'px'); }
  addEventListener('resize', measureSign);
  document.addEventListener('load', e => { if (e.target.closest && e.target.closest('.sign')) measureSign(); }, true);

  /* ── 메뉴 ── */
  const navItems = () => (Array.isArray(cfg.nav) && cfg.nav.length ? cfg.nav : DEF.nav).filter(n => PAGES[n.page]);
  function renderNav(){
    document.querySelectorAll('.snav').forEach(nav => {
      nav.innerHTML = navItems().filter(n => n.show !== false).map(n =>
        `<a href="${n.page}" class="${n.page === here ? 'cur' : ''}">${esc(n.label || PAGES[n.page].label)}</a>`).join('');
    });
    const grid = document.getElementById('launchGrid');                       // 런처(screen.html) 카드
    if (grid) grid.innerHTML = navItems().filter(n => n.show !== false).map(n =>
      `<a class="card" href="${n.page}">${n.key ? `<div class="k">${esc(n.key.toUpperCase())}</div>` : '<div class="k">·</div>'}<b>${esc(n.label || PAGES[n.page].label)}</b><span>${PAGES[n.page].desc}</span></a>`).join('');
  }
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let navT; addEventListener('mousemove', () => { document.body.classList.add('navon'); clearTimeout(navT); navT = setTimeout(() => document.body.classList.remove('navon'), 3000); });

  /* ── 효과음 ── */
  let ac; const actx = () => { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume().catch(() => {}); return ac; };
  const playing = new Set(), files = {};
  const noise = (c, dur) => { const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
  const tone = (c, out, f, t, d, v, type = 'triangle') => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(v, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(out); o.start(t); o.stop(t + d + .05); };
  const BUILTIN = {
    applause(c, out){ const t0 = c.currentTime, dur = 3.5;
      for (let t = 0; t < dur; t += .018) { if (Math.random() > .75) continue; const env = Math.min(1, t / .5) * Math.min(1, (dur - t) / 1.2);
        const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = noise(c, .04); f.type = 'bandpass'; f.frequency.value = 1500 + Math.random() * 2500; f.Q.value = .8;
        g.gain.value = (.05 + Math.random() * .12) * env; s.connect(f).connect(g).connect(out); s.start(t0 + t + Math.random() * .015); } },
    fanfare(c, out){ const t = c.currentTime; [523, 659, 784, 1047].forEach((f, i) => tone(c, out, f, t + i * .12, .6, .3)); [1047, 1319, 1568].forEach(f => tone(c, out, f, t + .55, 1.4, .18)); },
    ding(c, out){ const t = c.currentTime; [[784, 0], [659, .45], [523, .9]].forEach(([f, dt]) => { tone(c, out, f, t + dt, 1.2, .35, 'sine'); tone(c, out, f * 2.76, t + dt, .6, .05, 'sine'); }); },
    drum(c, out){ const t0 = c.currentTime; for (let i = 0; i < 40; i++) { const t = t0 + i * .04, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = noise(c, .05); f.type = 'bandpass'; f.frequency.value = 900; g.gain.value = .12 + .25 * i / 40; s.connect(f).connect(g).connect(out); s.start(t); }
      tone(c, out, 90, t0 + 1.62, .5, .6, 'sine'); },
  };
  function playSound(snd){
    const vol = Math.max(0, Math.min(1, snd.vol ?? .9));
    if (String(snd.src).startsWith('builtin:')) { const fn = BUILTIN[snd.src.slice(8)]; if (!fn) return; const c = actx(), g = c.createGain(); g.gain.value = vol; g.connect(c.destination); fn(c, g); playing.add(g); setTimeout(() => playing.delete(g), 5000); return; }
    const base = files[snd.src] || (files[snd.src] = Object.assign(new Audio(snd.src), { preload: 'auto' }));
    const a = base.cloneNode(); a.volume = vol; a.play().catch(() => {}); playing.add(a); a.onended = () => playing.delete(a);
  }
  function stopSounds(){ playing.forEach(x => { try { if (x.pause) { x.pause(); x.currentTime = 0; } else x.disconnect(); } catch {} }); playing.clear(); }
  const soundItems = () => (Array.isArray(cfg.sounds) ? cfg.sounds : DEF.sounds).filter(s => s && s.src);
  function preload(){ soundItems().forEach(s => { if (!String(s.src).startsWith('builtin:') && !files[s.src]) files[s.src] = Object.assign(new Audio(s.src), { preload: 'auto' }); }); }

  /* ── 단축키 도움말 (? 키) ── */
  function help(){
    let el = document.getElementById('kbdHelp');
    if (el) { el.remove(); return; }
    el = document.createElement('div'); el.id = 'kbdHelp';
    el.style.cssText = 'position:fixed;inset:0;z-index:99;display:grid;place-items:center;background:rgba(0,8,20,.6);backdrop-filter:blur(4px);font-family:Pretendard,sans-serif;color:#fff';
    const row = (k, t) => `<div style="display:flex;gap:14px;align-items:center;padding:5px 0"><kbd style="min-width:34px;text-align:center;background:rgba(255,255,255,.15);border-radius:8px;padding:4px 10px;font:700 15px Pretendard,sans-serif">${esc(k)}</kbd><span>${esc(t)}</span></div>`;
    el.innerHTML = `<div style="background:rgba(0,25,55,.9);border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:24px 30px;min-width:340px;max-height:80vh;overflow:auto">
      <div style="font-size:13px;color:#8fe3ff;margin-bottom:6px">화면 이동</div>${row('0', '메인 화면')}${navItems().filter(n => n.key).map(n => row(n.key.toUpperCase(), n.label + (n.show === false ? ' (메뉴 숨김)' : ''))).join('')}
      <div style="font-size:13px;color:#8fe3ff;margin:14px 0 6px">효과음</div>${soundItems().filter(s => s.key).map(s => row(s.key.toUpperCase(), s.name)).join('') || '<div style="color:#8fb0c9">등록된 효과음 없음</div>'}
      <div style="font-size:12px;color:#8fb0c9;margin-top:14px">? 키로 닫기 · Esc는 효과음 정지</div></div>`;
    el.onclick = () => el.remove(); document.body.appendChild(el);
  }

  /* ── 키 처리 ── */
  addEventListener('keydown', e => {
    if (window.UNION_NO_KEYS) return;                                       // 관리자 화면 등에서는 단축키 끔
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (document.querySelector('#ask.on, .modal.on')) return;                // 확인창이 떠 있으면 무시
    if (e.key === 'Escape') { stopSounds(); document.getElementById('kbdHelp')?.remove(); return; }
    if (e.key === '?') { help(); return; }
    const k = e.key.length === 1 ? e.key.toLowerCase() : '';
    if (!k || k === ' ') return;
    if (k === '0') { if (here !== 'screen.html') location.href = 'screen.html'; return; }   // 0: 어디서든 메인(런처)
    const n = navItems().find(x => (x.key || '').toLowerCase() === k);
    if (n) { if (n.page !== here) location.href = n.page; return; }
    const s = soundItems().find(x => (x.key || '').toLowerCase() === k);
    if (s) { e.preventDefault(); playSound(s); }
  });

  /* ── 불러오기: 캐시로 먼저 그리고, 서버 값으로 갱신 ── */
  function apply(){ applyBrand(); renderNav(); preload(); requestAnimationFrame(measureSign); }
  const ready = f => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', f) : f();
  ready(apply);
  ready(async () => {
    if (!window.supabase) return;
    try {
      const sb = window.supabase.createClient(URL_, KEY_);
      const { data } = await sb.from('settings').select('key,value').in('key', ['nav', 'sounds', 'brand']);
      if (!data) return;
      const got = {}; data.forEach(r => { got[r.key] = parse(r.value, undefined); });
      cfg = Object.assign({}, DEF, cfg, Object.fromEntries(Object.entries(got).filter(([, v]) => v !== undefined)));
      localStorage.setItem('union20_cfg', JSON.stringify({ nav: cfg.nav, sounds: cfg.sounds, brand: cfg.brand }));
      apply();
    } catch (e) {}
  });
  window.UnionCommon = { PAGES, DEF, playSound, stopSounds, get cfg(){ return cfg; } };
})();
