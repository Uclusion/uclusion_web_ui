import React from 'react'
import { Auth } from 'aws-amplify'
import { Button, makeStyles } from '@material-ui/core'
import { useIntl } from 'react-intl'
import { toastError } from '../../utils/userMessage'
import { clearUclusionLocalStorage } from '../../components/utils'
import TokenStorageManager from '../../authorization/TokenStorageManager'

const useStyles = makeStyles( {
  action: {
    "&:hover": {
      color: "#ca2828",
      backgroundColor: "transparent",
      boxShadow: "none"
    }
  }
})
function SignOut() {
  const classes = useStyles();
  const intl = useIntl();

  function onSignOut() {
    // See https://aws-amplify.github.io/docs/js/authentication
    clearUclusionLocalStorage()
      .then(() => new TokenStorageManager().clearTokenStorage())
      .then(() => Auth.signOut())
      .catch((error) => {
        console.error(error);
        toastError('errorSignOutFailed');
      });
  }

  return (
    <Button
      variant="text"
      fullWidth={true}
      onClick={onSignOut}
      className={classes.action}
      disableRipple
    >
      {intl.formatMessage({ id: 'signOutButton' })}
    </Button>
  );
}

export default SignOut;
