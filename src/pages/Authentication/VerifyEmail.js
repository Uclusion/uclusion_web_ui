import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import Container from '@material-ui/core/Container'
import CssBaseline from '@material-ui/core/CssBaseline'
import Avatar from '@material-ui/core/Avatar'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import { verifyEmail } from '../../api/sso'
import { setRedirect } from '../../utils/redirectUtils'
import { ERROR, sendIntlMessageBase } from '../../utils/userMessage'
import { useIntl } from 'react-intl'
import { onSignOut } from '../../utils/userFunctions'
import { Auth } from 'aws-amplify'
import { Button } from '@material-ui/core'

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
  const LOGIN = '/'
  const ALTERNATE_SIDEBAR_LOGO = 'Uclusion_Logo_White_Micro.png'
  const intl = useIntl()
  const classes = useStyles()
  const params = new URL(document.location).searchParams
  const [verificationState, setVerificationState] = useState(undefined)
  const code = params.get('verifyCode')

  useEffect(() => {
    // we unconditionally sign out in case they are signed in to the user in another tab.
    // if it fails, we weren't logged in.
    Auth.currentAuthenticatedUser().then(() => setVerificationState('MUST_LOGOUT'))
      .catch(() => {
        console.log('Ignore the 400 error we were checking if user existed.');
        setVerificationState('READY_TO_PROCESS');
      })
    return () => {}
  }, [])

  useEffect(() => {
    function beginRedirecting (result) {
      console.log('Beginning redirect')
      const { redirect } = result
      if (!_.isEmpty(redirect)) {
        console.log(`Setting redirect to ${redirect}`)
        setRedirect(redirect)
      }
      console.log('redirecting to LOGIN')
      window.location.pathname = LOGIN;
    }

    if (code && verificationState === 'READY_TO_PROCESS') {
      console.log('Processing ready to process');
      setVerificationState('PROCESSING');
      verifyEmail(code)
        .then(result => {
          setVerificationState('VERIFIED')
          return beginRedirecting(result)
        })
        .catch((error) => {
          console.error(error)
          setVerificationState('ERROR')
          sendIntlMessageBase(intl, ERROR, 'errorVerifyFailed')
        });
    }
  }, [code, verificationState, intl]);

  if (!verificationState || verificationState === 'MUST_LOGOUT') {
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
            You are already logged in - please logout if you want to verify as a different user.
          </Typography>
          <Button
            variant="text"
            fullWidth={true}
            onClick={onSignOut}
            className={classes.action}
            disableRipple
          >
            {intl.formatMessage({ id: 'signOutButton' })}
          </Button>
        </div>
      </Container>
    );
  }

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
