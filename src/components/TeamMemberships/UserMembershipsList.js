import React from 'react';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import ItemList from '../Lists/ItemList';
import UserMembershipsListCategory from './UserMembershipsCategory';

class UserMembershipsList extends React.PureComponent {
  render() {
    const { teams } = this.props;
    const teamsCategory = <UserMembershipsListCategory teams={teams} />;
    return (
      <ItemList categoryLists={[teamsCategory]} headerActions={[]} />
    );
  }
}


UserMembershipsList.propTypes = {
  teams: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default injectIntl(UserMembershipsList);
