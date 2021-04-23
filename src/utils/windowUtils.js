import { navigate } from './marketIdPathFunctions'

export function isTinyWindow(){
  return window.outerWidth < 600;
}

export function invalidEditEvent(event, history) {
  const selection = window.getSelection();
  if (selection && selection.type === 'Range') {
    return true;
  }
  const isLink = event && event.target && event.target.localName === 'a';
  if (isLink && event.target.href && event.target.href.includes(window.location.host)) {
    event.stopPropagation();
    event.preventDefault();
    // Hacky but the url can be modified on storage so intercept here
    navigate(history, event.target.pathname);
  }
  return isLink;
}

export function doSetEditWhenValid(isEdit, isEditableByUser, setBeingEdited, event, history) {
  if (isEdit) {
    if (invalidEditEvent(event, history)) {
      return;
    }
    if (isEditableByUser()) {
      setBeingEdited(true);
    }
  } else {
    setBeingEdited(undefined);
  }
}