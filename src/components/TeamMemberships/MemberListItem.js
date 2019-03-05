/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import React from 'react';
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
});

class MemberListItem extends React.PureComponent {
  render() {
    const { user, classes } = this.props;
    const { name = 'Anonymous', quantity, quantityInvested } = user;
    // for now, don't bother rendering the TEAM user

    return (
      <Paper className={classes.paper}>
        <div className={classes.content}>
          <div className={classes.infoContainer}>
            <Typography className={classes.username}>{name}</Typography>
            <Typography>
              {`uShares available: ${quantity}`}
            </Typography>
            <Typography>
              {`uShares spent: ${quantityInvested}`}
            </Typography>
          </div>
        </div>
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
};


export default injectIntl(withStyles(styles)(MemberListItem));
