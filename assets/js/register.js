(function () {
  const cfg = window.SITE_CONFIG;
  const form = document.getElementById("reg-form");
  const modeOptionsEl = document.getElementById("mode-options");
  const slotOptionsEl = document.getElementById("slot-options");
  const dateOptionsEl = document.getElementById("date-options");
  const rosterEl = document.getElementById("roster");
  const rosterCountLabel = document.getElementById("roster-count-label");

  // ---- render date options from config (past dates filtered out automatically) ----
  function formatPillDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return {
      big: d.toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
      small: d.toLocaleDateString(undefined, { weekday: "short" }),
    };
  }

  const todayISO = new Date().toISOString().split("T")[0];
  const upcomingDates = (cfg.availableDates || []).filter((d) => d >= todayISO).sort();

  if (!upcomingDates.length) {
    dateOptionsEl.innerHTML = `<p class="text-faint" style="font-size:13.5px;">No open dates right now — check back soon, or contact us directly.</p>`;
  } else {
    upcomingDates.forEach((iso) => {
      const { big, small } = formatPillDate(iso);
      const label = document.createElement("label");
      label.className = "date-opt";
      label.innerHTML = `
        <input type="radio" name="matchDate" value="${iso}" required />
        <span class="card">
          <b>${big}</b>
          <span>${small}</span>
        </span>`;
      dateOptionsEl.appendChild(label);
    });
  }

  // ---- render format options from config ----
  Object.entries(cfg.modes).forEach(([key, m]) => {
    const label = document.createElement("label");
    label.className = "mode-opt";
    label.innerHTML = `
      <input type="radio" name="mode" value="${key}" required />
      <span class="card">
        <b>${m.label}</b>
        <span>${m.players} player${m.players > 1 ? "s" : ""} · ₹${m.fee}</span>
      </span>`;
    modeOptionsEl.appendChild(label);
  });

  // ---- render slot options from config ----
  cfg.slots.forEach((s) => {
    const label = document.createElement("label");
    label.className = "slot-opt";
    label.innerHTML = `
      <input type="radio" name="slot" value="${s.id}" required />
      <span class="card">
        <b>${s.label}</b>
        <span>${s.sub}</span>
      </span>`;
    slotOptionsEl.appendChild(label);
  });

  // ---- build roster inputs whenever the format changes ----
  function renderRoster(modeKey) {
    rosterEl.innerHTML = "";
    if (!modeKey) {
      rosterEl.innerHTML = `<p class="text-faint" style="font-size:13.5px;">Roster fields appear once you pick a format above.</p>`;
      rosterCountLabel.textContent = "select a format first";
      return;
    }
    const count = cfg.modes[modeKey].players;
    rosterCountLabel.textContent = `${count} player${count > 1 ? "s" : ""} required`;

    for (let i = 0; i < count; i++) {
      const row = document.createElement("div");
      row.className = "roster-row";
      row.innerHTML = `
        <div class="roster-badge">${String(i + 1).padStart(2, "0")}</div>
        <div class="field" style="margin-bottom:0;">
          <label for="ign_${i}">Player ${i + 1} — In-game name<span class="req">*</span></label>
          <input type="text" id="ign_${i}" name="ign_${i}" class="mono-input roster-field" data-field="ign" maxlength="24" placeholder="IGN" />
          <div class="field-error" data-err="ign_${i}">Enter this player's in-game name.</div>
        </div>
        <div class="field" style="margin-bottom:0;">
          <label for="uid_${i}">Player ${i + 1} — In-game UID<span class="req">*</span></label>
          <input type="text" id="uid_${i}" name="uid_${i}" class="mono-input roster-field" data-field="uid" maxlength="20" placeholder="UID / Player ID" />
          <div class="field-error" data-err="uid_${i}">Enter this player's UID.</div>
        </div>`;
      rosterEl.appendChild(row);
    }
  }

  modeOptionsEl.addEventListener("change", (e) => {
    if (e.target.name === "mode") {
      renderRoster(e.target.value);
      updateSummary();
      updateSteps();
    }
  });

  // ---- live summary sidebar ----
  function getSelected(name) {
    const el = form.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
  }

  function updateSummary() {
    const mode = getSelected("mode");
    const slot = getSelected("slot");
    const date = getSelected("matchDate");
    const team = document.getElementById("teamName").value.trim();

    document.getElementById("sum-mode").textContent = mode ? cfg.modes[mode].label : "—";
    document.getElementById("sum-slot").textContent = slot ? cfg.slots.find((s) => s.id === slot).label : "—";
    document.getElementById("sum-date").textContent = formatDate(date);
    document.getElementById("sum-team").textContent = team || "—";
    document.getElementById("sum-players").textContent = mode ? cfg.modes[mode].players : "—";
    document.getElementById("sum-fee").textContent = mode ? `₹${cfg.modes[mode].fee}` : "₹0";
  }

  // ---- step progress indicator ----
  function blockValid(step) {
    const block = form.querySelector(`[data-step="${step}"]`);

    // every text/email/tel/date input in this block must be non-empty
    const textFields = block.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"]');
    if (textFields.length && !Array.from(textFields).every((f) => f.value.trim() !== "")) return false;

    // every radio group in this block must have a checked option
    const radioGroups = {};
    block.querySelectorAll('input[type="radio"]').forEach((r) => {
      radioGroups[r.name] = radioGroups[r.name] || false;
      if (r.checked) radioGroups[r.name] = true;
    });
    const groupNames = Object.keys(radioGroups);
    if (groupNames.length && !groupNames.every((n) => radioGroups[n])) return false;

    // a block with nothing to check yet (e.g. roster before a format is picked) isn't "done"
    if (!textFields.length && !groupNames.length) return false;

    return true;
  }
  function updateSteps() {
    [0, 1, 2, 3].forEach((step) => {
      const indicator = document.querySelector(`[data-step-indicator="${step}"]`);
      indicator.classList.toggle("done", blockValid(step));
    });
  }

  form.addEventListener("input", () => {
    updateSummary();
    updateSteps();
  });
  form.addEventListener("change", () => {
    updateSummary();
    updateSteps();
  });

  // ---- phone: digits only ----
  document.getElementById("captainPhone").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
  });

  // ---- validation + submit ----
  function showError(fieldEl, errEl) {
    fieldEl.closest(".field")?.classList.add("has-error");
    if (errEl) errEl.style.display = "block";
  }
  function clearErrors() {
    form.querySelectorAll(".field.has-error").forEach((f) => f.classList.remove("has-error"));
    form.querySelectorAll(".field-error").forEach((e) => (e.style.display = "none"));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();
    let firstInvalid = null;
    let valid = true;

    const mode = getSelected("mode");
    if (!mode) {
      document.getElementById("err-mode").style.display = "block";
      valid = false;
      firstInvalid = firstInvalid || modeOptionsEl;
    }

    const date = getSelected("matchDate");
    if (!date) {
      showError(dateOptionsEl, document.getElementById("err-matchDate"));
      valid = false;
      firstInvalid = firstInvalid || dateOptionsEl;
    }

    const slot = getSelected("slot");
    if (!slot) {
      document.getElementById("err-slot").style.display = "block";
      valid = false;
      firstInvalid = firstInvalid || slotOptionsEl;
    }

    const teamNameEl = document.getElementById("teamName");
    if (!teamNameEl.value.trim()) {
      showError(teamNameEl, document.getElementById("err-teamName"));
      valid = false;
      firstInvalid = firstInvalid || teamNameEl;
    }

    const roster = [];
    if (mode) {
      const count = cfg.modes[mode].players;
      for (let i = 0; i < count; i++) {
        const ignEl = document.getElementById(`ign_${i}`);
        const uidEl = document.getElementById(`uid_${i}`);
        let rowOk = true;
        if (!ignEl.value.trim()) {
          showError(ignEl, document.querySelector(`[data-err="ign_${i}"]`));
          valid = false;
          rowOk = false;
          firstInvalid = firstInvalid || ignEl;
        }
        if (!uidEl.value.trim()) {
          showError(uidEl, document.querySelector(`[data-err="uid_${i}"]`));
          valid = false;
          rowOk = false;
          firstInvalid = firstInvalid || uidEl;
        }
        if (rowOk) roster.push({ ign: ignEl.value.trim(), uid: uidEl.value.trim() });
      }
    }

    const captainName = document.getElementById("captainName");
    if (!captainName.value.trim()) {
      showError(captainName, document.getElementById("err-captainName"));
      valid = false;
      firstInvalid = firstInvalid || captainName;
    }

    const captainEmail = document.getElementById("captainEmail");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(captainEmail.value.trim());
    if (!emailOk) {
      showError(captainEmail, document.getElementById("err-captainEmail"));
      valid = false;
      firstInvalid = firstInvalid || captainEmail;
    }

    const captainPhone = document.getElementById("captainPhone");
    if (!/^\d{10}$/.test(captainPhone.value.trim())) {
      showError(captainPhone, document.getElementById("err-captainPhone"));
      valid = false;
      firstInvalid = firstInvalid || captainPhone;
    }

    if (!valid) {
      firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Everything checks out — hand off to the confirmation screen.
    Store.set({
      mode,
      modeLabel: cfg.modes[mode].label,
      slot,
      slotLabel: cfg.slots.find((s) => s.id === slot).label,
      date,
      teamName: teamNameEl.value.trim(),
      roster,
      captainName: captainName.value.trim(),
      captainEmail: captainEmail.value.trim(),
      captainPhone: captainPhone.value.trim(),
      fee: cfg.modes[mode].fee,
      currency: cfg.currency,
      locked: false,
    });

    window.location.href = "confirm.html";
  });

  // init
  renderRoster(null);
  updateSummary();
  updateSteps();

  // if the user comes back from confirm.html (before locking), repopulate
  const existing = Store.get();
  if (existing && !existing.locked && existing.mode) {
    const modeRadio = form.querySelector(`input[name="mode"][value="${existing.mode}"]`);
    if (modeRadio) {
      modeRadio.checked = true;
      renderRoster(existing.mode);
    }
    const slotRadio = form.querySelector(`input[name="slot"][value="${existing.slot}"]`);
    if (slotRadio) slotRadio.checked = true;
    const dateRadio = form.querySelector(`input[name="matchDate"][value="${existing.date}"]`);
    if (dateRadio) dateRadio.checked = true;
    if (existing.teamName) document.getElementById("teamName").value = existing.teamName;
    (existing.roster || []).forEach((p, i) => {
      const ignEl = document.getElementById(`ign_${i}`);
      const uidEl = document.getElementById(`uid_${i}`);
      if (ignEl) ignEl.value = p.ign;
      if (uidEl) uidEl.value = p.uid;
    });
    if (existing.captainName) document.getElementById("captainName").value = existing.captainName;
    if (existing.captainEmail) document.getElementById("captainEmail").value = existing.captainEmail;
    if (existing.captainPhone) document.getElementById("captainPhone").value = existing.captainPhone;
    updateSummary();
    updateSteps();
  }
})();
