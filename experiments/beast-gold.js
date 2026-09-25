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
 * ANATOMY. EVERY NUMBER BELOW IS MEASURED OFF THE RENDERED OUTLINE, not
 * eyeballed, because eyeballing is what sank three earlier attempts: the bull
 * came out as a horse, then as a deer, then as a cow, and the animals were
 * repeatedly described as looking like toys. The measuring harness that
 * produced these figures samples each path with getPointAtLength and takes
 * max(x)-min(x) inside a thin band at a given y; re-run it after any change
 * here rather than trusting the picture.
 *
 *  1. LIMBS ARE THICK AT THE TOP AND STARTLINGLY THIN AT THE BOTTOM. The one
 *     ratio that decides whether a leg reads as bone or as plumbing is
 *         cannon width / forearm width directly above it,
 *     which has to land between 0.35 and 0.40. Above 0.5 it is a tube and the
 *     animal is a toy. Measured: bull fore 6.0 / 15.3 = 0.392, bull hind
 *     6.0 / 20.5 = 0.293 against the gaskin.
 *       Bull fore  upper arm 27 -> forearm 15.3 -> carpus knob 12.5 ->
 *                  CANNON 6.0 -> fetlock 8.9 -> hoof 10.4 wide, 4.4 deep
 *       Bull hind  thigh 39.4 -> gaskin 20.5 -> hock 13.2, the point of the
 *                  hock jutting BACKWARD -> cannon 6.0 -> fetlock 8.9
 *       Bear fore  upper arm 28 -> forearm 20 -> wrist 14 -> paw 21 LONG and
 *                  9 thick, flat on the floor
 *       Bear hind  thigh 38 -> ankle 14 -> plantigrade sole 23 long, heel down
 *     Every joint knob is wider than both shafts it connects, and the
 *     segments OVERLAP by several units so the contour pinches at a joint
 *     instead of showing a seam between two stacked blocks.
 *  2. THE CONTOUR IS INTERRUPTED. A real outline breaks at the point of the
 *     hip, the point of the shoulder, the brisket, the elbow and the stifle;
 *     a balloon's does not. Those breaks are cut into the trunk path as
 *     explicit L segments, not smoothed over with another C.
 *  3. HEADS DO NOT GROW FOR CHARM, and a head that grows gets LONGER, which
 *     is the deer reading. Both are checked against body length every time
 *     they are touched, and the bull is checked against DEPTH/LENGTH as well.
 *
 *   Bull  body length 159 (buttock x=27 to point of shoulder x=185), height
 *         at the withers 114 (y=56 to floor 170), so 1.39 long - the target
 *         window is 1.35 to 1.45. Chest depth 61 = 0.54 of wither height and
 *         the BRISKET at 118 hangs 5 BELOW the elbow at 113; leg from elbow
 *         to ground 57 = 0.50 of wither height.
 *         Head poll (186,60) to the centre of the muzzle face (215,95) = 45.5,
 *         which is 0.29 of body length, and 32.8 deep across, so depth over
 *         length is 0.72. That last figure is the whole difference between a
 *         bull and a deer and it is the first thing to check.
 *         Topline: croup 59, loin dipped to 66, withers 57, and the NECK
 *         CREST piled to 43 - 16 above the croup. A forequarter that is
 *         visibly the tallest part of the animal is the strongest bull cue
 *         there is. Flat forehead, blunt squared muzzle with a 17-unit near
 *         vertical front face, deep jaw, heavy hanging dewlap from throat to
 *         keel, cloven hooves.
 *         Two horns leave the poll in opposite directions: the far one up and
 *         back, drawn before the skull, thinner and dimmer; the near one
 *         heavier, out then forward then up, drawn after it. Being on
 *         opposite sides of the skull in paint order is what stops them
 *         fusing into one blade. They are SHORT - 30 long on a 45 head - and
 *         they stay close in to the brow, because a long sweeping pair reads
 *         as a crescent moon parked above the animal rather than as horns.
 *   Bear  body length 170 (buttock x=20 to point of shoulder x=190), height
 *         at the hump 108 (y=62 to floor), so 1.57 long - target 1.55 to
 *         1.70. THE HUMP IS THE HIGHEST POINT OF THE WHOLE ANIMAL and it
 *         sits at x=152, directly over the front legs; the rump tops out at
 *         84, a full 22 LOWER. The bull does exactly the reverse, and that
 *         one relationship is what separates the two at 150px in pure black.
 *         Head 41 long (skull back 182 to nose 223) = 0.24 of body length,
 *         carried LOW and thrust forward, crown 92 against the hump's 62.
 *         A round braincase with a flat crown, a CONCAVE STOP cut into the
 *         outline, then a low straight muzzle 16 long and 13 deep. Round
 *         ears set low and wide, standing about 6 proud of the crown - a
 *         bear silhouette without two round bumps on the back of the head
 *         reads as a hippopotamus every time.
 *         Belly at 136 against floor 170: short heavy legs. THE COAT BREAKS
 *         THE CONTOUR along the belly, the haunch and the back of the
 *         forearm with shallow irregular notches 4-6 deep. They have to be
 *         irregular; an even sawtooth reads as machined teeth.
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
  /* The official crimson, published by davy-mark.js. The literal is only
     the fallback for a build made without that file. */
  var DAVY_RED = (typeof window !== 'undefined' && window.DAVY_RED) || '#B90646';

  /* the trunk's vertical span, which is the lighting frame the limbs share.
     Both were raised and deepened in the silhouette pass: the bull's crest now
     rides at 44 and its brisket at 132, the bear's hump at 61 and its shaggy
     belly edge at 138, so the frame has to cover the new masses or the
     terminator lands in the wrong place on the barrel. */
  var SPAN = { bull: [56, 121], bear: [61, 137] };

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

  /* THE MASTER RAMP IS NOT A BLEND. It is four FLAT VALUES with hard steps
     between them, because that is what a bronze looks like across a room:
     a lit top plane, one mid value over the whole side, a shadow value, and
     a near-black undercut, with a thin bounce band picked up off the floor.
     Every time this drawing has drifted toward smooth blending - and it has,
     twice - it has come out looking like an inflated shiny balloon rather
     than a casting, and the note in the header about a "narrow terminator"
     was read as licence to blend the whole barrel.
     THE ONLY SOFT PART is the top plane, 0 to 0.30, where the back genuinely
     does turn over. Below that the value changes in steps of 0.015, which is
     one or two pixels at deck scale: a hard edge, not a gradient. Value is
     assigned by WHICH WAY A SURFACE FACES, never by which body part it is,
     which is why every mass on the animal shares this one ramp in user
     space instead of running its own.
     The flat bands would read as contour lines on their own; what breaks
     them up is the per-mass specular slivers and the undercuts, so if you
     remove those the banding will start to show. */
  function RAMP(P) {
    return [
      [0,     P.hi],       /* lit top plane */
      [0.26,  P.hi2],      /* ... turning over. THE ONLY LONG SOFT STRETCH. */
      [0.33,  P.mid],      /* terminator, 0.07 wide - a plane change, not a
                              razor line. At 0.015 the steps were razors and
                              the animal came out looking like layered
                              plywood with a waterline across the barrel. */
      [0.56,  P.mid],      /* FLAT mid value across the whole side */
      [0.60,  P.sh],
      [0.76,  P.sh],       /* FLAT shadow */
      [0.80,  P.under],
      [0.93,  P.under],    /* FLAT near-black undercut */
      [0.965, P.bounce],   /* thin floor-bounce band low on the underside */
      [1,     P.sh]        /* and the very bottom edge turns away again */
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
    return [[0, P.mid2], [0.32, P.mid2], [0.38, P.sh], [0.64, P.sh],
            [0.70, P.deep], [0.88, P.deep], [0.93, P.under], [1, P.under]];
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

    /* THE HEAD RAMP: the same RAMP, but run ACROSS the skull in user space
       from the forehead plane to the underside of the jaw, so the head is
       lit as the block it is - lit top, terminator on the cheek, dark jaw,
       bounce under the chin - instead of picking up whatever value the
       trunk ramp happens to have at the muzzle's height. Bull: across the
       36-degree head axis from the poll. Bear: down the head, tilted 10. */
    d += LG(pre + '-head', 'gradientUnits="userSpaceOnUse" ' + (P === STEEL
      ? 'x1="202" y1="82" x2="192" y2="124"'
      : 'x1="191" y1="62" x2="172" y2="101"'), RAMP(P));

    /* horn / claw: lit along the length rather than across it */
    d += LG(pre + '-horn', 'x1="0" y1="0" x2="0" y2="1" gradientTransform="rotate(-52 0.5 0.5)"', [
      [0, P.spec], [0.15, P.hi], [0.21, P.mid], [0.44, P.mid],
      [0.50, P.deep], [0.80, P.deep], [0.86, P.bounce], [1, P.sh]
    ]);

    /* hoof / pad: nearly black, with the light only clipping the top edge */
    d += LG(pre + '-hoof', 'x1="0" y1="0" x2="0" y2="1"', [
      [0, P.mid2], [0.15, P.mid2], [0.21, P.sh], [0.48, P.sh],
      [0.54, P.under], [0.84, P.under], [0.89, P.bounce], [1, P.deep]
    ]);

    d += LG(pre + '-bnc', 'x1="0" y1="0" x2="0" y2="1"', [
      [0, P.bounce, 0], [0.6, P.bounce, 0.3], [1, P.bounce, 0.62]
    ]);
    d += LG(pre + '-crs', 'x1="0" y1="0" x2="0" y2="1"', [
      [0, P.under, 0.86], [0.6, P.under, 0.4], [1, P.under, 0]
    ]);
    d += LG(pre + '-rim', 'x1="0" y1="0" x2="1" y2="0"', [
      [0, P.rim, 0], [0.10, P.rim, 0.9], [0.32, P.spec, 1], [0.68, P.spec, 1],
      [0.90, P.rim, 0.9], [1, P.rim, 0]
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
    var x = opts.x != null ? opts.x : (bear ? 96 : 104);
    var y = opts.y != null ? opts.y : (bear ? 110 : 92);
    var w = opts.w != null ? opts.w : (bear ? 31 : 30);
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
    var inkB = enamel ? '#4A0019' : (bear ? P.spec : P.under);   // the struck edge behind it

    var d = '';
    d += LG(id + '-fld', 'x1="0" y1="0" x2="0" y2="1"', enamel
      ? [[0, '#E23A70'], [0.3, DAVY_RED], [0.55, '#96063A'], [0.8, '#7A052F'], [1, '#A00639']]
      : bear
        ? [[0, P.spec], [0.22, P.hi], [0.46, P.hi2], [0.54, P.mid], [1, P.mid2]]
        : [[0, P.under], [0.3, P.deep], [0.52, P.sh], [0.75, P.deep], [1, P.mid2]]);
    d += LG(id + '-bev', 'x1="0" y1="0" x2="0.3" y2="1"', [
      [0, P.spec, 0.95], [0.3, P.hi, 0.5], [0.55, P.under, 0.5], [1, P.hi2, 0.8]
    ]);
    d += LG(id + '-gls', 'x1="0" y1="0" x2="0" y2="1"', enamel
      ? [[0, '#FFFFFF', 0.62], [0.38, '#FFFFFF', 0.16], [0.44, '#FFFFFF', 0], [1, '#FFFFFF', 0]]
      : [[0, P.spec, 0.55], [0.42, P.spec, 0.12], [0.46, P.spec, 0], [1, P.spec, 0]]);

    var MARK = (typeof window !== 'undefined' && window.DAVY_MARK) || null;
    var inner = opts.markup;
    /* The real mark, centred in the 100x30 design box at its true 1:1
       proportions. It is never stretched to fill the plate - the plate is
       wider than the mark and the metal simply shows around it. */
    if (!inner && MARK && enamel) {
      inner = '<g transform="translate(6.7 -27.1) scale(1.04)">' + MARK.inner({ field: false, letterFill: '#FFF6E8' }) + '</g>';
    }
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
    /* Trunk. THE MEASUREMENTS COME FIRST and the curve is fitted to them,
       because every previous attempt was eyeballed and every previous
       attempt came out as a horse:
         point of buttock x=27, point of shoulder x=185 -> body length 158
         withers y=57, floor 170                        -> wither height 113
         body / wither height = 1.40                    (target 1.35-1.45)
         brisket y=118                 -> chest depth 61 = 0.54 of wither
                                          height (target 0.50-0.55)
         elbow y=113                   -> leg 57 = 0.50 of wither height
         brisket 118 is 5 BELOW the elbow at 113
       The L segments are the deliberate BREAKS in the contour. A contour
       that never stops curving is the balloon-animal signal; real muscle
       meets bone at an angle, so the outline corners at:
         27,94   point of the buttock (pin bone)
         47,64 / 57,59   tail head and the point of the hip - the croup runs
                 STRAIGHT between them, which is what makes a rump angular
         185,96  point of the shoulder
         178,120 the brisket, the keel hanging between the forelegs
         156,114 the notch the chest wall makes behind the elbow (the girth)
         66,104  the flank fold rising in front of the stifle
       CATTLE TOPLINE: croup 59, a shallow loin dip to 66, withers 57, with
       the neck crest piled another 14 on top of that (see BULL.neck). The
       forequarter being visibly the tallest part of the animal is the single
       strongest bull cue there is, and the old topline - withers only 3
       above croup, then level for the whole barrel - had none of it. */
    trunk:  'M 27 94 C 28 82 32 71 39 68 L 47 64 L 57 59 '
          + 'C 72 60 86 63 98 66 C 114 69 132 65 146 57 '
          + 'C 162 52 178 64 183 82 L 185 96 '
          + 'C 187 106 186 114 182 118 L 178 120 '
          + 'C 171 122 163 119 156 114 '
          + 'C 138 118 116 119 100 117 C 86 116 76 112 70 108 L 66 104 '
          + 'C 54 99 36 92 30 89 L 27 94 Z',
    /* THE CREST IS THE BULL. The neck is a wedge carrying the morrillo - the
       slab of muscle over the withers - and its peak at 44 stands 13 above
       the withers and 17 above the croup. Its front face then falls away
       STEEPLY, 44 to 66 in 29 units of x, because a crest that eases down to
       the poll reads as a mane and a crest that falls off a cliff reads as a
       bull. The head is a separate block hung on the front of it, so the
       neck's front edge is entirely under the skull; the throat runs only a
       short way before the dewlap takes over, which is what gives the animal
       almost no visible throat gap. */
    neck:   'M 130 66 C 136 53 146 43 162 43 C 175 44 184 52 188 64 '
          + 'L 182 82 C 185 92 187 102 186 109 C 185 116 179 119 171 116 '
          + 'C 159 112 148 99 141 85 C 136 76 132 70 130 66 Z',
    /* THE HEAD. This is the shape that has sunk every previous attempt: a
       long tapering wedge reads as a horse or a deer no matter how good the
       horns are. So it is now measured as a BLOCK and checked both ways.
         poll (186,60) to the centre of the muzzle face (215,95) = 45.5
         body length, buttock 27 to point of shoulder 185        = 158
         ratio 0.288, inside the 0.27-0.30 window
         depth across the head, brow plane to jaw angle          = 32.8
         depth / length = 0.72, against 0.57 before
       0.72 is what a bovine head actually measures and it is the whole
       difference. The outline is: a FLAT forehead from the poll to a break
       at the brow (211,74.5); a SHORT straight nose bridge; then a blunt
       nearly vertical MUZZLE FACE 17 deep from (219,90) to (210,105); the
       chin carried forward; and a straight jaw running back to a deep
       rounded jaw angle at (175,82.5). Filled with -head, a user-space
       ramp running across the head from the forehead plane to under the
       jaw, so the muzzle keeps the lit top and dark underside of a block
       instead of taking whatever value the trunk ramp has at that height. */
    head:   'M 186 60 C 194.5 60 203 64 208 70.5 L 211 74.5 '
          + 'C 214.5 77 217 80 218.2 83 C 220 86.5 220.2 91 218.6 95.6 '
          + 'C 217.2 100 213.8 103.5 209.8 105 C 205.2 106.4 200.6 105.5 196.6 103 '
          + 'L 187 99 C 179 95 175 89.5 175 82.5 '
          + 'C 175 73.5 179.5 64 186 60 Z',
    /* ears sideways, below and behind the horn bases, pointing back */
    earN:   'M 181 69 C 177 63 169 60 161 61 C 157 62 156.5 67 161 70 '
          + 'C 167.5 73.5 175 75.2 180 75.2 Z',
    earF:   'M 180 64 C 175.5 59 167.5 56.2 160.5 56.8 C 157.5 57.9 157.8 61.9 161.5 63.6 '
          + 'C 167 66.2 173.5 68.2 178 69.1 Z',
    /* THE HORNS ARE THE SPECIES, and they are now built from a centreline
       with an explicit half-width at each station rather than swept by
       formula, because the swept version came out thickest in the MIDDLE -
       which reads as a tube bent round the head, not as horn. Half-widths
       run 5.5 at the poll to 0.3 at the tip, so both taper the whole way.
       SIZE. This has been wrong in both directions. At 45 long on a 45 head
       the pair read as a crescent moon parked above the animal and the eye
       took the arc for the subject; shrunk to 30 they became nubs that
       disappeared into the skull. They are now 37 long - 0.81 of head
       length - and 14.4 across at the poll, which is the proportion a heavy
       bronze bull actually carries, and the near one is held clear of the
       brow by 4 to 6 units so a sliver of background separates them at any
       size. Horn and skull must never share an edge.
       NEAR horn: leaves the outer corner of the poll, sweeps OUT and forward
       over the brow, then hooks UP to a tip at (216,40) above and ahead of
       the face.
       FAR horn: leaves the far corner, goes up and slightly BACK behind the
       skull, then hooks forward at the tip (177,34). Drawn on opposite sides
       of the skull in paint order, the near one last. */
    hornN:  'M 182.9 52.8 C 187.5 50.8 192.5 50.4 197 50.9 '
          + 'C 201.4 51 205.2 49.8 208.6 47.5 '
          + 'C 211 45.4 213.6 42.4 216 40 '
          + 'C 216.8 42 215.6 46.4 213.4 52.6 '
          + 'C 210 58 205.4 61.6 201 61.1 '
          + 'C 195 61 189.6 63.4 187.1 67.2 '
          + 'C 184 63.6 182.2 57 182.9 52.8 Z',
    hornF:  'M 173.7 61.1 C 171.4 56 170 51 169.5 46.6 '
          + 'C 169.4 41.6 172 36.6 177 34 '
          + 'C 177.8 36.8 177.6 41 178.5 45.4 '
          + 'C 180 50.4 183.4 54.6 186.3 54.9 '
          + 'C 182.8 59.4 177.4 61.6 173.7 61.1 Z',
    /* THE DEWLAP is a silhouette feature, not a detail. It hangs in two
       loose lobes down past the brisket to 135, and its leading edge stands
       proud of the neck's throat line - far enough that at 150px the front
       of the animal reads as one continuous heavy curtain from throat to
       keel, which nothing but cattle has.
       It now STARTS FURTHER BACK, at (177,98) rather than at the jaw. Hung
       off the jaw it merged with the muzzle into a single unreadable lobe
       and the head disappeared; starting it behind and below the jaw angle
       leaves the chin and the jaw line projecting clear of it. */
    dewlap: 'M 177 98 C 185 104 191 112 194 121 C 196 128 193 134 187 135 '
          + 'C 181 135 178 131 181 126 C 177 130 172 129 170 123 '
          + 'C 169 114 172 106 177 98 Z',
    /* the tail hangs close behind the buttock, tufted to the hock */
    tail:   'M 39 66 C 32 71 27 80 24 93 C 22 107 22 121 23 133 L 18 134 '
          + 'C 16 121 16 104 19 90 C 22 78 28 69 35 64 Z',
    tuft:   'M 22 130 C 26 135 28 146 26 154 C 24 160 19 162 16 157 '
          + 'C 13 150 15 137 20 131 Z',

    /* LIMBS. MEASURED, not drawn. The previous pass made them near-constant
       columns and the animal read as a toy: a real quadruped's leg is thick
       at the top and startlingly thin at the bottom, and the single number
       that decides whether it reads as bone or as pipe is
           cannon width / forearm width directly above it
       which must land at 0.35-0.40. Above 0.5 it is a tube. Measured off
       the constants below: 6.0 / 15.2 = 0.395 fore, 6.0 / 15.5 = 0.387 hind.
       Bull fore (foreUp carries shoulder + upper arm + FOREARM):
         shoulder/upper arm  80..118   30 -> 22
         forearm at y=121              15.2   just below the elbow
         forearm at y=132              12.4
         carpus knob  y=140            12.4   juts BACKWARD past the forearm
         cannon       y=150..158        6.0   the thinnest link
         fetlock      y=162             8.9   knob again
         hoof         y=166..170       10.4   wide and SHORT, 4.4 deep
       Bull hind (hindUp carries thigh + gaskin down to the hock):
         thigh   y=96                  39.6   slab, STIFLE break at 67,126
         gaskin  y=137                 19.5
         hock    y=141                 13.0   point of the hock a corner at 33
         cannon  y=150..158             6.0
         fetlock y=162                  8.9
         hoof    y=166..170            10.4
       THERE ARE NO GAPS. Every segment's path overlaps the one above it by
       several units, so the contour pinches at a joint instead of showing a
       seam between two stacked blocks, and every knob is wider than both
       shafts it connects.
       THE FOLD JOINT MOVED. .knee now pivots on the real carpus (168,140)
       and the real hock (44,140) and contains only cannon, fetlock and
       hoof; the forearm and the gaskin belong to the segment above and no
       longer swing with the fold. Hoof and sole geometry is untouched by
       any of it: every foot still bottoms out on the literal y=170 that the
       ground line depends on. */

    /* shoulder blade, upper arm and the ELBOW jutting back at 152,112. The
       whole mass was raised and lengthened with the withers: its top edge
       now runs under the crest at 58 and its bottom sits in the brisket, so
       the forequarter reads as one continuous column of muscle from the
       crest to the ground rather than a leg pinned onto a barrel. */
    foreUp: 'M 146 58 C 159 52 175 62 182 80 C 186 90 187 100 185 109 '
          + 'C 183 114 180 118 178 120 L 176.5 122 '
          + 'C 175.5 128 175 134 174.5 138 '
          + 'C 174.5 142 173 143.5 170.5 143.5 '
          + 'L 164.5 143.5 '
          + 'C 162.2 143.5 161.8 141.5 162 139 '
          + 'C 162.6 135 163.4 130 164.6 126 L 161 117 '
          + 'C 160 106 159 96 156 86 C 152 74 148 64 146 58 Z',
    foreLo: 'M 164.5 138 C 164.8 142 165 146 165 150 '
          + 'C 165 153 165 156 165 158 '
          + 'C 163.6 159.4 163.4 161 163.5 162.4 '
          + 'C 163.6 164 164.2 165.2 164.6 166 '
          + 'L 171.4 166 '
          + 'C 171.8 165.2 172.2 164 172.4 162.4 '
          + 'C 172.4 161 172 159.4 171 158 '
          + 'C 171 156 171 153 171 150 '
          + 'C 171 146 171.2 142 171.5 138 Z',
    foreHf: 'M 164.8 165.6 C 163.4 166.8 162.8 168.4 162.8 170 L 173.2 170 '
          + 'C 173.2 168.4 172.6 166.8 171.2 165.6 C 169 166.4 167 166.4 164.8 165.6 Z',
    /* thigh over the croup, stifle break, gaskin sloping back to the point
       of the hock */
    hindUp: 'M 34 84 C 36 71 45 61 57 60 C 69 61 72 76 72 96 '
          + 'C 72 108 71 116 70 121 L 67 126 '
          + 'C 61 131 53 136 48.5 140 '
          + 'C 47.6 141.4 47.4 142.6 47.4 144 '
          + 'C 47.4 145.6 46.2 146.4 44.6 146.4 '
          + 'L 40 146.4 '
          + 'C 38.4 146.4 37.4 145.2 37.2 143.4 '
          + 'C 36.8 141.4 35.4 140.4 33 139.4 L 32.4 136 '
          + 'C 32 127 32 113 32.4 103 C 32.6 93 33 88 34 84 Z',
    hindLo: 'M 40.5 138 C 40.8 142 41 146 41 150 '
          + 'C 41 153 41 156 41 158 '
          + 'C 39.6 159.4 39.4 161 39.5 162.4 '
          + 'C 39.6 164 40.2 165.2 40.6 166 '
          + 'L 47.4 166 '
          + 'C 47.8 165.2 48.2 164 48.4 162.4 '
          + 'C 48.4 161 48 159.4 47 158 '
          + 'C 47 156 47 153 47 150 '
          + 'C 47 146 47.2 142 47.5 138 Z',
    hindHf: 'M 40.8 165.6 C 39.4 166.8 38.8 168.4 38.8 170 L 49.2 170 '
          + 'C 49.2 168.4 48.6 166.8 47.2 165.6 C 45 166.4 43 166.4 40.8 165.6 Z',

    rimFace: 'M 186 60 C 194.5 60 203 64 208 70.5 L 211 74.5 '
           + 'C 214.5 77 217 80 218.2 83 C 220 86.5 220.2 91 218.6 95.6 '
           + 'C 217.2 100 213.8 103.5 209.8 105',
    rimTop:  'M 35 74 C 36 71 38 69 39 68 L 47 64 L 57 59 '
           + 'C 72 60 86 63 98 66 C 114 69 132 65 146 57',
    rimCrest:'M 132 65 C 137 53 147 43 162 43 C 175 44 184 52 188 64',
    rimChest:'M 178 120 C 184 113 187 102 185 94 C 184 89 183 86 182 83'
  };

  function bullFore(pre, far, kneeXf) {
    var P = GOLD;
    var f = far ? 'url(#' + pre + '-far)' : 'url(#' + pre + '-limb)';
    var hf = far ? 'url(#' + pre + '-far)' : 'url(#' + pre + '-hoof)';
    var s = '<path d="' + BULL.foreUp + '" fill="' + f + '"/>';
    if (!far) {
      /* THE SHOULDER IS ITS OWN MASS in front of the barrel: the blade takes
         the key along its spine, the upper arm is a broad flat plane, and
         the crease behind them cuts the front end off the ribcage */
      s += '<path d="M 152 62 C 164 56 176 66 182 81 C 175 70 165 64 155 68 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
      s += '<path d="M 169 72 C 179 85 184 99 183 112 C 181 99 175 86 166 74 Z" fill="url(#' + pre + '-shi2)" opacity="0.2"/>';
      s += '<ellipse cx="169" cy="91" rx="10" ry="15" fill="url(#' + pre + '-spec)" opacity="0.1"/>';
      s += '<path d="M 147 62 C 145 80 146 98 153 116 C 146 100 143 80 145 62 Z" fill="url(#'
         + pre + '-sun)" opacity="0.55"/>';
      /* THE ELBOW: dark under its point, floor bounce on its lower plane */
      s += '<path d="M 161 117 C 159 120 159.5 124 163.5 126 C 167.5 128 172 128 176 126 '
         + 'C 170 125 164 122 162 119 Z" fill="url(#' + pre + '-sun)" opacity="0.42"/>';
      s += '<path d="M 160 116 C 165 121 171 124 177.5 122 C 170 126 162 124 158 118 Z" fill="url(#'
         + pre + '-bnc)"/>';
      /* THE FOREARM, which now belongs to this segment: a broad flattened
         slab with its lit edge on the front, narrowing as it runs down to
         the carpus. The highlight narrows WITH the bone - the same sliver
         held at constant width down the leg is what makes a limb read as a
         length of pipe. */
      s += '<path d="M 176.2 123 C 175.4 129 174.9 134 174.6 139 L 171.8 139 '
         + 'C 172.2 134 172.9 129 173.6 123 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
      s += '<path d="M 175.7 125 C 175.1 130 174.8 134 174.6 137.5 L 173.4 137.5 '
         + 'C 173.7 134 174.1 130 174.6 125 Z" fill="url(#' + pre + '-ssp)" opacity="0.7"/>';
      s += '<ellipse cx="169" cy="129" rx="4.6" ry="8" fill="url(#' + pre + '-shi2)" opacity="0.32"/>';
      /* THE CARPUS: a knob wider than both shafts, lit across its top and
         dark in the hollow behind it */
      s += '<ellipse cx="168.4" cy="140" rx="5" ry="2.8" fill="url(#' + pre + '-spec)" opacity="0.55"/>';
      s += '<path d="M 163.6 130 C 162.8 134 162.4 137.4 162.6 141 '
         + 'C 161.4 137.4 161.6 133.6 162.4 129.6 Z" fill="url(#' + pre + '-sun)" opacity="0.5"/>';
    }
    s += '<g class="knee" style="--ko:' + (far ? 151 : 168) + 'px 140px"'
       + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
       + '<path d="' + BULL.foreLo + '" fill="' + f + '"/>'
       + (far ? '' :
           /* THE CANNON is the thinnest link in the whole animal and its
              highlight is a thread, not a band: 1.6 wide on a 6-wide bone.
              A bead at the fetlock, and the back of the cannon kept dark so
              the bone reads as a flattened blade seen edge-on. */
           '<path d="M 170.6 140 C 170.4 146 170.4 152 170.4 158 '
           + 'C 170.4 161 170.8 163.6 171.2 166 L 169.6 166 '
           + 'C 169.2 163.6 168.9 161 168.9 158 '
           + 'C 168.9 152 168.9 146 169 140 Z" fill="url(#' + pre + '-shi)" opacity="1"/>'
         + '<path d="M 170.2 144 C 170.1 148 170.1 152 170.1 156 L 169.2 156 '
           + 'C 169.2 152 169.2 148 169.3 144 Z" fill="url(#' + pre + '-ssp)" opacity="0.7"/>'
         + '<ellipse cx="168" cy="162.4" rx="3.2" ry="2.6" fill="url(#'
           + pre + '-spec)" opacity="0.55"/>'
         + '<path d="M 165.6 144 C 165.2 149 165.2 154 165.4 158.6 '
           + 'C 164.4 154 164.4 148.6 164.8 143.8 Z" fill="url(#' + pre + '-sun)" opacity="0.5"/>')
       + '<path d="' + BULL.foreHf + '" fill="' + hf + '"/>'
       + (far ? '' :
           /* cloven: the cleft, and the lit wall of the front claw */
           '<path d="M 168 170 L 168 166.2" stroke="' + P.under
           + '" stroke-width="1.4" fill="none" opacity="0.85"/>'
         + '<path d="M 171.4 166 C 172.6 167 173.2 168.4 173.2 170 L 170.8 170 '
           + 'C 170.8 168.4 170.2 167 169.2 166.2 Z" fill="url(#'
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
      /* THE HAUNCH: a hit that follows the thigh's own curve from the hip
         down its front, and a soft broad convexity - never a sphere */
      s += '<path d="M 45 66 C 57 60 70 70 72 88 C 68 74 60 66 48 71 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
      s += '<ellipse cx="54" cy="92" rx="15" ry="16" fill="url(#' + pre + '-spec)" opacity="0.12"/>';
      s += '<path d="M 37 103 C 43 113 53 121 66 121 C 53 125 41 118 35 108 Z" fill="url(#' + pre + '-shi2)" opacity="0.26"/>';
      s += '<path d="M 34 84 C 31 98 31 114 36 130 C 29 114 28 97 32 84 Z" fill="url(#'
         + pre + '-crs)"/>';
      /* THE STIFLE: a hard bright corner where the thigh's forward bulge
         stops and the gaskin's line starts */
      s += '<path d="M 72 102 L 70 121 L 67 126 C 64 129 60 132 55 135 '
         + 'C 59 131 63 127 65 123 L 69 102 Z" fill="url(#' + pre + '-shi)" opacity="0.8"/>';
      /* THE GASKIN: a flat outer plane that NARROWS hard as it runs down to
         the hock, from 19.5 across to 13 in seven units */
      s += '<path d="M 66 112 C 67 120 62 129 53 137 C 57 129 60 121 61 113 Z" fill="url(#' + pre + '-shi2)" opacity="0.5"/>';
      s += '<path d="M 34 124 C 38 132 44 137 51 138 C 43 141 36 135 32 127 Z" fill="url(#'
         + pre + '-bnc)"/>';
      /* THE POINT OF THE HOCK: dark on its back plane, bright along the top
         of the joint - the calcaneus jutting off the BACK of the leg, which
         is the one piece of hind-leg silhouette nothing else has */
      s += '<path d="M 34.4 139 C 32.8 134 32.6 128 33.2 122 C 34.8 128 35 134 36.4 138.4 Z" fill="url(#' + pre + '-sun)" opacity="0.46"/>';
      s += '<path d="M 34 137.6 C 38 138.4 42 139.6 45.4 141.6 L 42.6 141.6 '
         + 'C 40 140 37 138.6 33.6 138.4 Z" fill="url(#' + pre + '-shi)" opacity="0.78"/>';
      s += '<ellipse cx="43" cy="142.4" rx="5.4" ry="2.6" fill="url(#' + pre + '-spec)" opacity="0.55"/>';
    }
    s += '<g class="knee" style="--ko:' + (far ? 30 : 44) + 'px 140px"'
       + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
       + '<path d="' + BULL.hindLo + '" fill="' + f + '"/>'
       + (far ? '' :
           '<path d="M 46.6 140 C 46.4 146 46.4 152 46.4 158 '
           + 'C 46.4 161 46.8 163.6 47.2 166 L 45.6 166 '
           + 'C 45.2 163.6 44.9 161 44.9 158 '
           + 'C 44.9 152 44.9 146 45 140 Z" fill="url(#' + pre + '-shi)" opacity="1"/>'
         + '<path d="M 46.2 144 C 46.1 148 46.1 152 46.1 156 L 45.2 156 '
           + 'C 45.2 152 45.2 148 45.3 144 Z" fill="url(#' + pre + '-ssp)" opacity="0.7"/>'
         + '<ellipse cx="44" cy="162.4" rx="3.2" ry="2.6" fill="url(#'
           + pre + '-spec)" opacity="0.55"/>'
         + '<path d="M 41.6 144 C 41.2 149 41.2 154 41.4 158.6 '
           + 'C 40.4 154 40.4 148.6 40.8 143.8 Z" fill="url(#' + pre + '-sun)" opacity="0.5"/>')
       + '<path d="' + BULL.hindHf + '" fill="' + hf + '"/>'
       + (far ? '' :
           '<path d="M 44 170 L 44 166.2" stroke="' + P.under
           + '" stroke-width="1.4" fill="none" opacity="0.85"/>'
         + '<path d="M 47.4 166 C 48.6 167 49.2 168.4 49.2 170 L 46.8 170 '
           + 'C 46.8 168.4 46.2 167 45.2 166.2 Z" fill="url(#'
           + pre + '-shi2)" opacity="0.8"/>')
       + '</g>';
    return s;
  }

  function bullHeadGroup(pre, lift) {
    var P = GOLD;
    var s = '';
    /* NECK FIRST: the wedge with its crest riding 13 above the withers */
    s += '<path d="' + BULL.neck + '" fill="url(#' + pre + '-massd)"/>';
    s += '<path d="M 134 65.5 C 139 53.5 147 44.5 161 43.5 C 149 46.5 141 54.5 136 66.5 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 145 50.5 C 150 45.5 156 43.5 162 43.5 C 155 44.5 149 47.5 146 52.5 Z" fill="url(#' + pre + '-ssp)" opacity="0.85"/>';
    /* the crest's lower edge - a slab of muscle laid on the neck, and the
       hard shadow under its steeply falling front face */
    s += '<path d="M 140 68.5 C 150 62.5 162 61.5 173 68.5 C 162 65.5 151 66.5 141 71.5 Z" fill="url(#' + pre + '-sun)" opacity="0.22"/>';
    s += '<path d="M 174 50.5 C 180 54.5 184 59.5 187 65.5 C 183 60.5 178 55.5 173 52.5 Z" fill="url(#' + pre + '-sun)" opacity="0.3"/>';
    /* the throat rolling under toward the brisket */
    s += '<path d="M 160 102.5 C 168 110.5 177 113.5 184 110.5 C 177 117.5 165 115.5 158 106.5 Z" fill="url(#'
       + pre + '-crs)"/>';

    /* FAR HORN after the neck, before the skull */
    s += '<path d="' + BULL.hornF + '" fill="url(#' + pre + '-horn)"/>';
    s += '<path d="' + BULL.hornF + '" fill="' + P.deep + '" opacity="0.42"/>';
    s += '<path d="M 175.6 57 C 173.4 52.6 172 48 171.6 44 '
       + 'C 171.6 40.6 173 37.8 175.4 36 C 174.6 39.4 174.6 43 175.6 46.6 '
       + 'C 176.8 50.6 179 54.4 181.6 57.6 C 179.6 58 177.2 58 175.6 57 Z" fill="url(#' + pre + '-shi2)" opacity="0.72"/>';
    s += '<path d="' + BULL.earF + '" fill="' + P.deep + '"/>';

    /* THE DEWLAP, before the skull so the jaw sits over its top edge */
    s += '<path d="' + BULL.dewlap + '" fill="url(#' + pre + '-massd)"/>';
    s += '<path d="M 179.2 99.7 C 186.7 106.6 193.2 115.2 195.1 123.8 C 192.3 115.2 187.6 106.6 177.4 99.7 Z" fill="url(#' + pre + '-shi2)" opacity="0.85"/>';
    s += '<path d="M 182 126.4 C 179.2 130.7 174.6 131.6 170.9 129.8 C 174.6 129.8 177.4 128.1 180.2 124.7 Z" fill="url(#' + pre + '-sun)" opacity="0.57"/>';
    /* the dewlap's leading edge catches the rim light; it is drawn here, not
       in bullRim, because it has to turn with the head */
    s += '<path d="M 178.3 98 C 185.8 104 192.3 112.6 195.1 122.1" stroke="url(#' + pre + '-rim)" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.6"/>';

    /* THE SKULL, in its own across-the-head ramp */
    s += '<path d="' + BULL.head + '" fill="url(#' + pre + '-head)"/>';
    /* the masseter: a soft convex cheek, and the hard crease down its back
       edge that separates skull from neck */
    s += '<ellipse cx="187.2" cy="88.3" rx="8.3" ry="10.6" transform="rotate(40 187.2 88.3)" fill="url(#' + pre + '-shi2)" opacity="0.18"/>';
    s += '<path d="M 181.2 65.9 C 177.1 73 175.1 82.4 176.2 90.7 C 173.5 82.4 174.7 71.8 179.5 64.1 Z" fill="url(#' + pre + '-sun)" opacity="0.9"/>';
    /* THE FLAT FOREHEAD PLATE between the horn bases. This one sliver is
       doing a lot of the work: a flat lit plane above the eyes is what tells
       the eye the skull is a broad block seen slightly from the side, and it
       is the first thing to go missing when a bull turns back into a deer. */
    s += '<path d="M 186.6 61.2 C 194.3 61.4 202.7 65.3 208.6 71.1 C 201.5 67.6 193.7 64.7 186.5 64 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 193.1 63 C 199.1 64.5 204.4 67.3 208.6 71.1 C 203.8 68.5 198.5 66.1 193.9 65 Z" fill="url(#' + pre + '-ssp)" opacity="0.7"/>';
    /* the short straight nose bridge between the brow break and the muzzle */
    s += '<path d="M 212.7 75.3 C 216 77.7 218.4 80.5 219.8 83.8 C 220.3 85.7 218.6 86 217.4 84.3 '
       + 'C 215.8 81.9 213.6 79.4 211.2 77.2 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 214.6 78.4 C 216.9 80.3 218.6 82.2 219.6 84.1 C 218.6 84.5 217.7 83.6 216.5 82.2 '
       + 'C 215.5 81 214.3 79.8 213.4 79.1 Z" fill="url(#' + pre + '-ssp)" opacity="0.7"/>';
    /* THE BLUNT MUZZLE FACE: a near-vertical hit down the front plane. The
       flat front is what says "squared off" at 150px, where the actual
       outline is only three or four pixels of turn. */
    s += '<path d="M 221.2 89 C 221.5 94 220 99.4 216.7 103.4 '
       + 'C 218.1 98.7 219.1 93.7 218.8 88.8 Z" fill="url(#' + pre + '-ssp)" opacity="0.9"/>';
    /* the jaw: a hard dark line under it, and the dark under the chin */
    s += '<path d="M 175.9 84.8 C 178.9 91.9 183.6 97.2 189.6 100.4 L 196.7 103.4 '
       + 'C 188.4 101.5 180.6 96.6 176.5 90.2 Z" fill="url(#' + pre + '-sun)" opacity="0.8"/>';
    s += '<path d="M 196.7 103.7 C 201.5 106 206.2 107 210.4 105.8 C 206.2 108.4 200.9 107.9 196.7 105.5 Z" fill="url(#' + pre + '-sun)" opacity="0.6"/>';
    /* the wide wet nose pad, the nostril, the mouth */
    s += '<ellipse cx="214.1" cy="97.3" rx="4" ry="5.7" transform="rotate(40 214.1 97.3)" fill="url(#' + pre + '-sun)" opacity="0.42"/>';
    s += '<path d="M 215.3 92.3 C 217.4 93.7 217.4 96.1 215.3 97.8 C 213.4 97.1 213.4 94.7 215.3 92.3 Z" fill="' + P.under + '" opacity="0.9"/>';
    s += '<path d="M 210.3 104.6 C 206 103.7 201.9 102 198.1 99.9" stroke="' + P.under + '" stroke-width="0.9" fill="none" opacity="0.75" stroke-linecap="round"/>';
    /* THE EYE sits LOW and WELL BACK, at the outer corner of the skull below
       the brow break - not up near the forehead where a cartoon puts it. A
       high eye shortens the forehead and lengthens the muzzle by implication,
       which is exactly the deer reading we are trying to kill. */
    s += '<ellipse cx="201.5" cy="85.4" rx="6" ry="4.7" transform="rotate(35 201.5 85.4)" fill="url(#' + pre + '-sun)" opacity="0.35"/>';
    s += '<path d="M 199.1 78.9 C 203.3 79.6 206.7 81.9 208.1 85.3 C 205.3 82.7 201.9 81 198.6 80.5 Z" fill="url(#' + pre + '-shi)" opacity="0.55"/>';
    s += '<ellipse cx="201.7" cy="85" rx="3.8" ry="2.8" transform="rotate(35 201.7 85)" fill="' + P.under + '"/>';
    s += '<circle cx="203.1" cy="84.3" r="1.2" fill="' + P.spec + '" opacity="0.9"/>';

    s += '<path d="' + BULL.earN + '" fill="url(#' + pre + '-massd)"/>';
    s += '<path d="M 180.4 68.7 C 177.4 64.1 171.4 61.3 165 61.5 C 170.4 62.9 175.8 65.9 179.6 69.7 Z" fill="url(#' + pre + '-shi2)" opacity="0.8"/>';
    s += '<ellipse cx="170.5" cy="68" rx="5.6" ry="2.8" transform="rotate(20 170.5 68)" fill="url(#' + pre + '-sun)" opacity="0.55"/>';

    /* THE NEAR HORN LAST, over the skull: a cone of bone with a lit top
       plane, a hard dark underside and a dark seam where it leaves the poll */
    s += '<path d="' + BULL.hornN + '" fill="url(#' + pre + '-horn)"/>';
    s += '<path d="M 184.4 52 C 185.6 56.4 185.6 61.4 184.4 66.4 C 183.4 61.4 183.4 56.4 184.4 52 Z" fill="' + P.under + '" opacity="0.55"/>';
    s += '<path d="M 184 53.6 C 188.6 51.8 193.4 51.4 197.6 51.9 '
       + 'C 202 52 205.8 50.8 209 48.6 C 211.4 46.6 213.8 43.8 216 41.4 '
       + 'C 214.6 45 212.4 48.4 209.8 51 C 206.4 54 202 55.6 197.4 55.2 '
       + 'C 192.6 54.8 187.8 55.6 184.6 57 C 183.4 56 183.4 54.4 184 53.6 Z" fill="url(#' + pre + '-ssp)" opacity="0.92"/>';
    s += '<path d="M 186.2 65.6 C 189.8 63 194.6 61.4 199.4 61.6 '
       + 'C 204.4 61.8 208.4 59.6 211.4 55.4 C 213 53 214.4 50 215.6 46.8 '
       + 'C 214.8 51.6 213 56 210.4 59.4 C 206.8 64 201.6 66.4 196.6 66 '
       + 'C 192 65.6 188.6 66.6 186.4 68.4 C 185.8 67.6 185.8 66.4 186.2 65.6 Z" fill="url(#' + pre + '-sun)" opacity="0.7"/>';
    s += '<circle cx="215" cy="41" r="1.3" fill="' + P.spec + '" opacity="0.9"/>';

    if (lift) s = '<g transform="rotate(' + lift + ' 140 70)">' + s + '</g>';
    return s;
  }

  function bullBody(pre, lift, plateOpts) {
    var P = GOLD;
    var s = '';
    s += '<path d="' + BULL.trunk + '" fill="url(#' + pre + '-mass)"/>';
    /* dark contour along the shadow side, half outside the silhouette */
    s += '<path d="M 31 90 C 42 95 56 101 66 105 C 76 111 86 115 100 116 '
       + 'C 116 118 138 117 156 114 C 163 119 171 122 178 120" stroke="' + P.under
       + '" stroke-width="1.6" fill="none" opacity="0.55" stroke-linecap="round"/>';
    /* THE RIBCAGE is its own convex mass, high on the barrel. THE CORE
       SHADOW under it follows the barrel ROUND the body rather than running
       straight down it: that is the difference between a cylinder that turns
       away from the light and a flat shape with a stripe painted on. */
    s += '<ellipse cx="112" cy="82" rx="30" ry="13" fill="url(#' + pre + '-spec)" opacity="0.16"/>';
    s += '<path d="M 74 96 C 88 106 112 110 138 105 C 116 114 88 112 72 102 Z" fill="url(#' + pre + '-sun)" opacity="0.34"/>';
    /* and its own reflected-light lobe low on the side, which is what
       breaks the dark band below the terminator into ribcage, shoulder and
       haunch instead of one waterline across a balloon */
    s += '<path d="M 82 102 C 96 108 118 110 142 106 C 126 114 98 114 82 108 Z" fill="url(#' + pre + '-shi2)" opacity="0.55"/>';
    /* THREE separate topline hits - croup, loin, withers - never one arc */
    s += '<path d="M 40 69 C 44 66 49 63 57 59 C 51 63 46 66 42 72 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 68 60 C 80 61 90 63 100 66 C 90 67 80 66 70 65 Z" fill="url(#' + pre + '-shi2)" opacity="0.6"/>';
    s += '<path d="M 124 68 C 130 65 138 61 146 57 C 139 61 133 65 128 71 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 133 64 C 137 61 142 58 146 57 C 141 60 137 62 134 66 Z" fill="url(#' + pre + '-ssp)" opacity="0.8"/>';
    /* THE POINT OF THE HIP, a hard bright corner with a hollow behind it */
    s += '<path d="M 51 61 L 57 59 C 61 59 63 60 64 62 C 61 61 57 61 52 62 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 57 61 C 60 64 61 69 60 75 C 59 69 57 65 55 63 Z" fill="url(#' + pre + '-sun)" opacity="0.39"/>';
    /* THE PIN BONE at the back of the rump */
    s += '<path d="M 32 86 L 31 91 C 31 95 32 99 34 102 C 31 98 29 93 29 88 Z" fill="url(#' + pre + '-sun)" opacity="0.41"/>';
    /* THE FLANK HOLLOW ahead of the hip, between ribcage and haunch */
    s += '<ellipse cx="90" cy="100" rx="8" ry="12" fill="url(#' + pre + '-sun)" opacity="0.6"/>';
    /* reflected light off the floor into the belly */
    s += '<path d="M 70 110 C 88 118 120 120 160 115 C 126 124 84 122 68 114 Z" fill="url(#'
       + pre + '-bnc)"/>';
    /* one shallow rib sliver. More than one and it turns into a zebra. */
    s += '<path d="M 128 80 C 132 92 132 104 128 112 C 130 103 129 92 126 81 Z" fill="url(#' + pre + '-sun)" opacity="0.3"/>';
    /* the notch the chest wall makes BEHIND the elbow */
    s += '<path d="M 156 113 C 160 117 167 120 177 120 C 167 123 158 121 154 117 Z" fill="url(#' + pre + '-sun)" opacity="0.72"/>';

    if (plateOpts !== false) s += brandPlate('bull', plateOpts || {});
    s += '<g class="head" style="--ho:140px 70px">' + bullHeadGroup(pre, lift) + '</g>';
    return s;
  }

  function bullRim(pre) {
    var P = GOLD;
    var g = 'url(#' + pre + '-rim)';
    /* One bright thin edge along the top-and-right contour does more on a
       dark stage than any amount of internal shading, so all four contour
       runs are rimmed now - topline, CREST, face and chest - at 2.2 rather
       than 1.5. The gradient holds full brightness across the middle two
       thirds of each run and dies at both ends, so the rim reads as light
       skimming a form rather than as a drawn outline. */
    return '<path d="' + BULL.rimTop + '" stroke="' + g + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BULL.rimCrest + '" stroke="' + g + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BULL.rimFace + '" stroke="' + g + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BULL.rimChest + '" stroke="' + g + '" stroke-width="1.9" fill="none" stroke-linecap="round"/>';
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
  /* raised: the near foreleg is off the floor (the charge pose), so it
     leaves no reflection and no contact highlight where it used to stand */
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
    s += '<ellipse cx="44" cy="170" rx="7" ry="2.2" fill="url(#' + pre + '-spec)" opacity="0.5"/>';
    if (!raised) s += '<ellipse cx="168" cy="170" rx="7" ry="2.2" fill="url(#' + pre + '-spec)" opacity="0.5"/>';
    s += '<ellipse cx="30" cy="170" rx="6" ry="1.8" fill="url(#' + pre + '-spec)" opacity="0.26"/>';
    s += '<ellipse cx="151" cy="170" rx="6" ry="1.8" fill="url(#' + pre + '-spec)" opacity="0.26"/>';
    return s;
  }

  /* ================================================================== BEAR */

  var BEAR = {
    /* Trunk. Rebuilt to the same numeric brief as the bull, and to the
       OPPOSITE topline, because bull-versus-bear has to be legible from the
       shape of the back alone:
         point of buttock x=24, point of shoulder x=188 -> body length 164
         hump peak y=68, floor 170                      -> shoulder ht 102
         body / shoulder height = 1.61                  (target 1.55-1.70)
         rump top y=86, a full 18 BELOW the hump
         belly y=134 -> free leg 36, about a third of shoulder height
       The hump is the highest point of the whole animal and it sits at
       x=152, directly over the front legs; the back then falls away to a
       dip at 94 and rises only to 86 at the rump. The bull does exactly the
       reverse. At 150px in black that one relationship is what separates
       the two animals before any detail is visible.
       THE COAT BREAKS THE CONTOUR. The belly and the back of the haunch are
       cut with shallow L notches 5-6 deep instead of a smooth curve. A bear
       drawn with a clean outline reads as a pig; the ragged edge is most of
       what says fur over muscle, and it costs nothing at size. */
    trunk:  'M 20 104 C 20 95 28 87 42 85 L 56 83 '
          + 'C 70 87 84 91 98 93 C 112 95 128 82 138 70 '
          + 'L 152 62 '
          + 'C 165 62 173 72 177 84 L 181 94 '
          + 'C 187 102 190 108 190 114 L 187 123 '
          + 'C 182 131 172 135 160 136 '
          + 'C 151 133 145 137 139 134 L 131 131 L 125 136 '
          + 'C 113 138 101 134 93 137 L 85 132 L 77 136 '
          + 'C 69 135 63 133 57 131 '
          + 'C 46 130 38 124 34 117 L 28 116 L 31 109 L 24 105 '
          + 'C 22.6 104.6 21.2 104.2 20 104 Z',
    neck:   'M 150 70 C 160 62 175 72 182 90 C 188 100 192 112 190 120 '
          + 'C 188 128 180 132 171 129 C 164 126 159 119 157 112 '
          + 'C 154 102 151 80 150 70 Z',
    /* THE HEAD is one piece: a round braincase, the CONCAVE STOP cut into
       the outline at (208,98.5)-(214,100.5), then a LOW straight muzzle 16
       long and only 13 deep - the profile of a bear and not a tapir. The
       muzzle was made SHALLOWER in this pass: a deep blunt one, combined
       with the barrel behind it, read as a hippopotamus.
       Skull back 183.5 to nose 224.5 is 41, 0.25 of body length (target
       0.22-0.25), carried LOW and thrust FORWARD, crown 86 against the
       hump's 66, so the head hangs 20 below the highest point and clear in
       front of the chest. Filled with -head, a ramp running down the head
       from the braincase to the jaw. */
    skull:  'M 184 107 C 184.5 98 189 93.5 197 94 '
          + 'C 203 94.8 206.5 99.5 207 105 '
          + 'C 209 106.2 211 106.8 213.5 107.4 L 218 109 '
          + 'C 221 110 222.5 112.4 222.2 115.4 '
          + 'C 222 118 220.4 119.6 217.5 120 '
          + 'L 210 121.6 C 203 123.6 196 125.6 190 124.6 '
          + 'C 185 123.6 182.5 118 182.5 112 C 182.5 108.4 183.2 107.4 184 107 Z',
    nose:   'M 218.3 109.2 C 221.2 110 222.5 112.4 222.3 115.4 C 222.1 118 220.6 119.5 218.3 120 '
          + 'C 216.8 118.6 216.8 110.6 218.3 109.2 Z',
    /* ROUND EARS, and they are now big enough to SEE. Set low and wide on
       the back corners of a broad skull, and standing about 5 proud of the
       crown, they are the one feature that survives to 150px in black: a
       bear silhouette without two round bumps on the back of the head reads
       as a hippo or a boar every time. */
    earN:   'M 179.5 91 C 179.5 85 184 81.5 189 83 C 194 84.5 195.5 89.5 193 93.5 '
          + 'C 190.5 97.5 185 98.5 182 95.5 C 180 94.2 179.5 92.8 179.5 91 Z',
    earF:   'M 174 94 C 174 89 177.5 86.5 181.5 88 C 185.5 89.5 186.5 93 184.5 96 '
          + 'C 182.5 99 178.5 99.5 176 97 C 174.5 96 174 95 174 94 Z',
    tail:   'M 24 100 C 19 100 16 103 16 107 C 16 111 20 114 24 112 C 26 110 27 104 24 100 Z',
    /* thigh 48 -> lower leg 30 -> ankle 15 -> plantigrade sole 32 flat on
       the floor. The knee is at the belly line (70,128); the lower leg
       slopes BACK from it to the ankle, which is what makes a bear's hind
       leg a bear's and not a table leg. */
    hindUp: 'M 30 102 C 30 88 39 80 52 82 C 64 84 70 98 70 114 '
          + 'C 70 122 66 132 61 140 C 57 144 54 148 52 152 '
          + 'L 39 152 C 38.6 147 37 141 35 133 C 32 121 29 111 30 102 Z',
    hindLo: 'M 39 146 C 39.5 152 40 158 40.5 162 '
          + 'C 39 164 37.6 166 36.8 168 C 36.4 169 36.4 170 36.4 170 '
          + 'L 60 170 C 60 168.6 59 167 57.4 165.4 '
          + 'C 55 163 53.4 161.4 53 159 '
          + 'C 52.6 154 52.4 149 52.4 146 Z',
    /* upper arm and forearm as one heavy column straight down from the
       hump, 25 across the forearm, with two coat notches cut into its back
       edge below the belly line, a slight waist above the wrist, then the
       paw. The column carries the whole front of the animal, so the hump
       and the forelegs have to read as one mass and not as a lump with
       sticks under it. */
    foreUp: 'M 144 74 C 156 64 173 72 176 92 '
          + 'C 176.5 104 174.5 116 172 126 '
          + 'C 170.5 133 169.5 141 168.5 148 '
          + 'C 168.5 151 167 152.5 164.5 152.5 L 158 152.5 '
          + 'C 156 152.5 155.4 151 155.5 148 '
          + 'L 150 146 L 154.5 141.5 L 150.5 138 '
          + 'C 153 136 152.5 132 152 127 '
          + 'C 150 113 147 96 146 86 C 145 80 144 76 144 74 Z',
    foreLo: 'M 154.5 144 C 155 150 155.5 156 156 161 '
          + 'C 155 163 154.4 165 154 167.5 C 153.8 169 154 170 154 170 '
          + 'L 176 170 C 176 168.6 175.4 167 174 165.6 '
          + 'C 171.6 163.4 170 162 169.4 160 '
          + 'C 169 155 169 149 169.2 144 Z',
    /* long front claws rooted inside the paw at x=174, hooking forward and
       down; the lowest rests on the floor at exactly 170 */
    clawA:  'M 171 160.4 C 175 160 178.4 159 180.6 157 C 181 161 178 163.4 172.6 163.8 Z',
    clawB:  'M 172 164.2 C 176.6 164.2 180 163.2 182.2 161.4 C 182.6 165.4 179 167.6 173.8 167.6 Z',
    clawC:  'M 173 167.8 C 177.6 167.8 181 167.2 183.2 165.6 C 183.6 169 180.2 170 175 170 Z',
    clawR:  'M 55 166 C 58 166 60 168 61 170 L 55 170 Z',
    rimFace: 'M 186 103 C 187 96 191.5 93 197 94 C 203 94.8 206.5 99.5 207 105 '
           + 'C 209 106.2 211 106.8 213.5 107.4 L 218 109 '
           + 'C 221 110 222.5 112.4 222.2 115.4',
    rimTop:  'M 24 95 C 28 88 34 85 42 85 L 56 83 C 70 87 84 91 98 93',
    rimCrest:'M 110 95 C 122 86 130 76 138 70 L 152 62 C 165 62 173 72 181 94',
    rimChest:'M 190 110 C 192 120 187 130 178 137'
  };

  function bearFore(pre, far, kneeXf) {
    var P = STEEL;
    var f = far ? 'url(#' + pre + '-far)' : 'url(#' + pre + '-limb)';
    var s = '<path d="' + BEAR.foreUp + '" fill="' + f + '"/>';
    if (!far) {
      /* the hump rolls straight down into the foreleg: one column of metal,
         with the crease behind it cutting it off the ribcage */
      s += '<path d="M 150 74 C 161 66 173 76 176 93 C 169 80 160 73 152 77 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
      s += '<path d="M 172 96 C 175 106 174 124 170 146 C 170 124 169 106 164 98 Z" fill="url(#' + pre + '-shi2)" opacity="0.55"/>';
      s += '<path d="M 160 108 C 163 118 166 128 169 140 C 164 132 161 120 158 110 Z" fill="url(#' + pre + '-shi2)" opacity="0.38"/>';
      s += '<path d="M 147 80 C 144 98 145 124 152 148 C 144 128 141 98 144 80 Z" fill="url(#'
         + pre + '-sun)" opacity="0.85"/>';
      s += '<path d="M 153 134 C 154.5 141 155 146 155.2 150 L 152 150 C 151.5 144 151 139 150.5 134 Z" fill="url(#'
         + pre + '-bnc)"/>';
      /* the wrist knob, and the hollow above it */
      s += '<path d="M 155.5 150.5 C 160 149.8 165 150.2 169 151.4 C 164.6 150.8 160 150.8 155.6 151.6 Z" fill="url(#' + pre + '-shi)" opacity="0.7"/>';
      s += '<path d="M 155.5 142 C 160 141.4 165 141.4 169.6 142.6 C 165 142.8 160 142.8 155.6 143.4 Z" fill="url(#' + pre + '-sun)" opacity="0.35"/>';
    }
    s += '<g class="knee" style="--ko:' + (far ? 146 : 162) + 'px 148px"'
       + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
       + '<path d="' + BEAR.foreLo + '" fill="' + f + '"/>'
       + (far
          ? '<path d="' + BEAR.clawB + '" fill="' + P.mid2 + '"/>'
          : '<path d="M 168.6 146 C 169 151 169.2 156 169.6 160.4 L 167.4 160.4 C 167 156 166.8 151 166.6 146 Z" fill="url(#' + pre + '-shi)" opacity="0.95"/>'
          + '<path d="M 154.4 164 C 160 166.4 167 168.4 176 169.6 L 154 169.6 Z" fill="url(#' + pre + '-sun)" opacity="0.6"/>'
          + '<path d="' + BEAR.clawA + '" fill="url(#' + pre + '-horn)"/>'
          + '<path d="' + BEAR.clawB + '" fill="url(#' + pre + '-horn)"/>'
          + '<path d="' + BEAR.clawC + '" fill="url(#' + pre + '-horn)"/>'
          + '<path d="M 172.6 161.6 C 176.4 161.2 179 160.2 180.8 158.4 C 179.4 161 176.4 162.6 172.6 162.8 Z" fill="url(#' + pre + '-ssp)" opacity="0.7"/>'
          + '<path d="M 173.6 165.2 C 177.6 165.2 180.6 164.2 182.4 162.6 C 181 165 177.6 166.4 173.6 166.4 Z" fill="url(#' + pre + '-ssp)" opacity="0.5"/>')
       + '</g>';
    return s;
  }

  function bearHind(pre, far, kneeXf) {
    var P = STEEL;
    var f = far ? 'url(#' + pre + '-far)' : 'url(#' + pre + '-limb)';
    var s = '<path d="' + BEAR.hindUp + '" fill="' + f + '"/>';
    if (!far) {
      /* the thigh's roll, following its own curve from the rump forward */
      s += '<path d="M 32 86 C 42 80 57 82 66 98 C 57 88 43 86 34 92 Z" fill="url(#' + pre + '-shi)" opacity="0.98"/>';
      s += '<ellipse cx="50" cy="104" rx="15" ry="13" fill="url(#' + pre + '-spec)" opacity="0.12"/>';
      s += '<path d="M 31 114 C 37 124 47 132 58 132 C 47 136 35 130 29 120 Z" fill="url(#' + pre + '-shi2)" opacity="0.36"/>';
      s += '<path d="M 29 104 C 26 115 28 131 34 147 C 25 131 24 115 27 104 Z" fill="url(#'
         + pre + '-crs)"/>';
      /* the lower leg's flat outer plane, sloping back to the ankle */
      s += '<path d="M 66 112 C 69 122 65 132 57 142 C 61 132 63 122 62 113 Z" fill="url(#' + pre + '-shi2)" opacity="0.5"/>';
      s += '<path d="M 33 140 C 38 147 44 150 52 152 C 43 154 35 149 31 142 Z" fill="url(#'
         + pre + '-bnc)"/>';
      /* the ankle knob, proud of shank and sole */
      s += '<path d="M 40 150.5 C 44.5 149.6 49 150 52.4 151.6 C 48 150.8 44 150.8 40 151.8 Z" fill="url(#' + pre + '-shi)" opacity="0.7"/>';
      s += '<path d="M 40 144 C 44.5 143.2 49 143.2 52.6 144.4 C 49 144.8 44.5 144.8 40 145.4 Z" fill="url(#' + pre + '-sun)" opacity="0.35"/>';
    }
    s += '<g class="knee" style="--ko:' + (far ? 31 : 45) + 'px 152px"'
       + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
       + '<path d="' + BEAR.hindLo + '" fill="' + f + '"/>'
       + (far ? '' :
           /* the top of the foot sloping forward-down to the toes */
           '<path d="M 52.6 148 C 52.8 153 53 157 53.6 160 L 51.4 160 C 51 157 50.8 153 50.6 148 Z" fill="url(#' + pre + '-shi)" opacity="0.95"/>'
         + '<path d="' + BEAR.clawR + '" fill="url(#' + pre + '-horn)"/>'
         + '<path d="M 37 164 C 44 166.4 51 168.4 60 169.6 L 36.6 169.6 Z" fill="url(#' + pre + '-sun)" opacity="0.62"/>')
       + '</g>';
    return s;
  }

  function bearHeadGroup(pre, lift) {
    var P = STEEL;
    var s = '';
    s += '<path d="' + BEAR.earF + '" fill="' + P.deep + '"/>';
    s += '<path d="' + BEAR.neck + '" fill="url(#' + pre + '-massd)"/>';
    s += '<path d="M 153 74 C 163 66 176 76 182 91 C 172 82 161 78 154 81 Z" fill="url(#' + pre + '-shi)" opacity="0.98"/>';
    s += '<path d="M 162 117 C 169 123 177 124 183 120 C 176 126 166 125 160 120 Z" fill="url(#'
       + pre + '-crs)"/>';

    /* THE SKULL, one piece, in its own down-the-head ramp */
    s += '<path d="' + BEAR.skull + '" fill="url(#' + pre + '-head)"/>';
    /* the convex braincase taking the key, following its own dome */
    s += '<path d="M 185.8 103.9 C 186.6 96.7 191.9 93 198.4 94.1 C 192.7 94.3 188.2 97.9 186.8 104.8 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 189 98.3 C 191.9 94.7 195.1 93.5 198.4 94.1 C 195.1 94.9 191.9 96.3 189.8 100 Z" fill="url(#' + pre + '-ssp)" opacity="0.7"/>';
    s += '<ellipse cx="193.5" cy="105.7" rx="7.3" ry="7.2" fill="url(#' + pre + '-spec)" opacity="0.16"/>';
    /* THE STOP: the forehead dropping onto the muzzle - a soft dark step
       across the brow, so the concavity reads as a change of plane */
    s += '<path d="M 202.5 98.3 C 204.5 100.7 205.3 104.8 204.9 110.4 C 203.7 105.7 202.5 102.4 201.3 99.5 Z" fill="url(#' + pre + '-sun)" opacity="0.5"/>';
    s += '<path d="M 204.1 103.2 C 204.9 103.9 206.6 104.4 209 104.8 C 207 105.2 204.9 105.2 203.7 104.4 Z" fill="url(#' + pre + '-sun)" opacity="0.7"/>';
    /* the long straight top of the muzzle: one unbroken hard highlight,
       with a hotter core */
    s += '<path d="M 209.4 105.2 L 218 107.2 C 216.4 107.6 213.9 107.2 211.5 106.5 C 209.8 106.3 208.6 106 207.8 105.8 Z" fill="url(#' + pre + '-shi)" opacity="0.95"/>';
    s += '<path d="M 211.9 105.8 L 217.6 107.3 C 216 107.6 214.3 107.4 212.7 106.8 Z" fill="url(#' + pre + '-ssp)" opacity="0.7"/>';
    /* the flat front of the nose block takes a short vertical hit */
    s += '<path d="M 222.1 109.2 C 222.6 110.9 222.6 113.3 222.2 115.3 C 221.4 113.3 221.3 110.9 221.4 109.4 Z" fill="url(#' + pre + '-ssp)" opacity="0.8"/>';
    /* the muzzle's underside and the jaw: hard dark lines */
    s += '<path d="M 207.4 121 C 210.7 121.8 214.7 121 217.6 119.3 C 214.7 122 210.7 123 206.6 122.2 Z" fill="url(#' + pre + '-sun)" opacity="0.66"/>';
    s += '<path d="M 189.4 124.2 C 196 125 202.5 123.5 207.4 121.8 C 202.5 125 195.1 126.6 188.6 125.8 Z" fill="url(#' + pre + '-sun)" opacity="0.7"/>';
    /* the cheek's convexity, and the crease at the back of the jaw */
    s += '<ellipse cx="195.1" cy="114.6" rx="5.7" ry="5.2" fill="url(#' + pre + '-shi2)" opacity="0.28"/>';
    s += '<path d="M 184.5 105.7 C 183.3 110.4 183.3 116.9 186.2 122.6 C 184.1 117.8 183.7 112.1 185.2 106 Z" fill="url(#' + pre + '-sun)" opacity="0.7"/>';
    /* mouth line, nose pad, nostril */
    s += '<path d="M 216.4 119.8 C 213.5 120.6 210.7 121.1 208.2 121.4" stroke="' + P.under + '" stroke-width="0.9" fill="none" opacity="0.75" stroke-linecap="round"/>';
    s += '<path d="' + BEAR.nose + '" fill="' + P.under + '"/>';
    s += '<circle cx="220.3" cy="110" r="1.1" fill="' + P.spec + '" opacity="0.85"/>';

    /* eye: small, deep set, just above and behind the stop */
    s += '<ellipse cx="200.9" cy="106.7" rx="2.9" ry="2.2" fill="url(#' + pre + '-sun)" opacity="0.4"/>';
    s += '<ellipse cx="200.9" cy="106.7" rx="1.8" ry="1.4" fill="' + P.under + '"/>';
    s += '<circle cx="201.3" cy="106.4" r="0.7" fill="' + P.spec + '" opacity="0.9"/>';

    s += '<path d="' + BEAR.earN + '" fill="url(#' + pre + '-massd)"/>';
    s += '<path d="M 180.5 90.2 C 181.5 86.1 185.3 83.4 188.8 84.2 C 185.3 85 182 87.5 181.1 91.8 Z" fill="url(#' + pre + '-shi)" opacity="0.95"/>';
    s += '<ellipse cx="187.2" cy="91.8" rx="3.3" ry="3.7" fill="url(#' + pre + '-sun)" opacity="0.55"/>';

    if (lift) s = '<g transform="rotate(' + lift + ' 152 80)">' + s + '</g>';
    return s;
  }

  function bearBody(pre, lift, plateOpts) {
    var P = STEEL;
    var s = '';
    s += '<path d="' + BEAR.trunk + '" fill="url(#' + pre + '-mass)"/>';
    s += '<path d="M 23 104 C 26 116 34 124 44 130 C 64 137 94 139 120 138 '
       + 'C 142 136 162 133 174 128" stroke="' + P.under + '" stroke-width="1.6" '
       + 'fill="none" opacity="0.5" stroke-linecap="round"/>';
    /* the ribcage, high on the barrel, with ITS CORE SHADOW WRAPPING ROUND
       the barrel below it rather than running lengthwise down the flank */
    s += '<ellipse cx="94" cy="104" rx="34" ry="13" fill="url(#' + pre + '-spec)" opacity="0.16"/>';
    s += '<path d="M 56 112 C 76 124 108 128 144 120 C 114 132 76 130 54 118 Z" fill="url(#' + pre + '-sun)" opacity="0.3"/>';
    s += '<path d="M 62 118 C 82 128 112 130 146 122 C 118 134 84 132 62 124 Z" fill="url(#' + pre + '-shi2)" opacity="0.55"/>';
    /* rump, then the dip, then THE HUMP - three hits, the hump the hardest
       and the highest, each following its own mass */
    s += '<path d="M 24 97 C 30 88 38 83 52 84 C 38 85 29 91 26 100 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    s += '<path d="M 82 90 C 88 93 94 95 102 96 C 94 98 87 97 81 93 Z" fill="url(#' + pre + '-shi2)" opacity="0.6"/>';
    s += '<path d="M 126 86 C 134 74 144 64 156 63 C 143 68 134 75 130 90 Z" fill="url(#' + pre + '-shi)" opacity="1"/>';
    /* the hump's BACK slope faces away from the key and has to go down a
       whole value, or the hump and the barrel behind it read as one dome */
    s += '<path d="M 110 94 C 120 86 132 74 146 64 C 133 78 122 90 114 99 Z" fill="url(#' + pre + '-sun)" opacity="0.38"/>';
    s += '<path d="M 140 70 C 146 63 151 62 156 63 C 149 64 144 67 142 72 Z" fill="url(#' + pre + '-ssp)" opacity="0.85"/>';
    /* the crease where the neck leaves the front of the hump */
    s += '<path d="M 178 82 C 183 90 188 98 191 107 C 186 100 181 92 176 84 Z" fill="url(#' + pre + '-sun)" opacity="0.68"/>';
    /* the flank hollow ahead of the hip */
    s += '<ellipse cx="84" cy="118" rx="9" ry="11" fill="url(#' + pre + '-sun)" opacity="0.58"/>';
    s += '<path d="M 36 126 C 66 136 114 140 168 128 C 122 142 72 141 34 130 Z" fill="url(#'
       + pre + '-bnc)"/>';

    if (plateOpts !== false) s += brandPlate('bear', plateOpts || {});
    s += '<g class="head" style="--ho:152px 80px">' + bearHeadGroup(pre, lift) + '</g>';
    return s;
  }

  function bearRim(pre) {
    var P = STEEL;
    var g = 'url(#' + pre + '-rim)';
    return '<path d="' + BEAR.rimTop + '" stroke="' + g + '" stroke-width="2" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BEAR.rimCrest + '" stroke="' + g + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BEAR.rimFace + '" stroke="' + g + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
      + '<path d="' + BEAR.rimChest + '" stroke="' + g + '" stroke-width="1.9" fill="none" stroke-linecap="round"/>';
  }

  function bearBloom(pre) {
    var P = STEEL;
    var d = BEAR.rimTop + ' ' + BEAR.rimCrest + ' ' + BEAR.rimFace + ' ' + BEAR.rimChest;
    return '<path d="' + d + '" stroke="' + P.bloom + '" stroke-width="8" fill="none" '
         + 'stroke-linecap="round" opacity="0.11"/>'
         + '<path d="' + d + '" stroke="' + P.bloom + '" stroke-width="3.4" fill="none" '
         + 'stroke-linecap="round" opacity="0.17"/>';
  }

  function bearRefl(pre, raised) {
    var f = 'url(#' + pre + '-refl)';
    var s = '<g transform="matrix(1 0 0 -1.15 0 365.5)">';
    s += '<path d="' + BEAR.hindLo + '" fill="' + f + '"/>';
    if (!raised) s += '<path d="' + BEAR.foreLo + '" fill="' + f + '"/>';
    s += '<g transform="translate(-14 0)"><path d="' + BEAR.hindLo + '" fill="' + f + '"/></g>';
    s += '<g transform="translate(-16 0)"><path d="' + BEAR.foreLo + '" fill="' + f + '"/></g>';
    s += '</g>';
    s += '<ellipse cx="48" cy="170" rx="12" ry="2.4" fill="url(#' + pre + '-spec)" opacity="0.42"/>';
    if (!raised) s += '<ellipse cx="165" cy="170" rx="11" ry="2.4" fill="url(#' + pre + '-spec)" opacity="0.42"/>';
    s += '<ellipse cx="34" cy="170" rx="10" ry="2" fill="url(#' + pre + '-spec)" opacity="0.24"/>';
    s += '<ellipse cx="149" cy="170" rx="9" ry="2" fill="url(#' + pre + '-spec)" opacity="0.24"/>';
    return s;
  }

  /* ================================================================ figures */

  /* Joint positions, shared by the rig and the stance solver so the two can
     never drift apart. */
  /* These moved with the bodies in the silhouette rebuild: the bull's hind
     assembly went back 11 and its fore assembly forward 6 to stretch the
     barrel to 1.40 wither heights, and the bear's went back 14 / forward 14
     to reach 1.61 shoulder heights. The lower legs were TRANSLATED, never
     scaled in y, so every hoof and sole still ends on exactly 170; the
     nested .knee pivots below have to keep matching hock/carp or the stance
     solver and the rig disagree and the feet lift off the floor. */
  var JOINT = {
    bull: { hip: [57, 86], hock: [44, 140], sh: [164, 92], carp: [168, 140],
            dxH: -14, dxF: -17, tail: [41, 72] },
    bear: { hip: [48, 98], hock: [46, 152], sh: [160, 92], carp: [162, 148],
            dxH: -14, dxF: -16, tail: [24, 104] }
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
        + '<path d="M 39 68 C 33 73 28 81 25 90 C 27 80 32 72 37 67 Z" fill="url(#' + pre + '-shi2)" opacity="0.75"/>';

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
        /* moderated after the limb rebuild. foreUp now carries the whole
           forearm, so it is a much longer mass than it was and the old -34
           swung the shoulder blade clear of the ribcage. */
        var up   = pose === 'charge' ? -24 : -34;
        var fold = pose === 'charge' ?  38 :  54;
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
    /* refitted after the rebuild: both animals got longer (bull 16..226,
       bear 16..225 in figure x) and the bull's horns now reach y=43, so the
       old framing clipped the tail on one side and the horn tip on the
       other. Scale and offset are chosen to leave ~8 units of margin all
       round with the feet still landing near the bottom of the card. */
    var t = bear ? 'translate(-6 -4) scale(0.88)' : 'translate(-6 -2) scale(0.87)';
    return '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + '<defs>' + defsFor(pre, pal(kind), SPAN[bear ? 'bear' : 'bull']) + '</defs>'
      + '<g transform="' + t + '">'
      + (bear ? bearRefl(pre) : bullRefl(pre))
      + figure(kind, pre, { lift: bear ? -5 : -13 })
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
      + bullRefl('fo-bull', true) + figure('bull', 'fo-bull', { pose: 'charge', lift: 12 }) + '</g></g>';
    s += '<g class="fo-r"><g transform="translate(530 -19.2) scale(-1.16 1.16)">'
      + bearRefl('fo-bear', true)
      + figure('bear', 'fo-bear', { pose: 'swipe', lift: -4, plate: { id: 'fo-bear-bp', mirror: true } })
      + '</g></g>';
    s += '</svg>';
    return s;
  };

  global.brandPlate = brandPlate;

})(typeof window !== 'undefined' ? window : this);
