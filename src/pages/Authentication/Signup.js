import React, { useReducer, useState } from "react";
import { TextField, Button } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import Avatar from "@material-ui/core/Avatar";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import { useIntl } from "react-intl";
import { signUp } from "../../api/sso";
import { useHistory } from "react-router";
import { makeStyles } from "@material-ui/core/styles";

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

function Signup(props) {
  const classes = useStyles();
  const { authState } = props;
  const empty = {
    name: "",
    email: "",
    password: "",
  };

  const [userState, dispatch] = useReducer(reducer, empty);
  const [postSignUp, setPostSignUp] = useState(undefined);
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname, hash } = location;
  const ALTERNATE_SIDEBAR_LOGO = 'Uclusion_Logo_White_Micro.png';

  function handleChange(name) {
    return event => {
      const {
        target: { value },
      } = event;
      dispatch({ name, value });
    };
  }

  function onSignUp() {
    const { name, email, password } = userState;
    let redirect;
    if (pathname !== "/") {
      // we came here by some other link and need to log in
      redirect = pathname;
      if (hash) {
        redirect += `#${hash}`;
      }
    }
    return signUp(name, email, password, redirect).then(result => {
      const { response } = result;
      setPostSignUp(response);
    });
  }

  function getResendButton() {
    return (
      <Button
        fullWidth
        variant="contained"
        className={classes.submit}
        onClick={onSignUp}
      >
        Resend Code
      </Button>
    );
  }

  if (authState !== "signUp") {
    return <></>;
  }

  if (postSignUp === "USER_CREATED") {
    return (
      <Container component="main" maxWidth="md">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img width="35" height="35" src={`/images/${ALTERNATE_SIDEBAR_LOGO}`} alt="Uclusion" />
          </Avatar>
          <Typography component="h1" variant="h5">
            Your user is created, and a verification link has been sent to your
            email. Please click the link inside to continue.
          </Typography>
          {getResendButton()}
        </div>
      </Container>
    );
  }

  if (postSignUp === "VERIFICATION_RESENT") {
    return (
      <Container component="main" maxWidth="md">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img width="35" height="35" src={`/images/${ALTERNATE_SIDEBAR_LOGO}`} alt="Uclusion" />
          </Avatar>
          <Typography component="h1" variant="h5">
            We have resent a verification email to you. Please click the link
            inside to continue.
          </Typography>
          {getResendButton()}
        </div>
      </Container>
    );
  }

  if (postSignUp === "ACCOUNT_EXISTS") {
    return (
      <Container component="main" maxWidth="md">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img width="35" height="35" src={`/images/${ALTERNATE_SIDEBAR_LOGO}`} alt="Uclusion" />
          </Avatar>
          <Typography component="h1" variant="h5">
            An account with that email already exists, please log in.
          </Typography>
          <Grid container justify="center">
            <Grid item>
              <Link href="/" variant="body2">
                Log In
              </Link>
            </Grid>
          </Grid>
        </div>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <img width="35" height="35" src={`/images/${ALTERNATE_SIDEBAR_LOGO}`} alt="Uclusion" />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign Up
        </Typography>
        <form className={classes.form} noValidate autoComplete="off">
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoComplete="name"
                name="name"
                variant="outlined"
                required
                fullWidth
                id="name"
                autoFocus
                label={intl.formatMessage({ id: "signupNameLabel" })}
                onChange={handleChange("name")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="email"
                name="email"
                autoComplete="email"
                label={intl.formatMessage({ id: "signupEmailLabel" })}
                onChange={handleChange("email")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                name="password"
                type="password"
                id="password"
                autoComplete="current-password"
                label={intl.formatMessage({ id: "signupPasswordLabel" })}
                onChange={handleChange("password")}
              />
            </Grid>
          </Grid>
          <Button
            fullWidth
            variant="contained"
            className={classes.submit}
            onClick={onSignUp}
          >
            {intl.formatMessage({ id: "signupSignupLabel" })}
          </Button>
          <Grid container justify="flex-end">
            <Grid item>
              <Link href="/" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
    </Container>
  );
}

export default Signup;
