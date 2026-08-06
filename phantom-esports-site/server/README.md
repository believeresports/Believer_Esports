# Payment server

This is the piece GitHub Pages can't host, because GitHub Pages only serves
static files and this needs to run Node.js and hold a secret key.

It does exactly two things:

1. **`POST /create-order`** — creates a Razorpay order for a locked
   registration and returns its `orderId`.
2. **`POST /verify-payment`** — takes the response Razorpay Checkout gives
   the browser after payment and recomputes the HMAC-SHA256 signature
   server-side, using your `RAZORPAY_KEY_SECRET`. This is the step that
   actually proves a payment happened — never trust the browser alone.

## Run it locally

```bash
cd server
npm install
cp .env.example .env
# edit .env with your Razorpay test keys
npm start
```

The server starts on `http://localhost:4000`. Point `apiBaseUrl` in
`assets/js/config.js` at that URL while testing locally.

## Deploy it (pick one — all have free tiers)

**Render**
1. Push this repo to GitHub.
2. New → Web Service → connect the repo → set root directory to `server`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add environment variables from `.env.example` in the dashboard.

**Railway**
1. New Project → Deploy from GitHub repo → set root directory to `server`.
2. Add the same environment variables.
3. Railway assigns a public URL automatically.

**Vercel (serverless functions)**
Vercel doesn't run a long-lived Express server out of the box — if you'd
rather use Vercel, convert `/create-order` and `/verify-payment` into two
files under `api/` (`api/create-order.js`, `api/verify-payment.js`) using
the same logic from `server.js`. Render/Railway are the simpler path if
you'd rather not restructure.

## After deploying

1. Copy the live URL (e.g. `https://phantom-payments.onrender.com`).
2. Paste it into `apiBaseUrl` in `assets/js/config.js` at the repo root.
3. Put your **live** Razorpay key id in `razorpayKeyId` in the same file,
   and your live key id/secret in the server's environment variables,
   once you're out of test mode.
4. In the Razorpay dashboard, add your GitHub Pages URL to
   `ALLOWED_ORIGIN` on the server so CORS allows it.

## Security notes

- `RAZORPAY_KEY_SECRET` must only ever live in this server's environment
  variables — never in any file under the site root, never in a commit.
- The in-memory `registrations` Map in `server.js` is a placeholder.
  Anything you actually need to keep (who paid, for which slot) belongs
  in a real database — see the "Where to extend this" comment in
  `server.js`.
