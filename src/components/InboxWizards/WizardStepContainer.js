import React from 'react';
import { wizardStyles } from './WizardStylesContext';

function WizardStepContainer (props) {
  const { children } = props;
  const classes = wizardStyles();
  return (
    <div className={classes.baseCard} style={{overflowX: 'hidden'}}>
      <div>
        {children}
      </div>
    </div>);
}
export default WizardStepContainer;