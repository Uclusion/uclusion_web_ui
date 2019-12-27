import React, { useContext, useRef } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  AppBar,
  Toolbar,
  Typography,
  Link,
  Breadcrumbs,
  IconButton,
  Popper,
  Paper
} from '@material-ui/core';
import MenuOpenIcon from '@material-ui/icons/MenuOpen';
import { makeStyles } from '@material-ui/styles';
import { SidebarContext } from '../../contexts/SidebarContext';
import { createTitle } from '../../utils/marketIdPathFunctions';
import {
  DRAWER_WIDTH_CLOSED,
  DRAWER_WIDTH_OPENED
} from '../../constants/global';
import { OnlineStateContext } from '../../contexts/OnlineStateContext';

const useStyles = makeStyles(theme => {
  const BREADCRUMBS_HEIGHT = 67;
  const TOPBAR_HEIGHT = 25;
  return {
    appBar: {
      background: '#efefef',
      zIndex: theme.zIndex.drawer + 1,
      boxShadow: 'none',
      height: `${BREADCRUMBS_HEIGHT + TOPBAR_HEIGHT}px`,
    },
    appBarShift: {
      marginLeft: DRAWER_WIDTH_OPENED,
      width: `calc(100% - ${DRAWER_WIDTH_OPENED}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      })
    },
    appBarUnShift: {
      marginLeft: DRAWER_WIDTH_CLOSED,
      width: `calc(100% - ${DRAWER_WIDTH_CLOSED}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    breadcrumbs: {
      '& > .MuiBreadcrumbs-ol': {
        flexWrap: 'nowrap'
      },
      '& .MuiBreadcrumbs-li': {
        whiteSpace: 'nowrap'
      }
    },
    breadCrumbImage: {
      height: 40
    },
    menuButton: {
      marginLeft: '-3px',
      marginRight: theme.spacing(2)
    },
    menuIcon: {
      width: '30px',
      height: '25px'
    },
    topBar: {
      width: '100%',
      paddingBottom: '25px',
      background: '#DFE5E7'
    }
  };
});

function Header(props) {
  const classes = useStyles();
  const screenRef = useRef(null);
  const intl = useIntl();
  const [online] = useContext(OnlineStateContext);

  const { breadCrumbs, title, hidden, toolbarButtons } = props;

  const [sidebarOpen, setSidebarOpen] = useContext(SidebarContext);

  function generateTitle() {
    if (breadCrumbs) {
      return (
        <Breadcrumbs className={classes.breadcrumbs} separator='/'>
          {breadCrumbs.map((crumb, index) => (
            <Link key={index} href="#" onClick={crumb.onClick} color="inherit">
              {crumb.image && (
                <img
                  src={crumb.image}
                  alt={crumb.title}
                  className={classes.breadCrumbImage}
                />
              )}
              {!crumb.image && createTitle(crumb.title, 25)}
            </Link>
          ))}
          <Typography color="textPrimary">{createTitle(title, 25)}</Typography>
        </Breadcrumbs>
      );
    }
    return (
      <Typography color="textPrimary">{createTitle(title, 30)}</Typography>
    );
  }

  return (
    <React.Fragment>
      {!hidden && (
        <Popper
          className={classes.elevated}
          open={!online}
          anchorEl={screenRef.current}
          placement="top"
          modifiers={{
            flip: {
              enabled: true
            },
            preventOverflow: {
              enabled: true,
              boundariesElement: 'window',
            }
          }}
        >
          <Paper>
            <Typography>
              {intl.formatMessage({ id: 'warningOffline' })}
            </Typography>
          </Paper>
        </Popper>
      )}
      <AppBar
        className={clsx(classes.appBar, {
          [classes.appBarShift]: sidebarOpen,
          [classes.appBarUnShift]: !sidebarOpen
        })}
      >
        <div className={classes.topBar} />
        <Toolbar>
          <IconButton
            aria-label="open drawer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            edge='start'
            className={classes.menuButton}
          >
            <MenuOpenIcon className={classes.menuIcon} />
          </IconButton>
          {generateTitle()}
          {toolbarButtons}
        </Toolbar>
      </AppBar>
    </React.Fragment>
  );
}

Header.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  breadCrumbs: PropTypes.arrayOf(PropTypes.object),
  toolbarButtons: PropTypes.arrayOf(PropTypes.any),
  title: PropTypes.any,
  hidden: PropTypes.bool
};

Header.defaultProps = {
  breadCrumbs: [],
  toolbarButtons: [],
  title: '',
  hidden: false
};

export default Header;
