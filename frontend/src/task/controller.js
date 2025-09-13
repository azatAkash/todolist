// src/task/controller.js
import { api } from "../api.js"; // adjust to "./api.js" if you colocate it
import {
  renderLayout,
  getEls,
  renderItems,
  initPriorityDropdown,
  initDateMinToday,
} from "./view.js";
import { model } from "./model.js";

function toISOFromLocal(dateStr, timeStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  let hh = 0,
    mm = 0;
  if (timeStr) [hh, mm] = timeStr.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0); // local time
  return dt.toISOString(); // send ISO so Go can unmarshal into time.Time
}

export async function init() {
  // 1) build the static UI
  renderLayout();
  const { form, input, date, time, importanceDropdown, list } = getEls();
  initPriorityDropdown(importanceDropdown, "medium");
  initDateMinToday(date);

  // 2) whenever model updates, re-render the rows
  model.subscribe(({ tasks }) => renderItems(list, tasks));

  // 3) initial load from backend
  try {
    const tasks = await api.list("all", "created");
    model.setTasks(tasks);
  } catch (e) {
    console.error("ListTasks failed:", e);
  }

  // 4) live updates from Go (EventsEmit in your backend)
  api.onChange((tasks) => model.setTasks(tasks));

  // 5) add task
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;

    const due_at = toISOFromLocal(date.value, time.value); // <-- use both
    const priority = importanceDropdown.value || "medium";

    try {
      await api.add({ title, due_at, priority });
      input.value = "";
      // model updates via events
    } catch (err) {
      console.error("CreateTask failed:", err);
    }
  });

  // 6) row actions (toggle + delete) via delegation
  list.addEventListener("click", async (e) => {
    const row = e.target.closest(".todo-row");
    if (!row) return;
    const id = Number(row.dataset.id);
    if (!id) return;

    if (e.target.closest(".delete")) {
      await api.remove(id); // model updates via events
    }
  });

  list.addEventListener("change", async (e) => {
    const cb = e.target.closest(".todo-toggle");
    if (!cb) return;
    const row = e.target.closest(".todo-row");
    const id = Number(row?.dataset.id);
    if (!id) return;
    await api.toggle(id, cb.checked); // model updates via events
  });
}
