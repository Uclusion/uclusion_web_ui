import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { Grid, Link, Tooltip, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles';
import { red, yellow } from '@material-ui/core/colors';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { formInvestibleLink, formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import clsx from 'clsx';
import {
  checkInProgressWarning,
  checkReviewWarning,
  checkVotingWarning,
} from './PlanningDialog';
import { DaysEstimate } from '../../../components/AgilePlan';
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
import { getMarketInfo, getVotesForInvestible } from '../../../utils/userFunctions';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { getFullStage, getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  resolveInvestibleComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { removeHeader, restoreHeader } from '../../../containers/Header'
import { LocalPlanningDragContext } from './InvestiblesByWorkspace';
import GravatarGroup from '../../../components/Avatars/GravatarGroup';
import { getInvestibleVoters } from '../../../utils/votingUtils';
import { getCommenterPresences, getUserSwimlaneInvestibles, onDropTodo } from './userUtils';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';

const warningColor = red['400'];

const usePlanningIdStyles = makeStyles(
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
      verifiedOverflow: {
        overflowY: 'auto',
        maxHeight: '25rem'
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
    investibles,
    marketId,
    acceptedStage,
    inDialogStageId,
    inReviewStageId,
    inBlockingStageId,
    inVerifiedStageId,
    inRequiresInputStageId,
    presenceId,
    activeMarket,
    comments
  } = props;
  const intl = useIntl();
  const acceptedStageId = acceptedStage.id;
  const classes = usePlanningIdStyles();
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
  const [messagesState] = useContext(NotificationsContext);
  const warnAccepted = checkInProgressWarning(investibles, myPresence, messagesState);
  const acceptedInvestibles = investibles.filter(investible => {
    const { market_infos: marketInfos } = investible;
    const marketInfo = marketInfos.find(info => info.market_id === marketId);
    return marketInfo !== undefined && marketInfo.stage === acceptedStageId;
  }) || [];
  const acceptedFull = acceptedStage.allowed_investibles > 0
    && acceptedInvestibles.length >= acceptedStage.allowed_investibles;
  const acceptedStageLabel = acceptedFull ? 'planningAcceptedStageFullLabel' : 'planningAcceptedStageLabel';

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
          refreshInvestibles(invDispatch, diffDispatch, [inv]);
          const targetStage = getFullStage(marketStagesState, marketId, targetStageId);
          if (targetStage.close_comments_on_entrance) {
            resolveInvestibleComments(investibleId, marketId, commentsState, commentsDispatch);
          }
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
    const investibleId = event.dataTransfer.getData('text');
    const currentStageId = event.dataTransfer.getData('stageId');
    if (checkStageMatching(currentStageId)) {
      const investible = getInvestible(invState, investibleId);
      const marketInfo = getMarketInfo(investible, marketId);
      const { assigned } = marketInfo;
      if ((assigned || []).length === 1) {
        // Not supporting drag and drop to accepted for multiple assigned
        const invested = getVotesForInvestible(marketPresences, investibleId);
        const hasEnoughVotes = votesRequired ? (invested || []).length > votesRequired : true;
        if (isAssignedInvestible(event, myPresence.id) && myPresence.id === presenceId && !acceptedFull &&
          hasEnoughVotes) {
          stageChange(event, acceptedStageId);
        }
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
      // This is a TODO being dragged
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
      if ((assigned || []).length === 1) {
        // Not supporting drag and drop to accepted for multiple assigned
        const invested = getVotesForInvestible(marketPresences, id);
        const hasEnoughVotes = votesRequired ? (invested || []).length > votesRequired : true;
        return draggerIsAssigned && myPresence.id === presenceId && !acceptedFull && hasEnoughVotes;
      }
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
      document.getElementById(previousElementId).className = classes.containerEmpty;
      setBeingDraggedHack({});
    }
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
        <Tooltip
          title={intl.formatMessage({ id: 'planningVotingStageDescription' })}
        >
          <dt className={classes.stageLabel}>
            <FormattedMessage id="planningVotingStageLabel"/>
          </dt>
        </Tooltip>
        <VotingStage
          className={classes.stage}
          id={inDialogStageId}
          investibles={investibles}
          marketId={marketId}
          presenceId={presenceId}
          activeMarket={activeMarket}
          marketPresences={marketPresences}
          comments={comments}
        />
      </div>
      <div id={`${acceptedStageId}_${presenceId}`} onDrop={onDropAccepted}
           onDragOver={onDragOverProcess}
           onDragEnter={(event) => onDragEnterStage(event, acceptedStageId, presenceId)}
           onDragEnd={onDragEndStage}>
        <Tooltip
          title={intl.formatMessage({ id: 'planningAcceptedStageDescription' })}
        >
          <dt className={classes.stageLabel}>
            <FormattedMessage id={acceptedStageLabel}/>
          </dt>
        </Tooltip>
        <AcceptedStage
          className={classes.stage}
          id={acceptedStageId}
          investibles={investibles}
          marketId={marketId}
          presenceId={presenceId}
          marketPresences={marketPresences}
          comments={comments}
          warnAccepted={warnAccepted}
        />
      </div>
      <div id={`${inReviewStageId}_${presenceId}`} onDrop={onDropReview}
           onDragOver={onDragOverProcess}
           onDragEnter={(event) => onDragEnterStage(event, inReviewStageId, presenceId)}
           onDragEnd={onDragEndStage}>
        <Tooltip
          title={intl.formatMessage({ id: 'planningReviewStageDescription' })}
        >
          <dt className={classes.stageLabel}>
            <FormattedMessage id="planningReviewStageLabel"/>
          </dt>
        </Tooltip>
        <ReviewStage
          className={classes.stage}
          id={inReviewStageId}
          investibles={investibles}
          marketId={marketId}
          presenceId={presenceId}
          comments={comments}
          marketPresences={marketPresences}
        />
      </div>
      <div id={`${inVerifiedStageId}_${presenceId}`} onDrop={onDropVerified}
           onDragOver={onDragOverProcess}
           onDragEnter={(event) => onDragEnterStage(event, inVerifiedStageId, presenceId)}
           onDragEnd={onDragEndStage}>
        <Tooltip
          title={intl.formatMessage({ id: 'planningVerifiedStageDescription' })}
        >
          <dt className={classes.stageLabel}>
            <FormattedMessage id="verifiedBlockedStageLabel"/>
          </dt>
        </Tooltip>
        <VerifiedStage
          className={classes.stage}
          id={inVerifiedStageId}
          investibles={investibles}
          stage={getFullStage(marketStagesState, marketId, inVerifiedStageId)}
          presenceId={presenceId}
          comments={comments}
          marketPresences={marketPresences}
          marketId={marketId}
          overflowClass={classes.verifiedOverflow}
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
      root: {
        border: `1px solid ${theme.palette.grey['400']}`,
        borderRadius: theme.spacing(1),
        fontSize: '.8em',
        margin: theme.spacing(1, 0),
        padding: theme.spacing(1, 2),
        overflowWrap: 'break-word'
      },
      rootWarnAccepted: {
        border: `1px solid ${theme.palette.grey['400']}`,
        borderRadius: theme.spacing(1),
        fontSize: '.8em',
        margin: theme.spacing(0.5, 0),
        padding: theme.spacing(1, 2),
        backgroundColor: yellow['400'],
        overflowWrap: 'break-word'
      },
      outlinedAccepted: {
        border: `1px solid ${theme.palette.grey['400']}`,
        borderRadius: theme.spacing(1),
        fontSize: '.8em',
        margin: theme.spacing(0.5, 0),
        padding: theme.spacing(1, 2),
        overflowWrap: 'break-word'
      },
      regularAccepted: {
        marginLeft: 0,
        overflowWrap: 'break-word'
      },
      fallback: {
        backgroundColor: theme.palette.grey['400']
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

function Stage (props) {
  const {
    fallbackOnClick,
    comments,
    fallbackWarning,
    id,
    investibles,
    marketId,
    updatedText,
    warnAccepted,
    isReview,
    isVoting,
    showCompletion,
    marketPresences,
    presenceId,
    limitInvestibles,
    limitInvestiblesAge,
    overflowClass
  } = props;
  const [, dragHack] = useContext(LocalPlanningDragContext);
  const stageInvestibles = getUserSwimlaneInvestibles(investibles, limitInvestibles, limitInvestiblesAge,
    marketId, id);
  const classes = useStageClasses(props);
  const [showEdit, setShowEdit] = useState(undefined);
  const history = useHistory();
  if (fallbackWarning !== undefined && stageInvestibles.length === 0) {
    const style = fallbackOnClick ? { cursor: 'pointer' } : {};
    return (
      <div onClick={fallbackOnClick ? fallbackOnClick : () => {}} style={style}>
        <dd className={clsx(classes.root, classes.fallback)}>
          {fallbackWarning}
        </dd>
      </div>
    );
  }

  function investibleOnDragStart (event) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text', event.target.id);
    event.dataTransfer.setData('stageId', id);
    const originalElementId = `${id}_${presenceId}`;
    dragHack({ id: event.target.id, stageId: id, originalElementId });
  }

  const warnAcceptedSafe = warnAccepted || {};
  const warnKeys = Object.keys(warnAcceptedSafe);
  const singleInvestible = (stageInvestibles || []).length === 1;
  function doShowEdit(id) {
    setShowEdit(id);
  }
  return (
    <dd className={singleInvestible && warnAcceptedSafe[warnKeys[0]] ? classes.rootWarnAccepted :
      singleInvestible ? classes.root : classes.regularAccepted}>
      <ul className={classes.list}>
        <Grid
          className={overflowClass}
          container>
        {stageInvestibles.map(inv => {
          const { investible, market_infos: marketInfos } = inv;
          const marketInfo = marketInfos.find(
            info => info.market_id === marketId
          );

          return (
            <Grid key={investible.id} item xs={12} onDragStart={investibleOnDragStart} id={investible.id} draggable
                  className={!singleInvestible && warnAcceptedSafe[investible.id] ? classes.rootWarnAccepted
              : !singleInvestible ? classes.outlinedAccepted : classes.regularAccepted}
                  onMouseOver={() => doShowEdit(investible.id)} onMouseOut={() => doShowEdit(undefined)}
                  onClick={event => {
                    event.preventDefault();
                    navigate(history, formInvestibleLink(marketId, investible.id));
                  }}
            >
              <Grid container>
                <Grid item xs={showEdit === investible.id ? 11 : 12}>
                  <StageInvestible
                    marketPresences={marketPresences || []}
                    comments={comments || []}
                    investible={investible}
                    marketId={marketId}
                    marketInfo={marketInfo}
                    updatedText={updatedText}
                    showWarning={isReview ? checkReviewWarning(investible, comments) :
                      isVoting ? checkReviewWarning(investible, comments, true) ||
                        checkVotingWarning(investible.id, marketPresences) : false}
                    showCompletion={showCompletion}
                  />
                </Grid>
                {showEdit === investible.id && (
                  <Grid item xs={1} style={{pointerEvents: 'none'}}>
                    <EditOutlinedIcon />
                  </Grid>
                )}
              </Grid>
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

const useVotingStageClasses = makeStyles(
  () => {
    return {
      root: {},
      fallback: {
        backgroundColor: warningColor,
        color: 'white'
      }
    };
  },
  { name: 'VotingStage' }
);

function VotingStage (props) {
  const { className, marketId, presenceId, activeMarket, comments, marketPresences, ...other } = props;

  const classes = useVotingStageClasses();
  const intl = useIntl();

  const history = useHistory();
  const link = formMarketAddInvestibleLink(marketId);
  const assignedLink = link + `#assignee=${presenceId}`;

  function onClick (event) {
    // prevent browser navigation
    event.preventDefault();
    navigate(history, assignedLink);
  }

  return (

    <Stage
      classes={classes}
      fallbackWarning={
        activeMarket ?
          <React.Fragment>
            <FormattedMessage id="planningNoneInDialogWarning"/>
            <StageLink href={assignedLink} onClick={onClick}>
              {intl.formatMessage({
                id: 'createAssignment'
              })}
            </StageLink>
          </React.Fragment> : <React.Fragment>
            <FormattedMessage id="planningNoneInDialogWarning"/>
          </React.Fragment>
      }
      marketId={marketId}
      comments={comments}
      presenceId={presenceId}
      isVoting
      fallbackOnClick={onClick}
      marketPresences={marketPresences}
      updatedText={intl.formatMessage({
        id: 'inDialogInvestiblesUpdatedAt'
      })}
      {...other}
    />
  );
}

function AcceptedStage (props) {
  const intl = useIntl();
  return (
    <Stage
      fallbackWarning={<FormattedMessage id="planningNoneAcceptedWarning"/>}
      updatedText={intl.formatMessage({
        id: 'acceptedInvestiblesUpdatedAt'
      })}
      showCompletion
      {...props}
    />
  );
}

function ReviewStage (props) {
  const intl = useIntl();

  return (
    <Stage
      fallbackWarning={intl.formatMessage({
        id: 'planningNoneInReviewWarning'
      })}
      updatedText={intl.formatMessage({
        id: 'reviewingInvestiblesUpdatedAt'
      })}
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
    }
  };
});

function VerifiedStage(props) {
  const intl = useIntl();
  const { stage } = props;
  const limitInvestibles = (stage || {}).allowed_investibles;
  const limitInvestiblesAge = (stage || {}).days_visible;
  return (
    <Stage
      fallbackWarning={intl.formatMessage({
        id: 'planningNoneInVerifiedWarning'
      })}
      updatedText={intl.formatMessage({
        id: 'verifiedInvestiblesUpdatedAt'
      })}
      limitInvestibles={limitInvestibles}
      limitInvestiblesAge={limitInvestiblesAge}
      {...props}
    />
  );
}


function StageInvestible (props) {
  const {
    investible,
    marketId,
    marketInfo,
    updatedText,
    showWarning,
    showCompletion,
    comments,
    marketPresences
  } = props;
  const { days_estimate: daysEstimate } = marketInfo;
  const { id, name, created_at: createdAt, label_list: labelList } = investible;
  const history = useHistory();
  const to = formInvestibleLink(marketId, id);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const safeChangeDate = Date.parse(marketInfo.last_stage_change_date);
  const classes = generalStageStyles();

  const commentsForInvestible = comments.filter((comment) => comment.investible_id === id);

  const commenterPresences = getCommenterPresences(marketPresences, commentsForInvestible, marketPresencesState);
  const votersForInvestible = getInvestibleVoters(marketPresences, id);
  const concated = [...votersForInvestible, ...commenterPresences];

  const collaboratorsForInvestible = _.uniqBy(concated, 'id');
  return (
    <div>
      <StageLink
        href={to}
        id={id}
        draggable="false"
        onClick={event => {
          event.preventDefault();
          navigate(history, to);
        }}
      >
        <Typography color={showWarning ? 'error' : 'initial'} variant="subtitle2">{name}</Typography>
        <Typography variant="inherit">
          {updatedText}
          <FormattedDate value={safeChangeDate}/>
        </Typography>
        {showCompletion && daysEstimate && (
          <DaysEstimate readOnly value={daysEstimate} createdAt={createdAt}/>
        )}
        <div className={classes.chipsClass}>
          {labelList && labelList.map((label) =>
            <div key={label}>
              <Chip size="small" label={label} className={classes.chipClass} color="primary"/>
            </div>
          )}
        </div>

      </StageLink>
      <div onClick={(event) => {
        event.preventDefault();
        navigate(history, to);
      }}>
        <GravatarGroup users={collaboratorsForInvestible}/>
      </div>
    </div>
  );
}

const useStageLinkStyles = makeStyles(theme => {
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
