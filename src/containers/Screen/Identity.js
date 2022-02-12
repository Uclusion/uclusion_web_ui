import React, { useContext, useState } from 'react';
import {
  Button,
  ListItem,
  ListItemText,
  makeStyles,
  Menu,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@material-ui/core'
import SettingsIcon from '@material-ui/icons/Settings';
import { useHistory } from 'react-router';
import Divider from '@material-ui/core/Divider';
import Link from '@material-ui/core/Link';
import { FormattedMessage, useIntl } from 'react-intl'
import { openInNewTab } from '../../utils/marketIdPathFunctions'
import SignOut from '../../pages/Authentication/SignOut';
import { CognitoUserContext } from '../../contexts/CognitoUserContext/CongitoUserContext';
import config from '../../config';
import { isFederated } from '../../contexts/CognitoUserContext/cognitoUserContextHelper';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import Gravatar from '../../components/Avatars/Gravatar';
import Grid from '@material-ui/core/Grid'
import IconButton from '@material-ui/core/IconButton'
import { ContactSupport, Face, Payment, PermIdentity, VpnKey } from '@material-ui/icons'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { hasNoChannels } from '../../contexts/MarketsContext/marketsContextHelper'

const useStyles = makeStyles((theme) => ({
  name: {
    color: theme.palette.text.primary,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem'
    },
  },
  menuStyle: {
    position: 'relative',
  },
  terms: {
    textAlign: 'center',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  identityBlock: {
    paddingBottom: theme.spacing(1),
    paddingLeft: '1rem',
    paddingRight: '1rem',
    textAlign: 'center',
    minWidth: '15rem'
  },
  changeAvatar: {
    color: 'black',
  },
  termsLink: {
    color: theme.palette.text.secondary,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem'
    },
  },
  buttonClass: {
    backgroundColor: '#efefef',
    textTransform: 'Capitalize',
    borderRadius: '8px',
    '& .MuiButton-label': {
      lineHeight: '.7'
    },
    [theme.breakpoints.down('sm')]: {
      width: 'auto',
      minWidth: 'auto',
      '& .MuiButton-endIcon': {
        margin: 0
      }
    },
  },
  chip: {
    border: '0.5px solid grey',
  },
  listAction: {
    paddingTop: 0,
    paddingBottom: 0,
    '&:hover': {
      backgroundColor: '#e0e0e0'
    },
  },
  signOut: {
    textAlign: 'center',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(1),
  },
  largeAvatar: {
    width: theme.spacing(8),
    height: theme.spacing(8),
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
    fontSize: theme.spacing(4),
  },
  user: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  }
}));

function Identity (props) {
  const classes = useStyles();
  const theme = useTheme();
  const [, , tokensHash] = useContext(MarketsContext);
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const user = useContext(CognitoUserContext);
  const canChangeUserValues = !isFederated(user);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const history = useHistory();
  const intl = useIntl();
  const email = !user ? '' : user.email;
  const chipLabel = !user ? '' : (user.name || '');
  const recordPositionToggle = (event) => {
    if (anchorEl === null) {
      setAnchorEl(event.currentTarget);
      setMenuOpen(true);
    } else {
      setAnchorEl(null);
      setMenuOpen(false);
    }
  };

  function goTo (to) {
    return () => {
      setAnchorEl(null);
      history.push(to);
    };
  }

  return (
    <div
      id="profileLink"
      style={{ paddingLeft: !mobileLayout ? '2rem' : '0.5rem' }}
    >
      <Button
        onClick={recordPositionToggle}
        endIcon={hasNoChannels(tokensHash) ? undefined : <SettingsIcon htmlColor="#bdbdbd"/>}
        className={classes.buttonClass}
        id="identityButton"
        disabled={hasNoChannels(tokensHash)}
      >
        <Gravatar
          key={chipLabel}
          email={email}
        />
      </Button>
      {anchorEl && (
        <Menu
          id="profile-menu"
          open={menuOpen}
          onClose={recordPositionToggle}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          anchorEl={anchorEl}
          disableRestoreFocus
        >
          <div className={classes.identityBlock}>
            <Gravatar className={classes.largeAvatar} email={email}/>
            <Typography>{chipLabel}</Typography>
            <Typography variant="caption" style={{color: 'grey'}}>{email}</Typography>
          </div>
          <Grid container alignItems="center" style={{paddingBottom: '1rem'}}>
            <Grid item xs={4} />
            <Grid item xs={1} style={{marginRight: '10px'}}>
              <Tooltip title={intl.formatMessage({ id: 'changePreferencesHeader' })}>
                <IconButton onClick={goTo('/notificationPreferences')} size="small" className={classes.chip}>
                  <PermIdentity style={{fontSize: 'medium'}} />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item xs={1} style={{marginRight: '10px'}}>
              <Tooltip title={intl.formatMessage({ id: 'changePasswordHeader' })}>
                <IconButton onClick={goTo('/changePassword')} size="small" className={classes.chip}
                            disabled={!canChangeUserValues}>
                  <VpnKey style={{fontSize: 'medium'}} />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item xs={1}>
              <Tooltip title={intl.formatMessage({ id: 'billingMenuItem' })}>
                <IconButton onClick={goTo('/billing')} size="small" className={classes.chip}>
                  <Payment style={{fontSize: 'medium'}} />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item xs={4} />
          </Grid>
          <Link href="https://www.gravatar.com"
                className={classes.changeAvatar}
                target="_blank"
                underline="none"
          >
            <ListItem className={classes.listAction}>
              <Face style={{fontSize: 'medium', marginRight: 6}} />
              <ListItemText className={classes.name}
                            primary={intl.formatMessage({ id: 'IdentityChangeAvatar' })} />
            </ListItem>
          </Link>
          <ListItem className={classes.listAction} onClick={goTo('/support')} style={{cursor: 'pointer'}}>
            <ContactSupport style={{fontSize: 'medium', marginRight: 6}} />
            <ListItemText className={classes.name}
                          primary={intl.formatMessage({ id: 'support' })} />
          </ListItem>
          <Divider style={{marginTop: '1rem'}} />
          <div className={classes.signOut}>
            <SignOut />
          </div>
          <div className={classes.terms}>
            {mobileLayout && (
              <Tooltip title={<FormattedMessage id="help" />}>
                <HelpOutlineIcon color="primary" style={{cursor: 'pointer', marginRight: '1rem'}}
                                 onClick={() => openInNewTab(config.helpLink)} />
              </Tooltip>
            )}
            <Link
              href={config.termsOfUseLink}
              target="_blank"
              className={classes.termsLink}
              underline="hover"
            >
              {intl.formatMessage({ id: 'IdentityTermsOfUse' })}
            </Link>
          </div>
        </Menu>
      )}
    </div>
  );
}

export default Identity;
