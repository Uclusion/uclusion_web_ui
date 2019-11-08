import React, { useContext } from 'react';
import { toast } from 'react-toastify';
import { NotificationImportant, Notifications as NotificationsIcon, ChevronRight } from '@material-ui/icons';
import { Button, makeStyles } from '@material-ui/core';
import { useHistory } from 'react-router';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { nextMessage } from '../../contexts/NotificationsContext/notificationsContextReducer';

const useStyles = makeStyles({
  red: {
    color: 'red',
  },
  yellow: {
    color: 'orange', // to do change this to yellow if possible
  },
  uncolored: {},
});

function Notifications(props) {
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const { current } = messagesState;
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
      const { marketId, investibleId, text } = current;
      const link = investibleId
        ? formInvestibleLink(marketId, investibleId)
        : formMarketLink(marketId);
      navigate(history, link);
      toast.info(text);
      messagesDispatch(nextMessage());
    }
  }

  return (
    <Button
      disabled={!current}
      onClick={nextOnClick}
    >
      {current && <NotificationImportant className={getIconClass()} />}
      {!current && <NotificationsIcon />}
      {current && <ChevronRight className={getIconClass()} />}
    </Button>
  );
}

export default Notifications;