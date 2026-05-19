import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Select, MenuItem, FormControl, makeStyles, FormHelperText } from '@material-ui/core';
import { useIntl } from 'react-intl';

const useStyles = makeStyles((theme) => {
  return {
    label: {
      color: theme.palette.text.primary,
    },
    select: {
      color: theme.palette.text.primary,
      '&:before': {
        borderColor: theme.palette.text.primary,
      },
      '&:after': {
        borderColor: theme.palette.text.primary,
      },
    },
    icon: {
      fill: theme.palette.text.primary,
    },
  };
});

function AssigneeFilterDropdown(props) {
  const {
    presences = [],
    value = '',
    onChange = () => {},
  } = props;

  const intl = useIntl();
  const classes = useStyles();
  const sortedPresences = _.sortBy(presences, 'name');

  function getItems() {
    return sortedPresences.map((presence) => {
      const {
        id, name,
      } = presence;
      return (
        <MenuItem
          key={id}
          value={id}
        >
          {name}
        </MenuItem>
      );
    });
  }

  return (
    <FormControl>
      <FormHelperText className={classes.label}>{intl.formatMessage({ id: 'assigneeFilterLabel' })}</FormHelperText>
      <Select
        value={value}
        displayEmpty
        onChange={onChange}
        className={classes.select}
        inputProps={{
          classes: {
            icon: classes.icon,
          },
        }}
      >
        <MenuItem
          key="all"
          value=""
        >
          {intl.formatMessage({ id: 'assigneeFilterDropdownAll' })}
        </MenuItem>
        {getItems()}
      </Select>

    </FormControl>
  );
}

AssigneeFilterDropdown.propTypes = {
  presences: PropTypes.arrayOf(PropTypes.object),
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default AssigneeFilterDropdown;
