import _ from 'lodash';
/**
 * Returns the first letter of each part of the name
 * capitalized, for use in avatars
 * @param name
 */
export function nameToAvatarText(name) {
  const chunks = name.split(' ');
  const firstLetters = chunks.reduce((acc, chunk) => {
    if (!_.isEmpty(chunk)) {
      return acc + chunk.charAt(0);
    }
    return acc;
  }, "");
  return firstLetters.toUpperCase();
}

export function nameFromDescription(description) {
  const list = ["</p", "</li", "</td", "</h"];
  let found = -1;
  for (let i = 0, len = list.length; i < len; i++) {
    let index = description.indexOf(list[i]);
    if (index >= 0) {
      if (found < 0 || index < found) found = index;
    }
  }
  if (found >= 0) {
    const foundSubstring = description.substring(0, found);
    if (foundSubstring) {
      const htmlRemoved = foundSubstring.replace(/(<([^>]+)>)/ig,'');
      if (htmlRemoved) {
        return htmlRemoved.trim();
      }
    }
  }
  return undefined;
}