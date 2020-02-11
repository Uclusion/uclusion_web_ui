import _ from 'lodash';

/**
 * A matcher that checks if the version is greater than or equal to the
 * value in the signature. However, If the signature contains an ID key (e..g market_id) then it
 * checks for exact match for the objects value with that key
 * @param signature
 * @param object
 * @returns {boolean}
 */
function signatureMatches (signature, object) {
  for (const key of Object.keys(signature)) {
    const signatureVersion = signature[key];
    console.log(signatureVersion);
    const objectVersion = object[key];
    console.log(objectVersion);
    if (!objectVersion) {
      return false;
    }
    let keySatisfied;
    if (_.isArray(signatureVersion)) {
      console.log('Checking array match');
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
      console.log('Checking object signature');
      keySatisfied = signatureMatches(signatureVersion, objectVersion);
    } else if (key.endsWith('id')) {
      console.log('Checking exact id match');
      keySatisfied = objectVersion === signatureVersion;
    } else {
      console.log('Checking numeric version');
      keySatisfied = objectVersion >= signatureVersion;
    }
    if (!keySatisfied) {
      console.log('Key not satisifed');
      return false;
    }
  }
  // console.log("Key satisified");
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
export function signatureMatcher (fetched, signatures) {
  const matched = [];
  const matchedSignatures = [];
  for (let x = 0; x < fetched.length; x++) {
    const object = fetched[x];
    const matchingSignature = signatures.find((signature) => signatureMatches(signature, object));
    // console.log(matchingSignature);
    if (matchingSignature) {
      matched.push(object);
      matchedSignatures.push(matchingSignature);
    }
  }
  const unmatchedSignatures = _.difference(signatures, matchedSignatures);
  const allMatched = _.isEmpty(unmatchedSignatures);
  // console.log(allMatched);
  // console.log(unmatchedSignatures);
  return { matched, unmatchedSignatures, allMatched };
}

export function getRemoveListForMarket (marketVersionSignatures) {
  const investibles = investiblesRemovalGenerator(marketVersionSignatures);
  return {
    investibles,
  };
}

function investiblesRemovalGenerator (versionsSignatures) {
  const invSignature = versionsSignatures.find((signature) => signature.type === 'investible') || { object_versions: [] };
  const infoSignature = versionsSignatures.find((signature) => signature.type === 'market_investible') || { object_versions: [] };
  const baseRemovals = invSignature.object_versions.reduce((acc, signature) => {
    if (signature.version === 0) {
      return [...acc, signature.object_id_one];
    }
    return acc;
  }, []);

  const infoRemovals = infoSignature.object_versions.reduce((acc, signature) => {
    const { object_id_two: invId, version } = signature;
    if (version === 0) {
      return [acc, invId];
    }
    return acc;
  }, []);
  const combined = [...baseRemovals, infoRemovals];
  const unique = _.uniq(combined);
  return unique;
}

export function getFetchSignaturesForMarket (marketVersionSignatures) {
  // I know how to fetch markets, marketPresences (users), investibles, and comments
  const comments = commentsSignatureGenerator(marketVersionSignatures);
  const markets = marketSignatureGenerator(marketVersionSignatures);
  const marketPresences = usersSignatureGenerator(marketVersionSignatures);
  const investibles = investiblesSignatureGenerator(marketVersionSignatures);
  return {
    comments,
    markets,
    marketPresences,
    investibles,
  };
}

function generateSimpleObjectSignature (versionsSignatures, type) {
  const mySignature = versionsSignatures.find((signature) => signature.type === type);
  if (!mySignature) {
    return [];
  }
  const { object_versions: objectVersions } = mySignature;
  return objectVersions.reduce((acc, objVersion) => {
    const { version, object_id_one: id } = objVersion;
    if (version === 0) {
      return acc;
    }
    return [
      ...acc,
      {
        id,
        version,
      }
    ];
  }, []);
}

function usersSignatureGenerator (versionsSignatures) {
  const userSignatures = versionsSignatures.find((signature) => signature.type === 'market_capability') || { object_versions: [] };
  const investmentsSignatures = versionsSignatures.find((signature) => signature.type === 'investment') || { object_versions: [] };
  const fetchSigs = userSignatures.object_versions.reduce((acc, sig) => {
    const { version } = sig;
    if (sig === 0) {
      return acc;
    }
    const userId = sig.object_id_one;
    return {
      ...acc,
      [userId]: {
        id: userId,
        market_capability_version: version,
      }
    };
  }, {});
  investmentsSignatures.object_versions.forEach((sig) => {
    const { object_id_two: userId, version, object_id_one: marketInfoId } = sig;
    if (version === 0) {
      return;
    }
    if (fetchSigs[userId]) {
      const investments = fetchSigs[userId]['investments'] || [];
      fetchSigs[userId] = {
        ...fetchSigs[userId],
        investments: [
          ...investments, {
            market_investible_id: marketInfoId,
            market_investible_version: version,
          }
        ]
      };
    } else {
      fetchSigs[userId] = {
        id: userId,
        investments: [
          {
            market_investible_id: marketInfoId,
            market_investible_version: version,
          }
        ]
      };
    }
  });
  return Object.values(fetchSigs);
}

function investiblesSignatureGenerator (versionsSignatures) {
  const invSignature = versionsSignatures.find((signature) => signature.type === 'investible') || { object_versions: [] };
  const infoSignature = versionsSignatures.find((signature) => signature.type === 'market_investible') || { object_versions: [] };
  // an investible needs an update regardless of whether or not it's the market info or the
  // investible itself, so we need to join here
  const fetchSigs = invSignature.object_versions.reduce((acc, sig) => {
    const { object_id_one: invId, version } = sig;
    if (version === 0) {
      return acc;
    }
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
    const { object_id_two: invId, version, object_id_one: infoId } = sig;
    if (version === 0) {
      delete fetchSigs[invId]; // if market investible gone, we can't fetch the base
      return;
    }
    if (fetchSigs[invId]) {
      fetchSigs[invId] = {
        ...fetchSigs[invId],
        market_infos: [
          {
            id: infoId,
            version,
          }
        ]
      };
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
function marketSignatureGenerator (versionsSignatures) {
  return generateSimpleObjectSignature(versionsSignatures, 'market');
}

/**
 * Converts the comment signature out of the versions call into something we can
 * match a fetched object against
 * @param versionsSignatures
 * @returns {*}
 */
function commentsSignatureGenerator (versionsSignatures) {
  return generateSimpleObjectSignature(versionsSignatures, 'comment');
}

