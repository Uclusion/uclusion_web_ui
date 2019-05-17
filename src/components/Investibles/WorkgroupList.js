import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { Card, Typography } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import _ from 'lodash';

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
});

class WorkgroupList extends React.PureComponent {
  render() {
    const { classes, users, marketId } = this.props;
    const sortedUsers = _.sortBy(users, ['team_name', 'quantity_invested']);
    return (
      <div className={classes.root}>
        {sortedUsers.map(user => (
          <Card key={user.id} className={classes.card}>
            <Link className={classes.link} to={`/${marketId}/teams#team:${user.default_team_id}`}>
              <Typography className={classes.content} component="div">
                <b>{user.team_name}</b>
                <b>{user.name}</b>
                {user.invested_quantity}
                {user.email}
              </Typography>
            </Link>
          </Card>
        ))}
      </div>
    );
  }
}

WorkgroupList.propTypes = {
  classes: PropTypes.object.isRequired,
  users: PropTypes.array.isRequired,
  marketId: PropTypes.string.isRequired,
};

export default injectIntl(withStyles(styles)(WorkgroupList));
