// Persistent keys
const LS = {
  status: "ui:status",
  due: "ui:due",
  sortKey: "ui:sortKey",
  sortDir: "ui:sortDir",
};

function loadPref(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

const initial = {
  tasks: [],
  // filters
  status: loadPref(LS.status, "all"), // "all" | "active" | "completed"
  due: loadPref(LS.due, "all"), // "all" | "today" | "week" | "overdue"
  // sort
  sort: {
    key: loadPref(LS.sortKey, "created"), // "created" | "priority"
    dir: loadPref(LS.sortDir, "asc"), // "asc" | "desc"
  },
};

const state = structuredClone(initial);
const subs = new Set();

const emit = () =>
  subs.forEach((fn) => fn({ ...state, tasks: [...state.tasks] }));

function persist() {
  try {
    localStorage.setItem(LS.status, state.status);
    localStorage.setItem(LS.due, state.due);
    localStorage.setItem(LS.sortKey, state.sort.key);
    localStorage.setItem(LS.sortDir, state.sort.dir);
  } catch {}
}

export const model = {
  subscribe(fn) {
    subs.add(fn);
    fn({ ...state, tasks: [...state.tasks] });
    return () => subs.delete(fn);
  },

  // tasks
  setTasks(tasks) {
    state.tasks = Array.isArray(tasks) ? tasks : [];
    emit();
  },

  // status filter: "all" | "active" | "completed"
  setStatus(next) {
    state.status = next || "all";
    persist();
    emit();
  },

  // date filter: "all" | "today" | "week" | "overdue"
  setDue(next) {
    state.due = next || "all";
    persist();
    emit();
  },

  // sort
  setSort({ key, dir }) {
    if (key) state.sort.key = key;
    if (dir) state.sort.dir = dir;
    persist();
    emit();
  },

  toggleSort(key) {
    if (!key) return;
    if (state.sort.key === key) {
      state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
    } else {
      state.sort.key = key;
      state.sort.dir = "asc";
    }
    persist();
    emit();
  },

  resetSort() {
    state.sort = { key: "created", dir: "asc" };
    persist();
    emit();
  },

  // read current state
  get() {
    return { ...state, tasks: [...state.tasks] };
  },
};
