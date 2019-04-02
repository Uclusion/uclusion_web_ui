/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import {
  Grid,
  Card,
  Typography,
  Badge,
  Chip,
  Button,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { getClient } from '../../config/uclusionClient';

const styles = theme => ({
  container: {
    padding: theme.spacing.unit * 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  title: {
    marginBottom: 0,
  },
  description: {
    marginBottom: theme.spacing.unit * 2,
  },
  ushares: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
  },
  lastInvestmentDate: {
    color: theme.palette.grey[600],
  },
  investiblesBadge: {
    right: -theme.spacing.unit,
    transform: 'translateY(-50%)',
  },
  inviteUrl: {
    wordBreak: 'break-all',
  },
});

function InviteListItem(props) {
  const [inviteUrl, setInviteUrl] = useState(undefined);
  const { classes, team } = props;
  const {
    id,
    name,
    description,
    shared_quantity,
    team_size,
    quantity_invested,
    quantity,
  } = team;

  function handleSubmit(event) {
    event.preventDefault();
    getClient().then((client) => {
      return client.teams.inviteToken(id);
    }).then((inviteToken) => {
      const location = window.location.href;
      const lastIndex = location.lastIndexOf('/') + 1;
      setInviteUrl(`${location.substring(0, lastIndex)}NewCognito?creationToken=${inviteToken}`);
    }).catch((e) => {
      console.error(e);
    });
  }

  return (
    <Grid item xs={12} md={6} lg={4} xl={3}>
      <Card className={classes.container}>
        <Typography className={classes.title} variant="h6" paragraph>
          {name}
        </Typography>
        <Typography>
          {`${team_size} Members`}
        </Typography>
        <div className={classes.ushares}>
          <Typography>uShares:</Typography>
          <Badge
            classes={{ badge: classes.investiblesBadge }}
            max={1000000}
            badgeContent={shared_quantity}
            color="primary"
          >
            <Chip
              label="Shared"
              variant="outlined"
            />
          </Badge>
          <Badge
            classes={{ badge: classes.investiblesBadge }}
            max={1000000}
            badgeContent={quantity}
            color="primary"
          >
            <Chip
              label="Available"
              variant="outlined"
            />
          </Badge>
          <Badge
            classes={{ badge: classes.investiblesBadge }}
            max={1000000}
            badgeContent={quantity_invested}
            color="primary"
          >
            <Chip
              label="Invested"
              variant="outlined"
            />
          </Badge>
        </div>
        <Typography className={classes.description}>
          {description}
        </Typography>
        {inviteUrl ? (
          <Typography className={classes.inviteUrl}>{inviteUrl}</Typography>
        ) : (
          <Button
            type="submit"
            variant="contained"
            color="primary"
            onClick={handleSubmit}
          >
            Get Invite Link
          </Button>
        )}
      </Card>
    </Grid>
  );
}

InviteListItem.propTypes = {
  team: PropTypes.object.isRequired, //eslint-disable-line
};

export default injectIntl(withStyles(styles)(InviteListItem));
