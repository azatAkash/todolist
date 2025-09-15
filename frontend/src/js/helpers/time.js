export function toISOFromLocal(dateStr, timeStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  let hh = 0,
    mm = 0;
  if (timeStr) [hh, mm] = timeStr.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return dt.toISOString();
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
