/**
 An API blocking component sets operation in progress during the onclick,
 but releases it when that is done. It does _not_ attempt to check
 for anything in our data stores
 **/
import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress, useTheme } from '@material-ui/core';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';

export function withApiLock(Component) {
  function Locking(props) {
    const {
      disabled,
      onClick,
      children,
      ...rest
    } = props;

    const theme = useTheme();
    const [spinning, setSpinning] = useState(false);
    const [operationInProgress, setOperationInProgress] = useContext(OperationInProgressContext);

    function startSpinning() {
      setOperationInProgress(true);
      setSpinning(true);
    }

    function stopSpinning() {
      setOperationInProgress(false);
      setSpinning(false);
    }

    function myOnClick() {
      startSpinning();
      return Promise.resolve(onClick())
        .then(() => stopSpinning())
        .catch(() => stopSpinning());
    }

    return (
      <Component
        disabled={disabled || operationInProgress || spinning}
        onClick={myOnClick}
        {...rest}
      >
        {spinning && (
          <CircularProgress
            size={theme.typography.fontSize}
            color="inherit"
          />
        )}
        {!spinning && children}
      </Component>
    );
  }

  Locking.propTypes = {
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
  };
  Locking.defaultProps = {
    disabled: false,
    onClick: () => {},
  };
  return Locking;
}