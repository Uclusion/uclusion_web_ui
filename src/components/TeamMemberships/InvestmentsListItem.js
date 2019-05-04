/* eslint-disable react/forbid-prop-types */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import Button from '@material-ui/core/Button';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../PathProps/MarketId';
import { investmentsDeleted } from '../../store/MarketInvestibles/actions';
import { getAllUsers } from '../../store/Users/reducer';
import { usersFetched } from '../../store/Users/actions';

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
  investButton: {
    marginLeft: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
});

function InvestmentsListItem(props) {
  const {
    id,
    stageId,
    investible,
    quantity,
    createdAt,
    classes,
    userIsOwner,
    intl,
  } = props;
  const [calculatedQuantity, setCalculatedQuantity] = useState(quantity);
  useEffect(() => {
    const {
      marketId,
      dispatch,
      teams,
      setTeams,
      allUsers,
      userId,
    } = props;
    if (calculatedQuantity === 0 && quantity > 0) {
      const clientPromise = getClient();
      clientPromise.then(client => client.markets.deleteInvestment(marketId, id))
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
          const oldUser = allUsers[userId];
          const newUser = { ...oldUser };
          newUser.quantity += response.quantity;
          newUser.quantityInvested -= response.quantity;
          dispatch(usersFetched({ [userId]: newUser }));
        })
        .catch((error) => {
          setCalculatedQuantity(quantity);
          console.log(error);
          sendIntlMessage(ERROR, { id: 'refundFailed' });
        });
    }
    return () => {};
  }, [calculatedQuantity]);

  // if we don't have the investible at least we can render the presence of the investment, but not the name
  const investibleName = (investible && investible.name) || '';

  const dateFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  };
  const createdTimestamp = intl.formatDate(createdAt, dateFormatOptions);
  const investmentDate = intl.formatMessage({ id: 'investmentListDateInvested' }, {
    date: createdTimestamp,
  });

  function canRefundInvestment(){
    const isOwnerAndElgible = userIsOwner && calculatedQuantity > 0;
    const sameStage = investible.stage === stageId;
    // console.debug("Investible stage: " + investible.stage + " investment stage: " + stageId);
    return isOwnerAndElgible && sameStage;
  }

  return (
    <Paper className={classes.paper}>
      <div className={classes.content}>
        <div className={classes.infoContainer}>
          <Typography className={classes.username}>{investibleName}</Typography>
          <Typography>{investmentDate}</Typography>
          <Typography>
            {intl.formatMessage({ id: 'investmentListSharesInvested' }, { quantity: calculatedQuantity })}
          </Typography>
          {canRefundInvestment() && (
            <div>
              <br/>
              <Button
                className={classes.investButton}
                variant="outlined"
                color="secondary"
                onClick={() => setCalculatedQuantity(0)}
              >
                {intl.formatMessage({ id: 'unInvestButton' })}
              </Button>
            </div>
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
    stage: PropTypes.string,
  }).isRequired,
  marketId: PropTypes.string.isRequired,
  quantity: PropTypes.number.isRequired,
  userIsOwner: PropTypes.bool.isRequired,
  classes: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  teams: PropTypes.arrayOf(PropTypes.object), //eslint-disable-line
  setTeams: PropTypes.func, //eslint-disable-line
  userId: PropTypes.string.isRequired,
  allUsers: PropTypes.object.isRequired, //eslint-disable-line
  intl: PropTypes.object.isRequired,
  stageId: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  createdAt: PropTypes.instanceOf(Date).isRequired,
};

const mapStateToProps = state => ({
  allUsers: getAllUsers(state.usersReducer),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(withStyles(styles)(withMarketId(InvestmentsListItem))));
