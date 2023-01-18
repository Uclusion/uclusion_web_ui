import React from 'react';
import PropTypes from 'prop-types';
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

WizardStepContainer.propTypes = {
  titleId: PropTypes.string,
};

WizardStepContainer.defaultProps = {
  hideSteppers: false,
};

export default WizardStepContainer;