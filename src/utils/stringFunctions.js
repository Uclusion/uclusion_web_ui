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

export function getTicketNumber(ticketCode, isAutonomous=false, groupName) {
  if (isAutonomous && ticketCode) {
    const decodedCode = decodeURI(ticketCode);
    if (!decodedCode.includes(groupName)) {
      const removeOne = ticketCode.substring(ticketCode.indexOf('-')+1);
      return removeOne.substring(0, removeOne.indexOf('-'));
    }
  }
  return undefined;
}

function decode(str) {
  const txt = new DOMParser().parseFromString(str, "text/html");
  return txt.documentElement.textContent;
}

function stripHTMLNoTrim(foundSubstring) {
  if (foundSubstring) {
    const processedSubstring = foundSubstring.replace("</p><p>", "</p> <p>");
    const htmlRemoved = decode(processedSubstring);
    if (htmlRemoved) {
      return htmlRemoved;
    }
  }
  return undefined;
}

export function stripHTML(foundSubstring) {
  if (foundSubstring) {
    const processedSubstring = foundSubstring.replace("</p><p>", "</p> <p>");
    const htmlRemoved = decode(processedSubstring);
    if (htmlRemoved) {
      return htmlRemoved.trim();
    }
  }
  return undefined;
}

export function isLargeDisplay(description, linesAllowed=3) {
  if (_.isEmpty(description)) {
    return false;
  }
  const forbiddenList = ['img', 'table', 'tr', 'td', 'tbody', 'th'];
  const singleRootedList = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'li', 'ol', 'ul'];
  let txt = new DOMParser().parseFromString(description, "text/html");
  let rootCount = 0;
  singleRootedList.forEach((tag) => {
    const elements = txt.getElementsByTagName(tag);
    rootCount += elements.length;
  });
  if (rootCount > linesAllowed) {
    return true;
  }
  rootCount = 0;
  forbiddenList.forEach((tag) => {
    const elements = txt.getElementsByTagName(tag);
    rootCount += elements.length;
  });
  if (rootCount > 0) {
    return true;
  }
  const stripped = stripHTML(description);
  return stripped?.length > linesAllowed*90;
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
          let strippedElementFull = stripHTMLNoTrim(fullElement);
          if (!_.isEmpty(strippedElementFull)) {
            const hasInteriorHtml = strippedElementFull.length <
              fullElement.length - entryBeginElement.length - entryEndElement.length;
            const strippedElement = strippedElementFull.trim();
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

function indexOfOrOutofBounds(extracted, aChar) {
  return extracted.indexOf(aChar) > 0 ? extracted.indexOf(aChar) : extracted.length;
}

function addSentenceAwareAmpersandRemoveDuplicate(strippedElement, description, maxLength, fullElement,
  isFallbackFullDescription) {
  let extracted = strippedElement || '';
  const endsInSentence = extracted.endsWith('.') || extracted.endsWith('!') || extracted.endsWith('?');
  if (extracted.length <= maxLength && (endsInSentence || isFallbackFullDescription)) {
    if (fullElement) {
      return { name: extracted, description: removePrefix(fullElement, description) };
    }
    return { name: extracted, description };
  }
  const periodPosition = indexOfOrOutofBounds(extracted, '. ');
  const exclamationPosition = indexOfOrOutofBounds(extracted, '! ');
  const questionPosition = indexOfOrOutofBounds(extracted, '? ');
  const sentencePosition = Math.min(periodPosition, exclamationPosition, questionPosition);
  let extractedNotTrimmed = extracted;
  if (sentencePosition < extracted.length) {
    extractedNotTrimmed = extracted.substring(0, sentencePosition + 2);
    extracted = extracted.substring(0, sentencePosition + 1);
  }
  if (extracted.length <= maxLength) {
    if (isFallbackFullDescription) {
      if (description.includes(extractedNotTrimmed)) {
        return { name: extracted, description: description.replace(extractedNotTrimmed, '') };
      }
      return { name: extracted, description };
    }
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

function convertProcessedDescription(description, maxLength = 80) {
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
      const interiorElements = processForName(["li", "td"], firstPElement.fullElement);
      if (!_.isEmpty(interiorElements)) {
        // collapsing a table into the name doesn't make sense but can take a row out of it
        const firstInterior = interiorElements[0];
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

function removeLeadingEmpty(description) {
  if (!description.startsWith('<p>')) {
    return { prePend: '', newDescription: description};
  }
  const parts = description.split('</p>');
  if (_.isEmpty(parts)) {
    return { prePend: '', newDescription: description};
  }
  const firstPart = parts[0] + '</p>';
  const stripped = stripHTML(firstPart);
  if (!_.isEmpty(stripped)) {
    return { prePend: '', newDescription: description };
  }
  const { prePend, newDescription } = removeLeadingEmpty(description.substring(firstPart.length));
  return { prePend: firstPart + prePend, newDescription };
}

export function convertDescription(originalDescription, maxLength = 80) {
  const { prePend, newDescription } = removeLeadingEmpty(originalDescription);
  const { name, description } = convertProcessedDescription(newDescription, maxLength);
  return { name, description: prePend + description };
}

export function nameFromDescription(description, maxLength = 80) {
  const { name } = convertDescription(description, maxLength);
  return name;
}