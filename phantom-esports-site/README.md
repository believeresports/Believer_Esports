# PHANTOM ESPORTS — tournament registration site

A tournament registration site: Solo / Duo / Squad formats, a 1:00 PM /
7:00 PM daily match slot, a locked-on-confirm review screen, and Razorpay
payment with server-side signature verification.

```
index.html          Landing page
register.html        Format → slot/date → team & roster → contact
confirm.html         Read-only review, lock warning, Confirm & Continue
payment.html         Razorpay checkout
success.html         Confirmed ticket / receipt

assets/css/style.css   Design tokens & shared components
assets/css/pages.css   Per-page layout

assets/js/config.js     ← Edit this first (org name, pricing, keys, backend URL)
assets/js/store.js      Passes registration data between pages (sessionStorage)
assets/js/main.js       Branding injection, shared across all pages
assets/js/register.js   Registration form logic
assets/js/confirm.js    Review/lock logic
assets/js/payment.js    Razorpay checkout + verification calls
assets/js/success.js    Receipt rendering

server/                 Payment backend — deploy separately (see below)
```

## Why there's a `server/` folder

GitHub Pages only serves static files — it cannot run the code that talks
to Razorpay with your secret key. So this project is two pieces:

- **The site** (everything at the repo root) → goes on GitHub Pages.
- **The payment server** (`server/`) → deploy it separately (Render,
  Railway, etc. — free tiers exist). Full instructions in
  [`server/README.md`](server/README.md).

The site will load and the whole registration flow will work right up to
the "Pay with Razorpay" button without the backend. You only need the
backend deployed for actual payments to go through.

## 1. Customize

Open **`assets/js/config.js`** — everything below is set in one place:

- `orgName`, `orgTag`, `contactEmail`, `contactWhatsApp`
- `modes` — entry fee and player count per format (Solo/Duo/Squad)
- `slots` — the two daily time slots
- `razorpayKeyId` — your **public** Razorpay key (safe in the frontend)
- `apiBaseUrl` — your deployed backend URL (see step 3)

## 2. Publish the site on GitHub Pages

1. Create a new GitHub repo and push everything in this folder to it
   (keep the folder structure — `assets/`, `server/`, and the `.html`
   files all at the repo root).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick
   `main` and `/ (root)`, then save.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`
   within a minute or two.

## 3. Deploy the payment backend

Follow [`server/README.md`](server/README.md) — it walks through running
it locally, deploying to Render or Railway, and getting your Razorpay
keys. Once it's live, paste its URL into `apiBaseUrl` in `config.js`,
commit, and push (GitHub Pages redeploys automatically).

## 4. Get Razorpay keys

1. Sign up at [razorpay.com](https://razorpay.com) and complete KYC to go
   live (test mode works immediately without KYC).
2. Dashboard → **Settings → API Keys** → generate a key pair.
3. Public `key_id` → `razorpayKeyId` in `assets/js/config.js`.
4. `key_id` **and** `key_secret` → the backend's environment variables
   (never in any frontend file).
5. Test mode cards/UPI: see Razorpay's
   [test credentials docs](https://razorpay.com/docs/payments/payments/test-card-details/)
   for numbers you can use before going live.

## How the flow works

1. **register.html** — player fills format, slot/date, team name, every
   player's IGN + UID, and captain contact. All fields are required;
   the form won't submit until everything validates.
2. **confirm.html** — read-only review of everything entered, styled as
   a match ticket. A warning banner and a required checkbox make it
   explicit that details lock permanently. Confirming generates a
   Registration ID and marks the entry locked in `sessionStorage`.
3. **payment.html** — calls the backend to create a Razorpay order,
   opens Razorpay Checkout, and on success sends the payment ID/order
   ID/signature back to the backend for verification. Only a verified
   response moves the player forward.
4. **success.html** — the same ticket, now stamped CONFIRMED, with the
   payment ID. Printable via the "Print / Save ticket" button.

Registration data lives in `sessionStorage` (not a database) since the
site itself has no backend — it's how the separate static pages share
state. It clears when the tab closes. If you want registrations saved
permanently (e.g. to review rosters later), extend `server/server.js` to
write to a real database — there's a comment marking exactly where.

## Testing before going live

- Use Razorpay **test mode** keys everywhere until you've clicked through
  the full flow at least once with a test card.
- Try the "close the checkout modal without paying" and "payment fails"
  paths — both are handled with a clear message and a re-enabled Pay
  button.
- Check the confirm.html warning and checkbox actually block the Confirm
  button until checked.
- Resize down to a phone width — the layout, ticket, and forms are all
  responsive.
