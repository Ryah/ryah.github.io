// Shared theme preference and one optional dice toy. No runtime dependencies.
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
    const themeButton = document.querySelector("[data-theme-toggle]");
    if (themeButton) {
      themeButton.hidden = false;
      const update = () => {
        const dark = document.documentElement.dataset.theme !== "light";
        themeButton.textContent = dark ? "Light" : "Dark";
        themeButton.setAttribute(
          "aria-label",
          `Switch to ${dark ? "light" : "dark"} theme`,
        );
      };
      update();
      themeButton.addEventListener("click", () => {
        const theme =
          document.documentElement.dataset.theme === "light" ? "dark" : "light";
        document.documentElement.dataset.theme = theme;
        try {
          localStorage.setItem("ryah-theme", theme);
        } catch (_) {
          /* The page still changes. */
        }
        update();
      });
    }
    const roll = document.querySelector("[data-roll]");
    const result = document.querySelector("[data-roll-result]");
    if (!roll || !result) return;
    roll.hidden = false;
    roll.setAttribute(
      "aria-label",
      "Roll a twenty-sided die. Current roll: 20",
    );
    const number = roll.querySelector(".die-number");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ideas = [
      "Give a minor character a very inconvenient goal.",
      "Let someone remember a detail everyone else forgot.",
      "Build the tiny feature you keep thinking about.",
      "Ask what happened while the player was away.",
      "Make a rumor travel to the wrong person.",
      "Turn one strange idea into a small experiment.",
      "Give a familiar place one unexpected change.",
      "Write down the rule you keep explaining twice.",
      "Let two characters disagree about the same memory.",
      "Leave one promising thread for the next scene.",
    ];
    let busy = false;
    roll.addEventListener("click", () => {
      if (busy) return;
      busy = true;
      roll.setAttribute("aria-disabled", "true");
      roll.classList.add("is-rolling");
      const value = Math.floor(Math.random() * 20) + 1;
      const finish = () => {
        roll.classList.remove("is-rolling");
        number.textContent = String(value);
        roll.setAttribute(
          "aria-label",
          `Roll a twenty-sided die. Current roll: ${value}`,
        );
        result.textContent =
          value === 20
            ? "Rolled 20. Critical inspiration! Start that project."
            : value === 1
              ? "Rolled 1. The experiment escaped. Take a break, then try again."
              : `Rolled ${value}. ${ideas[(value - 2) % ideas.length]}`;
        roll.closest(".dice-toy").classList.toggle("is-critical", value === 20);
        roll.setAttribute("aria-disabled", "false");
        busy = false;
      };
      if (reducedMotion.matches) finish();
      else setTimeout(finish, 650);
    });
  });
})();
