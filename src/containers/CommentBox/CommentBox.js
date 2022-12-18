import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Grid } from '@material-ui/core';
import Comment from '../../components/Comments/Comment';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { getFullStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { getOlderReports } from '../../components/Comments/CommentAdd'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { FormattedMessage } from 'react-intl'
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
    fullStage, stage, replyEditId, usePadding, issueWarningId, marketInfo, investible, isDraft, removeActions,
    showVoting } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const sortedRoots = getSortedRoots(comments, searchResults);
  const useFullStage = _.isEmpty(fullStage) && stage ? getFullStage(marketStagesState, marketId, stage) : fullStage;
  const resolvedStageId = isSingleAssisted(comments, assigned) ?
    getFormerStageId(formerStageId, marketId, marketStagesState) : undefined;

  function getCommentCards() {
    const presences = getMarketPresences(marketPresencesState, marketId) || [];
    const myPresence = presences.find((presence) => presence.current_user) || {};
    const olderReports = getOlderReports(undefined, comments, marketId, (marketInfo || {}).investible_id,
      myPresence);
    const numReports = _.size(olderReports);
    return sortedRoots.map(comment => {
      const { id, comment_type: commmentType } = comment;
      return (
        <Grid item key={id} xs={12}>
          <div id={`${isInbox ? 'inbox' : ''}c${id}`} style={{paddingBottom: '1.25rem'}}>
            {isDraft && (
              <h2 style={{marginBottom: 0, paddingBottom: 0}}>
                <FormattedMessage id="draft"/>
              </h2>
            )}
            <Comment
              resolvedStageId={(isRequiresInput && [QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(commmentType))
              || (isInBlocking && commmentType === ISSUE_TYPE) ? resolvedStageId : undefined}
              stagePreventsActions={useFullStage.close_comments_on_entrance || removeActions}
              removeActions={removeActions}
              showVoting={showVoting}
              depth={0}
              marketId={marketId}
              comment={comment}
              comments={comments}
              allowedTypes={allowedTypes}
              isInbox={isInbox}
              replyEditId={replyEditId}
              numReports={numReports}
              marketInfo={marketInfo}
              issueWarningId={issueWarningId} currentStageId={(marketInfo || {}).stage}
              investible={investible}
            />
          </div>
        </Grid>
      );
    });
  }

  return (
    <Grid id="commentBox" container spacing={1}
          style={{paddingBottom: _.isEmpty(sortedRoots) || isInbox || usePadding === false ? 0 : '45vh'}}>
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
