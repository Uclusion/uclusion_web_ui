import React, { useState, useReducer } from "react";
import _ from "lodash";
import { Auth } from "aws-amplify";
import { Button, TextField, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useIntl } from "react-intl";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import Avatar from "@material-ui/core/Avatar";
import { toastError } from "../../utils/userMessage";

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

function reducer(state, action) {
  const { name, value } = action;
  const newState = {
    ...state,
    [name]: value,
  };
  return newState;
}

function ForgotPassword(props) {
  const empty = {
    email: "",
    code: "",
    password: "",
  };
  const { authState } = props;
  const [userState, dispatch] = useReducer(reducer, empty);
  const [errorMessage, setErrorMessage] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const intl = useIntl();
  const classes = useStyles();

  const ALTERNATE_SIDEBAR_LOGO = 'Uclusion_Logo_White_Micro.png';
  const { email, code, password } = userState;

  function handleChange(name) {
    return event => {
      const {
        target: { value },
      } = event;
      dispatch({ name, value });
    };
  }

  function onSendCode() {
    Auth.forgotPassword(email)
      .then(() => {
        setErrorMessage("");
        setCodeSent(true);
        setPasswordReset(false);
      })
      .catch(error => {
        const { code } = error;
        if (code === "UserNotFoundException") {
          const message = intl.formatMessage({
            id: "forgotPasswordEmailNotFound",
          });
          console.log(message);
          setErrorMessage(message);
        } else {
          toastError("errorForgotPasswordCodeFailed");
        }
      });
  }

  function onSetNewPassword() {
    Auth.forgotPasswordSubmit(email, code, password)
      .then(() => {
        setErrorMessage("");
        setCodeSent(false);
        setPasswordReset(true);
      })
      .catch(error => {
        const { code } = error;
        if (code === "CodeMismatchException") {
          const message = intl.formatMessage({
            id: "forgotPasswordInvalidCode",
          });
          setErrorMessage(message);
        } else {
          toastError("errorForgotPasswordSetFailed");
        }
      });
  }

  if (authState !== "forgotPassword") {
    return <React.Fragment />;
  }

  if (!codeSent && !passwordReset) {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img width="35" height="35" src={`/images/${ALTERNATE_SIDEBAR_LOGO}`} alt="Uclusion" />
          </Avatar>
          <Typography component="h1" variant="h5">
            {intl.formatMessage({ id: "forgotPasswordHeader" })}
          </Typography>
          {!_.isEmpty(errorMessage) && (
            <Typography color="error">{errorMessage}</Typography>
          )}
          <form noValidate className={classes.form} autoComplete="off">
            <TextField
              id="email"
              fullWidth
              label={intl.formatMessage({ id: "forgotPasswordEmailLabel" })}
              onChange={handleChange("email")}
              margin="normal"
            />
          </form>
          <Button
            fullWidth
            variant="contained"
            className={classes.submit}
            onClick={onSendCode}
            disabled={_.isEmpty(email)}
          >
            {intl.formatMessage({ id: "forgotPasswordSendCodeButton" })}
          </Button>
        </div>
      </Container>
    );
  }

  if (codeSent) {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img width="35" height="35" src={`/images/${ALTERNATE_SIDEBAR_LOGO}`} alt="Uclusion" />
          </Avatar>
          <Typography component="h1" variant="h5">
            {intl.formatMessage({ id: "forgotPasswordHeader" })}
          </Typography>
          {!_.isEmpty(errorMessage) && (
            <Typography color="error">{errorMessage}</Typography>
          )}
          <form noValidate className={classes.form} autoComplete="off">
            <TextField
              id="code"
              required
              fullWidth
              label={intl.formatMessage({ id: "forgotPasswordCodeLabel" })}
              onChange={handleChange("code")}
              margin="normal"
            />
            <TextField
              id="password"
              required
              fullWidth
              label={intl.formatMessage({
                id: "forgotPasswordNewPasswordLabel",
              })}
              onChange={handleChange("password")}
              type="password"
              margin="normal"
            />
          </form>

          <Button fullWidth variant="contained" onClick={onSendCode}>
            {intl.formatMessage({ id: "forgotPasswordResendCode" })}
          </Button>
          <Button
            fullWidth
            variant="contained"
            className={classes.submit}
            onClick={onSetNewPassword}
            disabled={_.isEmpty(code) || _.isEmpty(password)}
          >
            {intl.formatMessage({ id: "forgotPasswordResetPasswordButton" })}
          </Button>
        </div>
      </Container>
    );
  }

  if (passwordReset) {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img width="35" height="35" src={`/images/${ALTERNATE_SIDEBAR_LOGO}`} alt="Uclusion" />
          </Avatar>
          <Typography component="h1" variant="h5">
            Your password is reset!
          </Typography>
          <Typography component="h1" variant="h5">
            Click <a href="/">here</a> to log in.
          </Typography>
        </div>
      </Container>
    );
  }

  return <React.Fragment />;
}

export default ForgotPassword;
