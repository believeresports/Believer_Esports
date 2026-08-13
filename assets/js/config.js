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
  razorpayKeyId: "rzp_test_XXXXXXXXXXXX",

  // ---- Payment mode -----------------------------------------------
  // "razorpay" — normal automated checkout + verification. Requires
  //   your Razorpay account to be activated (KYC approved) to accept
  //   real money.
  // "manual" — shows a UPI QR code / ID instead and collects a UTR
  //   (transaction reference number) for you to verify by hand. Use
  //   this only as a stopgap while waiting on Razorpay approval, then
  //   switch back to "razorpay" — nothing else needs to change.
  paymentMode: "manual",

  // ---- Manual UPI details (only used when paymentMode is "manual") --
  upi: {
    id: "9322791341@kotakbank",
    payeeName: "Believer Esports",
    qrImage: "assets/img/upi-qr.png", // upload your UPI app's "Receive money" QR here
  },

  // ---- Tournament formats & pricing (INR) ---------------------------
  modes: {
    solo: { label: "Solo", players: 1, fee: 50, tagline: "One name on the kill feed." },
    duo: { label: "Duo", players: 2, fee: 50, tagline: "Two players, one revive." },
    squad: { label: "Squad", players: 4, fee: 50, tagline: "Four players, one banner." },
  },

  // ---- Match slots ----------------------------------------------------
  slots: [
    { id: "1300", label: "1:00 PM", sub: "Afternoon bracket" },
    { id: "1900", label: "7:00 PM", sub: "Prime-time bracket" },
  ],

  // ---- Available match dates -------------------------------------------
  // Players pick from this exact list instead of a free calendar — add
  // or remove dates here as you open/close them for registration.
  // Format: "YYYY-MM-DD". Order doesn't matter, they're sorted automatically.
  availableDates: [
    "2026-08-15",
    "2026-08-23",
    "2026-08-30",
  ],

  currency: "INR",
};
