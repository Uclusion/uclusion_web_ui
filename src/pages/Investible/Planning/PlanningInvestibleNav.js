import clsx from 'clsx';
import {
  Button,
  Checkbox,
  FormControlLabel,
  makeStyles,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import _ from 'lodash';
import WarningDialog from '../../../components/Warnings/WarningDialog';
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton';
import { ExpandLess, SettingsBackupRestore } from '@material-ui/icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { isEveryoneGroup } from '../../../contexts/GroupMembersContext/groupMembersHelper';
import AttachedFilesList from '../../../components/Files/AttachedFilesList';
import React, { useContext, useState } from 'react';
import { Assignments, countUnresolved, getCollaborators, rejectInvestible } from './PlanningInvestible';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { findMessageOfType, findMessageOfTypeAndId } from '../../../utils/messageUtils';
import { getDiff, markDiffViewed } from '../../../contexts/DiffContext/diffContextHelper';
import { getCurrentStageLabelId, getStagesInfo } from '../../../utils/stageUtils';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SpinningButton from '../../../components/SpinBlocking/SpinningButton';
import PropTypes from 'prop-types';
import { ISSUE_TYPE, JUSTIFY_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { attachFilesToInvestible, deleteAttachedFilesFromInvestible, updateInvestible } from '../../../api/investibles';
import { notify, onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { UNASSIGNED_TYPE, YELLOW_LEVEL } from '../../../constants/notifications';
import { assignedInStage } from '../../../utils/userFunctions';
import {
  getAcceptedStage, getFullStage, getFurtherWorkStage,
  getInCurrentVotingStage, getInReviewStage, getNotDoingStage, getVerifiedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import MoveToVotingActionButton from './MoveToVotingActionButton';
import MoveToAcceptedActionButton from './MoveToAcceptedActionButton';
import MoveToInReviewActionButton from './MoveToInReviewActionButton';
import MoveToFurtherWorkActionButton from './MoveToFurtherWorkActionButton';
import MoveToVerifiedActionButton from './MoveToVerifiedActionButton';
import MoveToNotDoingActionButton from './MoveToNotDoingActionButton';
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction';
import { useLockedDialogStyles } from '../../Dialog/DialogBodyEdit';
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';

export default function PlanningInvestibleNav(props) {
  const { name, intermediateNotSingle, market, marketInvestible, classes, blockingCommentsUnresolved, userId,
    questionSuggestionsByAssignedComments, investibles, inArchives, myPresence, isAssigned, pageState, invested,
    marketPresences, assigned, isInVoting, investibleComments, marketInfo, marketId, updatePageState } = props;
  const lockedDialogClasses = useLockedDialogStyles();
  const intl = useIntl();
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const [open, setOpen] = useState(false);
  const { stage, addressed, investible_id: investibleId, required_approvers:  requiredApprovers,
    required_reviews: requiredReviewers, open_for_investment: openForInvestment, accepted,
    group_id: groupId } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const attachedFiles = marketInvestible.investible && marketInvestible.investible.attached_files;

  function onDeleteFile(path) {
    return deleteAttachedFilesFromInvestible(market.id, investibleId, [path]).then((investible) => {
      addInvestible(investiblesDispatch, diffDispatch, investible);
      setOperationRunning(false);
    });
  }

  function onAttachFiles(metadatas) {
    return attachFilesToInvestible(market.id, investibleId, metadatas)
      .then((investible) => addInvestible(investiblesDispatch, diffDispatch, investible));
  }

  const stagesInfo = getStagesInfo(market.id, marketStagesState, stage);
  const {
    isInReview,
    inAcceptedStage,
    isInAccepted,
    inBlockedStage,
    isInBlocked,
    isInVerified,
    isFurtherWork,
    requiresInputStage,
    isRequiresInput,
    isInNotDoing,
  } = stagesInfo;
  const addressedIds = (addressed || []).filter((address) => !address.deleted && !address.abstain)
    .map((address) => address.user_id);
  const investibleCollaborators = getCollaborators(marketPresences, investibleComments, marketPresencesState,
    investibleId);
  const investmentReasonsRemoved = investibleComments.filter(comment => comment.comment_type !== JUSTIFY_TYPE) || [];
  const openComments = investmentReasonsRemoved.filter((comment) => !comment.resolved) || [];
  const openProblemComments = openComments.filter((comment) =>
    [QUESTION_TYPE, ISSUE_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type));
  const assignedNotAccepted = assigned.filter((assignee) => !(accepted || []).includes(assignee));
  const todoComments = investibleComments.filter(
    comment => comment.comment_type === TODO_TYPE
  );

  const assignedInAcceptedStage = assigned.reduce((acc, userId) => {
    return acc.concat(assignedInStage(
      investibles,
      userId,
      inAcceptedStage.id,
      marketId
    ));
  }, []);

  function getStageActions(onSpinStop) {
    if (inArchives) {
      return []
    }
    const notAssigned = isFurtherWork || isInNotDoing
    const menuItems = [];
    const votingDisabled = isInVoting || !_.isEmpty(blockingCommentsUnresolved) || notAssigned;
    if(!votingDisabled){
      menuItems.push(
        <MenuItem
          key={(getInCurrentVotingStage(marketStagesState, marketId) || {}).id}
          value={(getInCurrentVotingStage(marketStagesState, marketId) || {}).id}
        >
          <MoveToVotingActionButton
            investibleId={investibleId}
            marketId={marketId}
            currentStageId={stage}
            onSpinStop={onSpinStop}
            hasAssignedQuestions={!_.isEmpty(questionSuggestionsByAssignedComments)}
          />
        </MenuItem>);
    }
    const acceptedDisabled = isInAccepted || !isAssigned || !_.isEmpty(blockingCommentsUnresolved) || notAssigned;
    if(!acceptedDisabled){
      menuItems.push(
        <MenuItem
          key={(getAcceptedStage(marketStagesState, marketId) || {}).id}
          value={(getAcceptedStage(marketStagesState, marketId) || {}).id}
        >
          <MoveToAcceptedActionButton
            investibleId={investibleId}
            marketId={marketId}
            currentStageId={stage}
            onSpinStop={onSpinStop}
            hasAssignedQuestions={!_.isEmpty(questionSuggestionsByAssignedComments)}
          />
        </MenuItem>
      )
    }
    const inReviewDisabled = isInReview || !_.isEmpty(blockingCommentsUnresolved) || notAssigned;
    if(!inReviewDisabled){
      menuItems.push(
        <MenuItem
          key={(getInReviewStage(marketStagesState, marketId) || {}).id}
          value={(getInReviewStage(marketStagesState, marketId) || {}).id}
        >
          <MoveToInReviewActionButton
            investibleId={investibleId}
            marketId={marketId}
            currentStageId={stage}
            onSpinStop={onSpinStop}
            hasAssignedQuestions={!_.isEmpty(questionSuggestionsByAssignedComments)}
          />
        </MenuItem>
      );
    }
    if(!isFurtherWork){
      menuItems.push(
        <MenuItem
          key={(getFurtherWorkStage(marketStagesState, marketId) || {}).id}
          value={(getFurtherWorkStage(marketStagesState, marketId) || {}).id}
        >
          <MoveToFurtherWorkActionButton
            investibleId={investibleId}
            marketId={marketId}
            currentStageId={stage}
            onSpinStop={onSpinStop}
          />
        </MenuItem>
      );
    }
    const verifiedDisabled = isInVerified || countUnresolved(todoComments) > 0 || !_.isEmpty(blockingCommentsUnresolved)
      || notAssigned;
    if(!verifiedDisabled){
      menuItems.push(
        <MenuItem
          key={(getVerifiedStage(marketStagesState, marketId) || {}).id}
          value={(getVerifiedStage(marketStagesState, marketId) || {}).id}
        >
          <MoveToVerifiedActionButton
            investibleId={investibleId}
            marketId={marketId}
            currentStageId={stage}
            hasTodos={false}
            onSpinStop={onSpinStop}
          />
        </MenuItem>
      );
    }
    if(!isInNotDoing){
      menuItems.push(
        <MenuItem
          key={(getNotDoingStage(marketStagesState, marketId) || {}).id}
          value={(getNotDoingStage(marketStagesState, marketId) || {}).id}
        >
          <MoveToNotDoingActionButton
            investibleId={investibleId}
            marketId={marketId}
            currentStageId={stage}
            disabled={false}
            onSpinStop={onSpinStop}
          />
        </MenuItem>
      );
    }
    if (isInBlocked) {
      menuItems.unshift(
        <MenuItem
          onClick={onSpinStop}
          value={inBlockedStage.id}
          key={inBlockedStage.id}>
          <StageChangeAction
            translationId="planningBlockedStageLabel"
            investibleId={investibleId}
            disabled={true}
            operationBlocked={false}
            targetStageId={inBlockedStage.id}
            explanationId="planningInvestibleVerifiedExplanation"
            blockedOperationTranslationId="mustRemoveTodosExplanation"
          />
        </MenuItem>
      )
    }
    if (isRequiresInput) {
      menuItems.unshift(
        <MenuItem
          value={requiresInputStage.id}
          onClick={onSpinStop}
          key={requiresInputStage.id}>
          <StageChangeAction
            translationId="requiresInputHeader"
            investibleId={investibleId}
            disabled={true}
            operationBlocked={false}
            targetStageId={requiresInputStage.id}
            explanationId="requiresInputHeader"
            blockedOperationTranslationId="requiresInputHeader"
          />
        </MenuItem>
      )
    }
    return menuItems;
  }

  function toggleEditState(editType) {
    return () => updatePageState({editCollaborators: editType});
  }

  function setReadyToStart(isReadyToStart) {
    const updateInfo = {
      marketId,
      investibleId,
      openForInvestment: isReadyToStart,
    };
    setOperationRunning('readyToStart');
    return updateInvestible(updateInfo).then((fullInvestible) => {
      onInvestibleStageChange(stage, fullInvestible, investibleId, marketId, undefined,
        undefined, investiblesDispatch, diffDispatch, marketStagesState, [UNASSIGNED_TYPE],
        fullStage);
      if (isReadyToStart) {
        notify(myPresence.id, investibleId, UNASSIGNED_TYPE, YELLOW_LEVEL, investiblesState, market, messagesDispatch);
      }
      setOperationRunning(false);
    });
  }
  const headerPaddingBottom = mobileLayout ? '1rem' : undefined;
  return (
    <>
      <div style={{maxWidth: '11rem', paddingBottom: '1rem', width: intermediateNotSingle ? '100%' : undefined}}>
        {name}
      </div>
      {market.id && marketInvestible.investible && (
        <div className={clsx(classes.group, classes.assignments)} style={{paddingBottom: headerPaddingBottom}}>
          <div className={classes.assignmentContainer}>
            <Assignments
              classes={classes}
              marketPresences={marketPresences}
              assigned={assigned}
              highlighted={isInVoting ? assignedNotAccepted : undefined}
              toggleIconButton={toggleEditState('assign')}
              assignmentColumnMessageId='planningInvestibleAssignments'
              toolTipId='storyAddParticipantsLabel'
              showMoveMessage
            />
          </div>
        </div>
      )}
      {market.id && marketInvestible.investible && isFurtherWork && (
        <div className={classes.assignmentContainer} style={{paddingBottom: headerPaddingBottom}}>
          <FormControlLabel
            id='readyToStartCheckbox'
            control={
              <Checkbox
                value={openForInvestment}
                disabled={operationRunning !== false}
                checked={openForInvestment}
                onClick={() => {
                  if (!openForInvestment && !_.isEmpty(openProblemComments) && !mobileLayout) {
                    setOpen(true);
                  } else {
                    setReadyToStart(!openForInvestment);
                  }
                }}
              />
            }
            label={intl.formatMessage({ id: 'readyToStartCheckboxExplanation' })}
          />
          {!openForInvestment && !mobileLayout && (
            <WarningDialog
              classes={lockedDialogClasses}
              open={open}
              onClose={() => setOpen(false)}
              issueWarningId="unresolvedReadyToStartWarning"
              /* slots */
              actions={
                <SpinningIconLabelButton onClick={() => setReadyToStart(true)}
                                         icon={SettingsBackupRestore}
                                         id="issueProceedReadyToStartButton">
                  {intl.formatMessage({ id: 'issueProceed' })}
                </SpinningIconLabelButton>
              }
            />
          )}
        </div>
      )}
      {!isFurtherWork && (
        <div className={clsx(classes.group, classes.assignments)} style={{paddingBottom: headerPaddingBottom}}>
          <div className={classes.assignmentContainer}>
            <b><FormattedMessage id="collaborators"/></b>
            <Assignments
              classes={classes}
              marketPresences={marketPresences}
              assigned={investibleCollaborators}
              toolTipId="collaborators"
            />
          </div>
        </div>
      )}
      {market.id && marketInvestible.investible && !isFurtherWork && (
        <div className={clsx(classes.group, classes.assignments)} style={{paddingBottom: headerPaddingBottom}}>
          <div className={classes.assignmentContainer}>
            <Assignments
              classes={classes}
              marketPresences={marketPresences}
              assigned={isInVoting ? requiredApprovers : requiredReviewers}
              toolTipId={isInVoting ? 'storyApproversLabel' : 'storyReviewersLabel'}
              toggleIconButton={isInVoting ? toggleEditState('approve') : toggleEditState('review')}
              assignmentColumnMessageId={isInVoting ? 'requiredApprovers' : 'requiredReviewers'}
            />
          </div>
        </div>
      )}
      {!isEveryoneGroup(groupId, marketId) && (
        <div className={clsx(classes.group, classes.assignments)} style={{paddingBottom: headerPaddingBottom}}>
          <div className={classes.assignmentContainer}>
            <Assignments
              classes={classes}
              marketPresences={marketPresences}
              assigned={addressedIds}
              toolTipId='storyAddressedLabel'
              toggleIconButton={toggleEditState('addressed')}
              assignmentColumnMessageId='addressed'
            />
          </div>
        </div>
      )}
      <MarketMetaData
        stage={stage}
        stagesInfo={stagesInfo}
        investibleId={investibleId}
        market={market}
        marketInvestible={marketInvestible}
        isAdmin={!inArchives}
        stageActions={getStageActions}
        inArchives={inArchives}
        isAssigned={isAssigned}
        blockingComments={blockingCommentsUnresolved}
        todoComments={todoComments}
        isInVoting={isInVoting}
        questionByAssignedComments={questionSuggestionsByAssignedComments}
        pageState={pageState}
        updatePageState={updatePageState}
        acceptedEmpty={assignedInAcceptedStage.length === 0}
        invested={invested}
        accepted={accepted || []}
        myUserId={userId}
      />
      <div style={{paddingBottom: headerPaddingBottom}} />
      <AttachedFilesList
        marketId={market.id}
        onUpload={onAttachFiles}
        onDeleteClick={onDeleteFile}
        attachedFiles={attachedFiles}
      />
    </>
  );
}

export const useMetaDataStyles = makeStyles(
  theme => {
    return {
      root: {
        alignItems: "flex-start",
        display: "flex",
        flexDirection: 'column',
        width: '100%',
        '& > div': {
          borderRadius: '6px',
          marginBottom: '1rem'
        }
      },
      flexRow: {
        flexDirection: 'row'
      },
      archivedColor: {
        color: '#ffC000',
      },
      normalColor: {
      },
      archived: {
        color: '#ffC000',
        fontSize: 12,
      },
      highlighted: {
        color: 'red',
        fontSize: 12,
      },
      normal: {
        fontSize: 14,
      },
      group: {
        backgroundColor: '#ecf0f1',
        borderRadius: 6,
        display: "flex",
        flexDirection: "row",
        padding: theme.spacing(1, 1),
        "&:first-child": {
          marginLeft: 0
        },
        [theme.breakpoints.down("sm")]: {
          backgroundColor: '#fff',
        }
      },
      expiration: {
        "& dd": {
          alignItems: "center",
          display: "flex",
          flex: "1 auto",
          flexDirection: "row",
          fontWeight: "bold",
          [theme.breakpoints.down('sm')]: {
            margin: 0,
          },

        }
      },
      blue: {
        backgroundColor: '#2d9cdb',
      },
      expansionControl: {
        backgroundColor: '#ecf0f1',
        width: '100%'
      },
      fontControl: {
        alignItems: "center",
        textTransform: 'capitalize',
        marginRight: 'auto',
        marginLeft: '5px',
        fontWeight: 700
      },
      expirationProgress: {
        marginRight: theme.spacing(1)
      },
      assignments: {
        padding: 0,
        "& ul": {
          flex: 4,
          margin: 0,
          padding: 0
        },
        "& li": {
          display: "inline-flex",
          fontWeight: "bold",
          marginLeft: theme.spacing(1)
        }
      },
      assignmentContainer: {
        width: '100%',
        textTransform: 'capitalize'
      },
      assignIconContainer: {
        display: 'flex',
        justifyContent: 'center'
      },
      assignmentFlexRow: {
        width: '100%',
        display: 'flex',
        padding: '8px'
      },
      flex1: {
        flex: 1
      },
      noPad: {
        padding: 0
      },
      menuButton: {
        width: '100%',
        padding: '12px'
      },
      linkContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      },
      scrollContainer: {
        maxHeight: '210px',
        overflow: 'auto'
      },
      outerBorder: {
        border: '1px solid black',
        borderRadius: '6px 6px 0 0'
      },
      actionPrimary: {
        backgroundColor: '#2D9CDB',
        color: 'white',
        textTransform: 'unset',
        marginRight: '20px',
        '&:hover': {
          backgroundColor: '#e0e0e0'
        },
        '&:disabled': {
          color: 'white',
          backgroundColor: 'rgba(45, 156, 219, .6)'
        }
      },
      actionSecondary: {
        backgroundColor: '#e0e0e0',
        textTransform: 'unset',
        '&:hover': {
          backgroundColor: "#F1F1F1"
        }
      },
    }
  },
  { name: "MetaData" }
);

function MarketMetaData(props) {
  const {
    market,
    marketInvestible,
    investibleId,
    stageActions,
    stagesInfo,
    isAssigned,
    accepted,
    myUserId,
    pageState, updatePageState
  } = props;
  const intl = useIntl()
  const {
    showDiff
  } = pageState
  const [diffState, diffDispatch] = useContext(DiffContext);
  const [stageAnchorEl, setStageAnchorEl] = useState(null);
  const stageMenuOpen = Boolean(stageAnchorEl);
  const [messagesState] = useContext(NotificationsContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const myMessageDescription = findMessageOfTypeAndId(investibleId, messagesState, 'DESCRIPTION');
  const diff = getDiff(diffState, investibleId);
  const classes = useMetaDataStyles();
  const unacceptedAssignment = findMessageOfType('UNACCEPTED_ASSIGNMENT', investibleId, messagesState);
  const unaccepted = unacceptedAssignment && isAssigned && !accepted.includes(myUserId);
  const stageLabelId = getCurrentStageLabelId(stagesInfo);

  function myRejectInvestible() {
    return rejectInvestible(market.id, investibleId, marketInvestible, commentsState, commentsDispatch, invDispatch,
      diffDispatch, marketStagesState);
  }

  function handleStageMenuClose() {
    setStageAnchorEl(null);
  }
  function handleStageClick(event){
    setStageAnchorEl(event.currentTarget);
  }

  function toggleDiffShow() {
    if (showDiff) {
      markDiffViewed(diffDispatch, investibleId);
    }
    updatePageState({showDiff: !showDiff});
  }
  const stagesMenu = stageActions(handleStageMenuClose);

  return (
    <div>
      {!_.isEmpty(stagesMenu) &&
        (
          <React.Fragment>
            <div
              style={{maxWidth: '15rem', marginRight: '1rem', overflowY: 'auto', maxHeight: '8rem'}}>
              <div style={{marginBottom: '0.5rem'}}>
                <b><FormattedMessage id={'allowedStagesDropdownLabel'}/></b>
              </div>
              <Button
                variant="outlined"
                style={{textTransform: 'none', paddingLeft: '0.5rem', paddingRight: '0.5rem', borderRadius: '8px',}}
                aria-label="allowed-stages-label"
                endIcon={<ExpandMoreIcon/>}
                onClick={handleStageClick}
              >
                {intl.formatMessage({id: stageLabelId})}
              </Button>
            </div>
            <Menu
              anchorEl={stageAnchorEl}
              open={stageMenuOpen}
              onClose={handleStageMenuClose}
            >
              {stagesMenu}
            </Menu>
            {unaccepted && (
              <div style={{display: 'flex', paddingTop: '1rem', marginBottom: 0}}>
                <SpinningButton onClick={myRejectInvestible} className={classes.actionSecondary} id='reject'>
                  {intl.formatMessage({ id: 'saveReject' })}
                </SpinningButton>
              </div>
            )}

          </React.Fragment>
        )}
      {myMessageDescription && diff && (
        <>
          <div style={{paddingTop: '0.5rem'}} />
          <SpinningIconLabelButton icon={showDiff ? ExpandLess : ExpandMoreIcon}
                                   onClick={toggleDiffShow} doSpin={false}>
            <FormattedMessage id={showDiff ? 'diffDisplayDismissLabel' : 'diffDisplayShowLabel'} />
          </SpinningIconLabelButton>
        </>
      )}
    </div>
  );
}

MarketMetaData.propTypes = {
  investibleId: PropTypes.string.isRequired,
  market: PropTypes.object.isRequired,
  marketInvestible: PropTypes.object.isRequired,
  stageActions: PropTypes.func,
}