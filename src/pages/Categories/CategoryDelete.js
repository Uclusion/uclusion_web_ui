import React from 'react'
import { connect } from 'react-redux'
import { DeleteForever } from '@material-ui/icons'
import PropTypes from 'prop-types'
import { injectIntl } from 'react-intl'
import { withTheme } from '@material-ui/core/styles/index'
import { deleteMarketCategory } from '../../store/Markets/actions'
import { withMarketId } from '../../components/PathProps/MarketId'

class CategoryDelete extends React.Component {
  constructor (props) {
    super(props)
    this.doDelete = this.doDelete.bind(this)
  }

  doDelete () {
    const { dispatch, name, marketId } = this.props
    dispatch(deleteMarketCategory({name: name, marketId: marketId}))
  }

  render () {
    return <DeleteForever onClick={() => this.doDelete()} />
  }
}

CategoryDelete.propTypes = {
  dispatch: PropTypes.func.isRequired,
  investible: PropTypes.object
}

function mapStateToProps (state) {
  return {...state}
}

function mapDispatchToProps (dispatch) {
  return { dispatch }
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme()(withMarketId(CategoryDelete))))
