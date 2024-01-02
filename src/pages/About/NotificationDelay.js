import React from 'react';
import PropTypes from 'prop-types';
import InputLabel from '@material-ui/core/InputLabel';
import { FormControl, MenuItem, Select, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';

function NotificationDelay(props) {
  const {
    value,
    onChange,
    labelId,
    explanationId,
    disabled
  } = props;
  const intl = useIntl();

  return (
  <FormControl variant="filled">
    <InputLabel id={`select-show-${labelId}`}>
      {intl.formatMessage({ id: labelId })}
    </InputLabel>
    <Select
      value={value}
      onChange={onChange}
      style={{backgroundColor: "#ecf0f1"}}
      disabled={disabled}
    >
      <MenuItem value={0}>
        No delay
      </MenuItem>
      <MenuItem value={10}>10 minutes</MenuItem>
      <MenuItem value={30}>30 minutes</MenuItem>
      <MenuItem value={60}>1 hour</MenuItem>
      <MenuItem value={90}>1.5 hours</MenuItem>
      <MenuItem value={120}>2 hours</MenuItem>
      <MenuItem value={180}>3 hours</MenuItem>
      <MenuItem value={240}>4 hours</MenuItem>
      <MenuItem value={300}>5 hours</MenuItem>
      <MenuItem value={360}>6 hours</MenuItem>
      <MenuItem value={420}>7 hours</MenuItem>
      <MenuItem value={480}>8 hours</MenuItem>
    </Select>
    <Typography>
      {intl.formatMessage({ id: explanationId })}
    </Typography>
  </FormControl>
  )
}

NotificationDelay.propTypes = {
  labelId: PropTypes.string.isRequired,
  explanationId: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired
}

export default NotificationDelay;