import React, { useContext, useState } from 'react'
import { Button, makeStyles, Menu, Typography } from '@material-ui/core'
import SettingsIcon from '@material-ui/icons/Settings'
import { useHistory } from 'react-router'
import MenuItem from '@material-ui/core/MenuItem'
import { useIntl } from 'react-intl'
import { navigate, openInNewTab } from '../../utils/marketIdPathFunctions'
import SignOut from '../../pages/Authentication/SignOut'
import { CognitoUserContext } from '../../contexts/CognitoUserContext/CongitoUserContext'
import config from '../../config'
import { isFederated } from '../../contexts/CognitoUserContext/cognitoUserContextHelper'

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
  user: {    
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  }
}));

function Identity () {
  const classes = useStyles();
  const user = useContext(CognitoUserContext);
  const canChangeUserValues = !isFederated(user);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const history = useHistory();
  const intl = useIntl();
  const chipLabel = !user ? '' : user.name;

  const recordPositionToggle = (event) => {
    if(anchorEl === null){
      setAnchorEl(event.currentTarget);
      setMenuOpen(true)
    } else {
      setAnchorEl(null)
      setMenuOpen(false)
    }
  };

  function goTo (to) {
    return () => {
      setAnchorEl(null);
      navigate(history, to);
    };
  }

  return (
    <div
      id="profileLink"
    >
      <Button
        onClick={recordPositionToggle}
        endIcon={<SettingsIcon htmlColor="#bdbdbd" />}
        className={classes.buttonClass}
      >
        <span className={classes.user}>{chipLabel}</span>
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
          <MenuItem
            onClick={goTo('/support')}
          >
            <Typography className={classes.name}>
              {intl.formatMessage({ id: 'support' })}
            </Typography>
          </MenuItem>
          <MenuItem
            onClick={goTo('/notificationPreferences')}
          >
            <Typography className={classes.name}>
              {intl.formatMessage({ id: 'changePreferencesHeader' })}
            </Typography>
          </MenuItem>
          { canChangeUserValues && (<MenuItem
            onClick={goTo('/changePassword')}
          >
            <Typography className={classes.name}>
              {intl.formatMessage({ id: 'changePasswordHeader' })}
            </Typography>
          </MenuItem>)}
        {config.payments.enabled && (
          <MenuItem
            onClick={goTo('/billing')}
          >
            <Typography className={classes.name}>
              {intl.formatMessage({ id: 'billingMenuItem' })}
            </Typography>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => openInNewTab(config.videoChannelLink)}
        >
          <Typography className={classes.name}>
            {intl.formatMessage({ id: 'helpVideos' })}
          </Typography>
        </MenuItem>
          <MenuItem>
            <SignOut/>
          </MenuItem>
      </Menu>
      </Button>
    </div>
  );
}

export default Identity;
