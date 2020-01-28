import Quill from 'quill';

const Clipboard = Quill.import('modules/clipboard');

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

class CustomQuillClipboard extends Clipboard {

  onCapturePaste(e) {
    // mostly cribbed from the real implementation
    // at https://github.com/quilljs/quill/blob/develop/modules/clipboard.js
    if (e.defaultPrevented || !this.quill.isEnabled()) return;
    e.preventDefault();
    const range = this.quill.getSelection(true);
    if (range == null) return;
    const html = e.clipboardData.getData('text/html');
    const filteredHtml = stripImageTags(html);
    const text = e.clipboardData.getData('text/plain');
    this.onPaste(range, { html: filteredHtml, text });
  }
}

export default CustomQuillClipboard;
