import { useContext } from 'react';
import { useHistory } from 'react-router';
import _ from 'lodash';
import { CommentsContext } from '../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../contexts/MarketsContext/MarketsContext';
import { MarketStagesContext } from '../contexts/MarketStagesContext/MarketStagesContext';
import { MarketPresencesContext } from '../contexts/MarketPresencesContext/MarketPresencesContext';
import { NotificationsContext } from '../contexts/NotificationsContext/NotificationsContext';
import { SearchResultsContext } from '../contexts/SearchResultsContext/SearchResultsContext';
import { getComment, getCommentRoot, getMarketComments } from '../contexts/CommentsContext/commentsContextHelper';
import { getMarketInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper';
import { getMarket } from '../contexts/MarketsContext/marketsContextHelper';
import { getMarketPresences } from '../contexts/MarketPresencesContext/marketPresencesHelper';
import { getInCurrentVotingStage, getProposedOptionsStage } from '../contexts/MarketStagesContext/marketStagesContextHelper';
import { displayedCommentRoots, displayedReplies } from '../containers/CommentBox/commentOrder';
import { JUSTIFY_TYPE, TODO_TYPE } from '../constants/comments';
import { formCommentLink, navigate } from './marketIdPathFunctions';
import { optionsInDisplayOrder } from './optionOrder';
import { calculateInvestibleVoters } from './votingUtils';

// Search results are relevance ordered and include contextual parent IDs separately.
// The caller supplies section display order; only actual result IDs are destinations.
export function firstSearchCommentMatch(orderedRoots, snapshot) {
  const { searchResults, commentsState, marketsState, investiblesState, marketStagesState,
    marketPresencesState, messagesState } = snapshot;
  const matches = new Set((searchResults.results || []).map((result) => result.id));

  function destination(comment) {
    const marketId = comment.market_id;
    const root = getCommentRoot(commentsState, marketId, comment.id) || comment;
    const market = getMarket(marketsState, marketId);
    const parent = market?.parent_comment_id &&
      getComment(commentsState, market.parent_comment_market_id, market.parent_comment_id);
    const pageRoot = parent || root;
    const url = formCommentLink(parent ? market.parent_comment_market_id : marketId,
      pageRoot.group_id, pageRoot.investible_id, comment.id);
    return {
      url,
      state: { searchMatch: { marketId, commentId: root.id } },
    };
  }

  function firstInThread(comment) {
    if (matches.has(comment.id)) return destination(comment);
    const comments = getMarketComments(commentsState, comment.market_id);
    for (const reply of displayedReplies(comment, comments)) {
      const found = firstInThread(reply);
      if (found) return found;
    }
    return firstInOptions(comment);
  }

  function firstInOptions(parent) {
    const marketId = parent.inline_market_id;
    if (!marketId) return undefined;
    const presences = getMarketPresences(marketPresencesState, marketId);
    const options = getMarketInvestibles(investiblesState, marketId, searchResults);
    const stages = [getInCurrentVotingStage(marketStagesState, marketId),
      getProposedOptionsStage(marketStagesState, marketId)];
    for (const stage of stages.filter(Boolean)) {
      for (const option of optionsInDisplayOrder(options, stage, marketId, presences, messagesState)) {
        const optionId = option.investible.id;
        if (matches.has(optionId)) {
          const page = destination(parent);
          return { ...page, url: `${page.url.split('#')[0]}#option${optionId}` };
        }
        const comments = getMarketComments(commentsState, marketId)
          .filter((comment) => comment.investible_id === optionId);
        const ordered = displayedCommentRoots(comments, searchResults, snapshot);
        const voters = calculateInvestibleVoters(optionId, marketId, marketsState, investiblesState,
          presences, false);
        const reasons = _.sortBy(voters, 'quantity', 'updatedAt')
          .map((voter) => comments.find((comment) => comment.id === voter.commentId)).filter(Boolean);
        // DecisionInvestible displays info, approvals, then other comments.
        const roots = ordered.filter((comment) => comment.comment_type === TODO_TYPE)
          .concat(stage.allows_investment ? reasons : [])
          .concat(ordered.filter((comment) => ![TODO_TYPE, JUSTIFY_TYPE].includes(comment.comment_type)));
        for (const root of roots) {
          const found = firstInThread(root);
          if (found) return found;
        }
      }
    }
    return undefined;
  }

  for (const root of orderedRoots || []) {
    const found = firstInThread(root);
    if (found) return found;
  }
  return undefined;
}

export function useSearchMatchNavigation() {
  const history = useHistory();
  const [searchResults] = useContext(SearchResultsContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState] = useContext(NotificationsContext);
  const snapshot = { searchResults, commentsState, marketsState, investiblesState, marketStagesState,
    marketPresencesState, messagesState };
  return {
    firstCommentMatch: (orderedRoots) => firstSearchCommentMatch(orderedRoots, snapshot),
    openMatch: (target, replace = false) => {
      if (target) {
        navigate(history, target.url, false, replace,
          { ...target.state, searchMatch: target.state?.searchMatch || {} });
      }
    },
  };
}
