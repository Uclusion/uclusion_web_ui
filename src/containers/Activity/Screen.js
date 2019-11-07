import React from 'react';
import PropTypes from 'prop-types';
import { AppBar, Toolbar, Typography, Link, Breadcrumbs, Container } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import Notifications from '../../components/Notifications/Notifications';

const useStyles = makeStyles({
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
  }
});

function Screen(props) {
  const classes = useStyles();

  const { breadCrumbs, hidden, title, children } = props;

  function generateTitle() {
    if (breadCrumbs) {
      return (
        <Breadcrumbs separator=">" >
          {breadCrumbs.map((crumb, index) => {
            return (
              <Link key={index} color="inherit" href="#" onClick={crumb.onClick}>
                { crumb.image && <img src={crumb.image} alt={crumb.title} className={classes.breadCrumbImage}/> }
                { !crumb.image && crumb.title }
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
          <Notifications />
        </Toolbar>
      </AppBar>
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
  hidden: PropTypes.bool,
  title: PropTypes.string.isRequired,
};

Screen.defaultProps = {
  breadCrumbs: [],
  hidden: false,
};

export default Screen;
