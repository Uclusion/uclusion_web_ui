import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Grid, Tooltip, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import _ from 'lodash';
import RaisedCard from '../../components/Cards/RaisedCard';
import { useIntl } from 'react-intl';
import {
  formInboxItemLink,
  formInvestibleLink,
  navigate,
  preventDefaultAndProp
} from '../../utils/marketIdPathFunctions';
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
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { Block } from '@material-ui/icons';
import QuestionIcon from '@material-ui/icons/ContactSupport';
import LightbulbOutlined from '../../components/CustomChip/LightbulbOutlined';
import DragImage from '../../components/Dialogs/DragImage';
import UsefulRelativeTime from '../../components/TextFields/UseRelativeTime';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { findMessagesForInvestibleId } from '../../utils/messageUtils';
import { dehighlightMessage } from '../../contexts/NotificationsContext/notificationsContextHelper';

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

function ArchiveInvestbiles(props) {
  const {
    investibles,
    comments,
    marketId,
    presenceMap,
    allowDragDrop
  } = props;
  const classes = myArchiveClasses();
  const intl = useIntl();
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const unResolvedMarketComments = comments.filter(comment => !comment.resolved) || [];
  const [marketStagesState] = useContext(MarketStagesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);

  function getInvestibles() {
    const investibleData = investibles.map((inv) => {
      const aMarketInfo = getMarketInfo(inv, marketId);
      return { ...inv, enteredStageAt: new Date(aMarketInfo.last_stage_change_date) };
    });
    const sortedData = _.sortBy(investibleData, 'enteredStageAt', 'name').reverse();

    return sortedData.map((inv) => {
      const { investible } = inv;
      const { id, name } = investible;
      const messages = findMessagesForInvestibleId(id, messagesState);
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
      const assistanceType = isBlockedStage(stage) ? 0 : (isRequiredInputStage(stage) ?
        (_.isEmpty(questionComments) ? 1 : 2) : -1);
      let TypeIcon;
      let typeExplanation;
      // Just go to the first message associated with this investible that needs assistance if user has one
      const myMessage = !_.isEmpty(messages) ? messages[0] : undefined;
      switch (assistanceType) {
        case 0:
          TypeIcon = myMessage ? <Block htmlColor='#E85757' /> : <Block htmlColor='#F29100' />;
          typeExplanation = 'issuePresent';
          break;
        case 1:
          TypeIcon = myMessage ? <LightbulbOutlined htmlColor='#E85757' /> : <LightbulbOutlined htmlColor='#F29100' />;
          typeExplanation = 'suggestPresent';
          break;
        case 2:
          TypeIcon = myMessage ? <QuestionIcon htmlColor='#E85757' /> : <QuestionIcon htmlColor='#F29100' />;
          typeExplanation = 'questionPresent';
          break;
        default:
          TypeIcon = undefined;
          typeExplanation = undefined;
      }
      if (myMessage) {
        typeExplanation = 'messagePresent';
      }
      const ticketNumber = ticketCode ? ticketCode.substring(ticketCode.lastIndexOf('-')+1) : undefined;
      return (
        <React.Fragment key={`frag${id}`}>
          <Grid
            id={id}
            key={id}
            item
            md={3}
            xs={12}
            style={{overflowWrap: "break-word"}}
            onMouseOver={() => doShowEdit(id)} onMouseOut={() => doRemoveEdit(id)}
            onClick={(event) => {
              preventDefaultAndProp(event);
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
                      <Grid item xs={1}
                            onClick={(event) => {
                              if (myMessage) {
                                preventDefaultAndProp(event);
                                dehighlightMessage(myMessage, messagesDispatch);
                                navigate(history, formInboxItemLink(myMessage.type_object_id));
                              }
                            }}
                            onMouseOver={(event) => {
                              if (myMessage) {
                                preventDefaultAndProp(event);
                              }
                            }}
                      >
                        <Tooltip title={intl.formatMessage({ id: typeExplanation })}>
                          {TypeIcon}
                        </Tooltip>
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
        </React.Fragment>
      );
    });
  }

  return (
    <Grid id="archiveGrid" key="archiveGrid" container className={classes.white}>
      {_.isEmpty(investibles) && (
        <div id="grow" key="grow" className={classes.grow} />
      )}
      {getInvestibles()}
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
