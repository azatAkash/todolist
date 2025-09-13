export function applyTheme(theme, btn) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (btn) {
    const dark = theme === "dark";
    btn.setAttribute("aria-pressed", String(dark));
    btn.textContent = dark ? "☀️ Light" : "🌙 Dark";
  }
}

export function getPreferredTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
