import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useIntl } from 'react-intl';

function DecideUpgradeStep(props) {
  const { message, updateFormData } = props;
  const intl = useIntl();
  const [, messagesDispatch] = useContext(NotificationsContext);
  const classes = wizardStyles();
  const workItemClasses = workListStyles();

  function myOnFinish() {
    removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecidePayTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Uclusion will be read only until your account is upgraded.
      </Typography>
      <WizardStepButtons
        {...props}
        onFinish={myOnFinish}
        nextLabel="WizardPaymentInfo"
        onNext={() => updateFormData({ isCard: true })}
        showOtherNext
        otherNextLabel="WizardPromoInfo"
        onOtherNext={() => updateFormData({ isCard: false })}
        showTerminate={message.is_highlighted}
        terminateLabel='defer'
      />
    </div>
    </WizardStepContainer>
  );
}

DecideUpgradeStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideUpgradeStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideUpgradeStep;