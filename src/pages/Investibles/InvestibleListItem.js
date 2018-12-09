import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, Typography} from '@material-ui/core'
import Chip from '@material-ui/core/Chip'
import Avatar from '@material-ui/core/Avatar';
import InvestibleListItemTabs from './InvestibleListItemTabs'
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'
import HtmlRichTextEditor from '../../components/TextEditors/HtmlRichTextEditor'

import { toast } from 'react-toastify'
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

  investment: {
    display: 'inline-block'
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
  }

  handleInvestModalClose () {
    this.setState({ investOpen: false })
  }


  render () {
    const {name, description, quantity, id, sharesAvailable, marketId, classes, teamId, currentInvestment, intl} = this.props
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary className={classes.details} expandIcon={<ExpandMoreIcon/>}>
          <div className={classes.column}>
            <Typography>
              {name}
            </Typography>
          </div>
          <div className={classes.column}/>
          <div className={classNames(classes.column, classes.helper)}>
            {currentInvestment > 0 && <Chip avatar={<Avatar>{intl.formatMessage({id: 'ideaShareSymbol'})}</Avatar>} label={intl.formatMessage({id: 'userCurrentInvestmentChip'}, {shares: currentInvestment})}/>}
            {quantity > 0 && <Chip avatar={<Avatar>{intl.formatMessage({id: 'ideaShareSymbol'})}</Avatar>} label={intl.formatMessage({id: 'totalCurrentInvestmentChip'}, {shares: quantity})}/>}
          </div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <div className={classes.wholeWidth}>
            <HtmlRichTextEditor value={description} readOnly={true}/>
            <div className={classes.tabSection}>
              <InvestibleListItemTabs name={name}
                                      quantity={quantity} investibleId={id} marketId={marketId} teamId={teamId}
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
  currentInvestment: PropTypes.number.isRequired,
  teamId: PropTypes.string.isRequired
}

export default injectIntl(withStyles(styles)(InvestibleListItem));
