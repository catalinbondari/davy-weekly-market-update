# -*- coding: utf-8 -*-
"""Check week.json before it is built. Standard library only.

    python src/validate.py            # report, exit 1 on errors
    python src/validate.py --strict   # warnings fail too

ERRORS are things that would break the page, draw a wrong chart, or run the
talk past the six-minute clock. The build refuses to run while any exist.
WARNINGS are things a careful editor would want to look at: a tile that
disagrees with the ticker, a slide whose script runs long, a day with no
sources. They are printed, and the build goes ahead.

Every message names the day and the field, so an editor - person or agent -
can go straight to it.
"""
import io, json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'week.json')

REGIONS = {'us', 'iran', 'china', 'eu', 'uk', 'japan', 'global', 'india', 'gold', 'em'}
STATES = {'filed', 'live', 'pending'}
MOODS = {'bull', 'bear'}
KINDS = {'line', 'bars', 'candle', 'stat'}
# Every field the deck reads. Anything else is a typo ("moodnote") or a guess,
# and would otherwise be ignored without a word.
DAY_FIELDS = {'key', 'label', 'sub', 'date', 'region', 'state', 'pendingLabel', 'mood', 'moodNote',
              'headline', 'stats', 'chart', 'charts', 'scores', 'verdictNote', 'notes', 'tape',
              'sources', 'points', 'rail', 'short', 'kind'}
META_FIELDS = {'title', 'subtitle', 'week', 'generated', 'source', 'sourceLine', 'presenter',
               'questions', 'sourcing', 'askMe'}
# a move or a level: +1.2%  -0.75%  +15bp  5.01%  0.00%  −1.64%  +22.9%  -36%
CHG = re.compile(r'^[+\-−]?\d[\d,]*(\.\d+)?(%|bp)?$')
WPM = 140                      # conversational presenting pace
TALK_S = 360                   # the clock
WARN_TOTAL_S, FAIL_TOTAL_S = 335, 345   # at 140 wpm; 345s still fits 6:00 at ~134 wpm with clicks
WARN_SLIDE_WORDS = 135
# measured: a bar or scoreboard label longer than this is cut to '...' on a 1024px laptop
LABEL_MAX = 14


def words(t): return len(re.findall(r"[\w'’-]+", t))
def mmss(s): s = int(round(s)); return '%d:%02d' % (s // 60, s % 60)
def num(v): return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)
def pct_of(chg):
    m = re.match(r'^([+\-−]?)(\d[\d,]*(?:\.\d+)?)%$', str(chg).strip())
    if not m: return None
    v = float(m.group(2).replace(',', ''))
    return -v if m.group(1) in ('-', '−') else v


def validate(data):
    E, W = [], []
    err = lambda where, msg: E.append('%s: %s' % (where, msg))
    warn = lambda where, msg: W.append('%s: %s' % (where, msg))

    def need_str(obj, key, where, optional=False):
        v = obj.get(key)
        if v is None:
            if not optional: err(where, 'missing "%s"' % key)
            return None
        if not isinstance(v, str) or not v.strip():
            err(where, '"%s" must be a non-empty string' % key); return None
        if '<' in v or '>' in v:
            warn(where, '"%s" contains < or > - strings are shown as HTML, keep them plain text' % key)
        return v

    if not isinstance(data, dict): return ['week.json: top level must be an object'], W

    # ── meta ──────────────────────────────────────────────────────────────
    meta = data.get('meta')
    if not isinstance(meta, dict):
        err('meta', 'missing or not an object'); meta = {}
    for k in ('title', 'subtitle', 'week', 'generated'): need_str(meta, k, 'meta')
    for k in sorted(set(meta) - META_FIELDS):
        warn('meta', 'unknown field "%s" - it will be ignored (typo?)' % k)
    need_str(meta, 'presenter', 'meta', optional=True)
    need_str(meta, 'sourceLine', 'meta', optional=True)
    if meta.get('source') not in ('demo', 'live'):
        err('meta', '"source" must be "demo" or "live"')
    elif meta['source'] == 'demo':
        warn('meta', 'source is "demo" - the deck will be flagged as placeholder copy')
    qs = meta.get('questions', [])
    if not isinstance(qs, list) or len(qs) > 3:
        err('meta.questions', 'must be a list of at most 3')
    else:
        for i, q in enumerate(qs):
            w = 'meta.questions[%d]' % i
            if not isinstance(q, dict): err(w, 'must be {"ask": ..., "facts": [...]}'); continue
            need_str(q, 'ask', w)
            if not isinstance(q.get('facts', []), list): err(w, '"facts" must be a list of strings')
    if not isinstance(meta.get('sourcing', []), list):
        err('meta.sourcing', 'must be a list of strings')

    # ── days ──────────────────────────────────────────────────────────────
    days = data.get('days')
    if not isinstance(days, list) or not days:
        err('days', 'missing or empty'); return E, W
    if len(days) > 9: err('days', '%d days - the rail holds at most 9 including Questions' % len(days))

    seen, total_words = set(), 0
    for n, d in enumerate(days):
        if not isinstance(d, dict): err('days[%d]' % n, 'must be an object'); continue
        key = d.get('key') or 'days[%d]' % n
        at = 'day "%s"' % key
        if not re.match(r'^[a-z][a-z0-9-]*$', str(d.get('key', ''))):
            err(at, '"key" must be lowercase letters/digits, e.g. "monday"')
        if key in seen: err(at, 'duplicate key')
        seen.add(key)

        for k in ('label', 'sub', 'date', 'headline', 'moodNote'): need_str(d, k, at)
        for k in sorted(set(d) - DAY_FIELDS):
            close = [f for f in DAY_FIELDS if f.lower() == k.lower()]
            warn(at, 'unknown field "%s" - it will be ignored%s' % (k, ' (did you mean "%s"?)' % close[0] if close else ''))
        if d.get('region') not in REGIONS:
            err(at, 'region "%s" is not one of: %s' % (d.get('region'), ', '.join(sorted(REGIONS))))
        if d.get('state', 'filed') not in STATES:
            err(at, 'state must be one of: filed, live, pending')
        if d.get('mood') not in MOODS:
            err(at, 'mood must be "bull" or "bear"')
        if d.get('state') == 'pending' and not d.get('pendingLabel'):
            warn(at, 'pending with no "pendingLabel" - the chip will just say "Figures to come"')
        if d.get('short') is not None and (not isinstance(d['short'], str) or len(d['short']) > 7):
            warn(at, '"short" is the phone rail label - keep it to 7 characters or fewer')
        if d.get('rail') is not None and len(str(d['rail'])) > 16:
            warn(at, '"rail" label "%s" is long - the desktop rail fits about 16 characters' % d['rail'])
        h = d.get('headline') or ''
        if len(h) > 150: warn(at, 'headline is %d characters - over ~150 it wraps to three lines' % len(h))

        # the script
        notes = d.get('notes')
        if isinstance(notes, str): notes = [notes]
        if not isinstance(notes, list) or not notes or not all(isinstance(t, str) and t.strip() for t in notes):
            err(at, '"notes" must be a list of 1-4 non-empty paragraphs (what the presenter says)')
            notes = []
        elif len(notes) > 4:
            warn(at, '%d paragraphs of notes - two or three reads better' % len(notes))
        wc = sum(words(t) for t in notes)
        total_words += wc
        if wc > WARN_SLIDE_WORDS:
            warn(at, 'notes are %d words (~%s) - aim for 90-130 a slide' % (wc, mmss(wc / WPM * 60)))

        # sources
        src = d.get('sources')
        if not src:
            warn(at, 'no "sources" - record the URL behind every figure')
        elif not isinstance(src, list) or not all(isinstance(s, str) and s.startswith('http') for s in src):
            err(at, '"sources" must be a list of URLs')

        # ticker
        tape = d.get('tape')
        tape_by = {}
        if not isinstance(tape, list) or not tape:
            err(at, '"tape" must be a list of {"name", "chg"} for the ticker')
        else:
            if not 3 <= len(tape) <= 10: warn(at, '%d ticker items - 5 to 8 reads best' % len(tape))
            for i, t in enumerate(tape):
                w = '%s tape[%d]' % (at, i)
                if not isinstance(t, dict) or not isinstance(t.get('name'), str) or not isinstance(t.get('chg'), str):
                    err(w, 'must be {"name": str, "chg": str}'); continue
                if not CHG.match(t['chg'].strip()):
                    warn(w, 'chg "%s" is not a number like "+1.2%%", "-15bp" or "5.01%%"' % t['chg'])
                tape_by[t['name']] = t['chg'].strip()

        # body: tiles, a scorecard, or legacy bullet points
        stats, scores = d.get('stats'), d.get('scores')
        if not stats and not scores and not d.get('points'):
            err(at, 'needs "stats" (number tiles) or, for the close, "scores"')
        if stats is not None:
            if not isinstance(stats, list) or not 1 <= len(stats) <= 4:
                err(at, '"stats" must be a list of 1-4 tiles')
            else:
                for i, s in enumerate(stats):
                    w = '%s stats[%d]' % (at, i)
                    if not isinstance(s, dict): err(w, 'must be an object'); continue
                    need_str(s, 'label', w); need_str(s, 'value', w)
                    need_str(s, 'note', w, optional=True)
                    if 'chg' in s:
                        c = str(s['chg']).strip()
                        if not CHG.match(c):
                            warn(w, 'chg "%s" is not a number like "+1.2%%" - its colour may be wrong' % c)
                        if s.get('label') in tape_by and tape_by[s['label']] != c:
                            warn(w, 'tile says %s but the ticker says %s for "%s"' % (c, tape_by[s['label']], s['label']))
                    if len(str(s.get('value', ''))) > 12:
                        warn(w, 'value "%s" is long - tiles read best at 12 characters or fewer' % s.get('value'))
        if scores is not None:
            if not isinstance(scores, list) or not 2 <= len(scores) <= 10:
                err(at, '"scores" must be a list of 2-10 {"name", "pct"}')
            else:
                for i, s in enumerate(scores):
                    w = '%s scores[%d]' % (at, i)
                    if not isinstance(s, dict) or not isinstance(s.get('name'), str) or not num(s.get('pct')):
                        err(w, 'must be {"name": str, "pct": number}'); continue
                    if len(s['name']) > LABEL_MAX:
                        warn(w, 'name "%s" is %d characters - over %d it is cut off' % (s['name'], len(s['name']), LABEL_MAX))
                    t = tape_by.get(s['name'])
                    if t is not None and pct_of(t) is not None and abs(round(pct_of(t), 1) - s['pct']) > 0.051:
                        warn(w, 'scoreboard %s%% vs ticker %s for "%s"' % (s['pct'], t, s['name']))

        # charts
        charts = d.get('charts') or ([d['chart']] if d.get('chart') else [])
        if d.get('chart') and d.get('charts'): err(at, 'use "chart" or "charts", not both')
        if len(charts) > 2: err(at, '%d charts - two at most' % len(charts))
        for i, c in enumerate(charts):
            check_chart(c, '%s chart %d' % (at, i + 1), err, warn)

    moods = {d.get('mood') for d in days if isinstance(d, dict)}
    if len(days) > 2 and len(moods) == 1:
        warn('mood', 'every slide is a %s - set each slide\'s mood by its own topic' % moods.pop())
    secs = total_words / WPM * 60
    if secs > FAIL_TOTAL_S:
        err('script', '%d words is ~%s spoken - over the six-minute clock. Trim the notes.' % (total_words, mmss(secs)))
    elif secs > WARN_TOTAL_S:
        warn('script', '%d words is ~%s spoken - leaves little room for clicks inside 6:00' % (total_words, mmss(secs)))
    return E, W


def check_chart(c, at, err, warn):
    if not isinstance(c, dict): err(at, 'must be an object'); return
    k = c.get('kind')
    if k not in KINDS: err(at, 'kind "%s" must be one of: line, bars, candle, stat' % k); return
    if k != 'stat' and not c.get('title'): warn(at, 'no "title"')
    if k == 'line':
        series = c.get('series') or ([{'name': c.get('title', ''), 'points': c.get('data')}] if c.get('data') else None)
        if not series: err(at, 'line needs "series" [{name, points:[{t,v}]}] or "data" [{t,v}]'); return
        if len(series) > 4: err(at, '%d series - four at most' % len(series))
        labels = None
        for j, s in enumerate(series):
            pts = s.get('points') if isinstance(s, dict) else None
            if not isinstance(pts, list) or len(pts) < 2:
                err('%s series %d' % (at, j + 1), 'needs at least 2 points'); continue
            if not all(isinstance(p, dict) and isinstance(p.get('t'), str) and num(p.get('v')) for p in pts):
                err('%s series %d' % (at, j + 1), 'every point must be {"t": "Mon", "v": number}'); continue
            ts = [p['t'] for p in pts]
            if labels is None: labels = ts
            elif ts != labels: warn('%s series %d' % (at, j + 1), 'x labels differ from the first series')
    elif k == 'bars':
        bars = c.get('bars') or c.get('data')
        if not isinstance(bars, list) or not 2 <= len(bars) <= 12:
            err(at, 'bars needs "bars": 2-12 of {"name", "v"}'); return
        for j, b in enumerate(bars):
            if not isinstance(b, dict) or not isinstance(b.get('name'), str) or not num(b.get('v')):
                err('%s bar %d' % (at, j + 1), 'must be {"name": str, "v": number}'); continue
            if len(b['name']) > LABEL_MAX:
                warn('%s bar %d' % (at, j + 1), 'name "%s" is %d characters - over %d it is cut off on a laptop' % (b['name'], len(b['name']), LABEL_MAX))
    elif k == 'candle':
        data = c.get('data')
        if not isinstance(data, list) or len(data) < 2: err(at, 'candle needs "data": [{t,o,h,l,c}, ...]'); return
        for j, p in enumerate(data):
            w = '%s candle %d' % (at, j + 1)
            if not isinstance(p, dict) or not all(num(p.get(x)) for x in 'ohlc'):
                err(w, 'must be {"t", "o", "h", "l", "c"} with numbers'); continue
            if not (p['l'] <= min(p['o'], p['c']) and p['h'] >= max(p['o'], p['c'])):
                err(w, 'low/high do not bracket open and close')
    elif k == 'stat':
        st = c.get('stat')
        if not isinstance(st, dict) or not st.get('value'): err(at, 'stat needs "stat": {"value", "label"}')


def load(path=DATA):
    try:
        return json.load(io.open(path, encoding='utf-8'))
    except json.JSONDecodeError as e:
        # the most common agent mistake: a trailing comma or a single quote
        print('week.json is not valid JSON: line %d, column %d: %s' % (e.lineno, e.colno, e.msg))
        print('  (JSON needs double quotes, and no comma after the last item in a list or object)')
        sys.exit(1)


def main():
    strict = '--strict' in sys.argv
    # an optional path lets an editor check a draft before replacing week.json
    path = next((a for a in sys.argv[1:] if not a.startswith('--')), DATA)
    data = load(path)
    E, W = validate(data)
    for m in E: print('ERROR    ' + m)
    for m in W: print('warning  ' + m)
    days = data.get('days') or []
    wc = sum(words(t) for d in days if isinstance(d, dict) for t in (d.get('notes') or []) if isinstance(t, str))
    print('%s - %d slides, script ~%s spoken, %d error(s), %d warning(s)' % (
        'FAILED' if E or (strict and W) else 'OK', len(days), mmss(wc / WPM * 60), len(E), len(W)))
    sys.exit(1 if E or (strict and W) else 0)


if __name__ == '__main__':
    main()
