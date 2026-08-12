(function () {
  const data = Store.requireStep("pending", "register.html");
  if (!data) return;

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  }

  document.getElementById("t-mode").textContent = data.modeLabel;
  document.getElementById("t-team").textContent = data.teamName;
  document.getElementById("t-captain").textContent = data.captainName;
  document.getElementById("t-utr").textContent = data.utr;
  document.getElementById("t-slot").textContent = data.slotLabel;
  document.getElementById("t-date").textContent = formatDate(data.date);
  document.getElementById("t-fee").textContent = `₹${data.fee}`;
  document.getElementById("t-regid").textContent = data.registrationId;

  const rosterList = document.getElementById("t-roster");
  data.roster.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `${p.ign} <span>· UID ${p.uid}</span>`;
    rosterList.appendChild(li);
  });
})();
