# -*- coding: utf-8 -*-
"""The one command to run after editing week.json.

    python src/rebuild.py              # validate -> build the deck -> write the script
    python src/rebuild.py --strict     # treat validator warnings as errors
    python src/rebuild.py --no-script  # deck only
    python src/rebuild.py --beast beast-gold.js   # try another animal drawing

Steps, and where each one writes:
  1. validate week.json          (stops here on any error; nothing is written)
  2. build the deck              -> index.html      (open this; works offline)
                                 -> stampede.html   (the artifact/embed form)
  3. write the presenter script  -> Davy-Weekly-Script-<week>.docx, SCRIPT.md

Outputs go to the package root (the folder above src/), or --out DIR.
Standard library only.
"""
import argparse, io, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE) if os.path.basename(HERE) == 'src' else HERE
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True   # no __pycache__ left behind in src/
import validate as V          # noqa: E402
import make_script as MS      # noqa: E402

# The order matters: the brand mark first so everything can use it, the
# week's data last so it can refer to nothing and be replaced wholesale.
PARTS = ['davy-mark.js', 'scenes.js', 'charts.js', '{beast}', 'beast-art.js']


def data_js(data):
    """week.json as a script. JSON is a JavaScript expression already; the two
    replaces stop a "</script>" or a line-separator character inside a string
    from ending the script block early."""
    s = json.dumps(data, ensure_ascii=False, indent=1)
    s = s.replace('</', '<\\/').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    return ('/* the week, generated from src/week.json - edit that file, not this */\n'
            'const WEEK_DATA = ' + s + ';\n'
            'const WEEK = WEEK_DATA.days;\n'
            'const WEEK_META = WEEK_DATA.meta;\n')


def assemble(data, beast):
    tpl = io.open(os.path.join(HERE, 'template.html'), encoding='utf-8').read()
    if tpl.count('<!--INJECT-->') != 1:
        sys.exit('template.html must contain exactly one <!--INJECT--> marker')
    chunks = []
    for p in PARTS:
        name = beast if p == '{beast}' else p
        path = os.path.join(HERE, name)
        if not os.path.exists(path):
            if name == 'beast-art.js': continue          # optional: supplied artwork
            sys.exit('missing src/%s' % name)
        text = io.open(path, encoding='utf-8').read()
        if name == beast and 'NaN' in text:
            print('warning  %s contains the literal NaN - check its path data' % name)
        chunks.append(text)
    chunks.append(data_js(data))
    return tpl.replace('<!--INJECT-->', '\n'.join(chunks))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--strict', action='store_true', help='fail on validator warnings too')
    ap.add_argument('--no-script', action='store_true', help='skip writing the presenter script')
    ap.add_argument('--beast', default='beast-cast.js', help='animal drawing file in src/')
    ap.add_argument('--out', default=ROOT, help='where index.html etc. are written')
    a = ap.parse_args()

    data = V.load(os.path.join(HERE, 'week.json'))
    errors, warnings = V.validate(data)
    for m in errors: print('ERROR    ' + m)
    for m in warnings: print('warning  ' + m)
    if errors or (a.strict and warnings):
        print('\nNot built: fix the %s above in src/week.json and run this again.' %
              ('errors' if errors else 'warnings'))
        sys.exit(1)

    page = assemble(data, a.beast)
    os.makedirs(a.out, exist_ok=True)
    io.open(os.path.join(a.out, 'stampede.html'), 'w', encoding='utf-8', newline='\n').write(page)
    io.open(os.path.join(a.out, 'index.html'), 'w', encoding='utf-8', newline='\n').write(
        '<!doctype html><html><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n'
        + page + '\n</body></html>\n')
    print('deck:   %s  (%d bytes)' % (os.path.join(a.out, 'index.html'), len(page.encode('utf-8'))))

    if not a.no_script:
        out, total, per = MS.build(data, a.out)
        print('script: %s  (%d words, about %s spoken)' % (out, total, MS.mmss(total / MS.WPM * 60)))
    print('OK - %d error(s), %d warning(s)' % (len(errors), len(warnings)))


if __name__ == '__main__':
    main()
