# Davy Weekly Market Update — how to update it

Everything you change each week lives in **one file**: `week.json`.
You never need to touch the layout, the animals or the backdrops.

Rebuild and republish after any edit:

```bash
bash build.sh
```

Then republish `stampede.html` to the same artifact URL so the link you shared keeps working.

---

> **The week's content now lives in `src/week.json`**, and `AGENTS.md` in the
> package root is the full reference for it — every field, a JSON recipe for
> each chart, the sourcing standard and the Friday checklist. Rebuild with
> `python src/rebuild.py`. The examples below are written JavaScript-style for
> readability; in `week.json` every key and string needs double quotes.

## The shape of a week

`week.json` holds seven entries between two marker comments. Keep the markers —
a scheduled job splices between them.

```js
// ==== WEEK DATA START ====
const WEEK = [ /* seven entries, in order */ ];
const WEEK_META = { title:"…", subtitle:"…", generated:"2026-09-11", source:"live" };
// ==== WEEK DATA END ====
```

`WEEK_META.source` controls the honesty banner. While it is `"demo"` the deck shows a
**Demo copy** flag on the start screen and in the corner. Set it to `"live"` once every
entry holds real, sourced content — and not before.

### One day

```js
{
  key:   'tuesday',
  label: 'Tuesday',          // the big word on screen
  sub:   'The barrel',       // small line beside the region badge
  date:  'Tue 22 Sep',
  region:'india',            // picks the backdrop — see below
  state: 'live',             // 'filed' | 'live' | 'pending' — see below
  mood:  'bull',             // which animal won the day — see below
  moodNote: "One line saying why that animal, in plain words.",
  headline: "One sentence saying what the day was actually about.",
  points: [                  // 3–4; each one is a separate click
    { tick: 'GL X',   text: "…" },   // `tick` is a short mono label:
    { tick: '08:30',  text: "…" },   // a number, a time, a ticker, an event code
  ],
  tape: [                    // 5–7 items for the crawl along the top
    { name: 'Brent', chg: '+1.86%' },
    { name: 'UST 2y', chg: '+3bp' },
  ],
  chart: { … }               // optional — see below
}
```

`chg` drives its own colour: a leading `+` goes green, `-` or `−` goes red, anything
else stays neutral. So `'4.12%'` renders as a level, `'+0.31%'` as a move.

### Which animal runs the day

`mood` is the whole point of the animal: it is not decoration, it is the day's
verdict. Fixed income sold off, the bear runs; the AI complex ripped, the bull
runs. The animal swaps while it is off-screen between slides, the slide carries a
`Bull tape` / `Bear tape` chip, and `moodNote` prints underneath the headline as
*Why the bull* — one line, plain words, no jargon.

Leave `mood` off and the deck reads it off that day's own `tape` instead: it
averages the percentage moves, ignores basis-point moves (a yield is not
directional on its own) and inverts anything volatility-like, because a higher VIX
is not a better day. Pin it by hand whenever the dominant story disagrees with the
average — which is often.

### Days that have not happened yet

`state` is how the deck stays honest between Monday and Friday:

| value | what it does |
|---|---|
| `'filed'` | the default. Nothing special: these are real, filed figures |
| `'live'` | the day being presented. Nothing visual yet — it is there for the reader of the file |
| `'pending'` | the day is still ahead: the slide shows a dashed **Figures to come** chip, the mood chip reads *Bull lean* instead of *Bull tape*, `moodNote` prints as *What decides it*, the rail stop gets a dashed tick, and the scorecard says it settles on Friday |

Build the whole week on Monday, mark Wednesday onward `pending`, and delete the
flag day by day as the prints land. A placeholder that looks like a print is how
someone ends up quoting a number that was never real.

### The last entry

The seventh entry is the close. Instead of `points` it carries `scores` — signed
weekly percentage moves, drawn as a diverging bar chart around zero:

```js
{ key:'close', label:'The Close', …,
  scores: [ { name:'S&P 500', pct: 1.4 }, { name:'Brent', pct: -3.2 }, … ] }
```

### Chart-first days, and your script

A day is built to be read from the back of a room: three numbers, one or two
charts, and nothing else. The words you say live in the same entry as `notes`,
and never appear on the slide.

```js
{
  key: 'thursday', label: 'Thursday', sub: 'Mumbai', date: 'Thu 24 Sep',
  region: 'india', state: 'filed', mood: 'bear',
  moodNote: "One line: why this animal.",
  headline: "One sentence, two lines at most.",
  stats: [                                  // 3 tiles; 4 at most
    { label: 'Nifty 50', value: '23,063', chg: '-1.64%', note: 'Three-month low' },
    { label: 'India VIX', value: '12.73', chg: '+22.9%' },
    { label: 'PB Fintech', value: '₹1,207', chg: '-36%' }
  ],
  charts: [ { kind:'line', ... }, { kind:'bars', ... } ],   // or chart: { ... } for one
  notes: [                                  // what you SAY - two or three short paragraphs
    "Thursday was India's turn…",
    "Two things hit at once…"
  ]
}
```

- **One chart** sits large on the right with the tiles stacked beside it.
  **Two charts** put the tiles in a row across the top and the charts side by side.
- `chg` colours and arrows the tile: `+` up, `-` down, anything else neutral.
- Keep `notes` to about **90 words a slide**. The whole talk should come in
  around 5½ minutes at a normal pace, leaving room for clicks inside the clock.
- A pending day can say exactly what is still to come with
  `pendingLabel: "Friday's session to come"`, and the scorecard's settlement
  line can be set with `verdictNote`.

**Your script** is generated from those notes, so the slides and what you say
never drift apart. After editing the week:

```bash
python src/make_script.py
```

It writes `Davy-Weekly-Script-….docx` (for printing or your phone) and
`SCRIPT.md`, with a running order, per-slide timings, click cues, Q&A prep and
the sources. In the deck itself, press **N** — or the page icon beside the
clock — to see the current slide's notes on your own screen. It is off by
default, so a projector mirroring your laptop never shows it unless you ask.

### The Questions page

Added automatically after the Close on every build — you never write it. It
shows *Questions?*, your name and the Davy mark, and the clock stops the moment
it appears, so the reading is the time you actually took. Up to three prompts
for a quiet room go in `WEEK_META.askMe`:

```js
askMe: [ "Is one hike the end of it?", "…", "…" ]
```

### Where the numbers come from

Put the source line in `WEEK_META.sourceLine` and it prints in the corner of
every slide. The standard this deck is built to: **FT Markets Data first**
(the summary pages are free; the historical tables are subscriber-only), and
anything FT doesn't carry confirmed by two independent sources that agree.

---

## Backdrops

`region` selects the scene behind the animal. Seven are built:

| value | what you get |
|---|---|
| `us` | Manhattan skyline |
| `iran` | domes, minarets, palms |
| `china` | pagoda, pearl tower, lanterns |
| `eu` | twelve-star ring, colonnade, Frankfurt towers |
| `uk` | clock tower, Gherkin, Shard |
| `japan` | Fuji, torii, rising sun |
| `global` | wireframe globe, anonymous skyline |
| `gold` | mine headframe, pit terraces, bullion-bright sun |
| `india` | Gateway of India, Mumbai skyline, palms |
| `em` | many-city composite skyline, cooler horizon |

Pick the region that owns the day's **dominant driver**, not the market that moved
most. ECB decision → `eu`. US CPI or the dollar → `us`. Gold and the miners →
`gold`. Nifty, the rupee, Indian flows → `india`. EM flows, PMIs or index
composition → `em`. Iranian supply or Gulf shipping → `iran`. Nothing dominated, or
three-plus asset classes moved on one shared cause → `global`.

An unknown region falls back to `global` rather than breaking, so a typo costs you
a backdrop and nothing else.

---

## Charts

Add a `chart` object to any day. Four kinds. All of them animate in on their own
click, after the bullets.

Add `size:'hero'` to any of them to make it large — the story column widens and the
animal steps back. Use it once or twice a week, not on every slide.

### Candlesticks — price action

```js
chart: {
  kind: 'candle',
  title: 'Brent front month',
  note:  'ICE settlement',
  unit:  '$',
  data: [
    { t:'Mon', o:76.94, h:78.40, l:76.80, c:78.12 },
    { t:'Tue', o:78.12, h:79.95, l:77.96, c:79.57 },
  ]
}
```

### Line — levels over the week

One series gets an area fill; two to four get a legend and direct labels.

```js
chart: {
  kind: 'line',
  title: 'The week, rebased',
  note:  'Index = 100 at last Friday’s close',
  series: [
    { name:'S&P 500',   points:[ {t:'Mon',v:100}, {t:'Tue',v:99.7}, … ] },
    { name:'Stoxx 600', points:[ … ] }
  ]
}
```

### Bars — comparing across things

Signed values diverge around a zero line; unsigned values grow from a baseline.

```js
chart: {
  kind: 'bars',
  title: 'China August prices, year on year',
  unit: '%',
  bars: [ { name:'CPI', v:-0.2 }, { name:'PPI', v:-1.9 } ]
}
```

### Stat — one number that is the story

```js
chart: { kind:'stat', stat:{ value:'+1.4%', label:'S&P 500, week', sub:'best week since June' } }
```

**A few rules worth keeping.** Never two y-axes — if two measures have different
scales, use two charts or rebase both to a common start. Don't label every point;
the chart labels the ends and the extremes for you. Green and red mean direction of
travel and nothing else, so don't use them to tell series apart.

---

## Presenting it

- **Click anywhere**, or `→` / `space`, to advance one beat.
- `←` goes back a day, `1`–`7` jump straight to one, `R` restarts.
- **The clock is six minutes**, top right. `P` pauses and resumes it, `0` resets it
  to 6:00. Pausing also stops the ticker and the gallop, so a paused deck is
  completely still.
- Under the digits: **On pace / Behind 0:14 / Ahead 0:20**. Each day owns an equal
  slice of the six minutes and your progress through its beats says how much of
  that slice should be spent, so the reading moves as you present rather than
  jumping a whole slide at a time. The tick on the bar is where you should be.
- Keyboard: every control is reachable by tab, and a **Next beat** button appears at
  the top of the screen the moment you tab into the deck.
- The deck **stops** at the scorecard. A stray click at the end won't wipe the screen.
- Pick bull or bear on the start screen. That is **your call on the week**, and the
  scorecard settles it at the end: *You called the Bull. The tape agrees.* What runs
  on screen in between is each day's own animal, not your pick.

---

## Branding

The wordmark, product name and byline are one object near the top of the script in
`template.html`:

```js
const BRAND = { name:'Davy', product:'Weekly Market Update', by:'Catalin Bondari' };
```

The **mark itself** is the official Davy brandmark, lifted unaltered from the header
of davy.ie: the 80×80 crimson field with the lowercase wordmark reversed out of it.
It lives in one file, `src/davy-mark.js`, and everything that shows the logo draws
from there — the masthead, the start screen, and the plaque the animals wear.

```js
DAVY_MARK.svg(26, { title:'Davy' })   // a 26px square mark
DAVY_MARK.inner({ letterFill:'#F6E7C8' })   // just the paths, for another SVG
DAVY_RED                               // '#B90646'
```

Two rules, both from Davy's own usage guidance and both enforced by the way the file
is written: **the mark stays square** — never stretched to fill a wide plate — and
**the field is the clear space**, so it needs no padding of its own. If the brand team
issues an approved alternative lockup, replace `PATHS` and `VIEWBOX` in that one file
and every use of it follows.

If `davy-mark.js` is left out of a build, the deck falls back to the product name set
in type rather than shipping a wrong logo.

---

## Swapping in real artwork for the bull and bear

The deck draws its own vector animals. If you have images you'd rather use,
they take priority — drop them into `beast-art.js` and nothing else changes.

```js
var BEAST_ART = {
  bull:    'data:image/png;base64,…',   // running animal, side profile, facing RIGHT
  bear:    'data:image/png;base64,…',   // running animal, side profile, facing RIGHT
  faceoff: 'data:image/png;base64,…'    // title screen: bull left, bear right, facing each other
};
```

Fill one slot or all three; an empty slot keeps the drawing.

**What makes a good source image**

- **Transparent background** (PNG or WebP with alpha). A photo on a solid
  background lands on the scene as a visible rectangle.
- **Cropped tight, feet on the bottom edge.** The deck stands the image on its
  ground line, so empty space below the hooves makes the animal hover.
- **About 1200px wide** for the runners, 2400px for the faceoff — the deck never
  draws them bigger than roughly 340px and 760px, so that covers a high-DPI
  screen with room to spare.
- **Lit from the right, warm**, to sit inside the gold backdrops.
- **Under about 400KB each once encoded.** The page has a 16MB ceiling and
  everything else already uses a quarter of a megabyte.

Images are never mirrored — a photograph has a lit side, and flipping it would
light the animal from the wrong direction. So supply both animals facing right.

**Rights.** Only use an image you're licensed for. A watermarked stock preview
won't work: the watermark renders, and inlining the pixels doesn't change the
licence position.

---

## Brand red and the plate

The brand red is **`#B90646`**, read off the official brandmark on davy.ie rather
than guessed. It is defined once, in `src/davy-mark.js`, and mirrored into the
stylesheet as `--brand` in the `:root` block of `src/template.html` so CSS can use it
for rules and accents.

White on that crimson measures 6.7:1, so the mark is legible wherever it lands. The
crimson on the deck's near-black is 3.0:1, which is fine for the rule and the field
but is why no body text is ever set in it.

To go back to a plain struck-metal plaque on the animals instead of the crimson one,
pass `{ style:'metal' }` to `brandPlate()`.

---

## Animal poses, fallbacks and the title screen

- The title screen poses are set in `faceoffSVG()` in `src/beast-cast.js`:
  the bull uses `{ pose:'charge', lift:12 }` (positive `lift` lowers the head),
  the bear `{ pose:'swipe', lift:-8 }`. The raised-leg angles are the two lines
  starting `var up` / `var fold` inside `figure()` — degrees at the shoulder and
  the wrist.
- The animals are cast metal drawn as flat tonal planes with a rim light, not
  smooth gradients. That is deliberate: every gradient-shaded version of these
  two came out looking like an inflated balloon. If you rework them, keep the
  planes flat and let the silhouette and the rim do the work.
- The compare page at `compare/index.html` (needs a local server) shows the live
  drawing and the previous one side by side, still or galloping.
