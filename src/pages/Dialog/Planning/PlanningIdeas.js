import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash';
import { useHistory } from 'react-router'
import { Link, Tooltip, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { red, yellow } from '@material-ui/core/colors'
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl'
import { formInvestibleLink, formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions'
import clsx from 'clsx'
import { checkInProgressWarning, checkReviewWarning, checkVotingWarning } from './PlanningDialog'
import { DaysEstimate } from '../../../components/AgilePlan'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import Chip from '@material-ui/core/Chip'
import { stageChangeInvestible, updateInvestible } from '../../../api/investibles'
import {
  getInvestible,
  refreshInvestibles
} from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { getMarketInfo, getVotesForInvestible } from '../../../utils/userFunctions'
import { ISSUE_TYPE, TODO_TYPE } from '../../../constants/comments'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { getFullStage, getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'

const warningColor = red["400"];

const usePlanningIdStyles = makeStyles(
  theme => {
    return {
      stages: {
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        margin: 0,
        "& > *": {
          borderRight: `1px solid ${theme.palette.grey["300"]}`,
          flex: "1 1 25%",
          minWidth: "15ch",
          padding: theme.spacing(1),
          "&:last-child": {
            borderRight: "none"
          }
        }
      },
      stageLabel: {},
      containerEmpty: {},
      containerRed: {
        borderColor: "red",
        borderStyle: "dashed",
        borderWidth: "3px",
        borderRadius: 6
      },
      containerGreen: {
        borderColor: "green",
        borderStyle: "dashed",
        borderWidth: "3px",
        borderRadius: 6
      }
    };
  },
  { name: "PlanningIdea" }
);

function PlanningIdeas(props) {
  const {
    investibles,
    marketId,
    acceptedStage,
    inDialogStageId,
    inReviewStageId,
    inBlockingStageId,
    presenceId,
    activeMarket,
    comments,
    beingDraggedHack,
    setBeingDraggedHack
  } = props;
  const intl = useIntl();
  const acceptedStageId = acceptedStage.id;
  const classes = usePlanningIdStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const market = getMarket(marketsState, marketId);
  // investibles for type initiative, are really markets, so treat it as such
  const { votes_required: votesRequired } = (market || {});
  const [invState, invDispatch] = useContext(InvestiblesContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [, diffDispatch] = useContext(DiffContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const warnAccepted = checkInProgressWarning(investibles, comments, acceptedStageId, marketId);
  const acceptedInvestibles = investibles.filter(investible => {
    const { market_infos: marketInfos } = investible;
    const marketInfo = marketInfos.find(info => info.market_id === marketId);
    return marketInfo !== undefined && marketInfo.stage === acceptedStageId;
  }) || [];
  const acceptedFull = acceptedStage.allowed_investibles > 0
    && acceptedInvestibles.length >= acceptedStage.allowed_investibles;
  const acceptedStageLabel = acceptedFull? 'planningAcceptedStageFullLabel' : 'planningAcceptedStageLabel';
  const myPresence = (marketPresences || []).find((presence) => presence.current_user) || {};
  function isBlockedByIssue(investibleId, currentStageId, targetStageId) {
    const investibleComments = comments.filter((comment) => comment.investible_id === investibleId) || [];
    const blockingComments = investibleComments.filter(
      comment => comment.comment_type === ISSUE_TYPE && !comment.resolved
    );
    const todoComments = investibleComments.filter(
      comment => comment.comment_type === TODO_TYPE && !comment.resolved
    );
    if (!_.isEmpty(blockingComments)) {
      return true;
    }
    if (currentStageId !== inBlockingStageId && !_.isEmpty(todoComments)) {
      if (currentStageId !== inDialogStageId || targetStageId === inReviewStageId) {
        return true;
      }
    }
    return false;
  }
  function stageChange(event, targetStageId) {
    event.preventDefault();
    const investibleId = event.dataTransfer.getData("text");
    const currentStageId = event.dataTransfer.getData("stageId");
    if (!operationRunning && !isBlockedByIssue(investibleId, currentStageId, targetStageId) &&
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
          setOperationRunning(false);
        });
    }
  }
  function isAssignedInvestible(event, assignedToId) {
    const investibleId = event.dataTransfer.getData("text");
    const investible = getInvestible(invState, investibleId);
    const marketInfo = getMarketInfo(investible, marketId);
    const { assigned } = marketInfo;
    return (assigned || []).includes(assignedToId);
  }
  function checkStageMatching(stageId) {
    const marketStages = getStages(marketStagesState, marketId);
    const stage = getFullStage(marketStagesState, marketId, stageId)
    return (marketStages || []).includes(stage);
  }
  function onDropVoting(event) {
    const investibleId = event.dataTransfer.getData("text");
    const currentStageId = event.dataTransfer.getData("stageId");
    if (checkStageMatching(currentStageId)) {
      if (isAssignedInvestible(event, myPresence.id) || myPresence.id === presenceId) {
        if (isAssignedInvestible(event, myPresence.id) && myPresence.id === presenceId) {
          stageChange(event, inDialogStageId);
        } else if (!operationRunning && !isAssignedInvestible(event, presenceId)) {
          // Assignment can be changed even on a blocked investible
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
              marketInfo.stage = inDialogStageId;
              refreshInvestibles(invDispatch, diffDispatch, [fullInvestible]);
              setOperationRunning(false);
            });
        }
      }
    }
  }
  function onDropAccepted(event) {
    const investibleId = event.dataTransfer.getData("text");
    const currentStageId = event.dataTransfer.getData("stageId");
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
  function onDropReview(event) {
    const currentStageId = event.dataTransfer.getData("stageId");
    if (checkStageMatching(currentStageId)) {
      if (isAssignedInvestible(event, presenceId)) {
        stageChange(event, inReviewStageId);
      }
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
    const isBlocked = isBlockedByIssue(id, stageId, divId);
    if (divId === inDialogStageId) {
      return (draggerIsAssigned && myPresence.id === presenceId && !isBlocked) ||
        (draggerIsAssigned || myPresence.id === presenceId);
    }
    if (isBlocked) {
      return false;
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
  function onDragEnterStage(event, divId, divPresenceId) {
    const { id, stageId, previousElementId, originalElementId } = beingDraggedHack;
    const elementId = `${divId}_${divPresenceId}`;
    if (elementId !== originalElementId && elementId !== previousElementId) {
      if (previousElementId) {
        document.getElementById(previousElementId).className = classes.containerEmpty;
      }
      if (isEligableDrop(divId)) {
        if (!operationRunning) {
          event.dataTransfer.dropEffect = "move";
          document.getElementById(elementId).className = classes.containerGreen;
          setBeingDraggedHack({ id, stageId, previousElementId:elementId, originalElementId });
        }
      } else {
        event.dataTransfer.dropEffect = "none";
        document.getElementById(elementId).className = classes.containerRed;
        setBeingDraggedHack({ id, stageId, previousElementId:elementId, originalElementId });
      }
    }
  }
  function onDragEndStage() {
    const { previousElementId } = beingDraggedHack;
    if (previousElementId) {
      document.getElementById(previousElementId).className = classes.containerEmpty;
      setBeingDraggedHack({});
    }
  }
  return (
    <dl className={classes.stages}>
      <div id={`${inDialogStageId}_${presenceId}`} onDrop={onDropVoting}
           onDragOver={(event) => event.preventDefault()}
           onDragEnter={(event) => onDragEnterStage(event, inDialogStageId, presenceId)}
           onDragEnd={onDragEndStage}>
        <Tooltip
          title={intl.formatMessage({ id: 'planningVotingStageDescription' })}
        >
          <dt className={classes.stageLabel}>
            <FormattedMessage id="planningVotingStageLabel" />
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
          dragHack={setBeingDraggedHack}
        />
      </div>
      <div id={`${acceptedStageId}_${presenceId}`} onDrop={onDropAccepted}
           onDragOver={(event) => event.preventDefault()}
           onDragEnter={(event) => onDragEnterStage(event, acceptedStageId, presenceId)}
           onDragEnd={onDragEndStage}>
        <Tooltip
          title={intl.formatMessage({ id: 'planningAcceptedStageDescription' })}
        >
          <dt className={classes.stageLabel}>
            <FormattedMessage id={acceptedStageLabel} />
          </dt>
        </Tooltip>
        <AcceptedStage
          className={classes.stage}
          id={acceptedStageId}
          investibles={investibles}
          marketId={marketId}
          presenceId={presenceId}
          warnAccepted={warnAccepted}
          dragHack={setBeingDraggedHack}
        />
      </div>
      <div id={`${inReviewStageId}_${presenceId}`} onDrop={onDropReview}
           onDragOver={(event) => event.preventDefault()}
           onDragEnter={(event) => onDragEnterStage(event, inReviewStageId, presenceId)}
           onDragEnd={onDragEndStage}>
        <Tooltip
          title={intl.formatMessage({ id: 'planningReviewStageDescription' })}
        >
          <dt className={classes.stageLabel}>
            <FormattedMessage id="planningReviewStageLabel" />
          </dt>
        </Tooltip>
        <ReviewStage
          className={classes.stage}
          id={inReviewStageId}
          investibles={investibles}
          marketId={marketId}
          presenceId={presenceId}
          comments={comments}
          dragHack={setBeingDraggedHack}
        />
      </div>
      <div>
        <Tooltip
          title={intl.formatMessage({ id: 'planningBlockedStageDescription' })}
        >
          <dt className={classes.stageLabel}>
            <FormattedMessage id="planningBlockedStageLabel" />
          </dt>
        </Tooltip>
        <BlockingStage
          className={classes.stage}
          id={inBlockingStageId}
          investibles={investibles}
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
      root: {
        border: `1px solid ${theme.palette.grey["400"]}`,
        borderRadius: theme.spacing(1),
        fontSize: ".8em",
        margin: theme.spacing(1, 0),
        padding: theme.spacing(1, 2)
      },
      rootWarnAccepted: {
        border: `1px solid ${theme.palette.grey["400"]}`,
        borderRadius: theme.spacing(1),
        fontSize: ".8em",
        margin: theme.spacing(1, 0),
        padding: theme.spacing(1, 2),
        backgroundColor: yellow["400"],
      },
      outlinedAccepted: {
        border: `1px solid ${theme.palette.grey["400"]}`,
        borderRadius: theme.spacing(1),
        fontSize: ".8em",
        margin: theme.spacing(1, 0),
        padding: theme.spacing(1, 2),
      },
      regularAccepted: {
        marginLeft: 0
      },
      fallback: {
        backgroundColor: theme.palette.grey["400"]
      },
      list: {
        listStyle: "none",
        margin: 0,
        padding: 0
      }
    };
  },
  { name: "Stage" }
);

function Stage(props) {
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
    dragHack,
    presenceId
  } = props;

  const stageInvestibles = investibles.filter(investible => {
    const { market_infos: marketInfos } = investible;
    // console.log(`Investible id is ${id}`);
    const marketInfo = marketInfos.find(info => info.market_id === marketId);
    if (process.env.NODE_ENV !== "production") {
      if (marketInfo === undefined) {
        console.warn(`no marketinfo for ${marketId} with `, marketInfos);
      }
    }
    return marketInfo !== undefined && marketInfo.stage === id;
  });

  const classes = useStageClasses(props);

  if (fallbackWarning !== undefined && stageInvestibles.length === 0) {
    const style = fallbackOnClick? { cursor: 'pointer' } : {}
    return (
      <div onClick={fallbackOnClick? fallbackOnClick: () => {}} style={style}>
        <dd className={clsx(classes.root, classes.fallback)}>
          {fallbackWarning}
        </dd>
      </div>
    );
  }

  function investibleOnDragStart(event) {
    event.dataTransfer.setData("text", event.target.id);
    event.dataTransfer.setData("stageId", id);
    const originalElementId = `${id}_${presenceId}`;
    dragHack({id:event.target.id, stageId: id, originalElementId});
  }
  const warnAcceptedSafe = warnAccepted || {};
  const warnKeys = Object.keys(warnAcceptedSafe);
  const singleInvestible = (stageInvestibles || []).length === 1;
  return (
    <dd className={singleInvestible && warnAcceptedSafe[warnKeys[0]] ? classes.rootWarnAccepted :
      singleInvestible ? classes.root : classes.regularAccepted}>
      <ul className={classes.list}>
        {stageInvestibles.map(inv => {
          const { investible, market_infos: marketInfos } = inv;
          const marketInfo = marketInfos.find(
            info => info.market_id === marketId
          );

          return (
            <li key={investible.id} id={investible.id} onDragStart={investibleOnDragStart}
                className={!singleInvestible && warnAcceptedSafe[investible.id] ? classes.rootWarnAccepted
                  : !singleInvestible ? classes.outlinedAccepted : classes.regularAccepted}>
              <StageInvestible
                comments={comments}
                investible={investible}
                marketId={marketId}
                marketInfo={marketInfo}
                updatedText={updatedText}
                showWarning={isReview ? checkReviewWarning(investible, comments) :
                  isVoting ? checkReviewWarning(investible, comments) || checkVotingWarning(investible.id, marketPresences) : false}
                showCompletion={showCompletion}
              />
            </li>
          );
        })}
      </ul>
    </dd>
  );
}

Stage.propTypes = {
  id: PropTypes.string.isRequired,
  investibles: PropTypes.array.isRequired,
  marketId: PropTypes.string.isRequired,
  fallbackOnClick: PropTypes.func,
};


const useVotingStageClasses = makeStyles(
  theme => {
    return {
      root: {},
      fallback: {
        backgroundColor: warningColor,
        color: "white"
      }
    };
  },
  { name: "VotingStage" }
);

function VotingStage(props) {
  const { className, marketId, presenceId, activeMarket, comments, marketPresences, ...other } = props;

  const classes = useVotingStageClasses();
  const intl = useIntl();

  const history = useHistory();
  const link = formMarketAddInvestibleLink(marketId);
  const assignedLink = link + `#assignee=${presenceId}`;
  function onClick(event) {
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
          <FormattedMessage id="planningNoneInDialogWarning" />
          <StageLink href={assignedLink} onClick={onClick}>
            {intl.formatMessage({
              id: "createAssignment"
            })}
          </StageLink>
        </React.Fragment> : <React.Fragment>
            <FormattedMessage id="planningNoneInDialogWarning" />
          </React.Fragment>
      }
      marketId={marketId}
      comments={comments}
      presenceId={presenceId}
      isVoting
      fallbackOnClick={onClick}
      marketPresences={marketPresences}
      updatedText={intl.formatMessage({
        id: "inDialogInvestiblesUpdatedAt"
      })}
      {...other}
   />
  );
}

function AcceptedStage(props) {
  const intl = useIntl();
  return (
    <Stage
      fallbackWarning={<FormattedMessage id="planningNoneAcceptedWarning" />}
      updatedText={intl.formatMessage({
        id: "acceptedInvestiblesUpdatedAt"
      })}
      showCompletion
      {...props}
    />
  );
}

function ReviewStage(props) {
  const intl = useIntl();

  return (
    <Stage
      fallbackWarning={intl.formatMessage({
        id: "planningNoneInReviewWarning"
      })}
      updatedText={intl.formatMessage({
        id: "reviewingInvestiblesUpdatedAt"
      })}
      isReview
      {...props}
    />
  );
}

const useBlockingStageStyles = makeStyles(theme => {
  return {
    root: {
      backgroundColor: warningColor
    },
    outlinedAccepted: {
      border: `1px solid ${theme.palette.grey["400"]}`,
      borderRadius: theme.spacing(1),
      fontSize: ".8em",
      margin: theme.spacing(1, 0),
      padding: theme.spacing(1, 2),
      backgroundColor: warningColor
    },
    fallback: {
      backgroundColor: theme.palette.grey["400"]
    }
  };
});

const generalStageStyles = makeStyles(() => {
  return {
    chipClass: {
      fontSize: 10,
    },
    chipsClass: {
      display: "flex",
    }
  }
});

function BlockingStage(props) {
  const intl = useIntl();
  const classes = useBlockingStageStyles();

  return (
    <Stage
      classes={classes}
      fallbackWarning={intl.formatMessage({
        id: "planningNoneInBlockingWarning"
      })}
      updatedText={intl.formatMessage({
        id: "blockedInvestiblesUpdatedAt"
      })}
      {...props}
    />
  );
}

function StageInvestible(props) {
  const { investible, marketId, marketInfo, updatedText, showWarning, showCompletion } = props;
  const { days_estimate: daysEstimate } = marketInfo;
  const { id, name, created_at: createdAt, label_list: labelList } = investible;
  const history = useHistory();
  const to = formInvestibleLink(marketId, id);
  const safeChangeDate = Date.parse(marketInfo.last_stage_change_date);
  const classes = generalStageStyles();
  return (
    <StageLink
      href={to}
      id={id}
      onClick={event => {
        event.preventDefault();
        navigate(history, to);
      }}
    >
      <Typography color={showWarning ? 'error' : 'initial'} variant="subtitle2">{name}</Typography>
      <Typography variant="inherit">
        {updatedText}
        <FormattedDate value={safeChangeDate} />
      </Typography>
      {showCompletion && daysEstimate && (
        <DaysEstimate readOnly value={daysEstimate} createdAt={createdAt} />
      )}
      <div className={classes.chipsClass}>
        {labelList && labelList.map((label) =>
          <div key={label}>
            <Chip size="small" label={label} className={classes.chipClass} color="primary" />
          </div>
        )}
      </div>
    </StageLink>
  );
}

const useStageLinkStyles = makeStyles(theme => {
  return {
    root: {
      color: "inherit",
      display: "block",
      height: "100%",
      width: "100%"
    }
  };
});

function StageLink(props) {
  const { className, ...other } = props;
  const classes = useStageLinkStyles();
  return <Link className={clsx(classes.root, className)} {...other} />;
}

export default PlanningIdeas;
