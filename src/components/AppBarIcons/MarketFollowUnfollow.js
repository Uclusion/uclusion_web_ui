import React from 'react';
import { connect } from 'react-redux';
import { getCurrentMarketPresence } from '../../utils/marketSelectionFunctions';
import Favorite from '@material-ui/icons/Favorite';
import FavoriteBorder from '@material-ui/icons/FavoriteBorder';
import { followUnfollowMarket } from '../../store/Markets/actions';
import PropTypes from 'prop-types';

function MarketFollowUnfollow(props) {

  const { dispatch, user, marketId } = props;
  const marketPresence = getCurrentMarketPresence(user);
  // if we don't know the market presence, just render an unfollowed version
  if (!marketPresence || marketPresence.id !== marketId) {
    return <FavoriteBorder />;
  }
  const { following } = marketPresence;

  function doFollowingToggle() {
    dispatch(followUnfollowMarket({ marketId, following }));
  }

  function getIcon() {
    const onclick = () => doFollowingToggle();
    if (following) {
      return <Favorite onClick={onclick} />;
    }
    return <FavoriteBorder onClick={onclick} />;
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

export default connect(mapStateToProps, mapDispatchToProps)(MarketFollowUnfollow);
