import React from 'react';
import { Button, makeStyles } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { navigate } from '../../utils/marketIdPathFunctions';
import { SIGN_OUT_WIZARD_TYPE } from '../../constants/markets';
import { useHistory } from 'react-router';

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
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();

  return (
    <Button
      variant="outlined"
      onClick={() => navigate(history, `/wizard#type=${SIGN_OUT_WIZARD_TYPE.toLowerCase()}`)}
      className={classes.action}
      disableRipple
      id="signoutButton"
    >
      {intl.formatMessage({ id: 'signOutButton' })}
    </Button>
  );
}

export default SignOut;
