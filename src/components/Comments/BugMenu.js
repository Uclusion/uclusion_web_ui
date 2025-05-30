import React, { useContext } from 'react';
import { ListSubheader, makeStyles, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { BLUE_LEVEL, RED_LEVEL, YELLOW_LEVEL } from '../../constants/notifications';
import { removeMessagesForCommentId } from '../../utils/messageUtils';
import { updateComment } from '../../api/comments';
import { addCommentToMarket } from '../../contexts/CommentsContext/commentsContextHelper';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';

const useStyles = makeStyles(() => ({
  paperMenu: {
    border: '0.5px solid grey',
  },
  listSubHeaderRoot: {
    lineHeight: '30px',
  }
}));

function BugMenu(props) {
  const { anchorEl, recordPositionToggle, marketId, commentId, notificationType, mouseX, mouseY } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [messagesState] = useContext(NotificationsContext);
  const classes = useStyles();
  const intl = useIntl();
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
      </Menu>
  );
}

export default BugMenu;
