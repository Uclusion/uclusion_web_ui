import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, Typography } from '@material-ui/core'
import Chip from '@material-ui/core/Chip'
import Avatar from '@material-ui/core/Avatar'
import InvestibleListItemTabs from './InvestibleListItemTabs'
import classNames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor'
import { withUserAndPermissions } from '../UserPermissions/UserPermissions'
import InvestibleDelete from './InvestibleDelete'

const styles = (theme) => ({
  headerBox: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  details: {
    alignItems: 'center'
  },

  helper: {},

  investment: {
    display: 'inline-block'
  },

  column: {
    flexBasis: '33.33%'
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
    width: '100%'
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
    const { investible, sharesAvailable, classes, teamId, intl, userPermissions } = this.props
    const { canDeleteMarketInvestible } = userPermissions
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography style={{ width: '100%' }}>
            <div style={{ marginBottom: '16px', marginRight: '-37px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              {investible.name}
              {canDeleteMarketInvestible && <InvestibleDelete investible={investible} />}
            </div>
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <div style={{ minWidth: 100 }}>Current Stage:</div>
              <div>
                <div>{investible.stage}</div>
                <div style={{ fontSize: 12 }}>{`${investible.quantity} uShares`}</div>
              </div>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ minWidth: 100 }}>Next Stage:</div>
              <div>
                <div>{investible.next_stage}</div>
                <div style={{ fontSize: 12 }}>{`Requires at least ${investible.next_stage_threshold} uShares`}</div>
              </div>
            </div>
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <div className={classes.wholeWidth}>
            <HtmlRichTextEditor style={{ minHeight: 'auto' }} value={investible.description} readOnly />
            <div className={classes.tabSection}>
              <InvestibleListItemTabs name={investible.name} quantity={investible.quantity} investibleId={investible.id} marketId={investible.market_id} teamId={teamId} sharesAvailable={sharesAvailable} />
            </div>
          </div>
        </ExpansionPanelDetails>
      </ExpansionPanel>
      // <ExpansionPanel>
      //   <ExpansionPanelSummary className={classes.details} expandIcon={<ExpandMoreIcon />}>
      //     <div className={classes.column}>
      //       <Typography>
      //         {investible.name} {investible.stage} {investible.next_stage}
      //       </Typography>
      //     </div>
      //     <div className={classes.column} />
      //     <div className={classNames(classes.column, classes.helper)}>
      //       {investible.current_user_investment > 0 && <Chip avatar={<Avatar>{intl.formatMessage({ id: 'ideaShareSymbol' })}</Avatar>} label={intl.formatMessage({ id: 'userCurrentInvestmentChip' }, { shares: investible.current_user_investment })} />}
      //       {investible.quantity > 0 && <Chip avatar={<Avatar>{intl.formatMessage({ id: 'ideaShareSymbol' })}</Avatar>} label={intl.formatMessage({ id: 'totalCurrentInvestmentChip' }, { shares: investible.quantity })} />}
      //       {investible.next_stage_threshold > 0 && <Chip avatar={<Avatar>{intl.formatMessage({ id: 'ideaShareSymbol' })}</Avatar>} label={intl.formatMessage({ id: 'investmentForNextStageChip' }, { shares: investible.next_stage_threshold })} />}
      //       {canDeleteMarketInvestible && <InvestibleDelete investible={investible} />}
      //     </div>
      //   </ExpansionPanelSummary>
      //   <ExpansionPanelDetails>
      //     <div className={classes.wholeWidth}>
      //       <HtmlRichTextEditor value={investible.description} readOnly />
      //       <div className={classes.tabSection}>
      //         <InvestibleListItemTabs name={investible.name} quantity={investible.quantity} investibleId={investible.id} marketId={investible.market_id} teamId={teamId} sharesAvailable={sharesAvailable} />
      //       </div>
      //     </div>
      //   </ExpansionPanelDetails>
      // </ExpansionPanel>
    )
  }
}

InvestibleListItem.propTypes = {
  investible: PropTypes.object.isRequired,
  sharesAvailable: PropTypes.number.isRequired,
  teamId: PropTypes.string.isRequired,
  userPermissions: PropTypes.object.isRequired
};

export default injectIntl(withStyles(styles)(withUserAndPermissions(InvestibleListItem)));
