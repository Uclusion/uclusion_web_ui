import React from 'react';
import { useIntl } from 'react-intl';

import { updateValues } from '../../onboardingReducer';
import { Typography } from '@material-ui/core';
import StepButtons from '../../StepButtons';
import ExpirationSelector from '../../../../components/Expiration/ExpirationSelector';
import PropTypes from 'prop-types';

function DialogExpirationStep(props) {
  const { updateFormData, formData, active, classes } = props;
  const intl = useIntl();

  const value = formData.dialogExpiration || 1440;

  if (!active) {
    return React.Fragment;
  }
  const validForm = value !== 0;

  function onExpiresChange(event) {
    const { value } = event.target;
    updateFormData(updateValues({
      dialogExpiration: value,
    }));
  }

  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        Since decisions have deadlines, Uclusion Dialogs require all activity to stop after a set number of days.
        Use the slider below to select the number of days until the Dialog expires, but don't worry if it turns out everyone
        needs more time. You can extend the expiration later.
      </Typography>
      <label className={classes.inputLabel} htmlFor="name">{intl.formatMessage({ id: 'DialogWizardDialogExpirationPlaceHolder' })}</label>
      <ExpirationSelector value={value} onChange={onExpiresChange}/>
      <div className={classes.borderBottom}></div>
      <StepButtons {...props} validForm={validForm}/>
    </div>
  );
}

DialogExpirationStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

DialogExpirationStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default DialogExpirationStep;