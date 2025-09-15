// src/task/view.js
export function renderLayout() {
  document.querySelector("#app").innerHTML = `
    <div class="container">
      <div class="theme-bar">
        <button type="button" class="theme-toggle" aria-pressed="false">🌙 Dark</button>
      </div>

      <div class="page-title">Tasks</div>

      <!-- NEW: status filters -->
      <div class="filters" role="tablist" aria-label="Status filter">
        <button type="button" class="filter-btn" data-filter="all" aria-selected="true">All</button>
        <button type="button" class="filter-btn" data-filter="active" aria-selected="false">Active</button>
        <button type="button" class="filter-btn" data-filter="completed" aria-selected="false">Completed</button>
      </div>
      

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


      <div class="filter-container">
        <div class="date-filters" role="tablist">
          <button class="date-btn" data-date="all" aria-selected="true">All dates</button>
          <button class="date-btn" data-date="today">Today</button>
          <button class="date-btn" data-date="week">This week</button>
          <button class="date-btn" data-date="overdue">Overdue</button>
        </div>
        <div class="sorts" role="tablist" aria-label="Sort">
          <button type="button" class="sort-btn" data-sort="created"  aria-selected="true">Date added</ button>
          <button type="button" class="sort-btn" data-sort="priority" aria-selected="false">Priority</  button>
          <button type="button" class="sort-reset" title="Reset sort">Reset</button>
        </div>
      </div>

      <div class="lists">
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

    <div class="modal-backdrop" hidden></div>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" hidden>
        <div class="modal-card">
          <h3 id="delete-modal-title">Delete task?</h3>
          <p class="modal-text">
            <span class="modal-task-title"></span>
          </p>
          <div class="modal-actions">
            <button type="button" class="btn btn-danger confirm-delete">Delete</button>
            <button type="button" class="btn cancel-delete">Cancel</button>
          </div>
        </div>
      </div>
    </div>`;
}

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
  listEl.replaceChildren(frag);
}
