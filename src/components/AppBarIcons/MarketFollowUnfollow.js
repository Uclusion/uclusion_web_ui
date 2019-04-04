import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import Favorite from '@material-ui/icons/Favorite';
import FavoriteBorder from '@material-ui/icons/FavoriteBorder';
import { getCurrentMarketPresence } from '../../utils/marketSelectionFunctions';
import { followUnfollowMarket } from '../../store/Markets/actions';

const styles = theme => ({
  root: {
    marginLeft: theme.spacing.unit,
  },
});

function MarketFollowUnfollow(props) {
  const {
    dispatch,
    user,
    marketId,
    classes,
  } = props;

  const marketPresence = getCurrentMarketPresence(user);
  // if we don't know the market presence, just render an unfollowed version
  if (!marketPresence || marketPresence.id !== marketId) {
    return <FavoriteBorder className={classes.root} />;
  }
  const { following } = marketPresence;

  function doFollowingToggle() {
    dispatch(followUnfollowMarket({ marketId, following }));
  }

  function getIcon() {
    const onclick = () => doFollowingToggle();
    if (following) {
      return <Favorite className={classes.root} onClick={onclick} />;
    }

    return <FavoriteBorder className={classes.root} onClick={onclick} />;
  }

  return getIcon();
}

MarketFollowUnfollow.propTypes = {
  dispatch: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
  return {}; // not used yet
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(MarketFollowUnfollow),
);
