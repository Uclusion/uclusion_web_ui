import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types';
import { List, ListItem, ListItemText, ListSubheader, Popper } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles';
import { useIntl } from 'react-intl';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import GravatarAndName from '../../../components/Avatars/GravatarAndName'
import { updateComment } from '../../../api/comments'
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { onDropTodo } from './userUtils'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'

const useStyles = makeStyles((theme) => {
  return {
    popper: {
      zIndex: 1500,
      marginTop: '1rem'
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
      fontWeight: 'bold',
      overflowWrap: 'break-word',
      cursor: 'pointer'
    }
  };
});

function MarketTodoMenu(props) {
  const { comment, editViewFunc, openIdFunc, anchorEl } = props;
  const intl = useIntl();
  const classes = useStyles();
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { market_id: marketId, id: commentId, notification_type: myNotificationType } = comment;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const assignablePresences = marketPresences.filter((presence) => !presence.market_banned && presence.following
    && !presence.market_guest) || [];

  const [inside, setInside] = useState(false);
  const [pegLeft, setPegLeft] = useState(false);
  const [pegLeftTimer, setPegLeftTimer] = useState(undefined);

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
  }

  function moveTodo(notificationType) {
    setOperationRunning(true);
    updateComment(marketId, commentId, undefined, undefined, undefined, undefined,
      notificationType)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        setOperationRunning(false);
      }).finally(() => {
      openIdFunc(undefined);
      setOperationRunning(false);
    });
  }

  function onEnter() {
    setInside(true);
    if (pegLeftTimer) {
      clearTimeout(pegLeftTimer);
      setPegLeftTimer(undefined);
    }
    setPegLeft(false);
  }

  function onOut() {
    if (!pegLeft) {
      setInside(false);
      setPegLeftTimer(setTimeout(() => {
        setPegLeft(true);
      }, 1000));
    }
  }

  useEffect(() => {
    if (pegLeft && !inside) {
      setPegLeft(false);
      openIdFunc(undefined);
    }
    return () => {};
  }, [inside, openIdFunc, pegLeft]);

  return (
    <Popper
      open={true}
      id="todo-menu"
      anchorEl={anchorEl}
      placement="top"
      className={classes.popper}
    >
      <List
        onMouseOut={onOut} onMouseOver={onEnter}
        dense
        className={classes.scrollableList}
      >
        <ListItem button onClick={doEdit}>
          <ListItemText primary={intl.formatMessage({ id: 'editTodo' })} />
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
        <ListSubheader>
          {intl.formatMessage({ id: 'todoAddressListHeader' })}
        </ListSubheader>
        {assignablePresences.map((entry) => renderAssignedEntry(entry))}
      </List>
    </Popper>
  );
}

MarketTodoMenu.propTypes = {
  comment: PropTypes.object.isRequired,
  editViewFunc: PropTypes.func.isRequired,
  openIdFunc: PropTypes.func.isRequired,
  anchorEl: PropTypes.element.isRequired,
};

export default MarketTodoMenu;