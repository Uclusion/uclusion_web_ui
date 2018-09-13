import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Paper from '@material-ui/core/Paper'
import AppBar from '@material-ui/core/AppBar';
import InvestibleInvest from './InvestibleInvest'

import { injectIntl } from 'react-intl'

const styles = theme => ({
  paper: {
    flexGrow: 1,
    width: '100%'
  },

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
    const {classes, marketId, investibleId, intl, sharesAvailable} = this.props
    const { value } = this.state;
    return (
      <div className={classes.paper}>
          <Tabs value={value}
                onChange={this.handleChange}
                indicatorColor="primary"
                textColor="primary"
          >
            <Tab label={intl.formatMessage({id: 'investButton'})}/>
          </Tabs>
        {value == 0 && <InvestibleInvest marketId={marketId} sharesAvailable={sharesAvailable} investibleId={investibleId}/>}
      </div>
    )
  }
}

InvestibleListItemTabs.propTypes = {
  classes: PropTypes.object.isRequired,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  sharesAvailable: PropTypes.number.isRequired
}

export default injectIntl(withStyles(styles)(InvestibleListItemTabs));
