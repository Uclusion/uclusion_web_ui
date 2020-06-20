import React from 'react'
import { Button, makeStyles } from '@material-ui/core'
import { useIntl } from 'react-intl'
import { onSignOut } from '../../utils/userFunctions'

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
