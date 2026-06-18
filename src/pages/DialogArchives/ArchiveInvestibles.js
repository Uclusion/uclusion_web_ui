import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid, Tooltip, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import {
  formCommentLink,
  formInboxItemLink,
  formInvestibleLink,
  navigate,
  preventDefaultAndProp
} from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { makeStyles } from '@material-ui/core/styles';
import { CARD_BORDER_COLOR, DARK_CARD_BORDER_COLOR } from '../../components/Buttons/ButtonConstants';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';
import {
  getFullStage,
  getFurtherWorkStage,
  isBlockedStage, isFurtherWorkStage,
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
import PlanningJobMenu from '../Dialog/Planning/PlanningJobMenu';
import PersonSearch from '../../components/CustomChip/PersonSearch';
import { getTicketNumber, stripHTML } from '../../utils/stringFunctions';
import { DECISION_TYPE, INITIATIVE_TYPE } from '../../constants/markets';
import { getGroupPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import BugListItem from '../../components/Comments/BugListItem';
import TintedIconBadge from '../../components/CustomChip/TintedIconBadge';

// Assistance-section indicators (C-all-988 / Q-all-135, option O-2). Each
// reason a job sits in assistance becomes a compact tinted icon badge whose
// COLOR encodes the type - matching the outlined CommentTypeChip used on the
// comment rows in the same card and across the rest of the app. The older
// bare icons used color for urgency (red = unread message, orange = none),
// which clashed with that vocabulary. Urgency now rides on a small red dot
// (unread message) plus a fuller-saturation badge; read items are muted.
// Rendered with the shared TintedIconBadge (also used by the swimlane clock).
//   0 blocker, 1 suggestion, 2 question, 3 needs-assignment ("Ready").
const ASSIST_VISUAL = {
  0: { Icon: Block,             base: '#E85757', icon: '#C8362F', baseDark: '#E85757', iconDark: '#ef8b8b' },
  1: { Icon: LightbulbOutlined, base: '#F29100', icon: '#B96F00', baseDark: '#F29100', iconDark: '#f3ad4d' },
  2: { Icon: QuestionIcon,      base: '#2F80ED', icon: '#2F80ED', baseDark: '#4d96f5', iconDark: '#7db4f7' },
  3: { Icon: PersonSearch,      base: '#43A047', icon: '#2E7D32', baseDark: '#5fa55f', iconDark: '#7db05a' },
};

// Thin wrapper: look up the type's palette/icon and render the shared badge.
// forwardRef so MUI Tooltip can attach to the badge root.
const AssistanceBadge = React.forwardRef(function AssistanceBadge(props, ref) {
  const { assistanceType, unread, ...other } = props;
  const v = ASSIST_VISUAL[assistanceType];
  if (!v) {
    return null;
  }
  return <TintedIconBadge ref={ref} icon={v.Icon} palette={v} unread={unread} dim={!unread} {...other} />;
});

function getInvestibleOnClick(id, marketId, history) {
  const link = formInvestibleLink(marketId, id);
  navigate(history, link);
}

const myArchiveClasses = makeStyles(
  theme => {
    return {
      outlined: {
        // Stronger, theme-matched border so the Job-assistance cards read
        // clearly against the section background (T-all-2173).
        border: `2px solid ${theme.palette.type === 'dark' ? DARK_CARD_BORDER_COLOR : CARD_BORDER_COLOR}`,
        borderRadius: theme.spacing(1),
        padding: theme.spacing(1, 2)
      },
      noPadding: {
        padding: 0,
        margin: 0,
      },
      grow: {
        padding: '30px',
        flexGrow: 1,
      },
    };
  },
  { name: "Archive" }
);

function ArchiveInvestible(props) {
  const { name, id, stageId, marketId, allowDragDrop, onDragStart, enteredStageAt, TypeIconList, assignedNames, inAssistanceComments,
    classes, openForInvestment, viewIndicator='', isBlocked, needsAssist, groupId, marketPresences, isSingleUser, assigned } = props;
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const intl = useIntl();
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);
  const backlogStage = getFurtherWorkStage(marketStagesState, marketId);
  const recordPositionToggle = (event) => {
    if (anchorEl === null) {
      preventDefaultAndProp(event);
      setAnchorEl(event.currentTarget);
    } else {
      setAnchorEl(null);
    }
  };
  const inAssist = stageId === backlogStage?.id || isBlocked || needsAssist;
  const inArchives = !inAssist;
  return (
    <React.Fragment key={`frag${id}`}>
      {anchorEl && (
        <PlanningJobMenu anchorEl={anchorEl} recordPositionToggle={recordPositionToggle} isBlocked={isBlocked} assigned={assigned}
                         openForInvestment={openForInvestment}  stageId={stageId} marketId={marketId} investibleId={id}
                         needsAssist={needsAssist} groupId={groupId} marketPresences={marketPresences} />
      )}
      <div
        id={id}
        key={id}
        onContextMenu={recordPositionToggle}
        onMouseOver={() => doShowEdit(id)} onMouseOut={() => doRemoveEdit(id)}
        style={{margin: '0.5rem'}}
        onClick={(event) => {
          preventDefaultAndProp(event);
          getInvestibleOnClick(id, marketId, history);
        }}
      >
        <div draggable={allowDragDrop} onDragStart={onDragStart}>
          <Link href={formInvestibleLink(marketId, id)} color="inherit" style={{cursor: inArchives ? 'pointer' : 'grab'}}>
            <div className={classes.outlined}>
              <div style={{whiteSpace: 'nowrap', fontSize: '.75rem'}}>
                {viewIndicator}
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.35rem'}}>
                {TypeIconList.map((item, index) => {
                  const { assistanceType, typeExplanation, myMessage, myLink } = item;
                  return (<div
                  key={`${id}-icon-${index}`}
                  onClick={(event) => {
                    if (myMessage) {
                      preventDefaultAndProp(event);
                      dehighlightMessage(myMessage, messagesDispatch);
                      navigate(history, formInboxItemLink(myMessage));
                    } else if (myLink) {
                      preventDefaultAndProp(event);
                      navigate(history, myLink);
                    }
                  }}
                  onMouseOver={(event) => {
                    if (myMessage || myLink) {
                      preventDefaultAndProp(event);
                    }
                  }}
                >
                  <Tooltip title={intl.formatMessage({ id: typeExplanation })}>
                    <AssistanceBadge assistanceType={assistanceType} unread={!!myMessage} />
                  </Tooltip>
                </div>);
                })}
                {inAssist && (
                  <div>
                    <Typography style={{fontSize: '.75rem', paddingLeft: '0.5rem'}}>
                     <UsefulRelativeTime value={enteredStageAt}/>
                    </Typography>
                  </div>
                )}
                {inAssist && (
                  <div id={`showEdit0${id}`} style={{pointerEvents: 'none', visibility: 'hidden'}}>
                    <EditOutlinedIcon style={{maxHeight: '1.25rem'}} />
                  </div>
                )}
              </div>
              <p style={{paddingTop: '0.5rem', paddingBottom: '0.5rem', maxWidth: '16rem',  wordBreak: 'break-all'}}>
                {name}
              </p>
              {!isSingleUser && assignedNames.map((name) => (<Typography
                style={{fontStyle: 'italic', fontSize: '.75rem'}}
                key={name}>Assignee: {name}
              </Typography>))}
              {!_.isEmpty(inAssistanceComments) && (
                inAssistanceComments.map((comment) => {
                  const { body, id: commentId, group_id: groupId, comment_type: commentType } = comment;
                  return <BugListItem key={commentId} id={commentId} title={stripHTML(body)} useMinWidth={false} useMobileLayout smallFont
                                      useSelect={false} toolTipId='WizardJobAssistance' maxWidth='16rem' commentType={commentType}
                                      link={formCommentLink(marketId, groupId, id, commentId)} />;
                })
              )}
            </div>
          </Link>
        </div>
      </div>
      {!mobileLayout && (
        <DragImage id={id} name={name} />
      )}
    </React.Fragment>
  );
}

function ArchiveInvestbiles(props) {
  const {
    investibles = [],
    comments,
    marketId,
    presenceMap = {},
    allowDragDrop,
    viewGroupId,
    isAutonomous,
    isSingleUser
  } = props;
  const classes = myArchiveClasses();
  const unResolvedMarketComments = comments.filter(comment => !comment.resolved) || [];
  const [marketStagesState] = useContext(MarketStagesContext);
  const [messagesState] = useContext(NotificationsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [groupsState] = useContext(MarketGroupsContext);

  function getIcon(assistanceType, messages, isAssigned) {
    // Just go to the first message associated with this investible - further work questions do not have one
    const myMessage = !_.isEmpty(messages) ? messages[0] : undefined;
    let typeExplanation;
    switch (assistanceType) {
      case 0:
        typeExplanation = 'issuePresent';
        break;
      case 1:
        typeExplanation = isAssigned ? 'suggestPresent' : 'suggestPresentBacklog';
        break;
      case 2:
        typeExplanation = isAssigned ? 'questionPresent' : 'questionPresentBacklog';
        break;
      case 3:
        typeExplanation = 'readyToStartDisplay';
        break;
      default:
        typeExplanation = undefined;
    }
    if (myMessage) {
      typeExplanation = 'messagePresent';
    }
    // Color now encodes type, not urgency; the unread/message signal rides on
    // AssistanceBadge's dot + saturation (see ASSIST_VISUAL).
    return {assistanceType, typeExplanation, myMessage};
  }

  function getInvestibles() {
    const investibleData = investibles.map((inv) => {
      const aMarketInfo = getMarketInfo(inv, marketId);
      return { ...inv, enteredStageAt: new Date(aMarketInfo.last_stage_change_date) };
    });
    const sortedData = _.sortBy(investibleData, 'enteredStageAt', 'name').reverse();
    const marketPresences = Object.values(presenceMap);
    const viewGroupMembers = getGroupPresences(marketPresences, groupPresencesState, marketId, viewGroupId);
    const viewGroupMemberId = isAutonomous && !_.isEmpty(viewGroupMembers) ?
      viewGroupMembers[0].id : undefined;
    return sortedData.map((inv) => {
      const { investible } = inv;
      const { id, name } = investible;
      const messages = findMessagesForInvestibleId(id, messagesState);
      const info = getMarketInfo(inv, marketId) || {};
      const { assigned, stage: stageId, last_stage_change_date: lastStageChangeDate,
        open_for_investment: openForInvestment, group_id: groupId } = info;
      const isAssigned = !_.isEmpty(assigned);
      const enteredStageAt = new Date(lastStageChangeDate)
      const stage = getFullStage(marketStagesState, marketId, stageId);
      const usedAssignees = assigned || [];
      const groupMembers = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId) || [];
      const questionComments = (unResolvedMarketComments || []).filter((comment) => {
        return (comment.comment_type === QUESTION_TYPE) && (comment.investible_id === id) &&
          (usedAssignees.includes(comment.created_by)||isFurtherWorkStage(stage));
      });
      const suggestionComments = (unResolvedMarketComments || []).filter((comment) => {
        return (comment.comment_type === SUGGEST_CHANGE_TYPE) && (comment.investible_id === id) &&
          (usedAssignees.includes(comment.created_by)||isFurtherWorkStage(stage));
      });
      const blockedComments = (unResolvedMarketComments || []).filter((comment) => {
        return comment.comment_type === ISSUE_TYPE && comment.investible_id === id;
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
      const TypeIconList = [];
      if (isBlockedStage(stage)) {
        TypeIconList.push(getIcon(0, messages));
      }
      if (isRequiredInputStage(stage)) {
        if (!_.isEmpty(questionComments)) {
          const item = getIcon(2, messages, isAssigned);
          item.myLink = formCommentLink(marketId, groupId, id, questionComments[0].id);
          TypeIconList.push(item);
        }
        if (!_.isEmpty(suggestionComments)) {
          const item = getIcon(1, messages, isAssigned);
          item.myLink = formCommentLink(marketId, groupId, id, suggestionComments[0].id);
          TypeIconList.push(item);
        }
      }
      const isMember = !isAutonomous || !_.isEmpty(groupMembers.find((member) =>
        member.id === viewGroupMemberId))
      if (isFurtherWorkStage(stage)) {
        if (openForInvestment&&isMember) {
          TypeIconList.push(getIcon(3, messages));
        }
        if (!_.isEmpty(blockedComments)) {
          const item = getIcon(0);
          item.myLink = formCommentLink(marketId, groupId, id, blockedComments[0].id);
          TypeIconList.push(item);
        }
        if (!_.isEmpty(questionComments)) {
          const item = getIcon(2, undefined, isAssigned);
          const myMessage = messages.find((message) => message.market_type === DECISION_TYPE &&
            !_.isEmpty(questionComments.find((question) => message.comment_id === question.id)));
          if (myMessage) {
            item.myMessage = myMessage;
          } else {
            item.myLink = formCommentLink(marketId, groupId, id, questionComments[0].id);
          }
          TypeIconList.push(item);
        }
        if (!_.isEmpty(suggestionComments)) {
          const item = getIcon(1, undefined, isAssigned);
          const myMessage = messages.find((message) => message.market_type === INITIATIVE_TYPE &&
            !_.isEmpty(questionComments.find((suggestion) => message.comment_id === suggestion.id)));
          if (myMessage) {
            item.myMessage = myMessage;
          } else {
            item.myLink = formCommentLink(marketId, groupId, id, suggestionComments[0].id);
          }
          TypeIconList.push(item);
        }
      }
      const inAssistanceComments = blockedComments.concat(questionComments).concat(suggestionComments);
      const ticketNumber = getTicketNumber(groupId, marketId, groupsState, isAutonomous, groupId === viewGroupId);
      return <ArchiveInvestible key={id} name={name} id={id} stageId={stageId} marketId={marketId} isSingleUser={isSingleUser}
                                isBlocked={!_.isEmpty(blockedComments)} groupId={groupId} inAssistanceComments={inAssistanceComments}
                                needsAssist={!_.isEmpty(suggestionComments)||!_.isEmpty(questionComments)}
                                allowDragDrop={allowDragDrop&&isMember} onDragStart={onDragStart}
                                enteredStageAt={enteredStageAt} marketPresences={marketPresences}
                                TypeIconList={TypeIconList} assignedNames={assignedNames} assigned={assigned}
                                classes={classes} openForInvestment={openForInvestment} viewIndicator={ticketNumber} />;
    });
  }

  return (
    <Grid id="archiveGrid" key="archiveGrid" container className={classes.noPadding}>
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

export default ArchiveInvestbiles;
