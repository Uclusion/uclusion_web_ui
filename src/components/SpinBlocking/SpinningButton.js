/** A simple button that when spinning is true, ignores it's children
 * for a circular progress indicator
 */
import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import { CircularProgress, Button, useTheme } from '@material-ui/core';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'

function SpinningButton(props) {

  const {
    id,
    disabled,
    children,
    doSpin,
    onClick,
    spinning,
    icon: Icon,
    endIcon: EndIcon,
    iconColor='white',
    ...rest
  } = props;
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const theme = useTheme();
  const mySpinning = operationRunning === id || (!onClick && spinning);
  const spinningDisabled = doSpin && ((operationRunning !== false)||(!onClick && spinning));
  function myOnClick() {
    if (onClick) {
      if (doSpin) {
        setOperationRunning(id);
      }
      onClick();
    }
  }

  return (
    <Button
      disabled={spinningDisabled || disabled}
      onClick={myOnClick}
      id={id}
      endIcon={EndIcon ? (spinningDisabled || disabled ? <EndIcon color='disabled' /> : <EndIcon htmlColor={iconColor} />)
        : undefined}
      startIcon={Icon ? (spinningDisabled || disabled ? <Icon color='disabled' /> : <Icon htmlColor={iconColor} />)
        : undefined}
      {...rest}
    >
      {children}
      {mySpinning && (
        <CircularProgress
          size={theme.typography.fontSize}
          color="inherit"
          style={{position: 'absolute', top: '50%', left: '50%', marginTop: -6, marginLeft: -12}}
        />
      )}
    </Button>
  );
}

SpinningButton.propTypes = {
  doSpin: PropTypes.bool,
  disabled: PropTypes.bool,
};

SpinningButton.defaultProps = {
  doSpin: true,
  disabled: false,
};

export default SpinningButton;
