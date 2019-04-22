import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import UserMembershipsListItem from './UserMembershipsListItem';
import LazyLoad from '../LazyLoad';

const styles = theme => ({
  root: {
    overflowX: 'auto',
    boxSizing: 'border-box',
    height: '100%',
    display: 'flex',
    alignItems: 'stretch',
    paddingTop: theme.spacing.unit,
  },
});

class UserMembershipsList extends React.PureComponent {
  render() {
    const {
      teams,
      setTeams,
      investibles,
      classes,
      setUsers,
      allUsers,
    } = this.props;
    const allTeamsUsers = {};
    return (
      <div className={classes.root}>
        {teams.map(team => (
          <LazyLoad
            key={team.id}
            width={400}
          >
            <UserMembershipsListItem
              team={team}
              teams={teams}
              setTeams={setTeams}
              investibles={investibles}
              setUsers={setUsers}
              allTeamUsers={allTeamsUsers}
              allUsers={allUsers}
              numTeams={teams.length}
            />
          </LazyLoad>
        ))}
      </div>
    );
  }
}

UserMembershipsList.propTypes = {
  teams: PropTypes.arrayOf(PropTypes.object).isRequired,
  setTeams: PropTypes.func, //eslint-disable-line
  investibles: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  setUsers: PropTypes.func.isRequired,
  allUsers: PropTypes.object.isRequired, //eslint-disable-line
};

export default injectIntl(withStyles(styles)(UserMembershipsList));
