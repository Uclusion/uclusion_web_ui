import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function DemoChoiceStep() {
  const classes = useContext(WizardStylesContext);
  const history = useHistory();

  return (
    <WizardStepContainer
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
        nextLabel='createViewSingleUser'
        onNext={() => navigate(history, '/demo?utm_campaign=solo')}
        spinOnClick={false}
        showOtherNext
        otherNextLabel='createWorkspaceNormal'
        onOtherNext={() => navigate(history, '/demo?utm_campaign=team')}
        otherSpinOnClick={false}
      />
    </WizardStepContainer>
  );
}

DemoChoiceStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default DemoChoiceStep;