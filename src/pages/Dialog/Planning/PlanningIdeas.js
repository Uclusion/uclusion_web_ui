import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { Grid, Link, Tooltip, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles';
import { yellow } from '@material-ui/core/colors';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  formInvestibleLink,
  formMarketAddInvestibleLink,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions'
import clsx from 'clsx';
import { LocalPlanningDragContext, } from './PlanningDialog'
import { countByType } from './InvestiblesByPerson'
import { DaysEstimate, usePlanFormStyles } from '../../../components/AgilePlan'
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
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { getFullStage, getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { removeHeader, restoreHeader } from '../../../containers/Header'
import GravatarGroup from '../../../components/Avatars/GravatarGroup';
import { getInvestibleVoters } from '../../../utils/votingUtils';
import { doRemoveEdit, doShowEdit, getCommenterPresences, onDropTodo } from './userUtils'
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions'
import { myArchiveClasses } from '../../DialogArchives/ArchiveInvestibles'
import { WARNING_COLOR } from '../../../components/Buttons/ButtonConstants'
import { getTicketNumber } from '../../../utils/stringFunctions'

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
      containerRed: {
        borderColor: 'red',
        borderStyle: 'dashed',
        borderWidth: '3px',
        borderRadius: 6
      },
      containerGreen: {
        borderColor: 'green',
        borderStyle: 'dashed',
        borderWidth: '3px',
        borderRadius: 6
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
    inBlockingStageId,
    inVerifiedStageId,
    inRequiresInputStageId,
    presenceId,
    groupId,
    comments
  } = props;
  const intl = useIntl();
  const acceptedStageId = acceptedStage.id;
  const classes = usePlanningIdStyles();
  const archiveClasses = myArchiveClasses();
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [beingDraggedHack, setBeingDraggedHack] = useContext(LocalPlanningDragContext);
  const market = getMarket(marketsState, marketId);
  // investibles for type initiative, are really markets, so treat it as such
  const { votes_required: votesRequired } = (market || {});
  const [invState, invDispatch] = useContext(InvestiblesContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = (marketPresences || []).find((presence) => presence.current_user) || {};
  const acceptedInvestibles = myInvestiblesStageHash[acceptedStageId] || [];
  const acceptedOverFull = acceptedStage.allowed_investibles > 0
    && acceptedInvestibles.length > acceptedStage.allowed_investibles;

  function isBlockedByTodo(investibleId, currentStageId, targetStageId) {
    const investibleComments = comments.filter((comment) => comment.investible_id === investibleId) || [];
    const todoComments = investibleComments.filter(
      comment => comment.comment_type === TODO_TYPE && !comment.resolved
    );
    return targetStageId === inVerifiedStageId && !_.isEmpty(todoComments);
  }

  function stageChange (event, targetStageId) {
    event.preventDefault();
    const investibleId = event.dataTransfer.getData('text');
    const currentStageId = event.dataTransfer.getData('stageId');
    if (!operationRunning && !isBlockedByTodo(investibleId, currentStageId, targetStageId) &&
      currentStageId !== targetStageId && checkStageMatching(currentStageId)) {
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
            invDispatch, diffDispatch, marketStagesState, undefined, fullStage);
        }).finally(() => {
          target.style.cursor = 'pointer';
          setOperationRunning(false);
        });
    }
  }

  function isAssignedInvestible (event, assignedToId) {
    const investibleId = event.dataTransfer.getData('text');
    const investible = getInvestible(invState, investibleId);
    const marketInfo = getMarketInfo(investible, marketId);
    const { assigned } = marketInfo;
    return (assigned || []).includes(assignedToId);
  }

  function checkStageMatching (stageId) {
    const marketStages = getStages(marketStagesState, marketId);
    const stage = getFullStage(marketStagesState, marketId, stageId);
    return (marketStages || []).includes(stage);
  }

  function onDropVoting (event) {
    const currentStageId = event.dataTransfer.getData('stageId');
    if (!currentStageId) {
      // This is a dragged TODO
      const commentId = event.dataTransfer.getData('text');
      onDropTodo(commentId, commentsState, marketId, setOperationRunning, intl, commentsDispatch, invDispatch,
        presenceId);
    } else if (checkStageMatching(currentStageId)) {
      const investibleId = event.dataTransfer.getData('text');
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

  function onDropAccepted (event) {
    const currentStageId = event.dataTransfer.getData('stageId');
    if (checkStageMatching(currentStageId)) {
      if (isAssignedInvestible(event, myPresence.id) && myPresence.id === presenceId) {
        stageChange(event, acceptedStageId);
      }
    }
  }

  function onDropReview (event) {
    const currentStageId = event.dataTransfer.getData('stageId');
    if (checkStageMatching(currentStageId)) {
      if (isAssignedInvestible(event, presenceId)) {
        stageChange(event, inReviewStageId);
      }
    }
  }

  function onDropVerified(event) {
    const currentStageId = event.dataTransfer.getData('stageId');
    if (checkStageMatching(currentStageId)) {
      stageChange(event, inVerifiedStageId);
    }
  }

  function isEligableDrop(divId) {
    const { id, stageId } = beingDraggedHack;
    if (!stageId) {
      // This is a TO-DO being dragged
      return divId === inDialogStageId;
    }
    if (!checkStageMatching(stageId)) {
      return false;
    }
    const investible = getInvestible(invState, id);
    const marketInfo = getMarketInfo(investible, marketId);
    const { assigned } = marketInfo;
    const draggerIsAssigned = (assigned || []).includes(myPresence.id);
    const swimLaneIsAssigned = (assigned || []).includes(presenceId);
    const isBlocked = isBlockedByTodo(id, stageId, divId);
    if (isBlocked) {
      return false;
    }
    if (divId === inDialogStageId || divId === inVerifiedStageId) {
      return true;
    }
    if (divId === acceptedStageId) {
      return draggerIsAssigned && myPresence.id === presenceId;
    }
    if (divId === inReviewStageId) {
      return swimLaneIsAssigned;
    }
    return false;
  }

  function onDragEnterStage (event, divId, divPresenceId) {
    removeHeader();
    const { id, stageId, previousElementId, originalElementId } = beingDraggedHack;
    const elementId = `${divId}_${divPresenceId}`;
    if (elementId !== originalElementId && elementId !== previousElementId) {
      if (previousElementId) {
        document.getElementById(previousElementId).className = classes.containerEmpty;
      }
      if (isEligableDrop(divId)) {
        if (!operationRunning) {
          document.getElementById(elementId).className = classes.containerGreen;
          if (!_.isEmpty(beingDraggedHack)) {
            setBeingDraggedHack({ id, stageId, previousElementId: elementId, originalElementId });
          }
        }
      } else {
        event.dataTransfer.dropEffect = 'none';
        document.getElementById(elementId).className = classes.containerRed;
        if (!_.isEmpty(beingDraggedHack)) {
          setBeingDraggedHack({ id, stageId, previousElementId: elementId, originalElementId });
        }
      }
    }
  }

  function onDragEndStage () {
    restoreHeader();
    const { previousElementId } = beingDraggedHack;
    if (previousElementId) {
      const previousElement = document.getElementById(previousElementId);
      if (previousElement) {
        previousElement.className = classes.containerEmpty;
      }
    }
    if (!_.isEmpty(beingDraggedHack)) {
      setBeingDraggedHack({});
    }
    ['furtherReadyToStart', 'furtherNotReadyToStart'].forEach((elementId) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.classList.remove(archiveClasses.containerGreen);
      }
    });
  }

  function onDragOverProcess(event) {
    event.dataTransfer.dropEffect = 'move';
    event.preventDefault();
  }

  return (
    <dl className={classes.stages}>
      <div id={`${inDialogStageId}_${presenceId}`} onDrop={onDropVoting}
           onDragOver={onDragOverProcess}
           onDragEnter={(event) => onDragEnterStage(event, inDialogStageId, presenceId)}
           onDragEnd={onDragEndStage}>
        <VotingStage
          className={classes.stage}
          id={inDialogStageId}
          investibles={myInvestiblesStageHash[inDialogStageId] || []}
          marketId={marketId}
          groupId={groupId}
          presenceId={presenceId}
          marketPresences={marketPresences}
          comments={comments}
          votesRequired={votesRequired}
          myPresence={myPresence}
        />
      </div>
      <div id={`${acceptedStageId}_${presenceId}`} onDrop={onDropAccepted}
           onDragOver={onDragOverProcess}
           onDragEnter={(event) => onDragEnterStage(event, acceptedStageId, presenceId)}
           onDragEnd={onDragEndStage}>
        {acceptedOverFull && !_.isEmpty(beingDraggedHack) && (
          <FormattedMessage id="planningAcceptedStageFullLabel"/>
        )}
        <AcceptedStage
          className={classes.stage}
          id={acceptedStageId}
          investibles={myInvestiblesStageHash[acceptedStageId] || []}
          marketId={marketId}
          presenceId={presenceId}
          myPresence={myPresence}
          marketPresences={marketPresences}
          comments={comments}
        />
      </div>
      <div id={`${inReviewStageId}_${presenceId}`} onDrop={onDropReview}
           onDragOver={onDragOverProcess}
           onDragEnter={(event) => onDragEnterStage(event, inReviewStageId, presenceId)}
           onDragEnd={onDragEndStage}>
        <ReviewStage
          className={classes.stage}
          id={inReviewStageId}
          investibles={myInvestiblesStageHash[inReviewStageId] || []}
          marketId={marketId}
          myPresence={myPresence}
          presenceId={presenceId}
          comments={comments}
          marketPresences={marketPresences}
        />
      </div>
      <div id={`${inVerifiedStageId}_${presenceId}`} onDrop={onDropVerified}
           onDragOver={onDragOverProcess}
           onDragEnter={(event) => onDragEnterStage(event, inVerifiedStageId, presenceId)}
           onDragEnd={onDragEndStage}>
        <VerifiedStage
          className={classes.stage}
          id={inVerifiedStageId}
          investibles={myInvestiblesStageHash[inVerifiedStageId] || []}
          presenceId={presenceId}
          comments={comments}
          marketPresences={marketPresences}
          marketId={marketId}
        />
      </div>
    </dl>
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
        marginLeft: 0,
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
    marketPresences,
    presenceId,
    votesRequired
  } = props;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [, dragHack] = useContext(LocalPlanningDragContext);
  const sortedInvestibles = investibles.sort(function(a, b) {
    const aMarketInfo = getMarketInfo(a, marketId);
    const bMarketInfo = getMarketInfo(b, marketId);
    return new Date(bMarketInfo.updated_at) - new Date(aMarketInfo.updated_at);
  });
  const classes = useStageClasses(props);
  const history = useHistory();

  function investibleOnDragStart (event) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text', event.target.id);
    event.dataTransfer.setData('stageId', id);
    const originalElementId = `${id}_${presenceId}`;
    dragHack({ id: event.target.id, stageId: id, originalElementId });
  }

  const singleInvestible = investibles.length === 1;
  return (
    <dd className={singleInvestible ? classes.root : classes.regularAccepted}>
      <ul className={classes.list}>
        <Grid
          className={classes.verifiedOverflow}
          container>
        {sortedInvestibles.map(inv => {
          const { investible } = inv;
          const marketInfo = getMarketInfo(inv, marketId) || {};
          const unaccepted = _.isEmpty(_.intersection(marketInfo.accepted, marketInfo.assigned));
          const numQuestionsSuggestions = countByType(investible, comments,
            [QUESTION_TYPE, SUGGEST_CHANGE_TYPE]);
          return (
            <Grid key={investible.id} item xs={12} onDragStart={investibleOnDragStart} id={investible.id} draggable
                  className={!singleInvestible ? classes.outlinedAccepted : classes.regularAccepted}
                  onMouseOver={() => doShowEdit(investible.id)} onMouseOut={() => doRemoveEdit(investible.id)}
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
                  votesRequired={votesRequired}
                  numQuestionsSuggestions={numQuestionsSuggestions}
                  unaccepted={unaccepted}
                  showCompletion={showCompletion}
                  mobileLayout={mobileLayout}
                />
            </Grid>
          );
        })}
        </Grid>
      </ul>
    </dd>
  );
}

Stage.propTypes = {
  id: PropTypes.string.isRequired,
  investibles: PropTypes.array.isRequired,
  marketId: PropTypes.string.isRequired,
  fallbackOnClick: PropTypes.func
};

function VotingStage (props) {
  const { marketId, presenceId, groupId } = props;
  const history = useHistory();
  const link = formMarketAddInvestibleLink(marketId, groupId);
  const assignedLink = link + `#assignee=${presenceId}`;

  function onClick (event) {
    preventDefaultAndProp(event);
    navigate(history, assignedLink);
  }

  return (
    <Stage
      isVoting
      fallbackOnClick={onClick}
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
    chipsClass: {
      display: 'flex',
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

function VerifiedStage(props) {
  return (
    <Stage
      {...props}
    />
  );
}


function StageInvestible(props) {
  const {
    investible,
    marketId,
    marketInfo,
    showCompletion,
    comments,
    marketPresences,
    isVoting,
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
          borderRadius: 10, paddingLeft: '5px', paddingRight: '1px', paddingTop: '1px', maxHeight: '20px'}}>
          {labelNum} {intl.formatMessage({ id: 'open' })}
        </span>
      </Tooltip>
    );
  }

  const { completion_estimate: daysEstimate, ticket_code: ticketCode } = marketInfo;
  const { id, name, created_at: createdAt, label_list: labelList } = investible;
  const history = useHistory();
  const to = formInvestibleLink(marketId, id);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const classes = generalStageStyles();
  const planClasses = usePlanFormStyles();
  const commentsForInvestible = comments.filter((comment) => comment.investible_id === id);

  const commenterPresences = getCommenterPresences(marketPresences, commentsForInvestible, marketPresencesState);
  const votersForInvestible = getInvestibleVoters(marketPresences, id);
  const concated = [...votersForInvestible, ...commenterPresences];
  const hasDaysEstimate = showCompletion && daysEstimate;
  const collaboratorsForInvestible = _.uniqBy(concated, 'id');
  const chip = mobileLayout ? undefined : getChip(numQuestionsSuggestions, numQuestionsSuggestions === 0,
    'inputRequiredCountExplanation');
  const ticketNumber = getTicketNumber(ticketCode);
  return (
    <Grid container>
      <Grid item xs={8}>
        <div>
          <GravatarGroup users={collaboratorsForInvestible} gravatarClassName={classes.smallGravatar} />
        </div>
        {hasDaysEstimate && !isVoting && (
          <DaysEstimate readOnly value={daysEstimate} createdAt={createdAt}/>
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
      <Grid id={`showEdit0${id}`} item xs={1} style={{pointerEvents: 'none', visibility: 'hidden'}}>
        <EditOutlinedIcon style={{maxHeight: '1.25rem'}} />
      </Grid>
      {chip}
      <Grid id={`showEdit1${hasDaysEstimate ? '' : id}`} item xs={12} style={{paddingTop: `${chip ? '0rem' : '0.5rem'}`}}>
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
          <div className={classes.chipsClass} style={{paddingTop: `${!_.isEmpty(labelList) ? '0.5rem': '0'}`}}>
            {labelList && labelList.map((label) =>
              <div key={label}>
                <Chip size="small" label={label} className={classes.chipClass} color="primary"/>
              </div>
            )}
          </div>
        </StageLink>
      </Grid>
    </Grid>
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
