/* eslint-disable react/forbid-prop-types */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { Grid, Button, TextField } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import _ from 'lodash';
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
});

function TeamAdd(props) {
  const [name, setName] = useState(undefined);
  const [description, setDescription] = useState(undefined);
  const [loading, setLoading] = useState(false);

  function addOnClick() {
    if (loading) return;

    setLoading(true);

    const { teams, teamsSet, marketId } = props;
    const clientPromise = getClient();
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
      sendIntlMessage(SUCCESS, { id: 'marketTeamCreated' });
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'marketTeamCreateFailed' });
    }).finally(() => {
      setLoading(false);
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
            onClick={addOnClick}
          >
            {intl.formatMessage({ id: 'addButton' })}
          </Button>
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
