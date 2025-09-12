const state = { tasks: [], filter: "all", sort: "created" };
const subs = new Set();

const notify = () =>
  subs.forEach((fn) => fn({ ...state, tasks: [...state.tasks] }));

export const model = {
  subscribe(fn) {
    subs.add(fn);
    fn({ ...state, tasks: [...state.tasks] });
    return () => subs.delete(fn);
  },
  setTasks(tasks) {
    state.tasks = Array.isArray(tasks) ? tasks : [];
    notify();
  },
  setFilter(f) {
    state.filter = f;
    notify();
  },
  setSort(s) {
    state.sort = s;
    notify();
  },
  get() {
    return { ...state, tasks: [...state.tasks] };
  },
};
