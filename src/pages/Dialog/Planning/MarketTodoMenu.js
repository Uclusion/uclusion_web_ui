import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import _ from 'lodash';
import { List, ListItem, ListItemText, ListSubheader, Menu } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles';
import { useIntl } from 'react-intl';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import GravatarAndName from '../../../components/Avatars/GravatarAndName'
import { updateComment } from '../../../api/comments'
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { doRemoveEdit, onDropTodo } from './userUtils'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { deleteOrDehilightMessages } from '../../../api/users'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { removeMessagesForCommentId } from '../../../utils/messageUtils'
import { notifyImmediate } from '../../../utils/commentFunctions'
import { RED_LEVEL } from '../../../constants/notifications'
import { workListStyles } from '../../Home/YourWork/WorkListItem'

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
  const { comment, editViewFunc, openIdFunc, anchorEl, messages, market } = props;
  const intl = useIntl();
  const classes = useStyles();
  const workItemClasses = workListStyles();
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { market_id: marketId, id: commentId, notification_type: myNotificationType } = comment;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const assignablePresences = marketPresences.filter((presence) => !presence.market_banned && presence.following
    && !presence.market_guest) || [];

  function renderAssignedEntry(presence) {
    const { name, email, id } = presence;

    return (
      <ListItem key={`assignTodo${id}`} button
                onClick={() => onDropTodo(commentId, commentState, marketId, setOperationRunning, intl,
                  commentDispatch, invDispatch, id)}>
        <GravatarAndName
          key={id}
          email={email}
          name={name}
          typographyVariant="caption"
          typographyClassName={classes.avatarName}
        />
      </ListItem>
    );
  }

  function doEdit() {
    editViewFunc(comment);
    openIdFunc(undefined);
    doRemoveEdit(commentId);
  }

  function doMarkRead() {
    setOperationRunning(true);
    openIdFunc(undefined);
    return deleteOrDehilightMessages(messages, messagesDispatch, workItemClasses.removed)
      .then(() => setOperationRunning(false))
      .finally(() => {
        doRemoveEdit(commentId);
        setOperationRunning(false);
    });
  }

  function moveTodo(notificationType) {
    setOperationRunning(true);
    openIdFunc(undefined);
    removeMessagesForCommentId(commentId, messagesState, messagesDispatch);
    return updateComment(marketId, commentId, undefined, undefined, undefined,
      undefined, notificationType)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        if (notificationType === RED_LEVEL) {
          notifyImmediate(myPresence.id, comment, market, messagesDispatch);
        }
        setOperationRunning(false);
      }).finally(() => {
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
        <ListItem button onClick={doEdit}>
          <ListItemText primary={intl.formatMessage({ id: 'editTodo' })} />
        </ListItem>
        {!_.isEmpty(messages) && (
          <ListItem button onClick={doMarkRead}>
            <ListItemText primary={intl.formatMessage({ id: 'markRead' })} />
          </ListItem>
        )}
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
        <ListSubheader>
          {intl.formatMessage({ id: 'todoAddressListHeader' })}
        </ListSubheader>
        {assignablePresences.map((entry) => renderAssignedEntry(entry))}
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