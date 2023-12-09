import Quill from 'quill'
import isUrl from 'is-url'
import _ from 'lodash'
import { getNameForUrl, getUrlForTicketPath } from '../../utils/marketIdPathFunctions';
import { isTicketPath } from '../../contexts/TicketContext/ticketIndexContextHelper';
import { ticketContextHack } from '../../contexts/TicketContext/TicketIndexContext';
import { marketsContextHack } from '../../contexts/MarketsContext/MarketsContext';
import { commentsContextHack } from '../../contexts/CommentsContext/CommentsContext'

const Clipboard = Quill.import('modules/clipboard');
/**
 * The custom quill clipboard disables pasting in images via direct embedding the URL
 * if they don't originate with us, (we don't support
 * cross site scripts like that), and the quill native file upload
 */

function stripDangerousImageTags(html){
  const sandbox = document.createElement('div');
  sandbox.innerHTML = html;
  const imageTags = sandbox.getElementsByTagName('img');
  // remove all image tags
  for (let x = 0; x < imageTags.length; x += 1) {
    const image = imageTags[x];
    image.remove();
  }

  return sandbox.innerHTML;
}

// NOTE: We currently allow copying and pasting the image tag for our own images
// this WILL break if you paste across markets because what we need to do there
// is reupload the original to the new market.
class CustomQuillClipboard extends Clipboard {


  onCapturePaste(e) {
    // mostly cribbed from the real implementation
    // at https://github.com/quilljs/quill/blob/develop/modules/clipboard.js
    if (e.defaultPrevented || !this.quill.isEnabled()) return;
    e.preventDefault();
    const range = this.quill.getSelection(true);
    if (range == null) return;
    const html = e.clipboardData.getData('text/html');
    let filteredHtml = stripDangerousImageTags(html);
    let text = e.clipboardData.getData('text/plain');
    if(isUrl(text)){
      const name = getNameForUrl(text);
      let url = text;
      const urlParts = new URL(url);
      if (isTicketPath(urlParts.pathname)) {
        const urlFromTicket = getUrlForTicketPath(urlParts.pathname, ticketContextHack, marketsContextHack,
          commentsContextHack);
        if (urlFromTicket) {
          url = urlFromTicket;
        }
      }
      if (_.isEmpty(filteredHtml) || !_.isEmpty(name)){
        if (name) {
          filteredHtml = `<a target="_self" href="${url}">${name}</a>`;
        }
        else {
          filteredHtml = `<a href="${url}">${text}</a>`;
        }
        text = undefined;
      }
    }
    if (text && filteredHtml) {
      this.onPaste(range, { html: filteredHtml, text });
    } else if (filteredHtml) {
      this.onPaste(range, { html: filteredHtml });
    } else if (text) {
      this.onPaste(range, { text });
    }
  }




}

export default CustomQuillClipboard;
