//task/filter.js

import { model } from "./model";
import { api } from "../api";

export function applyFilterUI(filter, els) {
  // highlight pills
  [...els.filters.querySelectorAll(".filter-btn")].forEach((btn) => {
    btn.setAttribute("aria-selected", String(btn.dataset.filter === filter));
  });

  // show/hide sections WITHOUT touching aria-expanded (except when Completed)
  els.activeSection.style.display = filter === "completed" ? "none" : "";
  els.completedSection.style.display = filter === "active" ? "none" : "";

  // When user explicitly chooses "Completed", you may auto-open it once:
  if (filter === "completed") {
    els.completedSection.setAttribute("aria-expanded", "true");
  }
}

export function sortTasks(arr, key, dir) {
  const out = arr.slice();
  if (key === "priority") {
    const rank = { low: 1, medium: 2, high: 3 };
    out.sort((a, b) => {
      const pa = rank[(a?.priority || "").toLowerCase()] || 0;
      const pb = rank[(b?.priority || "").toLowerCase()] || 0;
      const base = dir === "asc" ? pa - pb : pb - pa;
      if (base !== 0) return base;
      // tie-breaker by created_at (oldest/newest depending on dir)
      return dir === "asc"
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at);
    });
  } else {
    // "created": by created_at, asc = oldest first, desc = newest first
    out.sort((a, b) =>
      dir === "asc"
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at)
    );
  }
  return out;
}

export function applySortUI(sort, els) {
  const { key, dir } = sort;
  [...els.sorts.querySelectorAll(".sort-btn")].forEach((btn) => {
    const active = btn.dataset.sort === key;
    btn.setAttribute("aria-selected", String(active));
    const base = btn.dataset.sort === "created" ? "Date added" : "Priority";
    btn.textContent = active ? `${base} ${dir === "asc" ? "▲" : "▼"}` : base;
  });
}

/* ------------------ bindings: status filters ------------------ */

function bindStatusFilters(els) {
  const { filters } = els;

  filters.addEventListener("click", async (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    model.setStatus(btn.dataset.filter); // "all" | "active" | "completed"
    await refresh();
  });
}

/* ------------------ bindings: sorts ------------------ */

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

/* ------------------ bindings: date range filter ------------------ */

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

export function initPriorityDropdown(dropdown, current = "medium") {
  const opts = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];
  dropdown.innerHTML = opts
    .map(
      (o) =>
        `<option value="${o.value}" ${o.value === current ? "selected" : ""}>${
          o.label
        }</option>`
    )
    .join("");
}
