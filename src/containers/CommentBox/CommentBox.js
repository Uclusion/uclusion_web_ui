import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Grid } from '@material-ui/core';
import Comment from '../../components/Comments/Comment';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { getFullStage, getInReviewStage, isNotDoingStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getFormerStageId, isSingleAssisted } from '../../utils/commentFunctions';
import { useHotkeys } from 'react-hotkeys-hook';
import { getInvestibleComments, getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';

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
  inlineActivityTime) {
  const { results, parentResults, search } = searchResults;
  if (_.isEmpty(allComments)) {
    return [];
  }
  let comments = allComments;
  if (!_.isEmpty(search) && !isInboxExpansion) {
    comments = allComments.filter((comment) => {
      return results.find((item) => item.id === comment.id) ||
        parentResults.find((id) => id === comment.id);
    });
  }
  const threadRoots = comments.filter(comment => !comment.reply_id) || [];
  if (preserveOrder) {
    return threadRoots;
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

export function sortInProgress(roots, investibleComments) {
  const sorted = [];
  const inProgressSorted = [];
  roots.forEach((comment) => {
    const { in_progress: inProgressRaw, resolved } = comment;
    const hasInProgress = !_.isEmpty(investibleComments?.find((aComment) => aComment.in_progress 
    && aComment.root_comment_id === comment.id));
    const inProgress = inProgressRaw || hasInProgress;
    if (!inProgress || resolved) {
      sorted.push(comment);
    } else {
      inProgressSorted.push(comment)
    }
  });
  return inProgressSorted.concat(sorted);
}

function CommentBox(props) {
  const { comments, marketId, isInbox, isRequiresInput, isInBlocking, assigned, formerStageId, isReply, wizardProps,
    fullStage = {}, stage, replyEditId, usePadding, issueWarningId, marketInfo, investible, removeActions, inboxMessageId,
    showVoting, selectedInvestibleIdParent, preserveOrder, isMove, toggleCompression, useCompression: rawUseCompression,
    useInProgressSorting, displayRepliesAsTop=false, compressAll=false, showNotes=false,
    inNotesTab=false, investibleComments, simpleOrdering } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  let sortedRoots = getSortedRoots(comments, searchResults, preserveOrder, isInbox, simpleOrdering,
    (root) => getInlineActivityTime(root, investiblesState, marketPresencesState, commentsState));
  if (useInProgressSorting) {
    const investibleComments = getInvestibleComments(marketInfo?.investible_id, marketId, commentsState);
    sortedRoots = sortInProgress(sortedRoots, investibleComments);
  }
  if (_.isEmpty(sortedRoots) && displayRepliesAsTop) {
    // Must be displaying some part of a thread lower than root
    sortedRoots = comments;
  }
  const useFullStage = _.isEmpty(fullStage) && stage ? getFullStage(marketStagesState, marketId, stage) : fullStage;
  const resolvedStageId = isSingleAssisted(comments, assigned) ?
    getFormerStageId(formerStageId, marketId, marketStagesState) : undefined;

  function toggleAnyCompressed() {
    if (rawUseCompression instanceof Function) {
      sortedRoots.forEach((comment) =>{
        if (rawUseCompression(comment.id)) {
          toggleCompression(comment.id);
        }
      });
    }
    else if (rawUseCompression) {
      toggleCompression();
    }
  }
  function toggleAnyNotCompressed() {
    if (rawUseCompression instanceof Function) {
      sortedRoots.forEach((comment) =>{
        if (!rawUseCompression(comment.id)) {
          toggleCompression(comment.id);
        }
      });
    }
    else if (!rawUseCompression) {
      toggleCompression();
    }
  }
  useHotkeys('ctrl+alt+e', toggleAnyCompressed, {enableOnContentEditable: true},
    [rawUseCompression, sortedRoots]);
  useHotkeys('ctrl+shift+e', toggleAnyNotCompressed, {enableOnContentEditable: true},
    [rawUseCompression, sortedRoots]);

  function getCommentCards() {
    return sortedRoots.map(comment => {
      const { id, comment_type: commmentType } = comment;
      const reallyNoAuthor = assigned?.length === 1 && assigned[0] === comment.created_by;
      return (
        <Grid item key={id} xs={12}>
          <div id={`${isInbox ? 'inbox' : ''}c${id}`}
               style={{paddingBottom: (wizardProps || isInbox) ? undefined : '1.25rem', marginRight: isInbox ? '0.5rem' : undefined}}>
            <Comment
              resolvedStageId={(isRequiresInput && [QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(commmentType))
              || (isInBlocking && commmentType === ISSUE_TYPE) ? resolvedStageId : undefined}
              stagePreventsActions={isNotDoingStage(useFullStage) || getInReviewStage(useFullStage)}
              removeActions={removeActions}
              investibleComments={investibleComments}
              showVoting={showVoting}
              depth={0}
              compressAll={compressAll}
              marketId={marketId}
              comment={comment}
              comments={comments}
              isInbox={isInbox}
              showNotes={showNotes}
              inNotesTab={inNotesTab}
              replyEditId={replyEditId}
              marketInfo={marketInfo}
              toggleCompression={toggleCompression}
              useCompression={rawUseCompression instanceof Function ? rawUseCompression(id) : rawUseCompression}
              inboxMessageId={inboxMessageId}
              issueWarningId={issueWarningId} currentStageId={(marketInfo || {}).stage}
              investible={investible}
              selectedInvestibleIdParent={selectedInvestibleIdParent}
              isReply={isReply}
              wizardProps={wizardProps}
              isMove={isMove}
              usePadding={usePadding}
              noAuthor={reallyNoAuthor}
              reallyNoAuthor={reallyNoAuthor}
            />
          </div>
        </Grid>
      );
    });
  }

  return (
    <Grid id="commentBox" container spacing={1}
          style={{paddingBottom: _.isEmpty(sortedRoots) || isInbox || usePadding === false ? 0 : '45vh', margin: 0}}>
      {getCommentCards()}
    </Grid>
  );
}

CommentBox.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired,
  fullStage: PropTypes.object
};

export default CommentBox;
