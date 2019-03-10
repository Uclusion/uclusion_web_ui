/* eslint-disable react/forbid-prop-types */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { Button, TextField } from '@material-ui/core';
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
  textField: {
    flex: 1,
    maxWidth: 400,
    marginRight: theme.spacing.unit * 2,
  },
  addButton: {
    minWidth: 80,
    height: 36,
  },
});

function TeamAdd(props) {
  const [name, setName] = useState(undefined);
  const [description, setDescription] = useState(undefined);

  function addOnClick() {
    const { teams, teamsSet, marketId } = props;
    const clientPromise = getClient();
    let globalClient;
    let globalTeam;
    return clientPromise.then((client) => {
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
      <TextField
        className={classes.textField}
        id="teamName"
        label={intl.formatMessage({ id: 'teamNameLabel' })}
        value={name}
        onChange={handleNameChange}
      />
      <TextField
        className={classes.textField}
        id="teamDescription"
        label={intl.formatMessage({ id: 'teamDescriptionLabel' })}
        value={description}
        onChange={handleDescriptionChange}
      />
      <Button
        className={classes.addButton}
        variant="contained"
        color="primary"
        onClick={() => addOnClick()}
      >
        {intl.formatMessage({ id: 'addButton' })}
      </Button>
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
