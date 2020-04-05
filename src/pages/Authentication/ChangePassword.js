import React, { useState } from 'react';
import _ from 'lodash';
import { Auth } from 'aws-amplify';
import Grid from '@material-ui/core/Grid';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import { Button, TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { toastError } from '../../utils/userMessage';
import Screen from '../../containers/Screen/Screen';
import { makeBreadCrumbs } from '../../utils/marketIdPathFunctions';

function ChangePassword(props) {
  const { hidden } = props;
  const [oldPassword, setOldPassword] = useState(undefined);
  const [newPassword, setNewPassword] = useState(undefined);
  const [repeatPassword, setRepeatPassword] = useState(undefined);
  const intl = useIntl();

  function onSetNewPassword() {
    // See https://aws-amplify.github.io/docs/js/authentication#change-password
    Auth.currentAuthenticatedUser()
      .then((user) => Auth.changePassword(user, oldPassword, newPassword))
      .then(() => {
        setOldPassword(undefined);
        setNewPassword(undefined);
        setRepeatPassword(undefined);
      })
      .catch((error) => {
        console.error(error);
        toastError('errorChangePasswordFailed');
      });
  }

  function handleChangeNew(password) {
    setNewPassword(password);
  }

  function handleChangeOld(password) {
    setOldPassword(password);
  }

  function handleChangeRepeat(password) {
    setRepeatPassword(password);
  }
  const history = useHistory();
  const breadCrumbs = makeBreadCrumbs(history, [], true);
  return (
    <Screen
      title={intl.formatMessage({ id: 'changePasswordHeader' })}
      tabTitle={intl.formatMessage({ id: 'changePasswordHeader' })}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
      loading={!breadCrumbs}
    >
      <Typography>
        {intl.formatMessage({ id: 'changePasswordHeader' })}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={4}>
        <form
          noValidate
          autoComplete="off"
        >
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          name="password"
          label={intl.formatMessage({ id: 'changePasswordOldLabel' })}
          key="passwordold"
          type="password"
          id="old"
          onChange={handleChangeOld}
          autoComplete="current-password"
            />
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          name="password"
          label={intl.formatMessage({ id: 'changePasswordNewLabel' })}
          key="passwordnew"
          type="password"
          id="new"
          onChange={handleChangeNew}
          autoComplete="current-password"
            />
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          name="password"
          label={intl.formatMessage({ id: 'changePasswordRepeatLabel' })}
          key="passwordrepeat"
          type="password"
          error={repeatPassword && newPassword !== repeatPassword}
          id="repeat"
          onChange={handleChangeRepeat}
          autoComplete="current-password"
            />
        </form>
      <Button
        variant="outlined"
        fullWidth={true}
        color="primary"
        onClick={onSetNewPassword}
        disabled={_.isEmpty(oldPassword) || _.isEmpty(newPassword)
        || newPassword === repeatPassword}
      >
        {intl.formatMessage({ id: 'changePasswordButton' })}
      </Button>
        </Grid>
      </Grid>
    </Screen>
  );
}

ChangePassword.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default ChangePassword;
