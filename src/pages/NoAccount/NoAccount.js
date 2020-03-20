import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import { darken, makeStyles } from "@material-ui/core/styles";
import ApiBlockingButton from '../../components/SpinBlocking/ApiBlockingButton';
import { resendVerification } from '../../api/sso';
import { CardActions, Typography } from '@material-ui/core'
import Screen from '../../containers/Screen/Screen';
import CardContent from '@material-ui/core/CardContent';
import Card from '@material-ui/core/Card';

const useStyles = makeStyles((theme) => {
  return {
    submit: {
      backgroundColor: "#3f6b72",
      color: "black",
      "&:hover": {
        backgroundColor: darken("#3f6b72", 0.04)
      },
      "&:focus": {
        backgroundColor: darken("#3f6b72", 0.12)
      }
    },
    actions: {
      margin: theme.spacing(1, 0, 0, 0)
    },
    loadingDisplay: {
      display: "flex",
      flexWrap: "wrap",
      padding: theme.spacing(6),
      "& > *": {
        "flex-grow": 1,
        margin: theme.spacing(1, 0),
        "&:first-child": {
          marginTop: 0
        },
        "&:last-child": {
          marginBottom: 0
        }
      }
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
        type="submit"
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
      title="Email not verified"
      appEnabled={false}
    >
      <Card>
        <CardContent className={classes.loadingDisplay}>
          <Typography variant="h3">
            Email not verified
          </Typography>
          <Typography>
            Your email ({email}) has not been verified yet. In order to use Uclusion you must verify your email address via
            the link we sent to your email, then logout and log back in. If you do not have that link, you may get a new one
            by clicking Resend Link
          </Typography>
          <CardActions className={classes.actions}>
            {getResendButton()}
          </CardActions>
          {getPostReendContent()}
        </CardContent>
      </Card>
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
