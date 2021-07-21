import React, { useContext, useState } from 'react';
import _ from 'lodash';
import Notifications from './Notifications';
import { BLUE_LEVEL, RED_LEVEL, YELLOW_LEVEL } from '../../constants/notifications';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { levelMessages } from '../../contexts/NotificationsContext/notificationsContextHelper';
import { useMediaQuery, useTheme } from '@material-ui/core'

function NotificationsContainer () {
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeLevel, setActiveLevel] = useState(null);
  const [messagesState] = useContext(NotificationsContext);
  const redMessages = levelMessages(messagesState, RED_LEVEL);
  const yellowMessages = levelMessages(messagesState, YELLOW_LEVEL);
  const blueMessages = levelMessages(messagesState, BLUE_LEVEL);

  // on small windows we only have room for one, so drop blue and yellow if we have red
  const showYellowMessages = !_.isEmpty(yellowMessages);
  const showBlueMessages = !_.isEmpty(blueMessages) && (!mobileLayout || _.isEmpty(redMessages) || _.isEmpty(yellowMessages));
  return (
    <React.Fragment>
      {!_.isEmpty(redMessages) && (
          <Notifications
            id="redLevelNotification"
            level={RED_LEVEL}
            messages={redMessages}
            active={activeLevel}
            setActive={setActiveLevel}/>
      )}
      {showYellowMessages && (
          <Notifications
            id="yellowLevelNotification"
            level={YELLOW_LEVEL}
            messages={yellowMessages}
            active={activeLevel}
            setActive={setActiveLevel}/>
      )}
      {showBlueMessages && (
          <Notifications
            level={BLUE_LEVEL}
            messages={blueMessages}
            active={activeLevel}
            setActive={setActiveLevel}/>
      )}
    </React.Fragment>
  );
}

export default NotificationsContainer;