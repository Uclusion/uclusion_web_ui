import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Grid } from '@material-ui/core';
import Comment from '../../components/Comments/Comment';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import {
  getFullStage,
  getInCurrentVotingStage,
  isFurtherWorkStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper'

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

export function getSortedRoots(allComments, searchResults) {
  const { results, parentResults, search } = searchResults;
  if (_.isEmpty(allComments)) {
    return [];
  }
  let comments = allComments;
  if (!_.isEmpty(search)) {
    comments = allComments.filter((comment) => {
      return results.find((item) => item.id === comment.id) || parentResults.find((id) => id === comment.id);
    });
  }
  const threadRoots = comments.filter(comment => !comment.reply_id) || [];
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

function CommentBox(props) {
  const { comments, marketId, allowedTypes, isInbox, isRequiresInput, isInBlocking, assigned, formerStageId,
    fullStage, stage, replyEditId } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [searchResults] = useContext(SearchResultsContext);
  const sortedRoots = getSortedRoots(comments, searchResults);
  const useFullStage = _.isEmpty(fullStage) && stage ? getFullStage(marketStagesState, marketId, stage) : fullStage;
  function getFormerStageId() {
    if (!formerStageId) {
      return formerStageId;
    }
    const formerStage = getFullStage(marketStagesState, marketId, formerStageId);
    if (!isFurtherWorkStage(formerStage)) {
      return formerStageId;
    }
    return (getInCurrentVotingStage(marketStagesState, marketId) || {}).id;
  }
  const resolvedStageId = (isRequiresInput && _.size(comments.filter(
    comment => (comment.comment_type === QUESTION_TYPE || comment.comment_type === SUGGEST_CHANGE_TYPE)
      && !comment.resolved && assigned.includes(comment.created_by)
  )) === 1) || (isInBlocking && _.size(comments.filter(
    comment => comment.comment_type === ISSUE_TYPE && !comment.resolved
  )) === 1) ? getFormerStageId() : undefined;

  function getCommentCards() {
    return sortedRoots.map(comment => {
      const { id } = comment;
      return (
        <Grid item key={id} xs={12}>
          <div id={`c${id}`} style={{paddingBottom: '1.25rem'}}>
            <Comment
              resolvedStageId={resolvedStageId}
              stagePreventsActions={useFullStage.close_comments_on_entrance}
              depth={0}
              marketId={marketId}
              comment={comment}
              comments={comments}
              allowedTypes={allowedTypes}
              isInbox={isInbox}
              replyEditId={replyEditId}
            />
          </div>
        </Grid>
      );
    });
  }

  return (
    <Grid id="commentBox" container spacing={1} style={{paddingBottom: _.isEmpty(sortedRoots) || isInbox ? 0 : '45vh'}}>
      {getCommentCards()}
    </Grid>
  );
}

CommentBox.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired,
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  fullStage: PropTypes.object
};

CommentBox.defaultProps = {
  fullStage: {}
}

export default CommentBox;
