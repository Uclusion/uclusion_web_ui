import React, { useEffect, useLayoutEffect } from 'react';
import { Button } from '@material-ui/core';
import ReactDOM from 'react-dom';

function FocusRippleButtonReact17({ autoFocus, children, ...other }) {
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

function FocusRippleButton(props) {
  const { autoFocus } = props;
  const ref = React.useRef();

  useEffect(() => {
    if (ref?.current && autoFocus) {
      // See https://github.com/mui/material-ui/issues/30953 for why must use React 17 render for this component and MUI < 5
      ReactDOM.render(<FocusRippleButtonReact17 {...props} />, ref.current);
    }
  }, [ref, autoFocus, props])

  if (!autoFocus) {
    return <FocusRippleButtonReact17 {...props} />;
  }

  return (
    <div ref={ref}></div>
  );
}

export default FocusRippleButton;
