import React, { PureComponent } from 'react';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Typography } from '@material-ui/core';
import Activity from '../../containers/Activity/Activity';
import { fetchUserTeams } from '../../store/Teams/actions';
import { getUserTeams } from '../../store/Teams/reducer';
import { getCurrentUser } from '../../store/Users/reducer';
import UserMembershipsList from '../../components/TeamMemberships/UserMembershipsList';

class UserMemberships extends PureComponent {
  render() {
    const { intl, teams, user } = this.props;
    if (teams.length === 0) {
      return (
        <Activity
          isLoading={teams === undefined}
          containerStyle={{ overflow: 'hidden' }}
          title={intl.formatMessage({ id: 'teamsHeader' })}
        >
          <Typography>
            {intl.formatMessage({ id: 'teamsListNotFound' })}
          </Typography>
        </Activity>
      );
    }

    return (
      <Activity
        isLoading={teams === undefined}
        containerStyle={{ overflow: 'hidden' }}
        title={intl.formatMessage({ id: 'teamsHeader' })}
      >
        <UserMembershipsList user={user} teams={teams} />
      </Activity>
    );
  }
}

UserMemberships.propTypes = {
  dispatch: PropTypes.func.isRequired,
  teams: PropTypes.arrayOf(PropTypes.object).isRequired,
};

function mapStateToProps(state) {
  return {
    teams: getUserTeams(state.teamsReducer),
    user: getCurrentUser(state.usersReducer),
  };
}

function mapDispatchToProps(dispatch) {
  return Object.assign({ dispatch }, bindActionCreators({ fetchUserTeams }, dispatch));
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(UserMemberships));
