import * as React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { useIntl } from 'react-intl';
import 'react-datepicker/dist/react-datepicker.css';
import { Typography, } from '@material-ui/core';
import { usePlanFormStyles } from './index';

const useSuffixedInput = makeStyles(
  { input: { textAlign: "center", padding: '10px' } },
  { name: "SuffixedInput" }
);

export function StartedExpiration(props) {
  const { value, onChange } = props;
  const intl = useIntl();

  const classes = useSuffixedInput();
  const formClasses = usePlanFormStyles();

  return (

    <React.Fragment>
      <TextField
        className={formClasses.input}
        id="started-expiration"
        inputProps={{
          className: classes.input,
          inputMode: "numeric",
          pattern: "[0-9]*"
        }}
        label={intl.formatMessage({
          id: "startedExpirationLabel"
        })}
        value={value}
        onChange={onChange}
      />
      <Typography>
        {intl.formatMessage({ id: "startedExpirationHelp" })}
      </Typography>
    </React.Fragment>
  );
}