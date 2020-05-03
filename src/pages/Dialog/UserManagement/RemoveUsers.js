import React from 'react'
import PropTypes from 'prop-types'
import { CardContent } from '@material-ui/core'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import ExistingUsers from './ExistingUsers'

function RemoveUsers(props) {
  const {
    market,
  } = props;
  const classes = usePlanFormStyles();

  return (
      <CardContent className={classes.cardContent}>
        <ExistingUsers
          market={market}/>
      </CardContent>
  );
}

RemoveUsers.propTypes = {
  market: PropTypes.object.isRequired,
};

export default RemoveUsers;