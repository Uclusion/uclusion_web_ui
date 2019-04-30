import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles, IconButton } from '@material-ui/core';
import VolumeUp from '@material-ui/icons/VolumeUp';
import VolumeOffSharp from '@material-ui/icons/VolumeOffSharp';
import { getCurrentMarketPresence } from '../../utils/marketSelectionFunctions';
import { followUnfollowMarket } from '../../store/Markets/actions';

const styles = theme => ({
  root: {
    color: 'inherit',
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
    return <VolumeOffSharp className={classes.root} />;
  }
  const { following } = marketPresence;

  function doFollowingToggle() {
    dispatch(followUnfollowMarket({ marketId, following }));
  }

  function getIcon() {
    const onclick = () => doFollowingToggle();
    if (following) {
      return <IconButton className={classes.root} onClick={onclick}><VolumeUp /></IconButton>;
    }
    return <IconButton className={classes.root} onClick={onclick}><VolumeOffSharp /></IconButton>;
  }

  return getIcon();
}

MarketFollowUnfollow.propTypes = {
  dispatch: PropTypes.func.isRequired,
  user: PropTypes.object,
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
