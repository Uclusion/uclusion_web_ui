import React, { useContext, useEffect, useState } from 'react'
import { useIntl } from 'react-intl';
import _ from 'lodash'
import {
  darken,
  makeStyles
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
  addCommentToMarket, addMarketComments, getComment, getCommentRoot,
  getMarketComments
} from '../../contexts/CommentsContext/commentsContextHelper';
import {
  getBlockedStage, getProposedOptionsStage,
  getRequiredInputStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { addInvestible, getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { changeInvestibleStage, changeInvestibleStageOnCommentOpen } from '../../utils/commentFunctions';
import { findMessageOfType, findMessageOfTypeAndId, findMessagesForInvestibleId } from '../../utils/messageUtils';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { useEditor } from '../TextEditors/quillHooks'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { dismissWorkListItem } from '../../pages/Home/YourWork/WorkListItem';
import {
  editorEmpty,
  focusEditor,
  getQuillStoredState,
  resetEditor,
} from '../TextEditors/Utilities/CoreUtils';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import { addMarket, getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import TokenStorageManager from '../../authorization/TokenStorageManager'
import { NOT_FULLY_VOTED_TYPE } from '../../constants/notifications'
import WizardStepButtons from '../InboxWizards/WizardStepButtons'
import AddWizardStepButtons from '../AddNewWizards/WizardStepButtons'
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getMarketInfo } from '../../utils/userFunctions';
import { TOKEN_TYPE_MARKET } from '../../api/tokenConstants';

function getPlaceHolderLabelId(type, investibleId, showSubTask=false) {
  switch (type) {
    case QUESTION_TYPE:
      return 'commentAddQuestionDefault';
    case SUGGEST_CHANGE_TYPE:
      return 'commentAddSuggestDefault';
    case ISSUE_TYPE:
      return 'commentAddIssueDefault';
    case REPLY_TYPE:
      if (showSubTask) {
        return 'commentAddSubTaskDefault';
      }
      return 'commentAddReplyDefault';
    case REPORT_TYPE:
      if (investibleId) {
        return 'commentAddReportDefault';
      }
      return 'commentAddNoteDefault';
    case TODO_TYPE:
      if (investibleId) {
        return 'commentAddTODODefault';
      }
      return 'commentAddBugDefault';
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

export function getOlderReports(currentId, allComments, marketId, investibleId, myPresence) {
  return allComments.filter(comment => comment.comment_type === REPORT_TYPE && !comment.resolved
    && comment.id !== currentId && comment.investible_id === investibleId && comment.created_by === myPresence.id)
    || [];
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
  addMarketComments(commentDispatch, marketId, updatedComments)
}

export function quickNotificationChanges(apiType, investibleId, messagesState, messagesDispatch, threadMessages,
  comment, parentId, commentsState, commentDispatch, marketId, myPresence) {
  if (apiType === REPORT_TYPE) {
    const message = findMessageOfType('REPORT_REQUIRED', investibleId, messagesState)
    if (message) {
      dismissWorkListItem(message, messagesDispatch);
    }
    if (investibleId) {
      quickResolveOlderReports(marketId, investibleId, myPresence, comment, commentsState, commentDispatch);
    }
  }
  if (apiType === REPLY_TYPE) {
    let message = findMessageOfType('UNREAD_REVIEWABLE', comment.root_comment_id, messagesState);
    if (!message) {
      message = findMessageOfType('REVIEW_REQUIRED', comment.root_comment_id, messagesState);
    }
    if (message) {
      // Replying in a report thread completes review
      dismissWorkListItem(message, messagesDispatch);
    }
    message = findMessageOfTypeAndId(parentId, messagesState, 'REPLY');
    if (!message) {
      message = findMessageOfTypeAndId(parentId, messagesState, 'COMMENT');
    }
    if (!message) {
      message = findMessageOfType('ISSUE', parentId, messagesState);
    }
    if (message) {
      dismissWorkListItem(message, messagesDispatch);
    }
    const parentComment = getComment(commentsState, marketId, comment.id);
    if (parentComment && parentComment.inline_market_id) {
      const notFullyVotedMessage = findMessageOfType(NOT_FULLY_VOTED_TYPE, parentComment.inline_market_id,
        messagesState);
      if (notFullyVotedMessage) {
        dismissWorkListItem(message, messagesDispatch);
      }
    }
  } else {
    const messages = findMessagesForInvestibleId(investibleId, messagesState) || [];
    const message = messages.find((aMessage) =>
      ['UNREAD_REVIEWABLE','REVIEW_REQUIRED'].includes(aMessage.type));
    if (message) {
      // Opening a top level message completes review
      dismissWorkListItem(message, messagesDispatch);
    }
  }
}

export function hasCommentValue(groupId, parent, nameKey, fromInvestibleId, nameDifferentiator='') {
  const usedParent = parent || {};
  const { investible_id: parentInvestible, id: parentId } = usedParent;
  const investibleId = fromInvestibleId || parentInvestible;
  const editorName = `${nameDifferentiator}${nameKey ? nameKey : ''}${parentId ? parentId : investibleId ? investibleId : groupId}-comment-add-editor`;
  return !editorEmpty(getQuillStoredState(editorName));
}

function CommentAdd(props) {
  const { marketId, groupId, onSave, type, parent, nameKey, fromInvestibleId, mentionsAllowed, commentAddState, fromDecisionInvestibleId, 
    updateCommentAddState, commentAddStateReset, autoFocus=true, threadMessages, nameDifferentiator='', wizardProps} = props;
  const {
    uploadedFiles
  } = commentAddState;
  const intl = useIntl();
  const history = useHistory();
  const [commentsState, commentDispatch] = useContext(CommentsContext);
  const [investibleState, investibleDispatch] = useContext(InvestiblesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState, presenceDispatch] = useContext(MarketPresencesContext);
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const classes = useStyles();
  const usedParent = parent || {};
  const rootComment = getCommentRoot(commentsState, marketId, usedParent.id);
  const { investible_id: parentInvestible, id: parentId } = usedParent;
  const investibleId = fromInvestibleId || parentInvestible;
  const inv = getInvestible(investibleState, investibleId) || {};
  const info = getMarketInfo(inv, marketId);
  const { assigned, stage: currentStageId } = info || {};
  const presences = getMarketPresences(marketPresencesState, marketId) || [];
  const ourMarket = getMarket(marketsState, marketId) || {};
  const isSingleUser = _.size(presences) < 2;
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const creatorIsAssigned = (assigned || []).includes(myPresence.id);
  const placeHolderLabelId = getPlaceHolderLabelId(type, investibleId, wizardProps.showSubTask);
  const placeholder = intl.formatMessage({ id: placeHolderLabelId });
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const blockingStage = getBlockedStage(marketStagesState, marketId) || {};
  const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
  const investibleRequiresInput = (type === QUESTION_TYPE || type === SUGGEST_CHANGE_TYPE) && creatorIsAssigned
    && currentStageId !== blockingStage.id && currentStageId !== requiresInputStage.id;
  const editorName = `${nameDifferentiator}${nameKey ? nameKey : ''}${parentId ? parentId : investibleId ? investibleId : groupId}-comment-add-editor`;
  const option = getInvestible(investibleState, fromDecisionInvestibleId) || {};
  const { investible } = option;
  const optionName = investible?.name;
  const optionUrl = `${formInvestibleLink(marketId, investibleId)}#option${fromDecisionInvestibleId}`;
  const optionLinkBody = optionName ? `<p><a target="_self" href="${optionUrl}">${optionName}</a></p>` : undefined;
  const useBody = getQuillStoredState(editorName) || optionLinkBody;
  const [hasValue, setHasValue] = useState(!editorEmpty(useBody));

  useEffect(() => {
    // If didn't focus to begin with then focus when type is changed
    if (type && !autoFocus) {
      focusEditor(editorName);
    }
    return () => {};
  }, [autoFocus, editorName, type]);

  function clearMe() {
    resetEditor(editorName, undefined, undefined, true);
    commentAddStateReset();
  }

  function handleSpinStop (comment, isJustClear) {
    setOperationRunning(false);
    clearMe();
    if (!isJustClear) {
      onSave(comment);
    }
  }
  const isWizard = !_.isEmpty(wizardProps);
  const createInlineInitiative = (creatorIsAssigned || !investibleId || _.isEmpty(assigned))
    && type === SUGGEST_CHANGE_TYPE && ourMarket.market_type === PLANNING_TYPE;

  const editorSpec = {
    value: useBody,
    autoFocus,
    marketId,
    placeholder,
    onUpload: (files) => updateCommentAddState({uploadedFiles: files}),
    mentionsAllowed,
    onChange: () => setHasValue(!editorEmpty(getQuillStoredState(editorName)))
  }
  const [Editor] = useEditor(editorName, editorSpec);
  function handleSave(isSent, passedNotificationType, doCreateInitiative, isJustClear) {
    const currentUploadedFiles = uploadedFiles || [];
    // The default was never saved so if they immediately save have to use that instead of stored on disk
    const myBodyNow = getQuillStoredState(editorName) || useBody;
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(currentUploadedFiles, myBodyNow)
    const mentions = getMentionsFromText(tokensRemoved)
    const createInlineDecision = ourMarket.market_type === PLANNING_TYPE && type === QUESTION_TYPE;
    // Inline question markets use draft but initiatives do not since nothing to edit
    const marketType = ((createInlineInitiative && isSent && doCreateInitiative === undefined)
    || doCreateInitiative) ? INITIATIVE_TYPE : (createInlineDecision ? DECISION_TYPE : undefined);
    const investibleBlocks = (investibleId && type === ISSUE_TYPE) && currentStageId !== blockingStage.id;
    return saveComment(marketId, groupId, investibleId, parentId, tokensRemoved, type, filteredUploads, mentions,
      passedNotificationType, marketType, undefined, isSent)
      .then((response) => {
        let comment = marketType ? response.parent : response;
        let useRootInvestible = inv.investible;
        commentAddStateReset();
        resetEditor(editorName);
        if (isSent !== false && investibleId) {
          if (ourMarket.market_type === DECISION_TYPE) {
            if (type === ISSUE_TYPE) {
              const proposedStage = getProposedOptionsStage(marketStagesState, marketId);
              const [info] = (inv.market_infos || []);
              const { stage } = (info || {});
              if (proposedStage && stage !== proposedStage.id) {
                changeInvestibleStage(proposedStage, assigned, comment.updated_at, info, inv.market_infos,
                  useRootInvestible, investibleDispatch);
              }
            }
          } else {
            changeInvestibleStageOnCommentOpen(investibleBlocks, investibleRequiresInput, marketStagesState,
              inv.market_infos, useRootInvestible, investibleDispatch, comment, myPresence);
          }
        }
        addCommentToMarket(comment, commentsState, commentDispatch);
        if (isSent !== false) {
          quickNotificationChanges(type, investibleId, messagesState, messagesDispatch, threadMessages, comment,
            parentId, commentsState, commentDispatch, marketId, myPresence);
        }
        if (marketType) {
          addMarket(response, marketsDispatch, presenceDispatch);
          const { market: { id: inlineMarketId }, parent, token, investible } = response;
          addCommentToMarket(parent, commentsState, commentDispatch);
          if (investible) {
            addInvestible(investibleDispatch, () => {}, investible);
          }
          const tokenStorageManager = new TokenStorageManager();
          return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, inlineMarketId, token).then(() => {
            handleSpinStop(comment, isJustClear);
          });
        }
        handleSpinStop(comment, isJustClear);
      });
  }

  return (
    <div className={classes.editor} style={{paddingBottom: isWizard ? undefined : '1rem'}}>
      {Editor}
      {isWizard && (
        <div style={{marginTop: '40px'}}>
          {wizardProps.isReply && (
            <AddWizardStepButtons
              {...wizardProps}
              validForm={hasValue}
              nextLabel={wizardProps.showSubTask ? 'JobCommentAddTODO' : 'commentAddSendLabel'}
              onNext={() => handleSave( true)}
              showOtherNext={rootComment?.comment_type !== REPORT_TYPE && wizardProps.parentIsTopLevel &&
                (ourMarket.market_type !== DECISION_TYPE || rootComment?.comment_type !== TODO_TYPE)}
              otherNextLabel={wizardProps.showSubTask ? 'addAnother' : 'commentAddSendResolve'}
              onOtherNext={() => handleSave( true, undefined, undefined,
                true).then(() => {
                wizardProps.onResolve();
                if (wizardProps.showSubTask) {
                  focusEditor(editorName);
                }
              })}
              onOtherDoAdvance={!wizardProps.showSubTask}
              showTerminate={!_.isEmpty(wizardProps.terminateLabel)}
              terminateLabel={wizardProps.terminateLabel}
            />
          )}
          {wizardProps.isBug && (
            <AddWizardStepButtons
              {...wizardProps}
              validForm={hasValue && !_.isEmpty(wizardProps.bugType)}
              nextLabel="createBug"
              onNext={() => handleSave( true, wizardProps.bugType)} />
          )}
          {!wizardProps.isBug && !wizardProps.isAddWizard && !wizardProps.isReply && (
            <WizardStepButtons
              {...wizardProps}
              validForm={hasValue}
              nextLabel={`${type}ApproveWizard`}
              onNext={() => handleSave( wizardProps.isSent !== false)}
              showTerminate
              onTerminate={() => navigate(history, formInvestibleLink(marketId, investibleId))}
              terminateLabel={wizardProps.terminateLabel || 'JobWizardGotoJob'}/>
          )}
          {wizardProps.isAddWizard &&
            (type !== ISSUE_TYPE || isSingleUser || ourMarket.market_type !== PLANNING_TYPE) &&
            (![SUGGEST_CHANGE_TYPE, QUESTION_TYPE].includes(type) || ourMarket.market_type === DECISION_TYPE) && (
            <AddWizardStepButtons
              {...wizardProps}
              validForm={hasValue}
              nextLabel={`${nameKey}${type}`}
              onNext={() => handleSave(true, undefined, false )}
              onTerminate={wizardProps.saveOnTerminate ? () => {
                setOperationRunning(true);
                handleSave();
              } : (wizardProps.onTerminate ? wizardProps.onTerminate :
                () => navigate(history, formInvestibleLink(marketId, investibleId)))}
              showOtherNext={type === TODO_TYPE || wizardProps.isResolve}
              otherNextLabel={type === TODO_TYPE ? (fromDecisionInvestibleId ? 'addResolve' : 'addAnother') : 'commentResolveLabelOnly'}
              isOtherFinal={!_.isEmpty(fromDecisionInvestibleId)}
              otherNextValid={wizardProps.isResolve ? true : undefined}
              onOtherNext={wizardProps.isResolve ? wizardProps.onResolve : (fromDecisionInvestibleId ? 
                () => wizardProps.onResolve().then(() => handleSave()) : () =>
                handleSave(true, undefined, false, true )
                    .then(() => {
                      resetEditor(editorName, '', {placeholder});
                      focusEditor(editorName);
                    }))
              }
              showTerminate={wizardProps.showTerminate !== undefined ? wizardProps.showTerminate : !investibleId && type !== REPORT_TYPE}
              terminateLabel={wizardProps.terminateLabel || 'JobWizardGotoJob'}/>
          )}
          {wizardProps.isAddWizard && type === SUGGEST_CHANGE_TYPE && ourMarket.market_type === PLANNING_TYPE &&
            !investibleId && !isSingleUser && (
            <AddWizardStepButtons
              {...wizardProps}
              validForm={hasValue}
              nextLabel="voteSuggestion"
              onNext={() => handleSave( true, undefined, true)}
              onNextDoAdvance={false}
              showOtherNext={true}
              onOtherNext={() => handleSave( true, undefined, false)}
              otherNextLabel="noVoteSuggestion"
              onTerminate={() => {
                wizardProps.updateFormData({marketId, groupId});
                wizardProps.nextStep();
              }}
              showTerminate={hasValue}
              terminateLabel="configureVoting"/>
          )}
          {wizardProps.isAddWizard && type === SUGGEST_CHANGE_TYPE && ourMarket.market_type === PLANNING_TYPE &&
            !investibleId && isSingleUser && (
              <AddWizardStepButtons
                {...wizardProps}
                validForm={hasValue}
                nextLabel="noVoteSuggestion"
                onNext={() => handleSave( true, undefined, false)}
                onNextDoAdvance={false}
                onTerminate={() => {
                  wizardProps.updateFormData({marketId, groupId});
                  wizardProps.nextStep();
                }}
                showTerminate={hasValue}
                terminateLabel="configureVoting"/>
            )}
          {wizardProps.isAddWizard && type === SUGGEST_CHANGE_TYPE && ourMarket.market_type === PLANNING_TYPE &&
            investibleId && !isSingleUser && (
            <AddWizardStepButtons
              {...wizardProps}
              validForm={hasValue}
              nextLabel={createInlineInitiative ? 'voteSuggestion' : 'noVoteSuggestion'}
              onNext={() => handleSave( true, undefined, createInlineInitiative)}
              onNextDoAdvance={false}
              isFinal={!createInlineInitiative}
              isOtherFinal={createInlineInitiative}
              showOtherNext={true}
              otherNextLabel={createInlineInitiative ? 'noVoteSuggestion' : 'voteSuggestion'}
              onOtherNext={() => handleSave( true, undefined, !createInlineInitiative)}
              onTerminate={() => {
                wizardProps.updateFormData({marketId, groupId, investibleId});
                updateCommentAddState({editorName});
                wizardProps.nextStep();
              }}
              showTerminate={hasValue}
              terminateLabel="configureVoting"/>
          )}
          {wizardProps.isAddWizard && type === SUGGEST_CHANGE_TYPE && ourMarket.market_type === PLANNING_TYPE &&
            investibleId && isSingleUser && (
              <AddWizardStepButtons
                {...wizardProps}
                validForm={hasValue}
                nextLabel='noVoteSuggestion'
                onNext={() => handleSave( true, undefined, false)}
                onNextDoAdvance={false}
              />
            )}
          {wizardProps.isAddWizard && type === ISSUE_TYPE && ourMarket.market_type === PLANNING_TYPE
            && !isSingleUser && (
              <AddWizardStepButtons
                {...wizardProps}
                validForm={hasValue}
                isFinal={false}
                nextLabel={`${nameKey}${type}`}
                onNext={() => handleSave(false, undefined, false)}
              />
            )}
          {wizardProps.isAddWizard && type === QUESTION_TYPE && ourMarket.market_type === PLANNING_TYPE && (
            <AddWizardStepButtons
              {...wizardProps}
              validForm={hasValue}
              nextLabel={`${nameKey}${type}`}
              onNext={() => handleSave( false, undefined,false)}
              showOtherNext={true}
              isFinal={false}
              otherNextLabel="createNewQUESTION"
              onOtherNext={() => handleSave( true, undefined,false)}
              isOtherFinal
              showTerminate={false}
            />
          )}
        </div>
      )}
    </div>
  );
}

CommentAdd.propTypes = {
  type: PropTypes.string,
  marketId: PropTypes.string.isRequired,
  onSave: PropTypes.func,
  investible: PropTypes.object,
  parent: PropTypes.object,
  mentionsAllowed: PropTypes.bool,
};

CommentAdd.defaultProps = {
  parent: null,
  investible: null,
  onSave: () => {},
  mentionsAllowed: true,
};

export default CommentAdd;
