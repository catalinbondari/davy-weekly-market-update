/* davy-mark.js — the official Davy brandmark.
 *
 * Taken from the live mark on davy.ie (the header logo, id="davyLogo"): an
 * 80x80 field in the brand crimson with the lowercase wordmark reversed out
 * of it in white. The paths below are that file's paths, unaltered.
 *
 * WHY IT IS A SEPARATE FILE. Two other files need it — the deck chrome wants
 * it in the masthead and on the start screen, and the animals wear it as a
 * cast plaque — and neither should carry a second, drifting copy of a
 * trademark. Change it here and it changes everywhere.
 *
 * USING IT PROPERLY. The mark is square and stays square: never stretch it to
 * fill a wide plate, never recolour the field, never reflow the letters. The
 * field is the clear space, so it needs no extra padding of its own. If Davy's
 * brand team supplies an approved alternative lockup, replace PATHS and VIEWBOX
 * with theirs and leave the rest alone.
 *
 *   DAVY_MARK.svg(48)                     -> a 48px square mark
 *   DAVY_MARK.svg(48, { title:'Davy' })   -> same, named for screen readers
 *   DAVY_MARK.inner(idPrefix)             -> just the paths, for embedding in
 *                                            another SVG's coordinate space
 *   DAVY_RED                              -> '#B90646', the field colour
 */
(function (global) {
  'use strict';

  var DAVY_RED = '#B90646';

  /* the four letterforms, reversed out of the field */
  var LETTERS = [
    /* y */ 'M75.2548 31.5152C75.186 31.3981 75.0482 31.3292 74.8485 31.3292H72.1419C71.9422 31.3292 71.7218 31.3981 71.522 31.5152C71.3292 31.6323 71.157 31.7907 71.0606 31.9628L66.6873 39.8967L62.3209 31.9628C62.2245 31.7907 62.0524 31.6254 61.8595 31.5152C61.6667 31.405 61.4463 31.3292 61.2397 31.3292H58.5331C58.3333 31.3292 58.1887 31.3981 58.1267 31.5152C58.0579 31.6323 58.0647 31.7907 58.1612 31.9628L64.3802 43.1474C64.4766 43.3196 64.5661 43.5606 64.6281 43.8086C64.6901 44.0565 64.7314 44.3113 64.7314 44.511V48.8499C64.7314 49.0496 64.8141 49.2287 64.9449 49.3664C65.0758 49.4973 65.2617 49.5799 65.4614 49.5799H67.9201C68.1198 49.5799 68.2989 49.4973 68.4366 49.3664C68.5744 49.2356 68.6501 49.0496 68.6501 48.8499V44.511C68.6501 44.3113 68.6915 44.0565 68.7535 43.8086C68.8154 43.5606 68.905 43.3196 69.0014 43.1474L75.2204 31.9628C75.3168 31.7907 75.3237 31.6323 75.2548 31.5152Z',
    /* d */ 'M13.5331 31.3292H8.65703C8.25758 31.3292 7.927 31.6598 7.927 32.0593V48.8568C7.927 49.2562 8.25758 49.5868 8.65703 49.5868H13.5331C19.1736 49.5868 23.1405 45.854 23.1405 40.4615C23.1405 35.0689 19.1391 31.3361 13.5331 31.3361V31.3292ZM13.3471 46.2741H12.4036C12.0041 46.2741 11.6736 45.9435 11.6736 45.5441V35.3513C11.6736 34.9518 12.0041 34.6212 12.4036 34.6212H13.3471C17.4036 34.6212 19.2493 37.0386 19.2493 40.4477C19.2493 43.8568 17.4036 46.2672 13.3471 46.2672V46.2741Z',
    /* a */ 'M40.6061 48.9187L32.8581 31.8251C32.6929 31.4601 32.4931 31.3017 32.3141 31.3017C32.135 31.3017 31.9353 31.4601 31.77 31.8251L24.0221 48.9187C23.8568 49.2838 24.0496 49.5799 24.4491 49.5799H26.8595C27.259 49.5799 27.7204 49.2838 27.8857 48.9187L28.5262 47.5138H36.0951L36.7356 48.9187C36.9008 49.2838 37.3623 49.5799 37.7617 49.5799H40.1722C40.5716 49.5799 40.7645 49.2838 40.5992 48.9187H40.6061ZM29.8829 44.3664L32.3141 38.1267L34.7452 44.3664H29.8829Z',
    /* v */ 'M47.6446 42.5L43.2232 31.9904C43.0579 31.6254 42.5964 31.3292 42.197 31.3292H39.7865C39.3871 31.3292 39.1942 31.6254 39.3595 31.9904L47.1075 49.084C47.2727 49.4491 47.4725 49.6075 47.6515 49.6075C47.8306 49.6075 48.0303 49.4491 48.1956 49.084L55.9435 31.9904C56.1088 31.6254 55.916 31.3292 55.5165 31.3292H53.1061C52.7066 31.3292 52.2452 31.6254 52.0799 31.9904L47.6584 42.5H47.6446Z'
  ];

  var FIELD = 'M80 0H0V80H80V0Z';

  /* The letters only, in the mark's own 0 0 80 80 space. `letterFill` exists
     so a cast-metal version of the plaque can stamp the wordmark in something
     other than flat white without touching the paths. */
  function inner(opts) {
    opts = opts || {};
    var field = opts.field === false ? '' :
      '<path d="' + FIELD + '" fill="' + (opts.fieldFill || DAVY_RED) + '"/>';
    var fill = opts.letterFill || '#FFFFFF';
    var letters = LETTERS.map(function (d) {
      return '<path d="' + d + '" fill="' + fill + '"/>';
    }).join('');
    return field + letters;
  }

  function svg(size, opts) {
    opts = opts || {};
    var px = size || 80;
    var title = opts.title;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="' + px +
      '" height="' + px + '"' +
      (title ? ' role="img" aria-label="' + title + '"' : ' aria-hidden="true"') +
      '>' + inner(opts) + '</svg>';
  }

  global.DAVY_RED = DAVY_RED;
  global.DAVY_MARK = { viewBox: '0 0 80 80', red: DAVY_RED, field: FIELD,
                       letters: LETTERS, inner: inner, svg: svg };

})(typeof window !== 'undefined' ? window : this);
