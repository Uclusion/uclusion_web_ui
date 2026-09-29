import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Grid } from '@material-ui/core';
import Comment from '../../components/Comments/Comment';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { RenderCensus } from '../../utils/renderProfiler';
import {
  getFullStage,
  getInReviewStage,
  isNotDoingStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import {
  doesCommentResolutionRestoreStage,
  getFormerStageId,
  getWorkflowStageContext,
} from '../../utils/commentFunctions';
import { useHotkeys } from 'react-hotkeys-hook';
import { getInvestibleComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { displayedCommentRoots } from './commentOrder';

export {
  displayedCommentRoots,
  getSortedRoots,
  sortInProgress,
  sortRootsByUpdatedAt,
} from './commentOrder';

function CommentBox(props) {
  const { comments, marketId, isInbox, isRequiresInput, isInBlocking, assigned, formerStageId, isReply, wizardProps,
    fullStage = {}, stage, replyEditId, usePadding, issueWarningId, marketInfo, investible, removeActions, inboxMessageId,
    showVoting, selectedInvestibleIdParent, preserveOrder, isMove, toggleCompression, useCompression: rawUseCompression,
    useInProgressSorting, displayRepliesAsTop=false, compressAll=false, showNotes=false,
    inNotesTab=false, investibleComments, simpleOrdering, pokeAIMarketId, pokeAIParentTicketCode,
    ignoreSearch=false, oldestFirst=false } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  let sortedRoots = displayedCommentRoots(comments, searchResults, {
    preserveOrder, isInbox, simpleOrdering, oldestFirst, ignoreSearch, useInProgressSorting,
    investibleCommentsForSort: useInProgressSorting
      ? getInvestibleComments(marketInfo?.investible_id, marketId, commentsState) : undefined,
    investiblesState, marketPresencesState, commentsState,
  });
  if (_.isEmpty(sortedRoots) && displayRepliesAsTop) {
    // Must be displaying some part of a thread lower than root
    sortedRoots = comments;
  }
  const useFullStage = _.isEmpty(fullStage) && stage ? getFullStage(marketStagesState, marketId, stage) : fullStage;
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const jobComments = investibleComments || comments;
  const formerStageOnResolve = getFormerStageId(formerStageId, marketId, marketStagesState);
  const workflowStageContext = getWorkflowStageContext(
    marketStagesState, marketId, useFullStage, formerStageId
  );

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
      const restoresFormerStage = doesCommentResolutionRestoreStage(
        comment, jobComments, assigned, marketPresences, workflowStageContext
      );
      return (
        <Grid item key={id} xs={12}>
          <div id={`${isInbox ? 'inbox' : ''}c${id}`}
               style={{paddingBottom: (wizardProps || isInbox) ? undefined : '1.25rem', marginRight: isInbox ? '0.5rem' : undefined}}>
            <Comment
              resolvedStageId={((isRequiresInput && [QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(commmentType))
              || (isInBlocking && commmentType === ISSUE_TYPE)) && restoresFormerStage ?
                formerStageOnResolve : undefined}
              stagePreventsActions={isNotDoingStage(useFullStage) || getInReviewStage(useFullStage)}
              removeActions={removeActions}
              investibleComments={investibleComments}
              showVoting={showVoting}
              depth={0}
              compressAll={compressAll}
              marketId={marketId}
              pokeAIMarketId={pokeAIMarketId}
              pokeAIParentTicketCode={pokeAIParentTicketCode || marketInfo?.ticket_code}
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
    <RenderCensus id="CommentBox">
      <Grid id="commentBox" container spacing={1}
            style={{paddingBottom: _.isEmpty(sortedRoots) || isInbox || usePadding === false ? 0 : '45vh', margin: 0}}>
        {getCommentCards()}
      </Grid>
    </RenderCensus>
  );
}

CommentBox.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired,
  fullStage: PropTypes.object,
  ignoreSearch: PropTypes.bool,
  oldestFirst: PropTypes.bool,
  pokeAIMarketId: PropTypes.string,
  pokeAIParentTicketCode: PropTypes.string
};

export default CommentBox;
