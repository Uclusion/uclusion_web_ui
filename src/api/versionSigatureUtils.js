
export function getFetchSignatures(versionSignatures) {
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

