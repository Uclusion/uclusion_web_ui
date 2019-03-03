/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Button,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import InvestiblesList from './InvestiblesList';

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit * 2,
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
  state = {
    investiblesVisible: false,
  };

  toggleInvestibles = () => {
    this.setState({ investiblesVisible: !this.state.investiblesVisible });
  }

  render() {
    const { user, investibles, classes } = this.props;
    const { investiblesVisible } = this.state;
    const { name = 'Anonymous', quantity, quantityInvested } = user;
    // for now, don't bother rendering the TEAM user

    return (
      <Grid item xs={12}>
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
            {investibles.length > 0 && (
              <Button
                color="primary"
                size="medium"
                onClick={this.toggleInvestibles}
              >
                  {investiblesVisible ? 'Hide investibles' : `View all ${investibles.length} investibles`}
              </Button>
            )}
          </div>
          {investiblesVisible && <InvestiblesList investibles={investibles} />}
        </Paper>
      </Grid>
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
  investibles: PropTypes.arrayOf(PropTypes.object),
  classes: PropTypes.object.isRequired,
};


export default injectIntl(withStyles(styles)(MemberListItem));
