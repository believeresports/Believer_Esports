/**
 * BELIEVER ESPORTS — payment backend
 * ----------------------------------------------------------------
 * Two jobs, both of which MUST happen server-side because they need
 * RAZORPAY_KEY_SECRET, which should never be shipped to the browser:
 *
 *   1. POST /create-order    → creates a Razorpay order, returns its id
 *   2. POST /verify-payment  → recomputes the HMAC signature Razorpay
 *                               sent back and confirms it matches
 *
 * This is intentionally minimal (no database) so it's easy to read and
 * deploy. See the "Where to extend this" note near the bottom for how
 * to persist registrations, e-mail receipts, etc.
 * ----------------------------------------------------------------
 */

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { Resend } = require("resend");

require("dotenv").config();

const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  ALLOWED_ORIGIN, // e.g. https://yourname.github.io
  RESEND_API_KEY, // optional — enables email notifications. Get one free at resend.com
  NOTIFY_EMAIL, // where registration alerts get sent — must match your Resend signup email unless you've verified a domain
  NOTIFY_FROM_NAME = "Tournament Registration", // display name on the notification email
  GOOGLE_SHEET_WEBHOOK_URL, // optional — Apps Script Web App URL, see server/README.md
  PORT = 4000,
} = process.env;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error(
    "Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET. Copy .env.example to .env and fill in your Razorpay keys."
  );
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Email notifications are optional — only wired up if a Resend API key is
// present. See server/README.md → "Getting registrations onto your
// computer" for how to get one (no app password / 2FA hoops involved).
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

if (!resend) {
  console.warn("Email notifications disabled — set RESEND_API_KEY and NOTIFY_EMAIL to enable.");
}
if (!GOOGLE_SHEET_WEBHOOK_URL) {
  console.warn("Google Sheet logging disabled — set GOOGLE_SHEET_WEBHOOK_URL to enable.");
}

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ALLOWED_ORIGIN ? ALLOWED_ORIGIN.split(",").map((s) => s.trim()) : "*",
  })
);

// Simple in-memory store of registrations we've seen. Swap this for a
// real database (Postgres, MongoDB, a Google Sheet, whatever) in
// production — this resets every time the server restarts.
const registrations = new Map();

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "phantom-esports-payments" });
});

/**
 * Create a Razorpay order for a locked registration.
 * body: { amount (rupees), currency, registrationId, notes }
 */
app.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", registrationId, registration = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    if (!registrationId) {
      return res.status(400).json({ error: "Missing registrationId" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay wants paise
      currency,
      receipt: registrationId,
      // Razorpay caps notes to a handful of short fields — keep this small.
      // The full roster/contact details are stored in `registrations` below
      // and used for the email notification after verification.
      notes: {
        team: registration.teamName || "",
        mode: registration.mode || "",
        slot: registration.slot || "",
        date: registration.date || "",
      },
    });

    registrations.set(registrationId, { order, verified: false, registration });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID, // safe to expose — this is the *public* key
    });
  } catch (err) {
    console.error("create-order error:", err);
    res.status(500).json({ error: "Could not create order" });
  }
});

/**
 * Verify the signature Razorpay Checkout returns after a successful
 * payment. This is the step that actually proves the payment is real —
 * never trust a "payment succeeded" message from the browser alone.
 * body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId }
 */
app.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: "Missing payment fields" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const verified = expectedSignature === razorpay_signature;

    if (verified && registrationId && registrations.has(registrationId)) {
      const record = registrations.get(registrationId);
      record.verified = true;
      record.paymentId = razorpay_payment_id;
      record.verifiedAt = new Date().toISOString();
      registrations.set(registrationId, record);

      // ---- Where to extend this ----
      // - Save `record` to a real database
      // - Push into a Discord webhook, SMS, etc.

      // Fire-and-forget: don't make the player wait on an email/Sheet
      // round-trip before they see their confirmation screen.
      notifyRegistration(registrationId, record).catch((err) =>
        console.error("Notification error:", err)
      );
    }

    res.json({ verified });
  } catch (err) {
    console.error("verify-payment error:", err);
    res.status(500).json({ verified: false, error: "Verification failed" });
  }
});

/**
 * Sends a "new paid registration" email via Resend, if configured.
 */
async function sendEmailNotification(registrationId, record) {
  if (!resend || !NOTIFY_EMAIL) return;
  const reg = record.registration || {};

  const rosterText = (reg.roster || [])
    .map((p, i) => `  ${i + 1}. ${p.ign} — UID ${p.uid}`)
    .join("\n") || "  (none)";

  const text = [
    "New paid registration",
    "",
    `Registration ID: ${registrationId}`,
    `Payment ID: ${record.paymentId}`,
    `Format: ${reg.mode}`,
    `Match slot: ${reg.slot} on ${reg.date}`,
    `Team: ${reg.teamName}`,
    `Fee paid: ₹${reg.fee}`,
    "",
    "Roster:",
    rosterText,
    "",
    `Captain: ${reg.captainName}`,
    `Email: ${reg.captainEmail}`,
    `Phone: ${reg.captainPhone}`,
  ].join("\n");

  const { error } = await resend.emails.send({
    // Until you verify your own domain on resend.com/domains, Resend only
    // lets this default address deliver to the email you signed up with —
    // which is exactly NOTIFY_EMAIL below, so no domain setup is required.
    from: `${NOTIFY_FROM_NAME} <onboarding@resend.dev>`,
    to: [NOTIFY_EMAIL],
    subject: `New registration: ${reg.teamName || "unknown team"} (${reg.mode || ""})`,
    text,
  });

  if (error) throw new Error(typeof error === "string" ? error : JSON.stringify(error));
}

/**
 * Appends a row to a Google Sheet via an Apps Script Web App, if configured.
 * See server/README.md → "Getting registrations onto your computer" for
 * the script to paste into Apps Script and how to deploy it.
 */
async function logToGoogleSheet(registrationId, record) {
  if (!GOOGLE_SHEET_WEBHOOK_URL) return;
  const reg = record.registration || {};

  const res = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      registrationId,
      paymentId: record.paymentId,
      mode: reg.mode,
      slot: reg.slot,
      date: reg.date,
      teamName: reg.teamName,
      roster: reg.roster,
      captainName: reg.captainName,
      captainEmail: reg.captainEmail,
      captainPhone: reg.captainPhone,
      fee: reg.fee,
    }),
  });

  if (!res.ok) throw new Error(`Google Sheet webhook responded ${res.status}`);
}

async function notifyRegistration(registrationId, record) {
  const results = await Promise.allSettled([
    sendEmailNotification(registrationId, record),
    logToGoogleSheet(registrationId, record),
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`Notification ${i === 0 ? "email" : "Google Sheet"} failed:`, r.reason);
    }
  });
}

/**
 * Optional: Razorpay webhook, for extra reliability beyond the
 * checkout handler (catches cases where the browser tab closes right
 * after payment but before the handler fires). Configure the same URL
 * + a webhook secret in the Razorpay dashboard if you want this.
 */
app.post("/razorpay-webhook", express.raw({ type: "*/*" }), (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(404).end();

  const signature = req.headers["x-razorpay-signature"];
  const expected = crypto.createHmac("sha256", secret).update(req.body).digest("hex");

  if (signature !== expected) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const event = JSON.parse(req.body.toString());
  console.log("Razorpay webhook event:", event.event);
  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`Payment server running on port ${PORT}`);
});
