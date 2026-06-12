import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router';
import { wizardStyles } from '../../../components/InboxWizards/WizardStylesContext';
import SpinningButton from '../../../components/SpinBlocking/SpinningButton';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { removeWorkListItem } from './WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';

// Displays in place of a wizard when one is blocked from showing, with text explaining why,
// a dismiss button, and optionally a link to the underlying comment
function BlockedNotificationPanel(props) {
  const { message, explanationId, commentLink } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = wizardStyles();
  const [, messagesDispatch] = useContext(NotificationsContext);

  return (
    <div className={classes.baseCard} style={{ overflowX: 'hidden', maxWidth: '80rem' }}>
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'blockedNotificationTitle' })}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        {intl.formatMessage({ id: explanationId })}
      </Typography>
      <div style={{ display: 'flex', marginTop: '1rem' }}>
        {commentLink && (
          <SpinningButton id="blockedNotificationView" className={classes.actionNext} variant="text" doSpin={false}
                          style={{ marginRight: '1rem' }}
                          onClick={() => navigate(history, commentLink)}>
            {intl.formatMessage({ id: 'blockedNotificationViewComment' })}
          </SpinningButton>
        )}
        <SpinningButton id="blockedNotificationDismiss" className={classes.actionSkip} variant="text" doSpin={false}
                        onClick={() => removeWorkListItem(message, messagesDispatch, history)}>
          {intl.formatMessage({ id: 'notificationDismiss' })}
        </SpinningButton>
      </div>
    </div>
  );
}

BlockedNotificationPanel.propTypes = {
  message: PropTypes.object.isRequired,
  explanationId: PropTypes.string.isRequired,
  commentLink: PropTypes.string
};

export default BlockedNotificationPanel;
