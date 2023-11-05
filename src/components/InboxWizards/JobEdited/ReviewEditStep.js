import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription';
import { useHistory } from 'react-router';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useIntl } from 'react-intl';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';

function ReviewEditStep(props) {
  const { marketId, investibleId, message } = props;
  const [, messagesDispatch] = useContext(NotificationsContext);
  const classes = wizardStyles();
  const history = useHistory();
  const intl = useIntl();
  const { edit_list: notificationTypes, investible_name: previousName } = message;
  const isDescriptionEdited = notificationTypes.includes('UNREAD_DESCRIPTION');
  const isAttachmentsEdited = notificationTypes.includes('UNREAD_ATTACHMENT');

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'unreadJobEdit'})}
      </Typography>
      {previousName && (
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
                      showAttachments={isAttachmentsEdited} />
      <WizardStepButtons
        {...props}
        showNext={false}
        terminateLabel={getLabelForTerminate(message)}
        showTerminate={getShowTerminate(message)}
        onFinish={() => removeWorkListItem(message, messagesDispatch, history)}
      />
    </WizardStepContainer>
  );
}

ReviewEditStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ReviewEditStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ReviewEditStep;