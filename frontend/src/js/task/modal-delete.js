import { api } from "../api";

let lastFocusEl = null;

export function openDeleteModal(els, taskId, taskTitle) {
  lastFocusEl = document.activeElement;

  els.modal.dataset.taskId = String(taskId);
  els.modalTaskTitle.textContent = taskTitle ? `“${taskTitle}”` : "";

  els.modal.removeAttribute("hidden");
  els.modalBackdrop.removeAttribute("hidden");

  // фокус на «Delete»
  els.modalConfirm.focus();
}

export function closeDeleteModal(els) {
  els.modal.setAttribute("hidden", "");
  els.modalBackdrop.setAttribute("hidden", "");
  els.modal.removeAttribute("data-task-id");
  els.modalTaskTitle.textContent = "";

  if (lastFocusEl && typeof lastFocusEl.focus === "function") {
    lastFocusEl.focus();
  }
}

export function bindModal(els) {
  els.modalConfirm.addEventListener("click", async () => {
    const id = Number(els.modal.dataset.taskId || 0);
    if (id) {
      await api.remove(id);
    }
    closeDeleteModal(els);
  });

  els.modalCancel.addEventListener("click", () => closeDeleteModal(els));
  els.modalBackdrop.addEventListener("click", () => closeDeleteModal(els));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.modal.hasAttribute("hidden")) {
      closeDeleteModal(els);
    }
  });
}
