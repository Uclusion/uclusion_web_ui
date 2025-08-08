import Quill from 'quill';
import config from '../../../config';

const Link = Quill.import('formats/link');

export class MyLink extends Link {
  static create(value) {
    const node = super.create(value);
    if (!value?.startsWith('http')||value?.startsWith(config.ui_base_url)) {
      // See https://github.com/quilljs/quill/issues/1139 on removing target for internal links
      node.removeAttribute('target');
    }
    return node;
  }
}