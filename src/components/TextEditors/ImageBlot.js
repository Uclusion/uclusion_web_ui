import Quill from "quill";
import { tokensHashHack } from '../../contexts/MarketsContext/MarketsContext'

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