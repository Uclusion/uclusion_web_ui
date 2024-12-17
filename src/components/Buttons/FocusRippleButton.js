import React, { useLayoutEffect } from 'react';
import { Button } from '@material-ui/core';

function FocusRippleButton({ autoFocus, children, ...other }) {
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

export default FocusRippleButton;
