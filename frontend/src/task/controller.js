// src/task/controller.js
import { api } from "../api.js";
import {
  renderLayout,
  getEls,
  renderItems,
  initPriorityDropdown,
  initDateMinToday,
  initDateAndTimeMin,
} from "./view.js";
import { model } from "./model.js";

const isCompleted = (t) => (t.status || "").toLowerCase() === "completed";

function applyTheme(theme, btn) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (btn) {
    const dark = theme === "dark";
    btn.setAttribute("aria-pressed", String(dark));
    btn.textContent = dark ? "☀️ Light" : "🌙 Dark";
  }
}

function getPreferredTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function toISOFromLocal(dateStr, timeStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  let hh = 0,
    mm = 0;
  if (timeStr) [hh, mm] = timeStr.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return dt.toISOString();
}

export async function init() {
  renderLayout();
  const els = getEls();
  const {
    form,
    input,
    date,
    time,
    importanceDropdown,
    listActive,
    listCompleted,
    listsRoot,
    completedSection,
    completedToggle,
    completedCountEl,
    completedBody,
    themeToggle,
  } = els;

  initPriorityDropdown(importanceDropdown, "medium");
  initDateMinToday(date);
  initDateAndTimeMin(date, time);

  applyTheme(getPreferredTheme(), themeToggle);
  themeToggle.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(current === "dark" ? "light" : "dark", themeToggle);
  });
  // render on model updates: split into active/completed
  model.subscribe(({ tasks }) => {
    const active = tasks.filter((t) => !isCompleted(t));
    const comp = tasks.filter((t) => isCompleted(t));
    renderItems(listActive, active);
    renderItems(listCompleted, comp);
    // update completed count
    completedCountEl.textContent = String(comp.length);
    // hide body when collapsed (attr is the source of truth)
    const expanded = completedSection.getAttribute("aria-expanded") === "true";
    completedBody.hidden = !expanded;
  });

  // initial load
  try {
    model.setTasks(await api.list("all", "created"));
  } catch (e) {
    console.error("ListTasks failed:", e);
  }

  // live updates from Go
  api.onChange((tasks) => model.setTasks(tasks));

  // add task
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;
    const due_at = toISOFromLocal(date.value, time?.value || "");
    const priority = importanceDropdown.value || "medium";
    await api.add({ title, due_at, priority });
    input.value = "";
  });

  // toggle completed section
  completedToggle.addEventListener("click", () => {
    const expanded = completedSection.getAttribute("aria-expanded") === "true";
    completedSection.setAttribute("aria-expanded", String(!expanded));
    completedSection.classList.toggle("collapsed", expanded);
    completedBody.hidden = expanded;
  });

  // actions (toggle + delete) for both lists via single delegate
  listsRoot.addEventListener("click", async (e) => {
    const row = e.target.closest(".todo-row");
    if (!row) return;
    const id = Number(row.dataset.id);
    if (!id) return;

    if (e.target.closest(".delete")) {
      await api.remove(id);
    }
  });

  listsRoot.addEventListener("change", async (e) => {
    const cb = e.target.closest(".todo-toggle");
    if (!cb) return;
    const row = e.target.closest(".todo-row");
    const id = Number(row?.dataset.id);
    if (!id) return;
    await api.toggle(id, cb.checked);
  });
}
