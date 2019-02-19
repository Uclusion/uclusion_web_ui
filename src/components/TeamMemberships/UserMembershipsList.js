import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import UserMembershipsListItem from './UserMembershipsListItem';

const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 2,
  },
});

class UserMembershipsList extends React.PureComponent {
  render() {
    const { teams, classes } = this.props;
    return (
      <div className={classes.root}>
        {teams.map(team => (
          <UserMembershipsListItem
            key={team.id}
            team={team}
          />
        ))}
      </div>
    );
  }
}

UserMembershipsList.propTypes = {
  teams: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default injectIntl(withStyles(styles)(UserMembershipsList));
