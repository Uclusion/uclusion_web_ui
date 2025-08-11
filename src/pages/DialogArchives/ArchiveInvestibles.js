import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid, Tooltip, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import _ from 'lodash';
import RaisedCard from '../../components/Cards/RaisedCard';
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
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';
import {
  getFullStage,
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

function getInvestibleOnClick(id, marketId, history) {
  const link = formInvestibleLink(marketId, id);
  navigate(history, link);
}

const myArchiveClasses = makeStyles(
  theme => {
    return {
      outlined: {
        border: `1px solid ${theme.palette.grey["400"]}`,
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
    classes, openForInvestment, viewIndicator='', isBlocked, needsAssist, groupId, marketPresences, isSingleUser } = props;
  const [, messagesDispatch] = useContext(NotificationsContext);
  const intl = useIntl();
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);
  const recordPositionToggle = (event) => {
    if (anchorEl === null) {
      preventDefaultAndProp(event);
      setAnchorEl(event.currentTarget);
    } else {
      setAnchorEl(null);
    }
  };
  return (
    <React.Fragment key={`frag${id}`}>
      {anchorEl && (
        <PlanningJobMenu anchorEl={anchorEl} recordPositionToggle={recordPositionToggle} isBlocked={isBlocked}
                         openForInvestment={openForInvestment}  stageId={stageId} marketId={marketId} investibleId={id}
                         needsAssist={needsAssist} groupId={groupId} marketPresences={marketPresences} />
      )}
      <div
        id={id}
        key={id}
        onContextMenu={recordPositionToggle}
        onMouseOver={() => doShowEdit(id)} onMouseOut={() => doRemoveEdit(id)}
        onClick={(event) => {
          preventDefaultAndProp(event);
          getInvestibleOnClick(id, marketId, history);
        }}
      >
        <RaisedCard draggable={allowDragDrop} onDragStart={onDragStart}>
          <Link href={formInvestibleLink(marketId, id)} color="inherit" style={{cursor: 'grab'}}>
            <div className={classes.outlined}>
              <div>
                <Typography style={{fontSize: '.75rem'}}>
                  Entered <UsefulRelativeTime value={enteredStageAt}/>
                </Typography>
              </div>
              <div style={{display: 'flex', alignItems: 'center'}}>
                {TypeIconList.map((item) => {
                  const { TypeIcon, typeExplanation, myMessage, myLink } = item;
                  return (<div
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
                    {TypeIcon}
                  </Tooltip>
                </div>);
                })}
                {viewIndicator && (
                  <div style={{marginLeft: '0.5rem'}}>
                    {viewIndicator}
                  </div>
                )}
                <div id={`showEdit0${id}`} style={{pointerEvents: 'none', visibility: 'hidden'}}>
                  <EditOutlinedIcon style={{maxHeight: '1.25rem'}} />
                </div>
              </div>
              <p style={{paddingTop: '0.5rem', maxWidth: '16rem',  wordBreak: 'break-all'}}>
                {name}
              </p>
              {!isSingleUser && assignedNames.map((name) => (<Typography
                style={{fontStyle: 'italic', fontSize: '.75rem'}}
                key={name}>Assignee: {name}
              </Typography>))}
              {!_.isEmpty(inAssistanceComments) && (
                inAssistanceComments.map((comment) => {
                  const { body, id: commentId, group_id: groupId } = comment;
                  return <BugListItem id={commentId} title={stripHTML(body)} useMinWidth={false} useMobileLayout smallFont
                                      useSelect={false} toolTipId='WizardJobAssistance' maxWidth='16rem'
                                      link={formCommentLink(marketId, groupId, id, commentId)} />;
                })
              )}
            </div>
          </Link>
        </RaisedCard>
      </div>
      {!mobileLayout && (
        <DragImage id={id} name={name} />
      )}
    </React.Fragment>
  );
}

function ArchiveInvestbiles(props) {
  const {
    investibles,
    comments,
    marketId,
    presenceMap,
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
    let TypeIcon;
    let typeExplanation;
    switch (assistanceType) {
      case 0:
        TypeIcon = myMessage ? <Block htmlColor='#E85757' /> : <Block htmlColor='#F29100' />;
        typeExplanation = 'issuePresent';
        break;
      case 1:
        TypeIcon = myMessage ? <LightbulbOutlined htmlColor='#E85757' /> : <LightbulbOutlined htmlColor='#F29100' />;
        typeExplanation = isAssigned ? 'suggestPresent' : 'suggestPresentBacklog';
        break;
      case 2:
        TypeIcon = myMessage ? <QuestionIcon htmlColor='#E85757' /> : <QuestionIcon htmlColor='#F29100' />;
        typeExplanation = isAssigned ? 'questionPresent' : 'questionPresentBacklog';
        break;
      case 3:
        TypeIcon = myMessage ? <PersonSearch htmlColor='#E85757' /> : <PersonSearch htmlColor='#F29100' />;
        typeExplanation = 'readyToStartDisplay';
        break;
      default:
        TypeIcon = undefined;
        typeExplanation = undefined;
    }
    if (myMessage) {
      typeExplanation = 'messagePresent';
    }
    return {TypeIcon, typeExplanation, myMessage};
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
        return (comment.comment_type === ISSUE_TYPE) && (comment.investible_id === id) &&
          (usedAssignees.includes(comment.created_by)||isFurtherWorkStage(stage));
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
      return <ArchiveInvestible name={name} id={id} stageId={stageId} marketId={marketId} isSingleUser={isSingleUser}
                                isBlocked={!_.isEmpty(blockedComments)} groupId={groupId} inAssistanceComments={inAssistanceComments}
                                needsAssist={!_.isEmpty(suggestionComments)||!_.isEmpty(questionComments)}
                                allowDragDrop={allowDragDrop&&isMember} onDragStart={onDragStart}
                                enteredStageAt={enteredStageAt} marketPresences={marketPresences}
                                TypeIconList={TypeIconList} assignedNames={assignedNames}
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

ArchiveInvestbiles.defaultProps = {
  investibles: [],
  presenceMap: {}
};

export default ArchiveInvestbiles;
