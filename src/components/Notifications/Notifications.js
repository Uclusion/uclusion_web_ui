import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types';
import _ from 'lodash';
import NotificationImportantIcon from '@material-ui/icons/NotificationImportant';
import WarningIcon from '@material-ui/icons/Warning';
import HourglassFullIcon from '@material-ui/icons/HourglassFull';
import NotesIcon from '@material-ui/icons/Notes';
import { Fab, makeStyles } from '@material-ui/core';
import DisplayNotifications from './DisplayNotifications';
import { BLUE_LEVEL, RED_LEVEL, YELLOW_LEVEL } from '../../constants/notifications';
import Badge from '@material-ui/core/Badge'
import { getUiPreferences } from '../../contexts/AccountUserContext/accountUserContextHelper'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import { updateUiPreferences } from '../../api/account'
import { accountUserRefresh } from '../../contexts/AccountUserContext/accountUserContextReducer'

const useStyles = makeStyles(
  theme => {
    return {

      red: {
        fontSize: 24,
        color: '#E85757',
      },
      yellow: {
        fontSize: 24,
        color: '#e6e969'
      },
      blue: {
        fontSize: 24,
        color: '#2D9CDB'
      },
      chip: {
        color: 'black',
        '& .MuiBadge-badge': {
          border: '0.5px solid grey',
          backgroundColor: '#fff',
        },
      },
      fab: {
        backgroundColor: '#fff',
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        minHeight: '48px',
        [theme.breakpoints.down('sm')]: {
          width: '36px',
          height: '36px',
          minHeight: '36px'
        },
      },
      bellButton: {
        marginLeft: '0.5em',
        marginRight: '0.5em',
        marginTop: '0.5rem'
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
    id
  } = props;

  const [lastReadWhenOpened, setLastReadWhenOpened] = useState(undefined);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userState, userDispatch] = useContext(AccountUserContext);
  const classes = useStyles();
  const userPreferences = getUiPreferences(userState) || {};
  const { levelInfo } = userPreferences;
  const levelInfoSafe = levelInfo || {};
  const { lastReadTime } = levelInfoSafe[level] || {};
  const lastRead = lastReadTime ? new Date(lastReadTime) : undefined;
  const newMessages = (messages || []).filter((item) => {
    const { updated_at: updatedAtTime } = item;
    const updatedAt = new Date(updatedAtTime);
    return lastRead === undefined || updatedAt > lastRead;
  }) || [];

  function storeLastReadForLevelInBackend() {
    const newLastRead = Date.now();
    const newPreferences = {
      ...userPreferences,
      levelInfo: { ...levelInfoSafe, [level]: { lastReadTime: newLastRead }}
    };
    return updateUiPreferences(newPreferences)
      .then((result) => {
        const { user } = result;
        userDispatch(accountUserRefresh(user));
      });
  }

  const recordPositionToggle = (event) => {
    if (anchorEl === null) {
      setAnchorEl(event.currentTarget);
      setLastReadWhenOpened(lastRead);
      setActive(level);
      return storeLastReadForLevelInBackend();
    } else {
      setAnchorEl(null);
      setLastReadWhenOpened(undefined);
      setActive(undefined);
    }
  };

  function getIcon () {
    switch(level) {
      case RED_LEVEL:
        return <WarningIcon className={classes.red}/>
      case YELLOW_LEVEL:
        return <HourglassFullIcon className={classes.yellow}/>
      case BLUE_LEVEL:
        return <NotesIcon className={classes.blue}/>
      default:
        return <NotificationImportantIcon />
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

  if (_.isEmpty(messages)) {
    return <React.Fragment/>;
  }

  return (
    <>
      <div id={id} key={level} onClick={recordPositionToggle} className={classes.bellButton}>
        <Badge badgeContent={newMessages.length} className={classes.chip} overlap="circle">
        <Fab id={`notifications-fab${level}`} className={classes.fab}>
          {getIcon()}
        </Fab>
        </Badge>
      </div>
      {anchorEl && (
        <DisplayNotifications
          level={level}
          messages={messages}
          open={active === level}
          lastRead={lastReadWhenOpened}
          setClosed={recordPositionToggle}
          anchorEl={anchorEl}
          titleId={getTitleId()}/>
      )}
    </>
  );
}

Notifications.propTypes = {
  active: PropTypes.string,
  id: PropTypes.string,
  setActive: PropTypes.func,
  messages: PropTypes.arrayOf(PropTypes.object),
};

Notifications.defaultProps = {
  active: null,
  id: '',
  setActive: () => {},
  messages: [],
};

export default Notifications;
