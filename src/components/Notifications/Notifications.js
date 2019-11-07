import React, { useContext } from 'react';
import { toast } from 'react-toastify';
import { NotificationImportant, Notifications as NotificationsIcon, ChevronRight } from '@material-ui/icons';
import { Button, makeStyles } from '@material-ui/core';
import { useHistory } from 'react-router';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions';

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
  const [messagesState] = useContext(NotificationsContext);
  const { messages } = messagesState;
  const history = useHistory();
  const classes = useStyles();
  const nextEnabled = messages.length > 0;

  function getIconClass() {
    const message = messages[0];
    const { level } = message;
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
    if (messages.length > 0) {
      const message = messages[0];
      const { marketId, investibleId, text } = message;
      const link = investibleId
        ? formInvestibleLink(marketId, investibleId)
        : formMarketLink(marketId);
      navigate(history, link);
      toast.info(text);
    }
  }

  return (
    <Button
      disabled={!nextEnabled}
      onClick={nextOnClick}
    >
      {nextEnabled && <NotificationImportant className={getIconClass()} />}
      {!nextEnabled && <NotificationsIcon />}
      {nextEnabled && <ChevronRight className={getIconClass()} />}
    </Button>
  );
}

export default Notifications;