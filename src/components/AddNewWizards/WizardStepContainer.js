import React from 'react';
import clsx from 'clsx';
import { wizardStyles } from './WizardStylesContext'

function WizardStepContainer (props) {
  const { children } = props;
  const classes = wizardStyles();
  return (
    <div className={clsx(classes.stepDefault, classes.baseCard)} elevation={0}>
      <div>
        {children}
      </div>
    </div>);
}
export default WizardStepContainer;