import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, Typography} from '@material-ui/core'
import Chip from '@material-ui/core/Chip'
import InvestibleListItemTabs from './InvestibleListItemTabs'
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'
const styles = (theme) => ({
  headerBox: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  details: {
    alignItems: 'center',
  },

  helper: {

  },

  column: {
    flexBasis: '33.33%',
  },

  mainGrid: {
    padding: theme.spacing.unit * 2,
    justifyContent: 'flex-end'
  },

  tabSection: {
    borderTop: `1px solid ${theme.palette.divider}`,
    display: 'block'
  },

  wholeWidth: {
    flexBasis: '100%'
  }
})

class InvestibleListItem extends Component {
  constructor (props) {
    super(props)

    this.state = { investOpen: false }
    this.investOnClick = this.investOnClick.bind(this)
    this.handleInvestModalClose = this.handleInvestModalClose.bind(this)
  }

  investOnClick () {
    this.setState({ investOpen: true })
  }''

  handleInvestModalClose () {
    this.setState({ investOpen: false })
  }

  render () {
    const {name, description, quantity, id, sharesAvailable, marketId, classes, currentInvestment, intl} = this.props
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary className={classes.details} expandIcon={<ExpandMoreIcon/>}>
          <Typography className={classes.column}>
            {name}
          </Typography>
          <div className={classes.column}/>
          <div className={classNames(classes.column, classes.helper)}>
            {currentInvestment > 0 && <Chip label={intl.formatMessage({id: 'currentInvestmentChip'}, {shares: currentInvestment})}/>}
          </div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <div className={classes.wholeWidth}>
            <Typography>
              {description}
            </Typography>

            <div className={classes.tabSection}>
              <InvestibleListItemTabs name={name}
                                      quantity={quantity} investibleId={id} marketId={marketId}
                                      sharesAvailable={sharesAvailable}
              />
            </div>
          </div>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }
}

InvestibleListItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  quantity: PropTypes.number.isRequired,
  marketId: PropTypes.string.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  sharesAvailable: PropTypes.number.isRequired,
  currentInvestment: PropTypes.number.isRequired
}

export default injectIntl(withStyles(styles)(InvestibleListItem));
