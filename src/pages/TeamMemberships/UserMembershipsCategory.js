import UserMembershipsListItem from './UserMembershipsListItem'
import ItemListCategory from '../../components/Lists/ItemListCategory'
import PropTypes from 'prop-types'
import React from 'react'

class UserMembershipsCategory extends React.Component {

  render () {
    const {teams} = this.props
    const items = teams.map(element =>
      <UserMembershipsListItem
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

UserMembershipsCategory.propTypes = {
  teams: PropTypes.arrayOf(PropTypes.object).isRequired
}

export default UserMembershipsCategory