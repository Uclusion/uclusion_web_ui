import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Grid, Typography } from '@material-ui/core'
import _ from 'lodash'
import RaisedCard from '../../components/Cards/RaisedCard'
import { useIntl } from 'react-intl'
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { makeStyles } from '@material-ui/core/styles'
import { yellow } from '@material-ui/core/colors'
import { removeHeader, restoreHeader } from '../../containers/Header'
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments'
import { stageChangeInvestible, updateInvestible } from '../../api/investibles'
import { getInvestible, refreshInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { LocalPlanningDragContext } from '../Dialog/Planning/PlanningDialog'
import {
  isBlockedStage, isFurtherWorkStage,
  isRequiredInputStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import GravatarGroup from '../../components/Avatars/GravatarGroup'
import Link from '@material-ui/core/Link'
import { getMarketInfo } from '../../utils/userFunctions'
import { doRemoveEdit, doShowEdit, getCommenterPresences, onDropTodo } from '../Dialog/Planning/userUtils'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  getMarketPresences,
} from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { getInvestibleVoters } from '../../utils/votingUtils';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined'
import { notify, onInvestibleStageChange } from '../../utils/investibleFunctions'
import { UNASSIGNED_TYPE, YELLOW_LEVEL } from '../../constants/notifications'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'

function getInvestibleOnClick(id, marketId, history) {
  const link = formInvestibleLink(marketId, id);
  navigate(history, link);
}

export const myArchiveClasses = makeStyles(
  theme => {
    return {
      warn: {
        border: `1px solid ${theme.palette.grey["400"]}`,
        borderRadius: theme.spacing(1),
        padding: theme.spacing(1, 2),
        backgroundColor: yellow["400"],
      },
      outlined: {
        border: `1px solid ${theme.palette.grey["400"]}`,
        borderRadius: theme.spacing(1),
        padding: theme.spacing(1, 2),
      },
      white: {
        backgroundColor: "white",
        padding: 0,
        margin: 0,
        overflowY: 'auto',
        maxHeight: '25rem'
      },
      containerGreen: {
        borderColor: 'green',
        borderStyle: 'dashed',
        borderWidth: '3px'
      },
      containerEmpty: {},
      grow: {
        padding: '30px',
        flexGrow: 1,
      },
    };
  },
  { name: "Archive" }
);

function getInvestibles(investibles, marketPresences, marketPresencesState, presenceMap, marketId, comments, history, intl, elevation, highlightMap,
  allowDragDrop, onDragEnd, unResolvedMarketComments, presenceId, stage, setBeingDraggedHack, classes) {
  const investibleData = investibles.map((inv) => {
    const aMarketInfo = getMarketInfo(inv, marketId);
    const { updated_at: invUpdatedAt } = inv.investible;
    const { updated_at: infoUpdatedAt } = aMarketInfo;
    const updatedAt = new Date(invUpdatedAt) > new Date(infoUpdatedAt) ? invUpdatedAt : infoUpdatedAt;
    return { ...inv.investible, updatedAt, enteredStageAt: new Date(aMarketInfo.last_stage_change_date) };
  });
  const sortedData = _.sortBy(investibleData, 'updatedAt', 'name').reverse();
  const infoMap = investibles.reduce((acc, inv) => {
    const { investible } = inv;
    const myInfo = getMarketInfo(inv, marketId) || {};
    const { id } = investible;
    return {
      ...acc,
      [id]: myInfo,
    };
  }, {});

  return sortedData.map((investible) => {
    const { id, name, enteredStageAt } = investible;
    const info = infoMap[id] || {};
    const { assigned } = info;
    const requiresInputComments = (unResolvedMarketComments || []).filter((comment) => {
      return ((comment.comment_type === QUESTION_TYPE || comment.comment_type === SUGGEST_CHANGE_TYPE))
        && (assigned || []).includes(presenceId) && (comment.investible_id === id);
    });
    const blockedComments = (unResolvedMarketComments || []).filter((comment) => {
      return (comment.comment_type === ISSUE_TYPE) && (comment.investible_id === id);
    });
    const usedAssignees = assigned || [];
    const assignedNames = usedAssignees.map((element) => {
      const presence = presenceMap[element];
      return presence ? presence.name : '';
    });
    const investibleComments = comments.filter(comment => comment.investible_id === id);
    const voters = getInvestibleVoters(marketPresences, id);
    const commentPresences = getCommenterPresences(marketPresences, investibleComments, marketPresencesState);
    const concated = [...voters, ...commentPresences];
    const collaborators =  _.uniqBy(concated, 'id');
    function onDragStart(event) {
      removeHeader();
      const stageId = stage ? stage.id : undefined;
      event.dataTransfer.setData("text", id);
      event.dataTransfer.setData("stageId", stageId);
      const originalElementId = `${stageId}_${presenceId}`;
      setBeingDraggedHack({id, stageId, originalElementId});
    }
    const isDraggable = allowDragDrop && stage && ((_.isEmpty(requiresInputComments) && isRequiredInputStage(stage) )
      || (_.isEmpty(blockedComments) && isBlockedStage(stage)) || isFurtherWorkStage(stage));
    return (
      <Grid
        key={id}
        id={id}
        item
        md={3}
        xs={12}
        draggable={isDraggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{overflowWrap: "break-word"}}
        onMouseOver={() => doShowEdit(id)} onMouseOut={() => doRemoveEdit(id)}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          getInvestibleOnClick(id, marketId, history);
        }}
      >
        <RaisedCard>
          <Link href={formInvestibleLink(marketId, id)} color="inherit" draggable="false">
            <div className={highlightMap[id] ? classes.warn : classes.outlined}>
              <Grid container>
                <Grid item xs={11}>
                  <Typography style={{fontSize: '.75rem', flex: 1}}>
                    Entered stage {intl.formatDate(enteredStageAt)}
                  </Typography>
                </Grid>
                <Grid id={`showEdit0${id}`} item xs={1} style={{pointerEvents: 'none', display: 'none'}}>
                  <EditOutlinedIcon style={{maxHeight: '1.25rem'}} />
                </Grid>
                <Grid id={`showEdit1${id}`} item xs={12} style={{paddingTop: '0.5rem'}}>
                  <Typography style={{flex: 2}}>
                    {name}
                  </Typography>
                  {assignedNames.map((name) => (<Typography
                    style={{fontStyle: 'italic', fontSize: '.75rem', flex: 1}}
                    key={name}>Assignee: {name}
                  </Typography>))}
                  <GravatarGroup users={collaborators}/>
                </Grid>
              </Grid>
            </div>
          </Link>
        </RaisedCard>
      </Grid>
    );
  });
}

function ArchiveInvestbiles(props) {
  const {
    investibles,
    comments,
    marketId,
    presenceMap,
    elevation,
    highlightMap,
    allowDragDrop,
    isReadyToStart,
    stage,
    presenceId
  } = props;
  const classes = myArchiveClasses();
  const intl = useIntl();
  const history = useHistory();
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  const stageId = stage ? stage.id : undefined;
  const unResolvedMarketComments = comments.filter(comment => !comment.resolved) || [];
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [invState, invDispatch] = useContext(InvestiblesContext);
  const [beingDraggedHack, setBeingDraggedHack] = useContext(LocalPlanningDragContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);

  function onDragEnd() {
    restoreHeader();
    const { previousElementId } = beingDraggedHack;
    if (previousElementId) {
      document.getElementById(previousElementId).className = classes.containerEmpty;
      setBeingDraggedHack({});
    }
  }

  function onDropFurtherWorkSection(investibleId, isReadyToStart) {
    const investible = getInvestible(invState, investibleId);
    const marketInfo = getMarketInfo(investible, marketId);
    const { open_for_investment: openForInvestment } = marketInfo;
    if (isReadyToStart === openForInvestment) {
      return;
    }
    const updateInfo = {
      marketId,
      investibleId,
      openForInvestment: isReadyToStart,
    };
    setOperationRunning(true);
    return updateInvestible(updateInfo).then((fullInvestible) => {
      onInvestibleStageChange(stage, fullInvestible, investibleId, marketId, commentsState,
        commentsDispatch, invDispatch, () => {}, undefined, messagesState,
        messagesDispatch, [UNASSIGNED_TYPE]);
      if (isReadyToStart) {
        const market = getMarket(marketsState, marketId);
        notify(presenceId, investibleId, UNASSIGNED_TYPE, YELLOW_LEVEL, invState, market, messagesDispatch);
      }
      setOperationRunning(false);
    });
  }

  function onDrop(event) {
    if (stage.move_on_comment) {
      return;
    }
    event.preventDefault();
    const anId = event.dataTransfer.getData("text");
    const currentStageId = event.dataTransfer.getData("stageId");
    if (!currentStageId) {
      return onDropTodo(anId, commentsState, marketId, setOperationRunning, intl, commentsDispatch, invDispatch);
    }
    const isFurtherWork = isFurtherWorkStage(stage);
    if (currentStageId === stageId) {
      if (isFurtherWork && !operationRunning) {
        return onDropFurtherWorkSection(anId, !!isReadyToStart);
      }
      return;
    }
    if (!operationRunning) {
      const target = event.target;
      target.style.cursor = 'wait';
      const moveInfo = {
        marketId,
        investibleId: anId,
        stageInfo: {
          current_stage_id: currentStageId,
          stage_id: stageId,
        },
      };
      setOperationRunning(true);
      return stageChangeInvestible(moveInfo)
        .then((inv) => {
          if (isFurtherWork && isReadyToStart) {
            const updateInfo = {
              marketId,
              investibleId: anId,
              openForInvestment: true,
            };
            return updateInvestible(updateInfo);
          }
          return inv;
        })
        .then((inv) => {
          refreshInvestibles(invDispatch, () => {}, [inv]);
        }).finally(() => {
          target.style.cursor = 'pointer';
          setOperationRunning(false);
        });
    }
  }
  const elementId = allowDragDrop && !stage.move_on_comment ? isReadyToStart ? 'furtherReadyToStart'
    : 'furtherNotReadyToStart' : undefined;

  function setElementGreen() {
    removeElementGreen();
    document.getElementById(elementId).classList.add(classes.containerGreen);
  }

  function removeElementGreen() {
    ['furtherReadyToStart', 'furtherNotReadyToStart'].forEach((elementId) => {
      document.getElementById(elementId).classList.remove(classes.containerGreen);
    });
  }
  return (
    <Grid
      container
      className={classes.white}
      onDrop={onDrop}
      id={elementId}
      onDragEnd={removeElementGreen}
      onDragEnter={setElementGreen}
      onDragOver={(event) => (stage && !stage.move_on_comment) && event.preventDefault()}
    >
      {_.isEmpty(investibles) && (
        <div className={classes.grow} />
      )}
      {getInvestibles(investibles, marketPresences, marketPresencesState, presenceMap, marketId, comments, history, intl, elevation, highlightMap, allowDragDrop,
      onDragEnd, unResolvedMarketComments, presenceId, stage, setBeingDraggedHack, classes)}
    </Grid>
  );
}

ArchiveInvestbiles.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
  presenceMap: PropTypes.object,
  highlightMap: PropTypes.object,
};

ArchiveInvestbiles.defaultProps = {
  investibles: [],
  presenceMap: {},
  highlightMap: {}
};

export default ArchiveInvestbiles;
