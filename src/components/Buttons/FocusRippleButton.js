import React, { useEffect, useLayoutEffect } from 'react';
import { Button } from '@material-ui/core';
import { ThemeProvider, useTheme } from '@material-ui/core/styles';
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
  const theme = useTheme();

  useEffect(() => {
    if (ref?.current && autoFocus) {
      // See https://github.com/mui/material-ui/issues/30953 for why must use React 17 render for this component and MUI < 5
      // The detached render root has no ThemeProvider, so without one MUI injects default (light)
      // theme MuiButton styles that share v4's global class names and override the dark theme's
      // sheet page-wide - black text buttons in dark mode (T-all-2260, T-all-2253).
      ReactDOM.render(
        <ThemeProvider theme={theme}>
          <FocusRippleButtonReact17 {...props} />
        </ThemeProvider>, ref.current);
    }
  }, [ref, autoFocus, props, theme])

  if (!autoFocus) {
    return <FocusRippleButtonReact17 {...props} />;
  }

  return (
    <div ref={ref}></div>
  );
}

export default FocusRippleButton;
