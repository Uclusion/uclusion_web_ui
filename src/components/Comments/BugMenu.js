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
import { moveComments, reopenComment, updateComment } from '../../api/comments';
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
import { CheckCircleOutline } from '@material-ui/icons';
import Chip from '@material-ui/core/Chip';

const useStyles = makeStyles(() => ({
  paperMenu: {
    border: '0.5px solid grey',
  },
  listSubHeaderRoot: {
    lineHeight: '30px',
  },
  chipStyleRed: {
    padding: '4px',
    backgroundColor: '#E85757',
    marginRight: '0.5rem'
  },
  chipStyleYellow: {
    padding: '4px',
    backgroundColor: '#e6e969',
    marginRight: '0.5rem'
  },
  chipStyleBlue: {
    padding: '4px',
    backgroundColor: '#2F80ED',
    marginRight: '0.5rem'
  }
}));

function BugMenu(props) {
  const { anchorEl, recordPositionToggle, marketId, commentId, groupId, notificationType, mouseX, mouseY,
    activeInvestibles, isResolved = false } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();
  const isCritical = !isResolved && notificationType === RED_LEVEL;
  const isNormal = !isResolved && notificationType === YELLOW_LEVEL;
  const isMinor = !isResolved && notificationType === BLUE_LEVEL;

  function moveToComment(newNotificationType) {
    setOperationRunning(true);
    removeMessagesForCommentId(commentId, messagesState);
    const updateValues = { marketId, commentId, notificationType: newNotificationType };
    if (isResolved) {
      updateValues.resolved = false;
    }
    return updateComment(updateValues)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        return comment;
      }).finally(() => {
        setOperationRunning(false);
      });
  }

  function resolveBug() {
    setOperationRunning(true);
    removeMessagesForCommentId(commentId, messagesState);
    return updateComment({ marketId, commentId, resolved: true })
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        return comment;
      }).finally(() => {
        setOperationRunning(false);
      });
  }

  function moveToInvestible(investibleId) {
    const roots = [getComment(commentsState, marketId, commentId)];
    const marketComments = getMarketComments(commentsState, marketId, groupId);
    const movingComments = getCommentThreads(roots, marketComments);
    const moveRunner = isResolved
      ? reopenComment(marketId, commentId).then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
      })
      : Promise.resolve();
    return moveRunner.then(() => moveComments(marketId, investibleId, [commentId], undefined,
      [commentId], undefined)).then((movedComments) => {
      return onCommentsMove([commentId], messagesState, movingComments, investibleId,
        commentsDispatch, marketId, movedComments, messagesDispatch);
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
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><Chip color="primary" size='small' className={classes.chipStyleRed} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'moveTodoRed' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'immediate' })}
              </ListItemText>
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
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><Chip color="primary" size='small' className={classes.chipStyleYellow} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'moveTodoYellow' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'able' })}
              </ListItemText>
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
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><Chip color="primary" size='small' className={classes.chipStyleBlue} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'moveTodoBlue' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'convenient' })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
        {!isResolved && (
          <MenuItem key="resolveBugKey" id="resolveBugId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      return resolveBug().then(() => recordPositionToggle());
                    }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><CheckCircleOutline fontSize="small" /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'moveTodoResolved' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'resolvedBugsHeader' })}
              </ListItemText>
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
                        return moveToInvestible(investible.id);
                      }}
            >
              <ListItemText>
                <i>{investible.name.length > 25 ? `${investible.name.substring(0, 26)}...` : investible.name}</i>
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
