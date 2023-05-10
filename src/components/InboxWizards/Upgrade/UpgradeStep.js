import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import CardInputForm from '../../../pages/Payments/CardInputForm';
import PromoCodeInput from '../../../pages/Payments/PromoCodeInput';

function UpgradeStep(props) {
  const { message, formData } = props;
  const [, messagesDispatch] = useContext(NotificationsContext);
  const classes = wizardStyles();
  const workItemClasses = workListStyles();
  const { isCard } = formData;

  function myOnFinish() {
    removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {isCard ? 'What is your credit card information?' : 'What is your promotion code?'}
      </Typography>
      {isCard && (
        <CardInputForm wizardProps={props} onSubmit={myOnFinish} />
      )}
      {!isCard && (
        <PromoCodeInput wizardProps={props} onSubmit={myOnFinish} />
      )}
    </div>
    </WizardStepContainer>
  );
}

UpgradeStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

UpgradeStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default UpgradeStep;