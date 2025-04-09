import { getFetchSignaturesForMarket, signatureMatcher } from './versionSignatureUtils';
import _ from 'lodash'
import { getMarketInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper'
import { REPLY_TYPE } from '../constants/comments';

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
export function checkSignatureInStorage(marketId, fetchSignature, storageStates) {
  const serverSignatures = getFetchSignaturesForMarket([{type: fetchSignature.object_type,
    object_versions: [fetchSignature]}]);
  return checkServerSignaturesInStorage(marketId, serverSignatures, storageStates);
}

export function checkServerSignaturesInStorage(marketId, serverSignatures, storageStates) {
  const fromStorage = checkInStorage(marketId, serverSignatures, storageStates);
  const { markets, marketGroups, comments, marketPresences, marketStages, investibles, groupMembers } = fromStorage;
  return markets.allMatched && comments.allMatched && marketPresences.allMatched && marketStages.allMatched
    && investibles.allMatched && marketGroups.allMatched && groupMembers.allMatched;
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
    groupMembers
  } = fetchSignatures;
  const { commentsState, investiblesState, marketsState, marketPresencesState, marketStagesState,
    marketGroupsState, groupMembersState } = storageStates;
  const commentsMatches = satisfyComments(comments, ((commentsState || {})[marketId]) || []);
  // keep updating the required versions so it's an ever shrinking map
  const investibleMatches = satisfyInvestibles(marketId, investibles, investiblesState);
  const marketMatches = satisfyMarkets(markets, marketsState);
  const presenceMatches = satisfyMarketPresences(marketId, marketPresences, marketPresencesState);
  const stageMatches = satisfyMarketStages(marketId, marketStages, marketStagesState);
  const groupMatches = satisfyMarketGroups(marketId, marketGroups, marketGroupsState);
  const groupMembersMatches = satisfyGroupMembers(marketId, groupMembers, groupMembersState);
  return {
    comments: commentsMatches,
    investibles: investibleMatches,
    markets: marketMatches,
    marketPresences: presenceMatches,
    marketStages: stageMatches,
    marketGroups: groupMatches,
    groupMembers: groupMembersMatches
  };
}

export function satisfyComments(commentSignatures, marketComments) {
    const { matched, unmatchedSignatures, allMatched } =
      signatureMatcher(marketComments, commentSignatures || []);
    // check that parent includes child or if parent that all children exist
    // this is required because the parent and child signatures will come in at different times
    let reallyAllMatched = allMatched;
    matched?.forEach((comment) => {
      if (comment.comment_type === REPLY_TYPE) {
        const parent = marketComments.find(aComment => aComment.id === comment.reply_id);
        if (!parent?.children?.includes(comment.id)) {
          console.warn(`From child signature parent ${parent?.id} missing child ${comment.id}`);
          // If parent is not there then need parent else need next version of parent
          unmatchedSignatures.push({id: comment.reply_id, version: parent ? parent.version + 1 : 1});
          reallyAllMatched = false;
        }
      }
      comment?.children?.forEach((childId) => {
        const child = marketComments.find(aComment => aComment.id === childId);
        if (!child) {
          console.warn(`From parent signature parent ${comment.id} missing child ${childId}`);
          unmatchedSignatures.push({id: childId, version: 1});
          reallyAllMatched = false;
        }
      });
    });
    return { matched, unmatchedSignatures, allMatched: reallyAllMatched,
      existingCommentIds: commentSignatures.map((sig) => sig.object_id_one) };
}

function satisfyInvestibles(marketId, investibleSignatures, investibleState) {
    const usedState = investibleState || {};
    const marketInvestibles = getMarketInvestibles(usedState, marketId);
    const marketInfoSignatures = (investibleSignatures || []).filter((sig) => !sig.investible) || [];
    marketInfoSignatures.forEach((marketInfoSignature) => {
      const { object_id_one: marketInfoId } = marketInfoSignature;
      const fullInvestible = marketInvestibles.find((investible) => {
        return !_.isEmpty(investible.market_infos.find((info) => info.id === marketInfoId));
      });
      if (!_.isEmpty(fullInvestible)) {
        // Patch up the signature here so that it can be fetched by investible id later
        marketInfoSignature.investible = {
          id: fullInvestible.investible.id,
        };
      }
    });
    return signatureMatcher(marketInvestibles, investibleSignatures || []);
}

function satisfyMarkets(marketsSignatures, marketsState) {
    const usedState = marketsState || {};
    const allMarkets = usedState.marketDetails || [];
    return signatureMatcher(allMarkets, marketsSignatures || []);
}

function satisfyMarketPresences(marketId, presenceSignatures, mpState) {
    const usedState = mpState || {};
    const marketPresences = usedState[marketId];
    const usedPresences = marketPresences || [];
    return signatureMatcher(usedPresences, presenceSignatures || []);
}

function satisfyMarketStages(marketId, stageSignatures, stagesState) {
    const usedState = stagesState || {};
    const marketStages = usedState[marketId] || [];
    return signatureMatcher(marketStages, stageSignatures || []);
}

function satisfyMarketGroups(marketId, groupSignatures, groupsState) {
  const usedState = groupsState ?? {};
  const marketGroups = usedState[marketId] ?? [];
  return signatureMatcher(marketGroups, groupSignatures || []);
}

function satisfyGroupMembers(marketId, groupSignatures, groupsState) {
  const usedState = groupsState ?? {};
  const allGroupsUsers = _.flatten(Object.values(usedState));
  return signatureMatcher(allGroupsUsers, groupSignatures || []);
}