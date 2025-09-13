// src/api.js
import {
  ListTasks,
  CreateTask,
  RemoveTaskByID,
  ToggleComplete,
} from "../wailsjs/go/main/App";
import { EventsOn } from "../wailsjs/runtime/runtime";

export const api = {
  list: (status = "all", sort = "created") => ListTasks(status, sort),
  add: (payload) => CreateTask(payload), // {title, description?, due_at?, priority?}
  remove: (id) => RemoveTaskByID(id),
  toggle: (id, done) => ToggleComplete(id, done),
  onChange: (cb) => EventsOn("todos:changed", cb),
};
