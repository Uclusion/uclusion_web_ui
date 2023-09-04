import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { Grid, Link, Tooltip, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles';
import { yellow } from '@material-ui/core/colors';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  formInvestibleLink, formWizardLink,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions';
import clsx from 'clsx';
import { countByType } from './InvestiblesByPerson'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import {
  getMarketPresences,
  removeInvestibleInvestments
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import Chip from '@material-ui/core/Chip';
import { stageChangeInvestible, updateInvestible } from '../../../api/investibles';
import {
  getInvestible,
  refreshInvestibles
} from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { getMarketInfo } from '../../../utils/userFunctions'
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import {
  getFullStage,
  isBlockedStage,
  isRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import GravatarGroup from '../../../components/Avatars/GravatarGroup';
import { useInvestibleVoters } from '../../../utils/votingUtils';
import { doRemoveEdit, doShowEdit } from './userUtils'
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import { getCollaboratorsForInvestible, onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { WARNING_COLOR } from '../../../components/Buttons/ButtonConstants'
import { getTicketNumber } from '../../../utils/stringFunctions'
import { Schedule } from '@material-ui/icons';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { findMessageOfType, findMessageOfTypeAndId } from '../../../utils/messageUtils';
import { JOB_STAGE_WIZARD_TYPE } from '../../../constants/markets';
import DragImage from '../../../components/Dialogs/DragImage';
import UsefulRelativeTime from '../../../components/TextFields/UseRelativeTime';

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
    inBlockingStageId,
    inRequiresInputStageId,
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
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = (marketPresences || []).find((presence) => presence.current_user) || {};

  function isBlockedByTodo(investibleId, currentStageId, targetStageId) {
    const investibleComments = comments.filter((comment) => comment.investible_id === investibleId) || [];
    const todoComments = investibleComments.filter(
      comment => comment.comment_type === TODO_TYPE && !comment.resolved
    );
    return targetStageId === inReviewStageId && !_.isEmpty(todoComments);
  }

  function stageChange (event, targetStageId) {
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

  function isAssignedInvestible(event, assignedToId) {
    const investibleId = event.dataTransfer.getData('text');
    const investible = getInvestible(invState, investibleId);
    const marketInfo = getMarketInfo(investible, marketId);
    const { assigned } = marketInfo;
    return (assigned || []).includes(assignedToId);
  }

  function onDropVoting (event) {
    const currentStageId = event.dataTransfer.getData('stageId');
    const investibleId = event.dataTransfer.getData('text');
    const fullStage = getFullStage(marketStagesState, marketId, currentStageId);
    if (isBlockedStage(fullStage) || isRequiredInputStage(fullStage)) {
      // Need to close comment(s) to move here
      navigate(history,
        `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, investibleId)}&stageId=${inDialogStageId}`);
    } else {
      if (isAssignedInvestible(event, presenceId)) {
        stageChange(event, inDialogStageId);
      } else if (!operationRunning && !isAssignedInvestible(event, presenceId)) {
        // Assignment can be changed at any time to anyone not already assigned when moving into voting
        const assignments = [presenceId];
        const updateInfo = {
          marketId,
          investibleId,
          assignments,
        };
        setOperationRunning(true);
        updateInvestible(updateInfo)
          .then((fullInvestible) => {
            const { market_infos: marketInfos } = fullInvestible;
            const marketInfo = marketInfos.find(info => info.market_id === marketId);
            const investibleComments = comments.filter((comment) => comment.investible_id === investibleId
              && !comment.resolved) || [];
            const blockingComments = investibleComments.filter(comment => comment.comment_type === ISSUE_TYPE);
            const assignedInputComments = investibleComments.filter(
              comment => (comment.comment_type === QUESTION_TYPE || comment.comment_type === SUGGEST_CHANGE_TYPE)
                && marketInfo.assigned.includes(comment.created_by)
            );
            marketInfo.stage = !_.isEmpty(blockingComments) ? inBlockingStageId :
              _.isEmpty(assignedInputComments) ? inDialogStageId : inRequiresInputStageId;
            refreshInvestibles(invDispatch, diffDispatch, [fullInvestible]);
            removeInvestibleInvestments(marketPresencesState, marketPresencesDispatch, marketId, investibleId);
            setOperationRunning(false);
          });
      }
    }
  }

  function onDropAccepted(event) {
    const id = event.dataTransfer.getData('text');
    const stageId = event.dataTransfer.getData('stageId');
    const link = getDropDestination(acceptedStageId, id, stageId);
    if (link) {
      navigate(history, link);
    } else {
      stageChange(event, acceptedStageId);
    }
  }

  function onDropReview (event) {
    const id = event.dataTransfer.getData('text');
    const stageId = event.dataTransfer.getData('stageId');
    const link = getDropDestination(inReviewStageId, id, stageId);
    if (link) {
      navigate(history, link);
    } else {
      stageChange(event, inReviewStageId);
    }
  }

  function getDropDestination(divId, id, stageId) {
    const investible = getInvestible(invState, id);
    const marketInfo = getMarketInfo(investible, marketId);
    const { assigned } = marketInfo;
    const draggerIsAssigned = (assigned || []).includes(myPresence.id);
    const isBlocked = isBlockedByTodo(id, stageId, divId);
    const fullCurrentStage = getFullStage(marketStagesState, marketId, stageId);
    if (divId === acceptedStageId && !draggerIsAssigned) {
      // Go to change stage assign step with acceptedStageId destination
      return `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&stageId=${divId}&isAssign=true`;
    }
    if (isBlocked || isBlockedStage(fullCurrentStage) || isRequiredInputStage(fullCurrentStage)) {
      // Go to change stage close comment step with divId destination
      return `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, id)}&stageId=${divId}`;
    }
    return undefined;
  }

  function onDragOverProcess(event) {
    event.dataTransfer.dropEffect = 'move';
    event.preventDefault();
  }

  return (
    <div className={mobileLayout ? undefined : classes.stages}>
      <div id={`${inDialogStageId}_${presenceId}`} onDrop={onDropVoting}
           onDragOver={onDragOverProcess}
      >
        {mobileLayout && !_.isEmpty(myInvestiblesStageHash[inDialogStageId]) && (
          <div style={{marginTop: '0.5rem', marginLeft: '0.5rem'}}>
            <b><FormattedMessage id="planningVotingStageLabel" /></b>
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
        />
      </div>
      <div id={`${acceptedStageId}_${presenceId}`} onDrop={onDropAccepted}
           onDragOver={onDragOverProcess}
      >
        {mobileLayout && !_.isEmpty(myInvestiblesStageHash[acceptedStageId]) && (
          <div style={{marginTop: '0.5rem', marginLeft: '0.5rem'}}>
            <b><FormattedMessage id="planningAcceptedStageLabel" /></b>
          </div>
        )}
        <AcceptedStage
          id={acceptedStageId}
          investibles={myInvestiblesStageHash[acceptedStageId] || []}
          marketId={marketId}
          presenceId={presenceId}
          myPresence={myPresence}
          marketPresences={marketPresences}
          comments={comments}
        />
      </div>
      <div id={`${inReviewStageId}_${presenceId}`} onDrop={onDropReview} style={{flex: '2 1 50%'}}
           onDragOver={onDragOverProcess}
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

const useStageClasses = makeStyles(
  theme => {
    return {
      fallbackRoot: {
        fontSize: '.8em',
        color: '#F29100',
        margin: theme.spacing(1, 0),
        padding: theme.spacing(1, 2),
        overflowWrap: 'break-word'
      },
      verifiedOverflow: {
        overflowY: 'auto',
        maxHeight: '15rem'
      },
      root: {
        border: `1px solid ${theme.palette.grey['400']}`,
        borderRadius: theme.spacing(1),
        fontSize: '.8em',
        marginLeft: theme.spacing(1),
        padding: theme.spacing(1, 2),
        overflowWrap: 'break-word'
      },
      rootWarnAccepted: {
        border: `1px solid ${theme.palette.grey['400']}`,
        borderRadius: theme.spacing(1),
        fontSize: '.8em',
        margin: theme.spacing(0.5, 0),
        padding: theme.spacing(1, 2),
        backgroundColor: yellow['100'],
        overflowWrap: 'break-word',
        overflowX: 'hidden'
      },
      outlinedAccepted: {
        border: `1px solid ${theme.palette.grey['400']}`,
        borderRadius: theme.spacing(1),
        fontSize: '.8em',
        margin: theme.spacing(0.5, 0),
        padding: theme.spacing(1, 2),
        overflowWrap: 'break-word',
        overflowX: 'hidden'
      },
      regularAccepted: {
        marginLeft: theme.spacing(1),
        overflowWrap: 'break-word',
        overflowX: 'hidden'
      },
      list: {
        listStyle: 'none',
        margin: 0,
        padding: 0
      }
    };
  },
  { name: 'Stage' }
);

function Stage(props) {
  const {
    comments,
    id,
    investibles,
    marketId,
    isReview,
    isVoting,
    showCompletion,
    marketPresences
  } = props;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const sortedInvestibles = investibles.sort(function(a, b) {
    const aMarketInfo = getMarketInfo(a, marketId);
    const bMarketInfo = getMarketInfo(b, marketId);
    return new Date(bMarketInfo.updated_at) - new Date(aMarketInfo.updated_at);
  });
  const classes = useStageClasses(props);
  const history = useHistory();

  function investibleOnDragStart (event) {
    const dragImage = document.getElementById(`dragImage${event.target.id}`);
    event.dataTransfer.setDragImage(dragImage, 100, 0);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text', event.target.id);
    event.dataTransfer.setData('stageId', id);
  }
  const investiblesMap = sortedInvestibles.map(inv => {
    const { investible } = inv;
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const unaccepted = _.size(_.intersection(marketInfo.accepted, marketInfo.assigned)) <
      _.size(marketInfo.assigned) && isVoting;
    const numQuestionsSuggestions = countByType(investible, comments,
      [QUESTION_TYPE, SUGGEST_CHANGE_TYPE]);
    return (
      <>
        <div key={investible.id} id={investible.id} onDragStart={investibleOnDragStart} draggable
             className={classes.outlinedAccepted}
             style={{minWidth: isReview ? '45%' : undefined}}
             onMouseOver={() => doShowEdit(investible.id)}
             onMouseOut={() => doRemoveEdit(investible.id)}
             onClick={event => {
               preventDefaultAndProp(event);
               navigate(history, formInvestibleLink(marketId, investible.id));
             }}
        >
          <StageInvestible
            marketPresences={marketPresences || []}
            comments={comments || []}
            investible={investible}
            marketId={marketId}
            marketInfo={marketInfo}
            isReview={isReview}
            isVoting={isVoting}
            numQuestionsSuggestions={numQuestionsSuggestions}
            unaccepted={unaccepted}
            showCompletion={showCompletion}
            mobileLayout={mobileLayout}
          />
        </div>
        <DragImage id={investible.id} name={investible.name} />
      </>
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

const generalStageStyles = makeStyles(() => {
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
    }
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
    mobileLayout,
    unaccepted
  } = props;
  const intl = useIntl();

  function getChip(labelNum, isGreen, toolTipId) {
    if (isGreen) {
      return undefined;
    }
    return (
      <Tooltip title={intl.formatMessage({ id: toolTipId })}>
        <span className={'MuiTabItem-tag'} style={{backgroundColor: WARNING_COLOR,
          borderRadius: 22, paddingLeft: '6px', paddingRight: '5px', paddingTop: '2px', maxHeight: '20px'}}>
          {labelNum} {intl.formatMessage({ id: 'open' })}
        </span>
      </Tooltip>
    );
  }

  function requiresStatus(messagesState, id) {
    if (!_.isEmpty(findMessageOfTypeAndId(id, messagesState, 'REPORT'))) {
      return true;
    }
    return !_.isEmpty(findMessageOfType('REPORT_REQUIRED', id, messagesState));
  }

  const { completion_estimate: daysEstimate, ticket_code: ticketCode } = marketInfo;
  const { id, name,  label_list: labelList } = investible;
  const history = useHistory();
  const to = formInvestibleLink(marketId, id);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState] = useContext(NotificationsContext)
  const classes = generalStageStyles();
  const planClasses = usePlanFormStyles();
  const votersForInvestible = useInvestibleVoters(marketPresences, id, marketId);
  const collaboratorsForInvestible = getCollaboratorsForInvestible(id, marketId, comments, votersForInvestible,
    marketPresences, marketPresencesState);
  const hasDaysEstimate = showCompletion && daysEstimate;
  let chip = mobileLayout ? undefined : getChip(numQuestionsSuggestions,
    numQuestionsSuggestions === 0, 'inputRequiredCountExplanation');
  if (!chip && requiresStatus(messagesState, id)) {
    chip = <Tooltip title={intl.formatMessage({ id: 'reportRequired'})}>
      <Schedule style={{fontSize: 24, color: '#E85757'}}/>
    </Tooltip>;
  }
  const ticketNumber = getTicketNumber(ticketCode);
  return (
    <>
      <Grid container>
        <Grid item xs={3}>
          {!unaccepted && (
            <div>
              <GravatarGroup users={collaboratorsForInvestible} gravatarClassName={classes.smallGravatar} />
            </div>
          )}
          {unaccepted && (
            <div className={planClasses.daysEstimation}>
              <FormattedMessage id='planningUnacceptedLabel' />
            </div>
          )}
        </Grid>
        {ticketNumber && !mobileLayout && (
          <Grid item xs={1} style={{ paddingBottom: '0.2rem' }}>
            <Typography variant="subtitle2" style={{whiteSpace: 'nowrap'}}>J-{ticketNumber}</Typography>
          </Grid>
        )}
        {hasDaysEstimate && (
          <Grid item xs={2} style={{ marginLeft: '1rem', marginRight: '1rem', whiteSpace: 'nowrap' }}>
            <FormattedMessage id='estimatedCompletionToday' /> <UsefulRelativeTime value={new Date(daysEstimate)}/>
          </Grid>
        )}
        <Grid id={`showEdit0${id}`} item xs={1} style={{pointerEvents: 'none', visibility: 'hidden'}}>
          <EditOutlinedIcon style={{maxHeight: '1.25rem', marginLeft: '4.5rem'}} />
        </Grid>
        {chip}
      </Grid>
      <div id={`planningIdea${id}`} style={{paddingTop: `${chip ? '0rem' : '0.5rem'}`}}>
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
      width: '100%'
    }
  };
});

function StageLink (props) {
  const { className, ...other } = props;
  const classes = useStageLinkStyles();
  return <Link className={clsx(classes.root, className)} {...other} />;
}

export default PlanningIdeas;
