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

const cardWidth = 400;

class UserMembershipsList extends React.PureComponent {
  componentDidMount() {
    this.handleScrollToSelectedTeam();
  }

  componentDidUpdate(prevProps) {
    if (this.props.selectedTeamId !== prevProps.selectedTeamId) {
      this.handleScrollToSelectedTeam();
    }
  }

  handleScrollToSelectedTeam() {
    const { teams, selectedTeamId } = this.props;
    if (selectedTeamId) {
      for (let i = 0; i < teams.length; i++) {
        if (teams[i].id === selectedTeamId) {
          const scrollOffset = i * cardWidth;
          this.scrollContainer.scrollLeft = scrollOffset;
          break;
        }
      }
    }
  }

  render() {
    const {
      teams,
      setTeams,
      investibles,
      classes,
      selectedTeamId,
      onToggleFavorite,
    } = this.props;
    return (
      <div
        className={classes.root}
        ref={(ref) => {
          this.scrollContainer = ref;
        }}
      >
        {teams.map(team => (
          <LazyLoad
            key={team.id}
            width={cardWidth}
          >
            <UserMembershipsListItem
              selected={team.id === selectedTeamId}
              team={team}
              teams={teams}
              setTeams={setTeams}
              investibles={investibles}
              onToggleFavorite={onToggleFavorite}
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
  selectedTeamId: PropTypes.string,
  onToggleFavorite: PropTypes.func,
};

export default injectIntl(withStyles(styles)(UserMembershipsList));
