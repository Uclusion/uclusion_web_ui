import React from 'react';
import PropTypes from 'prop-types';
import { AppBar, Toolbar, Typography, Link, Breadcrumbs, Container } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import Notifications from '../../components/Notifications/Notifications';

const useStyles = makeStyles((theme) => {
  return {
    // grow is used to eat up all the space until the right
    grow: {
      flexGrow: 1,
    },
    hidden: {
      display: 'none',
    },
    root: {
      display: 'flex',
      flexDirection: 'column',
    },
    appBar: {
      background: '#ffffff',
    },
    breadCrumbImage: {
      height: 40,
    },
    caption: {
      textAlign: 'center',
      height: theme.spacing(2),
      padding: theme.spacing(0.5),
      backgroundColor: theme.palette.secondary.main,
      color: 'white',
    },
  };
});

function Screen(props) {
  const classes = useStyles();

  const {
    breadCrumbs,
    hidden,
    title,
    children,
    toolbarButtons,
    banner,
  } = props;

  function generateTitle() {
    if (breadCrumbs) {
      return (
        <Breadcrumbs separator=">">
          {breadCrumbs.map((crumb, index) => {
            return (
              <Link key={index} color="inherit" href="#" onClick={crumb.onClick}>
                {crumb.image && <img src={crumb.image} alt={crumb.title} className={classes.breadCrumbImage} />}
                {!crumb.image && crumb.title}
              </Link>
            );
          })}
          <Typography color="textPrimary">{title}</Typography>
        </Breadcrumbs>
      );
    }
    return (<Typography color="textPrimary">{title}</Typography>);
  }

  return (
    <div className={hidden ? classes.hidden : classes.root}>
      <AppBar
        className={classes.appBar}
        position="fixed"
        hidden={hidden}
      >
        <Toolbar>
          {generateTitle()}
          <div className={classes.grow} />
          {toolbarButtons}
          <Notifications />
        </Toolbar>
      </AppBar>
      {banner && (
        <Typography
          variant="caption"
          className={classes.warning}
        >
          {banner}
        </Typography>
      )}
      <Toolbar />
      <Container
        maxWidth={false}
      >
        {children}
      </Container>
    </div>
  );
}

Screen.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  breadCrumbs: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  toolbarButtons: PropTypes.arrayOf(PropTypes.any),
  hidden: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  title: PropTypes.any.isRequired,
  banner: PropTypes.string,
};

Screen.defaultProps = {
  breadCrumbs: [],
  hidden: false,
  toolbarButtons: [],
  banner: undefined,
};

export default Screen;
