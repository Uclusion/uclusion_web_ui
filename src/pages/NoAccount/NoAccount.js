import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import ApiBlockingButton from '../../components/SpinBlocking/ApiBlockingButton';
import { resendVerification } from '../../api/sso';
import { makeStyles } from '@material-ui/styles';
import { Typography } from '@material-ui/core';
import Screen from '../../containers/Screen/Screen';

const useStyles = makeStyles((theme) => {
  return {
    submit: {
      margin: theme.spacing(3, 0, 2),
      backgroundColor: '#3f6b72',
      color: '#fff',
    },
  };
});

function NoAccount(props) {

  const { email } = props;
  const intl = useIntl();
  const classes = useStyles();

  const [postResend, setPostResend] = useState(null);

  function onResend() {
    return resendVerification(email).then((result) => {
      const { response } = result;
      setPostResend(response);
    });
  }

  function getResendButton() {
    return (
      <ApiBlockingButton
        variant="contained"
        className={classes.submit}
        onClick={onResend}
      >
        {intl.formatMessage({ id: 'signupResendCodeButton' })}
      </ApiBlockingButton>
    );
  }

  function getPostReendContent() {
    if (_.isEmpty(postResend)) {
      return <React.Fragment/>;
    }
    if (postResend === 'ACCOUNT_EXISTS') {
      return (
        <Typography>
          The email has now been verified. Please log out and log back in again.
        </Typography>
      );
    }
    if (postResend === 'VERIFICATION_RESENT') {
      return (
        <Typography>We have resent the verification link.
          If you do not receive it please check your spam filter, or try
          resending again.
        </Typography>
      );
    }
    return <React.Fragment/>;
  }

  return (
    <Screen
      // TODO: meaningful title
      tabTitle=""
      title="Email not Verified"
      appEnabled={false}
    >
      <Typography variant="h3">
        Email not Verified
      </Typography>
      <Typography component="div">
        Your email ({email}) has not been verified yet. In order to use Uclusion you must verify your email address via
        the link we sent to your email, then logout and log back in. If you do not have that link, you may get a new one
        by clicking Resend Link
      </Typography>
      {getResendButton()}
      {getPostReendContent()}
    </Screen>
  );
}

NoAccount.propTypes = {
  email: PropTypes.string,
};

NoAccount.defaultProps = {
  email: '',
};

export default NoAccount;
