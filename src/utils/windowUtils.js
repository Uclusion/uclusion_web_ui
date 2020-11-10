export function isTinyWindow(){
  return window.outerWidth < 600;
}

export function doSetEditWhenValid(isEdit, isEditableByUser, setBeingEdited, id, event) {
  if (isEdit) {
    if (event && event.target && event.target.localName === 'a') {
      return;
    }
    const selection = window.getSelection();
    if (selection && selection.type === 'Range') {
      return;
    }
    if (isEditableByUser()) {
      const headerEl = document.getElementById('app-header');
      const headerHeight = headerEl.scrollHeight;
      window.scroll(0, headerHeight);
      setBeingEdited(id);
    }
  } else {
    setBeingEdited(undefined);
  }
}