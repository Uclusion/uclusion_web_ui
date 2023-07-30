import { navigate, preventDefaultAndProp } from './marketIdPathFunctions'

//Only use if media query not available
export function isTinyWindow(){
  return window.outerWidth < 600;
}
// allImagesLoaded can probably be somewhere else, but this is the best place I Could find to put it
export function allImagesLoaded(node){
  if(!node){
    return true;
  }
  const images = node.querySelectorAll("img");
  for(let x=0; x < images.length; x++) {
    if(!images.item(x).complete){
      return false;
    }
  }
  return true;
}

export function invalidEditEvent(event, history) {
  const selection = window.getSelection();
  if (selection && selection.type === 'Range') {
    return true;
  }
  const isLink = event?.target?.localName === 'a';
  if (isLink && event?.target?.href?.includes(window.location.host)) {
    preventDefaultAndProp(event);
    // Hacky but the url can be modified on storage so intercept here
    navigate(history, `${event.target.pathname}${event.target.search}${event.target.hash}`);
  }
  return isLink || event === true;
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