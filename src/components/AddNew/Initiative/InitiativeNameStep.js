import React, { useContext } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { TextField, Typography } from '@material-ui/core';
import StepButtons from '../StepButtons';
import { useIntl } from 'react-intl';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepContainer from '../WizardStepContainer';

function InitiativeNameStep (props) {

  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const value = formData.initiativeName || '';

  const validForm = !_.isEmpty(value);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      initiativeName: value,
    });
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="InitiativeWizardInitiativeNameStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          We'll be creating a Uclusion Initiative that allows people outside a Workspace to vote for or against
          your idea.
        </Typography>
        <label className={classes.inputLabel}
               htmlFor="name">{intl.formatMessage({ id: 'InitiativeWizardInitiativeNamePlaceholder' })}</label>
        <TextField
          id="name"
          className={classes.input}
          value={value}
          onChange={onNameChange}
        />
        <div className={classes.borderBottom}></div>
        <StepButtons {...props} validForm={validForm} showFinish={false}/>
      </div>
    </WizardStepContainer>
  );

}

InitiativeNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

InitiativeNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default InitiativeNameStep;