import React, { useState } from 'react';
import _ from 'lodash';
import { Auth } from 'aws-amplify';
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
          error={repeatPassword && newPassword !== repeatPassword}
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
    </Screen>
  );
}

ChangePassword.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default ChangePassword;
