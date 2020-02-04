import React, { useEffect, useState } from "react";
import _ from "lodash";
import { useHistory } from "react-router";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import Avatar from "@material-ui/core/Avatar";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import { verifyEmail } from "../../api/sso";
import { redirectToPath, setRedirect } from "../../utils/redirectUtils";
import { sendIntlMessageBase, ERROR } from "../../utils/userMessage";
import { useIntl } from 'react-intl'

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: "#3f6b72",
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
    backgroundColor: "#3f6b72",
    color: "#fff",
  },
}));

function VerifyEmail(props) {
  const LOGIN = "/";
  const ALTERNATE_SIDEBAR_LOGO = "Uclusion_Logo_White_Micro.png";
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const params = new URL(document.location).searchParams;
  const [verificationState, setVerificationState] = useState(undefined);
  const code = params.get("code");

  useEffect(() => {
    function initiateRedirect() {
      setTimeout(() => {
        console.debug("redirecting you to login");
        redirectToPath(history, LOGIN);
      }, 5000);
    }
    if (code && !verificationState) {
      verifyEmail(code)
        .then(result => {
          const { redirect } = result;
          if (!_.isEmpty(redirect)) {
            setRedirect(redirect);
          }
          setVerificationState("VERIFIED");
          initiateRedirect();
        })
        .catch((error) => {
          console.error(error);
          sendIntlMessageBase(intl, ERROR, "errorVerifyFailed");
        });
    }
  }, [code, verificationState, history]);

  if (!code) {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
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
            No code was provided. Please provide a verification link from the
            email.
          </Typography>
        </div>
      </Container>
    );
  }

  if (verificationState === "ALREADY_EXISTS") {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
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

  if (verificationState === "VERIFIED") {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
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
      <CssBaseline />
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
          We are verifying your email now.
        </Typography>
      </div>
    </Container>
  );
}

export default VerifyEmail;
