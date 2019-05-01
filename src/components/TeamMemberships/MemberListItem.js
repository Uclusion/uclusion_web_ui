/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Paper,
  Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';

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

class MemberListItem extends React.PureComponent {
  render() {
    const { user, classes, intl } = this.props;
    const {
      name = 'Anonymous',
      email,
      quantity,
      quantityInvested,
    } = user;
    // for now, don't bother rendering the TEAM user

    return (
      <Paper className={classes.paper}>
        <Link className={classes.link} to={`#user:${user.id}`}>
          <div className={classes.content}>
            <div className={classes.infoContainer}>
              <Typography className={classes.username}>{name}</Typography>
              <Typography className={classes.email}>{email}</Typography>
              <Typography>
                {intl.formatMessage({ id: 'teamMembershipsMemberListItemUsharesAvailable' }, { quantity })}
              </Typography>
              <Typography>
                {intl.formatMessage({ id: 'teamMembershipsMemberListItemUsharesSpent' }, { quantityInvested })}
              </Typography>
            </div>
          </div>
        </Link>
      </Paper>
    );
  }
}

MemberListItem.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    quantity: PropTypes.number,
    quantityInvested: PropTypes.number,
  }).isRequired,
  classes: PropTypes.object.isRequired,
  intl: PropTypes.func.isRequired,
};


export default injectIntl(withStyles(styles)(MemberListItem));
