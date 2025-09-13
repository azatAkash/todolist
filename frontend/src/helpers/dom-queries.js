export function getEls() {
  return {
    form: document.querySelector(".todo-form"),
    input: document.querySelector(".todo-input"),
    date: document.querySelector(".todo-date"),
    time: document.querySelector(".todo-time"),
    importanceDropdown: document.querySelector(".importance-dropdown"),
    listActive: document.querySelector(".todos-active"),
    listCompleted: document.querySelector(".todos-completed"),
    listsRoot: document.querySelector(".lists"),
    completedSection: document.querySelector(".completed-section"),
    completedToggle: document.querySelector(".completed-toggle"),
    completedCountEl: document.querySelector(".completed-count"),
    completedBody: document.querySelector(".completed-body"),
    themeToggle: document.querySelector(".theme-toggle"),
  };
}
