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
import { restoreHeader } from '../../containers/Header'
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments'
import { stageChangeInvestible } from '../../api/investibles'
import { refreshInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { LocalPlanningDragContext } from '../Dialog/Planning/InvestiblesByWorkspace'
import { isBlockedStage, isInReviewStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import GravatarGroup from '../../components/Avatars/GravatarGroup'
import Link from '@material-ui/core/Link'

function getInvestibleOnClick(id, marketId, history) {
  const link = formInvestibleLink(marketId, id);
  navigate(history, link);
}

const myClasses = makeStyles(
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
        margin: 0
      },
      containerEmpty: {}
    };
  },
  { name: "Archive" }
);

export function getInvestibles(investibles, presenceMap, marketId, comments, history, intl, elevation, highlightMap,
  allowDragDrop, onDragEnd, onDragStart, unResolvedMarketComments, presenceId, stage) {
  const investibleData = investibles.map((inv) => inv.investible);
  const sortedData = _.sortBy(investibleData, 'updated_at', 'name').reverse();
  const infoMap = investibles.reduce((acc, inv) => {
    const { investible, market_infos } = inv;
    const myInfo = market_infos.find((info) => info.market_id === marketId);
    const { id } = investible;
    return {
      ...acc,
      [id]: myInfo,
    };
  }, {});
  const classes = myClasses();
  return sortedData.map((investible) => {
    const { id, name, updated_at } = investible;
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
    const investibleCommenters = _.uniq(investibleComments.map((comment) => comment.created_by));
    const commentPresences = investibleCommenters.map((userId) => presenceMap[userId]);
    return (
      <Grid
        key={id}
        id={id}
        item
        md={3}
        xs={12}
        draggable={allowDragDrop && stage && ((_.isEmpty(requiresInputComments) && isInReviewStage(stage) )
          || (_.isEmpty(blockedComments) && isBlockedStage(stage)) || !stage.allows_assignment)}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <RaisedCard
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            getInvestibleOnClick(id, marketId, history);
          }}
          elevation={elevation}
        >
          <Link href={formInvestibleLink(marketId, id)} color="inherit">
            <div className={highlightMap[id] ? classes.warn : classes.outlined}>
              <Typography style={{fontSize: '.75rem', flex: 1}}>Updated: {intl.formatDate(updated_at)}</Typography>
              <Typography style={{fontWeight: 700, flex: 2}}>{name}</Typography>
              {assignedNames.map((name) => (<Typography
                style={{fontStyle: 'italic', fontSize: '.75rem', flex: 1}} key={name}>Assignee: {name}</Typography>))}
              <GravatarGroup users={commentPresences}/>
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
    stage,
    presenceId
  } = props;
  const classes = myClasses();
  const intl = useIntl();
  const history = useHistory();
  const stageId = stage ? stage.id : undefined;
  const unResolvedMarketComments = comments.filter(comment => !comment.resolved) || [];
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [beingDraggedHack, setBeingDraggedHack] = useContext(LocalPlanningDragContext);

  function onDragEnd() {
    restoreHeader();
    const { previousElementId } = beingDraggedHack;
    if (previousElementId) {
      document.getElementById(previousElementId).className = classes.containerEmpty;
      setBeingDraggedHack({});
    }
  }

  function onDrop(event) {
    if (stage.move_on_comment) {
      return;
    }
    event.preventDefault();
    const investibleId = event.dataTransfer.getData("text");
    const currentStageId = event.dataTransfer.getData("stageId");
    if (!operationRunning) {
      const target = event.target;
      target.style.cursor = 'wait';
      const moveInfo = {
        marketId,
        investibleId,
        stageInfo: {
          current_stage_id: currentStageId,
          stage_id: stageId,
        },
      };
      setOperationRunning(true);
      return stageChangeInvestible(moveInfo)
        .then((inv) => {
          refreshInvestibles(invDispatch, () => {}, [inv]);
          setOperationRunning(false);
        });
    }
  }

  function onDragStart(event) {
    event.dataTransfer.setData("text", event.target.id);
    event.dataTransfer.setData("stageId", stageId);
    const originalElementId = `${stageId}_${presenceId}`;
    setBeingDraggedHack({id:event.target.id, stageId, originalElementId});
  }

  return (
    <Grid
      container
      className={classes.white}
      onDrop={onDrop}
      onDragOver={(event) => (stage && !stage.move_on_comment) && event.preventDefault()}
    >
      {getInvestibles(investibles, presenceMap, marketId, comments, history, intl, elevation, highlightMap, allowDragDrop,
      onDragEnd, onDragStart, unResolvedMarketComments, presenceId, stage)}
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
