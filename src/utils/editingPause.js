// A writing pause starts with input and lasts through thinking time until focus
// leaves writable fields. Keep this outside React so typing does not rerender it.
let paused = false;
let uninstall;
const resumeListeners = new Set();
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number']);

function writableEditor(element) {
  if (!(element instanceof Element)) {
    return false;
  }
  const field = element.closest('input, textarea');
  if (field) {
    return !field.matches(':disabled') && !field.readOnly &&
      (field.tagName === 'TEXTAREA' || TEXT_INPUT_TYPES.has(field.type));
  }
  for (let current = element; current; current = current.parentElement) {
    const editable = current.getAttribute('contenteditable')?.toLowerCase();
    if (editable === 'false') {
      return false;
    }
    if (editable === '' || editable === 'true' || editable === 'plaintext-only') {
      return true;
    }
  }
  return false;
}

export function isEditingPaused() {
  return paused;
}

export function onEditingResumed(listener) {
  resumeListeners.add(listener);
  return () => resumeListeners.delete(listener);
}

export function installEditingPause() {
  if (uninstall) {
    return uninstall;
  }
  function resume() {
    if (!paused) {
      return;
    }
    paused = false;
    observer.disconnect();
    Array.from(resumeListeners).forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.warn('Unable to resume background work after editing', error);
      }
    });
  }
  function checkFocus() {
    if (paused && !writableEditor(document.activeElement)) {
      resume();
    }
  }
  const observer = new MutationObserver(checkFocus);
  function start(event) {
    if (!paused && writableEditor(event.target) && writableEditor(document.activeElement)) {
      paused = true;
      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['disabled', 'readonly', 'contenteditable', 'type'],
      });
    }
  }
  function keyDown(event) {
    // Quill handles editing keys itself and can prevent the native input event.
    if (['Enter', 'Backspace', 'Delete'].includes(event.key) ||
        (!event.ctrlKey && !event.metaKey && event.key?.length === 1)) {
      start(event);
    }
  }
  function focusOut() {
    // During focusout activeElement may briefly be body even when another
    // editor receives focus. Window blur keeps its editor focused and paused.
    if (paused) {
      Promise.resolve().then(checkFocus);
    }
  }
  const inputEvents = ['beforeinput', 'input', 'paste', 'cut'];
  inputEvents.forEach((event) => document.addEventListener(event, start, true));
  document.addEventListener('keydown', keyDown, true);
  document.addEventListener('focusin', checkFocus, true);
  document.addEventListener('focusout', focusOut, true);
  uninstall = () => {
    inputEvents.forEach((event) => document.removeEventListener(event, start, true));
    document.removeEventListener('keydown', keyDown, true);
    document.removeEventListener('focusin', checkFocus, true);
    document.removeEventListener('focusout', focusOut, true);
    observer.disconnect();
    uninstall = undefined;
    resume();
  };
  return uninstall;
}
