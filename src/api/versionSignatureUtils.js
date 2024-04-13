import _ from 'lodash'

const EMPTY_VERSION = { object_versions: [] };

/**
 * A matcher that checks if the version is greater than or equal to the
 * value in the signature. However, If the signature contains an ID key (e..g market_id) then it
 * checks for exact match for the objects value with that key
 * @param signature
 * @param object
 * @param checkVersion Whether to include version in the calculation or not
 * @returns {boolean}
 */
export function signatureMatches(signature, object, checkVersion=true) {
  for (const key of Object.keys(signature)) {
    const signatureVersion = signature[key];
    const objectVersion = object[key];
    const fromQuickAdd = object.fromQuickAdd;
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
        acc = acc && !!objectVersion.find((obj) => signatureMatches(entry, obj, checkVersion));
        return acc;
      }, true);
    } else if ('object' === typeof signatureVersion) {
      keySatisfied = signatureMatches(signatureVersion, objectVersion, checkVersion);
    } else if (key.endsWith('id')) {
      keySatisfied = objectVersion === signatureVersion;
    } else {
      if (checkVersion) {
        if (fromQuickAdd) {
          keySatisfied = objectVersion > signatureVersion;
        } else {
          keySatisfied = objectVersion >= signatureVersion;
        }
      } else {
        keySatisfied = true;
      }
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
export function signatureMatcher(fetched, signatures) {
  const matched = [];
  const matchedSignatures = [];
  for (let x = 0; x < fetched.length; x++) {
    const object = fetched[x];
    const matchingSignature = signatures.find((signature) => signatureMatches(signature, object));
    const objectPresent = matchingSignature || signatures.find((signature) => signatureMatches(signature,
      object, false));
    if (matchingSignature) {
      matched.push(object)
      matchedSignatures.push(matchingSignature)
    } else if (!objectPresent) {
      // Since there is no hard delete all objects in the store and not in the signatures are an automatic match
      // otherwise quick added objects would be potentially removed
      matched.push(object)
    }
  }
  const unmatchedSignatures = _.difference(signatures, matchedSignatures)
  const allMatched = _.isEmpty(unmatchedSignatures)
  return { matched, unmatchedSignatures, allMatched }
}

/** Given a set of version signatures, returns all the match functions
 * for their constituent parts
 * @param marketVersionSignatures
 * @returns {{markets: *, marketPresences: unknown[], comments: *, marketStages: (*[]|*), investibles: unknown[]}}
 */
export function getFetchSignaturesForMarket(marketVersionSignatures) {
  // I know how to fetch markets, marketPresences (users), investibles, and comments
  const comments = commentsSignatureGenerator(marketVersionSignatures);
  const markets = marketSignatureGenerator(marketVersionSignatures);
  const marketPresences = usersSignatureGenerator(marketVersionSignatures);
  const investibles = investiblesSignatureGenerator(marketVersionSignatures);
  const marketStages = stagesSignatureGenerator(marketVersionSignatures);
  const marketGroups = groupsSignatureGenerator(marketVersionSignatures);
  const groupMembers = groupMembersSignatureGenerator(marketVersionSignatures);
  return {
    comments,
    markets,
    marketPresences,
    investibles,
    marketStages,
    marketGroups,
    groupMembers
  };
}

/**
 * Given a particular object type and a list of signatures
 * returns all signatures of the given type, or an empty
 * signature list in the form downstream will accept
 * @param signatures
 * @param objectType
 * @returns {*|{object_versions: []}}
 */
function getSpecificTypeSignatures(signatures, objectType) {
  return signatures.find((sig) => sig.type === objectType) || EMPTY_VERSION;
}

/**
 * Generates a signature for object updates that simply consists of
 * the object id and the new version.
 * @param versionsSignatures the complete version sisgnatues object
 * @param type the signature type we're looking for
 * @returns {*[]|*}
 */
function generateSimpleObjectSignature (versionsSignatures, type) {
  const mySignatures = getSpecificTypeSignatures(versionsSignatures, type);
  const { object_versions: objectVersions } = mySignatures;
  return objectVersions.reduce((acc, objVersion) => {
    const { version, object_id_one: id } = objVersion;
    return [
      ...acc,
      {
        id,
        version,
      }
    ];
  }, []);
}

/**
 * Converts the group members signature out of the versions call into something we can match
 * a fetched object against
 * @param versionsSignatures
 * @returns {*}
 */

function groupMembersSignatureGenerator(versionsSignatures) {
  const mySignatures = getSpecificTypeSignatures(versionsSignatures, 'group_capability');
  const { object_versions: objectVersions } = mySignatures;
  return objectVersions.reduce((acc, objVersion) => {
    const { version, object_id_one: group_id, object_id_two: id } = objVersion;
    return [
      ...acc,
      {
        id,
        group_id,
        version
      }
    ];
  }, []);
}

/**
 * Users are an amalgamation of different versions. This generates
 * an update signature that will update from the component parts.
 * @param versionsSignatures the unified market signature update
 * @returns {unknown[]}
 */
function usersSignatureGenerator (versionsSignatures) {
  const userSignatures = getSpecificTypeSignatures(versionsSignatures,'market_capability');
  const investmentsSignatures =  getSpecificTypeSignatures(versionsSignatures,'investment');
  const fetchSigs = userSignatures.object_versions.reduce((acc, sig) => {
    const { version } = sig;
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

/**
 * Investibles are an amalagmation of the investible and investible info objects.
 * This generates a signature that can match if either part updates
 * @param versionsSignatures the version signature array
 * @returns {unknown[]}
 */
function investiblesSignatureGenerator(versionsSignatures) {
  const invSignature = getSpecificTypeSignatures(versionsSignatures, 'investible');
  const infoSignature = getSpecificTypeSignatures(versionsSignatures, 'market_investible');
  const addressedSignatures =  getSpecificTypeSignatures(versionsSignatures,'addressed');
  // an investible needs an update regardless of whether or not it's the market info or the
  // investible itself, so we need to join here
  const fetchSigs = invSignature.object_versions.reduce((acc, sig) => {
    const { object_id_one: invId, version } = sig;
    return {
      ...acc,
      [invId]: {
        investible: {
          id: invId,
          version,
        }
      }
    };
  }, {});
  infoSignature.object_versions.forEach((sig) => {
    const { object_id_two: invId, version, object_id_one: infoId } = sig;
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
  // For now separate and merge elsewhere
  addressedSignatures.object_versions.forEach((sig) => {
    const { object_id_two: userId, version, object_id_one: marketInfoId } = sig;
    if (fetchSigs[marketInfoId]) {
      fetchSigs[marketInfoId] = {
        market_infos: [
          {
            id: marketInfoId,
            addressed: _.union([{user_id: userId, version}], ...fetchSigs[marketInfoId].market_infos[0].addressed)
          }
        ]
      };
    } else {
      fetchSigs[marketInfoId] = {
        market_infos: [
          {
            id: marketInfoId,
            addressed: [{user_id: userId, version}]
          }
        ]
      };
    }
  });
  return Object.values(fetchSigs);
}

/**
 * Converts the market signature out of the versions call into something
 * we can match a fetched object against
 * @param versionsSignatures
 * @returns {*[]|*}
 */
function stagesSignatureGenerator (versionsSignatures) {
  return generateSimpleObjectSignature(versionsSignatures, 'stage');
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

/**
 * Converts the group signature out of the versions call into something we can match
 * a fetched object against
 * @param versionsSignatures
 * @returns {*}
 */
function groupsSignatureGenerator (versionsSignatures) {
  return generateSimpleObjectSignature(versionsSignatures, 'group');
}
