// src/js/api.js
import {
  ListTasks,
  CreateTask,
  RemoveTaskByID,
  ToggleComplete,
} from "../../wailsjs/go/main/App"; // <-- two dots

import { EventsOn } from "../../wailsjs/runtime/runtime"; // <-- two dots

export const api = {
  list(status, sortKey, sortDir, dueRange = "all") {
    return ListTasks(status, sortKey, sortDir, dueRange);
  },
  add(input) {
    return CreateTask(input);
  },
  remove(id) {
    return RemoveTaskByID(id);
  },
  toggle(id, done) {
    return ToggleComplete(id, done);
  },
  onChange(cb) {
    EventsOn("todos:changed", cb);
  },
};
