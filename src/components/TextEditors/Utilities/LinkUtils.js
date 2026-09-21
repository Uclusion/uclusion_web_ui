import Quill from 'quill';
import config from '../../../config';
import { getLinkTargetName, isUrlToResolvedComment } from '../../../utils/marketIdPathFunctions';

const Link = Quill.import('formats/link');

export class MyLink extends Link {
  static create(value) {
    const node = super.create(value);
    if (!value?.startsWith('http')||value?.startsWith(config.ui_base_url)) {
      // See https://github.com/quilljs/quill/issues/1139 on removing target for internal links
      node.removeAttribute('target');
    }
    if (isUrlToResolvedComment(value)) {
      // T-all-1704: strike through the name of a link to a resolved comment
      node.style.textDecoration = 'line-through';
    }
    // S-all-321: short code links read as their code, so the target's title is shown
    // on hover. Resolved on each hover rather than at render, so it follows a rename
    // and so a body full of links costs nothing until one is pointed at.
    node.addEventListener('mouseenter', () => {
      const name = getLinkTargetName(value);
      if (name) {
        node.setAttribute('title', name);
      } else {
        node.removeAttribute('title');
      }
    });
    return node;
  }
}