const addRow = (list: HTMLElement): void => {
  const firstRow = list.querySelector("[data-arc-row]");
  if (!firstRow) return;
  const clone = firstRow.cloneNode(true) as HTMLElement;
  const inputs = clone.querySelectorAll("input");
  for (const input of inputs) {
    input.value = "";
  }
  list.appendChild(clone);
  const firstInput = clone.querySelector("input");
  if (firstInput instanceof HTMLInputElement) {
    firstInput.focus();
  }
};

const removeRow = (button: Element): void => {
  const row = button.closest("[data-arc-row]");
  if (!row) return;
  const list = row.parentElement;
  if (!list) return;
  const rows = list.querySelectorAll("[data-arc-row]");
  if (rows.length <= 1) return;
  row.remove();
};

const FORECAST_STORAGE_KEY = "pg-weather:forecast-range";

type ForecastRange = { early: boolean; late: boolean };

const readRangeState = (): ForecastRange => {
  try {
    const raw = localStorage.getItem(FORECAST_STORAGE_KEY);
    if (!raw) return { early: false, late: false };
    const parsed = JSON.parse(raw);
    return {
      early: Boolean(parsed?.early),
      late: Boolean(parsed?.late),
    };
  } catch {
    return { early: false, late: false };
  }
};

const writeRangeState = (state: ForecastRange): void => {
  try {
    localStorage.setItem(FORECAST_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
};

const applyRangeState = (wrapper: HTMLElement, state: ForecastRange): void => {
  wrapper.dataset.showEarly = state.early ? "true" : "false";
  wrapper.dataset.showLate = state.late ? "true" : "false";
  const buttons = wrapper.querySelectorAll<HTMLButtonElement>(
    "[data-forecast-toggle]",
  );
  for (const button of buttons) {
    const which = button.dataset.forecastToggle as "early" | "late" | undefined;
    if (which !== "early" && which !== "late") continue;
    const pressed = state[which];
    button.setAttribute("aria-pressed", pressed ? "true" : "false");
    const label = which === "early" ? "08:00" : "18:00";
    const verb = pressed ? "Hide" : "Show";
    const when = which === "early" ? "before" : "after";
    button.textContent = `${verb} ${when} ${label}`;
  }
};

const initForecastToggles = (): void => {
  const wrapper = document.querySelector<HTMLElement>(
    "[data-forecast-wrapper]",
  );
  if (!wrapper) return;

  const state = readRangeState();
  applyRangeState(wrapper, state);

  wrapper.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest<HTMLElement>("[data-forecast-toggle]");
    if (!button) return;
    const which = button.dataset.forecastToggle;
    if (which !== "early" && which !== "late") return;
    state[which] = !state[which];
    writeRangeState(state);
    applyRangeState(wrapper, state);
  });
};

const initArcFieldset = (): void => {
  const fieldset = document.querySelector("[data-arc-fieldset]");
  if (!fieldset) return;

  const list = fieldset.querySelector("[data-arc-list]");
  if (!(list instanceof HTMLElement)) return;

  const addButton = fieldset.querySelector("[data-arc-add]");
  addButton?.addEventListener("click", () => {
    addRow(list);
  });

  fieldset.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.matches("[data-arc-remove]")) {
      removeRow(target);
    }
  });
};

export function init() {
  initArcFieldset();
  initForecastToggles();
}
