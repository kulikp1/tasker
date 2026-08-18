import { reactive } from 'vue';

// TEMPORARY diagnostic tool for tracking down why touch drag doesn't work on a specific
// phone - remove once the root cause is found. Logs raw touch events (capture phase, so
// nothing downstream can hide them from us) plus Sortable's own lifecycle events, so we can
// see on-device whether touches reach the browser at all and whether Sortable reacts to them.
export const dragDebugLog = reactive<string[]>([]);

function push(msg: string): void {
  const t = new Date();
  const stamp = `${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}.${String(t.getMilliseconds()).padStart(3, '0')}`;
  dragDebugLog.push(`${stamp} ${msg}`);
  if (dragDebugLog.length > 60) dragDebugLog.shift();
}

function describe(target: EventTarget | null): string {
  if (!(target instanceof HTMLElement)) return String(target);
  const cls = Array.from(target.classList).slice(0, 2).join('.');
  return `${target.tagName.toLowerCase()}${cls ? '.' + cls : ''}`;
}

function isDebugUi(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('[data-drag-debug-ui]') !== null;
}

let initialized = false;

export function initDragDebug(): void {
  if (initialized) return;
  initialized = true;
  window.addEventListener(
    'touchstart',
    (e) => {
      if (isDebugUi(e.target)) return;
      push(`touchstart target=${describe(e.target)} cancelable=${e.cancelable} touches=${e.touches.length}`);
    },
    { passive: true, capture: true }
  );
  let lastMoveLog = 0;
  window.addEventListener(
    'touchmove',
    (e) => {
      if (isDebugUi(e.target)) return;
      const now = Date.now();
      if (now - lastMoveLog < 150) return;
      lastMoveLog = now;
      push(`touchmove target=${describe(e.target)} defaultPrevented=${e.defaultPrevented}`);
    },
    { passive: true, capture: true }
  );
  window.addEventListener(
    'touchend',
    (e) => {
      if (isDebugUi(e.target)) return;
      push(`touchend target=${describe(e.target)}`);
    },
    { passive: true, capture: true }
  );
  window.addEventListener(
    'touchcancel',
    (e) => {
      if (isDebugUi(e.target)) return;
      push(`touchcancel target=${describe(e.target)}`);
    },
    { passive: true, capture: true }
  );
  window.addEventListener('error', (e) => push(`JS ERROR: ${e.message} @ ${e.filename}:${e.lineno}`));
  push('debug logger attached');
}

export function logDrag(msg: string): void {
  push(msg);
}

export function clearDragDebug(): void {
  dragDebugLog.length = 0;
}
