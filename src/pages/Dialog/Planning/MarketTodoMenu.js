import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import { List, ListItem, ListItemText, Menu } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles';
import { useIntl } from 'react-intl';
import { resolveComment, updateComment } from '../../../api/comments';
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { doRemoveEdit } from './userUtils'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import {
  removeMessagesForCommentId
} from '../../../utils/messageUtils';
import { formCommentEditReplyLink, formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { workListStyles } from '../../Home/YourWork/WorkListItem';
import { pushMessage } from '../../../utils/MessageBusUtils';
import {
  DEHIGHLIGHT_EVENT,
  MODIFY_NOTIFICATIONS_CHANNEL
} from '../../../contexts/NotificationsContext/notificationsContextMessages';
import _ from 'lodash';

const useStyles = makeStyles((theme) => {
  return {
    popper: {
      zIndex: 1500
    },
    scrollableList: {
      height: '230px',
      overflowY: 'auto',
      border: '1px solid #cfcfcf',
      backgroundColor: 'white',
      borderRadius: 8,
      [theme.breakpoints.down('sm')]: {
        marginRight: 0,
        maxWidth: 300,
      },
    },
    avatarName: {
      fontSize: '15px',
      overflowWrap: 'break-word',
      cursor: 'pointer'
    }
  };
});

function MarketTodoMenu(props) {
  const { comment, editViewFunc, openIdFunc, anchorEl, messages } = props;
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const workItemClasses = workListStyles();
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [messagesState] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const { market_id: marketId, id: commentId, notification_type: myNotificationType, group_id: groupId } = comment;

  function doView() {
    if (!_.isEmpty(messages)) {
      pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event: DEHIGHLIGHT_EVENT,
        messages: messages.map((message) => message.type_object_id) });
    }
    editViewFunc(comment);
    openIdFunc(undefined);
    doRemoveEdit(commentId);
  }

  function moveTodo(notificationType) {
    setOperationRunning(true);
    openIdFunc(undefined);
    removeMessagesForCommentId(commentId, messagesState);
    return updateComment(marketId, commentId, undefined, undefined, undefined,
      undefined, notificationType)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        setOperationRunning(false);
      }).finally(() => {
      setOperationRunning(false);
    });
  }

  function resolve() {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        removeMessagesForCommentId(commentId, messagesState, workItemClasses.removed);
        setOperationRunning(false);
      });
  }

  function setClosed() {
    openIdFunc(undefined);
  }

  return (
    <Menu
      id="todo-menu"
      open={true}
      onClose={setClosed}
      getContentAnchorEl={null}
      placement="right"
      anchorEl={anchorEl}
      disableRestoreFocus
      className={classes.popper}
    >
      <List
        dense
        className={classes.scrollableList}
      >
        <ListItem button onClick={doView}>
          <ListItemText primary={intl.formatMessage({ id: 'viewTodo' })} />
        </ListItem>
        <ListItem button onClick={() => navigate(history, formCommentEditReplyLink(marketId, commentId, false),
          false, true)}>
          <ListItemText primary={intl.formatMessage({ id: 'editTodo' })} />
        </ListItem>
        <ListItem button onClick={() => navigate(history,
          `${formMarketAddInvestibleLink(marketId, groupId)}&fromCommentId=${commentId}`)}>
          <ListItemText primary={intl.formatMessage({ id: 'storyFromComment' })} />
        </ListItem>
        <ListItem button onClick={resolve}>
          <ListItemText primary={intl.formatMessage({ id: 'issueResolveLabel' })} />
        </ListItem>
        {myNotificationType !== 'RED' && (
          <ListItem onClick={() => moveTodo('RED')} button >
            <ListItemText primary={intl.formatMessage({ id: 'moveTodoRed' })} />
          </ListItem>
        )}
        {myNotificationType !== 'YELLOW' && (
          <ListItem onClick={() => moveTodo('YELLOW')} button >
            <ListItemText primary={intl.formatMessage({ id: 'moveTodoYellow' })} />
          </ListItem>
        )}
        {myNotificationType !== 'BLUE' && (
          <ListItem onClick={() => moveTodo('BLUE')} button >
            <ListItemText primary={intl.formatMessage({ id: 'moveTodoBlue' })} />
          </ListItem>
        )}
      </List>
    </Menu>
  );
}

MarketTodoMenu.propTypes = {
  comment: PropTypes.object.isRequired,
  editViewFunc: PropTypes.func.isRequired,
  openIdFunc: PropTypes.func.isRequired,
  anchorEl: PropTypes.element.isRequired,
};

export default MarketTodoMenu;