import { api } from "../api.js";
import { renderLayout, renderItems } from "./view.js";
import { model } from "./model.js";
import { bindTheme } from "../helpers/theme.js";
import { getEls } from "../helpers/dom-queries.js";
import { initDateMinToday, initDateAndTimeMin } from "../helpers/time.js";
import { applyFilterUI, applySortUI, initPriorityDropdown } from "./filter.js";
import { bindModal } from "./modal-delete.js";
import {
  bindCompletedCollapse,
  bindDateFilters,
  bindForm,
  bindRowActions,
  bindSorts,
  bindStatusFilters,
  refresh,
} from "./bind.js";

function subscribeToModel(els) {
  const {
    listActive,
    listCompleted,
    completedSection,
    completedBody,
    completedCountEl,
  } = els;

  model.subscribe(({ tasks, status, sort }) => {
    applyFilterUI(status, els);
    applySortUI(sort, els);

    const active = tasks.filter(
      (t) => (t.status || "").toLowerCase() !== "completed"
    );
    const done = tasks.filter(
      (t) => (t.status || "").toLowerCase() === "completed"
    );

    renderItems(listActive, active);
    renderItems(listCompleted, done);

    completedCountEl.textContent = String(done.length);
    const expanded = completedSection.getAttribute("aria-expanded") === "true";
    completedBody.hidden = !expanded;
  });
}

export async function init() {
  renderLayout();
  const els = getEls();

  // one-time UI init
  initPriorityDropdown(els.importanceDropdown, "medium");
  initDateMinToday(els.date);
  initDateAndTimeMin(els.date, els.time);

  // wire up listeners
  bindTheme(els);
  bindForm(els);
  bindStatusFilters(els);
  bindSorts(els);
  bindDateFilters(els);
  bindCompletedCollapse(els);
  bindRowActions(els);
  bindModal(els);

  // react to model changes
  subscribeToModel(els);

  // initial load + server push
  await refresh();
  api.onChange(() => refresh());
}
