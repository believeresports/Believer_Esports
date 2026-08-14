/**
 * Runs on every page. Pulls branding from config.js so the org name,
 * tagline and contact details only need to be set in one place.
 */
(function () {
  const cfg = window.SITE_CONFIG || {};

  document.querySelectorAll("[data-org-name]").forEach((el) => {
    el.textContent = cfg.orgName || "YOUR ESPORTS ORG";
  });
  document.querySelectorAll("[data-org-tag]").forEach((el) => {
    el.textContent = cfg.orgTag || "";
  });
  document.querySelectorAll("[data-org-email]").forEach((el) => {
    el.textContent = cfg.contactEmail || "";
    if (el.tagName === "A") el.href = `mailto:${cfg.contactEmail || ""}`;
  });
  document.querySelectorAll("[data-org-whatsapp]").forEach((el) => {
    if (el.tagName === "A" && cfg.contactWhatsApp) {
      el.href = `https://wa.me/${cfg.contactWhatsApp}`;
    }
  });
  document.querySelectorAll("[data-whatsapp-group]").forEach((el) => {
    const link = cfg.whatsappGroupLink;
    const configured = link && !link.includes("XXXXXXXXXXXXXXXXXXXXXX");
    const section = el.closest("[data-whatsapp-group-section]") || el;
    if (configured) {
      if (el.tagName === "A") el.href = link;
      section.style.display = "";
    } else {
      // Hide the whole surrounding panel rather than ship a dead
      // placeholder link + orphaned "join our group" copy to real players.
      section.style.display = "none";
    }
  });
  document.title = document.title.replace("BELIEVER ESPORTS", cfg.orgName || "BELIEVER ESPORTS");

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  // Warn loudly (console only) if the backend hasn't been configured yet —
  // helps whoever deploys this notice it before a player hits payment.html.
  if (cfg.apiBaseUrl && cfg.apiBaseUrl.includes("YOUR-BACKEND-URL")) {
    console.warn(
      "[BELIEVER ESPORTS] apiBaseUrl in assets/js/config.js is still a placeholder. " +
      "Payments will not work until you deploy /server and set the real URL there."
    );
  }
  if (cfg.whatsappGroupLink && cfg.whatsappGroupLink.includes("XXXXXXXXXXXXXXXXXXXXXX")) {
    console.warn(
      "[BELIEVER ESPORTS] whatsappGroupLink in assets/js/config.js is still a placeholder — " +
      "the \"Join WhatsApp Group\" button will stay hidden until you set a real invite link."
    );
  }
})();
