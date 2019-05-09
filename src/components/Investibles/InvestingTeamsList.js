import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { Card, Typography } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import _ from 'lodash';

const styles = theme => ({
  root: {
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
  },
  card: {
    marginBottom: theme.spacing.unit,
    padding: theme.spacing.unit * 1.5,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  link: {
    textDecoration: 'none',
  },
  content: {
    fontWeight: 500,
    display: 'flex',
    justifyContent: 'space-between',
  },
});

class InvestingTeamsList extends React.PureComponent {
  render() {
    const { classes, teams, marketId } = this.props;
    const sortedTeams = _.reverse(_.sortBy(teams, 'invested_quantity'));
    return (
      <div className={classes.root}>
        {sortedTeams.map(team => (
          <Card key={team.id} className={classes.card}>
            <Link className={classes.link} to={`/${marketId}/teams#team:${team.id}`}>
              <Typography className={classes.content} component="div">
                <b>{team.name}</b>
                {team.invested_quantity}
              </Typography>
            </Link>
          </Card>
        ))}
      </div>
    );
  }
}

InvestingTeamsList.propTypes = {
  classes: PropTypes.object.isRequired,
  teams: PropTypes.array.isRequired,
  marketId: PropTypes.string.isRequired,
};

export default injectIntl(withStyles(styles)(InvestingTeamsList));
