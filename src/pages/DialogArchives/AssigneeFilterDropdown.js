import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Select, MenuItem, FormControl, makeStyles, FormHelperText } from '@material-ui/core';
import { useIntl } from 'react-intl';

const useStyles = makeStyles(() => {
  return {
    white: {
      color: '#ffffff',
    },
    select: {
      color: '#ffffff',
      '&:before': {
        borderColor: '#ffffff',
      },
      '&:after': {
        borderColor: '#ffffff',
      },
    },
    icon: {
      fill: '#ffffff',
    },
  };
});

function AssigneeFilterDropdown(props) {
  const {
    presences,
    value,
    onChange,
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
      <FormHelperText className={classes.white}>{intl.formatMessage({ id: 'assigneeFilterLabel' })}</FormHelperText>
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

AssigneeFilterDropdown.defaultProps = {
  presences: [],
  value: '',
  onChange: () => {
  },
};

export default AssigneeFilterDropdown;
