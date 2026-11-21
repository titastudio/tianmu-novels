/* Story devices engine. One file for every book: a phone and a desktop.
   A story file calls StoryEngine.start(STORY). Nothing here knows any plot. */
(function () {
  'use strict';
  const D = document;
  const $ = (s, r) => (r || D).querySelector(s);
  const $$ = (s, r) => Array.from((r || D).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // tab bar icons: drawn, so they show on every device (iOS fonts lack some symbols)
  const TBI = (() => {
    const S = (b, fill) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
    const H = 'style="fill:var(--tbbg);stroke:none"';
    return {
      lib: S('<rect x="3" y="3" width="8" height="8" rx="1.6" stroke="none"/><rect x="13" y="3" width="8" height="8" rx="1.6" stroke="none"/><rect x="3" y="13" width="8" height="8" rx="1.6" stroke="none"/><rect x="13" y="13" width="8" height="8" rx="1.6" stroke="none"/>', 1),
      alb: S('<rect x="3" y="8" width="18" height="13" rx="2.4" fill="currentColor" stroke="none"/><path d="M5.5 5h13"/>'),
      srch: S('<circle cx="10.5" cy="10.5" r="6.3"/><path d="M15.3 15.3 20.5 20.5" stroke-width="2.4"/>'),
      fav: S('<path d="M12 2.9l2.8 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.3l-5.6 3 1.1-6.3-4.6-4.5 6.3-.9z" stroke="none"/>', 1),
      rec: S('<circle cx="12" cy="12" r="9.6" fill="currentColor" stroke="none"/><path d="M12 6.6V12l3.6 2.3" style="stroke:var(--tbbg)" stroke-width="2"/>'),
      con: S('<circle cx="12" cy="12" r="10" stroke="none"/><circle cx="12" cy="9.4" r="3.5" ' + H + '/><path d="M5.7 18.4c1.5-2.4 3.7-3.6 6.3-3.6s4.8 1.2 6.3 3.6a8.6 8.6 0 0 1-12.6 0z" ' + H + '/>', 1),
      key: S([6, 12, 18].map(x => [4, 9.5, 15].map(y => `<circle cx="${x}" cy="${y}" r="2.1"/>`).join('')).join('') + '<circle cx="12" cy="20.5" r="2.1"/>', 1).replace('stroke="currentColor"', 'stroke="none"'),
      vm: S('<circle cx="6.5" cy="12" r="3.8"/><circle cx="17.5" cy="12" r="3.8"/><path d="M6.5 15.8h11"/>'),
      wc: S('<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="3.8" ry="9"/><path d="M3.3 9h17.4M3.3 15h17.4"/>'),
      alm: S('<circle cx="12" cy="13" r="7.3"/><path d="M12 9v4l2.6 1.6M4 5.5 6.8 3M20 5.5 17.2 3"/>'),
      sw: S('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.8h4M12 2.8V6M18.3 6.8l1.2-1.2"/>'),
      tm: S('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 9 9h-9z" fill="currentColor" stroke="none"/>')
    };
  })();

  function el(tag, cls, html) { const e = D.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const toMin = t => { const [a, b] = String(t).split(':').map(Number); return a * 60 + b; };
  let H12 = false;
  const fromMin = m => { m = ((m % 1440) + 1440) % 1440; let h = Math.floor(m / 60); if (H12) { h = h % 12 || 12; } else h = String(h).padStart(2, '0'); return h + ':' + String(m % 60).padStart(2, '0'); };
  const fmtT = t => { if (!H12 || !/^\d{1,2}:\d{2}$/.test(String(t || ''))) return t || ''; const m = toMin(t); return fromMin(m) + (m >= 720 ? ' PM' : ' AM'); };

  /* ---------- icons (drawn here, no brand artwork) ---------- */
  const G = (a, b) => `<defs><linearGradient id="g${a.slice(1)}${b.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="60" height="60" fill="url(#g${a.slice(1)}${b.slice(1)})"/>`;
  const ICON = {
    messages: `<svg viewBox="0 0 60 60">${G('#5df27a', '#0bbd36')}<path d="M30 14c-10.5 0-19 6.9-19 15.4 0 4.9 2.8 9.2 7.2 12-0.4 2.6-1.8 5-3.7 6.6 3.8 0.2 7.3-1.1 9.8-3.2 1.8 0.5 3.7 0.7 5.7 0.7 10.5 0 19-6.9 19-15.5S40.5 14 30 14z" fill="#fff"/></svg>`,
    phone: `<svg viewBox="0 0 60 60">${G('#5df27a', '#0bbd36')}<path d="M23.4 15.8c1.1-.4 2.3.1 2.9 1.1l3 5.2c.6 1 .4 2.3-.4 3.1l-2.3 2.2c1.6 3.4 4.4 6.3 7.9 8l2.3-2.3c.8-.8 2.1-1 3.1-.4l5.2 3c1 .6 1.5 1.8 1.1 2.9l-1.1 3.1c-.6 1.6-2.2 2.6-3.9 2.4C29.1 43 17.1 31 16 18.9c-.2-1.7.8-3.3 2.4-3.9l5-1.2z" fill="#fff"/></svg>`,
    notes: `<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#fff"/><rect width="60" height="17" fill="#fdd34d"/><rect y="15" width="60" height="2.4" fill="#e9b21d"/><g stroke="#c7c7cc" stroke-width="1.2"><line x1="8" y1="27" x2="52" y2="27"/><line x1="8" y1="35" x2="52" y2="35"/><line x1="8" y1="43" x2="52" y2="43"/><line x1="8" y1="51" x2="52" y2="51"/></g></svg>`,
    browser: `<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#fff"/><circle cx="30" cy="30" r="21" fill="url(#bz)"/><defs><linearGradient id="bz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1fd0ff"/><stop offset="1" stop-color="#1e6cf2"/></linearGradient></defs><g stroke="#fff" stroke-width=".8" opacity=".85">${Array.from({ length: 24 }, (_, i) => { const a = i * 15 * Math.PI / 180, r1 = i % 2 ? 17.5 : 16, r2 = 19.5; return `<line x1="${30 + r1 * Math.sin(a)}" y1="${30 - r1 * Math.cos(a)}" x2="${30 + r2 * Math.sin(a)}" y2="${30 - r2 * Math.cos(a)}"/>`; }).join('')}</g><path d="M30 30 41 19 33 33z" fill="#ff3b30"/><path d="M30 30 19 41 27 27z" fill="#fff"/></svg>`,
    photos: `<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#fff"/><g transform="translate(30 30)" opacity=".92">${['#f9a825', '#f57c00', '#e53935', '#c2185b', '#7b1fa2', '#3949ab', '#039be5', '#43a047'].map((c, i) => `<ellipse rx="6.2" ry="11" cy="-10" fill="${c}" opacity=".85" transform="rotate(${i * 45})" style="mix-blend-mode:multiply"/>`).join('')}</g></svg>`,
    reminders: `<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#fff"/>${[['#0a84ff', 17], ['#ff3b30', 30], ['#ff9500', 43]].map(([c, y]) => `<circle cx="14" cy="${y}" r="4.6" fill="${c}"/><circle cx="14" cy="${y}" r="6" fill="none" stroke="${c}" stroke-width="1"/><line x1="25" y1="${y}" x2="50" y2="${y}" stroke="#d1d1d6" stroke-width="1.6"/>`).join('')}</svg>`,
    calendar: d => `<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#fff"/><text x="30" y="17" text-anchor="middle" font-size="9.5" font-weight="600" fill="#ff3b30" font-family="-apple-system,Helvetica,Arial">${esc((d && d.wd) || 'THU').toUpperCase()}</text><text x="30" y="46" text-anchor="middle" font-size="30" font-weight="300" fill="#000" font-family="-apple-system,Helvetica,Arial">${esc((d && d.dn) || '20')}</text></svg>`,
    clock: `<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#000"/><circle cx="30" cy="30" r="22" fill="#fff"/><g stroke="#000" stroke-width="1">${Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180; return `<line x1="${30 + 18 * Math.sin(a)}" y1="${30 - 18 * Math.cos(a)}" x2="${30 + 20.5 * Math.sin(a)}" y2="${30 - 20.5 * Math.cos(a)}"/>`; }).join('')}</g><line x1="30" y1="30" x2="30" y2="16" stroke="#000" stroke-width="2.2" stroke-linecap="round"/><line x1="30" y1="30" x2="40" y2="35" stroke="#000" stroke-width="2.2" stroke-linecap="round"/><line x1="30" y1="34" x2="30" y2="12" stroke="#ff9500" stroke-width="1"/><circle cx="30" cy="30" r="1.6" fill="#ff9500"/></svg>`,
    camera: `<svg viewBox="0 0 60 60">${G('#e7e7ea', '#a9a9ae')}<rect x="10" y="20" width="40" height="26" rx="5" fill="#2c2c2e"/><rect x="22" y="15" width="16" height="7" rx="2" fill="#2c2c2e"/><circle cx="30" cy="33" r="8.5" fill="#5f5f63" stroke="#d1d1d6" stroke-width="2"/></svg>`,
    settings: `<svg viewBox="0 0 60 60">${G('#bfc0c4', '#8e8e93')}<g transform="translate(30 30)" fill="#3a3a3c">${Array.from({ length: 12 }, (_, i) => `<rect x="-2.6" y="-19" width="5.2" height="8" rx="1.2" transform="rotate(${i * 30})"/>`).join('')}<circle r="13" /><circle r="6" fill="#bfc0c4"/></g></svg>`,
    weather: `<svg viewBox="0 0 60 60">${G('#3a8ef6', '#1d5fd0')}<circle cx="24" cy="25" r="8" fill="#ffd60a"/><path d="M20 42a8 8 0 0 1 1-15.9A10 10 0 0 1 40 29a6.5 6.5 0 0 1 .5 13z" fill="#fff"/></svg>`,
    mail: `<svg viewBox="0 0 60 60">${G('#3fb4ff', '#1371ea')}<rect x="11" y="18" width="38" height="25" rx="3.5" fill="#fff"/><path d="M12 20l18 13 18-13" fill="none" stroke="#1d7cf2" stroke-width="2.2"/></svg>`,
    sheets: `<svg viewBox="0 0 60 60">${G('#4fd47c', '#1a9e4b')}<rect x="13" y="13" width="34" height="34" rx="3" fill="#fff"/><g stroke="#1a9e4b" stroke-width="1.6"><line x1="13" y1="24" x2="47" y2="24"/><line x1="13" y1="35" x2="47" y2="35"/><line x1="25" y1="13" x2="25" y2="47"/></g></svg>`,
    code: `<svg viewBox="0 0 60 60">${G('#2a2d34', '#15171c')}<path d="M24 20 13 30l11 10M36 20l11 10-11 10" fill="none" stroke="#4fc1ff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    terminal: `<svg viewBox="0 0 60 60">${G('#3a3a3c', '#111')}<path d="M15 22l9 8-9 8" fill="none" stroke="#e5e5ea" stroke-width="3" stroke-linecap="round"/><path d="M28 39h16" stroke="#e5e5ea" stroke-width="3" stroke-linecap="round"/></svg>`,
    contacts: `<svg viewBox="0 0 60 60">${G('#d1d1d6', '#a1a1a6')}<circle cx="30" cy="24" r="9" fill="#fff"/><path d="M14 46c2-9 9-13 16-13s14 4 16 13z" fill="#fff"/></svg>`,
    finder: `<svg viewBox="0 0 60 60">${G('#7cc6ff', '#1d75e8')}<path d="M30 6v48" stroke="#0f4fb0" stroke-width="1.5"/><rect x="30" y="0" width="30" height="60" fill="#e9f3ff"/><path d="M18 24v4M40 24v4" stroke="#0b2c66" stroke-width="2.6" stroke-linecap="round"/><path d="M16 38c8 6 20 6 28 0" fill="none" stroke="#0b2c66" stroke-width="2.4" stroke-linecap="round"/></svg>`
  };
  const icon = (id, opt) => { const f = ICON[id] || ICON.settings; return typeof f === 'function' ? f(opt) : f; };
  const NAMES = { messages: 'Messages', phone: 'Phone', notes: 'Notes', browser: 'Browser', photos: 'Photos', reminders: 'Reminders', calendar: 'Calendar', clock: 'Clock', camera: 'Camera', settings: 'Settings', weather: 'Weather', mail: 'Mail', sheets: 'Sheets', finder: 'Files', code: 'Code', terminal: 'Terminal', contacts: 'Contacts' };

  const SV = {
    back: '<svg width="13" height="22" viewBox="0 0 13 22"><path d="M11 2 2 11l9 9" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chev: '<svg width="8" height="13" viewBox="0 0 8 13"><path d="M1.5 1.5 6.5 6.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    signal: '<svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8"/><rect x="10" y="3" width="3" height="9" rx=".8"/><rect x="15" y="0" width="3" height="12" rx=".8"/></svg>',
    wifi: '<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.3c2.5 0 4.8 1 6.5 2.6l1.1-1.2A10.6 10.6 0 0 0 8 .6 10.6 10.6 0 0 0 .4 3.7l1.1 1.2A9 9 0 0 1 8 2.3zm0 3.3c1.6 0 3 .6 4.1 1.6l1.1-1.2A7.6 7.6 0 0 0 8 3.9a7.6 7.6 0 0 0-5.2 2.1l1.1 1.2c1.1-1 2.5-1.6 4.1-1.6zm0 3.3c.7 0 1.3.3 1.8.7L8 11.6 6.2 9.6c.5-.4 1.1-.7 1.8-.7z"/></svg>',
    batt: p => `<svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="${Math.max(2, 20 * p / 100)}" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity=".45"/></svg>`,
    lock: '<svg width="16" height="22" viewBox="0 0 16 22"><rect x="1" y="9" width="14" height="12" rx="2.5" fill="#fff"/><path d="M4 9.5V6a4 4 0 0 1 8 0v3.5" fill="none" stroke="#fff" stroke-width="2"/></svg>',
    unlock: '<svg width="16" height="22" viewBox="0 0 16 22"><rect x="1" y="9" width="14" height="12" rx="2.5" fill="#fff"/><path d="M4 9.5V6a4 4 0 0 1 8 0" fill="none" stroke="#fff" stroke-width="2"/></svg>',
    send: '<svg width="14" height="16" viewBox="0 0 14 16"><path d="M7 15V2M1.5 7.5 7 2l5.5 5.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    search: '<svg width="15" height="15" viewBox="0 0 15 15"><circle cx="6.3" cy="6.3" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m10 10 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    flash: '<svg width="20" height="22" viewBox="0 0 20 22"><path d="M7 1h6l-2 7h4L6 21l2-9H4z" fill="#fff"/></svg>',
    cam: '<svg width="22" height="18" viewBox="0 0 22 18"><path d="M2 4h4l2-3h6l2 3h4v13H2z" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="11" cy="10" r="3.6" fill="none" stroke="#fff" stroke-width="1.7"/></svg>',
    book: '<svg width="22" height="20" viewBox="0 0 22 20"><path d="M11 4C8.8 2.2 5.5 1.8 2 2.4v14c3.5-.6 6.8-.2 9 1.6 2.2-1.8 5.5-2.2 9-1.6v-14c-3.5-.6-6.8-.2-9 1.6zm0 0v14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    tabs: '<svg width="22" height="22" viewBox="0 0 22 22"><rect x="2" y="6" width="13" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M7 3h10a3 3 0 0 1 3 3v10" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    share: '<svg width="18" height="22" viewBox="0 0 18 22"><path d="M9 1v13M4.5 5.5 9 1l4.5 4.5M6 9H2v12h14V9h-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    fwd: '<svg width="12" height="20" viewBox="0 0 12 20"><path d="m2 2 8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    bk: '<svg width="12" height="20" viewBox="0 0 12 20"><path d="M10 2 2 10l8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    phoneSm: '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M4 1.2c.5-.2 1 0 1.3.5l1.2 2.1c.3.4.2 1-.2 1.3l-.9.9c.7 1.4 1.8 2.5 3.2 3.2l.9-.9c.4-.4.9-.5 1.3-.2l2.1 1.2c.5.3.7.8.5 1.3l-.4 1.2c-.3.7-.9 1.1-1.6 1C6 12.4 1.5 7.9 1.2 2.7c-.1-.7.3-1.3 1-1.6z" fill="currentColor"/></svg>'
  };

  /* ---------- text playback: typing, deleting, pauses ---------- */
  // ops: ["t","text"] type, ["d",n] delete n chars, ["p",ms] pause, ["c"] clear
  async function playText(get, set, ops, speed, alive) {
    speed = speed || 1;
    for (const op of ops) {
      if (alive && !alive()) return false;
      const k = op[0];
      if (k === 'p') { await wait(op[1] / speed); continue; }
      if (k === 'c') { set(''); await wait(220 / speed); continue; }
      if (k === 'd') {
        for (let i = 0; i < op[1]; i++) { if (alive && !alive()) return false; set(get().slice(0, -1)); await wait((i < 2 ? 140 : 42) / speed); }
        continue;
      }
      if (k === 't') {
        for (const ch of op[1]) {
          if (alive && !alive()) return false;
          set(get() + ch);
          let ms = 55 + Math.random() * 85;
          if (ch === ' ') ms += 25; if (/[.,?!—]/.test(ch)) ms += 180;
          await wait(ms / speed);
        }
      }
    }
    return true;
  }
  function richLine(s) {
    let x = esc(String(s == null ? '' : s).replace(/<b>(.*?)<\/b>/g, '**$1**'));
    x = x.replace(/~~(.+?)~~/g, '<span class="s">$1</span>');
    x = x.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    x = x.replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, '$1<i>$2</i>');
    return x;
  }

  /* ---------- captions ---------- */
  function caption(text, opts) {
    opts = opts || {};
    return new Promise(res => {
      const c = el('div', 'cap', `<div><p>${text}</p>${opts.sub ? `<small>${opts.sub}</small>` : ''}${opts.more ? `<div class="more">${opts.more}</div>` : ''}</div>`);
      D.body.appendChild(c);
      requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('on')));
      let done = false;
      const close = () => { if (done || opts.stay) return; done = true; c.classList.remove('on'); setTimeout(() => { c.remove(); res(); }, 900); };
      setTimeout(() => c.addEventListener('click', close), 900);
      if (opts.auto) setTimeout(close, opts.auto);
      if (opts.stay) setTimeout(res, 1200);
    });
  }

  function endLines(S, mode) {
    const other = mode === 'phone' ? 'desktop' : 'phone';
    const label = other === 'desktop' ? (S.otherLabel || 'There is another screen in this story. It opens on a computer.') : (S.otherLabel || 'There is another screen in this story. It opens on a phone.');
    const back = S.bookUrl ? `<a href="${esc(S.bookUrl)}">Back to the book</a>` : '';
    return `${esc(label)}<br>${back}`;
  }

  /* ============================================================ PHONE */
  // One photo per person, shared by every screen: contacts, threads and the owner's card.
  function photoBook(S, C) {
    const P = {}, add = (n, p) => { if (n && p && !P[n]) P[n] = p; };
    (C.contacts || S.contacts || []).forEach(c => add(c.name, c.photo));
    ((C.messages || {}).threads || []).forEach(t => add(t.name, t.photo));
    (((C.messages || {}).deleted) || []).forEach(t => add(t.name, t.photo));
    if (S.me) add(S.me.name, S.me.photo);
    (S.aliases ? Object.entries(S.aliases) : []).forEach(([a, n]) => add(a, P[n]));
    return n => n ? (P[n] || P[String(n).replace(/\s*\(\d+\)$/, '')] || null) : null;
  }
  function Phone(S) {
    const PH = photoBook(S, S);
    H12 = !!S.h12;
    const st = { beat: -1, target: null, seen: new Set(), clock: toMin(S.clock.start), locked: true, app: null, views: [], fails: 0, done: false, badges: Object.assign({}, (S.home && S.home.badges) || {}), lockNotifs: (S.lock.notifs || []).slice(), sugg: null };
    const threads = (S.messages && S.messages.threads) || [];
    const framed = !(matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 700);
    const stage = el('div', 'stage' + (framed ? ' framed' : ''));
    const ph = el('div', 'phone' + (S.dark ? ' dark' : ''));
    stage.appendChild(ph); D.body.appendChild(stage);
    const wall = el('div', 'wall'); ph.appendChild(wall);
    const wallBlur = el('div', 'wb'); wall.appendChild(wallBlur);
    // A small pre-blurred copy of each wallpaper, made once. It replaces live blur filters, which stutter on phones.
    const blurCache = {};
    function blurred(url, cb) {
      const c0 = blurCache[url];
      if (c0) { if (c0.data) cb(c0.data); else c0.q.push(cb); return; }
      const rec = blurCache[url] = { q: [cb] };
      const done = d => { rec.data = d; rec.q.forEach(f => f(d)); rec.q = []; };
      const img = new Image();
      img.onload = () => {
        try {
          const w = 72, h = Math.max(1, Math.round(img.naturalHeight / img.naturalWidth * w));
          const c = D.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
          x.drawImage(img, 0, 0, w, h);
          const d = x.getImageData(0, 0, w, h), a = d.data, t = new Uint8ClampedArray(a.length), R = 3;
          for (let k3 = 0; k3 < 3; k3++) {
            for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { let r = 0, g = 0, b = 0, n = 0; for (let k = -R; k <= R; k++) { const i = (yy * w + Math.min(w - 1, Math.max(0, xx + k))) * 4; r += a[i]; g += a[i + 1]; b += a[i + 2]; n++; } const o = (yy * w + xx) * 4; t[o] = r / n; t[o + 1] = g / n; t[o + 2] = b / n; t[o + 3] = 255; }
            for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { let r = 0, g = 0, b = 0, n = 0; for (let k = -R; k <= R; k++) { const i = (Math.min(h - 1, Math.max(0, yy + k)) * w + xx) * 4; r += t[i]; g += t[i + 1]; b += t[i + 2]; n++; } const o = (yy * w + xx) * 4; a[o] = r / n; a[o + 1] = g / n; a[o + 2] = b / n; a[o + 3] = 255; }
          }
          x.putImageData(d, 0, 0); done(c.toDataURL('image/jpeg', 0.85));
        } catch (e) { done(url); }
      };
      img.onerror = () => done(url);
      img.src = url;
    }
    let curWall = null, curBlur = null;
    function setWall(url) {
      curWall = url; wall.style.backgroundImage = `url("${url}")`;
      blurred(url, b => { if (curWall !== url) return; curBlur = b; wallBlur.style.backgroundImage = `url("${b}")`; paintGlass(); });
    }
    // Glass panels: the blurred wallpaper lined up behind each panel. Same look as a live blur, no cost per frame.
    function offsetIn(n) { let x = 0, y = 0; while (n && n !== ph) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return [x, y]; }
    function paintGlass() {
      if (!curBlur) return;
      const W = ph.clientWidth, Hh = ph.clientHeight;
      $$('.glass', ph).forEach(g => {
        const [x, y] = offsetIn(g); const tint = g.dataset.tint || 'rgba(30,30,32,.45)';
        g.style.backgroundImage = `linear-gradient(${tint},${tint}),url("${curBlur}")`;
        g.style.backgroundSize = `auto,${W + 40}px ${Hh + 40}px`;
        g.style.backgroundPosition = `0 0,${-x - 20}px ${-y - 20}px`;
        g.style.backgroundRepeat = 'no-repeat';
      });
    }
    setWall(S.lock.wall);
    if (framed) { const fit = () => { const z = Math.min(1, (innerHeight - 36) / 844, (innerWidth - 36) / 390); ph.style.zoom = z < 1 ? String(z) : ''; requestAnimationFrame(paintGlass); }; fit(); addEventListener('resize', fit); }
    const sb = el('div', 'sb'); ph.appendChild(sb);
    const banner = el('div', 'banner'); ph.appendChild(banner);
    const hbar = el('button', 'hbar'); hbar.innerHTML = '<div class="homebar"></div>'; ph.appendChild(hbar);

    function renderSB(dark) {
      sb.className = 'sb' + (dark ? ' dark' : '');
      sb.innerHTML = `<span>${fromMin(st.clock)}</span><span class="ic">${SV.signal}${SV.wifi}${SV.batt(S.battery || 64)}</span>`;
      $('.homebar', hbar).classList.toggle('dark', !!dark);
    }
    function setClock(t) { st.clock = toMin(t); renderSB(sb.classList.contains('dark')); const lt = $('.lk-time', ph); if (lt) lt.textContent = fromMin(st.clock); }

    /* ----- lock screen ----- */
    let lock = el('div', 'lock'); ph.appendChild(lock);
    let pass = el('div', 'pass'); ph.appendChild(pass);
    let clockTaps = 0, clockTimer = null;
    function buildLock() {
      lock = el('div', 'lock'); pass = el('div', 'pass');
      ph.insertBefore(pass, home); ph.insertBefore(lock, pass);
      attachSwipe(lock); renderLock();
    }
    function ntfHTML(n) {
      const who = (n.app === 'messages' || n.app === 'phone') && PH(n.title);
      if (who) return `<div class="ap pav" style="background-image:url('${esc(who)}')"><i>${icon(n.app)}</i></div><div class="tx"><div class="hd">${esc(n.title)}<span>${esc(n.when || 'now')}</span></div><div class="bd">${esc(n.body)}</div></div>`;
      return `<div class="ap">${icon(n.app, S.calIcon)}</div><div class="tx"><div class="hd">${esc(n.title)}<span>${esc(n.when || 'now')}</span></div><div class="bd">${esc(n.body)}</div></div>`;
    }
    function renderLock() {
      lock.innerHTML = `<div class="padlock">${SV.lock}</div><div class="lk-top"><div class="lk-date">${esc(S.clock.date)}</div><div class="lk-time">${fromMin(st.clock)}</div></div>
        <div class="notifs">${st.lockNotifs.slice().reverse().map(n => `<button class="ntf glass" data-tint="rgba(40,40,44,.42)">${ntfHTML(n)}</button>`).join('')}</div>
        <div class="lk-quick"><i class="glass" data-tint="rgba(40,40,44,.42)">${SV.flash}</i><i class="glass" data-tint="rgba(40,40,44,.42)">${SV.cam}</i></div>
        <div class="lk-bot"><div class="lk-hint">${S.lock.code ? 'Swipe up to open' : 'Swipe up to open'}</div><div class="homebar"></div></div>`;
      $$('.ntf', lock).forEach(b => b.addEventListener('click', () => toPass()));
      requestAnimationFrame(paintGlass);
      const lt = $('.lk-time', lock);
      lt.addEventListener('pointerdown', e => e.stopPropagation());
      lt.addEventListener('click', e => {
        e.stopPropagation(); clockTaps++; clearTimeout(clockTimer); clockTimer = setTimeout(() => clockTaps = 0, 1600);
        lt.animate([{ opacity: 1 }, { opacity: .55 }, { opacity: 1 }], { duration: 180 });
        if (clockTaps >= 5) { clockTaps = 0; restart(); }
      });
    }
    function restart() {
      const f = el('div'); f.style.cssText = 'position:absolute;inset:0;background:#000;z-index:999;opacity:0;transition:opacity .6s'; ph.appendChild(f);
      requestAnimationFrame(() => f.style.opacity = '1');
      setTimeout(() => location.reload(), 650);
    }
    // swipe up gesture on the lock screen
    function attachSwipe(lock) {
      let y0 = null, dy = 0, raf = 0, lastY = 0, lastT = 0, vel = 0, pid = null;
      lock.style.touchAction = 'none';
      const zoom = () => parseFloat(ph.style.zoom) || 1;
      const apply = () => { raf = 0; lock.style.transform = `translate3d(0,${dy}px,0)`; };
      const down = e => {
        if (!st.locked || pass.classList.contains('on') || y0 != null) return;
        y0 = lastY = e.clientY; lastT = performance.now(); dy = 0; vel = 0; pid = e.pointerId;
        lock.style.transition = 'none'; lock.classList.add('drag');
      };
      const move = e => {
        if (y0 == null || e.pointerId !== pid) return;
        const now = performance.now(), y = e.clientY;
        vel = 0.6 * vel + 0.4 * ((y - lastY) / Math.max(1, now - lastT)); lastY = y; lastT = now;
        dy = Math.min(0, (y - y0) / zoom());
        if (!raf) raf = requestAnimationFrame(apply);
      };
      const up = e => {
        if (y0 == null || (e && e.pointerId !== pid)) return;
        y0 = null; pid = null; if (raf) { cancelAnimationFrame(raf); raf = 0; }
        lock.classList.remove('drag'); lock.style.transition = '';
        if (dy < -110 || (vel < -0.4 && dy < -24)) toPass();
        else { lock.style.transform = ''; if (dy > -6) lock.animate([{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,-26px,0)' }, { transform: 'translate3d(0,0,0)' }], { duration: 420, easing: 'cubic-bezier(.3,.7,.3,1)' }); }
      };
      lock.addEventListener('pointerdown', down);
      addEventListener('pointermove', move, { passive: true });
      addEventListener('pointerup', up); addEventListener('pointercancel', up);
    }
    attachSwipe(lock);
    function toPass() {
      lock.style.transform = 'translateY(-110%)'; lock.style.opacity = '0';
      wall.classList.add('blur');
      if (!S.lock.code) { faceUnlock(); return; }
      renderPass(); pass.classList.add('on');
    }
    function faceUnlock() {
      pass.innerHTML = `<div style="margin-top:28vh;display:flex;flex-direction:column;align-items:center;gap:14px"><div class="fid">${SV.lock}</div></div>`;
      pass.classList.add('on');
      setTimeout(() => { $('.fid', pass).innerHTML = SV.unlock; }, 650);
      setTimeout(unlocked, 1050);
    }
    function renderPass() {
      const n = String(S.lock.code).length;
      const L = ['', 'A B C', 'D E F', 'G H I', 'J K L', 'M N O', 'P Q R S', 'T U V', 'W X Y Z'];
      pass.innerHTML = `<h3>Enter Passcode</h3><div class="dots">${'<i></i>'.repeat(n)}</div><div class="nudge"></div>
        <div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button class="key" data-k="${k}"><b>${k}</b><small>${L[k - 1] || '&nbsp;'}</small></button>`).join('')}<button class="key z" data-k="0"><b>0</b><small>&nbsp;</small></button></div>
        <div class="pfoot"><button class="em">Emergency</button><button class="cx">Cancel</button></div>`;
      let entry = '';
      const dots = $('.dots', pass);
      const paint = () => $$('i', dots).forEach((d, i) => d.classList.toggle('f', i < entry.length));
      $$('.key', pass).forEach(b => b.addEventListener('click', () => {
        if (entry.length >= n) return;
        b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 120);
        entry += b.dataset.k; paint();
        if (entry.length === n) setTimeout(() => {
          if (entry === String(S.lock.code)) { unlocked(); }
          else {
            st.fails++; dots.classList.add('shake'); if (navigator.vibrate) navigator.vibrate(120);
            setTimeout(() => { dots.classList.remove('shake'); entry = ''; paint(); }, 470);
            if (st.fails >= (S.lock.hintAfter || 2) && S.lock.nudge) $('.nudge', pass).textContent = S.lock.nudge;
          }
        }, 160);
      }));
      $('.cx', pass).addEventListener('click', () => { pass.classList.remove('on'); lock.style.transform = ''; lock.style.opacity = ''; wall.classList.remove('blur'); });
      D.onkeydown = e => { if (!pass.classList.contains('on')) return; const k = $(`.key[data-k="${e.key}"]`, pass); if (k) k.click(); };
    }
    function unlocked() {
      st.locked = false; D.onkeydown = null;
      pass.classList.remove('on');
      wall.classList.remove('blur'); setWall((S.home && S.home.wall) || S.lock.wall); wall.classList.add('dim');
      const L = lock, P = pass; setTimeout(() => { L.remove(); P.remove(); }, 400);
      renderHome(); home.classList.add('on');
      if (S.onUnlock) S.onUnlock();
      if (!st.free) advanceIfReady();
    }

    /* ----- home ----- */
    const home = el('div', 'home'); ph.appendChild(home);
    const appLayer = el('div'); ph.appendChild(appLayer);
    function badgeFor(id) {
      if (id === 'messages') { const n = threads.filter(t => t.unread).length; return n || 0; }
      return st.badges[id] || 0;
    }
    function appBtn(id, label) {
      const b = badgeFor(id);
      return `<button class="app" data-app="${id}"><div class="ico">${icon(id, S.calIcon)}</div><span>${esc(label || NAMES[id] || id)}</span>${b ? `<div class="badge">${b}</div>` : ''}</button>`;
    }
    function widgetHTML(w) {
      if (w === 'notes' && S.notes) {
        const n = S.notes.items.find(x => x.id === (S.notes.widget || S.notes.items[0].id)) || S.notes.items[0];
        const lines = n.body.filter(Boolean);
        return `<button class="widget w-notes" data-open="note:${n.id}"><h5>${SV.chev.replace('currentColor', '#e5a100')} Notes</h5><b>${esc(n.title || lines[0] || 'New Note')}</b><p>${esc(lines.slice(n.title ? 0 : 1).join(' ').replace(/~~|\*\*|\*/g, ''))}</p><small>${esc(n.when || '')}</small></button>`;
      }
      if (w === 'sugg') {
        const ids = (S.home.sugg || ['messages', 'notes', 'photos', 'phone']).slice();
        if (st.sugg) { const i = ids.indexOf(st.sugg); if (i > 0) ids.splice(i, 1); if (i !== 0) ids.unshift(st.sugg); }
        return `<div class="widget w-sugg"><h5>Suggestions</h5><div class="row">${ids.slice(0, 4).map(id => appBtn(id)).join('')}</div></div>`;
      }
      if (w === 'photo' && S.photos) {
        const p = S.photos.items[S.photos.widget || 0];
        return `<button class="widget w-photo" data-open="photo:${S.photos.widget || 0}"><img src="${esc(p.src)}" alt=""><span>${esc(S.photos.widgetLabel || 'On This Day')}</span></button>`;
      }
      if (w === 'cal') {
        const c = S.calIcon || {};
        return `<button class="widget w-cal" data-app="calendar"><h5>${esc(c.wdLong || '')}</h5><div class="dn">${esc(c.dn || '')}</div>${((S.calendar && S.calendar.today) || []).slice(0, 2).map(e => `<p>${esc(e.title)}<br><span style="color:#888">${esc(e.time || '')}</span></p>`).join('') || '<p style="border:0;color:#999;padding:0">No events today</p>'}</button>`;
      }
      if (w === 'world' && S.home.world) {
        return `<div class="widget w-world">${S.home.world.map(c => { const m = st.clock + (c.off || 0) * 60; const h = Math.floor((((m % 1440) + 1440) % 1440) / 60); const night = h < 6 || h >= 19; return `<div class="wc ${night ? 'nt' : ''}"><div class="face"><i style="transform:rotate(${(m % 720) / 2}deg)"></i><b style="transform:rotate(${(m % 60) * 6}deg)"></b></div><span>${esc(c.city)}</span><small>${esc(c.label || '')}</small></div>`; }).join('')}</div>`;
      }
      if (w === 'weather' && S.home.weather) {
        const W = S.home.weather;
        return `<div class="widget w-wx ${W.night ? 'nt' : ''}"><div><b>${esc(W.city)}</b><div class="t">${esc(W.temp)}°</div></div><div class="c"><span>${esc(W.cond)}</span><small>H:${esc(W.hi)}° L:${esc(W.lo)}°</small></div></div>`;
      }
      return '';
    }
    function renderHome() {
      const H = S.home;
      home.innerHTML = `<div class="wgrid">${(H.widgets || []).map(w => { const [id, sz] = w.split(':'); let h = widgetHTML(id); if (sz === 's') h = h.replace('class="widget ', 'class="widget sm '); return h; }).join('')}</div>
        <div class="grid">${H.apps.map(id => appBtn(id)).join('')}</div>
        <div class="pgdots"><i></i><i></i></div>
        <div class="dock">${H.dock.map(id => appBtn(id)).join('')}</div>`;
      $$('.w-sugg,.w-world', home).forEach(g => { g.classList.add('glass'); g.dataset.tint = 'rgba(30,30,32,.42)'; });
      const dk = $('.dock', home); if (dk) { dk.classList.add('glass'); dk.dataset.tint = 'rgba(70,70,74,.32)'; }
      requestAnimationFrame(paintGlass);
      $$('[data-app]', home).forEach(b => b.addEventListener('click', () => openApp(b.dataset.app, b)));
      $$('[data-open]', home).forEach(b => b.addEventListener('click', () => openTarget(b.dataset.open, b)));
    }

    /* ----- banners ----- */
    let bannerTimer = null;
    function showBanner(n) {
      if (st.locked) { st.lockNotifs.push(n); renderLock(); if (navigator.vibrate) navigator.vibrate(60); return; }
      banner.innerHTML = `<button class="ntf">${ntfHTML(n)}</button>`;
      banner.classList.add('on');
      if (navigator.vibrate) navigator.vibrate(60);
      $('.ntf', banner).onclick = () => { banner.classList.remove('on'); if (n.open) openTarget(n.open); };
      clearTimeout(bannerTimer); bannerTimer = setTimeout(() => banner.classList.remove('on'), 4600);
    }

    /* ----- app shell ----- */
    function openApp(id, fromEl, then) {
      if (st.app && st.app.id === id) { if (then) then(); return; }
      if (st.app) closeApp(true);
      const ax = el('div', 'appv' + (DARK_APPS[id] || S.dark ? ' dk' : '') + ` a-${id}`);
      if (fromEl) { const r = fromEl.getBoundingClientRect(), p = ph.getBoundingClientRect(); ax.style.setProperty('--ox', (r.left + r.width / 2 - p.left) + 'px'); ax.style.setProperty('--oy', (r.top + r.height / 2 - p.top) + 'px'); }
      appLayer.appendChild(ax);
      home.classList.add('under');
      st.app = { id, el: ax }; st.views = [];
      renderSB(!DARK_APPS[id] && !S.dark);
      const root = APPS[id] ? APPS[id]() : stubApp(id);
      push(root, true);
      markSeen('app:' + id);
      if (then) setTimeout(then, 60);
    }
    function closeApp(instant) {
      if (!st.app) return;
      const ax = st.app.el; st.app = null; st.views = [];
      if (instant) ax.remove(); else { ax.classList.add('out'); setTimeout(() => ax.remove(), 330); }
      renderHome(); renderSB(false); requestAnimationFrame(() => home.classList.remove('under'));
    }
    hbar.addEventListener('click', () => { if (st.app) closeApp(); });
    function push(view, root) {
      const ax = st.app.el;
      if (!root) { const prev = st.views[st.views.length - 1]; if (prev) prev.classList.add('behind'); view.classList.add('push'); }
      ax.appendChild(view); st.views.push(view);
      // edge swipe back
      let x0 = null;
      view.addEventListener('pointerdown', e => { if (st.views.length > 1 && e.clientX - ph.getBoundingClientRect().left < 24) x0 = e.clientX; });
      view.addEventListener('pointerup', e => { if (x0 != null && e.clientX - x0 > 60) pop(); x0 = null; });
    }
    function pop() {
      if (st.views.length < 2) return;
      const v = st.views.pop(); v.classList.remove('push'); v.classList.add('popping');
      const prev = st.views[st.views.length - 1]; prev.classList.remove('behind');
      if (prev._refresh) prev._refresh();
      setTimeout(() => v.remove(), 380);
    }
    function navBar(o) {
      const n = el('div', 'nav' + (o.big ? ' big' : ''));
      n.innerHTML = `<div class="row1">${o.back ? `<button class="back">${SV.back}<span>${esc(o.back)}</span></button>` : '<span></span>'}${o.act ? `<span class="act">${o.act}</span>` : '<span></span>'}</div>${o.big ? `<h1>${esc(o.title)}</h1>${o.search ? `<div class="search">${SV.search}<span>Search</span></div>` : ''}` : `<div class="ttl">${esc(o.title || '')}</div>`}`;
      if (o.back) $('.back', n).addEventListener('click', pop);
      return n;
    }
    function view(cls) { const v = el('div', 'view ' + (cls || '')); return v; }
    function stubApp(id) {
      const v = view(); v.appendChild(navBar({ title: NAMES[id], big: true }));
      v.appendChild(el('div', 'body', `<div style="padding:40px;text-align:center;color:#8e8e93">${esc(S.stubText && S.stubText[id] || '')}</div>`));
      return v;
    }
    const DARK_APPS = { photos: false, clock: true, camera: true };
    window.__phone = { st, openTarget };

    /* ----- MESSAGES ----- */
    function threadPreview(t) {
      if (t.draft) return `<em>Draft:</em> ${esc(t.draft)}`;
      const vis = t.items.filter(m => m.t === 'in' || m.t === 'out' || m.t === 'call');
      const m = vis[vis.length - 1];
      if (!m) return '';
      if (m.t === 'call') return esc(m.text);
      return esc(m.img ? (m.t === 'out' ? 'You sent a photo' : 'Photo') : (m.t === 'out' && S.messages.youPrefix ? 'You: ' : '') + m.text);
    }
    function messagesApp() {
      const v = view('ml');
      v.appendChild(navBar({ title: 'Messages', big: true, search: true, act: '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M15 2.5 19.5 7 9 17.5H4.5V13z" fill="none" stroke="#007aff" stroke-width="1.7" stroke-linejoin="round"/></svg>' }));
      const b = el('div', 'body rows'); v.appendChild(b);
      const paint = () => {
        const list = threads.slice().sort((a, b) => (b.order || 0) - (a.order || 0));
        b.innerHTML = list.map(t => `<button class="r" data-t="${t.id}">${t.unread ? '<i class="udot"></i>' : ''}${(t.photo || PH(t.name)) ? avatarHTML(t.name, t.photo) : `<div class="av" style="${t.color ? `background:${t.color}` : ''}">${esc(t.initials || t.name[0])}</div>`}<div class="in"><div class="l1"><b>${esc(t.name)}</b><span>${esc(fmtT(t.time))} ${SV.chev.replace('currentColor', '#c4c4c7')}</span></div><div class="l2">${threadPreview(t)}</div></div></button>`).join('');
        if (S.messages.deleted) b.insertAdjacentHTML('beforeend', `<button class="r rdel"><div class="in"><div class="l1"><b style="font-weight:400;color:#007aff">Recently Deleted</b><span>${S.messages.deleted.length} ${SV.chev.replace('currentColor', '#c4c4c7')}</span></div></div></button>`);
        b.insertAdjacentHTML('beforeend', '<div style="height:120px"></div>');
        $$('.r[data-t]', b).forEach(r => r.addEventListener('click', () => push(threadView(threads.find(t => t.id === r.dataset.t)))));
        const rd = $('.rdel', b); if (rd) rd.onclick = () => push(deletedView());
      };
      paint(); v._refresh = paint;
      return v;
    }
    function deletedView() {
      const v = view();
      v.appendChild(navBar({ title: 'Recently Deleted', back: 'Messages' }));
      const b = el('div', 'body rows');
      b.innerHTML = `<div style="padding:14px 16px;color:#8e8e93;font-size:13px;line-height:1.4">Messages are deleted for good after 30 days. This can take up to 40 days.</div>` + S.messages.deleted.map((t, i) => `<button class="r" data-i="${i}">${avatarHTML(t.name, t.photo, t.initials)}<div class="in"><div class="l1"><b>${esc(t.name)}</b><span>${esc(t.left || '')}</span></div><div class="l2">${esc((t.items.filter(m => m.text).slice(-1)[0] || {}).text || '')}</div></div></button>`).join('');
      v.appendChild(b);
      $$('.r', b).forEach(r => r.onclick = () => push(threadView(S.messages.deleted[+r.dataset.i], true)));
      markSeen('deleted');
      return v;
    }
    function threadView(t, ro) {
      t.unread = false;
      const v = view('tv');
      const nav = el('div', 'nav thead');
      nav.innerHTML = `<button class="back">${SV.back}</button>${(t.photo || PH(t.name)) ? avatarHTML(t.name, t.photo, null, 54) : `<div class="av" style="${t.color ? `background:${t.color}` : ''}">${esc(t.initials || t.name[0])}</div>`}<button class="nm">${esc(t.name)} ${SV.chev.replace('currentColor', '#8e8e93')}</button>`;
      $('.back', nav).addEventListener('click', pop);
      $('.nm', nav).addEventListener('click', () => { const c = contactBy(t.contact || t.name); if (c) push(contactCard(c)); });
      v.appendChild(nav);
      const body = el('div', 'body'); const list = el('div', 'msgs'); body.appendChild(list); v.appendChild(body);
      const bar = el('div', 'inbar'); if (!ro) v.appendChild(bar); else { const rb = el('div', 'inbar', `<div style="flex:1;text-align:center;color:#007aff;font-size:17px;padding:6px">Recover</div>`); v.appendChild(rb); }
      const renderBar = (txt, caret) => { bar.innerHTML = `<div class="plus">${SV.plus}</div><div class="fld ${txt ? '' : 'ph'}">${txt ? esc(txt) : (S.messages.placeholder || 'iMessage')}${caret ? '<span class="caret"></span>' : ''}${txt ? `<span class="send">${SV.send}</span>` : ''}</div>`; };
      renderBar(t.draft || '');
      function drawItems(items) {
        let html = '';
        items.forEach((m, i) => {
          if (m.t === 'day') { html += `<div class="mday">${richLine(m.text)}</div>`; return; }
          if (m.t === 'call') { html += `<div class="callrow ${m.miss ? 'miss' : ''}">${SV.phoneSm}<span>${esc(m.text)}${m.time ? ' · ' + esc(m.time) : ''}</span></div>`; return; }
          if (m.t !== 'in' && m.t !== 'out') return;
          const nx = items[i + 1];
          const tail = !nx || nx.t !== m.t || nx.gap;
          const prev = items[i - 1];
          const gap = prev && (prev.t !== m.t) && (prev.t === 'in' || prev.t === 'out');
          if (m.who && m.t === 'in' && (!prev || prev.who !== m.who)) html += `<div class="mwho">${esc(m.who)}</div>`;
          if (m.img) html += `<div class="bub img ${m.t} ${gap ? 'gap' : ''}"><img src="${esc(m.img)}" alt=""></div>`;
          else html += `<div class="bub ${m.t} ${tail ? 'tl' : ''} ${gap ? 'gap' : ''}">${esc(m.text)}</div>`;
          if (m.status) html += `<div class="mstat ${m.status.indexOf('Not Delivered') > -1 ? 'nd' : ''}">${richLine(m.status)}</div>`;
        });
        list.innerHTML = html;
      }
      drawItems(t.items);
      requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
      // reply choices: the reader answers in the owner's voice
      if (t.reply && !t.reply._done && !ro) {
        const R = t.reply;
        bar.insertAdjacentHTML('beforebegin', `<div class="chips">${R.options.map((o, i) => `<button data-i="${i}">${esc(o)}</button>`).join('')}</div>`);
        const chips = $('.chips', v);
        $$('button', chips).forEach(b => b.onclick = async () => {
          const txt = R.options[+b.dataset.i]; chips.remove();
          let cur = ''; await playText(() => cur, x => { cur = x; renderBar(x, true); }, [['t', txt]], 1.6);
          await wait(250); renderBar('');
          t.items.push({ t: 'out', text: txt, status: 'Delivered' }); R._done = true; drawItems(t.items); body.scrollTop = body.scrollHeight;
          const after = (R.after && (R.after[txt] || R.after['*'])) || [];
          for (const m of after) {
            await wait(m.wait || 1600);
            list.insertAdjacentHTML('beforeend', '<div class="typing"><i></i><i></i><i></i></div>'); body.scrollTop = body.scrollHeight;
            await wait(Math.min(3200, 700 + (m.text || '').length * 40));
            t.items.forEach(x => { if (x.status === 'Delivered') x.status = null; });
            t.items.push(m); drawItems(t.items); body.scrollTop = body.scrollHeight;
          }
          markSeen('reply:' + t.id);
        });
      }
      markSeen('thread:' + t.id);
      return v;
    }

    /* ----- NOTES ----- */
    function notesApp() {
      const v = view('notes-app');
      v.appendChild(navBar({ title: 'Notes', big: true, search: true, act: '' }));
      const b = el('div', 'body list'); v.appendChild(b);
      const groups = {};
      S.notes.items.forEach(n => { (groups[n.group || 'Previous 30 Days'] = groups[n.group || 'Previous 30 Days'] || []).push(n); });
      b.innerHTML = Object.keys(groups).map(g => `<div class="ngroup">${esc(g)}</div><div class="ncard rows">${groups[g].map(n => { const lines = n.body.filter(Boolean); return `<button class="r" data-n="${n.id}"><div class="in"><div class="l1"><b>${esc(n.title || lines[0] || 'New Note')}</b></div><div class="l2"><span style="color:#000">${esc(n.when || '')}</span>  ${esc((n.title ? lines : lines.slice(1)).join(' ').replace(/~~|\*\*|\*|\[ \] |\[x\] /g, '').slice(0, 90))}</div></div></button>`; }).join('')}</div>`).join('') + '<div style="height:120px"></div>';
      $$('.r', b).forEach(r => r.addEventListener('click', () => push(noteView(S.notes.items.find(n => n.id === r.dataset.n)))));
      return v;
    }
    function noteView(n) {
      if (n.locked && !n._open) {
        const v = view('notes-app');
        v.appendChild(navBar({ title: '', back: 'Notes' }));
        const b = el('div', 'body', `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:120px 30px;text-align:center"><div style="font-size:46px">🔒</div><b style="font-size:20px">This note is locked.</b><span style="color:#8e8e93">${esc(n.hint ? 'Password hint: ' + n.hint : '')}</span><button class="vn" style="color:#e5a100;font-size:17px;margin-top:10px">View Note</button></div>`);
        v.appendChild(b);
        $('.vn', b).onclick = () => askCode(() => { n._open = true; pop(); setTimeout(() => push(noteView(n)), 380); }, 'This note');
        return v;
      }
      const v = view('notes-app');
      v.appendChild(navBar({ title: '', back: 'Notes', act: '<span style="color:#e5a100">Done</span>' }));
      const b = el('div', 'body'); v.appendChild(b);
      const body = n.body.map(l => {
        if (l.startsWith('# ')) return `<h2>${richLine(l.slice(2))}</h2>`;
        if (l.startsWith('[ ] ') || l.startsWith('[x] ')) return `<p class="chk ${l[1] === 'x' ? 'on' : ''}"><i></i><span>${richLine(l.slice(4))}</span></p>`;
        return `<p>${richLine(l)}</p>`;
      }).join('');
      b.innerHTML = `<div class="nnote"><div class="nd">${esc(n.stamp || n.when || '')}</div>${n.title ? `<h2>${esc(n.title)}</h2>` : ''}${body}</div>`;
      markSeen('note:' + n.id);
      return v;
    }

    /* ----- BROWSER ----- */
    function serpHTML(it) {
      return `<div class="serp"><div class="q">${esc(it.q)}</div><div class="tabs"><b>All</b><span>Images</span><span>News</span><span>Shopping</span></div>${(it.results || []).map(r => `<div class="res"><div class="site"><i>${esc(r.site[0].toUpperCase())}</i><div><b style="font-weight:400">${esc(r.site)}</b><span>${esc(r.path || '')}</span></div></div><h4>${esc(r.title)}</h4><p>${esc(r.snip)}</p></div>`).join('')}</div>`;
    }
    function browserApp() {
      const B = S.browser; const cur = B.items[B.current != null ? B.current : B.items.length - 1];
      const v = view('br');
      const b = el('div', 'body'); v.appendChild(b);
      const bar = el('div', 'urlbar'); v.appendChild(bar);
      const show = it => { b.innerHTML = serpHTML(it); b.scrollTop = 0; bar.innerHTML = `<div class="url">${SV.search.replace('currentColor', '#8e8e93')} <span>${esc(it.q)}</span></div><div class="tools"><span>${SV.bk}</span><span style="opacity:.35">${SV.fwd}</span><span>${SV.share}</span><button class="bk">${SV.book}</button><button class="tb" style="position:relative">${SV.tabs}<b style="position:absolute;left:6px;top:7px;font-size:10px">${B.items.length}</b></button></div>`; $('.bk', bar).onclick = () => push(historyView()); $('.tb', bar).onclick = () => push(tabsView(show)); markSeen('search:' + B.items.indexOf(it)); };
      show(cur);
      markSeen('browser');
      return v;
    }
    function tabsView(show) {
      const v = view(); v.style.background = '#f2f2f7'; v.style.color = '#000';
      const B = S.browser;
      v.innerHTML = `<div class="body" style="padding:calc(60px + env(safe-area-inset-top)) 14px 120px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${B.items.map((it, i) => `<button class="tcard" data-i="${i}" style="text-align:left"><div style="height:210px;border-radius:12px;overflow:hidden;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.12);color:#000;font-size:7px;line-height:1.4;padding:10px;transform-origin:top left"><div style="font-size:11px;font-weight:500;margin-bottom:6px">${esc(it.q)}</div>${(it.results || []).slice(0, 3).map(r => `<div style="color:#1a0dab;font-size:9px;margin-top:6px">${esc(r.title)}</div><div style="color:#555">${esc(r.snip.slice(0, 80))}</div>`).join('')}</div><div style="font-size:12px;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.q)}</div></button>`).join('')}</div></div><div style="position:absolute;bottom:0;left:0;right:0;padding:12px 20px calc(30px + env(safe-area-inset-bottom));display:flex;justify-content:space-between;background:rgba(249,249,249,.96);border-top:.5px solid #c6c6c8;font-size:17px"><span style="color:#0a84ff">+</span><span>${B.items.length} Tabs</span><button class="dn" style="color:#0a84ff">Done</button></div>`;
      $$('.tcard', v).forEach(c => c.onclick = () => { pop(); show(B.items[+c.dataset.i]); });
      $('.dn', v).onclick = pop;
      markSeen('tabs');
      return v;
    }
    function historyView() {
      const v = view('hist');
      v.appendChild(navBar({ title: 'History', back: 'Back' }));
      const b = el('div', 'body'); v.appendChild(b);
      const g = {};
      S.browser.items.slice().reverse().forEach(it => { (g[it.day || 'Today'] = g[it.day || 'Today'] || []).push(it); });
      b.innerHTML = Object.keys(g).map(k => `<div class="hgrp">${esc(k)}</div><div class="rows">${g[k].map(it => `<button class="r" data-i="${S.browser.items.indexOf(it)}"><div class="hico">${SV.search}</div><div class="in"><div class="l1"><b style="font-weight:400;font-size:16px">${esc(it.q)}</b><span>${esc(it.time || '')}</span></div><div class="l2">search?q=${esc(it.q.toLowerCase().replace(/\s+/g, '+'))}</div></div></button>`).join('')}</div>`).join('') + '<div style="height:100px"></div>';
      $$('.r', b).forEach(r => r.onclick = () => { const it = S.browser.items[+r.dataset.i]; const pv = view('br'); const pb = el('div', 'body', serpHTML(it)); pv.appendChild(navBar({ title: '', back: 'History' })); pv.appendChild(pb); push(pv); markSeen('search:' + r.dataset.i); });
      markSeen('history');
      return v;
    }

    /* ----- PHOTOS ----- */
    function photosApp() {
      const v = view('phapp');
      const nav = el('div'); v.appendChild(nav);
      const b = el('div', 'body'); v.appendChild(b);
      const tabs = el('div', 'tabbar'); v.appendChild(tabs);
      const show = t => {
        tabs.innerHTML = [['lib', 'Library'], ['alb', 'Albums'], ['srch', 'Search']].map(([k, l]) => `<button data-k="${k}" class="${k === t ? 'on' : ''}"><i>${TBI[k]}</i><span>${l}</span></button>`).join('');
        $$('button', tabs).forEach(x => x.onclick = () => show(x.dataset.k === 'srch' ? 'alb' : x.dataset.k));
        nav.innerHTML = '';
        if (t === 'lib') { nav.appendChild(navBar({ title: 'Library', big: true, act: 'Select' })); libGrid(b, S.photos.items); }
        else { nav.appendChild(navBar({ title: 'Albums', big: true, act: '+' })); albumsGrid(b); }
      };
      show('lib');
      return v;
    }
    function libGrid(b, P, opts) {
      b.innerHTML = `<div class="pgrid">${P.map((p, i) => `<button data-i="${i}"><img src="${esc(p.src)}" loading="lazy" alt="">${p.video ? `<span class="vid">${esc(p.video)}</span>` : ''}${p.fav ? '<span class="vid" style="left:6px;right:auto">♥</span>' : ''}</button>`).join('')}</div><div class="pcount">${P.length} ${P.length === 1 ? 'Photo' : 'Photos'}${opts && opts.note ? `<span>${esc(opts.note)}</span>` : ''}</div><div style="height:110px"></div>`;
      $$('.pgrid button', b).forEach(x => x.onclick = () => photoView(+x.dataset.i, P));
      if (!opts) requestAnimationFrame(() => { b.scrollTop = b.scrollHeight; });
      markSeen('photos');
    }
    function albumsGrid(b) {
      const P = S.photos.items, A = [];
      A.push({ name: 'Recents', items: P });
      const fav = P.filter(p => p.fav); A.push({ name: 'Favourites', items: fav });
      (S.photos.albums || []).forEach(a => A.push({ name: a.name, items: a.items }));
      const util = [];
      if (S.photos.hidden) util.push({ name: 'Hidden', items: S.photos.hidden, locked: true });
      util.push({ name: 'Recently Deleted', items: S.photos.deleted || [], locked: true, del: true });
      b.innerHTML = `<div class="albs">${A.map((a, i) => `<button class="alb" data-i="${i}"><div class="acov">${a.items[0] ? `<img src="${esc(a.items[a.items.length - 1].src)}" alt="">` : ''}</div><b>${esc(a.name)}</b><span>${a.items.length}</span></button>`).join('')}</div><div class="ngroup" style="padding-top:22px">Utilities</div><div class="ncard rows" style="margin-bottom:120px">${util.map((u, i) => `<button class="r" data-u="${i}"><div class="in"><div class="l1"><b style="font-weight:400;color:#007aff">${esc(u.name)}</b><span>${u.locked ? '🔒' : u.items.length} ${SV.chev.replace('currentColor', '#c4c4c7')}</span></div></div></button>`).join('')}</div>`;
      $$('.alb', b).forEach(x => x.onclick = () => { const a = A[+x.dataset.i]; push(albumView(a)); });
      $$('[data-u]', b).forEach(x => x.onclick = () => { const u = util[+x.dataset.u]; askCode(() => push(albumView(u)), u.name); });
    }
    function albumView(a) {
      const v = view(); v.appendChild(navBar({ title: a.name, back: 'Albums', act: 'Select' }));
      const b = el('div', 'body'); v.appendChild(b);
      if (!a.items.length) b.innerHTML = `<div style="padding:80px 30px;text-align:center;color:#8e8e93">${a.del ? 'No Photos or Videos' : 'No Photos'}</div>`;
      else libGrid(b, a.items, { note: a.del ? 'Photos and videos show the days remaining before deletion.' : '' });
      markSeen('album:' + a.name);
      return v;
    }
    function askCode(ok, what) {
      const m = el('div', 'askcode', `<div class="ac-box"><div style="font-size:42px;line-height:1">🔒</div><b>${esc(what)} is locked</b><span>Enter your passcode</span><div class="dots">${'<i></i>'.repeat(String(S.lock.code || '0000').length)}</div><div class="keys sm">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button class="key" data-k="${k}"><b>${k}</b></button>`).join('')}<button class="key z" data-k="0"><b>0</b></button></div><button class="cx">Cancel</button></div>`);
      ph.appendChild(m);
      let e = ''; const code = String(S.lock.code || ''); const dots = $('.dots', m);
      if (!code) { m.remove(); ok(); return; }
      $$('.key', m).forEach(k => k.onclick = () => { e += k.dataset.k; $$('i', dots).forEach((d, i) => d.classList.toggle('f', i < e.length)); if (e.length === code.length) setTimeout(() => { if (e === code) { m.remove(); ok(); } else { dots.classList.add('shake'); setTimeout(() => { dots.classList.remove('shake'); e = ''; $$('i', dots).forEach(d => d.classList.remove('f')); }, 450); } }, 150); });
      $('.cx', m).onclick = () => m.remove();
    }
    function photoView(i, list) {
      const P = list || S.photos.items; const p = P[i];
      const pv = el('div', 'pview');
      pv.innerHTML = `<div class="top"><button class="x" style="color:#0a84ff;font-size:17px">${SV.back}</button><div>${esc(p.date)}<span>${esc(p.time || '')}</span></div><span style="width:20px"></span></div><div class="ph"><img src="${esc(p.src)}" alt=""></div><div class="cp">${esc(p.caption || '')}</div>`;
      st.app.el.appendChild(pv);
      $('.x', pv).onclick = () => pv.remove();
      let x0 = null;
      pv.addEventListener('pointerdown', e => x0 = e.clientX);
      pv.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) { const j = i + (dx < 0 ? 1 : -1); if (j >= 0 && j < P.length) { pv.remove(); photoView(j, P); } } });
      markSeen('photo:' + i); markSeen('photos');
    }

    /* ----- PHONE ----- */
    function avatarHTML(name, photo, initials, size) {
      photo = photo || PH(name);
      const st2 = size ? `width:${size}px;height:${size}px;font-size:${Math.round(size * .42)}px;` : '';
      if (photo) return `<div class="av" style="${st2}background:#ccc url('${esc(photo)}') center/cover"></div>`;
      return `<div class="av" style="${st2}">${esc(initials || (name || '?')[0])}</div>`;
    }
    function contactBy(name) { return (S.contacts || []).find(c => c.name === name); }
    function phoneApp() {
      st.badges.phone = 0;
      const v = view('phapp');
      const b = el('div', 'body'); v.appendChild(b);
      const tabs = el('div', 'tabbar'); v.appendChild(tabs);
      const T = [['fav', 'Favourites'], ['rec', 'Recents'], ['con', 'Contacts'], ['key', 'Keypad'], ['vm', 'Voicemail']];
      const nav = el('div'); v.insertBefore(nav, b);
      function show(t) {
        tabs.innerHTML = T.map(([k, l]) => `<button data-k="${k}" class="${k === t ? 'on' : ''}"><i>${TBI[k]}</i><span>${l}</span>${k === 'vm' && (S.phone.voicemail || []).some(x => x.unheard) ? '<b class="tb-badge"></b>' : ''}</button>`).join('');
        $$('button', tabs).forEach(x => x.onclick = () => show(x.dataset.k));
        nav.innerHTML = ''; b.scrollTop = 0;
        if (t === 'rec') {
          nav.appendChild(navBar({ title: 'Recents', big: true, act: 'Edit' }));
          const R = S.phone.recents;
          b.innerHTML = `<div class="seg"><b class="on">All</b><b>Missed</b></div><div class="rows rc">${R.map((r, i) => `<button class="r" data-i="${i}">${avatarHTML(r.name, r.photo, r.initials, 40)}<div class="in" style="flex-direction:row;align-items:center"><div style="flex:1;min-width:0"><div class="l1"><b class="${r.miss ? 'miss' : ''}">${esc(r.name)}${r.count > 1 ? ` (${r.count})` : ''}</b></div><div class="l2">${esc(r.kind || 'mobile')}</div></div><span style="color:#8e8e93;font-size:15px">${esc(r.when)}</span><span class="info">i</span></div></button>`).join('')}</div><div style="height:140px"></div>`;
          $$('.r', b).forEach(x => x.onclick = () => push(callDetail(R[+x.dataset.i])));
          markSeen('recents');
        } else if (t === 'con' || t === 'fav') {
          const C = (S.contacts || []).filter(c => t === 'con' || c.fav).slice().sort((a, b2) => a.name.localeCompare(b2.name));
          nav.appendChild(navBar({ title: t === 'con' ? 'Contacts' : 'Favourites', big: true, search: t === 'con', act: t === 'con' ? '+' : 'Edit' }));
          let html = '', last = '';
          if (t === 'con' && S.me) html += `<button class="r me" data-n="__me">${avatarHTML(S.me.name, S.me.photo, S.me.initials, 60)}<div class="in"><b style="font-size:20px">${esc(S.me.name)}</b><span style="color:#8e8e93;font-size:14px">My Card</span></div></button>`;
          C.forEach(c => { const L = c.name.replace(/^(Mrs?\.|Dr\.|Mr\.)\s*/, '')[0].toUpperCase(); if (t === 'con' && L !== last) { html += `<div class="clet">${L}</div>`; last = L; } html += `<button class="r" data-n="${esc(c.name)}">${t === 'fav' ? avatarHTML(c.name, c.photo, c.initials, 40) : ''}<div class="in"><b style="font-size:17px;font-weight:${t === 'fav' ? 600 : 400}">${esc(c.name)}</b>${t === 'fav' ? '<span style="color:#8e8e93;font-size:14px">mobile</span>' : ''}</div></button>`; });
          b.innerHTML = `<div class="rows clist">${html}</div><div style="text-align:center;color:#8e8e93;padding:14px;font-size:15px">${t === 'con' ? (S.contacts || []).length + ' Contacts' : ''}</div><div style="height:140px"></div>`;
          $$('.r', b).forEach(x => x.onclick = () => push(contactCard(x.dataset.n === '__me' ? S.me : contactBy(x.dataset.n))));
          markSeen(t === 'con' ? 'contacts' : 'favourites');
        } else if (t === 'vm') {
          nav.appendChild(navBar({ title: 'Voicemail', big: true, act: 'Edit' }));
          const V = S.phone.voicemail || [];
          b.innerHTML = V.length ? V.map((m, i) => `<div class="vm${PH(m.name) ? ' hasav' : ''}" data-i="${i}">${m.unheard ? '<i class="udot" style="left:4px"></i>' : ''}${PH(m.name) ? `<span class="vmav">${avatarHTML(m.name, null, null, 34)}</span>` : ''}<b>${esc(m.name)}</b><span>${esc(m.when)}</span><div style="color:#8e8e93;font-size:14px">${esc(m.len || '')}</div><div class="wave">${Array.from({ length: 46 }, (_, k) => `<i style="height:${6 + Math.round(Math.abs(Math.sin(k * 1.7 + i)) * 20)}px"></i>`).join('')}</div><p>${esc(m.transcript || '')}</p></div>`).join('') : '<div style="padding:60px 20px;text-align:center;color:#8e8e93">No Voicemail</div>';
          V.forEach(m => m.unheard = false);
          markSeen('voicemail');
        } else {
          nav.appendChild(el('div', '', '<div style="height:calc(80px + env(safe-area-inset-top))"></div>'));
          b.innerHTML = `<div class="kpad"><div class="kdisp"></div>${[['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']].map(([n, l]) => `<button class="kk2"><b>${n}</b><small>${l}</small></button>`).join('')}<span></span><button class="kcall">${SV.phoneSm}</button></div>`;
          const disp = $('.kdisp', b);
          $$('.kk2', b).forEach(k => k.onclick = () => { if (disp.textContent.length < 14) disp.textContent += $('b', k).textContent; });
        }
      }
      show(S.phone.startTab || 'rec');
      return v;
    }
    function contactCard(c) {
      const v = view('ccard');
      v.appendChild(navBar({ title: '', back: 'Back', act: 'Edit' }));
      const b = el('div', 'body');
      const th = c.thread ? threads.find(t => t.id === c.thread) : null;
      const rows = [];
      if (c.phone) rows.push(['mobile', c.phone, true]);
      if (c.phone2) rows.push([c.phone2label || 'work', c.phone2, true]);
      if (c.email) rows.push(['email', c.email, true]);
      if (c.address) rows.push(['home', c.address]);
      if (c.birthday) rows.push(['birthday', c.birthday]);
      if (c.related) rows.push(['related', c.related]);
      b.innerHTML = `<div class="chead">${avatarHTML(c.name, c.photo, c.initials, 110)}<div class="cname">${esc(c.name)}</div>${c.sub ? `<div class="csub">${esc(c.sub)}</div>` : ''}<div class="cacts"><button class="ca" data-a="msg"><i>💬</i><span>message</span></button><button class="ca"><i>${SV.phoneSm}</i><span>call</span></button><button class="ca"><i>▶</i><span>video</span></button><button class="ca"><i>✉</i><span>mail</span></button></div></div>
        <div class="cbox">${rows.map(([k, val, link]) => `<div class="crow"><span>${esc(k)}</span><b class="${link ? 'lnk' : ''}">${esc(val)}</b></div>`).join('')}</div>
        ${c.notes ? `<div class="cbox"><div class="crow"><span>notes</span><b style="white-space:pre-wrap;font-weight:400">${esc(c.notes)}</b></div></div>` : ''}
        <div class="cbox"><div class="crow"><b class="lnk">Send Message</b></div><div class="crow"><b class="lnk">Share Contact</b></div><div class="crow"><b class="lnk">${c.fav ? 'Remove from Favourites' : 'Add to Favourites'}</b></div></div><div style="height:120px"></div>`;
      v.appendChild(b);
      $('[data-a="msg"]', b).onclick = () => { if (th) { if (st.app.id === 'messages') push(threadView(th)); else openTarget('thread:' + th.id); } };
      markSeen('contact:' + c.name);
      return v;
    }
    function callDetail(r) {
      const v = view();
      v.appendChild(navBar({ title: '', back: 'Recents' }));
      const b = el('div', 'body');
      b.innerHTML = `<div style="text-align:center;padding:10px 0 18px"><div style="display:flex;justify-content:center;margin:0 auto 10px">${avatarHTML(r.name, r.photo, r.initials, 96)}</div><div style="font-size:28px">${esc(r.name)}</div></div><div style="margin:0 16px;border-radius:12px;background:#f2f2f7;padding:12px 16px"><div style="font-size:15px;font-weight:600;margin-bottom:6px">${esc(r.dayLabel || 'Yesterday')}</div>${(r.log || []).map(l => `<div style="display:flex;justify-content:space-between;font-size:15px;padding:4px 0;color:${l.miss ? '#ff3b30' : '#000'}"><span>${esc(l.time)}</span><span style="color:#8e8e93">${esc(l.what)}</span></div>`).join('')}</div>`;
      v.appendChild(b);
      markSeen('call:' + r.name);
      return v;
    }

    /* ----- REMINDERS ----- */
    function remindersApp() {
      st.badges.reminders = 0;
      const v = view('rem');
      const L = S.reminders;
      v.appendChild(navBar({ title: L.list, big: true, act: '' }));
      const b = el('div', 'body rows'); v.appendChild(b);
      b.innerHTML = L.items.map(it => `<div class="r"><span class="ring ${it.done ? 'on' : ''}"></span><div class="in"><div style="font-size:17px;${it.done ? 'color:#8e8e93' : ''}">${esc(it.text)}</div>${it.due ? `<div class="due ${it.past ? '' : 'n'}">${esc(it.due)}</div>` : ''}${it.note ? `<div class="due n">${esc(it.note)}</div>` : ''}</div></div>`).join('') + '<div style="height:120px"></div>';
      markSeen('reminders');
      return v;
    }

    /* ----- CALENDAR ----- */
    function calendarApp() {
      const v = view();
      const c = S.calendar || {}; const ci = S.calIcon || {};
      v.appendChild(navBar({ title: ci.wdLong ? `${ci.wdLong} ${ci.dn}` : 'Today', big: true }));
      const b = el('div', 'body'); v.appendChild(b);
      b.innerHTML = `<div class="calday">${(c.today || []).map(e => `<div class="ev"><i></i><div>${esc(e.title)}<span>${esc(e.time || '')}</span></div></div>`).join('') || '<p style="color:#8e8e93;padding:20px 0">No events</p>'}${(c.later || []).length ? `<div style="font-weight:700;margin:22px 0 6px">Later</div>` + c.later.map(e => `<div class="ev"><i style="background:#0a84ff"></i><div>${esc(e.title)}<span>${esc(e.time || '')}</span></div></div>`).join('') : ''}</div>`;
      markSeen('calendar');
      return v;
    }

    function clockApp() {
      const v = view('phapp'); v.style.background = '#000'; v.style.color = '#fff';
      const A = (S.clockApp && S.clockApp.alarms) || [];
      const WC = S.clockApp && S.clockApp.world;
      if (WC) {
        const rows = WC.map(c => { const m = st.clock + (c.off || 0) * 60; return `<div class="alm"><div><div class="al" style="font-size:14px">${esc(c.label || 'Today')}</div><div style="font-size:24px;margin-top:2px">${esc(c.city)}</div></div><div class="at" style="font-size:44px">${fromMin(m)}</div></div>`; }).join('');
        v.innerHTML = `<div class="nav big" style="background:#000;border:0"><div class="row1"><span class="act" style="color:#ff9f0a">Edit</span><span class="act" style="color:#ff9f0a">+</span></div><h1 style="color:#fff">World Clock</h1></div><div class="body">${rows}<div style="height:120px"></div></div><div class="tabbar dkt">${[['World Clock', 'wc'], ['Alarms', 'alm'], ['Stopwatch', 'sw'], ['Timers', 'tm']].map(([l, g], i) => `<button class="${i === 0 ? 'on' : ''}"><i>${TBI[g]}</i><span>${l}</span></button>`).join('')}</div>`;
        $$('.tabbar button', v)[1].onclick = () => { S.clockApp.world = null; const nv = clockApp(); S.clockApp.world = WC; v.replaceWith(nv); st.views[st.views.length - 1] = nv; };
        markSeen('clock');
        return v;
      }
      v.innerHTML = `<div class="nav big" style="background:#000;border:0"><div class="row1"><span class="act" style="color:#ff9f0a">Edit</span><span class="act" style="color:#ff9f0a">+</span></div><h1 style="color:#fff">Alarms</h1></div><div class="body">${A.map(a => `<div class="alm ${a.on ? '' : 'off'}"><div><div class="at">${esc(a.time)}</div><div class="al">${esc(a.label || 'Alarm')}${a.days ? ', ' + esc(a.days) : ''}</div></div><i class="tg ${a.on ? 'on' : ''}"><b></b></i></div>`).join('') || '<p style="padding:40px;text-align:center;color:#8e8e93">No Alarms</p>'}<div style="height:120px"></div></div><div class="tabbar dkt">${[['World Clock', 'wc'], ['Alarms', 'alm'], ['Stopwatch', 'sw'], ['Timers', 'tm']].map(([l, g], i) => `<button class="${i === 1 ? 'on' : ''}"><i>${TBI[g]}</i><span>${l}</span></button>`).join('')}</div>`;
      markSeen('clock');
      return v;
    }
    const APPS = { clock: clockApp, messages: messagesApp, notes: notesApp, browser: browserApp, photos: photosApp, phone: phoneApp, reminders: remindersApp, calendar: calendarApp };

    /* ----- targets & beats ----- */
    function openTarget(t, fromEl) {
      const [k, id] = t.split(':');
      if (k === 'thread') openApp('messages', fromEl, () => { const th = threads.find(x => x.id === id); if (th) push(threadView(th)); });
      else if (k === 'note') openApp('notes', fromEl, () => push(noteView(S.notes.items.find(n => n.id === id))));
      else if (k === 'photo') openApp('photos', fromEl, () => photoView(+id));
      else if (k === 'app') openApp(id, fromEl);
      else openApp(k, fromEl);
    }
    function markSeen(key) {
      st.seen.add(key);
      if (st.target && matches(st.target, key)) { const b = st.beat; setTimeout(() => { if (st.beat === b) completeBeat(); }, (S.beats[b] && S.beats[b].dwell) || 1400); }
    }
    function matches(target, key) { return target === key || (target === 'messages' && key === 'app:messages'); }
    function seen(target) { return st.seen.has(target); }
    function activate(i) {
      st.beat = i; const B = S.beats[i];
      if (!B) return finish();
      if (B.at) setClock(B.at);
      if (B.unread) { const th = threads.find(t => t.id === B.unread); if (th) { th.unread = true; th.order = (th.order || 0) + 100; if (B.push) th.items.push(...B.push); if (B.time) th.time = B.time; } }
      if (B.unread || B.push || B.reply) st.seen.delete(B.target);
      if (B.reply) { const th = threads.find(t => t.id === (B.reply.thread || B.unread)); if (th) th.reply = B.reply; }
      if (B.badge) Object.assign(st.badges, B.badge);
      if (B.sugg) st.sugg = B.sugg;
      if (B.reminderItem && S.reminders) S.reminders.items.unshift(B.reminderItem);
      st.target = B.target;
      if (!st.app && !st.locked) renderHome();
      if (B.banner) showBanner(B.banner);
      if (B.target && seen(B.target)) setTimeout(() => { if (st.beat === i) completeBeat(); }, 1600);
      if (!B.target) setTimeout(() => { if (st.beat === i) completeBeat(); }, B.hold || 2500);
    }
    function completeBeat() {
      const B = S.beats[st.beat]; st.target = null;
      const nx = S.beats[st.beat + 1];
      const delay = nx ? (nx.delay != null ? nx.delay : 2600) : (S.end && S.end.delay != null ? S.end.delay : 2800);
      const i = st.beat + 1;
      setTimeout(() => activate(i), delay);
    }
    function advanceIfReady() { if (st.beat < 0) activate(0); }
    function finish() {
      if (st.done) return; st.done = true;
      if (S.end && S.end.at) setClock(S.end.at);
      if (S.end && S.end.banner) showBanner(S.end.banner);
      setTimeout(() => {
        store.set('tm-done-' + S.id + '-phone', 1);
        caption(S.end.caption, { sub: S.title, more: endLines(S, 'phone') + '<br><br><span style="color:#888">Tap to put the phone down. Pick it up again to look around for as long as you like.<br>Tap the clock on the lock screen five times to start over.</span>' }).then(relock);
      }, (S.end && S.end.capDelay) || 2600);
    }
    function relock() {
      st.free = true; st.target = null;
      if (st.app) closeApp(true);
      home.classList.remove('on'); st.locked = true; st.fails = 0; st.lockNotifs = [];
      wall.classList.remove('dim'); setWall(S.lock.wall);
      renderSB(false); buildLock();
    }

    // boot
    renderSB(false); renderLock();
    if (S.lock.preBeats) { /* notifications already on lock */ }
    // first beat can arrive while locked
    if (S.beats[0] && S.beats[0].onLock) { st.beat = 0; const B = S.beats[0]; if (B.banner) st.lockNotifs.push(B.banner); if (B.reminderItem && S.reminders) S.reminders.items.unshift(B.reminderItem); if (B.badge) Object.assign(st.badges, B.badge); st.target = B.target; renderLock(); }
    caption(S.caption.open, { sub: S.title });
  }

  /* ============================================================ DESKTOP */
  function Desktop(S) {
    const PH = photoBook(S, S.content || S);
    H12 = !!S.h12;
    const C = S.content;
    const st = { day: 0, beat: -1, target: null, seen: new Set(), clock: toMin(S.days[0].start), wins: {}, z: 100, done: false, badges: {}, sleeping: false, fails: 0 };
    const root = el('div', 'desk' + (S.dark ? ' ddark' : '')); D.body.appendChild(root);
    const wall = el('div', 'dwall'); wall.style.backgroundImage = `url("${S.wall}")`; root.appendChild(wall);
    const mb = el('div', 'menubar'); root.appendChild(mb);
    const layer = el('div'); root.appendChild(layer);
    const dock = el('div', 'ddock'); root.appendChild(dock);
    const bns = el('div', 'dbanners'); root.appendChild(bns);
    const sleep = el('div', 'sleep'); root.appendChild(sleep);
    let front = null;
    const day = () => S.days[st.day];
    st.fired = new Set();
    const vis = it => (it.day || 0) <= st.day && (!it.beat || st.fired.has(it.beat));
    // a beat on a day separator gates every message under it until the next separator
    ((C.messages && C.messages.threads) || []).forEach(t => { let cur = null; t.items.forEach(m => { if (m.t === 'day') cur = m.beat || null; else if (cur && !m.beat) m.beat = cur; }); });

    function renderMB() {
      const app = front ? (NAMES[front] || front) : 'Files';
      mb.innerHTML = `<div class="ml"><b>${esc(app)}</b><span>File</span><span>Edit</span><span>View</span><span>Window</span></div><div class="mr">${SV.wifi.replace('currentColor', '#fff')}<span>${esc(day().date)}</span><span>${fromMin(st.clock)}${H12 ? (((st.clock % 1440) + 1440) % 1440 >= 720 ? ' PM' : ' AM') : ''}</span></div>`;
    }
    function setClock(t) { st.clock = toMin(t); renderMB(); }
    function renderDock() {
      dock.innerHTML = S.dock.map(id => `<button data-app="${id}">${icon(id, Array.isArray(S.calIcon) ? S.calIcon[Math.min(st.day, S.calIcon.length - 1)] : S.calIcon)}${st.wins[id] ? '<span class="run"></span>' : ''}${st.badges[id] ? `<span class="badge">${st.badges[id]}</span>` : ''}<span class="tip">${esc(NAMES[id] || id)}</span></button>`).join('');
      $$('button', dock).forEach(b => b.onclick = () => openApp(b.dataset.app));
    }

    /* ----- windows ----- */
    const SIZES = { finder: [760, 480], code: [960, 600], notes: [760, 520], mail: [820, 540], messages: [720, 520], browser: [900, 580], calendar: [820, 560], photos: [760, 520], sheets: [760, 460] };
    function openApp(id, then, sel) {
      st.badges[id] = 0;
      if (st.wins[id]) { focus(id); if (sel != null) { st.wins[id].sel = sel; RENDER[id](st.wins[id]); } if (then) then(st.wins[id]); renderDock(); return st.wins[id]; }
      const W = innerWidth, H = innerHeight;
      const [w0, h0] = SIZES[id] || [720, 500];
      const w = Math.min(w0, W - 40), h = Math.min(h0, H - 120);
      const n = Object.keys(st.wins).length;
      const x = Math.max(20, Math.min(W - w - 20, (W - w) / 2 - 120 + n * 60)), y = Math.max(36, Math.min(H - h - 80, 60 + n * 34));
      const win = el('div', 'win' + (id === 'browser' ? ' bwin' : ''));
      win.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
      win.innerHTML = `<div class="tb"><div class="tl"><i class="c"></i><i></i><i></i></div><div class="tt">${esc(NAMES[id])}</div></div><div class="wb"></div>`;
      layer.appendChild(win);
      const rec = { id, el: win, body: $('.wb', win), sel: sel != null ? sel : null };
      st.wins[id] = rec;
      $('.c', win).onclick = e => { e.stopPropagation(); win.classList.add('closing'); setTimeout(() => { win.remove(); delete st.wins[id]; if (front === id) front = null; renderMB(); renderDock(); }, 200); };
      win.addEventListener('pointerdown', () => focus(id));
      drag(win, $('.tb', win));
      RENDER[id](rec);
      focus(id); renderDock();
      markSeen('app:' + id);
      if (then) then(rec);
      return rec;
    }
    function focus(id) {
      const r = st.wins[id]; if (!r) return;
      r.el.style.zIndex = ++st.z; $$('.win', layer).forEach(w => w.classList.remove('front')); r.el.classList.add('front');
      front = id; renderMB();
    }
    function drag(win, handle) {
      let sx, sy, ox, oy, on = false;
      handle.addEventListener('pointerdown', e => { if (e.target.closest('.tl')) return; on = true; sx = e.clientX; sy = e.clientY; ox = win.offsetLeft; oy = win.offsetTop; handle.setPointerCapture(e.pointerId); });
      handle.addEventListener('pointermove', e => { if (!on) return; win.style.left = ox + e.clientX - sx + 'px'; win.style.top = Math.max(28, oy + e.clientY - sy) + 'px'; });
      handle.addEventListener('pointerup', () => on = false);
    }
    function setTitle(r, t) { $('.tt', r.el).textContent = t; }

    /* ----- notes ----- */
    function notesR(r) {
      const items = C.notes.items.filter(vis).slice().sort((a, b) => (b.day || 0) - (a.day || 0));
      if (!r.sel || !items.find(n => n.id === r.sel)) r.sel = items[0] && items[0].id;
      r.body.innerHTML = `<div class="side"><div class="sh">Notes</div>${items.map(n => { const ls = n.body.filter(Boolean); return `<button class="it ${n.id === r.sel ? 'on' : ''}" data-id="${n.id}"><b>${esc(n.title || ls[0] || 'New Note')}<span>${esc(n.date || '')}</span></b><p>${esc((n.title ? ls : ls.slice(1)).join(' ').replace(/~~|\*\*|\*/g, '').slice(0, 80))}</p></button>`; }).join('')}</div><div class="main"></div>`;
      $$('.it', r.body).forEach(b => b.onclick = () => { r.sel = b.dataset.id; notesR(r); });
      const n = items.find(x => x.id === r.sel); if (!n) return;
      const main = $('.main', r.body);
      setTitle(r, n.title || 'Notes');
      const draw = lines => { main.innerHTML = `<div class="dnote"><div class="nd">${esc(n.stamp || n.date || '')}</div>${n.title ? `<h2>${esc(n.title)}</h2>` : ''}${lines.map(l => `<p>${richLine(l)}</p>`).join('')}</div>`; };
      if (n.play && !n._played) {
        n._played = true; let txt = '';
        const base = n.body.slice();
        const alive = () => st.wins.notes === r && r.sel === n.id;
        playText(() => txt, v => { txt = v; draw(base.concat(txt.split('\n'))); const c = $('.dnote', main); if (c) c.lastElementChild.insertAdjacentHTML('beforeend', '<span class="caret"></span>'); }, n.play, 1, alive).then(ok => { if (ok) { n.body = base.concat(txt.split('\n')); draw(n.body); markSeen('note:' + n.id); } });
      } else { draw(n.body); markSeen('note:' + n.id); }
    }
    /* ----- mail ----- */
    function mailR(r) {
      const items = C.mail.items.filter(vis).slice().reverse();
      if (!r.sel || !items.find(m => m.id === r.sel)) r.sel = items[0] && items[0].id;
      r.body.innerHTML = `<div class="side" style="width:280px;background:#fff"><div class="sh">Inbox</div>${items.map(m => `<button class="it ${m.id === r.sel ? 'on' : ''}" data-id="${m.id}">${m.unread ? '<i class="ud"></i>' : ''}<b>${esc(m.from)}<span>${esc(m.date)}</span></b><p><span style="color:#1d1d1f">${esc(m.subject)}</span><br>${esc(m.body.replace(/\n/g, ' ').slice(0, 70))}</p></button>`).join('')}</div><div class="main"></div>`;
      $$('.it', r.body).forEach(b => b.onclick = () => { r.sel = b.dataset.id; mailR(r); });
      const m = items.find(x => x.id === r.sel); if (!m) return;
      m.unread = false;
      $('.main', r.body).innerHTML = `<div class="mailv"><div class="mh"><b>${esc(m.subject)}</b><div>From: ${esc(m.from)}${m.addr ? ` &lt;${esc(m.addr)}&gt;` : ''}<br>To: ${esc(m.to || S.owner)}<br>${esc(m.full || m.date)}</div></div><div class="mb">${esc(m.body)}</div></div>`;
      setTitle(r, 'Inbox');
      markSeen('mail:' + m.id);
    }
    /* ----- messages ----- */
    function dav(t, z) {
      const sz = z ? `width:${z}px;height:${z}px;font-size:${Math.round(z * .42)}px;` : '';
      const ph = t.photo || PH(t.name);
      if (ph) return `<i class="dav" style="${sz}background:#bbb url('${esc(ph)}') center/cover"></i>`;
      const n = (t.initials || t.name.replace(/^(Mrs?\.|Dr\.|Mr\.|Ms\.)\s*/, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2)).toUpperCase();
      return `<i class="dav" style="${sz}">${esc(/^[A-Z]/.test(n) ? n : '')}</i>`;
    }
    function messagesR(r) {
      const ths = C.messages.threads.filter(vis).slice().sort((a, b) => (b.order || 0) - (a.order || 0));
      if (!r.sel || !ths.find(t => t.id === r.sel)) r.sel = ths[0] && ths[0].id;
      const pv = t => { const its = t.items.filter(m => vis(m) && !(m.live && !m._done) && (m.t === 'in' || m.t === 'out')); const m = its[its.length - 1]; return m ? esc(m.img ? 'Photo' : m.text) : ''; };
      r.body.innerHTML = `<div class="side" style="background:#f6f6f6">${ths.map(t => `<button class="it mi ${t.id === r.sel ? 'on' : ''}" data-id="${t.id}">${t.unread ? '<i class="ud"></i>' : ''}${dav(t)}<b>${esc(t.name)}<span>${esc(fmtT(t.time))}</span></b><p>${pv(t)}</p></button>`).join('')}</div><div class="dmcol"><div class="dthead"></div><div class="main"><div class="dmsgs"></div></div><div class="dinbar"><div class="fld ph">iMessage</div></div></div>`;
      $$('.it', r.body).forEach(b => b.onclick = () => { r.sel = b.dataset.id; messagesR(r); });
      const t = ths.find(x => x.id === r.sel); if (!t) return;
      t.unread = false;
      $('.dthead', r.body).innerHTML = `${dav(t, 22)}<span>${esc(t.name)}</span>`;
      setTitle(r, 'Messages');
      const list = $('.dmsgs', r.body), main = $('.main', r.body), fld = $('.fld', r.body);
      const shown = t.items.filter(vis);
      const draw = items => {
        let html = '';
        items.forEach((m, i) => {
          if (m.t === 'day') { html += `<div class="mday">${richLine(m.text)}</div>`; return; }
          if (m.t !== 'in' && m.t !== 'out') return;
          const nx = items[i + 1]; const tail = !nx || nx.t !== m.t; const prev = items[i - 1]; const gap = prev && prev.t !== m.t && (prev.t === 'in' || prev.t === 'out');
          if (m.who && m.t === 'in' && (!prev || prev.who !== m.who)) html += `<div class="mwho">${esc(m.who)}</div>`;
          html += m.img ? `<div class="bub img ${m.t} ${gap ? 'gap' : ''}" style="padding:0;background:none;max-width:220px"><img src="${esc(m.img)}" alt="" style="width:100%;border-radius:16px;display:block"></div>` : `<div class="bub ${m.t} ${tail ? 'tl' : ''} ${gap ? 'gap' : ''}">${esc(m.text)}</div>`;
          if (m.status) html += `<div class="mstat ${m.status.indexOf('Not Delivered') > -1 ? 'nd' : ''}">${richLine(m.status)}</div>`;
        });
        list.innerHTML = html; main.scrollTop = main.scrollHeight;
      };
      const settled = shown.filter(m => !m.live);
      draw(settled);
      const live = shown.filter(m => m.live && !m._done);
      if (live.length) {
        (async () => {
          const alive = () => st.wins.messages === r && r.sel === t.id;
          for (const m of live) {
            if (!alive()) return;
            if (m.t === 'out') {
              let txt = '';
              const ok = await playText(() => txt, v => { txt = v; fld.classList.toggle('ph', !v); fld.innerHTML = v ? esc(v) + '<span class="caret"></span>' : 'iMessage'; }, m.play || [['t', m.text]], 1, alive);
              if (!ok) return;
              if (m.unsent) { m._done = true; continue; }
              fld.classList.add('ph'); fld.textContent = 'iMessage';
            } else {
              await wait(m.wait || 1400);
              if (!alive()) return;
              list.insertAdjacentHTML('beforeend', '<div class="typing"><i></i><i></i><i></i></div>'); main.scrollTop = main.scrollHeight;
              await wait(Math.min(4000, 900 + m.text.length * 45));
              if (!alive()) return;
            }
            m._done = true; m.live = false; settled.push(m); draw(settled);
            await wait(500);
          }
          markSeen('thread:' + t.id);
        })();
      } else markSeen('thread:' + t.id);
    }
    /* ----- browser ----- */
    function browserR(r) {
      const items = C.browser.items.filter(vis);
      r.body.style.flexDirection = 'column';
      r.body.innerHTML = `<div class="btab"><span style="color:#999">${SV.bk.replace('currentColor', '#999')}</span><span style="color:#ccc">${SV.fwd.replace('currentColor', '#ccc')}</span><div class="url"></div><button class="hb" style="color:#555">${SV.book.replace('currentColor', '#555')}</button></div><div class="bmain"></div>`;
      const url = $('.url', r.body), main = $('.bmain', r.body);
      const history = () => {
        url.textContent = 'History';
        const g = {}; items.slice().reverse().forEach(it => (g[it.dayLabel || 'Today'] = g[it.dayLabel || 'Today'] || []).push(it));
        main.innerHTML = `<div class="dhist"><h3>History</h3>${Object.keys(g).map(k => `<div class="hg">${esc(k)}</div>${g[k].map(it => `<button class="hr" data-id="${it.id}"><span>${esc(it.time || '')}</span><b>${esc(it.q)}</b><i>search</i></button>`).join('')}`).join('')}</div>`;
        $$('.hr', main).forEach(b => b.onclick = () => serp(items.find(x => x.id === b.dataset.id)));
        markSeen('history');
      };
      const serp = (it) => {
        url.textContent = 'search?q=' + it.q.toLowerCase().replace(/\s+/g, '+');
        const resHTML = (it.results || []).map(x => `<div class="res"><div class="site"><i>${esc(x.site[0].toUpperCase())}</i><div><b style="font-weight:400">${esc(x.site)}</b><span>${esc(x.path || '')}</span></div></div><h4>${esc(x.title)}</h4><p>${esc(x.snip)}</p></div>`).join('');
        main.innerHTML = `<div class="dserp"><div class="sbox"></div><div class="rs"></div></div>`;
        const box = $('.sbox', main), rs = $('.rs', main);
        if (it.live && !it._done) {
          let txt = ''; const alive = () => st.wins.browser === r;
          playText(() => txt, v => { txt = v; box.innerHTML = esc(v) + '<span class="caret"></span>'; }, it.play || [['t', it.q]], 1, alive).then(ok => { if (!ok) return; it._done = true; box.textContent = it.q; setTimeout(() => { rs.innerHTML = resHTML; markSeen('search:' + it.id); }, 450); });
        } else { box.textContent = it.q; rs.innerHTML = resHTML; markSeen('search:' + it.id); }
      };
      $('.hb', r.body).onclick = history;
      r.showSearch = id => serp(items.find(x => x.id === id));
      const cur = items[items.length - 1];
      if (r.sel === '__search') { r.sel = null; return; }
      if (cur && cur.live && !cur._done) serp(cur); else history();
      setTitle(r, 'Browser');
    }
    /* ----- calendar ----- */
    function calendarR(r) {
      const K = C.calendar; const first = new Date(K.year, K.month, 1); const days = new Date(K.year, K.month + 1, 0).getDate();
      const lead = (first.getDay() + 6) % 7;
      const cells = [];
      for (let i = 0; i < lead; i++) cells.push(`<div class="off"><div class="dn">${new Date(K.year, K.month, 0).getDate() - lead + i + 1}</div></div>`);
      for (let d = 1; d <= days; d++) {
        const evs = K.events.filter(e => e.d === d && vis(e));
        cells.push(`<div class="${d === (day().dn || 0) ? 'tdy' : ''}"><div class="dn"><span>${d}</span></div>${evs.map(e => `<div class="ev ${e.red ? 'r' : ''}">${esc(e.text)}</div>`).join('')}</div>`);
      }
      while (cells.length % 7) cells.push('<div class="off"></div>');
      r.body.innerHTML = `<div class="main"><div class="dcal"><h3>${esc(K.label)} <span>${K.year}</span></h3><div class="cg">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => `<div class="wd">${w}</div>`).join('')}${cells.join('')}</div></div></div>`;
      setTitle(r, 'Calendar');
      markSeen('calendar');
    }
    /* ----- photos ----- */
    function photosR(r) {
      const items = C.photos.items.filter(vis);
      r.body.innerHTML = `<div class="main"><div class="dphotos">${items.map((p, i) => `<button data-i="${i}"><img src="${esc(p.src)}" alt=""></button>`).join('')}</div></div>`;
      $$('.dphotos button', r.body).forEach(b => b.onclick = () => {
        const p = items[+b.dataset.i];
        const v = el('div', 'dpv', `<div class="ph"><img src="${esc(p.src)}" alt=""></div><div class="cp"><span>${esc(p.caption || '')}</span><span>${esc(p.date || '')}</span></div>`);
        $('.main', r.body).appendChild(v); v.onclick = () => v.remove(); markSeen('photo:' + (p.id || b.dataset.i));
      });
      setTitle(r, 'Photos');
      markSeen('photos');
    }
    /* ----- sheets ----- */
    function sheetsR(r) {
      const items = C.sheets.items.filter(vis);
      if (!r.sel || !items.find(s => s.id === r.sel)) r.sel = items[items.length - 1].id;
      const s = items.find(x => x.id === r.sel);
      const cols = 'ABCDEFGH'.slice(0, s.cols.length).split('');
      r.body.innerHTML = `<div class="main"><table class="sheet"><tr><th></th>${cols.map(c => `<th>${c}</th>`).join('')}</tr><tr><td class="n">1</td>${s.cols.map(c => `<td style="font-weight:600">${esc(c)}</td>`).join('')}</tr>${s.rows.map((row, i) => `<tr><td class="n">${i + 2}</td>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}${Array.from({ length: 6 }, (_, i) => `<tr><td class="n">${s.rows.length + 2 + i}</td>${cols.map(() => '<td></td>').join('')}</tr>`).join('')}</table></div>`;
      setTitle(r, s.title);
      markSeen('sheet:' + s.id);
    }
    /* ----- files ----- */
    function filesR(r) {
      const F = C.files; const folders = F.folders.filter(vis);
      if (!r.sel || !folders.find(f => f.name === r.sel)) r.sel = folders[0].name;
      const f = folders.find(x => x.name === r.sel);
      r.body.innerHTML = `<div class="side" style="width:190px"><div class="sh">Favourites</div>${folders.map(x => `<button class="it ${x.name === r.sel ? 'on' : ''}" data-f="${esc(x.name)}" style="border:0;padding:6px 14px"><b style="font-weight:500">${x.trash ? '🗑' : '📁'} ${esc(x.name)}</b></button>`).join('')}</div><div class="main"><div class="ftop">${esc(f.name)}</div><div class="fgrid">${f.items.filter(vis).map((it, i) => `<button class="fi" data-i="${i}"><div class="fic ${it.kind || 'doc'}">${it.src ? `<img src="${esc(it.src)}" alt="">` : (it.kind === 'pdf' ? 'PDF' : it.kind === 'sheet' ? '▦' : it.kind === 'code' ? '{ }' : '≡')}</div><span>${esc(it.name)}</span><small>${esc(it.date || '')}</small></button>`).join('') || '<p style="color:#999;padding:30px">Empty</p>'}</div></div>`;
      $$('[data-f]', r.body).forEach(b => b.onclick = () => { r.sel = b.dataset.f; filesR(r); });
      $$('.fi', r.body).forEach(b => b.ondblclick = b.onclick = () => {
        const it = f.items.filter(vis)[+b.dataset.i];
        const v = el('div', 'dpv' + (it.src ? '' : ' doc'));
        v.innerHTML = it.src ? `<div class="ph"><img src="${esc(it.src)}" alt=""></div><div class="cp"><span>${esc(it.name)}</span><span>close</span></div>` : `<div class="docv"><div class="dh">${esc(it.name)}<button>Close</button></div><div class="db">${(it.body || []).map(l => `<p>${richLine(l)}</p>`).join('')}</div></div>`;
        $('.main', r.body).appendChild(v);
        (it.src ? v : $('.dh button', v)).onclick = () => v.remove();
        markSeen('file:' + it.name);
      });
      setTitle(r, f.name);
      markSeen('files');
    }
    /* ----- code editor ----- */
    const KW = /\b(function|const|let|var|return|if|else|for|while|import|from|export|def|class|async|await|true|false|null|None|self|try|except|catch|new|in|of)\b/g;
    function hl(line) {
      let x = esc(line);
      x = x.replace(/(&quot;.*?&quot;|'.*?')/g, '<i class="cs">$1</i>');
      x = x.replace(/(\/\/.*$|#.*$)/, '<i class="cc">$1</i>');
      x = x.replace(KW, '<i class="ck">$1</i>');
      return x;
    }
    function codeR(r) {
      const K = C.code; const files = K.files.filter(vis);
      if (!r.sel || !files.find(f => f.path === r.sel)) r.sel = (files.find(f => f.open) || files[0]).path;
      const f = files.find(x => x.path === r.sel);
      r.body.classList.add('codew');
      r.body.innerHTML = `<div class="cside"><div class="csh">EXPLORER</div><div class="csh2">${esc(K.project || 'project')}</div>${files.map(x => `<button class="cf ${x.path === r.sel ? 'on' : ''}" data-p="${esc(x.path)}">${esc(x.path)}</button>`).join('')}</div><div class="cmain"><div class="ctabs"><span class="on">${esc(f.path.split('/').pop())}</span></div><div class="ced">${f.text.split('\n').map((l, i) => `<div class="cl ${f.mark === i + 1 ? 'mk' : ''}"><u>${i + 1}</u><code>${hl(l) || ' '}</code></div>`).join('')}</div>${K.terminal ? `<div class="cterm"><div class="cth">TERMINAL</div>${K.terminal.filter(vis).map(t => `<div>${esc(t.text || t)}</div>`).join('')}<div><span class="cpr">${esc(K.prompt || '$')}</span> <span class="caret" style="background:#ccc"></span></div></div>` : ''}</div>`;
      $$('.cf', r.body).forEach(b => b.onclick = () => { r.sel = b.dataset.p; codeR(r); });
      setTitle(r, f.path + ' — ' + (K.project || ''));
      markSeen('code:' + f.path);
    }
    const RENDER = { notes: notesR, mail: mailR, messages: messagesR, browser: browserR, calendar: calendarR, photos: photosR, sheets: sheetsR, finder: filesR, code: codeR };

    /* ----- banners ----- */
    function banner(n) {
      const who = n.app === 'messages' && PH(n.title);
      const b = el('button', 'dbn', `${who ? `<div class="ap pav" style="background-image:url('${esc(who)}')"><i>${icon(n.app)}</i></div>` : `<div class="ap">${icon(n.app)}</div>`}<div class="tx"><div class="hd">${esc(n.title)}<span>now</span></div><div class="bd">${esc(n.body)}</div></div>`);
      bns.appendChild(b);
      b.onclick = () => { b.remove(); if (n.open) openTarget(n.open); };
      setTimeout(() => { b.style.transition = 'opacity .5s,transform .5s'; b.style.opacity = '0'; b.style.transform = 'translateX(40px)'; setTimeout(() => b.remove(), 520); }, n.stay || 7000);
    }
    function openTarget(t) {
      const [k, id] = t.split(':');
      if (k === 'note') openApp('notes', null, id);
      else if (k === 'mail') openApp('mail', null, id);
      else if (k === 'thread') openApp('messages', null, id);
      else if (k === 'search') openApp('browser', r => r.showSearch(id), '__search');
      else if (k === 'sheet') openApp('sheets', null, id);
      else if (k === 'code') openApp('code', null, id);
      else if (k === 'files') openApp('finder');
      else if (k === 'file') {
        const f = C.files.folders.find(x => x.items.some(it => it.name === id && vis(it)));
        openApp('finder', r => { setTimeout(() => { const i = f.items.filter(vis).findIndex(it => it.name === id); const b = $$('.fi', r.body)[i]; if (b) b.click(); }, 300); }, f ? f.name : null);
      }
      else if (k === 'photo') openApp('photos');
      else if (RENDER[k]) openApp(k);
    }

    /* ----- beats ----- */
    function markSeen(key) {
      st.seen.add(key);
      if (!st.free && st.target && st.target === key) { const b = st.beat, d = st.day; setTimeout(() => { if (st.beat === b && st.day === d) complete(); }, 1500); }
    }
    function refreshOpen() { Object.values(st.wins).forEach(r => { const keep = r.sel; RENDER[r.id](r); r.sel = keep; }); }
    function activate(i) {
      st.beat = i;
      const B = day().beats[i];
      if (!B) return endOfDay();
      if (B.id) st.fired.add(B.id);
      if (B.at) setClock(B.at);
      if (B.unread) { const t = C.messages.threads.find(x => x.id === B.unread); if (t) { t.unread = true; t.order = (t.order || 0) + 100; if (B.time) t.time = B.time; } }
      if (B.mailUnread) { const m = C.mail.items.find(x => x.id === B.mailUnread); if (m) m.unread = true; }
      if (B.target && (B.unread || B.mailUnread || B.auto || B.notify)) st.seen.delete(B.target);
      st.target = B.target || null;
      ['mail', 'calendar', 'photos', 'sheets'].forEach(a => { const r = st.wins[a]; if (r) { const k = r.sel; RENDER[a](r); r.sel = k; } });
      if (B.unread && st.wins.messages && !B.auto) { const r = st.wins.messages; const k = r.sel; RENDER.messages(r); r.sel = k; }
      if (B.target && !B.auto) { const app = targetApp(B.target); if (app && !(st.wins[app] && front === app)) st.badges[app] = (st.badges[app] || 0) + 1; }
      renderDock();
      if (B.notify) banner(Object.assign({ open: B.target }, B.notify));
      if (B.auto && B.target) setTimeout(() => { if (st.beat === i) openTarget(B.target); }, B.autoDelay || 600);
      if (B.target && st.seen.has(B.target)) setTimeout(() => { if (st.beat === i) complete(); }, 1800);
      if (!B.target) setTimeout(() => { if (st.beat === i) complete(); }, B.hold || 3000);
    }
    function targetApp(t) { const k = t.split(':')[0]; return { file: 'finder', files: 'finder', code: 'code', note: 'notes', mail: 'mail', thread: 'messages', search: 'browser', sheet: 'sheets', photo: 'photos', history: 'browser', app: t.split(':')[1] }[k] || k; }
    function complete() {
      const key = st.day + ':' + st.beat; if (st.lastDone === key) return; st.lastDone = key;
      st.target = null;
      const nx = day().beats[st.beat + 1];
      const delay = nx ? (nx.delay != null ? nx.delay : 2600) : 3200;
      const i = st.beat + 1;
      setTimeout(() => activate(i), delay);
    }
    function endOfDay() {
      if (st.day >= S.days.length - 1) return finish();
      const nd = S.days[st.day + 1];
      sleep.innerHTML = `<div class="sd">${esc(nd.date)}</div><div class="st">${fromMin(toMin(nd.start))}</div><div class="sh">${esc(nd.lead || '')}</div>`;
      sleep.classList.add('on');
      setTimeout(() => {
        st.day++; st.clock = toMin(nd.start); st.seen = new Set([...st.seen].filter(k => !k.startsWith('app:')));
        renderMB(); renderDock(); refreshOpen();
        setTimeout(() => { sleep.classList.remove('on'); setTimeout(() => activate(0), 1400); }, 2600);
      }, 1500);
    }
    function finish() {
      if (st.done) return; st.done = true;
      if (S.end && S.end.at) setClock(S.end.at);
      if (S.end && S.end.notify) banner(S.end.notify);
      setTimeout(() => {
        store.set('tm-done-' + S.id + '-desktop', 1);
        caption(S.end.caption, { sub: S.title, more: endLines(S, 'desktop') + '<br><br><span style="color:#888">Click to step away from the desk. Come back to look through everything for as long as you like.<br>Click the clock on the lock screen five times to start over.</span>' }).then(lockScreen);
      }, (S.end && S.end.capDelay) || 3000);
    }
    function lockScreen() {
      st.free = true; st.target = null;
      const L = el('div', 'dlogin');
      const d = day();
      L.innerHTML = `<div class="lkc"><div class="sd">${esc(d.date)}</div><div class="st">${fromMin(st.clock)}</div></div><div class="avt">${S.me && S.me.photo ? `<img src="${esc(S.me.photo)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : esc((S.owner || '?')[0])}</div><b style="font-size:15px">${esc(S.owner)}</b><input type="password" placeholder="${S.login ? 'Enter Password' : 'Click to unlock'}" ${S.login ? '' : 'readonly'}><div class="hint"></div>`;
      root.appendChild(L);
      let taps = 0, tt = null;
      $('.lkc', L).onclick = () => { taps++; clearTimeout(tt); tt = setTimeout(() => taps = 0, 1600); if (taps >= 5) { L.style.transition = 'opacity .6s'; L.style.background = '#000'; setTimeout(() => location.reload(), 500); } };
      const inp = $('input', L);
      const open = () => { L.style.transition = 'opacity .5s'; L.style.opacity = '0'; setTimeout(() => L.remove(), 500); };
      if (!S.login) { inp.onclick = open; $('.avt', L).onclick = open; }
      else inp.onkeydown = e => { if (e.key === 'Enter') { if (inp.value.trim().toLowerCase() === String(S.login.pass).toLowerCase()) open(); else { L.classList.add('shake'); setTimeout(() => L.classList.remove('shake'), 460); inp.value = ''; if (++st.fails >= 2 && S.login.hint) $('.hint', L).textContent = S.login.hint; } } };
      setTimeout(() => inp.focus && S.login && inp.focus(), 300);
    }

    renderMB(); renderDock();
    caption(S.caption.open, { sub: S.title }).then(() => {
      if (S.login && S.login.atStart) startLock(); else setTimeout(() => activate(0), 900);
    });
    function startLock() {
      const L = el('div', 'dlogin');
      L.innerHTML = `<div class="lkc"><div class="sd">${esc(day().date)}</div><div class="st">${fromMin(st.clock)}</div></div><div class="avt">${S.me && S.me.photo ? `<img src="${esc(S.me.photo)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : esc((S.owner || '?')[0])}</div><b style="font-size:15px">${esc(S.owner)}</b><input type="password" placeholder="Enter Password"><div class="hint"></div>`;
      root.appendChild(L);
      const inp = $('input', L); setTimeout(() => inp.focus(), 200);
      let fails = 0;
      inp.onkeydown = e => { if (e.key !== 'Enter') return; if (inp.value.trim().toLowerCase() === String(S.login.pass).toLowerCase()) { L.style.transition = 'opacity .5s'; L.style.opacity = '0'; setTimeout(() => { L.remove(); activate(0); }, 500); } else { L.classList.add('shake'); setTimeout(() => L.classList.remove('shake'), 460); inp.value = ''; if (++fails >= 2 && S.login.hint) $('.hint', L).textContent = S.login.hint; } };
    }
    window.__desk = { st, openTarget };
  }

  window.StoryEngine = {
    start(S) { (S.kind === 'desktop' ? Desktop : Phone)(S); },
    choose() {
      const q = new URLSearchParams(location.search).get('v');
      if (q === 'phone' || q === 'desktop') return q;
      const touch = matchMedia('(pointer:coarse)').matches;
      return touch && Math.min(screen.width, screen.height) < 700 ? 'phone' : 'desktop';
    }
  };
})();
