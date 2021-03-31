export function isTinyWindow(){
  return window.outerWidth < 600;
}

export function invalidEditEvent(event) {
  return event && event.target && event.target.localName === 'a';
}

export function doSetEditWhenValid(isEdit, isEditableByUser, setBeingEdited, id, event) {
  if (isEdit) {
    if (invalidEditEvent(event)) {
      return;
    }
    const selection = window.getSelection();
    if (selection && selection.type === 'Range') {
      return;
    }
    if (isEditableByUser()) {
      window.scrollTo(0, 0);
      setBeingEdited(id);
    }
  } else {
    setBeingEdited(undefined);
  }
}