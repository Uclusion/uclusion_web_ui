import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withTheme } from '@material-ui/core/styles/index';
import { followUnfollowInvestible } from '../../store/MarketInvestibles/actions';
import Favorite from '@material-ui/icons/Favorite';
import FavoriteBorder from '@material-ui/icons/FavoriteBorder';

function InvestibleFollowUnfollow(props){
  const { dispatch, investible } = props;
  const { current_user_following } = investible;

  function doFollowToggle(){
    dispatch(followUnfollowInvestible({
      investible,
      stopFollowing: current_user_following,
    }));
  }

  function getProperButton(){
    if (current_user_following) {
      return <Favorite onClick={() => doFollowToggle()} />
    }
    return <FavoriteBorder onClick={() => doFollowToggle()} />
  }

  return getProperButton();
}

InvestibleFollowUnfollow.propTypes = {
  dispatch: PropTypes.func.isRequired,
  investible: PropTypes.object,
};

function mapStateToProps(state) {
  return {}; // not used yet
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme()(InvestibleFollowUnfollow)));
