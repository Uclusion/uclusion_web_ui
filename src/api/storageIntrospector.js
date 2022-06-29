import { getFetchSignaturesForMarket, signatureMatcher } from './versionSignatureUtils'
import _ from 'lodash'
import { getMarketInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper'

/**
 Functions used during the fetch process to check what we have in local storage.
 **/

/**
 * CHecks local storage for things that can satisfy the fetch signatures.
 * Returns the set of signatures that _can't_ be satisfied from local storage
 * @param marketId
 * @param fetchSignature
 * @param storageStates
 */
export function checkSignatureInStorage (marketId, fetchSignature, storageStates) {
  const serverFetchSignatures = getFetchSignaturesForMarket([{type: fetchSignature.object_type,
    object_versions: [fetchSignature]}]);
  const fromStorage = checkInStorage(marketId, serverFetchSignatures, storageStates);
  const { markets, comments, marketPresences, marketStages, investibles } = fromStorage;
  return markets.allMatched && comments.allMatched && marketPresences.allMatched && marketStages.allMatched
    && investibles.allMatched;
}

/**
 * CHecks local storage for things that can satisfy the fetch signatures.
 * Returns the set of signatures that _can't_ be satisfied from local storage
 * @param marketId
 * @param fetchSignatures
 * @param storageStates
 */
export function checkInStorage(marketId, fetchSignatures, storageStates) {
  const {
    comments,
    markets,
    marketPresences,
    investibles,
    marketGroups,
    marketStages,
  } = fetchSignatures;
  const { commentsState, investiblesState, marketsState, marketPresencesState, marketStagesState, marketGroupsState } = storageStates;
  const commentsMatches = satisfyComments(marketId, comments, commentsState);
  // keep updating the required versions so it's an ever shrinking map
  const investibleMatches = satisfyInvestibles(marketId, investibles, investiblesState);
  const marketMatches = satisfyMarkets(markets, marketsState);
  const presenceMatches = satisfyMarketPresences(marketId, marketPresences, marketPresencesState);
  const stageMatches = satisfyMarketStages(marketId, marketStages, marketStagesState);
  const groupMatches = satisfyMarketGroups(marketId, marketGroups, marketGroupsState);
  return {
    comments: commentsMatches,
    investibles: investibleMatches,
    markets: marketMatches,
    marketPresences: presenceMatches,
    marketStages: stageMatches,
    marketGroups: groupMatches,
  };
}

function satisfyComments (marketId, commentSignatures, commentsState) {
    const usedState = commentsState || {};
    // Comments State is just a id, version pair, just like version signatures, so to check we just unpack every comment
    const marketComments = usedState[marketId];
    const usedComments = _.isArray(marketComments)? marketComments : [];
    return signatureMatcher(usedComments, commentSignatures);
}

function satisfyInvestibles (marketId, investibleSignatures, investibleState) {
    const usedState = investibleState || {};
    const marketInvestibles = getMarketInvestibles(usedState, marketId);
    return signatureMatcher(marketInvestibles, investibleSignatures);
}

function satisfyMarkets (marketsSignatures, marketsState) {
    const usedState = marketsState || {};
    const allMarkets = usedState.marketDetails || [];
    return signatureMatcher(allMarkets, marketsSignatures);
}

function satisfyMarketPresences (marketId, presenceSignatures, mpState) {
    const usedState = mpState || {};
    const marketPresences = usedState[marketId];
    const usedPresences = marketPresences || [];
    return signatureMatcher(usedPresences, presenceSignatures);
}

function satisfyMarketStages (marketId, stageSignatures, stagesState) {
    const usedState = stagesState || {};
    const marketStages = usedState[marketId] || [];
    return signatureMatcher(marketStages, stageSignatures);
}

function satisfyMarketGroups (marketId, groupSignatures, groupsState) {
  const usedState = groupsState ?? {};
  const marketGroups = usedState[marketId] ?? [];
  return signatureMatcher(marketGroups, groupSignatures);
}