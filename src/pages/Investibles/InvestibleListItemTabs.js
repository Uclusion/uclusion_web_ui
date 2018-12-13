import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import InvestibleInvest from './InvestibleInvest'

import { injectIntl } from 'react-intl'

const styles = theme => ({
  paper: {
    flexGrow: 1,
    width: '100%'
  },

  tabBar: {

  }
});

class InvestibleListItemTabs extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      value: 0
    }
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange = (event, value) => {
    this.setState({ value });
  };

  render () {
    const {classes, marketId, investibleId, intl, teamId, sharesAvailable} = this.props
    const { value } = this.state;
    return (
      <div className={classes.paper}>
          <Tabs value={value} className={classes.tabBar}
                onChange={this.handleChange}
                indicatorColor="primary"
                textColor="primary"
          >
            <Tab label={intl.formatMessage({id: 'investTab'})}/>
            <Tab label={intl.formatMessage({id: 'activityTab'})}/>
            <Tab label={intl.formatMessage({id: 'commentsTab'})}/>
          </Tabs>
        {value === 0 && <InvestibleInvest teamId={teamId} marketId={marketId} sharesAvailable={sharesAvailable} investibleId={investibleId}/>}
        {value === 1 && <div>Activity Placeholder</div>}
        {value === 2 && <div>Coments Placeholder</div>}
      </div>
    )
  }
}

InvestibleListItemTabs.propTypes = {
  classes: PropTypes.object.isRequired,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  teamId: PropTypes.string.isRequired,
  sharesAvailable: PropTypes.number.isRequired
}

export default injectIntl(withStyles(styles)(InvestibleListItemTabs));
