import AppBar from '@material-ui/core/AppBar'
import IconButton from '@material-ui/core/IconButton'
import LockIcon from '@material-ui/icons/Lock'
import React, { Component } from 'react'
import Toolbar from '@material-ui/core/Toolbar'
import Tooltip from '@material-ui/core/Tooltip'
import Typography from '@material-ui/core/Typography'
import { GitHubIcon } from '../../components/Icons'
import { Helmet } from 'react-helmet'
import { withRouter } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'

const styles = theme => ({
  main: {
    display: 'flex',
    flexDirection: 'column'
  },
  root: {
    flexGrow: 1,
    flex: '1 0 100%'
    // height: '100%',
    // overflow: 'hidden'
  },
  hero: {
    height: '100%',
    // minHeight: '80vh',
    flex: '0 0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.type === 'light' ? theme.palette.primary.dark : theme.palette.primary.main
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    letterSpacing: '.7rem',
    textIndent: '.7rem',
    fontWeight: theme.typography.fontWeightLight,
    [theme.breakpoints.only('xs')]: {
      fontSize: 24,
      letterSpacing: '.1em',
      textIndent: '.1rem'
    },
    whiteSpace: 'nowrap'
  },
  headline: {
    paddingLeft: theme.spacing.unit * 4,
    paddingRight: theme.spacing.unit * 4,
    marginTop: theme.spacing.unit,
    maxWidth: 600,
    textAlign: 'center',
    [theme.breakpoints.only('xs')]: {
      fontSize: 18
    }
  },
  content: {
    height: '100%',
    // paddingTop: theme.spacing.unit * 8,
    [theme.breakpoints.up('sm')]: {
      paddingTop: theme.spacing.unit
    }
  },
  button: {
    marginTop: theme.spacing.unit * 3
  },
  logo: {
    marginLeft: '37%',
    width: '25%',
    height: '25%'
  },
  steps: {
    maxWidth: theme.spacing.unit * 130,
    margin: 'auto'
  },
  step: {
    padding: `${theme.spacing.unit * 3}px ${theme.spacing.unit * 2}px`
  },
  stepIcon: {
    marginBottom: theme.spacing.unit
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
      paddingTop: 15
    }

  },
  card: {
    minWidth: 275,
    maxWidth: 350,
    margin: 15,
    [theme.breakpoints.only('xs')]: {
      width: '100%',
      margin: 0,
      marginTop: 7
    }
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

})

class LandingPage extends Component {


  isAuthorised = () => {
    try {
      const key = Object.keys(localStorage).find(e => e.match(/persist:root/))
      const data = JSON.parse(localStorage.getItem(key))
      const auth = JSON.parse(data.auth)

      return auth && auth.isAuthorised

    } catch (ex) {
      return false
    }
  }

  componentDidMount() {
    const { history } = this.props

    if (this.isAuthorised()) {
      history.push('/signin')
    }
  }


  render() {
    const { classes, history, theme } = this.props

    return (
      <div className={classes.main}>
        <Helmet>
          <meta name="theme-color" content={theme.palette.primary.main} />
          <meta name="apple-mobile-web-app-status-bar-style" content={theme.palette.primary.main} />
          <meta name="msapplication-navbutton-color" content={theme.palette.primary.main} />
          <title>UCLUSION MOST WANTED</title>
        </Helmet>
        <AppBar position='static'>
          <Toolbar disableGutters>
            <div style={{ flex: 1 }} />

            <Tooltip id="tooltip-icon1" title="Sign in">
              <IconButton
                name='signin'
                aria-label='Open Github'
                color='inherit'
                onClick={() => { history.push('/signin') }}
                rel='noopener'
              >
                <LockIcon />
              </IconButton>
            </Tooltip>
            <Tooltip id="tooltip-icon2" title="GitHub repository">
              <IconButton
                name='github'
                aria-label='Open Github'
                color='inherit'
                href='https://github.com/TarikHuber/react-most-wanted'
                target='_blank'
                rel='noopener'
              >
                <GitHubIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <div className={classes.root}>
          <div className={classes.hero}>
            <div className={classes.content}>
              <img
                src='/uclusion_ulogo.jpg'
                alt='Uclusion Logo'
                className={classes.logo}
              />
              <div className={classes.text}>
                <Typography
                  variant='display2'
                  align='center'
                  component='h1'
                  color='inherit'
                  gutterBottom
                  className={classes.title}
                >
                  {'UCLUSION MOST WANTED'}
                </Typography>
                <Typography
                  variant='headline'
                  component='h2'
                  color='inherit'
                  gutterBottom
                  className={classes.headline}
                >
                  {'Uclusion Starter-Kit with all Most Wanted features.'}
                </Typography>
              </div>

              <div className={classes.cardsContent}>
                <Card className={classes.card}>
                  <CardContent>
                    <Typography  >{`Try Uclusion Slack integration:`}</Typography>
                    <br />
                    <a href="https://slack.com/oauth/authorize?scope=commands,bot&client_id=378072647557.383178544246&redirect_uri=https://t5e5r3c2ld.execute-api.us-west-2.amazonaws.com/dev/signup">
                      <img alt="Add to Slack" height="40" width="139"
                           src="https://platform.slack-edge.com/img/add_to_slack.png"
                           srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"/>
                    </a>
                  </CardContent>
                </Card>
                <Card className={classes.card}>
                  <CardContent>
                    <Typography  >{`Login with Slack:`}</Typography>
                    <br />
                    <a href={'https://slack.com/oauth/authorize?scope=identity.basic&client_id=378072647557.383178544246&state='
                    +window.location.href+'&redirect_uri=https://t5e5r3c2ld.execute-api.us-west-2.amazonaws.com/dev/login'}>
                      <img alt="Login with Slack" src="https://api.slack.com/img/sign_in_with_slack.png" /></a>
                  </CardContent>
                  <CardActions>
                  </CardActions>
                </Card>
                <Card className={classes.card}>
                  <CardContent>
                    <Typography variant="headline" component="h2">Login with Email Address</Typography>
                      <br />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

    )
  }
}

export default withRouter(withStyles(styles, { withTheme: true })(LandingPage))
