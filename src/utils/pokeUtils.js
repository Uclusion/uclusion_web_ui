import _ from 'lodash';
import { getGroupPresences, getMarketPresences } from '../contexts/MarketPresencesContext/marketPresencesHelper';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../constants/comments';
import { calculateInvestibleVoters } from './votingUtils';

// The AI user is the only presence without an email
export function getHumanPresences(presences) {
  return (presences || []).filter((presence) => !_.isEmpty(presence.email));
}

/**
 * The people a poke on an in voting investible targets - approval is required of the whole human team minus
 * the assignee, or of the required approvers when there are any. Someone with a current approval or an open
 * question or suggestion on the job has responded and is not poked.
 */
export function getInvestiblePokeList(marketId, investibleId, marketInfo, marketPresences, groupPresencesState,
  marketsState, investiblesState, comments) {
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const votersRaw = calculateInvestibleVoters(investibleId, marketId, marketsState, investiblesState,
    marketPresences, true);
  const voters = votersRaw.filter((voter) => !voter.isExpired && !voter.deleted);
  let candidates;
  if (!_.isEmpty(marketInfo.required_approvers)) {
    candidates = marketPresences.filter((presence) => marketInfo.required_approvers.includes(presence.id));
  } else {
    candidates = getGroupPresences(marketPresences, groupPresencesState, marketId, marketInfo.group_id) || [];
  }
  return getHumanPresences(candidates).filter((presence) => presence.id !== myPresence.id &&
    !voters.find((voter) => voter.id === presence.id) &&
    !(comments || []).find((comment) => !comment.resolved && comment.investible_id === investibleId &&
      comment.created_by === presence.id && [QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type)));
}

/**
 * The people a poke on a comment targets - a reply or a vote is required of the mentioned, or of the whole human
 * team minus the author when there are no mentions. Inline market votes join on external_id since presence ids
 * differ per market.
 */
export function getCommentPokeList(comment, marketId, marketPresences, groupPresencesState, marketPresencesState,
  comments) {
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  let candidates;
  if (!_.isEmpty(comment.mentions)) {
    candidates = marketPresences.filter((presence) =>
      comment.mentions.find((mention) => mention.user_id === presence.id));
  } else {
    candidates = getGroupPresences(marketPresences, groupPresencesState, marketId, comment.group_id) || [];
  }
  let inlineVotedExternalIds = [];
  if (comment.inline_market_id) {
    const inlinePresences = getMarketPresences(marketPresencesState, comment.inline_market_id, true) || [];
    inlineVotedExternalIds = inlinePresences.filter((presence) =>
      !_.isEmpty((presence.investments || []).filter((investment) => !investment.deleted)))
      .map((presence) => presence.external_id);
  }
  return getHumanPresences(candidates).filter((presence) => presence.id !== comment.created_by &&
    presence.id !== myPresence.id && !inlineVotedExternalIds.includes(presence.external_id) &&
    !(comments || []).find((aComment) => aComment.root_comment_id === comment.id &&
      aComment.id !== comment.id && aComment.created_by === presence.id));
}
