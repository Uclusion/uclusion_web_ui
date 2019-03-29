import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import UserMembershipsListItem from './UserMembershipsListItem';

const styles = theme => ({
  root: {
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
      investibles,
      classes,
      setUsers,
      allUsers,
    } = this.props;
    return (
      <div className={classes.root}>
        {teams.map(team => (
          <UserMembershipsListItem
            key={team.id}
            team={team}
            investibles={investibles}
            setUsers={setUsers}
            allUsers={allUsers}
          />
        ))}
      </div>
    );
  }
}

UserMembershipsList.propTypes = {
  teams: PropTypes.arrayOf(PropTypes.object).isRequired,
  investibles: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  setUsers: PropTypes.func.isRequired,
  allUsers: PropTypes.object.isRequired, //eslint-disable-line
};

export default injectIntl(withStyles(styles)(UserMembershipsList));
