import React from 'react';
import useInboxWizardActions from '../useInboxWizardActions';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription';
import { useIntl } from 'react-intl';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';
import _ from 'lodash';

function ReviewEditStep(props) {
  const { marketId, investibleId, message } = props;
  const { clearNotification } = useInboxWizardActions(message);
  const classes = wizardStyles();
  const intl = useIntl();
  const { edit_list: notificationTypes, investible_name: previousName } = message;
  const isDescriptionEdited = notificationTypes.includes('UNREAD_DESCRIPTION');
  const isAttachmentsEdited = notificationTypes.includes('UNREAD_ATTACHMENT');
  const isNameEdited = notificationTypes.includes('UNREAD_NAME');

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'unreadJobEdit' })}
      </Typography>
      {isNameEdited && !_.isEmpty(previousName) && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Previous name was {previousName}.
        </Typography>
      )}
      {isAttachmentsEdited && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Attachments have changed.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId} removeActions showDiff={isDescriptionEdited}
                      showAttachments={isAttachmentsEdited}/>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
        showNext={false}
        terminateLabel={getLabelForTerminate(message)}
        showTerminate={getShowTerminate(message)}
        onFinish={clearNotification}
      />
    </WizardStepContainer>
  );
}

ReviewEditStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default ReviewEditStep;