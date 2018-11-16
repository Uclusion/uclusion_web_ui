import React from 'react'
import ItemList from '../../components/ItemList'
import UserTeamsListCategory from './UserTeamsCategory'
import { injectIntl } from 'react-intl'
import PropTypes from 'prop-types'

class UserTeamsList extends React.Component {

  render () {
    const { teams } = this.props;
    const teamsCategory = <UserTeamsListCategory teams={teams}/>
    return (
      <ItemList categoryLists={[teamsCategory]} headerActions={[]}/>
    )
  }
}


UserTeamsList.propTypes = {
  teams: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default injectIntl(UserTeamsList);