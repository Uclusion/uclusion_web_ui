import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx';
import { CardContent } from '@material-ui/core'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import AddNewUsers from './AddNewUsers'

function ManageUsers (props) {
  const {
    market, isInbox, name, group
  } = props;
  const classes = usePlanFormStyles();

  return (
    <>
      <CardContent className={clsx(classes.cardContent, classes.nestedCard)} style={{paddingBottom: '1rem',
        paddingTop: isInbox ? 0 : undefined}}>
        <AddNewUsers market={market} isInbox={isInbox} name={name} group={group} />
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