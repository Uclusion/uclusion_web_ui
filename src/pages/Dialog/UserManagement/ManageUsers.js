import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx';
import { CardContent } from '@material-ui/core'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import AddNewUsers from './AddNewUsers'

function ManageUsers (props) {
  const {
    market
  } = props;
  const classes = usePlanFormStyles();

  return (
    <>
      <CardContent className={clsx(classes.cardContent, classes.nestedCard)} style={{paddingBottom: '1rem'}}>
        <AddNewUsers market={market} />
      </CardContent>
    </>
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