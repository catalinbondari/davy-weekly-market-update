/* beast-silhouette.js - The Weekly Stampede, cinematic silhouette treatment.
 *
 * Two globals: beastSVG(kind) and pickSVG(kind), kind = 'bull' | 'bear'.
 *
 * TECHNIQUE. The animal is one near-black bronze mass against a dusk sky.
 * Nothing is modelled inside it. All of the realism is carried by the CONTOUR,
 * so every inflection of that outline is a named landmark: the crest of the
 * neck and the poll, the withers, the saddle behind them, the point of the
 * hip, the tail head, the point of the buttock, the flank crease, the stifle,
 * the point of the hock, the brisket and the dewlap on the bull; the round
 * ear, the shoulder hump, the dipped back, the high rump and the long
 * plantigrade foot on the bear.
 *
 * A hard warm rim light runs the top and back edge - broken and variable,
 * bright where the form turns sharply (buttock, point of hip, withers, crest,
 * horn; rump, hump, ear on the bear) and absent along the flat runs. It is
 * drawn as the body path itself, stroked and then masked by soft blobs, so it
 * can never drift off the contour. A dim cool bounce runs the underside.
 *
 * HORNS. Two separate tapered spines from a shared origin at the poll: the far
 * one sweeps up and back and is drawn behind the skull, thinner and dimmer;
 * the near one sweeps up, out and slightly forward and is drawn after the
 * skull, heavier and carrying its own catchlight. Drawing them on opposite
 * sides of the head in paint order is what stops the pair fusing into a blade.
 *
 * COLOUR is hard-coded near-black bronze. currentColor is used for exactly one
 * thing, the eye: a saturated core, a radial glow, and a faint spill on the
 * bronze around the socket. The page sets jade for a bull week and vermilion
 * for a bear week, so the eye is the only colour in the animal.
 *
 * RIG. viewBox 0 0 260 180, facing right, feet on y=170, a .bob wrapper and
 * four .leg groups in the mandated order, each with its pivot --o on the real
 * hip or shoulder. Each leg also carries a nested .knee group whose --ko sits
 * on the hock (bull hind), the carpus (bull fore) or the ankle/wrist (bear).
 * Because the page's knee keyframes are close to the negative of the hip's at
 * both extremes, the foot stays flat through the reach and rolls onto the toe
 * at full extension behind. Near-side limbs use a gradient that matches the
 * body exactly where the joints are buried and lifts only below the belly, so
 * the joints are invisible and the free part of the limb still reads in front.
 */
(function (global) {
  'use strict';

  /* --------------------------------------------------------------- palette */
  var MASS_HI   = '#0E131A';   // top of the mass - cool, near-black
  var MASS_MID  = '#090B12';   // its value at the height of the leg joints
  var MASS_LO   = '#05070B';   // bottom of the mass
  var MASS_JOIN = '#080A11';   // the body's own value at the belly line, y=120
  var LIMB_LO   = '#0A0D14';   // near limbs, below the belly only
  var FAR       = '#020407';   // far-side limbs, darker again
  var RIM_CORE  = '#FFE6BC';   // hard specular where the form turns sharply
  var RIM_WARM  = '#D9A055';   // the general rim
  var RIM_BLOOM = '#8E5C18';   // bloom spilling into the sky
  var BOUNCE    = '#4E6E8C';   // cool ground/sky bounce on the undersides

  function n(v) { return Math.round(v * 100) / 100; }

  /* Emit a path from a flat [cmd, x, y, ...] array with dx added to every x. */
  function pth(a, dx) {
    var out = '', i = 0, c, k, j;
    dx = dx || 0;
    while (i < a.length) {
      c = a[i++]; out += c;
      k = c === 'C' ? 6 : c === 'Q' ? 4 : c === 'Z' ? 0 : 2;
      for (j = 0; j < k; j += 2) { out += ' ' + n(a[i] + dx) + ' ' + n(a[i + 1]); i += 2; }
    }
    return out;
  }

  function circ(cx, cy, r, dx) {
    return '<circle cx="' + n(cx + (dx || 0)) + '" cy="' + cy + '" r="' + r + '"/>';
  }

  /* Catmull-Rom through points, as cubics. */
  function cr(pts, cont) {
    var d = (cont ? 'L' : 'M') + n(pts[0][0]) + ' ' + n(pts[0][1]), i, p0, p1, p2, p3;
    for (i = 0; i < pts.length - 1; i++) {
      p0 = pts[i - 1] || pts[i]; p1 = pts[i]; p2 = pts[i + 1];
      p3 = pts[i + 2] || pts[i + 1];
      d += 'C' + n(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + n(p1[1] + (p2[1] - p0[1]) / 6) +
           ' ' + n(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + n(p2[1] - (p3[1] - p1[1]) / 6) +
           ' ' + n(p2[0]) + ' ' + n(p2[1]);
    }
    return d;
  }

  /* A solid tapered form swept along a spine: base radius r0 falling to a
     point at the tip. Returns the closed outline plus each flank, so the lit
     side can be stroked on its own. */
  function taper(spine, r0) {
    var A = [], B = [], i, t, dx, dy, m, r, N = spine.length;
    for (i = 0; i < N; i++) {
      t = i / (N - 1);
      if (i === 0) { dx = spine[1][0] - spine[0][0]; dy = spine[1][1] - spine[0][1]; }
      else if (i === N - 1) { dx = spine[i][0] - spine[i - 1][0]; dy = spine[i][1] - spine[i - 1][1]; }
      else { dx = spine[i + 1][0] - spine[i - 1][0]; dy = spine[i + 1][1] - spine[i - 1][1]; }
      m = Math.sqrt(dx * dx + dy * dy) || 1;
      r = r0 * Math.pow(1 - t, 0.8);
      A.push([spine[i][0] - dy / m * r, spine[i][1] + dx / m * r]);
      B.push([spine[i][0] + dy / m * r, spine[i][1] - dx / m * r]);
    }
    var rev = B.slice().reverse();
    return { d: cr(A) + cr(rev, true) + 'Z', back: cr(rev) };
  }

  function blob(cx, cy, rx, ry, rot, op) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"' +
      (rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '') +
      ' fill="#fff" opacity="' + op + '"/>';
  }

  function mask(id, blur, blobs) {
    return '<filter id="' + id + 'f" x="-80%" y="-80%" width="260%" height="260%">' +
             '<feGaussianBlur stdDeviation="' + blur + '"/></filter>' +
           '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="-30" y="-30" ' +
             'width="320" height="240">' +
             '<rect x="-30" y="-30" width="320" height="240" fill="#000"/>' +
             '<g filter="url(#' + id + 'f)">' + blobs + '</g></mask>';
  }

  /* ------------------------------------------------------------------ eye */
  function eye(p, x, y, r) {
    return '<g clip-path="url(#' + p + '-clip)">' +
             '<ellipse cx="' + x + '" cy="' + y + '" rx="' + n(r * 5.5) +
               '" ry="' + n(r * 4) + '" fill="url(#' + p + '-spill)"/></g>' +
           '<circle cx="' + x + '" cy="' + y + '" r="' + n(r * 3.1) +
             '" fill="url(#' + p + '-glow)"/>' +
           '<ellipse cx="' + x + '" cy="' + y + '" rx="' + n(r * 1.05) +
             '" ry="' + n(r * 0.8) + '" fill="currentColor"/>';
  }

  /* ===================================================================== */
  /*  BULL                                                                  */
  /* ===================================================================== */

  /* The crest of the neck rides well above the poll, as it does on a mature
     bull. The topline therefore falls steeply into a notch at the poll, the
     horns rise out of that notch, and the forehead falls away in front of it
     at a shallower angle - that difference of angle is what stops the head
     melting into the neck. Under the head the jaw rises to the jowl and the
     throat then drops away, giving the second notch that separates the two.
     The muzzle is squared off: a blunt near-vertical front face and a long
     level mouth line, which is the difference between a bull and a boar. */
  var BULL_MASS =
    'M136 57' +                        // withers
    'C142 50 146 46 152 45' +          // crest of the neck, a real bulge
    'C160 45 168 50 178 66' +          // plunging into the poll
    'C186 70 194 75 201 79' +          // dead-straight forehead and nasal bone
    'C205 80 208 81 209 85' +          // hard corner onto the nose pad
    'L209 93' +                        // flat vertical muzzle front
    'C209 96 207 97 204 97' +          // corner of the lip
    'C197 98 191 97 186 95' +          // long level mouth line and chin
    'C182 93 180 91 179 87' +          // deep jaw rising to the jowl
    'C181 94 180 102 177 108' +        // dewlap hanging: notch at the jowl,
    'C174 112 168 115 163 115' +       // then a near-vertical throat
    'C153 118 141 119 129 119' +       // belly, deepest at the girth
    'C117 118 106 117 97 113' +
    'C93 111 91 110 90 107' +          // flank crease
    'C91 112 93 117 93 122' +          // stifle
    'C89 127 81 130 73 129' +          // under the thigh
    'C65 127 58 121 55 111' +          // rear of the thigh
    'C52 102 51 91 53 81' +            // point of the buttock
    'C55 72 59 67 65 63' +             // croup and tail head
    'C73 59 80 57 88 57' +             // point of the hip
    'C100 58 110 62 122 62' +          // saddle behind the withers
    'C128 61 133 59 136 57Z';

  /* two spines from a shared origin at the poll: the far one up and back,
     the near one up, out and forward */
  var BULL_HORN_FAR  = [[176, 67], [171, 57], [168, 47], [166, 38]];
  var BULL_HORN_NEAR = [[185, 71], [190, 61], [193, 51], [195, 41]];

  /* the dock hangs from the tail head close behind the buttock and only
     clears the contour below the point of the buttock, as a real one does */
  var BULL_TAIL_DOCK =
    'M65 70C59 80 54 94 51 110C49 121 48 130 49 140L44 140' +
    'C43 129 43 120 45 111C48 93 53 80 59 69Z';
  var BULL_TAIL_SW =
    'M49 137C54 144 55 154 52 162C50 166 46 166 43 162C40 156 40 146 42 138Z';

  var BULL_HIND_HIP = [72, 96], BULL_HIND_HOCK = [66, 140];
  var BULL_HIND_UP = ['M', 86, 108, 'C', 91, 114, 93, 119, 93, 125,
    'C', 88, 130, 78, 135, 73, 138, 'C', 70, 140, 68, 141, 60, 140,
    'C', 56, 130, 55, 120, 57, 110, 'C', 65, 105, 79, 104, 86, 108, 'Z'];
  var BULL_HIND_LO = ['M', 73, 140, 'C', 74, 146, 75, 151, 76, 156,
    'C', 78, 161, 80, 165, 82, 170, 'L', 70, 170,
    'C', 69, 165, 68, 161, 67, 156, 'C', 66, 151, 63, 146, 59, 140, 'Z'];
  var BULL_HIND_OCC = [78, 128, 17, 7];

  var BULL_FORE_SH = [166, 96], BULL_FORE_KNEE = [157, 138];
  var BULL_FORE_UP = ['M', 173, 106, 'C', 172, 113, 169, 122, 165, 130,
    'C', 164, 133, 163, 136, 163, 138, 'C', 159, 139, 155, 139, 151, 138,
    'C', 149, 128, 148, 116, 149, 106, 'C', 156, 102, 167, 102, 173, 106, 'Z'];
  var BULL_FORE_LO = ['M', 163, 138, 'C', 163, 144, 163, 149, 163, 154,
    'C', 165, 159, 167, 164, 168, 170, 'L', 156, 170,
    'C', 155, 164, 154, 159, 153, 154, 'C', 152, 149, 152, 144, 151, 138, 'Z'];
  var BULL_FORE_OCC = [161, 116, 13, 6];

  var BULL_HIND_RIM = [['M', 57, 111, 'C', 55, 120, 56, 131, 59, 139],
                       ['M', 60, 141, 'C', 62, 148, 66, 156, 68, 163]];
  var BULL_FORE_RIM = [['M', 149, 108, 'C', 148, 118, 149, 129, 152, 137],
                       ['M', 152, 141, 'C', 152, 149, 154, 157, 155, 164]];

  /* ===================================================================== */
  /*  BEAR                                                                  */
  /* ===================================================================== */

  var BEAR_MASS =
    'M152 61' +                        // apex of the shoulder hump
    'C162 64 170 69 177 75' +          // front of the hump into the neck
    'C183 79 189 82 194 85' +
    'C192 79 195 73 200 74' +          // ear, back edge
    'C205 75 207 81 205 86' +          // ear, front edge
    'C210 88 214 90 218 93' +          // top of the skull
    'C222 95 225 97 228 100' +         // slight dish, then the straight muzzle
    'C232 102 236 104 240 106' +
    'C243 107 244 110 242 112' +       // nose pad
    'C239 114 235 114 231 114' +
    'C227 115 223 115 219 114' +       // mouth
    'C214 113 210 112 206 110' +       // jaw
    'C200 114 195 119 191 125' +       // throat into the chest
    'C188 128 185 130 180 131' +       // brisket
    'C170 133 158 134 146 133' +       // belly
    'C134 133 122 132 112 130' +
    'C106 129 102 128 99 125' +        // flank
    'C102 131 105 138 105 145' +       // front of the thigh
    'C101 150 91 153 81 150' +         // under the thigh
    'C69 146 59 137 53 125' +          // rear of the thigh
    'C48 115 45 104 46 92' +           // rump, rear
    'C47 79 50 69 58 63' +             // croup
    'C66 58 74 56 82 57' +             // top of the rump
    'C96 59 110 64 122 65' +           // dipped back
    'C134 65 144 64 152 61Z';

  var BEAR_EAR_FAR =
    'M187 87C185 81 187 76 192 77C196 78 197 83 195 88C192 89 189 89 187 87Z';

  var BEAR_TAIL =
    'M55 66C47 66 41 70 40 77C44 82 51 82 56 78C58 74 58 68 55 66Z';

  var BEAR_HIND_HIP = [80, 93], BEAR_HIND_ANK = [74, 151];
  var BEAR_HIND_UP = ['M', 104, 123, 'C', 102, 132, 97, 142, 90, 148,
    'C', 87, 150, 85, 151, 82, 151, 'C', 76, 152, 71, 152, 66, 151,
    'C', 68, 142, 71, 133, 74, 124, 'C', 84, 120, 96, 119, 104, 123, 'Z'];
  var BEAR_HIND_LO = ['M', 82, 151, 'C', 84, 157, 88, 164, 93, 168,
    'C', 93, 169, 93, 170, 91, 170, 'L', 64, 170,
    'C', 61, 168, 60, 163, 62, 158, 'C', 64, 155, 65, 153, 66, 151, 'Z'];
  var BEAR_HIND_OCC = [88, 148, 18, 7];

  var BEAR_FORE_SH = [170, 95], BEAR_FORE_WR = [169, 149];
  var BEAR_FORE_UP = ['M', 182, 107, 'C', 184, 119, 182, 132, 178, 144,
    'C', 178, 146, 178, 148, 178, 149, 'C', 172, 150, 166, 150, 160, 149,
    'C', 160, 147, 160, 146, 160, 144, 'C', 158, 131, 157, 118, 158, 110,
    'C', 164, 104, 176, 103, 182, 107, 'Z'];
  var BEAR_FORE_LO = ['M', 178, 149, 'C', 180, 155, 182, 161, 184, 165,
    'C', 186, 165, 188, 166, 189, 169, 'C', 187, 170, 186, 170, 184, 170,
    'L', 160, 170, 'C', 157, 165, 157, 156, 160, 149, 'Z'];
  var BEAR_FORE_OCC = [170, 131, 15, 7];

  var BEAR_HIND_RIM = [['M', 74, 126, 'C', 70, 135, 67, 144, 66, 150],
                       ['M', 66, 152, 'C', 62, 157, 61, 164, 63, 169]];
  var BEAR_FORE_RIM = [['M', 158, 112, 'C', 157, 125, 159, 138, 160, 147],
                       ['M', 160, 151, 'C', 158, 158, 158, 164, 160, 169]];

  /* ===================================================================== */
  /*  assembly                                                              */
  /* ===================================================================== */

  function legGroup(o) {
    var dx = o.dx, cls = o.cls, p = o.p;
    var fill = o.far ? FAR : 'url(#' + p + '-gl)';
    var g = cls ? '<g class="' + cls + '" style="--o:' + n(o.hip[0] + dx) + 'px ' +
                  o.hip[1] + 'px">' : '<g>';
    g += '<g fill="' + fill + '"><path d="' + pth(o.up, dx) + '"/>' +
         circ(o.hip[0], o.hip[1], o.r[0], dx) + '</g>';
    g += (cls ? '<g class="knee" style="--ko:' + n(o.ko[0] + dx) + 'px ' + o.ko[1] + 'px">'
              : '<g>');
    g += '<g fill="' + fill + '">' + circ(o.ko[0], o.ko[1], o.r[1], dx) +
         '<path d="' + pth(o.lo, dx) + '"/></g>';
    g += '<path fill="none" stroke="' + RIM_WARM + '" stroke-width="0.9" ' +
         'stroke-linecap="round" opacity="' + o.rimOp + '" d="' + pth(o.rim[1], dx) + '"/>';
    g += '</g>';
    g += '<path fill="none" stroke="' + RIM_WARM + '" stroke-width="1" ' +
         'stroke-linecap="round" opacity="' + o.rimOp + '" d="' + pth(o.rim[0], dx) + '"/>';
    if (!o.far) {
      g += '<ellipse cx="' + o.occ[0] + '" cy="' + o.occ[1] + '" rx="' + o.occ[2] +
           '" ry="' + o.occ[3] + '" fill="url(#' + p + '-occ)"/>';
    }
    return g + '</g>';
  }

  function defs(p, kind) {
    var bull = kind === 'bull';
    var s = '<defs>' +
      '<linearGradient id="' + p + '-g" gradientUnits="userSpaceOnUse" ' +
        'x1="0" y1="30" x2="0" y2="175">' +
        '<stop offset="0" stop-color="' + MASS_HI + '"/>' +
        '<stop offset=".55" stop-color="' + MASS_MID + '"/>' +
        '<stop offset="1" stop-color="' + MASS_LO + '"/></linearGradient>' +
      /* limbs: value-matched to the body everywhere the joints are buried
         (down to the belly line, y=120) so no seam can appear where a near
         limb crosses the mass, then lifting below it so the free part of the
         limb still reads as being in front */
      '<linearGradient id="' + p + '-gl" gradientUnits="userSpaceOnUse" ' +
        'x1="0" y1="30" x2="0" y2="175">' +
        '<stop offset="0" stop-color="' + MASS_HI + '"/>' +
        '<stop offset=".55" stop-color="' + MASS_MID + '"/>' +
        '<stop offset=".62" stop-color="' + MASS_JOIN + '"/>' +
        '<stop offset="1" stop-color="' + LIMB_LO + '"/></linearGradient>' +
      '<linearGradient id="' + p + '-ear" x1="0" y1="0" x2=".6" y2="1">' +
        '<stop offset="0" stop-color="#161C25" stop-opacity=".55"/>' +
        '<stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>' +
      '<radialGradient id="' + p + '-occ">' +
        '<stop offset="0" stop-color="#000" stop-opacity=".2"/>' +
        '<stop offset=".5" stop-color="#000" stop-opacity=".11"/>' +
        '<stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + '-glow">' +
        '<stop offset="0" stop-color="currentColor" stop-opacity=".9"/>' +
        '<stop offset=".3" stop-color="currentColor" stop-opacity=".4"/>' +
        '<stop offset="1" stop-color="currentColor" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<radialGradient id="' + p + '-spill">' +
        '<stop offset="0" stop-color="currentColor" stop-opacity=".22"/>' +
        '<stop offset="1" stop-color="currentColor" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<path id="' + p + '-body" d="' + (bull ? BULL_MASS : BEAR_MASS) + '"/>' +
      '<clipPath id="' + p + '-clip"><use href="#' + p + '-body"/></clipPath>' +
      '<filter id="' + p + '-bloom" x="-40%" y="-40%" width="180%" height="180%">' +
        '<feGaussianBlur stdDeviation="2.2"/></filter>';

    if (bull) {
      s += mask(p + '-rim', 1.7,
        blob(52, 103, 4, 6, 14, .3) +
        blob(52, 87, 5, 9, 8, 1) +
        blob(59, 68, 6, 5, -42, .75) +
        blob(72, 60, 6, 4, -20, .4) +
        blob(89, 57, 8, 4, -2, .95) +
        blob(106, 59, 7, 4, 8, .22) +
        blob(124, 62, 5, 4, 2, .3) +
        blob(134, 58, 6, 4, -26, 1) +
        blob(143, 49, 6, 4, -46, .6) +
        blob(154, 45, 8, 4, 0, 1) +
        blob(166, 49, 5, 4, 34, .45) +
        blob(174, 59, 4, 4, 66, .3));
      s += mask(p + '-hot', 1.2,
        blob(52, 87, 3, 6, 8, 1) +
        blob(89, 57, 5, 2.6, -2, .85) +
        blob(134, 58, 4, 2.6, -26, 1) +
        blob(154, 45, 4, 2.6, 0, .9));
      s += mask(p + '-bnc', 3.4,
        blob(77, 129, 9, 5, 10, .8) +
        blob(104, 113, 11, 5, 8, .45) +
        blob(133, 119, 14, 5, -1, .6) +
        blob(166, 114, 9, 5, -22, .7) +
        blob(179, 102, 5, 6, -76, .6) +
        blob(193, 97, 9, 4, -6, .8));
    } else {
      s += mask(p + '-rim', 1.7,
        blob(51, 120, 4, 7, -34, .28) +
        blob(46, 100, 4, 7, 6, .5) +
        blob(46, 89, 5, 9, 4, 1) +
        blob(52, 69, 6, 5, -46, .7) +
        blob(66, 59, 7, 4, -14, .9) +
        blob(84, 57, 8, 4, 6, 1) +
        blob(104, 62, 7, 4, 16, .25) +
        blob(124, 65, 6, 4, 2, .35) +
        blob(140, 64, 6, 4, -8, .5) +
        blob(153, 61, 6, 4, -12, 1) +
        blob(168, 68, 6, 4, 34, .55) +
        blob(186, 81, 5, 4, 38, .35) +
        blob(199, 74, 5, 4, -6, 1) +
        blob(213, 90, 5, 4, 36, .35));
      s += mask(p + '-hot', 1.2,
        blob(46, 89, 3, 6, 4, 1) +
        blob(84, 57, 5, 2.6, 6, .95) +
        blob(153, 61, 4, 2.6, -12, 1) +
        blob(199, 74, 3.2, 2.6, -6, 1));
      s += mask(p + '-bnc', 3.4,
        blob(86, 151, 10, 5, 10, .8) +
        blob(116, 131, 12, 5, 6, .45) +
        blob(150, 134, 14, 5, -1, .6) +
        blob(180, 131, 8, 6, -26, .7) +
        blob(195, 121, 7, 6, -50, .5) +
        blob(213, 113, 10, 4, 12, .75));
    }
    return s + '</defs>';
  }

  function contourLight(p) {
    return '<use href="#' + p + '-body" fill="none" stroke="' + RIM_BLOOM +
             '" stroke-width="4.5" opacity=".45" mask="url(#' + p + '-rim)" ' +
             'filter="url(#' + p + '-bloom)"/>' +
           '<use href="#' + p + '-body" fill="none" stroke="' + RIM_WARM +
             '" stroke-width="1.4" mask="url(#' + p + '-rim)"/>' +
           '<use href="#' + p + '-body" fill="none" stroke="' + RIM_CORE +
             '" stroke-width="0.7" mask="url(#' + p + '-hot)"/>' +
           '<use href="#' + p + '-body" fill="none" stroke="' + BOUNCE +
             '" stroke-width="1.9" opacity=".5" mask="url(#' + p + '-bnc)"/>';
  }

  function bullParts(p, rig) {
    var hf = taper(BULL_HORN_FAR, 5.1), hn = taper(BULL_HORN_NEAR, 6.2);
    var s = defs(p, 'bull');

    s += legGroup({ p: p, cls: rig ? 'leg p3' : '', hip: BULL_HIND_HIP,
      ko: BULL_HIND_HOCK, up: BULL_HIND_UP, lo: BULL_HIND_LO, dx: -12,
      r: [15, 8], far: true, rim: BULL_HIND_RIM, rimOp: .16, occ: BULL_HIND_OCC });
    s += legGroup({ p: p, cls: rig ? 'leg p4' : '', hip: BULL_FORE_SH,
      ko: BULL_FORE_KNEE, up: BULL_FORE_UP, lo: BULL_FORE_LO, dx: -13,
      r: [13, 7.5], far: true, rim: BULL_FORE_RIM, rimOp: .16, occ: BULL_FORE_OCC });

    s += (rig ? '<g class="tail" style="--o:63px 68px">' : '<g>') +
         '<path fill="' + FAR + '" d="' + BULL_TAIL_DOCK + '"/>' +
         '<path fill="' + FAR + '" d="' + BULL_TAIL_SW + '"/>' +
         '<path fill="none" stroke="' + RIM_WARM + '" stroke-width="0.9" opacity=".2" ' +
           'stroke-linecap="round" d="M45 110C43 121 43 131 44 139"/></g>';

    /* far horn: behind the skull, thinner and dimmer */
    s += '<path fill="' + FAR + '" d="' + hf.d + '"/>' +
         '<path fill="none" stroke="' + RIM_WARM + '" stroke-width="0.8" opacity=".2" ' +
           'stroke-linecap="round" d="' + hf.back + '"/>';

    s += '<use href="#' + p + '-body" fill="url(#' + p + '-g)"/>';
    s += contourLight(p);

    /* near horn: after the skull, heavier, with its own catchlight */
    s += '<path fill="url(#' + p + '-g)" d="' + hn.d + '"/>' +
         '<path fill="none" stroke="' + RIM_WARM + '" stroke-width="1.1" opacity=".5" ' +
           'stroke-linecap="round" d="' + hn.back + '"/>' +
         '<path fill="none" stroke="' + RIM_CORE + '" stroke-width="0.7" opacity=".62" ' +
           'stroke-linecap="round" d="M190 52C192 48 194 44 195 41"/>';

    /* The ear is set below the horn and lies against the crest, so on a bull
       it never breaks the contour. It is drawn as a barely-there plane with a
       catchlight along its upper edge - enough to place it, not enough to
       break the flat interior. */
    s += '<path fill="url(#' + p + '-ear)" d="M180 71C174 72 169 76 167 82' +
         'C171 84 176 82 179 78C181 75 182 71 180 71Z"/>' +
         '<path fill="none" stroke="' + RIM_WARM + '" stroke-width="0.8" opacity=".22" ' +
         'stroke-linecap="round" d="M179 72C175 73 171 76 168 80"/>';

    s += eye(p, 189, 79, 2);

    s += legGroup({ p: p, cls: rig ? 'leg' : '', hip: BULL_HIND_HIP,
      ko: BULL_HIND_HOCK, up: BULL_HIND_UP, lo: BULL_HIND_LO, dx: 0,
      r: [15, 8], far: false, rim: BULL_HIND_RIM, rimOp: .3, occ: BULL_HIND_OCC });
    s += legGroup({ p: p, cls: rig ? 'leg p2' : '', hip: BULL_FORE_SH,
      ko: BULL_FORE_KNEE, up: BULL_FORE_UP, lo: BULL_FORE_LO, dx: 0,
      r: [13, 7.5], far: false, rim: BULL_FORE_RIM, rimOp: .3, occ: BULL_FORE_OCC });
    return s;
  }

  function bearParts(p, rig) {
    var s = defs(p, 'bear');
    s += legGroup({ p: p, cls: rig ? 'leg p3' : '', hip: BEAR_HIND_HIP,
      ko: BEAR_HIND_ANK, up: BEAR_HIND_UP, lo: BEAR_HIND_LO, dx: -11,
      r: [18, 10], far: true, rim: BEAR_HIND_RIM, rimOp: .14, occ: BEAR_HIND_OCC });
    s += legGroup({ p: p, cls: rig ? 'leg p4' : '', hip: BEAR_FORE_SH,
      ko: BEAR_FORE_WR, up: BEAR_FORE_UP, lo: BEAR_FORE_LO, dx: -13,
      r: [16, 11], far: true, rim: BEAR_FORE_RIM, rimOp: .14, occ: BEAR_FORE_OCC });

    s += (rig ? '<g class="tail" style="--o:55px 71px">' : '<g>') +
         '<path fill="' + FAR + '" d="' + BEAR_TAIL + '"/></g>';

    s += '<path fill="' + FAR + '" d="' + BEAR_EAR_FAR + '"/>';
    s += '<use href="#' + p + '-body" fill="url(#' + p + '-g)"/>';
    s += contourLight(p);
    s += eye(p, 217, 98, 1.5);

    s += legGroup({ p: p, cls: rig ? 'leg' : '', hip: BEAR_HIND_HIP,
      ko: BEAR_HIND_ANK, up: BEAR_HIND_UP, lo: BEAR_HIND_LO, dx: 0,
      r: [18, 10], far: false, rim: BEAR_HIND_RIM, rimOp: .26, occ: BEAR_HIND_OCC });
    s += legGroup({ p: p, cls: rig ? 'leg p2' : '', hip: BEAR_FORE_SH,
      ko: BEAR_FORE_WR, up: BEAR_FORE_UP, lo: BEAR_FORE_LO, dx: 0,
      r: [16, 11], far: false, rim: BEAR_FORE_RIM, rimOp: .26, occ: BEAR_FORE_OCC });
    return s;
  }

  /* ------------------------------------------------------------------ API */

  global.beastSVG = function beastSVG(kind) {
    var bear = kind === 'bear';
    return '<svg viewBox="0 0 260 180" xmlns="http://www.w3.org/2000/svg" ' +
      'aria-hidden="true"><g class="bob">' +
      (bear ? bearParts('bear', true) : bullParts('bull', true)) +
      '</g></svg>';
  };

  global.pickSVG = function pickSVG(kind) {
    var bear = kind === 'bear';
    var inner = bear
      ? '<g transform="translate(-19 -6.8) scale(0.84)">' + bearParts('bearp', false) + '</g>'
      : '<g transform="translate(-8 -10.2) scale(0.86)">' + bullParts('bullp', false) + '</g>';
    return '<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" ' +
      'aria-hidden="true">' + inner + '</svg>';
  };

})(typeof window !== 'undefined' ? window : this);
