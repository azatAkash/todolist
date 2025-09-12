import "./style.css";
import "./app.css";

// Import your generated bindings
import { ListTodos, AddTodo, RemoveTodo } from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime/runtime"; // for realtime updates

const formEl = document.querySelector("form");
const inputEl = document.querySelector(".todo-input");
const listEl = document.querySelector(".todos");

function render(todos) {
  listEl.innerHTML = "";
  todos.forEach((text, i) => {
    const row = document.createElement("div");
    row.className = "todo";

    const span = document.createElement("span");
    span.textContent = text;

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete";
    del.textContent = "×";
    del.addEventListener("click", async () => {
      await RemoveTodo(i);
    });

    row.append(span, del);
    listEl.appendChild(row);
  });
}

// initial load
ListTodos().then(render);

// live updates from Go
EventsOn("todos:changed", (todos) => render(todos));

// add new
formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const value = inputEl.value.trim();
  if (!value) return;
  await AddTodo(value); // render will happen via event
  inputEl.value = "";
});
