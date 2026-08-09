// Reference-counted so a nested modal (e.g. a confirm dialog opened on top of a task modal)
// doesn't unlock the page the moment it closes while the outer modal is still open.
let openCount = 0;
let scrollY = 0;

export function lockScroll(): void {
  if (openCount === 0) {
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  }
  openCount += 1;
}

export function unlockScroll(): void {
  openCount = Math.max(0, openCount - 1);
  if (openCount === 0) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
  }
}
