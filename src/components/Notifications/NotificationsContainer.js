import React, { useContext, useState } from 'react';
import _ from 'lodash';
import Notifications from './Notifications';
import { BLUE_LEVEL, RED_LEVEL, YELLOW_LEVEL } from '../../constants/notifications';
import { makeStyles } from '@material-ui/core/styles';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { levelMessages } from '../../contexts/NotificationsContext/notificationsContextHelper';
import { isTinyWindow } from '../../utils/windowUtils';

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

  // on small windows we only have room for one, so drop blue and yellow if we have red
  const showYellowMessages = !_.isEmpty(yellowMessages) && (!isTinyWindow() || _.isEmpty(redMessages));
  const showBlueMessages = !_.isEmpty(blueMessages) && (!isTinyWindow() || _.isEmpty(redMessages) || _.isEmpty(yellowMessages));
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
      {showYellowMessages && (
        <div className={classes.bellButton}>
          <Notifications
            level={YELLOW_LEVEL}
            messages={yellowMessages}
            active={activeLevel}
            setActive={setActiveLevel}/>
        </div>)}
      {showBlueMessages && (
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