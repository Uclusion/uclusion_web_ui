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

function stripHTML(foundSubstring) {
  if (foundSubstring) {
    const htmlRemoved = foundSubstring.replace(/(<([^>]+)>)/ig,'');
    if (htmlRemoved) {
      return htmlRemoved.trim();
    }
  }
  return undefined;
}

export function convertDescription(description, maxLength = 80) {
  const nameDescriptionMap = { name: undefined, description };
  if (_.isEmpty(description)) {
    return nameDescriptionMap;
  }
  const list = ["p", "li", "td", "h"];
  let found = -1;
  let latestExtract = undefined;
  let latestDescription = undefined;
  list.forEach((htmlComponent) => {
    const entry = `</${htmlComponent}>`;
    const parts = description.split(entry) || [];
    if (parts.length >= 2) {
      parts.forEach((part) => {
        if (!_.isEmpty(part)) {
          const index = description.indexOf(part);
          let extracted = stripHTML(part);
          if (!_.isEmpty(extracted)) {
            const subIndex = extracted.indexOf(". ");
            const isSubIndex = subIndex > 0;
            if (isSubIndex) {
              extracted = extracted.substring(0, subIndex + 1);
            }
            if (extracted.length <= maxLength) {
              if (found < 0 || index < found || (index === found &&
                (!latestExtract || extracted.length < latestExtract.length))) {
                latestExtract = extracted;
                let indexAfter = description.substring(index).indexOf(entry);
                if (isSubIndex) {
                  const subIndexAfter = description.substring(index).indexOf(". ");
                  indexAfter = index + subIndexAfter + 2;
                }
                const entryBeginElement = `<${htmlComponent}>`;
                const beforePartIndex = description.substring(0, index).lastIndexOf(entryBeginElement)
                latestDescription = `${description.substring(0, beforePartIndex + entryBeginElement.length + 1)}...${description.substring(indexAfter)}`;
                const emptyAmpersand = `<${htmlComponent}>...</${htmlComponent}>`;
                if (latestDescription.indexOf(emptyAmpersand) === 0) {
                  latestDescription = latestDescription.substring(emptyAmpersand.length);
                }
                found = index;
              }
            }
          }
        }
      });
    }
  });
  if (latestExtract) {
    nameDescriptionMap.name = latestExtract;
    nameDescriptionMap.description = latestDescription;
  }
  return nameDescriptionMap;
}

export function nameFromDescription(description) {
  const { name } = convertDescription(description, 80);
  return name;
}