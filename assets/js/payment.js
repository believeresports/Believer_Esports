(function () {
  const data = Store.requireStep("payment", "register.html");
  if (!data) return;

  const cfg = window.SITE_CONFIG;
  const payBtn = document.getElementById("pay-btn");
  const statusEl = document.getElementById("pay-status");

  // Render order summary
  document.getElementById("p-regid").textContent = data.registrationId;
  document.getElementById("p-team").textContent = data.teamName;
  document.getElementById("p-mode").textContent = data.modeLabel;
  document.getElementById("p-slot").textContent = `${data.slotLabel} · ${data.date}`;
  document.getElementById("p-fee").textContent = `₹${data.fee}`;

  // If already paid (e.g. user navigated back), skip straight to success.
  if (data.paid) {
    window.location.href = "success.html";
    return;
  }

  if (!cfg.apiBaseUrl || cfg.apiBaseUrl.includes("YOUR-BACKEND-URL")) {
    document.getElementById("setup-notice").style.display = "flex";
  }

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "pay-status show" + (type === "error" ? " error" : "");
  }

  async function createOrder() {
    const res = await fetch(`${cfg.apiBaseUrl}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: data.fee, // rupees — server converts to paise
        currency: cfg.currency,
        registrationId: data.registrationId,
        notes: {
          team: data.teamName,
          mode: data.modeLabel,
          slot: data.slotLabel,
          date: data.date,
        },
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

    let order;
    try {
      order = await createOrder();
    } catch (err) {
      console.error(err);
      setStatus("Couldn't reach the payment server. Please try again in a moment, or contact support with your Registration ID.", "error");
      payBtn.disabled = false;
      return;
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
})();
