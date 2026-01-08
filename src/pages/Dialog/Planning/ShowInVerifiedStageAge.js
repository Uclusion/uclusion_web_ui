import React from 'react';
import PropTypes from 'prop-types';
import InputLabel from '@material-ui/core/InputLabel';
import { FormControl, MenuItem, Select, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';

function ShowInVerifiedStageAge(props) {
  const {
    value = 21,
    onChange = () => {},
  } = props;

  const intl = useIntl();

  return (
  <FormControl variant="filled">
    <InputLabel id="select-show-investibles-age-label">
      {intl.formatMessage({ id: 'showInvestiblesDropdownAgeLabel' })}</InputLabel>
    <Select
      value={value}
      onChange={onChange}
      style={{backgroundColor: "#ecf0f1"}}
    >
      <MenuItem value={0}>
        {intl.formatMessage({ id: 'showInvestiblesUnlimitedValue' })}
      </MenuItem>
      <MenuItem value={3}>3</MenuItem>
      <MenuItem value={7}>7</MenuItem>
      <MenuItem value={14}>14</MenuItem>
      <MenuItem value={21}>21</MenuItem>
      <MenuItem value={28}>28</MenuItem>
      <MenuItem value={35}>35</MenuItem>
      <MenuItem value={40}>40</MenuItem>
      <MenuItem value={50}>50</MenuItem>
      <MenuItem value={60}>60</MenuItem>
    </Select>
    <Typography>
      {intl.formatMessage({ id: 'showInvestiblesDropdownAgeHelp' })}
    </Typography>
  </FormControl>
  )
}

ShowInVerifiedStageAge.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func,
}

export default ShowInVerifiedStageAge;