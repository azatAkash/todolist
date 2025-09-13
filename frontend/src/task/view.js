// src/task/view.js

export function renderLayout() {
  document.querySelector("#app").innerHTML = `
    <div class="container">
      <div class="page-title">Tasks</div>
      <form class="todo-form" autocomplete="off">
        <input class="todo-input" name="title" placeholder="Add todo…" required />
        <div class="additional-data-container">
          <div class="left-child">
            <input class="todo-date" type="date" name="due_at" />
            <input class="todo-time" type="time" name="due_time" step="60" />  <!-- minutes -->

            <select class="importance-dropdown" name="priority">
              <option value="medium">medium</option>
              <option value="low">low</option>
              <option value="high">high</option>
            </select>
          </div>
          <button type="submit">Add</button>
        </div>
      </form>

      <div class="todos"></div>
    
    </div>`;
}

export function getEls() {
  return {
    form: document.querySelector(".todo-form"),
    input: document.querySelector(".todo-input"),
    date: document.querySelector(".todo-date"),
    time: document.querySelector(".todo-time"), // NEW
    importanceDropdown: document.querySelector(".importance-dropdown"),
    list: document.querySelector(".todos"),
  };
}

/** Fill the priority dropdown (call once after renderLayout) */
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

// NEW: wire date & time together
export function initDateMinToday(dateInput, timeInput) {
  if (!dateInput || !timeInput) return;

  const pad = (n) => String(n).padStart(2, "0");
  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}`;
  })();

  // date can't be before today
  dateInput.min = todayStr;

  // when the selected date is today, restrict time to now (rounded to minute)
  const updateTimeMin = () => {
    if (dateInput.value === todayStr) {
      const now = new Date();
      now.setSeconds(0, 0);
      const hh = pad(now.getHours());
      const mm = pad(now.getMinutes());
      timeInput.min = `${hh}:${mm}`;
      // if current value is earlier than min, snap to min
      if (timeInput.value && timeInput.value < timeInput.min) {
        timeInput.value = timeInput.min;
      }
    } else {
      timeInput.removeAttribute("min");
    }
  };

  updateTimeMin();
  dateInput.addEventListener("change", updateTimeMin);
}

export function renderItems(listEl, tasks) {
  listEl.innerHTML = ``;
  const frag = document.createDocumentFragment();
  if (tasks.length) {
    listEl.innerHTML += `<div class="todo-header-container">
      <div class="is-done-header"></div>
      <div class="title-header">Title</div>
      <div class="due-date-header">Due Date</div>
      <div class="priority-header">Priority</div>
    </div>`;
  }
  tasks.forEach((t) => {
    const row = document.createElement("div");
    row.className = "todo-row";
    row.dataset.id = String(t.id);

    const colDone = document.createElement("div");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "todo-toggle";
    cb.checked = (t.status || "").toLowerCase() === "completed";
    colDone.appendChild(cb);

    const colTitle = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = t.title || "";
    if (cb.checked) title.classList.add("is-completed");
    colTitle.appendChild(title);

    const colDue = document.createElement("div");
    colDue.className = "due-date";
    colDue.textContent = t.due_at
      ? new Date(t.due_at).toLocaleDateString()
      : "";

    const colPrio = document.createElement("div");
    colPrio.className = "priority";
    colPrio.textContent = t.priority;

    const colActions = document.createElement("div");
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete";
    del.textContent = "X";
    colActions.appendChild(del);

    row.append(colDone, colTitle, colDue, colPrio, colActions);
    frag.appendChild(row);
  });

  listEl.appendChild(frag);
}
