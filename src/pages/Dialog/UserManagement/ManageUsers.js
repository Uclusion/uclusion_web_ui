import React from 'react'
import PropTypes from 'prop-types'
import { CardContent } from '@material-ui/core'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import AddNewUsers from './AddNewUsers'

function ManageUsers (props) {
  const {
    market,
    onAddNewUsers,
    onNavCancel
  } = props;
  const classes = usePlanFormStyles();



  return (
      <CardContent className={classes.cardContent}>
        <AddNewUsers
          market={market}
          onSave={onAddNewUsers}
          onCancel={onNavCancel}
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