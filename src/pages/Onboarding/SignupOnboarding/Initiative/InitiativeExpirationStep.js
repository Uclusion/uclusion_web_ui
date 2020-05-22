import React from 'react';
import { useIntl } from 'react-intl';

import { updateValues } from '../../onboardingReducer';
import { Typography } from '@material-ui/core';
import StepButtons from '../../StepButtons';
import ExpirationSelector from '../../../../components/Expiration/ExpirationSelector';
import PropTypes from 'prop-types';

function InitiativeExpirationStep(props) {
  const { updateFormData, formData, active, classes } = props;
  const intl = useIntl();

  const value = formData.initiativeExpiration || 1440;

  if (!active) {
    return React.Fragment;
  }
  const validForm = value !== 0;

  function onExpiresChange(event) {
    const { value } = event.target;
    updateFormData(updateValues({
      initiativeExpiration: value,
    }));
  }

  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        Votes from a long time ago aren't very useful when determining support.
        Therefore, Uclusion Initiatives give voters a set number of days to vote before the Initiative expires. Don't worry if you
        find out later that you need more time, an expiration can be extended as long as it hasn't already passed.
      </Typography>
      <label className={classes.inputLabel} htmlFor="name">{intl.formatMessage({ id: 'InitiativeWizardInitiativeExpirationPlaceHolder' })}</label>
      <ExpirationSelector value={value} onChange={onExpiresChange}/>
      <div className={classes.borderBottom}></div>
      <StepButtons {...props} validForm={validForm}/>
    </div>
  );
}

InitiativeExpirationStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

InitiativeExpirationStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default InitiativeExpirationStep;