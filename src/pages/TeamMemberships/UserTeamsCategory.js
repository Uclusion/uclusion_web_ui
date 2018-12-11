import UserTeamsListItem from './UserTeamsListItem'
import ItemListCategory from '../../components/Lists/ItemListCategory'
import PropTypes from 'prop-types'
import React from 'react'

class UserTeamsCategory extends React.Component {

  render () {
    const {teams} = this.props
    const items = teams.map(element =>
      <UserTeamsListItem
        key={element.id}
        id={element.id}
        description={element.description}
        name={element.name}
        marketSharesAvailable={[1]}
      />
    )
    return (
      <ItemListCategory items={items}/>
    )
  }
}

UserTeamsCategory.propTypes = {
  teams: PropTypes.arrayOf(PropTypes.object).isRequired
}

export default UserTeamsCategory