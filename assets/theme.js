// Progressive enhancement: theme, specimen power, reveals, and inspiration die.
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
    const power = document.querySelector("[data-power]");
    if (power) {
      power.hidden = false;
      power.addEventListener("click", () => {
        const active = document.body.classList.toggle("is-powered");
        power.setAttribute("aria-pressed", String(active));
        power.querySelector("[data-power-label]").textContent = active
          ? "It is alive"
          : "Reanimate";
      });
    }
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if ("IntersectionObserver" in window && !motionPreference.matches) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08 },
      );
      document.querySelectorAll("[data-reveal]").forEach((section) => {
        section.classList.add("reveal-ready");
        observer.observe(section);
      });
      motionPreference.addEventListener("change", (event) => {
        if (event.matches) {
          observer.disconnect();
          document
            .querySelectorAll(".reveal-ready")
            .forEach((section) => section.classList.add("is-visible"));
        }
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
    let rollAnimation;
    roll.addEventListener("click", () => {
      clearTimeout(rollAnimation);
      roll.classList.remove("is-rolling");
      void roll.offsetWidth;
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
      };
      if (reducedMotion.matches) finish();
      else rollAnimation = setTimeout(finish, 550);
    });
  });
})();
