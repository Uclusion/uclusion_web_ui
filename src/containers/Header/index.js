import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  AppBar,
  Toolbar,
  Typography,
  Link,
  Breadcrumbs,
  IconButton,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { SidebarContext } from '../../contexts/SidebarContext';
import { createTitle } from '../../utils/marketIdPathFunctions';
import { DRAWER_WIDTH } from '../../constants/global';

const useStyles = makeStyles((theme) => {
  return {
    appBar: {
      background: '#efefef',
      zIndex: theme.zIndex.drawer + 1,
      boxShadow: 'none',
      height: '67px',
    },
    breadCrumbImage: {
      height: 40,
    },
    menuButton: {
      marginLeft: '-3px',
      marginRight: theme.spacing(2),
    },
    appBarShift: {
      marginLeft: DRAWER_WIDTH,
      width: `calc(100% - ${DRAWER_WIDTH}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
  };
});

function Header(props) {
  const classes = useStyles();
  
  const { breadCrumbs, title } = props;

  const [sidebarOpen, setSidebarOpen] = useContext(SidebarContext);
  
  function generateTitle() {
    if (breadCrumbs) {
      return (
        <Breadcrumbs separator="/">
          {breadCrumbs.map((crumb, index) => (
            <Link key={index} href="#" onClick={crumb.onClick} color="inherit">
              {crumb.image && <img src={crumb.image} alt={crumb.title} className={classes.breadCrumbImage}/>}
              {!crumb.image && createTitle(crumb.title, 25)}
            </Link>
          ))}
          <Typography color="textPrimary">{createTitle(title, 25)}</Typography>
        </Breadcrumbs>
      );
    }
    return (<Typography color="textPrimary">{createTitle(title, 30)}</Typography>);
  }

  return (
    <AppBar
    position="fixed"
    className={clsx(classes.appBar, {
        [classes.appBarShift]: sidebarOpen,
    })}
    >
        <Toolbar>
            <IconButton
                aria-label="open drawer"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                edge="start"
                className={classes.menuButton}
            >
                <img src="images/Uclusion_bar.svg" alt='' />
            </IconButton>
            {generateTitle()}
        </Toolbar>
    </AppBar>
  );
}

Header.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  breadCrumbs: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.any,
};

Header.defaultProps = {
  breadCrumbs: [],
  title: '',
};

export default Header;
