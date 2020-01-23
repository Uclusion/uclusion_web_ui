import React from 'react';
import { Auth } from 'aws-amplify';
import { Button } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { toastError } from '../../utils/userMessage';

function SignOut() {
  const intl = useIntl();

  function onSignOut() {
    // See https://aws-amplify.github.io/docs/js/authentication
    Auth.signOut()
      .catch((error) => {
        console.error(error);
        toastError('errorSignOutFailed');
      });
  }

  return (
    <Button
      onClick={onSignOut}
    >
      {intl.formatMessage({ id: 'signOutButton' })}
    </Button>
  );
}

export default SignOut;
