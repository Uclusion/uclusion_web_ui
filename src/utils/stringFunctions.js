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

export function getTicketNumber(ticketCode) {
  return ticketCode ? ticketCode.substring(ticketCode.lastIndexOf('-')+1) : undefined;
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

function largestIndexOf(extracted, separator, maxLength) {
  const largest = extracted.lastIndexOf(separator, maxLength);
  if (largest < 0) {
    // Could not find anything within maxLength so give up
    return largest;
  }
  if (separator.includes('.')) {
    // If it's a sentence then stop on first which is guaranteed less than maxLength by above
    return extracted.indexOf(separator);
  }
  // Otherwise get as much as possible hoping for context
  return largest;
}

function matchingIndexOf(extracted, maxLength, description, index, separator, part ) {
  const indexSubstring = description.substring(index);
  const subIndexAfter = separator.includes('.') ? indexSubstring.indexOf(separator)
    : indexSubstring.lastIndexOf(separator, maxLength + (part.length - extracted.length));
  return index + subIndexAfter + separator.length;
}

function getBestSeparatorLocation(extracted, index, description, separator, maxLength, part) {
  const indexMap = { subIndex: -1, descriptionSubIndex: -1 };

  const subIndex = largestIndexOf(extracted, separator, maxLength);

  if (subIndex < 0) {
    return indexMap;
  }

  const descriptionSubIndex = matchingIndexOf(extracted, maxLength, description, index, separator, part);

  if (descriptionSubIndex < 0) {
    return indexMap;
  }

  return { subIndex, descriptionSubIndex };
}

function convertDescriptionForSeparator(description, separator, maxLength = 80) {
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
    if (parts.length >= 2) {
      parts.forEach((wholePart) => {
        if (!_.isEmpty(wholePart) && wholePart.includes(entryEndElement)) {
          const index = description.indexOf(wholePart);
          const part = wholePart.substring(0, wholePart.indexOf(entryEndElement));
          let extracted = stripHTML(part);
          if (!_.isEmpty(extracted)) {
            const { subIndex, descriptionSubIndex } = getBestSeparatorLocation(extracted, index, description,
              separator, maxLength, part);
            const isSubIndex = subIndex > 0;
            if (isSubIndex) {
              extracted = extracted.substring(0, subIndex + 1);
            }
            if (extracted.length <= maxLength) {
              if (found < 0 || index < found || (index === found &&
                (!latestExtract || extracted.length < latestExtract.length))) {
                latestExtract = extracted;
                let indexAfter = index + description.substring(index).indexOf(entryEndElement);
                if (isSubIndex) {
                  indexAfter = descriptionSubIndex;
                }
                let beforePartIndex = description.substring(0, index).lastIndexOf(entryBeginElement);
                if (beforePartIndex < 0) {
                  beforePartIndex = 0;
                }
                latestDescription = `${description.substring(0, beforePartIndex + entryBeginElement.length)}...${description.substring(indexAfter)}`;
                //Remove html from the part between the components to avoid dangling or unclosed html
                const endElementPosition = latestDescription.indexOf(entryEndElement);
                const endElementPart = latestDescription.substring(entryBeginElement.length, endElementPosition);
                if (endElementPart.indexOf('<img') < 0) {
                  // Only strip out html if no img tags
                  const latestDescriptionInnerStripped = stripHTML(endElementPart);
                  latestDescription = `${entryBeginElement}${latestDescriptionInnerStripped}${latestDescription.substring(endElementPosition)}`;
                }
                const emptyAmpersand = `${entryBeginElement}...${entryEndElement}`;
                // replaceAll not supported when running jest so use this syntax
                latestDescription = latestDescription.split(emptyAmpersand).join('');
                if (latestExtract.endsWith(' ')) {
                  latestExtract = `${latestExtract.substring(0, latestExtract.length - 1)}...`;
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

export function convertDescription(description, maxLength = 80) {
  const nameDescriptionMap = convertDescriptionForSeparator(description, ". ", maxLength);
  const { name } = nameDescriptionMap;
  if (!_.isEmpty(name)) {
    return nameDescriptionMap;
  }
  // Substract 3 to allow for ampersand
  return convertDescriptionForSeparator(description, " ", maxLength - 3);
}

export function nameFromDescription(description) {
  const { name } = convertDescription(description, 80);
  return name;
}