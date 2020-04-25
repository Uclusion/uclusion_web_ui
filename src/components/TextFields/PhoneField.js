import React from 'react';
import PropTypes from 'prop-types';
import { TextField } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';

function PhoneField(props) {
  const intl = useIntl();
  const {
    onChange,
    value,
    label,
    ...rest
  } = props;

  // stolen from https://stackoverflow.com/questions/16699007/regular-expression-to-match-standard-10-digit-phone-number
  const phoneRegexp = new RegExp(/^\s*(?:\+?(\d{1,3}))?\s*\d{1,}$/);
  const validPhone = _.isEmpty(value) || phoneRegexp.test(value);
  const helperLabel = intl.formatMessage({ id: "phoneFieldErrorText" });

  return (
    <TextField
      {...rest}
      error={!validPhone}
      value={value}
      type="tel"
      label={label}
      helperText={validPhone? '' : helperLabel}
      onChange={onChange}
    />

  )
}

PhoneField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  label: PropTypes.string.isRequired,
}

export default PhoneField;