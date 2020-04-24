import React, { useContext } from 'react'
import { NotificationImportant, Notifications as NotificationsIcon } from '@material-ui/icons'
import { Fab, makeStyles, Tooltip } from '@material-ui/core'
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
    color: 'red',
    fontSize: 36,
  },
  yellow: {
    color: '#F29100',
    fontSize: 36,
  },
  uncolored: {
    fontSize: 36,
  },
  fab: {
    backgroundColor: '#ffffff',
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
      else if (pokeType === 'new_user') {
        fullLink = '/dialogAdd#type=PLANNING';
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

  function getIconClass() {
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
      className={classes.fab}
    >
      {current && (
        <Tooltip title={current.text}>
          <NotificationImportant className={getIconClass()} />
        </Tooltip>
      )}
      {!current && <NotificationsIcon className={getIconClass()} />}
    </Fab>
  );
}

export default Notifications;
