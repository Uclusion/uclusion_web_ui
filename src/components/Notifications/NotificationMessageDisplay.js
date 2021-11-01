import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Link, makeStyles } from '@material-ui/core'
import { navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router';
import Typography from '@material-ui/core/Typography';
import { UNREAD_TYPE } from '../../constants/notifications'
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import SpinningTooltipIconButton from '../SpinBlocking/SpinningTooltipIconButton';
import { deleteOrDehilightMessages, deleteSingleMessage } from '../../api/users'
import { removeMessage } from '../../contexts/NotificationsContext/notificationsContextReducer';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import UsefulRelativeTime from '../TextFields/UseRelativeTime'
import Badge from '@material-ui/core/Badge'

const useStyles = makeStyles(
  () => {
    return {
      chip: {
        color: 'black',
        marginLeft: '0.5rem',
        marginRight: '0.25rem',
        '& .MuiBadge-badge': {
          border: '0.5px solid grey',
          backgroundColor: '#fff',
        },
      },
      padded: {
        paddingTop: '1rem'
      },
      newNotification: {
        borderRadius: '3px',
        border: '1px solid #F29100'
      },
      oldNotification: {
        borderRadius: '3px',
        border: '1px solid grey'
      },
      lessPadded: {
        paddingTop: '0.5rem'
      },
      notBottomPaddedText: {
        color: '#414141',
        fontWeight: 'bold',
        paddingLeft: '0.5rem',
        paddingRight: '0.5rem',
      },
    };
  });

function NotificationMessageDisplay (props) {
  const {
    message,
    onLinkClick,
    lastRead
  } = props;
  const classes = useStyles();
  const {
    link, name, text, lenDuplicates, dismissMessages,
    investible_name: investibleName,
    market_name: marketName,
    market_id: marketId,
    updated_at: updatedAt,
    type
  } = message;
  const dismissable = (type && type.startsWith(UNREAD_TYPE))||(marketId && marketId.startsWith('slack'));
  const history = useHistory();
  const containerName = investibleName || marketName;
  const [, messagesDispatch] = useContext(NotificationsContext);

  function handleDismiss () {
    if (!_.isEmpty(dismissMessages)) {
      return deleteOrDehilightMessages(dismissMessages, messagesDispatch);
    }
    return deleteSingleMessage(message)
      .then(() => messagesDispatch(removeMessage(message)));
  }
  const updatedAtDate = new Date(updatedAt);
  const isOneDayAgo = Date.now() - Date.parse(updatedAt) > 1000*60*60*24;
  const useName = name !== containerName && name !== text;
  let useLink = link;
  if (type === 'NOT_FULLY_VOTED') {
    useLink += '#approve'
  }
  return (
    <>
      <Link href={useLink} style={{ width: '100%' }} onClick={
        (event) => {
          preventDefaultAndProp(event);
          navigate(history, useLink);
          onLinkClick();
        }
      }>
        <div className={(lastRead === undefined || updatedAtDate > lastRead) ? classes.newNotification :
          classes.oldNotification}>
          <Badge badgeContent={lenDuplicates} className={classes.chip}>
            <Typography className={lenDuplicates ? classes.padded : classes.lessPadded}>
              {useName ? name : text}
            </Typography>
          </Badge>
          {useName && (
            <Typography className={classes.notBottomPaddedText}>
              {text}
            </Typography>
          )}
          {isOneDayAgo && (
            <Typography style={{ paddingLeft: '0.5rem', color: 'black'}}>
              <UsefulRelativeTime value={ new Date(updatedAt)}/>
            </Typography>
          )}
          <div style={{paddingBottom: '0.5rem'}} />
        </div>
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

