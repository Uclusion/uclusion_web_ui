import React from 'react'
import ItemList from '../../components/Lists/ItemList'
import UserMembershipsListCategory from './UserMembershipsCategory'
import { injectIntl } from 'react-intl'
import PropTypes from 'prop-types'

class UserMembershipsList extends React.Component {

  render () {
    const { teams } = this.props;
    const teamsCategory = <UserMembershipsListCategory teams={teams}/>
    return (
      <ItemList categoryLists={[teamsCategory]} headerActions={[]}/>
    )
  }
}


UserMembershipsList.propTypes = {
  teams: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default injectIntl(UserMembershipsList);