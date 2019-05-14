/* eslint-disable react/forbid-prop-types */
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import LockIcon from '@material-ui/icons/Lock';
import React, { useEffect, useState } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import { Helmet } from 'react-helmet';
import { withRouter } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { AnonymousAuthorizer } from 'uclusion_authorizer_sdk';
import {
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Input,
  Button, Typography,
} from '@material-ui/core';
import appConfig from '../../config/config';
import { withMarketId } from '../../components/PathProps/MarketId';
import { getErrorMessage, getLoginParams, loginAnonymous } from '../../utils/loginFunctions';
import HtmlRichTextEditor from '../../components/TextEditors/HtmlRichTextEditor';

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
    minWidth: 300,
    minHeight: 300,
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
  const [marketName, setMarketName] = useState('');
  const [marketDescription, setMarketDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  function handleEmailChange(event) {
    setEmail(event.target.value);
  }

  function handleNameChange(event) {
    setName(event.target.value);
  }

  const {
    classes, theme, marketId, intl,
  } = props;

  useEffect(() => {
    const loginParams = getLoginParams();
    const { anonymousLogin } = loginParams;
    if (anonymousLogin) {
      loginAnonymous(props);
    }
    const authorizer = new AnonymousAuthorizer(loginParams);
    authorizer.marketLoginInfo().then((response) => {
      setMarketDescription(response.description);
      setMarketName(response.name);
    }).catch((error) => {
      getErrorMessage(error)
        .then((errorString) => {
          setError(errorString);
        });
    });
    return () => {
    };
  }, []);

  function handleSubmit(event) {
    if (!processing) {
      setProcessing(true);
      event.preventDefault();
      const authorizer = new AnonymousAuthorizer({
        uclusionUrl: appConfig.api_configuration.baseURL,
      });
      const urlParams = new URLSearchParams(window.location.search);
      const creationToken = urlParams.get('creationToken');
      let promise;
      if (creationToken) {
        promise = authorizer.cognitoUserCreate(name, email, creationToken);
      } else {
        promise = authorizer.cognitoUserSignup(marketId, name, email);
      }
      promise.then((user) => {
        let location = `${window.location.origin}/${marketId}/investibles`;
        const encodedEmail = encodeURIComponent(email);
        if (!user.exists_in_cognito) {
          location += `?newLogin=true&email=${encodedEmail}`;
        } else {
          location += `?email=${encodedEmail}`;
        }
        window.location = location;
      }).catch((error) => {
        getErrorMessage(error)
          .then((errorString) => {
            setError(errorString);
          });
      }).finally(() => {
        if (processing) {
          setProcessing(false);
        }
      });
    }
  }

  return (
    <div className={classes.main}>
      <Helmet>
        <meta name="theme-color" content={theme.palette.primary.main} />
        <meta name="apple-mobile-web-app-status-bar-style" content={theme.palette.primary.main} />
        <meta name="msapplication-navbutton-color" content={theme.palette.primary.main} />
        <title>{intl.formatMessage({ id: 'cognitoRegistrationTitle' })}</title>
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
          <Tooltip id="tooltip-icon2" title="Uclusion Help">
            <IconButton
              name="questionanswer"
              aria-label="Open Uclusion Help"
              color="inherit"
              href="https://www.uclusion.com/help_videos/users/help.html"
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
              <Typography variant="h3">
                {error}
              </Typography>
              <Typography variant="h3">
                {marketName}
              </Typography>
              <div className={classes.logo}>
                <HtmlRichTextEditor value={marketDescription} readOnly />
              </div>
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
                  disabled={processing}
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
  intl: PropTypes.object.isRequired,
};

export default injectIntl(withRouter(withStyles(styles, { withTheme: true })(withMarketId(NewCognito))));
