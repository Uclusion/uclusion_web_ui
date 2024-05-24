import Quill from 'quill';

const Link = Quill.import('formats/link');

export class MyLink extends Link {
  static create(value) {
    const node = super.create(value);
    if (!value?.startsWith('http')) {
      // See https://github.com/quilljs/quill/issues/1139 on removing target for internal links
      node.removeAttribute('target');
    }
    return node;
  }
}