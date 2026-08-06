(function () {
  const data = Store.requireStep("confirm", "register.html");
  if (!data) return;

  const cfg = window.SITE_CONFIG;

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  }

  document.getElementById("t-mode").textContent = data.modeLabel;
  document.getElementById("t-team").textContent = data.teamName;
  document.getElementById("t-captain").textContent = data.captainName;
  document.getElementById("t-email").textContent = data.captainEmail;
  document.getElementById("t-phone").textContent = data.captainPhone;
  document.getElementById("t-slot").textContent = data.slotLabel;
  document.getElementById("t-date").textContent = formatDate(data.date);
  document.getElementById("t-fee").textContent = `₹${data.fee}`;

  const rosterList = document.getElementById("t-roster");
  data.roster.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${p.ign} <span>· UID ${p.uid}</span>`;
    rosterList.appendChild(li);
  });

  // If this registration was already locked in an earlier visit, reflect that.
  if (data.locked) {
    document.getElementById("ticket-stamp").textContent = "LOCKED";
    document.getElementById("t-regid").textContent = data.registrationId;
    document.getElementById("confirm-checkbox").checked = true;
    document.getElementById("confirm-checkbox").disabled = true;
    const btn = document.getElementById("confirm-btn");
    btn.disabled = false;
    btn.textContent = "Continue to Payment →";
  }

  const checkbox = document.getElementById("confirm-checkbox");
  const btn = document.getElementById("confirm-btn");

  checkbox.addEventListener("change", () => {
    btn.disabled = !checkbox.checked;
  });

  function generateRegistrationId() {
    const prefix = (cfg.orgName || "PE").split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();
    const time = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${prefix}-${time}-${rand}`;
  }

  btn.addEventListener("click", () => {
    if (checkbox.disabled) {
      // already locked previously — just move on
      window.location.href = "payment.html";
      return;
    }
    if (!checkbox.checked) return;

    const registrationId = generateRegistrationId();
    Store.set({ locked: true, registrationId, lockedAt: new Date().toISOString() });

    document.getElementById("ticket-stamp").textContent = "LOCKED";
    document.getElementById("t-regid").textContent = registrationId;

    window.location.href = "payment.html";
  });
})();
