import React, { useState } from 'react';
import _ from 'lodash';
import { Auth } from 'aws-amplify';
import { Button, TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { toastError } from '../../utils/userMessage';

function ChangePassword() {
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

  return (
    <div>
      <Typography>
        {intl.formatMessage({ id: 'changePasswordHeader' })}
      </Typography>
      <form
        noValidate
        autoComplete="off"
      >
        <TextField
          id="old"
          label={intl.formatMessage({ id: 'changePasswordOldLabel' })}
          onChange={handleChangeOld}
          type="password"
          margin="normal"
        />
        <br />
        <TextField
          id="new"
          label={intl.formatMessage({ id: 'changePasswordNewLabel' })}
          onChange={handleChangeNew}
          type="password"
          margin="normal"
        />
        <br />
        <TextField
          id="repeat"
          label={intl.formatMessage({ id: 'changePasswordRepeatLabel' })}
          onChange={handleChangeRepeat}
          type="password"
          margin="normal"
        />
      </form>
      <Button
        onClick={onSetNewPassword}
        disabled={_.isEmpty(oldPassword) || _.isEmpty(newPassword)
        || newPassword === repeatPassword}
      >
        {intl.formatMessage({ id: 'changePasswordButton' })}
      </Button>
    </div>
  );
}

export default ChangePassword;
