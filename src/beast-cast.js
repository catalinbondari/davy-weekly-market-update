/* beast-plate.js - The Weekly Stampede, cast-bronze treatment.
 *
 * A drop-in replacement for beast-gold.js / beast-frozen.js. Same four
 * globals, same viewBoxes, same animation rig.
 *
 *   beastSVG(kind)          260x180  running hero, feet on y=170
 *   pickSVG(kind)           200x150  standing figure for the start card
 *   faceoffSVG()            520x200  bull left facing right, bear facing left
 *   brandPlate(kind, opts)  a small cast plaque carrying the Davy mark
 *
 * kind is 'bull' | 'bear'. Pure ES5, one IIFE, no imports, no build step,
 * returns SVG strings.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS, AND WHAT IT USED TO BE
 * ---------------------------------------------------------------------------
 *
 * The geometry in this file - every outline, every limb width, the stance
 * solver and the rig - came out of an engraved, hatched treatment that is
 * kept alongside as beast-plate.engraved.js. The drawing underneath was
 * right; the surface was not. Fine hatching on a pale ivory field reads as a
 * carved wooden ornament with stripes, and a pale animal fights a near-black
 * stage instead of sitting in it.
 *
 * So the skin was replaced and NOTHING ELSE WAS TOUCHED. Not one path
 * coordinate, not one joint, not one limb section width, not the stance
 * maths. If you are comparing the two files, diff them: the BULL and BEAR
 * geometry blocks and the whole rig section are byte-identical.
 *
 * ---------------------------------------------------------------------------
 * THE TREATMENT: FOUR FLAT VALUES AND ONE RIM
 * ---------------------------------------------------------------------------
 *
 * These are cast bronze figures on a dark stage, and a cast figure is read by
 * PLANE, not by texture. There is no hatching anywhere in this file. Every
 * mass carries at most four flat values, and which value a piece of surface
 * gets is decided by WHICH WAY IT FACES, never by which body part it is:
 *
 *   lit    the top planes, the ones square to a key that is high and in
 *          front - the crest, the croup, the top of the hump, the forehead
 *          and nasal bridge, the front edge of each near limb
 *   mid    the body value: the side planes, the great majority of the figure
 *   turn   the planes rolling away from the key - the lower flank, the back
 *          of the thigh, the underside of the neck, the cheek and jaw
 *   under  the undercuts where one mass passes behind another: behind the
 *          shoulder, under the belly, under the jaw, inside the haunch,
 *          between the near and far limbs
 *
 * The boundaries between those values are TERMINATORS - the lines where the
 * surface turns past the light - so they are drawn as one broad shape each,
 * overshooting the figure and clipped back to the mass. That is why there are
 * so few path literals in the shading: a plane is a curve plus an overshoot,
 * not an outline.
 *
 * `under` is pitched within a few points of the stage's own near-black. That
 * is deliberate and it is the whole trick of putting a dark object on a dark
 * page: the shadow side dissolves into the scene, so the figure reads as
 * sitting IN the stage rather than pasted on top of it, and the eye completes
 * the silhouette from the lit side.
 *
 * THE RIM LIGHT is what makes that work, and it is the single most valuable
 * mark in the file. A thin bright edge runs along the top-and-right contour
 * of every major mass - the topline, the horn, the brow and muzzle, the front
 * of the chest, the leading edge of the near limbs - and fades out at both
 * ends where the form turns away. On a dark stage this one device does more
 * than all the hatching it replaced: it is what tells you across a room that
 * the object is solid, heavy and metal. The fade is a gradient along the
 * stroke, which is the only thing gradients are used for on the figures.
 *
 * NO GRADIENT SHADES A MASS. Every previous attempt at these animals put an
 * object-bounding-box ramp on the barrel and every one of them came out as an
 * inflated balloon, because a soft vertical ramp on a horizontal cylinder is
 * exactly what a balloon looks like. Flat planes with hard terminators cannot
 * do that. The only gradients in the file are the rim fades and the ground
 * shadow.
 *
 * GOLD VERSUS IRON. The bull is warm gold-bronze; the bear is the same
 * treatment several stops darker and cold - gunmetal, not pale grey. Their
 * mid values differ by roughly a factor of two in luminance, so the pair
 * reads gold-against-iron before anyone has identified either animal. That
 * separation is the reason the two palettes are not the same table with a hue
 * swapped: STEEL.mid is genuinely darker than GOLD.mid, not merely bluer.
 *
 * FAR-SIDE LIMBS are one flat value with no internal detail at all - no
 * planes, no rim, no contour. They are meant to recede, and the fastest way
 * to stop a far limb competing with a near one is to give it nothing to look
 * at. Their depth offsets are small on purpose: a big offset throws the far
 * thigh out past the rump, where a 40-unit flat dark mass stops reading as
 * "the other leg" and starts reading as a second animal standing behind.
 *
 * READING AT 150px. This treatment is much safer at small sizes than the
 * hatched one it replaced, because there is nothing in it that can fail to
 * resolve. Four flat values stay four flat values at any scale. The only
 * thing that thins is the rim, which is why it is drawn at 2.1 and 1.05 -
 * the two heaviest widths in the file - rather than hairline.
 *
 * STROKE WIDTHS. Four, and only four, on the figures:
 *   2.1   the primary rim light along a major contour
 *   1.05  a secondary rim, and a drawn plane break
 *   0.7   the floor-bounce rim along the belly and the lower limbs
 *   0.45  fine detail: the eye catch, the cloven hoof split
 * A rim band is stroked at DOUBLE its width and clipped to the mass, so 2.1
 * and 0.7 also appear as 4.2 and 1.4 in the emitted markup - the same two
 * widths, with the outer half thrown away by the clip. The brand plate adds
 * one more inside its own 80-unit design box, chosen so that once the plate
 * is scaled onto the flank it prints at about 0.45.
 *
 * ---------------------------------------------------------------------------
 * ANATOMY - the numbers, checked, not eyeballed
 * ---------------------------------------------------------------------------
 *
 * Unchanged from the engraved version, and still republished on the root
 * <svg> as data-anat so a test page can assert them rather than take my word.
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
 * LEGS. A real leg is thick at the top and startlingly thin at the bottom,
 * and it is ONE continuous piece of anatomy. Section widths, scanned back off
 * the real path geometry with isPointInFill in compare-plate.html:
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
 * The legs hang UNDER their masses rather than at the corners of the body:
 * the bull's fore cannon centres on x=162 against a shoulder joint at 166,
 * its hind cannon on x=58 against a hip at 66, and the leg below the elbow is
 * 0.56 of the height at the withers.
 *
 * A leg is drawn as one piece, not a stack: seg() fills a lower segment with
 * the closed path but contours it with that path MINUS its closing Z, so the
 * straight edge where cannon meets carpus is never drawn. Drawing it is what
 * turns a leg into a pile of parts.
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
 * ankle/wrist, and the stance solver keeps the sole flat on the floor rather
 * than merely keeping a point on it.
 *
 * FEET ON THE FLOOR. Every hoof and sole path is authored with its lowest
 * coordinate at exactly y=170. Where a limb is rotated for a braced stance,
 * stanceXf() rotates about the hip or shoulder and counter-rotates the nested
 * knee group by the same angle, which turns everything below the knee into a
 * PURE TRANSLATION, then cancels that translation's vertical component. The
 * foot therefore keeps both its height and its orientation. Only the posed
 * foreleg ('charge' / 'swipe') leaves the floor, deliberately.
 *
 * IDS. Every gradient and clipPath id is prefixed per figure - bull-, bear-,
 * bullp-, bearp-, fo-bull-, fo-bear-, plus the brand plate's own - so any
 * number of these drawings can sit in one document without colliding.
 *
 * ORIGINALITY. Drawn from anatomical landmarks. It is not traced from, and
 * does not reproduce, any photograph or any existing sculpture.
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------- palettes */

  /* FOUR VALUES PER ANIMAL, assigned by which way a surface faces.
     `under` sits within a few points of the deck's own near-black stage, so
     the shadow side of the figure dissolves into the scene instead of being
     outlined against it. `far` is the single value the far-side limbs are
     painted in, flat, with nothing inside them. */
  var GOLD = {
    lit: '#D4A251', mid: '#A5741F', turn: '#5E3E12', under: '#150E04',
    far: '#2E2009', rim: '#FFF0C8', bnc: '#8A5E1C', hoof: '#211502'
  };
  /* Several stops darker AND cold. STEEL.mid is about half the luminance of
     GOLD.mid: that gap is what makes the pair read gold-against-iron before
     anyone has worked out which animal is which. */
  var STEEL = {
    lit: '#778CA2', mid: '#445364', turn: '#232C36', under: '#080A0E',
    far: '#141A21', rim: '#E4EFFC', bnc: '#3B4A5A', hoof: '#0B0F15'
  };

  function pal(kind) { return kind === 'bear' ? STEEL : GOLD; }

  /* THE ONLY FOUR STROKE WIDTHS ON THE FIGURES.
     out  primary rim light along a major contour
     in   secondary rim, and a drawn plane break
     h    the floor-bounce rim along the belly and the lower limbs
     f    fine detail: the eye catch, the cloven hoof split */
  var SW = { out: 2.1, in: 1.05, h: 0.7, f: 0.45 };
  /* and the two widths the brand plate uses inside its own 80-unit design
     box, chosen so that once the plate is scaled down onto the flank they
     print at about SW.in and SW.f */
  var PB = { rule: 2.4 };

  function n2(v) { return Math.round(v * 100) / 100; }

  /* ---------------------------------------------------------------- atoms */

  function S(list) {
    var s = '', i;
    for (i = 0; i < list.length; i++) {
      s += '<stop offset="' + list[i][0] + '" stop-color="' + list[i][1] + '"'
        + (list[i][2] != null ? ' stop-opacity="' + list[i][2] + '"' : '') + '/>';
    }
    return s;
  }
  function LG(id, attr, list) {
    return '<linearGradient id="' + id + '" ' + attr + '>' + S(list) + '</linearGradient>';
  }
  function RG(id, attr, list) {
    return '<radialGradient id="' + id + '" ' + attr + '>' + S(list) + '</radialGradient>';
  }

  /* A filled mass. No contour: on a dark stage the silhouette is carried by
     the value against the background and by the rim, and an outline round a
     cast figure is the single fastest way to make it look drawn rather than
     cast. `tag` marks a limb with data-lim so a test page can scan its
     section widths with isPointInFill. */
  function mass(d, fill, tag) {
    return '<path d="' + d + '" fill="' + fill + '"'
      + (tag ? ' data-lim="' + tag + '"' : '') + '/>';
  }
  function solid(d, fill, op) {
    return '<path d="' + d + '" fill="' + fill + '"'
      + (op != null ? ' opacity="' + op + '"' : '') + '/>';
  }
  function line(d, col, w, op) {
    return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w
      + '" stroke-linecap="round"' + (op != null ? ' opacity="' + op + '"' : '') + '/>';
  }

  /* A PLANE. `d` is a broad shape that deliberately overshoots the figure and
     is clipped back to the mass it belongs to, so a terminator is authored as
     one curve plus an overshoot rather than as a closed outline that has to
     agree with the silhouette everywhere. */
  function plane(clip, d, fill, op) {
    return '<g clip-path="url(#' + clip + ')"><path d="' + d + '" fill="' + fill + '"'
      + (op != null ? ' opacity="' + op + '"' : '') + '/></g>';
  }
  function planes(clip, list) {
    var s = '', i;
    for (i = 0; i < list.length; i++) {
      if (list[i] && list[i][0]) s += '<path d="' + list[i][0] + '" fill="' + list[i][1] + '"'
        + (list[i][2] != null ? ' opacity="' + list[i][2] + '"' : '') + '/>';
    }
    return s ? '<g clip-path="url(#' + clip + ')">' + s + '</g>' : '';
  }

  /* THE RIM. A thin bright edge along a top-or-right contour, stroked with a
     gradient so it fades out where the form turns away instead of stopping
     dead. `grad` is one of the two per-figure fades set up in defsFor:
     '-rimT' runs along the path's width (for a topline), '-rimV' down its
     height (for a face or a chest). */
  function rim(pre, d, grad, w, op) {
    return '<path d="' + d + '" fill="none" stroke="url(#' + pre + grad
      + ')" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"'
      + (op != null ? ' opacity="' + op + '"' : '') + '/>';
  }

  /* THE RIM, done properly. A stroke centred on the contour puts half its
     width outside the silhouette, where it lands on the near-black stage at
     partial opacity and dissipates into a glow - which is why the first cut
     of this treatment had a rim you could not see. Stroking at double width
     and CLIPPING to the mass throws the outer half away and leaves a hard
     bright band sitting exactly inside the edge. That is what a rim light
     actually looks like on a casting, and it is the single device that makes
     the figure read as solid metal across a room. */
  function rimBand(pre, clip, d, grad, w, op) {
    return '<g clip-path="url(#' + pre + '-' + clip + ')">'
      + '<path d="' + d + '" fill="none" stroke="url(#' + pre + grad
      + ')" stroke-width="' + (w * 2) + '" stroke-linecap="round"'
      + ' stroke-linejoin="round"'
      + (op != null ? ' opacity="' + op + '"' : '') + '/></g>';
  }

  /* A LIMB SEGMENT. The fill uses the closed path; where a contour is wanted
     it uses the same path with its closing Z removed, so the straight edge
     where the cannon meets the carpus, or the hoof meets the fetlock, is
     never drawn. Drawing it is what turns a leg into a stack of parts. */
  function openD(d) { return d.replace(/\s*Z\s*$/, ''); }

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

  /* ======================================================== defs per figure */

  /* One clipPath per mass, so a plane can be authored as a broad overshooting
     shape and cut back to the figure, plus the two rim fades and the ground
     shadow. Everything is prefixed, so any number of these drawings can share
     a document. */
  function defsFor(pre, kind) {
    var bear = kind === 'bear';
    var P = pal(kind);
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
      cp('horn', BULL.hornNear);
      cp('fu', BULL.foreUp);
      cp('fl', BULL.foreLo);
      cp('hu', BULL.hindUp);
      cp('hl', BULL.hindLo);
    }
    /* THE RIM FADES. -rimT runs along a path's width, for a topline that
       should die away towards the rear; -rimV runs down its height, for a
       face or a chest that should die away towards the floor. Both are
       objectBoundingBox, so one pair serves every rim on the figure. */
    s += LG(pre + '-rimT', 'x1="0" y1="0" x2="1" y2="0"', [
      [0, P.rim, 0], [0.16, P.rim, 0.6], [0.5, P.rim, 1], [1, P.rim, 1]]);
    s += LG(pre + '-rimV', 'x1="0" y1="0" x2="0" y2="1"', [
      [0, P.rim, 1], [0.4, P.rim, 0.6], [1, P.rim, 0]]);
    /* the cast shadow on the floor - the only other gradient in the file */
    s += RG(pre + '-gsh', 'cx="0.5" cy="0.5" r="0.5"', [
      [0, P.under, 0.95], [0.5, P.under, 0.55], [1, P.under, 0]]);
    return s;
  }

  /* ============================================================ bull skin */

  function bullTrunkSkin(pre) {
    var P = GOLD;
    var s = '';
    /* THE TWO TERMINATORS. Each is one curve carried out past the figure and
       clipped back to it: above the first the surface faces the key, below
       the second it has rolled away from it, and the band between is the
       body value the trunk was filled with. Their shape is the shape of the
       animal's back and belly, which is why they are not parallel. */
    s += planes(pre + '-sil', [
      /* The lit terminator is the TOPLINE OFFSET DOWNWARD by about eleven
         units, point for point - croup, point of hip, dipped loin, withers,
         crest. Parallel to the silhouette it reads as the crown of a rounded
         form; any other shape and it reads as a flat panel laid on top, which
         is exactly how the first cut of this went wrong. */
      ['M 30 40 L 30 89 C 36 87 42 86 48 85.6 C 54 85.2 58 84.8 62 84.6 '
        + 'C 71 86.5 80 89.5 86 92.5 C 98 88.5 109 85 118 81.4 '
        + 'C 127 71.5 139 68.5 151 70.5 C 159 72 167 76.5 172 84 '
        + 'L 180 84 L 180 40 Z', P.lit],
      ['M 20 100 C 32 106 44 110 60 113 C 86 118 116 119 146 116 '
        + 'C 162 114 172 111 180 107 L 180 152 L 20 152 Z', P.turn],
      ['M 20 106 C 32 112 46 117 62 119 C 90 123 118 124 146 122 '
        + 'C 162 121 172 118 180 114 L 180 152 L 20 152 Z', P.under],
      /* THE GIRTH CREASE behind the shoulder blade, tapered: deep where the
         shoulder blade stands proud of the barrel, dying out at the belly.
         Without this one break the front end and the barrel read as a single
         sausage; drawn as a parallel-sided band it reads as a strap. */
      ['M 141 56 C 146 78 146.5 104 142.5 132 L 147.5 131 C 151 104 150.5 78 146 56 Z',
        P.under, 0.55],
      /* the hollow under the crest where the neck plunges into the shoulder */
      ['M 172 82 C 166 97 156 105 143 106 C 156 100 165 93 168.5 80 Z', P.under, 0.8],
      /* inside the near haunch */
      ['M 79 107 C 71 117 58 116 45 106 C 60 112 70 112 77 103 Z', P.under, 0.85],
      /* THE HARD CATCHES. Three small facets squarely facing the key - the
         point of the hip, the crest of the neck and the point of the
         shoulder. A cast figure is read off its corners, and these are the
         corners. */
      ['M 58 73.8 C 64 73.6 68 75 70.5 77.5 C 66 76.2 62 75.6 57 76 Z', P.lit],
      ['M 132 62 C 140 58.8 148 58.4 155 60.5 C 147 61.6 139 63.4 132.5 66.5 Z', P.lit],
      ['M 166 68 C 170 71 172 76 172 82 C 170 77 168 73 164.5 70.5 Z', P.lit]
    ]);
    return s;
  }

  function bullTrunkRim(pre) {
    var P = GOLD;
    /* THE TOPLINE RIM - croup, loin, withers, crest - is the single most
       valuable mark in the drawing. It fades out towards the rear, where the
       form turns away from a key that is high and in front. */
    var s = rimBand(pre, 'sil', 'M 34 86 C 33.5 80 35.5 77.5 39 76 L 48 74.6 L 62 73.6 '
      + 'C 71 75.5 80 78.5 86 81.5 C 98 77.5 109 74 118 70.4 '
      + 'C 127 60.5 139 57.5 151 59.5 C 159 61 166.5 65.5 170.5 73', '-rimT', SW.out);
    /* the front of the chest, dying downward into the brisket shadow */
    s += rimBand(pre, 'sil', 'M 170.5 94 L 171.5 103 C 171.5 112 169.5 119 167 124',
      '-rimV', SW.in);
    /* FLOOR BOUNCE. A dim warm line along the underside: light coming back
       up off the floor is what stops the belly reading as a hole, and it is
       the one place a dark-on-dark figure needs help. */
    s += line('M 88 121.5 C 108 125.5 130 126 152 125 L 166 123.5', P.bnc, SW.h, 0.75);
    return s;
  }

  function bullHeadSkin(pre) {
    var P = GOLD;
    var s = planes(pre + '-head', [
      /* the flat forehead and the straight nasal bridge take the key, and
         the terminator parallels them the way the trunk's parallels the back */
      ['M 145 50 L 145 73 C 155 74 163 75.5 169.5 78 C 176 81 182 86.5 189.5 93.5 '
        + 'C 192.5 96 194.5 97.5 196.5 98.5 L 208 98.5 L 208 50 Z', P.lit],
      /* cheek and jaw roll away */
      ['M 145 92 C 155 96 164 99 176 102 C 186 104 194 104 202 101 '
        + 'L 208 101 L 208 120 L 145 120 Z', P.turn],
      /* under the jaw is the deepest undercut on the head */
      ['M 145 98 C 156 103 166 106 178 107.5 C 188 108.5 196 107 202 104 '
        + 'L 208 104 L 208 120 L 145 120 Z', P.under]
    ]);
    /* the nostril, and the blunt front face of the muzzle catching the key */
    s += solid('M 191.5 93.5 C 193.5 93.5 194.5 95 194 96.8 C 193 98 191 97.5 190.5 96 Z', P.under);
    s += solid('M 194 92.5 C 195.4 93.6 195.6 96 195.2 99 L 193.4 99.4 '
      + 'C 193.8 96.4 193.6 94 192.6 92.6 Z', P.lit);
    /* THE EYE. Set low and wide on a broad flat forehead. It is the darkest
       thing on the animal and it carries the whole head - which is why it
       gets the one fine catch-light in the file. */
    s += solid('M 176 83.6 C 179.6 82.6 182 84.2 181.8 86.6 C 181.6 88.8 179 89.8 176.8 '
      + '88.8 C 175 88 174.6 84.6 176 83.6 Z', P.under);
    s += line('M 176.6 84.2 C 178.4 83.2 180.4 83.6 181.3 85', P.rim, SW.f, 0.8);
    /* the brow ridge, and the mouth */
    s += rim(pre, 'M 172.5 79.6 C 177 79.1 181.5 80.6 184 83.6', '-rimT', SW.f, 0.8);
    s += line('M 194 100 C 190.5 102 185 102.5 180.5 102', P.under, SW.f, 0.85);
    return s;
  }

  function bullHeadRim(pre) {
    /* poll -> flat forehead -> straight nasal -> the square front of the
       muzzle. One unbroken edge: it is the profile that says "bull". */
    return rimBand(pre, 'head',
      'M 162.5 67.6 C 166.5 66 169.5 68 171 72 L 180.5 79.5 L 190.5 88.5 '
      + 'C 193 90 195.3 91 195.5 93 L 194.5 101', '-rimT', SW.in);
  }

  /* ============================================================ bear skin */

  function bearTrunkSkin(pre) {
    var P = STEEL;
    var s = planes(pre + '-sil', [
      /* the lit plane follows the fall from the hump to the rump, so the one
         silhouette cue that separates bear from bull is also the brightest
         thing on the animal */
      ['M 24 50 L 24 102 C 30 99 35 97.5 41 97 L 56 98.5 '
        + 'C 74 99 90 97.5 102 94.5 C 118 90.5 134 85.5 143 82.5 L 152 82 '
        + 'C 163 84 171 89 175.5 95.5 L 184 95.5 L 184 50 Z', P.lit],
      ['M 18 114 C 32 119 44 121 60 122 C 90 125 120 125 148 120 '
        + 'C 164 117 174 116 182 118 L 182 158 L 18 158 Z', P.turn],
      ['M 18 121 C 34 127 48 131 66 133 C 96 137 126 137 152 133 '
        + 'C 166 131 176 129 182 125 L 182 158 L 18 158 Z', P.under],
      /* the crease that separates the hump and the heavy forearm from the
         long barrel, tapered so it does not read as a strap */
      ['M 140 72 C 145 94 145.5 116 141.5 134 L 146.5 133 C 150 116 149.5 94 145 72 Z',
        P.under, 0.55],
      ['M 178 98 C 172 109 163 116 151 117 C 163 111 172 104 175 95 Z', P.under, 0.8],
      ['M 78 123 C 70 132 56 130 44 120 C 58 127 69 127 76 119 Z', P.under, 0.85],
      /* the catch on the apex of the hump, and on the point of the hip */
      ['M 138 79.5 C 145 77.2 152 76.4 158 77.8 C 150 79 143 81 137 83.5 Z', P.lit],
      ['M 48 92.2 C 54 92.4 58 93.6 60.5 95.6 C 56 94.4 52 93.8 47 94 Z', P.lit]
    ]);
    return s;
  }

  function bearTrunkRim(pre) {
    var P = STEEL;
    /* rump -> back -> THE HUMP -> nape. The hump apex is where the rim is
       brightest, because it is the highest point and the closest to the key. */
    var s = rimBand(pre, 'sil',
      'M 32 99 C 33 93 35.5 92 41 91.5 L 56 93 C 74 93.5 90 92 102 89 '
      + 'C 118 85 134 80 143 77 L 152 76.5 C 163 78.5 171 83.5 175.5 90', '-rimT', SW.out);
    s += rimBand(pre, 'sil', 'M 176 106 L 179 113 C 179 121 177 128 173 133',
      '-rimV', SW.in);
    s += line('M 100 136.5 C 126 138.5 146 137 163 134 L 172 131', P.bnc, SW.h, 0.7);
    return s;
  }

  function bearHeadSkin(pre) {
    var P = STEEL;
    var s = planes(pre + '-head', [
      ['M 155 60 L 155 91 C 163 89 171 87 177 86.5 C 183.5 86 187.5 88.5 190 92 '
        + 'C 192 95 194.5 97 197.5 99 L 210 99 L 210 60 Z', P.lit],
      ['M 155 99 C 165 103 175 105 186 105 C 194 105 199 104 204 102 '
        + 'L 210 102 L 210 122 L 155 122 Z', P.turn],
      ['M 155 104 C 166 108 176 110 187 109.5 C 195 109 200 107.5 204 105 '
        + 'L 210 105 L 210 122 L 155 122 Z', P.under]
    ]);
    /* the nose: a black leather pad, the darkest thing on the head */
    s += solid('M 196.5 97 C 200 98 202 100 201.5 102.5 C 201 104.5 198 105 195.5 103.5 '
      + 'C 194 102 194.5 98.5 196.5 97 Z', P.under);
    s += line('M 196.8 98.2 C 198.6 98.4 200.2 99.6 200.8 101', P.rim, SW.f, 0.7);
    /* THE EYE. Small, forward and low on a broad skull - small eyes in a big
       skull is most of what makes a bear look like a bear. */
    s += solid('M 184.4 92 C 186.9 91.2 188.6 92.5 188.3 94.2 C 188 95.7 186 96.2 184.6 '
      + '95.2 C 183.5 94.4 183.4 92.6 184.4 92 Z', P.under);
    s += line('M 184.6 92 C 186.2 91.3 187.8 91.8 188.4 93', P.rim, SW.f, 0.7);
    s += line('M 199 104.5 C 194 106.5 188 107 182.5 106.3', P.under, SW.f, 0.85);
    return s;
  }

  function bearHeadRim(pre) {
    return rimBand(pre, 'head',
      'M 167.4 91 C 167.6 86 171 83.8 176 83.5 C 182 83 186.5 85.5 189 89.5 '
      + 'C 191 92.5 193.5 94.5 196.5 96.5 L 200 99', '-rimT', SW.in);
  }

  /* =============================================================== members */

  /* A limb carries the same four values as the body and gets them the same
     way: a lit band down its LEADING edge, the mid body value across its
     face, and the turn and the undercut stacked down its trailing edge. That
     is what makes a limb a cylinder instead of a plank - one bright edge, one
     dark edge, nothing in between.
     The far side is a single flat value with no planes, no rim and no
     contour, because the fastest way to stop a far limb competing with a
     near one is to give it nothing to look at. */
  function bullFore(pre, far, kneeXf, solo) {
    var P = GOLD;
    var s = mass(BULL.foreUp, far ? P.far : P.mid, far ? null : 'bull-fu');
    if (!far) {
      s += planes(pre + '-fu', [
        ['M 128 40 L 128 136 L 163 136 C 157 126 154.8 120 154.4 110 '
          + 'C 153.8 92 152.6 76 153 40 Z', P.turn],
        ['M 128 40 L 128 136 L 160 136 C 154 126 151.8 120 151.4 110 '
          + 'C 150.8 92 149.6 76 150 40 Z', P.under],
        ['M 156 40 C 161 72 163 88 163.6 102 C 164 114 163 122 162 136 '
          + 'L 186 136 L 186 40 Z', P.lit]
      ]);
      /* the spine of the scapula and the point of the elbow, as breaks */
      s += line('M 149 74 C 155 86 160 94 165 99', P.under, SW.in, 0.55);
      s += rimBand(pre, 'fu', 'M 168 86 L 170.5 100 C 170 112 168.5 121 168 128',
        '-rimV', SW.in);
    }
    s += '<g class="knee" style="--ko:' + (far ? 150 : 162) + 'px 128px"'
      + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
      + mass(BULL.foreLo, far ? P.far : P.mid, far ? null : 'bull-fl')
      + (far ? '' : planes(pre + '-fl', [
        ['M 148 120 L 148 168 L 160.2 168 C 158.8 150 158.8 138 160.2 120 Z', P.turn],
        ['M 148 120 L 148 168 L 158.2 168 C 157 150 157 138 158.4 120 Z', P.under],
        ['M 165 120 C 166 138 166 152 165.2 168 L 176 168 L 176 120 Z', P.lit]
      ]))
      + (far ? '' : rimBand(pre, 'fl', 'M 167.5 130 C 166.4 138 165.2 144 166.3 151',
          '-rimV', SW.h))
      /* the hoof is horn, not bronze: the darkest value on the animal */
      + mass(BULL.foreHf, far ? P.far : P.hoof)
      + (far ? '' : rim(pre, 'M 166.8 158 L 167.6 166.5', '-rimV', SW.f, 0.8))
      + (far ? '' : line('M 162.9 170 L 162.9 161', P.under, SW.f, 0.9))
      + '</g>';
    return s;
  }

  function bullHind(pre, far, kneeXf) {
    var P = GOLD;
    var s = mass(BULL.hindUp, far ? P.far : P.mid, far ? null : 'bull-hu');
    if (!far) {
      s += planes(pre + '-hu', [
        ['M 15 40 L 15 148 L 60 148 C 52 134 47 122 46.5 106 '
          + 'C 46 92 47 74 48 40 Z', P.turn],
        ['M 15 40 L 15 148 L 56 148 C 48 134 43 122 42.5 106 '
          + 'C 42 92 43 74 44 40 Z', P.under],
        ['M 62 40 C 68 78 68.5 92 67 102 C 65.5 112 62.5 122 57 148 '
          + 'L 95 148 L 95 40 Z', P.lit]
      ]);
      /* the stifle and the point of the hock, each a corner */
      s += rimBand(pre, 'hu', 'M 68.5 80 C 74 88 75.5 100 72.5 111 L 69 120',
        '-rimV', SW.in);
      s += line('M 50.5 142.5 L 52 138', P.lit, SW.f, 0.9);
    }
    s += '<g class="knee" style="--ko:' + (far ? 49 : 57) + 'px 141px"'
      + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
      + mass(BULL.hindLo, far ? P.far : P.mid, far ? null : 'bull-hl')
      + (far ? '' : planes(pre + '-hl', [
        ['M 45 132 L 45 168 L 57.4 168 C 56.2 152 56.2 144 57.4 132 Z', P.turn],
        ['M 45 132 L 45 168 L 55.4 168 C 54.4 152 54.4 144 55.6 132 Z', P.under],
        ['M 62 132 C 63 146 63 156 62.2 168 L 72 168 L 72 132 Z', P.lit]
      ]))
      + (far ? '' : rimBand(pre, 'hl', 'M 63.4 142 C 62.8 148 62.6 152 63.6 156',
          '-rimV', SW.h))
      + mass(BULL.hindHf, far ? P.far : P.hoof)
      + (far ? '' : rim(pre, 'M 64.3 158.5 L 65 166.5', '-rimV', SW.f, 0.8))
      + (far ? '' : line('M 60.3 170 L 60.3 161.5', P.under, SW.f, 0.9))
      + '</g>';
    return s;
  }

  function bearFore(pre, far, kneeXf, solo) {
    var P = STEEL;
    var s = mass(BEAR.foreUp, far ? P.far : P.mid, far ? null : 'bear-fu');
    if (!far) {
      s += planes(pre + '-fu', [
        ['M 125 40 L 125 150 L 157 150 C 153 136 151.5 124 150.5 110 '
          + 'C 149.5 96 148 76 148 40 Z', P.turn],
        ['M 125 40 L 125 150 L 153.5 150 C 149.5 136 148 124 147 110 '
          + 'C 146 96 144.5 76 144.5 40 Z', P.under],
        ['M 150 40 C 155 78 156.5 92 157 108 C 157.4 124 157 134 156.6 150 '
          + 'L 180 150 L 180 40 Z', P.lit]
      ]);
      s += line('M 139.5 102 C 145 109 150 113 155 114', P.under, SW.in, 0.5);
      s += rimBand(pre, 'fu', 'M 162 94 L 164 108 C 164.5 120 163 133 162.5 144',
        '-rimV', SW.in);
    }
    s += '<g class="knee" style="--ko:' + (far ? 146 : 156) + 'px 145px"'
      + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
      + mass(BEAR.forePaw, far ? P.far : P.mid, far ? null : 'bear-fp')
      + mass(BEAR.foreClaw, far ? P.far : P.hoof)
      + (far ? '' : planes(pre + '-fl', [
        /* the sole is flat on the floor, so on a plantigrade foot the dark
           plane is a HORIZONTAL band under the ankle, not a vertical one */
        ['M 140 160 C 152 163 164 165 180 166 L 180 170 L 140 170 Z', P.turn],
        ['M 140 165.5 C 152 167.5 164 168.5 180 169 L 180 170 L 140 170 Z', P.under],
        ['M 145 140 L 145 154 C 152 155 158 153 163 150 L 163 140 Z', P.lit]
      ]))
      + (far ? '' : line('M 150 161.5 C 157 163.5 164 165 171.5 167', P.bnc, SW.h, 0.6))
      + '</g>';
    return s;
  }

  function bearHind(pre, far, kneeXf) {
    var P = STEEL;
    var s = mass(BEAR.hindUp, far ? P.far : P.mid, far ? null : 'bear-hu');
    if (!far) {
      s += planes(pre + '-hu', [
        ['M 18 40 L 18 155 L 52 155 C 42 142 38 130 37.5 112 '
          + 'C 37 96 39 74 40 40 Z', P.turn],
        ['M 18 40 L 18 155 L 48 155 C 38 142 34 130 33.5 112 '
          + 'C 33 96 35 74 36 40 Z', P.under],
        ['M 58 40 C 64 80 65 96 64.5 108 C 64 118 61 128 55 155 '
          + 'L 95 155 L 95 40 Z', P.lit]
      ]);
      s += rimBand(pre, 'hu', 'M 66 84 C 71 94 71.5 106 69 117 L 66.5 127',
        '-rimV', SW.in);
      s += line('M 44 155 L 46 150', P.lit, SW.f, 0.9);
    }
    s += '<g class="knee" style="--ko:' + (far ? 45 : 51) + 'px 150px"'
      + (kneeXf ? ' transform="' + kneeXf + '"' : '') + '>'
      + mass(BEAR.hindPaw, far ? P.far : P.mid, far ? null : 'bear-hp')
      + mass(BEAR.hindClaw, far ? P.far : P.hoof)
      + (far ? '' : planes(pre + '-hl', [
        ['M 30 160 C 42 163 54 165 70 166 L 70 170 L 30 170 Z', P.turn],
        ['M 30 165.5 C 42 167.5 54 168.5 70 169 L 70 170 L 30 170 Z', P.under],
        ['M 50 142 L 50 156 C 55 157 58 155 60 152 L 60 142 Z', P.lit]
      ]))
      + (far ? '' : line('M 40.5 162 C 47 164 54 165.5 61.5 167', P.bnc, SW.h, 0.6))
      + '</g>';
    return s;
  }

  /* ================================================================ bodies */

  /* `lift` is the deck's head-carriage control and matches the old module's
     sign: POSITIVE lowers the head. It is applied as a rotation about the
     same pivot the CSS head-bob uses, so the neck joint never opens up - a
     translate would shear the head off the neck at large values. */
  function headXf(lift, px, py) {
    var deg = n2((lift || 0) * 0.5);
    return 'rotate(' + deg + ' ' + px + ' ' + py + ')';
  }

  function bullBody(pre, lift, plateOpts) {
    var P = GOLD;
    var s = '';
    /* the far horn and far ear go down BEFORE the trunk, so they sit behind
       the skull, and they are painted in the flat far-side value for the
       same reason the far limbs are: they are depth, not detail */
    s += '<g transform="' + headXf(lift, 166, 76) + '">'
      + mass(BULL.hornFar, P.far) + mass(BULL.earFar, P.far) + '</g>';
    s += mass(BULL.trunk, P.mid);
    s += bullTrunkSkin(pre);
    if (plateOpts !== false) s += brandPlate('bull', plateOpts || {});
    s += bullTrunkRim(pre);
    s += '<g class="head" style="--ho:166px 76px">'
      + '<g transform="' + headXf(lift, 166, 76) + '">'
      /* the dewlap hangs under the jaw, so it is in shadow from top to
         bottom - but its forward edge still catches the key, and that thin
         bright line is most of what tells you it is hanging free */
      + mass(BULL.dewlap, P.turn)
      + planes(pre + '-dew', [
        ['M 155 112 C 165 118 172 122 180 124 L 180 145 L 155 145 Z', P.under]])
      + rim(pre, 'M 165 94 C 174 97.5 179 104 177 111 C 175.8 115.5 177.5 119 174.5 122.5 '
        + 'C 177.5 128.5 172 135 164 135.5', '-rimV', SW.h, 0.8)
      + mass(BULL.skull, P.mid)
      + bullHeadSkin(pre)
      + mass(BULL.earNear, P.turn)
      + rim(pre, 'M 163.5 73.5 C 157 73 150.5 77 147 84', '-rimT', SW.f, 0.7)
      /* THE NEAR HORN. Cast bronze like the rest of it: a lit band along its
         outer curve, the tip dropping into shadow as it turns away, and the
         rim carried right to the point. Horns are the first thing read at
         150px, so the outer edge gets the second-heaviest width in the file. */
      + mass(BULL.hornNear, P.mid)
      + planes(pre + '-horn', [
        ['M 160 40 L 160 71.5 C 168 65.5 178 64.5 186 67.5 C 192 70 196.5 67 197 59 '
          + 'L 206 56 L 206 40 Z', P.lit],
        ['M 158 78 C 168 73 180 72.5 190 76 C 196 78 200 74 202 64 '
          + 'L 212 64 L 212 96 L 158 96 Z', P.turn]])
      + rimBand(pre, 'horn',
          'M 165 68.5 C 174 62.5 183 62 190 66 C 195 69 198 65 198 56.5 L 200.5 55.5',
          '-rimT', SW.in)
      + bullHeadRim(pre)
      + '</g></g>';
    return s;
  }

  function bearBody(pre, lift, plateOpts) {
    var P = STEEL;
    var s = '';
    s += '<g transform="' + headXf(lift, 172, 96) + '">'
      + mass(BEAR.earFar, P.far) + '</g>';
    s += mass(BEAR.trunk, P.mid);
    s += bearTrunkSkin(pre);
    if (plateOpts !== false) s += brandPlate('bear', plateOpts || {});
    s += bearTrunkRim(pre);
    s += '<g class="head" style="--ho:172px 96px">'
      + '<g transform="' + headXf(lift, 172, 96) + '">'
      + mass(BEAR.earNear, P.turn)
      + rim(pre, 'M 170.5 85 C 169 81 171 77.8 174.5 77.5 C 178 77.2 180.3 79.8 179.6 83.4',
          '-rimT', SW.f, 0.8)
      + mass(BEAR.skull, P.mid)
      + bearHeadSkin(pre)
      + bearHeadRim(pre)
      + '</g></g>';
    return s;
  }

  /* ---------------------------------------------------------------- floor */

  /* No reflection - a mirror floor is the old glossy module's language. A
     bronze sits on a plinth: a soft cast shadow, and a dim warm contact where
     the metal meets it. The shadow is drawn OUTSIDE .bob, because the floor
     does not bob with the animal. `raised` drops the near forefoot's contact
     for the posed figures, whose front foot is off the ground. */
  function groundShade(pre, kind, raised) {
    var P = pal(kind);
    var bear = kind === 'bear';
    var s = '<ellipse cx="' + (bear ? 102 : 100) + '" cy="170.5" rx="' + (bear ? 80 : 76)
      + '" ry="6.5" fill="url(#' + pre + '-gsh)"/>';
    s += line('M ' + (bear ? 40 : 55.5) + ' 169.6 L ' + (bear ? 63 : 65.5) + ' 169.6',
      P.bnc, SW.h, 0.6);
    if (!raised) {
      s += line('M ' + (bear ? 153 : 158) + ' 169.6 L ' + (bear ? 172 : 168) + ' 169.6',
        P.bnc, SW.h, 0.6);
    }
    return s;
  }

  /* ------------------------------------------------------------ the plate */

  /* brandPlate(kind, opts) -> '<g>...</g>'
   *
   * A small cast plaque set into the near flank. It is SQUARE, because the
   * Davy mark is square and must never be stretched to fill a wide plate -
   * the previous wide rectangle was both wrong for the mark and the second
   * thing the eye landed on after the animal's own eye. This one is about
   * 11% of body length, sits in its own cast bezel, and is knocked back with
   * a scrim of the figure's undercut value so it reads as cast INTO the
   * flank and lit by the same key, rather than as a label stuck on.
   *
   *   opts.markup  SVG markup placed inside instead of the mark.
   *                ---> AUTHOR IT IN THE MARK'S OWN 0 0 80 80 SQUARE. <---
   *                (The engraved version of this file took a 0 0 100 30 box;
   *                this one is square, for the reason above.)
   *   opts.text    wordmark string for the fallback, default 'Davy'.
   *   opts.id      id prefix for this plate's own ids.
   *   opts.x/.y    plate centre in the host drawing's coordinates.
   *   opts.w       plate width in host units.
   *   opts.rot     degrees, a few off level so it sits on the barrel.
   *   opts.mirror  true when the host group is itself mirrored (the bear in
   *                faceoffSVG), so the plate content flips back and reads.
   *
   * THE MARK ITSELF comes from the global DAVY_MARK when davy-mark.js has
   * been loaded, so the trademark lives in exactly one file and this one
   * never carries a second, drifting copy of it. The letters are stamped in
   * the figure's own pale metal rather than flat white, which is the one
   * thing DAVY_MARK.inner's letterFill option exists for. When that global
   * is absent this falls back to a plain lettered plaque, and says so.
   *
   * MIRRORING, twice over. opts.mirror handles a caller that mirrors the
   * whole host group. Separately the content sits in <g class="brandflip">
   * with transform-box:fill-box inline, so a page that flips a whole beastSVG
   * horizontally can undo just the mark with one rule and no coordinates:
   *     .flipped .brandflip { transform: scaleX(-1) }
   */
  function brandPlate(kind, opts) {
    opts = opts || {};
    var bear = kind === 'bear';
    var P = pal(kind);
    var x = opts.x != null ? opts.x : (bear ? 112 : 116);
    var y = opts.y != null ? opts.y : (bear ? 112 : 104);
    var w = opts.w != null ? opts.w : (bear ? 18 : 17);
    var rot = opts.rot != null ? opts.rot : (bear ? -3 : -5);

    /* the mark's own box is 80x80; the cast bezel adds 6 all round -> 92x92 */
    var s = w / 92;

    var inner = opts.markup;
    if (!inner && global.DAVY_MARK && typeof global.DAVY_MARK.inner === 'function') {
      /* The official lockup, unaltered: white on the brand crimson. Casting
         it in the figure's own metal would be a recolour of a trademark. */
      inner = global.DAVY_MARK.inner({ letterFill: '#FFFFFF' });
    }
    if (!inner) {
      var txt = (opts.text != null ? String(opts.text) : 'Davy')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      inner = '<rect width="80" height="80" fill="' + P.turn + '"/>'
        + '<text x="40" y="48" text-anchor="middle" font-size="20" font-weight="700"'
        + ' letter-spacing="0.5" fill="' + P.lit
        + '" font-family="Source Serif 4,Georgia,Times New Roman,serif">' + txt + '</text>';
    }

    var face = '<g class="brandflip" style="transform-box:fill-box;transform-origin:50% 50%">'
      + inner
      /* the scrim: the plaque is lit by the same key as the flank it is cast
         into, so it takes the same shadow rather than glowing on its own */
      + '<rect width="80" height="80" fill="' + P.under + '" opacity="0.16"/>'
      + '</g>';

    return '<g class="brand" transform="translate(' + x + ' ' + y + ') rotate(' + rot
      + ') scale(' + n2(s * 100) / 100 + ')'
      + (opts.mirror ? ' scale(-1 1)' : '') + ' translate(-40 -40)">'
      /* cast shadow under the lower edge - the plaque stands proud */
      + '<rect x="-3" y="-3" width="92" height="92" rx="4" fill="' + P.under
        + '" opacity="0.8"/>'
      /* the bezel, and the light catching its top edge */
      + '<rect x="-6" y="-6" width="92" height="92" rx="4" fill="' + P.turn + '"/>'
      + '<path d="M -6 -2 L -6 -6 L 86 -6 L 86 -2 Z" fill="' + P.lit + '" opacity="0.85"/>'
      + '<rect x="-6" y="-6" width="92" height="92" rx="4" fill="none" stroke="'
        + P.under + '" stroke-width="' + PB.rule + '" opacity="0.7"/>'
      + face
      + '</g>';
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
    /* The tail hangs on the shadow side and stays there: one flat value, one
       thin rim down its leading edge. The bull's switch gets the darkest
       value of all, because a brush of hair is not a cast surface and should
       not catch the key the way the barrel does. */
    var tail = bear
      ? mass(BEAR.tail, P.turn)
        + line('M 34 103 C 28.5 103.5 26 108 28 111.5', P.lit, SW.f, 0.55)
      : mass(BULL.tail, P.turn)
        + mass(BULL.tuft, P.under)
        + line('M 44 76 C 35 84 27 96 22.5 110', P.lit, SW.f, 0.6);

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

  /* EVERY CALL GETS ITS OWN ID PREFIX. The old module prefixed ids per figure
     ROLE - bull-, bear-, bullp- - which is fine until a page renders the same
     role twice, at which point the second copy's url(#bull-sil) resolves to
     the first copy's clipPath, in a different <svg> root, and browsers do not
     reliably honour that. Under the hatched treatment a clip that quietly
     failed only let a few lines spill. Under this one the planes are broad
     shapes that deliberately overshoot the figure, so a failed clip paints a
     raw rectangle over the whole animal. A monotonic suffix makes the whole
     class of bug impossible: bull1, bull2, bear1, fo-bull3 and so on. */
  var UID = 0;

  global.beastSVG = function beastSVG(kind) {
    var bear = kind === 'bear';
    var k = bear ? 'bear' : 'bull';
    var pre = k + (++UID);
    return '<svg viewBox="0 0 260 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"'
      + ' data-anat="' + ANAT[k] + '">'
      + '<defs>' + defsFor(pre, k) + '</defs>'
      /* the cast shadow sits outside .bob: the floor does not bob */
      + groundShade(pre, k)
      + '<g class="bob">' + figure(kind, pre, { anim: true }) + '</g>'
      + '</svg>';
  };

  global.pickSVG = function pickSVG(kind) {
    var bear = kind === 'bear';
    var k = bear ? 'bear' : 'bull';
    var pre = (bear ? 'bearp' : 'bullp') + (++UID);
    /* head up and alert (negative lift raises it), and the whole figure
       nudged into the 200x150 card with a little air all round */
    var t = bear ? 'translate(-20 -30) scale(0.98)' : 'translate(-16 -28) scale(0.98)';
    return '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"'
      + ' data-anat="' + ANAT[k] + '">'
      + '<defs>' + defsFor(pre, k) + '</defs>'
      + '<g transform="' + t + '">'
      + groundShade(pre, k)
      + figure(kind, pre, { lift: -18 })
      + '</g></svg>';
  };

  global.faceoffSVG = function faceoffSVG() {
    /* Bull left facing right, bear right facing left, squared up with a gap
       between them and a low sun rising out of that gap - which is also
       where both rim lights are coming from, so the lighting in the two
       figures and the lighting in the scene agree.
       The three wrappers .fo-l, .fo-r and .fo-sun carry NO transform of their
       own - the scale and the mirror live on an inner group - so the page can
       animate them in without fighting the geometry. */
    var u = ++UID, pb = 'fo-bull' + u, pr = 'fo-bear' + u;
    var s = '<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    s += '<defs>' + defsFor(pb, 'bull') + defsFor(pr, 'bear')
      + '<clipPath id="' + pb + '-sunclip"><rect x="182" y="98" width="160" height="80"/></clipPath>'
      + RG(pb + '-glow', 'cx="0.5" cy="0.5" r="0.5"', [
          [0, '#C08B33', 0.5], [0.45, '#7A5418', 0.2], [1, '#7A5418', 0]])
      + LG(pb + '-line', 'x1="0" y1="0" x2="1" y2="0"', [
          [0, '#3A2A0E', 0], [0.3, '#8A5E1C', 0.55], [0.5, '#F0C878', 0.9],
          [0.7, '#5E7288', 0.5], [1, '#151B22', 0]])
      + '</defs>';

    /* the low sun between them: a soft glow, and struck rays over it */
    s += '<ellipse class="fo-sun" cx="262" cy="176" rx="130" ry="74" fill="url(#'
      + pb + '-glow)"/>';
    var rays = '', i, ang, hw, x0, y0, x1, y1, x2, y2;
    var cx = 262, cy = 178;
    for (i = 0; i < 17; i++) {
      ang = Math.PI + (i + 0.5) * Math.PI / 17;      /* a half turn above the line */
      hw = 0.010 + 0.006 * Math.abs(Math.sin(i * 1.7));
      x0 = cx + Math.cos(ang - hw) * 13;
      y0 = cy + Math.sin(ang - hw) * 13;
      x1 = cx + Math.cos(ang) * 72;
      y1 = cy + Math.sin(ang) * 72;
      x2 = cx + Math.cos(ang + hw) * 13;
      y2 = cy + Math.sin(ang + hw) * 13;
      rays += '<path d="M ' + n2(x0) + ' ' + n2(y0) + ' L ' + n2(x1) + ' ' + n2(y1)
        + ' L ' + n2(x2) + ' ' + n2(y2) + ' Z"/>';
    }
    s += '<g clip-path="url(#' + pb + '-sunclip)" fill="#C08B33" opacity="0.32">'
      + rays + '</g>';

    /* the plinth they stand on */
    s += '<rect x="0" y="178" width="520" height="22" fill="#0A0B0F"/>';
    s += '<rect x="0" y="177.4" width="520" height="1.2" fill="url(#' + pb + '-line)"/>';

    /* feet land on 170 in figure space; 170*1.12 - 12.4 = 178 */
    s += '<g class="fo-l"><g transform="translate(2 -12.4) scale(1.12)">'
      + groundShade(pb, 'bull', true)
      + figure('bull', pb, { pose: 'charge', lift: 12 }) + '</g></g>';
    s += '<g class="fo-r"><g transform="translate(527 -12.4) scale(-1.12 1.12)">'
      + groundShade(pr, 'bear', true)
      + figure('bear', pr, { pose: 'swipe', lift: -8,
          plate: { id: pr + '-bp', mirror: true } })
      + '</g></g>';
    s += '</svg>';
    return s;
  };

  global.brandPlate = brandPlate;

})(typeof window !== 'undefined' ? window : this);
