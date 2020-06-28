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
 * CHecks local storage for things that can satisfy the fetch signatures.
 * Returns the set of signatures that _can't_ be satisfied from local storage
 * @param versionSignatures
 * @param fetchSignatures
 */
export async function checkInStorage (fetchSignatures) {
  const {
    comments,
    markets,
    marketPresences,
    investibles,
    marketStages,
  } = fetchSignatures;
  // using await here since it's less tedious and logically
  // equivalent to doing chained thens
  const commentsMatches = await satisfyComments(comments);
  // keep updating the required versions so it's an ever shrinking map
  const investibleMatches = await satisfyInvestibles(investibles);
  const marketMatches = await satisfyMarkets(markets);
  const presenceMatches = await satisfyMarketPresences(marketPresences);
  const stageMatches = await satisfyMarketStages(marketStages);
  const signaturesObject = {
    comments: commentsMatches,
    investibles: investibleMatches,
    markets: marketMatches,
    marketPresences: presenceMatches,
    marketStages: stageMatches,
  };
  return signaturesObject;
}

function satisfyComments (commentSignatures) {
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
      const matchResult = signatureMatcher(allComments, commentSignatures);
      return matchResult.unmatchedSignatures;
    });
}

function satisfyInvestibles (investibleSignatures) {
  const helper = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((investibleState) => {
      const usedState = investibleState || {};
      const allInvestibles = _.values(usedState);
      const matchResult = signatureMatcher(allInvestibles, investibleSignatures);
      return matchResult.unmatchedSignatures;
    });
}

function satisfyMarkets (marketsSignatures) {
  const helper = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((marketsState) => {
      const usedState = marketsState || {};
      const allMarkets = usedState.marketDetails || [];
      const matchResult = signatureMatcher(allMarkets, marketsSignatures);
      return matchResult.unmatchedSignatures;
    });
}

function satisfyMarketPresences (presenceSignatures) {
  const helper = new LocalForageHelper(MARKET_PRESENCES_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((mpState) => {
      const usedState = mpState || {};
      const allPresences = _.flatten(_.values(usedState));
      const matchResult = signatureMatcher(allPresences, presenceSignatures);
      return matchResult.unmatchedSignatures;
    });
}

function satisfyMarketStages (stageSignatures) {
  const helper = new LocalForageHelper(MARKET_STAGES_CONTEXT_NAMESPACE);
  return helper.getState()
    .then((stagesState) => {
      const usedState = stagesState || {};
      const allStages = _.flatten(_.values(usedState));
      const matchResult = signatureMatcher(allStages, stageSignatures);
      return matchResult.unmatchedSignatures;
    });
}