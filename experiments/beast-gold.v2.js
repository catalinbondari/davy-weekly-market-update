/* beast-gold.js - The Weekly Stampede, polished-metal treatment.
 *
 * Four globals:
 *   beastSVG(kind)          260x180  running hero, animation hooks
 *   pickSVG(kind)           200x150  standing square + alert, start-screen card
 *   faceoffSVG()            520x200  gold bull vs steel bear, title screen
 *   brandPlate(kind, opts)  a cast brand plaque, also used by the three above
 * kind is 'bull' | 'bear'.
 *
 * THE LOOK. Each animal is a cast and buffed metal statue, not a silhouette
 * and not a flat fill. The bull is warm yellow gold; the bear is cold gunmetal
 * steel and is deliberately several stops darker, so the pair reads as
 * gold-versus-iron before you have identified either animal.
 *
 * WHAT SELLS METAL, and where each trick lives:
 *
 *  - A NARROW TERMINATOR. The master RAMP runs bright top plane -> mid ->
 *    shadow across only 7% of the mass height, at offsets 0.42 to 0.49. A
 *    wide soft ramp reads as matte plastic; a hard short one reads as a
 *    polished curve.
 *  - SEVERAL DISTINCT SPECULAR HITS rather than one soft gradient. Each mass
 *    gets its own crisp lens-shaped sliver on the plane facing the key, with
 *    a hotter, thinner core inside the biggest of them. On both animals the
 *    topline is deliberately broken into THREE separate hits - rump, loin,
 *    withers/hump - because one continuous highlight down the back is exactly
 *    what makes a quadruped read as an inflated balloon.
 *  - A REFLECTED-LIGHT BAND low on the belly and haunch, bouncing off the
 *    floor: the RAMP stop at 0.88, plus the explicit '-bnc' bands.
 *  - NEAR-BLACK UNDERCUTS where masses overlap - behind the shoulder, under
 *    the belly, under the jaw, between the haunches: the '-crs' gradient.
 *
 * WHY THE LIMB GRADIENTS ARE IN ABSOLUTE Y. The obvious approach - give every
 * mass an objectBoundingBox gradient - makes each limb run its own full
 * bright-to-dark ramp over its own height. Where the limb is buried in the
 * body the two ramps then disagree, and the animal comes apart into a barrel
 * with four sausages stuck on it. So the trunk and the limbs share ONE
 * lighting frame in user space ('-mass' over the trunk's y-span, '-limb' over
 * the same span continued down to the floor, see limbStops). At any given
 * height the buried part of a limb is exactly the value the trunk is, so the
 * seam disappears and the whole thing reads as a single casting. The masses
 * that genuinely do turn away on their own - neck, head, muzzle, horns, ears,
 * dewlap - keep their own raked objectBoundingBox gradient.
 *
 * ANATOMY. Measured landmarks, not eyeballed - head size and limb shape are
 * what sank the earlier attempts. Three rules the drawing has to keep:
 *
 *  1. LIMBS CHANGE SECTION ALONG THEIR LENGTH, and every joint is WIDER than
 *     the shafts above and below it. A tube of constant width reads as
 *     furniture. Bull foreleg: shoulder 28 -> forearm 19 -> carpus knob 13 ->
 *     cannon 9 -> fetlock knob 14 -> hoof 14. Bull hind: thigh 42 -> gaskin
 *     26 -> hock knob 16, with the point of the hock jutting BACKWARD ->
 *     cannon 10 -> fetlock 13 -> hoof 14. Bear fore: 28 -> 21 -> wrist 17 ->
 *     paw 27. Bear hind: thigh 48 -> ankle 16 -> plantigrade sole 30.
 *  2. THE CONTOUR IS INTERRUPTED. A real outline breaks at the point of the
 *     hip, the point of the shoulder, the brisket, the elbow and the stifle;
 *     a balloon's does not. Those breaks are cut into the trunk path as
 *     explicit L segments, not smoothed over with another C.
 *  3. HEADS DO NOT GROW FOR CHARM. Both are checked against a third of body
 *     length every time they are touched.
 *
 *   Bull  body length 130 (buttock x=44 to shoulder point x=174), height at
 *         withers 105 (y=65 to floor 170). Head poll (172,78) to muzzle
 *         (203,108) = 43, which is 0.33 of body length. Topline: rump 70,
 *         loin 79, withers 65 - withers above rump, loin dipped between.
 *         Broad blunt squared muzzle with a 16-unit flat front face, deep
 *         jaw, heavy neck crest, dewlap, cloven hooves. Two horns leave the
 *         poll BEHIND the ears in opposite directions: the far one up and
 *         back, drawn before the skull, thinner and dimmer; the near one
 *         heavier, up and forward, drawn after it. Being on opposite sides of
 *         the skull in paint order is what stops them fusing into one blade.
 *   Bear  body length 124, height at the hump 92, so 1.35 long. Head is a
 *         deep round SKULL (30 x 37) with a distinctly narrower snout hung
 *         off it, total 44 = 0.35 of body length. The 11-unit step down from
 *         skull-top to snout-top is the concave stop. Rump 70 sits just above
 *         the shoulder hump 76, back dipped to 91 between them. Belly 133
 *         against floor 170: short legs. Rear feet are flat plantigrade soles
 *         30 long. Small round ears set well back behind the eye, long front
 *         claws, head carried low.
 *
 * STANCE. Planted figures do not stand with four parallel vertical legs like
 * a toy on a shelf. Each limb is rotated a few degrees about its own hip or
 * shoulder and the nested knee group counter-rotates by the same amount, so
 * the foot keeps its orientation - hooves stay level, and the bear's
 * plantigrade soles stay FLAT on the floor - while translating fore or aft.
 * stanceXf() works out the resulting offset in closed form and cancels its
 * vertical component, so every foot still lands on exactly y=170. Near hind
 * tucks under the body, far hind pushes back, the front pair are not
 * parallel.
 *
 * BRAND PLATE. brandPlate() casts a raised plaque into the near flank behind
 * the shoulder at ~19% of body length. Dark and recessed on the gold bull,
 * bright and polished on the steel bear, so the mark reads by contrast either
 * way. Default content is the letterspaced word DAVY in an engraved
 * treatment. It is NOT anyone's real logo and does not try to be - pass
 * opts.markup to drop the genuine asset in.
 *
 * MIRRORING. The plate must read left-to-right whichever way the animal
 * faces. Two hooks:
 *   - opts.mirror flips the plate content about its own centre, for when the
 *     caller mirrors the host group (faceoffSVG does this for the bear).
 *   - the plate content also sits in <g class="brandflip">, so a page that
 *     flips a whole beastSVG horizontally (travelling backwards through the
 *     week) can undo it with one rule and no coordinate knowledge:
 *         .flipped .brandflip { transform: scaleX(-1); }
 *     The group carries transform-box:fill-box and transform-origin:50% 50%
 *     inline, so that rule flips it about its own centre and nothing moves.
 *
 * COLOUR is hard-coded throughout. currentColor is never used: the bull is
 * always gold and the bear is always steel, whatever the page around them is
 * doing. Every gradient id is prefixed per drawing - bull-, bear-, bullp-,
 * bearp-, fo-bull-, fo-bear- - so all of them can sit in one document at once.
 *
 * RIG. beastSVG faces right with every hoof and paw landing on y=170 at rest,
 * a .bob wrapper, and the four .leg groups in the mandated paint order with
 * their --o pivots on the real hip and shoulder and a nested .knee group
 * whose --ko sits on the real hock, carpus or ankle. The knee counter-rotates
 * against the hip so the limb folds through the stride instead of swinging as
 * one rigid stick. Far-side limbs are darker and lower in contrast. The floor
 * reflection sits OUTSIDE .bob, because the floor does not bob.
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------- palettes */
  /* Deliberately not the same value range. STEEL.mid is a good deal darker
     than GOLD.mid, which is what makes the faceoff read at a glance. */
  var GOLD = {
    spec: '#FFFCEC', hi: '#FFE9A6', hi2: '#F0C55C', mid: '#D2941F',
    mid2: '#9C6710', sh: '#66400A', deep: '#3A2405', under: '#150C02',
    bounce: '#C4862A', rim: '#FFE7B0', bloom: '#B87C1C', refl: '#8A5F16',
    dark: '#241703'
  };
  var STEEL = {
    spec: '#FFFFFF', hi: '#DFEAF7', hi2: '#A3B5C9', mid: '#5C6B80',
    mid2: '#3B4657', sh: '#232B36', deep: '#121820', under: '#05080C',
    bounce: '#57697F', rim: '#EAF3FF', bloom: '#5E7288', refl: '#33404F',
    dark: '#0C1118'
  };

  function pal(kind) { return kind === 'bear' ? STEEL : GOLD; }

  /* Approximation of the Davy brand red. Replace with the exact brand hex. */
  var DAVY_RED = '#C8102E';

  /* the trunk's vertical span, which is the lighting frame the limbs share */
  var SPAN = { bull: [59, 130], bear: [70, 135] };

  function n2(v) { return Math.round(v * 100) / 100; }

  /* --------------------------------------------------------------- gradients */

  function S(list) {
    var out = '', i, s;
    for (i = 0; i < list.length; i++) {
      s = list[i];
      out += '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"'
           + (s.length > 2 ? ' stop-opacity="' + s[2] + '"' : '') + '/>';
    }
    return out;
  }
  function LG(id, attr, list) {
    return '<linearGradient id="' + id + '" ' + attr + '>' + S(list) + '</linearGradient>';
  }
  function RG(id, attr, list) {
    return '<radialGradient id="' + id + '" ' + attr + '>' + S(list) + '</radialGradient>';
  }

  /* The master metal ramp: lit top plane, a short hard terminator at
     0.42-0.49, a near-black undercut at 0.68, then the floor bounce coming
     back up into the underside at 0.88. */
  function RAMP(P) {
    return [
      [0,    P.hi],
      [0.14, P.hi2],
      [0.33, P.mid],
      [0.42, P.mid2],
      [0.49, P.sh],
      /* the floor bounce is kept LOW and NARROW - at 0.68/0.88 it spread into
         a bright horizontal band right across the barrel that read as a
         waterline cutting the animal in half. Bounce light hits the lowest
         surfaces only, and the very bottom edge turns away again. */
      [0.74, P.under],
      [0.93, P.bounce],
      [1,    P.sh]
    ];
  }

  /* A limb runs from the trunk's top t all the way to the floor. Over t..b it
     reproduces the trunk's ramp EXACTLY, offset for offset, so the buried
     part of the limb is invisibly the same value as the body around it. Below
     b it is a free cylinder in open floor light: it brightens again, falls to
     a dark undercut and picks up its own bounce. The four below-belly stops
     are fractions of whatever free limb is actually left, not fixed
     distances - fixed ones ran past offset 1.0 on the bear and silently
     collapsed the ramp. */
  function limbStops(P, t, b) {
    var span = 170 - t, h = b - t, free = 170 - b, R = RAMP(P), out = [], i;
    function o(y) { return Math.round(((y - t) / span) * 1000) / 1000; }
    for (i = 0; i < R.length; i++) out.push([o(t + R[i][0] * h), R[i][1]]);
    out.push([o(b + 0.22 * free), P.mid2]);
    out.push([o(b + 0.50 * free), P.sh]);
    out.push([o(b + 0.76 * free), P.under]);
    out.push([o(b + 0.94 * free), P.bounce]);
    out.push([1, P.mid2]);
    return out;
  }
  /* Far side: flat, dark, low contrast, so the off limbs sit back in depth
     instead of competing. Short on purpose - there is no modelling to
     describe over there and the stops are not free. */
  function farStops(P) {
    /* dark, but NOT near-black through the middle: P.under across the shank
       turned the off limbs into holes punched in the animal rather than legs
       standing behind it */
    return [[0, P.mid2], [0.35, P.sh], [0.62, P.deep], [0.85, P.deep], [1, P.under]];
  }

  function defsFor(pre, P, span) {
    var d = '', t = span[0], b = span[1];
    var US = 'gradientUnits="userSpaceOnUse" x1="0" x2="0" ';

    d += LG(pre + '-mass', US + 'y1="' + t + '" y2="' + b + '"', RAMP(P));
    d += LG(pre + '-limb', US + 'y1="' + t + '" y2="170"', limbStops(P, t, b));
    d += LG(pre + '-far',  US + 'y1="' + t + '" y2="170"', farStops(P));

    /* the masses that really do turn on their own axis */
    d += LG(pre + '-massd', 'x1="0" y1="0" x2="0" y2="1" gradientTransform="rotate(26 0.5 0.5)"',
      RAMP(P));

    /* horn / claw: lit along the length rather than across it */
    d += LG(pre + '-horn', 'x1="0" y1="0" x2="0" y2="1" gradientTransform="rotate(-52 0.5 0.5)"', [
      [0, P.spec], [0.16, P.hi], [0.36, P.mid], [0.46, P.mid2],
      [0.66, P.deep], [0.86, P.bounce], [1, P.sh]
    ]);

    /* hoof / pad: nearly black, with the light only clipping the top edge */
    d += LG(pre + '-hoof', 'x1="0" y1="0" x2="0" y2="1"', [
      [0, P.mid2], [0.16, P.sh], [0.5, P.under], [0.86, P.bounce], [1, P.deep]
    ]);

    d += LG(pre + '-bnc', 'x1="0" y1="0" x2="0" y2="1"', [
      [0, P.bounce, 0], [0.6, P.bounce, 0.3], [1, P.bounce, 0.62]
    ]);
    d += LG(pre + '-crs', 'x1="0" y1="0" x2="0" y2="1"', [
      [0, P.under, 0.86], [0.6, P.under, 0.4], [1, P.under, 0]
    ]);
    d += LG(pre + '-rim', 'x1="0" y1="0" x2="1" y2="0"', [
      [0, P.rim, 0], [0.18, P.rim, 0.85], [0.5, P.spec, 1],
      [0.82, P.rim, 0.8], [1, P.rim, 0]
    ]);
    d += RG(pre + '-spec', 'cx="0.5" cy="0.5" r="0.5"', [
      [0, P.spec, 0.75], [0.45, P.hi, 0.3], [1, P.hi, 0]
    ]);

    /* ---- SOFT SPECULARS ------------------------------------------------
       A specular hit painted as a FLAT fill has a hard edge all the way
       round it, and a hard-edged bright strip lying across a curved mass is
       the single loudest "shrink-wrapped plastic" signal there is - the eye
       reads it as cellophane taped to the form rather than as light on it.
       On real polished metal the hit is brightest where the surface normal
       points at the key and dies away as the surface turns, so it has a core
       and a falloff and no boundary at all.

       These four are objectBoundingBox radials, so each one stretches to the
       bounding box of whatever sliver is filled with it and fades out at that
       sliver's own ends and edges. That means a highlight cut to follow one
       mass's curvature fades along that mass and stops there, instead of
       running on across the next one. Painting the same sliver shapes with
       these instead of flat colour is most of the difference between a
       casting and a balloon, and it costs four gradients. */
    d += RG(pre + '-shi', 'cx="0.5" cy="0.42" r="0.6"', [
      [0, P.spec, 0.92], [0.3, P.hi, 0.72], [0.66, P.hi, 0.26], [1, P.hi, 0]
    ]);
    d += RG(pre + '-shi2', 'cx="0.5" cy="0.42" r="0.6"', [
      [0, P.hi, 0.8], [0.34, P.hi2, 0.48], [0.7, P.hi2, 0.16], [1, P.hi2, 0]
    ]);
    d += RG(pre + '-ssp', 'cx="0.5" cy="0.44" r="0.58"', [
      [0, P.spec, 1], [0.28, P.spec, 0.72], [0.62, P.hi, 0.22], [1, P.hi, 0]
    ]);
    /* the matching soft undercut, for the same reason in reverse */
    d += RG(pre + '-sun', 'cx="0.5" cy="0.5" r="0.6"', [
      [0, P.under, 0.9], [0.45, P.under, 0.5], [1, P.under, 0]
    ]);
    /* the reflection fade lives in the figure's own space, BEFORE the mirror
       transform, so it flips along with the shapes it fills */
    d += LG(pre + '-refl', 'gradientUnits="userSpaceOnUse" x1="0" y1="170" x2="0" y2="146"', [
      [0, P.refl, 0.5], [0.4, P.refl, 0.2], [1, P.refl, 0]
    ]);
    return d;
  }

  /* ---------------------------------------------------------------- stance */

  /* Rotate a limb about its hip/shoulder P by deg, counter-rotate the nested
     knee group about K by -deg. The net effect on everything below the knee
     is a PURE TRANSLATION (orientation preserved, so hooves stay level and
     plantigrade soles stay flat):
     T = P + R(deg)(K - P) - K
     We want the foot to stay on the floor, so the vertical component is
     cancelled with an outer translate. Returns the two transform strings. */
  /* dx is the far-side depth offset. NOTE the two pivots live in DIFFERENT
     coordinate systems: the outer rotation is applied outside the
     translate(dx) group so its pivot carries dx, while the knee's
     counter-rotation is applied inside it and must use the un-offset joint.
     Giving both the offset tilts the far feet off the floor by about a unit. */
  function stanceXf(P, K, deg, dx) {
    dx = dx || 0;
    var r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    var vx = K[0] - P[0], vy = K[1] - P[1];
    var ty = P[1] + (vx * s + vy * c) - K[1];
    return {
      outer: 'translate(0 ' + n2(-ty) + ') rotate(' + deg + ' ' + (P[0] + dx) + ' ' + P[1] + ')',
      knee: 'rotate(' + (-deg) + ' ' + K[0] + ' ' + K[1] + ')'
    };
  }

  /* ------------------------------------------------------------ brand plate */

  /* brandPlate(kind, opts) -> '<g>...</g>'
   *
   * A cast plaque for the near flank: dark and recessed on the gold bull,
   * bright and polished on the steel bear, so the mark reads by contrast
   * either way. Slightly proud of the surface - its own bevel, its own
   * specular, and a cast shadow under the lower edge.
   *
   * opts.markup  SVG markup placed inside the plate instead of the wordmark.
   *              ---> AUTHOR IT IN A 0 0 100 30 BOX. <---
   *              x runs 0..100 left to right, y runs 0..30 top to bottom, and
   *              the whole box is scaled and positioned onto the flank here,
   *              so the caller never has to know the animal's coordinates.
   *              Anything that fits that box works: paths, groups, a nested
   *              <svg viewBox="0 0 100 30">. Colour it yourself; nothing is
   *              inherited (this file never uses currentColor).
   * opts.text    wordmark string, default 'DAVY'. Ignored when markup is set.
   * opts.id      id prefix for this plate's gradients, default 'bp-'+kind.
   * opts.x/.y    plate centre in the host drawing's coordinates.
   * opts.w       plate width in host units, ~19% of body length by default.
   * opts.rot     degrees, default a few off level so it sits on the barrel.
   * opts.mirror  true when the host group is itself mirrored (the bear in
   *              faceoffSVG), so the plate content flips back and reads.
   */
  function brandPlate(kind, opts) {
    opts = opts || {};
    var bear = kind === 'bear';
    var P = pal(kind);
    var id = opts.id || ('bp-' + (bear ? 'bear' : 'bull'));
    var x = opts.x != null ? opts.x : (bear ? 104 : 110);
    var y = opts.y != null ? opts.y : (bear ? 107 : 99);
    var w = opts.w != null ? opts.w : (bear ? 24 : 25);
    var rot = opts.rot != null ? opts.rot : (bear ? -2 : -4);

    /* the markup box is 100x30; the plate rim adds 7 all round -> 114x44 */
    var s = w / 114;

    /* Bull: dark recessed field, bright struck lettering.
       Bear: bright polished field, dark engraved lettering.
       Both are high contrast at deck scale, which fine engraving would not
       be - at 400px wide the whole plate is barely 35px across. */
    /* DAVY RED ENAMEL is the default: a vitreous-enamel badge set into the
       metal, the way a maker's plate is. The red is an approximation of the
       Davy brand red - swap DAVY_RED for the exact hex from the brand
       guidelines if you have it. opts.style='metal' restores the plain
       struck-metal plate. */
    var enamel = opts.style !== 'metal';
    var inkA = enamel ? '#FFF6E8' : (bear ? P.dark : P.hi);      // letter face
    var inkB = enamel ? '#5A0611' : (bear ? P.spec : P.under);   // the struck edge behind it

    var d = '';
    d += LG(id + '-fld', 'x1="0" y1="0" x2="0" y2="1"', enamel
      ? [[0, '#E8354A'], [0.3, DAVY_RED], [0.55, '#A80C22'], [0.8, '#8E0919'], [1, '#B01226']]
      : bear
        ? [[0, P.spec], [0.22, P.hi], [0.46, P.hi2], [0.54, P.mid], [1, P.mid2]]
        : [[0, P.under], [0.3, P.deep], [0.52, P.sh], [0.75, P.deep], [1, P.mid2]]);
    d += LG(id + '-bev', 'x1="0" y1="0" x2="0.3" y2="1"', [
      [0, P.spec, 0.95], [0.3, P.hi, 0.5], [0.55, P.under, 0.5], [1, P.hi2, 0.8]
    ]);
    d += LG(id + '-gls', 'x1="0" y1="0" x2="0" y2="1"', enamel
      ? [[0, '#FFFFFF', 0.62], [0.38, '#FFFFFF', 0.16], [0.44, '#FFFFFF', 0], [1, '#FFFFFF', 0]]
      : [[0, P.spec, 0.55], [0.42, P.spec, 0.12], [0.46, P.spec, 0], [1, P.spec, 0]]);

    var inner = opts.markup;
    if (!inner) {
      var txt = (opts.text != null ? String(opts.text) : 'Davy')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      /* Title case in the deck's serif, bold, lightly tracked - the closest
         honest approximation of the wordmark without copying it. Legibility at
         size still beats fine detail: at deck scale the plate is ~35px wide. */
      var fa = 'x="50" text-anchor="middle" font-size="27" font-weight="700"'
        + ' letter-spacing="1.2" font-family="Source Serif 4,Georgia,Times New Roman,serif"';
      inner =
        '<text ' + fa + ' y="25" fill="' + inkB + '" opacity="0.7">' + txt + '</text>'
        + '<text ' + fa + ' y="23.8" fill="' + inkA + '">' + txt + '</text>';
    }

    /* everything that must stay readable lives in .brandflip, so a page that
       mirrors the whole animal can flip just this back with one CSS rule */
    var face = '<g class="brandflip" style="transform-box:fill-box;transform-origin:50% 50%">'
      + '<rect x="-4.4" y="-4.4" width="108.8" height="38.8" rx="6.6" fill="url(#'
        + id + '-fld)"/>'
      + inner
      + '<rect x="-4.4" y="-4.4" width="108.8" height="38.8" rx="6.6" fill="url(#'
        + id + '-gls)"/>'
      + '<path d="M -3 -1 C 2 -6 10 -7 22 -7 L 40 -7 C 26 -4 12 -1 2 4 Z" fill="'
        + P.spec + '" opacity="' + (bear ? 0.75 : 0.5) + '"/>'
      + '</g>';

    var g = '<defs>' + d + '</defs>'
      /* cast shadow under the lower edge - the plate is proud of the flank */
      + '<rect x="-6" y="-3" width="114" height="44" rx="9" fill="' + P.under
        + '" opacity="0.55"/>'
      + '<rect x="-7" y="-7" width="114" height="44" rx="9" fill="url(#' + id + '-bev)"/>'
      + face;

    /* scale(-1 1) before the centring translate mirrors about the box centre,
       so the plate stays put and only its content reverses */
    return '<g class="brand" transform="translate(' + x + ' ' + y + ') rotate(' + rot
      + ') scale(' + n2(s * 100) / 100 + ')'
      + (opts.mirror ? ' scale(-1 1)' : '') + ' translate(-50 -15)">' + g + '</g>';
  }

  /* ================================================================== BULL */

  /* Every path below is a literal. Nothing is computed into path data, so no
     'd' attribute can ever pick up a not-a-number value. (Spelling that out
     rather than using the literal token keeps build.sh's grep guard quiet -
     it scans the whole file, comments included.) */

  var BULL = {
    /* Trunk. The L segments are the deliberate BREAKS in the contour, and
       there are now SIX of them rather than two, because two smooth arcs
       joined by two corners still reads as a balloon with dents:
         43,86   point of the buttock (pin bone), pointing back and down
         52,70   the tail head, with the croup sloping down to it
         68,65   point of the hip (tuber coxae)
         175,89  point of the shoulder
         173,128 the brisket, the keel dropping between the forelegs
         151,130 the notch the chest wall makes BEHIND the elbow
         68,120  the flank fold rising in front of the stifle
       THE TOPLINE IS A CATTLE TOPLINE, which is a specific shape and not a
       generic arch: withers peaked at 59, a dip immediately behind them at
       64, then a FLAT loin holding 65 for a third of the body, then the croup
       sloping down to the tail head. An arch that peaks in the middle is a
       goat. Withers 59 against floor 170 is 111 tall on a body 129 long
       (0.86) - cattle are close to square in profile, which is most of why
       the earlier pass read as a long low antelope. */
    trunk:  'M 43 86 C 45 78 48 73 52 70 L 60 67 L 68 65 '
          + 'C 80 64 93 64 105 65 C 113 65 119 64 124 62 '
          + 'C 130 60 135 59 140 59 C 151 58 161 65 168 75 L 175 89 '
          + 'C 178 96 179 107 177 117 L 173 128 '
          + 'C 170 131 164 133 157 132 L 151 130 '
          + 'C 137 132 120 133 108 132 C 94 131 82 129 73 125 L 68 120 '
          + 'C 60 116 51 109 47 100 L 43 86 Z',
    /* A TAPERING WEDGE with a CREST. The crest is the point: a bull carries a
       slab of muscle along the top of the neck that rises ABOVE the withers
       line (peak 53 against withers 59) and then drops steeply to the poll.
       A neck that runs smoothly from withers to poll is a cow's, or a goat's.
       Still a wedge in section - 44 deep at the shoulder, 24 at the poll - so
       the head never disappears into it. */
    neck:   'M 127 63 C 134 55 146 51 157 56 C 165 60 171 68 175 78 '
          + 'C 178 85 179 93 177 101 C 175 108 171 113 165 114 '
          + 'C 158 115 151 111 147 104 C 142 94 134 76 127 63 Z',
    /* ANGULAR, not an egg. The straight L runs are the whole point: a domed
       forehead, then a hard BREAK at the brow (188,77), then a dead-straight
       nose bridge down to the muzzle, a flat front face, and a straight jaw
       running back. Drawn as one smooth arc from poll to muzzle - which is
       what the first pass did - a bovine head reads as a rounded lump with an
       eye on it. */
    /* The muzzle now ends in a genuinely FLAT vertical front face 10 units
       deep, from (204,103) to (204,113), and the lower jaw is carried out
       under it to (195,119) instead of tapering away - depth at the nose is
       22 against 37 at the brow, so the muzzle keeps 60% of the skull's depth
       right to its end. There is a second BREAK at the jaw angle (172,110):
       a bovine jaw is a straight bar running back to the throat, not a curve. */
    head:   'M 167 75 C 172 70 180 68 188 73 L 195 84 '
          + 'C 200 88 203 92 204 97 L 205 110 '
          + 'C 204 115 201 117 196 117 C 190 118 184 116 179 112 L 173 106 '
          + 'C 168 101 165 92 166 82 C 166 78 166 76 167 75 Z',
    /* the muzzle FLARES again below the face - a bovine muzzle is a blunt
       block with a flat front and a wide nose pad, never a point. Depth at
       the nose is 18 against a head length of 45, which is the 0.40 that
       separates a bull from a goat more than any other single measurement. */
    muzzle: 'M 183 84 L 195 84 C 200 88 203 92 204 97 L 205 110 '
          + 'C 204 115 201 117 196 117 C 190 118 184 116 179 112 '
          + 'C 176 107 177 90 183 84 Z',
    /* big, and set BELOW and BEHIND the horn bases, projecting back off the
       poll - not out of the side of the face where the first pass had them */
    earN:   'M 170 80 C 165 88 156 94 149 95 C 145 95 144 90 148 86 '
          + 'C 154 81 164 77 169 77 Z',
    earF:   'M 165 76 C 160 83 152 88 146 89 C 143 89 142 85 145 82 '
          + 'C 150 78 159 74 164 73 Z',
    /* THE HORNS ARE THE SPECIES. Thin smooth arcs off the top of the skull
       are an antelope, and that is exactly what the first pass drew. These
       are BONE: base diameter 8 on a head 45 long, which is as thick as the
       eye socket, tapering to 3 at the tip; length along the curve 29, only
       0.64 of head length, because short and heavy beats long and thin.
       Both leave the top-REAR corners of the skull at the poll, behind and
       above the eye - never the forehead.
       The NEAR horn sweeps out, then forward, then up: a bold foreshortened
       curve lying beside the face with its tip at (193,56). The FAR one is
       seen across the poll going up and back to (146,47), thinner and dimmer,
       and clears the neck crest by 6 units so the two never fuse into one
       blade. It is drawn AFTER the neck (drawn before, the crest buried it)
       but still BEFORE the skull. */
    hornF:  'M 160 71 C 154 65 148 57 145 50 C 143.4 46.6 147 44.6 149.4 48 '
          + 'C 154 55 162 63 169 68 Z',
    hornN:  'M 166 63 C 174 60 182 58 188 52 C 190.6 49 194 50 193 54 '
          + 'C 191.6 60 186 65 180 68 C 176 70 172 73 170 76 '
          + 'C 166.6 74 165 68 166 63 Z',
    /* A LOOSE DEWLAP, hanging in two lobes from the jaw down toward the
       forelegs and breaking the chest contour by 9 units. The first pass had
       one tucked so far back that the shoulder mass painted straight over it,
       so the bull had no throat at all. */
    dewlap: 'M 178 100 C 184 108 185 118 183 126 '
          + 'C 181 131 177 134 172 133 C 168 132 167 129 169 125 '
          + 'C 165 130 160 132 156 131 C 152 130 151 126 154 122 '
          + 'C 158 115 166 109 173 103 C 176 100 177 99 178 100 Z',
    /* long, and tufted down to the hock the way a bull's actually is */
    tail:   'M 53 69 C 46 73 40 83 36 95 C 33 105 32 117 33 129 L 28 130 '
          + 'C 26 117 27 104 31 92 C 35 80 42 71 49 67 Z',
    tuft:   'M 32 126 C 37 129 39 137 37 145 C 35 152 30 155 27 151 '
          + 'C 24 145 26 132 30 127 Z',

    /* LIMBS. The upper masses ARE the shoulder and the thigh - there is no
       separate shoulder blob laid over the barrel, which is also why the
       haunch swings correctly in the gallop.

       WHERE THE SECTION CHANGE HAS TO HAPPEN. The earlier pass did vary the
       section, but it did it between y=68 and y=126 - which is entirely INSIDE
       the barrel. Everything actually visible below the belly line was the
       cannon, one constant-width tube, which is why the legs read as furniture
       legs. So the whole chain is re-proportioned to put the interesting part
       in the open air. Bull foreleg, free length 126 -> 170:
         forearm  122..144  21 -> 17  broad flattened cone, the widest free mass
         carpus   144..150  17        the KNOB, jutting BACKWARD off the shaft
         cannon   150..157   9        narrow and near flat, the thinnest link
         fetlock  157..161  13        knob again, wider than the cannon above
         pastern  161..164   9
         hoof     162..170  15        flaring out to the floor, cloven
       Bull hind, free length ~118 -> 170:
         thigh    82..117   42 -> 39  slab, STIFLE break on its front at 85,117
         gaskin   117..137  29 -> 24  flattening
         hock     137..142  20        point of the hock a sharp corner at 46,140
         cannon   142..154   8        the thinnest link
         fetlock  154..159  13
         hoof     160..170  14
       Every joint is wider than both shafts it joins, and no two consecutive
       segments share a width. */

    /* shoulder 32 -> upper arm 26 -> elbow 24, jutting back at 146,127 */
    foreUp: 'M 142 66 C 154 62 167 68 172 79 C 175 84 176 90 175 97 '
          + 'C 174 105 172 112 171 119 L 170 128 '
          + 'C 170 133 168 136 164 136 L 155 136 '
          + 'C 152 136 151 134 151 131 L 146 127 '
          + 'C 144 122 144 116 144 108 C 143 94 142 78 142 66 Z',
    /* forearm 21 -> carpus 16.5 -> cannon 9.7 -> fetlock 11.6 -> pastern 10
       ALL THE KNOBS ARE ON THE BACK EDGE. That is where they are on the real
       animal - the accessory carpal behind the knee, the sesamoids behind the
       fetlock - and it also fixes the other half of the toy problem: a limb
       whose outline swells symmetrically at each joint is a turned table leg,
       a stack of discs on a spindle. So the FRONT of the leg is one clean,
       near-straight line from elbow to hoof and every bulge is behind it. */
    foreLo: 'M 150 122 C 152 130 154 137 154 142 '
          + 'C 151.4 145 151 148.4 153.4 151 '
          + 'C 156 153.4 157 155.4 157 157.6 '
          + 'C 155 159.6 154.6 161.6 155.6 163.4 '
          + 'L 165.6 163.4 '
          + 'C 166.2 161 166.6 158 166.8 154 '
          + 'C 167.2 148 168.4 140 169.4 132 '
          + 'C 170 128 170.6 125 171 122 Z',
    /* the hoof is WIDER than everything above it and flares to the floor -
       a foot narrower than its own cannon has no weight on it */
    foreHf: 'M 156 162.4 C 154.4 165 153.2 167.6 153 170 L 169.4 170 '
          + 'C 169.2 167.6 168.2 165 166.8 162.4 C 163 163.8 159.6 163.8 156 162.4 Z',
    /* thigh 42 -> stifle break -> gaskin 29 -> point of the hock at 46,140 */
    hindUp: 'M 45 82 C 47 70 62 65 75 72 C 86 78 89 92 87 106 L 85 117 '
          + 'C 82 125 77 131 73 137 C 71 140 69 143 68 146 '
          + 'L 58 146 C 57 143 56 141 54 139 L 46 140 '
          + 'C 44 135 44 129 45 122 C 43 108 42 94 45 82 Z',
    /* cannon 8.6 -> fetlock 10.4 -> hoof 16, knob on the back edge again */
    hindLo: 'M 52 134 C 54.4 138 55.8 141 56 144 '
          + 'C 56 148 56 152 55.6 155 '
          + 'C 54 157 53.6 159.4 54.6 161.4 '
          + 'L 63.8 161.4 '
          + 'C 64.2 158 64.4 153 64.4 148 '
          + 'C 64.6 143 65.2 138 66 134 Z',
    hindHf: 'M 55 160.6 C 53.4 163 52.4 166 52.2 170 L 68 170 '
          + 'C 67.8 166 67 163 65.4 160.6 C 62 161.8 58.4 161.8 55 160.6 Z',

    rimFace: 'M 197 118 C 202 117 205 114 205 108 C 205 101 202 94 196 86 '
          + 'L 188 73 C 181 68 174 69 168 76',
    rimTop:  'M 50 72 C 53 70 56 68 60 67 L 68 65 C 80 64 93 64 105 65 '
          + 'C 113 65 119 64 124 62 C 130 60 135 59 140 59',
    rimCrest:'M 129 61 C 137 54 147 52 157 57 C 165 61 171 69 175 79',
    /* the chest silhouette is now the DEWLAP's leading edge, not the barrel */
    rimChest:'M 171 132 C 178 128 185 119 182 108 C 180 103 178 100 176 97'
  };

  function bullFore(pre, far, kneeXf) {
    var P = GOLD;
    var f = far ? 'url(#' + pre + '-far)' : 'url(#' + pre + '-limb)';
    var hf = far ? 'url(#' + pre + '-far)' : 'url(#' + pre + '-hoof)';
    var s = '<path d="' + BULL.foreUp + '" fill="' + f + '"/>';
    if (!far) {
      /* the shoulder blade taking the key, the crease behind it that cuts the
         front end off the barrel, and the flat broad plane of the upper arm */
      s += '<path d="M 148 71 C 158 66 169 72 174 84 C 168 75 158 70 149 75 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
      s += '<path d="M 159 74 C 169 84 173 98 171 118 C 169 100 165 85 156 76 Z" fill="url(#' + pre + '-shi2)" opacity="0.62"/>';
      s += '<path d="M 144 68 C 140 84 142 104 150 124 C 140 106 137 84 141 68 Z" fill="url(#'
         + pre + '-crs)"/>';
      /* THE ELBOW pressing out of the chest wall. Two marks, because a joint
         that is only lit reads as a ball stuck on: a dark undercut under the
         point of it, and the floor bounce coming up onto its lower plane. */
      s += '<path d="M 146 122 C 144 126 145 131 149 134 C 154 136 160 136 165 134 '
         + 'C 158 133 151 130 149 125 Z" fill="url(#' + pre + '-sun)" opacity="0.39"/>';
      s += '<path d="M 148 121 C 153 127 160 131 169 130 C 160 134 150 130 145 123 Z" fill="url(#'
         + pre + '-bnc)"/>';
    }
    s += '<g class="knee" style="--ko:' + (far ? 144 : 161) + 'px 126px"'
       + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
       + '<path d="' + BULL.foreLo + '" fill="' + f + '"/>'
       + (far ? '' :
           /* ONE HIGHLIGHT DOWN THE WHOLE LIMB, not a band at each joint.
              Rings around a shaft are what make a leg read as turned wood, so
              the light instead runs ALONG the bone and its WIDTH carries the
              section: 4 units across the broad forearm, 1.8 across the flat
              cannon, 2.4 at the fetlock. It is filled with the soft radial,
              so it has no edge of its own and dies out at both ends. */
           '<path d="M 170 124 C 169.2 132 168 140 167.4 147 '
           + 'C 167 152 166.6 157 166.2 162 L 164.4 161.8 '
           + 'C 164.8 157 165 152 165.2 147.2 '
           + 'C 165.6 140 166 132 166 124 Z" fill="url(#' + pre + '-shi)" opacity="0.95"/>'
           /* a hotter core over the forearm only - the widest, most turned
              part of the limb is the only place that earns a second hit */
         + '<path d="M 169.4 126 C 168.8 132 168.2 138 167.8 143 L 166.4 143 '
           + 'C 166.8 138 167.2 132 167.6 126 Z" fill="url(#' + pre + '-ssp)" opacity="0.7"/>'
           /* the joints read as SWELLINGS lit along their own axis, not as
              bands wrapped across the shaft: an ellipse taller than it is
              wide, sitting on the lit side of each knob */
         + '<ellipse cx="163.4" cy="146.6" rx="3.4" ry="4.6" fill="url(#'
           + pre + '-spec)" opacity="0.6"/>'
         + '<ellipse cx="162.6" cy="160.4" rx="2.8" ry="2.6" fill="url(#'
           + pre + '-spec)" opacity="0.5"/>'
           /* the hollow BEHIND the carpus, which is what makes the knob read
              as bone ends widening into each other rather than a bead */
         + '<path d="M 152.6 149 C 154.6 152 156.4 154.6 157 157.4 '
           + 'C 154.6 154.6 152.4 152 151.6 149.4 Z" fill="url(#'
           + pre + '-sun)" opacity="0.5"/>')
       + '<path d="' + BULL.foreHf + '" fill="' + hf + '"/>'
       + (far ? '' :
           '<path d="M 161.4 170 L 161.4 163.6" stroke="' + P.under
           + '" stroke-width="1.6" fill="none" opacity="0.85"/>'
           /* the hoof wall's lit face - vertical, following the wall, so the
              hoof is not capped with yet another ring */
         + '<path d="M 166 163.6 C 167.2 166 168.2 168 168.6 170 L 166.4 170 '
           + 'C 166 168 165.2 166 164.2 163.8 Z" fill="url(#'
           + pre + '-shi2)" opacity="0.8"/>')
       + '</g>';
    return s;
  }

  function bullHind(pre, far, kneeXf) {
    var P = GOLD;
    var f = far ? 'url(#' + pre + '-far)' : 'url(#' + pre + '-limb)';
    var hf = far ? 'url(#' + pre + '-far)' : 'url(#' + pre + '-hoof)';
    var s = '<path d="' + BULL.hindUp + '" fill="' + f + '"/>';
    if (!far) {
      s += '<path d="M 50 78 C 59 68 72 68 81 80 C 71 73 59 74 51 84 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
      s += '<ellipse cx="65" cy="93" rx="15" ry="13" fill="url(#' + pre + '-spec)" opacity="0.55"/>';
      s += '<path d="M 45 86 C 42 100 43 116 48 130 C 41 116 40 100 43 86 Z" fill="url(#'
         + pre + '-crs)"/>';
      /* THE STIFLE: a hard bright corner where the thigh's forward bulge
         stops and the gaskin's line starts. Without the break the whole hind
         limb is one smooth taper, which is the balloon reading again. */
      s += '<path d="M 87 104 L 85 117 C 84 122 81 127 77 132 '
         + 'C 80 126 82 121 83 116 L 84 104 Z" fill="url(#' + pre + '-shi)" opacity="0.86"/>';
      /* the gaskin's flat outer plane, then the bounce under the stifle */
      s += '<path d="M 80 110 C 82 120 79 130 72 139 C 76 129 77 120 76 111 Z" fill="url(#' + pre + '-shi2)" opacity="0.56"/>';
      s += '<path d="M 48 126 C 54 134 61 139 69 139 C 60 142 50 136 45 128 Z" fill="url(#'
         + pre + '-bnc)"/>';
      /* THE POINT OF THE HOCK, the sharpest landmark on a bovine hind leg.
         Dark on its back plane, bright along the top of the joint, so it
         reads as the calcaneus jutting off the back of the hock and not as a
         bead threaded on the shank. */
      s += '<path d="M 46 140 C 44 135 44 129 45 123 C 47 129 47.5 135 49 139 Z" fill="url(#' + pre + '-sun)" opacity="0.46"/>';
      s += '<path d="M 48 134 C 52 136 55 138 57 141 L 54 141 '
         + 'C 52 138 50 136 47 135 Z" fill="url(#' + pre + '-shi)" opacity="0.78"/>';
      s += '<path d="M 57 136 C 61 135 65 136 67 139 C 63 137.6 59 137.6 57 138.6 Z" fill="url(#' + pre + '-shi)" opacity="0.86"/>';
    }
    s += '<g class="knee" style="--ko:' + (far ? 44 : 58) + 'px 138px"'
       + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
       + '<path d="' + BULL.hindLo + '" fill="' + f + '"/>'
       + (far ? '' :
           /* the same single along-the-bone highlight as the foreleg */
           '<path d="M 63.8 138 C 64 144 64 150 63.6 156 '
           + 'C 63.4 158.4 63.2 160 63 161 L 61.4 161 '
           + 'C 61.6 159.6 61.8 158 62 156 '
           + 'C 62.2 150 62.2 144 62 138 Z" fill="url(#' + pre + '-shi)" opacity="0.92"/>'
         + '<ellipse cx="61.8" cy="159.6" rx="2.6" ry="2.6" fill="url(#'
           + pre + '-spec)" opacity="0.5"/>')
       + '<path d="' + BULL.hindHf + '" fill="' + hf + '"/>'
       + (far ? '' :
           '<path d="M 60 170 L 60 161.6" stroke="' + P.under
           + '" stroke-width="1.6" fill="none" opacity="0.85"/>'
         + '<path d="M 64.6 161.6 C 65.8 164 66.8 166.8 67.2 170 L 65 170 '
           + 'C 64.6 167 63.8 164.2 62.8 161.8 Z" fill="url(#'
           + pre + '-shi2)" opacity="0.8"/>')
       + '</g>';
    return s;
  }

  function bullHeadGroup(pre, lift) {
    var P = GOLD;
    var s = '';
    /* NECK FIRST. Tapering wedge with a heavy CREST riding above the withers
       line - the crest is a bull cue on its own, and the first pass had none. */
    s += '<path d="' + BULL.neck + '" fill="url(#' + pre + '-massd)"/>';
    s += '<path d="M 129 62 C 137 55 148 52 158 58 C 148 55 138 57 131 63 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 139 55 C 146 52 153 53 159 57 C 152 55 145 55 140 57 Z" fill="url(#' + pre + '-ssp)" opacity="0.85"/>';
    /* the crest's own lower edge, which is what makes it read as a slab of
       muscle laid on the neck rather than the neck simply being fat */
    s += '<path d="M 133 64 C 142 60 152 60 161 65 C 151 63 142 64 134 67 Z" fill="url(#' + pre + '-sun)" opacity="0.34"/>';
    /* the throat rolling under toward the brisket */
    s += '<path d="M 148 104 C 155 111 164 114 173 111 C 165 118 153 116 146 108 Z" fill="url(#'
       + pre + '-crs)"/>';

    /* FAR HORN after the neck - drawn before it, the crest buried it - but
       still before the skull, which is what keeps the two horns separate */
    s += '<path d="' + BULL.hornF + '" fill="' + P.sh + '"/>';
    s += '<path d="M 158 68 C 152 61 147 54 145.4 49.4 C 150 56 156 63 161 67 Z" fill="url(#'
       + pre + '-shi2)" opacity="0.6"/>';
    s += '<path d="' + BULL.earF + '" fill="' + P.deep + '"/>';

    /* THE DEWLAP, before the skull so the jaw sits over its top edge */
    s += '<path d="' + BULL.dewlap + '" fill="url(#' + pre + '-massd)"/>';
    s += '<path d="M 179 102 C 184 110 185 119 183 127 C 183 118 181 110 177 103 Z" fill="url(#' + pre + '-shi2)" opacity="0.88"/>';
    /* the fold between the two lobes - a dewlap is loose skin, not a fin */
    s += '<path d="M 169 124 C 166 129 161 132 156 131 C 161 131 165 128 167 123 Z" fill="url(#' + pre + '-sun)" opacity="0.57"/>';

    /* THE SKULL */
    s += '<path d="' + BULL.head + '" fill="url(#' + pre + '-massd)"/>';
    /* the cheek crease: a hard dark edge down the back of the jaw. Without
       it the skull and the neck fuse into one cone, which is exactly what
       the first pass did. */
    s += '<path d="M 168 76 C 164 86 165 97 173 106 C 165 99 161 86 165 76 Z" fill="url(#' + pre + '-sun)" opacity="0.92"/>';
    /* the BROAD flat forehead between the horn bases, and the break at the
       brow. A bull's forehead is a wide flat plate, not a dome. */
    s += '<path d="M 168 76 C 174 71 181 70 188 74 C 180 73 173 74 169 79 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 172 74 C 178 71 183 71 188 74 C 182 73 177 73 173 76 Z" fill="url(#' + pre + '-ssp)" opacity="0.7"/>';
    /* the straight nose bridge gets one long unbroken sliver - it is the
       plane that tells you this is a face and not a ball */
    s += '<path d="M 188 74 L 197 88 C 194 87 190 81 186 77 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 190 78 L 197 88 C 193 86 190 82 187 79 Z" fill="url(#' + pre + '-ssp)" opacity="0.7"/>';
    /* the deep jaw: a hard dark line is what makes a skull read as a skull */
    s += '<path d="M 173 102 L 183 111 C 188 114 193 116 198 115 C 189 118 180 116 174 109 Z" fill="url(#' + pre + '-sun)" opacity="0.86"/>';

    /* THE MUZZLE - a blunt block flaring below the face with a flat vertical
       front face at x=204. It takes -massd, NOT the trunk's absolute-y ramp:
       down at y=90..120 that ramp is deep in the undercut and rendered the
       whole muzzle near-black. The muzzle is a forward-facing form in full
       key light and needs its own bounding box to run a fresh ramp over. */
    s += '<path d="' + BULL.muzzle + '" fill="url(#' + pre + '-massd)"/>';
    /* one hard vertical hit straight down the flat front face - a flat plane
       gives a straight highlight, and that is what says "blunt" at size */
    s += '<path d="M 200 92 C 203 97 204.4 103 204 111 C 202.6 103 201 97 198 93 Z" fill="url(#' + pre + '-ssp)" opacity="0.85"/>';
    /* the WIDE NOSE PAD, and the dark under the chin */
    s += '<path d="M 193 98 C 199 99 203 103 202 108 C 199 111 194 110 191 106 '
       + 'C 190 102 190 99 193 98 Z" fill="url(#' + pre + '-sun)" opacity="0.48"/>';
    s += '<path d="M 194 101 C 198 102 200 104 199 107 C 196 108 193 107 192 104 '
       + 'C 192 102 192 101 194 101 Z" fill="url(#' + pre + '-sun)" opacity="0.98"/>';
    s += '<path d="M 181 113 C 187 116 194 117 199 115 C 194 119 186 119 180 115 Z" fill="url(#' + pre + '-sun)" opacity="0.69"/>';

    /* eye, set at the brow break, below and forward of the horn base */
    s += '<path d="M 176 85 C 180 84 183 86 184 88 C 182 91 178 92 175 90 '
       + 'C 174 88 174 86 176 85 Z" fill="' + P.under + '"/>';
    s += '<circle cx="179" cy="87" r="1.3" fill="' + P.spec + '" opacity="0.9"/>';

    s += '<path d="' + BULL.earN + '" fill="url(#' + pre + '-massd)"/>';
    s += '<path d="M 169 81 C 164 88 157 93 151 94 C 157 90 164 85 168 80 Z" fill="url(#' + pre + '-shi2)" opacity="0.81"/>';
    /* the undercut that separates the ear from the neck behind it */
    s += '<path d="M 170 82 C 165 90 157 96 149 96 C 156 94 163 89 168 81 Z" fill="url(#' + pre + '-sun)" opacity="0.4"/>';

    /* THE NEAR HORN LAST, over the skull. 13.6 thick at the base against a
       45-unit head, 27 long along the curve. It has to be modelled like a
       cylinder of bone or the thickness is wasted: a lit top plane, a hard
       dark underside, and a dark seam where it leaves the skull. */
    s += '<path d="' + BULL.hornN + '" fill="url(#' + pre + '-horn)"/>';
    /* the seam - without it the horn and the forehead fuse into one lump */
    s += '<path d="M 166 64 C 168.6 66.6 169.6 71 170 76 '
       + 'C 167.6 72.4 166 68 165.4 64.6 Z" fill="' + P.under + '" opacity="0.55"/>';
    /* the lit top plane, running the length of the horn */
    s += '<path d="M 167 62.6 C 175 59.6 183 57.4 188.6 52 '
       + 'C 184 58.6 176 63 168.6 66 Z" fill="url(#' + pre + '-ssp)" opacity="0.92"/>';
    /* the shadowed underside, which is what gives the horn its thickness */
    s += '<path d="M 171 74 C 177 70.6 183 66.6 188 61 '
       + 'C 184 67.6 177.6 72.4 171.6 75.6 Z" fill="url(#' + pre + '-sun)" opacity="0.6"/>';
    s += '<path d="M 188 52.6 C 190 50 192.6 50.4 192.4 53.4 '
       + 'C 191 55.4 189.4 56.6 188 57.6 Z" fill="url(#' + pre + '-ssp)" opacity="0.95"/>';

    if (lift) s = '<g transform="rotate(' + lift + ' 136 72)">' + s + '</g>';
    return s;
  }

  function bullBody(pre, lift, plateOpts) {
    var P = GOLD;
    var s = '';
    s += '<path d="' + BULL.trunk + '" fill="url(#' + pre + '-mass)"/>';
    /* A dark contour along the shadow side. Half the stroke falls outside the
       silhouette, which is what keeps a gold animal from dissolving into a
       warm ochre backdrop - two of the deck's seven grounds are exactly that. */
    s += '<path d="M 47 100 C 54 110 61 116 68 120 C 76 125 84 128 94 130 '
       + 'C 110 132 130 132 148 130 C 152 129 155 130 157 132" stroke="' + P.under
       + '" stroke-width="1.6" fill="none" opacity="0.55" stroke-linecap="round"/>';
    s += '<ellipse cx="100" cy="95" rx="34" ry="15" fill="url(#' + pre + '-spec)" opacity="0.5"/>';
    /* THREE separate topline hits - croup, loin, withers - never one arc */
    s += '<path d="M 50 71 C 56 67 62 65 70 65 C 62 68 56 70 52 76 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 78 65 C 88 63 96 63 104 65 C 95 66 87 67 78 69 Z" fill="url(#' + pre + '-shi2)" opacity="0.75"/>';
    s += '<path d="M 120 64 C 127 61 133 59 141 59 C 133 61 127 64 122 68 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 126 62 C 131 60 136 59 141 59 C 135 61 130 63 127 65 Z" fill="url(#' + pre + '-ssp)" opacity="0.8"/>';
    /* THE POINT OF THE HIP, a hard bright corner where the pelvis pushes
       through the hide - one of the two landmarks that make a rump angular */
    s += '<path d="M 62 66 L 68 65 C 72 65 74 66 75 68 C 72 67 68 67 63 68 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 68 66 C 71 69 72 73 71 78 C 70 73 68 70 66 68 Z" fill="url(#' + pre + '-sun)" opacity="0.39"/>';
    /* THE PIN BONE at the back of the rump, the second one */
    s += '<path d="M 44 82 L 43 87 C 43 91 44 95 46 99 C 43 95 41 90 41 85 Z" fill="url(#' + pre + '-sun)" opacity="0.41"/>';
    /* reflected light off the floor into the belly */
    s += '<path d="M 60 120 C 84 129 122 133 157 127 C 124 137 82 135 58 125 Z" fill="url(#'
       + pre + '-bnc)"/>';
    /* one shallow rib sliver. More than one and it turns into a zebra. */
    s += '<path d="M 120 90 C 124 101 124 113 120 122 C 122 112 121 100 118 91 Z" fill="url(#' + pre + '-sun)" opacity="0.34"/>';
    /* the notch the chest wall makes BEHIND the elbow */
    s += '<path d="M 151 128 C 155 131 162 133 169 132 C 161 135 152 133 149 130 Z" fill="url(#' + pre + '-sun)" opacity="0.52"/>';

    if (plateOpts !== false) s += brandPlate('bull', plateOpts || {});
    s += '<g class="head" style="--ho:136px 72px">' + bullHeadGroup(pre, lift) + '</g>';
    return s;
  }

  function bullRim(pre) {
    var P = GOLD;
    var g = 'url(#' + pre + '-rim)';
    return '<path d="' + BULL.rimTop + '" stroke="' + g + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BULL.rimFace + '" stroke="' + g + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BULL.rimChest + '" stroke="' + g + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
      + '<circle cx="191.4" cy="52.6" r="1.2" fill="' + P.spec + '" opacity="0.9"/>';
  }

  function bullBloom(pre) {
    var P = GOLD;
    var d = BULL.rimTop + ' ' + BULL.rimCrest + ' ' + BULL.rimFace + ' ' + BULL.rimChest;
    /* kept low: at higher opacity these two strokes stop reading as a glow
       bleeding off the silhouette and start reading as a drawn outline */
    return '<path d="' + d + '" stroke="' + P.bloom + '" stroke-width="8" fill="none" '
         + 'stroke-linecap="round" opacity="0.10"/>'
         + '<path d="' + d + '" stroke="' + P.bloom + '" stroke-width="3.4" fill="none" '
         + 'stroke-linecap="round" opacity="0.16"/>';
  }

  /* Only the last dozen units above the floor survive the fade, so the
     reflection is built from the feet and lower cannons, not the whole body. */
  function bullRefl(pre) {
    var f = 'url(#' + pre + '-refl)';
    var s = '<g transform="matrix(1 0 0 -1.15 0 365.5)">';
    s += '<path d="' + BULL.hindLo + '" fill="' + f + '"/><path d="' + BULL.hindHf + '" fill="' + f + '"/>';
    s += '<path d="' + BULL.foreLo + '" fill="' + f + '"/><path d="' + BULL.foreHf + '" fill="' + f + '"/>';
    s += '<g transform="translate(-14 0)"><path d="' + BULL.hindLo + '" fill="' + f
       + '"/><path d="' + BULL.hindHf + '" fill="' + f + '"/></g>';
    s += '<g transform="translate(-17 0)"><path d="' + BULL.foreLo + '" fill="' + f
       + '"/><path d="' + BULL.foreHf + '" fill="' + f + '"/></g>';
    s += '</g>';
    s += '<ellipse cx="60" cy="170" rx="11" ry="2.4" fill="url(#' + pre + '-spec)" opacity="0.5"/>';
    s += '<ellipse cx="162" cy="170" rx="11" ry="2.4" fill="url(#' + pre + '-spec)" opacity="0.5"/>';
    s += '<ellipse cx="46" cy="170" rx="9" ry="2" fill="url(#' + pre + '-spec)" opacity="0.26"/>';
    s += '<ellipse cx="145" cy="170" rx="9" ry="2" fill="url(#' + pre + '-spec)" opacity="0.26"/>';
    return s;
  }

  /* ================================================================== BEAR */

  var BEAR = {
    /* Trunk. L breaks at the point of the hip (60,68) and the point of the
       shoulder (166,88). Rump 70 sits just above the hump 76, back dipped to
       91 between them. Long body, deep barrel, belly 133. */
    trunk:  'M 44 96 C 41 84 45 73 54 70 L 60 68 C 70 66 79 74 87 82 '
          + 'C 94 89 100 92 108 91 C 118 90 128 84 137 78 C 146 73 156 76 162 83 '
          + 'L 166 88 C 170 94 171 100 169 108 C 167 117 160 124 151 128 '
          + 'C 138 133 118 135 98 134 C 78 133 62 129 54 123 C 47 118 43 106 44 96 Z',
    neck:   'M 128 80 C 140 74 152 77 160 86 C 165 92 166 100 163 106 C 160 112 154 114 148 111 '
          + 'C 143 108 142 102 143 96 C 144 88 138 83 128 85 Z',
    /* a deep round SKULL with a distinctly narrower snout hung off it - the
       11-unit step from skull-top to snout-top IS the concave stop */
    skull:  'M 156 96 C 156 86 164 81 173 83 C 181 85 186 93 186 103 C 186 112 180 118 172 117 '
          + 'C 163 116 157 107 156 96 Z',
    snout:  'M 180 95 C 187 97 193 101 198 106 C 200 109 199 113 195 114 C 189 116 183 115 180 112 '
          + 'C 177 109 177 99 180 95 Z',
    nose:   'M 192 104 C 196 105 199 108 198 111 C 196 113 192 113 190 111 C 189 108 189 105 192 104 Z',
    /* small and ROUND - a bear ear is a disc, and any point on it reads as a
       horn at deck scale */
    earN:   'M 153 87 C 153 82 157 79 161 80 C 165 81 167 85 165 89 C 163 93 158 94 155 92 '
          + 'C 153 91 153 89 153 87 Z',
    earF:   'M 145 86 C 145 82 148 80 152 81 C 155 82 157 85 155 88 C 153 91 149 92 147 90 '
          + 'C 145 89 145 87 145 86 Z',
    tail:   'M 47 88 C 42 88 39 91 39 95 C 39 99 43 102 47 100 C 49 98 50 93 47 88 Z',
    /* thigh 48 -> ankle 16 -> plantigrade sole 30 */
    hindUp: 'M 40 92 C 44 78 60 72 74 80 C 85 86 88 100 85 116 C 83 128 77 138 71 146 '
          + 'C 69 149 68 151 67 154 L 53 154 C 52 150 51 147 49 143 C 43 130 37 106 40 92 Z',
    hindLo: 'M 52 148 L 68 148 C 69 155 70 161 70 165 C 72 167 75 169 79 170 L 49 170 '
          + 'C 49 164 50 155 52 148 Z',
    /* upper 28 -> forearm 21 -> wrist 17 -> paw 27 */
    foreUp: 'M 128 80 C 140 74 155 80 158 94 C 161 108 160 122 158 134 C 157 140 156 144 156 148 '
          + 'C 156 151 155 152 152 152 L 143 152 C 140 152 139 151 139 148 '
          + 'C 139 143 138 138 137 132 C 135 118 131 100 130 88 C 129 83 128 81 128 80 Z',
    foreLo: 'M 139 146 L 157 146 C 158 152 159 158 160 163 C 161 167 162 169 164 170 L 137 170 '
          + 'C 137 162 138 153 139 146 Z',
    /* long front claws hooking forward off the paw; the longest rests on the
       floor with the sole, at exactly 170 */
    /* rooted INSIDE the paw at x=157 so they read as claws growing out of it
       rather than three slivers floating off the front */
    clawA:  'M 157 160 C 162 160 166 158 169 156 C 168 160 164 163 158 163 Z',
    clawB:  'M 157 164 C 163 164 167 162 170 160 C 170 164 165 167 159 167 Z',
    clawC:  'M 158 168 C 164 167 168 166 171 164 C 171 168 166 170 160 170 Z',
    clawR:  'M 77 166 C 81 166 83 168 84 170 L 77 170 Z',
    rimFace: 'M 195 114 C 199 112 200 108 196 103 C 190 97 184 92 180 89',
    rimTop:  'M 48 82 C 52 72 66 66 84 80 C 94 88 101 92 109 91',
    rimCrest:'M 112 91 C 122 86 130 79 138 77 C 148 74 158 80 166 90',
    rimChest:'M 169 108 C 168 117 162 124 154 128'
  };

  function bearFore(pre, far, kneeXf) {
    var P = STEEL;
    var f = far ? 'url(#' + pre + '-far)' : 'url(#' + pre + '-limb)';
    var s = '<path d="' + BEAR.foreUp + '" fill="' + f + '"/>';
    if (!far) {
      /* the hump rolls straight down into the foreleg: one column of metal */
      s += '<path d="M 134 80 C 145 74 155 81 158 94 C 152 84 144 79 136 83 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
      s += '<path d="M 148 88 C 157 98 159 118 157 140 C 156 118 153 98 145 90 Z" fill="url(#' + pre + '-shi2)" opacity="0.62"/>';
      s += '<path d="M 131 84 C 127 100 129 122 137 144 C 127 126 124 100 128 84 Z" fill="url(#'
         + pre + '-crs)"/>';
      s += '<path d="M 137 132 C 139 141 140 147 140 151 L 136 151 C 135 143 135 137 134 132 Z" fill="url(#'
         + pre + '-bnc)"/>';
      /* the wrist knob */
      s += '<path d="M 140 146 C 146 145 152 146 156 148 C 151 147 145 147 140 148 Z" fill="url(#' + pre + '-shi)" opacity="0.72"/>';
    }
    s += '<g class="knee" style="--ko:' + (far ? 132 : 148) + 'px 148px"'
       + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
       + '<path d="' + BEAR.foreLo + '" fill="' + f + '"/>'
       + (far
          ? '<path d="' + BEAR.clawB + '" fill="' + P.mid2 + '"/>'
          : '<path d="M 143 148 C 144 156 145 163 146 168 L 143 168 C 142 161 142 154 142 148 Z" fill="url(#' + pre + '-shi)" opacity="0.6"/>'
          + '<path d="M 139 164 C 147 167 155 169 164 170 L 137 170 Z" fill="url(#' + pre + '-sun)" opacity="0.57"/>'
          + '<path d="' + BEAR.clawA + '" fill="url(#' + pre + '-horn)"/>'
          + '<path d="' + BEAR.clawB + '" fill="url(#' + pre + '-horn)"/>'
          + '<path d="' + BEAR.clawC + '" fill="url(#' + pre + '-horn)"/>'
          + '<path d="M 160 162 C 163 162 166 160 168 158 C 165 161 162 163 160 163 Z" fill="url(#' + pre + '-ssp)" opacity="0.7"/>')
       + '</g>';
    return s;
  }

  function bearHind(pre, far, kneeXf) {
    var P = STEEL;
    var f = far ? 'url(#' + pre + '-far)' : 'url(#' + pre + '-limb)';
    var s = '<path d="' + BEAR.hindUp + '" fill="' + f + '"/>';
    if (!far) {
      s += '<path d="M 46 84 C 55 74 68 74 79 86 C 68 79 56 79 48 89 Z" fill="url(#' + pre + '-shi)" opacity="0.98"/>';
      s += '<ellipse cx="62" cy="100" rx="16" ry="14" fill="url(#' + pre + '-spec)" opacity="0.5"/>';
      s += '<path d="M 41 96 C 38 110 40 124 46 138 C 38 124 36 108 39 96 Z" fill="url(#'
         + pre + '-crs)"/>';
      s += '<path d="M 76 98 C 84 108 85 124 78 140 C 82 124 81 108 74 99 Z" fill="url(#' + pre + '-shi2)" opacity="0.56"/>';
      s += '<path d="M 48 134 C 54 144 61 150 68 152 C 58 153 50 146 45 136 Z" fill="url(#'
         + pre + '-bnc)"/>';
      /* the ankle knob, sitting proud of the shank and the sole */
      s += '<path d="M 53 148 C 59 147 65 148 68 150 C 63 149 58 149 53 150 Z" fill="url(#' + pre + '-shi)" opacity="0.72"/>';
    }
    s += '<g class="knee" style="--ko:' + (far ? 45 : 59) + 'px 152px"'
       + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
       + '<path d="' + BEAR.hindLo + '" fill="' + f + '"/>'
       + (far ? '' :
           '<path d="M 56 150 C 57 157 58 162 59 166 L 56 166 C 55 160 55 155 55 150 Z" fill="url(#' + pre + '-shi)" opacity="0.6"/>'
         + '<path d="' + BEAR.clawR + '" fill="url(#' + pre + '-horn)"/>'
         + '<path d="M 50 165 C 60 167 69 169 79 170 L 49 170 Z" fill="url(#' + pre + '-sun)" opacity="0.63"/>')
       + '</g>';
    return s;
  }

  function bearHeadGroup(pre, lift) {
    var P = STEEL;
    var s = '';
    s += '<path d="' + BEAR.earF + '" fill="' + P.deep + '"/>';
    s += '<path d="' + BEAR.neck + '" fill="url(#' + pre + '-massd)"/>';
    s += '<path d="M 132 80 C 142 75 153 78 161 87 C 151 81 140 80 133 83 Z" fill="url(#' + pre + '-shi)" opacity="0.98"/>';
    s += '<path d="M 144 104 C 151 110 159 111 165 107 C 158 113 148 112 142 107 Z" fill="url(#'
       + pre + '-crs)"/>';

    s += '<path d="' + BEAR.skull + '" fill="url(#' + pre + '-massd)"/>';
    /* the convex braincase taking the key */
    s += '<path d="M 157 95 C 158 86 165 82 173 84 C 165 84 159 88 158 96 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<ellipse cx="170" cy="99" rx="13" ry="12" fill="url(#' + pre + '-spec)" opacity="0.45"/>';
    /* the STOP: a hard dark break where the skull drops onto the snout */
    s += '<path d="M 179 88 C 182 92 182 100 180 108 C 178 100 177 93 177 89 Z" fill="url(#' + pre + '-sun)" opacity="0.63"/>';

    s += '<path d="' + BEAR.snout + '" fill="url(#' + pre + '-mass)"/>';
    /* the long straight top of the snout is one unbroken hard highlight */
    s += '<path d="M 182 97 C 188 99 193 102 197 106 C 191 104 186 102 181 100 Z" fill="url(#' + pre + '-shi)" opacity="0.94"/>';
    s += '<path d="M 187 100 C 190 101 193 103 196 105 C 192 104 189 103 186 102 Z" fill="url(#' + pre + '-ssp)" opacity="0.65"/>';
    s += '<path d="M 180 110 C 186 113 192 114 197 112 C 191 115 183 115 179 112 Z" fill="url(#' + pre + '-sun)" opacity="0.69"/>';
    s += '<path d="' + BEAR.nose + '" fill="' + P.under + '"/>';
    s += '<circle cx="193.5" cy="106.5" r="1.4" fill="' + P.spec + '" opacity="0.85"/>';

    /* eye: small, deep set, on the skull just behind the stop */
    s += '<ellipse cx="175" cy="94" rx="2.2" ry="1.8" fill="' + P.under + '"/>';
    s += '<circle cx="175.6" cy="93.4" r="0.9" fill="' + P.spec + '" opacity="0.9"/>';

    s += '<path d="' + BEAR.earN + '" fill="url(#' + pre + '-massd)"/>';
    s += '<path d="M 154 86 C 155 82 158 80 162 81 C 158 82 155 84 154 88 Z" fill="url(#' + pre + '-shi)" opacity="0.96"/>';

    if (lift) s = '<g transform="rotate(' + lift + ' 134 82)">' + s + '</g>';
    return s;
  }

  function bearBody(pre, lift, plateOpts) {
    var P = STEEL;
    var s = '';
    s += '<path d="' + BEAR.trunk + '" fill="url(#' + pre + '-mass)"/>';
    /* same dark shadow-side contour as the bull; the steel needs it less but
       the cool grounds are nearly its own value */
    s += '<path d="M 44 100 C 47 112 54 120 62 125 C 78 132 98 134 118 133 '
       + 'C 136 132 148 128 156 123" stroke="' + P.under + '" stroke-width="1.6" '
       + 'fill="none" opacity="0.5" stroke-linecap="round"/>';
    s += '<ellipse cx="96" cy="106" rx="34" ry="14" fill="url(#' + pre + '-spec)" opacity="0.45"/>';
    /* rump, then the dip, then the hump - three hits, the hump the hardest */
    s += '<path d="M 48 74 C 56 67 69 70 80 79 C 69 75 58 74 50 79 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 88 84 C 95 90 101 93 109 92 C 100 95 91 92 86 87 Z" fill="url(#' + pre + '-shi2)" opacity="0.69"/>';
    s += '<path d="M 118 89 C 126 84 133 78 142 76 C 133 81 126 86 121 92 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 128 83 C 134 79 140 76 146 76 C 139 79 133 82 130 85 Z" fill="url(#' + pre + '-ssp)" opacity="0.85"/>';
    s += '<path d="M 56 125 C 82 133 122 137 154 127 C 124 138 82 136 54 128 Z" fill="url(#'
       + pre + '-bnc)"/>';

    if (plateOpts !== false) s += brandPlate('bear', plateOpts || {});
    s += '<g class="head" style="--ho:134px 82px">' + bearHeadGroup(pre, lift) + '</g>';
    return s;
  }

  function bearRim(pre) {
    var P = STEEL;
    var g = 'url(#' + pre + '-rim)';
    return '<path d="' + BEAR.rimCrest + '" stroke="' + g + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BEAR.rimFace + '" stroke="' + g + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BEAR.rimChest + '" stroke="' + g + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
      + '<circle cx="197" cy="107" r="1.4" fill="' + P.spec + '" opacity="0.85"/>';
  }

  function bearBloom(pre) {
    var P = STEEL;
    var d = BEAR.rimTop + ' ' + BEAR.rimCrest + ' ' + BEAR.rimFace + ' ' + BEAR.rimChest;
    return '<path d="' + d + '" stroke="' + P.bloom + '" stroke-width="8" fill="none" '
         + 'stroke-linecap="round" opacity="0.11"/>'
         + '<path d="' + d + '" stroke="' + P.bloom + '" stroke-width="3.4" fill="none" '
         + 'stroke-linecap="round" opacity="0.17"/>';
  }

  function bearRefl(pre) {
    var f = 'url(#' + pre + '-refl)';
    var s = '<g transform="matrix(1 0 0 -1.15 0 365.5)">';
    s += '<path d="' + BEAR.hindLo + '" fill="' + f + '"/>';
    s += '<path d="' + BEAR.foreLo + '" fill="' + f + '"/>';
    s += '<g transform="translate(-14 0)"><path d="' + BEAR.hindLo + '" fill="' + f + '"/></g>';
    s += '<g transform="translate(-16 0)"><path d="' + BEAR.foreLo + '" fill="' + f + '"/></g>';
    s += '</g>';
    s += '<ellipse cx="64" cy="170" rx="17" ry="2.6" fill="url(#' + pre + '-spec)" opacity="0.42"/>';
    s += '<ellipse cx="150" cy="170" rx="14" ry="2.6" fill="url(#' + pre + '-spec)" opacity="0.42"/>';
    s += '<ellipse cx="50" cy="170" rx="13" ry="2.2" fill="url(#' + pre + '-spec)" opacity="0.24"/>';
    s += '<ellipse cx="134" cy="170" rx="11" ry="2.2" fill="url(#' + pre + '-spec)" opacity="0.24"/>';
    return s;
  }

  /* ================================================================ figures */

  /* Joint positions, shared by the rig and the stance solver so the two can
     never drift apart. */
  var JOINT = {
    bull: { hip: [66, 86], hock: [58, 138], sh: [158, 88], carp: [161, 126],
            dxH: -14, dxF: -17, tail: [52, 74] },
    bear: { hip: [62, 98], hock: [59, 152], sh: [146, 92], carp: [148, 148],
            dxH: -14, dxF: -16, tail: [46, 92] }
  };
  /* near hind tucks under, far hind pushes back, the front pair are not
     parallel - anything else reads as a toy on a shelf */
  var STANCE = { hindN: -4, hindF: 5, foreN: 3, foreF: -4 };

  function figure(kind, pre, opts) {
    opts = opts || {};
    var bear = kind === 'bear';
    var anim = !!opts.anim;
    var lift = opts.lift || 0;
    var J = JOINT[bear ? 'bear' : 'bull'];
    var plate = opts.plate;
    if (plate !== false) {
      plate = plate || {};
      if (!plate.id) plate.id = pre + '-bp';
    }

    var HIND = bear ? bearHind : bullHind;
    var FORE = bear ? bearFore : bullFore;
    var body  = bear ? bearBody(pre, lift, plate) : bullBody(pre, lift, plate);
    var rim   = bear ? bearRim(pre)   : bullRim(pre);
    var bloom = bear ? bearBloom(pre) : bullBloom(pre);
    var tail  = bear
      ? '<path d="' + BEAR.tail + '" fill="url(#' + pre + '-massd)"/>'
      : '<path d="' + BULL.tail + '" fill="url(#' + pre + '-massd)"/>'
        + '<path d="' + BULL.tuft + '" fill="url(#' + pre + '-massd)"/>'
        + '<path d="M 50 72 C 44 77 39 85 36 94 C 38 84 43 76 48 71 Z" fill="url(#' + pre + '-shi2)" opacity="0.75"/>';

    var s = '';
    if (anim) {
      s += '<g class="leg p3" style="--o:' + (J.hip[0] + J.dxH) + 'px ' + J.hip[1] + 'px">'
         + '<g transform="translate(' + J.dxH + ' 0)">' + HIND(pre, true) + '</g></g>';
      s += '<g class="leg p4" style="--o:' + (J.sh[0] + J.dxF) + 'px ' + J.sh[1] + 'px">'
         + '<g transform="translate(' + J.dxF + ' 0)">' + FORE(pre, true) + '</g></g>';
      s += '<g class="tail" style="--o:' + J.tail[0] + 'px ' + J.tail[1] + 'px">' + tail + '</g>';
      s += bloom + body + rim;
      s += '<g class="leg" style="--o:' + J.hip[0] + 'px ' + J.hip[1] + 'px">'
         + HIND(pre, false) + '</g>';
      s += '<g class="leg p2" style="--o:' + J.sh[0] + 'px ' + J.sh[1] + 'px">'
         + FORE(pre, false) + '</g>';
    } else {
      /* planted: braced stance, every foot still landing on exactly y=170 */
      var hf = stanceXf(J.hip, J.hock, STANCE.hindF, J.dxH);
      var ff = stanceXf(J.sh,  J.carp, STANCE.foreF, J.dxF);
      var hn = stanceXf(J.hip, J.hock, STANCE.hindN);
      var fn = stanceXf(J.sh,  J.carp, STANCE.foreN);
      /* POSES. 'charge' (bull) and 'swipe' (bear) lift the near foreleg clear
         of the floor - rotated forward at the shoulder, folded at the knee -
         which is the single change that turns a standing figure into one
         about to move. Negative is forward/up for a right-facing animal;
         the fold is positive so the cannon tucks back under the forearm. */
      var pose = opts.pose || null;
      if (pose === 'charge' || pose === 'swipe') {
        var up   = pose === 'charge' ? -34 : -56;
        var fold = pose === 'charge' ?  46 :  36;
        fn = { outer: 'rotate(' + up + ' ' + J.sh[0] + ' ' + J.sh[1] + ')',
               knee:  'rotate(' + fold + ' ' + J.carp[0] + ' ' + J.carp[1] + ')' };
        /* weight goes onto the hinds: both tuck further under the body */
        hf = stanceXf(J.hip, J.hock, STANCE.hindF + 3, J.dxH);
        hn = stanceXf(J.hip, J.hock, STANCE.hindN - 3);
      }
      s += '<g transform="' + hf.outer + '"><g transform="translate(' + J.dxH + ' 0)">'
         + HIND(pre, true, hf.knee) + '</g></g>';
      s += '<g transform="' + ff.outer + '"><g transform="translate(' + J.dxF + ' 0)">'
         + FORE(pre, true, ff.knee) + '</g></g>';
      s += tail + bloom + body + rim;
      s += '<g transform="' + hn.outer + '">' + HIND(pre, false, hn.knee) + '</g>';
      s += '<g transform="' + fn.outer + '">' + FORE(pre, false, fn.knee) + '</g>';
    }
    return s;
  }

  /* ==================================================================== API */

  global.beastSVG = function beastSVG(kind) {
    var bear = kind === 'bear';
    var pre = bear ? 'bear' : 'bull';
    return '<svg viewBox="0 0 260 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + '<defs>' + defsFor(pre, pal(kind), SPAN[bear ? 'bear' : 'bull']) + '</defs>'
      /* the reflection sits outside .bob: the floor does not bob */
      + (bear ? bearRefl(pre) : bullRefl(pre))
      + '<g class="bob">' + figure(kind, pre, { anim: true }) + '</g>'
      + '</svg>';
  };

  global.pickSVG = function pickSVG(kind) {
    var bear = kind === 'bear';
    var pre = bear ? 'bearp' : 'bullp';
    var t = bear ? 'translate(-15 -22) scale(0.95)' : 'translate(-13 -12) scale(0.88)';
    return '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + '<defs>' + defsFor(pre, pal(kind), SPAN[bear ? 'bear' : 'bull']) + '</defs>'
      + '<g transform="' + t + '">'
      + (bear ? bearRefl(pre) : bullRefl(pre))
      + figure(kind, pre, { lift: -20 })
      + '</g></svg>';
  };

  global.faceoffSVG = function faceoffSVG() {
    /* Bull left facing right, bear right facing left, heads already lowered,
       squared up with a gap between them and lit from that gap. The bear is
       mirrored, which also flips its lighting to come from the left - exactly
       right, since the light is between them. Its brand plate is flipped back
       so the mark still reads left-to-right. */
    var s = '<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    s += '<defs>' + defsFor('fo-bull', GOLD, SPAN.bull) + defsFor('fo-bear', STEEL, SPAN.bear)
      + RG('fo-sun', 'cx="0.5" cy="0.5" r="0.5"', [
          [0, '#FFD98A', 0.55], [0.4, '#C4862A', 0.24], [1, '#C4862A', 0] ])
      + LG('fo-floor', 'x1="0" y1="0" x2="0" y2="1"', [
          [0, '#1A1206', 0.85], [0.5, '#0A0A0E', 0.5], [1, '#05070B', 0] ])
      + LG('fo-line', 'x1="0" y1="0" x2="1" y2="0"', [
          [0, '#C4862A', 0], [0.3, '#D9A055', 0.5], [0.5, '#FFE7B0', 0.9],
          [0.7, '#9FB2C6', 0.5], [1, '#5E7288', 0] ])
      + '</defs>';
    /* the low sun coming up between them */
    s += '<ellipse class="fo-sun" cx="262" cy="152" rx="140" ry="82" fill="url(#fo-sun)"/>';
    /* the dark reflective floor, and the bright line they stand on */
    s += '<rect x="0" y="178" width="520" height="22" fill="url(#fo-floor)"/>';
    s += '<rect x="0" y="177.3" width="520" height="1.4" fill="url(#fo-line)"/>';
    /* feet land on 170 in figure space; 170*1.16 - 19.2 = 178 */
    /* The bull charges: head down (+lift lowers it), near foreleg raised.
       The bear swipes: head up, near forepaw lifted high. The outer
       class-only groups carry no transform attribute, so the page can
       animate them in without fighting the scale/mirror inside. */
    s += '<g class="fo-l"><g transform="translate(0 -19.2) scale(1.16)">'
      + bullRefl('fo-bull') + figure('bull', 'fo-bull', { pose: 'charge', lift: 12 }) + '</g></g>';
    s += '<g class="fo-r"><g transform="translate(530 -19.2) scale(-1.16 1.16)">'
      + bearRefl('fo-bear')
      + figure('bear', 'fo-bear', { pose: 'swipe', lift: -8, plate: { id: 'fo-bear-bp', mirror: true } })
      + '</g></g>';
    s += '</svg>';
    return s;
  };

  global.brandPlate = brandPlate;

})(typeof window !== 'undefined' ? window : this);
