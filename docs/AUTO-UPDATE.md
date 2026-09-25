# Auto-updating The Weekly Stampede

Design only. Nothing here has been built, and no scheduled task has been created.

## 0. The constraint that drives everything

The published page runs under a CSP that blocks all external hosts. The deck can
never fetch news at runtime. So freshness is a **publish-time** property: a job
outside the page rewrites the data file and re-publishes. The page stays a dumb,
self-contained artifact that renders whatever `WEEK` happens to contain.

That is a feature. It means the deck cannot break live in front of a room
because a feed went down.

## 1. Mechanism

A Claude Code scheduled task, once per weekday evening:

1. **Gather.** Search the open sources in section 2 for the day's market news.
   Collect headlines, standfirsts, official release pages, and primary data.
   Keep a `sources[]` list of URLs per claim — this is the audit trail.
2. **Rewrite.** Update that day's entry in `src/week.json`: `headline`,
   `stats`, the chart data, `tape`, the spoken `notes` and the `sources` URLs,
   exactly as `AGENTS.md` specifies. All prose is written from scratch. Numbers
   come only from primary data or FT Markets Data, never from a paywalled
   article's rendering of them, and a day that can't be sourced stays
   `"state": "pending"`.
3. **Validate, then build.** Run `python src/rebuild.py`. It checks every
   field, the chart shapes, the tile/ticker agreement and the script length,
   and refuses to build on any error. A week that doesn't validate is never
   published. Fail closed.

4. **Publish.** Re-publish the artifact with the **same file path and `url`**
   so the link the user already shared never changes. Update
   `WEEK_META.generated`; flip `source` from `demo` to `live` on the first real
   run.

Idempotency: the job writes the entry for *today's* key only (`monday`,
`tuesday`, …). Re-running it twice on the same evening overwrites that one
entry rather than appending.

## 2. Usable sources

| Source | Good for |
| --- | --- |
| BLS, ONS, Eurostat, NBS, China Customs | The actual release — the number, first-hand, free. |
| ECB / BoE / Fed press pages and RSS | Decisions, statements, projections, verbatim policy language. |
| Treasury + TreasuryDirect auction results | Auction tails, bid-to-cover, buyback operations. |
| OPEC press releases, EIA, IEA public summaries | Quota decisions, inventories, supply balances. |
| Exchange settlement pages (ICE, CME, LSE) | Closing levels for the `tape` and `scores`. |
| Reuters / AP / CNBC / Bloomberg free web tier | What the market *thought* the number meant. |
| Central bank and agency RSS feeds | Cheap, reliable, explicitly published for machine reading. |

**On the FT specifically.** A human subscriber may read FT articles and brief
from them; that is what the subscription is for. An automated job must not:
log into the paywall, fetch article bodies, cache or store FT text, or emit
sentences derived closely enough from FT prose to be a substitute for reading
it. What the job *may* use is what the FT publishes openly — public headlines,
standfirsts, and any RSS the FT itself offers — and only as a **pointer**: a
signal that a story matters, to be confirmed against a primary source before it
enters the deck. If the FT is the only outlet carrying something, that item does
not go in automatically; it goes into a `needs_human_review` note for the user
to write up themselves from their own subscription.

Practical rule: **headlines to decide what matters, primary sources to state
facts, original sentences always.** No article body text is ever stored, and no
sentence in the deck is a reworded FT sentence.

## 3. Deciding `region`

Pick the region that owns the day's **dominant driver**, not the market that
moved most. One region per day; the field selects a backdrop, so it must be
decisive.

Resolution order:

1. **Scheduled-event match.** If a calendar event from a known jurisdiction is
   the session's main event, that jurisdiction wins outright. ECB decision →
   `eu`. BLS CPI or FOMC → `us`. NBS/customs data → `china`. ONS or BoE → `uk`.
   BoJ or Japanese CPI → `japan`. This resolves most weekdays before any
   judgement is needed.
2. **Geopolitical override.** If oil is the day's story and the driver is
   Iranian supply, sanctions, or Gulf shipping risk → `iran`. OPEC+ decisions
   without an Iran angle stay `global`.
3. **Breadth test.** If three or more of {US equities, European rates, Asian FX,
   crude} moved on one shared cause, or nothing dominated → `global`.
4. **Default.** Unresolved after the above → `global`. Never guess a specific
   country to make a backdrop appear.

The job records a one-line justification for its region choice alongside the
entry, so the user can see why a day got the backdrop it did. Region assignment
is also worth pinning by hand when the user already knows the week's shape —
the field is cheap to override.

## 4. Failure modes

| Mode | Response |
| --- | --- |
| No confirmed news for the day | Write `points: []` and `headline: ""`. **Leave the day visibly empty.** Never invent. |
| A source is unreachable | Use the remaining sources. If no primary source confirms a number, the number is omitted, not estimated. |
| Only a paywalled outlet has the story | Skip it; log to `needs_human_review`. |
| Spliced file fails to parse | Abort before publishing. Keep the last good file. Alert the user. |
| Publish fails or conflicts | Do not retry with `force`. Re-read the live artifact, merge, republish. |
| Market holiday | Write the entry, say the market was closed, keep `tape` empty. A closed session is real content — Monday 7 September is exactly this case. |

The single most important rule: **an empty day is an honest day.** A blank panel
reads as "nothing confirmed yet" and the presenter fills it verbally. A
hallucinated panel reads as fact and is repeated in a meeting. The failure modes
are not symmetric, so the default is silence.

While `WEEK_META.source` is `demo`, the deck should render its placeholder
banner. The banner comes off only when a run has replaced every entry with
sourced content.

## 5. Schedule

For a Friday-afternoon presentation covering Sat–Fri, run after each session's
US close, plus a Sunday pass for the weekend panel and a Friday pre-flight.

```cron
# times are America/New_York
30 17 * * 1-5   # Mon–Fri 17:30 — after the US close, write that day's entry
0  18 * * 0     # Sunday 18:00 — weekend set-up panel and the week-ahead calendar
0  12 * * 5     # Friday 12:00 — pre-flight: fill `close`, verify all 7, republish
```

Notes:

- The weekday run at 17:30 ET clears the 16:00 close and settlement prints.
- The Sunday run catches weekend events — an OPEC+ meeting on Sunday 6 September
  is precisely why this pass exists.
- The Friday noon run is the one that matters. It computes the `close`
  scoreboard from the week's settlements, checks all seven entries are present
  and parse, and does the final publish — comfortably before an afternoon
  presentation, with time for the user to read it over.
- Friday's own entry is still incomplete at noon. Either present it as a partial
  day, or move the pre-flight to 16:30 ET and accept a tighter margin. Do not
  let the job project Friday's close.
