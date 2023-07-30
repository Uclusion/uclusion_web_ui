import { navigate, preventDefaultAndProp } from './marketIdPathFunctions'
import _ from 'lodash';

//Only use if media query not available
export function isTinyWindow(){
  return window.outerWidth < 600;
}

export function allImagesLoaded(node, imageFiles){
  if (!node || !imageFiles) {
    return true;
  }
  const images = node.querySelectorAll("img");
  const missingImages = imageFiles.filter((fileUpload) => {
    const { path } = fileUpload;
    for (let x=0; x < images.length; x++) {
      const item = images.item(x);
      if (item.complete && item.src?.includes(path)) {
        return false;
      }
    }
    return true;
  })
  return _.isEmpty(missingImages);
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