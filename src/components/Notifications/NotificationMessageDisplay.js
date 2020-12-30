import React from 'react'
import PropTypes from 'prop-types'
import { Link } from '@material-ui/core'
import { navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import Typography from '@material-ui/core/Typography';
import { RED_LEVEL, YELLOW_LEVEL } from '../../constants/notifications'

function NotificationMessageDisplay(props) {
  const {
    message
  } = props;
  const { link, level, name, text,
    investible_name: investibleName,
    market_name: marketName
  } = message;
  const history = useHistory();
  const color = level === RED_LEVEL ? '#E85757' : level === YELLOW_LEVEL ? '#e6e969' : '#2D9CDB';
  const fontColor = level === RED_LEVEL ? 'white' : level === YELLOW_LEVEL ? 'black' : 'white';
  const containerName = investibleName || marketName;
  return (
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
        <Typography style={{backgroundColor: color, color: fontColor, paddingLeft: '1rem', borderRadius: '3px'}}>{text}</Typography>
      </>
    </Link>
  );

}

NotificationMessageDisplay.propTypes = {
  message: PropTypes.object.isRequired,
};

export default NotificationMessageDisplay;

