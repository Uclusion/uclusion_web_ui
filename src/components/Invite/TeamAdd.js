/* eslint-disable react/forbid-prop-types */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { Grid, Button, TextField } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import IconButton from '@material-ui/core/IconButton';
import Info from '@material-ui/icons/Info';
import { ERROR, sendIntlMessage, SUCCESS } from '../../utils/userMessage';
import { getClient } from '../../config/uclusionClient';

const styles = theme => ({
  form: {
    display: 'flex',
    alignItems: 'flex-end',
    padding: theme.spacing.unit * 2,
  },
  gridItem: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  textField: {
    width: '100%',
  },
  addButton: {
    minWidth: 80,
    height: 36,
  },
  button: {
    padding: theme.spacing.unit,
  },
});

function TeamAdd(props) {
  const [name, setName] = useState(undefined);
  const [description, setDescription] = useState(undefined);
  const [processing, setProcessing] = useState(false);

  function addOnClick() {
    const { teams, teamsSet, marketId } = props;
    const clientPromise = getClient();
    setProcessing(true);
    let globalClient;
    let globalTeam;
    clientPromise.then((client) => {
      globalClient = client;
      return client.teams.create(name, description);
    }).then((team) => {
      globalTeam = team;
      return globalClient.teams.bind(team.id, marketId, { isCognito: true });
    }).then((marketTeam) => {
      const team = { ...globalTeam, ...marketTeam };
      const newTeams = _.unionBy([team], teams, 'id');
      teamsSet(newTeams);
      setName('');
      setDescription('');
      setProcessing(false);
      sendIntlMessage(SUCCESS, { id: 'marketTeamCreated' });
    }).catch((error) => {
      setProcessing(false);
      console.log(error);
      sendIntlMessage(ERROR, { id: 'marketTeamCreateFailed' });
    })
      .finally(() => {
        setProcessing(false);
      });
  }

  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handleDescriptionChange(event) {
    setDescription(event.target.value);
  }

  const {
    classes,
    intl,
  } = props;

  return (
    <form className={classes.form} noValidate autoComplete="off">
      <Grid container spacing={16}>
        <Grid item xs={12} lg={3}>
          <TextField
            className={classes.textField}
            id="teamName"
            label={intl.formatMessage({ id: 'teamNameLabel' })}
            value={name}
            onChange={handleNameChange}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <TextField
            className={classes.textField}
            id="teamDescription"
            label={intl.formatMessage({ id: 'teamDescriptionLabel' })}
            value={description}
            onChange={handleDescriptionChange}
          />
        </Grid>
        <Grid className={classes.gridItem} item xs={12} lg={3}>
          <Button
            className={classes.addButton}
            variant="contained"
            color="primary"
            disabled={processing === true || !name || !description}
            onClick={addOnClick}
          >
            {intl.formatMessage({ id: 'addButton' })}
          </Button>
          <IconButton
            name="teaminfo"
            aria-label="Team Help"
            className={classes.button}
            color="primary"
            href="https://uclusion.zendesk.com/hc/en-us/articles/360026358152-Admin-Creating-a-New-Team-or-User-for-Username-Password-Login"
            target="_blank"
            rel="noopener"
          >
            <Info />
          </IconButton>
        </Grid>
      </Grid>
    </form>
  );
}

TeamAdd.propTypes = {
  marketId: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  teamsSet: PropTypes.func.isRequired,
  teams: PropTypes.array.isRequired,
};

export default injectIntl(withStyles(styles, { withTheme: true })(TeamAdd));
