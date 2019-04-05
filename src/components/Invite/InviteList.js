import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';

import InviteListItem from './InviteListItem';

const styles = theme => ({
  root: {
    flex: 1,
    width: '100%',
    overflowX: 'hidden',
    overflowY: 'auto',
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
  },
  container: {
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
  },
});

function InviteList(props) {
  const { classes, teams } = props;

  return (
    <div className={classes.root}>
      <Grid container spacing={16} className={classes.container}>
        {teams.map(team => (
          <InviteListItem
            key={team.id}
            team={team}
          />
        ))}
      </Grid>
    </div>
  );
}

InviteList.propTypes = {
  teams: PropTypes.array.isRequired, //eslint-disable-line
};

export default injectIntl(withStyles(styles)(InviteList));
