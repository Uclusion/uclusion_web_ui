import React, { useContext } from 'react'
import { toastError } from '../../utils/userMessage'
import { CircularProgress, useTheme } from '@material-ui/core'
import PropTypes from 'prop-types'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'

export function withSpinLock(Component) {
  const Spinning = function (props) {
    const {
      id,
      onClick = () => {},
      onError = () => {},
      children,
      disabled = false,
      doSpin = true,
      ...rest
    } = props;

    const theme = useTheme();
    const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);

    function myOnError(error) {
      console.error(error);
      toastError(error, 'spinVersionCheckError');
      onError(error);
    }

    function myOnClick(event) {
      if (doSpin) {
        event.preventDefault();
        setOperationRunning(id);
        return Promise.resolve(onClick()).catch((error) => myOnError(error));
      }
      onClick(event);
    }

    return (
      <Component
        disabled={disabled || operationRunning}
        onClick={myOnClick}
        {...rest}
      >
        {children}
        {operationRunning === id && (
          <CircularProgress
            size={theme.typography.fontSize}
            color="inherit"
            style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -6, marginLeft: -12 }}
          />
        )}
      </Component>
    );
  };
  Spinning.propTypes = {
    onClick: PropTypes.func,
    onError: PropTypes.func,
    disabled: PropTypes.bool,
    doSpin: PropTypes.bool,
    id: PropTypes.string.isRequired
  };
  return Spinning;
}
