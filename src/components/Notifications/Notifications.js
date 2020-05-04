import React, { useContext } from 'react'
import { NotificationImportant, Notifications as NotificationsIcon } from '@material-ui/icons'
import { Fab, makeStyles, Tooltip } from '@material-ui/core'
import clsx from 'clsx'
import { useHistory } from 'react-router'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import {
  ISSUE_RESOLVED_TYPE,
  ISSUE_TYPE,
  NEW_VOTES_TYPE,
  NO_PIPELINE_TYPE,
  USER_POKED_TYPE
} from '../../constants/notifications'
import { nextMessage } from '../../contexts/NotificationsContext/notificationsContextHelper'

const useStyles = makeStyles({
  red: {
    backgroundColor: 'red',
    '&:hover': {
      backgroundColor: 'red',
    }
  },
  yellow: {
    backgroundColor: '#F29100',
    '&:hover': {
      backgroundColor: '#F29100',
    }
  },
  uncolored: {
    fontSize: 28,
    color: '#fff'
  },
  fab: {
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    boxShadow: 'none',
    minHeight: '48px'
  }
});

export function getFullLink(current) {
  const {
    marketId,
    investibleId,
    userId,
    aType,
    commentId,
    associatedUserId,
    pokeType,
  } = current;
  const link = investibleId
    ? formInvestibleLink(marketId, investibleId)
    : formMarketLink(marketId);
  let fullLink;
  switch (aType) {
    case ISSUE_RESOLVED_TYPE:
    case ISSUE_TYPE:
      fullLink = `${link}#c${commentId}`;
      break;
    case NO_PIPELINE_TYPE:
      fullLink = `${link}#u${userId}`;
      break;
    case NEW_VOTES_TYPE:
      fullLink = `${link}#cv${associatedUserId}`;
      break;
    case USER_POKED_TYPE:
      if (pokeType === 'slack_reminder') {
        fullLink = '/notificationPreferences';
      }
      else if (pokeType === 'upgrade_reminder') {
        fullLink = '/upgrade';
      }
      break;
    default:
      fullLink = link;
      break;
  }
  return fullLink;
}

function Notifications(props) {
  const [messagesState] = useContext(NotificationsContext);
  const current = nextMessage(messagesState || {});
  const history = useHistory();
  const classes = useStyles();

  function getBackgroundClass() {
    if (!current) {
      return classes.uncolored;
    }
    const { level } = current;
    switch (level) {
      case 'RED':
        return classes.red;
      case 'YELLOW':
        return classes.yellow;
      default:
        return classes.uncolored;
    }
  }

  function nextOnClick() {
    if (current) {
      navigate(history, getFullLink(current));
    }
  }

  return (
    <Fab
      disabled={!current}
      onClick={nextOnClick}
      className={clsx(
        classes.fab,
        getBackgroundClass())}
    >
      {current && (
        <Tooltip title={current.text}>
          <NotificationImportant className={classes.uncolored} />
        </Tooltip>
      )}
      {!current && <NotificationsIcon className={classes.uncolored} />}
    </Fab>
  );
}

export default Notifications;
