import { navigate, preventDefaultAndProp, rememberLinkSource } from './marketIdPathFunctions'
import _ from 'lodash';

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

function getClickedLink(event) {
  return event?.target?.closest?.('a');
}

/**
 * J-all-486: every in-app link in saved rich text navigates through here, whether or not the reader
 * can edit that text, so header Back always gets the spot the link was clicked from. Only a plain
 * click is taken; a modified click is left to the browser to open a new tab or window.
 */
export function handleRichTextLinkClick(event, history) {
  const link = getClickedLink(event);
  if (!link?.getAttribute('href') || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey
    || event.altKey || new URL(link.href).host !== window.location.host) {
    return;
  }
  preventDefaultAndProp(event);
  rememberLinkSource(link);
  // Hacky but the url can be modified on storage so intercept here
  navigate(history, `${link.pathname}${link.search}${link.hash}`);
}

export function invalidEditEvent(event) {
  const selection = window.getSelection();
  if (selection && selection.type === 'Range') {
    return true;
  }
  // A link click is never an edit; handleRichTextLinkClick or the browser follows the link.
  return !!getClickedLink(event) || event === true;
}