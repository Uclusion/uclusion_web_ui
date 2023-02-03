import React from 'react';
import { wizardStyles } from './WizardStylesContext'

function WizardStepContainer (props) {
  const { children, isLarge=false } = props;
  const classes = wizardStyles();
  return (
    <div className={classes.baseCard} style={{maxWidth: isLarge ? '960px' : '725px'}} elevation={0}>
      <div>
        {children}
      </div>
    </div>);
}
export default WizardStepContainer;