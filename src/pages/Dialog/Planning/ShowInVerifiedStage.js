import React from 'react';
import PropTypes from 'prop-types';
import InputLabel from '@material-ui/core/InputLabel';
import { FormControl, MenuItem, Select, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';

function ShowInVerifiedStage(props) {
  const {
    value = 3,
    onChange = () => {},
  } = props;

  const intl = useIntl();

  return (
  <FormControl variant="filled">
    <InputLabel id="select-show-investibles-label">
      {intl.formatMessage({ id: 'showInvestiblesDropdownLabel' })}</InputLabel>
    <Select
      value={value}
      onChange={onChange}
      style={{backgroundColor: "#ecf0f1"}}
    >
      <MenuItem value={0}>
        {intl.formatMessage({ id: 'showInvestiblesUnlimitedValue' })}
      </MenuItem>
      <MenuItem value={1}>1</MenuItem>
      <MenuItem value={2}>2</MenuItem>
      <MenuItem value={3}>3</MenuItem>
      <MenuItem value={4}>4</MenuItem>
      <MenuItem value={5}>5</MenuItem>
      <MenuItem value={6}>6</MenuItem>
      <MenuItem value={7}>7</MenuItem>
      <MenuItem value={8}>8</MenuItem>
      <MenuItem value={9}>9</MenuItem>
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