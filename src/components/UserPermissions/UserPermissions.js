import React from 'react'
import { connect } from 'react-redux'
import { getCurrentUser, getUsersFetching } from '../../store/Users/reducer'

const mapStateToProps = (state) => ({
  _upUserLoading: getUsersFetching(state.usersReducer),
  _upUser: getCurrentUser(state.usersReducer)
})

function withUseAndPermissions(WrappedComponent) {

  class UserPermissionsWrapper extends React.Component {

    constructor (props) {
      super(props)
      this.getUserPermissions = this.getUserPermissions.bind(this)
    }

    getUserPermissions () {
      const { _upUser, _upUserLoading } = this.props
      if (!_upUser || _upUserLoading) {
        return {}
      }
      const { available_apis, operation_permissions } = _upUser.market_presence
      if (! available_apis || !operation_permissions ){
        return {}
      }
      const canDeleteMarketInvestible = available_apis.includes('delete_investible') && operation_permissions.delete_market_investible
      // console.log(_upUser)
      return { canDeleteMarketInvestible }
    }

    render () {
      const userPermissions = this.getUserPermissions()
      // remove the up user
      const newProps = {...this.props}
      delete newProps._upUserLoading
      delete newProps._upUser

      // technically we're passing the user and Permissions here which is fine
      return <WrappedComponent {...newProps} userPermissions={userPermissions}/>
    }
  }
  return connect(mapStateToProps)(UserPermissionsWrapper)
}

export { withUseAndPermissions }
