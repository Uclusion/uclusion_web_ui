import React, { useContext, useEffect, useState } from 'react'
import { useIntl } from 'react-intl';
import _ from 'lodash'
import {
  darken,
  makeStyles,
  Paper, Typography, useMediaQuery, useTheme,
} from '@material-ui/core';
import PropTypes from 'prop-types'
import { getMentionsFromText, saveComment } from '../../api/comments';
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE,
} from '../../constants/comments'
import { processTextAndFilesForSave } from '../../api/files'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import {
  addCommentToMarket, getComment,
  getMarketComments,
  refreshMarketComments
} from '../../contexts/CommentsContext/commentsContextHelper'
import { useLockedDialogStyles } from '../../pages/Dialog/DialogBodyEdit'
import {
  getBlockedStage, getInCurrentVotingStage,
  getInReviewStage,
  getRequiredInputStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { addInvestible, getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { changeInvestibleStageOnCommentOpen } from '../../utils/commentFunctions'
import { findMessageOfType, findMessageOfTypeAndId } from '../../utils/messageUtils'
import {
  changeLevelMessage, dehighlightMessages
} from '../../contexts/NotificationsContext/notificationsContextReducer';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton'
import { Add, Clear, Delete, Lock, LockOpen, Send } from '@material-ui/icons'
import { useEditor } from '../TextEditors/quillHooks'
import { getUiPreferences } from '../../contexts/AccountContext/accountUserContextHelper'
import IssueDialog from '../Warnings/IssueDialog'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { removeWorkListItem, workListStyles } from '../../pages/Home/YourWork/WorkListItem'
import { deleteOrDehilightMessages } from '../../api/users'
import {
  focusEditor,
  getQuillStoredState,
  replaceEditorContents,
} from '../TextEditors/Utilities/CoreUtils'
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import { addMarket, getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import TokenStorageManager, { TOKEN_TYPE_MARKET } from '../../authorization/TokenStorageManager'
import { NOT_FULLY_VOTED_TYPE } from '../../constants/notifications'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'
import WizardStepButtons from '../InboxWizards/WizardStepButtons'
import { nameFromDescription } from '../../utils/stringFunctions';

function getPlaceHolderLabelId(type, isInReview, isAssigned) {
  switch (type) {
    case QUESTION_TYPE:
      return 'commentAddQuestionDefault';
    case SUGGEST_CHANGE_TYPE:
      return 'commentAddSuggestDefault';
    case ISSUE_TYPE:
      return 'commentAddIssueDefault';
    case REPLY_TYPE:
      return 'commentAddReplyDefault';
    case REPORT_TYPE:
      if (isInReview && !isAssigned) {
        return 'commentAddReviewReportDefault';
      }
      return 'commentAddReportDefault';
    case TODO_TYPE:
      return 'commentAddTODODefault';
    default:
      return 'commentAddSelectIssueLabel';
  }
}

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  hidden: {
    display: 'none',
  },
  add: {
    marginTop: 16,
    padding: theme.spacing(0, 2)
  },
  editor: {
    flex: 1,
    maxWidth: '100%'
  },
  storageIndicator: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  button: {
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: 8,
    marginBottom: 0,
    textTransform: 'none',
  },
  buttonPrimary: {
    backgroundColor: '#2d9cdb',
    color: '#fff',
    '&:hover': {
      backgroundColor: darken('#2d9cdb', 0.08)
    },
    '&:focus': {
      backgroundColor: darken('#2d9cdb', 0.24)
    },
  },
  addBox: {},
  todoLabelType: {
    alignSelf: "start",
    display: "inline-flex"
  },
  commentType: {
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      marginLeft: 'auto',
      marginRight: 'auto'
    }
  },
  commentTypeGroup: {
    display: "flex",
    flexDirection: "row",
    [theme.breakpoints.down('sm')]: {
      display: 'block'
    }
  },
  chipItem: {
    color: '#fff',
    borderRadius: '8px',
    '& .MuiChip-label': {
      fontSize: 12,
    },
    '& .MuiFormControlLabel-label': {
      paddingRight: '5px',
      fontWeight: 'bold',
      textTransform: 'capitalize',
      [theme.breakpoints.down('sm')]: {
        height: '100%',
        verticalAlign: 'middle',
        display: 'inline-block',
        '& .MuiSvgIcon-root': {
          display: 'block'
        }
      },
    },
    '& .MuiChip-avatar': {
      width: '16px',
      height: '14px',
      color: '#fff',
    },
    '& .MuiRadio-colorPrimary.Mui-checked':{
      '&.Mui-checked': {
        color: 'white'
      }
    },
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    margin: theme.spacing(0, 0, 0, 4),
    [theme.breakpoints.down('sm')]: {
      margin: '10px'
    },
  },
  selected: {
    opacity: 1
  },
  unselected: {
    opacity: '.6'
  },
  chipItemQuestion: {
    background: '#2F80ED',
  },
  chipItemIssue: {
    background: '#E85757',
    color: 'black'
  },
  chipItemSuggestion: {
    background: '#e6e969',
    color: 'black'
  },
  commentTypeContainer: {
    borderRadius: '4px 4px 0 0'
  }
}), { name: 'CommentAdd' });

function getReportWarningId(isReadyForApproval) {
  if (isReadyForApproval) {
    return 'addReportInReadyForApprovalWarning'
  }
  return undefined;
}

export function getCommentCreationWarning(type, issueWarningId, createInlineInitiative, investibleRequiresInput,
  numReports, isReadyForApproval) {
  return type === ISSUE_TYPE ? issueWarningId : (type === REPORT_TYPE ? getReportWarningId(isReadyForApproval) :
    (createInlineInitiative ? 'noInitiativeType' :
      (investibleRequiresInput ? 'requiresInputWarningPlanning' : undefined)));
}

export function getOlderReports(currentId, allComments, marketId, investibleId, myPresence) {
  let comments = allComments.filter(comment => comment.comment_type === REPORT_TYPE && !comment.resolved
    && comment.id !== currentId) || [];
  if (investibleId) {
    comments = comments.filter(comment => comment.investible_id === investibleId
      && comment.created_by === myPresence.id) || [];
  } else {
    comments = comments.filter(comment => !comment.investible_id) || [];
  }
  return comments;
}

function quickResolveOlderReports(marketId, investibleId, myPresence, currentComment, commentsState, commentDispatch) {
  const marketComments = getMarketComments(commentsState, marketId) || [];
  const updatedComments = getOlderReports(currentComment.id, marketComments, marketId, investibleId,
    myPresence).map((comment) => {
    return {
      ...comment,
      resolved: true,
      updated_at: currentComment.updated_at,
      updated_by: currentComment.updated_by
    }
  })
  refreshMarketComments(commentDispatch, marketId, updatedComments)
}

export function quickNotificationChanges(apiType, inReviewStage, isInReview, investibleId, messagesState,
  workItemClasses, messagesDispatch, threadMessages, comment, parentId, commentsState, commentDispatch, marketId,
  myPresence) {
  if (apiType === REPORT_TYPE || (apiType === TODO_TYPE && isInReview)) {
    const message = findMessageOfType('REPORT_REQUIRED', investibleId, messagesState)
    if (message) {
      removeWorkListItem(message, workItemClasses.removed);
    }
    if (apiType === REPORT_TYPE) {
      quickResolveOlderReports(marketId, investibleId, myPresence, comment, commentsState, commentDispatch);
    }
  }
  // The whole thread will be marked read so quick it
  deleteOrDehilightMessages(threadMessages || [], messagesDispatch, workItemClasses.removed,
    true, true);
  if (apiType === REPLY_TYPE) {
    const message = findMessageOfTypeAndId(parentId, messagesState, 'COMMENT');
    if (message) {
      messagesDispatch(dehighlightMessages([message.type_object_id]));
    }
    const issueMessage = findMessageOfType('ISSUE', parentId, messagesState);
    if (issueMessage) {
      messagesDispatch(changeLevelMessage(issueMessage, 'BLUE'));
      messagesDispatch(dehighlightMessages([issueMessage.type_object_id]));
    }
    const parentComment = getComment(commentsState, marketId, comment.id);
    if (parentComment && parentComment.inline_market_id) {
      const notFullyVotedMessage = findMessageOfType(NOT_FULLY_VOTED_TYPE, parentComment.inline_market_id,
        messagesState);
      if (notFullyVotedMessage) {
        messagesDispatch(changeLevelMessage(notFullyVotedMessage, 'BLUE'));
        messagesDispatch(dehighlightMessages([notFullyVotedMessage.type_object_id]));
      }
    }
  }
}

function CommentAdd(props) {
  const {
    marketId, groupId, onSave, onCancel, type, investible, parent, issueWarningId, isStory, nameKey,
    defaultNotificationType, onDone, mentionsAllowed, commentAddState, updateCommentAddState, commentAddStateReset,
    autoFocus=true, isStandAlone, threadMessages, nameDifferentiator='', wizardProps
  } = props;
  const {
    uploadedFiles,
    notificationType
  } = commentAddState;

  const intl = useIntl();
  const workItemClasses = workListStyles();
  const [commentsState, commentDispatch] = useContext(CommentsContext);
  const [investibleState, investibleDispatch] = useContext(InvestiblesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState, presenceDispatch] = useContext(MarketPresencesContext);
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const [openIssue, setOpenIssue] = useState(false);
  const [doNotShowAgain, setDoNotShowAgain] = useState(undefined);
  const classes = useStyles();
  const usedParent = parent || {};
  const { investible_id: parentInvestible, id: parentId } = usedParent;
  const investibleId = investible ? investible.id : parentInvestible;
  // TODO: this breaks if investible exists in more than one market
  const inv = getInvestible(investibleState, investibleId) || {};
  const { market_infos, investible: rootInvestible } = inv;
  const [info] = (market_infos || []);
  const { assigned, stage: currentStageId } = (info || {});
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {id: 'fake'};
  const readyForApprovalStage = getInCurrentVotingStage(marketStagesState, marketId) || {};
  const presences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const creatorIsAssigned = (assigned || []).includes(myPresence.id);
  const placeHolderLabelId = getPlaceHolderLabelId(type, currentStageId === inReviewStage.id,
    creatorIsAssigned);
  const placeHolder = intl.formatMessage({ id: placeHolderLabelId });
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [userState] = useContext(AccountContext);
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const blockingStage = getBlockedStage(marketStagesState, marketId) || {};
  const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
  const investibleRequiresInput = (type === QUESTION_TYPE || type === SUGGEST_CHANGE_TYPE) && creatorIsAssigned
    && currentStageId !== blockingStage.id && currentStageId !== requiresInputStage.id;
  const marketComments = getMarketComments(commentsState, marketId) || [];
  const olderReports = getOlderReports(undefined, marketComments, marketId, investibleId, myPresence);
  const numReports = _.size(olderReports);

  function toggleIssue () {
    if (openIssue === false) {
      if (_.isEmpty(getQuillStoredState(editorName))) {
        setOpenIssue('noCommentBody')
      } else {
        setOpenIssue(myWarningId)
      }
    } else {
      setOpenIssue(false)
    }
  }

  const editorName = `${nameDifferentiator}${nameKey ? nameKey : ''}${parentId ? parentId : investibleId ? investibleId : marketId}-comment-add-editor`
  const useBody = getQuillStoredState(editorName);
  const editorSpec = {
    value: useBody,
    participants: presences,
    marketId,
    placeholder: placeHolder,
    onUpload: (files) => updateCommentAddState({uploadedFiles: files}),
    mentionsAllowed
  }
  const [Editor, resetEditor] = useEditor(editorName, editorSpec);

  useEffect(() => {
    // If didn't focus to begin with then focus when type is changed
    if (type && !autoFocus) {
      focusEditor(editorName);
    }
    return () => {};
  }, [autoFocus, editorName, type]);

  useEffect(() => {
    if (autoFocus) {
      focusEditor(editorName);
    }
    return () => {};
  }, [autoFocus, editorName]);


  function clearMe () {
    replaceEditorContents('', editorName);
    commentAddStateReset();
    setOpenIssue(false);
  }

  function myOnDone() {
    clearMe();
    onDone();
  }

  function handleClear () {
    replaceEditorContents('', editorName);
    onCancel();
  }

  function handleSpinStop (comment) {
    clearMe()
    onSave(comment)
  }

  function handleSave(isRestricted, isSent) {
    const currentUploadedFiles = uploadedFiles || []
    const myBodyNow = getQuillStoredState(editorName)
    if (_.isEmpty(myBodyNow) || _.isEmpty(type)) {
      setOperationRunning(false);
      setOpenIssue(_.isEmpty(type) ? 'noType' : 'noCommentBody');
      return;
    }
    if (isStandAlone && _.isEmpty(notificationType)) {
      setOperationRunning(false);
      setOpenIssue('noNotificationType');
      return;
    }
    const apiType = (type === REPLY_TYPE) ? undefined : type;
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(currentUploadedFiles, myBodyNow)
    const mentions = getMentionsFromText(tokensRemoved)
    // the API does _not_ want you to send reply type, so suppress if our type is reply
    // what about not doing state?
    const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
    const ourMarket = getMarket(marketsState, marketId) || {};
    const createInlineDecision = ourMarket.market_type === PLANNING_TYPE && apiType === QUESTION_TYPE;
    // Inline question markets use draft but initiatives do not since nothing to edit
    const marketType = createInlineInitiative && isSent ? INITIATIVE_TYPE :
      (createInlineDecision ? DECISION_TYPE : undefined);
    const investibleBlocks = (investibleId && apiType === ISSUE_TYPE) && currentStageId !== blockingStage.id;
    let label = undefined;
    if (creatorIsAssigned && type === REPORT_TYPE && isSent !== false) {
      label = nameFromDescription(tokensRemoved);
    }
    return saveComment(marketId, groupId, investibleId, parentId, tokensRemoved, apiType, filteredUploads, mentions,
      (notificationType || defaultNotificationType), marketType, isRestricted, isSent, label)
      .then((response) => {
        let comment = marketType ? response.parent : response;
        let useRootInvestible = rootInvestible;
        if (!_.isEmpty(label)) {
          const { comment: returnedComment, investible: returnedInvestible } = response;
          comment = returnedComment;
          useRootInvestible = returnedInvestible;
          addInvestible(investibleDispatch, () => {}, returnedInvestible);
        }
        commentAddStateReset();
        resetEditor();
        if (isSent !== false) {
          changeInvestibleStageOnCommentOpen(investibleBlocks, investibleRequiresInput,
            blockingStage, requiresInputStage, market_infos, useRootInvestible, investibleDispatch, comment);
        }
        addCommentToMarket(comment, commentsState, commentDispatch);
        if (isSent !== false) {
          quickNotificationChanges(apiType, inReviewStage, inReviewStage.id === currentStageId, investibleId,
            messagesState, workItemClasses, messagesDispatch, threadMessages, comment, parentId, commentsState,
            commentDispatch, marketId, myPresence);
        }
        if (marketType) {
          addMarket(response, marketsDispatch, () => {}, presenceDispatch);
          const { market: { id: inlineMarketId }, parent, token, investible } = response;
          addCommentToMarket(parent, commentsState, commentDispatch);
          if (investible) {
            addInvestible(investibleDispatch, () => {}, investible);
          }
          const tokenStorageManager = new TokenStorageManager();
          return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, inlineMarketId, token).then(() => {
            if (doNotShowAgain) {
              return doNotShowAgain().then(() => {
                setOperationRunning(false);
                handleSpinStop(comment);
              });
            } else {
              setOperationRunning(false);
              handleSpinStop(comment);
            }
          });
        }
        if (doNotShowAgain) {
          return doNotShowAgain().then(() => {
            setOperationRunning(false);
            handleSpinStop(comment);
          });
        } else {
          setOperationRunning(false);
          handleSpinStop(comment);
        }
      });
  }
  const isWizard = !_.isEmpty(wizardProps);
  const commentCancelLabel = parent ? 'commentReplyCancelLabel' : 'commentAddCancelLabel';
  const createInlineInitiative = (creatorIsAssigned || !investibleId || _.isEmpty(assigned))
    && type === SUGGEST_CHANGE_TYPE;
  const isReadyForApproval = currentStageId === readyForApprovalStage.id
  const myWarningId = getCommentCreationWarning(type, issueWarningId, createInlineInitiative, investibleRequiresInput,
    numReports, isReadyForApproval);
  const userPreferences = getUiPreferences(userState) || {};
  const previouslyDismissed = userPreferences.dismissedText || [];
  const showIssueWarning = myWarningId && !previouslyDismissed.includes(myWarningId) && !mobileLayout;
  const lockedDialogClasses = useLockedDialogStyles();

  return (
    <>
      <Paper
        id={`${nameKey ? nameKey : ''}cabox`}
        className={classes.add}
        elevation={0}
      >
        <div className={classes.editor} style={{paddingBottom: '1rem'}}>
          {Editor}
          <div style={{marginTop: '0.5rem', display: (isWizard ? 'none' : undefined)}}>
            {!isStory && onDone && (
              <SpinningIconLabelButton onClick={myOnDone} doSpin={false} icon={isStandAlone ? Clear : Delete}>
                {intl.formatMessage({ id: 'cancel' })}
              </SpinningIconLabelButton>
            )}
            {!isStandAlone && (
              <SpinningIconLabelButton onClick={handleClear} doSpin={false} icon={Clear}>
                {intl.formatMessage({ id: commentCancelLabel })}
              </SpinningIconLabelButton>
            )}
            {_.isEmpty(defaultNotificationType) && type !== REPLY_TYPE && (
              <SpinningIconLabelButton
                onClick={() => handleSave(undefined, false)}
                icon={Add}
                id={`commentSaveButton${nameDifferentiator}`}
              >
                {intl.formatMessage({ id: 'commentAddSaveLabel' })}
              </SpinningIconLabelButton>
            )}
            {!showIssueWarning && (
              <SpinningIconLabelButton
                onClick={() => handleSave()}
                icon={Send}
                id={`commentSendButton${nameDifferentiator}`}
              >
                {intl.formatMessage({ id: 'commentAddSendLabel' })}
              </SpinningIconLabelButton>
            )}
            {showIssueWarning && (
              <SpinningIconLabelButton onClick={toggleIssue} icon={Send} doSpin={false} id="commentSendButton">
                {intl.formatMessage({ id: 'commentAddSendLabel' })}
              </SpinningIconLabelButton>
            )}
            <Typography className={classes.storageIndicator}>
              {intl.formatMessage({ id: 'edited' })}
            </Typography>
          </div>
          {isWizard && (
            <div style={{marginTop: '2rem'}}>
              <WizardStepButtons
                {...wizardProps}
                nextLabel={`${type}ApproveWizard`}
                onNext={() => handleSave()}
                showTerminate={true}
                terminateLabel="JobWizardGotoJob"/>
            </div>
          )}
          {openIssue !== false && openIssue !== 'noInitiativeType' && (
            <IssueDialog
              classes={lockedDialogClasses}
              open={openIssue !== false}
              onClose={toggleIssue}
              issueWarningId={openIssue}
              showDismiss={!['noCommentBody', 'noType', 'noNotificationType'].includes(openIssue)}
              checkBoxFunc={setDoNotShowAgain}
              /* slots */
              actions={
                (!['noCommentBody', 'noType', 'noNotificationType'].includes(openIssue)) ?
                  <SpinningIconLabelButton onClick={() => handleSave()} icon={Add} id="issueProceedButton">
                    {intl.formatMessage({ id: 'issueProceed' })}
                  </SpinningIconLabelButton> : undefined
              }
            />
          )}
          {openIssue === 'noInitiativeType' && (
            <IssueDialog
              classes={lockedDialogClasses}
              open={openIssue !== false}
              onClose={toggleIssue}
              issueWarningId={openIssue}
              showDismiss={false}
              /* slots */
              actions={
                (<>
                  <SpinningIconLabelButton onClick={() => {
                    return handleSave(false, true);
                  }} icon={LockOpen} id="proceedNormalButton">
                    {intl.formatMessage({ id: 'proceedNormal' })}
                  </SpinningIconLabelButton>
                  <SpinningIconLabelButton onClick={() => {
                    return handleSave(true, true);
                  }} icon={Lock} id="proceedRestrictedButton">
                    {intl.formatMessage({ id: 'proceedRestricted' })}
                  </SpinningIconLabelButton>
                </>)
              }
            />
          )}
        </div>
      </Paper>
    </>
  );
}

CommentAdd.propTypes = {
  type: PropTypes.string,
  marketId: PropTypes.string.isRequired,
  issueWarningId: PropTypes.string,
  todoWarningId: PropTypes.string,
  onSave: PropTypes.func,
  investible: PropTypes.object,
  parent: PropTypes.object,
  onCancel: PropTypes.func,
  clearType: PropTypes.func,
  isStory: PropTypes.bool,
  defaultNotificationType: PropTypes.string,
  mentionsAllowed: PropTypes.bool,
};

CommentAdd.defaultProps = {
  parent: null,
  investible: null,
  todoWarningId: null,
  defaultNotificationType: undefined,
  onCancel: () => {},
  onSave: () => {},
  clearType: () => {},
  isStory: false,
  mentionsAllowed: true,
};

export default CommentAdd;
