import * as React from "react";
import InputAdornment from "@material-ui/core/InputAdornment";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import { KeyboardDatePicker } from "@material-ui/pickers";
import { useIntl } from "react-intl";

const useInputSuffixClasses = makeStyles(
  { input: { textAlign: "right" } },
  { name: "InputSuffix" }
);

export function MaxBudget(props) {
  const { readOnly, ...other } = props;
  const intl = useIntl();

  const classes = useInputSuffixClasses();

  return (
    <TextField
      id="agile-plan-max-budget"
      InputProps={{
        endAdornment: <InputSuffix>days</InputSuffix>,
        readOnly
      }}
      inputProps={{
        className: classes.input,
        inputMode: "numeric",
        size: 5,
        pattern: "[0-9]*"
      }}
      label={intl.formatMessage({
        id: "agilePlanAddMaxMaxBudgetInputLabel"
      })}
      placeholder="14"
      variant="filled"
      {...other}
    />
  );
}
export function VoteExpiration(props) {
  const { readOnly, ...other } = props;
  const intl = useIntl();

  const classes = useInputSuffixClasses();

  return (
    <TextField
      InputProps={{
        endAdornment: <InputSuffix>days</InputSuffix>,
        readOnly
      }}
      id="agile-plan-expiration"
      inputProps={{
        className: classes.input,
        inputMode: "numeric",
        size: 5,
        pattern: "[0-9]*"
      }}
      label={intl.formatMessage({
        id: "agilePlanAddInvestmentExpirationLabel"
      })}
      variant="filled"
      {...other}
    />
  );
}

export function Votes(props) {
  const { readOnly, ...other } = props;
  const intl = useIntl();

  return (
    <TextField
      helperText={
        !readOnly &&
        intl.formatMessage({
          id: "votesRequiredInputHelperText"
        })
      }
      id="agile-plan-votes-required"
      InputProps={{ readOnly }}
      inputProps={{
        inputMode: "numeric",
        pattern: "[0-9]*"
      }}
      label={intl.formatMessage({ id: "votesRequiredInputLabelShort" })}
      variant="filled"
      {...other}
    />
  );
}

export function IdealDelivery(props) {
  const { readOnly, ...other } = props;
  const intl = useIntl();

  return (
    <KeyboardDatePicker
      clearable
      disablePast
      format="yyyy/MM/dd"
      inputVariant="filled"
      label={intl.formatMessage({
        id: "agilePlanAddIdealDeliveryLabel"
      })}
      placeholder={intl.formatMessage({
        id: "agilePlanAddIdealDeliveryPlaceholder"
      })}
      {...other}
    />
  );
}

const useInputSuffixStyles = makeStyles(
  theme => {
    return {
      root: {
        fontSize: "inherit",
        paddingTop: theme.spacing(2) + 2
      }
    };
  },
  { name: "InputSuffix" }
);

function InputSuffix(props) {
  const { children } = props;
  const classes = useInputSuffixStyles();

  return (
    <InputAdornment className={classes.root} disableTypography position="end">
      {children}
    </InputAdornment>
  );
}
