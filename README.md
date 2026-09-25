# Davy — Weekly Market Update

A click-through market presentation. You pick a bull or a bear on the start
screen; it runs you through the week one story at a time, the backdrop changes
to wherever the news came from, and charts reveal on their own click.

**Live:** https://claude.ai/code/artifact/aac5cf2c-c64b-46b0-aa1c-2496022495c4

---

## Just open it

```
index.html
```

Double-click it. That's the whole deck — one file, no server, no install, works
offline apart from the Google Fonts link.

**Presenting:** click anywhere (or `→` / `space`) to advance one beat. `←` goes
back a day, `1`–`7` jump straight to a day, `R` restarts. The deck deliberately
*stops* at the scorecard so a stray click at the end can't wipe the screen.

**The clock is six minutes**, top right. `P` pauses and resumes it, `0` resets it
to 6:00, and the two buttons do the same thing with the mouse. Under the digits it
says *On pace*, *Behind 0:14* or *Ahead 0:20*: each day owns an equal slice of the
six minutes, and how far you are through that day's beats says how much of its
slice should be gone. Pausing the clock also stops the ticker and the gallop, so a
paused deck is completely still.

**Your script** is `Davy-Weekly-Script-21-25-Sep-2026.docx` beside this file —
running order, what to say on each slide, click cues, Q&A prep and sources, about
about 5½ minutes spoken, so it fits the six-minute clock with room for clicks. The same words are in the deck: press **N** (or the page icon
by the clock) to see the current slide's notes on your screen. Regenerate it after
any edit with `python src/make_script.py`.

**The animal belongs to the day, not to you.** Your pick on the start screen is
your *call* on the week; what runs on screen is whichever animal won each day —
bull for Monday's miner margins, bear for Thursday's dollar — and the scorecard
settles your call at the end. Each day sets that with `mood` and one line of
`moodNote` saying why.

### Running it in VS Code

Nothing to install and no build step to run it — it's a static page.

- **Simplest:** right-click `index.html` in the Explorer -> *Reveal in File
  Explorer*, then double-click it. Or from a terminal: `start index.html`.
- **With live reload:** install the **Live Server** extension, then right-click
  `index.html` -> *Open with Live Server*. Handy while you're editing
  `week.json`, since a rebuild refreshes the page automatically.
- **Or serve it yourself:** `python -m http.server 8000` in the package folder,
  then open `http://localhost:8000/index.html`.

The deck is one self-contained file. The only thing it fetches is the Google
Fonts stylesheet, so with no internet it still runs — it just falls back to
Georgia, Segoe UI and Consolas.

**Rebuilding after a content edit** is one command, in any terminal —
PowerShell, Git Bash or VS Code's — with plain Python 3 and nothing to install:
`python src/rebuild.py`.

`stampede.html` is the same thing without the `<html>`/`<body>` wrapper — that's
the form the artifact host wants. Publish that one; open `index.html`.

---

## Changing the content

Everything you edit each week is in **one plain data file, `src/week.json`**:
every number, chart, headline, the spoken script, the Q&A prep and the source
URL behind each figure. Then:

```bash
python src/rebuild.py
```

That checks the data (and refuses to build if anything is wrong, naming the day
and the field), builds `index.html`, and regenerates your script. To check a
change without building: `python src/validate.py`.

**This edition is a deep dive** — the US 10-year at 5%, the war and oil,
Xi–Trump, and what the three are doing to portfolios — told as topics rather
than days. The day-by-day run-through of the same week is kept in
`src/archive/week-21-25-Sep-2026-weekly.json`; copy it over `src/week.json` and
rebuild to switch back.

**`AGENTS.md`** is the editing contract — written so another AI agent (or a
colleague) can update the week safely: the one file to touch, the sourcing
standard, the field reference, a copy-paste recipe for every chart, and the
Friday checklist. `docs/AUTHORING.md` covers presenting, branding and artwork.

---

## What each file is

| File | What it does |
|---|---|
| `index.html` | The built deck, ready to open. |
| `stampede.html` | Same build, no outer HTML wrapper — for publishing as an artifact. |
| `src/template.html` | Layout, CSS and the controller: transitions, reveals, the auto-fitting column, keyboard handling. Branding lives here in a `BRAND` object. |
| `src/scenes.js` | The seven backdrops, drawn in code — sun, candlestick wall, skyline, reflective floor. No images. |
| `src/charts.js` | The chart module: candlesticks, line, bars, stat. Handles its own hover, keyboard access and a hidden data table. |
| `src/beast-cast.js` | The gold bull and gunmetal bear, as SVG. |
| `src/beast-art.js` | Empty slots for real bull/bear images. Fill one and it replaces the drawing. |
| `src/week.json` | **The content** — the only file edited each week. |
| `src/validate.py` | Checks `week.json`: fields, formats, chart shapes, tile/ticker agreement, script length. |
| `src/rebuild.py` | The one command: validate, build `index.html` + `stampede.html`, write the script. |
| `src/make_script.py` | Lays out the presenter's script from each day's notes. |
| `src/davy-mark.js` | The official Davy brandmark, used everywhere the logo appears. |
| `src/build.sh` | Old entry point, now just runs `rebuild.py`. |
| `Davy-Weekly-Script-*.docx`, `SCRIPT.md` | **Generated** — your script. |
| `AGENTS.md` | How to update the week safely — for an agent or a person. |
| `tools/glitch-scan.js` | Visual QA: open `index.html#scan` over a local server. |
| `docs/AUTHORING.md` | Presenting, branding, backdrops and swapping in artwork. |
| `docs/AUTO-UPDATE.md` | Design for a scheduled job that keeps the deck current through the week. Not built — needs your go-ahead. |

---

## Two things to know

**The figures are real, to Thursday 24 September.** Every level and move on a
slide is a published close, checked against FT Markets Data where FT carries it
and otherwise against two independent sources that agree — the header of
each day's `sources` list in `src/week.json` gives the exact URLs. India and Asia run to Thursday's close;
the US, gold and oil to Wednesday's, because Thursday's US session was still
trading when this was built. **Before presenting on Friday:** update the Friday
slide and the scoreboard with the closing prints, drop the `pending` flags, and
rerun `python src/make_script.py`.

**The logo is the official one.** It's the brandmark from the header of davy.ie —
the crimson square with the wordmark reversed out — taken unaltered and kept in a
single file, `src/davy-mark.js`, which the masthead, the start screen and the
animals' plaque all draw from. The brand red that comes with it is `#B90646`.
Worth a glance from whoever owns the brand assets before this goes in front of
clients, in case there's a newer approved lockup.

---

## `experiments/` — do not open these in a browser

Three abandoned attempts at the animals, kept only in case they're useful later.

⚠️ **`beast3d-sdf.js` and `beast3d-mesh.js` will hang a browser tab.** They're
unfinished WebGL renderers whose authoring was interrupted before anything was
verified; loading either one locks the renderer and you'll have to close the
tab. They're here for reference, not for running.

`beast-silhouette.js` is safe — a dark rim-lit silhouette treatment from an early
pass. So are `beast-gold.js` (polished metal) and `beast-bronze.js` (faceted
bronze): both are complete, working drop-in replacements for the shipping
`beast-cast.js`, kept because they were built in parallel and judged side by side.
To try one, copy it into `src/` and run `python src/rebuild.py --beast beast-gold.js`.
