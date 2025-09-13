// src/task/view.js
export function renderLayout() {
  document.querySelector("#app").innerHTML = `
    
    <div class="container">
      <div class="theme-bar">
        <button type="button" class="theme-toggle" aria-pressed="false">🌙 Dark</button>
      </div>
      <div class="page-title">Tasks</div>  

      <form class="todo-form" autocomplete="off">
        <input class="todo-input" name="title" placeholder="Add todo…" required />
        <div class="additional-data-container">
          <div class="left-child">
            <input class="todo-date" type="date" name="due_at" />
            <input class="todo-time" type="time" name="due_time" step="60" />
            <select class="importance-dropdown" name="priority">
              <option value="medium">medium</option>
              <option value="low">low</option>
              <option value="high">high</option>
            </select>
          </div>
          <button type="submit">Add</button>
        </div>
      </form>

      <!-- One scroll container that holds both sections -->
      <div class="lists">
        <!-- Active tasks -->
        <section class="active-section">
          <div class="todo-header-container">
            <div class="is-done-header"></div>
            <div class="title-header">Title</div>
            <div class="due-date-header">Due Date</div>
            <div class="priority-header">Priority</div>
            <div class="actions-header"></div>
          </div>
          <div class="todos todos-active"></div>
        </section>

        <!-- Completed (collapsible) -->
        <section class="completed-section collapsed" aria-expanded="false">
          <button type="button" class="completed-toggle">
            <span class="chev">▸</span>
            Completed (<span class="completed-count">0</span>)
          </button>
          <div class="completed-body" hidden>
            <div class="todo-header-container">
              <div class="is-done-header"></div>
              <div class="title-header">Title</div>
              <div class="due-date-header">Due Date</div>
              <div class="priority-header">Priority</div>
              <div class="actions-header"></div>
            </div>
            <div class="todos todos-completed"></div>
          </div>
        </section>
      </div>
    </div>`;
}

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

export function initDateMinToday(dateInput) {
  if (!dateInput) return;
  const t = new Date();
  const yyyy = t.getFullYear();
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  const dd = String(t.getDate()).padStart(2, "0");
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}

export function initDateAndTimeMin(dateInput, timeInput) {
  if (!dateInput || !timeInput) return;
  const pad = (n) => String(n).padStart(2, "0");
  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}`;
  })();
  dateInput.min = todayStr;
  const updateTimeMin = () => {
    if (dateInput.value === todayStr) {
      const now = new Date();
      now.setSeconds(0, 0);
      timeInput.min = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      if (timeInput.value && timeInput.value < timeInput.min)
        timeInput.value = timeInput.min;
    } else {
      timeInput.removeAttribute("min");
    }
  };
  updateTimeMin();
  dateInput.addEventListener("change", updateTimeMin);
}

/** Generic row renderer (reused for active & completed) */
export function renderItems(listEl, tasks) {
  listEl.innerHTML = "";
  const frag = document.createDocumentFragment();
  tasks.forEach((t) => {
    const row = document.createElement("div");
    row.className = "todo-row";
    row.dataset.id = String(t.id);

    // 1) checkbox
    const colDone = document.createElement("div");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "todo-toggle";
    cb.checked = (t.status || "").toLowerCase() === "completed";
    colDone.appendChild(cb);

    // 2) title
    const colTitle = document.createElement("div");
    colTitle.className = "col-title";
    const title = document.createElement("div");
    title.textContent = t.title || "";
    if (cb.checked) title.classList.add("is-completed");
    colTitle.appendChild(title);

    // 3) due date
    const colDue = document.createElement("div");
    colDue.className = "due-date";
    colDue.textContent = t.due_at
      ? new Date(t.due_at).toLocaleDateString()
      : "";

    // 4) priority
    const colPrio = document.createElement("div");
    colPrio.className = "priority";
    colPrio.textContent = t.priority || "medium";

    // 5) actions
    const colActions = document.createElement("div");
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete";
    del.title = "Delete";
    del.textContent = "×";
    colActions.appendChild(del);

    row.append(colDone, colTitle, colDue, colPrio, colActions);
    frag.appendChild(row);
  });
  listEl.appendChild(frag);
}
