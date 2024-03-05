import React from 'react';
import { wizardStyles } from './WizardStylesContext'
import { useMediaQuery, useTheme } from '@material-ui/core';

function WizardStepContainer (props) {
  const { children, isLarge=false, isXLarge=false } = props;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const classes = wizardStyles();
  return (
    <div className={classes.baseCard} style={{overflowX: 'hidden',
      maxWidth: mobileLayout ? undefined : (isXLarge ? '1200px' : (isLarge ? '990px' : '725px'))}}>
      {children}
    </div>);
}
export default WizardStepContainer;