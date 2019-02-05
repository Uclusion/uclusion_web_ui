import React from 'react'
import { connect } from 'react-redux'
import { getCurrentUser } from '../../store/Users/reducer'

const mapStateToProps = (state) => {
  return {
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
      const { _upUser } = this.props
      if (!_upUser){
        return {}
      }
      const { available_apis, operation_permissions } = _upUser.market_presence
      if (!available_apis || !operation_permissions) {
        return {}
      }
      const apisObject = this.permissionsArrayToObject(available_apis)
      const opObject = this.permissionsArrayToObject(operation_permissions)
      console.log(apisObject)
      const canDeleteMarketInvestible = apisObject.delete_investible && opObject.delete_market_investible
      const canEditMarketInvestible = apisObject.update_investible && opObject.update_market_investible
      // console.log(_upUser)
      const canInvest = apisObject.create_investment || false
      const canListAccountTeams = apisObject.list_teams || false
      const canCategorize = apisObject.category_create || false
      return { canDeleteMarketInvestible, canInvest, canEditMarketInvestible, canListAccountTeams, canCategorize }
    }

    render () {
      const userPermissions = this.getUserPermissions()
      // remove the up user
      const newProps = {...this.props}
      delete newProps._upUserLoading
      delete newProps._upUser

      // technically we're passing the user and Permissions here which is fine
      return <WrappedComponent {...newProps} userPermissions={userPermissions} />
    }
  }
  return connect(mapStateToProps)(UserPermissionsWrapper)
}

export { withUserAndPermissions }
