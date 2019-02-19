import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Grid } from '@material-ui/core';
import { getTeamMembers } from '../../store/Teams/reducer';
import { fetchTeamMembers } from '../../store/Teams/actions';
import MemberListItem from './MemberListItem';

class MemberList extends React.PureComponent {
  componentDidMount() {
    this.readCurrentUsers();
  }

  readCurrentUsers() {
    const { dispatch, teamId } = this.props;
    dispatch(fetchTeamMembers(teamId));
  }

  render() {
    const { teamMembers, teamId } = this.props;
    const { users } = teamMembers[teamId] || {};
    if (!users) {
      return null;
    }

    return (
      <Grid container spacing={16}>
        {users.map(user => <MemberListItem key={user.id} user={user} />)}
      </Grid>
    );
  }
}

function mapStateToProps(state) {
  return { teamMembers: getTeamMembers(state.teamsReducer) };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

MemberList.propTypes = {
  teamMembers: PropTypes.object.isRequired,
  teamId: PropTypes.string.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(MemberList);
