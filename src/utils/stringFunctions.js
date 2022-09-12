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
  const list = ["p", "li", "td", "h1", "h2"];
  let found = -1;
  let latestExtract = undefined;
  let latestDescription = undefined;
  list.forEach((htmlComponent) => {
    const entryBeginElement = `<${htmlComponent}>`;
    const entryEndElement = `</${htmlComponent}>`;
    const parts = description.split(entryBeginElement) || [];
    //console.debug(parts)
    //console.debug(entryEndElement)
    if (parts.length >= 2) {
      parts.forEach((wholePart) => {
        if (!_.isEmpty(wholePart) && wholePart.includes(entryEndElement)) {
          const index = description.indexOf(wholePart);
          const part = wholePart.substring(0, wholePart.indexOf(entryEndElement));
          let extracted = stripHTML(part);
          if (!_.isEmpty(extracted)) {
            const subIndex = extracted.indexOf(". ");
            const isSubIndex = subIndex > 0;
            if (isSubIndex) {
              extracted = extracted.substring(0, subIndex + 1);
            }
            if (extracted.length <= maxLength) {
              //console.debug(`index is ${index} and found is ${found}`)
              if (found < 0 || index < found || (index === found &&
                (!latestExtract || extracted.length < latestExtract.length))) {
                latestExtract = extracted;
                let indexAfter = description.substring(index).indexOf(entryEndElement);
                if (isSubIndex) {
                  const subIndexAfter = description.substring(index).indexOf(". ");
                  indexAfter = index + subIndexAfter + 2;
                }
                let beforePartIndex = description.substring(0, index).lastIndexOf(entryBeginElement);
                if (beforePartIndex < 0) {
                  beforePartIndex = 0;
                }
                //console.debug(`${beforePartIndex} ${entryBeginElement}`)
                latestDescription = `${description.substring(0, beforePartIndex + entryBeginElement.length)}...${description.substring(indexAfter)}`;
                //Remove html from the part between the components to avoid dangling or unclosed html
                const endElementPosition = latestDescription.indexOf(entryEndElement);
                const latestDescriptionInnerStripped = stripHTML(latestDescription.substring(entryBeginElement.length, endElementPosition));
                latestDescription = `${entryBeginElement}${latestDescriptionInnerStripped}${latestDescription.substring(endElementPosition)}`;
                const emptyAmpersand = `${entryBeginElement}...${entryEndElement}`;
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