import LocalForageHelper from '../utils/LocalForageHelper'
import { COMMENTS_CONTEXT_NAMESPACE } from '../contexts/CommentsContext/CommentsContext'
import { getFetchSignaturesForMarket, signatureMatcher } from './versionSignatureUtils'
import _ from 'lodash'
import { INVESTIBLES_CONTEXT_NAMESPACE } from '../contexts/InvestibesContext/InvestiblesContext'
import { MARKET_CONTEXT_NAMESPACE } from '../contexts/MarketsContext/MarketsContext'
import { MARKET_PRESENCES_CONTEXT_NAMESPACE } from '../contexts/MarketPresencesContext/MarketPresencesContext'
import { MARKET_STAGES_CONTEXT_NAMESPACE } from '../contexts/MarketStagesContext/MarketStagesContext'
import { getMarketInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper'

/**
 Functions used during the fetch process to check what we have in local storage.
 **/

/**
 * CHecks local storage for things that can satisfy the fetch signatures.
 * Returns the set of signatures that _can't_ be satisfied from local storage
 * @param marketId
 * @param fetchSignature
 */
export async function checkSignatureInStorage (marketId, fetchSignature) {
  const serverFetchSignatures = getFetchSignaturesForMarket([fetchSignature]);
  const fromStorage = await checkInStorage(marketId, serverFetchSignatures);
  const { markets, comments, marketPresences, marketStages, investibles } = fromStorage;
  return markets.allMatched && comments.allMatched && marketPresences.allMatched && marketStages.allMatched
    && investibles.allMatched;
}

/**
 * CHecks local storage for things that can satisfy the fetch signatures.
 * Returns the set of signatures that _can't_ be satisfied from local storage
 * @param marketId
 * @param fetchSignatures
 */
export async function checkInStorage (marketId, fetchSignatures) {
  const {
    comments,
    markets,
    marketPresences,
    investibles,
    marketStages,
  } = fetchSignatures;
  // using await here since it's less tedious and logically
  // equivalent to doing chained thens
  const commentsMatches = await satisfyComments(marketId, comments);
  // keep updating the required versions so it's an ever shrinking map
  const investibleMatches = await satisfyInvestibles(marketId, investibles);
  const marketMatches = await satisfyMarkets(markets);
  const presenceMatches = await satisfyMarketPresences(marketId, marketPresences);
  const stageMatches = await satisfyMarketStages(marketId, marketStages);
  return {
    comments: commentsMatches,
    investibles: investibleMatches,
    markets: marketMatches,
    marketPresences: presenceMatches,
    marketStages: stageMatches,
  };
}

function satisfyComments (marketId, commentSignatures) {
  const helper = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((commentsState) => {
      const usedState = commentsState || {};
      // Comments State is just a id, version pair, just like version signatures, so to check we just unpack every comment
      const marketComments = usedState[marketId];
      const usedComments = _.isArray(marketComments)? marketComments : [];
      return signatureMatcher(usedComments, commentSignatures);
    });
}

function satisfyInvestibles (marketId, investibleSignatures) {
  const helper = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((investibleState) => {
      const usedState = investibleState || {};
      const marketInvestibles = getMarketInvestibles(usedState, marketId);
      return signatureMatcher(marketInvestibles, investibleSignatures);
    });
}

function satisfyMarkets (marketsSignatures) {
  const helper = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((marketsState) => {
      const usedState = marketsState || {};
      const allMarkets = usedState.marketDetails || [];
      return signatureMatcher(allMarkets, marketsSignatures);
    });
}

function satisfyMarketPresences (marketId, presenceSignatures) {
  const helper = new LocalForageHelper(MARKET_PRESENCES_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((mpState) => {
      const usedState = mpState || {};
      const marketPresences = usedState[marketId];
      const usedPresences = marketPresences || [];
      return signatureMatcher(usedPresences, presenceSignatures);
    });
}

function satisfyMarketStages (marketId, stageSignatures) {
  const helper = new LocalForageHelper(MARKET_STAGES_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((stagesState) => {
      const usedState = stagesState || {};
      const marketStages = usedState[marketId] || [];
      return signatureMatcher(marketStages, stageSignatures);
    });
}