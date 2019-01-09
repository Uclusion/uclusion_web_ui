import React from 'react'
import { connect } from 'react-redux'
import { DeleteForever } from '@material-ui/icons'
import PropTypes from 'prop-types'
import { deleteMarketInvestible } from '../../store/MarketInvestibles/actions'

class InvestibleDelete extends React.Component {

  constructor (props) {
    super(props)
    this.doDelete = this.doDelete.bind(this)
  }

  doDelete () {
    const { investibleId, dispatch } = this.props
    dispatch(deleteMarketInvestible(investibleId))
  }

  render () {
    return <DeleteForever onClick={() => this.doDelete()}/>
  }
}

InvestibleDelete.propTypes = {
  investibleId: PropTypes.string.isRequired
}


function mapStateToProps (state) {
  return {} // not used yet
}

function mapDispatchToProps (dispatch) {
  return { dispatch }
}

export default connect(mapDispatchToProps, mapStateToProps)(InvestibleDelete)
