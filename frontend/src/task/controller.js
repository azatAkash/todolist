// src/task/controller.js
import { api } from "../api.js";
import { renderLayout, renderItems, initPriorityDropdown } from "./view.js";
import { model } from "./model.js";
import { getPreferredTheme, applyTheme } from "../helpers/theme.js";
import { getEls } from "../helpers/dom-queries.js";
import {
  toISOFromLocal,
  initDateMinToday,
  initDateAndTimeMin,
} from "../helpers/time.js";

const isCompleted = (t) => (t.status || "").toLowerCase() === "completed";

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
