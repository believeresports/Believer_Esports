/**
 * Populates the homepage's format cards and slot displays from
 * config.js, so prices/slots never have to be edited in more than one
 * place. (These used to be hardcoded directly in index.html — fixed
 * so editing config.js is genuinely the single source of truth.)
 */
(function () {
  const cfg = window.SITE_CONFIG;

  // ---- format cards (#formats) ----
  const formatsGrid = document.getElementById("formats-grid");
  if (formatsGrid && cfg.modes) {
    Object.entries(cfg.modes).forEach(([key, m]) => {
      const card = document.createElement("div");
      card.className = "panel format-card";
      card.dataset.mode = key;
      card.innerHTML = `
        <div class="fc-top"><span class="dot" style="width:10px;height:10px;"></span></div>
        <h3>${m.label}</h3>
        <p>${m.tagline || ""}</p>
        <div class="fc-fee">₹${m.fee} <span>/ entry</span></div>
        <div class="fc-players">${m.players} PLAYER${m.players > 1 ? "S" : ""}</div>`;
      formatsGrid.appendChild(card);
    });
  }

  // ---- hero "today's slots" panel ----
  const heroSlots = document.getElementById("hero-slots");
  if (heroSlots && cfg.slots) {
    cfg.slots.forEach((s) => {
      const row = document.createElement("div");
      row.className = "live-slot";
      row.innerHTML = `
        <div>
          <div class="t">${s.label}</div>
          <div class="l">${s.sub}</div>
        </div>
        <span class="pill">OPEN</span>`;
      heroSlots.appendChild(row);
    });
  }

  // ---- dedicated Match Slots section (#slots) ----
  const slotsGrid = document.getElementById("slots-grid");
  if (slotsGrid && cfg.slots) {
    cfg.slots.forEach((s) => {
      const card = document.createElement("div");
      card.className = "panel slot-card";
      card.innerHTML = `
        <div>
          <div class="t">${s.label}</div>
          <div class="l">${s.sub}</div>
        </div>
        <span class="pill">DAILY</span>`;
      slotsGrid.appendChild(card);
    });
  }
})();
