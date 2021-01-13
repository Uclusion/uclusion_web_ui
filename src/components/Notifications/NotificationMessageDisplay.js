import React from 'react'
import PropTypes from 'prop-types'
import { Link } from '@material-ui/core'
import { navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import Typography from '@material-ui/core/Typography';
import { RED_LEVEL, UNREAD_TYPE, YELLOW_LEVEL } from '../../constants/notifications';
import Chip from '@material-ui/core/Chip'
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import SpinningTooltipIconButton from '../SpinBlocking/SpinningTooltipIconButton';
import { deleteSingleMessage } from '../../api/users';

function NotificationMessageDisplay(props) {
  const {
    message
  } = props;
  const { link, level, name, text, lenDuplicates,
    investible_name: investibleName,
    market_name: marketName,
    type
  } = message;
  console.error(message);
  const dismissable = type === UNREAD_TYPE;
  const history = useHistory();
  const color = level === RED_LEVEL ? '#ff9b9b' : level === YELLOW_LEVEL ? '#e8e9a9' : '#85bddb';
  const fontColor = level === RED_LEVEL ? 'black' : level === YELLOW_LEVEL ? 'black' : 'white';
  const containerName = investibleName || marketName;


  function handleDismiss() {
    return deleteSingleMessage(message)
  }

  return (
    <>
    <Link href={link} style={{ width: '100%' }}  onClick={
      (event) => {
        event.stopPropagation();
        event.preventDefault();
        navigate(history, link);
      }
    }>
      <>
        {name !== containerName && name !== text && (
          <Typography style={{fontStyle: 'italic'}}>
            {name}</Typography>
        )}
        <Typography style={{backgroundColor: color, color: fontColor, paddingLeft: '1rem', borderRadius: '3px'}}>{text}
          {lenDuplicates && (
            <Chip label={`${lenDuplicates}`} color="primary" size='small'
                  style={{ marginLeft: '0.5rem'}} />
          )}
        </Typography>
      </>
    </Link>
  {dismissable && (
    <SpinningTooltipIconButton
      size="small"
      icon={<DeleteForeverIcon/>}
      translationId="notificationDismiss"
      onClick={handleDismiss}
    />
    )}
    </>
  );

}

NotificationMessageDisplay.propTypes = {
  message: PropTypes.object.isRequired,
};

export default NotificationMessageDisplay;

