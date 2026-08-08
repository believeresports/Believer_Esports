/**
 * Thin wrapper around sessionStorage.
 * The site is a set of separate static pages (as requested, so each
 * can be uploaded/served individually on GitHub Pages), so we hand
 * registration data from page to page via sessionStorage instead of
 * in-memory state. Data clears when the tab closes.
 */
const STORE_KEY = "believer_registration_v1";

const Store = {
  get() {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Store read failed", e);
      return null;
    }
  },

  set(data) {
    try {
      const current = Store.get() || {};
      const merged = { ...current, ...data };
      sessionStorage.setItem(STORE_KEY, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.error("Store write failed", e);
      return null;
    }
  },

  clear() {
    sessionStorage.removeItem(STORE_KEY);
  },

  /** Redirect back to registration if a required step's data is missing. */
  requireStep(step, redirectTo) {
    const data = Store.get();
    const ok =
      step === "confirm"
        ? data && data.mode && data.slot && data.date && data.teamName && data.roster
        : step === "payment"
        ? data && data.locked && data.registrationId
        : step === "success"
        ? data && data.paid
        : false;

    if (!ok) {
      window.location.href = redirectTo;
      return null;
    }
    return data;
  },
};
