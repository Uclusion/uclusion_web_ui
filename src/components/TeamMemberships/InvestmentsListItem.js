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
import { fetchUser, usersFetched } from '../../store/Users/actions';
import { loadTeams } from '../../utils/userMembershipFunctions';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';

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
    userPermissions,
  } = props;
  const { canListAccountTeams } = userPermissions;
  const [calculatedQuantity, setCalculatedQuantity] = useState(quantity);
  useEffect(() => {
    const {
      marketId,
      dispatch,
      teamId,
      teams,
      setTeams,
      allUsers,
      userId,
    } = props;
    if (calculatedQuantity === 0 && quantity > 0) {
      const clientPromise = getClient();
      let clientObject = null;
      clientPromise.then((client) => {
        clientObject = client;
        return client.markets.deleteInvestment(marketId, id);
      }).then((response) => {
        dispatch(investmentsDeleted(marketId, investible.id));
        dispatch(fetchUser({ marketId }));
        loadTeams(canListAccountTeams, marketId, setTeams);
      }).catch((error) => {
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
  teamId: PropTypes.string.isRequired,
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
)(injectIntl(withStyles(styles)(withMarketId(withUserAndPermissions(InvestmentsListItem)))));
