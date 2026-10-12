import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import ReadOnlyQuillEditor from '../../TextEditors/ReadOnlyQuillEditor';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';

function BacklogReportStep(props) {
  const { message } = props;
  const intl = useIntl();
  const classes = wizardStyles();
  const [, messagesDispatch] = useContext(NotificationsContext);

  function myOnFinish() {
    // Not an UNREAD type so the row must be force deleted to leave the inbox. Only this user's row goes.
    removeWorkListItem(message, messagesDispatch, undefined, true);
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'BacklogMaintenanceIntro' })}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        {intl.formatMessage({ id: 'BacklogMaintenanceExplanation' })}
      </Typography>
      {/* The backend stores the report already converted to HTML, with each short code a link */}
      <ReadOnlyQuillEditor value={message.text} id={`backlogReport${getMessageId(message)}`} />
      <div style={{marginBottom: '1rem'}}/>
      <WizardStepButtons
        {...props}
        focus
        showNext={false}
        showTerminate
        onFinish={myOnFinish}
        terminateLabel="notificationDelete"
      />
    </WizardStepContainer>
  );
}

BacklogReportStep.propTypes = {
  message: PropTypes.object.isRequired,
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default BacklogReportStep;
