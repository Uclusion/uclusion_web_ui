import React from 'react'
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
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments'

function getInvestibleOnClick(id, marketId, history) {
  return () => {
    const link = formInvestibleLink(marketId, id);
    navigate(history, link);
  };
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

export function getInvestibles(investibles, presenceMap, marketId, history, intl, elevation, highlightMap,
  allowDragDrop, onDragEnd, onDragStart, unResolvedMarketComments, presenceId, isInFurtherWork) {
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
    const usedAssignees = assigned || [];
    const assignedNames = usedAssignees.map((element) => {
      const presence = presenceMap[element];
      return presence ? presence.name : '';
    });
    return (
      <Grid
        key={id}
        id={id}
        item
        md={3}
        xs={12}
        draggable={allowDragDrop && (_.isEmpty(requiresInputComments) || isInFurtherWork)}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <RaisedCard
          onClick={getInvestibleOnClick(id, marketId, history)}
          elevation={elevation}
        >
          <div className={highlightMap[id] ? classes.warn : classes.outlined}>
            <Typography style={{fontSize: '.75rem', flex: 1}}>Updated: {intl.formatDate(updated_at)}</Typography>
            <Typography style={{fontWeight: 700, flex: 2}}>{name}</Typography>
            {assignedNames.map((name) => (<Typography style={{fontStyle: 'italic', fontSize: '.75rem', flex: 1}} key={name}>Assignee: {name}</Typography>))}
          </div>
        </RaisedCard>
      </Grid>
    );
  });
}

function ArchiveInvestbiles(props) {
  const {
    investibles,
    marketId,
    presenceMap,
    elevation,
    highlightMap,
    allowDragDrop,
    stageId,
    presenceId,
    isInFurtherWork,
    beingDraggedHack,
    setBeingDraggedHack,
    unResolvedMarketComments
  } = props;
  const classes = myClasses();
  const intl = useIntl();
  const history = useHistory();

  function onDragEnd() {
    restoreHeader();
    const { previousElementId } = beingDraggedHack;
    if (previousElementId) {
      document.getElementById(previousElementId).className = classes.containerEmpty;
      setBeingDraggedHack({});
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
    >
      {getInvestibles(investibles, presenceMap, marketId, history, intl, elevation, highlightMap, allowDragDrop,
      onDragEnd, onDragStart, unResolvedMarketComments, presenceId, isInFurtherWork)}
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
