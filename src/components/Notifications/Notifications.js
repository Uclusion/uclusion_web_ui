import React, { useContext, useEffect, useState } from 'react'
import { NotificationImportant, Notifications as NotificationsIcon } from '@material-ui/icons'
import { Fab, makeStyles } from '@material-ui/core'
import clsx from 'clsx'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { filterMessagesByMarket, nextMessage } from '../../contexts/NotificationsContext/notificationsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import DisplayNotifications from './DisplayNotifications'

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
  return current.link;
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const [inside, setInside] = useState(false);
  const [pegLeft, setPegLeft] = useState(false);
  const [pegLeftTimer, setPegLeftTimer] = useState(undefined);
  const [messagesState] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const filteredMessagesState = filterMessagesByMarket(messagesState, marketsState);
  const current = nextMessage(filteredMessagesState || {});
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

  function onEnter() {
    setOpen(true);
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
      setOpen(false);
    }
    return () => {};
  }, [inside, pegLeft]);

  return (
    <div onMouseOut={onOut} onMouseOver={onEnter}>
      <Fab
        id="notifications-fab"
        className={clsx(
          classes.fab,
          getBackgroundClass())}
      >
        {current && (
            <NotificationImportant className={classes.uncolored} />
        )}
        {!current && <NotificationsIcon className={classes.uncolored} />}
      </Fab>
      <DisplayNotifications open={open} setOpen={setOpen} />
    </div>
  );
}

export default Notifications;
