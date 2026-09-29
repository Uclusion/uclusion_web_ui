import _ from 'lodash';
import { sortRootsByCreatedAt } from '../../utils/commentFunctions';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';

function findGreatestUpdatedAt(roots, comments, rootUpdatedAt) {
  let myRootUpdatedAt = rootUpdatedAt;
  if (_.isEmpty(roots)) {
    return rootUpdatedAt;
  }
  roots.forEach(reply => {
    if (!rootUpdatedAt || (rootUpdatedAt < reply.updated_at)) {
      myRootUpdatedAt = reply.updated_at;
    }
  });
  roots.forEach((reply) => {
    const replyReplies = comments.filter(
      comment => comment.reply_id === reply.id
    );
    myRootUpdatedAt = findGreatestUpdatedAt(replyReplies, comments, myRootUpdatedAt);
  });
  return myRootUpdatedAt;
}

// T-all-2306: activity inside a comment's options - votes, option adds/edits/stage moves, and
// comments on options - lives in the inline market, not the thread, so recency ordering has to
// look there too or acting on an option leaves its thread buried
function getInlineActivityTime(rootComment, investiblesState, marketPresencesState, commentsState) {
  const inlineMarketId = rootComment.inline_market_id;
  if (!inlineMarketId) {
    return 0;
  }
  let latest = 0;
  function fold(updatedAt) {
    if (updatedAt) {
      latest = Math.max(latest, new Date(updatedAt).getTime());
    }
  }
  (getMarketComments(commentsState, inlineMarketId) || []).forEach((comment) => fold(comment.updated_at));
  (getMarketInvestibles(investiblesState, inlineMarketId) || []).forEach((inv) => {
    fold(inv.investible.updated_at);
    (inv.market_infos || []).forEach((info) => fold(info.updated_at));
  });
  (getMarketPresences(marketPresencesState, inlineMarketId) || []).forEach((presence) => {
    (presence.investments || []).forEach((investment) => fold(investment.updated_at));
  });
  return latest;
}

export function getSortedRoots(allComments, searchResults, preserveOrder, isInboxExpansion, simpleOrdering,
  inlineActivityTime, ignoreSearch = false, oldestFirst = false) {
  const { results, parentResults, search } = searchResults;
  if (_.isEmpty(allComments)) {
    return [];
  }
  let comments = allComments;
  if (!ignoreSearch && !_.isEmpty(search) && !isInboxExpansion) {
    comments = allComments.filter((comment) => {
      return results.find((item) => item.id === comment.id) ||
        parentResults.find((id) => id === comment.id);
    });
  }
  const threadRoots = comments.filter(comment => !comment.reply_id) || [];
  if (preserveOrder) {
    return threadRoots;
  }
  if (oldestFirst) {
    return sortRootsByCreatedAt(threadRoots);
  }
  const withRootUpdatedAt = threadRoots.map((root) => {
    return { ...root, rootUpdatedAt: findGreatestUpdatedAt([root], comments) };
  });
  if (simpleOrdering) {
    // T-all-2306: most recently updated thread first, no grouping by type, counting activity
    // in the thread's options as updates
    return _.orderBy(withRootUpdatedAt, [(root) => Math.max(new Date(root.rootUpdatedAt).getTime(),
      inlineActivityTime ? inlineActivityTime(root) : 0)], ['desc']);
  }
  const simpleOrdered = _.orderBy(withRootUpdatedAt, ['rootUpdatedAt'], ['desc']) || [];
  const positions = {};
  const typeLengths = {};
  const fullOrdered = [];
  let endBeforeResolved = 0;
  // Keep types together but have the groups ordered by most recently updated type to last and resolved on the end
  simpleOrdered.forEach((comment) => {
    const { resolved, comment_type: commentType } = comment;
    if (resolved) {
      fullOrdered.push(comment);
    } else {
      if (positions[commentType] === undefined) {
        positions[commentType] = endBeforeResolved;
        typeLengths[commentType] = 0;
      }
      endBeforeResolved += 1;
      fullOrdered.splice(positions[commentType] + typeLengths[commentType], 0, comment);
      typeLengths[commentType] += 1;
      //Bump all types which have higher positions by one
      Object.keys(positions).forEach((aType) => {
        if (positions[aType] > positions[commentType])
          positions[aType] += 1;
      });
    }
  });
  return fullOrdered;
}

// B-all-662: the Debatable Resolved tab orders by the root's own updated_at,
// most recent first. A later reply is not an update of the question.
export function sortRootsByUpdatedAt(roots) {
  return _.orderBy(roots || [], [
    (root) => new Date(root.updated_at).getTime() || 0,
    'id',
  ], ['desc', 'asc']);
}

export function displayedCommentRoots(comments, searchResults, {
  preserveOrder = false,
  isInbox = false,
  simpleOrdering = false,
  oldestFirst = false,
  ignoreSearch = false,
  useInProgressSorting = false,
  investibleCommentsForSort,
  investiblesState,
  marketPresencesState,
  commentsState,
} = {}) {
  let sortedRoots = getSortedRoots(comments, searchResults, preserveOrder, isInbox, simpleOrdering,
    (root) => getInlineActivityTime(root, investiblesState, marketPresencesState, commentsState),
    ignoreSearch, oldestFirst);
  if (useInProgressSorting) {
    sortedRoots = sortInProgress(sortedRoots, investibleCommentsForSort);
  }
  return sortedRoots;
}

export function sortInProgress(roots, investibleComments) {
  const sorted = [];
  const inProgressSorted = [];
  roots.forEach((comment) => {
    const { in_progress: inProgressRaw, resolved } = comment;
    const hasInProgress = !_.isEmpty(investibleComments?.find((aComment) => aComment.in_progress
    && aComment.root_comment_id === comment.id && aComment.id !== comment.id));
    const inProgress = inProgressRaw || hasInProgress;
    if (!inProgress || resolved) {
      sorted.push(comment);
    } else {
      inProgressSorted.push(comment)
    }
  });
  return inProgressSorted.concat(sorted);
}
