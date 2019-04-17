/* eslint-disable react/forbid-prop-types */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { Grid, Button, TextField } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
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

function AdminAdd(props) {
  const [name, setName] = useState(undefined);
  const [email, setEmail] = useState(undefined);
  const [processing, setProcessing] = useState(false);

  function addOnClick() {
    const { upUser } = props;
    const clientPromise = getClient();
    return clientPromise.then((client) => {
      return client.users.create(upUser.default_team_id, name, email);
    }).then((user) => {
      console.log(JSON.stringify(user));
      setName('');
      setEmail('');
      setProcessing(false);
      sendIntlMessage(SUCCESS, { id: 'userCreated' });
    }).catch((error) => {
      console.log(error);
      setProcessing(false);
      sendIntlMessage(ERROR, { id: 'userCreateFailed' });
    });
  }

  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
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
            id="userName"
            label={intl.formatMessage({ id: 'adminName' })}
            value={name}
            onChange={handleNameChange}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <TextField
            className={classes.textField}
            id="userEmail"
            label={intl.formatMessage({ id: 'email' })}
            value={email}
            onChange={handleEmailChange}
          />
        </Grid>
        <Grid className={classes.gridItem} item xs={12} lg={3}>
          <Button
            className={classes.addButton}
            variant="contained"
            color="primary"
            disabled={processing === true || !name || !email}
            onClick={() => addOnClick()}
          >
            {intl.formatMessage({ id: 'addButton' })}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}

AdminAdd.propTypes = {
  classes: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  upUser: PropTypes.object.isRequired,
};

export default injectIntl(withStyles(styles, { withTheme: true })(AdminAdd));
