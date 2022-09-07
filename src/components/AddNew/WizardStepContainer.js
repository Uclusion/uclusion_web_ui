import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Card, } from '@material-ui/core';
import clsx from 'clsx';
import StepHeaders from './StepHeaders';
import { WizardStylesContext } from './WizardStylesContext';

function WizardStepContainer (props) {
  const { hideSteppers, titleId, children, ...other } = props;
  const classes = useContext(WizardStylesContext);
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