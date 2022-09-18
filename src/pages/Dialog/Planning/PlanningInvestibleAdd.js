import React, { useContext, useState } from 'react'
import _ from 'lodash'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { Card, CardActions, CardContent, Checkbox, FormControlLabel, Typography, useMediaQuery, useTheme }
  from '@material-ui/core'
import { addPlanningInvestible } from '../../../api/investibles'
import { processTextAndFilesForSave } from '../../../api/files'
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions'
import AssignmentList from './AssignmentList'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import CardType, { QUESTION_TYPE, STORY_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../components/CardType'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import AddInitialVote from '../../Investible/Voting/AddInitialVote'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getMarketPresences,
  partialUpdateInvestment
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { updateInvestment } from '../../../api/marketInvestibles'
import {
  getMarketComments,
  refreshMarketComments,
} from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { moveComments } from '../../../api/comments'
import Comment from '../../../components/Comments/Comment'
import { getAcceptedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { assignedInStage } from '../../../utils/userFunctions'
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { convertDescription } from '../../../utils/stringFunctions'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Clear, Done, Send } from '@material-ui/icons'
import { useEditor } from '../../../components/TextEditors/quillHooks'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { removeMessagesForCommentId } from '../../../utils/messageUtils'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import WarningDialog from '../../../components/Warnings/WarningDialog'
import { useLockedDialogStyles } from '../DialogBodyEdit'
import IssueDialog from '../../../components/Warnings/IssueDialog'
import { getQuillStoredState, resetEditor } from '../../../components/TextEditors/Utilities/CoreUtils'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import AddNewUsers from '../UserManagement/AddNewUsers'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper'
import { isEveryoneGroup } from '../../../contexts/GroupMembersContext/groupMembersHelper'

function PlanningInvestibleAdd(props) {
  const {
    marketId, classes, onCancel, onSave, onSpinComplete, fromCommentIds, votesRequired, maxBudgetUnit, useBudget,
    storyAssignee, furtherWorkType, groupId,
  } = props;
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState] = useContext(NotificationsContext);
  const [open, setOpen] = useState(false);
  const lockedDialogClasses = useLockedDialogStyles();
  const [assignments, setAssignments] = useState(undefined);
  const [openIssue, setOpenIssue] = useState(false);
  const comments = marketId ? getMarketComments(commentsState, marketId) : [];
  const [investibleState] = useContext(InvestiblesContext);
  const [presencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId) || {};
  const [groupState] = useContext(MarketGroupsContext);
  const group = getGroup(groupState, marketId, groupId);
  const presences = getMarketPresences(presencesState, marketId);
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const acceptedStage = marketId ? getAcceptedStage(marketStagesState, marketId) : {};
  const [investibleAddStateFull, investibleAddDispatch] = usePageStateReducer('investibleAdd');
  const [investibleAddState, updateInvestibleAddState, investibleAddStateReset] =
    getPageReducerPage(investibleAddStateFull, investibleAddDispatch, groupId ? groupId : 'inbox',
      {
        maxBudgetUnit: '',
        skipApproval: false
      });
  const openForInvestmentDefault = furtherWorkType === 'readyToStart';
  const {
    skipApproval,
    openForInvestment,
    maxBudget,
    quantity,
    uploadedFiles,
    voteUploadedFiles,
    toAddClean
  } = investibleAddState;
  const isAssignedToMe = (assignments || (storyAssignee ? [storyAssignee] : [])).includes(myPresence.id);
  const isAssigned = !_.isEmpty(assignments) || storyAssignee;
  const editorName = groupId ? `${groupId}-planning-inv-add` : 'planning-inv-add';
  const editorSpec = {
    placeholder: intl.formatMessage({ id: 'investibleAddDescriptionDefault' }),
    onUpload: onS3Upload,
    value: getQuillStoredState(editorName)
  }
  if (marketId) {
    editorSpec.marketId = marketId;
  }
  const [Editor, resetMainEditor] = useEditor(editorName, editorSpec);

  function onQuantityChange(event) {
    const { value } = event.target;
    updateInvestibleAddState({quantity: parseInt(value, 10)});
  }

  function onBudgetChange(event) {
    const { value } = event.target;
    if (value) {
      updateInvestibleAddState({maxBudget: parseInt(value, 10)});
    } else {
      updateInvestibleAddState({maxBudget: ''});
    }
  }

  function onAssignmentsChange(newAssignments) {
    setAssignments(newAssignments);
  }

  function onS3Upload(metadatas) {
    updateInvestibleAddState({uploadedFiles: metadatas})
  }

  function zeroCurrentValues() {
    setOpenIssue(false);
    resetMainEditor();
    resetEditor(initialVoteEditorName);
    investibleAddStateReset();
  }

  function handleCancel() {
    zeroCurrentValues();
    onCancel();
  }

  const initialVoteEditorName = groupId ? `${groupId}-add-initial-vote` : 'add-initial-vote';

  function handleSave() {
    return handleSaveImpl(false);
  }
  
  function handleSaveImpl(resolveComments, doWarn = true) {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, getQuillStoredState(editorName));
    const { name, description} = convertDescription(tokensRemoved);
    const addInfo = {
      uploadedFiles: filteredUploads,
      description,
      groupId,
      marketId,
      name
    };
    if (_.isEmpty(addInfo.name)) {
      setOperationRunning(false);
      setOpenIssue('noName');
      return;
    }
    const currentVoteUploadedFiles = voteUploadedFiles || [];
    const reason = getQuillStoredState(initialVoteEditorName);
    const hasQuestions = reason && (reason.indexOf('? ') > 0 || reason.indexOf('?<') > 0);
    const {
      uploadedFiles: filteredVoteUploads,
      text: reasonTokensRemoved,
    } = processTextAndFilesForSave(currentVoteUploadedFiles, reason);
    if (doWarn && (hasQuestions || !_.isEmpty(filteredVoteUploads))) {
      setOperationRunning(false);
      const warningId = (hasQuestions && !_.isEmpty(filteredVoteUploads)) ? 'noQuestionUploads' :
        (hasQuestions ? 'noQuestions' : 'noUploads');
      setOpenIssue(warningId);
      return;
    }
    if (!isAssignedToMe && isAssigned && quantity === undefined) {
      setOperationRunning(false);
      setOpenIssue('noQuantity');
      return;
    }
    if (isAssigned && marketId) {
      addInfo.assignments = assignments || [storyAssignee];
    }
    if (skipApproval) {
      addInfo.stageId = acceptedStage.id;
    }
    if (openForInvestment || openForInvestmentDefault) {
      addInfo.openForInvestment = true;
    }
    if (!_.isEmpty(toAddClean)) {
      addInfo.addressed = toAddClean.map((added) => {
        const found = presences.find((presence) => presence.external_id === added.external_id);
        return found.id;
      });
    }
    return addPlanningInvestible(addInfo).then((inv) => {
      if (fromCommentIds) {
        const { investible } = inv;
        return moveComments(marketId, investible.id, fromCommentIds,
          resolveComments && requiresInputId ? [requiresInputId] : undefined)
          .then((movedComments) => {
            const comments = getMarketComments(commentsState, marketId) || [];
            let threads = []
            fromCommentIds.forEach((commentId) => {
              removeMessagesForCommentId(commentId, messagesState);
              const thread = comments.filter((aComment) => {
                return aComment.root_comment_id === commentId;
              });
              const fixedThread = thread.map((aComment) => {
                return {investible_id: investible.id, ...aComment};
              });
              threads = threads.concat(fixedThread);
            });
            refreshMarketComments(commentsDispatch, marketId, [...movedComments, ...threads, ...comments]);
            return inv;
          });
      }
      return inv;
    }).then((inv) => {
      const { investible } = inv;
      onSave(inv);
      const link = formInvestibleLink(marketId, investible.id);
      if (isAssignedToMe || !isAssigned) {
        setOperationRunning(false);
        zeroCurrentValues();
        return onSpinComplete(link);
      }
      const updateInfo = {
        marketId,
        investibleId: investible.id,
        newQuantity: quantity,
        currentQuantity: 0,
        newReasonText: reasonTokensRemoved,
        reasonNeedsUpdate: !_.isEmpty(reason),
        maxBudget,
        maxBudgetUnit,
        uploadedFiles: filteredVoteUploads
      };
      return updateInvestment(updateInfo).then(result => {
        const { commentResult, investmentResult } = result;
        const { commentAction, comment } = commentResult;
        if (commentAction !== "NOOP") {
          const comments = getMarketComments(commentsState, marketId);
          refreshMarketComments(commentsDispatch, marketId, [comment, ...comments]);
        }
        partialUpdateInvestment(marketPresencesDispatch, investmentResult, true);
        setOperationRunning(false);
        zeroCurrentValues();
        return onSpinComplete(link);
      });
    });
  }

  function getRequiresInputId() {
    // For now only supporting one since no UI to get more than one
    let aRequireInputId = undefined;
    (fromCommentIds || []).forEach((fromCommentId) => {
      const fromComment = comments.find((comment) => comment.id === fromCommentId);
      if (!fromComment.resolved && (assignments || []).includes(fromComment.created_by)
        && (fromComment.comment_type === QUESTION_TYPE || fromComment.comment_type === SUGGEST_CHANGE_TYPE)) {
        aRequireInputId = fromComment.id;
      }
    });
    return aRequireInputId;
  }

  const requiresInputId = getRequiresInputId();

  function getAddedComments() {
    return (fromCommentIds || []).map((fromCommentId) => {
      const fromComment = comments.find((comment) => comment.id === fromCommentId);
      return (
        <div style={{marginTop: "2rem"}}>
          <Comment
            depth={0}
            marketId={marketId}
            comment={fromComment}
            comments={comments}
            allowedTypes={[TODO_TYPE]}
            stagePreventsActions
          />
        </div>
      );
    });
  }

  const requiresInput = requiresInputId && !mobileLayout;

  const assignedInAcceptedStage = assignedInStage(getMarketInvestibles(investibleState, marketId), myPresence.id,
    acceptedStage.id, marketId);
  const acceptedFull = acceptedStage.allowed_investibles > 0 && assignedInAcceptedStage.length >= acceptedStage.allowed_investibles;
  const cardId = `card${groupId ? `investibleAdd${groupId}` : 'inboxAddInvestible'}`;
  return (
    <>
      <Card className={classes.overflowVisible} id={cardId}>
        <CardType
          className={classes.cardType}
          label={`${intl.formatMessage({
            id: "investibleDescription"
          })}`}
          type={STORY_TYPE}
        />
        <CardContent style={{paddingBottom: 0, marginBottom: 0}}>
          <div className={classes.cardContent}
               style={{paddingLeft: 0, paddingRight: 0, paddingBottom: 0, marginBottom: 0, paddingTop: 0,
                 display: mobileLayout ? 'block' : undefined}}>
            {(!storyAssignee || isAssignedToMe) && _.isEmpty(furtherWorkType) && marketId && (
              <>
                {!storyAssignee && _.isEmpty(furtherWorkType) && !_.isEmpty(presences) && (
                  <AssignmentList
                    fullMarketPresences={presences}
                    onChange={onAssignmentsChange}
                    emptyListHeader='emptyAssignmentHeader'
                  />
                )}
                <div>
                  <legend>{intl.formatMessage({ id: 'agilePlanFormFieldsetLabelOptional' })}</legend>
                  <FormControlLabel
                    control={ isAssigned ? <Checkbox
                        value={skipApproval}
                        disabled={votesRequired > 1 || acceptedFull || !acceptedStage.id || !isAssignedToMe}
                        checked={skipApproval}
                        onClick={() => updateInvestibleAddState({ skipApproval: !skipApproval })}
                      /> : <Checkbox
                      value={openForInvestment}
                      checked={openForInvestment || openForInvestmentDefault}
                      disabled={furtherWorkType !== undefined}
                      onClick={() => updateInvestibleAddState({ openForInvestment: !openForInvestment })} />
                  }
                    label={intl.formatMessage({ id: isAssigned ? 'skipApprovalExplanation' :
                        'readyToStartCheckboxExplanation' })}
                  />
                </div>
              </>
            )}
            {!isEveryoneGroup(groupId, marketId) && (
              <div>
                <Typography variant="body1" style={{paddingLeft: '0.2rem'}}>
                  {intl.formatMessage({ id: 'investibleAddOthersExplanation' })}
                </Typography>
                <AddNewUsers market={market} setToAddClean={(value) => updateInvestibleAddState({toAddClean: value})}
                             isAddToGroup group={group}/>
              </div>
            )}
          </div>
          {Editor}
        </CardContent>
        {!isAssignedToMe && isAssigned && (
          <AddInitialVote
            marketId={marketId}
            onBudgetChange={onBudgetChange}
            onChange={onQuantityChange}
            newQuantity={quantity}
            showBudget={useBudget}
            maxBudget={maxBudget}
            maxBudgetUnit={maxBudgetUnit}
            onUpload={(files) => updateInvestibleAddState({uploadedFiles: files})}
            editorName={initialVoteEditorName}
          />
        )}
        <CardActions style={{paddingLeft: '1.25rem', paddingBottom: '1rem', paddingTop: 0, marginTop: '8px'}}>
          <SpinningIconLabelButton onClick={handleCancel} doSpin={false} icon={Clear}>
            {intl.formatMessage({ id: 'marketAddCancelLabel' })}
          </SpinningIconLabelButton>
          {requiresInput && (
            <SpinningIconLabelButton onClick={() => setOpen(true)} icon={Send} doSpin={false}>
              {intl.formatMessage({ id: 'commentAddSendLabel' })}
            </SpinningIconLabelButton>
          )}
          {requiresInput && (
            <WarningDialog
              classes={lockedDialogClasses}
              open={open}
              onClose={() => setOpen(false)}
              issueWarningId="requiresInputWarning"
              /* slots */
              actions={
                <>
                  <SpinningIconLabelButton onClick={handleSave} icon={Send}
                                           id="requiresInputProceedButton">
                    {intl.formatMessage({ id: 'proceedRequiresInput' })}
                  </SpinningIconLabelButton>
                  <SpinningIconLabelButton onClick={() => handleSaveImpl(true)} icon={Done}
                                           id="requiresInputResolveButton">
                    {intl.formatMessage({ id: 'resolveComment' })}
                  </SpinningIconLabelButton>
                </>
              }
            />
          )}
          {openIssue !== false && (
            <IssueDialog
              classes={lockedDialogClasses}
              open={openIssue !== false}
              onClose={() => setOpenIssue(false)}
              issueWarningId={openIssue}
              showDismiss={false}
              actions={
                (['noQuestionUploads', 'noQuestions', 'noUploads'].includes(openIssue)) ?
                  <SpinningIconLabelButton onClick={() => handleSaveImpl(false, false)} icon={Send}
                                           id="issueProceedButton">
                    {intl.formatMessage({ id: 'issueProceed' })}
                  </SpinningIconLabelButton> : undefined
              }
            />
          )}
          {!requiresInput && (
            <SpinningIconLabelButton onClick={handleSave} icon={Send} id="planningInvestibleAddButton">
              {intl.formatMessage({ id: 'commentAddSendLabel' })}
            </SpinningIconLabelButton>
          )}
        </CardActions>
      </Card>
      {getAddedComments()}
    </>
  );
}

PlanningInvestibleAdd.propTypes = {
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  groupId: PropTypes.string,
  useBudget: PropTypes.bool.isRequired,
  onCancel: PropTypes.func,
  onSpinComplete: PropTypes.func,
  onSave: PropTypes.func
};

PlanningInvestibleAdd.defaultProps = {
  onSave: () => {
  },
  onSpinComplete: () => {},
  onCancel: () => {
  },
};

export default PlanningInvestibleAdd;
