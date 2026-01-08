import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import { useIntl } from 'react-intl';
import BillingHome from '../../../pages/Payments/BillingHome';

function DecideUpgradeStep(props) {
  const intl = useIntl();
  const classes = wizardStyles();

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecidePayTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Uclusion functionality will be reduced until a card or promo code is entered.
      </Typography>
      <BillingHome isInbox />
    </WizardStepContainer>
  );
}

DecideUpgradeStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default DecideUpgradeStep;