import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import NotificationImportantIcon from '@material-ui/icons/NotificationImportant';
import WarningIcon from '@material-ui/icons/Warning';
import HourglassFullIcon from '@material-ui/icons/HourglassFull';
import NotesIcon from '@material-ui/icons/Notes';
import { Fab, makeStyles } from '@material-ui/core';
import clsx from 'clsx';
import DisplayNotifications from './DisplayNotifications';
import { BLUE_LEVEL, RED_LEVEL, YELLOW_LEVEL } from '../../constants/notifications';

const useStyles = makeStyles(
  theme => {
    return {

      red: {
        backgroundColor: '#E85757',
        '&:hover': {
          backgroundColor: '#E85757',
        }
      },
      yellow: {
        backgroundColor: '#e6e969',
        '&:hover': {
          backgroundColor: '#e6e969',
        }
      },
      blue: {
        backgroundColor: '#2D9CDB',
        '&:hover': {
          backgroundColor: '#2D9CDB',
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
    };
  });

export function getFullLink (current) {
  return current.link;
}

function Notifications (props) {

  const {
    level,
    active,
    setActive,
    messages,
  } = props;

  const [open, setOpen] = useState(false);
  const [inside, setInside] = useState(false);
  const [pegLeft, setPegLeft] = useState(false);
  const [pegLeftTimer, setPegLeftTimer] = useState(undefined);
  const [anchorEl, setAnchorEl] = useState(null);
  const classes = useStyles();



  function getIcon () {
    switch(level) {
      case RED_LEVEL:
        return <WarningIcon className={classes.uncolored}/>
      case YELLOW_LEVEL:
        return <HourglassFullIcon className={classes.uncolored}/>
      case BLUE_LEVEL:
        return <NotesIcon className={classes.uncolored}/>
      default:
        return <NotificationImportantIcon className={classes.uncolored}/>
    }
  }

  function getBackgroundClass () {
    switch (level) {
      case RED_LEVEL:
        return classes.red;
      case YELLOW_LEVEL:
        return classes.yellow;
      case BLUE_LEVEL:
        return classes.blue;
      default:
        return classes.uncolored;
    }
  }

  function getTitleId () {
    switch(level) {
      case RED_LEVEL:
        return 'criticalTasks';
      case YELLOW_LEVEL:
        return 'urgentTasks';
      case BLUE_LEVEL:
        return 'informational';
      default:
        return 'notifications';
    }
  }

  function onEnter(event) {
    setAnchorEl(event.currentTarget);
    setActive(level);
    setOpen(true);
    setInside(true);
    if (pegLeftTimer) {
      clearTimeout(pegLeftTimer);
      setPegLeftTimer(undefined);
    }
    setPegLeft(false);
  }

  function onOut () {
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

  if (_.isEmpty(messages)) {
    return <React.Fragment/>;
  }

  const amOpenAndActive = open && (active === level);

  return (
    <div key={level} onMouseOut={onOut} onMouseOver={onEnter}>
      <Fab
        id={`notifications-fab${level}`}
        className={clsx(
          classes.fab,
          getBackgroundClass())}
      >
        {getIcon()}
      </Fab>
      <DisplayNotifications
        level={level}
        messages={messages}
        open={amOpenAndActive}
        setOpen={setOpen}
        anchorEl={anchorEl}
        titleId={getTitleId()}/>
    </div>
  );
}

Notifications.propTypes = {
  active: PropTypes.string,
  setActive: PropTypes.func,
  messages: PropTypes.arrayOf(PropTypes.object),
};

Notifications.defaultProps = {
  active: null,
  setActive: () => {},
  messages: [],
};

export default Notifications;
