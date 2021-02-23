import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Link } from '@material-ui/core';
import { navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import Typography from '@material-ui/core/Typography';
import { BLUE_LEVEL, RED_LEVEL, UNREAD_TYPE, YELLOW_LEVEL } from '../../constants/notifications'
import Chip from '@material-ui/core/Chip';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import SpinningTooltipIconButton from '../SpinBlocking/SpinningTooltipIconButton';
import { deleteOrDehilightMessages, deleteSingleMessage } from '../../api/users'
import { removeMessage } from '../../contexts/NotificationsContext/notificationsContextReducer';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';

function NotificationMessageDisplay (props) {
  const {
    message,
    onLinkClick
  } = props;
  const {
    link, level, name, text, lenDuplicates, dismissMessages,
    investible_name: investibleName,
    market_name: marketName,
    market_id: marketId,
    type
  } = message;
  const dismissable = (type && type.startsWith(UNREAD_TYPE))||(marketId && marketId.startsWith('slack'));
  const history = useHistory();
  const color = level === RED_LEVEL ? '#ff9b9b' : level === YELLOW_LEVEL ? '#e8e9a9' : '#85bddb';
  const fontColor = level === RED_LEVEL ? 'black' : level === YELLOW_LEVEL ? 'black' : 'white';
  const containerName = investibleName || marketName;
  const [, messagesDispatch] = useContext(NotificationsContext);

  function handleDismiss () {
    if (!_.isEmpty(dismissMessages)) {
      return deleteOrDehilightMessages(dismissMessages, messagesDispatch);
    }
    return deleteSingleMessage(message)
      .then(() => messagesDispatch(removeMessage(message)));
  }

  return (
    <>
      <Link href={link} style={{ width: '100%' }} onClick={
        (event) => {
          event.stopPropagation();
          event.preventDefault();
          navigate(history, link);
          onLinkClick();
        }
      }>
        <>
          {name !== containerName && name !== text && (
            <div style={{borderRadius: '3px', border: '2px solid black'}}>
              <Typography style={{ backgroundColor: color, color: fontColor, paddingLeft: '0.5rem'}}>
                {name}
                {lenDuplicates && (
                  <Chip component="span" label={`${lenDuplicates}`} color="primary" size='small'
                        style={{ marginLeft: '0.5rem', marginRight: '0.25rem' }}/>
                )}
              </Typography>
              <Typography style={{color: '#414141', fontWeight: 'bold', paddingLeft: '0.5rem'}}>
                {text}
              </Typography>
            </div>
          )}
          {(name === containerName || name === text) && (
            <Typography
              style={{ backgroundColor: color, color: fontColor, paddingLeft: '0.5rem', borderRadius: '3px' }}>
              {text}
              {lenDuplicates && (
                <Chip component={'span'} label={`${lenDuplicates}`}
                      color={level === BLUE_LEVEL ? 'secondary' : 'primary'} size='small'
                      style={{ marginLeft: '0.5rem', marginRight: '0.25rem' }}/>
              )}
            </Typography>
          )}
        </>
      </Link>
      {dismissable && (
        <SpinningTooltipIconButton
          size="small"
          icon={<DeleteForeverIcon/>}
          translationId="notificationDismiss"
          onClick={handleDismiss}
          marketId={marketId}
        />
      )}
    </>
  );

}

NotificationMessageDisplay.propTypes = {
  message: PropTypes.object.isRequired,
  onLinkClick: PropTypes.func,
};

NotificationMessageDisplay.defaultProps = {
  onLinkClick: () => {},
};

export default NotificationMessageDisplay;

