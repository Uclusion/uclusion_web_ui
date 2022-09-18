import React, { useContext } from 'react'
import { Button, makeStyles } from '@material-ui/core'
import { useIntl } from 'react-intl'
import { onSignOut } from '../../utils/userFunctions'
import { LogoutContext } from '../../containers/App/App'

const useStyles = makeStyles( {
  action: {
    "&:hover": {
      color: "#ca2828",
      backgroundColor: "transparent",
      boxShadow: "none"
    }
  }
})
function SignOut(props) {
  const logoutChannel = useContext(LogoutContext);
  const classes = useStyles();
  const intl = useIntl();

  function myOnSignOut() {
    if (logoutChannel) {
      if (logoutChannel.postMessage) {
        logoutChannel.postMessage('signedOut').then(() => onSignOut()).then(() => {
          console.info('Reloaded already in onSignOut');
        });
      } else {
        console.warn(logoutChannel);
        onSignOut();
      }
    }
  }

  return (
    <Button
      variant="outlined"
      onClick={myOnSignOut}
      className={classes.action}
      disableRipple
      id="signoutButton"
    >
      {intl.formatMessage({ id: 'signOutButton' })}
    </Button>
  );
}

export default SignOut;
