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
      console.log('Beginning redirect');
      const { redirect } = result;
      if (!_.isEmpty(redirect)) {
        console.log(`Setting redirect to ${redirect}`);
        setRedirect(redirect);
      }
      console.log('redirecting to LOGIN');
      window.location.pathname = LOGIN;
    }

    if (code && !verificationState) {
      setVerificationState('PROCESSING');
      verifyEmail(code)
        .then(result => {
          setVerificationState('VERIFIED')
          // we unconditionally sign out in case they are signed in to the user in another tab.
          // if it fails, we weren't logged in.
          return onSignOut(false)
            .then(() => {
              console.log("Signout succeeded, sending to redirect");
              beginRedirecting(result)
            })
            .catch(() => {
              console.log("Signout failed, sending to redirect");
              beginRedirecting(result);
            });
          // console.log(result);
        })
        .catch((error) => {
          console.error(error);
          setVerificationState('ERROR');
          sendIntlMessageBase(intl, ERROR, 'errorVerifyFailed');
        });
    }
  }, [code, verificationState, intl, authState]);

  if (!code || verificationState === 'ERROR') {
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
