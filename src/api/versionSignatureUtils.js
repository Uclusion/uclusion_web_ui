import _ from 'lodash';

/**
 * Returns if the version is stale. I.E. we have some required signatures
 * that we know an up to date version must have, and this update doesn't contain
 * them or a later version.
 * @param marketSignatures
 * @param requiredSignatures, a list of simple {id, version} pairs that we need. This
 * works because our keyspace is vanishingly unlikely to collide.
 * @returns {boolean}
 */
export function versionIsStale (marketSignatures, requiredSignatures) {
  // we require nothing, so we can't be stale
  if (_.isEmpty(requiredSignatures)) {
    return false;
  }
  const fetchSignatures = marketSignatures.reduce((acc, marketSignature) => {
    const { market_id: marketId, signatures: componentSignatures } = marketSignature;
    const components = componentSignatures.reduce((acc, componentSignature) => {
      const { object_versions } = componentSignature;
      const converted = object_versions.map((objectVersion) => {
        return {
          version: objectVersion.version,
          id: objectVersion.object_id_one,
        };
      });
      return acc.concat(acc, object_versions);
    }, []);
    return acc.concat(components);
  }, []);
  // find all the non satisfied requirements
  const notSatisfied = requiredSignatures.filter((requiredSignature) => {
    // a required signature is satisfied if we find a fetch signature
    // with the same id and a version greater than that of the required signature
    const satisfied = fetchSignatures.find((fetchSignature) => {
      return fetchSignature.id === requiredSignature.id && fetchSignature.version >= requiredSignature.version;
    });
    return !satisfied;
  });
  // if there are any not satisfied, then we're stale
  return _.isEmpty(notSatisfied);
}

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
    //  // console.log(signatureVersion);
    const objectVersion = object[key];
    //   // console.log(objectVersion);
    if (!objectVersion) {
      return false;
    }
    let keySatisfied;
    if (_.isArray(signatureVersion)) {
      // // console.log('Checking array match');
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
      //    // console.log('Checking object signature');
      keySatisfied = signatureMatches(signatureVersion, objectVersion);
    } else if (key.endsWith('id')) {
      //   // console.log('Checking exact id match');
      keySatisfied = objectVersion === signatureVersion;
    } else {
      //    // console.log('Checking numeric version');
      keySatisfied = objectVersion >= signatureVersion;
    }
    if (!keySatisfied) {
      //   // console.log('Key not satisifed');
      return false;
    }
  }
  // // console.log("Key satisified");
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
    // // console.log(matchingSignature);
    if (matchingSignature) {
      matched.push(object);
      matchedSignatures.push(matchingSignature);
    }
  }
  const unmatchedSignatures = _.difference(signatures, matchedSignatures);
  const allMatched = _.isEmpty(unmatchedSignatures);
  if (!allMatched) {
    console.warn(unmatchedSignatures);
  }
  return { matched, unmatchedSignatures, allMatched };
}

export function getFetchSignaturesForMarket (marketVersionSignatures) {
  // I know how to fetch markets, marketPresences (users), investibles, and comments
  const comments = commentsSignatureGenerator(marketVersionSignatures);
  const markets = marketSignatureGenerator(marketVersionSignatures);
  const marketPresences = usersSignatureGenerator(marketVersionSignatures);
  const investibles = investiblesSignatureGenerator(marketVersionSignatures);
  const marketStages = stagesSignatureGenerator(marketVersionSignatures);
  return {
    comments,
    markets,
    marketPresences,
    investibles,
    marketStages,
  };
}

/**
 * Generates a signature for object updates that simply consists of
 * the object id and the new version.
 * @param versionsSignatures the complete version sisgnatues object
 * @param type the signature type we're looking for
 * @returns {*[]|*}
 */
function generateSimpleObjectSignature (versionsSignatures, type) {
  const mySignature = versionsSignatures.find((signature) => signature.type === type);
  if (!mySignature) {
    return [];
  }
  const { object_versions: objectVersions } = mySignature;
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
 * Users are an amalgamation of several different versions. This generates
 * an update signature that will update from the component parts.
 * @param versionsSignatures the unified market signature update
 * @returns {unknown[]}
 */
function usersSignatureGenerator (versionsSignatures) {
  const userSignatures = versionsSignatures.find((signature) => signature.type === 'market_capability') || { object_versions: [] };
  const investmentsSignatures = versionsSignatures.find((signature) => signature.type === 'investment') || { object_versions: [] };
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
function investiblesSignatureGenerator (versionsSignatures) {
  const invSignature = versionsSignatures.find((signature) => signature.type === 'investible') || { object_versions: [] };
  const infoSignature = versionsSignatures.find((signature) => signature.type === 'market_investible') || { object_versions: [] };
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

