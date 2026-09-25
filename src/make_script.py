# -*- coding: utf-8 -*-
"""Write the presenter's script (.docx and SCRIPT.md) from week.json.

    python src/make_script.py

The script is not written here: every spoken word comes from a day's "notes"
in week.json, the Q&A prep from meta.questions, and the sources section from
meta.sourcing. This file only lays them out, adds timings and click cues, and
saves them. So an edit to week.json is an edit to the script.

Standard library only. A .docx is a zip of XML parts; writing the few parts
Word needs by hand means nothing has to be installed.
"""
import datetime, io, json, os, re, zipfile
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE) if os.path.basename(HERE) == 'src' else HERE
WPM = 140                      # conversational presenting pace
CRIMSON = 'B90646'             # the Davy crimson, from the official mark
INK, GREY, RULE = '1A1712', '6B6557', 'D8D1C2'
BODY, HEAD = 'Calibri', 'Georgia'


def words(t): return len(re.findall(r"[\w'’-]+", t))
def mmss(s): s = int(round(s)); return '%d:%02d' % (s // 60, s % 60)
def notes_of(d):
    n = d.get('notes') or []
    return n if isinstance(n, list) else [n]
def slug(s): return re.sub(r'[^A-Za-z0-9]+', '-', s).strip('-')


# ── WordprocessingML ──────────────────────────────────────────────────────
def run(text, bold=False, italic=False, size=None, color=None, font=None):
    rpr = ''
    if font: rpr += '<w:rFonts w:ascii="%s" w:hAnsi="%s" w:cs="%s"/>' % (font, font, font)
    if bold: rpr += '<w:b/>'
    if italic: rpr += '<w:i/>'
    if color: rpr += '<w:color w:val="%s"/>' % color
    if size: rpr += '<w:sz w:val="%d"/><w:szCs w:val="%d"/>' % (size * 2, size * 2)
    return '<w:r>%s<w:t xml:space="preserve">%s</w:t></w:r>' % (
        '<w:rPr>%s</w:rPr>' % rpr if rpr else '', escape(text))

def para(runs, after=None, before=None, line=None, keep=False, shade=None, border=None):
    ppr = ''
    if keep: ppr += '<w:keepNext/>'
    if border: ppr += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="%s"/></w:pBdr>' % border
    if shade: ppr += '<w:shd w:val="clear" w:color="auto" w:fill="%s"/>' % shade
    sp = ''
    if before is not None: sp += ' w:before="%d"' % before
    if after is not None: sp += ' w:after="%d"' % after
    if line is not None: sp += ' w:line="%d" w:lineRule="auto"' % line
    if sp: ppr += '<w:spacing%s/>' % sp
    return '<w:p>%s%s</w:p>' % ('<w:pPr>%s</w:pPr>' % ppr if ppr else '', ''.join(runs))

def table(rows, widths):
    grid = ''.join('<w:gridCol w:w="%d"/>' % w for w in widths)
    b = '<w:%s w:val="single" w:sz="4" w:space="0" w:color="' + RULE + '"/>'
    borders = '<w:tblBorders>' + ''.join(b % e for e in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV')) + '</w:tblBorders>'
    out = ('<w:tbl><w:tblPr><w:tblW w:w="%d" w:type="dxa"/>%s<w:tblCellMar><w:left w:w="100" w:type="dxa"/>'
           '<w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>%s</w:tblGrid>') % (sum(widths), borders, grid)
    for r_i, r in enumerate(rows):
        out += '<w:tr>'
        for k, c in enumerate(r):
            fill = '<w:shd w:val="clear" w:color="auto" w:fill="F3EFE6"/>' if r_i == 0 else ''
            out += '<w:tc><w:tcPr><w:tcW w:w="%d" w:type="dxa"/>%s</w:tcPr>%s</w:tc>' % (widths[k], fill, para(c, after=40, before=40))
        out += '</w:tr>'
    return out + '</w:tbl>'

def page_break(): return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
def cue(text): return para([run('▸ ' + text, italic=True, size=10, color=GREY, font=BODY)], after=120)


def build(data, dest=ROOT):
    meta = data.get('meta', {})
    days = [d for d in data['days'] if d.get('kind') != 'questions']
    by = meta.get('presenter', '')
    week = meta.get('week', '')
    total = sum(words(t) for d in days for t in notes_of(d))
    body = []
    B = body.append

    # title and how-to
    B(para([run('DAVY', bold=True, size=11, color=CRIMSON, font=BODY)], after=60))
    B(para([run('Weekly Market Update — your script', bold=True, size=24, color=INK, font=HEAD)], after=80))
    B(para([run('Week of %s  ·  Presented by %s' % (week, by), size=11, color=GREY, font=BODY)], after=240, border=CRIMSON))
    B(para([run('How to use this', bold=True, size=11, color=CRIMSON, font=BODY)], after=60, shade='F7F3EA'))
    B(para([run('About %s of talking at a conversational pace, which leaves room for clicks inside the six-minute clock. '
                'Each slide shows three numbers and a chart; the words are all here, not on screen. '
                'Read the numbers the room can see, then say why they matter. Cues in grey tell you when to click. '
                'Press N in the deck to see this script on your own screen.' % mmss(total / WPM * 60),
                size=11, font=BODY)], after=240, line=300, shade='F7F3EA'))

    # running order
    rows = [[[run(h, bold=True, size=10, font=BODY)] for h in ('Slide', 'What the room sees', 'Time')]]
    for n, d in enumerate(days, 1):
        see = ', '.join('%s %s' % (s['label'], s['value']) for s in (d.get('stats') or [])[:3])
        if not see and d.get('scores'): see = 'The week’s scoreboard'
        rows.append([[run('%d  %s' % (n, d['label']), bold=True, size=10, font=BODY)],
                     [run(see, size=10, font=BODY)],
                     [run(mmss(sum(words(t) for t in notes_of(d)) / WPM * 60), size=10, font=BODY)]])
    rows.append([[run('%d  Q&A' % (len(days) + 1), bold=True, size=10, font=BODY)],
                 [run('Questions? — the clock stops here', size=10, font=BODY)], [run('—', size=10, font=BODY)]])
    B(para([run('Running order', bold=True, size=13, color=CRIMSON, font=HEAD)], after=100, keep=True))
    B(table(rows, [1900, 5800, 1300]))

    # one page per slide
    for n, d in enumerate(days, 1):
        notes = notes_of(d)
        secs = sum(words(t) for t in notes) / WPM * 60
        charts = d.get('charts') or ([d['chart']] if d.get('chart') else [])
        pending = d.get('state') == 'pending'
        B(page_break())
        B(para([run('%d.  %s' % (n, d['label']), bold=True, size=18, color=CRIMSON, font=HEAD),
                run('  —  %s' % d.get('sub', ''), size=14, color=INK, font=HEAD)], after=60, keep=True))
        meta_line = '%s  ·  about %s  ·  %s%s' % (d.get('date', ''), mmss(secs),
                    'Bull' if d.get('mood') == 'bull' else 'Bear', ' lean' if pending else '')
        if pending: meta_line += '  ·  ' + d.get('pendingLabel', 'figures to come')
        B(para([run(meta_line, size=10, color=GREY, font=BODY)], after=120, border=RULE))
        B(para([run('On screen: ', bold=True, size=10, color=GREY, font=BODY),
                run(d.get('headline', ''), italic=True, size=10, color=GREY, font=BODY)], after=80))
        for s in (d.get('stats') or []):
            bits = '%s  %s' % (s['label'], s['value']) + ('  %s' % s['chg'] if s.get('chg') else '')
            B(para([run('•  ' + bits, size=10, color=GREY, font=BODY)], after=20))
        for c in charts:
            B(para([run('•  Chart: ' + c.get('title', ''), size=10, color=GREY, font=BODY)], after=20))
        B(para([run('')], after=100))
        for k, t in enumerate(notes):
            B(para([run(t, size=13, font=BODY)], after=200, line=340))
            if k == 0 and charts: B(cue('Click — the chart draws' if len(charts) == 1 else 'Click — the first chart draws'))
            if k == 1 and len(charts) > 1: B(cue('Click — the second chart draws'))
            if k == 0 and d.get('scores'): B(cue('Click — the scoreboard fills in'))
        B(cue('Click — on to the Questions page' if n == len(days) else 'Click — the animal runs you to the next day'))

    # questions
    B(page_break())
    B(para([run('%d.  Questions' % (len(days) + 1), bold=True, size=18, color=CRIMSON, font=HEAD)], after=60, keep=True))
    B(para([run('The clock stops when this page comes up. Say:', size=10, color=GREY, font=BODY)], after=120, border=RULE))
    B(para([run('“That’s the week. Happy to take any questions.”', size=13, font=BODY)], after=240, line=340))
    qs = meta.get('questions') or []
    if qs:
        B(para([run('If the room is quiet, these are on the screen as prompts. Facts to draw on for each:', size=11, font=BODY)], after=160))
        for q in qs:
            B(para([run(q['ask'], bold=True, size=12, color=INK, font=HEAD)], after=80, keep=True))
            for f in q.get('facts', []):
                B(para([run('•  ' + f, size=11, font=BODY)], after=60, line=300))
            B(para([run('')], after=80))

    # sources
    if meta.get('sourcing'):
        B(para([run('Sources and what’s still to come', bold=True, size=13, color=CRIMSON, font=HEAD)], before=200, after=100, keep=True))
        for line in meta['sourcing']:
            B(para([run('•  ' + line, size=10, color=GREY, font=BODY)], after=60, line=280))

    # A deep dive and a weekly run-through of the same week must not overwrite
    # each other, so a titled edition carries its title in the file name.
    title = re.sub(r'^The\s+', '', meta.get('title', ''))
    edition = 'Weekly' if title in ('', 'Weekly Stampede') else slug(title)
    name = 'Davy-%s-Script-%s.docx' % (edition, slug(week))
    out = os.path.join(dest, name)
    write_docx(out, ''.join(body), 'Davy Weekly Market Update — script, %s' % week, by)
    write_md(os.path.join(dest, 'SCRIPT.md'), data, days, total)
    return out, total, [(d['label'], sum(words(t) for t in notes_of(d))) for d in days]


def write_docx(path, body_xml, title, author):
    W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    document = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="%s" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>%s'
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
        '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/>'
        '</w:sectPr></w:body></w:document>') % (W, body_xml)
    styles = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="%s">'
        '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>'
        '<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-IE"/></w:rPr></w:rPrDefault>'
        '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
        '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>') % W
    types = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>')
    rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        '</Relationships>')
    doc_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        '</Relationships>')
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    core = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        '<dc:title>%s</dc:title><dc:creator>%s</dc:creator>'
        '<dcterms:created xsi:type="dcterms:W3CDTF">%s</dcterms:created></cp:coreProperties>') % (escape(title), escape(author), now)
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', types)
        z.writestr('_rels/.rels', rels)
        z.writestr('word/document.xml', document)
        z.writestr('word/_rels/document.xml.rels', doc_rels)
        z.writestr('word/styles.xml', styles)
        z.writestr('docProps/core.xml', core)
    # every part must parse, or Word will refuse the file
    import xml.etree.ElementTree as ET
    with zipfile.ZipFile(path) as z:
        for n in z.namelist(): ET.fromstring(z.read(n))


def write_md(path, data, days, total):
    meta = data.get('meta', {})
    md = ['# Weekly Market Update — your script', '',
          '*Week of %s · Presented by %s · Davy*' % (meta.get('week', ''), meta.get('presenter', '')), '',
          'About %s of talking at ~%d words a minute. Press **N** in the deck to see this on screen.' % (mmss(total / WPM * 60), WPM), '',
          '> Generated from `src/week.json` by `src/make_script.py`. Edit the JSON, not this file.', '']
    for n, d in enumerate(days, 1):
        notes = notes_of(d)
        md += ['## %d. %s — %s' % (n, d['label'], d.get('sub', '')), '',
               '*%s · about %s*' % (d.get('date', ''), mmss(sum(words(t) for t in notes) / WPM * 60)), '']
        md += [t + '\n' for t in notes]
    md += ['## %d. Questions' % (len(days) + 1), '', '“That’s the week. Happy to take any questions.”', '']
    for q in meta.get('questions') or []:
        md += ['**' + q['ask'] + '**', ''] + ['- ' + f for f in q.get('facts', [])] + ['']
    if meta.get('sourcing'):
        md += ['## Sources', ''] + ['- ' + s for s in meta['sourcing']] + ['']
    io.open(path, 'w', encoding='utf-8', newline='\n').write('\n'.join(md))


if __name__ == '__main__':
    data = json.load(io.open(os.path.join(HERE, 'week.json'), encoding='utf-8'))
    out, total, per = build(data)
    print('script: %s - %d words, about %s spoken' % (out, total, mmss(total / WPM * 60)))
    for label, w in per: print('  %-10s %3d words  %s' % (label, w, mmss(w / WPM * 60)))
