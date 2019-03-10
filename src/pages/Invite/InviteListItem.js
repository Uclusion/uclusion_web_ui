/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';

const styles = theme => ({
  itemCell: {
    padding: theme.spacing.unit,
  },
  itemContent: {
    padding: theme.spacing.unit * 2,
  },
  title: {
    display: 'flex',
    marginBottom: theme.spacing.unit,
  },
  titleText: {
    flex: 1,
    fontWeight: 'bold',
  },
});

const InviteListItem = ({
  name,
  description,
  classes,
  teamSize,
}) => (
  <Grid className={classes.itemCell} item>
    <div className={classes.title}>
      <Typography className={classes.titleText}>{name}</Typography>
    </div>
    <div className={classes.title}>
      <Typography className={classes.titleText}>{description}</Typography>
    </div>
    <div className={classes.title}>
      <Typography className={classes.titleText}>{teamSize}</Typography>
    </div>
  </Grid>
);

InviteListItem.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  teamSize: PropTypes.number.isRequired,
};

export default injectIntl(withStyles(styles)(InviteListItem));
