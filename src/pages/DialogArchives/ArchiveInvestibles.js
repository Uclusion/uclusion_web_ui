import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import _ from 'lodash';
import RaisedCard from '../../components/Cards/RaisedCard';
import { useIntl } from 'react-intl';
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { makeStyles } from '@material-ui/core/styles';
import { yellow } from '@material-ui/core/colors';
import { QUESTION_TYPE } from '../../constants/comments';
import {
  getFullStage,
  isBlockedStage,
  isRequiredInputStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import Link from '@material-ui/core/Link';
import { getMarketInfo } from '../../utils/userFunctions';
import { doRemoveEdit, doShowEdit } from '../Dialog/Planning/userUtils';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences, } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { Block } from '@material-ui/icons';
import QuestionIcon from '@material-ui/icons/ContactSupport';
import LightbulbOutlined from '../../components/CustomChip/LightbulbOutlined';
import DragImage from '../../components/Dialogs/DragImage';
import UsefulRelativeTime from '../../components/TextFields/UseRelativeTime';

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
        backgroundColor: yellow["100"],
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

function getInvestibles(investibles, marketPresences, marketPresencesState, presenceMap, marketId, comments, history,
  intl, elevation, allowDragDrop, unResolvedMarketComments, presenceId, marketStagesState, classes, mobileLayout) {
  const investibleData = investibles.map((inv) => {
    const aMarketInfo = getMarketInfo(inv, marketId);
    return { ...inv, enteredStageAt: new Date(aMarketInfo.last_stage_change_date) };
  });
  const sortedData = _.sortBy(investibleData, 'enteredStageAt', 'name').reverse();

  return sortedData.map((inv) => {
    const { investible } = inv;
    const { id, name } = investible;
    const info = getMarketInfo(inv, marketId) || {};
    const { assigned, stage: stageId, ticket_code: ticketCode, last_stage_change_date: lastStageChangeDate } = info;
    const enteredStageAt = new Date(lastStageChangeDate)
    const stage = getFullStage(marketStagesState, marketId, stageId);
    const usedAssignees = assigned || [];
    const questionComments = (unResolvedMarketComments || []).filter((comment) => {
      return (comment.comment_type === QUESTION_TYPE) && (comment.investible_id === id) &&
        usedAssignees.includes(comment.created_by);
    });
    const assignedNames = usedAssignees.map((element) => {
      const presence = presenceMap[element];
      return presence ? presence.name : '';
    });
    function onDragStart(event) {
      const dragImage = document.getElementById(`dragImage${id}`);
      if (dragImage) {
        event.dataTransfer.setDragImage(dragImage, 100, 0);
      }
      const stageId = stage ? stage.id : undefined;
      event.dataTransfer.setData("text", id);
      event.dataTransfer.setData("stageId", stageId);
    }
    const TypeIcon = isBlockedStage(stage) ? <Block htmlColor='#E85757' />
      : (isRequiredInputStage(stage) ? (_.isEmpty(questionComments) ? <LightbulbOutlined htmlColor='#E85757' /> :
        <QuestionIcon htmlColor='#E85757' />) : undefined);
    const ticketNumber = ticketCode ? ticketCode.substring(ticketCode.lastIndexOf('-')+1) : undefined;
    return (
      <>
        <Grid
          id={id}
          key={id}
          item
          md={3}
          xs={12}
          style={{overflowWrap: "break-word"}}
          onMouseOver={() => doShowEdit(id)} onMouseOut={() => doRemoveEdit(id)}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            getInvestibleOnClick(id, marketId, history);
          }}
        >
          <RaisedCard draggable={allowDragDrop} onDragStart={onDragStart}>
            <Link href={formInvestibleLink(marketId, id)} color="inherit" draggable="false">
              <div className={classes.outlined}>
                <Grid container>
                  <Grid item xs={8}>
                    <Typography style={{fontSize: '.75rem', flex: 1}}>
                      Entered stage <UsefulRelativeTime value={enteredStageAt}/>
                    </Typography>
                  </Grid>
                  {ticketNumber && (
                    <Grid item xs={2} style={{ paddingBottom: '0.2rem' }}>
                      <Typography variant="subtitle2">U-{ticketNumber}</Typography>
                    </Grid>
                  )}
                  {TypeIcon && (
                    <Grid item xs={1}>
                      {TypeIcon}
                    </Grid>
                  )}
                  <Grid id={`showEdit0${id}`} item xs={1} style={{pointerEvents: 'none', visibility: 'hidden'}}>
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
                  </Grid>
                </Grid>
              </div>
            </Link>
          </RaisedCard>
        </Grid>
        {!mobileLayout && (
          <DragImage id={id} name={name} />
        )}
      </>
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
    allowDragDrop,
    presenceId
  } = props;
  const classes = myArchiveClasses();
  const intl = useIntl();
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const unResolvedMarketComments = comments.filter(comment => !comment.resolved) || [];
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);

  return (
    <Grid container className={classes.white}>
      {_.isEmpty(investibles) && (
        <div className={classes.grow} />
      )}
      {getInvestibles(investibles, marketPresences, marketPresencesState, presenceMap, marketId, comments, history,
        intl, elevation, allowDragDrop, unResolvedMarketComments, presenceId, marketStagesState, classes, mobileLayout)}
    </Grid>
  );
}

ArchiveInvestbiles.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
  presenceMap: PropTypes.object
};

ArchiveInvestbiles.defaultProps = {
  investibles: [],
  presenceMap: {}
};

export default ArchiveInvestbiles;
