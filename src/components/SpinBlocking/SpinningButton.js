/** A simple button that when spinning is true, ignores it's children
 * for a circular progress indicator
 */
import React, { useContext, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress, Button, useTheme, Tooltip } from '@material-ui/core';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useIntl } from 'react-intl';

const FocusRippleButton = function FocusRippleButton({ autoFocus, children, ...other }) {
  const actionRef = React.useRef();

  useLayoutEffect(() => {
    if (actionRef?.current && autoFocus) {
      // Otherwise autoFocus only takes affect for keyboard use and ignores mouse users
      actionRef.current.focusVisible();
    }
  }, [autoFocus]);

  return (
    <Button
      action={actionRef}
      {...other}
    >
      {children}
    </Button>
  );
}

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
    toolTipId,
    focus,
    ...rest
  } = props;
  const intl = useIntl();
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const theme = useTheme();
  const mySpinning = operationRunning === id || (!onClick && spinning);
  const spinningDisabled = (operationRunning !== false)||(!onClick && spinning);
  function myOnClick() {
    if (onClick) {
      if (doSpin) {
        setOperationRunning(id);
      }
      onClick();
    }
  }
  const myDisabled = spinningDisabled || disabled;
  const myButton = <FocusRippleButton
    disabled={myDisabled}
    autoFocus={focus}
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
  </FocusRippleButton>;

  if (toolTipId && !myDisabled) {
    return (
      <Tooltip title={
        <h3>
          {intl.formatMessage({ id: toolTipId })}
        </h3>
      } placement="top">
        {myButton}
      </Tooltip>
    );
  }

  return myButton;
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
