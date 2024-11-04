import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Grid } from '@material-ui/core';
import Comment from '../../components/Comments/Comment';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { getFullStage, isNotDoingStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getFormerStageId, isSingleAssisted } from '../../utils/commentFunctions';

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

export function getSortedRoots(allComments, searchResults, preserveOrder, isInboxExpansion) {
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

export function sortInProgress(roots) {
  const sorted = [];
  const inProgressSorted = [];
  roots.forEach((comment) => {
    const { in_progress: inProgress, resolved } = comment;
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
    fullStage, stage, replyEditId, usePadding, issueWarningId, marketInfo, investible, removeActions, inboxMessageId,
    showVoting, selectedInvestibleIdParent, preserveOrder, isMove, toggleCompression, useCompression: rawUseCompression,
    useInProgressSorting, displayRepliesAsTop=false, compressAll=false } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [searchResults] = useContext(SearchResultsContext);
  let sortedRoots = getSortedRoots(comments, searchResults, preserveOrder, isInbox);
  if (useInProgressSorting) {
    sortedRoots = sortInProgress(sortedRoots);
  }
  if (_.isEmpty(sortedRoots) && displayRepliesAsTop) {
    // Must be displaying some part of a thread lower than root
    sortedRoots = comments;
  }
  const useFullStage = _.isEmpty(fullStage) && stage ? getFullStage(marketStagesState, marketId, stage) : fullStage;
  const resolvedStageId = isSingleAssisted(comments, assigned) ?
    getFormerStageId(formerStageId, marketId, marketStagesState) : undefined;

  function getCommentCards() {
    return sortedRoots.map(comment => {
      const { id, comment_type: commmentType } = comment;
      return (
        <Grid item key={id} xs={12}>
          <div id={`${isInbox ? 'inbox' : ''}c${id}`}
               style={{paddingBottom: (wizardProps || isInbox) ? undefined : '1.25rem'}}>
            <Comment
              resolvedStageId={(isRequiresInput && [QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(commmentType))
              || (isInBlocking && commmentType === ISSUE_TYPE) ? resolvedStageId : undefined}
              stagePreventsActions={isNotDoingStage(useFullStage) || removeActions}
              removeActions={removeActions}
              showVoting={showVoting}
              depth={0}
              compressAll={compressAll}
              marketId={marketId}
              comment={comment}
              comments={comments}
              isInbox={isInbox}
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

CommentBox.defaultProps = {
  fullStage: {}
}

export default CommentBox;
