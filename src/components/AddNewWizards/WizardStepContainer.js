import React from 'react';
import { wizardStyles } from './WizardStylesContext'
import { useMediaQuery, useTheme } from '@material-ui/core';

function WizardStepContainer (props) {
  const { children, isLarge=false } = props;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const classes = wizardStyles();
  return (
    <div className={classes.baseCard} style={{overflowX: 'hidden',
      maxWidth: mobileLayout ? undefined : (isLarge ? '990px' : '725px')}}>
      <div style={{overflowX: 'hidden'}}>
        {children}
      </div>
    </div>);
}
export default WizardStepContainer;