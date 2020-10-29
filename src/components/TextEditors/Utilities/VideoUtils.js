/**
 * Converts a passed in video link to one that can be embedded in an iframe
 * @param link the link to the video
 * @returns {string} a embeddable version of the link
 */
export function embeddifyVideoLink(link){
  // if you pass me something useless, I'm just going to give it back
  if (!link){
    return link;
  }
  // rework loom links
  if (link.includes('loom.com/share')) {
    return link.replace('loom.com/share', 'loom.com/embed');
  }
  // and youtube or vimeo
  return embeddifyYoutubeOrVimeo(link);
}

/**
 * Embedifies youtube or vimeo links
 * Stollen from https://github.com/quilljs/quill/blob/9a77567fe356d384074df7479c33ceac509d9351/themes/base.js
 * @param link the link to render embeddable
 * @returns {string|*} the embeddable version of the passed in link
 */
function embeddifyYoutubeOrVimeo(link) {
  let match =
    link.match(
      /^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/,
    ) ||
    link.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `${match[1] || 'https'}://www.youtube.com/embed/${
      match[2]
    }?showinfo=0`;
  }
  // eslint-disable-next-line no-cond-assign
  if ((match = link.match(/^(?:(https?):\/\/)?(?:www\.)?vimeo\.com\/(\d+)/))) {
    return `${match[1] || 'https'}://player.vimeo.com/video/${match[2]}/`;
  }
  return link;
}