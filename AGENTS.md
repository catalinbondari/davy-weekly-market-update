# AGENTS.md — how to update this deck

This is Davy's weekly market update: a single-page presentation (`index.html`)
plus a presenter's script (`.docx` and `SCRIPT.md`). If you are an agent — or a
person — asked to change the content, this file is the contract.

## The one rule

**Edit `src/week.json`. Then run `python src/rebuild.py`.**

That is the entire workflow. `rebuild.py` checks the data, builds the deck and
writes the script. It refuses to build while the data has errors, and tells you
the day and the field of each one. Everything week-specific — numbers, charts,
headlines, the spoken script, the Q&A prep, the source URLs — lives in
`week.json`. Nothing else needs to change from one week to the next.

```bash
python src/validate.py            # check only — safe to run as often as you like
python src/validate.py draft.json # check a draft before it replaces week.json
python src/rebuild.py             # check, then build index.html and the script
```

Python 3 standard library only. Nothing to install.

## Files

| Path | What it is | Edit it? |
|---|---|---|
| `src/week.json` | The week: every number, chart, word and source | **Yes — the only file you edit** |
| `src/validate.py` | The checker `rebuild.py` runs first | Only to change the rules |
| `src/rebuild.py` | Validate → build the deck → write the script | No |
| `src/make_script.py` | Lays out the script from the notes | No |
| `src/template.html` | Layout, styles and behaviour | Not for content changes |
| `src/scenes.js`, `charts.js`, `beast-cast.js`, `davy-mark.js` | Backdrops, chart engine, the animals, the official Davy mark | No |
| `index.html`, `stampede.html` | **Generated** — the deck | Never by hand |
| `Davy-Weekly-Script-*.docx`, `SCRIPT.md` | **Generated** — the script | Never by hand |
| `tools/glitch-scan.js` | Visual QA (see *Checking the result*) | No |
| `experiments/` | Alternative animal drawings, not part of the build | Ignore |

## Sourcing — non-negotiable

This goes in front of investment professionals. A wrong number is worse than a
missing one.

1. **Every figure is a published close** (or a named release value). Never
   estimate, interpolate, round to something plausible or carry a number over
   from an earlier week. If you can't source it, leave the day
   `"state": "pending"` and say what's missing in `pendingLabel`.
2. **FT Markets Data first.** The summary pages at
   `markets.ft.com/data/.../tearsheet/summary?s=SYMBOL` are free and show the
   latest price and the day's change: today's close minus the change is
   yesterday's close. The historical tables are subscriber-only. FT symbols
   used here: `INX:IOM` (S&P 500), `COMP:NAS` (Nasdaq), `FTSE:FSI`,
   `NIFTY:NSI`, `HSI:HKG`, `GDX:PCQ:USD`, `EEM:PCQ:USD`, and commodities
   `?c=Brent+Crude+Oil`, `?c=COMEX+Gold`.
3. **Otherwise, two independent sources that agree.** Examples: AP for US index
   closes, the US Treasury for yields, NSE via Kotak Neo for India, Focus Taiwan
   for the TAIEX.
4. **Record every URL** in that day's `"sources"` list. The validator warns about
   a day that has none.
5. **Say which instrument.** For example, gold is "Dec futures" (COMEX December).
   FT's COMEX Gold is the front month and trades about $30–40 lower.
6. **Label anything that isn't a close.** If a session is still trading, say so
   in the tile's `note`, or wait for the close.
7. **Weekly moves are Friday close against the previous Friday's close.** If
   markets are on different days, say so in the chart `note` and in
   `pendingLabel`. This week, for example, runs Asia to Thursday and the US to
   Wednesday.

## Consistency — the validator checks some of this, you check the rest

- A tile and a ticker item with the same name must show the same move (checked).
- Each scoreboard `pct` must round-match its ticker item on the close day (checked).
- Daily moves compound into the week's move. If you change Tuesday's gold, the
  Tuesday chart, the Friday chart and the scoreboard may all change too (not
  checked).
- The spoken `notes` must say the same numbers the slide shows. Search the
  notes for the old number whenever you change one (not checked).

## `week.json` reference

```json
{
  "_readme": "...",
  "meta": { ... },
  "days": [ { ... }, { ... } ]
}
```

### `meta`

| Field | Type | Notes |
|---|---|---|
| `title` | string | Internal title |
| `subtitle` | string | Shown on the start screen |
| `week` | string | e.g. `"21-25 Sep 2026"`. Also names the script file |
| `generated` | string | e.g. `"24 Sep 2026"`. Shown as "Updated …" in the corner |
| `source` | `"live"` \| `"demo"` | `"demo"` flags every slide as placeholder copy |
| `sourceLine` | string | Short credit in the corner, e.g. `"Closes: FT, AP, NSE"` |
| `presenter` | string | Name on the byline, the Q&A page and the script |
| `questions` | list, ≤ 3 | `[{"ask": "…on screen…", "facts": ["…for the script only…"]}]` |
| `sourcing` | list of strings | The "Sources" section at the end of the script |

### A day

Days appear in order. A Questions page is added after the last one
automatically — don't write it.

| Field | Type | Required | Notes |
|---|---|---|---|
| `key` | string | yes | lowercase, unique: `"monday"` |
| `label` | string | yes | The big word: `"Monday"`, `"The 10-year"` |
| `rail` | string | no | Desktop rail label if different from `label`, ≤ 16 characters |
| `short` | string | no | Phone rail label, ≤ 7 characters: `"10y"`, `"Oil"` |
| `sub` | string | yes | Short tag beside the chips: `"The miners"` |
| `date` | string | yes | `"Tue 22 Sep"` |
| `region` | enum | yes | Backdrop: `us` `eu` `uk` `japan` `china` `iran` `india` `gold` `em` `global` |
| `state` | enum | no | `filed` (default), `live` (being presented), `pending` (still to come) |
| `pendingLabel` | string | if pending | What's still to come: `"Friday's session to come"` |
| `mood` | enum | yes | `bull` or `bear`: which animal won *this slide's topic*. Set it per topic — a deck where every slide is the same animal gets a warning |
| `moodNote` | string | yes | One line: why that animal. Shown as "Why the bull" |
| `headline` | string | yes | One sentence, ≤ 150 characters |
| `stats` | list, 1–4 | yes\* | Number tiles (below) |
| `chart` / `charts` | object / list ≤ 2 | no | One chart, or two (below) |
| `scores` | list | close only\* | `[{"name": "Nasdaq", "pct": 1.6}]`: the scoreboard |
| `verdictNote` | string | no | Close only: the line under the scoreboard |
| `notes` | list of strings | yes | **What the presenter says** (below) |
| `tape` | list | yes | Ticker: `[{"name": "S&P 500", "chg": "+1.49%"}]` |
| `sources` | list of URLs | yes | Every source behind this day's figures |

\* every day needs `stats`, except the close, which uses `scores`.

### Tiles and moves

```json
{ "label": "Nifty 50", "value": "23,063", "chg": "-1.64%", "note": "Three-month low" }
```

- `value` is text, exactly as it should appear: `"$4,376"`, `"5.11%"`, `"₹1,207"`. Keep it to 12 characters or fewer.
- `chg` sets the colour and arrow: a leading `+` shows up and green, `-` shows down and red, anything else is neutral. Use `"+1.49%"`, `"-15bp"`, `"0.00%"`, or a level such as `"5.01%"`.
- `note` is optional small print under the number.

### Charts — copy one of these

**Line.** One to four series with the same x labels. One series can use the `data` shorthand.
```json
{ "kind": "line", "title": "The miners' beta, both ways",
  "note": "Rebased, Fri 18 Sep close = 0", "unit": "%",
  "series": [
    { "name": "GDX",        "points": [ {"t":"Fri","v":0}, {"t":"Mon","v":-1.10}, {"t":"Tue","v":2.46} ] },
    { "name": "Gold (Dec)", "points": [ {"t":"Fri","v":0}, {"t":"Mon","v":-0.93}, {"t":"Tue","v":-1.10} ] }
  ] }
```
```json
{ "kind": "line", "title": "US 10-year Treasury yield", "unit": "%",
  "data": [ {"t":"Fri","v":5.01}, {"t":"Mon","v":4.96}, {"t":"Wed","v":5.11} ] }
```

**Bars.** If any value is negative, the bars show direction (up/down colours around zero).
```json
{ "kind": "bars", "title": "Net flows, Mon–Wed", "note": "₹ crore", "unit": "",
  "bars": [ {"name":"Domestic funds","v":9259}, {"name":"Foreign investors","v":-2769} ] }
```

**Candle.** Needs real open/high/low/close for each session. The low must be at or below the open and close; the high at or above.
```json
{ "kind": "candle", "title": "Nifty 50", "unit": "",
  "data": [ {"t":"Mon","o":27264,"h":27310,"l":27180,"c":27258} ] }
```

**Stat.** A single number is the chart.
```json
{ "kind": "stat", "stat": { "value": "+1.4%", "label": "S&P 500, week" } }
```

**Keep bar and scoreboard names to 14 characters or fewer.** Longer names are cut to "…" on a 1024px laptop (measured), and the validator warns. Put detail in the chart `note` instead: `"Long bonds"` with the note naming TLT, not `"Long Treasuries (TLT)"`.

`unit` is `"%"`, `"bp"`, `"$"`, `"€"`, `"£"` or `""`. Rebasing: `v = (close / baseline − 1) × 100`, with the baseline shown as 0.

### Writing `notes` — the spoken script

`notes` are the words the presenter says over that slide. They never appear on
screen. The script document is generated from them, and the **N** key shows
them to the presenter during the talk.

- Write for the ear: short sentences, one idea each, and numbers the way
  they're said ("one point six per cent", "twenty-eight hundred crore").
- Say what the room can see first, then why it matters.
- 70–100 words a slide, in two or three paragraphs. The whole talk should come
  in around 5½ minutes at 140 words a minute (about 770 words), so it still fits
  the six-minute clock with clicks. The validator warns over 5:35 and
  **fails over 5:45**.
- The clock's pace marker gives each slide a share of the six minutes in
  proportion to its word count.
- Refer to the charts by position ("the left-hand chart"). On two-chart days
  the first chart is on the left.
- Keep strings plain text: no HTML, and no `<` or `>`.

## Common jobs

**Fill in a day that was pending.** Replace its `stats`, chart data, `tape` and
`notes` with the real closes. Set `"state": "filed"` and delete `pendingLabel`.
Add the URLs to `sources`. Rebuild.

**Finish the week on Friday.** Fill Friday as above. Then recompute the
scoreboard as Friday's close against the previous Friday's close for every row.
Update the close day's `tape`, `headline`, `mood`, `moodNote` and `notes`, set
it to `filed`, and delete `pendingLabel` and `verdictNote`. Update the
`meta.sourcing` line about what still runs to which day. Rebuild.

**Start a new week — or switch to a deep dive.** The deck doesn't care whether
the slides are days (`monday`…`close`) or topics (`yields`, `war`…`close`): it
shows them in order either way, and appends Questions. Give topic slides a
`rail` and `short` label.
1. Copy `week.json` into `src/archive/` under a descriptive name, to keep it.
2. Set `meta.week` and `meta.generated`, and rewrite `meta.questions` and `meta.sourcing`.
3. Rewrite each slide. Keys are yours to choose; keep the last one `close` with a `scores` scoreboard.
4. Mark days that haven't happened yet `"pending"`, each with a `pendingLabel`.
5. Rebuild.

To go back to an archived edition: copy it over `src/week.json` and rebuild.

**Change one number.** Change it everywhere it appears: the tile, the ticker,
the chart data, the notes and, if it moves the week, the scoreboard. Then
rebuild; the validator catches mismatches between tiles, ticker and scoreboard.

**Add or remove a chart.** Use `"chart": {...}` for one or `"charts": [a, b]`
for two, never both. The layout adapts: with one chart the tiles sit beside
it; with two, the tiles run across the top and the charts sit side by side.

## Checking the result

1. `python src/rebuild.py` must end with `OK`.
2. Open `index.html` and click through, or use the keys: `→`/space advance,
   `←` back, `1`–`8` jump, `N` shows the script, `P` pauses the clock, `0`
   resets it, `R` restarts.
3. **Visual QA.** Serve the folder with `python -m http.server 8000` and open
   `http://localhost:8000/index.html#scan`. The deck walks every slide at that
   window size and reports anything cut off, overlapping, empty or broken in
   the browser console and the tab title (`SCAN OK` or `SCAN: n problem(s)`).
   Run it at 1280×720 and 1920×1080 at least.

## Don't

- Don't edit `index.html`, `stampede.html`, `SCRIPT.md` or the `.docx`. They
  are regenerated and your change will be lost.
- Don't rename fields or keys, and don't add fields the reference doesn't list.
  The deck ignores unknown fields; the validator warns about them, and suggests
  the right spelling when it's only the capitalisation that's wrong.
- Don't change `template.html` to fix content. If a slide overflows, shorten
  the headline, the tile notes or the chart instead.
- Don't invent a number to fill a gap. Mark the day pending.
