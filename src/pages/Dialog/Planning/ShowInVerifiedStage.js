import React from 'react';
import PropTypes from 'prop-types';
import InputLabel from '@material-ui/core/InputLabel';
import { FormControl, MenuItem, Select, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';

function ShowInVerifiedStage(props) {
  const {
    value = 6,
    onChange = () => {},
  } = props;

  const intl = useIntl();
  const countChoices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  return (
  <FormControl variant="filled">
    <InputLabel id="select-show-investibles-label">
      {intl.formatMessage({ id: 'showInvestiblesDropdownLabel' })}</InputLabel>
    <Select
      value={value}
      onChange={onChange}
    >
      {countChoices.map((count) => (
        <MenuItem key={count} value={count}>{count}</MenuItem>
      ))}
      <MenuItem value={0}>
        {intl.formatMessage({ id: 'showInvestiblesUnlimitedValue' })}
      </MenuItem>
    </Select>
    <Typography>
      {intl.formatMessage({ id: 'showInvestiblesDropdownHelp' })}
    </Typography>
  </FormControl>
  )
}

ShowInVerifiedStage.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
}

export default ShowInVerifiedStage;