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

class InvestmentsListItem extends React.PureComponent {
  render() {
    const { investible, quantity, classes } = this.props;

    return (
      <Paper className={classes.paper}>
        <div className={classes.content}>
          <div className={classes.infoContainer}>
            <Typography className={classes.username}>{investible.name}</Typography>
            <Typography>
              {`uShares invested: ${quantity}`}
            </Typography>
          </div>
        </div>
      </Paper>
    );
  }
}

InvestmentsListItem.propTypes = {
  investible: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  quantity: PropTypes.number.isRequired,
  classes: PropTypes.object.isRequired,
};


export default injectIntl(withStyles(styles)(InvestmentsListItem));
