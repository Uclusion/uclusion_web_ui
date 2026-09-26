import { useContext, useRef } from 'react';
import _ from 'lodash';
import { CommentsContext } from '../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../contexts/MarketsContext/MarketsContext';
import { SearchResultsContext } from '../contexts/SearchResultsContext/SearchResultsContext';
import { getComment, getCommentRoot, getInvestibleComments } from '../contexts/CommentsContext/commentsContextHelper';
import { getMarket } from '../contexts/MarketsContext/marketsContextHelper';
import { getMarketPresences } from '../contexts/MarketPresencesContext/marketPresencesHelper';
import { addByIdAndVersion } from '../contexts/ContextUtils';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../constants/comments';
import { isAssistanceRespondedByHuman, sortRootsByCreatedAt } from './commentFunctions';
import { formCommentLink } from './marketIdPathFunctions';

const assistanceTypes = [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE];

function isResponded(root, snapshot) {
  return isAssistanceRespondedByHuman(root,
    getInvestibleComments(root.investible_id, root.market_id, snapshot.commentsState),
    getMarketPresences(snapshot.marketPresencesState, root.market_id),
    snapshot.marketPresencesState, snapshot.commentsState);
}

// API success callbacks still hold the pre-submit render. Project the returned rows over
// the newest context without waiting for React's queued comment/presence dispatches.
export function getSubmissionNavigation(before, current, result) {
  const investment = result?.investmentResult;
  const comment = investment ? result.commentResult?.comment : result;
  const marketId = investment?.market_id || comment?.market_id;
  if (!marketId) {
    return undefined;
  }
  const market = getMarket(before.marketsState, marketId);
  const root = market?.parent_comment_id
    ? getComment(before.commentsState, market.parent_comment_market_id, market.parent_comment_id)
    : getCommentRoot(before.commentsState, marketId, comment?.root_comment_id || comment?.reply_id || comment?.id);
  if (!root?.investible_id || root.resolved ||
    !assistanceTypes.includes(root.comment_type) || isResponded(root, before)) {
    return undefined;
  }

  let { commentsState, marketPresencesState } = current;
  if (comment?.market_id && comment.id) {
    commentsState = { ...commentsState,
      [comment.market_id]: addByIdAndVersion([comment], commentsState[comment.market_id]) };
  }
  if (investment) {
    marketPresencesState = { ...marketPresencesState,
      [marketId]: (marketPresencesState[marketId] || []).map((presence) =>
        presence.id === investment.user_id ? { ...presence,
          investments: _.unionBy([investment], presence.investments || [], 'investible_id') } : presence) };
  }
  const after = { commentsState, marketPresencesState };
  const updatedRoot = getComment(commentsState, root.market_id, root.id);
  if (!updatedRoot || updatedRoot.deleted || updatedRoot.resolved || updatedRoot.investible_id !== root.investible_id ||
    !assistanceTypes.includes(updatedRoot.comment_type) || !isResponded(updatedRoot, after)) {
    return undefined;
  }
  const { search, results = [], parentResults = [] } = current.searchResults;
  const roots = sortRootsByCreatedAt(getInvestibleComments(root.investible_id, root.market_id, commentsState)
    .filter((candidate) => !candidate.reply_id && !candidate.resolved &&
      assistanceTypes.includes(candidate.comment_type) &&
      (candidate.id === root.id || _.isEmpty(search) || results.some((item) => item.id === candidate.id) ||
        parentResults.includes(candidate.id))));
  const position = roots.findIndex((candidate) => candidate.id === root.id);
  const next = roots.slice(position + 1).concat(roots.slice(0, position))
    .find((candidate) => !isResponded(candidate, after));
  return {
    nextLink: next && formCommentLink(next.market_id, next.group_id, next.investible_id, next.id),
    respondedLink: formCommentLink(root.market_id, root.group_id, root.investible_id, root.id),
  };
}

export default function useSubmissionNavigation() {
  const [commentsState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketsState] = useContext(MarketsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const snapshot = { commentsState, marketPresencesState, marketsState, searchResults };
  const latest = useRef(snapshot);
  latest.current = snapshot;
  return (result) => getSubmissionNavigation(snapshot, latest.current, result);
}
