import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import { FormControlLabel, RadioGroup, Radio, Typography } from '@material-ui/core';
import StepButtons from '../StepButtons';
import PropTypes from 'prop-types';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';

function MultipleVotesStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const value = formData.allowMultipleVotes || "false";


  function onChange (event) {
    const { value } = event.target;
    updateFormData({
      allowMultipleVotes: value,
    });
  }


  return (
    <WizardStepContainer
      {...props}
      titleId="DialogWizardMultipleVotesStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          Uclusion Dialogs can allow participants to vote for more than one option, or one option only.
        </Typography>
        <RadioGroup value={value} onChange={onChange}>
          <FormControlLabel value={"true"} control={<Radio/>} label={intl.formatMessage({id: 'DialogWizardDialogMultipleVotesYes'})}/>
          <FormControlLabel value={"false"} control={<Radio/>} label={intl.formatMessage({id: 'DialogWizardDialogMultipleVotesNo'})}/>
        </RadioGroup>
        <div className={classes.borderBottom}></div>
        <StepButtons {...props} validForm={true}/>
      </div>
    </WizardStepContainer>
  );
}

MultipleVotesStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

MultipleVotesStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default MultipleVotesStep;