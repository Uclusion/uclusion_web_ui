/* eslint-disable react/forbid-prop-types */
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
import { fetchInvestibles } from '../../api/marketInvestibles';
import { investmentsDeleted } from '../../store/MarketInvestibles/actions';
import { fetchSelf, loadTeams } from '../../api/users';

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
    user,
  } = props;
  const { isAdmin } = user.market_presence.flags;
  const [calculatedQuantity, setCalculatedQuantity] = useState(quantity);
  useEffect(() => {
    const {
      marketId,
      dispatch,
      setTeams,
    } = props;
    if (calculatedQuantity === 0 && quantity > 0) {
      const clientPromise = getClient();
      clientPromise.then((client) => {
        return client.markets.deleteInvestment(marketId, id);
      }).then(() => {
        dispatch(investmentsDeleted(marketId, investible.id));
      }).all([
        fetchSelf(dispatch),
        // refetch the investible to trigger a reload of team investible info
        fetchInvestibles([investible.id], marketId, dispatch),
      ]).then(() => {
        loadTeams(isAdmin, marketId, setTeams);
      }).catch((error) => { //eslint-disable-line
        setCalculatedQuantity(quantity);
        console.error(error);
        sendIntlMessage(ERROR, { id: 'refundFailed' });
      });
    }
    return () => {};
  }, [calculatedQuantity]);

  // if we don't have the investible we can render the presence of the investment, but not the name
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

  function canRefundInvestment() {
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
  setTeams: PropTypes.func, //eslint-disable-line
  intl: PropTypes.object.isRequired,
  stageId: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  createdAt: PropTypes.instanceOf(Date).isRequired,
  user: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(withStyles(styles)(withMarketId(InvestmentsListItem))));
