import React, { useContext, useState } from 'react';
import _ from 'lodash';
import Notifications from './Notifications';
import { BLUE_LEVEL, RED_LEVEL, YELLOW_LEVEL } from '../../constants/notifications';
import { makeStyles } from '@material-ui/core/styles';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { levelMessages } from '../../contexts/NotificationsContext/notificationsContextHelper';

const useStyles = makeStyles((theme) => {
  return {
    bellButton: {
      marginLeft: '0.25em',
      marginRight: '0.25em',
    }
  };
});

function NotificationsContainer (props) {

  const classes = useStyles();
  const [activeLevel, setActiveLevel] = useState(null);
  const [messagesState] = useContext(NotificationsContext);
  const redMessages = levelMessages(messagesState, RED_LEVEL);
  const yellowMessages = levelMessages(messagesState, YELLOW_LEVEL);
  const blueMessages = levelMessages(messagesState, BLUE_LEVEL);

  return (
    <React.Fragment>
      {!_.isEmpty(redMessages) && (
        <div className={classes.bellButton}>
          <Notifications
            level={RED_LEVEL}
            messages={redMessages}
            active={activeLevel}
            setActive={setActiveLevel}/>
        </div>)}
      {!_.isEmpty(yellowMessages) && (
        <div className={classes.bellButton}>
          <Notifications
            level={YELLOW_LEVEL}
            messages={yellowMessages}
            active={activeLevel}
            setActive={setActiveLevel}/>
        </div>)}
      {!_.isEmpty(blueMessages) && (
        <div className={classes.bellButton}>
          <Notifications
            level={BLUE_LEVEL}
            messages={blueMessages}
            active={activeLevel}
            setActive={setActiveLevel}/>
        </div>)}
    </React.Fragment>
  );
}

export default NotificationsContainer;