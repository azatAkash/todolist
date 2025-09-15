export function getEls() {
  return {
    // что уже было:
    form: document.querySelector(".todo-form"),
    input: document.querySelector(".todo-input"),
    date: document.querySelector(".todo-date"),
    time: document.querySelector(".todo-time"),
    importanceDropdown: document.querySelector(".importance-dropdown"),
    listActive: document.querySelector(".todos-active"),
    listCompleted: document.querySelector(".todos-completed"),
    listsRoot: document.querySelector(".lists"),
    activeSection: document.querySelector(".active-section"),
    completedSection: document.querySelector(".completed-section"),
    completedToggle: document.querySelector(".completed-toggle"),
    completedBody: document.querySelector(".completed-body"),
    completedCountEl: document.querySelector(".completed-count"),
    themeToggle: document.querySelector(".theme-toggle"),
    filters: document.querySelector(".filters"),
    sorts: document.querySelector(".sorts"),
    dateFilters: document.querySelector(".date-filters"),

    modal: document.querySelector(".modal"),
    modalBackdrop: document.querySelector(".modal-backdrop"),
    modalConfirm: document.querySelector(".confirm-delete"),
    modalCancel: document.querySelector(".cancel-delete"),
    modalTaskTitle: document.querySelector(".modal-task-title"),
  };
}
