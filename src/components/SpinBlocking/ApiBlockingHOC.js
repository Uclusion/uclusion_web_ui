/**
 An API blocking component that spins during the onclick,
 but releases it when that is done. It does _not_ attempt to check
 for anything in our data stores, and it does not set the global operation in progress.
 It should only be used for things that don't affect the data stores.
 **/
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress, useTheme } from '@material-ui/core';

export function withApiLock(Component) {
  function Locking(props) {
    const {
      disabled = false,
      onClick = () => {},
      children,
      ...rest
    } = props;

    const theme = useTheme();
    const [spinning, setSpinning] = useState(false);

    function startSpinning() {
      setSpinning(true);
    }

    function stopSpinning() {
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
        disabled={disabled || spinning}
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
  return Locking;
}