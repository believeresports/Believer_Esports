(function () {
  const data = Store.requireStep("success", "register.html");
  if (!data) return;

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  }

  document.getElementById("t-mode").textContent = data.modeLabel;
  document.getElementById("t-team").textContent = data.teamName;
  document.getElementById("t-captain").textContent = data.captainName;
  document.getElementById("t-payid").textContent = data.paymentId;
  document.getElementById("t-slot").textContent = data.slotLabel;
  document.getElementById("t-date").textContent = formatDate(data.date);
  document.getElementById("t-fee").textContent = `₹${data.fee}`;
  document.getElementById("t-regid").textContent = data.registrationId;
  document.getElementById("t-email").textContent = data.captainEmail;

  const rosterList = document.getElementById("t-roster");
  data.roster.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `${p.ign} <span>· UID ${p.uid}</span>`;
    rosterList.appendChild(li);
  });

  // Registration is fully complete — clear session data so a fresh visit
  // to register.html doesn't silently prefill a finished entry.
  // (Kept until now so back-navigation to this page still renders correctly.)
  window.addEventListener("pagehide", () => Store.clear());
})();
