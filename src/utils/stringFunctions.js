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

function extractName(foundSubstring) {
  if (foundSubstring) {
    const htmlRemoved = foundSubstring.replace(/(<([^>]+)>)/ig,'');
    if (htmlRemoved) {
      const candidate = htmlRemoved.trim();
      if (candidate.length > 250) {
        return candidate.substring(0, 250) + '...';
      }
      return candidate;
    }
  }
  return undefined;
}

export function nameFromDescription(description) {
  if (_.isEmpty(description)) {
    return undefined;
  }
  const list = ["</p>", "</li>", "</td>", "</h>", ". "];
  let found = -1;
  let latestExtract = extractName(description);
  list.forEach((entry) => {
    const parts = description.split(entry) || [];
    if (parts.length >= 2) {
      parts.forEach((part) => {
        if (!_.isEmpty(part)) {
          const index = description.indexOf(part);
          const extracted = extractName(part);
          if (!_.isEmpty(extracted)) {
            if (found < 0 || index < found || (index === found &&
              (!latestExtract || extracted.length < latestExtract.length))) {
              latestExtract = extracted;
              found = index;
            }
          }
        }
      });
    }
  });
  return latestExtract;
}

export function getFakeCommentsArray(comments) {
  if (_.isEmpty(comments)) {
    return [{id: 'fake'}];
  }
  return comments;
}