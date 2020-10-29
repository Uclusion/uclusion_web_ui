import Quill from 'quill';

/**
 * Reworks the Quill Link sanitizer to add https etc if it's missing from
 * the original link
 */
export function addQuillLinkFixer () {
  const Link = Quill.import('formats/link');
  var builtinSanitizer = Link.sanitize;
  Link.sanitize = function (originalLinkValue) {
    let linkValue = originalLinkValue;
    // do nothing, since this implies user's already using a custom protocol
    if (/^\w+:/.test(linkValue)) {
      return builtinSanitizer.call(this, linkValue);
    }
    return builtinSanitizer.call(this, 'https://' + linkValue);
  };
}