import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import { injectIntl } from 'react-intl';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';
import InvestibleInvest from './InvestibleInvest';


const styles = theme => ({
  paper: {
    flexGrow: 1,
    width: '100%',
  },
  tab: {
    minWidth: 'auto',
    flex: 1,
  },
  tabBar: {
    marginBottom: theme.spacing.unit * 2,
  },
});

class InvestibleListItemTabs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 0,
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange = (event, value) => {
    this.setState({ value });
  };

  render() {
    const {
      classes,
      marketId,
      investibleId,
      intl,
      teamId,
      sharesAvailable,
      currentUserInvestment,
      userPermissions,
    } = this.props;
    const { canInvest } = userPermissions;
    const { value } = this.state;

    return (
      <div className={classes.paper}>
        <Tabs
          value={value}
          className={classes.tabBar}
          onChange={this.handleChange}
          indicatorColor="primary"
          textColor="primary"
        >
          {canInvest && (
            <Tab className={classes.tab} label={intl.formatMessage({ id: 'investTab' })} />
          )}
          <Tab className={classes.tab} label={intl.formatMessage({ id: 'activityTab' })} />
          <Tab className={classes.tab} label={intl.formatMessage({ id: 'commentsTab' })} />
        </Tabs>
        {value === 0 && canInvest && (
          <InvestibleInvest
            teamId={teamId}
            marketId={marketId}
            sharesAvailable={sharesAvailable}
            currentUserInvestment={currentUserInvestment}
            investibleId={investibleId}
          />
        )}
        {value === 1 && <Typography>Activity Placeholder</Typography>}
        {value === 2 && <Typography>Coments Placeholder</Typography>}
      </div>
    );
  }
}

InvestibleListItemTabs.propTypes = {
  classes: PropTypes.object.isRequired,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  teamId: PropTypes.string.isRequired,
  sharesAvailable: PropTypes.number.isRequired,
  currentUserInvestment: PropTypes.number.isRequired,
};

export default injectIntl(withStyles(styles)(withUserAndPermissions(InvestibleListItemTabs)));
