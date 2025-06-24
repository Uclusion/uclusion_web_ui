import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';

function DemoChoiceStep (props) {
  const { setUtm } = props;
  const classes = useContext(WizardStylesContext);

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        Which demo would you like?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Easily see Uclusion in action and when you create your own workspace, this demo will be removed.
      </Typography>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        nextLabel='createViewSingleUser'
        onNext={() => setUtm('solo')}
        showOtherNext
        otherNextLabel='createWorkspaceNormal'
        onOtherNext={() => setUtm('team')}
      />
    </WizardStepContainer>
  );
}

DemoChoiceStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DemoChoiceStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DemoChoiceStep;