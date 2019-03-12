/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Grid, Typography, Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { getClient } from '../../config/uclusionClient';
import { withMarketId } from '../../components/PathProps/MarketId';

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

function InviteListItem(props) {
  const [inviteUrl, setInviteUrl] = useState(undefined);
  const {
    name, description, classes, teamSize, id, marketId,
  } = props;

  function handleSubmit(event) {
    event.preventDefault();
    getClient().then((client) => {
      return client.teams.inviteToken(id);
    }).then((inviteToken) => {
      setInviteUrl(`${window.location.href}${marketId}/NewCognito?creationToken=${inviteToken}`);
    }).catch((e) => {
      console.error(e);
    });
  }

  return (
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
      {inviteUrl && (
      <div className={classes.title}>
        <Typography className={classes.titleText}>{inviteUrl}</Typography>
      </div>
      )}
      {!inviteUrl && (
      <Button
        className={classes.loginButton}
        type="submit"
        variant="contained"
        color="primary"
        onClick={handleSubmit}
      >
        Get Invite Link
      </Button>
      )}
    </Grid>
  );
}

InviteListItem.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  teamSize: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
};

export default injectIntl(withStyles(styles)(withMarketId(InviteListItem)));
