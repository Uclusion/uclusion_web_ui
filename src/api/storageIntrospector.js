import LocalForageHelper from '../utils/LocalForageHelper';
import { COMMENTS_CONTEXT_NAMESPACE } from '../contexts/CommentsContext/CommentsContext';
import { signatureMatcher } from './versionSignatureUtils';
import _ from 'lodash';
import { INVESTIBLES_CONTEXT_NAMESPACE } from '../contexts/InvestibesContext/InvestiblesContext';
import { MARKET_CONTEXT_NAMESPACE } from '../contexts/MarketsContext/MarketsContext';
import { MARKET_PRESENCES_CONTEXT_NAMESPACE } from '../contexts/MarketPresencesContext/MarketPresencesContext';
import { MARKET_STAGES_CONTEXT_NAMESPACE } from '../contexts/MarketStagesContext/MarketStagesContext';

/**
 Functions used during the fetch process to check what we have in local storage.
 **/

/**
 * CHecks local storage for things that can satisfy the fetch, or version
 * signatures. Returns the set of market and version signatures that _can't_ be satisfied from local storage
 * @param versionSignatures
 * @param fetchSignatures
 */
export async function checkInStorage (fetchSignatures, versionSignatures) {
  const {
    comments,
    markets,
    marketPresences,
    investibles,
    marketStages,
  } = fetchSignatures;
  // Convert to map form for speed of lookup
  let requiredVersions = versionSignatures.reduce((acc, sig) => {
    acc[sig.id] = sig.version;
    return acc;
  }, {});
  const commentsMatches = await satisfyComments(comments, requiredVersions);
  // keep updating the required versions so it's an ever shrinking map
  requiredVersions = commentsMatches.requiredVersions;
  const investibleMatches = await satisfyInvestibles(investibles, requiredVersions);
  requiredVersions = investibleMatches.requiredVersions;
  const marketMatches = await satisfyMarkets(markets, requiredVersions);
  requiredVersions = marketMatches.requiredVersions;
  const presenceMatches = await satisfyMarketPresences(marketPresences, requiredVersions);
  requiredVersions = presenceMatches.requiredVersions;
  const stageMatches = await satisfyMarketStages(marketStages, requiredVersions);
  requiredVersions = stageMatches.requiredVersions;
  const signaturesObject = {
    comments: commentsMatches.unmatched,
    investibles: investibleMatches.unmatched,
    markets: marketMatches.unmatched,
    marketPresences: presenceMatches.unmatched,
    marketStages: stageMatches.unmatched,
  };
  const remainingVersionSignatures = Object.keys(requiredVersions).map((acc, key) => {
    return [...acc, { id: key, version: versionSignatures[key] }];
  }, []);
  return {
    fetchSignatures: signaturesObject,
    versionSignatures: remainingVersionSignatures,
  };
}

/**
 * Takes a list of objects, a function to call on each object to extract something that
 * can be matched against a version signature, and a version signature map and returns
 * a version signature map that contains those objects NOT matched by the objects
 * @param objects the list of objects
 * @param matchableExtractor a function that converts an object to something that can be matched against
 * a version
 * @param versionsSignatureMap a mapping from object id to version number
 * @returns a version sisgnature map that contains entries corresponding to those versions that are NOT
 * matched by the objects
 */
function matchVersionSignatures (objects, matchableExtractor, versionsSignatureMap) {
  if (_.isEmpty(versionsSignatureMap)) {
    return versionsSignatureMap; // no need to do anything
  }
  const newMap = { ...versionsSignatureMap };
  objects.forEach((object) => {
    const converted = matchableExtractor(object);
    const { id, version } = converted;
    const versionEntry = versionsSignatureMap[id];
    if (versionEntry && (versionEntry === version)) {
      delete newMap[id];
    }
  });
  return newMap;
}

/**
 * Helper function to run the matches against the versions and the passed in fetch signatures
 * @param objects
 * @param fetchSignatures
 * @param matchableExtractor
 * @param versionsSignatureMap
 * @returns {{requiredVersions: *, unmatched: *}}
 */
function matchSignatures (objects, fetchSignatures, matchableExtractor, versionsSignatureMap) {
  const matchResult = signatureMatcher(objects, fetchSignatures);
  const newVersionsSignatures = matchVersionSignatures(objects, matchableExtractor, versionsSignatureMap);
  return {
    unmatched: matchResult.unmatchedSignatures,
    requiredVersions: newVersionsSignatures,
  };
}

function satisfyComments (commentSignatures, versionsSignatureMap) {
  const helper = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((commentsState) => {
      const usedState = commentsState || {};
      // Comments State is just a id, version pair, just like version signatures, so to check we just unpack every comment
      const allComments = Object.keys(usedState).reduce((list, marketId) => {
        const marketComments = commentsState[marketId];
        if (_.isArray(marketComments)) {
          return [...list, ...marketComments];
        }
        return list;
      }, []);
      return matchSignatures(allComments, commentSignatures, (obj) => obj, versionsSignatureMap);
    });
}

function satisfyInvestibles (investibleSignatures, versionsSignatureMap) {
  const helper = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((investibleState) => {
      const usedState = investibleState || {};
      const allInvestibles = _.values(usedState);
      return matchSignatures(allInvestibles, investibleSignatures, (obj) => obj.investible, versionsSignatureMap);
    });
}

function satisfyMarkets (marketsSignatures, versionsSignatureMap) {
  const helper = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((marketsState) => {
      const usedState = marketsState || {};
      const allMarkets = usedState.marketDetails || [];
      return matchSignatures(allMarkets, marketsSignatures, (obj) => obj, versionsSignatureMap);
    });
}

function satisfyMarketPresences (presenceSignatures, versionsSignatureMap) {
  const helper = new LocalForageHelper(MARKET_PRESENCES_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((mpState) => {
      const usedState = mpState || {};
      const allPresences = _.values(usedState);
      return matchSignatures(allPresences, presenceSignatures, (obj) => obj, versionsSignatureMap);
    });
}

function satisfyMarketStages (stageSignatures, versionsSignatureMap) {
  const helper = new LocalForageHelper(MARKET_STAGES_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((stagesState) => {
      const usedState = stagesState || {};
      const allStages = _.values(usedState);
      return matchSignatures(allStages, stageSignatures, (obj) => obj, versionsSignatureMap);
    });
}