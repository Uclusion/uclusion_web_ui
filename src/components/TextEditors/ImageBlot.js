import Quill from "quill";
import { tokensHashHack } from '../../contexts/MarketsContext/MarketsContext'
import _ from 'lodash'

const OUR_CLOUDFRONT_FILE_PATTERN = /https:\/\/\w+.cloudfront.net\/(\w{8}(-\w{4}){3}-\w{12})\/\w{8}(-\w{4}){3}-\w{12}.*/i;
const OUR_CND_DOMAIN_ENDING = 'imagecdn.uclusion.com';
const Image = Quill.import('formats/image');

export function convertImageSrc(value) {
  const match = value.match(OUR_CLOUDFRONT_FILE_PATTERN);
  const cdnMatch = value.includes(OUR_CND_DOMAIN_ENDING);
  if (match || cdnMatch) {
    const urlObj = new URL(value);
    const pathId = urlObj.pathname.split('/')[1];
    const marketKey = `MARKET_${pathId}`;
    const homeAccountKey = 'ACCOUNT_home_account';
    if (_.isEmpty(tokensHashHack)) {
      console.error(`Empty tokens hash for ${value}`);
      return undefined;
    }
    const token = tokensHashHack[marketKey] ? tokensHashHack[marketKey] : tokensHashHack[homeAccountKey];
    if (!token) {
      console.error(`No token for ${value}, ${marketKey}, ${homeAccountKey}, and ${JSON.stringify(tokensHashHack)}`);
      return undefined;
    }
    urlObj.searchParams.set('authorization', token);
    return urlObj.toString();
  }
  return undefined;
}

/**
 * Function used for read only quill editors. The replacement of spaces
 * is not safe in any other context
 * @param htmlStr the unprocessed string to insert into the innerHTML of the editor
 * @returns a string safe to use in the innerHTML of the editor
 */
export function convertHTMLString(htmlStr) {
  const parser = new DOMParser();
  // convert html string into DOM
  const document = parser.parseFromString(htmlStr, "text/html");
  const imgs = document.getElementsByTagName("img") || [];
  [...imgs].forEach((img) => {
    const converted = convertImageSrc(img.src);
    if (converted !== undefined) {
      img.src = converted;
    }
  });
  // const text = document.documentElement.innerHTML;
  // TODO: this _should_ be working with CSS, and we don't need to do this.
  //const whitespacePreserved = text.replace(/ /g, '&nbsp');
  //return whitespacePreserved;
  // TODO above replaces inside tags also. Either have to make CSS work or exclude spaces inside tags
  return document.body.innerHTML;
}

class ImageBlot extends Image {
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'string') {
      const newValue = convertImageSrc(value);
      if (newValue !== undefined) {
        node.setAttribute('src', newValue);
      }
    }
    return node;
  }
}

export default ImageBlot;