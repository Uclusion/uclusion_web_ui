import React from 'react'
import { connect } from 'react-redux'
import { getCurrentUser, getCurrentUserFetching } from '../../store/Users/reducer'

const mapStateToProps = (state) => {
  return {
    _upUserLoading: getCurrentUserFetching(state.usersReducer),
    _upUser: getCurrentUser(state.usersReducer)
  }
}

function withUserAndPermissions(WrappedComponent) {

  class UserPermissionsWrapper extends React.Component {

    constructor (props) {
      super(props)
      this.getUserPermissions = this.getUserPermissions.bind(this)
    }

    permissionsArrayToObject(array){
      const reducer = (accumulator, current) => {
        accumulator[current] = true
        return accumulator
      }
      return array.reduce(reducer, {})
    }

    getUserPermissions () {
      const { _upUserLoading, _upUser } = this.props
      if (!_upUser || _upUserLoading) {
        return {}
      }
      const { available_apis, operation_permissions } = _upUser.market_presence
      if (!available_apis || !operation_permissions ){
        return {}
      }
      const apisObject = this.permissionsArrayToObject(available_apis)
      const opObject = this.permissionsArrayToObject(operation_permissions)
      console.log(apisObject)
      const canDeleteMarketInvestible = apisObject.delete_investible && opObject.delete_market_investible
      // console.log(_upUser)
      const canInvest = apisObject.create_investment
      return { canDeleteMarketInvestible, canInvest }
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

export { withUserAndPermissions }
