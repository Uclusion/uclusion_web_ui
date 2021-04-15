export function isTinyWindow(){
  return window.outerWidth < 600;
}

export function invalidEditEvent(event) {
  const selection = window.getSelection();
  if (selection && selection.type === 'Range') {
    return true;
  }
  return event && event.target && event.target.localName === 'a';
}

export function doSetEditWhenValid(isEdit, isEditableByUser, setBeingEdited, event) {
  if (isEdit) {
    if (invalidEditEvent(event)) {
      return;
    }
    if (isEditableByUser()) {
      setBeingEdited(true);
    }
  } else {
    setBeingEdited(undefined);
  }
}