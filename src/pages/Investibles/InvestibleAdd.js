import React from 'react'
import PropTypes from 'prop-types'

import GlobalState from 'uclusion-shell/lib/utils/GlobalState'
import { Activity } from 'uclusion-shell'

import MenuItem from '@material-ui/core/MenuItem'
import { Button, TextField } from '@material-ui/core'

import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createMarketInvestible } from '../../containers/MarketInvestibles/actions'

//get my editor
import HtmlRichTextEditor from '../../components/HtmlRichTextEditor'

import { fetchMarketCategories } from '../../containers/Markets/actions'
import { getCurrentMarketId, getCategoriesFetching, getMarketCategories } from '../../containers/Markets/reducer'
import { getCurrentUser } from '../../containers/Users/reducer'

const styles = theme => ({

  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  editor: {
    border: '1px solid'
  }

})

class InvestibleAdd extends React.Component {

  constructor (props) {
    super(props)
    this.state = {title: '', category: ''}
    this.handleFieldChange = this.handleFieldChange.bind(this)
    this.onSave = this.onSave.bind(this)
    this.readMarketCategories = this.readMarketCategories.bind(this)
    this.onSave = this.onSave.bind(this)
    this.getCategoriesMenu = this.getCategoriesMenu.bind(this)
    this.getCategories = this.getCategories.bind(this)
  }

  componentDidMount () {
    console.log('Attempting to read market categories')
    this.readMarketCategories()
  }

  handleFieldChange = (name) => (event) => {
    let value = event.target.value
    this.setState({
      [name]: value
    })
  }

  readMarketCategories () {
    const {dispatch, marketId} = this.props
    dispatch(fetchMarketCategories({marketId}))
  }

  onSave () {
    const {dispatch, marketId, user} = this.props
    const {title, description, category} = this.state
    const teamId = user.default_team_id //TODO:  might change later, so keeping it separate
    const payload = {marketId, category, teamId, title, description}
    dispatch(createMarketInvestible(payload))
  }

  getCategories () {
    const {marketCategories, marketId} = this.props
    const categories = marketCategories[marketId]
    console.log('Found cats:' + categories)
    return categories
  }

  getCategoriesMenu (categories) {
    console.log(categories)
    const menuItems = categories.map((category) => {
      console.log(category)
      return <MenuItem key={category.value} value={category.value}>{category.value}</MenuItem>
    })
    return menuItems

  }

  render () {
    const {intl, classes, loading} = this.props
    const categories = this.getCategories()
    if (loading > 0 || categories === undefined) {
      return (
        <Activity
          isLoading={categories === undefined}
          containerStyle={{overflow: 'hidden'}} LoadingTestLoading

          title={intl.formatMessage({id: 'loadingMessage'})}>
          <div>
            LoadingTest
            {intl.formatMessage({id: 'loadingMessage'})}
          </div>
        </Activity>
      )
    }
    const categoryMenuItems = this.getCategoriesMenu(categories)
    return (
      <div>
        {intl.formatMessage({id: 'titleLabel'})}
        <TextField id="title" className={classes.textField} label={intl.formatMessage({id: 'titleLabel'})}
                   variant="outlined" fullWidth onChange={this.handleFieldChange('title')}/>
        <TextField id="category" className={classes.textField} onChange={this.handleFieldChange('category')} select
                   label={intl.formatMessage({id: 'categoryLabel'})}
                   variant="outlined">
          {categoryMenuItems}
        </TextField>
        <div>
          <HtmlRichTextEditor initialText={intl.formatMessage({id: 'investibleAddDescriptionDefault'})}
                              objectId="newInvestible" id="description"
                              onChange={this.handleFieldChange('description')}/>
        </div>

        <Button variant="contained" color='primary' onClick={() => this.onSave()}
                id="save">{intl.formatMessage({id: 'saveInvestibleButton'})}</Button>
      </div>
    )
  }
}

function mapDispatchToProps (dispatch) {
  return Object.assign({dispatch}, bindActionCreators({createMarketInvestible}, dispatch))
}

const mapStateToProps = (state) => {
  return {
    loading: getCategoriesFetching(state.marketsReducer),
    marketId: getCurrentMarketId(state.marketsReducer),
    marketCategories: getMarketCategories(state.marketsReducer),
    user: getCurrentUser(state.usersReducer)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withStyles(styles, {withTheme: true})(InvestibleAdd)))
