/* eslint-disable react/forbid-prop-types */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { DeleteForever } from '@material-ui/icons';
import {
  IconButton,
  Paper,
  Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../PathProps/MarketId';
import { investmentsDeleted } from '../../store/MarketInvestibles/actions';

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  link: {
    textDecoration: 'none',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
  },
  email: {
    marginBottom: theme.spacing.unit,
  },
});

function InvestmentsListItem(props) {
  const {
    investible,
    quantity,
    classes,
    userIsOwner,
  } = props;
  const [calculatedQuantity, setCalculatedQuantity] = useState(quantity);
  useEffect(() => {
    const {
      marketId,
      dispatch,
      teams,
      setTeams,
      users,
      setUsers,
      userId,
    } = props;
    if (calculatedQuantity === 0 && quantity > 0) {
      const clientPromise = getClient();
      clientPromise.then(client => client.markets.deleteInvestments(marketId, investible.id))
        .then((response) => {
          dispatch(investmentsDeleted(marketId, investible.id, response.quantity));
          const teamQuantities = response.team_quantities;
          const newTeams = [];
          Object.keys(teamQuantities).forEach((teamId) => {
            const oldTeam = teams.find(item => item.id === teamId);
            const newTeam = { ...oldTeam };
            newTeam.quantity += teamQuantities[teamId];
            newTeam.quantity_invested -= teamQuantities[teamId];
            newTeams.push(newTeam);
          });
          setTeams(_.unionBy(newTeams, teams, 'id'));
          const oldUser = users[userId];
          const newUser = { ...oldUser };
          newUser.quantity += response.quantity;
          newUser.quantityInvested -= response.quantity;
          const newUsers = { ...users };
          newUsers[userId] = newUser;
          setUsers(newUsers);
        })
        .catch((error) => {
          setCalculatedQuantity(quantity);
          console.log(error);
          sendIntlMessage(ERROR, { id: 'refundFailed' });
        });
    }
    return () => {};
  }, [calculatedQuantity]);
  return (
    <Paper className={classes.paper}>
      <div className={classes.content}>
        <div className={classes.infoContainer}>
          <Typography className={classes.username}>{investible.name}</Typography>
          <Typography>
            {`uShares invested: ${calculatedQuantity}`}
          </Typography>
          {userIsOwner && (
          <IconButton onClick={() => setCalculatedQuantity(0)}><DeleteForever /></IconButton>
          )}
        </div>
      </div>
    </Paper>
  );
}

InvestmentsListItem.propTypes = {
  investible: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  marketId: PropTypes.string.isRequired,
  quantity: PropTypes.number.isRequired,
  userIsOwner: PropTypes.bool.isRequired,
  classes: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  teams: PropTypes.arrayOf(PropTypes.object), //eslint-disable-line
  setTeams: PropTypes.func, //eslint-disable-line
  userId: PropTypes.string.isRequired,
  users: PropTypes.object.isRequired, //eslint-disable-line
  setUsers: PropTypes.func, //eslint-disable-line
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(withStyles(styles)(withMarketId(InvestmentsListItem))));
