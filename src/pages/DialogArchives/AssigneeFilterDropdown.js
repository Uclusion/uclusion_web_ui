import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Select, MenuItem, FormControl, makeStyles,
} from '@material-ui/core';
import { useIntl } from 'react-intl';

const useStyles = makeStyles(() => ({
  white: {
    backgroundColor: '#ffffff',
  },
}));

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
    <div className={classes.white}>
      <FormControl>
        <Select
          value={value}
          displayEmpty
          onChange={onChange}
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
    </div>
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
