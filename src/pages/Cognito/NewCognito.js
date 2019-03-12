/* eslint-disable react/forbid-prop-types */
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import LockIcon from '@material-ui/icons/Lock';
import React, { useState } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import { Helmet } from 'react-helmet';
import { withRouter } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import PropTypes from 'prop-types';
import { AnonymousAuthorizer } from 'uclusion_authorizer_sdk';
import {
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Input,
  Button,
} from '@material-ui/core';
import appConfig from '../../config/config';
import { withMarketId } from '../../components/PathProps/MarketId';

const styles = theme => ({
  main: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'auto',
    [theme.breakpoints.only('xs')]: {
      paddingTop: 0,
      paddingBottom: 0,
    },
    paddingTop: theme.spacing.unit * 4,
    paddingBottom: theme.spacing.unit * 4,
  },
  card: {
    overflow: 'unset',
    width: 480,
    maxWidth: '100%',
    [theme.breakpoints.only('xs')]: {
      boxShadow: 'none',
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tabs: {
    [theme.breakpoints.only('xs')]: {
      alignSelf: 'stretch',
    },
  },
  logo: {
    width: 300,
    height: 300,
  },
  formField: {
    marginBottom: theme.spacing.unit,
  },
  loginButton: {
    marginTop: theme.spacing.unit,
  },
});

function NewCognito(props) {
  const [email, setEmail] = useState(undefined);
  const [name, setName] = useState(undefined);

  function handleEmailChange(event) {
    setEmail(event.target.value);
  }

  function handleNameChange(event) {
    setName(event.target.value);
  }

  const { classes, theme, marketId } = props;

  function handleSubmit(event) {
    event.preventDefault();
    const authorizer = new AnonymousAuthorizer({
      uclusionUrl: appConfig.api_configuration.baseURL,
    });
    const urlParams = new URLSearchParams(window.location.search);
    const creationToken = urlParams.get('creationToken');
    authorizer.cognitoUserCreate(name, email, creationToken).then(() => {
      window.location = `${window.location.origin}/${marketId}/investibles?newLogin=true`;
    });
  }

  return (
    <div className={classes.main}>
      <Helmet>
        <meta name="theme-color" content={theme.palette.primary.main} />
        <meta name="apple-mobile-web-app-status-bar-style" content={theme.palette.primary.main} />
        <meta name="msapplication-navbutton-color" content={theme.palette.primary.main} />
        <title>Uclusion Registration</title>
      </Helmet>
      <AppBar position="static">
        <Toolbar disableGutters>
          <div style={{ flex: 1 }} />
          <Tooltip id="tooltip-icon1" title="Sign in">
            <IconButton
              name="signin"
              aria-label="Open Uclusion"
              color="inherit"
              onClick={() => {
                window.location = `${window.location.href}${marketId}/Login`;
              }}
              rel="noopener"
            >
              <LockIcon />
            </IconButton>
          </Tooltip>
          <Tooltip id="tooltip-icon2" title="Uclusion website">
            <IconButton
              name="questionanswer"
              aria-label="Open Uclusion Website"
              color="inherit"
              href="https://www.uclusion.com"
              target="_blank"
              rel="noopener"
            >
              <QuestionAnswerIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <div className={classes.root}>
        <Card className={classes.card}>
          <CardContent>
            <div className={classes.content}>
              <img
                className={classes.logo}
                src="/watermark.png"
                alt="Uclusion Logo"
              />
              <form onSubmit={handleSubmit}>
                <FormControl className={classes.formField} fullWidth>
                  <InputLabel htmlFor="email">Email:</InputLabel>
                  <Input
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                  />
                </FormControl>
                <FormControl className={classes.formField} fullWidth>
                  <InputLabel htmlFor="name">Name:</InputLabel>
                  <Input
                    id="name"
                    value={name}
                    onChange={handleNameChange}
                  />
                </FormControl>
                <Button
                  className={classes.loginButton}
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                >
                  Submit
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

NewCognito.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
};

export default withRouter(withStyles(styles, { withTheme: true })(withMarketId(NewCognito)));
