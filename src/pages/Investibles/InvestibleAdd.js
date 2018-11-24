import React from 'react'
import PropTypes from 'prop-types'

import GlobalState from 'uclusion-shell/lib/utils/GlobalState'
import { Activity } from 'uclusion-shell'


import MenuItem from '@material-ui/core/MenuItem';
import { Button, TextField } from '@material-ui/core'


import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { createMarketInvestible } from '../../containers/MarketInvestibles/actions'

//get my editor
import HtmlRtfEditor from '../../components/HtmlRtfEditor'


import { fetchMarketCategories} from '../../containers/Markets/actions'
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
    this.state = {title: '', category:''}
    this.handleFieldChange = this.handleFieldChange.bind(this)
    this.onSave = this.onSave.bind(this)
    this.readMarketCategories = this.readMarketCategories.bind(this)
  }

  componentDidMount () {
    console.log("Attempting to read market categories")
    this.readMarketCategories()
  }

  handleFieldChange = (name) => (event) => {
    let value = event.target.value
    this.setState({
      [name]: value
    })
  }


  readMarketCategories () {
    const { dispatch, marketId } = this.props
    dispatch(fetchMarketCategories({marketId}))
  }

  onSave(editor){
    const { dispatch, marketId } = this.props
    const description = ""//TODO change
    const { title, category } = this.state
    dispatch(createMarketInvestible({marketId, description, title, category}))
    //what do we want to do after the save?
  }


  render () {
    const {intl, classes, loading, marketId, marketCategories} = this.props
    const categories = marketCategories[marketId]
    if (loading > 0 || categories === undefined) {
      return (
        <Activity
          isLoading={categories === undefined}
          containerStyle={{ overflow: 'hidden' }}LoadingTestLoading

          title={intl.formatMessage({ id: 'loadingMessage' })}>
          <div>
            LoadingTest
            {intl.formatMessage({ id: 'loadingMessage' })}
          </div>
        </Activity>
      )
    }
    return (
      <div>
        {intl.formatMessage({id: 'titleLabel'})}
        <TextField id="title" className={classes.textField} label={intl.formatMessage({id: 'titleLabel'})}
                   variant="outlined" fullWidth onChange={this.handleFieldChange('title')}/>
        <TextField id="category" className={classes.textField} onChange={this.handleFieldChange('category')} select label={intl.formatMessage({id: 'categoryLabel'})}
                   variant="outlined">
          {categories.map((category) => (
            <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
        </TextField>
        <div>
          <HtmlRtfEditor initialText={intl.formatMessage({id: 'investibleAddDescriptionDefault'})}/>
        </div>

        <Button variant="contained" color='primary' id="save">{intl.formatMessage({id: 'saveInvestibleButton'})}</Button>
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
