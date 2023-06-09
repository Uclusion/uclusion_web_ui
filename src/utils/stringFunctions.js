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

function decode(str) {
  const txt = new DOMParser().parseFromString(str, "text/html");
  return txt.documentElement.textContent;
}

function stripHTML(foundSubstring) {
  if (foundSubstring) {
    const htmlRemoved = decode(foundSubstring);
    if (htmlRemoved) {
      return htmlRemoved.trim();
    }
  }
  return undefined;
}

function processForName(htmlElementNames, description) {
  const elements = [];
  htmlElementNames.forEach((htmlComponent) => {
    const entryBeginElement = `<${htmlComponent}>`;
    const entryEndElement = `</${htmlComponent}>`;
    if ((description || '').includes(entryEndElement)) {
      const parts = description.split(entryEndElement) || [];
      parts.forEach((aPart) => {
        if (!_.isEmpty(aPart)) {
          let fullElement = aPart.substring(aPart.indexOf(entryBeginElement));
          if (!fullElement.endsWith(entryEndElement)) {
            fullElement += entryEndElement;
          }
          const strippedElement = stripHTML(fullElement);
          if (!_.isEmpty(strippedElement)) {
            const hasInteriorHtml = strippedElement.length <
              fullElement.length - entryBeginElement.length - entryEndElement.length;
            elements.push({ strippedElement, fullElement, hasInteriorHtml });
          }
        }
      });
    }
  });
  return elements;
}

function removePrefix(fullElement, description) {
  if (!description.startsWith(fullElement)) {
    return description;
  }
  const candidate = description.substring(fullElement.length);
  if (_.isEmpty(stripHTML(candidate))) {
    return "";
  }
  return candidate;
}

function addSentenceAwareAmpersandRemoveDuplicate(strippedElement, description, maxLength, fullElement,
  isFallbackFullDescription) {
  let extracted = strippedElement || '';
  if (extracted.length <= maxLength) {
    if (fullElement) {
      return { name: extracted, description: removePrefix(fullElement, description) };
    }
    return { name: extracted, description };
  }
  const sentencePosition = extracted.indexOf('.');
  if (sentencePosition > 0) {
    extracted = extracted.substring(0, sentencePosition + 1);
  }
  if (extracted.length <= maxLength) {
    let splitDescription = description.substring(3 + extracted.length);
    if (splitDescription.startsWith(' ')) {
      splitDescription = splitDescription.substring(1);
    }
    return { name: extracted, description: `<p>${splitDescription}` };
  }
  let lastIndex = extracted.lastIndexOf(' ', maxLength - 3);
  if (lastIndex < 0) {
    lastIndex = maxLength - 3;
  }
  extracted = extracted.substring(0, lastIndex);
  if (isFallbackFullDescription) {
    return { name: `${extracted}...`, description };
  }
  let splitDescription = description.substring(3 + extracted.length);
  if (splitDescription.startsWith(' ')) {
    splitDescription = splitDescription.substring(1);
  }
  return { name: `${extracted}...`, description: `<p>...${splitDescription}` };
}

export function convertDescription(description, maxLength = 80) {
  const nameDescriptionMap = { name: undefined, description };
  if (_.isEmpty(description)) {
    return nameDescriptionMap;
  }

  const hElements = processForName(["h1", "h2"], description);
  const startsWithHElement = hElements.find((element) => element.isStartsWith);
  if (startsWithHElement) {
    return addSentenceAwareAmpersandRemoveDuplicate(startsWithHElement.strippedElement, description, maxLength,
      startsWithHElement.fullElement, true);
  }
  const notStartsWithHElement = hElements.find((element) => !element.isStartsWith);
  if (notStartsWithHElement) {
    return addSentenceAwareAmpersandRemoveDuplicate(notStartsWithHElement.strippedElement, description, maxLength,
      undefined, true);
  }

  const pElements = processForName(["p"], description);
  if (!_.isEmpty(pElements)) {
    const firstPElement = pElements[0];
    const { hasInteriorHtml } = firstPElement;
    if (hasInteriorHtml) {
      const interiorElments = processForName(["li", "td"], firstPElement.fullElement);
      if (!_.isEmpty(interiorElments)) {
        // collapsing a table into the name doesn't make sense but can take a row out of it
        const firstInterior = interiorElments[0];
        return addSentenceAwareAmpersandRemoveDuplicate(firstInterior.strippedElement, description, maxLength,
          undefined, true);
      }
      // This includes b and i interior elements - duplicate them in the description so meaning not lost
      return addSentenceAwareAmpersandRemoveDuplicate(firstPElement.strippedElement, description, maxLength,
        undefined, true);
    }
    return addSentenceAwareAmpersandRemoveDuplicate(firstPElement.strippedElement, description, maxLength,
      firstPElement.fullElement);
  }

  // Could be no p element and just a table
  const outsideElements = processForName(["li", "td"], description);
  if (!_.isEmpty(outsideElements)) {
    const firstOutside = outsideElements[0];
    return addSentenceAwareAmpersandRemoveDuplicate(firstOutside.strippedElement, description, maxLength,
      undefined, true);
  }

  return nameDescriptionMap;
}

export function nameFromDescription(description, maxLength = 80) {
  const { name } = convertDescription(description, maxLength);
  return name;
}