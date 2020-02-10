/**
 * Repeatedly calls fetcher for up to maxTries until the version signatures are
 * satisfied. Returns the linear list of results from the fetch.
 * @param fetcher
 * @param versionSignatures an array of method signatures, where a signature is
 * of the form { id: objectid, sub_object_key:minversion} where the sub object key
 * is the key under which an item resides, and the min version is the minimum version which will
 * satisfy the requirement
 */

function fetchVersioned(versionSignatures, maxTries) {

}

async function fetchUntilAllMatched(fetcher, fetchSignatures, maxTries) {
  const FETCH_WAIT_DELAY = 6000;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  let currentTries = 0;

  async function fetchAndMatch() {
    currentTries += 1;
    const fetched = await fetcher();
    return genericMatcher(fetched, fetchSignatures);
  }

  let totalMatched = [];
  // the first iteration
  let { matched, unmatched } = fetchAndMatch();
  totalMatched = totalMatched.concat(matched);
  if (_.isEmpty(unmatched)) {
    return totalMatched;
  }
  // the while sleep loop;
  await sleep(FETCH_WAIT_DELAY);
  while (currentTries < maxTries) {
    let { matched, unmatched } = fetchAndMatch();
    totalMatched = totalMatched.concat(matched);
    if (_.isEmpty(unmatched)) {
      return totalMatched;
    }
    await sleep(FETCH_WAIT_DELAY);
  }
  throw('Unable to fetch matching values');

}

export function getSignatureGenerators(versionSignatures) {
  // I know how to fetch markets, marketPresences (users), investibles, and comments
  const comments = commentsSignatureGenerator(versionSignatures);
  const markets = marketSignatureGenerator(versionSignatures);
  const marketPresences = usersSignatureGenerator(versionSignatures);
  const investibles = investiblesSignatureGenerator(versionSignatures);
  return {
    comments,
    markets,
    marketPresences,
    investibles,
  };
}


function generateSimpleObjectSignature(versionsSignatures, type) {
  const mySignature = versionsSignatures.find((signature) => signature.type === type);
  const { object_versions: objectVersions } = mySignature;
  return objectVersions.map((objVersion) => {
    return {
      id: objVersion.object_id_one,
      version: objVersion.version,
    };
  });
}

function usersSignatureGenerator(versionsSignatures) {
  const userSignatures = versionsSignatures.find((signature) => signature.type === 'market_capability');
  const investmentsSignatures = versionsSignatures.find((signature) => signature.type === 'investment');
  const fetchSigs = userSignatures.object_versions.reduce((acc, sig) => {
    const userId = sig.object_id_one;
    return {
      ...acc,
      [userId]: {
        id: userId,
        market_capability_version: sig.version,
      }
    };
  }, {});
  investmentsSignatures.object_versions.forEach((sig) => {
    const userId = sig.object_id_two;
    const marketInfoId = sig.object_id_one;
    if (fetchSigs[userId]) {
      const investments = fetchSigs[userId]['investments'] || [];
      fetchSigs[userId] = {
        ...fetchSigs[userId],
        investments: [
          ...investments, {
            market_investible_id: marketInfoId,
            market_investible_version: sig.version,
          }
        ]
      };
    } else {
      fetchSigs[userId] = {
        id: userId,
        investments: [
          {
            market_investible_id: marketInfoId,
            market_investible_version: sig.version,
          }
        ]
      };
    }
  });
  return Object.values(fetchSigs);
}

function investiblesSignatureGenerator(versionsSignatures) {
  const invSignature = versionsSignatures.find((signature) => signature.type === 'investible');
  const infoSignature = versionsSignatures.find((signature) => signature.type === 'market_investible');
  // an investible needs an update regardless of whether or not it's the market info or the
  // investible itself, so we need to join here
  const fetchSigs = invSignature.object_versions.reduce((acc, sig) => {
    const invId = sig.object_id_one;
    return {
      ...acc,
      [invId]: {
        investible: {
          id: invId,
          version: sig.version,
        }
      }
    };
  }, {});
  infoSignature.object_versions.forEach((sig) => {
    const invId = sig.object_id_two;
    const version = sig.object_id;
    const infoId = sig.object_id_one;
    if (fetchSigs[invId]) {
      const newFetchSig = {
        ...fetchSigs[invId],
        market_infos: [
          {
            id: infoId,
            version,
          }
        ]
      };
      fetchSigs[invId] = newFetchSig;
    } else {
      fetchSigs[invId] = {
        investible: {
          id: invId,
        },
        market_infos: [
          {
            id: infoId,
            version,
          }
        ]
      };
    }
  });
  return Object.values(fetchSigs);
}

/**
 * Converts the market signature out of the versions call into something we can match a fetched
 * object against.
 * @param versionsSignatures
 * @returns {*}
 */
function marketSignatureGenerator(versionsSignatures) {
  return generateSimpleObjectSignature(versionsSignatures, 'market');
}

/**
 * Converts the comment signature out of the versions call into something we can
 * match a fetched object against
 * @param versionsSignatures
 * @returns {*}
 */
function commentsSignatureGenerator(versionsSignatures) {
  return generateSimpleObjectSignature(versionsSignatures, 'comment');
}

/**
 * A matcher that checks if the version is greater than or equal to the
 * value in the signature. However, If the signature contains an ID key (e..g market_id) then it
 * checks for exact match for the objects value with that key
 * @param signature
 * @param object
 * @returns {boolean}
 */
function signatureMatches(signature, object) {
  for (const key of Object.keys(signature)) {
    const signatureVersion = signature[key];
    const objectVersion = object[key];
    if (!objectVersion) {
      return false;
    }
    let keySatisfied;
    if (_.isArray(signatureVersion)) {
      if (!_.isArray(objectVersion)) {
        return false;
      }
      // we're not going to consider order, so we'll consider a match if
      // a least one of the objectVersion entries matches the signatureVersion
      keySatisfied = signatureVersion.reduce((acc, entry) => {
        acc = acc && !!objectVersion.find((obj) => signatureMatches(entry, obj));
        return acc;
      }, true);
    } else if ('object' === typeof signatureVersion) {
      keySatisfied = signatureMatches(signatureVersion, objectVersion);
    } else if (key.endsWith('id')) {
      keySatisfied = objectVersion === signatureVersion;
    } else {
      keySatisfied = objectVersion >= signatureVersion;
    }
    if (!keySatisfied) {
      return false;
    }
  }
  return true;
}

/**
 * Given a list of objects that were fetched, and signature definitions returns a new object
 * with two values {
 *   matched: these are the values that have been satisfied
 *   unmatched: these are the values that have _not_ been satisfied
 * }
 * this runs in 0_n^2, so be careful.
 * @param fetched
 * @param signatures
 */
function genericMatcher(fetched, signatures) {
  const matched = [];
  const unmatched = [];
  for (let x = 0; x < fetched.length; x++) {
    const object = fetched[x];
    const matchingSignature = signatures.find((signature) => signatureMatches(signature, object));
    if (matchingSignature) {
      matched.push(object);
    } else {
      unmatched.push(object);
    }
  }
  return { matched, unmatched };
}
