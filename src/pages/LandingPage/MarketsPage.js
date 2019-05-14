import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Card,
  CardContent,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { Helmet } from 'react-helmet';
import { getCurrentUser } from '../../store/Users/reducer';

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
  logo: {
    width: 300,
    height: 300,
  },
});

function LandingPage(props) {
  const { intl } = props;
  const { classes, theme } = props;
  return (
    <div className={classes.main}>
      <Helmet>
        <meta name="theme-color" content={theme.palette.primary.main} />
        <meta name="apple-mobile-web-app-status-bar-style" content={theme.palette.primary.main} />
        <meta name="msapplication-navbutton-color" content={theme.palette.primary.main} />
        <title>{intl.formatMessage({ id: 'landingPageUclusionRegistration' })}</title>
      </Helmet>
      <AppBar position="static">
        <Toolbar disableGutters>
          {/* <div style={{ flex: 1 }} />
          {user && user.default_market_id && (
            <Tooltip title={intl.formatMessage({ id: 'landingPageSigninTooltip' })}>
              <IconButton
                name="signin"
                aria-label={intl.formatMessage({ id: 'landingPageOpenUclusion' })}
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
          <Tooltip title={intl.formatMessage({ id: 'landingPageHelpTooltip' })}>
            <IconButton
              name="questionanswer"
              aria-label={intl.formatMessage({ id: 'landingPageOpenUclusionHelp' })}
              color="inherit"
              href="https://www.uclusion.com/help_videos/admins/help.html"
              target="_blank"
              rel="noopener"
            >
              <QuestionAnswerIcon />
            </IconButton>
          </Tooltip> */}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

LandingPage.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  user: PropTypes.object,
  intl: PropTypes.func.isRequired,
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
)(withRouter(withStyles(styles, { withTheme: true })(injectIntl(LandingPage))));
