import { openDeleteModal } from "./modal-delete";
import { model } from "./model";
import { api } from "../api";
import { toISOFromLocal } from "../helpers/time";

export function bindForm(els) {
  const { form, input, date, time, importanceDropdown } = els;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;

    const due_at = toISOFromLocal(date.value, time?.value || "");
    const priority = importanceDropdown.value || "medium";
    await api.add({ title, due_at, priority });
    input.value = "";
  });
}

export function bindStatusFilters(els) {
  const { filters } = els;

  filters.addEventListener("click", async (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    model.setStatus(btn.dataset.filter); // "all" | "active" | "completed"
    await refresh();
  });
}

export function bindSorts(els) {
  const { sorts } = els;

  sorts.addEventListener("click", async (e) => {
    if (e.target.closest(".sort-reset")) {
      model.resetSort();
      await refresh();
      return;
    }
    const btn = e.target.closest(".sort-btn");
    if (!btn) return;
    model.toggleSort(btn.dataset.sort); // "created" | "priority"
    await refresh();
  });
}

export function bindDateFilters(els) {
  const { dateFilters } = els;

  dateFilters.addEventListener("click", async (e) => {
    const btn = e.target.closest(".date-btn");
    if (!btn) return;

    model.setDue(btn.dataset.date); // "all" | "today" | "week" | "overdue"

    // pill highlight
    [...dateFilters.querySelectorAll(".date-btn")].forEach((b) =>
      b.setAttribute("aria-selected", String(b === btn))
    );

    await refresh();
  });
}

export function bindCompletedCollapse(els) {
  const { completedSection, completedToggle, completedBody } = els;

  completedToggle.addEventListener("click", () => {
    const expanded = completedSection.getAttribute("aria-expanded") === "true";
    completedSection.setAttribute("aria-expanded", String(!expanded));
    completedBody.hidden = expanded;
  });
}

export function bindRowActions(els) {
  const { listsRoot } = els;

  listsRoot.addEventListener("click", async (e) => {
    const row = e.target.closest(".todo-row");
    if (!row) return;

    // заголовок для модалки
    const titleText =
      row.querySelector(".col-title")?.textContent?.trim() || "";

    const id = Number(row.dataset.id);
    if (e.target.closest(".delete")) {
      openDeleteModal(els, id, titleText);
      return;
    }
  });

  listsRoot.addEventListener("change", async (e) => {
    const cb = e.target.closest(".todo-toggle");
    if (!cb) return;
    const row = e.target.closest(".todo-row");
    const id = Number(row?.dataset.id);
    await api.toggle(id, cb.checked);
  });
}

export async function refresh() {
  const { status, sort, due } = model.get();
  const tasks = await api.list(status, sort.key, sort.dir, due);
  model.setTasks(tasks);
}
