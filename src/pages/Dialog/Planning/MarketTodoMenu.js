import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import { List, ListItem, ListItemText, ListSubheader, Popper, Typography } from '@material-ui/core'
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
    },
    menuName: {
      fontSize: '15px',
      fontWeight: 'bold',
      paddingLeft: '1rem',
      paddingRight: '1rem',
      cursor: 'pointer',
    },
    menu: {
      "&:hover": {
        border: '1px solid',
        width: '100%'
      },
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

  function renderAssignedEntry(presence) {
    const { name, email, id } = presence;

    return (
      <ListItem key={`assignTodo${id}`} className={classes.menu}
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

  return (
    <Popper
      open={true}
      id="todo-menu"
      anchorEl={anchorEl}
      placement="top"
      className={classes.popper}
    >
      <List
        dense
        className={classes.scrollableList}
      >
        <ListItemText onClick={doEdit} className={classes.menu}>
          <Typography variant="caption" className={classes.menuName}>
            {intl.formatMessage({ id: 'editTodo' })}
          </Typography>
        </ListItemText>
        {myNotificationType !== 'RED' && (
          <ListItemText onClick={() => moveTodo('RED')} className={classes.menu}>
            <Typography variant="caption" className={classes.menuName}>
              {intl.formatMessage({ id: 'moveTodoRed' })}
            </Typography>
          </ListItemText>
        )}
        {myNotificationType !== 'YELLOW' && (
          <ListItemText onClick={() => moveTodo('YELLOW')} className={classes.menu}>
            <Typography variant="caption" className={classes.menuName}>
              {intl.formatMessage({ id: 'moveTodoYellow' })}
            </Typography>
          </ListItemText>
        )}
        {myNotificationType !== 'BLUE' && (
          <ListItemText onClick={() => moveTodo('BLUE')} className={classes.menu}>
            <Typography variant="caption" className={classes.menuName}>
              {intl.formatMessage({ id: 'moveTodoBlue' })}
            </Typography>
          </ListItemText>
        )}
        <ListSubheader>
          {intl.formatMessage({ id: 'todoAddressListHeader' })}
        </ListSubheader>
        {marketPresences.map((entry) => renderAssignedEntry(entry))}
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