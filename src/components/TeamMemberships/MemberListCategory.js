import MemberListItem from './MemberListItem'
import ItemListCategory from '../Lists/ItemListCategory'
import PropTypes from 'prop-types'
import React from 'react'

class MemberListCategory extends React.Component {

  render () {
    const {members} = this.props
    const items = members.map(element =>
      <MemberListItem key={element.id} {...element} />
    )
    return (
      <ItemListCategory items={items}/>
    )
  }
}

MemberListCategory.propTypes = {
  members: PropTypes.arrayOf(PropTypes.object).isRequired
}

export default MemberListCategory