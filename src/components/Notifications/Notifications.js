import React, { useContext, useEffect, useState } from 'react'
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
import { filterMessagesByMarket, nextMessage } from '../../contexts/NotificationsContext/notificationsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import DisplayNotifications from './DisplayNotifications'
import { useIntl } from 'react-intl'
import { refreshRecent } from '../../contexts/NotificationsContext/notificationsContextReducer'

const useStyles = makeStyles(
  theme => {
    return {red: {
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
      fontSize: 24,
      color: '#fff'
    },
    fab: {
      borderRadius: '50%',
      width: '48px',
      height: '48px',
      boxShadow: 'none',
      minHeight: '48px',
      [theme.breakpoints.down('sm')]: {
        width: '36px',
        height: '36px',
        minHeight: '36px'
      },
    }
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

function Notifications() {
  const [open, setOpen] = useState(false);
  const [inside, setInside] = useState(false);
  const [pegLeft, setPegLeft] = useState(false);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const filteredMessagesState = filterMessagesByMarket(messagesState, marketsState);
  const current = nextMessage(filteredMessagesState || {});
  const history = useHistory();
  const intl = useIntl();
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

  function onHover() {
    if (!open) {
      messagesDispatch(refreshRecent());
    }
  }

  function onEnter() {
    setOpen(true);
    setInside(true);
    setPegLeft(false);
  }

  function onOut() {
    if (inside) {
      setInside(false);
      setTimeout(() => {
        setPegLeft(true);
      }, 4000);
    }
  }

  function onSingleClick() {
    if (current) {
      navigate(history, getFullLink(current));
    }
  }

  useEffect(() => {
    if (pegLeft && !inside) {
      setPegLeft(false);
      setOpen(false);
    }
    return () => {};
  }, [inside, pegLeft]);

  return (
    <div onMouseOut={onOut} onMouseOver={onEnter}>
      <Fab
        id="notifications-fab"
        onClick={onSingleClick}
        onMouseOver={onHover}
        className={clsx(
          classes.fab,
          getBackgroundClass())}
      >
        {current && (
          <Tooltip title={intl.formatMessage({ id: 'notificationsHelp' }, { x: current.text })}>
            <NotificationImportant className={classes.uncolored} />
          </Tooltip>
        )}
        {!current && <NotificationsIcon className={classes.uncolored} />}
      </Fab>
      <DisplayNotifications open={open} setOpen={setOpen} />
    </div>
  );
}

export default Notifications;
