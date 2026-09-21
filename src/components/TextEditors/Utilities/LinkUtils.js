import Quill from 'quill';
import config from '../../../config';
import { isUrlToResolvedComment } from '../../../utils/marketIdPathFunctions';

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
    return node;
  }
}