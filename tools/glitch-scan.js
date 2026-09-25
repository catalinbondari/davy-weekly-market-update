/* glitch-scan.js — paste-free QA pass, loaded into the deck by URL hash.
   Walks every slide at the current viewport and reports anything a room
   would notice: text cut off, things overlapping, empty charts, NaN, the
   clock or the rail colliding with content, controls that don't work. */
window.__scan = async function () {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const R = (el) => el.getBoundingClientRect();
  const hit = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  const vis = (el) => { const r = R(el); const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
  const out = { vw: innerWidth, vh: innerHeight, problems: [], slides: [] };
  const bad = (m) => out.problems.push(m);

  if (!S.started) start('bull');
  await wait(600);

  for (let i = 0; i < WEEK.length; i++) {
    goTo(i); await wait(1850);
    while (revealNext()) {} await wait(1000);
    const d = WEEK[i], tag = d.label;
    const col = lower.firstElementChild;
    const fit = getComputedStyle(col).getPropertyValue('--fit').trim();
    const over = lower.scrollHeight - lower.clientHeight;
    out.slides.push(tag + ' fit ' + fit + ' over ' + over);

    if (over > 6) bad(tag + ': column overflows by ' + over + 'px (scrolls)');
    if (document.documentElement.scrollWidth > innerWidth + 1) bad(tag + ': horizontal page scroll');
    if (/NaN|undefined|\[object/.test(lower.innerHTML)) bad(tag + ': NaN/undefined in slide markup');

    // text cut off inside tiles, chips and score names
    lower.querySelectorAll('.tile-v,.tile-k,.tile-c,.chip,.mood,.pendchip,.score-name').forEach(el => {
      if (vis(el) && el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).textOverflow !== 'ellipsis')
        bad(tag + ': text clipped in .' + el.className.split(' ')[0] + ' "' + el.textContent.trim().slice(0, 30) + '"');
    });

    // charts drew something, and sit inside the column
    lower.querySelectorAll('.chart-root').forEach((root, k) => {
      if (!root.querySelector('path,rect,line')) bad(tag + ': chart ' + (k + 1) + ' is empty');
      const rr = R(root), lr = R(lower);
      if (rr.right > lr.right + 4) bad(tag + ': chart ' + (k + 1) + ' spills past the column by ' + Math.round(rr.right - lr.right) + 'px');
    });

    // tiles overlapping charts
    const tiles = [...lower.querySelectorAll('.tile')], charts = [...lower.querySelectorAll('.chartwrap')];
    tiles.forEach(t => charts.forEach(c => { if (vis(t) && vis(c) && hit(R(t), R(c))) bad(tag + ': a tile overlaps a chart'); }));

    // fixed furniture colliding with content
    /* Where the ink actually is: a block element's box runs the full column
       width, but only its text can be hidden by the clock. */
    const inkRects = (el) => {
      if (el.matches('.tile,.chartwrap,.score,.verdict,.chip,.mood,.pendchip')) return [R(el)];
      const rg = document.createRange(); rg.selectNodeContents(el);
      return [...rg.getClientRects()].filter(r => r.width > 1 && r.height > 1);
    };
    const content = [...lower.querySelectorAll('.tile,.chartwrap,.headline,.dayname,.daterow,.eyebrow .chip,.eyebrow .mood,.eyebrow .pendchip,.eyebrow > span:last-child,.score,.verdict,.qa-title,.qa-asks')].filter(vis);
    ['.timer', '.rail', '.counter', '.hint'].forEach(sel => {
      const f = document.querySelector(sel); if (!f || !vis(f)) return;
      content.forEach(c => { if (inkRects(c).some(r => hit(R(f), r))) bad(tag + ': ' + sel + ' covers ' + (c.className.split(' ')[0] || c.tagName) + ' "' + c.textContent.trim().slice(0, 24) + '"'); });
    });

    // the animal and the mood agree
    if (d.kind !== 'questions' && S.kind !== moodFor(d)) bad(tag + ': animal is ' + S.kind + ' but mood is ' + moodFor(d));
    // the rail marks the right stop
    const here = [...document.querySelectorAll('.stop')].findIndex(s => s.classList.contains('here'));
    if (here !== i) bad(tag + ': rail highlights stop ' + here);
  }

  // controls
  const ev = (k) => dispatchEvent(new KeyboardEvent('keydown', { key: k, code: k === ' ' ? 'Space' : '', bubbles: true }));
  ev('n'); await wait(100);
  if (!stage.classList.contains('show-notes')) bad('N did not open the script');
  const nt = document.querySelector('#notes');
  if (!nt || !/Your script/.test(nt.textContent)) bad('script panel empty');
  ev('n'); await wait(100);
  if (stage.classList.contains('show-notes')) bad('N did not close the script');
  goTo(1); await wait(1850);
  ev('n'); await wait(100);
  if (document.querySelector('#notes').textContent.indexOf(WEEK[1].label) < 0) bad('script panel not following the slide');
  ev('n');
  const wasRunning = T.running;
  ev('p'); await wait(60); if (T.running === wasRunning) bad('P did not toggle the clock');
  ev('p'); await wait(60);
  ev('0'); await wait(60); if (Math.abs(tLeft() - TALK_MS) > 1500) bad('0 did not reset the clock');

  out.ok = out.problems.length === 0;
  return out;
};
