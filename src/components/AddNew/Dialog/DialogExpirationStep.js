import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import { Typography } from '@material-ui/core';
import StepButtons from '../StepButtons';
import ExpirationSelector from '../../Expiration/ExpirationSelector';
import PropTypes from 'prop-types';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';

function DialogExpirationStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const value = formData.dialogExpiration || 1440;

  const validForm = value !== 0;

  function onExpiresChange (event) {
    const { value } = event.target;
    updateFormData({
      dialogExpiration: value,
    });
  }

  function onNext () {
    updateFormData({
      dialogExpiration: value,
    });
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="DialogWizardDialogExpirationStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          Uclusion Dialogs require all activity to stop after a set number of days.
          Use the slider below to select the number of days until the Dialog expires, you can extend the expiration
          later.
        </Typography>
        <label className={classes.inputLabel}
               htmlFor="name">{intl.formatMessage({ id: 'DialogWizardDialogExpirationPlaceHolder' })}</label>
        <ExpirationSelector value={value} onChange={onExpiresChange}/>
        <div className={classes.borderBottom}></div>
        <StepButtons {...props} validForm={validForm} onNext={onNext}/>
      </div>
    </WizardStepContainer>
  );
}

DialogExpirationStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

DialogExpirationStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default DialogExpirationStep;