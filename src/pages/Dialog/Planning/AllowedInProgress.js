import React from 'react';
import PropTypes from 'prop-types';
import InputLabel from '@material-ui/core/InputLabel';
import { FormControl, MenuItem, Select, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';

function AllowedInProgress(props) {
  const {
    value,
    onChange,
  } = props;

  const intl = useIntl();

  return (
  <FormControl variant="filled">
    <InputLabel id="select-allowed-investibles-label">
      {intl.formatMessage({ id: 'allowedInvestiblesDropdownLabel' })}</InputLabel>
    <Select
      value={value}
      onChange={onChange}
      style={{backgroundColor: "#ecf0f1"}}
    >
      <MenuItem value={0}>
        {intl.formatMessage({ id: 'allowedInvestiblesUnlimitedValue' })}
      </MenuItem>
      <MenuItem value={1}>1</MenuItem>
      <MenuItem value={2}>2</MenuItem>
      <MenuItem value={3}>3</MenuItem>
      <MenuItem value={4}>4</MenuItem>
      <MenuItem value={5}>5</MenuItem>
    </Select>
    <Typography>
      {intl.formatMessage({ id: 'allowedInvestiblesDropdownHelp' })}
    </Typography>
  </FormControl>
  )
}

AllowedInProgress.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
}

AllowedInProgress.defaultProps = {
  value: 1,
  onChange: () => {},
}

export default AllowedInProgress;