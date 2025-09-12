// src/task/view.js
export function renderLayout() {
  document.querySelector("#app").innerHTML = `
    <div class="container">
      <form class="todo-form" autocomplete="off" novalidate>
        <input class="todo-input" placeholder="Add todo…" />
        <button type="submit">Submit</button>
      </form>
      <div class="todos"></div>
    </div>`;
}
export function getEls() {
  return {
    form: document.querySelector(".todo-form"),
    input: document.querySelector(".todo-input"),
    list: document.querySelector(".todos"),
  };
}
export function renderItems(listEl, tasks) {
  listEl.innerHTML = "";
  const frag = document.createDocumentFragment();
  tasks.forEach((t) => {
    const row = document.createElement("div");
    row.className = "todo";
    row.dataset.id = String(t.id); // use ID (stable)
    const span = document.createElement("span");
    span.textContent = t.title; // ← IMPORTANT
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete";
    del.textContent = "×";
    row.append(span, del);
    frag.appendChild(row);
  });
  listEl.appendChild(frag);
}
