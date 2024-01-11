import React from 'react';
import { wizardStyles } from './WizardStylesContext';

function WizardStepContainer (props) {
  const { children, startOver } = props;
  const classes = wizardStyles();
  return (
    <>
      <div onClick={startOver} style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9,
        position: 'sticky',
        marginTop: '-41px',
        marginBottom: '25px',
        paddingRight: '8rem',
        color: 'rgba(0, 0, 0, 0.62)',
        width: '20rem',
        marginLeft: 'auto', marginRight: 'auto',
      }}>Start over
      </div>
      <div className={classes.baseCard} style={{ overflowX: 'hidden' }}>
        {children}
      </div>
    </>
  )
    ;
}

export default WizardStepContainer;