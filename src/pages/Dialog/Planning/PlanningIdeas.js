import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { Link, Tooltip, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  formCommentLink,
  formInboxItemLink,
  formInvestibleLink, formWizardLink,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions';
import clsx from 'clsx';
import { countByType } from './InvestiblesByPerson'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import {
  getGroupPresences,
  getMarketPresences, isAutonomousGroup,
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import Chip from '@material-ui/core/Chip';
import { stageChangeInvestible } from '../../../api/investibles';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { getMarketInfo } from '../../../utils/userFunctions'
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import {
  getFullStage,
  isBlockedStage,
  isRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import GravatarGroup from '../../../components/Avatars/GravatarGroup';
import { doRemoveEdit, doShowEdit } from './userUtils'
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { WARNING_COLOR } from '../../../components/Buttons/ButtonConstants'
import { getTicketNumber, stripHTML } from '../../../utils/stringFunctions';
import { Schedule } from '@material-ui/icons';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import {
  findMessageOfType,
  findMessageOfTypeAndId,
  findMessagesForInvestibleId
} from '../../../utils/messageUtils';
import { JOB_STAGE_WIZARD_TYPE } from '../../../constants/markets';
import DragImage from '../../../components/Dialogs/DragImage';
import UsefulRelativeTime from '../../../components/TextFields/UseRelativeTime';
import { isInPast } from '../../../utils/timerUtils';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { dehighlightMessage, isInInbox } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import BugListItem from '../../../components/Comments/BugListItem';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { useCollaborators } from '../../Investible/Planning/PlanningInvestible';
import PlanningJobMenu from './PlanningJobMenu';

export const usePlanningIdStyles = makeStyles(
  theme => {
    return {
      stages: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: 0,
        '& > *': {
          borderRight: `1px solid ${theme.palette.grey['300']}`,
          flex: '1 1 25%',
          minWidth: '15ch',
          padding: theme.spacing(1),
          '&:last-child': {
            borderRight: 'none'
          }
        }
      },
      stageLabel: {},
      containerEmpty: {},
      containerDroppable: {
        backgroundColor: '#efefef'
      }
    };
  },
  { name: 'PlanningIdea' }
);

function PlanningIdeas(props) {
  const {
    myInvestiblesStageHash,
    marketId,
    acceptedStage,
    inDialogStageId,
    inReviewStageId,
    presenceId,
    groupId,
    comments
  } = props;
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const acceptedStageId = acceptedStage.id;
  const classes = usePlanningIdStyles();
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [invState, invDispatch] = useContext(InvestiblesContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [groupState] = useContext(MarketGroupsContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId);
  const group = getGroup(groupState, marketId, groupId);
  const isAutonomous = isAutonomousGroup(groupPresences, group);
  const myPresence = (marketPresences || []).find((presence) => presence.current_user) || {};

  function isBlockedByTodo(investibleId, currentStageId, targetStageId) {
    const investibleComments = comments.filter((comment) => comment.investible_id === investibleId) || [];
    const todoComments = investibleComments.filter(
      comment => comment.comment_type === TODO_TYPE && !comment.resolved
    );
    return targetStageId === inReviewStageId && !_.isEmpty(todoComments);
  }

  function stageChange (event, targetStageId, assigned) {
    event.preventDefault();
    const investibleId = event.dataTransfer.getData('text');
    const currentStageId = event.dataTransfer.getData('stageId');
    if (!operationRunning && !isBlockedByTodo(investibleId, currentStageId, targetStageId) &&
      currentStageId !== targetStageId) {
      const target = event.target;
      target.style.cursor = 'wait';
      const moveInfo = {
        marketId,
        investibleId,
        stageInfo: {
          current_stage_id: currentStageId,
          stage_id: targetStageId,
        },
      };
      if (_.isEmpty(assigned)) {
        moveInfo.stageInfo.assignments = [presenceId];
      }
      setOperationRunning(true);
      return stageChangeInvestible(moveInfo)
        .then((inv) => {
          const fullStage = getFullStage(marketStagesState, marketId, currentStageId) || {};
          onInvestibleStageChange(targetStageId, inv, investibleId, marketId, commentsState, commentsDispatch,
            invDispatch, diffDispatch, marketStagesState, undefined, fullStage, marketPresencesDispatch);
        }).finally(() => {
          target.style.cursor = 'pointer';
          setOperationRunning(false);
        });
    }
  }

  function removeDroppableById() {
    [acceptedStageId, inDialogStageId, inReviewStageId].forEach((stageId) => {
      const dropSource = document.getElementById(`${stageId}_${presenceId}`);
      if (dropSource) {
        dropSource.classList.remove(classes.containerDroppable);
      }
    });
  }

  function onDropVoting (event) {
    const investibleId = event.dataTransfer.getData('text');
    removeDroppableById();
    const investibleComments = comments.filter((comment) => comment.investible_id === investibleId
      && !comment.resolved) || [];
    const blockingComments = investibleComments.filter(comment => comment.comment_type === ISSUE_TYPE);
    const assignedInputComments = investibleComments.filter(
      comment => (comment.comment_type === QUESTION_TYPE || comment.comment_type === SUGGEST_CHANGE_TYPE)
        && presenceId === comment.created_by
    );
    if (!_.isEmpty(blockingComments) || !_.isEmpty(assignedInputComments)) {
      // Need to close comment(s) to move here
      navigate(history,
        `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, investibleId)}&stageId=${inDialogStageId}&assignId=${presenceId}`);
    } else {
      const investible = getInvestible(invState, investibleId);
      const marketInfo = getMarketInfo(investible, marketId);
      const { assigned } = marketInfo;
      return stageChange(event, inDialogStageId, assigned).then(() => {
        if (!isAutonomous) {
          // Prompt for approval
          navigate(history,
            `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, investibleId)}&stageId=${inDialogStageId}&isAssign=false`);
        }
      });
    }
  }

  function onDropAccepted(event) {
    const id = event.dataTransfer.getData('text');
    const stageId = event.dataTransfer.getData('stageId');
    if (myPresence.id !== presenceId) {
      // If you try to drop into someone else's accepted just route to their voting instead
      onDropVoting(event);
    } else {
      removeDroppableById();
      const { assigned, link} = getDropDestination(acceptedStageId, id, stageId);
      if (link) {
        navigate(history, link);
      } else {
        stageChange(event, acceptedStageId, assigned);
      }
    }
  }

  function onDropReview (event) {
    const id = event.dataTransfer.getData('text');
    const stageId = event.dataTransfer.getData('stageId');
    const { assigned, link} = getDropDestination(inReviewStageId, id, stageId);
    removeDroppableById();
    if (link) {
      navigate(history, link);
    } else {
      stageChange(event, inReviewStageId, assigned);
    }
  }

  function getDropDestination(divId, id, stageId) {
    const investible = getInvestible(invState, id);
    const marketInfo = getMarketInfo(investible, marketId);
    const { assigned } = marketInfo;
    const draggerIsAssigned = (assigned || []).includes(myPresence.id);
    const fullCurrentStage = getFullStage(marketStagesState, marketId, stageId);
    let link = undefined;
    if (divId === acceptedStageId && !draggerIsAssigned && !_.isEmpty(assigned)) {
      // Go to change stage assign step with acceptedStageId destination
      link = `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&stageId=${divId}&isAssign=true`;
    }
    if (divId === inReviewStageId) {
      const isTodoBlocked = isBlockedByTodo(id, stageId, divId);
      if (isTodoBlocked || isBlockedStage(fullCurrentStage) || isRequiredInputStage(fullCurrentStage)) {
        if (isAutonomous || !_.isEmpty(assigned)) {
          // Go to change stage close comment step with divId destination
          link = `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&stageId=${divId}`;
        } else {
          link = `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&stageId=${divId}&assignId=${presenceId}`;
        }
      } else if (!isAutonomous) {
        if (_.isEmpty(assigned)) {
          // Go to change stage add review step with divId destination
          link = `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&stageId=${divId}&isAssign=false&assignId=${presenceId}`;
        } else {
          // Go to change stage add review step with divId destination
          link = `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&stageId=${divId}&isAssign=false`;
        }
      }
    } else if (isBlockedStage(fullCurrentStage) || isRequiredInputStage(fullCurrentStage)) {
      if (isAutonomous || (!_.isEmpty(assigned)&&assigned.includes(presenceId))) {
        // Go to change stage close comment step with divId destination
        link = `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&stageId=${divId}`;
      } else {
        link = `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&stageId=${divId}&assignId=${presenceId}`;
      }
    }
    return {assigned,  link };
  }

  function onDragOverProcess(event) {
    event.dataTransfer.dropEffect = 'move';
    event.preventDefault();
  }

  function onDragEnterProcess(event) {
    if (!event.target.id || !event.target.id.endsWith(presenceId)) return;
    event.target.classList.add(classes.containerDroppable);
    event.preventDefault();
  }

  function removeDroppable(event) {
    event.target.classList.remove(classes.containerDroppable);
    event.preventDefault();
  }

  function onDragLeaveProcess(event) {
    if (!event.target.id || !event.target.id.endsWith(presenceId)) return;
    if (event.currentTarget.contains(event.relatedTarget)) return;
    removeDroppable(event);
  }

  const acceptedInvestibles = myInvestiblesStageHash[acceptedStageId] || [];

  return (
    <div className={mobileLayout ? undefined : classes.stages}>
      <div id={`${inDialogStageId}_${presenceId}`} onDrop={onDropVoting} onDragEnd={removeDroppable}
           onDragOver={onDragOverProcess} onDragEnter={onDragEnterProcess} onDragLeave={onDragLeaveProcess}
      >
        {mobileLayout && !_.isEmpty(myInvestiblesStageHash[inDialogStageId]) && (
          <div style={{ marginTop: '0.5rem', marginLeft: '0.5rem' }}>
            <b><FormattedMessage id="planningVotingStageLabel"/></b>
          </div>
        )}
        <VotingStage
          id={inDialogStageId}
          investibles={myInvestiblesStageHash[inDialogStageId] || []}
          marketId={marketId}
          groupId={groupId}
          presenceId={presenceId}
          marketPresences={marketPresences}
          comments={comments}
          myPresence={myPresence}
          isAutonomous={isAutonomous}
          viewGroupId={groupId}
        />
      </div>
      <div id={`${acceptedStageId}_${presenceId}`} onDrop={onDropAccepted} onDragEnd={removeDroppable}
           onDragOver={onDragOverProcess} onDragEnter={onDragEnterProcess} onDragLeave={onDragLeaveProcess}
      >
        {mobileLayout && !_.isEmpty(myInvestiblesStageHash[acceptedStageId]) && (
          <div style={{ marginTop: '0.5rem', marginLeft: '0.5rem' }}>
            <b><FormattedMessage id="planningAcceptedStageLabel"/></b>
          </div>
        )}
        <AcceptedStage
          id={acceptedStageId}
          investibles={acceptedInvestibles}
          marketId={marketId}
          presenceId={presenceId}
          myPresence={myPresence}
          marketPresences={marketPresences}
          comments={comments}
          isAutonomous={isAutonomous}
          viewGroupId={groupId}
        />
      </div>
      <div id={`${inReviewStageId}_${presenceId}`} onDrop={onDropReview} style={{ flex: '2 1 50%' }}
           onDragEnd={removeDroppable} onDragOver={onDragOverProcess} onDragEnter={onDragEnterProcess}
           onDragLeave={onDragLeaveProcess}
      >
        {mobileLayout && !_.isEmpty(myInvestiblesStageHash[inReviewStageId]) && (
          <div style={{marginTop: '0.5rem', marginLeft: '0.5rem'}}>
            <b><FormattedMessage id="planningReviewStageLabel" /></b>
          </div>
        )}
        <ReviewStage
          id={inReviewStageId}
          investibles={myInvestiblesStageHash[inReviewStageId] || []}
          marketId={marketId}
          myPresence={myPresence}
          presenceId={presenceId}
          comments={comments}
          marketPresences={marketPresences}
          isAutonomous={isAutonomous}
          viewGroupId={groupId}
        />
      </div>
    </div>
  );
}

PlanningIdeas.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.object),
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
  acceptedStage: PropTypes.object.isRequired,
  inDialogStageId: PropTypes.string.isRequired,
  inReviewStageId: PropTypes.string.isRequired,
  inBlockingStageId: PropTypes.string.isRequired,
  presenceId: PropTypes.string.isRequired
};

PlanningIdeas.defaultProps = {
  investibles: [],
  comments: []
};

function Stage(props) {
  const {
    comments,
    id,
    investibles,
    marketId,
    isReview,
    isVoting,
    showCompletion,
    marketPresences,
    presenceId,
    isAutonomous,
    viewGroupId,
    myPresence
  } = props;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const sortedInvestibles = investibles.sort(function(a, b) {
    const aMarketInfo = getMarketInfo(a, marketId);
    const bMarketInfo = getMarketInfo(b, marketId);
    return new Date(bMarketInfo.updated_at) - new Date(aMarketInfo.updated_at);
  });

  function investibleOnDragStart (event) {
    const dragImage = document.getElementById(`dragImage${event.target.id}`);
    if (dragImage) {
      event.dataTransfer.setDragImage(dragImage, 100, 0);
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text', event.target.id);
    event.dataTransfer.setData('stageId', id);
  }

  function countNumRequiredReviews(investibleId) {
    const review = comments.find((comment) => {
      return comment.comment_type === REPORT_TYPE && comment.investible_id === investibleId && !comment.resolved;
    });
    if (_.isEmpty(review)) {
      return 0;
    }
    const { mentioned_notifications: mentioned } = myPresence;
    if (mentioned?.includes(review.id)) {
      return 1;
    }
    return 0;
  }

  const investiblesMap = sortedInvestibles.map(inv => {
    const { investible } = inv;
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const unaccepted = isVoting && marketInfo.assigned?.includes(presenceId) &&
      !marketInfo.accepted?.includes(presenceId);
    const numQuestionsSuggestions = countByType(investible, comments,
      [QUESTION_TYPE, SUGGEST_CHANGE_TYPE]);
    const numRequiredReviews = countNumRequiredReviews(investible.id);
    const numOpenTasks = countByType(investible, comments, [TODO_TYPE]);

    return (
      <React.Fragment key={`stageFrag${investible.id}`}>
        <StageInvestible
          marketPresences={marketPresences || []}
          comments={comments || []}
          investible={investible}
          marketId={marketId}
          marketInfo={marketInfo}
          isReview={isReview}
          isVoting={isVoting}
          numQuestionsSuggestions={numQuestionsSuggestions}
          numRequiredReviews={numRequiredReviews}
          numOpenTasks={numOpenTasks}
          unaccepted={unaccepted}
          showCompletion={showCompletion}
          mobileLayout={mobileLayout}
          isAutonomous={isAutonomous}
          viewGroupId={viewGroupId}
          investibleOnDragStart={investibleOnDragStart}
        />
        {!mobileLayout && (
          <DragImage id={investible.id} name={investible.name} />
        )}
      </React.Fragment>
    )});
  if (!isReview) {
    return investiblesMap;
  }
  return (
    <div style={{display: 'flex', flexFlow: 'row wrap', gap: '0px 5px'}}>
      {investiblesMap}
    </div>
  );
}

Stage.propTypes = {
  id: PropTypes.string.isRequired,
  investibles: PropTypes.array.isRequired,
  marketId: PropTypes.string.isRequired
};

function VotingStage (props) {
  return (
    <Stage
      isVoting
      {...props}
    />
  );
}

function AcceptedStage (props) {
  return (
    <Stage
      showCompletion
      {...props}
    />
  );
}

function ReviewStage (props) {
  return (
    <Stage
      isReview
      {...props}
    />
  );
}

const generalStageStyles = makeStyles((theme) => {
  return {
    chipClass: {
      fontSize: 10,
    },
    chipStyleRed: {
      backgroundColor: '#E85757',
      color: 'white'
    },
    chipStyleGreen: {
      backgroundColor: 'white',
      border: '0.5px solid grey'
    },
    smallGravatar: {
      width: '24px',
      height: '24px',
    },
    outlinedAccepted: {
      backgroundColor: 'white',
      border: `1px solid ${theme.palette.grey['400']}`,
      borderRadius: theme.spacing(1),
      fontSize: '.8em',
      margin: theme.spacing(0.5, 0),
      padding: theme.spacing(1, 2),
      overflowWrap: 'break-word',
      overflowX: 'hidden'
    },
  };
});


function StageInvestible(props) {
  const {
    investible,
    marketId,
    marketInfo,
    showCompletion,
    comments,
    marketPresences,
    numQuestionsSuggestions,
    numRequiredReviews,
    numOpenTasks,
    mobileLayout,
    unaccepted,
    isReview,
    isVoting,
    isAutonomous,
    viewGroupId,
    investibleOnDragStart
  } = props;
  const intl = useIntl();
  const { completion_estimate: daysEstimate, assigned, group_id: groupId, stage: stageId,
    open_for_investment: openForInvestment } = marketInfo;
  const { id, name,  label_list: labelList } = investible;
  const history = useHistory();
  const to = `${formInvestibleLink(marketId, id)}#investible-header`;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const classes = generalStageStyles();
  const planClasses = usePlanFormStyles();
  const investibleComments = comments.filter((comment) => comment.investible_id === id) || [];
  const collaboratorsForInvestible = useCollaborators(marketPresences, investibleComments, marketPresencesState,
    id, marketId, true);
  const hasDaysEstimate = showCompletion && daysEstimate && !isInPast(new Date(daysEstimate));
  const isReviewable = isReview || showCompletion;
  const unreadEstimate = findMessageOfType('UNREAD_ESTIMATE', id, messagesState);
  function requiresStatus(id) {
    if (!_.isEmpty(findMessageOfTypeAndId(id, messagesState, 'REPORT'))) {
      return true;
    }
    return !_.isEmpty(findMessageOfType('REPORT_REQUIRED', id, messagesState));
  }
  const doesRequireStatus = requiresStatus(id);

  function getChip(labelNum, toolTipId) {
    const messagesRaw = findMessagesForInvestibleId(id, messagesState);
    const messages = messagesRaw.filter((message) => isInInbox(message));
    const newMessages = messages.filter((message) => message.is_highlighted);
    // Just go to the first message associated with this investible that needs assistance if user has one
    const myMessage = !_.isEmpty(newMessages) ? newMessages[0] : (!_.isEmpty(messages) ? messages[0] : undefined);
    if (myMessage) {
      const isHighlighted = myMessage.is_highlighted;
      const myMessages = isHighlighted ? newMessages : messages;
      return (
        <Tooltip title={intl.formatMessage({ id: 'messagePresent' })}>
          <span className={'MuiTabItem-tag'} style={{backgroundColor: WARNING_COLOR, cursor: 'pointer',
            marginLeft: '1rem', color: 'white', borderRadius: 22, paddingLeft: '6px', paddingRight: '5px',
            paddingTop: '2px', maxHeight: '20px'}}
                onClick={(event) => {
                  preventDefaultAndProp(event);
                  dehighlightMessage(myMessage, messagesDispatch);
                  navigate(history, formInboxItemLink(myMessage));
                }}
                onMouseOver={(event) => {
                  preventDefaultAndProp(event);
                }}
          >
            {_.size(myMessages)} {intl.formatMessage({ id: isHighlighted ? 'new' : 'notifications' })}
          </span>
        </Tooltip>
      );
    }
    if (labelNum <= 0) {
      return undefined;
    }
    return (
      <Tooltip title={intl.formatMessage({ id: toolTipId })}>
        <span className={'MuiTabItem-tag'} style={{backgroundColor: '#F29100', marginLeft: '1rem', color: 'white',
          borderRadius: 22, paddingLeft: '6px', paddingRight: '5px', paddingTop: '2px', maxHeight: '20px'}}>
          {labelNum} {intl.formatMessage({ id: 'open' })}
        </span>
      </Tooltip>
    );
  }
  const recordPositionToggle = (event) => {
    if (anchorEl === null) {
      preventDefaultAndProp(event);
      setAnchorEl(event.currentTarget);
    } else {
      setAnchorEl(null);
    }
  };
  const showNumRequiredReviews = isReviewable && numRequiredReviews > 0;
  let chip = mobileLayout ? undefined :
    getChip(isVoting ? numQuestionsSuggestions : (showNumRequiredReviews ? numRequiredReviews : numOpenTasks),
      isVoting ? 'inputRequiredCountExplanation':
        (showNumRequiredReviews ? 'requiredReviewsCountExplanation' : 'openTasksCountExplanation'));
  const ticketNumber = getTicketNumber(groupId, marketId, groupsState, isAutonomous, groupId === viewGroupId);
  const inProgressComments = comments.filter((comment) => comment.investible_id === investible.id && !comment.deleted
    && !comment.resolved && comment.comment_type === TODO_TYPE && comment.in_progress);
  return (
    <>
      {anchorEl && (
        <PlanningJobMenu anchorEl={anchorEl} recordPositionToggle={recordPositionToggle} stageId={stageId}
                         groupId={groupId} marketId={marketId} investibleId={investible.id}
                         openForInvestment={openForInvestment} marketPresences={marketPresences} />
      )}
      <div key={investible.id} id={investible.id} onDragStart={investibleOnDragStart} draggable
           className={classes.outlinedAccepted}
           onContextMenu={recordPositionToggle}
           style={{minWidth: isReview ? '45%' : undefined}}
           onMouseOver={() => doShowEdit(investible.id)}
           onMouseOut={() => doRemoveEdit(investible.id)}
           onClick={event => {
             preventDefaultAndProp(event);
             navigate(history, `${formInvestibleLink(marketId, investible.id)}#investible-header`);
           }}
      >
        <div style={{display: 'flex', marginBottom: '0.35rem'}}>
          {!unaccepted && (isVoting || isReview) &&
            !_.isEmpty(collaboratorsForInvestible.filter((collaborator) => !assigned?.includes(collaborator.id))) && (
              <div>
                <GravatarGroup users={collaboratorsForInvestible} gravatarClassName={classes.smallGravatar} />
              </div>
            )}
          {unaccepted && (
            <Tooltip
              title={intl.formatMessage({ id: 'planningAcceptExplanation' })}
            >
              <div className={planClasses.daysEstimation} style={{wordWrap: 'normal'}}>
                <FormattedMessage id='planningUnacceptedLabel' />
              </div>
            </Tooltip>
          )}
          {hasDaysEstimate && (
            <div style={{ whiteSpace: 'nowrap', color: unreadEstimate ? '#F29100': undefined, marginTop: '0.2rem',
              cursor: unreadEstimate ? 'pointer' : undefined }}
                 onClick={(event) => {
                   if (unreadEstimate) {
                     preventDefaultAndProp(event);
                     dehighlightMessage(unreadEstimate, messagesDispatch);
                     navigate(history, formInboxItemLink(unreadEstimate));
                   }
                 }}
                 onMouseOver={(event) => {
                   if (unreadEstimate) {
                     preventDefaultAndProp(event);
                   }
                 }}
            >
              <FormattedMessage id='estimatedCompletionToday' /> <UsefulRelativeTime value={new Date(daysEstimate)}/>
            </div>
          )}
          {ticketNumber && (
            <Typography variant="subtitle2" style={{whiteSpace: 'nowrap', marginLeft: '1rem'}}>
              {ticketNumber}
            </Typography>
          )}
          {chip}
          {doesRequireStatus && (
            <Tooltip title={intl.formatMessage({ id: 'reportRequired'})}>
            <span className={'MuiTabItem-tag'} style={{ marginLeft: '1rem', marginTop: '-0.1rem' }}>
              <Schedule style={{fontSize: 24, color: '#F29100'}}/>
            </span>
            </Tooltip>
          )}
        </div>
        <div id={`planningIdea${id}`} style={{display: 'flex', paddingTop: `${chip ? '0rem' : '0.5rem'}`}}>
          <StageLink
            href={to}
            id={id}
            draggable="false"
            onClick={event => {
              event.stopPropagation();
              event.preventDefault();
              navigate(history, to);
            }}
          >
            <Typography color='initial' variant="subtitle2">{name}</Typography>
            {!_.isEmpty(labelList) && labelList.map((label) =>
              <div key={label} style={{paddingTop: '0.5rem'}}>
                <Chip size="small" label={label} className={classes.chipClass}
                      style={{maxWidth: '90%', backgroundColor: '#73B76C', color: 'white'}}/>
              </div>
            )}
          </StageLink>
          <div id={`showEdit0${id}`} style={{visibility: 'hidden', pointerEvents: 'none'}}>
            <EditOutlinedIcon style={{maxHeight: '1.25rem', marginTop: '-0.2rem'}} />
          </div>
        </div>
        {showCompletion && !_.isEmpty(inProgressComments) && (
          inProgressComments.map((comment) => {
            const { body, id: commentId } = comment;
            return <BugListItem id={commentId} title={stripHTML(body)} useMinWidth={false} useMobileLayout smallFont
                                useSelect={false} toolTipId='inProgress'
                                link={formCommentLink(marketId, marketInfo.group_id, id, commentId)} />;
          })
        )}
      </div>
    </>
  );
}

const useStageLinkStyles = makeStyles(() => {
  return {
    root: {
      color: 'inherit',
      display: 'block',
      height: '100%',
      width: '95%'
    }
  };
});

function StageLink (props) {
  const { className, ...other } = props;
  const classes = useStageLinkStyles();
  return <Link className={clsx(classes.root, className)} {...other} />;
}

export default PlanningIdeas;
