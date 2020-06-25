import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { verifyEmail } from '../../api/sso';
import { setRedirect } from '../../utils/redirectUtils';
import { ERROR, sendIntlMessageBase } from '../../utils/userMessage';
import { useIntl } from 'react-intl';
import { onSignOut } from '../../utils/userFunctions';

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: '#3f6b72',
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
    backgroundColor: '#3f6b72',
    color: '#fff',
  },
}));

function VerifyEmail (props) {
  const LOGIN = '/';
  const ALTERNATE_SIDEBAR_LOGO = 'Uclusion_Logo_White_Micro.png';
  const intl = useIntl();
  const classes = useStyles();
  const params = new URL(document.location).searchParams;
  const [verificationState, setVerificationState] = useState(undefined);
  const code = params.get('code');
  const { authState } = props;

  useEffect(() => {
    function beginRedirecting (result) {
      const { redirect } = result;
      if (!_.isEmpty(redirect)) {
        console.log(`Setting redirect to ${redirect}`);
        setRedirect(redirect);
      }
      window.location.pathname = LOGIN;
    }

    if (code && !verificationState) {
      setVerificationState('VERIFIED');
      verifyEmail(code)
        .then(result => {
          // we unconditionally sign out in case they are signed in to the user in another tab.
          // if it fails, we weren't logged in.
          return onSignOut(false)
            .then(() => beginRedirecting(result))
            .catch(() => beginRedirecting(result));
          // console.log(result);
        })
        .catch((error) => {
          console.error(error);
          setVerificationState(undefined);
          sendIntlMessageBase(intl, ERROR, 'errorVerifyFailed');
        });
    }
  }, [code, verificationState, intl, authState]);

  if (!code) {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline/>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img
              width="35"
              height="35"
              src={`/images/${ALTERNATE_SIDEBAR_LOGO}`}
              alt="Uclusion"
            />
          </Avatar>
          <Typography component="h1" variant="h5" align="center">
            Sorry, we couldn't verify you.
            Please re-visit this page via a verification link from the email we sent.
          </Typography>
        </div>
      </Container>
    );
  }

  if (verificationState === 'ALREADY_EXISTS') {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline/>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img
              width="35"
              height="35"
              src={`/images/${ALTERNATE_SIDEBAR_LOGO}`}
              alt="Uclusion"
            />
          </Avatar>
          <Typography component="h1" variant="h5" align="center">
            This email has already been verified. We will be redirecting you to
            login shortly.
          </Typography>
        </div>
      </Container>
    );
  }

  if (verificationState === 'VERIFIED') {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline/>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img
              width="35"
              height="35"
              src={`/images/${ALTERNATE_SIDEBAR_LOGO}`}
              alt="Uclusion"
            />
          </Avatar>
          <Typography component="h1" variant="h5" align="center">
            Verification was successful, and your account was created. We will
            be redirecting you to login shortly.
          </Typography>
        </div>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline/>
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <img
            width="35"
            height="35"
            src={`/images/${ALTERNATE_SIDEBAR_LOGO}`}
            alt="Uclusion"
          />
        </Avatar>
        <Typography component="h1" variant="h5" align="center">
          Please wait while we verify your email. This may take a few seconds.
        </Typography>
      </div>
    </Container>
  );
}

export default VerifyEmail;
