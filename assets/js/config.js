/**
 * ============================================================
 *  SITE CONFIG — edit this file to make the site yours.
 *  Every other file reads from here. Nothing else needs touching
 *  to rebrand, reprice, or repoint the backend.
 * ============================================================
 */
window.SITE_CONFIG = {
  // ---- Identity ----------------------------------------------------
  orgName: "BELIEVER ESPORTS",
  orgTag: "REGISTER · LOCK IN · DROP IN",
  contactEmail: "believer.esports.ff@gmail.com",
  contactWhatsApp: "919322791341", // country code + number, no + or spaces

  // ---- Backend ------------------------------------------------------
  // GitHub Pages only serves static files — it cannot run the payment
  // server. Deploy the /server folder (Render, Railway, Vercel, etc.)
  // and paste its base URL here. See README.md → "Deploying the backend".
  apiBaseUrl: "https://believer-esports.onrender.com",

  // ---- Razorpay -------------------------------------------------------
  // Public key ONLY. Never put your key_secret in any front-end file.
  razorpayKeyId: "rzp_test_TMMNJktbRrDzpG",

  // ---- Tournament formats & pricing (INR) ---------------------------
  modes: {
    solo: { label: "Solo", players: 1, fee: 99, tagline: "One name on the kill feed." },
    duo: { label: "Duo", players: 2, fee: 179, tagline: "Two players, one revive." },
    squad: { label: "Squad", players: 4, fee: 299, tagline: "Four players, one banner." },
  },

  // ---- Match slots ----------------------------------------------------
  slots: [
    { id: "1300", label: "1:00 PM", sub: "Afternoon bracket" },
    { id: "1900", label: "7:00 PM", sub: "Prime-time bracket" },
  ],

  currency: "INR",
};
