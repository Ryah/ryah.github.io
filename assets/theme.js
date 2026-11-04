// Follow the system theme until the visitor chooses a preference.
(() => {
  let saved;
  try {
    saved = localStorage.getItem("ryah-theme");
  } catch (_) {
    /* Storage is optional. */
  }
  if (saved === "light" || saved === "dark")
    document.documentElement.dataset.theme = saved;
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button) return;
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = () =>
      document.documentElement.dataset.theme
        ? document.documentElement.dataset.theme === "dark"
        : system.matches;
    const update = () => {
      button.textContent = isDark() ? "Light" : "Dark";
      button.setAttribute(
        "aria-label",
        `Switch to ${isDark() ? "light" : "dark"} theme`,
      );
    };
    update();
    system.addEventListener("change", update);
    button.addEventListener("click", () => {
      const theme = isDark() ? "light" : "dark";
      document.documentElement.dataset.theme = theme;
      try {
        localStorage.setItem("ryah-theme", theme);
      } catch (_) {
        /* The page still changes. */
      }
      update();
    });
  });
})();
