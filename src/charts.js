/* ============================================================================
 * charts.js — chart module for the market-update deck
 * Plain browser JS. No modules, no build step, no dependencies.
 *
 * Exposes exactly three globals:
 *   CHART_CSS          a CSS string — inline it ONCE in the page <head>
 *   chartSVG(spec,opts) returns an HTML string for one chart
 *   chartAttach(rootEl) wires hover / tooltip / keyboard / reveal
 *
 * ---------------------------------------------------------------------------
 * WIRING IT UP (once per page)
 * ---------------------------------------------------------------------------
 *   const s = document.createElement('style');
 *   s.textContent = CHART_CSS;
 *   document.head.appendChild(s);
 *
 *   slot.innerHTML = chartSVG(spec, { size: 'column' });
 *   chartAttach(slot);            // safe to call again, and on empty roots
 *
 * chartAttach is idempotent and also runs itself: the module sweeps on DOM
 * ready and watches for cards inserted later, so a chart is never left sitting
 * in its pre-animation (invisible) state because an attach call was missed.
 *
 * IT FITS ITS SLOT. On attach the card measures the width it actually got and
 * redraws itself at that width, holding the aspect ratio. So a chart dropped in
 * a 390px story column draws a 390px-wide chart with 10.5px axis type — not a
 * 560px chart shrunk to 0.7 with 7px type. Nothing to configure; a
 * ResizeObserver repeats it if the column changes. Passing `width` yourself
 * still works and simply sets the starting size.
 *
 * REVEAL. Every chart animates in when its root gets the class `is-in`.
 *   deck.querySelector('.gfc').classList.add('is-in');   // your click handler
 * chartAttach also adds `is-in` the moment the chart appears on screen, so a
 * missed click can't leave a blank panel. Pass { reveal: 'manual' } to switch
 * that off and drive it entirely yourself. prefers-reduced-motion is instant.
 *
 * OPTS
 *   { width, height,             // px. `width` is the width of the whole CARD
 *     size: 'column' | 'hero',   // column ≈ 340–780 × 190–300, hero ≤ 1100×520
 *     reveal: 'auto' | 'manual',
 *     table: true,               // also render a VISIBLE values table
 *     mode: 'light' }            // opt into the light-surface palette
 *
 * ---------------------------------------------------------------------------
 * THE FOUR KINDS — copy, paste, edit. Every field except `kind` is optional.
 * ---------------------------------------------------------------------------
 *
 * 1) CANDLE — the signature form. Open/high/low/close per period.
 *
 *    chartSVG({
 *      kind : 'candle',
 *      title: 'Brent crude',
 *      note : 'ICE settlement',
 *      unit : '$',                          // '$' '€' '£' '¥' prefix; '%' 'bp' suffix
 *      data : [
 *        { t:'Mon', o:78.2, h:79.4, l:77.8, c:79.1 },
 *        { t:'Tue', o:79.1, h:79.9, l:78.6, c:78.8 },
 *        { t:'Wed', o:78.8, h:80.2, l:78.7, c:80.0 },
 *        { t:'Thu', o:80.0, h:80.4, l:78.9, c:79.2 },
 *        { t:'Fri', o:79.2, h:79.6, l:77.4, c:77.6 }
 *      ]
 *    }, { size:'hero' })
 *
 *    Labels only the first close, the last close (right-edge tag), the high and
 *    the low — never every candle. `open/high/low/close` spellings also work.
 *
 * 2) LINE — 1 to 4 series. One series gets an area wash; two or more get a
 *    legend plus direct end-labels.
 *
 *    chartSVG({
 *      kind  : 'line',
 *      title : 'Index level, rebased',
 *      note  : 'Monday open = 0',
 *      unit  : '%',
 *      series: [
 *        { name:'S&P 500',   points:[{t:'Mon',v:0.4},{t:'Tue',v:0.1},
 *                                    {t:'Wed',v:0.9},{t:'Thu',v:1.6},{t:'Fri',v:1.4}] },
 *        { name:'Stoxx 600', points:[{t:'Mon',v:0.2},{t:'Tue',v:0.5},
 *                                    {t:'Wed',v:0.3},{t:'Thu',v:0.8},{t:'Fri',v:0.6}] }
 *      ]
 *    }, { size:'column' })
 *
 *    Shorthand for one series:  { kind:'line', title:'…', data:[{t:'Mon',v:0.4}, …] }
 *
 * 3) BARS — one value per name. As soon as ANY value is negative the set reads
 *    as polarity: up/down colours, signed labels, a zero baseline that sits
 *    wherever the data puts it. All-positive is nominal and takes one gold hue,
 *    growing from a left baseline. All-negative grows leftward from a right
 *    baseline. Long names truncate with an ellipsis (full name in the tooltip
 *    and the table); the value label always rides just past the bar tip.
 *
 *    chartSVG({
 *      kind : 'bars',
 *      title: 'Weekly move, cross-asset',
 *      note : 'Friday close vs prior Friday',
 *      unit : '%',
 *      dir  : 'h',                          // 'h' (default) or 'v' for columns
 *      bars : [
 *        { name:'Brent',    v:-3.2 },
 *        { name:'Gold',     v: 2.1 },
 *        { name:'S&P 500',  v: 1.4 },
 *        { name:'US 10y',   v:-0.6 },
 *        { name:'Copper',   v: 0.8 }
 *      ]
 *    }, { size:'column' })
 *
 * 4) STAT — the number IS the chart. No axes, no plot.
 *
 *    chartSVG({
 *      kind: 'stat',
 *      stat: { value:'+1.4%', label:'S&P 500, week', sub:'best week since June' }
 *    }, { size:'hero' })
 *
 *    Optional: stat.spark = [0.4,0.1,0.9,1.6,1.4]  →  adds a small sparkline.
 *    A leading + or − colours the value and adds a ▲/▼ so it is never
 *    colour-alone.
 *
 * ---------------------------------------------------------------------------
 * COLOUR — validated, do not hand-edit
 * ---------------------------------------------------------------------------
 * Series slots and the up/down pair were run through the dataviz skill's
 * scripts/validate_palette.js on BOTH surfaces. Verdicts:
 *
 *   dark  (surface #17130f)  #c1861a #3987e5 #199e70 #8a7ce4
 *         adjacent  ALL PASS   worst CVD ΔE 17.6 · normal-vision ΔE 20.7
 *         3 slots, --pairs all ALL PASS   CVD ΔE 8.4 · normal ΔE 18.5
 *   light (surface #faf7f2)  #8a6210 #2a78d6 #0e9a63 #6b4fd8
 *         adjacent  ALL PASS   worst CVD ΔE 21.4 · normal-vision ΔE 22.6
 *         3 slots, --pairs all ALL PASS   CVD ΔE 9.7 · normal ΔE 17.6
 *   up/down  dark  #28ae76 / #c73832  all-pairs ALL PASS  CVD ΔE 11.3
 *            light #1a9e6a / #b5322c  all-pairs ALL PASS  CVD ΔE 10.4
 *
 * A 4th line series is legal on the adjacent pairlist only; that is why 2–4
 * series always ship a legend AND direct end-labels (the required secondary
 * encoding). Slot order is the CVD-safety mechanism — never reorder or cycle,
 * and never add a 5th hue: fold the tail into "Other" instead.
 * The host's --accent is used for chrome (rules, focus, sparkline), not for
 * series identity, so a re-skin can't silently break the validated palette.
 * ========================================================================== */

var chartSVG, chartAttach;

const CHART_CSS = `
.gfc{
  /* consume the host's tokens, fall back to validated defaults */
  --gfc-panel : var(--panel, #17130f);
  --gfc-bone  : var(--bone, #f4eee3);
  --gfc-bone2 : var(--bone-2, #cec4b2);
  --gfc-muted : var(--muted, #9a8f7e);
  --gfc-line  : var(--line, rgba(244,238,227,.13));
  --gfc-accent: var(--accent, #e6b25c);
  --gfc-up    : var(--up, #28ae76);
  --gfc-down  : var(--down, #c73832);
  /* categorical slots — validated, fixed order, never cycled */
  --gfc-s1:#c1861a; --gfc-s2:#3987e5; --gfc-s3:#199e70; --gfc-s4:#8a7ce4;
  --gfc-mono: var(--f-mono, "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  --gfc-disp: var(--f-display, "Big Shoulders Display", "Oswald", "Arial Narrow", sans-serif);
  --gfc-fs:10.5px; --gfc-fstitle:15px; --gfc-fsnote:10px; --gfc-stagger:20ms;
  position:relative; display:block; box-sizing:border-box; margin:0;
  container-type:inline-size;
  /* a DEFINITE width, not width:100% — inline-size containment zeroes an
     auto-width element's max-content contribution, which collapses the card
     inside any shrink-to-fit parent (flex item, float, inline-block) */
  width:var(--gfc-w, 780px); max-width:100%;
  padding:13px 15px 11px; border-radius:10px;
  color:var(--gfc-bone);
  background:var(--gfc-panel);
  box-shadow: inset 0 0 0 1px var(--gfc-line), 0 20px 44px -26px rgba(0,0,0,.9);
  -webkit-font-smoothing:antialiased;
}
.gfc *,.gfc *::before,.gfc *::after{ box-sizing:border-box; }
@supports (backdrop-filter: blur(2px)){ .gfc{ backdrop-filter: blur(6px) saturate(.92); } }

/* light surface — explicit opt-in only; the deck itself is dark */
[data-theme="light"] .gfc, .gfc[data-mode="light"]{
  --gfc-panel:#faf7f2; --gfc-bone:#1a1611; --gfc-bone2:#4d453a; --gfc-muted:#6f6455;
  --gfc-line:rgba(26,22,17,.14); --gfc-accent:#8a6410;
  --gfc-up:#1a9e6a; --gfc-down:#b5322c;
  --gfc-s1:#8a6210; --gfc-s2:#2a78d6; --gfc-s3:#0e9a63; --gfc-s4:#6b4fd8;
  box-shadow: inset 0 0 0 1px var(--gfc-line), 0 12px 30px -22px rgba(26,22,17,.5);
}
/* the candle glow is a dark-ground device — drop it on a light surface */
[data-theme="light"] .gfc .gfc-cd, .gfc[data-mode="light"] .gfc-cd{ filter:none; }
[data-theme="light"] .gfc .gfc-cd.is-hot, .gfc[data-mode="light"] .gfc-cd.is-hot{ filter:brightness(1.15); }

.gfc--hero{ --gfc-fs:13px; --gfc-fstitle:22px; --gfc-fsnote:11.5px; --gfc-stagger:26ms;
  padding:20px 22px 16px; border-radius:12px; }

/* ---------- head ---------- */
.gfc-hd{ display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; margin:0 0 8px; }
.gfc-ttl{ margin:0; font-family:var(--gfc-disp); font-size:var(--gfc-fstitle);
  font-weight:600; line-height:1.05; letter-spacing:.005em; color:var(--gfc-bone); }
.gfc--hero .gfc-hd{ margin-bottom:12px; }
.gfc-note{ margin:0; font-family:var(--gfc-mono); font-size:var(--gfc-fsnote);
  letter-spacing:.09em; text-transform:uppercase; color:var(--gfc-muted); line-height:1.4; }
.gfc-hd::after{ content:""; flex:1 1 40px; height:1px; background:var(--gfc-line);
  align-self:center; min-width:20px; }

/* ---------- legend (always present for >= 2 series) ---------- */
.gfc-lg{ display:flex; flex-wrap:wrap; gap:4px 16px; margin:0 0 6px; padding:0; list-style:none; }
.gfc-lg li{ display:flex; align-items:center; gap:7px; font-family:var(--gfc-mono);
  font-size:var(--gfc-fs); color:var(--gfc-bone2); letter-spacing:.02em; }
.gfc-lg i{ display:block; width:14px; height:2.5px; border-radius:2px; background:currentColor; flex:none; }

/* ---------- plot ---------- */
.gfc-plot{ position:relative; }
.gfc-plot:focus{ outline:none; }
.gfc-plot:focus-visible{ outline:2px solid var(--gfc-accent); outline-offset:4px; border-radius:6px; }
.gfc-svg{ display:block; width:100%; height:auto; }

.gfc-grid{ stroke:var(--gfc-line); stroke-width:1; fill:none; }
.gfc-zero{ stroke:var(--gfc-bone2); stroke-opacity:.55; stroke-width:1; }
.gfc-ax{ font-family:var(--gfc-mono); font-variant-numeric:tabular-nums;
  font-size:var(--gfc-fs); fill:var(--gfc-muted); letter-spacing:.01em; }
.gfc-val{ font-family:var(--gfc-mono); font-variant-numeric:tabular-nums;
  font-size:var(--gfc-fs); fill:var(--gfc-bone2); }
.gfc-val--key{ fill:var(--gfc-bone); }
.gfc-empty{ font-family:var(--gfc-mono); font-size:var(--gfc-fs);
  fill:var(--gfc-muted); letter-spacing:.09em; text-transform:uppercase; }

/* ---------- candles ---------- */
.gfc-cd{ fill:currentColor; stroke:currentColor; }
.gfc-cd.is-up{ color:var(--gfc-up); }
.gfc-cd.is-dn{ color:var(--gfc-down); }
.gfc-cd .wk{ stroke-width:var(--gfc-wk,1); stroke-linecap:butt; fill:none; }
.gfc-cd .bd{ stroke:none; }
.gfc-cd{ filter:drop-shadow(0 0 2px currentColor); }
@supports (color: color-mix(in srgb, red 50%, transparent)){
  .gfc-cd{ filter:drop-shadow(0 0 3.5px color-mix(in srgb, currentColor 55%, transparent)); }
}
.gfc-cd.is-hot{ filter:drop-shadow(0 0 7px currentColor); }
.gfc-tag rect{ fill:var(--gfc-panel); stroke:var(--gfc-line); }
.gfc-tag text{ font-family:var(--gfc-mono); font-variant-numeric:tabular-nums;
  font-size:var(--gfc-fs); fill:var(--gfc-bone); }
.gfc-tag--sub text{ fill:var(--gfc-bone2); }
.gfc-tag--sub rect{ stroke:none; }

/* ---------- lines ---------- */
.gfc-ln{ fill:none; stroke-width:var(--gfc-lw,2); stroke-linejoin:round; stroke-linecap:round; }
.gfc-ar{ stroke:none; opacity:.10; }
.gfc-ldr{ stroke-width:1; opacity:.5; fill:none; }
.gfc-dot{ stroke:var(--gfc-panel); stroke-width:2; }

/* ---------- bars ---------- */
.gfc-bar{ stroke:none; }
.gfc-bar.is-hot{ filter:brightness(1.2); }
.gfc-hit{ fill:transparent; }

/* ---------- crosshair ---------- */
.gfc-cross{ stroke:var(--gfc-bone2); stroke-opacity:.55; stroke-width:1; pointer-events:none; }
.gfc-fdot{ stroke:var(--gfc-panel); stroke-width:2; pointer-events:none; }

/* ---------- stat ---------- */
.gfc-stat{ display:flex; flex-direction:column; gap:6px; padding:2px 0 4px; }
.gfc-stat-v{ font-family:var(--gfc-mono); font-variant-numeric:tabular-nums;
  font-size:var(--gfc-statfs,42px); line-height:.98; font-weight:600;
  letter-spacing:-.02em; color:var(--gfc-bone); display:flex; align-items:baseline; gap:.24em; }
.gfc-stat-v.is-up{ color:var(--gfc-up); }
.gfc-stat-v.is-dn{ color:var(--gfc-down); }
.gfc-stat-v i{ font-style:normal; font-size:.46em; line-height:1; transform:translateY(-.12em); }
.gfc-stat-l{ font-family:var(--gfc-disp); font-size:calc(var(--gfc-fstitle) * 1.05);
  font-weight:600; color:var(--gfc-bone); line-height:1.1; }
.gfc-stat-s{ font-family:var(--gfc-mono); font-size:var(--gfc-fsnote); letter-spacing:.09em;
  text-transform:uppercase; color:var(--gfc-muted); line-height:1.4; }
.gfc--hero .gfc-stat{ gap:10px; }
.gfc-spark{ margin-top:6px; }
.gfc-spark .gfc-ln{ stroke:var(--gfc-accent); }

/* ---------- tooltip ---------- */
.gfc-tip{ position:absolute; z-index:6; left:0; top:0; min-width:96px; max-width:min(76%,300px);
  padding:8px 10px; border-radius:8px; pointer-events:none;
  background:color-mix(in srgb, var(--gfc-panel) 88%, #000 12%);
  box-shadow: inset 0 0 0 1px var(--gfc-line), 0 14px 30px -16px rgba(0,0,0,.9);
  font-family:var(--gfc-mono); font-size:calc(var(--gfc-fs) * .98);
  transition:opacity .12s ease; }
.gfc-tip[hidden]{ display:none; }
.gfc-tip-h{ color:var(--gfc-bone2); letter-spacing:.09em; text-transform:uppercase;
  font-size:.88em; margin-bottom:5px; display:flex; align-items:center; gap:6px; white-space:nowrap; }
.gfc-tip-h i{ display:block; width:8px; height:8px; border-radius:50%; background:currentColor; flex:none; }
.gfc-tip-r{ display:flex; align-items:center; gap:8px; line-height:1.55; white-space:nowrap; }
.gfc-tip-k{ display:block; width:12px; height:2.5px; border-radius:2px; flex:none; }
.gfc-tip-k:empty[data-no]{ display:none; }
.gfc-tip-n{ color:var(--gfc-muted); flex:1 1 auto; }
.gfc-tip-v{ color:var(--gfc-bone); font-weight:600; font-variant-numeric:tabular-nums;
  margin-left:auto; }

/* ---------- table view (accessibility twin) ---------- */
.gfc-sr{ position:absolute!important; width:1px; height:1px; margin:-1px; padding:0;
  overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap; border:0; }
.gfc-tbl{ margin-top:10px; font-family:var(--gfc-mono); font-size:var(--gfc-fs); color:var(--gfc-bone2); }
.gfc-tbl summary{ cursor:pointer; color:var(--gfc-muted); letter-spacing:.09em; text-transform:uppercase; ;padding:10px 0;min-height:44px;display:flex;align-items:center}
.gfc-tbl table{ border-collapse:collapse; margin-top:8px; width:100%;
  font-variant-numeric:tabular-nums; }
.gfc-tbl th,.gfc-tbl td{ text-align:right; padding:3px 8px; border-top:1px solid var(--gfc-line); }
.gfc-tbl th:first-child,.gfc-tbl td:first-child{ text-align:left; }
.gfc-tbl caption{ text-align:left; color:var(--gfc-muted); padding-bottom:4px; }

/* ---------- reveal: the deck adds .is-in ---------- */
.gfc-cd{ opacity:0; transform:translateY(9px);
  transition:opacity .42s ease, transform .42s cubic-bezier(.2,.72,.3,1);
  transition-delay:calc(var(--i,0) * var(--gfc-stagger)); }
.gfc.is-in .gfc-cd{ opacity:1; transform:none; }

.gfc-ln{ stroke-dasharray:var(--len,2000); stroke-dashoffset:var(--len,2000);
  transition:stroke-dashoffset .95s cubic-bezier(.35,.05,.2,1);
  transition-delay:calc(var(--i,0) * 110ms); }
.gfc.is-in .gfc-ln{ stroke-dashoffset:0; }

.gfc-ar,.gfc-fade{ opacity:0; transition:opacity .5s ease .45s; }
.gfc.is-in .gfc-ar{ opacity:.10; }
.gfc.is-in .gfc-fade{ opacity:1; }

.gfc-bar{ transform-box:fill-box; transition:transform .62s cubic-bezier(.2,.72,.3,1);
  transition-delay:calc(var(--i,0) * calc(var(--gfc-stagger) * 2)); }
.gfc-bar--pos{ transform-origin:left center; transform:scaleX(0); }
.gfc-bar--neg{ transform-origin:right center; transform:scaleX(0); }
.gfc-bar--up{ transform-origin:center bottom; transform:scaleY(0); }
.gfc-bar--dn{ transform-origin:center top; transform:scaleY(0); }
.gfc.is-in .gfc-bar{ transform:none; }

.gfc-stat{ opacity:0; transform:translateY(10px);
  transition:opacity .5s ease, transform .5s cubic-bezier(.2,.72,.3,1); }
.gfc.is-in .gfc-stat{ opacity:1; transform:none; }

/* squeezed into a narrow slot, the HTML chrome shrinks with the SVG so the
   type keeps its proportions instead of towering over a shrunken plot */
@supports (font-size:1cqw){
  .gfc-ttl{ font-size:min(var(--gfc-fstitle), var(--gfc-qt, 999px)); }
  .gfc-note,.gfc-stat-s{ font-size:min(var(--gfc-fsnote), var(--gfc-qn, 999px)); }
  .gfc-lg li,.gfc-tip,.gfc-tbl{ font-size:min(var(--gfc-fs), var(--gfc-qu, 999px)); }
  .gfc-stat-v{ font-size:min(var(--gfc-statfs), var(--gfc-qs, 999px)); }
  .gfc-stat-l{ font-size:calc(min(var(--gfc-fstitle), var(--gfc-qt, 999px)) * 1.05); }
}

@media (prefers-reduced-motion: reduce){
  .gfc *{ transition:none!important; animation:none!important; }
  .gfc .gfc-cd,.gfc .gfc-fade,.gfc .gfc-stat{ opacity:1; transform:none; }
  .gfc .gfc-ar{ opacity:.10; }
  .gfc .gfc-ln{ stroke-dashoffset:0; }
  .gfc .gfc-bar{ transform:none; }
}
`;

(function () {
  'use strict';

  /* ------------------------------------------------------------------ utils */
  var isNum = function (v) { return typeof v === 'number' && isFinite(v); };
  var toNum = function (v) {
    if (typeof v === 'number') return isFinite(v) ? v : NaN;
    if (typeof v === 'string' && v.trim() !== '') { var n = parseFloat(v); return isFinite(n) ? n : NaN; }
    return NaN;
  };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); };
  var r2 = function (n) { return Math.round(n * 100) / 100; };
  var SEQ = 0;
  var uid = function () { SEQ += 1; return 'gfc' + SEQ + '_' + Math.random().toString(36).slice(2, 6); };

  var CHAR_W = 0.6;                                   // JetBrains Mono advance
  var tw = function (s, fs) { return String(s == null ? '' : s).length * fs * CHAR_W; };
  var trunc = function (s, fs, maxW) {
    s = String(s == null ? '' : s);
    var max = Math.floor(maxW / (fs * CHAR_W) + 1e-6);
    if (max < 1) return '';
    return s.length <= max ? s : s.slice(0, Math.max(1, max - 1)) + '…';
  };

  var group = function (i) { return i.replace(/\B(?=(\d{3})+$)/g, ','); };
  var fmtNum = function (v, dp) {
    if (!isNum(v)) return '–';
    var neg = v < 0, p = Math.abs(v).toFixed(dp).split('.');
    return (neg ? '-' : '') + group(p[0]) + (p[1] ? '.' + p[1] : '');
  };
  /* big numbers go compact (12.3K / 1.28M) so a mixed-magnitude set doesn't
     print 1,284,000.000 next to 0.004 */
  var UNITS = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  var compact = function (a) {
    for (var i = 0; i < UNITS.length; i++) {
      if (a >= UNITS[i][0]) {
        var q = a / UNITS[i][0];
        return q.toFixed(q >= 100 ? 0 : q >= 10 ? 1 : 2) + UNITS[i][1];
      }
    }
    return null;
  };
  var PREFIX = { '$': 1, '€': 1, '£': 1, '¥': 1 };
  var fmtVal = function (v, unit, dp, signed) {
    if (!isNum(v)) return '–';
    var sign = v < 0 ? '−' : (signed ? '+' : '');
    var big = Math.abs(v) >= 1e4 ? compact(Math.abs(v)) : null;
    var body = big || fmtNum(Math.abs(v), dp);
    if (unit && PREFIX[unit]) return sign + unit + body;
    if (unit === '%') return sign + body + '%';
    if (unit) return sign + body + ' ' + unit;
    return sign + body;
  };
  var dpForRange = function (range) {
    var r = Math.abs(range);
    if (!isFinite(r) || r === 0) return 2;
    if (r >= 500) return 0;
    if (r >= 20) return 1;
    if (r >= 0.2) return 2;
    return 3;
  };
  /* the fewest decimals that still print every value exactly — so one-decimal
     data reads as -1.9, not -1.90 */
  var dpForValues = function (vals, fallbackRange) {
    for (var d = 0; d <= 3; d++) {
      var ok = true;
      for (var i = 0; i < vals.length; i++) {
        if (Math.abs(parseFloat(vals[i].toFixed(d)) - vals[i]) > 1e-9) { ok = false; break; }
      }
      if (ok) return d;
    }
    return dpForRange(fallbackRange);
  };
  var dpForStep = function (step) {
    if (!isFinite(step) || step <= 0) return 2;
    for (var d = 0; d <= 4; d++) {
      if (Math.abs(parseFloat(step.toFixed(d)) - step) <= Math.abs(step) * 1e-9) return d;
    }
    return 4;
  };

  function niceScale(min, max, count) {
    if (!isFinite(min) || !isFinite(max)) { min = 0; max = 1; }
    if (min > max) { var t = min; min = max; max = t; }
    if (min === max) { var pad = Math.abs(min) * 0.08 || 1; min -= pad; max += pad; }
    var raw = (max - min) / Math.max(1, count);
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / mag;
    var step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    var ticks = [], v = lo, guard = 0;
    while (v <= hi + step * 1e-9 && guard++ < 200) { ticks.push(Number(v.toFixed(10))); v += step; }
    return { lo: lo, hi: hi, step: step, ticks: ticks };
  }

  function placer() {
    var boxes = [];
    return {
      fits: function (b) {
        for (var i = 0; i < boxes.length; i++) {
          var o = boxes[i];
          if (!(b.x1 <= o.x0 || b.x0 >= o.x1 || b.y1 <= o.y0 || b.y0 >= o.y1)) return false;
        }
        return true;
      },
      add: function (b) { boxes.push(b); }
    };
  }

  function xLabelIdx(labels, plotW, fs) {
    var n = labels.length;
    if (n <= 1) return n ? [0] : [];
    var w = 0;
    for (var i = 0; i < n; i++) w = Math.max(w, tw(labels[i], fs));
    var slot = w + 16;
    var k = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / slot))));
    var out = [];
    for (var j = 0; j < n; j += k) out.push(j);
    if (out[out.length - 1] !== n - 1) {
      if (n - 1 - out[out.length - 1] < k * 0.6) out.pop();
      out.push(n - 1);
    }
    return out;
  }

  /* --------------------------------------------------------------- geometry */
  function barPathH(x, y, w, h, r, roundRight) {
    w = Math.max(w, 0.75);
    r = Math.min(r, h / 2, w);
    if (r <= 0.5) return 'M' + r2(x) + ',' + r2(y) + 'h' + r2(w) + 'v' + r2(h) + 'h' + r2(-w) + 'z';
    return roundRight
      ? 'M' + r2(x) + ',' + r2(y) + 'h' + r2(w - r) + 'a' + r2(r) + ',' + r2(r) + ' 0 0 1 ' + r2(r) + ',' + r2(r) +
        'v' + r2(h - 2 * r) + 'a' + r2(r) + ',' + r2(r) + ' 0 0 1 ' + r2(-r) + ',' + r2(r) + 'h' + r2(-(w - r)) + 'z'
      : 'M' + r2(x + r) + ',' + r2(y) + 'h' + r2(w - r) + 'v' + r2(h) + 'h' + r2(-(w - r)) +
        'a' + r2(r) + ',' + r2(r) + ' 0 0 1 ' + r2(-r) + ',' + r2(-r) + 'v' + r2(-(h - 2 * r)) +
        'a' + r2(r) + ',' + r2(r) + ' 0 0 1 ' + r2(r) + ',' + r2(-r) + 'z';
  }
  function barPathV(x, y, w, h, r, roundTop) {
    h = Math.max(h, 0.75);
    r = Math.min(r, w / 2, h);
    if (r <= 0.5) return 'M' + r2(x) + ',' + r2(y) + 'h' + r2(w) + 'v' + r2(h) + 'h' + r2(-w) + 'z';
    return roundTop
      ? 'M' + r2(x) + ',' + r2(y + h) + 'v' + r2(-(h - r)) + 'a' + r2(r) + ',' + r2(r) + ' 0 0 1 ' + r2(r) + ',' + r2(-r) +
        'h' + r2(w - 2 * r) + 'a' + r2(r) + ',' + r2(r) + ' 0 0 1 ' + r2(r) + ',' + r2(r) + 'v' + r2(h - r) + 'z'
      : 'M' + r2(x) + ',' + r2(y) + 'h' + r2(w) + 'v' + r2(h - r) + 'a' + r2(r) + ',' + r2(r) + ' 0 0 1 ' + r2(-r) + ',' + r2(r) +
        'h' + r2(-(w - 2 * r)) + 'a' + r2(r) + ',' + r2(r) + ' 0 0 1 ' + r2(-r) + ',' + r2(-r) + 'z';
  }

  /* ---------------------------------------------------------------- presets */
  var PRESET = {
    column: {
      w: 560, h: 250, wMin: 340, wMax: 780, hMin: 190, hMax: 300, padX: 30,
      fs: 10.5, fsTtl: 15, fsNote: 10, grid: 3, maxBody: 14, maxBar: 18,
      wick: 1, lw: 2, dot: 4, padT: 12, stagger: 20, statfs: 42
    },
    hero: {
      w: 1040, h: 470, wMin: 460, wMax: 1100, hMin: 280, hMax: 520, padX: 44,
      fs: 13, fsTtl: 22, fsNote: 11.5, grid: 5, maxBody: 24, maxBar: 24,
      wick: 1.4, lw: 2.4, dot: 5, padT: 16, stagger: 26, statfs: 86
    }
  };
  /* hard floors used only by the auto-fit path (`_fit`), which derives a size
     from the slot the chart actually got rather than from the author's opts */
  var FIT_MIN_W = 220, FIT_MIN_H = 120;

  function normOpts(opts) {
    var o = opts || {};
    var size = o.size === 'hero' ? 'hero' : 'column';
    var P = {}, base = PRESET[size], k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) P[k] = base[k];
    P.size = size;
    P.fit = o._fit === true;
    /* `width` is the width of the whole card; the drawing area (the viewBox)
       is that minus the card's own padding, so the SVG renders 1:1 and the
       axis type keeps its designed pixel size */
    var wantW = toNum(o.width);
    var wLo = P.fit ? FIT_MIN_W : base.wMin, hLo = P.fit ? FIT_MIN_H : base.hMin;
    P.w = isNum(wantW) ? clamp(Math.round(wantW - base.padX), wLo, base.wMax)
                       : base.w;
    P.h = clamp(Math.round(toNum(o.height) || base.h), hLo, base.hMax);
    P.fw = P.w + base.padX;
    P.padB = Math.round(P.fs + (size === 'hero' ? 20 : 15));
    P.mode = o.mode === 'light' ? 'light' : null;
    P.reveal = o.reveal === 'manual' ? 'manual' : 'auto';
    P.table = o.table === true;
    return P;
  }

  /* ------------------------------------------------------------------ frame */
  function tableHTML(P, caption, cols, rows) {
    var head = '<tr>';
    for (var i = 0; i < cols.length; i++) head += '<th scope="col">' + esc(cols[i]) + '</th>';
    head += '</tr>';
    var body = '';
    for (var r = 0; r < rows.length; r++) {
      body += '<tr>';
      for (var c = 0; c < rows[r].length; c++) {
        body += c === 0 ? '<th scope="row">' + esc(rows[r][c]) + '</th>'
                        : '<td>' + esc(rows[r][c]) + '</td>';
      }
      body += '</tr>';
    }
    var tbl = '<table><caption>' + esc(caption) + '</caption><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
    return P.table
      ? '<details class="gfc-tbl"><summary>Values</summary>' + tbl + '</details>'
      : '<div class="gfc-sr">' + tbl + '</div>';
  }

  function frame(P, o) {
    var cls = 'gfc gfc--' + o.kind + ' gfc--' + P.size + (o.extra ? ' ' + o.extra : '');
    var q = function (px) { return r2(px / P.fw * 100) + 'cqw'; };
    var style = '--gfc-w:' + P.fw + 'px;--gfc-lw:' + P.lw + ';--gfc-wk:' + P.wick +
      ';--gfc-statfs:' + P.statfs + 'px' +
      ';--gfc-qt:' + q(P.fsTtl) + ';--gfc-qn:' + q(P.fsNote) +
      ';--gfc-qu:' + q(P.fs) + ';--gfc-qs:' + q(P.statfs);
    var attrs = 'class="' + cls + '" style="' + style + '"' +
      (P.mode ? ' data-mode="light"' : '') +
      ' data-gfc-reveal="' + P.reveal + '"' +
      (P.spec ? " data-gfc-spec='" + esc(P.spec) + "'" : '') +
      (o.meta ? " data-gfc='" + esc(JSON.stringify(o.meta)) + "'" : '');
    var head = '';
    if (o.title || o.note) {
      head = '<div class="gfc-hd">' +
        (o.title ? '<h3 class="gfc-ttl">' + esc(o.title) + '</h3>' : '') +
        (o.note ? '<p class="gfc-note">' + esc(o.note) + '</p>' : '') + '</div>';
    }
    return '<figure ' + attrs + '>' + head + (o.legend || '') + (o.body || '') + (o.table || '') + '</figure>';
  }

  function svgOpen(P, id, title, desc) {
    return '<svg class="gfc-svg" viewBox="0 0 ' + P.w + ' ' + P.h + '" width="' + P.w + '" height="' + P.h +
      '" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="' + id + 't ' + id + 'd">' +
      '<title id="' + id + 't">' + esc(title) + '</title>' +
      '<desc id="' + id + 'd">' + esc(desc) + '</desc>';
  }

  function plotWrap(P, inner, interactive) {
    return '<div class="gfc-plot"' + (interactive ? ' tabindex="0" aria-label="Interactive chart. Use the left and right arrow keys to read values."' : '') + '>' +
      inner + (interactive ? '<div class="gfc-tip" role="status" aria-live="polite" hidden></div>' : '') + '</div>';
  }

  function emptyChart(P, spec, kind, why) {
    var id = uid();
    var svg = svgOpen(P, id, (spec && spec.title) || 'Chart', why) +
      '<text class="gfc-empty" x="' + (P.w / 2) + '" y="' + (P.h / 2) + '" text-anchor="middle" dominant-baseline="middle">' +
      esc(why) + '</text></svg>';
    return frame(P, {
      kind: kind || 'empty', extra: 'gfc--empty',
      title: spec && spec.title, note: spec && spec.note,
      body: plotWrap(P, svg, false)
    });
  }

  function axisY(P, x0, x1, ticks, yOf, dp, unit, showZero, avoidY) {
    var g = '', i, y, v;
    for (i = 0; i < ticks.length; i++) {
      v = ticks[i]; y = r2(yOf(v));
      g += '<line class="gfc-grid" x1="' + r2(x0) + '" y1="' + y + '" x2="' + r2(x1) + '" y2="' + y + '"/>';
      if (avoidY != null && Math.abs(y - avoidY) < P.fs + 5) continue;   /* tag owns this slot */
      g += '<text class="gfc-ax" x="' + r2(x0 - 8) + '" y="' + y + '" text-anchor="end" dominant-baseline="middle">' +
        esc(fmtVal(v, unit, dp, false)) + '</text>';
    }
    if (showZero) {
      y = r2(yOf(0));
      g += '<line class="gfc-zero" x1="' + r2(x0) + '" y1="' + y + '" x2="' + r2(x1) + '" y2="' + y + '"/>';
    }
    return g;
  }

  function axisX(P, labels, idxs, xOf, yBase) {
    var g = '', i;
    for (i = 0; i < idxs.length; i++) {
      var k = idxs[i];
      var anchor = i === 0 && k === 0 ? 'start' : (k === labels.length - 1 ? 'end' : 'middle');
      var x = xOf(k);
      if (anchor === 'start') x = Math.max(x - tw(labels[k], P.fs) / 2, 0);
      else if (anchor === 'end') x = x + tw(labels[k], P.fs) / 2;
      g += '<text class="gfc-ax" x="' + r2(x) + '" y="' + r2(yBase) + '" text-anchor="' + anchor + '">' +
        esc(labels[k]) + '</text>';
    }
    return g;
  }

  /* ----------------------------------------------------------------- CANDLE */
  function renderCandle(spec, P) {
    var raw = spec.data || spec.candles || spec.bars || [];
    if (!Array.isArray(raw)) raw = [];
    var d = [], i, row, o, h, l, c;
    for (i = 0; i < raw.length; i++) {
      row = raw[i] || {};
      o = toNum(row.o !== undefined ? row.o : row.open);
      c = toNum(row.c !== undefined ? row.c : row.close);
      h = toNum(row.h !== undefined ? row.h : row.high);
      l = toNum(row.l !== undefined ? row.l : row.low);
      if (!isNum(o) && !isNum(c)) continue;
      if (!isNum(o)) o = c;
      if (!isNum(c)) c = o;
      if (!isNum(h)) h = Math.max(o, c);
      if (!isNum(l)) l = Math.min(o, c);
      h = Math.max(h, o, c); l = Math.min(l, o, c);
      d.push({ t: row.t == null ? String(d.length + 1) : String(row.t), o: o, h: h, l: l, c: c });
    }
    if (!d.length) return emptyChart(P, spec, 'candle', 'No data');

    var unit = spec.unit || '';
    var n = d.length, lo = Infinity, hi = -Infinity, allV = [];
    for (i = 0; i < n; i++) {
      lo = Math.min(lo, d[i].l); hi = Math.max(hi, d[i].h);
      allV.push(d[i].o, d[i].h, d[i].l, d[i].c);
    }
    var sc = niceScale(lo, hi, P.grid);
    var dpAx = dpForStep(sc.step), dpVal = dpForValues(allV, hi - lo || Math.abs(hi) * 0.02);

    var tickW = 0;
    for (i = 0; i < sc.ticks.length; i++) tickW = Math.max(tickW, tw(fmtVal(sc.ticks[i], unit, dpAx, false), P.fs));
    var openTxt = fmtVal(d[0].o, unit, dpVal, false);
    var openW = tw(openTxt, P.fs) + 10;
    var padL = Math.round(Math.max(tickW, openW) + 14);
    var tagTxt = fmtVal(d[n - 1].c, unit, dpVal, false);
    var padR = Math.round(tw(tagTxt, P.fs) + 18);
    var x0 = padL, x1 = P.w - padR, y0 = P.padT, y1 = P.h - P.padB;
    var plotW = Math.max(20, x1 - x0), plotH = Math.max(20, y1 - y0);
    var yOf = function (v) { return y1 - ((v - sc.lo) / (sc.hi - sc.lo || 1)) * plotH; };

    var band = plotW / n;
    var bodyW = clamp(band - 2, 1.5, P.maxBody);          // 2px surface gap
    var minBody = P.size === 'hero' ? 2 : 1.5;

    var labels = [], iHi = 0, iLo = 0;
    for (i = 0; i < n; i++) {
      labels.push(d[i].t);
      if (d[i].h > d[iHi].h) iHi = i;
      if (d[i].l < d[iLo].l) iLo = i;
    }
    var cxOf = function (i) { return x0 + band * (i + 0.5); };

    var tagH = P.fs + 7;
    var openY = clamp(yOf(d[0].o), y0 + tagH / 2, y1 - tagH / 2);
    var g = axisY(P, x0, x1, sc.ticks, yOf, dpAx, unit, false, n > 1 ? openY : null);
    g += axisX(P, labels, xLabelIdx(labels, plotW, P.fs), cxOf, y1 + P.fs + 9);

    var items = [], marks = '';
    for (i = 0; i < n; i++) {
      var k = d[i], cx = cxOf(i), up = k.c >= k.o;
      var yo = yOf(k.o), yc = yOf(k.c);
      var by = Math.min(yo, yc), bh = Math.max(Math.abs(yc - yo), minBody);
      marks += '<g class="gfc-cd ' + (up ? 'is-up' : 'is-dn') + '" data-i="' + i + '" style="--i:' + i + '">' +
        '<line class="wk" x1="' + r2(cx) + '" y1="' + r2(yOf(k.h)) + '" x2="' + r2(cx) + '" y2="' + r2(yOf(k.l)) + '"/>' +
        '<rect class="bd" x="' + r2(cx - bodyW / 2) + '" y="' + r2(by) + '" width="' + r2(bodyW) + '" height="' + r2(bh) + '"/>' +
        '</g>';
      items.push({
        x: r2(cx), t: k.t, up: up,
        rows: [
          { n: 'Open', v: fmtVal(k.o, unit, dpVal, false) },
          { n: 'High', v: fmtVal(k.h, unit, dpVal, false) },
          { n: 'Low', v: fmtVal(k.l, unit, dpVal, false) },
          { n: 'Close', v: fmtVal(k.c, unit, dpVal, false) }
        ]
      });
    }

    /* selective labels only: the opening print (left tag), the closing print
       (right tag), and the period high and low. Never a value per candle. */
    var pl = placer(), lab = '';
    var tagY = clamp(yOf(d[n - 1].c), y0 + tagH / 2, y1 - tagH / 2);
    var tagW = tw(tagTxt, P.fs) + 10;
    pl.add({ x0: x1 + 4, y0: tagY - tagH / 2, x1: x1 + 4 + tagW, y1: tagY + tagH / 2 });
    var tag = '<g class="gfc-tag gfc-fade">' +
      '<rect x="' + r2(x1 + 5) + '" y="' + r2(tagY - tagH / 2) + '" width="' + r2(tagW) + '" height="' + r2(tagH) + '" rx="3"/>' +
      '<text x="' + r2(x1 + 5 + tagW / 2) + '" y="' + r2(tagY) + '" text-anchor="middle" dominant-baseline="middle">' +
      esc(tagTxt) + '</text></g>';
    if (n > 1) {
      tag += '<g class="gfc-tag gfc-tag--sub gfc-fade">' +
        '<rect x="' + r2(x0 - 6 - openW) + '" y="' + r2(openY - tagH / 2) + '" width="' + r2(openW) + '" height="' + r2(tagH) + '" rx="3"/>' +
        '<text x="' + r2(x0 - 6 - openW / 2) + '" y="' + r2(openY) + '" text-anchor="middle" dominant-baseline="middle">' +
        esc(openTxt) + '</text></g>';
    }

    function tryLabel(idx, val, above, strong) {
      var txt = fmtVal(val, unit, dpVal, false);
      var w = tw(txt, P.fs), cx = clamp(cxOf(idx), x0 + w / 2, x1 - w / 2);
      var y = above ? yOf(val) - 7 : yOf(val) + P.fs + 4;
      y = clamp(y, y0 + P.fs, y1 + P.fs * 0.2);
      var box = { x0: cx - w / 2 - 3, y0: y - P.fs, x1: cx + w / 2 + 3, y1: y + 3 };
      if (!pl.fits(box)) return '';
      pl.add(box);
      return '<text class="gfc-val' + (strong ? ' gfc-val--key' : '') + ' gfc-fade" x="' + r2(cx) + '" y="' + r2(y) +
        '" text-anchor="middle">' + esc(txt) + '</text>';
    }
    lab += tryLabel(iHi, d[iHi].h, true, true);
    lab += tryLabel(iLo, d[iLo].l, false, true);

    var last = d[n - 1], first = d[0];
    var dir = last.c >= first.o ? 'up' : 'down';
    var desc = 'Candlestick chart, ' + n + ' periods from ' + first.t + ' to ' + last.t +
      '. Open ' + fmtVal(first.o, unit, dpVal, false) + ', close ' + fmtVal(last.c, unit, dpVal, false) +
      ' (' + dir + ' over the period). High ' + fmtVal(d[iHi].h, unit, dpVal, false) +
      ' at ' + d[iHi].t + ', low ' + fmtVal(d[iLo].l, unit, dpVal, false) + ' at ' + d[iLo].t + '.';

    var id = uid();
    var svg = svgOpen(P, id, (spec.title || 'Candlestick chart') + (spec.note ? ' — ' + spec.note : ''), desc) +
      g + marks + lab + tag +
      '<line class="gfc-cross" x1="0" y1="' + r2(y0) + '" x2="0" y2="' + r2(y1) + '" style="display:none"/>' +
      '</svg>';

    var rows = [];
    for (i = 0; i < n; i++) {
      rows.push([d[i].t, fmtVal(d[i].o, unit, dpVal, false), fmtVal(d[i].h, unit, dpVal, false),
        fmtVal(d[i].l, unit, dpVal, false), fmtVal(d[i].c, unit, dpVal, false)]);
    }

    return frame(P, {
      kind: 'candle', title: spec.title, note: spec.note,
      body: plotWrap(P, svg, true),
      table: tableHTML(P, (spec.title || 'Candlestick chart') + ' — values', ['Period', 'Open', 'High', 'Low', 'Close'], rows),
      meta: { k: 'candle', vw: P.w, vh: P.h, x0: r2(x0), x1: r2(x1), y0: r2(y0), y1: r2(y1), items: items }
    });
  }

  /* ------------------------------------------------------------------- LINE */
  function renderLine(spec, P) {
    var src = spec.series;
    if (!Array.isArray(src) || !src.length) {
      var pts = spec.points || spec.data;
      src = Array.isArray(pts) ? [{ name: spec.title || 'Series', points: pts }] : [];
    }
    var series = [], si, s, raw, pp, j, v;
    for (si = 0; si < src.length && series.length < 4; si++) {
      s = src[si] || {};
      raw = s.points || s.data || s.values;
      if (!Array.isArray(raw)) continue;
      pp = [];
      for (j = 0; j < raw.length; j++) {
        var p = raw[j];
        if (p == null) continue;
        if (typeof p === 'number') { pp.push({ t: String(j + 1), v: p }); continue; }
        v = toNum(p.v !== undefined ? p.v : (p.value !== undefined ? p.value : p.y));
        if (!isNum(v)) continue;
        pp.push({ t: p.t == null ? String(pp.length + 1) : String(p.t), v: v });
      }
      if (pp.length) series.push({ name: s.name == null ? 'Series ' + (series.length + 1) : String(s.name), points: pp });
    }
    if (!series.length) return emptyChart(P, spec, 'line', 'No data');

    var unit = spec.unit || '';
    var nS = series.length;
    var n = 0, lo = Infinity, hi = -Infinity, labels = [], allV = [];
    for (si = 0; si < nS; si++) {
      if (series[si].points.length > n) { n = series[si].points.length; labels = []; for (j = 0; j < n; j++) labels.push(series[si].points[j].t); }
      for (j = 0; j < series[si].points.length; j++) {
        lo = Math.min(lo, series[si].points[j].v); hi = Math.max(hi, series[si].points[j].v);
        allV.push(series[si].points[j].v);
      }
    }
    var sc = niceScale(lo, hi, P.grid);
    var dpAx = dpForStep(sc.step), dpVal = dpForValues(allV, hi - lo || Math.abs(hi) * 0.02);

    var tickW = 0;
    for (j = 0; j < sc.ticks.length; j++) tickW = Math.max(tickW, tw(fmtVal(sc.ticks[j], unit, dpAx, false), P.fs));
    var padL = Math.round(tickW + 14);

    /* end labels: name(s) for multi-series, the value for a single series */
    var endTxt = [], maxEnd = 0;
    for (si = 0; si < nS; si++) {
      var lp = series[si].points[series[si].points.length - 1];
      var t = nS === 1 ? fmtVal(lp.v, unit, dpVal, false)
        : (P.size === 'hero' ? series[si].name + '  ' + fmtVal(lp.v, unit, dpVal, false) : series[si].name);
      endTxt.push(t); maxEnd = Math.max(maxEnd, tw(t, P.fs));
    }
    var wantR = Math.round(maxEnd + 16);
    var useEnd = wantR <= P.w * 0.3;
    var padR = useEnd ? wantR : Math.round(P.dot + 8);

    var x0 = padL, x1 = P.w - padR, y0 = P.padT, y1 = P.h - P.padB;
    var plotW = Math.max(20, x1 - x0), plotH = Math.max(20, y1 - y0);
    var xOf = function (i) { return n > 1 ? x0 + (plotW * i) / (n - 1) : x0 + plotW / 2; };
    var yOf = function (v) { return y1 - ((v - sc.lo) / (sc.hi - sc.lo || 1)) * plotH; };
    var signed = sc.lo < 0 && sc.hi > 0;

    var g = axisY(P, x0, x1, sc.ticks, yOf, dpAx, unit, signed);
    g += axisX(P, labels, xLabelIdx(labels, plotW, P.fs), xOf, y1 + P.fs + 9);

    var marks = '', dots = '', ends = '', i;
    var colVar = function (si) { return 'var(--gfc-s' + (si + 1) + ')'; };

    for (si = 0; si < nS; si++) {
      var ps = series[si].points, dd = '', len = 0, px = 0, py = 0;
      for (i = 0; i < ps.length; i++) {
        var cxp = xOf(i), cyp = yOf(ps[i].v);
        if (i) len += Math.sqrt((cxp - px) * (cxp - px) + (cyp - py) * (cyp - py));
        px = cxp; py = cyp;
        dd += (i ? 'L' : 'M') + r2(cxp) + ',' + r2(cyp);
      }
      if (ps.length === 1) {
        dd = 'M' + r2(xOf(0) - 0.01) + ',' + r2(yOf(ps[0].v)) + 'L' + r2(xOf(0) + 0.01) + ',' + r2(yOf(ps[0].v));
        len = 0.02;
      }
      if (nS === 1 && ps.length > 1) {
        var base = signed ? yOf(0) : y1;
        marks += '<path class="gfc-ar" d="' + dd + 'L' + r2(xOf(ps.length - 1)) + ',' + r2(base) +
          'L' + r2(xOf(0)) + ',' + r2(base) + 'Z" fill="' + colVar(si) + '"/>';
      }
      marks += '<path class="gfc-ln" style="--i:' + si + ';--len:' + Math.ceil(len + 2) +
        '" d="' + dd + '" stroke="' + colVar(si) + '"/>';
      var le = ps.length - 1;
      dots += '<circle class="gfc-dot gfc-fade" cx="' + r2(xOf(le)) + '" cy="' + r2(yOf(ps[le].v)) + '" r="' + P.dot +
        '" fill="' + colVar(si) + '"/>';
    }

    if (useEnd) {
      var lbl = [];
      for (si = 0; si < nS; si++) {
        var lps = series[si].points;
        lbl.push({ si: si, y: yOf(lps[lps.length - 1].v), x: xOf(lps.length - 1), txt: endTxt[si] });
      }
      lbl.sort(function (a, b) { return a.y - b.y; });
      var gapMin = P.fs + 5, prev = -1e9, ok = true;
      for (i = 0; i < lbl.length; i++) { lbl[i].ly = Math.max(lbl[i].y, prev + gapMin); prev = lbl[i].ly; }
      var over = lbl[lbl.length - 1].ly - (y1 - 1);
      if (over > 0) for (i = 0; i < lbl.length; i++) lbl[i].ly -= over;
      if (lbl[0].ly < y0 + P.fs * 0.6) ok = false;
      if (ok) {
        for (i = 0; i < lbl.length; i++) {
          var L = lbl[i];
          if (Math.abs(L.ly - L.y) > 1.5) {
            ends += '<path class="gfc-ldr gfc-fade" d="M' + r2(L.x + P.dot + 1) + ',' + r2(L.y) + 'L' + r2(x1 + 7) + ',' + r2(L.ly) +
              '" stroke="' + colVar(L.si) + '"/>';
          }
          ends += '<text class="gfc-val' + (nS === 1 ? ' gfc-val--key' : '') + ' gfc-fade" x="' + r2(x1 + 10) + '" y="' + r2(L.ly) +
            '" dominant-baseline="middle">' + esc(L.txt) + '</text>';
        }
      }
    }

    var items = [], cross = '', fdots = '';
    for (i = 0; i < n; i++) {
      var rows = [];
      for (si = 0; si < nS; si++) {
        var pt = series[si].points[i];
        rows.push(pt ? { n: series[si].name, v: fmtVal(pt.v, unit, dpVal, false), c: colVar(si), y: r2(yOf(pt.v)) }
                     : { n: series[si].name, v: '–', c: colVar(si), y: null });
      }
      items.push({ x: r2(xOf(i)), t: labels[i] || String(i + 1), rows: rows });
    }
    cross = '<line class="gfc-cross" x1="0" y1="' + r2(y0) + '" x2="0" y2="' + r2(y1) + '" style="display:none"/>';
    for (si = 0; si < nS; si++) {
      fdots += '<circle class="gfc-fdot" data-s="' + si + '" r="' + P.dot + '" fill="' + colVar(si) + '" style="display:none"/>';
    }

    var legend = '';
    if (nS > 1) {
      legend = '<ul class="gfc-lg">';
      for (si = 0; si < nS; si++) {
        legend += '<li><i style="background:' + colVar(si) + '"></i>' + esc(series[si].name) + '</li>';
      }
      legend += '</ul>';
    }

    var descBits = [];
    for (si = 0; si < nS; si++) {
      var sp = series[si].points;
      descBits.push(series[si].name + ' from ' + fmtVal(sp[0].v, unit, dpVal, false) + ' to ' + fmtVal(sp[sp.length - 1].v, unit, dpVal, false));
    }
    var desc = 'Line chart, ' + nS + ' series over ' + n + ' points from ' + (labels[0] || '1') + ' to ' +
      (labels[n - 1] || String(n)) + '. ' + descBits.join('; ') + '.';

    var id = uid();
    var svg = svgOpen(P, id, (spec.title || 'Line chart') + (spec.note ? ' — ' + spec.note : ''), desc) +
      g + marks + dots + ends + cross + fdots + '</svg>';

    var cols = ['Point'], trows = [];
    for (si = 0; si < nS; si++) cols.push(series[si].name);
    for (i = 0; i < n; i++) {
      var tr = [labels[i] || String(i + 1)];
      for (si = 0; si < nS; si++) {
        var q = series[si].points[i];
        tr.push(q ? fmtVal(q.v, unit, dpVal, false) : '–');
      }
      trows.push(tr);
    }

    return frame(P, {
      kind: 'line', title: spec.title, note: spec.note, legend: legend,
      body: plotWrap(P, svg, true),
      table: tableHTML(P, (spec.title || 'Line chart') + ' — values', cols, trows),
      meta: { k: 'line', vw: P.w, vh: P.h, x0: r2(x0), x1: r2(x1), y0: r2(y0), y1: r2(y1), items: items }
    });
  }

  /* ------------------------------------------------------------------- BARS */
  function renderBars(spec, P) {
    var raw = spec.bars || spec.data || spec.points;
    if (!Array.isArray(raw)) raw = [];
    var d = [], i, row, v;
    for (i = 0; i < raw.length; i++) {
      row = raw[i];
      if (row == null) continue;
      if (typeof row === 'number') { d.push({ name: String(d.length + 1), v: row }); continue; }
      v = toNum(row.v !== undefined ? row.v : (row.value !== undefined ? row.value : row.val));
      if (!isNum(v)) continue;
      d.push({ name: row.name == null ? String(d.length + 1) : String(row.name), v: v });
    }
    if (!d.length) return emptyChart(P, spec, 'bars', 'No data');

    var unit = spec.unit || '';
    var n = d.length, lo = Infinity, hi = -Infinity, vals = [];
    for (i = 0; i < n; i++) { lo = Math.min(lo, d[i].v); hi = Math.max(hi, d[i].v); vals.push(d[i].v); }
    /* polarity as soon as anything is negative — an all-red week is still a
       direction story; an all-positive set is nominal and takes one hue */
    var polar = lo < 0;
    var signed = lo < 0 && hi > 0;              /* the axis actually straddles zero */
    var sc = niceScale(Math.min(0, lo), Math.max(0, hi), P.grid);
    var dpAx = dpForStep(sc.step);
    var dpVal = dpForValues(vals, Math.max(Math.abs(hi), Math.abs(lo)) || 1);
    var vertical = spec.dir === 'v' || spec.dir === 'vertical' || spec.orient === 'v';

    var labTxt = [], maxLab = 0;
    for (i = 0; i < n; i++) { labTxt.push(fmtVal(d[i].v, unit, dpVal, polar)); maxLab = Math.max(maxLab, tw(labTxt[i], P.fs)); }

    var colOf = function (v) { return polar ? (v >= 0 ? 'var(--gfc-up)' : 'var(--gfc-down)') : 'var(--gfc-s1)'; };
    var items = [], marks = '', g = '', y0 = P.padT, y1, x0, x1, plotW, plotH;
    var id = uid();

    if (!vertical) {
      var nameW = 0;
      for (i = 0; i < n; i++) nameW = Math.max(nameW, tw(d[i].name, P.fs));
      var gutter = Math.min(Math.round(nameW + 16), Math.round(P.w * 0.34));
      var labPad = Math.round(maxLab + 12);
      /* rows need room to breathe — a bar chart grows with its categories
         rather than squeezing them into a fixed height (see anti-patterns) */
      var needH = P.padT + (P.size === 'hero' ? P.padB : 8) + n * (P.fs + 16);
      if (needH > P.h) P.h = Math.min(Math.round(needH), 1400);
      x0 = gutter; x1 = P.w - 4;
      y1 = P.h - (P.size === 'hero' ? P.padB : 8);
      plotW = Math.max(20, x1 - x0); plotH = Math.max(20, y1 - y0);
      /* the value label rides just past the bar tip, so reserve room on
         whichever side(s) actually carry bars — an all-negative set needs it
         on the left, an all-positive set on the right */
      var vx0 = x0 + (lo < 0 ? labPad : 0), vx1 = x1 - (hi > 0 ? labPad : 0);
      if (vx1 - vx0 < 40) { vx0 = x0 + 2; vx1 = x1 - 2; }
      var xOf = function (v) { return vx0 + ((v - sc.lo) / (sc.hi - sc.lo || 1)) * Math.max(10, vx1 - vx0); };
      var zeroX = xOf(0);
      var rowH = plotH / n, th = clamp(rowH - 10, 5, P.maxBar);

      if (P.size === 'hero') {
        var tTxt = [];
        for (i = 0; i < sc.ticks.length; i++) tTxt.push(fmtVal(sc.ticks[i], unit, dpAx, false));
        var tShow = {}, tIdx = xLabelIdx(tTxt, Math.max(20, vx1 - vx0), P.fs);
        for (i = 0; i < tIdx.length; i++) tShow[tIdx[i]] = 1;
        for (i = 0; i < sc.ticks.length; i++) {
          var gx = r2(xOf(sc.ticks[i]));
          g += '<line class="gfc-grid" x1="' + gx + '" y1="' + r2(y0) + '" x2="' + gx + '" y2="' + r2(y1) + '"/>';
          if (tShow[i]) {
            g += '<text class="gfc-ax" x="' + gx + '" y="' + r2(y1 + P.fs + 8) + '" text-anchor="middle">' +
              esc(tTxt[i]) + '</text>';
          }
        }
      }
      g += '<line class="gfc-zero" x1="' + r2(zeroX) + '" y1="' + r2(y0) + '" x2="' + r2(zeroX) + '" y2="' + r2(y1) + '"/>';

      for (i = 0; i < n; i++) {
        var cy = y0 + rowH * (i + 0.5), by = cy - th / 2;
        var pos = d[i].v >= 0, vx = xOf(d[i].v);
        var bx = pos ? zeroX : vx, bw = Math.abs(vx - zeroX);
        marks += '<path class="gfc-bar ' + (pos ? 'gfc-bar--pos' : 'gfc-bar--neg') + '" data-i="' + i + '" style="--i:' + i +
          '" d="' + barPathH(bx, by, bw, th, 4, pos) + '" fill="' + colOf(d[i].v) + '"/>';
        marks += '<text class="gfc-ax gfc-fade" x="' + r2(x0 - 10) + '" y="' + r2(cy) + '" text-anchor="end" dominant-baseline="middle">' +
          esc(trunc(d[i].name, P.fs, gutter - 12)) + '</text>';
        var lx = pos ? vx + 7 : vx - 7;
        marks += '<text class="gfc-val gfc-val--key gfc-fade" x="' + r2(lx) + '" y="' + r2(cy) + '" text-anchor="' + (pos ? 'start' : 'end') +
          '" dominant-baseline="middle">' + esc(labTxt[i]) + '</text>';
        items.push({ name: d[i].name, t: d[i].name, x: r2(pos ? vx : vx), rows: [{ n: '', v: labTxt[i], c: colOf(d[i].v) }],
          hx: r2(x0), hy: r2(y0 + rowH * i), hw: r2(plotW), hh: r2(rowH) });
      }
    } else {
      var maxNameW = 0;
      for (i = 0; i < n; i++) maxNameW = Math.max(maxNameW, tw(d[i].name, P.fs));
      var tickW2 = 0;
      for (i = 0; i < sc.ticks.length; i++) tickW2 = Math.max(tickW2, tw(fmtVal(sc.ticks[i], unit, dpAx, false), P.fs));
      x0 = Math.round(tickW2 + 14); x1 = P.w - 6;
      /* cap labels sit above a positive column and below a negative one, so
         reserve the band only on the side that has columns */
      var nameY = P.h - 5;
      y0 = P.padT + (hi > 0 ? P.fs + 5 : 0);
      y1 = nameY - P.fs - 8 - (lo < 0 ? P.fs + 5 : 0);
      plotW = Math.max(20, x1 - x0); plotH = Math.max(20, y1 - y0);
      var yOfV = function (v) { return y1 - ((v - sc.lo) / (sc.hi - sc.lo || 1)) * plotH; };
      var zeroY = yOfV(0);
      var bandW = plotW / n, cw = clamp(bandW - 10, 5, P.maxBar);

      g += axisY(P, x0, x1, sc.ticks, yOfV, dpAx, unit, false);
      g += '<line class="gfc-zero" x1="' + r2(x0) + '" y1="' + r2(zeroY) + '" x2="' + r2(x1) + '" y2="' + r2(zeroY) + '"/>';

      for (i = 0; i < n; i++) {
        var cx2 = x0 + bandW * (i + 0.5), pos2 = d[i].v >= 0, vy = yOfV(d[i].v);
        var byy = pos2 ? vy : zeroY, bhh = Math.abs(vy - zeroY);
        marks += '<path class="gfc-bar ' + (pos2 ? 'gfc-bar--up' : 'gfc-bar--dn') + '" data-i="' + i + '" style="--i:' + i +
          '" d="' + barPathV(cx2 - cw / 2, byy, cw, bhh, 4, pos2) + '" fill="' + colOf(d[i].v) + '"/>';
        marks += '<text class="gfc-val gfc-val--key gfc-fade" x="' + r2(cx2) + '" y="' + r2(pos2 ? vy - 6 : vy + P.fs + 3) +
          '" text-anchor="middle">' + esc(labTxt[i]) + '</text>';
        marks += '<text class="gfc-ax gfc-fade" x="' + r2(cx2) + '" y="' + r2(nameY) + '" text-anchor="middle">' +
          esc(trunc(d[i].name, P.fs, bandW - 4)) + '</text>';
        items.push({ name: d[i].name, t: d[i].name, x: r2(cx2), rows: [{ n: '', v: labTxt[i], c: colOf(d[i].v) }],
          hx: r2(x0 + bandW * i), hy: r2(y0), hw: r2(bandW), hh: r2(plotH) });
      }
    }

    var descBits = [];
    for (i = 0; i < Math.min(n, 8); i++) descBits.push(d[i].name + ' ' + labTxt[i]);
    var desc = (signed ? 'Diverging bar chart around zero, ' : 'Bar chart, ') + n + ' categories. ' + descBits.join('; ') + '.';

    var svg = svgOpen(P, id, (spec.title || 'Bar chart') + (spec.note ? ' — ' + spec.note : ''), desc) +
      g + marks + '</svg>';

    var trows = [];
    for (i = 0; i < n; i++) trows.push([d[i].name, labTxt[i]]);

    return frame(P, {
      kind: 'bars', title: spec.title, note: spec.note,
      body: plotWrap(P, svg, true),
      table: tableHTML(P, (spec.title || 'Bar chart') + ' — values', ['Name', 'Value'], trows),
      meta: { k: 'bars', vw: P.w, vh: P.h, x0: r2(x0), x1: r2(x1), y0: r2(y0), y1: r2(y1), items: items }
    });
  }

  /* ------------------------------------------------------------------- STAT */
  function renderStat(spec, P) {
    var st = spec.stat || spec;
    var value = st.value == null ? '' : String(st.value);
    var label = st.label == null ? '' : String(st.label);
    var sub = st.sub == null ? '' : String(st.sub);
    if (!value && !label) return emptyChart(P, spec, 'stat', 'No value');

    var lead = value.charAt(0);
    var dirCls = lead === '+' ? ' is-up' : (lead === '-' || lead === '−' ? ' is-dn' : '');
    var arrow = dirCls === ' is-up' ? '▲' : (dirCls === ' is-dn' ? '▼' : '');
    var srDir = dirCls === ' is-up' ? 'up ' : (dirCls === ' is-dn' ? 'down ' : '');

    var spark = '';
    var sp = st.spark;
    if (Array.isArray(sp)) {
      var vals = [], i;
      for (i = 0; i < sp.length; i++) { var q = toNum(sp[i]); if (isNum(q)) vals.push(q); }
      if (vals.length > 1) {
        var sw = Math.min(P.w - 30, P.size === 'hero' ? 280 : 180), sh = P.size === 'hero' ? 46 : 30;
        var slo = Math.min.apply(null, vals), shi = Math.max.apply(null, vals);
        var rng = (shi - slo) || 1, dd = '', slen = 0, spx = 0, spy = 0;
        for (i = 0; i < vals.length; i++) {
          var qx = (sw - 4) * i / (vals.length - 1) + 2, qy = sh - 3 - ((vals[i] - slo) / rng) * (sh - 6);
          if (i) slen += Math.sqrt((qx - spx) * (qx - spx) + (qy - spy) * (qy - spy));
          spx = qx; spy = qy;
          dd += (i ? 'L' : 'M') + r2(qx) + ',' + r2(qy);
        }
        var sid = uid();
        spark = '<svg class="gfc-spark gfc-svg" viewBox="0 0 ' + sw + ' ' + sh + '" width="' + sw + '" height="' + sh +
          '" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="' + sid + 't ' + sid + 'd" style="max-width:' + sw + 'px">' +
          '<title id="' + sid + 't">' + esc(label || 'Trend') + ' trend</title>' +
          '<desc id="' + sid + 'd">Sparkline of ' + vals.length + ' points, from ' + fmtNum(vals[0], 2) + ' to ' + fmtNum(vals[vals.length - 1], 2) + '.</desc>' +
          '<path class="gfc-ln" style="--len:' + Math.ceil(slen + 2) + '" d="' + dd + '"/></svg>';
      }
    }

    var body = '<div class="gfc-stat">' +
      (value ? '<div class="gfc-stat-v' + dirCls + '">' +
        (arrow ? '<i aria-hidden="true">' + arrow + '</i>' : '') +
        '<span class="gfc-sr">' + esc(srDir) + '</span>' + esc(value) + '</div>' : '') +
      (label ? '<div class="gfc-stat-l">' + esc(label) + '</div>' : '') +
      (sub ? '<div class="gfc-stat-s">' + esc(sub) + '</div>' : '') +
      spark + '</div>';

    return frame(P, { kind: 'stat', title: spec.title, note: spec.note, body: body });
  }

  /* ------------------------------------------------------------- public API */
  chartSVG = function chartSVG(spec, opts) {
    var P = normOpts(opts);
    /* kept on the card so chartAttach can re-draw it at the width of the slot
       it actually landed in (see `fit`) — the type then renders 1:1 */
    try {
      P.spec = JSON.stringify({ s: spec, o: opts || null, r: P.h / P.w });
    } catch (e) { P.spec = null; }
    try {
      if (!spec || typeof spec !== 'object') return emptyChart(P, {}, 'empty', 'No chart spec');
      switch (spec.kind) {
        case 'candle': return renderCandle(spec, P);
        case 'line': return renderLine(spec, P);
        case 'bars': case 'bar': return renderBars(spec, P);
        case 'stat': return renderStat(spec, P);
        default: return emptyChart(P, spec, 'empty', 'Unknown chart kind');
      }
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) console.warn('chartSVG:', err);
      return emptyChart(P, spec || {}, 'empty', 'Chart unavailable');
    }
  };

  chartAttach = function chartAttach(rootEl) {
    if (typeof document === 'undefined') return 0;
    var root = rootEl || document;
    if (!root || typeof root.querySelectorAll !== 'function') return 0;
    var figs = [];
    if (root.classList && root.classList.contains('gfc')) figs.push(root);
    var found = root.querySelectorAll('.gfc'), i;
    for (i = 0; i < found.length; i++) figs.push(found[i]);
    var wired = 0;
    for (i = 0; i < figs.length; i++) if (wire(figs[i])) wired++;
    return wired;
  };

  /* ---- auto-fit: redraw the card at the width of the slot it landed in, so
     the SVG renders 1:1 and the axis type keeps its designed size. The card
     element itself is kept (only its innards are swapped) so any reference the
     host is holding — and any class it added, `is-in` included — survives. */
  function fitWidth(fig) {
    var specRaw = fig.getAttribute('data-gfc-spec');
    if (!specRaw) return false;
    var box = fig.getBoundingClientRect();
    if (!box.width) return false;
    var target = Math.round(box.width);
    if (fig.__gfcFitW != null && Math.abs(target - fig.__gfcFitW) < 10) return false;
    var blob;
    try { blob = JSON.parse(specRaw); } catch (e) { return false; }
    if (!blob || !blob.s) return false;

    var o = {}, k;
    for (k in (blob.o || {})) if (Object.prototype.hasOwnProperty.call(blob.o, k)) o[k] = blob.o[k];
    var pad = PRESET[o.size === 'hero' ? 'hero' : 'column'].padX;
    o.width = target;
    o.height = Math.round(Math.max(20, target - pad) * (blob.r || 0.45));   /* hold the aspect */
    o._fit = true;
    var html = chartSVG(blob.s, o);
    var tpl = document.createElement('div');
    tpl.innerHTML = html;
    var nf = tpl.firstElementChild;
    if (!nf) return false;
    fig.__gfcFitW = target;
    fig.setAttribute('style', nf.getAttribute('style') || '');
    if (nf.hasAttribute('data-gfc')) fig.setAttribute('data-gfc', nf.getAttribute('data-gfc'));
    else fig.removeAttribute('data-gfc');
    fig.innerHTML = nf.innerHTML;
    return true;
  }

  /* One painted frame in the pre-state first, so the transition actually runs
     (a just-swapped card has no before-change style). rAF is the right hook —
     but it never fires in a tab that isn't compositing, so a timer backs it up:
     whichever lands first wins, and adding the class twice is harmless. */
  function reveal(fig) {
    var go = function () { fig.classList.add('is-in'); };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function () { requestAnimationFrame(go); });
    }
    setTimeout(go, 80);
  }

  function onScreen(el) {
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    var vw = window.innerWidth || document.documentElement.clientWidth || 0;
    return r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
  }

  function wire(fig) {
    if (!fig || fig.__gfcWired) return false;
    fig.__gfcWired = true;

    fitWidth(fig);
    if (typeof ResizeObserver === 'function') {
      var pend = false;
      var ro = new ResizeObserver(function () {
        if (pend) return;
        pend = true;
        setTimeout(function () {
          pend = false;
          if (fitWidth(fig)) hover(fig);
        }, 0);
      });
      ro.observe(fig);
    }

    /* reveal — the deck adds `is-in` on its own click; this is the safety net
       so a chart is never left sitting in its pre-animation (invisible) state */
    if (fig.getAttribute('data-gfc-reveal') !== 'manual' && !fig.classList.contains('is-in')) {
      if (typeof IntersectionObserver === 'function') {
        var io = new IntersectionObserver(function (entries) {
          for (var k = 0; k < entries.length; k++) {
            if (!entries[k].isIntersecting) continue;
            io.unobserve(entries[k].target);
            reveal(entries[k].target);
          }
        }, { threshold: 0.12 });
        io.observe(fig);
      }
      /* IntersectionObserver is delivered on the rendering steps, which a tab
         that isn't compositing never runs. Poll as a backstop so the card can
         never be stranded invisible; it stops as soon as it is revealed. */
      var tries = 0;
      var poll = function () {
        if (fig.classList.contains('is-in') || !fig.isConnected) return;
        if (onScreen(fig)) { reveal(fig); return; }
        if (++tries < 24) setTimeout(poll, 500);
      };
      setTimeout(poll, 120);
    }

    hover(fig);
    return true;
  }

  function hover(fig) {
    var metaRaw = fig.getAttribute('data-gfc');
    if (!metaRaw) return true;
    var meta;
    try { meta = JSON.parse(metaRaw); } catch (e) { return true; }
    if (!meta || !meta.items || !meta.items.length) return true;

    var plot = fig.querySelector('.gfc-plot');
    var svg = fig.querySelector('.gfc-svg');
    var tip = fig.querySelector('.gfc-tip');
    if (!plot || !svg || !tip) return true;

    var cross = svg.querySelector('.gfc-cross');
    var fdots = svg.querySelectorAll('.gfc-fdot');
    var hots = svg.querySelectorAll('.gfc-cd, .gfc-bar');
    var cur = -1;

    function scale() {
      var r = svg.getBoundingClientRect();
      return { r: r, sx: r.width / (meta.vw || 1), sy: r.height / (meta.vh || 1) };
    }

    function nearest(ux, uy) {
      var i, best = -1, bd = Infinity, it;
      if (meta.k === 'bars') {
        for (i = 0; i < meta.items.length; i++) {
          it = meta.items[i];
          if (ux >= it.hx && ux <= it.hx + it.hw && uy >= it.hy && uy <= it.hy + it.hh) return i;
        }
        return -1;
      }
      for (i = 0; i < meta.items.length; i++) {
        var dx = Math.abs(meta.items[i].x - ux);
        if (dx < bd) { bd = dx; best = i; }
      }
      return best;
    }

    function paintTip(it) {
      while (tip.firstChild) tip.removeChild(tip.firstChild);
      var h = document.createElement('div');
      h.className = 'gfc-tip-h';
      if (meta.k === 'candle') {
        var dot = document.createElement('i');
        dot.style.color = it.up ? 'var(--gfc-up)' : 'var(--gfc-down)';
        h.appendChild(dot);
      }
      h.appendChild(document.createTextNode(String(it.t == null ? '' : it.t)));
      tip.appendChild(h);
      var rows = it.rows || [], j;
      for (j = 0; j < rows.length; j++) {
        var row = document.createElement('div');
        row.className = 'gfc-tip-r';
        if (rows[j].c) {
          var key = document.createElement('span');
          key.className = 'gfc-tip-k';
          key.style.background = rows[j].c;
          row.appendChild(key);
        }
        if (rows[j].n) {
          var nm = document.createElement('span');
          nm.className = 'gfc-tip-n';
          nm.textContent = String(rows[j].n);
          row.appendChild(nm);
        }
        var vv = document.createElement('span');
        vv.className = 'gfc-tip-v';
        vv.textContent = String(rows[j].v == null ? '' : rows[j].v);
        row.appendChild(vv);
        tip.appendChild(row);
      }
    }

    function show(i, clientY) {
      var it = meta.items[i];
      if (!it) return hide();
      cur = i;
      var s = scale();
      var pr = plot.getBoundingClientRect();

      if (cross && meta.k !== 'bars') {
        cross.setAttribute('x1', it.x); cross.setAttribute('x2', it.x);
        cross.style.display = '';
      }
      for (var f = 0; f < fdots.length; f++) {
        var rw = it.rows && it.rows[f];
        if (rw && rw.y != null) {
          fdots[f].setAttribute('cx', it.x); fdots[f].setAttribute('cy', rw.y);
          fdots[f].style.display = '';
        } else fdots[f].style.display = 'none';
      }
      for (var m = 0; m < hots.length; m++) {
        var di = hots[m].getAttribute('data-i');
        if (di !== null) hots[m].classList.toggle('is-hot', Number(di) === i);
      }

      paintTip(it);
      tip.hidden = false;
      var tW = tip.offsetWidth, tH = tip.offsetHeight;
      var px = (s.r.left - pr.left) + it.x * s.sx;
      var left = px + 14;
      if (left + tW > pr.width - 4) left = px - 14 - tW;
      tip.style.left = Math.round(clamp(left, 4, Math.max(4, pr.width - tW - 4))) + 'px';
      var anchorY = clientY != null ? clientY - pr.top
        : (s.r.top - pr.top) + ((meta.y0 + meta.y1) / 2) * s.sy;
      tip.style.top = Math.round(clamp(anchorY - tH - 14, 4, Math.max(4, pr.height - tH - 4))) + 'px';
    }

    function hide() {
      cur = -1;
      tip.hidden = true;
      if (cross) cross.style.display = 'none';
      for (var f = 0; f < fdots.length; f++) fdots[f].style.display = 'none';
      for (var m = 0; m < hots.length; m++) hots[m].classList.remove('is-hot');
    }

    function onMove(ev) {
      var s = scale();
      if (!s.r.width) return;
      var ux = (ev.clientX - s.r.left) / (s.sx || 1);
      var uy = (ev.clientY - s.r.top) / (s.sy || 1);
      var i = nearest(ux, uy);
      if (i < 0) return hide();
      show(i, ev.clientY);
    }

    plot.addEventListener('pointermove', onMove);
    plot.addEventListener('pointerdown', onMove);
    plot.addEventListener('pointerleave', hide);
    plot.addEventListener('blur', hide);
    plot.addEventListener('focus', function () { if (cur < 0) show(meta.k === 'bars' ? 0 : meta.items.length - 1, null); });
    plot.addEventListener('keydown', function (ev) {
      var n = meta.items.length, k = ev.key;
      if (k === 'ArrowRight' || k === 'ArrowDown') { show(clamp((cur < 0 ? -1 : cur) + 1, 0, n - 1), null); ev.preventDefault(); }
      else if (k === 'ArrowLeft' || k === 'ArrowUp') { show(clamp((cur < 0 ? n : cur) - 1, 0, n - 1), null); ev.preventDefault(); }
      else if (k === 'Home') { show(0, null); ev.preventDefault(); }
      else if (k === 'End') { show(n - 1, null); ev.preventDefault(); }
      else if (k === 'Escape') { hide(); }
    });
    return true;
  }

  /* ---- self-attach ---------------------------------------------------------
     chartAttach() is the documented, idempotent API — but a chart left unwired
     stays in its pre-animation state, which reads as "the chart is broken".
     So the module also sweeps on DOM ready and watches for cards inserted
     later. Calling chartAttach yourself is still correct and costs nothing. */
  if (typeof document !== 'undefined') {
    var sweepQueued = false;
    var sweep = function () {
      sweepQueued = false;
      try { chartAttach(document); } catch (e) { /* never break the host page */ }
    };
    /* a timer, not rAF — rAF never fires in a tab that isn't compositing */
    var queueSweep = function () {
      if (sweepQueued) return;
      sweepQueued = true;
      setTimeout(sweep, 0);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', queueSweep);
    } else {
      queueSweep();
    }
    if (typeof MutationObserver === 'function') {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var nd = added[j];
            if (nd.nodeType !== 1) continue;
            if ((nd.classList && nd.classList.contains('gfc')) ||
                (nd.querySelector && nd.querySelector('.gfc'))) { queueSweep(); return; }
          }
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
  }
})();
