import PropTypes from 'prop-types';
import React from 'react';
import UserMembershipsListItem from './UserMembershipsListItem';
import ItemListCategory from '../Lists/ItemListCategory';

class UserMembershipsCategory extends React.Component {
  render() {
    const { teams } = this.props;
    const items = teams.map(element => (
      <UserMembershipsListItem
        key={element.id}
        id={element.id}
        description={element.description}
        name={element.name}
        marketSharesAvailable={[1]}
        numMembers={element.num_users}
      />
    ));
    return (
      <ItemListCategory items={items} />
    );
  }
}

UserMembershipsCategory.propTypes = {
  teams: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default UserMembershipsCategory;
