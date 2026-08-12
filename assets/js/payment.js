(function () {
  const data = Store.requireStep("payment", "register.html");
  if (!data) return;

  const cfg = window.SITE_CONFIG;
  const statusEl = document.getElementById("pay-status");

  // Render order summary (shared by both payment modes)
  document.getElementById("p-regid").textContent = data.registrationId;
  document.getElementById("p-team").textContent = data.teamName;
  document.getElementById("p-mode").textContent = data.modeLabel;
  document.getElementById("p-slot").textContent = `${data.slotLabel} · ${data.date}`;
  document.getElementById("p-fee").textContent = `₹${data.fee}`;

  // If already paid/submitted (e.g. user navigated back), skip ahead.
  if (data.paid) {
    window.location.href = "success.html";
    return;
  }
  if (data.manualSubmitted) {
    window.location.href = "pending.html";
    return;
  }

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "pay-status show" + (type === "error" ? " error" : "");
  }

  function buildRegistrationPayload() {
    return {
      mode: data.modeLabel,
      slot: data.slotLabel,
      date: data.date,
      teamName: data.teamName,
      roster: data.roster,
      captainName: data.captainName,
      captainEmail: data.captainEmail,
      captainPhone: data.captainPhone,
      fee: data.fee,
    };
  }

  if (cfg.paymentMode === "manual") {
    initManualFlow();
  } else {
    initRazorpayFlow();
  }

  // ==========================================================
  // MANUAL UPI FLOW — stopgap while Razorpay activation is pending.
  // Collects a UTR reference number for the organizer to check by
  // hand; nothing here proves the payment happened automatically.
  // ==========================================================
  function initManualFlow() {
    document.getElementById("razorpay-flow").style.display = "none";
    document.getElementById("manual-flow").style.display = "block";

    document.getElementById("upi-id-display").textContent = cfg.upi?.id || "—";
    document.getElementById("upi-payee-display").textContent = cfg.upi?.payeeName || cfg.orgName;
    const qrImg = document.getElementById("upi-qr");
    if (cfg.upi?.qrImage) {
      qrImg.src = cfg.upi.qrImage;
    } else {
      qrImg.style.display = "none";
    }

    const utrInput = document.getElementById("utr-input");
    const utrError = document.getElementById("err-utr");
    const submitBtn = document.getElementById("manual-submit-btn");

    submitBtn.addEventListener("click", async () => {
      const utr = utrInput.value.trim();
      utrInput.closest(".field")?.classList.remove("has-error");
      utrError.style.display = "none";

      if (!utr) {
        utrInput.closest(".field")?.classList.add("has-error");
        utrError.style.display = "block";
        utrInput.focus();
        return;
      }

      submitBtn.disabled = true;
      setStatus("Submitting for verification…");

      if (!cfg.apiBaseUrl || cfg.apiBaseUrl.includes("YOUR-BACKEND-URL")) {
        setStatus("Backend not configured yet — set apiBaseUrl in config.js. (Message for the site owner.)", "error");
        submitBtn.disabled = false;
        return;
      }

      try {
        const res = await fetch(`${cfg.apiBaseUrl}/manual-payment-claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registrationId: data.registrationId,
            registration: buildRegistrationPayload(),
            utr,
          }),
        });
        if (!res.ok) throw new Error(`manual-payment-claim failed (${res.status})`);

        Store.set({
          manualSubmitted: true,
          utr,
          submittedAt: new Date().toISOString(),
        });
        window.location.href = "pending.html";
      } catch (err) {
        console.error(err);
        setStatus("Couldn't submit right now. Please try again in a moment, or contact support with your Registration ID.", "error");
        submitBtn.disabled = false;
      }
    });
  }

  // ==========================================================
  // RAZORPAY FLOW — automated checkout + server-side verification.
  // ==========================================================
  function initRazorpayFlow() {
    const payBtn = document.getElementById("pay-btn");

    if (!cfg.apiBaseUrl || cfg.apiBaseUrl.includes("YOUR-BACKEND-URL")) {
      document.getElementById("setup-notice").style.display = "flex";
    } else {
      // Render's free tier sleeps the server after inactivity, and the
      // first request after that can take 30-50s. Ping it the moment this
      // page loads (while the player is still reading the order summary)
      // so it's usually already awake by the time they hit Pay. Ignored on
      // failure — createOrder() below will surface any real problem.
      fetch(`${cfg.apiBaseUrl}/`).catch(() => {});
    }

    async function createOrder() {
      const res = await fetch(`${cfg.apiBaseUrl}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: data.fee, // rupees — server converts to paise
          currency: cfg.currency,
          registrationId: data.registrationId,
          // Full registration, stored server-side so the email/Sheet
          // notifications sent after verification have something to report.
          registration: buildRegistrationPayload(),
        }),
      });
      if (!res.ok) throw new Error(`create-order failed (${res.status})`);
      return res.json(); // { orderId, amount, currency, keyId }
    }

    async function verifyPayment(payload) {
      const res = await fetch(`${cfg.apiBaseUrl}/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`verify-payment failed (${res.status})`);
      return res.json(); // { verified: true/false }
    }

    payBtn.addEventListener("click", async () => {
      payBtn.disabled = true;
      setStatus("Creating a secure order…");

      // If this stretches past a few seconds, it's almost always the free
      // backend waking up (not Razorpay) — say so instead of going silent.
      const slowHint = setTimeout(() => {
        setStatus("Still working — the payment server may be waking up from idle. This can take up to a minute, no need to click again.");
      }, 4000);

      let order;
      try {
        order = await createOrder();
      } catch (err) {
        console.error(err);
        setStatus("Couldn't reach the payment server. Please try again in a moment, or contact support with your Registration ID.", "error");
        payBtn.disabled = false;
        return;
      } finally {
        clearTimeout(slowHint);
      }

      setStatus("Opening Razorpay checkout…");

      const rzp = new Razorpay({
        key: order.keyId || cfg.razorpayKeyId,
        amount: order.amount,
        currency: order.currency || cfg.currency,
        order_id: order.orderId,
        name: cfg.orgName,
        description: `${data.modeLabel} entry — ${data.teamName}`,
        prefill: {
          name: data.captainName,
          email: data.captainEmail,
          contact: data.captainPhone,
        },
        notes: { registrationId: data.registrationId },
        theme: { color: "#00e6c3" },
        handler: async function (response) {
          setStatus("Verifying payment…");
          const slowVerifyHint = setTimeout(() => {
            setStatus("Still verifying — this can take a little longer if our server just woke up. Please don't close this tab.");
          }, 4000);
          try {
            const result = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              registrationId: data.registrationId,
            });

            if (result.verified) {
              Store.set({
                paid: true,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                paidAt: new Date().toISOString(),
              });
              window.location.href = "success.html";
            } else {
              setStatus("We couldn't verify this payment. If money was deducted, contact support with your Registration ID — do not pay again.", "error");
              payBtn.disabled = false;
            }
          } catch (err) {
            console.error(err);
            setStatus("Payment went through, but verification failed to reach our server. Contact support with your Registration ID before retrying.", "error");
            payBtn.disabled = false;
          } finally {
            clearTimeout(slowVerifyHint);
          }
        },
        modal: {
          ondismiss: function () {
            setStatus("Payment window closed. No charge was made — tap the button to try again.");
            payBtn.disabled = false;
          },
        },
      });

      rzp.on("payment.failed", function (response) {
        console.error(response.error);
        setStatus(`Payment failed: ${response.error.description || "please try again."}`, "error");
        payBtn.disabled = false;
      });

      rzp.open();
    });
  }
})();
