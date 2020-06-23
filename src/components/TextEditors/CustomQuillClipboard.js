import Quill from 'quill'
import isUrl from 'is-url'
import _ from 'lodash'

const Clipboard = Quill.import('modules/clipboard');
let BlockEmbed = Quill.import('blots/block/embed');
/**
 * The custom quill clipboard disables pasting in images via direct embedding the URL (we don't support
 * cross site scripts like that), and the quill native file upload
 */

function stripImageTags(html){
  const sandbox = document.createElement('div');
  sandbox.innerHTML = html;
  const imageTags = sandbox.getElementsByTagName('img');
  // remove all image tags
  for (let x = 0; x < imageTags.length; x += 1) {
    const image = imageTags[x];
    image.remove();
  }
  const filtered = sandbox.innerHTML;
  return filtered;
}

/// copied from original source code to bring it into scope
function deltaEndsWith(delta, text) {
  let endText = '';
  for (
    let i = delta.ops.length - 1;
    i >= 0 && endText.length < text.length;
    --i // eslint-disable-line no-plusplus
  ) {
    const op = delta.ops[i];
    if (typeof op.insert !== 'string') break;
    endText = op.insert + endText;
  }
  return endText.slice(-1 * text.length) === text;
}
function myMatchNewLine(node, delta, scroll) {
  if (!deltaEndsWith(delta, '\n')) {
    if (isLine(node)) {
      return delta.insert('\n');
    }
    if (delta.length() > 0 && node.nextSibling) {
      let { nextSibling } = node;
      while (nextSibling != null) {
        if (isLine(nextSibling)) {
          return delta.insert('\n');
        }
        const match = scroll.query(nextSibling);
        if (match && match.prototype instanceof BlockEmbed) {
          return delta.insert('\n');
        }
        nextSibling = nextSibling.firstChild;
      }
    }
  }
  return delta;
}
function isLine(node) {
  if (node.childNodes.length === 0) return false; // Exclude embed blocks
  return [
    'address',
    'article',
    'blockquote',
    'canvas',
    'dd',
    'div',
    'dl',
    'dt',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'iframe',
    'li',
    'main',
    'nav',
    'ol',
    'output',
    'p',
    'pre',
    'section',
    'table',
    'td',
    'tr',
    'ul',
    'video',
  ].includes(node.tagName.toLowerCase());
}
const preNodes = new WeakMap();
function isPre(node) {
  if (node == null) return false;
  if (!preNodes.has(node)) {
    if (node.tagName === 'PRE') {
      preNodes.set(node, true);
    } else {
      preNodes.set(node, isPre(node.parentNode));
    }
  }
  return preNodes.get(node);
}

function matchTextWithIndents(node, delta) {
  let text = node.data;
  // Word represents empty line with <o:p>&nbsp;</o:p>
  if (node.parentNode.tagName === 'O:P') {
    return delta.insert(text.trim());
  }
  if (text.trim().length === 0 && text.includes('\n')) {
    return delta;
  }
  if (!isPre(node)) {
    const replacer = (collapse, match) => {
      const replaced = match.replace(/[^\u00a0]/g, ''); // \u00a0 is nbsp;
      return replaced.length < 1 && collapse ? ' ' : replaced;
    };
    text = text.replace(/\r\n/g, ' ').replace(/\n/g, ' ');
 //   text = text.replace(/\s\s+/g, replacer.bind(replacer, true)); // collapse whitespace
    if (
      (node.previousSibling == null && isLine(node.parentNode)) ||
      (node.previousSibling != null && isLine(node.previousSibling))
    ) {
      text = text.replace(/^\s+/, replacer.bind(replacer, false));
    }
    if (
      (node.nextSibling == null && isLine(node.parentNode)) ||
      (node.nextSibling != null && isLine(node.nextSibling))
    ) {
      text = text.replace(/\s+$/, replacer.bind(replacer, false));
    }

  }

  return delta.insert(text);
}

class CustomQuillClipboard extends Clipboard {

  constructor(quill, options) {
    // override the original matchers to deal better with indents
    super(quill, options);
    // remove all the text node matchers so we can add ours back in
    this.matchers = this.matchers.filter((matcher) => {
      const [selector,] = matcher;
      return selector !== Node.TEXT_NODE;
    });
    this.matchers = [...this.matchers, [Node.TEXT_NODE, matchTextWithIndents], [Node.TEXT_NODE, myMatchNewLine]];
  }

  onCapturePaste(e) {
    // mostly cribbed from the real implementation
    // at https://github.com/quilljs/quill/blob/develop/modules/clipboard.js
    if (e.defaultPrevented || !this.quill.isEnabled()) return;
    e.preventDefault();
    const range = this.quill.getSelection(true);
    if (range == null) return;
    const html = e.clipboardData.getData('text/html');
    let filteredHtml = stripImageTags(html);
    let text = e.clipboardData.getData('text/plain');
    const name = this.quill.getUrlName(text);
    if (_.isEmpty(filteredHtml) || !_.isEmpty(name)){
      if(isUrl(text)){
        const encoded = encodeURI(text);
        if (name) {
          filteredHtml = `<a target="_self" href="${encoded}">${name}</a>`;
        }
        else {
          filteredHtml = `<a href="${encoded}">${text}</a>`;
        }
        text = undefined;
      }
    }

    this.onPaste(range, { html: filteredHtml, text });
  }




}

export default CustomQuillClipboard;
