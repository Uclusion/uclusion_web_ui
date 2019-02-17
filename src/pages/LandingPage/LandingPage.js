import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import LockIcon from '@material-ui/icons/Lock';
import React, { useState, useEffect } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import { Helmet } from 'react-helmet';
import { withRouter } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { AnonymousAuthorizer } from 'uclusion_authorizer_sdk';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Input from '@material-ui/core/Input';
import ArrowDropdown from '@material-ui/icons/ArrowDropDown';
import { getCurrentUser } from '../../store/Users/reducer';
import appConfig from '../../config/config';
import { setUclusionLocalStorageItem, getUclusionLocalStorageItem } from '../../components/utils';
import { getClient } from '../../config/uclusionClient';

const styles = theme => ({
  main: {
    display: 'flex',
    flexDirection: 'column',
  },
  root: {
    flexGrow: 1,
    flex: '1 0 100%',
    // height: '100%',
    // overflow: 'hidden'
  },
  hero: {
    height: '100%',
    // minHeight: '80vh',
    flex: '0 0 auto',
    display: 'flex',
    justifyContent: 'left',
    alignItems: 'left',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.type === 'light' ? theme.palette.primary.dark : theme.palette.primary.main,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    letterSpacing: '.7rem',
    textIndent: '.7rem',
    fontWeight: theme.typography.fontWeightLight,
    [theme.breakpoints.only('xs')]: {
      fontSize: 24,
      letterSpacing: '.1em',
      textIndent: '.1rem',
    },
    whiteSpace: 'nowrap',
  },
  headline: {
    paddingLeft: theme.spacing.unit * 4,
    paddingRight: theme.spacing.unit * 4,
    marginTop: theme.spacing.unit,
    maxWidth: 600,
    textAlign: 'center',
    [theme.breakpoints.only('xs')]: {
      fontSize: 18,
    },
  },
  content: {
    height: '100%',
    // paddingTop: theme.spacing.unit * 8,
    [theme.breakpoints.up('sm')]: {
      paddingTop: theme.spacing.unit,
    },
  },
  button: {
    marginTop: theme.spacing.unit * 3,
  },
  logo: {
    marginLeft: '0%',
  },
  steps: {
    maxWidth: theme.spacing.unit * 130,
    margin: 'auto',
  },
  step: {
    padding: `${theme.spacing.unit * 3}px ${theme.spacing.unit * 2}px`,
  },
  stepIcon: {
    marginBottom: theme.spacing.unit,
  },
  markdownElement: {},
  cardsContent: {
    padding: 15,
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    [theme.breakpoints.only('xs')]: {
      width: '100%',
      padding: 0,
      paddingTop: 15,
    },

  },
  card: {
    minWidth: 275,
    maxWidth: 350,
    margin: 15,
    [theme.breakpoints.only('xs')]: {
      width: '100%',
      margin: 0,
      marginTop: 7,
    },
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  cardTitle: {
    marginBottom: 16,
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },

});

function createMarket(client, accountCreationInfo) {
  client.markets.createMarket({
    name: accountCreationInfo.marketName,
    description: accountCreationInfo.marketDescription,
  }).then((market) => {
    window.location = `${window.location.origin}/${market.market_id}/marketCategories`;
  })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

function LandingPage(props) {
  const [accountName, setAccountName] = useState(undefined);
  const [marketName, setMarketName] = useState(undefined);
  const [marketDescription, setMarketDescription] = useState(undefined);
  const [clientId, setClientId] = useState(undefined);
  const [oidcType, setOidcType] = useState('GOOGLE');
  const [processing, setProcessing] = useState(false);
  useEffect(() => {
    const authorizer = new AnonymousAuthorizer({
      uclusionUrl: appConfig.api_configuration.baseURL,
    });
    const pageUrl = window.location.href;
    if (authorizer.amIOnPostAuthorizePage(pageUrl) && !processing) {
      setProcessing(true);
      const accountCreationInfo = getUclusionLocalStorageItem('accountCreationInfo');
      setAccountName(accountCreationInfo.accountName);
      setMarketName(accountCreationInfo.marketName);
      setMarketDescription(accountCreationInfo.marketDescription);
      setClientId(accountCreationInfo.clientId);
      setOidcType(accountCreationInfo.oidcType);
      authorizer.doPostAccount(pageUrl).then((response) => {
        const authInfo = {
          token: response.login_capability, type: authorizer.getType(),
        };
        setUclusionLocalStorageItem('auth', authInfo);
        return getClient();
      }).then((client) => {
        // https://forums.aws.amazon.com/thread.jspa?threadID=298683&tstart=0
        setTimeout(createMarket(client, accountCreationInfo), 5000);
      });
    }
    return () => {};
  });
  function handleAccountNameChange(event) {
    setAccountName(event.target.value);
  }

  function handleMarketNameChange(event) {
    setMarketName(event.target.value);
  }

  function handleMarketDescriptionChange(event) {
    setMarketDescription(event.target.value);
  }

  function handleClientIdChange(event) {
    setClientId(event.target.value);
  }

  function handleOidcTypeChange(event) {
    setOidcType(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const accountCreationInfo = {
      marketName, marketDescription, accountName, clientId, oidcType,
    };
    setUclusionLocalStorageItem('accountCreationInfo', accountCreationInfo);
    const authorizer = new AnonymousAuthorizer({
      uclusionUrl: appConfig.api_configuration.baseURL,
    });
    authorizer.accountRedirect({
      uclusion_client_id: clientId,
      op_endpoint_base_url: oidcType === 'GOOGLE' ? 'https://accounts.google.com' : 'https://dev-496062.oktapreview.com/oauth2/default',
      account_name: accountName,
      team_name: `Team ${marketName}`,
      team_description: `${marketName} administrators`,
      redirect_url: `${window.location.href}`,
      oidc_type: oidcType,
    }).then((redirectUrl) => {
      window.location = redirectUrl;
    }).catch((reject) => {
      console.error(reject);
    });
  }

  const { classes, theme, user } = props;

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
          {user && user.default_market_id && (
          <Tooltip id="tooltip-icon1" title="Sign in">
            <IconButton
              name="signin"
              aria-label="Open Uclusion"
              color="inherit"
              onClick={() => {
                window.location = `${window.location.href}${user.default_market_id}/Login`;
              }}
              rel="noopener"
            >
              <LockIcon />
            </IconButton>
          </Tooltip>
          )}
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
        <div className={classes.hero}>
          <div className={classes.content}>
            <img
              src="/watermark.png"
              alt="Uclusion Logo"
              className={classes.logo}
            />
          </div>
          <div className={classes.content}>
            <form onSubmit={handleSubmit}>
              <label htmlFor="accountNameId">
                Account Name:
                <input id="accountNameId" type="text" value={accountName} onChange={handleAccountNameChange} />
              </label>
              <label htmlFor="marketNameId">
                Market Name:
                <input id="marketNameId" type="text" value={marketName} onChange={handleMarketNameChange} />
              </label>
              <label htmlFor="marketDescriptionId">
                Market Description:
                <input id="marketDescriptionId" type="text" value={marketDescription} onChange={handleMarketDescriptionChange} />
              </label>
              <label htmlFor="clientId">
                Authorization Client ID from Google or Okta:
                <input id="clientId" type="text" value={clientId} onChange={handleClientIdChange} />
              </label>
              <FormControl>
                <Select
                  disableUnderline
                  value={oidcType}
                  onChange={handleOidcTypeChange}
                  IconComponent={() => <ArrowDropdown className={classes.selectArrow} />}
                  input={<Input name="oidcType" id="oidcTypeId" />}
                >
                  <MenuItem key="GOOGLE" value="GOOGLE">GOOGLE</MenuItem>
                  <MenuItem key="OKTA" value="OKTA">OKTA</MenuItem>
                </Select>
              </FormControl>
              <input type="submit" value="Submit" />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

LandingPage.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  user: PropTypes.object,
};

const mapStateToProps = state => ({
  user: getCurrentUser(state.usersReducer),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withRouter(withStyles(styles, { withTheme: true })(LandingPage)));
