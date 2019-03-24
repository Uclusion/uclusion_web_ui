import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';
import InvestibleInvest from './InvestibleInvest';
import CommentsList from './Comments/CommentsList';
import { withBackgroundProcesses } from "../BackgroundProcesses/BackgroundProcessWrapper";
import { getCurrentUser } from '../../store/Users/reducer';

const styles = theme => ({
  paper: {
    flexGrow: 1,
    width: '100%',
  },
  tab: {
    minWidth: 'unset',
    maxWidth: 'unset',
    flex: 1,
  },
  tabBar: {
    marginBottom: theme.spacing.unit * 2,
  },
});

class InvestibleListItemTabs extends React.PureComponent {
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
      user,
      currentUserInvestment,
      userPermissions,
    } = this.props;
    const { canInvest, canReadComments } = userPermissions;
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
            <Tab className={classes.tab} label={intl.formatMessage({ id: 'investTab' })}/>
          )}
          { canReadComments && (<Tab
            className={classes.tab}
            label={intl.formatMessage({ id: 'commentsTab' })}
          />)}
        </Tabs>
        {value === 0 && canInvest && user && (
          <InvestibleInvest
            teamId={user.default_team_id}
            marketId={marketId}
            sharesAvailable={user.market_presence.quantity}
            currentUserInvestment={currentUserInvestment}
            investibleId={investibleId}
          />
        )}
        {value === 1 && <CommentsList marketId={marketId} currentUserInvestment={currentUserInvestment} investibleId={investibleId}/>}
        {value === 2 && <Typography>Coments Placeholder</Typography>}
      </div>
    );
  }
}

InvestibleListItemTabs.propTypes = {
  classes: PropTypes.object.isRequired,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  user: PropTypes.object,
  currentUserInvestment: PropTypes.number.isRequired,
  userPermissions: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  user: getCurrentUser(state.usersReducer),
});

function mapDispatchToProps(dispatch){
  return { dispatch };
}

export default withBackgroundProcesses(connect(mapStateToProps, mapDispatchToProps)(injectIntl(withStyles(styles)(withUserAndPermissions(InvestibleListItemTabs)))));
