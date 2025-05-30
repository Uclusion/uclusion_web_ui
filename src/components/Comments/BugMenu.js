import React, { useContext } from 'react';
import { ListItemIcon, ListItemText, ListSubheader, makeStyles, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { useIntl } from 'react-intl';
import {
  formMarketAddInvestibleLink,
  navigate,
  preventDefaultAndProp
} from '../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { BLUE_LEVEL, RED_LEVEL, YELLOW_LEVEL } from '../../constants/notifications';
import { removeMessagesForCommentId } from '../../utils/messageUtils';
import { moveComments, updateComment } from '../../api/comments';
import {
  addCommentToMarket,
  getComment,
  getCommentThreads, getMarketComments
} from '../../contexts/CommentsContext/commentsContextHelper';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import AddIcon from '@material-ui/icons/Add';
import { useHistory } from 'react-router';
import { onCommentsMove } from '../../utils/commentFunctions';
import SearchIcon from '@material-ui/icons/Search';

const useStyles = makeStyles(() => ({
  paperMenu: {
    border: '0.5px solid grey',
  },
  listSubHeaderRoot: {
    lineHeight: '30px',
  }
}));

function BugMenu(props) {
  const { anchorEl, recordPositionToggle, marketId, commentId, groupId, notificationType, mouseX, mouseY,
    activeInvestibles } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();
  const isCritical = notificationType === RED_LEVEL;
  const isNormal = notificationType === YELLOW_LEVEL;
  const isMinor = notificationType === BLUE_LEVEL;

  function moveToComment(newNotificationType) {
    setOperationRunning(true);
    removeMessagesForCommentId(commentId, messagesState);
    return updateComment({marketId, commentId, notificationType: newNotificationType})
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        return comment;
      }).finally(() => {
        setOperationRunning(false);
      });
  }

  return (
      <Menu
        id="bug-menu"
        open
        onClose={recordPositionToggle}
        getContentAnchorEl={null}
        anchorReference="anchorPosition"
        anchorPosition={{ top: mouseY, left: mouseX }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        anchorEl={anchorEl}
        disableRestoreFocus
        classes={{ paper: classes.paperMenu }}
      >
        <ListSubheader classes={{root:classes.listSubHeaderRoot}}>Move to</ListSubheader>
        {!isCritical && (
          <MenuItem key="moveTodoRedKey" id="moveTodoRedId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      return moveToComment(RED_LEVEL).then(() => recordPositionToggle());
                    }}
          >
            <Tooltip placement='top' title={intl.formatMessage({ id: 'moveTodoRed' })}>
              <div>
                {intl.formatMessage({ id: 'immediate' })}
              </div>
            </Tooltip>
          </MenuItem>
        )}
        {!isNormal && (
          <MenuItem key="moveTodoYellowKey" id="moveTodoYellowId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      return moveToComment(YELLOW_LEVEL).then(() => recordPositionToggle());
                    }}
          >
            <Tooltip placement='top' title={intl.formatMessage({ id: 'moveTodoYellow' })}>
              <div>
                {intl.formatMessage({ id: 'able' })}
              </div>
            </Tooltip>
          </MenuItem>
        )}
        {!isMinor && (
          <MenuItem key="moveTodoBlueKey" id="moveTodoBlueId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      return moveToComment(BLUE_LEVEL).then(() => recordPositionToggle());
                    }}
          >
            <Tooltip placement='top' title={intl.formatMessage({ id: 'moveTodoBlue' })}>
              <div>
                {intl.formatMessage({ id: 'convenient' })}
              </div>
            </Tooltip>
          </MenuItem>
        )}
        <MenuItem key="newJobKey" id="newJobId"
                  onClick={(event) => {
                    preventDefaultAndProp(event);
                    recordPositionToggle();
                    return navigate(history, `${formMarketAddInvestibleLink(marketId, groupId)}&fromCommentId=${commentId}&isNewJob=true`);
                  }}
        >
          <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><AddIcon fontSize="small" /></ListItemIcon>
          <Tooltip placement='top' title={intl.formatMessage({ id: 'moveNewJob' })}>
            <ListItemText>
              {intl.formatMessage({ id: 'JobWizardNewJob' })}
            </ListItemText>
          </Tooltip>
        </MenuItem>
        {(activeInvestibles || []).map((fullInvestible) => {
          const { investible } = fullInvestible;
          return (
            <MenuItem key={`moveJob${investible.id}Key`} id={`moveJob${investible.id}Id`}
                      onClick={(event) => {
                        preventDefaultAndProp(event);
                        recordPositionToggle();
                        const roots = [getComment(commentsState, marketId, commentId)];
                        const marketComments = getMarketComments(commentsState, marketId, groupId);
                        const movingComments = getCommentThreads(roots, marketComments);
                        return moveComments(marketId, investible.id, [commentId], undefined,
                          [commentId], undefined).then((movedComments) => {
                          return onCommentsMove([commentId], messagesState, movingComments, investible.id,
                            commentsDispatch, marketId, movedComments, messagesDispatch);
                        })
                      }}
            >
              <ListItemText>
                {investible.name.length > 25 ? `${investible.name.substring(0, 26)}...` : investible.name}
              </ListItemText>
            </MenuItem>
          );
        })}
        <MenuItem key="jobOtherKey" id="jobOtherId"
                  onClick={(event) => {
                    preventDefaultAndProp(event);
                    recordPositionToggle();
                    return navigate(history, `${formMarketAddInvestibleLink(marketId, groupId)}&fromCommentId=${commentId}&isNewJob=false`);
                  }}
        >
          <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><SearchIcon fontSize="small" /></ListItemIcon>
          <Tooltip placement='top' title={intl.formatMessage({ id: 'otherJob' })}>
            <ListItemText>
              {intl.formatMessage({ id: 'otherJob' })}
            </ListItemText>
          </Tooltip>
        </MenuItem>
      </Menu>
  );
}

export default BugMenu;
