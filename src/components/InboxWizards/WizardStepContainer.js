import React from 'react';
import PropTypes from 'prop-types';
  import clsx from 'clsx';
import StepHeaders from './StepHeaders';
import { wizardStyles } from './WizardStylesContext'

function WizardStepContainer (props) {
  const { hideSteppers, titleId, children, ...other } = props;
  const classes = wizardStyles();
  const titleClass = titleId ? classes[titleId] : classes.stepDefault;
  return (
    <div className={clsx(titleClass, classes.baseCard)} elevation={0}>
      <div>
        <StepHeaders titleId={titleId} hideSteppers={hideSteppers} {...other} />
      </div>
      <div>
        {children}
      </div>
    </div>);
}

WizardStepContainer.propTypes = {
  titleId: PropTypes.string,
  hideSteppers: PropTypes.bool,
};

WizardStepContainer.defaultProps = {
  hideSteppers: false,
};

export default WizardStepContainer;