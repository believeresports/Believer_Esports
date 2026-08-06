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
  document.title = document.title.replace("PHANTOM ESPORTS", cfg.orgName || "PHANTOM ESPORTS");

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  // Warn loudly (console only) if the backend hasn't been configured yet —
  // helps whoever deploys this notice it before a player hits payment.html.
  if (cfg.apiBaseUrl && cfg.apiBaseUrl.includes("YOUR-BACKEND-URL")) {
    console.warn(
      "[PHANTOM ESPORTS] apiBaseUrl in assets/js/config.js is still a placeholder. " +
      "Payments will not work until you deploy /server and set the real URL there."
    );
  }
})();
