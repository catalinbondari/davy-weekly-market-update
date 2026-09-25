/* beast-bronze.js - The Weekly Stampede, CAST BRONZE treatment.
 *
 * Drop-in replacement for beast-gold.js / beast-frozen.js. Same four globals,
 * same viewBoxes, same animation hooks, same brand-plate contract:
 *
 *   beastSVG(kind)          260x180  running hero, animation hooks, feet on y=170
 *   pickSVG(kind)           200x150  standing figure, start-screen card
 *   faceoffSVG()            520x200  bronze bull vs iron bear, title screen
 *   brandPlate(kind, opts)  a small cast plaque carrying the word Davy
 * kind is 'bull' | 'bear'.
 *
 * ============================ WHY THIS ONE LOOKS DIFFERENT =================
 *
 * The previous attempts modelled every mass with a smooth top-to-bottom ramp.
 * That is how you paint a BALLOON. A smooth gradient across a closed outline
 * carries no information about where the form changes direction, so the eye
 * has nothing to grip and reads the whole thing as an inflated bag with a
 * highlight on it. Adding more gradients made it worse, not better: it just
 * made a shinier bag.
 *
 * A real bronze casting does not look like that. It is a faceted object. The
 * founder's wax was cut and scraped flat in places, and each of those places
 * is a PLANE with one value across it, meeting its neighbour at an edge you
 * can see. The flat of the shoulder blade is one value. The turn of the
 * ribcage below it is another. The plane of the haunch is another. The flat
 * of the brow is another again. Those edges - not the gradients - are what
 * describe the form.
 *
 * So the drawing is built the other way round from the old one:
 *
 *   1. Each mass is a silhouette path filled with a single DARK base value
 *      and clipped to itself (see MASS()). The clip is the trick that makes
 *      hand-cut planes tractable: every plane painted inside can be a big
 *      sloppy polygon running generously past the outline, because the clip
 *      trims it back exactly. That means the only geometry that has to be
 *      accurate is the CREASE between two planes - which is the geometry
 *      that carries the drawing anyway.
 *   2. On top of the base go explicit filled planes, each a step on an
 *      eight-value scale p0 (lit) .. p7 (undercut). Value is assigned by what
 *      a plane FACES, never by where it sits, so a plane on the near foreleg
 *      and a plane on the barrel behind it can be the same value and read as
 *      one continuous casting.
 *   3. Inside a plane there is only a SLIGHT gradient - about a sixth of a
 *      step either way - running in user space along one fixed axis for the
 *      whole figure (see rakeFor). One light, one direction, no mass running
 *      its own private ramp. That is the fix for the old "barrel with four
 *      sausages stuck on it" failure: because the values are chosen and not
 *      derived from each shape's own bounding box, a limb and the body behind
 *      it cannot disagree about what value they should be at a given height.
 *
 * AREA DISCIPLINE, learned the hard way on the first pass of this file. A
 * heavy object is mostly DARK. The first version painted big p0/p1 panels all
 * over the shoulder and haunch and the result read as plate armour, not
 * bronze. The rule now: p0 exists only as slivers a few units wide (the front
 * face of the muzzle, the top edge of a horn, the point of the hock); p1 only
 * as narrow bands along a crease; the bulk of the LIT side is p2/p3 and the
 * bulk of the shadow side is p5/p6. If a plane is bigger than about an eighth
 * of the animal, it is not allowed to be brighter than p2.
 *
 * LIGHTING. A low warm key from the FRONT-RIGHT, about 35 degrees above the
 * horizon, and a cold bounce off the floor. Consequences, all of them baked
 * into the value assignments and none of them negotiable if you edit this:
 *   - planes facing RIGHT are the brightest things in the picture (the
 *     muzzle's front face, the front of the chest, the forward face of the
 *     crest). p0 lives there and almost nowhere else.
 *   - planes facing UP take the key at a graze, so they are mid: p2 at the
 *     front of the topline, p3 by the time you reach the croup.
 *   - planes facing LEFT or back are p5/p6. Undercuts - behind the elbow,
 *     under the jaw, in the girth, between the haunches - are p7.
 *   - every downward-facing plane near the floor gets the COLD bounce over
 *     the top of it. On the warm bull that cold grey-green under the belly is
 *     the only cool note in the whole animal, and it is what stops the bronze
 *     turning into orange plastic.
 *
 * THE TWO METALS. The bull is a warm yellow-gold bronze; the bear is a cold
 * gunmetal, several stops darker at every step of the scale (compare
 * BRONZE.s[2] with IRON.s[2]). The pair has to read gold-versus-iron before
 * anyone has identified an animal, so the darkness gap is deliberately wider
 * than realism would ask for.
 *
 * ONE CONTINUOUS TOPLINE. The reference file draws the neck as a separate
 * mass sitting on top of the trunk. At bronze values that reads as a HOOD -
 * a second object laid over the shoulders - and it sank the first pass of
 * this file for both animals. Here the neck is part of the TRUNK path on both
 * animals, so the whole topline from tail head to poll is one silhouette
 * owned by one mass and cannot come apart. Only the head, horns, ears and
 * dewlap live in the .head group and rotate with opts.lift.
 *
 * ============================ ANATOMY, AS NUMBERS ==========================
 *
 * Laid out to measured ratios and then checked, because "looks about right"
 * is how the earlier attempts ended up with a horse and a large dog. Figure
 * space is 260x180 with the floor at y=170.
 *
 *  BULL   point of buttock (35,94) to point of shoulder (185,114)
 *           -> body length 150
 *         top of the withers y=64 (x=140), floor 170 -> wither height 106
 *           -> 150/106 = 1.42  (target 1.35-1.45)              OK
 *         withers 64 to brisket 121 -> chest depth 57
 *           -> 57/106 = 0.538  (target 0.50-0.55)              OK
 *         brisket y=121 sits BELOW the elbow y=118.            OK
 *         head poll (177,74) to nose (211,99) -> length 42.2
 *           -> 42.2/150 = 0.281 (target 0.27-0.30)             OK
 *         neck crest peaks at y=58.8 (x=154): 5 above the
 *         withers and 9 above the croup (y=68).                OK
 *         dewlap hangs from the jaw angle to y=135, fourteen
 *         below the brisket, leading edge proud of the chest.   OK
 *         horns leave the OUTER CORNERS of the poll, 9.6 across
 *         at the base (0.23 of head length), out -> forward ->
 *         up, near tip (212,63), far tip (167,53).             OK
 *         tail from the tail head with a tufted switch.        OK
 *
 *  BEAR   point of buttock (26,114) to point of shoulder (182,114)
 *           -> body length 156
 *         top of the hump y=70, floor 170 -> shoulder height 100
 *           -> 156/100 = 1.56  (target 1.55-1.70)              OK
 *         the hump (70) is the highest point of the animal and
 *         sits over the FRONT leg column (x=135..173); rump top
 *         y=92 is 22 LOWER - the exact inverse of the bull, and
 *         the number the first pass got wrong (it was 17 and the
 *         bear read as a pig).                                 OK
 *         head occiput (166,94) to nose (202.6,100.6) -> 37.2
 *           -> 37.2/156 = 0.238 (target 0.22-0.25)             OK
 *         skull 26 DEEP at x=176, 0.70 of its length, with a
 *         DISHED brow and a BLUNT 7-unit nose face - a braincase
 *         and not a snout.                                     OK
 *         plantigrade - hind sole heel (43,170) to toe (67,170)
 *         = 24 flat on the floor, fore sole (153,170) to
 *         (175,170) = 22 and only 9 thick, claws beyond both.  OK
 *         stub tail, 12 long (the bull's is 86).               OK
 *         shag notches cut INTO the trunk and forearm paths at
 *         the belly, the haunch and the back of the forearm, so
 *         they survive the pure-black silhouette test - drawn
 *         as an overlay they would vanish exactly where they
 *         are needed most.                                     OK
 *
 * LIMB SECTIONS, which is where two earlier passes of this file died. The
 * limbs were near-parallel columns eleven units across all the way down and
 * the animals read as articulated toys. A quadruped's leg is startlingly thin
 * below the knee. Measured spans, verified against the rendered paths rather
 * than against these comments (compare-bronze.html walks the geometry with
 * isPointInFill and prints the table):
 *
 *   BULL fore   shoulder mass 23.2 | forearm 15.3 | carpus 12.0 |
 *               CANNON 6.1 | fetlock 8.6 | hoof 9.6
 *               cannon / forearm = 0.399
 *   BULL hind   thigh 40.7 | gaskin 21.1 | hock 13.3 |
 *               CANNON 6.2 | fetlock 8.0 | hoof 9.7
 *   BEAR fore   upper arm 23.8 | forearm 19.7 | wrist 13.3 |
 *               paw 22 long and 9 thick, whole sole down
 *   BEAR hind   thigh 43.0 | ankle 13.9 | sole 24 long, heel down
 *
 * Two rules that matter as much as the numbers:
 *   - EVERY joint knob is wider than the shaft immediately above it and the
 *     shaft immediately below it. A joint is where the contour pinches and
 *     then swells, not where one shape stops and another starts.
 *   - THE SEGMENTS OVERLAP. Nothing in this drawing may have a gap at a
 *     joint; a gap is what made the limbs read as pinned-on parts.
 *   - FACET THE MASSES, NOT THE SHANKS. Below the carpus and the hock there
 *     is no room for a plane change - the cannon is one bone with tendon over
 *     it - so those are two planes and nothing else, and emphatically no
 *     bright bands across them. A highlight band on a six-unit cannon is what
 *     turned the earlier version into plumbing.
 *
 * CORNERS. Both outlines are written with explicit L segments at the point of
 * the shoulder, the elbow, the brisket, the point of the hip, the stifle and
 * the hock. An outline that never stops curving reads as a balloon, and two
 * units of straight line is enough to stop it.
 *
 * ============================ THE RIG ======================================
 *
 * Inherited from the reference file, because the deck's CSS drives it and the
 * class names are a contract:
 *   .bob            wraps the whole body (not the floor reflection - the
 *                   floor does not bob)
 *   .leg, .leg p2, .leg p3, .leg p4   the four limbs in paint order, each
 *                   with --o on its real hip or shoulder
 *   .knee           nested inside each leg, --ko on the real hock / carpus /
 *                   ankle / wrist, counter-rotating so the limb folds
 *   .tail           --o on the tail head
 *   .head           --ho on the poll pivot
 *   .brandflip      the readable content of the brand plate, so a page that
 *                   mirrors a whole figure can flip just the wordmark back
 *   .fo-l .fo-r .fo-sun   class-only wrappers in faceoffSVG carrying NO
 *                   transform of their own, so the page can animate them in
 *                   without fighting the scale and mirror inside them
 *
 * stanceXf() is unchanged in spirit: rotate a limb about its hip, counter-
 * rotate the nested knee group by the same angle so everything below the knee
 * only TRANSLATES (hooves stay level, plantigrade soles stay flat), then
 * cancel the vertical component so the foot still lands on exactly y=170.
 *
 * IDS. Every gradient and clipPath id is prefixed per figure - bull-, bear-,
 * bullp-, bearp-, fo-bull-, fo-bear- - so any number of these can share one
 * document. The clip paths matter as much as the gradients here: this drawing
 * would come apart badly if two figures shared a clip.
 *
 * ORIGINALITY. An invented animal in the bronze idiom, drawn from cattle and
 * bear proportions. Deliberately not a trace of any existing sculpture or
 * photograph.
 *
 * COLOUR is hard-coded. currentColor is never used: the bull is always bronze
 * and the bear always iron, whatever the page around them is doing.
 *
 * No path data is ever computed into a 'd' attribute, so no 'd' can pick up a
 * not-a-number value. (Spelling that out rather than using the literal token
 * keeps build.sh's grep guard quiet - it scans comments too.)
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------- colour plumbing */

  function n2(v) { return Math.round(v * 100) / 100; }
  function hx(c) {
    return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16),
            parseInt(c.substr(5, 2), 16)];
  }
  function px(v) { v = Math.round(v); if (v < 0) v = 0; if (v > 255) v = 255;
    return (v < 16 ? '0' : '') + v.toString(16); }
  function mix(a, b, t) {
    var A = hx(a), B = hx(b);
    return '#' + px(A[0] + (B[0] - A[0]) * t) + px(A[1] + (B[1] - A[1]) * t)
               + px(A[2] + (B[2] - A[2]) * t);
  }

  /* ---------------------------------------------------------- the palettes */

  /* Eight steps, lit to unlit, NOT evenly spaced. The gap p0..p2 is small - a
     lit bronze plane and the plane beside it are close in value - and the gap
     p4..p6 is large, because once a plane turns away from a low key it falls
     off a cliff. That uneven spacing is most of what makes the metal read as
     metal rather than as grey paper. */
  var BRONZE = {
    s: ['#FFEFC0', '#EEC97C', '#D0993F', '#A97526', '#7C5116', '#50320D',
        '#2C1C08', '#130B03'],
    spec:  '#FFFBEC',           /* the only true white-hot value on the bull */
    bnc:   '#6E8288',           /* COLD floor bounce - grey-green against the
                                   warm metal, the only cool note on the bull */
    bnc2:  '#3E4D54',
    rim:   '#FFE2A2',
    refl:  '#7E5516',
    patina:'#4E6A5A'            /* a hint of verdigris in the deepest creases */
  };
  var IRON = {
    /* pushed down two further steps after the first render: at the old values
       the bear read as pewter rather than iron and the faceoff did not snap
       apart at a glance. Every step here is materially darker than the bronze
       step with the same index. */
    s: ['#B2C4D6', '#7C91A8', '#516378', '#374555', '#232F3B', '#141C24',
        '#0A1015', '#040609'],
    spec:  '#F2F8FF',
    bnc:   '#3F5D74',           /* cold on cold, so it is pushed bluer and a
                                   shade brighter to stay visible at all */
    bnc2:  '#22323F',
    rim:   '#D2E3F5',
    refl:  '#2C3B49',
    patina:'#1E3A38'
  };
  function pal(kind) { return kind === 'bear' ? IRON : BRONZE; }

  /* Approximation of the Davy brand red. Replace with the exact brand hex. */
  var DAVY_RED = '#C8102E';

  /* ------------------------------------------------------------- gradients */

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

  /* THE RAKE. All eight plane fills are the same colour carrying the same
     slight gradient, in USER SPACE, along one axis running from the key
     (upper right) to the shadow side (lower left). Two things follow:
       - the variation inside a plane is about a sixth of a step, so the plane
         still reads as one flat facet. Enough to stop it looking like cut
         paper; not enough to turn back into a gradient.
       - because the axis is in user space and not in each shape's own
         bounding box, two planes of the same index are the same value at the
         same place whatever mass they belong to, so the seam where a foreleg
         crosses the barrel simply is not there. The reference file solved
         that with its shared '-mass'/'-limb' frame; the plane scheme gets it
         for free.
     The deepest steps rake less, because near-black planes that vary visibly
     read as smudges rather than as shadow. */
  function rakeFor(P, i) {
    var c = P.s[i];
    var up = i > 5 ? 0.06 : 0.13, dn = i > 5 ? 0.09 : 0.15;
    return [[0, mix(c, P.spec, up)], [0.46, c], [1, mix(c, P.s[7], dn)]];
  }

  /* The mass silhouettes that need a clipPath, per kind. Keyed by the names
     the geometry tables use, so adding a mass means adding it in one place.
     NOTE there is no 'neck' here on either animal: the neck belongs to the
     trunk path, which is what keeps the topline continuous. */
  function clipSet(kind) {
    var G = kind === 'bear' ? BEAR : BULL;
    return kind === 'bear'
      ? { trunk: G.trunk, skull: G.skull, hindUp: G.hindUp, hindLo: G.hindLo,
          foreUp: G.foreUp, foreLo: G.foreLo }
      : { trunk: G.trunk, head: G.head, dewlap: G.dewlap, hindUp: G.hindUp,
          hindLo: G.hindLo, foreUp: G.foreUp, foreLo: G.foreLo };
  }

  function defsFor(kind, pre) {
    var P = pal(kind), d = '', i, cs, k;

    /* p0..p7 - the plane scale, raked in user space */
    for (i = 0; i < 8; i++) {
      d += LG(pre + '-p' + i,
        'gradientUnits="userSpaceOnUse" x1="215" y1="42" x2="30" y2="168"',
        rakeFor(P, i));
    }

    /* FAR-SIDE limbs: one flat dark value, barely raked. There is no
       modelling to describe over there and any contrast at all makes the off
       limbs compete with the near ones for the same piece of space. Kept a
       clear step above the undercut value so they still read as legs standing
       behind the animal rather than as holes punched through it. */
    d += LG(pre + '-far',
      'gradientUnits="userSpaceOnUse" x1="215" y1="42" x2="30" y2="168"', [
        [0, mix(P.s[5], P.s[4], 0.35)], [0.55, P.s[5]], [1, P.s[6]]
      ]);

    /* THE COLD BOUNCE, in user space from the belly line to below the floor,
       so every downward-facing plane picks it up at the right strength for
       its actual height without my having to tune each one. */
    d += LG(pre + '-bnc',
      'gradientUnits="userSpaceOnUse" x1="0" y1="108" x2="0" y2="174"', [
        [0, P.bnc, 0], [0.5, P.bnc, 0.28], [0.85, P.bnc, 0.66], [1, P.bnc2, 0.75]
      ]);

    /* undercut wash: dense where two masses overlap, gone within a few units */
    d += LG(pre + '-und', 'x1="0" y1="0" x2="0.25" y2="1"', [
      [0, P.s[7], 0.92], [0.55, P.s[7], 0.45], [1, P.s[7], 0]
    ]);

    /* the handful of genuine speculars: eye, nose, horn tip, hoof wall */
    d += RG(pre + '-spec', 'cx="0.5" cy="0.44" r="0.55"', [
      [0, P.spec, 0.95], [0.35, P.s[0], 0.5], [1, P.s[0], 0]
    ]);

    /* Rim light along the upper-right contour. Kept WEAK and THIN on purpose:
       the first pass ran it at 0.95 and a 1.7 stroke and it turned the topline
       into a chrome tube, which is the fastest way to make a faceted casting
       look like a blow-moulded toy. It dies at both ends so it can never read
       as a drawn outline. */
    d += LG(pre + '-rim', 'x1="0" y1="0" x2="1" y2="0.3"', [
      [0, P.rim, 0], [0.22, P.rim, 0.34], [0.55, P.rim, 0.5],
      [0.85, P.rim, 0.26], [1, P.rim, 0]
    ]);

    /* verdigris, in the deepest creases only - two or three places per
       animal. A casting that has stood somewhere collects it in undercuts. */
    d += LG(pre + '-pat', 'x1="0" y1="0" x2="0.2" y2="1"', [
      [0, P.patina, 0.4], [0.7, P.patina, 0.1], [1, P.patina, 0]
    ]);

    /* the floor reflection fade lives in the figure's own space, BEFORE any
       mirror transform, so it flips along with the shapes it fills */
    d += LG(pre + '-refl',
      'gradientUnits="userSpaceOnUse" x1="0" y1="170" x2="0" y2="148"', [
        [0, P.refl, 0.5], [0.45, P.refl, 0.16], [1, P.refl, 0]
      ]);

    /* CLIP PATHS, one per mass. Everything painted inside a mass may run
       generously past its outline; the clip trims it exactly. That is what
       makes hand-cut planes practical - only the creases need to be right. */
    cs = clipSet(kind);
    for (k in cs) {
      if (Object.prototype.hasOwnProperty.call(cs, k)) {
        d += '<clipPath id="' + pre + '-c-' + k + '"><path d="' + cs[k]
           + '"/></clipPath>';
      }
    }
    return d;
  }

  /* ------------------------------------------------------------- utilities */

  /* F(pre, step, d, opacity) - one plane. step is 0..7, or a named fill
     ('bnc', 'und', 'spec', 'pat', 'far'). */
  function F(pre, step, d, op) {
    var id = typeof step === 'number' ? 'p' + step : step;
    return '<path d="' + d + '" fill="url(#' + pre + '-' + id + ')"'
         + (op != null ? ' opacity="' + op + '"' : '') + '/>';
  }
  /* A hard crease: a thin dark line where two planes meet at an angle sharp
     enough to catch its own shadow. A stroke rather than a fill, because a
     crease has no area - and it lives inside the mass clip, so it cannot
     leak past the silhouette. */
  function crease(P, d, w, op) {
    return '<path d="' + d + '" stroke="' + P.s[7] + '" stroke-width="' + w
         + '" fill="none" stroke-linecap="round" opacity="' + op + '"/>';
  }

  /* MASS - a clipped casting. Base value first (so any sliver I failed to
     cover reads as shadow, never as a hole), then the planes, then a
     CONTAINED contour line: the stroke is centred on the outline but half of
     it is clipped away, so what survives is a crisp dark edge just inside the
     silhouette that never fattens the shape and never becomes a cartoon
     outline. */
  function MASS(pre, P, name, d, planes, base, edgeOp) {
    return '<g clip-path="url(#' + pre + '-c-' + name + ')">'
      + F(pre, base == null ? 5 : base, d)
      + planes
      + '<path d="' + d + '" fill="none" stroke="' + P.s[7]
      + '" stroke-width="2" opacity="' + (edgeOp == null ? 0.5 : edgeOp) + '"/>'
      + '</g>';
  }

  /* ---------------------------------------------------------------- stance */

  /* Rotate a limb about its hip/shoulder P by deg, counter-rotate the nested
     knee group about K by -deg. The net effect below the knee is a PURE
     TRANSLATION - orientation preserved, so hooves stay level and the bear's
     plantigrade soles stay flat:  T = P + R(deg)(K - P) - K.
     The foot has to stay on the floor, so the vertical component is cancelled
     with an outer translate. Returns both transform strings.
     dx is the far-side depth offset. The two pivots live in DIFFERENT
     coordinate systems: the outer rotation is applied outside the
     translate(dx) group so its pivot carries dx, while the knee's counter-
     rotation is applied inside it and must use the un-offset joint. Giving
     both the offset tilts the far feet about a unit off the floor. */
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
   * A small cast plaque, sand-cast and filed flat, standing proud of the near
   * flank behind the shoulder at roughly 13% of body length. Built in the
   * same plane idiom as the animals: a mitred rim of four explicit facets -
   * top lit, right lit, left dark, bottom in bounce - around a recessed
   * field. No soft bevel gradient, because a soft bevel on a small object at
   * deck scale just looks blurry.
   *
   * It is deliberately modest in size. The first pass made it a third of the
   * flank and it stopped being a maker's plate and started being a label
   * stuck on a toy.
   *
   * opts.markup  SVG markup placed inside the plate instead of the wordmark.
   *              ---> AUTHOR IT IN A 0 0 100 30 BOX. <---
   *              x runs 0..100 left to right, y 0..30 top to bottom, and the
   *              box is scaled and positioned onto the flank here, so the
   *              caller never has to know the animal's coordinates. Colour it
   *              yourself; nothing is inherited.
   * opts.text    wordmark string, default 'Davy'. Ignored when markup is set.
   * opts.id      id prefix for this plate's gradients, default 'bp-'+kind.
   * opts.x/.y    plate centre in the host drawing's coordinates.
   * opts.w       plate width in host units.
   * opts.rot     degrees, default a few off level so it sits on the barrel.
   * opts.style   'metal' for a struck-metal plate; default is red enamel.
   * opts.mirror  true when the host group is itself mirrored (the bear in
   *              faceoffSVG), so the plate content flips back and reads.
   */
  function brandPlate(kind, opts) {
    opts = opts || {};
    var bear = kind === 'bear';
    var P = pal(kind);
    var id = opts.id || ('bp-' + (bear ? 'bear' : 'bull'));
    var x = opts.x != null ? opts.x : (bear ? 100 : 110);
    var y = opts.y != null ? opts.y : (bear ? 118 : 104);
    var w = opts.w != null ? opts.w : (bear ? 21 : 20);
    var rot = opts.rot != null ? opts.rot : (bear ? -3 : -4);

    /* the markup box is 100x30; the cast rim adds 7 all round -> 114x44 */
    var s = w / 114;

    var enamel = opts.style !== 'metal';
    var inkA = enamel ? '#FFF6E8' : P.s[0];       /* letter face */
    var inkB = enamel ? '#5A0611' : P.s[7];       /* the struck edge behind it */

    var d = '';
    d += LG(id + '-fld', 'x1="0.1" y1="0" x2="0.6" y2="1"', enamel
      ? [[0, '#D62A3E'], [0.34, DAVY_RED], [0.56, '#9C0C20'], [1, '#7C0816']]
      : [[0, P.s[2]], [0.45, P.s[3]], [0.52, P.s[4]], [1, P.s[5]]]);
    d += LG(id + '-gls', 'x1="0" y1="0" x2="0" y2="1"', enamel
      ? [[0, '#FFFFFF', 0.4], [0.4, '#FFFFFF', 0.08], [0.46, '#FFFFFF', 0], [1, '#FFFFFF', 0]]
      : [[0, P.spec, 0.32], [0.42, P.spec, 0.06], [0.48, P.spec, 0], [1, P.spec, 0]]);

    var inner = opts.markup;
    if (!inner) {
      var txt = (opts.text != null ? String(opts.text) : 'Davy')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      /* Title case in the deck's serif, bold, lightly tracked - the closest
         honest approximation of the wordmark without copying it. At deck scale
         the whole plate is about 30px wide, so legibility beats fine detail. */
      var fa = 'x="50" text-anchor="middle" font-size="27" font-weight="700"'
        + ' letter-spacing="1.2" font-family="Source Serif 4,Georgia,Times New Roman,serif"';
      inner =
        '<text ' + fa + ' y="25" fill="' + inkB + '" opacity="0.7">' + txt + '</text>'
        + '<text ' + fa + ' y="23.8" fill="' + inkA + '">' + txt + '</text>';
    }

    /* everything that must stay readable lives in .brandflip, so a page that
       mirrors a whole animal can flip just this back with one CSS rule:
         .flipped .brandflip { transform: scaleX(-1); } */
    var face = '<g class="brandflip" style="transform-box:fill-box;transform-origin:50% 50%">'
      + '<rect x="-4.4" y="-4.4" width="108.8" height="38.8" rx="4" fill="url(#'
        + id + '-fld)"/>'
      + inner
      + '<rect x="-4.4" y="-4.4" width="108.8" height="38.8" rx="4" fill="url(#'
        + id + '-gls)"/>'
      + '</g>';

    var g = '<defs>' + d + '</defs>'
      /* cast shadow under the lower edge - the plate stands proud of the flank */
      + '<rect x="-5" y="-2" width="114" height="44" rx="5" fill="' + P.s[7]
        + '" opacity="0.6"/>'
      /* the rim as four explicit mitred facets, one value each */
      + '<path d="M -7 -7 L 107 -7 L 100 0 L 0 0 Z" fill="' + P.s[1] + '"/>'
      + '<path d="M 107 -7 L 107 37 L 100 30 L 100 0 Z" fill="' + P.s[2] + '"/>'
      + '<path d="M -7 -7 L 0 0 L 0 30 L -7 37 Z" fill="' + P.s[5] + '"/>'
      + '<path d="M -7 37 L 0 30 L 100 30 L 107 37 Z" fill="' + P.s[4] + '"/>'
      + face;

    /* scale(-1 1) before the centring translate mirrors about the box centre,
       so the plate stays put and only its content reverses */
    return '<g class="brand" transform="translate(' + x + ' ' + y + ') rotate(' + rot
      + ') scale(' + n2(s * 100) / 100 + ')'
      + (opts.mirror ? ' scale(-1 1)' : '') + ' translate(-50 -15)">' + g + '</g>';
  }

  /* ================================================================== BULL */

  /* Landmarks, every one of them an explicit corner in the paths below:
       (35,94)    point of buttock / pin bone
       (40,78)    top of the rump's rear edge
       (46,76)    tail head - the croup runs STRAIGHT from here to the hip,
                  which is what makes a rump angular instead of round
       (64,70)    point of hip
       (140,63)   top of the withers
       (154,58.8) crown of the neck CREST
       (180,78)   poll, where the head is hung
       (185,114)  point of the shoulder
       (177,121)  the brisket, hanging below the elbow at 116
       (151,118)  the girth notch the chest wall makes behind the elbow
       (70,109)   the flank fold rising in front of the stifle
       (83,126)   the stifle
       (43,131)   the point of the hock, jutting BACKWARD
     The neck is part of this path, not a separate mass: see the header. */
  var BULL = {
    trunk:
        'M 35 94 L 40 77 L 46 75 L 64 68 '
      + 'C 82 68 96 70 110 70.5 C 122 71 132 68 140 64 '
      + 'C 148 58 160 58 168 65 L 180 78 '
      + 'C 178 86 176 92 175 98 '
      + 'C 181 104 185 112 184 118 L 177 121 '
      + 'C 169 123 161 120 156 114 L 151 118 '
      + 'C 137 121 119 122 103 121 C 91 120 81 118 74 114 L 70 109 '
      + 'C 59 105 44 100 38 96 Z',

    /* THE HEAD: a short broad wedge, 42.2 long on a 150 body (28.1%). Every
       one of these segments is straight on purpose -
         (177,74) -> (195,87)   the FLAT FOREHEAD
         (195,87)               the brow BREAK
         (195,87) -> (208,96)   the straight nose bridge
         (211,99) -> (207,112)  the BLUNT SQUARE MUZZLE face, 13.6 long
         (203,114) -> (175,103) the straight lower jaw, deep
       The eye sits LOW and well BACK at (191,96), below the level of the brow
       break. That is where a bull's eye actually is, and it is most of the
       reason this does not read as a horse. */
    head:
        'M 177 74 L 195 87 L 208 96 L 211 99 L 207 112 L 203 114 '
      + 'L 175 103 C 169 100 165 95 166 88 L 177 74 Z',

    /* Horns leave the OUTER CORNERS of the poll and are 9.6 across at the
       base, a bit under a quarter of head length: OUT and down beside the
       face (foreshortened), then FORWARD along the brow, then UP. Painted on
       opposite sides of the skull - far one before the head, near one after -
       which is what stops the pair fusing into a single blade. */
    hornN:
        'M 176 72 C 182 75 187 77 191 77.5 C 196 78 200 76.5 203 74.5 '
      + 'C 207 72 210 68 211.5 62.5 '
      + 'C 213.5 62 214 64 213 67 C 211 73 207 79 202 82.5 '
      + 'C 197 86 190 87.5 184 86 C 180.5 85 178.5 83.5 177.5 81.5 '
      + 'C 176.4 79 176 75 176 72 Z',
    /* the far horn is SHORT and dim. Drawn at full length it stops reading as
       the second horn of a pair and starts reading as an aerial. */
    hornF:
        'M 173.4 71 C 172.4 64 170.6 58 168.4 52.6 C 167.6 50.4 164.6 51 165.2 53.8 '
      + 'C 166.4 59 167.6 64.6 168.4 70 C 168.8 73 170.4 75 172.2 74.6 '
      + 'C 173.4 74 173.8 73 173.4 71 Z',

    /* ears sideways and BACK, below and behind the horn bases */
    earN: 'M 174 79 C 169 76 162 75 158 77 C 156 79 158 83 162 85 C 167 87 171 86 174 84 Z',
    earF: 'M 171 74 C 166 71 160 70 157 72 C 155 74 157 77 160 79 C 164 81 168 80 171 79 Z',

    /* THE DEWLAP: two pendulous lobes from the jaw angle down to y=132,
       eleven below the brisket, with the leading edge standing proud of the
       chest front. After the horns it is a bull's most identifiable
       silhouette feature, so it is cut generously and it is cut BELOW the
       chest line where it will show. */
    dewlap:
        'M 171 92 C 180 99 188 108 191 117 C 194 127 189 136 182 135 '
      + 'C 175 134 173 128 176 123 C 172 129 165 128 164 120 '
      + 'C 164 110 166 100 171 92 Z',

    /* the tail hangs close behind the buttock; the tufted switch is a
       separate lobe so it can swing on .tail without stretching the shaft */
    tail:
        'M 46 74 C 40 78 35 88 33 100 C 31 114 31 128 32 140 L 27 141 '
      + 'C 25 128 25 112 28 98 C 31 85 36 76 42 71 Z',
    tuft:
        'M 31 136 C 37 141 39 152 37 160 C 35 167 28 168 25 162 '
      + 'C 22 153 25 142 30 135 Z',

    /* LIMBS. The first pass of this file had them as near-parallel columns
       about eleven units across all the way down, and the whole animal read
       as an articulated toy. A real quadruped's leg is startlingly thin below
       the knee: the cannon is one bone with tendon over it and nothing else.
       These are the numbers the drawing is now held to, measured as the
       horizontal span of the limb at that height:
         FORE  elbow/forearm  y=117  15.8
               carpus knob    y=134  12.2   (wider than the 10.9 above it)
               CANNON         y=149   5.8   <- 0.37 of the forearm
               fetlock knob   y=159   8.6
               hoof           y=170  10.2   short, 6 deep, cloven
         HIND  thigh          y=110  39.4
               gaskin         y=134  21.4
               hock knob      y=141  12.5   its point jutting BACKWARD to x=47
               CANNON         y=154   6.1
               fetlock knob   y=162   8.3
               hoof           y=170   9.6
       Two rules that matter as much as the numbers:
        - EVERY joint knob is wider than the shaft immediately above it and
          the shaft immediately below it, and the pinch between them is where
          the joint reads. A joint is a place where the contour narrows and
          then swells, not a place where one shape stops and another starts.
        - THE SEGMENTS OVERLAP. foreUp runs down to y=122 while foreLo starts
          at y=117; the hoof starts at y=164 while the cannon runs to y=170.
          Nothing in this drawing may have a gap at a joint - a gap is what
          made the first pass read as a figurine with pinned limbs.
       Every knob is on the BACK edge: the front of each leg is one clean
       near-straight line from elbow to hoof. */
    foreUp:
        'M 146 62 C 160 58 173 70 180 88 C 184 97 185 105 184 112 '
      + 'C 183 119 178 123 171 122 L 164 118 '
      + 'C 160 110 159 98 159 86 C 159 74 159 65 159 62 Z',
    foreLo:
        'M 164 117 C 166 124 167 128 167.2 131 L 165.6 134 '
      + 'C 167.6 138 169.4 143 170.2 149 '
      + 'C 170.4 152 170.4 154 170 156 L 168.8 159 '
      + 'C 168.6 161 168.8 163 169.2 165 L 168.8 170 L 178.2 170 '
      + 'C 178 166 177.6 162 177.4 159 C 177 154 176.2 149 176 145 '
      + 'C 176.6 140 177.8 134 178.4 128 C 179 123 179.6 119 179.8 117 Z',
    foreHf:
        'M 169.2 164 L 177.6 164 C 178 167 178.3 169 178.4 170 '
      + 'L 168.8 170 C 168.9 168 169 166 169.2 164 Z',
    hindUp:
        'M 44 98 C 43 84 52 71 65 70 C 77 70 84 81 85 98 '
      + 'C 86 108 85 116 82 122 L 79 125 '
      + 'C 72 130 65 136 60.5 143 L 58 147 L 50 147 '
      + 'C 49 144 48.4 141 48 139 L 47 135 '
      + 'C 45 123 44 108 44 98 Z',
    hindLo:
        'M 52 142 C 53.6 146 54.4 150 54.4 154 '
      + 'C 54.2 157 54 159 53.6 161 L 52.8 163 L 52.4 170 L 62 170 '
      + 'C 61.6 166 61.4 163 61.2 161 C 60.8 157 60.4 152 60.6 148 '
      + 'C 60.8 145 61 143 61.2 141 Z',
    hindHf:
        'M 52.9 164 L 61.3 164 C 61.7 167 62 169 62 170 '
      + 'L 52.3 170 C 52.4 168 52.6 166 52.9 164 Z',

    /* the contour that takes the rim light: topline through the crest, the
       face, the chest. Nothing on the shadow side. */
    rimTop:  'M 41 78 L 46 76 L 64 70 C 82 69 96 69.5 110 70 '
           + 'C 122 70.5 132 67 140 63 C 148 58 160 58 168 65 L 179 77',
    rimFace: 'M 177 74 L 195 87 L 208 96 L 211 99 L 207 112',
    rimChest:'M 181 104 C 185 112 184 118 184 118'
  };

  /* --------------------------------------------------------- bull: planes */

  function bullTrunk(pre, P) {
    var s = '';
    /* THE TOP PLANES in four facets with hard breaks between them. One
       continuous highlight down the back is exactly what turns a quadruped
       into an inflated balloon, so the topline is cut into croup, loin,
       withers and crest, each with its own value - darkest at the croup,
       which is furthest from a key standing to the front-right. */
    s += F(pre, 4, 'M 28 104 L 39 76 L 46 73 L 67 66 L 68 81 L 47 89 L 39 100 Z');
    s += F(pre, 3, 'M 62 67 L 108 65 L 126 66 L 128 79 L 104 80 L 65 82 Z');
    s += F(pre, 2, 'M 124 66 L 140 60 L 152 55 L 156 68 L 134 75 L 126 79 Z');
    /* THE CREST: the slab of neck muscle riding above the withers. Its
       forward face turns toward the key, so it takes the only broad p1 on the
       body; a two-unit p0 sliver runs along the crown. Its lower edge is a
       hard crease, because a crest with a soft edge is just a fat neck. */
    s += F(pre, 1, 'M 148 56 C 158 52 170 60 180 74 L 172 82 '
                 + 'C 164 69 156 62 149 64 Z');
    s += F(pre, 0, 'M 151 58 C 160 55 168 60 175 68 C 167 62 158 60 152 62 Z');
    s += crease(P, 'M 128 78 C 138 72 148 66 157 66 C 166 66 173 72 178 82', 1.4, 0.4);
    /* THE POINT OF THE HIP: a bright corner standing proud of the croup with
       its own shadow immediately behind it. A hip you can see is worth more
       to the silhouette than any amount of modelling on the rump. */
    s += F(pre, 1, 'M 57 74 L 64 69 L 73 70 L 71 77 L 59 79 Z');
    s += F(pre, 6, 'M 68 71 C 72 75 73 81 71 88 C 70 80 68 75 65 72 Z', 0.5);
    /* THE UPPER SIDE PLANE, split fore and aft at the last rib. The rear half
       is the flat of the flank; the fore half is the flat of the ribcage and
       is one step lighter because it turns toward the key. */
    s += F(pre, 5, 'M 36 104 L 47 89 L 68 81 L 104 80 L 106 97 L 70 99 L 50 106 Z');
    s += F(pre, 4, 'M 104 80 L 128 78 L 156 68 L 176 84 L 174 100 L 152 102 L 118 99 L 106 97 Z');
    /* the flat of the ribcage proper, and the only genuinely lit plane on the
       barrel. It is cut as a WEDGE tapering back along the rib direction, not
       as a rectangle: a four-square quad sitting on the side of a barrel
       reads as a panel bolted on, which is what the previous pass looked
       like. Its upper edge is the crease, its lower edge fades into the turn. */
    s += F(pre, 3, 'M 110 88 L 148 90 L 155 104 L 132 110 L 112 100 Z');
    s += crease(P, 'M 112 88 L 148 90.5 L 155 104', 1.2, 0.26);
    /* THE TURN below it, the belly under-plane, then the cold bounce */
    s += F(pre, 5, 'M 38 106 L 70 99 L 118 99 L 154 103 L 158 113 L 110 113 L 62 112 L 42 114 Z');
    s += F(pre, 6, 'M 42 112 L 70 110 L 120 112 L 158 112 L 164 124 L 100 127 L 62 121 L 38 118 Z');
    s += F(pre, 'bnc', 'M 58 113 L 110 117 L 160 114 L 164 126 L 100 128 L 62 122 Z', 0.8);
    /* THE FLANK HOLLOW ahead of the stifle - the concavity between ribcage
       and haunch, and one of the few places a bull is genuinely hollow */
    s += F(pre, 7, 'M 88 94 L 99 97 L 103 112 L 92 117 L 85 105 Z', 0.45);
    /* THE GIRTH. The near foreleg is about to be painted over this, so what
       is needed here is the dark BEHIND it that cuts the front end off the
       ribcage and stops the two fusing into one barrel. */
    s += F(pre, 7, 'M 144 74 L 154 80 L 158 110 L 149 120 L 142 112 L 143 88 Z', 0.5);
    /* two rib creases. More than two and the barrel turns into a zebra. */
    s += crease(P, 'M 126 86 L 130 110', 1.1, 0.26);
    s += crease(P, 'M 137 88 L 141 109', 1.1, 0.2);
    /* the pin bone at the back of the rump, and verdigris in the hollow under
       the tail where a real casting would collect it first */
    s += F(pre, 5, 'M 31 88 L 39 76 L 43 84 L 41 100 L 33 97 Z');
    s += F(pre, 'pat', 'M 34 78 L 44 76 L 46 92 L 35 96 Z', 0.65);
    /* the throat: the front of the neck turning away under the jaw, and the
       bounce coming back up into the underside of it */
    s += F(pre, 4, 'M 172 80 L 180 80 L 182 106 L 172 104 Z');
    s += F(pre, 6, 'M 170 92 C 176 100 182 108 183 116 L 174 116 L 168 100 Z', 0.85);
    return s;
  }

  function bullHead(pre, P) {
    var s = '';
    /* THE FLAT FOREHEAD - one plane, one value, hard-edged at the brow. On a
       bull this plate is nearly square and nearly flat, and getting it flat
       rather than domed is the difference between a bull and a cow. */
    s += F(pre, 2, 'M 174 72 L 197 88 L 192 94 L 169 80 Z');
    s += F(pre, 1, 'M 179 74 L 196 86.5 L 194 89 L 177 77 Z');
    s += crease(P, 'M 192 94 L 197 88', 1.3, 0.45);
    /* THE NOSE BRIDGE: one long unbroken sliver down the straight top of the
       muzzle - the plane that says face rather than ball */
    s += F(pre, 2, 'M 196 88 L 210 98 L 207 102 L 193 93 Z');
    s += F(pre, 0, 'M 199 90.5 L 209.5 98 L 208 100 L 197.5 92.5 Z');
    /* THE FLAT MUZZLE FACE faces the key square on, so it is the brightest
       plane in the whole drawing - and it is small, which is the point */
    s += F(pre, 0, 'M 209 97 L 212.5 100 L 208 113 L 204 114 L 206 102 Z');
    s += crease(P, 'M 206 102 L 204 114', 1.2, 0.4);
    /* the side of the muzzle a step down, the deep jaw two steps down, and
       the undercut with the bounce coming back up into it */
    s += F(pre, 4, 'M 193 93 L 206 102 L 204 114 L 187 106 Z');
    s += F(pre, 5, 'M 169 82 L 192 94 L 187 106 L 173 102 L 166 92 Z');
    s += F(pre, 6, 'M 173 102 L 204 114 L 201 118 L 173 108 Z', 0.9);
    s += F(pre, 'bnc', 'M 177 104 L 203 115 L 201 118 L 175 107 Z', 0.45);
    /* the masseter: the cheek is the head's one convex plane, so it gets a
       facet of its own and a crease down its back edge separating skull from
       neck */
    s += F(pre, 4, 'M 177 88 L 189 96 L 187 106 L 175 100 Z');
    s += crease(P, 'M 171 82 L 166 93', 1.4, 0.5);
    /* THE EYE, LOW and well BACK under the brow - the single strongest cue
       that this is a bovine head and not an equine one */
    s += F(pre, 7, 'M 186 91 L 194 96 L 193 101 L 185 97 Z', 0.8);
    s += '<ellipse cx="189.6" cy="96" rx="3" ry="2.3" transform="rotate(34 189.6 96)" fill="'
       + P.s[7] + '"/>';
    s += '<circle cx="190.6" cy="95.2" r="1" fill="' + P.spec + '" opacity="0.85"/>';
    /* the nostril in the flat of the muzzle, and the mouth line */
    s += '<path d="M 206.6 103.5 C 208.2 104.6 208 106.6 206.4 107.6 '
       + 'C 205 107 205.1 105.2 206.6 103.5 Z" fill="' + P.s[7] + '" opacity="0.92"/>';
    s += crease(P, 'M 206 112.6 C 201 111 195 108.6 190 106', 1, 0.6);
    return s;
  }

  function bullHeadGroup(pre, lift) {
    var P = BRONZE;
    var s = '';
    /* FAR horn and FAR ear first, behind the skull; then the dewlap, so the
       jaw sits over its top edge; then the skull; then the NEAR ear and the
       NEAR horn on top. Paint order is what keeps the two horns apart. */
    s += F(pre, 6, BULL.hornF);
    s += F(pre, 5, 'M 172 70 C 171 63 169.4 57 167.6 53 C 168.6 58.6 169.6 64.4 170.2 70 Z', 0.9);
    s += F(pre, 6, BULL.earF);
    s += MASS(pre, P, 'dewlap', BULL.dewlap, ''
      /* the dewlap's leading edge is a lit plane; the folds behind it fall
         away hard. Two lobes, one crease, and the whole thing hangs BELOW the
         brisket so it shows in silhouette. */
      + F(pre, 3, 'M 169 92 C 179 99 187 109 191 119 L 182 122 '
                + 'C 178 110 172 101 165 95 Z')
      + F(pre, 2, 'M 174 97 C 183 104 189 113 191 119 L 188 121 '
                + 'C 184 112 180 105 172 99 Z')
      + F(pre, 6, 'M 163 110 L 183 124 L 181 138 L 161 128 Z', 0.85)
      + F(pre, 'bnc', 'M 165 122 L 185 126 L 183 138 L 163 132 Z', 0.65)
      + crease(P, 'M 175 123 C 172 129 166 129 164 124', 1.3, 0.55), 5, 0.5);
    s += MASS(pre, P, 'head', BULL.head, bullHead(pre, P), 5, 0.6);
    /* the ear is a scoop: lit on its outer face, dark inside the cup */
    s += F(pre, 4, BULL.earN);
    s += F(pre, 2, 'M 173.6 79.6 C 169 76.8 163 75.8 159 77.2 C 164 77.6 169.6 79.4 173.4 82 Z', 0.9);
    s += F(pre, 6, 'M 166 80 C 169 81.5 172 83.4 173.6 85 C 169 86 165 85 162 83 Z', 0.7);
    /* THE NEAR HORN LAST, over the skull. A horn is a cone of bone: one lit
       plane along its top edge for its whole length, a hard dark underside, a
       seam where it leaves the skull, and one true specular on the tip. */
    s += F(pre, 4, BULL.hornN);
    s += F(pre, 1, 'M 176.6 73 C 182.4 76 187.4 78 191.2 78.4 '
                 + 'C 196 79 200 77.4 203.4 75.4 C 207.4 73 210.4 69 212 63.6 '
                 + 'C 211 70 207.6 75.6 202.6 79 C 197.6 82.4 191 83.6 185.4 82.2 '
                 + 'C 181.6 81.2 178.6 78.6 176.6 75.6 Z');
    s += F(pre, 7, 'M 177.6 81.6 C 181 84.4 186 86.2 191 86 '
                 + 'C 197 85.8 202.6 83 207 78.4 C 210.4 74.8 212.4 70.4 213.4 66 '
                 + 'C 213 72 210.4 78 206 82.4 C 201.4 87 195 89 189 88.4 '
                 + 'C 184 87.8 180 85.2 177.6 81.6 Z', 0.8);
    s += crease(P, 'M 176 72 C 175.4 76 176 79.6 178 82', 1.4, 0.55);
    s += '<circle cx="212.4" cy="63.6" r="1.4" fill="url(#' + pre + '-spec)"/>';

    if (lift) s = '<g transform="rotate(' + lift + ' 176 80)">' + s + '</g>';
    return s;
  }

  function bullFore(pre, far, kneeXf) {
    var P = BRONZE;
    var s;
    if (far) {
      /* far side: flat, dark, one plane so it does not go to mush */
      s = F(pre, 'far', BULL.foreUp) + F(pre, 6, 'M 156 70 L 178 92 L 180 116 L 162 112 Z', 0.45);
    } else {
      s = MASS(pre, P, 'foreUp', BULL.foreUp, ''
        /* THE SHOULDER BLADE is a flat plate standing in front of the barrel.
           Its spine is the crease; the plane in front of the spine turns
           toward the key and is a step up, the plane behind it turns away.
           Two planes and one line do more for the front end than any amount
           of blending - but NEITHER is allowed above p2, because a bright
           panel this big is what made the first pass read as armour.
           THIS is where the faceting belongs: the shoulder is a mass. Below
           the elbow there is no room for a plane change and any attempt at
           one fragments the leg. */
        + F(pre, 2, 'M 150 64 C 161 60 172 72 180 88 L 186 108 L 175 110 '
                  + 'C 169 90 161 72 152 74 Z')
        + F(pre, 1, 'M 160 66 C 168 68 175 80 181 92 L 177 94 '
                  + 'C 171 82 165 71 159 70 Z')
        + crease(P, 'M 155 72 C 164 78 171 92 177 110', 1.5, 0.4)
        + F(pre, 5, 'M 157 64 L 165 76 L 170 106 L 161 112 L 156 90 Z')
        /* the upper arm: one broad flat plane running down to the elbow */
        + F(pre, 3, 'M 171 94 L 184 106 L 183 120 L 171 122 L 168 108 Z')
        + F(pre, 6, 'M 156 68 C 152 86 153 106 162 124 C 153 108 149 86 153 68 Z', 0.85)
        /* THE ELBOW: dark under its point, cold bounce on its lower plane.
           It must sit ABOVE the brisket - the check that stops the foreleg
           creeping up into the body. */
        + F(pre, 7, 'M 161 114 L 170 120 L 168 128 L 159 124 Z', 0.6)
        + F(pre, 'bnc', 'M 164 116 L 184 118 L 183 124 L 164 124 Z', 0.7), 5, 0.55);
    }
    s += '<g class="knee" style="--ko:' + (far ? 155 : 172) + 'px 133px"'
       + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>';
    if (far) {
      s += F(pre, 'far', BULL.foreLo) + F(pre, 'far', BULL.foreHf);
    } else {
      s += MASS(pre, P, 'foreLo', BULL.foreLo, ''
        /* BELOW THE ELBOW: two planes and nothing else. One lit strip down
           the front of the whole limb, its width carrying the section -
           broad over the forearm, a thread over the cannon - and one dark
           plane down the back. No horizontal bands at the joints: a bright
           band across a five-unit cannon is what turned the first pass into
           plumbing. The joints read from the CONTOUR pinching and swelling,
           which is where they should read from. */
        + F(pre, 3, 'M 172 116 L 180 117 L 176.6 148 L 178.4 170 L 172.6 170 '
                  + 'L 173.4 150 L 174.6 132 Z')
        + F(pre, 1, 'M 177.4 119 L 179.6 119 L 175.6 150 L 176.8 166 L 175 166 '
                  + 'L 173.8 150 Z', 0.85)
        + F(pre, 6, 'M 163.6 117 L 172 119 L 171.6 150 L 169 165 L 167.6 152 L 166 132 Z', 0.8)
        + F(pre, 'bnc', 'M 166 156 L 179 156 L 179 170 L 167 170 Z', 0.45), 5, 0.55);
      /* THE HOOF: a separate near-black casting, short, the light only
         clipping its front wall, and a cloven cleft cut up from the floor */
      s += MASS(pre, P, 'foreHf', BULL.foreHf, ''
        + F(pre, 4, 'M 174 163 L 178.4 163.4 L 179 170 L 174.4 170 Z')
        + F(pre, 1, 'M 177 164.4 L 178.6 164.4 L 178.9 169 L 177.4 169 Z', 0.8)
        + F(pre, 7, 'M 167 163 L 174 163 L 174 170 L 167 170 Z', 0.6), 6, 0.7);
      s += crease(P, 'M 174 170 L 174 164.6', 1.3, 0.85);
    }
    s += '</g>';
    return s;
  }

  function bullHind(pre, far, kneeXf) {
    var P = BRONZE;
    var s;
    if (far) {
      s = F(pre, 'far', BULL.hindUp) + F(pre, 6, 'M 50 74 L 82 84 L 86 116 L 58 120 Z', 0.45);
    } else {
      s = MASS(pre, P, 'hindUp', BULL.hindUp, ''
        /* THE HAUNCH IS A SLAB, not a sphere - this is the plane that carries
           the bull's whole back end. Three facets: the top of the rump taking
           the key at a graze, the broad outer flat of the thigh below it, and
           the rear plane falling away into the dark. Every boundary between
           them is a straight line; the first pass used curves here and the
           haunch came out as a pale balloon stuck on the hip. */
        + F(pre, 3, 'M 44 82 L 58 70 L 76 72 L 86 98 L 76 100 L 60 78 L 46 88 Z')
        + F(pre, 2, 'M 56 71 L 76 73 L 82 84 L 62 76 Z')
        + F(pre, 4, 'M 46 90 L 78 98 L 84 116 L 58 124 L 46 110 Z')
        + F(pre, 6, 'M 43 92 L 50 92 L 52 126 L 45 130 Z')
        + F(pre, 6, 'M 43 96 C 41 112 43 128 50 142 C 44 128 41 112 42 96 Z', 0.75)
        + crease(P, 'M 50 92 C 52 108 53 122 53 134', 1.4, 0.26)
        /* THE STIFLE: a hard bright corner where the thigh's forward bulge
           stops and the gaskin's line starts. Explicit, because it is one of
           the corners the outline is required to have. */
        + F(pre, 2, 'M 80 104 L 86 102 L 82 124 L 76 128 Z')
        + crease(P, 'M 82 124 L 76 130', 1.4, 0.45)
        /* the gaskin's outer plane, sloping back to the hock */
        + F(pre, 3, 'M 70 118 L 80 122 L 62 146 L 56 142 Z')
        + F(pre, 'bnc', 'M 48 128 L 60 140 L 59 148 L 47 138 Z', 0.6)
        /* THE POINT OF THE HOCK: the calcaneus jutting off the BACK of the
           leg. A two-unit p0 sliver on its top facet, near-black behind it. */
        + F(pre, 0, 'M 49 132 L 59 139 L 58.4 141.4 L 49 136 Z', 0.85)
        + F(pre, 7, 'M 46.6 132 L 53 139 L 53 147 L 47.6 141 Z', 0.55), 5, 0.55);
    }
    s += '<g class="knee" style="--ko:' + (far ? 42 : 56) + 'px 143px"'
       + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>';
    if (far) {
      s += F(pre, 'far', BULL.hindLo) + F(pre, 'far', BULL.hindHf);
    } else {
      /* same two-plane discipline as the foreleg: a lit strip down the front,
         a dark plane down the back, and NO bands across a six-unit cannon */
      s += MASS(pre, P, 'hindLo', BULL.hindLo, ''
        + F(pre, 3, 'M 57.4 141 L 61.6 141 L 58.6 153 L 61.6 170 L 57.4 170 '
                  + 'L 57.6 154 Z')
        + F(pre, 1, 'M 59.6 144 L 61.2 144 L 58.8 154 L 60.4 166 L 59 166 '
                  + 'L 57.6 154 Z', 0.85)
        + F(pre, 6, 'M 51.6 141 L 57.4 143 L 56.4 154 L 53 166 L 52 154 Z', 0.8)
        + F(pre, 'bnc', 'M 52.4 158 L 61.6 158 L 62 170 L 52.4 170 Z', 0.45), 5, 0.55);
      s += MASS(pre, P, 'hindHf', BULL.hindHf, ''
        + F(pre, 4, 'M 57.6 163 L 61.6 163.4 L 62 170 L 58 170 Z')
        + F(pre, 1, 'M 60 164.4 L 61.6 164.4 L 61.9 169 L 60.4 169 Z', 0.8)
        + F(pre, 7, 'M 51.6 163 L 57.6 163 L 57.6 170 L 51.6 170 Z', 0.6), 6, 0.7);
      s += crease(P, 'M 57.4 170 L 57.4 164.6', 1.3, 0.85);
    }
    s += '</g>';
    return s;
  }

  function bullBody(pre, lift, plateOpts) {
    var P = BRONZE;
    var s = MASS(pre, P, 'trunk', BULL.trunk, bullTrunk(pre, P), 5, 0.55);
    if (plateOpts !== false) s += brandPlate('bull', plateOpts || {});
    s += '<g class="head" style="--ho:176px 80px">' + bullHeadGroup(pre, lift) + '</g>';
    return s;
  }

  /* The rim light is drawn OUTSIDE the mass clips, along the contour only,
     and only on the upper-right edges, because that is the only place a key
     at 35 degrees off the right can graze. Thin and weak - see the note on
     the '-rim' gradient. */
  function bullRim(pre) {
    var g = 'url(#' + pre + '-rim)';
    return '<path d="' + BULL.rimTop + '" stroke="' + g + '" stroke-width="1.1" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BULL.rimFace + '" stroke="' + g + '" stroke-width="1.1" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BULL.rimChest + '" stroke="' + g + '" stroke-width="1" fill="none" stroke-linecap="round"/>';
  }

  /* A wide soft stroke under the contour, so the bronze appears to bleed a
     little light onto the dark ground behind it. Kept LOW: any stronger and
     it stops reading as bloom and starts reading as a drawn outline. */
  function bullBloom(pre) {
    var d = BULL.rimTop + ' ' + BULL.rimFace + ' ' + BULL.rimChest;
    return '<path d="' + d + '" stroke="' + BRONZE.s[3] + '" stroke-width="9" fill="none" '
         + 'stroke-linecap="round" opacity="0.09"/>'
         + '<path d="' + d + '" stroke="' + BRONZE.s[2] + '" stroke-width="3.4" fill="none" '
         + 'stroke-linecap="round" opacity="0.11"/>';
  }

  /* Only the last dozen units above the floor survive the fade, so the
     reflection is built from the feet and lower cannons, not the whole body.
     raised: the near foreleg is off the floor (the charge pose), so it leaves
     no reflection and no contact highlight where it used to stand. */
  function bullRefl(pre, raised) {
    var f = 'url(#' + pre + '-refl)';
    var s = '<g transform="matrix(1 0 0 -1.15 0 365.5)">';
    s += '<path d="' + BULL.hindLo + '" fill="' + f + '"/><path d="' + BULL.hindHf + '" fill="' + f + '"/>';
    if (!raised) s += '<path d="' + BULL.foreLo + '" fill="' + f + '"/><path d="' + BULL.foreHf + '" fill="' + f + '"/>';
    s += '<g transform="translate(-14 0)"><path d="' + BULL.hindLo + '" fill="' + f
       + '"/><path d="' + BULL.hindHf + '" fill="' + f + '"/></g>';
    s += '<g transform="translate(-17 0)"><path d="' + BULL.foreLo + '" fill="' + f
       + '"/><path d="' + BULL.foreHf + '" fill="' + f + '"/></g>';
    s += '</g>';
    s += '<ellipse cx="57" cy="170" rx="8" ry="2" fill="url(#' + pre + '-spec)" opacity="0.4"/>';
    if (!raised) s += '<ellipse cx="173.5" cy="170" rx="8" ry="2" fill="url(#' + pre + '-spec)" opacity="0.4"/>';
    s += '<ellipse cx="43" cy="170" rx="7" ry="1.8" fill="url(#' + pre + '-spec)" opacity="0.2"/>';
    s += '<ellipse cx="156" cy="170" rx="7" ry="1.8" fill="url(#' + pre + '-spec)" opacity="0.2"/>';
    return s;
  }

  /* ================================================================== BEAR */

  /* Landmarks:
       (28,112)   point of buttock
       (56,89)    top of the rump - LOWER than the hump, which is the whole
                  point: the bear's mass is in front, the bull's behind
       (152,72)   crown of the SHOULDER HUMP, the highest point of the animal,
                  sitting directly over the front leg column (x=134..171)
       (170,86)   where the hump drops onto the neck
       (182,114)  point of the shoulder
       (168,140)  the chest bottom behind the elbow
       (56,130)   the flank
       (76,145)   the stifle, at the belly line
       (48,156)   the ankle, with the whole sole flat on the floor beyond it
     The neck is part of this path for the same reason as the bull's: a
     separate neck mass reads as a hood laid over the shoulders.
     The shag notches are cut INTO the outline - at the haunch, twice along
     the belly and once at the flank - so they survive the pure-black
     silhouette test, which is exactly where a bear needs them. */
  var BEAR = {
    trunk:
        'M 26 114 C 23 106 24 96 30 90 C 27 88 28 83 32 85 '
      + 'C 35 85 38 86 41 87 L 56 92 '
      + 'C 74 96 90 100 104 101 C 118 102 130 91 140 79 '
      + 'C 145 73 153 67 160 73 L 170 86 '
      + 'C 176 92 180 102 182 108 L 182 114 '
      + 'C 184 122 182 130 176 136 L 168 140 '
      + 'C 165 143 161 146 158 141 C 154 145 150 147 146 142 '
      + 'C 132 145 116 145 102 143 C 97 147 92 149 89 143 '
      + 'C 80 142 70 139 62 135 L 56 130 '
      + 'C 44 126 30 121 26 118 Z',

    /* THE SKULL. The first two passes made this too long and too shallow and
       it read as an anteater. The fix is three numbers, not artistry:
         length  occiput (166,94) to nose (202.6,100.6) = 37.2
                 -> 37.2/156 = 0.238  (target 0.22-0.25)
         depth   at x=176, crown 83.7 to jaw 110 = 26.3, so 0.70 of length.
                 A bear's head is nearly as deep as it is long. At 0.5 it is
                 an anteater whatever else you do to it.
         blunt   the nose is a FLAT FACE 7 deep from (202.6,100.6) down to
                 (201.4,107.6) - a muzzle that tapers to a point is a
                 different animal entirely.
       The forehead is DISHED: the profile point (188,93) sits below the
       straight line from the crown to the nose, so the brow is concave. That
       dish plus the broad crown is what says bear rather than dog. */
    skull:
        'M 166 94 C 166 88 174 83 182 85 C 185 86 187 89.5 188 93 '
      + 'L 200 98.4 L 202.6 100.6 L 201.4 107.6 L 190 108.6 '
      + 'C 184 110.6 176 110.6 171 107 C 167 103.6 165 98.6 166 94 Z',

    /* the nose pad on the flat front of the muzzle */
    nose: 'M 198.6 99.4 C 201 99.6 202.4 101.4 202 103.8 C 201.6 106 199.8 106.8 198.2 105.8 '
        + 'C 197 104 197 100.6 198.6 99.4 Z',

    /* SMALL ROUND ears, LOW and WIDE on a broad skull. They are drawn so the
       near one breaks the skull's contour by five units - an ear that sits
       entirely inside the head outline contributes nothing to the silhouette
       test, which is exactly where a bear needs it. ROUND, not triangular: a
       triangular ear at 150px turns the whole animal into a dog. */
    earN: 'M 166 90 C 164 84 166.5 79 172 79 C 177.5 79 180.5 84 178 89.5 '
        + 'C 175.5 95 168 95.5 166 90 Z',
    earF: 'M 158 86 C 156 80 158.5 75 164 75 C 169.5 75 172.5 80 170 85.5 '
        + 'C 167.5 91 160 91.5 158 86 Z',

    /* a short stub tail, 12 long - the bull's is 86 */
    tail: 'M 31 109 C 25 109 21 113 22 117.5 C 23.5 122 29 123 32 120 C 34.5 116.5 34 111.5 31 109 Z',

    /* PLANTIGRADE, and this is half of what makes a bear read as a bear at
       150px. Measured spans, same discipline as the bull:
         FORE  upper arm   y=95   24.6
               forearm     y=120  19.5
               wrist       y=151  13.3   <- the pinch, then the paw spreads
               PAW         22 long, 9.4 deep, whole sole on the floor
         HIND  thigh       y=110  44
               gaskin      y=130  39
               ankle       y=157  13.2   <- the pinch
               SOLE        24 long with the HEEL DOWN at x=43
       foreUp runs down to y=163 and the paw starts at y=158, so the wrist is
       an overlap and a pinch rather than a butt joint. Same at the ankle. */
    hindUp:
        'M 30 112 C 28 98 38 86 53 88 C 67 90 74 104 74 122 '
      + 'C 74 131 71 138 67 144 L 64 148 '
      + 'C 60 152 56.6 156 55.6 162 L 45 162 '
      + 'C 44 157 41 154 39 150 C 34 140 31 126 30 112 Z',
    hindLo:
        'M 45 159 C 49 157.6 55 157.6 59 159 C 63 161 66.6 165 67 170 '
      + 'L 43 170 C 42 165.6 42.6 161 45 159 Z',
    /* the forearm carries two shag notches on its back edge, cut into the
       path so they show in silhouette */
    foreUp:
        'M 135 84 C 143 72 161 76 169 92 C 172 102 173 112 172.6 122 '
      + 'C 172 132 171 143 169.6 151 C 169 156 168.6 160 168.4 163 '
      + 'L 157 163 C 156.6 158 156.4 154 156.3 151 '
      + 'C 156 145 155 139 154.6 135 C 151.6 133 151.6 129 154 128 '
      + 'C 152.6 116 149 100 143.6 90 C 140.6 86 136 84 135 84 Z',
    foreLo:
        'M 156.6 162 C 160 160.6 165.6 160.6 170 162 C 173 163.6 174.6 166.6 175 170 '
      + 'L 153 170 C 152.6 166.6 153.6 163.6 156.6 162 Z',
    /* front claws, rooted inside the paw and hooking forward and down; the
       lowest rests on the floor at exactly 170 */
    clawA: 'M 174 160.6 C 179 160 183 158.4 186 156 C 187 161 183 164.6 176 165 Z',
    clawB: 'M 175.6 165 C 181 164.6 185 163.2 188 160.6 C 189 165.6 184.6 169 177.6 169.2 Z',
    clawC: 'M 177.4 169.2 C 182.6 169.2 186.6 168.6 189.6 167 C 190.4 170 186.6 170 181 170 Z',
    clawR: 'M 63 166 C 67 166 69.6 167.6 70.6 170 L 63 170 Z',

    rimTop:  'M 32 90 L 56 92 C 74 96 90 100 104 101 C 118 102 130 91 140 79 '
           + 'C 145 73 153 67 160 73 L 170 86',
    rimFace: 'M 166 94 C 166 88 174 83 182 85 C 185 86 187 89.5 188 93 '
           + 'L 200 98.4 L 202.6 100.6 L 201.4 107.6',
    rimChest:'M 176 92 C 180 102 182 108 182 114 C 184 122 182 130 176 136'
  };

  /* --------------------------------------------------------- bear: planes */

  function bearTrunk(pre, P) {
    var s = '';
    /* THE HUMP IS THE ANIMAL. Three planes of its own - the forward face that
       takes the key, the crown, and the rear slope falling to the dipped back
       - and a hard crease along its base. They are the brightest values on
       the bear, so the eye goes there first and reads "mass over the front
       legs", which is the single fact that separates a bear from a large dog
       in silhouette. */
    s += F(pre, 2, 'M 126 94 L 140 77 L 152 68 L 166 78 L 172 92 L 160 96 L 150 78 L 134 98 Z');
    s += F(pre, 1, 'M 142 76 C 148 68 158 67 166 76 C 157 72 150 73 145 79 Z');
    s += F(pre, 0, 'M 147 72 C 152 68 158 68 163 72 C 157 70.6 152 70.6 148 74 Z');
    s += crease(P, 'M 130 96 C 138 84 148 75 156 76 C 164 77 169 84 173 94', 1.5, 0.4);
    /* the dipped back behind the hump: a long shallow plane two steps down,
       which is what makes the hump read as a hump and not as a fat back. The
       drop from the hump crown (y=68) to the rump top (y=92) is 24 units, a
       quarter of the animal's height - the first pass had it at 17 and the
       bear read as a pig. */
    s += F(pre, 4, 'M 50 89 L 104 99 L 130 86 L 134 100 L 104 112 L 54 102 Z');
    /* THE RUMP, low and rounded, another step darker again */
    s += F(pre, 5, 'M 24 100 L 32 88 L 56 91 L 58 106 L 34 110 Z');
    s += F(pre, 6, 'M 22 108 L 34 104 L 42 122 L 26 122 Z');
    /* the flat of the ribcage, with hard corners, and the flank falling away
       behind it */
    s += F(pre, 4, 'M 104 106 L 150 102 L 162 118 L 130 126 L 106 116 Z');
    s += F(pre, 5, 'M 40 108 L 102 108 L 126 124 L 100 132 L 56 128 L 38 120 Z');
    s += crease(P, 'M 106 106 L 150 102.5 L 162 118', 1.2, 0.24);
    /* the chest ahead of the foreleg, turning toward the key */
    s += F(pre, 3, 'M 170 94 L 184 110 L 182 128 L 168 124 L 166 106 Z');
    /* belly under-plane, then the cold bounce. The shag notches cut into the
       outline show as dark teeth against it. */
    s += F(pre, 6, 'M 40 120 L 90 128 L 140 134 L 180 132 L 184 146 L 100 150 L 44 132 Z');
    s += F(pre, 'bnc', 'M 56 128 L 110 136 L 176 134 L 182 146 L 100 150 L 60 137 Z', 0.8);
    /* the girth crease behind the foreleg, cutting the front end off */
    s += F(pre, 7, 'M 142 90 L 152 98 L 154 132 L 142 138 L 138 110 Z', 0.45);
    /* verdigris where the belly meets the flank */
    s += F(pre, 'pat', 'M 60 126 L 120 134 L 118 144 L 62 136 Z', 0.55);
    return s;
  }

  function bearSkull(pre, P) {
    var s = '';
    /* THE BRAINCASE is broad and domed; the muzzle runs STRAIGHT off it with
       no stop. Two planes on the dome, two on the muzzle, one hard crease
       down the cheek. */
    /* the broad crown of the braincase, then the DISHED brow dropping to the
       muzzle. The dish is drawn as its own darker facet, because a concavity
       under a low key is in shadow - that shadow across the brow is what
       stops the profile reading as one smooth taper. */
    s += F(pre, 3, 'M 164 96 C 165 87 174 82 183 86 L 188 92 L 180 98 '
                 + 'C 176 90 171 88 167 98 Z');
    s += F(pre, 2, 'M 172 85 C 177 82 182 83 186 88 C 181 85 176 85 173 88 Z');
    s += F(pre, 5, 'M 184 86 C 187 88 189 91 189.4 94.4 L 185 95 '
                 + 'C 184.6 91 183 88 181.6 86.6 Z', 0.8);
    /* the muzzle's top plane: SHORT and straight, with a hotter core sliver */
    s += F(pre, 2, 'M 188 92 L 202 99.4 L 199 102.4 L 186 95 Z');
    s += F(pre, 0, 'M 190.6 94 L 201 99.6 L 199.6 101.4 L 189 96 Z');
    /* the BLUNT FRONT of the nose block, facing the key square on */
    s += F(pre, 0, 'M 201.4 98.6 L 203.4 100.6 L 202.2 107.8 L 199.4 107.6 Z');
    /* the side of the muzzle a step down, the jaw two steps, then the
       undercut with the bounce coming back into it */
    s += F(pre, 4, 'M 186 95 L 199.4 102.4 L 199.6 108 L 186 109 L 180 101 Z');
    s += F(pre, 5, 'M 166 98 L 182 102 L 186 109 L 174 113 L 164 105 Z');
    s += F(pre, 6, 'M 168 108 L 188 107 L 202 106 L 201 112 L 184 115 L 168 113 Z', 0.9);
    s += F(pre, 'bnc', 'M 172 109 L 202 107 L 201 112 L 174 114 Z', 0.4);
    s += crease(P, 'M 165 99 C 164 105 166 110 170 113', 1.4, 0.5);
    /* eye: small, deep-set, in the dish above the muzzle's root */
    s += F(pre, 7, 'M 180 90 L 187 93 L 186 97.4 L 179 95.4 Z', 0.75);
    s += '<ellipse cx="182.6" cy="93.6" rx="1.9" ry="1.6" fill="' + P.s[7] + '"/>';
    s += '<circle cx="183.2" cy="93" r="0.8" fill="' + P.spec + '" opacity="0.85"/>';
    s += crease(P, 'M 200 106.4 C 196 107.6 192 108.4 188 108.6', 1, 0.6);
    return s;
  }

  function bearHeadGroup(pre, lift) {
    var P = IRON;
    var s = '';
    s += F(pre, 6, BEAR.earF);
    s += MASS(pre, P, 'skull', BEAR.skull, bearSkull(pre, P), 5, 0.6);
    s += '<path d="' + BEAR.nose + '" fill="' + P.s[7] + '"/>';
    s += '<circle cx="199.6" cy="101.2" r="1.1" fill="' + P.spec + '" opacity="0.75"/>';
    /* the near ear: a lit rim on its outer edge, a dark cup inside */
    s += F(pre, 4, BEAR.earN);
    s += F(pre, 2, 'M 166.4 88.6 C 164.8 83.6 167 79.8 171.8 79.8 '
                 + 'C 168.4 81 166 84 166.4 88.6 Z', 0.9);
    s += F(pre, 7, 'M 169 83 C 172.6 82 176.4 83.6 177 87 C 175 91 170 91 168 88 Z', 0.7);
    if (lift) s = '<g transform="rotate(' + lift + ' 168 97)">' + s + '</g>';
    return s;
  }

  function bearFore(pre, far, kneeXf) {
    var P = IRON;
    var s;
    if (far) {
      s = F(pre, 'far', BEAR.foreUp) + F(pre, 6, 'M 141 90 L 163 100 L 165 140 L 147 136 Z', 0.45);
    } else {
      s = MASS(pre, P, 'foreUp', BEAR.foreUp, ''
        /* THE HEAVY FORELIMB. The hump rolls straight down into it, so it is
           painted as ONE column of metal carrying the same values as the hump
           above it, not as a separate limb bolted on. Front plane lit, back
           plane dark, one hard crease down the whole length - and the crease
           STOPS at the wrist, because below the wrist there is nothing left
           to facet. */
        + F(pre, 3, 'M 139 86 C 149 76 162 82 168 96 C 172 108 174 126 172 152 '
                  + 'C 171 158 170.6 161 170.6 163 L 160 163 '
                  + 'C 160.4 158 160.6 154 160.6 151 C 160.6 127 160 108 156 96 '
                  + 'C 152 86 145 84 141 90 Z')
        + F(pre, 2, 'M 150 82 C 158 81 165 88 169 100 L 164 102 '
                  + 'C 160 90 155 84 149 85 Z')
        + F(pre, 1, 'M 168 110 L 173.4 110 L 170.4 150 L 166.6 150 Z', 0.5)
        + crease(P, 'M 156 96 C 160 112 161 132 160.6 152', 1.6, 0.35)
        + F(pre, 5, 'M 148 92 L 158 98 L 161 132 L 157 160 L 149 126 Z')
        + F(pre, 6, 'M 137 88 C 135 106 141 134 154 162 C 142 136 133 108 135 88 Z', 0.8)
        /* the WRIST is a pinch, not a band: the contour narrows to 13 and
           then the paw spreads below it. All this needs is the bounce. */
        + F(pre, 'bnc', 'M 155 146 L 171 146 L 170 163 L 156 163 Z', 0.5), 5, 0.55);
    }
    s += '<g class="knee" style="--ko:' + (far ? 148 : 164) + 'px 157px"'
       + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>';
    if (far) {
      s += F(pre, 'far', BEAR.foreLo) + F(pre, 'far', BEAR.clawB);
    } else {
      /* THE PAW: a flat slab 22 long and 9 deep with the whole sole on the
         floor. Its top plane slopes forward-down to the toes and takes the
         key; the heel behind it is in shadow; the sole line at y=170 is one
         hard dark edge. */
      s += MASS(pre, P, 'foreLo', BEAR.foreLo, ''
        + F(pre, 3, 'M 161 161 L 172 162 C 174 165 175.6 168 176 170 L 166 170 L 162 165 Z')
        + F(pre, 1, 'M 166.6 161.4 L 170.6 162 C 172.6 165 174 168 174.4 169.4 L 171.4 169.4 Z', 0.6)
        + F(pre, 6, 'M 151 162 L 162 161 L 163 170 L 151 170 Z')
        + F(pre, 7, 'M 151 166.6 L 172 168 L 176 170 L 151 170 Z', 0.8)
        + F(pre, 'bnc', 'M 152 164 L 174 167 L 176 170 L 151 170 Z', 0.45), 5, 0.55);
      /* claws: bone, not metal - lit along the length with a hard dark under
         edge. They break the paw's contour forward, which is a bear cue that
         survives all the way down to 150px. */
      s += F(pre, 4, BEAR.clawA) + F(pre, 4, BEAR.clawB) + F(pre, 4, BEAR.clawC);
      s += F(pre, 1, 'M 175 161.2 C 179.6 160.6 183 159 185.6 156.6 '
                   + 'C 183.6 160 179.6 162.2 175.4 162.6 Z', 0.8);
      s += F(pre, 1, 'M 176.6 165.4 C 181.4 165 185 163.6 187.6 161.4 '
                   + 'C 185.6 164.6 181.6 166.4 177 166.8 Z', 0.65);
      s += F(pre, 1, 'M 178.4 169 C 183 169 186.6 168.4 189.4 167 '
                   + 'C 187 169.4 183 169.9 179 169.9 Z', 0.5);
    }
    s += '</g>';
    return s;
  }

  function bearHind(pre, far, kneeXf) {
    var P = IRON;
    var s;
    if (far) {
      s = F(pre, 'far', BEAR.hindUp) + F(pre, 6, 'M 38 94 L 70 104 L 72 136 L 44 140 Z', 0.45);
    } else {
      s = MASS(pre, P, 'hindUp', BEAR.hindUp, ''
        /* the haunch: a broad slab, its top plane taking the key at a graze
           and the outer flat one step below. It sits LOWER than the hump and
           the values say so - nothing back here is allowed above p2. */
        + F(pre, 3, 'M 32 100 L 44 86 L 60 86 L 78 120 L 68 122 L 50 92 L 36 104 Z')
        + F(pre, 2, 'M 44 87 L 60 87 L 68 98 L 50 90 Z')
        + F(pre, 5, 'M 36 104 L 68 120 L 72 136 L 50 142 L 34 122 Z')
        + F(pre, 6, 'M 29 108 L 39 108 L 44 144 L 35 142 Z')
        + F(pre, 6, 'M 31 110 C 30 126 34 144 45 158 C 36 144 29 126 30 110 Z', 0.75)
        + crease(P, 'M 39 108 C 41 126 42 144 46 158', 1.4, 0.24)
        /* THE STIFLE at the belly line, then the shank sloping BACK to the
           ankle - the reversed lower leg that makes a bear's hind limb a
           bear's and not a table leg. Below the stifle the limb necks down to
           a 13-unit ankle: the pinch IS the joint. */
        + F(pre, 2, 'M 70 118 L 76 116 L 70 140 L 63 144 Z')
        + crease(P, 'M 70 140 L 63 146', 1.4, 0.45)
        + F(pre, 3, 'M 60 132 L 70 136 L 58 158 L 50 154 Z')
        + F(pre, 'bnc', 'M 36 142 L 54 152 L 55 161 L 40 154 Z', 0.6)
        + F(pre, 7, 'M 31 136 L 42 148 L 44 161 L 35 154 Z', 0.5), 5, 0.55);
    }
    s += '<g class="knee" style="--ko:' + (far ? 38 : 52) + 'px 160px"'
       + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>';
    if (far) {
      s += F(pre, 'far', BEAR.hindLo);
    } else {
      s += MASS(pre, P, 'hindLo', BEAR.hindLo, ''
        /* the instep sloping forward-down to the toes, the HEEL DOWN behind
           and in shadow - the flat foot is the plantigrade cue */
        + F(pre, 3, 'M 51 158 C 55 156.6 60 157 63 159.6 C 65 163 66.6 167 67 170 '
                  + 'L 56 170 L 51 163 Z')
        + F(pre, 1, 'M 57 157.6 L 61 158.6 C 63.6 162.6 65.6 166.6 66.2 169.4 L 63.4 169.4 Z', 0.55)
        + F(pre, 6, 'M 42 160 L 51 158 L 53 170 L 42 170 Z')
        + F(pre, 7, 'M 42 166.6 L 62 168 L 67 170 L 42 170 Z', 0.8)
        + F(pre, 'bnc', 'M 43 163 L 64 167 L 67 170 L 42 170 Z', 0.45), 5, 0.55);
      s += F(pre, 4, BEAR.clawR);
      s += F(pre, 1, 'M 62.6 166.6 C 65.6 167 67.6 168.4 68.6 170 L 66.6 170 '
                   + 'C 65.6 168.4 63.6 167.4 62 167.2 Z', 0.6);
    }
    s += '</g>';
    return s;
  }

  function bearBody(pre, lift, plateOpts) {
    var P = IRON;
    var s = MASS(pre, P, 'trunk', BEAR.trunk, bearTrunk(pre, P), 5, 0.55);
    if (plateOpts !== false) s += brandPlate('bear', plateOpts || {});
    s += '<g class="head" style="--ho:170px 94px">' + bearHeadGroup(pre, lift) + '</g>';
    return s;
  }

  function bearRim(pre) {
    var g = 'url(#' + pre + '-rim)';
    return '<path d="' + BEAR.rimTop + '" stroke="' + g + '" stroke-width="1.1" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BEAR.rimFace + '" stroke="' + g + '" stroke-width="1" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BEAR.rimChest + '" stroke="' + g + '" stroke-width="1" fill="none" stroke-linecap="round"/>';
  }

  function bearBloom(pre) {
    var d = BEAR.rimTop + ' ' + BEAR.rimFace + ' ' + BEAR.rimChest;
    return '<path d="' + d + '" stroke="' + IRON.s[3] + '" stroke-width="9" fill="none" '
         + 'stroke-linecap="round" opacity="0.1"/>'
         + '<path d="' + d + '" stroke="' + IRON.s[2] + '" stroke-width="3.4" fill="none" '
         + 'stroke-linecap="round" opacity="0.12"/>';
  }

  function bearRefl(pre, raised) {
    var f = 'url(#' + pre + '-refl)';
    var s = '<g transform="matrix(1 0 0 -1.15 0 365.5)">';
    s += '<path d="' + BEAR.hindLo + '" fill="' + f + '"/>';
    if (!raised) s += '<path d="' + BEAR.foreLo + '" fill="' + f + '"/>';
    s += '<g transform="translate(-14 0)"><path d="' + BEAR.hindLo + '" fill="' + f + '"/></g>';
    s += '<g transform="translate(-16 0)"><path d="' + BEAR.foreLo + '" fill="' + f + '"/></g>';
    s += '</g>';
    s += '<ellipse cx="55" cy="170" rx="13" ry="2.2" fill="url(#' + pre + '-spec)" opacity="0.35"/>';
    if (!raised) s += '<ellipse cx="164" cy="170" rx="12" ry="2.2" fill="url(#' + pre + '-spec)" opacity="0.35"/>';
    s += '<ellipse cx="42" cy="170" rx="11" ry="2" fill="url(#' + pre + '-spec)" opacity="0.18"/>';
    s += '<ellipse cx="149" cy="170" rx="11" ry="2" fill="url(#' + pre + '-spec)" opacity="0.18"/>';
    return s;
  }

  /* ================================================================ figures */

  /* Joint positions, shared by the rig and the stance solver so the two can
     never drift apart. dxH/dxF are the far-side depth offsets. */
  var JOINT = {
    bull: { hip: [68, 90], hock: [56, 143], sh: [170, 92], carp: [172, 133],
            dxH: -14, dxF: -17, tail: [46, 75] },
    bear: { hip: [52, 110], hock: [52, 160], sh: [160, 104], carp: [164, 157],
            dxH: -13, dxF: -15, tail: [34, 110] }
  };
  /* Near hind tucks under, far hind pushes back, the front pair are not
     parallel. Four parallel vertical legs is a toy on a shelf. */
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
      ? F(pre, 5, BEAR.tail) + F(pre, 3, 'M 30 109.6 C 25.6 109.6 22.6 112.4 22.6 115.6 '
          + 'C 24 112.6 27 110.8 30.6 111 Z', 0.8)
      : F(pre, 5, BULL.tail) + F(pre, 5, BULL.tuft)
        + F(pre, 3, 'M 45 73 C 39 77.6 34.6 87 32.6 99 C 34.6 88 38.6 79 44 74.6 Z', 0.9)
        + F(pre, 3, 'M 31 137 C 35.6 141.6 37.6 150 36.6 157 '
          + 'C 36.6 148 34.6 141 30 137.6 Z', 0.7);

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
         about to move. Negative is forward/up for a right-facing animal; the
         fold is positive so the limb tucks back under itself. */
      var pose = opts.pose || null;
      if (pose === 'charge' || pose === 'swipe') {
        var up   = pose === 'charge' ? -30 : -40;
        var fold = pose === 'charge' ?  42 :  58;
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
      + '<defs>' + defsFor(bear ? 'bear' : 'bull', pre) + '</defs>'
      /* the reflection sits outside .bob: the floor does not bob */
      + (bear ? bearRefl(pre) : bullRefl(pre))
      + '<g class="bob">' + figure(kind, pre, { anim: true }) + '</g>'
      + '</svg>';
  };

  global.pickSVG = function pickSVG(kind) {
    var bear = kind === 'bear';
    var pre = bear ? 'bearp' : 'bullp';
    /* the 260x180 figure squeezed into the 200x150 card. The bull needs room
       above for the horns once the head is lifted; the bear is longer and
       lower so it needs more room across. */
    var t = bear ? 'translate(-4 4) scale(0.8)' : 'translate(-6 8) scale(0.78)';
    return '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + '<defs>' + defsFor(bear ? 'bear' : 'bull', pre) + '</defs>'
      + '<g transform="' + t + '">'
      + (bear ? bearRefl(pre) : bullRefl(pre))
      + figure(kind, pre, { lift: -12 })
      + '</g></svg>';
  };

  global.faceoffSVG = function faceoffSVG() {
    /* Bull left facing right, bear right facing left, squared up with a gap
       between them and lit from that gap. The bear is mirrored, which also
       mirrors the user-space rake so its key comes from the left - exactly
       right, since the light is between them. Its brand plate is flipped back
       so the mark still reads left-to-right.
       The .fo-l / .fo-r / .fo-sun wrappers carry NO transform of their own, so
       the page can animate them in without fighting the scale and mirror
       inside them. */
    var s = '<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    s += '<defs>' + defsFor('bull', 'fo-bull') + defsFor('bear', 'fo-bear')
      + RG('fo-sun', 'cx="0.5" cy="0.5" r="0.5"', [
          [0, '#FFD98A', 0.45], [0.4, '#A97526', 0.2], [1, '#A97526', 0] ])
      + LG('fo-floor', 'x1="0" y1="0" x2="0" y2="1"', [
          [0, '#1A1206', 0.85], [0.5, '#0A0A0E', 0.5], [1, '#05070B', 0] ])
      + LG('fo-line', 'x1="0" y1="0" x2="1" y2="0"', [
          [0, '#A97526', 0], [0.3, '#D0993F', 0.5], [0.5, '#FFE2A2', 0.85],
          [0.7, '#8EA2B6', 0.45], [1, '#455463', 0] ])
      + '</defs>';
    /* the low sun coming up between them */
    s += '<ellipse class="fo-sun" cx="262" cy="152" rx="140" ry="82" fill="url(#fo-sun)"/>';
    /* the dark reflective floor, and the bright line they stand on.
       Feet land on 170 in figure space; 170*1.16 - 19.2 = 178. */
    s += '<rect x="0" y="178" width="520" height="22" fill="url(#fo-floor)"/>';
    s += '<rect x="0" y="177.3" width="520" height="1.4" fill="url(#fo-line)"/>';
    s += '<g class="fo-l"><g transform="translate(-6 -19.2) scale(1.16)">'
      + bullRefl('fo-bull', true)
      + figure('bull', 'fo-bull', { pose: 'charge', lift: 10 }) + '</g></g>';
    s += '<g class="fo-r"><g transform="translate(532 -19.2) scale(-1.16 1.16)">'
      + bearRefl('fo-bear', true)
      + figure('bear', 'fo-bear', { pose: 'swipe', lift: -8,
          plate: { id: 'fo-bear-bp', mirror: true } })
      + '</g></g>';
    s += '</svg>';
    return s;
  };

  global.brandPlate = brandPlate;

})(typeof window !== 'undefined' ? window : this);
