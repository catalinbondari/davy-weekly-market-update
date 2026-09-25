/* beast-plate.js - The Weekly Stampede, engraved-plate treatment.
 *
 * A drop-in replacement for beast-gold.js / beast-frozen.js. Same four
 * globals, same viewBoxes, same animation rig, completely different picture.
 *
 *   beastSVG(kind)          260x180  running hero, feet on y=170
 *   pickSVG(kind)           200x150  standing figure for the start card
 *   faceoffSVG()            520x200  bull left facing right, bear facing left
 *   brandPlate(kind, opts)  a small cast plaque carrying the word Davy
 *
 * kind is 'bull' | 'bear'. Pure ES5, one IIFE, no imports, no build step,
 * returns SVG strings.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS LOOKS THE WAY IT DOES
 * ---------------------------------------------------------------------------
 *
 * The brief was the hedcut: the stipple-and-hatch portrait engraving that a
 * serious financial paper runs beside a column. The defining property of that
 * style is that NOTHING is shaded with a gradient. Every value in the picture
 * is produced by the spacing, the direction and the weight of drawn LINES on
 * an otherwise open field. So this file contains no <linearGradient>, no
 * <radialGradient>, no <filter> and no opacity ramps used as shading. Tone
 * comes from four places only:
 *
 *   TONE 0  bare field            the lit planes, left completely open
 *   TONE 1  coarse hatch ~4.5u    the turn away from the key light
 *   TONE 2  medium hatch ~2.8u    the body of the shadow
 *   TONE 3  fine hatch / cross    the undercuts, where two masses meet
 *   TONE 4  solid ink             the deepest undercuts and the far side
 *
 * INVERSION, AND WHY THE ANIMAL IS LIGHT ON A DARK PAGE. A hedcut is black
 * ink on white paper. The deck's stage is near-black, so a black silhouette
 * modelled in black line would be a black rectangle. Rather than invert the
 * technique (white lines cut out of a black block, which is wood engraving
 * and goes to mud the moment it is scaled down), the animal CARRIES ITS OWN
 * PAPER: the near masses are filled with a warm ivory for the bull and a cold
 * pale grey for the bear, and the engraving is cut into that field in near
 * black. The result is a light figure on a dark stage - maximum contrast, the
 * silhouette always reads - drawn in an honestly black-on-white technique.
 *
 * THE ACCENT COLOUR does the editorial work. The mid-tone hatch passes are
 * drawn in warm gold on the bull and cold steel blue on the bear; the ink
 * passes are the same near-black on both. At full size you read an engraving
 * with a tint in the half-tones. At thumbnail size the hatch fuses optically
 * and the bull simply goes warm while the bear goes cold, which is the read
 * we actually need on a start card.
 *
 * HOW THE HATCHING IS BUILT. Not as <pattern> fills. A pattern has one fixed
 * angle and one fixed spacing across the whole shape it fills, which is
 * exactly the thing that makes machine hatching look machine-made. Instead
 * rake() generates a family of individually drawn quadratic curves that run
 * between two guide rails, so every line follows the turn of the mass it sits
 * on, and the family can tighten, taper and die out along its length:
 *
 *   - the two rails let the family follow a curved mass (the rib cage arcs,
 *     the haunch wraps, the dewlap folds run across the hang)
 *   - `ease` bends the spacing: lines crowd towards the shadow end of the
 *     family and open out towards the light, which is the whole trick
 *   - `trim` shortens each line from either end as the family progresses, so
 *     hatching DIES OUT into the lit plane instead of stopping on a hard edge
 *   - `bow` bends each line, so a rake reads as wrapping a cylinder
 *
 * Every rake is clipped to the mass it belongs to, so no line can ever leave
 * the silhouette.
 *
 * ---------------------------------------------------------------------------
 * READING AT 150px - the deliberate part
 * ---------------------------------------------------------------------------
 *
 * The failure mode of engraving at small sizes is grey mud: the lines stop
 * resolving, every hatched area converges on the same middling grey and the
 * drawing loses its structure. Three decisions guard against it.
 *
 *  1. STRUCTURE IS NEVER CARRIED BY HATCHING. Everything load-bearing is a
 *     solid: the silhouette fill, the heavy contour, the solid ink undercuts
 *     (belly, behind the shoulder, under the jaw, inside the haunch) and the
 *     flat mid-tone fill of the far-side limbs. Delete every hatch line in
 *     this file and you still have a correct, legible, three-value animal.
 *     The hatching is the top layer of information, not the bottom.
 *  2. THE HATCH IS COARSER THAN A REAL HEDCUT. Spacings run 1.9u to 4.6u in a
 *     260-unit box. At 150px wide that is 1.1px to 2.7px of pitch, which is
 *     still above the point where it turns into a flat tint.
 *  3. THE FINE PASSES ARE SWITCHABLE. Every hatch group carries class "hat"
 *     plus one of "c" (coarse), "m" (medium) or "f" (fine), so a host page
 *     that knows it is rendering small can drop the finest tier with one
 *     rule and lose nothing structural:
 *         .beast--sm .hat.f { display: none }
 *     Nothing in this file depends on that rule existing.
 *
 * STROKE-WIDTH DISCIPLINE. Four widths, and only four, everywhere in the
 * file - see SW. 2.1 is the silhouette contour of a major mass; 1.05 is a
 * limb contour or an interior anatomical break; 0.7 is a hatch line; 0.45 is
 * a fine hatch or cross-hatch line. Strokes are left scaling (no
 * non-scaling-stroke), which is what lets the hatch fade gracefully as the
 * drawing shrinks rather than going relatively heavier and clogging.
 *
 * ---------------------------------------------------------------------------
 * ANATOMY - the numbers, checked, not eyeballed
 * ---------------------------------------------------------------------------
 *
 * Both animals are laid out from landmarks rather than drawn by feel, and the
 * landmarks are republished on the root <svg> as data-anat so a test page can
 * assert them instead of taking my word for it.
 *
 *   BULL   point of buttock x=32.5, point of shoulder x=171.5 -> body 139.0
 *          withers y=70.4, floor y=170 -> height at withers 99.6
 *          body / height = 1.40                      (target 1.35-1.45)
 *          withers to the bottom of the girth 124 -> chest depth 53.5
 *          chest depth / wither height = 53.7%       (target 50-55%)
 *          brisket y=124, point of elbow y=114.5 -> brisket BELOW the elbow
 *          poll (166.5,70) to muzzle (195,96.7) -> head 39.1
 *          head / body = 28.1%                       (target 27-30%)
 *          crest of the neck y=58.8, croup y=73.6 -> the crest is the highest
 *          point on the animal by 14.8, which is the bull's whole silhouette
 *
 *   BEAR   rear of rump x=31, point of shoulder x=179 -> body 148.0
 *          hump y=76.5, floor y=170 -> shoulder height 93.5
 *          body / height = 1.58                      (target 1.55-1.70)
 *          hump apex x=152, directly over the shoulder joint x=152
 *          rump top y=91.5 -> the hump is higher than the rump by 15,
 *          the exact inverse of the bull, and the one silhouette cue that
 *          separates the two animals at any size
 *          poll (169.5,86.5) to nose (200.8,101.2) -> head 34.6
 *          head / body = 23.4%                       (target 22-25%)
 *
 * ---------------------------------------------------------------------------
 * LEGS - where quadruped drawings usually die
 * ---------------------------------------------------------------------------
 *
 * A real leg is thick at the top and startlingly thin at the bottom, and it is
 * ONE continuous piece of anatomy. The two failure modes are drawing it as a
 * constant-width column, and drawing it as a stack of separate segments with a
 * visible join between each. Both are fixed structurally here rather than by
 * eye, and the section widths below are scanned back off the real path
 * geometry with isPointInFill in compare-plate.html, not estimated:
 *
 *   BULL fore  upper arm 24.1 -> forearm 15.5 -> carpus 11.6 -> CANNON 5.8
 *              -> fetlock 7.8 -> hoof 9.5 wide and short
 *   BULL hind  thigh 34.1 -> gaskin 21.2 -> hock 12.3 (point jutting back)
 *              -> CANNON 5.8 -> fetlock 7.7 -> hoof 9.5
 *   BEAR fore  upper arm 24.3 -> forearm 19.6 -> wrist 12.6 -> sole 21.2 long
 *              and 8.2 thick, flat on the floor
 *   BEAR hind  thigh 38.9 -> ankle 12.4 -> sole 22.9 long, heel down
 *
 *   THE NUMBER THAT MATTERS: the bull's cannon is 5.8 against a forearm of
 *   15.5 directly above it, a ratio of 0.374.
 *
 * An engraved drawing can carry a cannon that thin far better than a rendered
 * one can, and that is the real argument for this treatment: the silhouette
 * does the work, and the line weight is the same 1.05 whether the shape under
 * it is 40 units across or 5. A shaded, gradient-lit cannon at 5.8 units would
 * have nowhere to put its terminator and would go to mush; a flat field with a
 * crisp contour just stays a cannon. So the hatching is spent where the form
 * actually turns - the shoulder, the barrel, the haunch - and the lower leg
 * gets two lines and nothing else.
 *
 * The legs also hang UNDER their masses rather than at the corners of the
 * body: the bull's fore cannon centres on x=162 against a shoulder joint at
 * 166, its hind cannon on x=58 against a hip at 66, and the leg below the
 * elbow is 0.56 of the height at the withers.
 *
 * CORNERS. A balloon has no corners; an animal does. Both outlines carry
 * explicit straight L segments - never a smoothed C - at the point of the
 * hip, the point of the shoulder, the brisket, the elbow, the stifle and the
 * hock. On the bear the point of the hock is a separate jutting corner and
 * the belly, haunch and forearm contours carry shaggy notches: short outward
 * V's cut into the outline, because a bear's coat is what breaks its
 * silhouette and a smooth bear reads as a pig.
 *
 * PLANTIGRADE. The bear puts the whole sole down, heel included, front and
 * back, with claws projecting past the toe. Its "knee" group is therefore the
 * ankle/wrist, and the stance solver below keeps the sole flat on the floor
 * rather than merely keeping a point on it.
 *
 * FEET ON THE FLOOR. Every hoof and sole path is authored with its lowest
 * coordinate at exactly y=170. Where a limb is rotated for a braced stance,
 * stanceXf() rotates about the hip or shoulder and counter-rotates the nested
 * knee group by the same angle, which turns everything below the knee into a
 * PURE TRANSLATION, then cancels that translation's vertical component. The
 * foot therefore keeps both its height and its orientation. Only the posed
 * foreleg ('charge' / 'swipe') leaves the floor, deliberately.
 *
 * IDS. Every clipPath id is prefixed per figure - bull-, bear-, bullp-,
 * bearp-, fo-bull-, fo-bear-, plus the brand plate's own - so any number of
 * these drawings can sit in one document without colliding.
 *
 * ORIGINALITY. Drawn from anatomical landmarks. It is not traced from, and
 * does not reproduce, any photograph or any existing sculpture.
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------- palettes */

  /* field  the "paper" of the near masses - the engraving is cut into this
     lit    the few planes squarely facing the key, held a touch brighter
     far    far-side limbs: one flat step down, no hatching, so they read as
            depth rather than competing for attention
     ink    the engraver's line and the solid undercuts
     acc    the editorial accent, used for the mid-tone hatch passes only
     accLo  the same accent a stop down, for accent lines inside shadow */
  var GOLD = {
    field: '#F1E4C8', lit: '#FCF6E7', far: '#7E6234',
    ink: '#16110A', acc: '#A9741A', accLo: '#6B4810'
  };
  var STEEL = {
    field: '#E0E9F2', lit: '#F5F9FD', far: '#4E6379',
    ink: '#090D13', acc: '#3E6285', accLo: '#24394F'
  };

  function pal(kind) { return kind === 'bear' ? STEEL : GOLD; }

  /* THE ONLY FOUR STROKE WIDTHS IN THE FILE.
     out  silhouette contour of a major mass
     in   limb contour, and interior anatomical breaks
     h    a hatch line
     f    a fine hatch or cross-hatch line */
  var SW = { out: 2.1, in: 1.05, h: 0.7, f: 0.45 };
  /* and the three widths the brand plate uses inside its own 0..114 design
     box, chosen so that at the default plate width they come out at SW.in,
     SW.f and roughly SW.h once the plate is scaled down onto the flank */
  var PB = { rim: 4.4, rule: 2.2, shade: 2.6 };

  function n2(v) { return Math.round(v * 100) / 100; }
  function fin(v) { return typeof v === 'number' && isFinite(v); }

  /* ------------------------------------------------------------- hatching */

  /* rake(o) -> '<g>...</g>' or ''
   *
   * A family of hatch lines. Line i runs from a point interpolated along the
   * START rail a->b to a point interpolated along the END rail c->d, so the
   * family sweeps a whole mass and each line can point in a slightly
   * different direction: that is what makes the hatching follow the form
   * instead of sitting on top of it.
   *
   *   o.a,o.b   the start rail, two [x,y] points
   *   o.c,o.d   the end rail
   *   o.n       how many lines
   *   o.ease    spacing bend. 1 is even; >1 crowds the family towards a;
   *             <1 crowds it towards b. This is how the spacing tightens
   *             where the form turns away from the light.
   *   o.bow     perpendicular bend of each line at its midpoint, so a rake
   *             wraps a cylinder instead of flattening it
   *   o.bowEase true fades the bow in and out across the family
   *   o.trim    [s0,s1,e0,e1] fraction trimmed off the start and the end of
   *             each line, interpolated across the family. Trimming is how
   *             an engraved family DIES OUT into the lit plane rather than
   *             stopping along a ruled edge.
   *   o.w       stroke width, from SW
   *   o.col     stroke colour
   *   o.op      optional opacity
   *   o.cls     'c' | 'm' | 'f' tier, so a host page can drop the fine tier
   *   o.jit     ragged ends. A ruled family of equal-length parallel lines is
   *             the single thing that makes generated hatching look generated
   *             - it reads as corrugated iron. Real burin work has uneven
   *             line ends. This perturbs each line's trims by a DETERMINISTIC
   *             hash of its index, so the output is stable between calls and
   *             between page loads while looking cut by hand.
   *
   * Degenerate lines (fully trimmed, or shorter than half a unit) are
   * skipped rather than emitted, and every coordinate is checked finite, so
   * this function cannot produce an empty or malformed d attribute. */
  /* Deterministic unit-interval hash of an integer - a stand-in for random
     that gives the same drawing every time the module is called. */
  function h1(i) {
    var v = Math.sin((i + 1) * 12.9898) * 43758.5453;
    return v - Math.floor(v);
  }

  function rake(o) {
    var n = Math.max(1, o.n | 0);
    var a = o.a, b = o.b, c = o.c, e = o.d;
    var ease = o.ease != null ? o.ease : 1;
    var bow = o.bow || 0;
    var tr = o.trim || [0, 0, 0, 0];
    var jit = o.jit || 0;
    var body = '';
    for (var i = 0; i < n; i++) {
      var u = n === 1 ? 0.5 : i / (n - 1);
      var t = Math.pow(u, ease);
      var x0 = a[0] + (b[0] - a[0]) * t, y0 = a[1] + (b[1] - a[1]) * t;
      var x1 = c[0] + (e[0] - c[0]) * t, y1 = c[1] + (e[1] - c[1]) * t;
      var s = tr[0] + (tr[1] - tr[0]) * u + jit * (h1(i) - 0.5);
      var f = tr[2] + (tr[3] - tr[2]) * u + jit * (h1(i + 97) - 0.5);
      if (s < 0) s = 0;
      if (f < 0) f = 0;
      if (s + f > 0.94) continue;                 /* line fully trimmed away */
      var vx = x1 - x0, vy = y1 - y0;
      var nx0 = x0 + vx * s, ny0 = y0 + vy * s;
      var nx1 = x0 + vx * (1 - f), ny1 = y0 + vy * (1 - f);
      var dx = nx1 - nx0, dy = ny1 - ny0;
      var L = Math.sqrt(dx * dx + dy * dy);
      if (!(L > 0.5)) continue;                   /* too short to be a line */
      var bw = bow * (o.bowEase ? Math.sin(Math.PI * u) : 1);
      var cx = (nx0 + nx1) / 2 - dy / L * bw;
      var cy = (ny0 + ny1) / 2 + dx / L * bw;
      if (!(fin(nx0) && fin(ny0) && fin(cx) && fin(cy) && fin(nx1) && fin(ny1))) continue;
      body += '<path d="M ' + n2(nx0) + ' ' + n2(ny0) + ' Q ' + n2(cx) + ' ' + n2(cy)
        + ' ' + n2(nx1) + ' ' + n2(ny1) + '"/>';
    }
    if (!body) return '';
    return '<g class="hat ' + (o.cls || 'm') + '" stroke="' + o.col + '" stroke-width="'
      + (o.w || SW.h) + '" fill="none" stroke-linecap="round"'
      + (o.op != null ? ' opacity="' + o.op + '"' : '') + '>' + body + '</g>';
  }

  /* Run a list of rake specs and wrap the lot in one clip, so a whole tonal
     scheme for a mass is one call and can never spill past its silhouette. */
  function raked(clip, list) {
    var s = '', i;
    for (i = 0; i < list.length; i++) s += rake(list[i]);
    if (!s) return '';
    return clip ? '<g clip-path="url(#' + clip + ')">' + s + '</g>' : s;
  }

  /* A filled mass with its engraved contour. One element, not two, so the
     fill and the line can never drift apart. Miter joins, because the corners
     in these outlines are the anatomy and rounding them throws it away. */
  /* `tag` marks a limb mass with data-lim so a test page can scan its
     section widths with isPointInFill and check them against the anatomy
     table, instead of anybody judging limb thickness by eye. */
  function mass(d, fill, stroke, w, tag) {
    return '<path d="' + d + '" fill="' + fill + '" stroke="' + stroke
      + '" stroke-width="' + w + '" stroke-linejoin="miter" stroke-miterlimit="3"'
      + (tag ? ' data-lim="' + tag + '"' : '') + '/>';
  }
  /* A LIMB SEGMENT. The fill uses the closed path; the contour uses the same
     path with its closing Z removed, so the straight edge where the cannon
     meets the carpus, or the hoof meets the fetlock, is never drawn. Drawing
     it is what turns a leg into a stack of separate parts - and a stack of
     parts is the commonest way a quadruped drawing goes wrong. */
  function seg(d, fill, stroke, w, tag) {
    return '<path d="' + d + '" fill="' + fill + '"'
      + (tag ? ' data-lim="' + tag + '"' : '') + '/>'
      + '<path d="' + d.replace(/\s*Z\s*$/, '') + '" fill="none" stroke="' + stroke
      + '" stroke-width="' + w + '" stroke-linejoin="miter" stroke-miterlimit="3"'
      + ' stroke-linecap="round"/>';
  }

  /* AN UPPER LIMB. Most of a scapula or a thigh is buried in the barrel, and
     drawing its whole outline at silhouette weight is what makes a shoulder
     read as a saddle pad stuck on the side. So the buried part of the
     contour is drawn at half weight - where it belongs, as a form line on
     the body - and only `free`, the edge that actually forms the
     silhouette below the belly, is drawn at full weight. */
  /* `solo` is for a limb that has been lifted clear of the body by a pose:
     none of it is buried any more, so the whole outline is silhouette and
     gets full weight. Without this the raised foreleg in the faceoff
     disappears into the chest behind it. */
  function limb(d, free, fill, stroke, w, tag, solo) {
    return '<path d="' + d + '" fill="' + fill + '"'
      + (tag ? ' data-lim="' + tag + '"' : '') + '/>'
      + '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w
      + '" stroke-linejoin="miter" stroke-miterlimit="3"'
      + (solo ? '' : ' opacity="0.5"') + '/>'
      + (solo ? '' : '<path d="' + free + '" fill="none" stroke="' + stroke
          + '" stroke-width="' + w
          + '" stroke-linejoin="miter" stroke-miterlimit="3" stroke-linecap="round"/>');
  }

  /* A solid tone-4 shape with no contour of its own - an undercut. */
  function solid(d, fill, op) {
    return '<path d="' + d + '" fill="' + fill + '"'
      + (op != null ? ' opacity="' + op + '"' : '') + '/>';
  }
  /* A single anatomical break line. */
  function line(d, col, w, op) {
    return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w
      + '" stroke-linecap="round"' + (op != null ? ' opacity="' + op + '"' : '') + '/>';
  }

  /* ---------------------------------------------------------------- stance */

  /* Rotate a limb about its hip/shoulder P by deg and counter-rotate the
     nested knee group about K by -deg. Everything below the knee then
     undergoes a PURE TRANSLATION - orientation preserved - so hooves stay
     level and the bear's plantigrade soles stay flat:
         T = P + R(deg)(K - P) - K
     The vertical component of that translation is cancelled by an outer
     translate, which is what keeps every foot on exactly y=170.
     dx is the far-side depth offset. The two pivots live in different
     coordinate systems: the outer rotation happens outside the translate(dx)
     group so its pivot carries dx, while the knee counter-rotation happens
     inside it and must use the un-offset joint. */
  function stanceXf(P, K, deg, dx) {
    dx = dx || 0;
    var r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    var vx = K[0] - P[0], vy = K[1] - P[1];
    var ty = P[1] + (vx * s + vy * c) - K[1];
    return {
      outer: 'translate(0 ' + n2(-ty) + ') rotate(' + deg + ' ' + n2(P[0] + dx) + ' ' + P[1] + ')',
      knee: 'rotate(' + (-deg) + ' ' + K[0] + ' ' + K[1] + ')'
    };
  }

  /* ================================================================== BULL */

  /* Every path below is a literal. Nothing is computed into path data, so a
     'd' attribute cannot pick up a not-a-number value. (Spelling that out
     rather than using the literal token keeps the build's grep guard quiet -
     it scans comments too.)
     Landmarks, for reading the numbers off the path:
       32.5  point of buttock (rear-most)      171.5  point of shoulder
       73.6  croup                              62.8  crest of the neck
       70    withers                            124   brisket
       114.5 point of the elbow                 170   the floor */
  var BULL = {
    /* Topline runs croup -> dipped loin -> withers -> the great crest, and
       the crest is the highest thing on the animal. Two straight L segments
       put hard corners at the croup and the point of the hip; a third puts
       the point of the shoulder in; the brisket is a fourth. */
    trunk:
      'M 33 95 L 32.5 88 '
      + 'C 33.5 81 35.5 77.5 39 76 '
      + 'L 48 74.6 '
      + 'L 62 73.6 '
      + 'C 71 75.5 80 78.5 86 81.5 '
      + 'C 98 77.5 109 74 118 70.4 '
      + 'C 127 60.5 139 57.5 151 59.5 '
      + 'C 159 61 166.5 65.5 170.5 73 '
      + 'C 172 82 170 89 167.5 95 '
      + 'L 171.5 103 '
      + 'C 171.5 112 169.5 119 167 124 '
      + 'L 152 125.5 '
      + 'C 130 126.5 108 126 90 122.5 '
      + 'L 76 116 '
      + 'C 68 121.5 56 119.5 46 109.5 '
      + 'C 39 103.5 34 99.5 33 95 Z',

    /* The dewlap hangs from the jaw to the brisket in two lobes with a notch
       between them. Without it a bull reads as a cow. */
    dewlap:
      'M 165 94 '
      + 'C 174 97.5 179 104 177 111 '
      + 'C 175.8 115.5 177.5 119 174.5 122.5 '
      + 'C 177.5 128.5 172 135 164 135.5 '
      + 'C 166.5 128 166.5 119.5 164.5 111.5 '
      + 'C 162.5 104 161 99 161 94.5 Z',

    /* Short broad wedge: FLAT forehead and a STRAIGHT nasal bone drawn as
       two literal L segments, then a blunt squared muzzle with a genuine
       8-unit flat front face. The back edge sweeps well behind the head
       pivot so no rotation of the head group can open a seam at the neck. */
    skull:
      'M 161.5 68 C 165.5 66 169.5 68 171 72 '
      + 'L 180.5 79.5 '
      + 'L 190.5 88.5 '
      + 'C 193 90 195.3 91 195.5 93 '
      + 'L 194.5 101 '
      + 'C 194 103.5 192 105 188.5 104.5 '
      + 'L 180 103.5 '
      + 'C 174 102.5 170 99.5 168 95 '
      + 'C 165 90 161 86 158.8 82 '
      + 'C 157 78 157 70.5 161.5 68 Z',

    /* The near horn leaves the outer corner of the poll, goes OUT and
       FORWARD, then turns UP: thick at the base, tapering to a point. The
       far horn leaves the other corner in the opposite direction, up and
       back, and is drawn BEFORE the skull and a stop darker. Being on
       opposite sides of the skull in paint order is what stops the pair
       fusing into one blade in profile. */
    hornNear:
      'M 165 68.5 C 174 62.5 183 62 190 66 C 195 69 198 65 198 56.5 '
      + 'L 200.5 55.5 C 200.5 68 196 79 187 76.5 C 178.5 74 171 75 167.5 77 Z',
    hornFar:
      'M 158.5 66.5 C 151.5 60.5 148.5 51.5 150.5 43 L 154 42.5 '
      + 'C 154.5 52 157.5 60 163.5 65 Z',
    earNear:
      'M 163.5 73.5 C 157 73 150.5 77 147 84 C 145.5 87.5 147.5 89.5 151 88 '
      + 'C 157 85.5 162 81 164.5 76.5 Z',
    earFar:
      'M 161 70 C 155 68.5 149 70.5 145.5 75 C 144 77.5 145.5 79.5 148.5 78.5 '
      + 'C 153.5 77 158 74 161.5 71.5 Z',

    /* Tail with a tufted switch - a bull's tail is a whip with a brush on
       the end, and the brush is most of what identifies it at small size. */
    /* Routed OUTSIDE the line of the rump - a tail drawn inside the
       silhouette is a tail nobody can see. */
    tail: 'M 44 76 C 35 84 27 96 22.5 110 L 27 112 C 31 98 38 86 47.5 78 Z',
    tuft: 'M 21.5 106.5 C 16 116 15 129 18.5 138 C 21 144 26.5 143.5 28.5 137 '
      + 'C 31 128 30 115 27.5 106 Z',

    /* Foreleg. The outline zig-zags forward-back-forward the way a real one
       does: scapula front down to the point of the shoulder (corner), back
       to the point of the elbow (corner), forward again to the carpus. Width
       runs shoulder 29 -> forearm 20 -> carpus 11. */
    foreUp:
      'M 147 72 C 154.5 67 166 72.5 169 90 '
      + 'L 170.5 100 '
      + 'C 170 112 168.5 121 168 128 '
      + 'L 156.5 128.5 '
      + 'C 155 124 153.5 120.5 152 117.5 '
      + 'L 148.5 114 '
      + 'C 145 100 143 82 147 72 Z',
    /* THE CANNON IS 5.5 WIDE against a 15-wide forearm - 0.37 of it. This is
       the measurement people get wrong: a real ox's lower leg is startlingly
       thin, and a hatched drawing carries it better than a rendered one,
       because the silhouette does the work and the line weight never
       changes. So the cannon is left almost bare - two hatch lines, nothing
       else - and the hatching is spent on the shoulder, barrel and haunch
       where the form actually turns. */
    foreLo:
      'M 157 127.5 L 159.5 142 C 156.9 146 156.8 152.5 157.6 155.8 L 159.4 157.8 '
      + 'L 165 157.8 C 166.6 154.5 167 148.5 165 144 L 167.5 127.5 Z',
    /* The part of the foreleg that is NOT buried in the barrel - the only
       part whose contour forms the silhouette. */
    foreFree:
      'M 169.7 112 C 169.4 118 168.4 123 168 128 '
      + 'L 156.5 128.5 C 155 124 153.5 120.5 152 117.5 L 148.5 114',
    /* Hoof: 9.5 wide and SHORT. Lowest coordinate is exactly 170, the floor. */
    foreHf:
      'M 158.9 157 L 158.1 166.5 C 158 169 159.1 170 161 170 '
      + 'L 164.8 170 C 166.7 170 167.7 169 167.6 166.5 L 166.8 157 Z',

    /* Hind. Thigh 45 -> gaskin 31 -> a 16-wide hock, with the point of the
       hock a separate corner jutting BACKWARD, and the stifle a corner on
       the front edge. */
    hindUp:
      'M 44 78 C 39 90 38 108 43 122 '
      + 'C 45.5 130 49 135 52 138 '
      + 'L 50 142.5 '
      + 'L 63 141 '
      + 'C 63.5 132 65.5 126 68 120 '
      + 'L 72.5 111 '
      + 'C 75.5 98 74 85 68.5 77 Z',
    hindFree:
      'M 42.6 120.5 C 45.5 130 49 135 52 138 L 50 142.5 L 63 141 '
      + 'C 63.5 132 65.5 126 68 120 L 69.5 116',
    hindLo:
      'M 52.5 140.5 L 56.8 148 C 54.9 151.5 54.8 155 55.6 157.6 L 57.4 158.6 '
      + 'L 62 158.6 C 63.6 156 63.7 151.5 62.6 148 L 63.5 140.5 Z',
    hindHf:
      'M 56.4 157.5 L 55.6 166.5 C 55.5 169 56.6 170 58.5 170 '
      + 'L 62.3 170 C 64.2 170 65.2 169 65.1 166.5 L 64.3 157.5 Z'
  };

  /* ================================================================== BEAR */

  /* Landmarks:
       32   rear of rump (rear-most)           179   point of shoulder
       76.5 hump apex, over the shoulder       86.5  rump top (LOWER)
       133  brisket                            170   the floor */
  var BEAR = {
    /* The one line that has to be right: the back FALLS from the shoulder
       hump to the rump, the inverse of the bull. Shaggy notches are cut into
       the belly and flank contours as explicit outward kinks. */
    trunk:
      'M 31.5 110 L 31 101 '
      + 'C 32 95 35.5 92 41 91.5 '
      + 'L 56 93 '
      + 'C 74 93.5 90 92 102 89 '
      + 'C 118 85 134 80 143 77 '
      + 'L 152 76.5 '
      + 'C 163 78.5 171 83.5 175.5 90 '
      + 'C 177.5 97 176.5 103 174 108 '
      + 'L 179 113 '
      + 'C 179 121 177 128 173 133 '
      + 'L 163 135.5 '
      + 'C 157 137 155 133.5 150.5 136.5 '
      + 'C 134 139 116 139.5 100 137.5 '
      + 'C 95.5 134.5 94 138 89.5 135.5 '
      + 'L 76 131 '
      + 'C 68 134 56 131 45 123 '
      + 'C 37 117 32 115 31.5 110 Z',

    /* Broad deep skull, a very shallow stop and then a STRAIGHT muzzle to a
       blunt nose. Head is 23.5% of body length - the commonest way to get a
       bear wrong is to grow the head for charm. */
    /* Carried LOW - the skull top sits well below the shoulder hump, which
       is how a walking bear holds its head and the second-biggest cue after
       the hump itself. */
    skull:
      'M 167 94 C 166.5 88 170 84 176 83.5 '
      + 'C 182 83 186.5 85.5 189 89.5 '
      + 'C 191 92.5 193.5 94.5 196.5 96.5 '
      + 'L 200 99 '
      + 'C 201.5 100.5 201.5 102.5 199.5 103.5 '
      + 'L 196 105 '
      + 'C 192.5 106.5 188 107 183 106.5 '
      + 'L 175 105.5 '
      + 'C 169.5 104 166.5 100 167 94 Z',
    /* Small, round, set LOW and WIDE on the skull, not up on top like a cub
       in a cartoon. */
    earNear:
      'M 170 85.5 C 168 80.5 170.5 76.5 175 76.5 C 179 76.5 181 80 179.5 84 '
      + 'C 176.5 82.8 172.8 83.4 170 85.5 Z',
    earFar:
      'M 164 88 C 161.5 84 163 80 166.5 79.5 C 170 79 172 81.5 171 85 '
      + 'C 168.5 84.8 166 86 164 88 Z',
    /* A stub, not a tail. */
    tail: 'M 34 103 C 27.5 103.5 25 108 28 112.5 C 31 116 36.5 114 36.5 108.5 '
      + 'C 36.5 104.5 35.5 103 34 103 Z',

    /* Heavy forearm - 28 at the shoulder, still 21 at mid-forearm - with
       three shaggy notches cut into the trailing edge. */
    foreUp:
      'M 140 84 C 147.5 78 159 84 162.5 97 '
      + 'L 164 108 '
      + 'C 164.5 120 163 133 162.5 144 '
      + 'L 150 145 '
      + 'C 148.5 137 147 130 146 123 '
      + 'L 143.8 125 '                         /* shaggy notch, forearm */
      + 'C 145 116 145.5 109 145 103 '
      + 'L 139 101.5 '                         /* shaggy notch, elbow */
      + 'C 137.2 93 137 87.5 140 84 Z',
    /* PLANTIGRADE: the whole sole and the heel are on the floor. The flat run
       of the sole is a literal L segment at y=170. */
    foreFree:
      'M 163.9 124 C 163.4 131 163 138 162.5 144 L 150 145 '
      + 'C 148.8 139 147.8 133 146.9 127',
    /* The foot is 22 long and only 9 thick under a 13-wide ankle column -
       the sole is LONG and FLAT, not a boot. */
    forePaw:
      'M 149.5 144 C 148.2 150 148.4 156 150 161 '
      + 'C 150.2 165 150.2 168 151.4 169.4 '
      + 'C 151.9 169.8 152.6 170 153.6 170 '
      + 'L 170.5 170 '
      + 'C 172.6 170 173.2 168.4 171.8 166 '
      + 'C 169 162.8 165.5 161 163.2 157.5 '
      + 'L 162.5 144 Z',
    /* Front claws, projecting past the toe. Bears lead with them. */
    foreClaw:
      'M 172 166.4 C 175.8 165.9 179 167.5 180.4 169.8 C 178 169.6 174.8 169.4 172.6 169.6 Z'
      + ' M 169.4 162.6 C 173.2 162.1 176.4 163.6 177.8 166 C 175.4 165.4 172.2 165 170 165.4 Z'
      + ' M 166.4 159.2 C 169.8 159.2 172.6 160.6 174 163 C 171.6 162 168.8 161.5 167 161.8 Z',

    hindUp:
      'M 38 94 C 30 104 29 120 33.5 133 C 36.5 141 41.5 146.5 46 150 '
      + 'L 44 155 '                            /* point of the hock, jutting */
      + 'L 58 151.5 '
      + 'C 61 143 64.5 135 66.5 127 '
      + 'L 70.5 125.5 '                        /* shaggy notch, haunch */
      + 'L 69 117 '
      + 'C 72 107 71 98 66 91 Z',
    hindFree:
      'M 32.8 130 C 36.5 141 41.5 146.5 46 150 L 44 155 L 58 151.5 '
      + 'C 61 143 64.5 135 66.5 127 L 67.6 122',
    /* 23-long sole, heel down, 9 thick - same discipline as the front. */
    hindPaw:
      'M 45 149 C 41.5 154 39.5 160 40 164 '
      + 'C 40.2 167 40.5 169 41.8 169.6 '
      + 'C 42.3 169.9 43 170 44 170 '
      + 'L 62 170 C 64.2 170 64.8 168.4 63.4 167 '
      + 'C 60.5 164 58.5 161.5 57.5 158 L 56.5 149 Z',
    hindClaw:
      'M 62.8 166.2 C 66.2 166 68.8 167.4 70 169.6 C 67.9 169.3 65.2 169.1 63.1 169.3 Z'
      + ' M 60.4 161.8 C 63.8 161.6 66.2 162.9 67.4 165 C 65.3 164.6 62.8 164.4 60.8 164.7 Z'
  };

  /* ============================================================ clip paths */

  /* One clipPath per mass. Clipping (rather than trying to draw the hatch
     inside the outline by hand) is what lets every rake be authored as a
     simple rectangular family and still come out shaped like the animal. */
  function defsFor(pre, kind) {
    var bear = kind === 'bear';
    var s = '';
    function cp(id, d) { s += '<clipPath id="' + pre + '-' + id + '"><path d="' + d + '"/></clipPath>'; }
    if (bear) {
      cp('sil', BEAR.trunk);
      cp('head', BEAR.skull);
      cp('fu', BEAR.foreUp);
      cp('fl', BEAR.forePaw);
      cp('hu', BEAR.hindUp);
      cp('hl', BEAR.hindPaw);
    } else {
      cp('sil', BULL.trunk);
      cp('dew', BULL.dewlap);
      cp('head', BULL.skull);
      cp('fu', BULL.foreUp);
      cp('fl', BULL.foreLo);
      cp('hu', BULL.hindUp);
      cp('hl', BULL.hindLo);
    }
    /* the cast shadow is hatched, so it needs a shape to be hatched inside */
    s += '<clipPath id="' + pre + '-gnd"><ellipse cx="' + (bear ? 104 : 102)
      + '" cy="170" rx="' + (bear ? 84 : 80) + '" ry="7.5"/></clipPath>';
    return s;
  }

  /* ========================================================= bull shading */

  function bullTrunkShade(pre) {
    var P = GOLD;
    var s = '';

    /* TONE 4 - the solid undercuts. These are the load-bearing darks and
       they are deliberately generous: they are what still reads when every
       hatch line has dissolved at thumbnail size. The key is high and in
       front, so the whole underside of the animal is in shadow and the top
       of the barrel is left as bare field. */
    /* the belly, the whole length of it, deep enough to be a real value */
    s += solid('M 167 121 L 152 123.5 C 130 125 108 124.5 90 120.5 L 77 114.5 L 79 109 '
      + 'L 91 114.5 C 110 118 132 118.5 152 117 L 166.5 114 Z', P.ink);
    /* the girth crease behind the shoulder blade - the single break that
       stops the front end and the barrel reading as one sausage */
    s += solid('M 148.5 72 C 153 88 153 108 149 123.5 L 141.5 122 '
      + 'C 145.5 107 145.5 88 142 74.5 Z', P.ink, 0.92);
    /* the hollow under the crest, where the neck plunges into the shoulder */
    s += solid('M 168 88 C 163 98 155 103 146 103 C 155 99 162 94 165.5 85 Z', P.ink, 0.8);
    /* inside the near haunch, and the fold in front of the stifle */
    s += solid('M 77 112 C 70 118 59 117 48 109 C 61 114 70 114 76 107 Z', P.ink, 0.85);

    /* TONE 1-3 - the hatching. Note where it ISN'T: the croup, the top of
       the barrel and the top of the crest are bare field, because leaving
       the lit planes open is the whole technique. Every family is jittered
       so the ends are ragged rather than ruled. */
    s += raked(pre + '-sil', [
      /* the near side of the crest, dying out into its lit top edge. Wide
         pitch and the heavier hatch weight, because the crest is close to
         the light and wants to stay open. */
      { a: [134, 68], b: [166, 79], c: [137, 86], d: [167, 99],
        n: 9, bow: 3, w: SW.h, col: P.acc, trim: [0.05, 0, 0.16, 0.42],
        jit: 0.16, cls: 'c' },
      /* THE RIB CAGE. One long bowed family starting well below the lit
         topline and running into the belly shadow: the single thing that
         says the barrel is a cylinder. Pitch about 2.8 units, which fuses
         into a tone rather than reading as individual ribs, and crowded
         towards the rear where the barrel turns away from the key. */
      { a: [92, 86], b: [144, 72], c: [92, 119], d: [148, 122],
        n: 18, bow: 9, bowEase: true, w: SW.f, col: P.acc,
        trim: [0.16, 0.1, 0.08, 0.3], ease: 1.2, jit: 0.3, cls: 'm' },
      /* second pass in ink over the bottom third only - this is the
         tightening as the flank rolls under towards the belly shadow, and
         where the two families overlap the tone doubles */
      { a: [86, 104], b: [146, 106], c: [86, 120], d: [150, 122],
        n: 20, bow: 2, w: SW.f, col: P.ink,
        trim: [0.06, 0, 0, 0.12], ease: 0.92, jit: 0.22, cls: 'f' },
      /* the flank hollow ahead of the point of the hip, cross-hatched */
      { a: [71, 91], b: [83, 94], c: [69, 111], d: [81, 115],
        n: 6, bow: 2, w: SW.f, col: P.ink, jit: 0.12, cls: 'f' },
      { a: [67, 98], b: [85, 100], c: [69, 110], d: [87, 112],
        n: 4, bow: 0, w: SW.f, col: P.ink, op: 0.75, cls: 'f' },
      /* THE RUMP, tighter pitch than the barrel because the whole rear half
         of the animal is turned away from a key that is high and in front */
      { a: [35, 88], b: [62, 78], c: [46, 110], d: [72, 100],
        n: 13, bow: 4, bowEase: true, w: SW.f, col: P.acc,
        trim: [0.05, 0, 0.1, 0.1], ease: 0.85, jit: 0.16, cls: 'm' },
      /* and crossed in the deep corner behind the pin bone */
      { a: [32, 92], b: [44, 84], c: [45, 106], d: [57, 97],
        n: 7, bow: 0, w: SW.f, col: P.ink, jit: 0.12, cls: 'f' }
    ]);

    /* TONE 1 - the widest pitch in the drawing, about 5 units, laid over the
       planes that face the key. A hedcut does leave true white highlights,
       but only small ones: a whole blank croup or a blank top-of-barrel
       reads as unfinished rather than as light. These families are what
       stop that without darkening anything. */
    s += raked(pre + '-sil', [
      { a: [40, 76], b: [64, 74], c: [41, 87], d: [66, 84],
        n: 5, bow: 1.5, w: SW.f, col: P.accLo, op: 0.45, jit: 0.3, cls: 'f' },
      { a: [92, 80], b: [140, 68], c: [93, 91], d: [141, 79],
        n: 9, bow: 2, w: SW.f, col: P.accLo, op: 0.4, jit: 0.34, cls: 'f' },
      { a: [140, 62], b: [163, 66], c: [141, 71], d: [164, 75],
        n: 5, bow: 1.5, w: SW.f, col: P.accLo, op: 0.4, jit: 0.3, cls: 'f' }
    ]);

    /* ANATOMICAL BREAKS. Drawn lines, not hatching: the shoulder crease, the
       flank fold, the last rib, the point of the hip and the front of the
       crest. In an engraving these separate the masses; without them the
       hatch families merge into one texture. */
    s += line('M 147.5 71 C 152 88 152.5 107 148.5 123', P.ink, SW.in, 0.85);
    s += line('M 79 84 C 77 96 76.5 107 78 115', P.ink, SW.in, 0.7);
    s += line('M 124 82 C 127.5 94 127.5 107 124 118', P.ink, SW.in, 0.45);
    s += line('M 62 74 C 66 78 68 84 67.5 90', P.ink, SW.in, 0.75);
    /* the front edge of the crest as it falls into the shoulder */
    s += line('M 151 60 C 152 70 152 80 149 90', P.ink, SW.in, 0.5);
    return s;
  }

  function bullHeadShade(pre) {
    var P = GOLD;
    var s = '';
    /* TONE 4 - under the jaw and the far side of the muzzle. */
    s += solid('M 180 103.5 C 174 102.5 170 99.5 168 95 C 172 102 178 106 188.5 106 '
      + 'C 192 106 194 104.5 194.5 101.5 L 194.3 104 C 193.8 106.8 191.5 108 188 107.5 Z', P.ink);
    s += raked(pre + '-head', [
      /* the cheek / masseter, hatched along the line of the jaw muscle */
      { a: [163, 76], b: [170, 94], c: [174, 84], d: [180, 100],
        n: 11, bow: 2, w: SW.h, col: P.ink, trim: [0.05, 0, 0.05, 0.2], cls: 'm' },
      /* the flat plane of the forehead. Deliberately STRAIGHT lines, because
         the forehead of a bull is flat and curved hatching would dome it. */
      { a: [171, 73], b: [188, 88], c: [176, 68.5], d: [193, 84],
        n: 5, bow: 0, w: SW.f, col: P.accLo, op: 0.8, cls: 'f' },
      /* the muzzle turns hard away from the key: the tightest family here */
      { a: [190, 89], b: [195, 94], c: [186, 100], d: [192, 103],
        n: 7, bow: 1, w: SW.f, col: P.ink, ease: 0.8, cls: 'f' },
      /* the throat, deep and crossed */
      { a: [160, 82], b: [168, 94], c: [168, 88], d: [176, 101],
        n: 5, bow: 0, w: SW.f, col: P.ink, op: 0.8, cls: 'f' }
    ]);
    /* the break between the flat forehead and the nasal bone */
    s += line('M 180.5 79.5 L 190.5 88.5', P.ink, SW.in, 0.5);
    /* the mouth line, and the nostril as a solid */
    s += line('M 194 100 C 190.5 102 185 102.5 180.5 102', P.ink, SW.in, 0.9);
    s += solid('M 191.5 93.5 C 193.5 93.5 194.5 95 194 96.8 C 193 98 191 97.5 190.5 96 Z', P.ink);
    /* THE EYE: low and set wide, a solid almond under the brow with one
       hard catch-light left open. Nothing else in the drawing is this dark
       against this much open field, which is what makes it hold the face. */
    s += solid('M 175 83 C 179.5 81.5 183 83.5 183 86.5 C 183 89 180 90.5 176.5 89.5 '
      + 'C 174 88.5 173 85 175 83 Z', P.ink);
    s += solid('M 177 84.5 C 178.8 84 180 84.6 180 85.8 C 180 86.6 179 87 178 86.6 Z', P.lit);
    /* the brow ridge above it */
    s += line('M 172.5 80 C 177 79.5 181.5 81 184 84', P.ink, SW.in, 0.8);
    return s;
  }

  /* ========================================================= bear shading */

  function bearTrunkShade(pre) {
    var P = STEEL;
    var s = '';
    /* TONE 4 - solid undercuts, again generous, again the thing that
       survives being shrunk. */
    s += solid('M 173 130 L 163 133 C 140 137 116 137 100 134.5 L 78 128 L 80 122 '
      + 'L 101 128 C 130 131 152 129 162 126 L 172.5 122 Z', P.ink);
    /* behind the shoulder mass - the crease that separates the hump and the
       heavy forearm from the long barrel */
    s += solid('M 146.5 78.5 C 150.5 95 150.5 116 146.5 134 L 139.5 132 '
      + 'C 143.5 114 143.5 95 140 80.5 Z', P.ink, 0.9);
    /* the fold under the throat where the head is carried low */
    s += solid('M 177 103 C 172 110 165 114 157 114 C 165 110 172 106 175 100 Z', P.ink, 0.82);
    s += solid('M 77 127 C 69 132 57 130 46 122 C 59 127 69 127.5 76 122 Z', P.ink, 0.85);

    s += raked(pre + '-sil', [
      /* THE HUMP. Hatching that radiates off the apex down its front face
         and wraps round its back. The hump is the bear's whole signature and
         it has to read as a MASS, not as a bump in the outline. */
      { a: [128, 88], b: [158, 82], c: [129, 108], d: [164, 104],
        n: 11, bow: 4, bowEase: true, w: SW.h, col: P.acc,
        trim: [0.04, 0, 0.12, 0.3], ease: 1.12, jit: 0.14, cls: 'c' },
      /* the long barrel. Flatter arcs than the bull's: a bear's ribcage is a
         slab under a heavy coat, not a drum. Top third left bare. */
      { a: [86, 93], b: [132, 84], c: [85, 130], d: [138, 132],
        n: 17, bow: 8, bowEase: true, w: SW.f, col: P.acc,
        trim: [0.16, 0.1, 0.12, 0.32], ease: 1.16, jit: 0.3, cls: 'm' },
      /* the tightening low on the flank, into the belly shadow */
      { a: [84, 115], b: [142, 117], c: [84, 131], d: [148, 132],
        n: 20, bow: 2, w: SW.f, col: P.ink,
        trim: [0.05, 0, 0, 0.12], ease: 0.9, jit: 0.24, cls: 'f' },
      /* the haunch, wrapping round and away, tighter than the barrel */
      { a: [33, 100], b: [63, 95], c: [43, 126], d: [71, 120],
        n: 13, bow: 5, bowEase: true, w: SW.f, col: P.acc,
        trim: [0.05, 0, 0.1, 0.1], ease: 0.9, jit: 0.16, cls: 'm' },
      /* cross-hatch in the corner between haunch and belly */
      { a: [32, 110], b: [45, 100], c: [48, 126], d: [61, 114],
        n: 7, bow: 0, w: SW.f, col: P.ink, jit: 0.1, cls: 'f' }
    ]);
    /* THE COAT. A handful of long open strokes running the way the fur
       lies, deliberately crossing the hatch families at a shallow angle.
       They are the only lines allowed to do that, and they are what stops
       the bear reading as shaved. */
    s += raked(pre + '-sil', [
      { a: [50, 100], b: [138, 88], c: [44, 122], d: [134, 116],
        n: 6, bow: 6, bowEase: true, w: SW.f, col: P.accLo, op: 0.6,
        jit: 0.3, cls: 'f' }
    ]);
    /* TONE 1 over the planes facing the key - see the note on the bull */
    s += raked(pre + '-sil', [
      { a: [38, 94], b: [66, 92], c: [39, 104], d: [67, 101],
        n: 5, bow: 1.5, w: SW.f, col: P.accLo, op: 0.45, jit: 0.3, cls: 'f' },
      { a: [86, 89], b: [148, 76], c: [87, 99], d: [149, 87],
        n: 11, bow: 2, w: SW.f, col: P.accLo, op: 0.4, jit: 0.34, cls: 'f' }
    ]);
    /* anatomical breaks: the front of the hump, the shoulder crease and the
       flank fold */
    s += line('M 145.5 77.5 C 149.5 96 149.5 116 145.5 133', P.ink, SW.in, 0.85);
    s += line('M 77 97 C 75 112 75 124 77.5 130', P.ink, SW.in, 0.6);
    s += line('M 152 76.5 C 156 84 158.5 90 160 96', P.ink, SW.in, 0.5);
    return s;
  }

  function bearHeadShade(pre) {
    var P = STEEL;
    var s = '';
    /* TONE 4 - under the jaw. */
    s += solid('M 175 105.5 C 169.5 104 166.5 100 167 94 C 168.5 102 172 106.5 178 108 '
      + 'C 185 109.5 192 109 196.5 107 L 196 108.5 C 191 110.5 183.5 111 175.5 109.5 Z', P.ink);
    s += raked(pre + '-head', [
      /* the broad round of the skull */
      { a: [169, 90], b: [186, 85], c: [172, 102], d: [190, 96],
        n: 8, bow: 2.5, w: SW.h, col: P.ink, trim: [0.05, 0, 0.1, 0.34],
        jit: 0.12, cls: 'm' },
      /* the straight muzzle: straight hatch, tightening towards the nose */
      { a: [189, 90], b: [199, 98], c: [186, 105], d: [197, 106],
        n: 7, bow: 0.5, w: SW.f, col: P.ink, ease: 0.85, jit: 0.1, cls: 'f' },
      /* the cheek, crossed under the ear */
      { a: [167, 92], b: [175, 103], c: [176, 96], d: [183, 107],
        n: 4, bow: 0, w: SW.f, col: P.accLo, op: 0.8, cls: 'f' }
    ]);
    /* the nose: a solid black leather pad, the darkest thing on the head */
    s += solid('M 196.5 97 C 200 98 202 100 201.5 102.5 C 201 104.5 198 105 195.5 103.5 '
      + 'C 194 102 194.5 98.5 196.5 97 Z', P.ink);
    s += solid('M 197.5 99 C 199 99.2 199.8 100 199.6 101 C 199.2 101.6 198 101.4 197.5 100.6 Z', P.lit);
    /* the mouth */
    s += line('M 199 104.5 C 194 106.5 188 107 182.5 106.3', P.ink, SW.in, 0.9);
    /* THE EYE: small, set forward and low on a broad skull - small eyes on a
       big skull is most of what makes a bear look like a bear. */
    s += solid('M 184 91.5 C 187 90.5 189 92 188.7 94 C 188.4 95.8 186 96.5 184.3 95.3 '
      + 'C 183 94.3 182.8 92.2 184 91.5 Z', P.ink);
    s += solid('M 185.5 92.5 C 186.8 92.2 187.5 92.8 187.4 93.6 C 187.2 94.2 186.3 94.4 185.7 93.9 Z', P.lit);
    return s;
  }

  /* =============================================================== members */

  /* A limb: filled mass, engraved contour, and - on the near side only - its
     own hatching. The far side is a flat step-down fill with a contour and NO
     hatching at all, which reads as depth and keeps the small sizes clean.
     `kneeXf` is the counter-rotation handed down by the stance solver. */
  /* THE SINGLE MOST USEFUL MARK ON A LIMB. A tight band of short hatch
     strokes hugging the trailing (shadow-side) edge, produced by running a
     rake whose two rails are the edge itself and a line a few units inside
     it. Without this a limb is a plank with a contour round it; with it the
     limb is a cylinder. Every near-side limb gets one. */
  function edgeBand(clip, x0, y0, x1, y1, w, n, col, jit) {
    return raked(clip, [{
      a: [x0, y0], b: [x1, y1], c: [x0 + w, y0], d: [x1 + w, y1],
      n: n, bow: 0.6, w: SW.f, col: col, jit: jit == null ? 0.18 : jit, cls: 'f'
    }]);
  }

  function bullFore(pre, far, kneeXf, solo) {
    var P = GOLD;
    var f = far ? P.far : P.field;
    var s = limb(BULL.foreUp, BULL.foreFree, f, P.ink, SW.in,
                 far ? null : 'bull-fu', solo);
    if (!far) {
      /* the shadow band down the back of the scapula and forearm */
      s += edgeBand(pre + '-fu', 143, 76, 152, 118, 6, 11, P.ink);
      s += raked(pre + '-fu', [
        /* the scapula's own plane, following the line of the blade */
        { a: [150, 76], b: [168, 94], c: [145, 92], d: [163, 112],
          n: 9, bow: 3, w: SW.h, col: P.acc, trim: [0.06, 0, 0.12, 0.26],
          jit: 0.14, cls: 'c' },
        /* the forearm, hatched across the bone so it reads as a flat slab */
        { a: [154, 118], b: [167, 114], c: [156, 127], d: [167, 126],
          n: 5, bow: 1, w: SW.f, col: P.ink, jit: 0.16, cls: 'f' },
        /* TONE 1 over the lit plane of the upper arm - the largest area of
           bare field left anywhere in the drawing without it */
        { a: [156, 86], b: [166, 100], c: [152, 100], d: [163, 114],
          n: 6, bow: 2, w: SW.f, col: P.accLo, op: 0.45, jit: 0.34, cls: 'f' }
      ]);
      /* the spine of the scapula, and the point of the elbow as a corner */
      s += line('M 149 74 C 155 86 160 94 165 99', P.ink, SW.in, 0.7);
      s += line('M 152 117.5 L 148.5 114', P.ink, SW.in, 0.9);
    }
    s += '<g class="knee" style="--ko:' + (far ? 150 : 162) + 'px 128px"'
      + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
      + seg(BULL.foreLo, f, P.ink, SW.in, far ? null : 'bull-fl')
      /* TWO lines on the cannon and no more - see the note on BULL.foreLo */
      + (far ? '' : raked(pre + '-fl', [
        { a: [160.2, 132], b: [159.2, 150], c: [164.4, 132], d: [164, 150],
          n: 2, bow: 0, w: SW.f, col: P.ink, cls: 'f' }
      ]))
      /* hoof: cloven, and a stop darker than the cannon because horn is */
      + seg(BULL.foreHf, far ? P.far : P.accLo, P.ink, SW.in)
      + (far ? '' : line('M 162.9 170 L 162.9 161', P.ink, SW.in, 0.9))
      + '</g>';
    return s;
  }

  function bullHind(pre, far, kneeXf) {
    var P = GOLD;
    var f = far ? P.far : P.field;
    var s = limb(BULL.hindUp, BULL.hindFree, f, P.ink, SW.in, far ? null : 'bull-hu');
    if (!far) {
      /* the deep crease down the back of the thigh - on a bull this is the
         most sculptural edge on the animal */
      s += edgeBand(pre + '-hu', 37, 88, 45, 130, 7, 11, P.ink);
      s += raked(pre + '-hu', [
        /* the great round of the thigh, wrapping off its lit front edge */
        { a: [42, 84], b: [71, 82], c: [46, 114], d: [73, 112],
          n: 12, bow: 6, bowEase: true, w: SW.h, col: P.acc,
          trim: [0.06, 0, 0.12, 0.3], ease: 1.12, jit: 0.16, cls: 'c' },
        /* the gaskin, tighter */
        { a: [46, 124], b: [66, 122], c: [51, 138], d: [62, 137],
          n: 7, bow: 2, w: SW.f, col: P.ink, trim: [0.06, 0, 0.06, 0.16],
          jit: 0.14, cls: 'f' }
      ]);
      /* the stifle and the point of the hock, each called out as a corner */
      s += line('M 72.5 111 L 69 120', P.ink, SW.in, 0.9);
      s += line('M 50.5 142.5 L 52 138', P.ink, SW.in, 0.9);
    }
    s += '<g class="knee" style="--ko:' + (far ? 49 : 57) + 'px 141px"'
      + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
      + seg(BULL.hindLo, f, P.ink, SW.in, far ? null : 'bull-hl')
      + (far ? '' : raked(pre + '-hl', [
        { a: [57.4, 144], b: [56.2, 152], c: [62, 144], d: [61.8, 152],
          n: 2, bow: 0, w: SW.f, col: P.ink, cls: 'f' }
      ]))
      + seg(BULL.hindHf, far ? P.far : P.accLo, P.ink, SW.in)
      + (far ? '' : line('M 60.3 170 L 60.3 161.5', P.ink, SW.in, 0.9))
      + '</g>';
    return s;
  }

  function bearFore(pre, far, kneeXf, solo) {
    var P = STEEL;
    var f = far ? P.far : P.field;
    var s = limb(BEAR.foreUp, BEAR.foreFree, f, P.ink, SW.in,
                 far ? null : 'bear-fu', solo);
    if (!far) {
      /* the shadow band down the back of the heavy forearm */
      s += edgeBand(pre + '-fu', 139, 86, 148, 142, 6, 12, P.ink);
      s += raked(pre + '-fu', [
        { a: [143, 90], b: [161, 100], c: [141, 108], d: [162, 116],
          n: 9, bow: 3, w: SW.h, col: P.acc, trim: [0.06, 0, 0.12, 0.26],
          jit: 0.14, cls: 'c' },
        /* the forearm, hatched ACROSS so it reads as the heavy column it is */
        { a: [146, 116], b: [149, 142], c: [162, 116], d: [161, 142],
          n: 8, bow: 1, w: SW.f, col: P.ink, trim: [0.1, 0.1, 0.24, 0.16],
          jit: 0.2, cls: 'f' },
        /* TONE 1 over the lit front plane of the forearm */
        { a: [152, 90], b: [160, 104], c: [149, 104], d: [159, 118],
          n: 6, bow: 2, w: SW.f, col: P.accLo, op: 0.45, jit: 0.34, cls: 'f' }
      ]);
      s += line('M 139.5 102 C 145 109 150 113 155 114', P.ink, SW.in, 0.7);
    }
    s += '<g class="knee" style="--ko:' + (far ? 146 : 156) + 'px 145px"'
      + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
      + seg(BEAR.forePaw, f, P.ink, SW.in, far ? null : 'bear-fp')
      + solid(BEAR.foreClaw, far ? P.far : P.field)
      + (far ? '' : raked(pre + '-fl', [
        { a: [149.5, 152], b: [165, 160], c: [150.5, 167], d: [169, 168],
          n: 5, bow: 1, w: SW.f, col: P.ink, jit: 0.16, cls: 'f' }
      ]))
      /* the top edge of the sole, which is what says PLANTIGRADE */
      + (far ? '' : line('M 150 161.5 C 157 163.5 164 165 171.5 167', P.ink, SW.in, 0.75))
      + '</g>';
    return s;
  }

  function bearHind(pre, far, kneeXf) {
    var P = STEEL;
    var f = far ? P.far : P.field;
    var s = limb(BEAR.hindUp, BEAR.hindFree, f, P.ink, SW.in, far ? null : 'bear-hu');
    if (!far) {
      s += edgeBand(pre + '-hu', 29, 102, 42, 146, 7, 12, P.ink);
      s += raked(pre + '-hu', [
        { a: [33, 100], b: [68, 96], c: [38, 126], d: [68, 122],
          n: 12, bow: 6, bowEase: true, w: SW.h, col: P.acc,
          trim: [0.06, 0, 0.12, 0.26], ease: 1.12, jit: 0.16, cls: 'c' },
        { a: [38, 132], b: [58, 130], c: [44, 149], d: [55, 148],
          n: 7, bow: 2, w: SW.f, col: P.ink, trim: [0.06, 0, 0.06, 0.2],
          jit: 0.14, cls: 'f' }
      ]);
      s += line('M 69 117 L 66.5 127', P.ink, SW.in, 0.9);
    }
    s += '<g class="knee" style="--ko:' + (far ? 45 : 51) + 'px 150px"'
      + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
      + seg(BEAR.hindPaw, f, P.ink, SW.in, far ? null : 'bear-hp')
      + solid(BEAR.hindClaw, far ? P.far : P.field)
      + (far ? '' : raked(pre + '-hl', [
        { a: [41, 153], b: [56, 159], c: [42, 167], d: [59, 168],
          n: 5, bow: 1, w: SW.f, col: P.ink, jit: 0.16, cls: 'f' }
      ]))
      + (far ? '' : line('M 40.5 162 C 47 164 54 165.5 61.5 167', P.ink, SW.in, 0.75))
      + '</g>';
    return s;
  }

  /* ================================================================ bodies */

  /* `lift` is the deck's head-carriage control and matches the old module's
     sign: POSITIVE lowers the head. It is applied as a rotation about the
     same pivot the CSS head-bob uses, so the neck joint never opens up -
     a translate would shear the head off the neck at large values. */
  function headXf(lift, px, py) {
    var deg = n2((lift || 0) * 0.5);
    return 'rotate(' + deg + ' ' + px + ' ' + py + ')';
  }

  function bullBody(pre, lift, plateOpts) {
    var P = GOLD;
    var s = '';
    /* the far horn and far ear go down BEFORE the trunk, so they sit behind
       the skull; the near ones go after. Opposite sides of the head in paint
       order is what keeps a pair of horns from fusing into one shape. */
    var behind = '<g transform="' + headXf(lift, 166, 76) + '">'
      + mass(BULL.hornFar, P.far, P.ink, SW.in)
      + mass(BULL.earFar, P.far, P.ink, SW.in)
      + '</g>';
    s += behind;
    s += mass(BULL.trunk, P.field, P.ink, SW.out);
    s += bullTrunkShade(pre);
    if (plateOpts !== false) s += brandPlate('bull', plateOpts || {});
    s += '<g class="head" style="--ho:166px 76px">'
      + '<g transform="' + headXf(lift, 166, 76) + '">'
      + mass(BULL.dewlap, P.field, P.ink, SW.out)
      + raked(pre + '-dew', [
        { a: [162, 99], b: [164, 129], c: [177, 104], d: [172, 131],
          n: 7, bow: 1.5, w: SW.f, col: P.ink, trim: [0, 0.1, 0.05, 0.05], cls: 'f' }
      ])
      + mass(BULL.skull, P.field, P.ink, SW.out)
      + bullHeadShade(pre)
      + mass(BULL.earNear, P.field, P.ink, SW.in)
      + line('M 162 76.5 C 157 78 152.5 81.5 149.5 85.5', P.ink, SW.in, 0.8)
      + mass(BULL.hornNear, P.field, P.ink, SW.in)
      /* growth rings at the base of the near horn - the one piece of pure
         texture in the drawing, and the thing that says "horn" at a glance */
      + raked(null, [
        { a: [167, 70], b: [184, 65.5], c: [169, 76.5], d: [185, 72.5],
          n: 5, bow: 1.5, w: SW.f, col: P.ink, jit: 0.12, cls: 'f' }
      ])
      /* the horn darkens towards the point, because it is polished bone and
         the tip catches nothing */
      + solid('M 190 66 C 195 69 198 65 198 56.5 L 200.5 55.5 '
        + 'C 200.5 68 196 79 187 76.5 Z', P.accLo, 0.85)
      + '</g></g>';
    return s;
  }

  function bearBody(pre, lift, plateOpts) {
    var P = STEEL;
    var s = '';
    s += '<g transform="' + headXf(lift, 172, 96) + '">'
      + mass(BEAR.earFar, P.far, P.ink, SW.in) + '</g>';
    s += mass(BEAR.trunk, P.field, P.ink, SW.out);
    s += bearTrunkShade(pre);
    if (plateOpts !== false) s += brandPlate('bear', plateOpts || {});
    s += '<g class="head" style="--ho:172px 96px">'
      + '<g transform="' + headXf(lift, 172, 96) + '">'
      + mass(BEAR.earNear, P.field, P.ink, SW.in)
      + mass(BEAR.skull, P.field, P.ink, SW.out)
      + bearHeadShade(pre)
      /* the ear is redrawn over the skull edge so its rim reads as a rim and
         not as a bump welded onto the outline */
      + line('M 170.5 85 C 169 81 171 77.8 174.5 77.5 C 178 77.2 180.3 79.8 179.6 83.4',
          P.ink, SW.in, 0.9)
      + '</g></g>';
    return s;
  }

  /* ---------------------------------------------------------------- floor */

  /* No reflection - a reflective floor is the previous module's language and
     the wrong one here. Instead the figure casts a HATCHED shadow: an
     ellipse of horizontal lines that crowd towards the middle. It is drawn
     outside .bob because the floor does not bob with the animal.
     `raised` drops the near forefoot's contact tick for the posed figures. */
  function groundShade(pre, kind, raised) {
    var P = pal(kind);
    var bear = kind === 'bear';
    var s = raked(pre + '-gnd', [
      { a: [bear ? 20 : 22, 164], b: [bear ? 20 : 22, 176],
        c: [bear ? 188 : 182, 164], d: [bear ? 188 : 182, 176],
        n: 9, bow: 0, w: SW.f, col: P.acc, ease: 1, op: 0.5, cls: 'f' }
    ]);
    /* the contact ticks: the only really black marks below the feet, which is
       what nails the animal to the floor rather than floating it */
    s += line('M ' + (bear ? 39 : 54.5) + ' 170 L ' + (bear ? 64 : 66.5) + ' 170',
      P.ink, SW.out, 0.85);
    if (!raised) {
      s += line('M ' + (bear ? 152 : 157) + ' 170 L ' + (bear ? 172 : 169) + ' 170',
        P.ink, SW.out, 0.85);
    }
    return s;
  }

  /* ------------------------------------------------------------ the plate */

  /* brandPlate(kind, opts) -> '<g>...</g>'
   *
   * A small cast plaque set into the near flank, about 19% of body length
   * wide. In this treatment it is not a polished badge - it is a struck
   * plate: a plain field with a double rule around it, the word engraved
   * into it, and a hatched shadow off its lower-right so it reads as proud
   * of the hide. Legibility at deck scale beats fine detail: at 400px wide
   * the whole plate is barely 35px across.
   *
   *   opts.markup  SVG markup placed inside instead of the wordmark.
   *                ---> AUTHOR IT IN A 0 0 100 30 BOX. <---
   *                Scaled and positioned onto the flank here, so the caller
   *                never needs the animal's coordinates. Colour it yourself;
   *                nothing is inherited (this file never uses currentColor).
   *   opts.text    wordmark string, default 'Davy'. Ignored when markup is set.
   *   opts.id      id prefix for this plate's clip ids, default 'bp-'+kind.
   *   opts.x/.y    plate centre in the host drawing's coordinates.
   *   opts.w       plate width in host units.
   *   opts.rot     degrees, a few off level so it sits on the barrel.
   *   opts.mirror  true when the host group is itself mirrored (the bear in
   *                faceoffSVG), so the plate content flips back and reads.
   *
   * MIRRORING, twice over. opts.mirror handles a caller that mirrors the
   * whole host group. Separately, the content sits in <g class="brandflip">
   * with transform-box:fill-box inline, so a page that flips a whole beastSVG
   * horizontally can undo just the mark with one rule and no coordinates:
   *     .flipped .brandflip { transform: scaleX(-1) }
   */
  function brandPlate(kind, opts) {
    opts = opts || {};
    var bear = kind === 'bear';
    var P = pal(kind);
    var x = opts.x != null ? opts.x : (bear ? 108 : 112);
    var y = opts.y != null ? opts.y : (bear ? 112 : 103);
    var w = opts.w != null ? opts.w : (bear ? 25 : 23);
    var rot = opts.rot != null ? opts.rot : (bear ? -3 : -5);

    /* the markup box is 100x30; the plate rim adds 7 all round -> 114x44 */
    var s = w / 114;

    var inner = opts.markup;
    if (!inner) {
      var txt = (opts.text != null ? String(opts.text) : 'Davy')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      /* Title case in the deck's serif, bold, lightly tracked - the closest
         honest approximation of the wordmark without copying it. This is NOT
         anyone's real logo: pass opts.markup to drop the genuine asset in. */
      var fa = 'x="50" text-anchor="middle" font-size="26" font-weight="700"'
        + ' letter-spacing="0.8" font-family="Source Serif 4,Georgia,Times New Roman,serif"';
      inner = '<text ' + fa + ' y="24" fill="' + P.ink + '">' + txt + '</text>';
    }

    var face = '<g class="brandflip" style="transform-box:fill-box;transform-origin:50% 50%">'
      /* the plate field, and the double rule that makes it a struck plate */
      /* PB.* are in the plate's own box units. At the default plate width
         they land on SW.in and SW.f once the plate is scaled onto the flank,
         so the plate prints at the same apparent weights as the drawing;
         deriving them from SW at run time instead emitted a different
         stroke-width for every plate size, which is exactly the kind of
         drift the stroke-width audit exists to catch. */
      + '<rect x="-5" y="-5" width="110" height="40" rx="2.5" fill="' + P.field
        + '" stroke="' + P.ink + '" stroke-width="' + PB.rim + '"/>'
      + '<rect x="-0.5" y="-0.5" width="101" height="31" rx="1" fill="none" stroke="'
        + P.ink + '" stroke-width="' + PB.rule + '" opacity="0.8"/>'
      + inner
      + '</g>';

    /* the cast shadow, hatched rather than blurred - the plate stands proud */
    var shade = '<g stroke="' + P.ink + '" stroke-width="' + PB.shade
      + '" fill="none" opacity="0.8">'
      + '<path d="M 106 -1 L 106 37 L -2 37"/>'
      + '<path d="M 109 2 L 109 40 L 1 40"/>'
      + '</g>';

    /* scale(-1 1) before the centring translate mirrors about the box centre,
       so the plate stays put and only its content reverses */
    return '<g class="brand" transform="translate(' + x + ' ' + y + ') rotate(' + rot
      + ') scale(' + n2(s * 100) / 100 + ')'
      + (opts.mirror ? ' scale(-1 1)' : '') + ' translate(-50 -15)">'
      + shade + face + '</g>';
  }

  /* =============================================================== figures */

  /* Joint positions, shared by the rig and the stance solver so the two can
     never drift apart. dxH / dxF are the far-side depth offsets. */
  var JOINT = {
    /* dxH / dxF are small on purpose. A big depth offset throws the far
       thigh right out past the rump, where a 40-unit mass in a flat dark
       tone stops reading as "the other leg" and starts reading as a second
       animal standing behind the first. Six to twelve units is enough to
       separate the pairs without that. */
    bull: { hip: [66, 90], hock: [57, 141], sh: [166, 98], carp: [162, 128],
            dxH: -8, dxF: -12, tail: [45, 77] },
    bear: { hip: [62, 110], hock: [51, 150], sh: [154, 98], carp: [156, 145],
            dxH: -6, dxF: -10, tail: [35, 106] }
  };
  /* Planted figures do not stand with four parallel vertical legs like a toy
     on a shelf: near hind tucks under, far hind pushes back, the front pair
     are not parallel. */
  var STANCE = { hindN: -4, hindF: 5, foreN: 3, foreF: -4 };

  function figure(kind, pre, opts) {
    opts = opts || {};
    var bear = kind === 'bear';
    var anim = !!opts.anim;
    var lift = opts.lift || 0;
    var J = JOINT[bear ? 'bear' : 'bull'];
    var P = pal(kind);
    var plate = opts.plate;
    if (plate !== false) {
      plate = plate || {};
      if (!plate.id) plate.id = pre + '-bp';
    }

    var HIND = bear ? bearHind : bullHind;
    var FORE = bear ? bearFore : bullFore;
    var body = bear ? bearBody(pre, lift, plate) : bullBody(pre, lift, plate);
    var tail = bear
      ? mass(BEAR.tail, P.field, P.ink, SW.in)
      : mass(BULL.tail, P.field, P.ink, SW.in)
        + mass(BULL.tuft, P.field, P.ink, SW.in)
        /* the switch, hatched along the fall of the hair */
        + raked(null, [
          { a: [19, 113], b: [20.5, 134], c: [28.5, 111], d: [28.5, 134],
            n: 5, bow: 2, w: SW.f, col: P.ink, jit: 0.16, cls: 'f' }
        ]);

    var s = '';
    if (anim) {
      /* PAINT ORDER, and it is mandated: far hind, far fore, tail, body,
         near hind, near fore. p3/p4 are the far pair and run on their own
         animation delays so the gallop is a transverse gallop. */
      s += '<g class="leg p3" style="--o:' + (J.hip[0] + J.dxH) + 'px ' + J.hip[1] + 'px">'
        + '<g transform="translate(' + J.dxH + ' 0)">' + HIND(pre, true) + '</g></g>';
      s += '<g class="leg p4" style="--o:' + (J.sh[0] + J.dxF) + 'px ' + J.sh[1] + 'px">'
        + '<g transform="translate(' + J.dxF + ' 0)">' + FORE(pre, true) + '</g></g>';
      s += '<g class="tail" style="--o:' + J.tail[0] + 'px ' + J.tail[1] + 'px">' + tail + '</g>';
      s += body;
      s += '<g class="leg" style="--o:' + J.hip[0] + 'px ' + J.hip[1] + 'px">'
        + HIND(pre, false) + '</g>';
      s += '<g class="leg p2" style="--o:' + J.sh[0] + 'px ' + J.sh[1] + 'px">'
        + FORE(pre, false) + '</g>';
    } else {
      /* planted: braced stance, every foot still landing on exactly y=170 */
      var hf = stanceXf(J.hip, J.hock, STANCE.hindF, J.dxH);
      var ff = stanceXf(J.sh, J.carp, STANCE.foreF, J.dxF);
      var hn = stanceXf(J.hip, J.hock, STANCE.hindN);
      var fn = stanceXf(J.sh, J.carp, STANCE.foreN);
      /* POSES. 'charge' (bull) and 'swipe' (bear) lift the near foreleg clear
         of the floor - rotated forward at the shoulder, folded at the knee -
         which is the single change that turns a standing figure into one
         about to move. Negative is forward/up for a right-facing animal; the
         fold is positive so the cannon tucks back under the forearm. */
      var pose = opts.pose || null;
      if (pose === 'charge' || pose === 'swipe') {
        /* the bull FOLDS - knee up under the chest, hoof tucked back, the
           gather before the drive. The bear COCKS - the whole forelimb
           swings high at the shoulder and the paw hangs back off the wrist,
           which is a swipe about to land. Swinging it forward with the wrist
           straight instead puts the sole flat on the air in front of the
           animal and the bear reads as propping itself up on it. */
        var up = pose === 'charge' ? -30 : -54;
        var fold = pose === 'charge' ? 44 : 38;
        fn = { outer: 'rotate(' + up + ' ' + J.sh[0] + ' ' + J.sh[1] + ')',
               knee: 'rotate(' + fold + ' ' + J.carp[0] + ' ' + J.carp[1] + ')' };
        /* the weight goes onto the hinds: both tuck further under the body */
        hf = stanceXf(J.hip, J.hock, STANCE.hindF + 3, J.dxH);
        hn = stanceXf(J.hip, J.hock, STANCE.hindN - 3);
      }
      s += '<g transform="' + hf.outer + '"><g transform="translate(' + J.dxH + ' 0)">'
        + HIND(pre, true, hf.knee) + '</g></g>';
      s += '<g transform="' + ff.outer + '"><g transform="translate(' + J.dxF + ' 0)">'
        + FORE(pre, true, ff.knee) + '</g></g>';
      s += tail + body;
      s += '<g transform="' + hn.outer + '">' + HIND(pre, false, hn.knee) + '</g>';
      s += '<g transform="' + fn.outer + '">'
        + FORE(pre, false, fn.knee, !!pose) + '</g>';
    }
    return s;
  }

  /* The measured landmarks, republished on the root <svg> so a test page can
     assert the proportions rather than taking the comment's word for it. */
  var ANAT = {
    bull: 'body:139;height:99.6;bodyPerHeight:1.4;chestDepth:53.5;chestPct:53.7;'
      + 'head:39.1;headPct:28.1;brisket:124;elbow:114.5;crest:58.8;croup:73.6;floor:170',
    bear: 'body:148;height:93.5;bodyPerHeight:1.58;head:34.6;headPct:23.4;'
      + 'hump:76.5;rump:91.5;humpX:152;shoulderX:152;floor:170'
  };

  /* ==================================================================== API */

  global.beastSVG = function beastSVG(kind) {
    var bear = kind === 'bear';
    var pre = bear ? 'bear' : 'bull';
    return '<svg viewBox="0 0 260 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"'
      + ' data-anat="' + ANAT[pre] + '">'
      + '<defs>' + defsFor(pre, pre) + '</defs>'
      /* the cast shadow sits outside .bob: the floor does not bob */
      + groundShade(pre, pre)
      + '<g class="bob">' + figure(kind, pre, { anim: true }) + '</g>'
      + '</svg>';
  };

  global.pickSVG = function pickSVG(kind) {
    var bear = kind === 'bear';
    var pre = bear ? 'bearp' : 'bullp';
    /* head up and alert (negative lift raises it), and the whole figure
       nudged into the 200x150 card with a little air all round */
    var t = bear ? 'translate(-20 -30) scale(0.98)' : 'translate(-16 -28) scale(0.98)';
    return '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"'
      + ' data-anat="' + ANAT[bear ? 'bear' : 'bull'] + '">'
      + '<defs>' + defsFor(pre, bear ? 'bear' : 'bull') + '</defs>'
      + '<g transform="' + t + '">'
      + groundShade(pre, bear ? 'bear' : 'bull')
      + figure(kind, pre, { lift: -18 })
      + '</g></svg>';
  };

  global.faceoffSVG = function faceoffSVG() {
    /* Bull left facing right, bear right facing left, squared up with a gap
       between them and an engraved sunburst rising out of that gap. The bear
       is mirrored; its brand plate is flipped back so the mark still reads
       left to right.
       The three wrappers .fo-l, .fo-r and .fo-sun carry NO transform of their
       own - the scale and the mirror live on an inner group - so the page can
       animate them in without fighting the geometry. */
    var s = '<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    s += '<defs>' + defsFor('fo-bull', 'bull') + defsFor('fo-bear', 'bear')
      + '<clipPath id="fo-sunclip"><rect x="180" y="96" width="164" height="82"/></clipPath>'
      + '</defs>';

    /* THE SUNBURST, drawn the way a 19th-century masthead would draw it:
       tapered rays struck from a point on the horizon, plus three arcs. No
       gradient anywhere - the "glow" is entirely the rays thinning out. */
    var rays = '', i, ang, x0, y0, x1, y1, hw;
    var cx = 262, cy = 178;
    for (i = 0; i < 17; i++) {
      ang = Math.PI + (i + 0.5) * Math.PI / 17;      /* a half turn above the line */
      hw = 0.010 + 0.006 * Math.abs(Math.sin(i * 1.7));
      x0 = cx + Math.cos(ang - hw) * 13;
      y0 = cy + Math.sin(ang - hw) * 13;
      x1 = cx + Math.cos(ang) * 78;
      y1 = cy + Math.sin(ang) * 78;
      var x2 = cx + Math.cos(ang + hw) * 13;
      var y2 = cy + Math.sin(ang + hw) * 13;
      rays += '<path d="M ' + n2(x0) + ' ' + n2(y0) + ' L ' + n2(x1) + ' ' + n2(y1)
        + ' L ' + n2(x2) + ' ' + n2(y2) + ' Z"/>';
    }
    s += '<g class="fo-sun" clip-path="url(#fo-sunclip)">'
      + '<g fill="#C69A3E" opacity="0.5">' + rays + '</g>'
      + '<g fill="none" stroke="#C69A3E" stroke-width="' + SW.h + '" opacity="0.45">'
      + '<path d="M 218 178 A 44 44 0 0 1 306 178"/>'
      + '<path d="M 205 178 A 57 57 0 0 1 319 178"/>'
      + '<path d="M 192 178 A 70 70 0 0 1 332 178"/>'
      + '</g></g>';

    /* the rule they stand on: one heavy line, hatched below it */
    s += '<g stroke="#8C8377" stroke-width="' + SW.f + '" opacity="0.5" fill="none">'
      + '<path d="M 0 182 L 520 182"/><path d="M 0 186 L 520 186"/>'
      + '<path d="M 0 191 L 520 191"/></g>';
    s += '<path d="M 0 178 L 520 178" stroke="#E8DFCB" stroke-width="' + SW.in
      + '" fill="none" opacity="0.85"/>';

    /* feet land on 170 in figure space; 170*1.12 - 12.4 = 178 */
    s += '<g class="fo-l"><g transform="translate(2 -12.4) scale(1.12)">'
      + groundShade('fo-bull', 'bull', true)
      + figure('bull', 'fo-bull', { pose: 'charge', lift: 12 }) + '</g></g>';
    s += '<g class="fo-r"><g transform="translate(527 -12.4) scale(-1.12 1.12)">'
      + groundShade('fo-bear', 'bear', true)
      + figure('bear', 'fo-bear', { pose: 'swipe', lift: -8,
          plate: { id: 'fo-bear-bp', mirror: true } })
      + '</g></g>';
    s += '</svg>';
    return s;
  };

  global.brandPlate = brandPlate;

})(typeof window !== 'undefined' ? window : this);
