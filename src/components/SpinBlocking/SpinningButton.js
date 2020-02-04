/** A simple button that when spinning is true, ignores it's children
 * for a circular progress indicator
 */
import React from 'react';
import PropTypes from 'prop-types';
import { CircularProgress, Button, useTheme } from '@material-ui/core';

function SpinningButton(props) {

  const {
    spinning,
    disabled,
    children,
    ...rest
  } = props;

  const theme = useTheme();

  return (
    <Button
      disabled={spinning || disabled}
      {...rest}
    >
      {spinning && (
        <CircularProgress
          size={theme.typography.fontSize}
          color="inherit"
        />
      )}
      {!spinning && children}
    </Button>
  );
}

SpinningButton.propTypes = {
  spinning: PropTypes.bool,
  disabled: PropTypes.bool,
};

SpinningButton.defaultProps = {
  spinning: false,
  disabled: false,
};

export default SpinningButton;
