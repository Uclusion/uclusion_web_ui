import React from 'react';
import PropTypes from 'prop-types';
import { CardContent } from '@material-ui/core';
import { usePlanFormStyles } from '../../../components/AgilePlan';
import AddNewUsers from './AddNewUsers';
import ExistingUsers from './ExistingUsers';


function ManageUsers (props) {
  const {
    market,
    onAddNewUsers
  } = props;
  const classes = usePlanFormStyles();



  return (
      <CardContent className={classes.cardContent}>
        <ExistingUsers
          market={market}/>
        <AddNewUsers
          market={market}
          onSave={onAddNewUsers}
        />
      </CardContent>

  );
}

ManageUsers.propTypes = {
  market: PropTypes.object.isRequired,
  onAddNewUsers: PropTypes.func,
};

ManageUsers.defaultProps = {
  onAddNewUsers: () => {}
};

export default ManageUsers;