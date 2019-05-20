import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { Card, Typography } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import classNames from 'classnames';


const styles = theme => ({
  root: {
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
  },
  card: {
    marginBottom: theme.spacing.unit,
    padding: theme.spacing.unit * 1.5,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  link: {
    textDecoration: 'none',
  },
  content: {
    fontWeight: 500,
    display: 'flex',
    justifyContent: 'space-between',
  },
  flex: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  itemLabel: {
    minWidth: 100,
  },
  row: {

  },
  itemContent: {
    flex: 1,
  },
});



function sortInvestors(users) {
  return _.sortBy(users, 'team_name');
}

function sortAdmins(users) {
  return _.sortBy(users, 'name');
}

function sortSubscribers(users) {
  return _.sortBy(users, 'name');
}

function getBucketedUsers(users, myTeam) {
  // crappy awkward code but it's fast to write
  const isMyTeam = user => user.default_team_id === myTeam;
  const subscriberOnly = user => !isMyTeam(user) && user.quantity_invested < 1;
  const investor = user => user.quantity_invested > 0;
  const onMyTeam = users.filter(isMyTeam);
  const sortedOnMyTeam = sortAdmins(onMyTeam);
  const subscribed = users.filter(subscriberOnly);
  const sortedSubscribed = sortSubscribers(subscribed);
  const investors = users.filter(investor);
  const sortedInvestors = sortInvestors(investors);
  const mySorted = {
    onMyTeam: sortedOnMyTeam,
    investors: sortedInvestors,
    subscribed: sortedSubscribed,
  };
  return mySorted;
}


function WorkgroupList(props) {

  const { classes, users, teamId, marketId, intl } = props;
  const bucketedUsers = getBucketedUsers(users, teamId);


  function getUserDetails(user) {
    return (
      <Typography component="div">
        <div className={classNames(classes.flex, classes.row)}>
              <span className={classes.itemLabel}>
                {intl.formatMessage({ id: 'workgroupListName' })}
              </span>
          <div className={classes.itemContent}>
            <div>{user.name}</div>
          </div>
        </div>
        <div className={classNames(classes.flex, classes.row)}>
              <span className={classes.itemLabel}>
                {intl.formatMessage({ id: 'workgroupListEmail' })}
              </span>
          <div className={classes.itemContent}>
            <div>{user.email}</div>
          </div>
        </div>
      </Typography>
    );
  }


  function getMyTeamMember(user) {
    return (
      <Card key={user.id} className={classes.card}>
        <Link className={classes.link} to={`/${marketId}/teams#team:${user.default_team_id}`}>
          <Typography color={'primary'}>{intl.formatMessage({ id: 'workgroupListYourTeam' })}</Typography>
          {getUserDetails(user)}
        </Link>
      </Card>
    );
  }

  function getSubscriber(user) {
    return (
      <Card key={user.id} className={classes.card}>
        <Link className={classes.link} to={`/${marketId}/teams#team:${user.default_team_id}`}>
          <Typography color={'inherit'}>{intl.formatMessage({ id: 'workgroupListSubscribed' })}</Typography>
          {getUserDetails(user)}
        </Link>
      </Card>
    );
  }

  function getInvestor(user) {
    return (
      <Card key={user.id} className={classes.card}>
        <Link className={classes.link} to={`/${marketId}/teams#team:${user.default_team_id}`}>
          <Typography color={'secondary'}>{intl.formatMessage({ id: 'workgroupListInvestor' })}</Typography>
          {getUserDetails(user)}
          <Typography component="div">
            <div className={classNames(classes.flex, classes.row)}>
              <span className={classes.itemLabel}>
                {intl.formatMessage({ id: 'workgroupListTeam' })}
              </span>
              <div className={classes.itemContent}>
                <div>{user.team_name}</div>
              </div>
            </div>
            <div className={classNames(classes.flex, classes.row)}>
              <span className={classes.itemLabel}>
                {intl.formatMessage({ id: 'workgroupListQuantityInvested' })}
              </span>
              <div className={classes.itemContent}>
                <div>{user.quantity_invested}</div>
              </div>
            </div>
          </Typography>
        </Link>
      </Card>
    );
  }


  return (
    <div className={classes.root}>
      {bucketedUsers.onMyTeam.map(user => getMyTeamMember(user))}
      {bucketedUsers.investors.map(user => getInvestor(user))}
      {bucketedUsers.subscribed.map(user => getSubscriber(user))}
    </div>
  );

}

WorkgroupList.propTypes = {
  classes: PropTypes.object.isRequired,
  users: PropTypes.array.isRequired,
  marketId: PropTypes.string.isRequired,
  teamId: PropTypes.string.isRequired,
  intl: PropTypes.object.isRequired,
};

export default injectIntl(withStyles(styles)(WorkgroupList));
