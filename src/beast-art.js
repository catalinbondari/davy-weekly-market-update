/* ============================================================================
 * beast-art.js — supplied artwork for the bull and the bear.
 *
 * EMPTY BY DEFAULT. While every slot below is null the deck draws its own
 * vector animals, exactly as it does today. Fill a slot and that drawing is
 * replaced by the image, with no other change to the page.
 *
 * Each value is a self-contained data URI — `data:image/png;base64,...` or
 * `data:image/webp;base64,...`. Nothing is fetched at runtime: the artifact
 * runs under a CSP that blocks every external host, so the bytes have to live
 * in the file. That is also why size matters (see below).
 *
 *   bull     the running animal, side profile, FACING RIGHT
 *   bear     the running animal, side profile, FACING RIGHT
 *            (the deck mirrors it itself when travelling backwards)
 *   faceoff  the title screen: bull on the left facing right, bear on the
 *            right facing left, squared up with a gap between them
 *
 * WHAT MAKES A GOOD SOURCE IMAGE
 *   - A transparent background (PNG or WebP with alpha). A photo on a solid
 *     background will sit on the scene as a visible rectangle.
 *   - Cropped tight, with the hooves or paws exactly on the bottom edge —
 *     the deck stands the image on its ground line, so any empty space below
 *     the feet makes the animal hover.
 *   - Roughly 1200px wide for the runners, 2400px for the faceoff. The deck
 *     never draws them larger than about 340px and 760px CSS, so double that
 *     covers a high-DPI screen with nothing to spare.
 *   - Lit from the right, warm, to sit inside the gold backdrops.
 *   - Keep each one under about 400KB encoded. The whole page has a 16MB
 *     ceiling and the rest of the deck already uses a quarter of a megabyte.
 *
 * RIGHTS. Only put an image here that you have the right to use. A watermarked
 * stock preview is not one — the watermark will render, and the licence
 * question does not go away because the pixels are inlined.
 * ========================================================================== */

var BEAST_ART = {
  bull:    null,
  bear:    null,
  faceoff: null
};
