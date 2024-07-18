import React, { useContext, useState } from 'react';
import {
  Button,
  makeStyles,
  Menu,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import SettingsIcon from '@material-ui/icons/Settings';
import { useHistory } from 'react-router';
import Divider from '@material-ui/core/Divider';
import Link from '@material-ui/core/Link';
import { FormattedMessage, useIntl } from 'react-intl'
import { openInNewTab } from '../../utils/marketIdPathFunctions';
import { CognitoUserContext } from '../../contexts/CognitoUserContext/CongitoUserContext';
import config from '../../config';
import { isFederated } from '../../contexts/CognitoUserContext/cognitoUserContextHelper';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline'
import Gravatar from '../../components/Avatars/Gravatar';
import Grid from '@material-ui/core/Grid'
import IconButton from '@material-ui/core/IconButton'
import { ContactSupport, Face, Payment, PermIdentity, VpnKey } from '@material-ui/icons';
import md5 from 'md5';
import { SIGN_OUT_WIZARD_TYPE } from '../../constants/markets';
import { OnlineStateContext } from '../../contexts/OnlineStateContext';

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
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
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

function Identity () {
  const classes = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const user = useContext(CognitoUserContext);
  const canChangeUserValues = !isFederated(user);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [online] = useContext(OnlineStateContext);
  const history = useHistory();
  const intl = useIntl();
  const email = user?.email || '';
  const chipLabel = user?.name || '';

  function GravatarExists() {
    try {
      const url = `https://www.gravatar.com/avatar/${md5(email, { encoding: 'binary' })}?d=404`;
      const http = new XMLHttpRequest();
      http.open('HEAD', url, false);
      http.send();
      return http.status !== 404;
    } catch (e) {
      return false;
    }
  }

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

  // No need to check when menu closed
  const gravatarExists = menuOpen && (!online || GravatarExists());

  return (
    <div
      id="profileLink"
      style={{ paddingLeft: !mobileLayout ? '2rem' : undefined }}
    >
      {mobileLayout && (
        <IconButton onClick={recordPositionToggle} id="identityButton" style={{paddingLeft: 0}}>
          <SettingsIcon htmlColor="white"/>
        </IconButton>
      )}
      {!mobileLayout && (
        <Button
          onClick={recordPositionToggle}
          endIcon={<SettingsIcon htmlColor="#bdbdbd"/>}
          className={classes.buttonClass}
          id="identityButton"
        >
          <Gravatar
            key={chipLabel}
            email={email}
            name={chipLabel}
          />
        </Button>
      )}
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
          <Grid container alignItems="center">
            <Grid item xs={canChangeUserValues ? 4 : 5} />
            <Grid item xs={1} style={{marginRight: '10px'}}>
              <Tooltip title={intl.formatMessage({ id: 'changePreferencesHeader' })}>
                <IconButton onClick={goTo('/notificationPreferences')} size="small" className={classes.chip}>
                  <PermIdentity style={{fontSize: 'medium'}} />
                </IconButton>
              </Tooltip>
            </Grid>
            {canChangeUserValues && (
              <Grid item xs={1} style={{marginRight: '10px'}}>
                <Tooltip title={intl.formatMessage({ id: 'changePasswordHeader' })}>
                  <IconButton onClick={goTo('/changePassword')} size="small" className={classes.chip}>
                    <VpnKey style={{fontSize: 'medium'}} />
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
            <Grid item xs={1}>
              <Tooltip title={intl.formatMessage({ id: 'billingMenuItem' })}>
                <IconButton onClick={goTo('/billing')} size="small" className={classes.chip}>
                  <Payment style={{fontSize: 'medium'}} />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
          {!gravatarExists && (
            <Grid container alignItems="center">
              <Grid item xs={2} />
              <Grid item xs={9}>
                <Link href="https://www.gravatar.com"
                      target="_blank"
                      underline="none"
                      style={{alignItems: 'center', display: 'flex', marginTop: '1rem'}}
                >
                  <Face style={{fontSize: 'medium', marginRight: 6}} />
                  <div>
                    {intl.formatMessage({ id: 'IdentityChangeAvatar' })}
                  </div>
                </Link>
              </Grid>
            </Grid>
          )}
          <div onClick={goTo('/support')} className={classes.listAction}
               style={{marginTop: gravatarExists ? '1rem' : undefined}}>
            <Button style={{textTransform: 'none'}}>
              <ContactSupport style={{fontSize: 'medium', marginRight: 6}} />
              {intl.formatMessage({ id: 'support' })}
            </Button>
          </div>
          <Divider />
          <div className={classes.signOut}>
            <Button
              variant="outlined"
              onClick={goTo(`/wizard#type=${SIGN_OUT_WIZARD_TYPE.toLowerCase()}`)}
              className={classes.action}
              disableRipple
              id="signoutButton"
            >
              {intl.formatMessage({ id: 'signOutButton' })}
            </Button>
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
