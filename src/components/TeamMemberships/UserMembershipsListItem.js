/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  Typography,
  Badge,
  Chip,
  Tabs,
  Tab,
} from '@material-ui/core';
import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import moment from 'moment';
import { injectIntl } from 'react-intl';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../PathProps/MarketId';
import MemberList from './MemberList';
import InvestiblesList from './InvestiblesList';

const styles = theme => ({
  root: {
    width: 400,
    minWidth: 400,
    padding: theme.spacing.unit,
    boxSizing: 'border-box',
  },
  container: {
    padding: theme.spacing.unit * 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  title: {
    marginBottom: 0,
  },
  ushares: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
  },
  lastInvestmentDate: {
    color: theme.palette.grey[600],
  },
  investiblesBadge: {
    right: -theme.spacing.unit,
    transform: 'translateY(-50%)',
  },
  tabBar: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  tab: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    overflowY: 'auto',
  },
});

function UserMembershipsListItem(props) {
  const [tabIndex, setTabIndex] = useState(0);

  const {
    team,
    investibles,
    marketId,
    classes,
    width,
  } = props;
  const {
    id,
    name,
    description,
    shared_quantity,
    team_size,
    quantity_invested,
    quantity,
    last_investment_updated_at,
  } = team;
  const isMobile = (width === 'xs');
  const lastInvestDate = moment(last_investment_updated_at).format('MM/DD/YYYY hh:mm A');

  const [users, setUsers] = useState(undefined);
  const [investments, setInvestments] = useState(undefined);

  function processUser(user) {
    const processed = { ...user };
    const marketPresence = user.market_presences.find(presence => presence.market_id === marketId);
    processed.quantity = marketPresence.quantity;
    processed.quantityInvested = marketPresence.quantity_invested;
    return processed;
  }

  function processInvestment(investibleId, investmentInfo) {
    // TODO hook to store for full investible
    return { lastInvestmentDate: investmentInfo.most_recent_investment_date };
  }

  function getInvestibles() {
    const userIds = users.map(user => user.id);
    const investiblesForTeam = investibles.filter(({ created_by }) => userIds.includes(created_by));
    return investiblesForTeam;
  }

  useEffect(() => {
    let globalClient;
    const clientPromise = getClient();
    clientPromise.then((client) => {
      globalClient = client;
      return client.teams.get(id);
    }).then((response) => {
      const processedUsers = response.users.map(user => processUser(user));
      _.remove(processedUsers, user => user.type !== 'USER');
      setUsers(processedUsers);
      return globalClient.teams.investments(id, marketId);
    }).then((investmentsDict) => {
      const processedInvestments = [];
      Object.keys(investmentsDict).forEach((investibleId) => {
        const investment = processInvestment(investibleId, investmentsDict[investibleId]);
        processedInvestments.push(investment);
      });
      if (processedInvestments.length > 0) {
        setInvestments(processedInvestments);
      }
    }).catch((error) => {
      console.log(error);
      console.log(investments); // Just to prevent compiler warning for now
      sendIntlMessage(ERROR, { id: 'teamMemberLoadFailed' });
    });
    return () => {};
  }, [marketId]);

  return (
    <div className={classes.root}>
      <Card className={classes.container}>
        <Typography className={classes.title} variant="h6" paragraph>
          {name}
        </Typography>
        {last_investment_updated_at && (
          <Typography className={classes.lastInvestmentDate}>
            {'Last invested at:  '}
            {lastInvestDate}
          </Typography>
        )}
        <div className={classes.ushares}>
          <Typography>uShares:</Typography>
          <Badge
            classes={{ badge: classes.investiblesBadge }}
            max={1000000}
            badgeContent={shared_quantity}
            color="primary"
          >
            <Chip
              label="Shared"
              variant="outlined"
            />
          </Badge>
          <Badge
            classes={{ badge: classes.investiblesBadge }}
            max={1000000}
            badgeContent={quantity}
            color="primary"
          >
            <Chip
              label="Available"
              variant="outlined"
            />
          </Badge>
          <Badge
            classes={{ badge: classes.investiblesBadge }}
            max={1000000}
            badgeContent={quantity_invested}
            color="primary"
          >
            <Chip
              label="Invested"
              variant="outlined"
            />
          </Badge>
        </div>
        <Typography>
          {description}
        </Typography>
        <Tabs
          value={tabIndex}
          className={classes.tabBar}
          onChange={(e, v) => setTabIndex(v)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            className={classes.tab}
            label={`${team_size} Members`}
          />
          <Tab
            className={classes.tab}
            label="Investibles"
          />
        </Tabs>
        <div className={classes.tabContent}>
          {tabIndex === 0 ? (
            <MemberList
              users={users}
            />
          ) : (
            <InvestiblesList
              investibles={getInvestibles()}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

UserMembershipsListItem.propTypes = {
  team: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    team_size: PropTypes.number,
    shared_amount: PropTypes.number,
  }).isRequired,
  investibles: PropTypes.arrayOf(PropTypes.object),
  classes: PropTypes.object.isRequired,
  width: PropTypes.string.isRequired,
};

export default injectIntl(withWidth()(withStyles(styles)(withMarketId(UserMembershipsListItem))));
