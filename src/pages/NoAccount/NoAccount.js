import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import CssBaseline from '@material-ui/core/CssBaseline'
import Typography from '@material-ui/core/Typography'
import Container from '@material-ui/core/Container'
import { makeStyles } from '@material-ui/core/styles'
import { resendVerification } from '../../api/sso'
import ApiBlockingButton from '../../components/SpinBlocking/ApiBlockingButton'
import { Auth } from 'aws-amplify'

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
  submit: {
    margin: theme.spacing(3, 0, 2),
    backgroundColor: '#3f6b72',
    color: '#fff',
  },
}));

function NoAccount(props) {
  const { email, authState } = props;
  const intl = useIntl();
  const classes = useStyles();

  useEffect(() => {
    if (authState === 'signedIn') {
      console.info('Signing out with no account');
      Auth.signOut();
    }
  }, [authState]);

  function onResend() {
    return resendVerification(email);
  }

  function getResendButton() {
    return (
      <ApiBlockingButton
        fullWidth
        variant="contained"
        className={classes.submit}
        onClick={onResend}
      >
        {intl.formatMessage({ id: 'signupResendCodeButton' })}
      </ApiBlockingButton>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline/>
      <div className={classes.paper}>
        <Typography component="h1" variant="h5" align="center">
          {intl.formatMessage({ id: 'signInNotVerified' }, { email })}
        </Typography>
        {getResendButton()}
      </div>
    </Container>
  );
}

NoAccount.propTypes = {
  email: PropTypes.string.isRequired,
  authState: PropTypes.string.isRequired,
};

export default NoAccount;
