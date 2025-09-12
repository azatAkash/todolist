// src/task/controller.js (adjust paths if different)
import { api } from "../api.js"; // or "./api.js" if it's alongside
import { renderLayout, getEls, renderItems } from "./view.js";

export async function init() {
  renderLayout();
  const { form, input, list } = getEls();

  // 1) initial fetch
  try {
    const tasks = await api.list();
    console.log("ListTasks ->", tasks); // ← you should see an array of objects
    renderItems(list, tasks); // render now
  } catch (e) {
    console.error("ListTasks failed:", e);
  }

  // 2) live updates from Go
  api.onChange((tasks) => renderItems(list, tasks));

  // 3) add
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;
    await api.add({ title });
    input.value = "";
    // UI will refresh via onChange
  });

  // 4) delete by id (delegation)
  list.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete");
    if (!btn) return;
    const row = btn.closest(".todo");
    const id = Number(row.dataset.id);
    await api.remove(id);
  });
}
